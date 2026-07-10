"""Lost & Found — Digital bulletin board for lost and found items."""

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# In-memory store for hackathon MVP
items_db: list[dict] = [
    {
        "id": 1,
        "type": "found",
        "title": "Blue Water Bottle",
        "description": "Found in CSOB LT2 after the 2pm lecture.",
        "location": "CSOB LT2",
        "contact": "Drop by the Student Life office",
        "posted_at": "2026-03-09T14:00:00",
        "resolved": False,
    },
    {
        "id": 2,
        "type": "lost",
        "title": "Student ID Card - John D.",
        "description": "Lost my student ID somewhere between the library and cafeteria.",
        "location": "Library / Cafeteria area",
        "contact": "john.d@student.usiu.ac.ke",
        "posted_at": "2026-03-08T10:30:00",
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
