"""Opportunities Hub — Internships, jobs, and events."""

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# In-memory store for hackathon MVP
# Currently-open opportunities (verified June 2026). Deadlines change — always
# confirm on the official portal noted in each description before applying.
opportunities_db: list[dict] = [
    {
        "id": 1,
        "type": "internship",
        "title": "Graduate Recruitment Programme 2026",
        "company": "RSM Eastern Africa",
        "description": "3–6 month graduate/intern programme in audit, tax and consulting, based in Nairobi. Apply via the RSM Eastern Africa careers page.",
        "requirements": "Recent graduate or finalist in a relevant field",
        "deadline": "2026-07-31",
        "posted_at": "2026-06-30",
    },
    {
        "id": 2,
        "type": "internship",
        "title": "UNON Internship Programme",
        "company": "United Nations Office at Nairobi",
        "description": "Internships across UN programmes in Nairobi. Rolling applications via UN Careers (inspira.un.org).",
        "requirements": "Enrolled in the final year of a first degree or a graduate programme, or graduated within the last year",
        "deadline": "Rolling intake",
        "posted_at": "2026-06-30",
    },
    {
        "id": 3,
        "type": "program",
        "title": "Management Trainee Programme 2026",
        "company": "KCB Bank Kenya",
        "description": "Structured graduate trainee programme rotating across KCB business units. Apply via the KCB Group careers portal.",
        "requirements": "Recent graduate with a strong academic record",
        "deadline": "2026-07-03",
        "posted_at": "2026-06-30",
    },
    {
        "id": 4,
        "type": "program",
        "title": "Future Leaders Programme 2026",
        "company": "Centum Real Estate",
        "description": "Graduate development programme. Apply via the Centum RE careers portal.",
        "requirements": "2025 graduate or 2026 finalist, Second-Class Upper Division or higher",
        "deadline": "2026-07-03",
        "posted_at": "2026-06-30",
    },
    {
        "id": 5,
        "type": "scholarship",
        "title": "USIU-Africa Scholarships 2026",
        "company": "USIU-Africa",
        "description": "Need- and merit-based scholarships for first-time undergraduates. The Full Scholarship covers tuition, books, computer lab fees, on-campus accommodation and meals. Apply via the USIU-Africa Financial Aid office.",
        "requirements": "First-time undergraduate applicant who completed KCSE or A-Levels in 2025, with demonstrated financial need",
        "deadline": "2026-07-15",
        "posted_at": "2026-06-30",
    },
    {
        "id": 6,
        "type": "scholarship",
        "title": "Rhodes Scholarship for Kenya",
        "company": "Rhodes Trust — University of Oxford",
        "description": "Fully funded postgraduate study at the University of Oxford. Apply via the Rhodes House Kenya constituency page.",
        "requirements": "Postgraduate applicant; see Rhodes Kenya eligibility (age, degree, citizenship/residency)",
        "deadline": "2026-08-27",
        "posted_at": "2026-06-30",
    },
]

events_db: list[dict] = [
    {
        "id": 1,
        "title": "USIU-Africa Innovation Challenge Hackathon",
        "category": "academic",
        "date": "2026-03-12",
        "location": "SHSS Rooftop",
        "description": "72-hour hackathon — build solutions for campus and community.",
    },
    {
        "id": 2,
        "title": "Entrepreneurship Club Meeting",
        "category": "club",
        "date": "2026-03-11",
        "location": "CSOB LT3",
        "description": "Weekly meeting — this week: pitching your startup idea.",
    },
]


class OpportunityCreate(BaseModel):
    type: str = "internship"
    title: str
    company: str
    description: str
    requirements: str = ""
    deadline: str = ""


@router.get("/internships")
async def list_internships():
    """List all opportunities (internships, jobs, programmes, scholarships)."""
    return {"opportunities": [o for o in opportunities_db if o["type"] != "event"]}


@router.get("/events")
async def list_events(category: str = ""):
    """List campus events, optionally filtered by category."""
    if category:
        filtered = [e for e in events_db if e.get("category") == category]
        return {"events": filtered}
    return {"events": events_db}


@router.post("/create")
async def create_opportunity(opp: OpportunityCreate):
    """Post a new internship, job, or event."""
    new_opp = {
        "id": len(opportunities_db) + 1,
        **opp.model_dump(),
        "posted_at": datetime.now().isoformat(),
    }
    opportunities_db.append(new_opp)
    return {"message": "Opportunity posted!", "opportunity": new_opp}
