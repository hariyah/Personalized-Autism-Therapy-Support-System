import os
import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

# Keep Hugging Face on the PyTorch code path; TensorFlow is only used
# separately for the local emotion model below.
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("USE_FLAX", "0")

import numpy as np
import torch
import librosa
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from transformers import (
    pipeline,
    AutoModelForSequenceClassification,
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
)
from pydantic import BaseModel

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_BASE_DIR, "models")

UPLOAD_DIR = os.path.join(_BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MODEL_ISSUE_DIR = os.getenv("MODEL_ISSUE_DIR", os.path.join(_MODELS_DIR, "issue_classifier_roberta"))
MODEL_URGENCY_DIR = os.getenv("MODEL_URGENCY_DIR", os.path.join(_MODELS_DIR, "urgency_classifier", "checkpoints", "checkpoint-876"))
MODEL_SUMM_DIR = os.getenv("MODEL_SUMM_DIR", os.path.join(_MODELS_DIR, "summarization_t5", "checkpoints", "checkpoint-875"))
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "openai/whisper-small")

# Emotion Recognition (from PATSS) - minimal import to avoid tensorflow.python issues
TF_AVAILABLE = False
TF_ERROR = None
try:
    import tensorflow as tf  # noqa: F401
    TF_AVAILABLE = True
except Exception as e:
    TF_ERROR = str(e)

MODEL_EMOTION_PATH = os.path.join(_MODELS_DIR, "emotion_recognition", "densenet121.keras")
EMOTION_LABELS = ["Natural", "anger", "fear", "joy", "sadness", "surprise"]
emotion_model = None

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
zsc = None

ISSUE_LABELS = []
URGENCY_LABELS = ["low", "medium", "high"]

def top_k(scores: List[Dict[str, Any]], k=3):
    scores_sorted = sorted(scores, key=lambda x: x["score"], reverse=True)
    return [{"label": s["label"], "score": float(s["score"])} for s in scores_sorted[:k]]

def clean_text(text: str) -> str:
    return " ".join(str(text).strip().split())

# Mongoose Analysis schema expects urgencyLabel in ['low', 'medium', 'high']
VALID_URGENCY = frozenset({"low", "medium", "high"})

def normalize_urgency(label: str) -> str:
    if label and label.lower() in VALID_URGENCY:
        return label.lower()
    return "medium"

def resolve_ffmpeg_executable() -> str | None:
    ffmpeg_exe = shutil.which("ffmpeg")
    if ffmpeg_exe:
        return ffmpeg_exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None

def load_audio_for_librosa(path: str, target_sr: int = 16000):
    """Load audio with librosa; convert WebM/unsupported formats to WAV first."""
    path_lower = path.lower()
    need_convert = path_lower.endswith(".webm") or path_lower.endswith(".weba") or "webm" in path_lower
    wav_path = None
    if need_convert:
        try:
            ffmpeg_exe = resolve_ffmpeg_executable()
            if not ffmpeg_exe:
                raise RuntimeError("ffmpeg is required to convert WebM audio")
            wav_path = path + ".wav"
            subprocess.run(
                [ffmpeg_exe, "-y", "-i", path, wav_path],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                text=True,
            )
            path = wav_path
        except Exception as e:
            print(f"ffmpeg conversion failed: {e}")
            raise
    try:
        audio_data, sr = librosa.load(path, sr=target_sr)
        return audio_data, sr
    finally:
        if wav_path and os.path.isfile(wav_path):
            try:
                os.remove(wav_path)
            except Exception:
                pass

@app.on_event("startup")
def load_models():
    global asr, issue_clf, urgency_clf, summarizer, zsc, ISSUE_LABELS
    try:
        print("Loading ASR model...")
        asr = pipeline("automatic-speech-recognition", model=WHISPER_MODEL, device=device)
        print("[OK] ASR model loaded")
    except Exception as e:
        print(f"Error loading ASR: {e}")
        asr = None

    # Read issue labels from local config (used for zero-shot fallback)
    try:
        _cfg_path = os.path.join(MODEL_ISSUE_DIR, "config.json")
        if os.path.isfile(_cfg_path):
            with open(_cfg_path) as _f:
                _cfg = json.load(_f)
            ISSUE_LABELS = list(_cfg.get("id2label", {}).values())
    except Exception:
        pass
    if not ISSUE_LABELS:
        ISSUE_LABELS = [
            "aggression", "anxiety_meltdown", "daily_progress", "feeding_issue",
            "health_concern", "regression_social", "regression_speech",
            "repetitive_behavior", "routine_change", "school_concern",
            "self_injury", "sensory_overload", "sleep_issue",
        ]

    try:
        print("Loading issue classifier...")
        if os.path.isdir(MODEL_ISSUE_DIR):
            _path = Path(MODEL_ISSUE_DIR).resolve()
            _model = AutoModelForSequenceClassification.from_pretrained(str(_path), local_files_only=True)
            _tok = AutoTokenizer.from_pretrained(str(_path), local_files_only=True)
            issue_clf = pipeline(
                "text-classification",
                model=_model,
                tokenizer=_tok,
                top_k=None,
                device=device,
            )
            print("[OK] Issue classifier loaded (local)")
        else:
            print(f"Issue classifier path not found: {MODEL_ISSUE_DIR}")
            issue_clf = None
    except Exception as e:
        print(f"Issue classifier local weights missing, will use zero-shot fallback.")
        issue_clf = None

    try:
        print("Loading urgency classifier...")
        if os.path.isdir(MODEL_URGENCY_DIR):
            _path = Path(MODEL_URGENCY_DIR).resolve()
            _model = AutoModelForSequenceClassification.from_pretrained(str(_path), local_files_only=True)
            _tok = AutoTokenizer.from_pretrained(str(_path), local_files_only=True)
            urgency_clf = pipeline(
                "text-classification",
                model=_model,
                tokenizer=_tok,
                top_k=None,
                device=device,
            )
            print("[OK] Urgency classifier loaded (local)")
        else:
            print(f"Urgency classifier path not found: {MODEL_URGENCY_DIR}")
            urgency_clf = None
    except Exception as e:
        print(f"Urgency classifier local weights missing, will use zero-shot fallback.")
        urgency_clf = None

    # If either classifier failed, load a shared zero-shot model as fallback
    if issue_clf is None or urgency_clf is None:
        try:
            _zsc_model = "facebook/bart-large-mnli"
            print(f"Loading zero-shot classifier from hub ({_zsc_model})...")
            zsc = pipeline("zero-shot-classification", model=_zsc_model, device=device)
            print("[OK] Zero-shot classifier loaded (fallback for issue/urgency)")
        except Exception as e:
            print(f"Error loading zero-shot classifier: {e}")
            zsc = None

    try:
        print("Loading summarizer...")
        _hub_model = "facebook/bart-large-cnn"
        if os.path.isdir(MODEL_SUMM_DIR):
            _path = Path(MODEL_SUMM_DIR).resolve()
            try:
                _model = AutoModelForSeq2SeqLM.from_pretrained(str(_path), local_files_only=True)
                _tok = AutoTokenizer.from_pretrained(str(_path), local_files_only=True)
                summarizer = pipeline(
                    "summarization",
                    model=_model,
                    tokenizer=_tok,
                    framework="pt",
                    device=device,
                )
                print("[OK] Summarizer loaded (local)")
            except Exception as local_e:
                err_msg = str(local_e).lower()
                if "no file named" in err_msg or "pytorch_model" in err_msg or "safetensors" in err_msg:
                    print(f"Local summarizer missing weights in {MODEL_SUMM_DIR}. Falling back to hub.")
                else:
                    print(f"Local summarizer load failed: {local_e}; falling back to hub.")
                summarizer = pipeline(
                    "summarization",
                    model=_hub_model,
                    tokenizer=_hub_model,
                    framework="pt",
                    device=device,
                )
                print("[OK] Summarizer loaded (from hub)")
        else:
            print(f"Summarizer path not found: {MODEL_SUMM_DIR}, using hub: {_hub_model}")
            summarizer = pipeline(
                "summarization",
                model=_hub_model,
                tokenizer=_hub_model,
                framework="pt",
                device=device,
            )
            print("[OK] Summarizer loaded (from hub)")
    except Exception as e:
        print(f"Error loading summarizer: {e}")
        summarizer = None

    global emotion_model
    emotion_path_exists = os.path.isfile(MODEL_EMOTION_PATH)
    if TF_AVAILABLE and emotion_path_exists:
        try:
            print(f"Loading emotion model from {MODEL_EMOTION_PATH}...")
            emotion_model = tf.keras.models.load_model(MODEL_EMOTION_PATH)
            print("[OK] Emotion model loaded")
        except Exception as e:
            print(f"Error loading emotion model: {e}")
    else:
        if not emotion_path_exists:
            print(f"Emotion model not found at: {MODEL_EMOTION_PATH}")
        if not TF_AVAILABLE:
            print(f"TensorFlow not available. TF: False. {('Error: ' + TF_ERROR) if TF_ERROR else 'Install tensorflow to enable emotion recognition.'}")

    print("\n--- Startup Summary ---")
    print(f"  ASR (Whisper):       {'OK' if asr else 'UNAVAILABLE'}")
    print(f"  Issue classifier:    {'OK (local)' if issue_clf else ('OK (zero-shot)' if zsc else 'UNAVAILABLE')}")
    print(f"  Urgency classifier:  {'OK (local)' if urgency_clf else ('OK (zero-shot)' if zsc else 'UNAVAILABLE')}")
    print(f"  Summarizer:          {'OK' if summarizer else 'UNAVAILABLE'}")
    print(f"  Emotion model:       {'OK' if emotion_model else 'UNAVAILABLE'}")
    print("--- Ready ---\n")

@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    try:
        # Save uploaded audio temporarily
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{ts}_{file.filename}"
        audio_path = os.path.join(UPLOAD_DIR, filename)

        with open(audio_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Load audio (convert WebM to WAV via pydub if needed; librosa doesn't support WebM)
        audio_data, sr = load_audio_for_librosa(audio_path, target_sr=16000)
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
        issue_label = "general"
        try:
            if transcript and issue_clf:
                issue_scores = issue_clf(transcript)[0]
                issue_top3 = top_k(issue_scores, k=3)
                issue_label = issue_top3[0]["label"] if issue_top3 else "general"
            elif transcript and zsc and ISSUE_LABELS:
                r = zsc(transcript, ISSUE_LABELS)
                issue_top3 = [{"label": l, "score": float(s)} for l, s in zip(r["labels"][:3], r["scores"][:3])]
                issue_label = issue_top3[0]["label"] if issue_top3 else "general"
        except Exception as e:
            print(f"Issue classification error: {e}")

        # 3) Urgency classification (schema allows only 'low'|'medium'|'high')
        urgency_top3 = []
        urgency_label = "medium"
        try:
            if transcript and urgency_clf:
                urg_scores = urgency_clf(transcript)[0]
                urgency_top3 = top_k(urg_scores, k=3)
                raw = urgency_top3[0]["label"] if urgency_top3 else "medium"
                urgency_label = normalize_urgency(raw)
            elif transcript and zsc:
                r = zsc(transcript, URGENCY_LABELS)
                urgency_top3 = [{"label": l, "score": float(s)} for l, s in zip(r["labels"][:3], r["scores"][:3])]
                urgency_label = normalize_urgency(urgency_top3[0]["label"] if urgency_top3 else "medium")
        except Exception as e:
            print(f"Urgency classification error: {e}")

        # 4) Summary
        summary = transcript or "No transcript available"
        try:
            if transcript and summarizer and len(transcript.split()) > 20:
                summary = summarizer(transcript, max_length=48, min_length=18, do_sample=False)[0]["summary_text"]
        except Exception as e:
            print(f"Summarization error: {e}")

        # Cleanup temporary files
        try:
            os.remove(audio_path)
        except Exception:
            pass

        return {
            "audio_filename": filename,
            "transcript": transcript or "",
            "issue_label": issue_label,
            "issue_top3": issue_top3,
            "urgency_label": urgency_label,
            "urgency_top3": urgency_top3,
            "summary": summary or "No transcript available",
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
        issue_label = "general"
        try:
            if transcript and issue_clf:
                issue_scores = issue_clf(transcript)[0]
                issue_top3 = top_k(issue_scores, k=3)
                issue_label = issue_top3[0]["label"] if issue_top3 else "general"
            elif transcript and zsc and ISSUE_LABELS:
                r = zsc(transcript, ISSUE_LABELS)
                issue_top3 = [{"label": l, "score": float(s)} for l, s in zip(r["labels"][:3], r["scores"][:3])]
                issue_label = issue_top3[0]["label"] if issue_top3 else "general"
        except Exception as e:
            print(f"Issue classification error: {e}")

        # 3) Urgency classification (schema allows only 'low'|'medium'|'high')
        urgency_top3 = []
        urgency_label = "medium"
        try:
            if transcript and urgency_clf:
                urg_scores = urgency_clf(transcript)[0]
                urgency_top3 = top_k(urg_scores, k=3)
                raw = urgency_top3[0]["label"] if urgency_top3 else "medium"
                urgency_label = normalize_urgency(raw)
            elif transcript and zsc:
                r = zsc(transcript, URGENCY_LABELS)
                urgency_top3 = [{"label": l, "score": float(s)} for l, s in zip(r["labels"][:3], r["scores"][:3])]
                urgency_label = normalize_urgency(urgency_top3[0]["label"] if urgency_top3 else "medium")
        except Exception as e:
            print(f"Urgency classification error: {e}")

        # 4) Summary
        summary = transcript or "No transcript available"
        try:
            if transcript and summarizer and len(transcript.split()) > 20:
                summary = summarizer(transcript, max_length=48, min_length=18, do_sample=False)[0]["summary_text"]
        except Exception as e:
            print(f"Summarization error: {e}")

        return {
            "transcript": transcript or "",
            "issue_label": issue_label,
            "issue_top3": issue_top3,
            "urgency_label": urgency_label,
            "urgency_top3": urgency_top3,
            "summary": summary or "No transcript available",
        }
    except Exception as e:
        print(f"Analyze text error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "message": "Failed to analyze text"
        }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not TF_AVAILABLE or emotion_model is None:
        return {"error": "Emotion model not loaded or TF not available", "emotion": "Neutral", "confidence": 0.0}

    try:
        # Save temp image
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_path = os.path.join(UPLOAD_DIR, f"{ts}_{file.filename}")
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Inference logic from PATSS
        im = Image.open(save_path).convert("RGB")
        im = im.resize((224, 224))
        x = np.array(im).astype("float32")
        from tensorflow.keras.applications.densenet import preprocess_input
        x = preprocess_input(x)
        x = np.expand_dims(x, 0)
        
        probs = emotion_model.predict(x, verbose=0)[0]
        top_idx = int(np.argmax(probs))
        pred = EMOTION_LABELS[top_idx]
        probs_dict = {EMOTION_LABELS[i]: float(probs[i]) for i in range(len(EMOTION_LABELS))}

        # Cleanup
        os.remove(save_path)

        return {
            "emotion": pred,
            "confidence": float(probs[top_idx]),
            "allPredictions": probs_dict,
        }
    except Exception as e:
        print(f"Emotion prediction error: {e}")
        return {"error": str(e), "emotion": "Neutral", "confidence": 0.0}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 7006)), reload=True)
