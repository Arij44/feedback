import asyncio
import aiohttp
import json
import os
import logging
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urlparse

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_URL = "https://api.stackexchange.com/2.3"

def clean_html(text: str) -> str:
    return BeautifulSoup(text, "html.parser").get_text(separator=" ").strip() if text else ""

async def extract_question_id(url: str) -> str | None:
    parsed_url = urlparse(url)
    path_parts = parsed_url.path.strip("/").split("/")
    if len(path_parts) > 1 and path_parts[0] == "questions":
      return path_parts[1].split("#")[0]

    logger.error(f"Invalid StackExchange URL: {url}")
    return None

async def fetch_post_metadata(session: aiohttp.ClientSession, question_id: str, site: str) -> dict | None:
    url = f"{BASE_URL}/questions/{question_id}"
    params = {"order": "desc", "sort": "activity", "site": site, "filter": "withbody"}
    try:
        async with session.get(url, params=params, timeout=10) as response:
            if response.status != 200:
                logger.error(f"Failed to fetch post {question_id}: Status {response.status}")
                return None
            data = await response.json()
            items = data.get("items", [])
            if not items:
                return None
            return items[0]
    except Exception as e:
        logger.error(f"Error fetching post {question_id}: {e}")
        return None

async def fetch_answers_flat(session: aiohttp.ClientSession, question_id: str, site: str, post_url: str, post_title: str, timestamp: str, limit: int = 0) -> list[dict]:
    url = f"{BASE_URL}/questions/{question_id}/answers"
    params = {"order": "desc", "sort": "votes", "site": site, "filter": "withbody"}
    try:
        async with session.get(url, params=params, timeout=10) as response:
            if response.status != 200:
                logger.error(f"Failed to fetch answers for question {question_id}: Status {response.status}")
                return []
            data = await response.json()
            items = data.get("items", [])
            flat = []
            for item in items:
                text = clean_html(item.get("body", ""))
                if text:
                    flat.append({
                        "comment_text": text,
                        "platform": "stackexchange",
                        "post_id": question_id,
                        "post_title": post_title,
                        "post_url": post_url,
                        "timestamp": timestamp
                    })
            return flat
    except Exception as e:
        logger.error(f"Error fetching answers for {question_id}: {e}")
        return []

async def fetch_stackexchange_comments(session: aiohttp.ClientSession, question_url: str) -> list[dict]:
    question_id = await extract_question_id(question_url)
    if not question_id:
        return []

    domain = urlparse(question_url).netloc
    site = domain.split(".")[0] if domain else "stackoverflow"

    metadata = await fetch_post_metadata(session, question_id, site)
    if not metadata:
        return []

    title = metadata.get("title", "Untitled")
    timestamp = datetime.utcfromtimestamp(metadata.get("creation_date", 0)).isoformat()

    return await fetch_answers_flat(
        session, question_id, site,
        post_url=question_url,
        post_title=title,
        timestamp=timestamp
    )

async def scrape_stackexchange_all(question_urls: list[str]) -> list[dict]:
    async with aiohttp.ClientSession() as session:
        semaphore = asyncio.Semaphore(5)
        async def bounded_fetch(url):
            async with semaphore:
                return await fetch_stackexchange_comments(session, url)

        results = await asyncio.gather(*[bounded_fetch(url) for url in question_urls])
        return [comment for group in results for comment in group]

def save_to_jsonl(data: list[dict], path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        for record in data:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    logger.info(f"✅ Saved {len(data)} StackExchange comments to {path}")

if __name__ == "__main__":
    with open("data/raw/stack_urls.txt", "r", encoding="utf-8") as f:
        stack_urls = [line.strip() for line in f.readlines()]
       

    output_path = "data/processed/comments_unlabeled.jsonl"
    results = asyncio.run(scrape_stackexchange_all(stack_urls))
    logger.info(f"✅ Total comments retrieved: {len(results)}")

    save_to_jsonl(results, output_path)
