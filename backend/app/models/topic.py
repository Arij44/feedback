from pydantic import BaseModel
from typing import List, Optional

class TopicAnalyzeRequest(BaseModel):
    comments: List[str]

class TopicSummary(BaseModel):
    topic_id: int
    title: str
    keywords: List[str]
    size: int
    example: str

class TopicAnalyzeResponse(BaseModel):
    topics: List[TopicSummary]
