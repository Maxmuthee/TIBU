"""Microcredentials Hub — Browse and get AI-recommended industry-relevant micro-courses."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.rag_engine import ask_tibu

router = APIRouter()

# ---------------------------------------------------------------------------
# Catalog data — industry-relevant microcredential courses
# ---------------------------------------------------------------------------

CATALOG = [
    # ── Technology ──────────────────────────────────────────────────────────
    {
        "id": "mc-001",
        "title": "Python for Everybody",
        "provider": "University of Michigan",
        "platform": "Coursera",
        "field": "Technology",
        "level": "Beginner",
        "duration": "8 weeks",
        "skills": ["Python", "Data Structures", "Web Scraping", "Databases"],
        "description": "Master Python programming from the ground up. Covers variables, functions, data structures, and working with data — ideal for CS and Engineering students.",
        "certificate": True,
    },
    {
        "id": "mc-002",
        "title": "Google Data Analytics Certificate",
        "provider": "Google",
        "platform": "Coursera",
        "field": "Technology",
        "level": "Beginner",
        "duration": "6 months",
        "skills": ["SQL", "Tableau", "Spreadsheets", "Data Cleaning", "R"],
        "description": "Learn data analysis end-to-end: ask the right questions, clean data, analyze it, and communicate findings. Highly valued by Kenyan employers.",
        "certificate": True,
    },
    {
        "id": "mc-003",
        "title": "IBM Cybersecurity Analyst",
        "provider": "IBM",
        "platform": "Coursera",
        "field": "Technology",
        "level": "Intermediate",
        "duration": "8 months",
        "skills": ["Network Security", "Threat Intelligence", "SIEM", "Incident Response"],
        "description": "Become job-ready in cybersecurity. Covers threat analysis, vulnerability assessment, and security operations — one of the fastest-growing fields in Africa.",
        "certificate": True,
    },
    {
        "id": "mc-004",
        "title": "AWS Cloud Practitioner Essentials",
        "provider": "Amazon Web Services",
        "platform": "AWS Training",
        "field": "Technology",
        "level": "Beginner",
        "duration": "6 hours",
        "skills": ["Cloud Computing", "AWS Services", "Security", "Pricing"],
        "description": "Foundational cloud literacy certification from AWS. Prepares you for the AWS Certified Cloud Practitioner exam — a globally recognised credential.",
        "certificate": True,
    },
    {
        "id": "mc-005",
        "title": "Deep Learning Specialization",
        "provider": "DeepLearning.AI",
        "platform": "Coursera",
        "field": "Technology",
        "level": "Advanced",
        "duration": "5 months",
        "skills": ["Neural Networks", "TensorFlow", "Computer Vision", "NLP"],
        "description": "Build and train deep neural networks taught by Andrew Ng. Essential for students pursuing AI, Machine Learning, or Data Science careers.",
        "certificate": True,
    },
    {
        "id": "mc-006",
        "title": "Microsoft Azure Fundamentals (AZ-900)",
        "provider": "Microsoft",
        "platform": "Microsoft Learn",
        "field": "Technology",
        "level": "Beginner",
        "duration": "10 hours",
        "skills": ["Azure", "Cloud Services", "Networking", "Storage"],
        "description": "Free Microsoft certification prep covering core Azure cloud concepts. Perfect complement to USIU's Computer Science or IT programmes.",
        "certificate": True,
    },
    {
        "id": "mc-007",
        "title": "Full-Stack Web Development Bootcamp",
        "provider": "The App Brewery",
        "platform": "Udemy",
        "field": "Technology",
        "level": "Intermediate",
        "duration": "12 weeks",
        "skills": ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB"],
        "description": "Build real web applications from scratch. Covers the complete modern web stack — ideal for students wanting to build freelance or startup projects.",
        "certificate": True,
    },
    # ── Business & Finance ───────────────────────────────────────────────────
    {
        "id": "mc-008",
        "title": "Google Digital Marketing & E-commerce Certificate",
        "provider": "Google",
        "platform": "Coursera",
        "field": "Business",
        "level": "Beginner",
        "duration": "6 months",
        "skills": ["SEO", "SEM", "Email Marketing", "Social Media", "Analytics"],
        "description": "Learn digital marketing and e-commerce from Google. Covers how to attract customers online, run campaigns, and measure results — directly applicable to Kenyan SMEs.",
        "certificate": True,
    },
    {
        "id": "mc-009",
        "title": "Financial Markets",
        "provider": "Yale University",
        "platform": "Coursera",
        "field": "Business",
        "level": "Beginner",
        "duration": "7 weeks",
        "skills": ["Investments", "Risk Management", "Derivatives", "Behavioral Finance"],
        "description": "Robert Shiller's famous Yale course on financial markets, risk, and behavioural finance. Perfect for Finance and Economics students.",
        "certificate": True,
    },
    {
        "id": "mc-010",
        "title": "Project Management Professional (PMP) Prep",
        "provider": "PMI",
        "platform": "edX",
        "field": "Business",
        "level": "Intermediate",
        "duration": "3 months",
        "skills": ["Agile", "Scrum", "Risk Management", "Budgeting", "Stakeholder Management"],
        "description": "Prepare for one of the most valued management certifications globally. Recognised by every major employer in Kenya and internationally.",
        "certificate": True,
    },
    {
        "id": "mc-011",
        "title": "Entrepreneurship Specialization",
        "provider": "Wharton School",
        "platform": "Coursera",
        "field": "Business",
        "level": "Intermediate",
        "duration": "4 months",
        "skills": ["Business Model", "Fundraising", "Growth Strategy", "Launch Planning"],
        "description": "Learn to develop, pitch, and launch a new venture from Wharton. Covers ideation to funding — ideal for aspiring USIU entrepreneurs.",
        "certificate": True,
    },
    {
        "id": "mc-012",
        "title": "Excel Skills for Business",
        "provider": "Macquarie University",
        "platform": "Coursera",
        "field": "Business",
        "level": "Beginner",
        "duration": "4 months",
        "skills": ["Excel", "Data Analysis", "Dashboards", "Financial Modelling"],
        "description": "Master Excel from basics to advanced analytics and automation. One of the most universally requested skills by Kenyan recruiters across all industries.",
        "certificate": True,
    },
    # ── Media & Communication ────────────────────────────────────────────────
    {
        "id": "mc-013",
        "title": "Graphic Design Specialization",
        "provider": "California Institute of the Arts",
        "platform": "Coursera",
        "field": "Creative",
        "level": "Beginner",
        "duration": "6 months",
        "skills": ["Typography", "Composition", "Branding", "Adobe Illustrator", "InDesign"],
        "description": "Build professional design skills from the ground up. Covers visual principles and industry-standard tools used in marketing, publishing, and media.",
        "certificate": True,
    },
    {
        "id": "mc-014",
        "title": "Introduction to UI/UX Design",
        "provider": "Google",
        "platform": "Coursera",
        "field": "Creative",
        "level": "Beginner",
        "duration": "7 months",
        "skills": ["Figma", "User Research", "Wireframing", "Prototyping", "Usability Testing"],
        "description": "Google's UX Design Certificate — learn to design apps and websites that people love to use. One of the most in-demand skills in Kenya's growing tech sector.",
        "certificate": True,
    },
    {
        "id": "mc-015",
        "title": "Social Media Marketing Masterclass",
        "provider": "Meta",
        "platform": "Coursera",
        "field": "Creative",
        "level": "Beginner",
        "duration": "7 months",
        "skills": ["Facebook Ads", "Instagram", "Content Strategy", "Analytics", "Campaign Management"],
        "description": "Meta's official marketing certificate. Learn to create and run effective paid campaigns on the world's largest social platforms.",
        "certificate": True,
    },
    # ── Health & Life Sciences ───────────────────────────────────────────────
    {
        "id": "mc-016",
        "title": "Health Informatics Specialization",
        "provider": "Johns Hopkins University",
        "platform": "Coursera",
        "field": "Health",
        "level": "Intermediate",
        "duration": "5 months",
        "skills": ["EHR Systems", "Health Data", "Clinical Workflows", "Public Health IT"],
        "description": "Bridge healthcare and technology. Covers digital health records, health data analysis, and informatics tools — high demand in Kenya's evolving health sector.",
        "certificate": True,
    },
    {
        "id": "mc-017",
        "title": "Mental Health and Wellbeing",
        "provider": "University of Melbourne",
        "platform": "Coursera",
        "field": "Health",
        "level": "Beginner",
        "duration": "4 weeks",
        "skills": ["Psychological First Aid", "Stress Management", "Resilience", "Mindfulness"],
        "description": "Evidence-based strategies for understanding and improving mental wellbeing. Relevant to all students and future professionals who work with people.",
        "certificate": True,
    },
    # ── Law & Governance ─────────────────────────────────────────────────────
    {
        "id": "mc-018",
        "title": "Introduction to International Law",
        "provider": "University of Amsterdam",
        "platform": "Coursera",
        "field": "Law",
        "level": "Beginner",
        "duration": "6 weeks",
        "skills": ["International Treaties", "Human Rights Law", "UN System", "Dispute Resolution"],
        "description": "Explore international law, human rights, and global governance. Valuable for Law, IR, and Political Science students aiming for NGO or diplomatic careers.",
        "certificate": True,
    },
    {
        "id": "mc-019",
        "title": "Data Privacy Fundamentals",
        "provider": "IBM",
        "platform": "edX",
        "field": "Law",
        "level": "Beginner",
        "duration": "3 weeks",
        "skills": ["GDPR", "Data Ethics", "Privacy by Design", "Compliance"],
        "description": "Understand data privacy regulations and ethical data handling. Essential for any student entering tech, business, or public policy in the digital age.",
        "certificate": True,
    },
    # ── Sustainability & Environment ─────────────────────────────────────────
    {
        "id": "mc-020",
        "title": "Sustainability and Development",
        "provider": "University of Michigan",
        "platform": "Coursera",
        "field": "Environment",
        "level": "Beginner",
        "duration": "10 weeks",
        "skills": ["SDGs", "Environmental Policy", "Green Economy", "Climate Change"],
        "description": "Understand the relationship between human development and environmental sustainability. Directly aligned with Kenya's Vision 2030 and the SDGs.",
        "certificate": True,
    },
]

FIELDS = sorted(set(c["field"] for c in CATALOG))
LEVELS = ["Beginner", "Intermediate", "Advanced"]


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class RecommendRequest(BaseModel):
    major: str
    interests: list[str] = []
    career_goal: str = ""


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/catalog")
async def get_catalog(field: str = "", level: str = "", search: str = ""):
    """Return the full microcredential catalog, optionally filtered."""
    results = CATALOG
    if field:
        results = [c for c in results if c["field"].lower() == field.lower()]
    if level:
        results = [c for c in results if c["level"].lower() == level.lower()]
    if search:
        q = search.lower()
        results = [
            c for c in results
            if q in c["title"].lower() or q in c["description"].lower()
            or any(q in s.lower() for s in c["skills"])
        ]
    return {"courses": results, "total": len(results), "fields": FIELDS, "levels": LEVELS}


@router.post("/recommend")
async def recommend_microcredentials(request: RecommendRequest):
    """AI-powered microcredential recommendations based on a student's academic profile."""
    catalog_summary = "\n".join(
        f"- [{c['id']}] {c['title']} ({c['platform']}, {c['level']}, {c['field']}): {', '.join(c['skills'])}"
        for c in CATALOG
    )

    question = (
        f"I am a {request.major} major at USIU-Africa. "
        + (f"My career goal is: {request.career_goal}. " if request.career_goal else "")
        + (f"My interests include: {', '.join(request.interests)}. " if request.interests else "")
        + f"\n\nHere is our microcredential catalog:\n{catalog_summary}\n\n"
        "Based on my degree and goals, recommend the 4 most relevant microcredential courses from the catalog above. "
        "For each recommendation, cite the course title, explain in 2 sentences why it fits my profile, "
        "and describe how it complements my degree at USIU-Africa. Format your response as a numbered list."
    )

    result = await ask_tibu(question)
    return result


@router.get("/fields")
async def get_fields():
    """Return available subject fields for filtering."""
    return {"fields": FIELDS, "levels": LEVELS}
