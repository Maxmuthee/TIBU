"""Admin API — password-protected management endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.config import get_settings
from app.routers.lost_found import items_db as lost_found_db
from app.routers.opportunities import opportunities_db, events_db
from app.routers.study_hub import load_papers, delete_paper

router = APIRouter()
security = HTTPBearer()


def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    settings = get_settings()
    if credentials.credentials != settings.admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin password.")
    return True


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    password: str


@router.post("/login")
async def admin_login(req: LoginRequest):
    settings = get_settings()
    if req.password != settings.admin_password:
        raise HTTPException(status_code=401, detail="Invalid password.")
    return {"ok": True, "token": req.password}


# ── Papers ────────────────────────────────────────────────────────────────────

@router.get("/papers", dependencies=[Depends(verify_admin)])
async def admin_list_papers():
    return {"papers": await load_papers()}


@router.delete("/papers/{paper_id}", dependencies=[Depends(verify_admin)])
async def admin_delete_paper(paper_id: str):
    try:
        await delete_paper(paper_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"message": "Deleted."}


# ── Lost & Found ──────────────────────────────────────────────────────────────

@router.get("/lost-found", dependencies=[Depends(verify_admin)])
async def admin_list_lost_found():
    return {"items": lost_found_db}


@router.delete("/lost-found/{item_id}", dependencies=[Depends(verify_admin)])
async def admin_delete_lost_found(item_id: int):
    global lost_found_db
    before = len(lost_found_db)
    lost_found_db[:] = [i for i in lost_found_db if i["id"] != item_id]
    if len(lost_found_db) == before:
        raise HTTPException(status_code=404, detail="Item not found.")
    return {"message": "Deleted."}


# ── Opportunities ─────────────────────────────────────────────────────────────

@router.get("/opportunities", dependencies=[Depends(verify_admin)])
async def admin_list_opportunities():
    return {"opportunities": opportunities_db, "events": events_db}


@router.delete("/opportunities/{opp_id}", dependencies=[Depends(verify_admin)])
async def admin_delete_opportunity(opp_id: int):
    before = len(opportunities_db)
    opportunities_db[:] = [o for o in opportunities_db if o["id"] != opp_id]
    if len(opportunities_db) == before:
        raise HTTPException(status_code=404, detail="Opportunity not found.")
    return {"message": "Deleted."}


@router.delete("/events/{event_id}", dependencies=[Depends(verify_admin)])
async def admin_delete_event(event_id: int):
    before = len(events_db)
    events_db[:] = [e for e in events_db if e["id"] != event_id]
    if len(events_db) == before:
        raise HTTPException(status_code=404, detail="Event not found.")
    return {"message": "Deleted."}


class OpportunityCreate(BaseModel):
    type: str = "internship"
    title: str
    company: str
    description: str
    requirements: str = ""
    deadline: str = ""


class EventCreate(BaseModel):
    title: str
    category: str
    date: str
    location: str
    description: str


@router.post("/opportunities", dependencies=[Depends(verify_admin)])
async def admin_create_opportunity(opp: OpportunityCreate):
    from datetime import datetime
    new_opp = {
        "id": max((o["id"] for o in opportunities_db), default=0) + 1,
        **opp.model_dump(),
        "posted_at": datetime.now().isoformat(),
    }
    opportunities_db.append(new_opp)
    return {"message": "Created.", "opportunity": new_opp}


@router.post("/events", dependencies=[Depends(verify_admin)])
async def admin_create_event(evt: EventCreate):
    new_evt = {
        "id": max((e["id"] for e in events_db), default=0) + 1,
        **evt.model_dump(),
    }
    events_db.append(new_evt)
    return {"message": "Created.", "event": new_evt}
