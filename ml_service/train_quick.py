"""
Quick Training Script - DenseNet-121 Emotion Recognition (Fast Preview)
Optimized for CPU: fewer epochs, smaller batch, fast convergence
Dataset: Autistic Children Emotions
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
import json
from pathlib import Path
import zipfile

# Set random seeds for reproducibility
tf.random.set_seed(42)
np.random.seed(42)

# Quick-training configuration (optimized for speed on CPU)
CONFIG = {
    'img_size': (224, 224),
    'batch_size': 16,  # Smaller batch for faster iterations
    'epochs': 10,  # Quick convergence (vs 50 for full training)
    'learning_rate': 0.001,
    'num_classes': 6,  # anger, fear, joy, Natural, sadness, surprise
    'data_dir': 'dataset',
    'model_save_path': 'models/densenet121_emotion_model.h5',
    'class_indices_save_path': 'models/class_indices.json'
}

def extract_dataset_if_needed():
    """Auto-extract dataset zip if present and dataset dir is empty"""
    zip_path = os.path.join(CONFIG['data_dir'], 'autistic-children-emotions-dr-fatma-m-talaat.zip')
    data_dir = CONFIG['data_dir']
    
    # Check if dataset dir has subdirs (train/test) or if we need to extract
    if os.path.exists(data_dir):
        subdirs = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]
        if len(subdirs) > 0 and subdirs[0] != '__MACOSX':  # Extracted already
            print(f"Dataset already extracted ({len(subdirs)} subdirs found)")
            return True
    
    if os.path.exists(zip_path):
        try:
            print(f"Extracting dataset from {zip_path}...")
            with zipfile.ZipFile(zip_path, 'r') as z:
                z.extractall(data_dir)
            print('Dataset extracted successfully.')
            return True
        except Exception as e:
            print(f'Failed to extract: {e}')
            return False
    
    print(f"Dataset not found at {data_dir}")
    return False

def find_image_directory():
    """Find the actual image directory after extraction"""
    data_dir = CONFIG['data_dir']
    
    # Look for nested structure: dataset/[folder]/[subfolder]/train or similar
    for root, dirs, files in os.walk(data_dir):
        if 'train' in dirs and 'test' in dirs:
            # Check if train has emotion subdirectories
            train_path = os.path.join(root, 'train')
            train_contents = os.listdir(train_path)
            if any(d in train_contents for d in ['anger', 'fear', 'joy', 'sadness', 'surprise', 'Natural']):
                print(f"Found emotion dataset at: {root}")
                return root
    
    # Fallback: check if data_dir itself is the root
    if 'train' in os.listdir(data_dir):
        train_path = os.path.join(data_dir, 'train')
        train_contents = os.listdir(train_path)
        if any(d in train_contents for d in ['anger', 'fear', 'joy', 'sadness', 'surprise', 'Natural']):
            return data_dir
    print(f"Could not find emotion classes in {data_dir}")
    return None

def create_quick_model(num_classes=7):
    """
    Create MobileNetV2-based model for quick training (faster than DenseNet on CPU)
    """
    # Load pre-trained DenseNet121 to match inference pipeline
    base_model = DenseNet121(
        weights='imagenet',
        include_top=False,
        input_shape=(224, 224, 3)
    )

    # Freeze base model
    base_model.trainable = False

    # Build model
    inputs = keras.Input(shape=(224, 224, 3))
    # We will preprocess inputs in the data pipeline, so pass inputs directly
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    model = models.Model(inputs, outputs)
    return model, base_model

def train_quick_model():
    """Quick training for preview/testing"""
    print("=" * 60)
    print("🚀 QUICK TRAINING - DenseNet-121 Emotion Recognition (Preview)")
    print("=" * 60)
    print(f"⚙️  Config: {CONFIG['epochs']} epochs, batch={CONFIG['batch_size']}, img_size={CONFIG['img_size']}")
    
    # Extract dataset if needed
    if not extract_dataset_if_needed():
        print("\n❌ Dataset extraction failed. Please ensure the zip is in ml_service/dataset/")
        return None
    
    # Find image directory
    img_root = find_image_directory()
    if not img_root:
        return None
    
    print(f"\n📂 Using dataset from: {img_root}")
    
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Prepare data generators (minimal augmentation for speed)
    print("\n📊 Preparing data generators...")
    # Preprocessing: face-crop + DenseNet preprocess_input
    def crop_face_for_train(img_arr, target_size=CONFIG['img_size']):
        try:
            import cv2
            from PIL import Image
            img_bgr = cv2.cvtColor(img_arr.astype('uint8'), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30,30))
            if len(faces) > 0:
                x, y, w, h = max(faces, key=lambda rect: rect[2]*rect[3])
                pad = int(0.25 * max(w, h))
                x1 = max(0, x - pad)
                y1 = max(0, y - pad)
                x2 = min(img_bgr.shape[1], x + w + pad)
                y2 = min(img_bgr.shape[0], y + h + pad)
                face_img = img_bgr[y1:y2, x1:x2]
                face_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
                pil = Image.fromarray(face_rgb)
            else:
                pil = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
                w, h = pil.size
                m = min(w, h)
                left = (w - m)//2; top = (h - m)//2
                pil = pil.crop((left, top, left+m, top+m))
            pil = pil.resize(target_size)
            return np.array(pil).astype('float32')
        except Exception:
            try:
                from PIL import Image
                pil = Image.fromarray(img_arr.astype('uint8'))
                pil = pil.resize(target_size)
                return np.array(pil).astype('float32')
            except Exception:
                return img_arr.astype('float32')

    datagen = ImageDataGenerator(
        preprocessing_function=lambda x: tf.keras.applications.densenet.preprocess_input(crop_face_for_train(x, target_size=CONFIG['img_size'])),
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.1,
        validation_split=0.2
    )
    
    try:
        # Use train directory directly (emotions are in img_root/train/<emotion>)
        train_dir = os.path.join(img_root, 'train')
        
        train_gen = datagen.flow_from_directory(
            train_dir,
            target_size=CONFIG['img_size'],
            batch_size=CONFIG['batch_size'],
            class_mode='categorical',
            subset='training',
            shuffle=True
        )
        
        val_gen = datagen.flow_from_directory(
            train_dir,
            target_size=CONFIG['img_size'],
            batch_size=CONFIG['batch_size'],
            class_mode='categorical',
            subset='validation',
            shuffle=False
        )
    except Exception as e:
        print(f"❌ Error loading images: {e}")
        return None
    
    print(f"   Training samples: {train_gen.samples}")
    print(f"   Validation samples: {val_gen.samples}")
    
    # Save class indices
    class_indices = train_gen.class_indices
    class_indices_inverse = {v: k for k, v in class_indices.items()}
    with open(CONFIG['class_indices_save_path'], 'w') as f:
        json.dump(class_indices_inverse, f, indent=2)
    print(f"✅ Class indices saved: {class_indices_inverse}")
    
    # Create model
    print("\n🏗️  Creating MobileNetV2 model (faster than DenseNet for preview)...")
    model, base_model = create_quick_model(CONFIG['num_classes'])
    
    # Compile
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG['learning_rate']),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("\n📋 Model created. Starting training...\n")
    
    # Callbacks
    callbacks = [
        ModelCheckpoint(
            CONFIG['model_save_path'],
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_accuracy',
            patience=3,
            restore_best_weights=True,
            verbose=1
        )
    ]
    
    # Train
    history = model.fit(
        train_gen,
        epochs=CONFIG['epochs'],
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save final model in native Keras format (compatible with Keras 3)
    keras_path = CONFIG['model_save_path'].replace('.h5', '.keras')
    model.save(keras_path)
    print(f"\n✅ Model saved to {keras_path}")
    # Also update CONFIG for compatibility
    CONFIG['model_save_path'] = keras_path
    
    # Evaluate
    print("\n📊 Evaluating model...")
    val_loss, val_accuracy = model.evaluate(val_gen, verbose=0)
    print(f"✅ Validation Accuracy: {val_accuracy:.4f}")
    
    print("\n" + "=" * 60)
    print("✅ QUICK TRAINING COMPLETE!")
    print("=" * 60)
    print(f"Model: {CONFIG['model_save_path']}")
    print(f"Classes: {CONFIG['class_indices_save_path']}")
    print("\nNext steps:")
    print("1. Start ML server: py -3.11 app.py")
    print("2. Upload an image through the frontend to test predictions")
    print("\nFor better accuracy, run the full training later:")
    print("1. Modify train_model.py CONFIG to use epochs=50, batch_size=32")
    print("2. Use DenseNet121 instead of MobileNetV2")
    print("3. Allow fine-tuning (unfreeze base layers)")
    print("=" * 60)
    
    return model, history

if __name__ == '__main__':
    print(f"TensorFlow version: {tf.__version__}")
    print(f"GPU Available: {tf.config.list_physical_devices('GPU')}\n")
    
    model, history = train_quick_model()
