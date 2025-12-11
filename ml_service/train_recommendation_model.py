"""
Deep Learning Activity Recommendation Model
Trains a neural network to recommend activities based on:
1. Real-time emotion (6 categories)
2. Personal interests
3. Financial/economic status
4. Social status
5. Autism profile (type, severity)
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import json
import pickle
from pathlib import Path

# Set random seeds for reproducibility
tf.random.set_seed(42)
np.random.seed(42)

# Configuration
CONFIG = {
    'model_save_path': 'models/recommendation_model.keras',
    'scaler_save_path': 'models/recommendation_scaler.pkl',
    'activity_mapping_path': 'models/activity_mapping.json',
    'epochs': 100,
    'batch_size': 32,
    'learning_rate': 0.001,
    'validation_split': 0.2
}

# Emotion encoding: 6 emotions (one-hot or integer)
EMOTIONS = ['Natural', 'joy', 'fear', 'anger', 'sadness', 'surprise']
EMOTION_TO_INT = {emotion: idx for idx, emotion in enumerate(EMOTIONS)}

# Interest categories
INTERESTS = ['train', 'cartoon', 'music', 'dance', 'art', 'sports', 'puzzles', 'outdoors', 
             'reading', 'visual', 'structured', 'quiet', 'play-based', 'movement', 
             'hands-on', 'sensory', 'artistic', 'creative', 'writing']

# Financial status encoding
FINANCIAL_STATUS = ['free', 'low', 'medium', 'high']
FINANCIAL_TO_INT = {status: idx for idx, status in enumerate(FINANCIAL_STATUS)}

# Social status encoding
SOCIAL_STATUS = ['alone', 'with-parent', 'group', 'community']
SOCIAL_TO_INT = {status: idx for idx, status in enumerate(SOCIAL_STATUS)}

# Autism severity: 1-5 (already numeric)
# Autism type: encoded as one-hot or integer (simplified as integer for now)

def create_recommendation_model(num_activities=15, num_interests=19):
    """
    Create neural network for activity recommendation
    
    Input features:
    - Emotion (6 classes, one-hot encoded): 6 features
    - Interests (binary vector): num_interests features
    - Financial status (4 classes, one-hot): 4 features
    - Social status (4 classes, one-hot): 4 features
    - Autism severity (1-5, normalized): 1 feature
    - Autism type (encoded): 1 feature
    
    Total input: 6 + num_interests + 4 + 4 + 1 + 1 = num_interests + 16 features
    """
    input_dim = num_interests + 16  # 19 + 16 = 35 features
    
    # Input layer
    inputs = keras.Input(shape=(input_dim,), name='user_features')
    
    # Dense layers with batch normalization and dropout
    x = layers.Dense(256, activation='relu', name='dense_1')(inputs)
    x = layers.BatchNormalization(name='bn_1')(x)
    x = layers.Dropout(0.4, name='dropout_1')(x)
    
    x = layers.Dense(128, activation='relu', name='dense_2')(x)
    x = layers.BatchNormalization(name='bn_2')(x)
    x = layers.Dropout(0.3, name='dropout_2')(x)
    
    x = layers.Dense(64, activation='relu', name='dense_3')(x)
    x = layers.BatchNormalization(name='bn_3')(x)
    x = layers.Dropout(0.2, name='dropout_3')(x)
    
    # Output layer: probability scores for each activity
    outputs = layers.Dense(num_activities, activation='sigmoid', name='activity_scores')(x)
    
    model = models.Model(inputs, outputs, name='activity_recommendation_model')
    
    return model

def encode_features(emotion, interests, financial_status, social_status, autism_severity, autism_type):
    """
    Encode all input features into a single feature vector
    
    Args:
        emotion: str, one of EMOTIONS
        interests: list of str, subset of INTERESTS
        financial_status: str, one of FINANCIAL_STATUS
        social_status: str, one of SOCIAL_STATUS
        autism_severity: int, 1-5
        autism_type: str (encoded as simple hash for now)
    
    Returns:
        numpy array of shape (num_interests + 16,)
    """
    feature_vector = []
    
    # 1. Emotion (one-hot, 6 features)
    emotion_onehot = [0] * len(EMOTIONS)
    if emotion in EMOTION_TO_INT:
        emotion_onehot[EMOTION_TO_INT[emotion]] = 1
    feature_vector.extend(emotion_onehot)
    
    # 2. Interests (binary vector, num_interests features)
    interests_vector = [1 if interest in interests else 0 for interest in INTERESTS]
    feature_vector.extend(interests_vector)
    
    # 3. Financial status (one-hot, 4 features)
    financial_onehot = [0] * len(FINANCIAL_STATUS)
    if financial_status in FINANCIAL_TO_INT:
        financial_onehot[FINANCIAL_TO_INT[financial_status]] = 1
    feature_vector.extend(financial_onehot)
    
    # 4. Social status (one-hot, 4 features)
    social_onehot = [0] * len(SOCIAL_STATUS)
    if social_status in SOCIAL_TO_INT:
        social_onehot[SOCIAL_TO_INT[social_status]] = 1
    feature_vector.extend(social_onehot)
    
    # 5. Autism severity (normalized to 0-1, 1 feature)
    normalized_severity = (autism_severity - 1) / 4.0  # 1->0, 5->1
    feature_vector.append(normalized_severity)
    
    # 6. Autism type (simple encoding, 1 feature)
    # Hash autism type string to a float between 0 and 1
    type_hash = hash(autism_type) % 1000 / 1000.0 if autism_type else 0.5
    feature_vector.append(type_hash)
    
    return np.array(feature_vector, dtype=np.float32)

def generate_synthetic_training_data(num_samples=1000, activities=None):
    """
    Generate synthetic training data based on activity characteristics
    This simulates real user-activity interactions
    """
    if activities is None:
        # Default activities if not provided
        activities = list(range(15))
    
    X = []
    y = []
    
    # Generate diverse training samples
    for _ in range(num_samples):
        # Random emotion
        emotion = np.random.choice(EMOTIONS)
        
        # Random interests (1-5 interests)
        num_interests = np.random.randint(1, 6)
        interests = np.random.choice(INTERESTS, size=num_interests, replace=False).tolist()
        
        # Random financial status
        financial_status = np.random.choice(FINANCIAL_STATUS)
        
        # Random social status
        social_status = np.random.choice(SOCIAL_STATUS)
        
        # Random autism severity (1-5)
        autism_severity = np.random.randint(1, 6)
        
        # Random autism type
        autism_types = ['ASD-1', 'ASD-2', 'ASD-3', 'PDD-NOS', 'Asperger']
        autism_type = np.random.choice(autism_types)
        
        # Encode features
        features = encode_features(emotion, interests, financial_status, social_status, 
                                   autism_severity, autism_type)
        X.append(features)
        
        # Generate target: activity scores based on rules
        activity_scores = np.zeros(len(activities))
        
        # Rule-based scoring (will be learned by the model)
        for activity_idx in activities:
            score = 0.0
            
            # Emotion-based scoring (simplified)
            if emotion == 'joy':
                score += 0.3
            elif emotion == 'sadness':
                score += 0.2
            elif emotion == 'anger':
                score += 0.1
            
            # Interest matching
            # (In real scenario, this would match activity tags with user interests)
            interest_match = len(interests) / len(INTERESTS) * 0.3
            score += interest_match
            
            # Financial matching
            if financial_status == 'high':
                score += 0.2
            elif financial_status == 'medium':
                score += 0.15
            elif financial_status == 'low':
                score += 0.1
            else:  # free
                score += 0.05
            
            # Social matching
            if social_status == 'group' or social_status == 'community':
                score += 0.15
            else:
                score += 0.1
            
            # Autism severity: easier activities for higher severity
            if autism_severity >= 4:
                score += 0.1  # Prefer easier activities
            
            # Add some noise
            score += np.random.uniform(0, 0.1)
            
            activity_scores[activity_idx] = min(1.0, score)
        
        y.append(activity_scores)
    
    return np.array(X), np.array(y)

def train_recommendation_model(activities_data=None):
    """
    Train the recommendation model
    """
    print("=" * 60)
    print("Deep Learning Activity Recommendation Model Training")
    print("=" * 60)
    
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Load activities if provided, otherwise use default
    if activities_data:
        num_activities = len(activities_data)
        # Create activity mapping
        activity_mapping = {i: activity.get('id', i) for i, activity in enumerate(activities_data)}
    else:
        num_activities = 15
        activity_mapping = {i: i for i in range(num_activities)}
    
    # Save activity mapping
    with open(CONFIG['activity_mapping_path'], 'w') as f:
        json.dump(activity_mapping, f, indent=2)
    
    # Generate training data
    print("\n📊 Generating training data...")
    X_train, y_train = generate_synthetic_training_data(
        num_samples=2000, 
        activities=list(range(num_activities))
    )
    
    print(f"   Training samples: {X_train.shape[0]}")
    print(f"   Feature dimensions: {X_train.shape[1]}")
    print(f"   Number of activities: {num_activities}")
    
    # Create model
    print("\n🏗️  Creating recommendation model...")
    model = create_recommendation_model(
        num_activities=num_activities,
        num_interests=len(INTERESTS)
    )
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG['learning_rate']),
        loss='binary_crossentropy',  # Multi-label classification
        metrics=['accuracy', 'top_k_categorical_accuracy']
    )
    
    print("\n📋 Model Summary:")
    model.summary()
    
    # Callbacks
    callbacks = [
        ModelCheckpoint(
            CONFIG['model_save_path'],
            monitor='val_loss',
            save_best_only=True,
            mode='min',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_loss',
            patience=15,
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
    
    # Split data
    split_idx = int(len(X_train) * (1 - CONFIG['validation_split']))
    X_train_split = X_train[:split_idx]
    y_train_split = y_train[:split_idx]
    X_val = X_train[split_idx:]
    y_val = y_train[split_idx:]
    
    # Train model
    print("\n🚀 Starting training...")
    print(f"   Epochs: {CONFIG['epochs']}")
    print(f"   Batch size: {CONFIG['batch_size']}")
    print(f"   Learning rate: {CONFIG['learning_rate']}")
    
    history = model.fit(
        X_train_split,
        y_train_split,
        epochs=CONFIG['epochs'],
        batch_size=CONFIG['batch_size'],
        validation_data=(X_val, y_val),
        callbacks=callbacks,
        verbose=1
    )
    
    # Save final model
    model.save(CONFIG['model_save_path'])
    print(f"\n✅ Model saved to {CONFIG['model_save_path']}")
    
    # Evaluate model
    print("\n📊 Evaluating model...")
    val_loss, val_accuracy, val_top_k = model.evaluate(X_val, y_val, verbose=1)
    print(f"Validation Loss: {val_loss:.4f}")
    print(f"Validation Accuracy: {val_accuracy:.4f}")
    print(f"Validation Top-K Accuracy: {val_top_k:.4f}")
    
    print("\n✅ Training completed successfully!")
    
    # Save feature encoding info
    encoding_info = {
        'emotions': EMOTIONS,
        'emotion_to_int': EMOTION_TO_INT,
        'interests': INTERESTS,
        'financial_status': FINANCIAL_STATUS,
        'financial_to_int': FINANCIAL_TO_INT,
        'social_status': SOCIAL_STATUS,
        'social_to_int': SOCIAL_TO_INT,
        'num_activities': num_activities
    }
    
    with open('models/recommendation_encoding.json', 'w') as f:
        json.dump(encoding_info, f, indent=2)
    
    return model, history

if __name__ == '__main__':
    print(f"TensorFlow version: {tf.__version__}")
    print(f"GPU Available: {tf.config.list_physical_devices('GPU')}")
    
    # Train model
    model, history = train_recommendation_model()

