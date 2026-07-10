"""Mental Health & Wellness Navigator — Stigma-free access to support resources."""

from fastapi import APIRouter

router = APIRouter()

WELLNESS_RESOURCES = {
    "counseling": {
        "title": "USIU Counseling Services",
        "description": "Free, confidential counseling for all enrolled students. Individual and group sessions available.",
        "location": "Wellness Center, Ground Floor",
        "contact": "wellness@usiu.ac.ke",
        "hours": "Monday-Friday, 8:00 AM - 5:00 PM",
        "how_to_book": "Walk in or email to schedule an appointment.",
    },
    "crisis": {
        "title": "Crisis & Emergency Support",
        "description": "If you or someone you know is in crisis, please reach out immediately.",
        "contacts": [
            {"name": "USIU Wellness Center", "phone": "+254 XXX XXX XXX"},
            {"name": "Kenya Red Cross", "phone": "1199"},
            {"name": "Befrienders Kenya (24/7)", "phone": "+254 722 178 177"},
        ],
    },
    "self_help": {
        "title": "Self-Help Resources",
        "tips": [
            "Take regular breaks during study sessions — try the 25/5 Pomodoro technique.",
            "Stay connected — join a study group or club to combat isolation.",
            "Exercise regularly — USIU's gym and sports facilities are free for students.",
            "Practice good sleep hygiene — aim for 7-8 hours per night.",
            "Talk to someone if you're feeling overwhelmed — it's a sign of strength, not weakness.",
        ],
    },
    "peer_support": {
        "title": "Peer Support Programs",
        "description": "Trained student peer counselors are available for informal conversations and support.",
        "how_to_access": "Visit the Wellness Center or ask at the Student Life office.",
    },
}


@router.get("/resources")
async def list_resources():
    """Get all wellness and mental health resources."""
    return {"resources": WELLNESS_RESOURCES}


@router.get("/crisis")
async def crisis_info():
    """Get emergency/crisis contact information."""
    return WELLNESS_RESOURCES["crisis"]


@router.get("/self-help")
async def self_help_tips():
    """Get self-help and wellness tips."""
    return WELLNESS_RESOURCES["self_help"]
