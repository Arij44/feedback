from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalyzeRequest(BaseModel):
    url: str

class Comment(BaseModel):
    id: str
    text: str
    author: str
    timestamp: str
    sentiment: str 

class Post(BaseModel):
    id: str
    author: str
    text: str
    timestamp: str
    avatar: Optional[str] = None
    photo_url: Optional[str] = None

class AnalyzeResponse(BaseModel):
    platform: str
    post: Post
    comments: List[Comment]
    sentiment: Dict[str, int]
    topics: List[Dict[str, Any]]
    postId: str  # MongoDB document ID as a string
