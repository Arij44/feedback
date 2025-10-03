import asyncio
from playwright.async_api import async_playwright
import time
import json
from datetime import datetime

async def scrape_instagram_post(post_url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        await page.goto(post_url)

        print("Waiting for post to load...")
        await page.wait_for_timeout(3000)

        # Extract author name
        try:
            author_selector = 'span[class*="x1i10hfl"]'
            author = await page.locator(author_selector).first.inner_text()
        except:
            author = "Unknown"

        # Extract author profile image
        try:
            avatar_selector = 'img[class*="xnz67gz"]'
            profile_img = await page.locator(avatar_selector).first.get_attribute("src")
        except:
            profile_img = None

        # Extract post text
        try:
            post_text_selector = 'span[class="xt0psk2"]'
            post_text = await page.locator(post_text_selector).first.inner_text()
        except:
            post_text = "No text"

        # Extract comments
        try:
            comment_blocks = page.locator('div[class*="x9f619"]').all()
            comments = []

            for block in await comment_blocks:
                try:
                    author = await block.locator('h3, span').first.inner_text()
                    text = await block.locator('span').nth(1).inner_text()
                    avatar_img = await block.locator('img').first.get_attribute("src")
                    comments.append({
                        "author": author,
                        "text": text,
                        "author_img": avatar_img
                    })
                except:
                    continue
        except:
            comments = []

        await browser.close()

        # Compose data
        post_id = post_url.strip("/").split("/")[-1]
        timestamp = time.time()
        structured = {
            "platform": "instagram",
            "post_id": post_id,
            "post_url": post_url,
            "post_title": post_text[:60] if post_text else "Instagram post",
            "timestamp": timestamp,
            "author": author,
            "profile_img": profile_img,
            "comments": comments
        }

        return structured


async def main():
    url = "https://www.instagram.com/p/DLNkDTGRWip/"  
    data = await scrape_instagram_post(url)

    print(f" Author: {data['author']}")
    print(f" Text: {data['post_title']}")
    print(f" Profile image: {data['profile_img']}")
    print(f" Found {len(data['comments'])} comments.")

    # Save in JSONL format
    output_path = "data/processed/instagram_comments.jsonl"
    with open(output_path, "a", encoding="utf-8") as f:
        for comment in data["comments"]:
            json_line = {
                "comment_text": comment["text"],
                "platform": "instagram",
                "post_id": data["post_id"],
                "post_title": data["post_title"],
                "post_url": data["post_url"],
                "timestamp": data["timestamp"],
                "author": comment["author"],
                "author_img": comment["author_img"]
            }
            f.write(json.dumps(json_line, ensure_ascii=False) + "\n")

    print(f"Saved to {output_path}")


if __name__ == "__main__":
    asyncio.run(main())

