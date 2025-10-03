# backend/app/routes/search.py

from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
from pymongo import DESCENDING
from bson import ObjectId
from pydantic import BaseModel, Field
from app.db.mongo import db
import re

router = APIRouter()

posts_col = db['feedback']['posts']

# Response model
class PostSearchResult(BaseModel):
    id: str = Field(..., alias="_id")
    author: str
    avatar: Optional[str] = None
    text: str
    photo_url: Optional[str] = None
    timestamp: datetime
    platform: str
    sentiment: Optional[str] = None
    comments_count: int

def parse_time_filter(time_str: str) -> Optional[datetime]:
    if time_str == "any":
        return None
    now = datetime.utcnow()
    if time_str.endswith("d"):
        try:
            days = int(time_str[:-1])
            return now - timedelta(days=days)
        except:
            return None
    return None

@router.post("/search", response_model=List[PostSearchResult])
async def search_posts(
    query: Optional[str] = Query(None, description="Text search in post content"),
    platform: Optional[str] = Query("all", description="Platform filter"),
    time: Optional[str] = Query("any", description="Time filter, e.g. '1d', '7d', '30d' or 'any'"),
    sentiments: Optional[List[str]] = Query(None, description="Sentiment filter, multiple allowed"),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
):
    mongo_filter = {}

    # Platform filter
    if platform and platform.lower() != "all":
        mongo_filter["platform"] = platform.lower()

    # Time filter
    time_threshold = parse_time_filter(time.lower() if time else "any")
    if time_threshold:
        mongo_filter["timestamp"] = {"$gte": time_threshold}

    # Sentiment filter
    if sentiments:
        sentiments_lower = [s.lower() for s in sentiments]
        mongo_filter["sentiment"] = {"$in": sentiments_lower}

    # Text search filter
    if query:
        escaped_query = re.escape(query)
        mongo_filter["text"] = {"$regex": escaped_query, "$options": "i"}

    # Query MongoDB
    cursor = posts_col.find(mongo_filter).sort("timestamp", DESCENDING).skip(skip).limit(limit)

    results = []
    for doc in cursor:
        results.append({
            "_id": str(doc["_id"]),
            "author": doc.get("author", ""),
            "avatar": doc.get("avatar"),
            "text": doc.get("text", ""),
            "photo_url": doc.get("photo_url"),
            "timestamp": doc.get("timestamp"),
            "platform": doc.get("platform"),
            "sentiment": doc.get("sentiment"),
            "comments_count": len(doc.get("comments", []))
        })

    return results
