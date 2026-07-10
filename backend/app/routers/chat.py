"""Ask TIBU — The main AI chatbot endpoint."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.rag_engine import ask_tibu

router = APIRouter()


class UserProfile(BaseModel):
    name: str = ""
    major: str = ""
    year: str = ""


class ChatRequest(BaseModel):
    question: str
    conversation_history: list[dict] | None = None
    user_profile: UserProfile | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


@router.post("/ask", response_model=ChatResponse)
async def ask(request: ChatRequest):
    """Ask TIBU any question about USIU-Africa."""
    import traceback, logging
    logger = logging.getLogger(__name__)

    question = request.question

    if request.user_profile and request.user_profile.major:
        profile = request.user_profile
        context_parts = []
        if profile.major:
            context_parts.append(f"a {profile.major} student")
        if profile.year:
            context_parts.append(f"in their {profile.year}")
        profile_ctx = " ".join(context_parts)
        question = f"[Student context: {profile_ctx}] {question}"

    try:
        result = await ask_tibu(
            question=question,
            conversation_history=request.conversation_history,
        )
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"RAG error: {e}\n{traceback.format_exc()}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
