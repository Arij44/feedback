from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import credentials, initialize_app, auth
from dotenv import load_dotenv
from app.api import posts
from app.api import users
from app.api import home
from app.api import profile


import os

from app.api import analyze
from app.api import search

# ---------- Load environment and Firebase ----------
load_dotenv(dotenv_path="C:/Users/whibi/Desktop/dev/backend/app/.env")
firebase_path = os.getenv("FIREBASE_CREDENTIALS")
cred = credentials.Certificate(firebase_path)
initialize_app(cred)

# ---------- Initialize FastAPI ----------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Auth Helpers ----------
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        decoded_token = auth.verify_id_token(credentials.credentials)
        return decoded_token
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication")

# ---------- Routes ----------
@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/me")
def read_users_me(user_data=Depends(get_current_user)):
    return {
        "uid": user_data["uid"],
        "name": user_data.get("name", ""),
        "email": user_data.get("email", ""),
        "picture": user_data.get("picture", "")
    }

app.include_router(analyze.router, prefix="/api")
app.include_router(posts.router)
app.include_router(users.router)
app.include_router(home.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(profile.router)

