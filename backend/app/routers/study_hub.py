"""Study Hub — Past papers upload, listing, search, and download.

Primary storage is Supabase: the file goes to a Storage bucket and its metadata
to a `past_papers` Postgres table (accessed via Supabase's REST API). If Supabase
is not configured, everything falls back to the legacy path that stores the file
base64-encoded inside the Azure AI Search index — so the app keeps working either
way.
"""

import io
import json
import base64
import hashlib
from datetime import datetime

import httpx
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse, RedirectResponse
from pydantic import BaseModel

from app.services.rag_engine import settings
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

router = APIRouter()

# ═══════════════════════════════════════════════════════════════════════════
# Supabase storage (primary)
# ═══════════════════════════════════════════════════════════════════════════
_SB_URL = settings.supabase_url.rstrip("/")
_SB_KEY = settings.supabase_service_key
_SB_BUCKET = settings.supabase_bucket


def _supabase_enabled() -> bool:
    return bool(_SB_URL and _SB_KEY)


def _sb_headers(extra: dict | None = None) -> dict:
    h = {"apikey": _SB_KEY, "Authorization": f"Bearer {_SB_KEY}"}
    if extra:
        h.update(extra)
    return h


async def _sb_upload_file(paper_id: str, filename: str, content: bytes, content_type: str) -> tuple[str, str]:
    """Upload bytes to the Storage bucket; return (storage_path, public_url)."""
    path = f"{paper_id}/{filename}"
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{_SB_URL}/storage/v1/object/{_SB_BUCKET}/{path}",
            headers=_sb_headers({"Content-Type": content_type, "x-upsert": "true"}),
            content=content,
        )
        resp.raise_for_status()
    public_url = f"{_SB_URL}/storage/v1/object/public/{_SB_BUCKET}/{path}"
    return path, public_url


async def _sb_insert_meta(meta: dict) -> None:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            f"{_SB_URL}/rest/v1/past_papers",
            headers=_sb_headers({"Content-Type": "application/json", "Prefer": "return=minimal"}),
            json=meta,
        )
        resp.raise_for_status()


async def _sb_list(course_code: str = "") -> list[dict]:
    params = {"select": "*", "order": "uploaded_at.desc"}
    if course_code:
        params["course_code"] = f"ilike.*{course_code.upper()}*"
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            f"{_SB_URL}/rest/v1/past_papers", headers=_sb_headers(), params=params
        )
        resp.raise_for_status()
        return resp.json()


async def _sb_get(paper_id: str) -> dict | None:
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            f"{_SB_URL}/rest/v1/past_papers",
            headers=_sb_headers(),
            params={"select": "*", "id": f"eq.{paper_id}", "limit": 1},
        )
        resp.raise_for_status()
        rows = resp.json()
        return rows[0] if rows else None


# ═══════════════════════════════════════════════════════════════════════════
# Azure AI Search index (legacy fallback)
# ═══════════════════════════════════════════════════════════════════════════
_PAPER_SOURCE = "past_paper"
_ZERO_VECTOR = [0.0] * 1536  # placeholder — papers aren't retrieved via vector search


def _kb_client() -> SearchClient:
    return SearchClient(
        endpoint=settings.azure_search_endpoint,
        index_name=settings.azure_search_index_name,
        credential=AzureKeyCredential(settings.azure_search_api_key),
    )


def _kb_load_papers(course_code: str = "") -> list[dict]:
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
                paper.pop("file_data", None)  # strip heavy file data from listing
                papers.append(paper)
            except Exception:
                pass
        if course_code:
            papers = [p for p in papers if course_code.upper() in p.get("course_code", "").upper()]
        return papers
    except Exception as e:
        print(f"Warning: could not load papers from index: {e}")
        return []


def _kb_get_paper_with_file(paper_id: str) -> dict | None:
    try:
        doc = _kb_client().get_document(key=f"paper-{paper_id}")
        return json.loads(doc["content"])
    except Exception:
        return None


def _kb_save_paper(paper: dict) -> None:
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


class PaperSearch(BaseModel):
    course_code: str = ""
    query: str = ""


# ═══════════════════════════════════════════════════════════════════════════
# Reusable helpers (shared with the admin router)
# ═══════════════════════════════════════════════════════════════════════════
async def load_papers(course_code: str = "") -> list[dict]:
    """List papers from Supabase if configured, else the Azure Search index."""
    if _supabase_enabled():
        try:
            return await _sb_list(course_code)
        except Exception as e:
            print(f"Supabase list failed, falling back to index: {e}")
    return _kb_load_papers(course_code)


async def delete_paper(paper_id: str) -> None:
    """Delete a paper (file + metadata) from whichever backend holds it."""
    if _supabase_enabled():
        try:
            row = await _sb_get(paper_id)
            async with httpx.AsyncClient(timeout=20) as client:
                if row and row.get("filename"):
                    path = f"{paper_id}/{row['filename']}"
                    await client.delete(
                        f"{_SB_URL}/storage/v1/object/{_SB_BUCKET}/{path}", headers=_sb_headers()
                    )
                await client.delete(
                    f"{_SB_URL}/rest/v1/past_papers",
                    headers=_sb_headers(),
                    params={"id": f"eq.{paper_id}"},
                )
            return
        except Exception as e:
            print(f"Supabase delete failed, falling back to index: {e}")
    _kb_client().delete_documents([{"id": f"paper-{paper_id}"}])


# ═══════════════════════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════════════════════
@router.get("/papers")
async def list_papers(course_code: str = ""):
    """List all uploaded past papers, optionally filtered by course code."""
    return {"papers": await load_papers(course_code)}


@router.post("/upload")
async def upload_paper(
    file: UploadFile = File(...),
    course_code: str = Form(...),
    title: str = Form(""),
    year: str = Form(""),
):
    """Upload a past paper. Stores the file in Supabase (or the Azure index)."""
    content = await file.read()
    paper_id = hashlib.md5(f"{file.filename}:{datetime.now().isoformat()}".encode()).hexdigest()[:16]
    content_type = file.content_type or "application/octet-stream"

    meta = {
        "id": paper_id,
        "filename": file.filename,
        "course_code": course_code.upper(),
        "title": title or file.filename,
        "year": year,
        "size_bytes": len(content),
        "content_type": content_type,
        "uploaded_at": datetime.now().isoformat(),
    }

    if _supabase_enabled():
        try:
            _, public_url = await _sb_upload_file(paper_id, file.filename, content, content_type)
            meta["public_url"] = public_url
            await _sb_insert_meta(meta)
            return {"message": "Paper uploaded successfully!", "paper": meta}
        except Exception as e:
            print(f"Supabase upload failed, falling back to index: {e}")

    # Fallback: base64 into the Azure Search index
    paper = {**meta, "file_data": base64.b64encode(content).decode("utf-8")}
    _kb_save_paper(paper)
    return {"message": "Paper uploaded successfully!", "paper": meta}


@router.get("/papers/{paper_id}/download")
async def download_paper(paper_id: str):
    """Download a past paper by its ID."""
    if _supabase_enabled():
        try:
            row = await _sb_get(paper_id)
            if row and row.get("public_url"):
                # Bucket is public — hand the browser the direct storage URL.
                return RedirectResponse(row["public_url"])
        except Exception as e:
            print(f"Supabase download lookup failed, falling back to index: {e}")

    paper = _kb_get_paper_with_file(paper_id)
    if not paper or not paper.get("file_data"):
        raise HTTPException(status_code=404, detail="Paper not found or file data unavailable.")

    file_bytes = base64.b64decode(paper["file_data"])
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=paper.get("content_type", "application/octet-stream"),
        headers={"Content-Disposition": f'attachment; filename="{paper.get("filename", f"paper-{paper_id}")}"'},
    )


@router.post("/search")
async def search_papers(search: PaperSearch):
    """Search past papers by course code or keyword."""
    papers = await _sb_list(search.course_code) if _supabase_enabled() else _kb_load_papers(search.course_code)
    if search.query:
        q = search.query.lower()
        papers = [p for p in papers if q in p.get("title", "").lower()]
    return {"results": papers, "count": len(papers)}
