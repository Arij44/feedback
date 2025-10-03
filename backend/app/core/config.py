from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os

# ✅ Force load .env manually
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env"))

class Settings(BaseSettings):
    reddit_client_id: str
    reddit_client_secret: str
    reddit_user_agent: str = "feedback-analyzer"
    youtube_api_key: str

    model_config = SettingsConfigDict(extra="ignore")  # ✅ allow extra vars

settings = Settings()
