import os
import json
import io
from typing import Dict

from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import JSONResponse

# Optional TensorFlow import for real inference
try:
    import tensorflow as tf
    from tensorflow.keras.applications.densenet import preprocess_input
    import numpy as np
    from PIL import Image
    import cv2

    TF_AVAILABLE = True
except Exception:
    TF_AVAILABLE = False

app = FastAPI()

BASE_DIR = os.path.dirname(__file__)

DEFAULT_LABELS = ["Natural", "anger", "fear", "joy", "sadness", "surprise"]
MODEL_PATHS = {
    "upload": os.path.join(BASE_DIR, "models", "densenet121_emotion_recognition_correct.keras"),
}
MODELS: Dict[str, object] = {"upload": None}
LABELS_BY_SOURCE: Dict[str, list] = {
    "upload": DEFAULT_LABELS.copy(),
    "camera": DEFAULT_LABELS.copy(),
}

def _labels_from_map(data):
    classes = data.get("classes") or data.get("labels")
    if isinstance(classes, list) and classes:
        return classes

    if "class_indices" in data and isinstance(data["class_indices"], dict):
        by_idx = sorted(data["class_indices"].items(), key=lambda item: int(item[1]))
        return [name for name, _ in by_idx]

    if data and all(isinstance(k, str) for k in data.keys()) and all(
        isinstance(v, int) for v in data.values()
    ):
        by_idx = sorted(data.items(), key=lambda item: int(item[1]))
        return [name for name, _ in by_idx]

    return None


def _load_labels_for_source(source: str, model_path: str):
    try:
        label_dir = os.path.dirname(model_path)
        candidate_paths = [
            os.path.join(label_dir, "label_map.json"),
            os.path.join(BASE_DIR, "models", "label_map.json"),
            os.path.join(BASE_DIR, "models", "class_indices.json"),
        ]
        for lp in candidate_paths:
            if not os.path.exists(lp):
                continue
            with open(lp, "r", encoding="utf-8") as f:
                data = json.load(f)
            labels = _labels_from_map(data)
            if labels:
                LABELS_BY_SOURCE[source] = labels
                return
    except Exception:
        pass


def load_model_if_available(source: str) -> bool:
    if source not in MODEL_PATHS:
        return False
    if not TF_AVAILABLE:
        return False
    if MODELS[source] is not None:
        return True

    model_path = MODEL_PATHS[source]
    if not os.path.exists(model_path):
        print(f"[ERROR] Model path not found for '{source}': {model_path}")
        return False

    try:
        MODELS[source] = tf.keras.models.load_model(model_path)
        _load_labels_for_source(source, model_path)
        return True
    except Exception as e:
        print(f"[ERROR] Failed to load '{source}' model from {model_path}: {e}")
        MODELS[source] = None
        return False


def infer_camera_with_main(image_bytes: bytes):
    try:
        try:
            from main import predict_camera_emotion_from_frame
        except Exception:
            from ml_service.main import predict_camera_emotion_from_frame

        try:
            import numpy as np
            import cv2
        except Exception as e:
            print(f"[ERROR] Camera dependencies unavailable: {e}")
            return None

        frame_arr = np.frombuffer(image_bytes, dtype=np.uint8)
        frame = cv2.imdecode(frame_arr, cv2.IMREAD_COLOR)
        if frame is None:
            print("[ERROR] Failed to decode camera image bytes")
            return None

        return predict_camera_emotion_from_frame(frame)
    except Exception as e:
        print(f"[ERROR] Camera inference (main.py) failed: {e}")
        return None


def infer_image(image_bytes: bytes, model, labels):
    """Return (pred_label, probs_dict) using the given model, or None if unavailable."""
    if not TF_AVAILABLE or model is None:
        return None

    # Load image
    try:
        im = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        print(f"[ERROR] Failed to open image: {e}")
        return None

    # Try face detection and cropping
    try:
        img_np = np.array(im)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        face_cascade = cv2.CascadeClassifier(cascade_path)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        if len(faces) > 0:
            x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
            pad = int(0.25 * max(w, h))
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(img_bgr.shape[1], x + w + pad)
            y2 = min(img_bgr.shape[0], y + h + pad)
            face_img = img_bgr[y1:y2, x1:x2]
            face_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
            im = Image.fromarray(face_rgb)
        else:
            w, h = im.size
            min_edge = min(w, h)
            left = (w - min_edge) // 2
            top = (h - min_edge) // 2
            im = im.crop((left, top, left + min_edge, top + min_edge))
    except Exception as e:
        print(f"[ERROR] Face detection/cropping failed: {e}")
        w, h = im.size
        min_edge = min(w, h)
        left = (w - min_edge) // 2
        top = (h - min_edge) // 2
        im = im.crop((left, top, left + min_edge, top + min_edge))

    # Resize to model input size
    try:
        im = im.resize((224, 224))
        x = np.array(im).astype("float32")
        x = preprocess_input(x)
        x = np.expand_dims(x, 0)
        probs = model.predict(x, verbose=0)[0]

        labels_for_output = list(labels or DEFAULT_LABELS)
        if len(labels_for_output) < len(probs):
            labels_for_output.extend([f"class_{i}" for i in range(len(labels_for_output), len(probs))])
        elif len(labels_for_output) > len(probs):
            labels_for_output = labels_for_output[: len(probs)]

        top_idx = int(np.argmax(probs))
        pred = labels_for_output[top_idx]
        probs_dict = {labels_for_output[i]: float(probs[i]) for i in range(len(labels_for_output))}
        return pred, probs_dict
    except Exception as e:
        print(f"[ERROR] Model inference failed: {e}")
        return None


async def _predict_with_source(file: UploadFile, source: str):
    if file is None:
        print("[ERROR] No file uploaded")
        return JSONResponse(status_code=400, content={"error": "No file uploaded"})

    contents = await file.read()
    if not contents:
        print("[ERROR] Uploaded file is empty")
        return JSONResponse(status_code=400, content={"error": "Uploaded file is empty"})

    pred = None
    probs_dict = None
    labels = LABELS_BY_SOURCE.get(source, DEFAULT_LABELS)
    if source == "camera":
        res = infer_camera_with_main(contents)
        if res is not None:
            pred, probs_dict = res
    else:
        model_loaded = load_model_if_available(source)
        if not model_loaded:
            print(f"[ERROR] Model could not be loaded for source '{source}'")

        model = MODELS.get(source)
        if model is not None:
            try:
                res = infer_image(contents, model, labels)
                if res is not None:
                    pred, probs_dict = res
            except Exception as e:
                print(f"[ERROR] Exception during inference: {e}")
                pred, probs_dict = None, None

    allow_uncertain = os.environ.get("EMOTION_ALLOW_UNCERTAIN", "1") == "1"
    if pred and probs_dict:
        conf = float(max(probs_dict.values()))
        return {
            "emotion": pred,
            "confidence": conf,
            "allPredictions": probs_dict,
        }

    all_preds = {label: 0.0 for label in labels}
    print("[ERROR] Prediction failed, returning uncertain.")
    return {
        "emotion": "uncertain" if allow_uncertain else "Natural",
        "confidence": 0.0,
        "allPredictions": all_preds,
        "details": {"note": "Stub ML service: real model not loaded or inference failed."},
    }


@app.get("/health")
async def health():
    upload_loaded = MODELS["upload"] is not None
    return {
        "healthy": True,
        "modelLoaded": upload_loaded,
        "modelsLoaded": {
            "upload": upload_loaded,
            "camera": False,
        },
        "modelPaths": {
            "upload": MODEL_PATHS["upload"],
            "camera": os.path.join(BASE_DIR, "models", "model.h5"),
        },
        "cameraInference": "main.py:model.h5",
        "tfAvailable": TF_AVAILABLE,
        "port": 5000,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(default=None)):
    # Image upload flow uses DenseNet upload model.
    return await _predict_with_source(file, "upload")


@app.post("/predict-camera")
async def predict_camera(file: UploadFile = File(default=None)):
    # Camera flow uses main.py with models/model.h5.
    return await _predict_with_source(file, "camera")


@app.post("/recommend")
async def recommend(request: Request):
    """Recommend activities based on user factors"""
    try:
        data = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "No data provided"})

    if not data:
        return JSONResponse(status_code=400, content={"error": "No data provided"})

    try:
        # Extract parameters
        emotion = data.get("emotion", "Natural")
        interests = data.get("interests", [])
        financial_status = data.get("financial_status", "medium")
        social_status = data.get("social_status", "alone")
        autism_severity = data.get("autism_severity", 3)
        autism_type = data.get("autism_type", "ASD-2")
        top_k = data.get("top_k", 6)

        # Import recommendation predictor
        try:
            from predict_recommendations import get_predictor
            predictor = get_predictor()
            recommendations = predictor.predict(
                emotion=emotion,
                interests=interests,
                financial_status=financial_status,
                social_status=social_status,
                autism_severity=autism_severity,
                autism_type=autism_type,
                top_k=top_k,
            )

            return {
                "success": True,
                "recommendations": recommendations,
            }
        except FileNotFoundError as e:
            return JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "error": "Recommendation model not found. Please train the model first.",
                    "details": str(e),
                },
            )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": f"Prediction error: {str(e)}",
                },
            )

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == "__main__":
    # Attempt eager load to surface errors at startup
    load_model_if_available("upload")
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=7004)
