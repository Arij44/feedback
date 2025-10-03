from fastapi import Request, Depends, HTTPException
from firebase_admin import auth
from typing import Optional

def get_current_user(request: Request) -> dict:
    auth_header: Optional[str] = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    id_token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token  #  return decoded user info
    except Exception as e:
        print("Firebase token verification failed:", e)
        raise HTTPException(status_code=401, detail="Invalid token")
    

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        decoded_token = auth.verify_id_token(credentials.credentials)
        return decoded_token
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
