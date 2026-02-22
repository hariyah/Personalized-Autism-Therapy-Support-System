import json
import os

import cv2
import numpy as np

try:
    from mtcnn import MTCNN

    MTCNN_AVAILABLE = True
except Exception:
    MTCNN_AVAILABLE = False

from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.environ.get("CAMERA_MODEL_PATH", os.path.join(BASE_DIR, "models", "model.h5"))
CAMERA_CLASS_INDICES_PATH = os.path.join(BASE_DIR, "models", "camera_class_indices.json")
CAMERA_LABEL_MAP_PATH = os.path.join(BASE_DIR, "models", "camera_label_map.json")
# Default order aligned with common FER-style 7-class models:
# [angry, disgust, fear, happy, sad, surprise, neutral]
DEFAULT_CAMERA_RAW_LABELS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
CANONICAL_LABELS = ["Natural", "anger", "fear", "joy", "sadness", "surprise"]
DEFAULT_CAMERA_LABEL_MAP = {
    "angry": "anger",
    "disgust": "uncertain",
    "unknown": "uncertain",
    "fear": "fear",
    "happy": "joy",
    "sad": "sadness",
    "surprise": "surprise",
    "neutral": "Natural",
    "natural": "Natural",
    "anger": "anger",
    "joy": "joy",
    "sadness": "sadness",
}
CAMERA_MIN_CONF = float(os.environ.get("CAMERA_MIN_CONF", "0.40"))
CAMERA_MIN_MARGIN = float(os.environ.get("CAMERA_MIN_MARGIN", "0.08"))
# Use stricter confidence for Natural, looser for explicit emotions.
CAMERA_MIN_CONF_NATURAL = float(os.environ.get("CAMERA_MIN_CONF_NATURAL", "0.40"))
CAMERA_MIN_CONF_EMOTION = float(os.environ.get("CAMERA_MIN_CONF_EMOTION", "0.20"))
# Neutral often dominates on subtle negative expressions.
# If a non-neutral class is close enough, prefer that emotion.
CAMERA_NEUTRAL_OVERRIDE_MARGIN = float(os.environ.get("CAMERA_NEUTRAL_OVERRIDE_MARGIN", "0.20"))
CAMERA_NEUTRAL_MIN_EMOTION_CONF = float(os.environ.get("CAMERA_NEUTRAL_MIN_EMOTION_CONF", "0.20"))
CAMERA_NEUTRAL_MAX_CONF = float(os.environ.get("CAMERA_NEUTRAL_MAX_CONF", "0.75"))
CAMERA_NEUTRAL_NEGATIVE_MASS_MIN = float(os.environ.get("CAMERA_NEUTRAL_NEGATIVE_MASS_MIN", "0.33"))

_CAMERA_MODEL = None
_CAMERA_RAW_LABELS = None
_CAMERA_LABEL_MAP = None
_MTCNN_DETECTOR = None
_HAAR_DETECTOR = None


def _model_input_size(model):
    shape = getattr(model, "input_shape", None)
    if isinstance(shape, list) and shape:
        shape = shape[0]
    if not shape or len(shape) < 3:
        return 100, 100

    h = shape[1] if isinstance(shape[1], int) and shape[1] else 100
    w = shape[2] if isinstance(shape[2], int) and shape[2] else 100
    return int(w), int(h)


def _model_input_channels(model):
    shape = getattr(model, "input_shape", None)
    if isinstance(shape, list) and shape:
        shape = shape[0]
    if not shape or len(shape) < 4:
        return 3
    c = shape[3]
    return int(c) if isinstance(c, int) and c else 3


def _get_camera_model():
    global _CAMERA_MODEL
    if _CAMERA_MODEL is not None:
        return _CAMERA_MODEL
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Camera model not found: {MODEL_PATH}")
    _CAMERA_MODEL = load_model(MODEL_PATH)
    return _CAMERA_MODEL


def _labels_from_indices_payload(data):
    if not isinstance(data, dict) or not data:
        return None

    # Format A: { "0": "angry", "1": "disgust", ... }
    if all(str(k).isdigit() for k in data.keys()):
        return [label for _, label in sorted(data.items(), key=lambda item: int(item[0]))]

    # Format B: { "angry": 0, "disgust": 1, ... }
    if all(isinstance(v, int) for v in data.values()):
        return [label for label, _ in sorted(data.items(), key=lambda item: int(item[1]))]

    # Format C: { "class_indices": { ... } }
    class_indices = data.get("class_indices")
    if isinstance(class_indices, dict):
        return _labels_from_indices_payload(class_indices)

    return None


def _load_camera_raw_labels():
    global _CAMERA_RAW_LABELS
    if _CAMERA_RAW_LABELS is not None:
        return _CAMERA_RAW_LABELS

    labels = DEFAULT_CAMERA_RAW_LABELS.copy()
    if os.path.exists(CAMERA_CLASS_INDICES_PATH):
        try:
            with open(CAMERA_CLASS_INDICES_PATH, "r", encoding="utf-8") as f:
                payload = json.load(f)
            loaded = _labels_from_indices_payload(payload)
            if isinstance(loaded, list) and loaded:
                labels = loaded
        except Exception:
            labels = DEFAULT_CAMERA_RAW_LABELS.copy()

    _CAMERA_RAW_LABELS = labels
    return _CAMERA_RAW_LABELS


def _load_camera_label_map():
    global _CAMERA_LABEL_MAP
    if _CAMERA_LABEL_MAP is not None:
        return _CAMERA_LABEL_MAP

    label_map = dict(DEFAULT_CAMERA_LABEL_MAP)
    if os.path.exists(CAMERA_LABEL_MAP_PATH):
        try:
            with open(CAMERA_LABEL_MAP_PATH, "r", encoding="utf-8") as f:
                payload = json.load(f)
            if isinstance(payload, dict):
                label_map = {}
                for raw_label, canonical in payload.items():
                    label_map[str(raw_label).strip().lower()] = str(canonical).strip()
        except Exception:
            label_map = dict(DEFAULT_CAMERA_LABEL_MAP)

    _CAMERA_LABEL_MAP = label_map
    return _CAMERA_LABEL_MAP


def _get_mtcnn_detector():
    global _MTCNN_DETECTOR
    if not MTCNN_AVAILABLE:
        return None
    if _MTCNN_DETECTOR is None:
        _MTCNN_DETECTOR = MTCNN()
    return _MTCNN_DETECTOR


def _get_haar_detector():
    global _HAAR_DETECTOR
    if _HAAR_DETECTOR is None:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _HAAR_DETECTOR = cv2.CascadeClassifier(cascade_path)
    return _HAAR_DETECTOR


def _clamp_box(x, y, w, h, frame_width, frame_height):
    x1 = max(0, x)
    y1 = max(0, y)
    x2 = min(frame_width, x + w)
    y2 = min(frame_height, y + h)
    return x1, y1, x2, y2


def _largest_face_box(frame):
    frame_h, frame_w = frame.shape[:2]

    mtcnn = _get_mtcnn_detector()
    if mtcnn is not None:
        # MTCNN expects RGB input; OpenCV frames are BGR by default.
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = mtcnn.detect_faces(rgb)
        boxes = []
        for result in results:
            x, y, w, h = result.get("box", [0, 0, 0, 0])
            x1, y1, x2, y2 = _clamp_box(x, y, w, h, frame_w, frame_h)
            if x2 > x1 and y2 > y1:
                boxes.append((x1, y1, x2, y2))
        if boxes:
            return max(boxes, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))

    haar = _get_haar_detector()
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = haar.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    if len(faces) > 0:
        x, y, w, h = max(faces, key=lambda r: r[2] * r[3])
        return _clamp_box(x, y, w, h, frame_w, frame_h)

    return None


def _extract_face_or_center_crop(frame):
    box = _largest_face_box(frame)
    if box:
        x1, y1, x2, y2 = box
        face = frame[y1:y2, x1:x2]
        if face.size > 0:
            return face

    # Returning None here is safer than center-cropping arbitrary background,
    # which often causes incorrect emotion predictions.
    return None


def _preprocess_face(face, target_size, channels):
    face = cv2.resize(face, target_size)

    if channels == 1:
        if len(face.shape) == 3:
            face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
        face = face.astype("float32") / 255.0
        face = np.expand_dims(face, axis=-1)
    else:
        if len(face.shape) == 2:
            face = cv2.cvtColor(face, cv2.COLOR_GRAY2BGR)
        face = img_to_array(face).astype("float32") / 255.0

    face = np.expand_dims(face, axis=0)
    return face


def predict_camera_emotion_from_frame(frame):
    model = _get_camera_model()
    raw_labels = _load_camera_raw_labels()
    label_map = _load_camera_label_map()
    target_size = _model_input_size(model)
    channels = _model_input_channels(model)

    face = _extract_face_or_center_crop(frame)
    if face is None or face.size == 0:
        return None

    processed = _preprocess_face(face, target_size, channels)
    probs = model.predict(processed, verbose=0)[0]

    labels_out = list(raw_labels or DEFAULT_CAMERA_RAW_LABELS)
    if len(labels_out) < len(probs):
        labels_out.extend([f"class_{i}" for i in range(len(labels_out), len(probs))])
    if len(labels_out) > len(probs):
        labels_out = labels_out[: len(probs)]

    canonical_probs = {label: 0.0 for label in CANONICAL_LABELS}
    for i, raw_label in enumerate(labels_out):
        prob = float(probs[i])
        mapped = label_map.get(str(raw_label).strip().lower(), str(raw_label).strip())
        if mapped in canonical_probs:
            canonical_probs[mapped] += prob
        else:
            canonical_probs[mapped] = canonical_probs.get(mapped, 0.0) + prob

    sorted_probs = sorted(canonical_probs.items(), key=lambda item: item[1], reverse=True)
    pred, top_conf = sorted_probs[0]
    second_conf = sorted_probs[1][1] if len(sorted_probs) > 1 else 0.0
    margin = top_conf - second_conf

    override_from_natural = False

    # 1) Neutral-overprediction correction.
    if pred == "Natural":
        non_neutral = [
            (label, conf)
            for label, conf in sorted_probs
            if label not in ("Natural", "uncertain")
        ]
        if non_neutral:
            alt_label, alt_conf = non_neutral[0]
            neutral_gap = top_conf - alt_conf
            negative_mass = (
                float(canonical_probs.get("sadness", 0.0))
                + float(canonical_probs.get("anger", 0.0))
                + float(canonical_probs.get("fear", 0.0))
            )
            if (
                top_conf <= CAMERA_NEUTRAL_MAX_CONF
                and alt_conf >= CAMERA_NEUTRAL_MIN_EMOTION_CONF
                and (
                    neutral_gap <= CAMERA_NEUTRAL_OVERRIDE_MARGIN
                    or negative_mass >= CAMERA_NEUTRAL_NEGATIVE_MASS_MIN
                )
            ):
                pred = alt_label
                override_from_natural = True

    # 2) Confidence gating.
    # Keep stricter threshold for Natural, lower for explicit emotions so
    # anger/fear/sadness are not masked as uncertain too often.
    if pred != "uncertain":
        pred_conf = canonical_probs.get(pred, top_conf)
        min_conf = CAMERA_MIN_CONF_NATURAL if pred == "Natural" else CAMERA_MIN_CONF_EMOTION

        if override_from_natural:
            # After neutral override, compare against other non-neutral classes.
            runner_up_conf = max(
                [conf for label, conf in sorted_probs if label not in (pred, "Natural")],
                default=0.0,
            )
        else:
            runner_up_conf = max(
                [conf for label, conf in sorted_probs if label != pred],
                default=0.0,
            )
        pred_margin = pred_conf - runner_up_conf
        if pred_conf < min_conf or pred_margin < CAMERA_MIN_MARGIN:
            pred = "uncertain"

    return pred, canonical_probs


def predict_camera_emotion_from_image_path(image_path):
    frame = cv2.imread(image_path)
    if frame is None:
        return None
    return predict_camera_emotion_from_frame(frame)


def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Failed to open camera")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            result = predict_camera_emotion_from_frame(frame)
            if result is None:
                cv2.putText(
                    frame,
                    "No Faces",
                    (30, 80),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2,
                )
            else:
                label, _ = result
                box = _largest_face_box(frame)
                if box is not None:
                    x1, y1, x2, y2 = box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
                    cv2.putText(
                        frame,
                        label,
                        (x1, max(0, y1 - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (0, 255, 0),
                        2,
                    )

            cv2.imshow("Emotion Detector (Camera)", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
