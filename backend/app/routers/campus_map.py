"""Campus Navigator — USIU-Africa building locations and directions."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# ---------------------------------------------------------------------------
# Verified USIU-Africa campus coordinates
# Campus center: -1.2163, 36.8789  (Kasarani, Nairobi)
# All pins verified to sit within the campus boundary.
# ---------------------------------------------------------------------------
CAMPUS_LOCATIONS = {
    # ── Gates ────────────────────────────────────────────────────────────────
    "gate_a": {
        "name": "Main Gate (Gate A)",
        "lat": -1.2148, "lng": 36.8784,
        "building_code": "GATE-A",
        "category": "Access",
        "description": "Main campus entrance off USIU Road. Security check-in for visitors.",
    },
    "gate_b": {
        "name": "Gate B",
        "lat": -1.2140, "lng": 36.8800,
        "building_code": "GATE-B",
        "category": "Access",
        "description": "Secondary campus entrance. Often used by pedestrians from Kasarani.",
    },

    # ── Academic buildings ────────────────────────────────────────────────────
    "csb": {
        "name": "Chandaria School of Business",
        "lat": -1.2172, "lng": 36.8793,
        "building_code": "CSB",
        "category": "Academic",
        "description": "Business school with lecture theatres LT1–LT4, faculty offices, and the Bloomberg Trading Lab.",
        "departments": ["Business Administration", "Finance", "Marketing", "Entrepreneurship"],
    },
    "shss": {
        "name": "School of Humanities & Social Sciences",
        "lat": -1.2175, "lng": 36.8790,
        "building_code": "SHSS",
        "category": "Academic",
        "description": "Houses Communication, Journalism, International Relations, and Psychology departments. Rooftop event space.",
        "departments": ["Communication & Media", "Journalism", "International Relations", "Psychology", "Counseling"],
    },
    "sst": {
        "name": "School of Science & Technology",
        "lat": -1.2168, "lng": 36.8791,
        "building_code": "SST",
        "category": "Academic",
        "description": "Computer Science, IT, and Applied Sciences lecture halls, computer labs, and faculty offices.",
        "departments": ["Computer Science", "Information Technology", "Applied Mathematics"],
    },
    "sph": {
        "name": "School of Pharmacy & Health Sciences",
        "lat": -1.2176, "lng": 36.8787,
        "building_code": "SPH",
        "category": "Academic",
        "description": "Nursing, Public Health, and Pharmacy programs. Includes clinical simulation labs.",
        "departments": ["Nursing", "Public Health", "Pharmacy"],
    },

    # ── Administration ────────────────────────────────────────────────────────
    "admin": {
        "name": "Administration Block",
        "lat": -1.2163, "lng": 36.8789,
        "building_code": "ADMIN",
        "category": "Administration",
        "description": "Registrar's Office, Finance Office, Student Affairs, and senior administration.",
    },
    "registrar": {
        "name": "Registrar's Office",
        "lat": -1.2163, "lng": 36.8789,
        "building_code": "REG",
        "category": "Administration",
        "description": "Academic records, transcripts, enrollment letters, and course registration.",
    },
    "finance": {
        "name": "Finance Office",
        "lat": -1.2163, "lng": 36.8789,
        "building_code": "FIN",
        "category": "Administration",
        "description": "Fee payments, fee statements, M-Pesa reconciliation, and bursary inquiries.",
    },
    "international": {
        "name": "International Student Office",
        "lat": -1.2162, "lng": 36.8790,
        "building_code": "ISO",
        "category": "Administration",
        "description": "Student visas, work permits, and immigration support for international students.",
    },

    # ── Library & Learning ────────────────────────────────────────────────────
    "library": {
        "name": "USIU-Africa Library",
        "lat": -1.2167, "lng": 36.8786,
        "building_code": "LIB",
        "category": "Library & Learning",
        "description": "Open 24 hours. Study rooms, computer workstations, digital databases, and printing services.",
    },

    # ── Student Life ──────────────────────────────────────────────────────────
    "student_centre": {
        "name": "Student Centre",
        "lat": -1.2158, "lng": 36.8778,
        "building_code": "SC",
        "category": "Student Life",
        "description": "Java House café, student lounges, meeting rooms, and the Student Government office.",
    },
    "cafeteria": {
        "name": "Main Cafeteria",
        "lat": -1.2165, "lng": 36.8783,
        "building_code": "CAF",
        "category": "Student Life",
        "description": "Main campus dining hall with multiple food vendors. Open 7 AM – 9 PM on weekdays.",
    },
    "wellness": {
        "name": "Wellness Center",
        "lat": -1.2170, "lng": 36.8786,
        "building_code": "WELL",
        "category": "Student Life",
        "description": "Counseling services, health clinic, and mental health programs. Confidential appointments available.",
    },
    "chapel": {
        "name": "Chapel",
        "lat": -1.2160, "lng": 36.8792,
        "building_code": "CHPL",
        "category": "Student Life",
        "description": "Interfaith chapel for prayer, meditation, and religious services.",
    },

    # ── Sports & Recreation ───────────────────────────────────────────────────
    "sports": {
        "name": "Sports Complex",
        "lat": -1.2155, "lng": 36.8800,
        "building_code": "SPORT",
        "category": "Sports & Recreation",
        "description": "Football pitch, basketball courts, swimming pool, and the main gymnasium.",
    },
    "gym": {
        "name": "Gymnasium",
        "lat": -1.2156, "lng": 36.8798,
        "building_code": "GYM",
        "category": "Sports & Recreation",
        "description": "Fully equipped gym open to students. Membership via Student Centre.",
    },
}


class LocationQuery(BaseModel):
    destination: str


@router.get("/locations")
async def list_locations():
    """List all known campus locations."""
    return {"locations": list(CAMPUS_LOCATIONS.values())}


@router.post("/find")
async def find_location(query: LocationQuery):
    """Search for a campus location by name, department, category, or code."""
    search = query.destination.lower().strip()
    matches = []

    for loc in CAMPUS_LOCATIONS.values():
        # Match on name, description, code, category, or departments list
        searchable = " ".join([
            loc.get("name", ""),
            loc.get("description", ""),
            loc.get("building_code", ""),
            loc.get("category", ""),
            " ".join(loc.get("departments", [])),
        ]).lower()

        if search in searchable:
            matches.append(loc)

    if matches:
        return {"found": True, "locations": matches}

    return {
        "found": False,
        "message": f"No location found for '{query.destination}'. Try a building name, department, or category like 'library', 'administration', or 'Computer Science'.",
    }
