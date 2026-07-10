from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import chat, courses, campus_map, study_hub, opportunities, study_groups, lost_found, wellness, microcredentials, admin

settings = get_settings()

app = FastAPI(
    title="TIBU API",
    description="The Integrated University Buddy — AI-Powered Campus Intelligence for USIU-Africa",
    version="0.1.0",
)

# CORS — allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
app.include_router(campus_map.router, prefix="/api/map", tags=["Campus Map"])
app.include_router(study_hub.router, prefix="/api/study-hub", tags=["Study Hub"])
app.include_router(opportunities.router, prefix="/api/opportunities", tags=["Opportunities"])
app.include_router(study_groups.router, prefix="/api/study-groups", tags=["Study Groups"])
app.include_router(lost_found.router, prefix="/api/lost-found", tags=["Lost & Found"])
app.include_router(wellness.router, prefix="/api/wellness", tags=["Wellness"])
app.include_router(microcredentials.router, prefix="/api/microcredentials", tags=["Microcredentials"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
async def root():
    return {
        "name": "TIBU API",
        "status": "running",
        "message": "Your campus, understood.",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
