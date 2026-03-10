import os
import json
import shutil
from datetime import datetime
from typing import Dict, Any, List

import torch
import librosa
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MODEL_ISSUE_DIR = os.getenv("MODEL_ISSUE_DIR", "../models/issue_classifier_roberta")
MODEL_URGENCY_DIR = os.getenv("MODEL_URGENCY_DIR", "../models/urgency_classifier/checkpoints/checkpoint-876")
MODEL_SUMM_DIR = os.getenv("MODEL_SUMM_DIR", "facebook/bart-large-cnn")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "openai/whisper-small")

app = FastAPI(title="ACT-CS AI Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = 0 if torch.cuda.is_available() else -1

asr = None
issue_clf = None
urgency_clf = None
summarizer = None

def top_k(scores: List[Dict[str, Any]], k=3):
    scores_sorted = sorted(scores, key=lambda x: x["score"], reverse=True)
    return [{"label": s["label"], "score": float(s["score"])} for s in scores_sorted[:k]]

def clean_text(text: str) -> str:
    return " ".join(str(text).strip().split())

@app.on_event("startup")
def load_models():
    global asr, issue_clf, urgency_clf, summarizer
    try:
        asr = pipeline("automatic-speech-recognition", model=WHISPER_MODEL, device=device)
    except Exception as e:
        print(f"Error loading ASR model: {e}")
        asr = None

    try:
        issue_clf = pipeline(
            "text-classification",
            model=MODEL_ISSUE_DIR,
            tokenizer=MODEL_ISSUE_DIR,
            top_k=None,
            device=device,
        )
    except Exception as e:
        print(f"Error loading issue classifier: {e}")
        print(f"Attempting to load from local path...")
        try:
            from transformers import AutoModelForSequenceClassification, AutoTokenizer
            model = AutoModelForSequenceClassification.from_pretrained(MODEL_ISSUE_DIR)
            tokenizer = AutoTokenizer.from_pretrained(MODEL_ISSUE_DIR)
            issue_clf = pipeline(
                "text-classification",
                model=model,
                tokenizer=tokenizer,
                top_k=None,
                device=device,
            )
        except Exception as e2:
            print(f"Failed to load issue classifier: {e2}")
            issue_clf = None

    try:
        urgency_clf = pipeline(
            "text-classification",
            model=MODEL_URGENCY_DIR,
            tokenizer=MODEL_URGENCY_DIR,
            top_k=None,
            device=device,
        )
    except Exception as e:
        print(f"Error loading urgency classifier: {e}")
        urgency_clf = None

    try:
        summarizer = pipeline(
            "summarization",
            model=MODEL_SUMM_DIR,
            tokenizer=MODEL_SUMM_DIR,
            device=device,
        )
    except Exception as e:
        print(f"Error loading summarizer: {e}")
        summarizer = None

@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    try:
        # Save uploaded audio temporarily
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{ts}_{file.filename}"
        audio_path = os.path.join(UPLOAD_DIR, filename)

        with open(audio_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Load audio using librosa (handles various formats without FFmpeg)
        audio_data, sr = librosa.load(audio_path, sr=16000)
        
        # 1) ASR - pass numpy array directly to Whisper
        try:
            # Whisper accepts numpy arrays directly at 16kHz
            trans = asr(audio_data)
            transcript = clean_text(trans.get("text", ""))
        except Exception as e:
            print(f"ASR Error: {e}")
            transcript = ""

        # 2) Issue classification
        try:
            if transcript and issue_clf:
                issue_scores = issue_clf(transcript)[0]
                issue_top3 = top_k(issue_scores, k=3)
                issue_label = issue_top3[0]["label"] if issue_top3 else "UNKNOWN"
            else:
                issue_top3 = []
                issue_label = "UNKNOWN"
        except Exception as e:
            print(f"Issue classification error: {e}")
            issue_top3 = []
            issue_label = "UNKNOWN"

        # 3) Urgency classification
        try:
            if transcript and urgency_clf:
                urg_scores = urgency_clf(transcript)[0]
                urgency_top3 = top_k(urg_scores, k=3)
                urgency_label = urgency_top3[0]["label"] if urgency_top3 else "UNKNOWN"
            else:
                urgency_top3 = []
                urgency_label = "UNKNOWN"
        except Exception as e:
            print(f"Urgency classification error: {e}")
            urgency_top3 = []
            urgency_label = "UNKNOWN"

        # 4) Summary
        try:
            if transcript and summarizer:
                if len(transcript.split()) > 20:  # Only summarize if transcript is long enough
                    summary = summarizer(transcript, max_length=48, min_length=18, do_sample=False)[0]["summary_text"]
                else:
                    summary = transcript
            else:
                summary = transcript or "No transcript available"
        except Exception as e:
            print(f"Summarization error: {e}")
            summary = transcript or "No transcript available"

        # Cleanup temporary files
        try:
            os.remove(audio_path)
        except:
            pass

        return {
            "audio_filename": filename,
            "transcript": transcript,
            "issue_label": issue_label,
            "issue_top3": issue_top3,
            "urgency_label": urgency_label,
            "urgency_top3": urgency_top3,
            "summary": summary,
        }
    except Exception as e:
        print(f"Analyze voice error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "message": "Failed to analyze audio file"
        }
