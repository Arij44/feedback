from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import auth
from app.db import get_database
from app.auth import verify_token
from bson import ObjectId
from typing import List
from app.models.home import FeedbackItem, HomeResponse, Stats, PostSentiment

router = APIRouter()

@router.get("/home")
async def get_home_data(request: Request, db=Depends(get_database), user=Depends(verify_token)):
    print("/api/home endpoint hit!")
    print("User UID from token:", user["uid"])

    user_id = user["uid"]

    # Get user profile
    user_doc = await db.users.find_one({"uid": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    display_name = user_doc.get("display_name") or user.get("email")
    photo_url = user_doc.get("photoURL") or user.get("picture") or ""
    # Add user profile info to response
    # photo_url is already set above; make sure it's a string
    if not isinstance(photo_url, str):
        photo_url = str(photo_url)

    # Get posts for this user
    posts = await db.posts.find({"user_id": user_id}).sort("created_at", -1).to_list(length=100)
    total_posts = len(posts)
    all_comments = [comment for post in posts for comment in post.get("comments", [])]
    total_comments = len(all_comments)

    # Overall sentiment
    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    for comment in all_comments:
        sentiment = comment.get("sentiment", "").lower()
        if sentiment in sentiment_counts:
            sentiment_counts[sentiment] += 1

    most_common_sentiment = (
        max(sentiment_counts, key=sentiment_counts.get)
        if total_comments > 0 else "neutral"
    )

    # Sentiment breakdown per post (for bar chart)
    post_sentiments: List[PostSentiment] = []
    for p in posts:
        pid = str(p["_id"])
        post_data = p.get("post", {})
        title = post_data.get("text", "[No text]").split("\n")[0]
        author = post_data.get("author", "Unknown")
        avatar = post_data.get("avatar", None)
        breakdown = count_sentiments(p.get("comments", []))
        post_sentiments.append(PostSentiment(
            id=pid,
            title=title,
            author=post_data.get("auhtor", "Unknown"),
            avatar=avatar or "",
            positive=breakdown["positive"],
            neutral=breakdown["neutral"],
            negative=breakdown["negative"],
        ))

    # Recent Posts
    recent = []
    for post in posts[:6]:
        post_data = post.get("post", {})
        post_text = post_data.get("text", "[No text]")
        post_author = post_data.get("author", "Unknown")
        post_sentiment = infer_post_sentiment(post)
        post_comments = post.get("comments", [])

        recent.append({
            "id": str(post.get("_id", ObjectId())),
            "text": post_text,
            "author": post_author,
            "avatar": avatar,
            "sentiment": post_sentiment,
            "emoji": sentiment_emoji(post_sentiment),
            "sentimentBreakdown": count_sentiments(post_comments)
        })

    return HomeResponse(
        displayName=display_name,
        photoURL=photo_url,
        stats=Stats(
            posts=total_posts,
            comments=total_comments,
            sentiment=most_common_sentiment.capitalize()
        ),
        recentFeedback=[FeedbackItem(**r) for r in recent],
        postSentiments=post_sentiments  # used on frontend bar chart
    )

def infer_post_sentiment(post):
    comment_sentiments = [c.get("sentiment", "neutral").lower() for c in post.get("comments", [])]
    counts = {"positive": 0, "neutral": 0, "negative": 0}
    for s in comment_sentiments:
        if s in counts:
            counts[s] += 1
    if not comment_sentiments:
        return "neutral"
    return max(counts, key=counts.get)

def sentiment_emoji(sentiment):
    mapping = {
        "positive": "😊",
        "neutral": "😐",
        "negative": "😞"
    }
    return mapping.get(sentiment.lower(), "😐")

def count_sentiments(comments):
    counts = {"positive": 0, "neutral": 0, "negative": 0}
    for c in comments:
        sentiment = c.get("sentiment", "neutral").lower()
        if sentiment in counts:
            counts[sentiment] += 1
    return counts
