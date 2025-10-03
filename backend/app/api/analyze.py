from pathlib import Path as FilePath  
from fastapi import APIRouter, HTTPException, Depends, Request, Path as FastAPIPath

from ..models.analyze import AnalyzeRequest, AnalyzeResponse
from ..services.fetch_post import fetch_post_data
from ..services.sentiment import analyze_sentiments
from ..services.topic import analyze_topics
from pydantic import ValidationError
from app.db.mongo import db
from app.auth import get_current_user
from bson import ObjectId
from langdetect import detect, DetectorFactory, LangDetectException
DetectorFactory.seed = 0  # for deterministic results

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_post(req: AnalyzeRequest, user: dict = Depends(get_current_user)):
    print("Received /analyze POST request:", req)

    # 0. Check for existing analysis
    existing = db["posts"].find_one({"url": req.url, "user_id": user.get("uid")})
    if existing:
        print("⚠️ Post already analyzed by this user. Returning existing result.")
        return AnalyzeResponse(
            platform=existing.get("platform", ""),
            post=existing.get("post", {}),
            comments=existing.get("comments", []),
            sentiment=existing.get("sentiment", {}),
            topics=existing.get("topics", []),
            postId=str(existing.get("_id"))
        )


   # 1. Fetch post and comments
    data = await fetch_post_data(req.url)
    post = data["post"]
    post["id"] = str(post["id"])
    print("🔎 fetch_post_data returned post fields:", list(post.keys()))


    comments = data["comments"]

    # Filter only English comments
    filtered_comments = []
    for comment in comments:
        text = comment.get("text", "")
        if not text.strip():
            continue
        try:
            lang = detect(text)
            if lang == "en":
                filtered_comments.append(comment)
        except LangDetectException:
            # If detection fails, skip comment
            continue
    comments = filtered_comments

    platform = data["platform"]

    print("🔍 Extracted post object:", post)


    # 2. Sentiment analysis 
    comment_texts = [c["text"] for c in comments]
    sentiment_result = analyze_sentiments(comment_texts)
    sentiment_counts = sentiment_result["counts"]
    sentiment_labels = sentiment_result["labels"]

# Attach sentiment label to each comment
    for i, label in enumerate(sentiment_labels):
        comments[i]["sentiment"] = label
 


    # 3. Topic modeling
    topics = analyze_topics(comment_texts)
    print("🔍 topics returned:", topics)
    if "results" not in topics:
        raise ValueError("Missing 'results' key in topic analysis output")

    # 4. Store in MongoDB
    try:
        document = {
            "platform": platform,
            "post": post,
            "url": req.url,
            "comments": comments,
            "sentiment": sentiment_counts,
            "topics": topics["results"],
            "user_id": user.get("uid"),
        }
        result =  db["posts"].insert_one(document)
        post_id_str = str(result.inserted_id)
        print(f"Analysis saved to MongoDB with ID: {post_id_str}")
    except Exception as e:
        print("Failed to save to MongoDB:", e)
        raise HTTPException(status_code=500, detail="Database insert error")

    # 5. Return final response
    print("Returning successful analysis response")
    try:
        response_obj = AnalyzeResponse(
            platform=platform,
            post=post,
            comments=comments,
            sentiment=sentiment_counts,
            topics=topics["results"],
            postId=post_id_str,
        )
    except ValidationError as ve:
        print("Pydantic validation errors:", ve.json())
        raise HTTPException(status_code=500, detail="Response validation error")

    return {**response_obj.dict(), "postId": post_id_str}


@router.get("/analyze/{post_id}", response_model=AnalyzeResponse)
async def get_analysis(post_id: str = FastAPIPath(..., description="ID of the post to retrieve"), 
                       user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(post_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid post ID format")

    try:
        document = db["posts"].find_one({"_id": oid, "user_id": user.get("uid")})
    except Exception as e:
        print(f"MongoDB query failed: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    if not document:
        raise HTTPException(status_code=404, detail="Post not found")

    post_data = document.get("post", {})
    if "photo_url" not in post_data:
        post_data["photo_url"] = ""
    comments_data = document.get("comments", [])
    sentiment = document.get("sentiment", {})
    topics = document.get("topics", [])

    return AnalyzeResponse(
        platform=document.get("platform", ""),
        post=post_data,
        comments=comments_data,
        sentiment=sentiment,
        topics=topics,
        postId=str(document.get("_id"))
    )
