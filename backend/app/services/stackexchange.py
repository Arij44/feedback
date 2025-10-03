# app/services/stackexchange.py

import logging
import aiohttp
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urlparse
import uuid
BASE_URL = "https://api.stackexchange.com/2.3"
logger = logging.getLogger(__name__)

def clean_html(text: str) -> str:
    return BeautifulSoup(text, "html.parser").get_text(separator=" ").strip() if text else ""

def extract_question_id(url: str) -> str | None:
    parsed_url = urlparse(url)
    path_parts = parsed_url.path.strip("/").split("/")
    if len(path_parts) > 1 and path_parts[0] == "questions":
        return path_parts[1].split("#")[0]
    logger.error(f"Invalid StackExchange URL: {url}")
    return None

async def fetch_post_metadata(session: aiohttp.ClientSession, question_id: str, site: str) -> dict | None:
    url = f"{BASE_URL}/questions/{question_id}"
    params = {"order": "desc", "sort": "activity", "site": site, "filter": "withbody"}
    async with session.get(url, params=params) as response:
        if response.status != 200:
            logger.error(f"Failed to fetch post {question_id}: Status {response.status}")
            return None
        data = await response.json()
        return data.get("items", [None])[0]

async def fetch_answers_flat(session: aiohttp.ClientSession, question_id: str, site: str) -> list[dict]:
    url = f"{BASE_URL}/questions/{question_id}/answers"
    params = {"order": "desc", "sort": "votes", "site": site, "filter": "withbody"}
    async with session.get(url, params=params) as response:
        if response.status != 200:
            logger.error(f"Failed to fetch answers for {question_id}: Status {response.status}")
            return []
        data = await response.json()
        answers = []
        for item in data.get("items", []):
            text = clean_html(item.get("body", ""))
            if text:
                answers.append({
                    "author": item.get("owner", {}).get("display_name", "unknown"),
                    "text": text,
                    "created_utc": datetime.utcfromtimestamp(item.get("creation_date", 0)).isoformat()
                })
        return answers

async def fetch_stackexchange_data(url: str) -> dict:
    question_id = extract_question_id(url)
    if not question_id:
        raise ValueError("Invalid StackExchange URL")

    domain = urlparse(url).netloc
    site = domain.split(".")[0] if domain else "stackoverflow"

    async with aiohttp.ClientSession() as session:
        metadata = await fetch_post_metadata(session, question_id, site)
        if not metadata:
            raise ValueError("Question not found")

        answers = await fetch_answers_flat(session, question_id, site)

        # Extract post fields
        post_id = metadata.get("question_id") or question_id
        title = metadata.get("title")
        author = metadata.get("owner", {}).get("display_name")
        avatar = metadata.get("owner", {}).get("profile_image")  # <--- added here
        selftext = clean_html(metadata.get("body", ""))
        timestamp = datetime.utcfromtimestamp(metadata.get("creation_date", 0)).isoformat() if metadata.get("creation_date") else None

        # If any required field is missing, try to fetch again (best effort)
        if not all([post_id, title, author, selftext, timestamp]):
            refreshed_metadata = await fetch_post_metadata(session, question_id, site)
            if refreshed_metadata:
                post_id = refreshed_metadata.get("question_id") or post_id
                title = refreshed_metadata.get("title") or title
                author = refreshed_metadata.get("owner", {}).get("display_name") or author
                avatar = refreshed_metadata.get("owner", {}).get("profile_image") or avatar  # update avatar if missing
                selftext = clean_html(refreshed_metadata.get("body", "")) or selftext
                if refreshed_metadata.get("creation_date"):
                    timestamp = datetime.utcfromtimestamp(refreshed_metadata.get("creation_date", 0)).isoformat() or timestamp

        # Assign unique IDs to comments if missing
        for i, comment in enumerate(answers):
            comment["id"] = comment.get("id") or f"c{i}"

        return {
            "platform": "stackexchange",
            "post": {
                "id": post_id or "",
                "author": author or "",
                "text": selftext or "",
                "timestamp": timestamp or "",
                "avatar": avatar or None  # <--- added here
            },
            "comments": [
                {
                    "id": comment.get("id", "") or str(uuid.uuid4()),
                    "author": comment.get("author", ""),
                    "text": comment.get("text", ""),
                    "timestamp": comment.get("created_utc", "")
                }
                for comment in answers
            ]
        }
