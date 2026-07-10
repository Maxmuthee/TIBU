"""AI Study Group Matcher — Connects students for collaborative learning."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.matching import find_study_matches

router = APIRouter()

# In-memory profile store for hackathon MVP
profiles_db: list[dict] = [
    {
        "id": "student-1",
        "name": "Alice M.",
        "courses": ["CSC 3100", "CSC 2200", "MAT 2100"],
        "learning_style": "collaborative",
        "availability": "weekday evenings",
    },
    {
        "id": "student-2",
        "name": "Brian K.",
        "courses": ["CSC 3100", "IST 2300", "BUS 1100"],
        "learning_style": "visual",
        "availability": "weekends",
    },
    {
        "id": "student-3",
        "name": "Carol W.",
        "courses": ["CSC 2200", "MAT 2100", "CSC 3100"],
        "learning_style": "collaborative",
        "availability": "weekday evenings",
    },
]


class StudentProfile(BaseModel):
    name: str
    courses: list[str]
    learning_style: str = "any"
    availability: str = "flexible"


@router.get("/profiles")
async def list_profiles():
    """List all students who opted into study group matching."""
    return {"profiles": profiles_db}


@router.post("/register")
async def register_profile(profile: StudentProfile):
    """Register or update your study profile for matching."""
    new_profile = {
        "id": f"student-{len(profiles_db) + 1}",
        **profile.model_dump(),
    }
    profiles_db.append(new_profile)
    return {"message": "Profile registered!", "profile": new_profile}


@router.post("/match")
async def match_study_partners(profile: StudentProfile):
    """Find compatible study partners based on courses, style, and schedule."""
    student = {"id": "current-user", **profile.model_dump()}
    matches = find_study_matches(student, profiles_db)
    return {"matches": matches}
