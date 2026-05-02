"""
Mock Emotion Recognition API Server (for testing without TensorFlow)
Provides the same endpoints as the real ML service, returns simulated predictions
"""

import os
import random
import base64

from fastapi import FastAPI, UploadFile, File, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock emotions for testing
EMOTIONS = ["happy", "sad", "anxious", "calm", "excited", "frustrated", "neutral"]


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": True,
        "note": "Mock service for testing",
    }


@app.post("/predict")
async def predict_emotion(image: UploadFile = File(default=None)):
    """
    Mock emotion prediction endpoint
    Accepts: multipart/form-data with 'image' field
    Returns: JSON with emotion, confidence, and all predictions
    """
    if image is None:
        return JSONResponse(status_code=400, content={"error": "No image file provided"})

    if image.filename == "":
        return JSONResponse(status_code=400, content={"error": "No file selected"})

    try:
        # Read image (just to validate it's present, don't process)
        image_bytes = await image.read()

        if len(image_bytes) > 16 * 1024 * 1024:
            return JSONResponse(
                status_code=400,
                content={"error": "File too large. Maximum size: 16MB"},
            )

        # Generate mock prediction (deterministic based on file size for consistency)
        random.seed(len(image_bytes) % 1000)
        predicted_emotion = random.choice(EMOTIONS)
        confidence = round(random.uniform(0.5, 0.99), 2)

        # Generate all predictions with random confidences that sum to ~1.0
        all_pred = {}
        remaining = 1.0
        sorted_emotions = sorted(EMOTIONS)

        for emotion in sorted_emotions[:-1]:
            pred_val = round(random.uniform(0.01, remaining - 0.01), 2)
            all_pred[emotion] = pred_val
            remaining -= pred_val

        all_pred[sorted_emotions[-1]] = round(remaining, 2)

        # Ensure the main prediction is in all_predictions
        all_pred[predicted_emotion] = confidence

        return {
            "success": True,
            "emotion": predicted_emotion,
            "confidence": confidence,
            "all_predictions": all_pred,
            "raw_prediction": f"Mock prediction for testing (file size: {len(image_bytes)} bytes)",
        }

    except Exception as e:
        print(f"Error during mock prediction: {e}")
        return JSONResponse(status_code=500, content={"error": f"Prediction failed: {str(e)}"})


@app.post("/predict-base64")
async def predict_emotion_base64(payload: dict = Body(default=None)):
    """
    Mock emotion prediction from base64 encoded image
    Accepts: JSON with 'image' field containing base64 string
    Returns: JSON with emotion, confidence, and all predictions
    """
    try:
        if not payload or "image" not in payload:
            return JSONResponse(status_code=400, content={"error": "No image data provided"})

        image_data = payload.get("image")
        if not isinstance(image_data, str):
            return JSONResponse(status_code=400, content={"error": "Invalid image data"})

        if image_data.startswith("data:image"):
            image_data = image_data.split(",", 1)[1]

        try:
            image_bytes = base64.b64decode(image_data)
        except Exception:
            return JSONResponse(status_code=400, content={"error": "Invalid base64 image data"})

        # Generate mock prediction
        random.seed(len(image_bytes) % 1000)
        predicted_emotion = random.choice(EMOTIONS)
        confidence = round(random.uniform(0.5, 0.99), 2)

        # Generate all predictions
        all_pred = {}
        remaining = 1.0
        sorted_emotions = sorted(EMOTIONS)

        for emotion in sorted_emotions[:-1]:
            pred_val = round(random.uniform(0.01, remaining - 0.01), 2)
            all_pred[emotion] = pred_val
            remaining -= pred_val

        all_pred[sorted_emotions[-1]] = round(remaining, 2)
        all_pred[predicted_emotion] = confidence

        return {
            "success": True,
            "emotion": predicted_emotion,
            "confidence": confidence,
            "all_predictions": all_pred,
            "raw_prediction": f"Mock prediction from base64 (decoded size: {len(image_bytes)} bytes)",
        }

    except Exception as e:
        print(f"Error during mock prediction: {e}")
        return JSONResponse(status_code=500, content={"error": f"Prediction failed: {str(e)}"})


@app.get("/emotions")
async def get_emotions():
    """Get list of supported emotions"""
    return {"emotions": EMOTIONS}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("")
    print(f"Starting Mock Emotion Recognition API Server on port {port}")
    print("Endpoints:")
    print("  POST /predict - Upload image file (mock prediction)")
    print("  POST /predict-base64 - Send base64 encoded image")
    print("  GET /health - Health check")
    print("  GET /emotions - Get supported emotions")
    print("")
    print("This is a MOCK service for testing without TensorFlow/model")

    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
