"""Seed the database with initial opportunities and events data.

Only seeds if the respective tables are empty.
"""

from .database import SessionLocal
from .models import Opportunity, Event


OPPORTUNITIES_SEED = [
    {
        "type": "Internship",
        "title": "Software Engineering Intern",
        "company": "Safaricom PLC",
        "description": (
            "Join Safaricom's engineering team for a 3-month paid internship. "
            "Work on mobile money (M-PESA) platform features and internal tooling. "
            "Hybrid role based in Westlands, Nairobi."
        ),
        "requirements": "3rd or 4th year CS / IT student, Python or Java, Git",
        "deadline": "2026-04-30",
    },
    {
        "type": "Internship",
        "title": "Data Analytics Intern",
        "company": "KCB Group",
        "description": (
            "Support the Business Intelligence team with dashboards, reporting "
            "and data pipelines. Exposure to SQL, Power BI and cloud data tools. "
            "3-month internship at KCB Towers, Upper Hill."
        ),
        "requirements": "Business, Finance, or CS major; SQL knowledge preferred",
        "deadline": "2026-05-15",
    },
    {
        "type": "Graduate Trainee",
        "title": "Finance Graduate Trainee Programme",
        "company": "Equity Bank Kenya",
        "description": (
            "Competitive 12-month rotational programme covering retail banking, "
            "treasury, and credit risk. Structured mentorship and leadership training. "
            "Full-time, Nairobi."
        ),
        "requirements": "Finance, Economics or Accounting degree, min GPA 3.0",
        "deadline": "2026-06-01",
    },
    {
        "type": "Internship",
        "title": "Marketing & Communications Intern",
        "company": "Nation Media Group",
        "description": (
            "Assist the digital marketing team with content creation, social media "
            "scheduling and campaign analytics. Learn real-world brand strategy. "
            "Based at Nation Centre, Nairobi."
        ),
        "requirements": "Journalism, Marketing or Media Studies student, strong writing skills",
        "deadline": "2026-04-25",
    },
    {
        "type": "Internship",
        "title": "Cybersecurity Analyst Intern",
        "company": "Serianu Limited",
        "description": (
            "Work alongside senior analysts on threat monitoring, vulnerability assessments "
            "and incident response. Gain hands-on SOC experience. 3-month paid internship."
        ),
        "requirements": "IT or CS student, networking fundamentals, CompTIA Security+ a plus",
        "deadline": "2026-05-05",
    },
    {
        "type": "Part-time Job",
        "title": "Research Assistant — Governance & Policy",
        "company": "USIU-Africa Institute for Diplomacy",
        "description": (
            "Assist faculty researchers with literature reviews, data collection and "
            "policy brief drafts. Flexible hours (10–15 hrs/week), on campus."
        ),
        "requirements": "International Relations or Law student, strong academic record",
        "deadline": "2026-04-20",
    },
    {
        "type": "Internship",
        "title": "UX / Product Design Intern",
        "company": "Cellulant Corporation",
        "description": (
            "Contribute to user research, wireframing and usability testing for "
            "fintech products used across 18 African markets. Figma-heavy role. "
            "3 months, hybrid."
        ),
        "requirements": "IT, CS or Art/Design student, Figma or Adobe XD experience",
        "deadline": "2026-05-20",
    },
]


EVENTS_SEED = [
    {
        "title": "USIU-Africa Career Fair 2026",
        "description": (
            "The annual on-campus career fair. Meet 60+ employers from tech, finance, "
            "NGO and government sectors. Bring copies of your CV and dress professionally."
        ),
        "date": "2026-05-07",
        "location": "USIU Sports Centre & Adjacent Grounds",
        "category": "Career",
    },
    {
        "title": "AI & the Future of Work — Public Lecture",
        "description": (
            "Distinguished lecture by Dr. Bright Simons (mPedigree, Ghana) on how "
            "generative AI is reshaping labour markets in Africa. Open to all students "
            "and staff. Light refreshments provided."
        ),
        "date": "2026-04-22",
        "location": "Chandaria Auditorium",
        "category": "Academic",
    },
    {
        "title": "USIU Hackathon — BuildForAfrica 2026",
        "description": (
            "48-hour hackathon challenging teams of 2–4 to build tech solutions for "
            "healthcare, agriculture or education in Africa. Prizes worth KES 500,000. "
            "Register teams of up to 4 members."
        ),
        "date": "2026-05-16",
        "location": "Innovation Hub & CS Labs, Block F",
        "category": "Tech",
    },
    {
        "title": "Mental Health Awareness Week — Opening Symposium",
        "description": (
            "Kick-off event for USIU Mental Health Awareness Week. Panel of counsellors, "
            "alumni and students sharing lived experiences. Free access to counselling "
            "resources all week."
        ),
        "date": "2026-04-28",
        "location": "Senate Chamber, Admin Block",
        "category": "Wellness",
    },
    {
        "title": "Entrepreneurship Bootcamp — Spring 2026",
        "description": (
            "Intensive 2-day bootcamp co-organised with Nairobi Garage. Covers lean "
            "startup methodology, pitching and finding your first customer. "
            "Limited to 60 students — first come, first served."
        ),
        "date": "2026-05-23",
        "location": "iHub @ USIU, Block D",
        "category": "Business",
    },
]


def seed_db():
    """Insert seed data only if tables are empty."""
    db = SessionLocal()
    try:
        if db.query(Opportunity).count() == 0:
            for opp_data in OPPORTUNITIES_SEED:
                db.add(Opportunity(**opp_data))
            db.commit()
            print(f"[seed] Inserted {len(OPPORTUNITIES_SEED)} opportunities.")
        else:
            print("[seed] Opportunities table already has data — skipping.")

        if db.query(Event).count() == 0:
            for evt_data in EVENTS_SEED:
                db.add(Event(**evt_data))
            db.commit()
            print(f"[seed] Inserted {len(EVENTS_SEED)} events.")
        else:
            print("[seed] Events table already has data — skipping.")
    finally:
        db.close()
