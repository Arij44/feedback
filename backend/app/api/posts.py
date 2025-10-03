# app/api/posts.py
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.db import get_database
from typing import List

router = APIRouter(prefix="/api/posts", tags=["Posts"])

@router.get("/mine")
async def get_my_posts(user_data: dict = Depends(get_current_user), db=Depends(get_database)):
    user_id = user_data["uid"]  # Firebase UID

    posts_cursor = db.posts.find({ "user_id": user_id }) 
    posts = []

    async for post in posts_cursor:
        post["_id"] = str(post["_id"])
        posts.append(post)

    return posts
