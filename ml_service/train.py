import os
import argparse
from pathlib import Path
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.applications.densenet import preprocess_input

LABELS = ["Natural","joy","fear","anger","sadness","surprise"]

def make_datagens(data_root, img_size=(224,224), batch_size=32):
    datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        preprocessing_function=preprocess_input,
        rotation_range=10,
        width_shift_range=0.05,
        height_shift_range=0.05,
        horizontal_flip=True
    )
    valgen = tf.keras.preprocessing.image.ImageDataGenerator(
        preprocessing_function=preprocess_input
    )
    train = datagen.flow_from_directory(
        Path(data_root)/'train',
        target_size=img_size,
        classes=LABELS,
        class_mode='categorical',
        batch_size=batch_size,
        shuffle=True
    )
    val = valgen.flow_from_directory(
        Path(data_root)/'val',
        target_size=img_size,
        classes=LABELS,
        class_mode='categorical',
        batch_size=batch_size,
        shuffle=False
    )
    return train, val

def build_model(num_classes=6):
    base = DenseNet121(include_top=False, weights='imagenet', input_shape=(224,224,3))
    base.trainable = False
    x = layers.Input(shape=(224,224,3))
    y = base(x, training=False)
    y = layers.GlobalAveragePooling2D()(y)
    y = layers.Dropout(0.3)(y)
    out = layers.Dense(num_classes, activation='softmax')(y)
    model = models.Model(x, out)
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
    return model

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', required=True, help='Prepared dataset root (with train/val/test)')
    ap.add_argument('--epochs', type=int, default=15)
    ap.add_argument('--batch', type=int, default=32)
    ap.add_argument('--model-out', required=True, help='Path to save best model .keras')
    args = ap.parse_args()

    train, val = make_datagens(args.data, batch_size=args.batch)
    model = build_model(num_classes=len(LABELS))

    ckpt = tf.keras.callbacks.ModelCheckpoint(args.model_out, monitor='val_accuracy',
                                              mode='max', save_best_only=True, verbose=1)
    early = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

    history = model.fit(train, validation_data=val, epochs=args.epochs, callbacks=[ckpt, early])
    print('Training complete. Best model saved to', args.model_out)

if __name__ == '__main__':
    main()
