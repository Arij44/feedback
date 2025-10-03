from pydantic import BaseModel

class UserCreate(BaseModel):
    uid: str
    email: str
    displayName: str
    photoURL: str
