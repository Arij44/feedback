# backend/app/api/users.py

from fastapi import APIRouter
from app.models.user import UserCreate
from app.db.mongo import users_collection

router = APIRouter()

@router.post("/users/")
def create_or_get_user(user: UserCreate):
    existing = users_collection.find_one({"uid": user.uid})
    if existing:
        return {"msg": "User already exists", "user": existing}
    
    new_user = user.dict()
    users_collection.insert_one(new_user)
    return {"msg": "User created", "user": new_user}

@router.post("/")
def create_user(user: dict):
    from app.db.mongo import users_collection

    existing_user = users_collection.find_one({"uid": user["uid"]})
    if existing_user:
        return {"message": "User already exists"}

    # Normalize field names
    new_user = {
        "uid": user["uid"],
        "email": user.get("email"),
        "name": user.get("displayName"),  # rename it here
        "photo_url": user.get("photoURL"),  # rename it here
    }

    users_collection.insert_one(new_user)
    return {"message": "User created"}
