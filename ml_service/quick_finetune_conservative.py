import os
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
import cv2
from PIL import Image
from sklearn.utils.class_weight import compute_class_weight

# reuse helpers
try:
    from train_quick import find_image_directory, create_quick_model
except Exception:
    def find_image_directory():
        data_dir = 'dataset'
        for root, dirs, files in os.walk(data_dir):
            if 'train' in dirs and 'test' in dirs:
                return root
        if 'train' in os.listdir(data_dir):
            return data_dir
        return None

    def create_quick_model(num_classes=6):
        # Use DenseNet121 to match inference model
        base_model = keras.applications.DenseNet121(
            weights='imagenet', include_top=False, input_shape=(224,224,3)
        )
        base_model.trainable = False
        inputs = keras.Input(shape=(224,224,3))
        x = base_model(inputs, training=False)
        x = keras.layers.GlobalAveragePooling2D()(x)
        x = keras.layers.Dropout(0.3)(x)
        x = keras.layers.Dense(128, activation='relu')(x)
        x = keras.layers.Dropout(0.3)(x)
        outputs = keras.layers.Dense(num_classes, activation='softmax')(x)
        model = keras.Model(inputs, outputs)
        return model, base_model

# Config conservative
BATCH_SIZE = 16
IMG_SIZE = (224,224)
LEARNING_RATE = 1e-6
MODEL_SAVE_PATH = 'models/densenet121_emotion_model_conservative.keras'
CLASS_INDICES_PATH = 'models/class_indices.json'
EPOCHS = int(os.environ.get('FINETUNE_EPOCHS', 5))


def crop_face_np(img_arr, target_size=IMG_SIZE):
    try:
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
        # Keep image in 0..255 float32 so DenseNet preprocessing can be applied later
        arr = np.array(pil).astype('float32')
        return arr
    except Exception:
        try:
            pil = Image.fromarray(img_arr.astype('uint8'))
            pil = pil.resize(target_size)
            return np.array(pil).astype('float32')
        except Exception:
            return img_arr.astype('float32')


def main():
    print('Starting conservative fine-tune...')
    img_root = find_image_directory()
    if not img_root:
        print('Could not find dataset. Ensure dataset is extracted under dataset/')
        return
    train_dir = os.path.join(img_root, 'train')

    # validation split with deterministic preprocessing (no augmentation)
    datagen = ImageDataGenerator(preprocessing_function=lambda x: tf.keras.applications.densenet.preprocess_input(
        crop_face_np(x, target_size=IMG_SIZE)
    ), validation_split=0.2)
    train_gen = datagen.flow_from_directory(train_dir, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode='categorical', subset='training', shuffle=True)
    val_datagen = ImageDataGenerator(preprocessing_function=lambda x: tf.keras.applications.densenet.preprocess_input(
        crop_face_np(x, target_size=IMG_SIZE)
    ), validation_split=0.2)
    val_gen = val_datagen.flow_from_directory(train_dir, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode='categorical', subset='validation', shuffle=False)

    class_indices = train_gen.class_indices
    num_classes = len(class_indices)
    os.makedirs('models', exist_ok=True)
    with open(CLASS_INDICES_PATH, 'w') as f:
        json.dump({v:k for k,v in class_indices.items()}, f, indent=2)
    print('Saved class indices to', CLASS_INDICES_PATH)

    model, base_model = create_quick_model(num_classes)
    base_model.trainable = True
    fine_tune_at = int(len(base_model.layers) * 0.9)
    for layer in base_model.layers[:fine_tune_at]:
        layer.trainable = False

    model.compile(optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE), loss='categorical_crossentropy', metrics=['accuracy'])

    callbacks = [
        ModelCheckpoint(MODEL_SAVE_PATH, monitor='val_accuracy', save_best_only=True, verbose=1),
        EarlyStopping(monitor='val_accuracy', patience=3, restore_best_weights=True, verbose=1)
    ]

    # compute class weights
    try:
        classes = train_gen.classes
        labels = np.unique(classes)
        weights = compute_class_weight('balanced', classes=labels, y=classes)
        class_weight = {int(l): float(w) for l, w in zip(labels, weights)}
        print('Class weights:', class_weight)
    except Exception as e:
        print('Could not compute class weights:', e)
        class_weight = None

    history = model.fit(train_gen, epochs=EPOCHS, validation_data=val_gen, callbacks=callbacks, verbose=1, class_weight=class_weight)

    model.save(MODEL_SAVE_PATH)
    print('Saved conservative fine-tuned model to', MODEL_SAVE_PATH)

if __name__ == '__main__':
    main()
