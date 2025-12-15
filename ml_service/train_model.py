"""
DenseNet-121 Emotion Recognition Model Training Script
Dataset: Autistic Children Emotions - Dr. Fatma M. Talaat
Kaggle: https://www.kaggle.com/datasets/fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import json
from pathlib import Path

# Set random seeds for reproducibility
tf.random.set_seed(42)
np.random.seed(42)

# Configuration
CONFIG = {
    'img_size': (224, 224),
    'batch_size': 32,
    'epochs': 50,
    'learning_rate': 0.001,
    'num_classes': 6,  # Natural (0), joy (1), fear (2), anger (3), sadness (4), surprise (5)
    'data_dir': os.path.join('dataset', 'Autism emotion recogition dataset', 'train'),  # Updated to match actual dataset location
    'model_save_path': 'models/densenet121_emotion_model.h5',
    'class_indices_save_path': 'models/class_indices.json'
}

# Emotion classes mapping - 6 emotions as required
EMOTION_CLASSES = {
    'Natural': 0,
    'joy': 1,
    'fear': 2,
    'anger': 3,
    'sadness': 4,
    'surprise': 5
}

def create_model(num_classes=7):
    """
    Create DenseNet-121 based emotion recognition model
    """
    # Load pre-trained DenseNet-121 model (without top layer)
    base_model = DenseNet121(
        weights='imagenet',
        include_top=False,
        input_shape=(224, 224, 3)
    )
    
    # Freeze base model layers initially
    base_model.trainable = False
    
    # Build the model
    inputs = keras.Input(shape=(224, 224, 3))
    
    # Preprocessing (normalization)
    x = tf.keras.applications.densenet.preprocess_input(inputs)
    
    # Base model
    x = base_model(x, training=False)
    
    # Global Average Pooling
    x = layers.GlobalAveragePooling2D()(x)
    
    # Dropout for regularization
    x = layers.Dropout(0.5)(x)
    
    # Dense layers
    x = layers.Dense(512, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    
    x = layers.Dense(256, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    
    # Output layer
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    model = models.Model(inputs, outputs)
    
    return model, base_model

def prepare_data_generators(data_dir, img_size=(224, 224), batch_size=32):
    """
    Prepare data generators with augmentation
    """
    # Data augmentation for training
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        brightness_range=[0.8, 1.2],
        validation_split=0.2
    )
    
    # Only rescaling for validation
    val_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2
    )
    
    # Training generator
    train_generator = train_datagen.flow_from_directory(
        data_dir,
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical',
        subset='training',
        shuffle=True
    )
    
    # Validation generator
    val_generator = val_datagen.flow_from_directory(
        data_dir,
        target_size=img_size,
        batch_size=batch_size,
        class_mode='categorical',
        subset='validation',
        shuffle=False
    )
    
    # Save class indices
    class_indices = train_generator.class_indices
    class_indices_inverse = {v: k for k, v in class_indices.items()}
    
    # Save class indices to file
    os.makedirs('models', exist_ok=True)
    with open(CONFIG['class_indices_save_path'], 'w') as f:
        json.dump(class_indices_inverse, f, indent=2)
    
    print(f"Class indices: {class_indices}")
    print(f"Number of training samples: {train_generator.samples}")
    print(f"Number of validation samples: {val_generator.samples}")
    
    return train_generator, val_generator, class_indices

def train_model():
    """
    Main training function
    """
    print("=" * 50)
    print("DenseNet-121 Emotion Recognition Model Training")
    print("=" * 50)
    
    # Check if dataset directory exists; if a zip is present, extract it automatically
    zip_path = os.path.join(os.getcwd(), 'dataset', 'autistic-children-emotions-dr-fatma-m-talaat.zip')
    if not os.path.exists(CONFIG['data_dir']):
        print(f"\nDataset directory '{CONFIG['data_dir']}' not found.")
        if os.path.exists(zip_path):
            try:
                import zipfile
                print(f"Found dataset zip at {zip_path} — extracting now...")
                with zipfile.ZipFile(zip_path, 'r') as z:
                    z.extractall(os.path.join(os.getcwd(), 'dataset'))
                print('Extraction complete.')
            except Exception as e:
                print('Failed to extract dataset zip:', e)
                print("Please extract the zip manually into the 'dataset' folder.")
                return
        else:
            print(f"\n❌ Error: Dataset directory '{CONFIG['data_dir']}' not found and no dataset zip present!")
            print("\n📥 Please download the dataset from Kaggle:")
            print("   https://www.kaggle.com/datasets/fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat")
            print("\n📋 Instructions:")
            print("   1. Install kaggle: pip install kaggle")
            print("   2. Set up Kaggle API credentials")
            print("   3. Run: kaggle datasets download -d fatmamtalaat/autistic-children-emotions-dr-fatma-m-talaat")
            print("   4. Extract to 'dataset' folder")
            print("   5. Ensure folder structure: dataset/emotion_class/images/")
            return
    
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Prepare data generators
    print("\n📊 Preparing data generators...")
    train_gen, val_gen, class_indices = prepare_data_generators(
        CONFIG['data_dir'],
        CONFIG['img_size'],
        CONFIG['batch_size']
    )
    
    # Create model
    print("\n🏗️  Creating DenseNet-121 model...")
    model, base_model = create_model(CONFIG['num_classes'])
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG['learning_rate']),
        loss='categorical_crossentropy',
        metrics=['accuracy', 'top_k_categorical_accuracy']
    )
    
    print("\n📋 Model Summary:")
    model.summary()
    
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
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Train model (Phase 1: Frozen base)
    print("\n🚀 Starting training (Phase 1: Frozen base model)...")
    print(f"   Epochs: {CONFIG['epochs']}")
    print(f"   Batch size: {CONFIG['batch_size']}")
    print(f"   Learning rate: {CONFIG['learning_rate']}")
    
    history1 = model.fit(
        train_gen,
        epochs=CONFIG['epochs'],
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Fine-tuning (Phase 2: Unfreeze some layers)
    print("\n🔄 Starting fine-tuning (Phase 2: Unfreezing top layers)...")
    base_model.trainable = True
    
    # Freeze bottom layers, unfreeze top layers
    for layer in base_model.layers[:-30]:
        layer.trainable = False
    
    # Recompile with lower learning rate
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG['learning_rate'] / 10),
        loss='categorical_crossentropy',
        metrics=['accuracy', 'top_k_categorical_accuracy']
    )
    
    history2 = model.fit(
        train_gen,
        epochs=CONFIG['epochs'] // 2,
        validation_data=val_gen,
        callbacks=callbacks,
        verbose=1
    )
    
    # Combine histories
    history = {
        'accuracy': history1.history['accuracy'] + history2.history['accuracy'],
        'val_accuracy': history1.history['val_accuracy'] + history2.history['val_accuracy'],
        'loss': history1.history['loss'] + history2.history['loss'],
        'val_loss': history1.history['val_loss'] + history2.history['val_loss']
    }
    
    # Save final model
    model.save(CONFIG['model_save_path'])
    print(f"\n✅ Model saved to {CONFIG['model_save_path']}")
    
    # Plot training history
    plot_training_history(history)
    
    # Evaluate model
    print("\n📊 Evaluating model...")
    val_loss, val_accuracy, val_top_k = model.evaluate(val_gen, verbose=1)
    print(f"Validation Accuracy: {val_accuracy:.4f}")
    print(f"Validation Top-K Accuracy: {val_top_k:.4f}")
    
    print("\n✅ Training completed successfully!")
    return model, history

def plot_training_history(history):
    """
    Plot training history
    """
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    
    # Accuracy plot
    axes[0].plot(history['accuracy'], label='Training Accuracy')
    axes[0].plot(history['val_accuracy'], label='Validation Accuracy')
    axes[0].set_title('Model Accuracy')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Accuracy')
    axes[0].legend()
    axes[0].grid(True)
    
    # Loss plot
    axes[1].plot(history['loss'], label='Training Loss')
    axes[1].plot(history['val_loss'], label='Validation Loss')
    axes[1].set_title('Model Loss')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Loss')
    axes[1].legend()
    axes[1].grid(True)
    
    plt.tight_layout()
    plt.savefig('models/training_history.png')
    print("📈 Training history plot saved to models/training_history.png")

if __name__ == '__main__':
    # Check GPU availability
    print(f"TensorFlow version: {tf.__version__}")
    print(f"GPU Available: {tf.config.list_physical_devices('GPU')}")
    
    # Train model
    model, history = train_model()

