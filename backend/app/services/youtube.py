# app/services/youtube.py

import re
import os
import logging
import aiohttp
import asyncio
from datetime import datetime
from urllib.parse import urlparse, parse_qs
import uuid
from app.core.config import settings

YOUTUBE_API_KEY = settings.youtube_api_key
BASE_URL = "https://www.googleapis.com/youtube/v3"

logger = logging.getLogger(__name__)

def extract_video_id(url: str) -> str | None:
    patterns = [
        r"(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)",
        r"(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]+)"
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

async def fetch_video_details(session: aiohttp.ClientSession, video_id: str) -> dict | None:
    url = f"{BASE_URL}/videos"
    params = {"part": "snippet", "id": video_id, "key": YOUTUBE_API_KEY}
    async with session.get(url, params=params) as resp:
        data = await resp.json()
        items = data.get("items", [])
        if not items:
            return None
        return items[0]["snippet"]

async def fetch_video_comments(session: aiohttp.ClientSession, video_id: str, max_comments: int = 200) -> list[dict]:
    url = f"{BASE_URL}/commentThreads"
    comments = []
    params = {
        "part": "snippet",
        "videoId": video_id,
        "textFormat": "plainText",
        "maxResults": 100,
        "key": YOUTUBE_API_KEY,
    }

    while len(comments) < max_comments:
        async with session.get(url, params=params) as resp:
            data = await resp.json()
            for item in data.get("items", []):
                snippet = item["snippet"]["topLevelComment"]["snippet"]
                comments.append({
                    "author": snippet.get("authorDisplayName", "unknown"),
                    "text": snippet.get("textDisplay", ""),
                    "created_utc": snippet.get("publishedAt", "")
                })
                if len(comments) >= max_comments:
                    break
            if "nextPageToken" not in data:
                break
            params["pageToken"] = data["nextPageToken"]
            await asyncio.sleep(0.1)
    return comments

async def fetch_channel_avatar(session: aiohttp.ClientSession, channel_id: str) -> str | None:
    url = f"{BASE_URL}/channels"
    params = {
        "part": "snippet",
        "id": channel_id,
        "key": YOUTUBE_API_KEY,
    }
    async with session.get(url, params=params) as resp:
        data = await resp.json()
        items = data.get("items", [])
        if not items:
            return None
        thumbnails = items[0]["snippet"]["thumbnails"]
        # Pick highest resolution thumbnail available, fallback order
        for res in ["maxres", "high", "medium", "default"]:
            if res in thumbnails:
                return thumbnails[res]["url"]
        return None

async def fetch_youtube_data(url: str) -> dict:
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")

    async with aiohttp.ClientSession() as session:
        snippet = await fetch_video_details(session, video_id)
        if not snippet:
            raise ValueError("Video not found")

        channel_id = snippet.get("channelId")
        avatar_url = None
        if channel_id:
            avatar_url = await fetch_channel_avatar(session, channel_id)

        comments = await fetch_video_comments(session, video_id)

        post = {
            "id": video_id,
            "author": snippet.get("channelTitle", "unknown"),
            "text": snippet.get("description", ""),
            "timestamp": snippet.get("publishedAt", "1970-01-01T00:00:00Z"),
            "avatar": avatar_url
        }
        formatted_comments = [
            {
                "id": str(uuid.uuid4()),  # generate a unique id for each comment
                "author": c.get("author", "unknown"),
                "text": c.get("text", ""),
                "timestamp": c.get("created_utc", "")
            }
            for c in comments
        ]
        return {
            "platform": "youtube",
            "post": post,
            "comments": formatted_comments
        }
