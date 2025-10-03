import asyncio
import aiohttp
import json
import os
from urllib.parse import urlparse
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT")
BASE_URL = "https://oauth.reddit.com"

HEADERS = {
    "User-Agent": REDDIT_USER_AGENT,
    "Authorization": f"Bearer {os.getenv('REDDIT_ACCESS_TOKEN')}"  
}

async def fetch_access_token(session: aiohttp.ClientSession) -> str:
    async with session.post(
        "https://www.reddit.com/api/v1/access_token",
        auth=aiohttp.BasicAuth(REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET),
        data={"grant_type": "client_credentials"}
    ) as response:
        data = await response.json()
        return data["access_token"]

async def extract_post_id(url: str) -> str | None:
    try:
        parsed_url = urlparse(url)
        path_parts = parsed_url.path.strip("/").split("/")
        if "comments" in path_parts and len(path_parts) > 3:
            return path_parts[3]
        logger.warning(f"Invalid Reddit URL format: {url}")
        return None
    except Exception as e:
        logger.error(f"URL parsing failed: {e}")
        return None

async def fetch_reddit_post_comments(session: aiohttp.ClientSession, url: str, comment_limit: int = 50) -> list[dict]:
    post_id = await extract_post_id(url)
    if not post_id:
        return []

    try:
        async with session.get(f"{BASE_URL}/comments/{post_id}", headers=HEADERS) as response:
            if response.status != 200:
                logger.warning(f"Failed to fetch post {post_id}: Status {response.status}")
                return []
            data = await response.json()

        post = data[0]["data"]["children"][0]["data"]
        comments = data[1]["data"]["children"]

        flat_comments = []
        for c in comments[:min(comment_limit, len(comments))]:
            if c["kind"] != "t1":
                continue
            comment_text = c["data"].get("body", "").strip()
            if not comment_text:
                continue
            flat_comments.append({
                "comment_text": comment_text,
                "platform": "reddit",
                "post_id": post_id,
                "post_title": post.get("title", "Untitled"),
                "post_url": url,
                "timestamp": post.get("created_utc", 0)
            })

        return flat_comments

    except Exception as e:
        logger.error(f"Error fetching post {post_id}: {e}")
        return []

async def fetch_all_reddit_comments(urls: list[str], comment_limit: int = 50) -> list[dict]:
    async with aiohttp.ClientSession() as session:
        token = await fetch_access_token(session)
        HEADERS["Authorization"] = f"Bearer {token}"

        semaphore = asyncio.Semaphore(10)
        async def bounded_fetch(url):
            async with semaphore:
                return await fetch_reddit_post_comments(session, url, comment_limit)

        tasks = [bounded_fetch(url) for url in urls]
        all_comments_nested = await asyncio.gather(*tasks)
        all_comments = [comment for group in all_comments_nested for comment in group]
        return all_comments

def save_to_jsonl(data: list[dict], path: str) -> None:
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            for record in data:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        logger.info(f"✅ Saved {len(data)} comments to {path}")
    except Exception as e:
        logger.error(f"Failed to save JSONL: {e}")

if __name__ == "__main__":
    reddit_post_urls = [
        
        "https://www.reddit.com/r/webscraping/comments/1ivijdi/any_product_making_good_money_with_webscraping/",
        "https://www.reddit.com/r/CodingHelp/comments/1iwcsc7/what_laptop_should_i_get_if_i_would_like_to_start/",
        "https://www.reddit.com/r/Futurology/comments/1hebeoz/what_do_you_think_is_going_to_be_the_next_big/",
        "https://www.reddit.com/r/RemoteJobHunters/comments/1j2e1or/why_job_hunting_on_indeed_linkedin_feels/",
        "https://www.reddit.com/r/webscraping/comments/1ix4d5a/best_tools_for_large_scale_web_scraping/",
        "https://www.reddit.com/r/MachineLearning/comments/1iy7t3z/most_underrated_machine_learning_algorithms/",
        "https://www.reddit.com/r/learnprogramming/comments/1iz0f8k/how_to_stay_motivated_while_learning_to_code/",
        "https://www.reddit.com/r/softwareengineering/comments/1j09a9f/what_are_the_best_practices_for_scaling_microservices/",
        "https://www.reddit.com/r/datascience/comments/1j0bx5l/is_python_still_the_best_language_for_data_science/",
        "https://www.reddit.com/r/cybersecurity/comments/1j0cf6m/what_are_the_biggest_cybersecurity_threats_in_2025/",
        "https://www.reddit.com/r/breakingbad/comments/1j6szgn/is_this_a_breaking_bad_reference/",
        "https://www.reddit.com/r/AskReddit/comments/157wr2c/whats_the_most_mindblowing_fun_fact_you_know/",
        "https://www.reddit.com/r/ScientificNutrition/comments/g6n56t/hot_off_the_presses_new_study_compares_filtered/",
        "https://www.reddit.com/r/developersIndia/comments/1bpp9k4/job_market_disruption_due_to_ai_and_failing/",
        "https://www.reddit.com/r/ClimateOffensive/comments/1dkorpf/as_an_individual_what_do_you_feel_is_the_most/",
        "https://www.reddit.com/r/collapse/comments/125g1c1/a_critique_of_the_wapo_article_why_climate/",
        "https://www.reddit.com/r/InternetIsBeautiful/comments/qontvo/electricitymap_is_a_live_visualization_of_where/",
        "https://www.reddit.com/r/AskEngineers/comments/mmhfn0/where_do_you_personally_draw_the_line_when_it/",
        "https://www.reddit.com/r/sciencememes/comments/1j77u6d/does_a_deterministic_universe_contradict_free_will/",
        "https://www.reddit.com/r/booksuggestions/comments/1h1bsvp/wwii_book_that_is_not_well_known_or_is_a_unique/",
        "https://www.reddit.com/r/cscareerquestions/comments/1aisjj4/whats_do_you_think_will_be_the_next_big_tech_wave/",
        "https://www.reddit.com/r/Futurology/comments/1bsmecr/when_will_we_see_more_quantum_computing/",
        "https://www.reddit.com/r/TrueAskReddit/comments/ck232h/has_social_media_done_more_harm_or_good_to_society/",
        "https://www.reddit.com/r/healthcare/comments/1iz0y7j/the_future_of_healthcare_in_america_whats_at_stake/",
        "https://www.reddit.com/r/AskAnAmerican/comments/1dny150/what_was_it_personally_like_immediately_after/",
        "https://www.reddit.com/r/asklatinamerica/comments/122qnfb/what_is_your_most_controversial_political_opinion/",
        "https://www.reddit.com/r/changemyview/comments/9gyofb/cmv_climate_change_is_a_myth_crafted_to_distract/",
        "https://www.reddit.com/r/changemyview/comments/1dou01z/cmv_democracy_cannot_exist_in_a_world_where_media/",
        "https://www.reddit.com/r/changemyview/comments/1gquzj/i_dont_believe_lobbying_is_ethically_or_morally/",
        "https://www.reddit.com/r/LateStageCapitalism/comments/1dch3t1/the_left_has_the_only_actual_solution_to/"
  
    ]

    save_path = "data/processed/comments_unlabeled.jsonl"
    all_comments = asyncio.run(fetch_all_reddit_comments(reddit_post_urls))
    save_to_jsonl(all_comments, save_path)
