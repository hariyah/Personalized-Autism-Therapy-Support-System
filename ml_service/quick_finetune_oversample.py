import os
import json
import random
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from PIL import Image
import cv2
from sklearn.utils.class_weight import compute_class_weight

# Build a simple oversampling generator using file lists per class
IMG_SIZE = (224,224)
BATCH_SIZE = 16
LEARNING_RATE = 1e-5
MODEL_SAVE_PATH = 'models/densenet121_emotion_model_oversample.keras'
CLASS_INDICES_PATH = 'models/class_indices.json'
EPOCHS = int(os.environ.get('FINETUNE_EPOCHS', 5))

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
        # Use DenseNet121 to match inference pipeline
        base_model = keras.applications.DenseNet121(weights='imagenet', include_top=False, input_shape=(224,224,3))
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
        # Return 0..255 float32 for DenseNet preprocessing
        arr = np.array(pil).astype('float32')
        return arr
    except Exception:
        try:
            pil = Image.fromarray(img_arr.astype('uint8'))
            pil = pil.resize(target_size)
            return np.array(pil).astype('float32')
        except Exception:
            return img_arr.astype('float32')


def build_file_lists(train_dir):
    classes = sorted([d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))])
    files_by_class = {}
    for c in classes:
        class_dir = os.path.join(train_dir, c)
        files = [os.path.join(class_dir, f) for f in os.listdir(class_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        files_by_class[c] = files
    return files_by_class


def balanced_generator(files_by_class, classes_map, batch_size=BATCH_SIZE):
    class_names = list(files_by_class.keys())
    n_classes = len(class_names)
    per_class = max(1, batch_size // n_classes)
    while True:
        batch_x = []
        batch_y = []
        for _ in range(per_class):
            for idx, cname in enumerate(class_names):
                files = files_by_class[cname]
                if not files:
                    continue
                f = random.choice(files)
                try:
                    img = Image.open(f).convert('RGB')
                    arr = np.array(img)
                    arr = crop_face_np(arr, target_size=IMG_SIZE)
                    # apply DenseNet preprocessing before yielding
                    arr = tf.keras.applications.densenet.preprocess_input(arr)
                    batch_x.append(arr)
                    y = np.zeros(n_classes, dtype='float32')
                    y[idx] = 1.0
                    batch_y.append(y)
                except Exception:
                    continue
                if len(batch_x) >= batch_size:
                    break
            if len(batch_x) >= batch_size:
                break
        if not batch_x:
            continue
        batch_x = np.stack(batch_x)[:batch_size]
        batch_y = np.stack(batch_y)[:batch_size]
        yield batch_x, batch_y


def main():
    print('Starting oversampling fine-tune...')
    img_root = find_image_directory()
    if not img_root:
        print('Missing dataset root')
        return
    train_dir = os.path.join(img_root, 'train')
    files_by_class = build_file_lists(train_dir)
    classes = sorted(list(files_by_class.keys()))
    class_map = {c:i for i,c in enumerate(classes)}
    os.makedirs('models', exist_ok=True)
    with open(CLASS_INDICES_PATH, 'w') as f:
        json.dump({i:c for c,i in class_map.items()}, f, indent=2)
    print('Classes:', classes)

    num_classes = len(classes)
    model, base_model = create_quick_model(num_classes)
    base_model.trainable = True
    fine_tune_at = int(len(base_model.layers) * 0.9)
    for layer in base_model.layers[:fine_tune_at]:
        layer.trainable = False

    model.compile(optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE), loss='categorical_crossentropy', metrics=['accuracy'])

    callbacks = [ModelCheckpoint(MODEL_SAVE_PATH, monitor='val_accuracy', save_best_only=True, verbose=1), EarlyStopping(monitor='val_accuracy', patience=3, restore_best_weights=True, verbose=1)]

    # create validation generator with deterministic preprocessing
    val_datagen = None
    # build small validation set from files_by_class: take 20% from each class
    val_files = {}
    train_files = {}
    for c, files in files_by_class.items():
        n_val = max(1, int(0.2 * len(files)))
        random.shuffle(files)
        val_files[c] = files[:n_val]
        train_files[c] = files[n_val:]

    # validation generator yields without augmentation
    def val_generator(batch_size=BATCH_SIZE):
        all_val_files = []
        all_val_labels = []
        for idx, c in enumerate(classes):
            for f in val_files[c]:
                all_val_files.append(f)
                y = np.zeros(len(classes), dtype='float32')
                y[idx] = 1.0
                all_val_labels.append(y)
        i = 0
        while True:
            batch_x = []
            batch_y = []
            for _ in range(batch_size):
                if i >= len(all_val_files):
                    i = 0
                f = all_val_files[i]
                y = all_val_labels[i]
                i += 1
                try:
                    img = Image.open(f).convert('RGB')
                    arr = np.array(img)
                    arr = crop_face_np(arr, target_size=IMG_SIZE)
                    arr = tf.keras.applications.densenet.preprocess_input(arr)
                    batch_x.append(arr)
                    batch_y.append(y)
                except Exception:
                    continue
            if not batch_x:
                continue
            yield np.stack(batch_x), np.stack(batch_y)

    steps_per_epoch =  max(1, sum(len(v) for v in train_files.values()) // BATCH_SIZE)
    val_steps = max(1, sum(len(v) for v in val_files.values()) // BATCH_SIZE)

    train_gen = balanced_generator(train_files, class_map, batch_size=BATCH_SIZE)
    val_gen = val_generator()

    history = model.fit(train_gen, epochs=EPOCHS, steps_per_epoch=steps_per_epoch, validation_data=val_gen, validation_steps=val_steps, callbacks=callbacks, verbose=1)

    model.save(MODEL_SAVE_PATH)
    print('Saved oversample model to', MODEL_SAVE_PATH)

if __name__ == '__main__':
    main()
