import os
import shutil
from datetime import datetime
from typing import Dict, Any, List

import torch
import librosa
from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
from pydantic import BaseModel
from treatment_recommender import (
    load_treatment_model,
    predict_treatment_suggestions
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MODEL_ISSUE_DIR = os.getenv("MODEL_ISSUE_DIR", "./models/issue_classifier_roberta")
MODEL_URGENCY_DIR = os.getenv("MODEL_URGENCY_DIR", "./models/urgency_classifier/checkpoints/checkpoint-876")
MODEL_SUMM_DIR = os.getenv("MODEL_SUMM_DIR", "facebook/bart-large-cnn")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "openai/whisper-small")
MODEL_TREATMENT_DIR = os.getenv("MODEL_TREATMENT_DIR", "./models/treatment_recommender")

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
treatment_model = None
treatment_metadata = None

def top_k(scores: List[Dict[str, Any]], k=3):
    scores_sorted = sorted(scores, key=lambda x: x["score"], reverse=True)
    return [{"label": s["label"], "score": float(s["score"])} for s in scores_sorted[:k]]

def clean_text(text: str) -> str:
    return " ".join(str(text).strip().split())

def format_label(label: str) -> str:
    return " ".join(part.capitalize() for part in str(label or "unknown").split("_") if part) or "Unknown"

def build_result_summary(issue_label: str, urgency_label: str, summary: str) -> str:
    issue = format_label(issue_label)
    urgency = format_label(urgency_label).lower()
    clean_summary = clean_text(summary or "")

    if not clean_summary:
        return f"{issue} was identified with {urgency} urgency."
    return f"{issue} was identified with {urgency} urgency. {clean_summary}"

@app.on_event("startup")
def load_models():
    global asr, issue_clf, urgency_clf, summarizer, treatment_model, treatment_metadata
    try:
        print("Loading ASR model...")
        asr = pipeline("automatic-speech-recognition", model=WHISPER_MODEL, device=device)
        print("[OK] ASR model loaded")
    except Exception as e:
        print(f"Error loading ASR: {e}")
        asr = None

    try:
        print("Loading issue classifier...")
        issue_clf = pipeline(
            "text-classification",
            model=MODEL_ISSUE_DIR,
            tokenizer=MODEL_ISSUE_DIR,
            top_k=None,
            device=device,
        )
        print("[OK] Issue classifier loaded")
    except Exception as e:
        print(f"Error loading issue classifier: {e}")
        issue_clf = None

    try:
        print("Loading urgency classifier...")
        urgency_clf = pipeline(
            "text-classification",
            model=MODEL_URGENCY_DIR,
            tokenizer=MODEL_URGENCY_DIR,
            top_k=None,
            device=device,
        )
        print("[OK] Urgency classifier loaded")
    except Exception as e:
        print(f"Error loading urgency classifier: {e}")
        urgency_clf = None

    try:
        print("Loading summarizer...")
        summarizer = pipeline(
            "summarization",
            model=MODEL_SUMM_DIR,
            tokenizer=MODEL_SUMM_DIR,
            framework="pt",
            device=device,
        )
        print("[OK] Summarizer loaded")
    except Exception as e:
        print(f"Error loading summarizer: {e}")
        summarizer = None

    try:
        treatment_model, treatment_metadata = load_treatment_model(MODEL_TREATMENT_DIR)
        if treatment_model is not None:
            print(f"[OK] Treatment recommender loaded from {MODEL_TREATMENT_DIR}")
        else:
            print("Treatment recommender not found. Using rule fallback.")
    except Exception as e:
        print(f"Error loading treatment recommender: {e}")
        treatment_model = None
        treatment_metadata = None

@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    try:
        # Save uploaded audio temporarily
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{ts}_{file.filename}"
        audio_path = os.path.join(UPLOAD_DIR, filename)

        with open(audio_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Load audio using librosa (handles various formats)
        audio_data, sr = librosa.load(audio_path, sr=16000)
        print(f"Audio loaded: shape={audio_data.shape}, sr={sr}, duration={len(audio_data)/sr:.2f}s")
        
        # 1) ASR - Whisper expects numpy array directly when sr=16000
        transcript = ""
        try:
            if asr:
                print(f"Running ASR on audio...")
                # Pass numpy array directly (librosa already resampled to 16kHz)
                trans = asr(audio_data)
                transcript = clean_text(trans.get("text", ""))
        except Exception as e:
            print(f"ASR Error: {e}")
            transcript = ""

        # 2) Issue classification
        issue_top3 = []
        issue_label = "UNKNOWN"
        try:
            if transcript and issue_clf:
                issue_scores = issue_clf(transcript)[0]
                issue_top3 = top_k(issue_scores, k=3)
                issue_label = issue_top3[0]["label"] if issue_top3 else "UNKNOWN"
        except Exception as e:
            print(f"Issue classification error: {e}")

        # 3) Urgency classification
        urgency_top3 = []
        urgency_label = "UNKNOWN"
        try:
            if transcript and urgency_clf:
                urg_scores = urgency_clf(transcript)[0]
                urgency_top3 = top_k(urg_scores, k=3)
                urgency_label = urgency_top3[0]["label"] if urgency_top3 else "UNKNOWN"
        except Exception as e:
            print(f"Urgency classification error: {e}")

        # 4) Summary
        summary = transcript or "No transcript available"
        try:
            if transcript and summarizer and len(transcript.split()) > 20:
                summary = summarizer(transcript, max_length=48, min_length=18, do_sample=False)[0]["summary_text"]
        except Exception as e:
            print(f"Summarization error: {e}")

        result_summary = build_result_summary(issue_label, urgency_label, summary)
        treatment_result = predict_treatment_suggestions(
            treatment_model,
            treatment_metadata,
            transcript,
            issue_label,
            urgency_label
        )
        treatment_suggestions = treatment_result["treatment_suggestions"]

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
            "result_summary": result_summary,
            "treatment_suggestions": treatment_suggestions,
            "treatment_profile": treatment_result["treatment_profile"],
            "treatment_model_used": treatment_result["treatment_model_used"],
            "treatment_model_confidence": treatment_result["treatment_model_confidence"],
            "treatment_training_mode": treatment_result["treatment_training_mode"],
        }
    except Exception as e:
        print(f"Analyze voice error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "message": "Failed to analyze audio file"
        }

class TextRequest(BaseModel):
    text: str

@app.post("/analyze-text")
async def analyze_text(request: TextRequest):
    try:
        transcript = clean_text(request.text)
        
        # 2) Issue classification
        issue_top3 = []
        issue_label = "UNKNOWN"
        try:
            if transcript and issue_clf:
                issue_scores = issue_clf(transcript)[0]
                issue_top3 = top_k(issue_scores, k=3)
                issue_label = issue_top3[0]["label"] if issue_top3 else "UNKNOWN"
        except Exception as e:
            print(f"Issue classification error: {e}")

        # 3) Urgency classification
        urgency_top3 = []
        urgency_label = "UNKNOWN"
        try:
            if transcript and urgency_clf:
                urg_scores = urgency_clf(transcript)[0]
                urgency_top3 = top_k(urg_scores, k=3)
                urgency_label = urgency_top3[0]["label"] if urgency_top3 else "UNKNOWN"
        except Exception as e:
            print(f"Urgency classification error: {e}")

        # 4) Summary
        summary = transcript or "No transcript available"
        try:
            if transcript and summarizer and len(transcript.split()) > 20:
                summary = summarizer(transcript, max_length=48, min_length=18, do_sample=False)[0]["summary_text"]
        except Exception as e:
            print(f"Summarization error: {e}")

        result_summary = build_result_summary(issue_label, urgency_label, summary)
        treatment_result = predict_treatment_suggestions(
            treatment_model,
            treatment_metadata,
            transcript,
            issue_label,
            urgency_label
        )
        treatment_suggestions = treatment_result["treatment_suggestions"]

        return {
            "transcript": transcript,
            "issue_label": issue_label,
            "issue_top3": issue_top3,
            "urgency_label": urgency_label,
            "urgency_top3": urgency_top3,
            "summary": summary,
            "result_summary": result_summary,
            "treatment_suggestions": treatment_suggestions,
            "treatment_profile": treatment_result["treatment_profile"],
            "treatment_model_used": treatment_result["treatment_model_used"],
            "treatment_model_confidence": treatment_result["treatment_model_confidence"],
            "treatment_training_mode": treatment_result["treatment_training_mode"],
        }
    except Exception as e:
        print(f"Analyze text error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "message": "Failed to analyze text"
        }
