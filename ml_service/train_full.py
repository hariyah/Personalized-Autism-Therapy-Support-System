"""
Full training pipeline for DenseNet121 emotion classifier
- Applies face-crop preprocessing consistent with inference
- Uses class weighting and optional oversampling
- Uses callbacks: ModelCheckpoint, ReduceLROnPlateau, EarlyStopping, TensorBoard
- Optional focal loss

Run (recommended on GPU):
python -u train_full.py --epochs 30 --batch-size 16 --output models/densenet121_emotion_model_full.keras

"""

import os
import argparse
import json
import math
import random
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, TensorBoard
from tensorflow.keras import layers
from sklearn.utils.class_weight import compute_class_weight
from PIL import Image
import cv2

# Focal loss implementation
def focal_loss(gamma=2., alpha=.25):
    def loss(y_true, y_pred):
        y_true = tf.convert_to_tensor(y_true, dtype=tf.float32)
        y_pred = tf.convert_to_tensor(y_pred, dtype=tf.float32)
        epsilon = tf.keras.backend.epsilon()
        y_pred = tf.clip_by_value(y_pred, epsilon, 1. - epsilon)
        cross_entropy = -y_true * tf.math.log(y_pred)
        weight = alpha * tf.pow(1 - y_pred, gamma)
        loss = weight * cross_entropy
        return tf.reduce_sum(loss, axis=1)
    return loss


def find_image_directory(data_root='dataset'):
    for root, dirs, files in os.walk(data_root):
        if 'train' in dirs and 'test' in dirs:
            train_path = os.path.join(root, 'train')
            # verify expected class folders
            try:
                contents = os.listdir(train_path)
                if any(c.lower() in ['anger','fear','joy','sadness','surprise','natural'] for c in contents):
                    return root
            except Exception:
                pass
    if os.path.exists(os.path.join(data_root, 'train')):
        return data_root
    return None


def crop_face_np(img_arr, target_size=(224,224)):
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
        return np.array(pil).astype('float32')
    except Exception:
        try:
            pil = Image.fromarray(img_arr.astype('uint8'))
            pil = pil.resize(target_size)
            return np.array(pil).astype('float32')
        except Exception:
            return img_arr.astype('float32')


def build_model(num_classes, input_shape=(224,224,3), dropout=0.3):
    base = keras.applications.DenseNet121(weights='imagenet', include_top=False, input_shape=input_shape)
    base.trainable = False
    inputs = keras.Input(shape=input_shape)
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(dropout)(x)
    x = layers.Dense(256, activation='relu')(x)
    x = layers.Dropout(dropout)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    model = keras.Model(inputs, outputs)
    return model, base


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--epochs', type=int, default=30)
    p.add_argument('--batch-size', type=int, default=16)
    p.add_argument('--output', type=str, default='models/densenet121_emotion_model_full.keras')
    p.add_argument('--use-focal', action='store_true')
    p.add_argument('--oversample', action='store_true')
    p.add_argument('--tensorboard-logdir', type=str, default='logs')
    return p.parse_args()


def main():
    args = parse_args()
    os.makedirs('models', exist_ok=True)
    img_root = find_image_directory()
    if not img_root:
        print('Could not find dataset under dataset/. Please extract dataset.')
        return
    train_dir = os.path.join(img_root, 'train')
    val_split = 0.2

    # Data generators
    datagen = ImageDataGenerator(
        preprocessing_function=lambda x: tf.keras.applications.densenet.preprocess_input(crop_face_np(x)),
        rotation_range=20,
        width_shift_range=0.15,
        height_shift_range=0.15,
        shear_range=0.1,
        zoom_range=0.15,
        horizontal_flip=True,
        validation_split=val_split
    )

    train_gen = datagen.flow_from_directory(train_dir, target_size=(224,224), batch_size=args.batch_size, class_mode='categorical', subset='training', shuffle=True)
    val_gen = datagen.flow_from_directory(train_dir, target_size=(224,224), batch_size=args.batch_size, class_mode='categorical', subset='validation', shuffle=False)

    class_indices = train_gen.class_indices
    inv_map = {v:k for k,v in class_indices.items()}
    with open('models/class_indices.json','w') as f:
        json.dump(inv_map, f, indent=2)
    print('Class indices saved to models/class_indices.json')

    num_classes = len(class_indices)
    print('Num classes:', num_classes)

    # compute class weights
    classes_array = train_gen.classes
    labels = np.unique(classes_array)
    class_weights = None
    try:
        weights = compute_class_weight('balanced', classes=labels, y=classes_array)
        class_weights = {int(l): float(w) for l,w in zip(labels, weights)}
        print('Computed class weights:', class_weights)
    except Exception as e:
        print('Class weight computation failed:', e)

    model, base = build_model(num_classes)
    # Unfreeze last block for fine-tuning
    base.trainable = True
    fine_tune_at = int(len(base.layers) * 0.9)
    for layer in base.layers[:fine_tune_at]:
        layer.trainable = False

    opt = keras.optimizers.Adam(learning_rate=1e-5)
    loss = 'categorical_crossentropy'
    if args.use_focal:
        loss = focal_loss()
        print('Using focal loss')

    model.compile(optimizer=opt, loss=loss, metrics=['accuracy'])

    # Callbacks
    ckpt = ModelCheckpoint(args.output, monitor='val_accuracy', save_best_only=True, verbose=1)
    es = EarlyStopping(monitor='val_accuracy', patience=6, restore_best_weights=True, verbose=1)
    rlrop = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, verbose=1)
    tb = TensorBoard(log_dir=args.tensorboard_logdir)

    callbacks = [ckpt, es, rlrop, tb]

    # Optionally wrap generator with oversampling to balance classes
    if args.oversample:
        print('Using oversampling generator')
        # build file lists
        files_by_class = {}
        classes = sorted([d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir,d))])
        for c in classes:
            cd = os.path.join(train_dir,c)
            files = [os.path.join(cd,f) for f in os.listdir(cd) if f.lower().endswith(('.jpg','.jpeg','.png'))]
            files_by_class[c]=files
        def balanced_gen(batch_size=args.batch_size):
            class_names=list(files_by_class.keys())
            n_classes=len(class_names)
            per_class = max(1, batch_size//n_classes)
            while True:
                batch_x=[]
                batch_y=[]
                for _ in range(per_class):
                    for idx, cname in enumerate(class_names):
                        files = files_by_class[cname]
                        if not files: continue
                        f = random.choice(files)
                        try:
                            img = Image.open(f).convert('RGB')
                            arr = np.array(img)
                            arr = crop_face_np(arr)
                            arr = tf.keras.applications.densenet.preprocess_input(arr)
                            batch_x.append(arr)
                            y = np.zeros(len(class_names), dtype='float32')
                            y[idx]=1.0
                            batch_y.append(y)
                        except Exception:
                            continue
                        if len(batch_x) >= batch_size:
                            break
                    if len(batch_x) >= batch_size:
                        break
                if not batch_x:
                    continue
                yield np.stack(batch_x)[:batch_size], np.stack(batch_y)[:batch_size]
        steps_per_epoch = max(1, sum(len(v) for v in files_by_class.values()) // args.batch_size)
        val_steps = max(1, val_gen.samples // args.batch_size)
        history = model.fit(balanced_gen(), epochs=args.epochs, steps_per_epoch=steps_per_epoch, validation_data=val_gen, validation_steps=val_steps, callbacks=callbacks, class_weight=class_weights, verbose=1)
    else:
        history = model.fit(train_gen, epochs=args.epochs, validation_data=val_gen, callbacks=callbacks, class_weight=class_weights, verbose=1)

    # Save final model
    model.save(args.output)
    print('Saved final model to', args.output)

    # Evaluate on validation set
    val_loss, val_acc = model.evaluate(val_gen, verbose=0)
    print('Validation accuracy:', val_acc)


if __name__ == '__main__':
    main()
