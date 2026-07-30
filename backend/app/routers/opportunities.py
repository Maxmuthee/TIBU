"""Opportunities Hub — Internships, jobs, and events."""

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# In-memory store for hackathon MVP
# Currently-open opportunities (refreshed July 2026). Deadlines change — always
# confirm on the official portal noted in each description before applying.
opportunities_db: list[dict] = [
    {
        "id": 1,
        "type": "internship",
        "title": "Software Engineering Internship 2026",
        "company": "Safaricom PLC",
        "description": "3-month paid internship with Safaricom's technology division in Nairobi — work on real products across mobile, cloud and data. Apply via the Safaricom careers portal.",
        "requirements": "3rd/4th-year or recent graduate in Computer Science, IT or related field",
        "deadline": "2026-09-15",
        "posted_at": "2026-07-28",
    },
    {
        "id": 2,
        "type": "internship",
        "title": "Microsoft ADC Internship Programme",
        "company": "Microsoft Africa Development Centre",
        "description": "Paid software engineering internship at Microsoft ADC Nairobi, building products used across the globe. Apply via careers.microsoft.com.",
        "requirements": "Penultimate-year student in Computer Science or Engineering; strong coding skills",
        "deadline": "2026-09-30",
        "posted_at": "2026-07-26",
    },
    {
        "id": 3,
        "type": "internship",
        "title": "Audit & Assurance Internship",
        "company": "KPMG East Africa",
        "description": "Gain hands-on experience in audit, tax and advisory during the busy season. Based in Nairobi. Apply via the KPMG East Africa careers page.",
        "requirements": "Finalist or recent graduate in Accounting, Finance or related; pursuing CPA/ACCA an advantage",
        "deadline": "2026-08-31",
        "posted_at": "2026-07-25",
    },
    {
        "id": 4,
        "type": "internship",
        "title": "Data Analytics Internship",
        "company": "Equity Bank Kenya",
        "description": "Join Equity's data & analytics team to work on dashboards, reporting and insights that drive decisions. Apply via the Equity Group careers portal.",
        "requirements": "Student or recent graduate with SQL/Excel skills; Statistics, Data Science or IT background",
        "deadline": "2026-09-05",
        "posted_at": "2026-07-24",
    },
    {
        "id": 5,
        "type": "internship",
        "title": "UN Nairobi Internship Programme",
        "company": "United Nations Office at Nairobi (UNON)",
        "description": "Internships across UN programmes and agencies in Nairobi. Rolling applications via UN Careers (careers.un.org / inspira.un.org).",
        "requirements": "Enrolled in the final year of a first degree or a graduate programme, or graduated within the last year",
        "deadline": "Rolling intake",
        "posted_at": "2026-07-20",
    },
    {
        "id": 6,
        "type": "internship",
        "title": "Digital Marketing Internship",
        "company": "EABL (Diageo)",
        "description": "Support brand and digital marketing campaigns with East Africa Breweries. Nairobi-based, 6 months. Apply via the Diageo careers site.",
        "requirements": "Marketing, Communications or Business student/graduate; social media and content skills",
        "deadline": "2026-08-22",
        "posted_at": "2026-07-22",
    },
    {
        "id": 7,
        "type": "program",
        "title": "Graduate Management Trainee Programme 2026",
        "company": "KCB Bank Kenya",
        "description": "Structured 12-month graduate trainee programme rotating across KCB business units, with mentorship and leadership training. Apply via the KCB Group careers portal.",
        "requirements": "Recent graduate (2025/2026), Second-Class Upper or higher, under 27 years",
        "deadline": "2026-09-10",
        "posted_at": "2026-07-27",
    },
    {
        "id": 8,
        "type": "program",
        "title": "Deloitte Graduate Programme 2026",
        "company": "Deloitte East Africa",
        "description": "Kick-start your career in consulting, audit, tax or risk advisory with Deloitte's structured graduate programme. Apply via careers.deloitte.com.",
        "requirements": "2026 finalist or recent graduate with strong academics and leadership potential",
        "deadline": "2026-10-01",
        "posted_at": "2026-07-21",
    },
    {
        "id": 9,
        "type": "program",
        "title": "Andela Technical Leadership Program",
        "company": "Andela",
        "description": "Remote-first programme placing top African engineers with global companies. Grow your skills and build a global career. Apply via andela.com/careers.",
        "requirements": "Graduate or self-taught engineer with strong software development skills",
        "deadline": "Rolling intake",
        "posted_at": "2026-07-18",
    },
    {
        "id": 10,
        "type": "scholarship",
        "title": "USIU-Africa Scholarships — Fall 2026",
        "company": "USIU-Africa",
        "description": "Need- and merit-based scholarships for undergraduates. The Full Scholarship covers tuition, books, computer lab fees, on-campus accommodation and meals. Apply via the USIU-Africa Financial Aid office.",
        "requirements": "Undergraduate applicant with strong academics and demonstrated financial need",
        "deadline": "2026-09-30",
        "posted_at": "2026-07-15",
    },
    {
        "id": 11,
        "type": "scholarship",
        "title": "Mastercard Foundation Scholars Program",
        "company": "Mastercard Foundation",
        "description": "Comprehensive scholarships covering tuition, accommodation, stipend and mentorship for academically talented students with financial need. Apply via partner universities and mastercardfdn.org.",
        "requirements": "Academically talented undergraduate with demonstrated financial need and leadership potential",
        "deadline": "2026-10-15",
        "posted_at": "2026-07-16",
    },
    {
        "id": 12,
        "type": "scholarship",
        "title": "Chevening Scholarships 2027/28",
        "company": "UK Government — Chevening",
        "description": "Fully funded one-year master's study in the UK, including tuition, stipend and travel. Applications open August. Apply via chevening.org.",
        "requirements": "Graduate with 2+ years work experience and leadership potential; returning to Kenya after study",
        "deadline": "2026-11-05",
        "posted_at": "2026-07-19",
    },
]

events_db: list[dict] = [
    {
        "id": 1,
        "title": "USIU-Africa Career Fair 2026",
        "category": "academic",
        "date": "2026-08-14",
        "location": "Freida Brown Student Centre",
        "description": "Meet 40+ employers recruiting interns and graduates. Bring your CV and dress smart.",
    },
    {
        "id": 2,
        "title": "Tech & Innovation Summit",
        "category": "academic",
        "date": "2026-08-21",
        "location": "Auditorium",
        "description": "Talks and demos on AI, fintech and startups from Kenya's leading technologists.",
    },
    {
        "id": 3,
        "title": "Entrepreneurship Club — Pitch Night",
        "category": "club",
        "date": "2026-08-07",
        "location": "Chandaria School of Business, LT3",
        "description": "Pitch your startup idea to peers and mentors for feedback and prizes.",
    },
    {
        "id": 4,
        "title": "CV Clinic & Interview Skills Workshop",
        "category": "workshop",
        "date": "2026-08-12",
        "location": "Lilian Beam ICT Center",
        "description": "Hands-on session with the Career Services team to sharpen your CV and interview technique.",
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
