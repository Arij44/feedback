from pydantic import BaseModel
from typing import List, Dict

class BatchAnalyzeRequest(BaseModel):
    comments: List[str]

class SentimentCountResponse(BaseModel):
    positive: float
    neutral: float
    negative: float

