from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from app.auth import get_current_user
from app.db.mongo import db

router = APIRouter()

class ProfileResponse(BaseModel):
    displayName: str | None = None
    photoURL: str | None = None

class ProfileUpdateRequest(BaseModel):
    displayName: str
    photoURL: str

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(request: Request, user=Depends(get_current_user)):
    user_id = user["uid"]
    user_data =  db["users"].find_one({"uid": user_id})
    
    if not user_data:
        return ProfileResponse()  # fallback if not found

    return ProfileResponse(
        displayName=user_data.get("displayName"),
        photoURL=user_data.get("photoURL")
    )

@router.put("/profile")
async def update_profile(data: ProfileUpdateRequest, request: Request, user=Depends(get_current_user)):
    user_id = user["uid"]
    
    update = {
        "uid": user_id,
        "displayName": data.displayName,
        "photoURL": data.photoURL
    }

    db["users"].update_one({"uid": user_id}, {"$set": update}, upsert=True)
    return {"message": "Profile updated successfully"}
