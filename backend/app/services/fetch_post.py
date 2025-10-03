from ..services.reddit import fetch_reddit_data
from ..services.youtube import fetch_youtube_data
from ..services.stackexchange import fetch_stackexchange_data
from ..services.facebook import scrape_facebook_post

async def fetch_post_data(url: str):
    if "reddit.com" in url:
        return await fetch_reddit_data(url)
    elif "youtube.com" in url or "youtu.be" in url:
        return await fetch_youtube_data(url)
    elif "facebook.com" in url:
        return await scrape_facebook_post(url)
    elif "stackexchange.com" in url or "stackoverflow.com" in url:
        return await fetch_stackexchange_data(url)
    else:
        raise ValueError("Unsupported platform")
