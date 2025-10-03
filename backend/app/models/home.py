from pydantic import BaseModel
from typing import List, Optional

class Stats(BaseModel):
    posts: int
    comments: int
    sentiment: str

class SentimentBreakdown(BaseModel):
    positive: int
    neutral: int
    negative: int


class PostSentiment(BaseModel):
    id: str
    title: str  
    author: str  
    avatar: Optional[str]=None            # first line of the post text
    positive: int
    neutral: int
    negative: int
    
class FeedbackItem(BaseModel):
    id: str
    author: str
    text: str
    sentiment: str
    emoji: Optional[str] = None  # Optional emoji field
    sentimentBreakdown: SentimentBreakdown


class HomeResponse(BaseModel):
    displayName: str
    photoURL: Optional[str] = None
    stats: Stats
    recentFeedback: List[FeedbackItem]
    postSentiments: List[PostSentiment] 
