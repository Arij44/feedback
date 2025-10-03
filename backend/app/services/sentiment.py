from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch

# Load model once at startup
model_path = "app/services/sentiment"  
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)

# Use GPU if available
device = 0 if torch.cuda.is_available() else -1

sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model=model,
    tokenizer=tokenizer,
    device=device
)

def analyze_sentiments(comments: list[str]) -> dict:
    if not comments:
        return {
            "counts": {"positive": 0, "neutral": 0, "negative": 0},
            "labels": []
        }

    inputs = tokenizer(
        comments,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=128
    )

    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
    label_ids = probs.argmax(dim=1).tolist()

    raw_labels = [model.config.id2label[i] for i in label_ids]
    label_map = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
    mapped_labels = [label_map.get(l, "neutral") for l in raw_labels]

    counts = {"positive": 0, "neutral": 0, "negative": 0}
    for label in mapped_labels:
        counts[label] += 1

    return {
        "counts": counts,
        "labels": mapped_labels
    }

