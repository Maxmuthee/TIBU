"""Study Hub — Past papers upload, listing, search, and download."""

import json
import hashlib
import base64
import io

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime

from app.services.rag_engine import settings
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
