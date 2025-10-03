from fastapi import APIRouter, Request, Depends
from app.auth import verify_token
from app.db.mongo import db, users_collection  # MongoDB client

router = APIRouter()

@router.get("/me")
async def get_user_info(request: Request, _=Depends(verify_token)):
    user = request.state.user
    existing = db.users.find_one({"uid": user["uid"]})
    if not existing:
        db.users.insert_one({
            "uid": user["uid"],
            "email": user["email"]
        })
    return {
        "uid": user["uid"],
        "email": user["email"]
    }


@router.get("/profile")
async def get_profile(request: Request, _=Depends(verify_token)):
    user = request.state.user
    profile = db.users.find_one({"uid": user["uid"]}, {"_id": 0})
    return profile

@router.put("/profile")
async def update_profile(request: Request, payload: dict, _=Depends(verify_token)):
    user = request.state.user
    db.users.update_one(
      {"uid": user["uid"]},
      {"$set": {
         "displayName": payload.get("displayName"),
         "photoURL": payload.get("photoURL")
       }},
      upsert=True
    )
    return {"status": "ok"}