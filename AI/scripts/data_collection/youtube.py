import asyncio
import aiohttp
import json
import os
import logging
import re
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_URL = "https://www.googleapis.com/youtube/v3"
API_KEY = os.getenv("YOUTUBE_API_KEY")


def extract_video_id(url: str) -> str | None:
    patterns = [
        r"(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)",
        r"(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]+)"
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    logger.warning(f"Invalid YouTube URL: {url}")
    return None


async def fetch_video_details(session: aiohttp.ClientSession, video_id: str) -> dict | None:
    url = f"{BASE_URL}/videos"
    params = {"part": "snippet", "id": video_id, "key": API_KEY}
    try:
        async with session.get(url, params=params) as response:
            if response.status != 200:
                logger.warning(f"No video found with ID: {video_id}, Status: {response.status}")
                return None
            data = await response.json()
            items = data.get("items", [])
            if not items:
                return None
            snippet = items[0].get("snippet", {})
            # Skip if critical fields are missing
            if not snippet.get("title") or not snippet.get("publishedAt"):
                logger.warning(f"Skipping video {video_id} due to missing title or publishedAt.")
                return None
            return snippet
    except Exception as e:
        logger.error(f"Error fetching video details for {video_id}: {e}")
        return None


async def fetch_video_comments(session: aiohttp.ClientSession, video_id: str, max_results: int = 200) -> list[str]:
    comments = []
    url = f"{BASE_URL}/commentThreads"
    params = {
        "part": "snippet",
        "videoId": video_id,
        "textFormat": "plainText",
        "maxResults": 100,
        "key": API_KEY
    }
    try:
        while len(comments) < max_results:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch comments for {video_id}: Status {response.status}")
                    break
                data = await response.json()
                for item in data.get("items", []):
                    comment = item["snippet"]["topLevelComment"]["snippet"].get("textDisplay", "").strip()
                    if comment:
                        comments.append(comment)
                    if len(comments) >= max_results:
                        break
                next_page = data.get("nextPageToken")
                if not next_page:
                    break
                params["pageToken"] = next_page
                await asyncio.sleep(0.1)
    except Exception as e:
        logger.error(f"Error fetching comments for {video_id}: {e}")
    return comments


async def fetch_youtube_comments_flat(session: aiohttp.ClientSession, url: str, max_comments: int = 200) -> list[dict]:
    video_id = extract_video_id(url)
    if not video_id:
        return []

    snippet = await fetch_video_details(session, video_id)
    if not snippet:
        return []

    comments = await fetch_video_comments(session, video_id, max_comments)

    flat_records = []
    for text in comments:
        flat_records.append({
            "comment_text": text,
            "platform": "youtube",
            "post_id": video_id,
            "post_title": snippet.get("title", "Untitled"),
            "post_url": url,
            "timestamp": snippet.get("publishedAt") or "1970-01-01T00:00:00Z"
        })

    return flat_records


async def fetch_all_youtube_comments_flat(video_urls: list[str], max_comments: int = 200) -> list[dict]:
    async with aiohttp.ClientSession() as session:
        semaphore = asyncio.Semaphore(5)
        async def bounded_fetch(url):
            async with semaphore:
                return await fetch_youtube_comments_flat(session, url, max_comments)

        results = await asyncio.gather(*[bounded_fetch(url) for url in video_urls])
        return [comment for group in results for comment in group]


def save_to_jsonl(data: list[dict], path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        for record in data:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    logger.info(f"✅ Saved {len(data)} comments to {path}")


if __name__ == "__main__":
    video_urls = [
        "https://www.youtube.com/watch?v=DclADBRw0zg", 
        "https://www.youtube.com/watch?v=BnpL4VYBD0Y", 
        "https://www.youtube.com/watch?v=dclIIEHeyVY",
        "https://www.youtube.com/watch?v=vQPgEm9jAJI",
        "https://www.youtube.com/watch?v=dUg5SnoEPsw",
        "https://www.youtube.com/watch?v=ADlzje4l1BM",
        "https://www.youtube.com/watch?v=exI_hD_4jAM",
        "https://www.youtube.com/watch?v=iPvdI7ibGHc",
        "https://www.youtube.com/watch?v=OuY-zJy_fBw",
        "https://www.youtube.com/watch?v=BhFC0Qr8hz8",
        "https://www.youtube.com/watch?v=_ePDYvjGRdY",
        "https://www.youtube.com/watch?v=pJZQlX2Fs7A",
        "https://www.youtube.com/watch?v=eGR2Yf6yBRA",
        "https://www.youtube.com/watch?v=52NjAAvxqXg",
        "https://www.youtube.com/watch?v=8DNQ8DYgCJE"
    ]

    output_path = "data/processed/comments_unlabeled.jsonl"
    results = asyncio.run(fetch_all_youtube_comments_flat(video_urls))
    save_to_jsonl(results, output_path)
