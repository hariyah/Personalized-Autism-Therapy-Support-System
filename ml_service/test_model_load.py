from tensorflow.keras.models import load_model

MODEL_PATH = r'ml_service/models/densenet121_emotion_model_aug_oversample.keras'

try:
    model = load_model(MODEL_PATH)
    print('Model loaded successfully')
except Exception as e:
    print('Failed to load model:')
    print(e)
