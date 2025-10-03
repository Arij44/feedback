import re
from urllib.parse import urlparse
from datetime import datetime
import asyncpraw
from app.core.config import settings
import uuid

def extract_reddit_id(url: str) -> str:
    match = re.search(r'/comments/([A-Za-z0-9_]+)/', url)
    if match:
        return match.group(1)
    parsed = urlparse(url)
    parts = parsed.path.split('/')
    if 'comments' in parts:
        idx = parts.index('comments')
        return parts[idx + 1]
    raise ValueError('Invalid Reddit URL')

async def fetch_reddit_data(url: str) -> dict:
    reddit = asyncpraw.Reddit( 
        client_id=settings.reddit_client_id,
        client_secret=settings.reddit_client_secret,
        user_agent=settings.reddit_user_agent,
    )

    post_id = extract_reddit_id(url)
    async with reddit:
        submission = await reddit.submission(id=post_id)
        await submission.load()
        await submission.comments.replace_more(limit=0)

        comments = []
        for comment in submission.comments.list():
            comments.append({
                "author": comment.author.name if comment.author else "deleted",
                "text": comment.body,
                "created_utc": comment.created_utc
            })

        # Get author avatar URL safely (if available)
        author_avatar = None
        if submission.author:
            try:
               redditor = await reddit.redditor(submission.author.name)
               await redditor.load()
               author_avatar = getattr(redditor, "icon_img", None)
            except Exception:
               author_avatar = None

        

        return {
            "platform": "reddit",
            "post": {
                "id": submission.id,
                "author": submission.author.name if submission.author else "deleted",
                "text": submission.selftext,
                "timestamp": datetime.utcfromtimestamp(submission.created_utc).isoformat() + 'Z',
                "avatar": author_avatar
            },
            "comments": [
                {
                    "id": str(uuid.uuid4()),
                    "author": comment["author"],
                    "text": comment["text"],
                    "timestamp": datetime.utcfromtimestamp(comment["created_utc"]).isoformat() + 'Z'
                }
                for comment in comments
            ]
        }
