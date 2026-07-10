"""Study Hub — Past papers upload, search, and AI-powered study tools."""

import json
import re
import hashlib
import base64

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
import io

from app.services.rag_engine import openai_client, chat_client, search_client, settings
from azure.search.documents.models import VectorizedQuery
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

router = APIRouter()

# ── Persistent paper metadata via the existing tibu-knowledge-base index ──────
# Papers are stored as regular documents with source="past_paper".
# This reuses the same index + credentials already working for chat — no new
# Azure resources or index creation required.

_PAPER_SOURCE = "past_paper"
_ZERO_VECTOR  = [0.0] * 1536   # placeholder — papers aren't retrieved via vector search


def _kb_client() -> SearchClient:
    return SearchClient(
        endpoint=settings.azure_search_endpoint,
        index_name=settings.azure_search_index_name,
        credential=AzureKeyCredential(settings.azure_search_api_key),
    )


def _load_papers(course_code: str = "") -> list[dict]:
    """Fetch all paper metadata (without file data) from the knowledge base index."""
    try:
        results = _kb_client().search(
            search_text="*",
            filter=f"source eq '{_PAPER_SOURCE}'",
            top=500,
            select=["content"],
        )
        papers = []
        for r in results:
            try:
                paper = json.loads(r["content"])
                # Strip heavy file data from listing — download endpoint serves the file
                paper.pop("file_data", None)
                papers.append(paper)
            except Exception:
                pass
        if course_code:
            papers = [p for p in papers if course_code.upper() in p.get("course_code", "").upper()]
        return papers
    except Exception as e:
        print(f"Warning: could not load papers from index: {e}")
        return []


def _get_paper_with_file(paper_id: str) -> dict | None:
    """Fetch a single paper document including its file data."""
    try:
        doc = _kb_client().get_document(key=f"paper-{paper_id}")
        return json.loads(doc["content"])
    except Exception:
        return None


def _save_paper(paper: dict) -> None:
    """Persist a paper metadata document in the knowledge base index."""
    try:
        doc = {
            "id": f"paper-{paper['id']}",
            "content": json.dumps(paper),
            "title": paper["title"],
            "source": _PAPER_SOURCE,
            "content_vector": _ZERO_VECTOR,
        }
        _kb_client().upload_documents([doc])
    except Exception as e:
        print(f"Warning: could not save paper to index: {e}")


# In-memory cache (populated at startup; stays in sync via _save_paper)
papers_db: list[dict] = _load_papers()


class PaperSearch(BaseModel):
    course_code: str = ""
    query: str = ""


class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 5
    difficulty: str = "Medium"  # Easy, Medium, Hard


class StudyAskRequest(BaseModel):
    question: str
    conversation_history: list[dict] | None = None


# ── Shared helper: retrieve relevant knowledge chunks ──

async def _retrieve_context(query: str, top_k: int = 5) -> tuple[str, list[str]]:
    """Embed a query and retrieve relevant USIU knowledge chunks via hybrid search."""
    embed_response = await openai_client.embeddings.create(
        model=settings.azure_openai_embedding_deployment,
        input=[query],
    )
    question_vector = embed_response.data[0].embedding

    search_results = await search_client.search(
        search_text=query,
        vector_queries=[
            VectorizedQuery(
                vector=question_vector,
                k_nearest_neighbors=top_k,
                fields="content_vector",
            )
        ],
        top=top_k,
        select=["content", "title", "source"],
    )

    context_chunks = []
    sources = []
    async for result in search_results:
        context_chunks.append(result["content"])
        if result.get("source"):
            sources.append(result["source"])

    context_text = "\n\n---\n\n".join(context_chunks) if context_chunks else "No relevant documents found."
    return context_text, list(set(sources))


# ═══════════════════════════════════════════════════════════════════════════
# Existing endpoints
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/papers")
async def list_papers(course_code: str = ""):
    """List all uploaded past papers, optionally filtered by course code."""
    return {"papers": _load_papers(course_code)}


@router.post("/upload")
async def upload_paper(
    file: UploadFile = File(...),
    course_code: str = Form(...),
    title: str = Form(""),
    year: str = Form(""),
):
    """Upload a past paper or study material."""
    content = await file.read()

    paper_id = hashlib.md5(f"{file.filename}:{datetime.now().isoformat()}".encode()).hexdigest()[:16]
    content_type = file.content_type or "application/octet-stream"
    paper = {
        "id": paper_id,
        "filename": file.filename,
        "course_code": course_code.upper(),
        "title": title or file.filename,
        "year": year,
        "size_bytes": len(content),
        "content_type": content_type,
        "uploaded_at": datetime.now().isoformat(),
        "file_data": base64.b64encode(content).decode("utf-8"),
    }
    # Store stripped version in memory cache (no file_data to save RAM)
    meta = {k: v for k, v in paper.items() if k != "file_data"}
    papers_db.append(meta)
    _save_paper(paper)
    return {"message": "Paper uploaded successfully!", "paper": meta}


@router.get("/papers/{paper_id}/download")
async def download_paper(paper_id: str):
    """Download a past paper file by its ID."""
    paper = _get_paper_with_file(paper_id)
    if not paper or not paper.get("file_data"):
        raise HTTPException(status_code=404, detail="Paper not found or file data unavailable.")

    file_bytes = base64.b64decode(paper["file_data"])
    content_type = paper.get("content_type", "application/octet-stream")
    filename = paper.get("filename", f"paper-{paper_id}")

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/search")
async def search_papers(search: PaperSearch):
    """Search past papers by course code or keyword."""
    results = []
    for paper in papers_db:
        if search.course_code and search.course_code.upper() in paper.get("course_code", "").upper():
            results.append(paper)
        elif search.query and search.query.lower() in paper.get("title", "").lower():
            results.append(paper)
    return {"results": results, "count": len(results)}


# ═══════════════════════════════════════════════════════════════════════════
# NEW: NotebookLLM-style Study AI endpoints
# ═══════════════════════════════════════════════════════════════════════════

QUIZ_SYSTEM_PROMPT = """You are TIBU's Quiz Generator for USIU-Africa students.

Your task:
- Generate a multiple-choice quiz based on the provided context from official USIU documents.
- Each question MUST be grounded in the provided context — do not invent facts.
- Questions should test understanding, not just rote memorisation.

You MUST respond with valid JSON and nothing else. The JSON must follow this exact schema:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["A) option", "B) option", "C) option", "D) option"],
      "correct_answer": "A",
      "explanation": "Brief explanation of why A is correct, referencing the source material"
    }
  ]
}

Rules:
- Generate exactly the number of questions requested.
- Each question must have exactly 4 options labelled A through D.
- correct_answer must be a single letter: A, B, C, or D.
- Difficulty should match the requested level (Easy = factual recall, Medium = application/understanding, Hard = analysis/comparison).
- Keep explanations concise (1-2 sentences).
- Output ONLY the JSON object — no markdown, no code fences, no extra text.
"""

STUDY_SYSTEM_PROMPT = """You are TIBU's Study Tutor for USIU-Africa students.

Your role:
- Help students understand USIU concepts, courses, policies, and academic material.
- Always base answers on the provided context from official university documents.
- Explain concepts step by step — you're a tutor, not just a search engine.
- Use examples relevant to USIU-Africa when possible.
- If the context doesn't have enough information, say so honestly.
- Encourage the student and offer to explain further.

Teaching approach:
1. Answer the question directly first.
2. Provide a clear explanation with relevant details from the context.
3. If helpful, break down complex topics into simpler parts.
4. Cite the source document when referencing specific facts.
"""


@router.post("/generate-quiz")
async def generate_quiz(req: QuizRequest):
    """Generate a multiple-choice quiz from the USIU knowledge base."""
    # Step 1: Retrieve relevant context
    context_text, sources = await _retrieve_context(req.topic, top_k=8)

    # Step 2: Build LLM prompt
    messages = [
        {"role": "system", "content": QUIZ_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Context from USIU-Africa documents:\n{context_text}\n\n---\n\n"
                f"Generate exactly {req.num_questions} multiple-choice questions about: {req.topic}\n"
                f"Difficulty level: {req.difficulty}"
            ),
        },
    ]

    # Step 3: Call Azure OpenAI
    response = await chat_client.chat.completions.create(
        model=settings.azure_chat_deployment,
        messages=messages,
        temperature=0.4,
        max_tokens=2500,
    )

    raw = response.choices[0].message.content.strip()

    # Step 4: Parse the JSON response (strip code fences if present)
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        quiz_data = json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "questions": [],
            "sources": sources,
            "error": "Failed to parse quiz. Please try again.",
        }

    return {
        "questions": quiz_data.get("questions", []),
        "sources": sources,
    }


@router.post("/study-ask")
async def study_ask(req: StudyAskRequest):
    """Answer a study question using the USIU knowledge base with a tutor persona."""
    # Step 1: Retrieve relevant context
    context_text, sources = await _retrieve_context(req.question, top_k=5)

    # Step 2: Build messages
    messages = [{"role": "system", "content": STUDY_SYSTEM_PROMPT}]

    if req.conversation_history:
        messages.extend(req.conversation_history[-6:])  # Last 3 exchanges

    messages.append(
        {
            "role": "user",
            "content": f"Context from USIU-Africa documents:\n{context_text}\n\n---\n\nStudent question: {req.question}",
        }
    )

    # Step 3: Get LLM response
    response = await chat_client.chat.completions.create(
        model=settings.azure_chat_deployment,
        messages=messages,
        temperature=0.3,
        max_tokens=1200,
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": list(set(sources)),
    }
