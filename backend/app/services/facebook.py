import json
import time
import urllib.parse
import requests
from datetime import datetime
from playwright.sync_api import sync_playwright
from concurrent.futures import ThreadPoolExecutor
import asyncio

# === SYNC FUNCTION ===
def scrape_facebook_post_sync(post_url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(post_url, timeout=60000)

        try:
            user_selector = "span.html-span.xdj266r.x14z9mp.xat24cr.x1lziwak.xexx8yu.xyri2b.x18d9i69.x1c1uobl.x1hl2dhg.x16tdsg8.x1vvkbs"
            username = page.locator(user_selector).first.inner_text()
        except:
            raise Exception("Username not found")

        try:
            text_selector = 'div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x1vvkbs.x126k92a'
            post_text = page.locator(text_selector).first.inner_text()
        except:
            post_text = None

        try:
            img_selector = 'img.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1ey2m1c.xds687c.x5yr21d.x10l6tqk.x17qophe.x13vifvy.xh8yej3.xl1xv1r'
            post_img = page.locator(img_selector).first.get_attribute("src")
        except:
            post_img = None

        try:
            profile_selector = 'image'
            profile_img = page.locator(profile_selector).first.get_attribute("xlink:href")
        except:
            profile_img = None

        # Attempt to capture GraphQL request
        graphql_request = None
        try:
            scroll_container = page.locator("div.xb57i2i.x1q594ok")
            previous_height = scroll_container.evaluate("el => el.scrollHeight")

            while True:
                try:
                    with page.expect_request(
                        lambda request: request.url.startswith("https://www.facebook.com/api/graphql/")
                        and "CommentsListComponentsPaginationQuery" in request.headers.get("x-fb-friendly-name", ""),
                        timeout=500
                    ) as req_info:
                        scroll_container.evaluate("el => el.scrollBy(0, 3000)")
                        graphql_request = req_info.value
                        break
                except:
                    new_height = scroll_container.evaluate("el => el.scrollHeight")
                    if new_height == previous_height:
                        break
                    previous_height = new_height
                    time.sleep(0.5)
        finally:
            browser.close()

        result = {
            "post_url": post_url,
            "username": username,
            "post_text": post_text,
            "post_img": post_img,
            "profile_img": profile_img,
        }

        if graphql_request:
            result.update({
                "graphql_url": graphql_request.url,
                "graphql_headers": graphql_request.headers,
                "graphql_body": graphql_request.post_data,
            })

        return result


def fetch_comments_from_graphql(graphql_url, graphql_headers, graphql_body, post_url):
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-asbd-id": graphql_headers.get("x-asbd-id", "129477"),
        "x-fb-friendly-name": graphql_headers.get("x-fb-friendly-name", "CommentsListComponentsPaginationQuery"),
        "x-fb-lsd": graphql_headers.get("x-fb-lsd", ""),
        "User-Agent": "Mozilla/5.0",
        "accept": "*/*",
        "referer": post_url,
    }

    body = urllib.parse.parse_qs(graphql_body)
    variables = json.loads(body["variables"][0])
    variables["commentsAfterCursor"] = None

    comments = []

    while True:
        try:
            body["variables"][0] = json.dumps(variables)
            encoded = urllib.parse.urlencode(body, doseq=True)
            response = requests.post(graphql_url, headers=headers, data=encoded)

            data = json.loads(response.text.split("\n")[0])
            edges = data['data']['node']['comment_rendering_instance_for_feed_location']['comments']['edges']
            comments.extend([
                {
                    "author": edge["node"]["author"]["name"],
                    "text": edge["node"]["body"]["text"],
                    "author_img": edge["node"]["author"]["profile_picture_depth_0"]["uri"]
                }
                for edge in edges if edge["node"]["body"]
            ])
            page_info = data['data']['node']['comment_rendering_instance_for_feed_location']['comments']['page_info']
            if not page_info['has_next_page']:
                break
            variables["commentsAfterCursor"] = page_info['end_cursor']
        except Exception as e:
            print("GraphQL fetch error:", e)
            break

    return comments


# === ASYNC WRAPPER FOR FASTAPI ===
executor = ThreadPoolExecutor()

async def scrape_facebook_post(post_url: str):
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(executor, scrape_facebook_post_sync, post_url)

    # if GraphQL present → fetch comments
    if "graphql_url" in data:
        comments = await loop.run_in_executor(
            executor,
            fetch_comments_from_graphql,
            data["graphql_url"],
            data["graphql_headers"],
            data["graphql_body"],
            data["post_url"]
        )
    else:
        comments = []

    post_id = post_url.split("/")[-1].split("?")[0]
    timestamp = datetime.utcnow().timestamp()

    return {
        "platform": "facebook",
        "post": {
            "id": post_id,
            "title": data.get("post_text", "")[:100],
            "author": data.get("username"),
            "profile_img": data.get("profile_img"),
            "timestamp": timestamp,
            "image": data.get("post_img")
        },
        "comments": [
            {
                "author": c["author"],
                "text": c["text"],
                "author_img": c["author_img"]
            }
            for c in comments
        ]
    }
