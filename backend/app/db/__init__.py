# app/db/__init__.py

from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client["feedback"]  # Change this to your actual database name

# Dependency for FastAPI routes
def get_database():
    return db
