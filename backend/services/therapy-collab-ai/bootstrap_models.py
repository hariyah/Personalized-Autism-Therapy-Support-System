import os
import sys
from treatment_recommender import train_treatment_model

def bootstrap():
    print("--- ACT-CS AI Model Bootstrapper ---")
    
    model_dir = os.path.join(os.path.dirname(__file__), "models", "treatment_recommender")
    if not os.path.exists(os.path.join(model_dir, "treatment_pipeline.joblib")):
        print(f"Treatment recommender model missing. Training now at {model_dir}...")
        try:
            metadata = train_treatment_model(model_dir, samples_per_profile=100)
            print(f"[OK] Treatment recommender trained. Accuracy: {metadata['accuracy']:.2f}")
        except Exception as e:
            print(f"[ERROR] Failed to train treatment recommender: {e}")
    else:
        print("[OK] Treatment recommender model already exists.")

    # Check for other models and provide instructions
    print("\n--- Additional Models Status ---")
    models = {
        "Issue Classifier": "./models/issue_classifier_roberta",
        "Urgency Classifier": "./models/urgency_classifier/checkpoints/checkpoint-876",
        "Summarizer": "facebook/bart-large-cnn (Auto-downloading)",
        "ASR (Whisper)": "openai/whisper-small (Auto-downloading)"
    }
    
    for name, path in models.items():
        if "/" in path and not os.path.exists(path) and not path.startswith("http") and not "." in path.split("/")[0]:
            print(f"[INFO] {name}: Will be downloaded from Hugging Face on first run (requires internet).")
        elif os.path.exists(path) or "." in path:
            print(f"[OK] {name}: Ready or set to auto-download.")
        else:
            print(f"[WARNING] {name}: Local path {path} not found. Will attempt fallback or download.")

    print("\nBootstrapping complete. You can now start the server.")

if __name__ == "__main__":
    bootstrap()
