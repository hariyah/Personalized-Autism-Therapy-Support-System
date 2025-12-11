import os
import json
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from PIL import Image
import cv2

# replicate crop_face_np from quick_finetune.py
IMG_SIZE = (224,224)

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
        arr = np.array(pil).astype('float32')/255.0
        return arr
    except Exception:
        try:
            pil = Image.fromarray(img_arr.astype('uint8'))
            pil = pil.resize(target_size)
            return np.array(pil).astype('float32')/255.0
        except Exception:
            return img_arr.astype('float32')/255.0


def run():
    print('Running generator diagnostics...')
    data_root = 'dataset'
    # detect image root
    img_root = None
    for root, dirs, files in os.walk(data_root):
        if 'train' in dirs and 'test' in dirs:
            img_root = root
            break
    if img_root is None:
        print('Could not find dataset/train structure under dataset/')
        return
    train_dir = os.path.join(img_root, 'train')
    print('Found train dir:', train_dir)

    datagen = ImageDataGenerator(preprocessing_function=lambda x: crop_face_np(x, target_size=IMG_SIZE), validation_split=0.2)
    train_gen = datagen.flow_from_directory(train_dir, target_size=IMG_SIZE, batch_size=8, class_mode='categorical', subset='training', shuffle=True)
    val_datagen = ImageDataGenerator(preprocessing_function=lambda x: crop_face_np(x, target_size=IMG_SIZE), validation_split=0.2)
    val_gen = val_datagen.flow_from_directory(train_dir, target_size=IMG_SIZE, batch_size=8, class_mode='categorical', subset='validation', shuffle=False)

    print('Class indices (train):', train_gen.class_indices)
    # counts
    try:
        train_classes = train_gen.classes
        val_classes = val_gen.classes
        unique, counts = np.unique(train_classes, return_counts=True)
        print('Train class counts:', dict(zip(unique.tolist(), counts.tolist())))
        unique_v, counts_v = np.unique(val_classes, return_counts=True)
        print('Val class counts:', dict(zip(unique_v.tolist(), counts_v.tolist())))
    except Exception as e:
        print('Could not read classes from generator:', e)

    # show a batch
    x_batch, y_batch = next(train_gen)
    print('x_batch shape:', x_batch.shape)
    print('y_batch shape:', y_batch.shape)
    labels = np.argmax(y_batch, axis=1)
    print('labels in batch:', labels)

    # save a few sample images for manual inspection
    out_dir = 'debug_output'
    os.makedirs(out_dir, exist_ok=True)
    for i in range(min(6, x_batch.shape[0])):
        arr = (x_batch[i]*255).astype('uint8')
        Image.fromarray(arr).save(os.path.join(out_dir, f'sample_{i}_label_{labels[i]}.png'))
    print('Wrote sample images to', out_dir)

    # Write a JSON report
    report = {
        'train_dir': train_dir,
        'class_indices': train_gen.class_indices,
        'train_class_counts': dict(zip(unique.tolist(), counts.tolist())) if 'unique' in locals() else {},
        'val_class_counts': dict(zip(unique_v.tolist(), counts_v.tolist())) if 'unique_v' in locals() else {},
        'sample_labels': labels.tolist()
    }
    with open('debug_output/debug_report.json', 'w') as rf:
        json.dump(report, rf, indent=2)
    print('Wrote debug report to debug_output/debug_report.json')


if __name__ == '__main__':
    try:
        run()
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        try:
            with open('debug_generators.log', 'w', encoding='utf-8') as lf:
                lf.write('Exception in debug_generators.py\n')
                lf.write(tb)
        except Exception:
            pass
        print('Exception occurred; wrote debug_generators.log')
