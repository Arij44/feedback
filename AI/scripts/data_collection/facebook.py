from playwright.sync_api import sync_playwright
import json, time
import json, urllib.parse, requests
import os
from datetime import datetime

def scrape_facebook(post_url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto(post_url)

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

        # GraphQL request
        try:
            scroll_container = page.locator("div.xb57i2i.x1q594ok.x5lxg6s.x78zum5.xdt5ytf.x6ikm8r.x1ja2u2z.x1pq812k.x1rohswg.xfk6m8.x1yqm8si.xjx87ck.xx8ngbg.xwo3gff.x1n2onr6.x1oyok0e.x1odjw0f.x1iyjqo2.xy5w88m")

            previous_height = scroll_container.evaluate("el => el.scrollHeight")
            graphql_request = None
            while True:
                try:
                    with page.expect_request(
                        lambda request: request.url.startswith("https://www.facebook.com/api/graphql/") 
                        and request.method == "POST"
                        and "CommentsListComponentsPaginationQuery" in request.headers.get("x-fb-friendly-name", ""),
                        timeout=500
                    ) as req_info:
                        scroll_container.evaluate("el => el.scrollBy(0, 10000)")
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

        if graphql_request:
            return {
                "post_url": post_url,
                "username": username,
                "post_text": post_text,
                "post_img": post_img,
                "profile_img": profile_img,
                "graphql_url": graphql_request.url,
                "graphql_headers": graphql_request.headers,
                "graphql_body": graphql_request.post_data
            }
        else:
            # fallback: try to extract first comments from page
            return {
                "post_url": post_url,
                "username": username,
                "post_text": post_text,
                "post_img": post_img,
                "profile_img": profile_img,
                "comments": [],
                "fallback": True
            }





def fetch_comments_from_graphql(graphql_url, graphql_headers, graphql_body, post_url):
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-asbd-id": graphql_headers.get("x-asbd-id", "129477"),
        "x-fb-friendly-name": graphql_headers.get("x-fb-friendly-name", "CommentsListComponentsPaginationQuery"),
        "x-fb-lsd": graphql_headers.get("x-fb-lsd", ""),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
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

            # debug info
            print("Raw response preview:\n", response.text[:300])

            data = json.loads(response.text.split("\n")[0])

            edges = data['data']['node']['comment_rendering_instance_for_feed_location']['comments']['edges']
            comments.extend([
                {
                    'author': edge['node']['author']['name'],
                    'text': edge['node']['body']['text'],
                    'author_img': edge['node']['author']['profile_picture_depth_0']['uri']
                }
                for edge in edges if edge['node']['body']
            ])
            page_info = data['data']['node']['comment_rendering_instance_for_feed_location']['comments']['page_info']
            if not page_info['has_next_page']:
                break
            variables["commentsAfterCursor"] = page_info['end_cursor']
        except json.JSONDecodeError as e:
            print(" Decode Error:", e)
            print(" (bad) response:\n", response.text[:300])
            break
        except Exception as e:
            print("Unexpected error:", e)
            break

    return comments



result = scrape_facebook("https://www.facebook.com/ImaweirdobutImrealtho/posts/pfbid0FG5uYcHMvhTu2q1meeaUSFdpWz54vp5gLNg43yNYBxns2WjfLJJohoy2NGx3B5xil")

if "graphql_url" in result:
    comments = fetch_comments_from_graphql(
        result["graphql_url"],
        result["graphql_headers"],
        result["graphql_body"],
        result["post_url"]
    )
    result["comments"] = comments
    print(f"Extracted {len(comments)} comments.")
    for c in comments[:5]:  
       print(f"- {c['author']}: {c['text'][:100]}")

else:
    print("Fallback mode — no GraphQL comments")

# === SAVE TO JSONL ===
output_path = "data/processed/facebook_comments.jsonl"
timestamp = time.time()
post_id = result["post_url"].split("/")[-1]

with open(output_path, "w", encoding="utf-8") as f:
    for c in result["comments"]:
        record = {
            "comment_text": c["text"],
            "platform": "facebook",
            "post_id": post_id,
            "post_title": result["post_text"] or "Untitled",
            "post_url": result["post_url"],
            "timestamp": timestamp
        }
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

print(f"Saved {len(result['comments'])} comments to {output_path}")
