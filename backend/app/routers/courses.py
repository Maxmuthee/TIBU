"""Smart Course Advisor — Helps students plan their course load."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.rag_engine import ask_tibu

router = APIRouter()


class CourseAdviceRequest(BaseModel):
    major: str
    completed_courses: list[str] = []
    interests: list[str] = []
    semester: str = "next"


@router.post("/advise")
async def get_course_advice(request: CourseAdviceRequest):
    """Get AI-powered course recommendations based on your academic profile."""
    completed = ', '.join(request.completed_courses) if request.completed_courses else 'none yet'
    interests = ', '.join(request.interests) if request.interests else 'not specified'

    question = (
        f"Using the USIU-Africa course advising forms and academic catalogue, "
        f"help a {request.major} student plan their {request.semester} semester.\n\n"
        f"Completed courses: {completed}\n"
        f"Interests / career goals: {interests}\n\n"
        f"Please:\n"
        f"1. List recommended courses for next semester with their course codes\n"
        f"2. Check that prerequisites are satisfied based on completed courses\n"
        f"3. Flag any required major or minor courses still outstanding\n"
        f"4. Suggest 1-2 electives aligned with their interests\n"
        f"Base your answer strictly on official USIU-Africa advising forms and course catalogue."
    )
    result = await ask_tibu(question)
    return result
