import sys
import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import json
import traceback

# Paths
MODEL_PATH = os.environ.get('ML_MODEL_PATH') or r'ml_service/models/densenet121_emotion_model_aug_oversample.keras'
CLASS_INDICES_PATH = r'ml_service/models/class_indices.json'

def main():
    try:
        # Load class indices
        with open(CLASS_INDICES_PATH, 'r') as f:
            class_indices = json.load(f)
            idx_to_class = {int(v): k for k, v in class_indices.items()}
            class_names = [class_indices[str(i)] for i in range(len(class_indices))]

        # Load model
        print(f'Loading model from: {MODEL_PATH}')
        model = load_model(MODEL_PATH)

        if len(sys.argv) < 2:
            print('Usage: python evaluate_single_image.py <image_path>')
            sys.exit(1)
        img_path = sys.argv[1]
        print(f'Loading image: {img_path}')
        img = image.load_img(img_path, target_size=(224, 224))
        x = image.img_to_array(img)
        x = np.expand_dims(x, axis=0)
        x = x / 255.0
        preds = model.predict(x)
        top_idx = np.argmax(preds[0])
        top_class = class_names[top_idx]
        confidence = float(preds[0][top_idx])
        print(f'Predicted emotion: {top_class}')
        print(f'Confidence: {confidence:.4f}')
        print('All predictions:')
        for i, class_name in enumerate(class_names):
            print(f'  {class_name}: {preds[0][i]:.4f}')
    except Exception as e:
        print('An error occurred:')
        traceback.print_exc()

if __name__ == '__main__':
    main()
