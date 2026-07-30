"""Lost & Found — Digital bulletin board for lost and found items."""

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# In-memory store for hackathon MVP (refreshed July 2026)
items_db: list[dict] = [
    # ── Found items ──────────────────────────────────────────────────────────
    {
        "id": 1,
        "type": "found",
        "title": "Blue Hydro Flask Water Bottle",
        "description": "Found on a study desk on the 2nd floor of the library. Has a few stickers on it.",
        "location": "USIU-Africa Library",
        "contact": "Collect from the Student Affairs office",
        "posted_at": "2026-07-29T09:15:00",
        "resolved": False,
    },
    {
        "id": 2,
        "type": "found",
        "title": "AirPods Pro (with case)",
        "description": "Found after the afternoon lecture in Chandaria School of Business. Kept safe pending owner.",
        "location": "Chandaria School of Business",
        "contact": "amina.h@students.usiu.ac.ke",
        "posted_at": "2026-07-27T16:40:00",
        "resolved": False,
    },
    {
        "id": 3,
        "type": "found",
        "title": "USIU Student ID — B. Otieno",
        "description": "Found near the entrance to the Freida Brown Student Centre. Handed to the front desk.",
        "location": "Freida Brown Student Centre",
        "contact": "Collect from the Student Centre front desk",
        "posted_at": "2026-07-22T11:05:00",
        "resolved": False,
    },
    {
        "id": 4,
        "type": "found",
        "title": "Casio Scientific Calculator",
        "description": "Left behind after an exam in the Auditorium. Name partly written on the back.",
        "location": "Auditorium",
        "contact": "Collect from the Student Affairs office",
        "posted_at": "2026-07-15T13:30:00",
        "resolved": False,
    },
    {
        "id": 5,
        "type": "found",
        "title": "Silver Bracelet",
        "description": "Found near the walkway outside the Science Complex. Small silver chain bracelet.",
        "location": "Science Complex",
        "contact": "faith.w@students.usiu.ac.ke",
        "posted_at": "2026-07-08T08:50:00",
        "resolved": False,
    },
    # ── Lost items ───────────────────────────────────────────────────────────
    {
        "id": 6,
        "type": "lost",
        "title": "Black HP Laptop Charger",
        "description": "Left my HP charger plugged in at a computer lab bench. 65W USB-C, has a blue tag.",
        "location": "Lilian Beam ICT Center",
        "contact": "david.k@students.usiu.ac.ke",
        "posted_at": "2026-07-30T17:20:00",
        "resolved": False,
    },
    {
        "id": 7,
        "type": "lost",
        "title": "Prescription Glasses (black frame)",
        "description": "Misplaced my black-framed glasses somewhere around the cafeteria during lunch.",
        "location": "Main Cafeteria",
        "contact": "sandra.m@students.usiu.ac.ke",
        "posted_at": "2026-07-24T12:10:00",
        "resolved": False,
    },
    {
        "id": 8,
        "type": "lost",
        "title": "Toyota Car Keys",
        "description": "Lost a set of car keys with a black Toyota fob and a small red keyring near the admin parking.",
        "location": "Administration Block parking",
        "contact": "brian.o@students.usiu.ac.ke",
        "posted_at": "2026-07-18T15:45:00",
        "resolved": False,
    },
    {
        "id": 9,
        "type": "lost",
        "title": "Blue USIU Hoodie",
        "description": "Left my navy-blue USIU hoodie at the courts after evening basketball practice.",
        "location": "Sports Complex",
        "contact": "kevin.n@students.usiu.ac.ke",
        "posted_at": "2026-07-11T19:00:00",
        "resolved": False,
    },
    {
        "id": 10,
        "type": "lost",
        "title": "Samsung Galaxy Buds",
        "description": "Dropped my white Samsung earbuds somewhere between the hostels and the library.",
        "location": "Hostels / Library area",
        "contact": "grace.a@students.usiu.ac.ke",
        "posted_at": "2026-07-04T07:35:00",
        "resolved": False,
    },
]


class LostFoundItem(BaseModel):
    type: str  # "lost" or "found"
    title: str
    description: str
    location: str = ""
    contact: str = ""


@router.get("/items")
async def list_items(item_type: str = "", resolved: bool = False):
    """List lost and found items."""
    results = items_db
    if item_type:
        results = [i for i in results if i["type"] == item_type]
    if not resolved:
        results = [i for i in results if not i.get("resolved")]
    return {"items": results}


@router.post("/report")
async def report_item(item: LostFoundItem):
    """Report a lost or found item."""
    new_item = {
        "id": len(items_db) + 1,
        **item.model_dump(),
        "posted_at": datetime.now().isoformat(),
        "resolved": False,
    }
    items_db.append(new_item)
    return {"message": f"Item reported as {item.type}!", "item": new_item}


@router.patch("/{item_id}/resolve")
async def resolve_item(item_id: int):
    """Mark a lost/found item as resolved."""
    for item in items_db:
        if item["id"] == item_id:
            item["resolved"] = True
            return {"message": "Item marked as resolved!", "item": item}
    return {"error": "Item not found"}
