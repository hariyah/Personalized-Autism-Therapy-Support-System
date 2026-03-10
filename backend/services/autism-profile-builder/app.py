from flask import Flask, request, jsonify, g, Response
import joblib
import pandas as pd
import numpy as np
import pytesseract
import cv2
from PIL import Image
import io
import re
import base64
import os
from datetime import datetime
from functools import wraps
import jwt
import bcrypt
from pymongo import MongoClient, DESCENDING
from bson import ObjectId

app = Flask(__name__)

# CORS: handle preflight in before_request so nothing else can return 403
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        resp = Response("", status=200)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        resp.headers["Access-Control-Max-Age"] = "86400"
        return resp

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# ─── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.environ.get("MONGODB_DB", "autism_profile")

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
guardians_col = db["guardians"]
patients_col = db["patients"]
assessments_col = db["assessments"]

# Ensure unique index on guardian email
guardians_col.create_index("email", unique=True)

# ─── Load ML Model ─────────────────────────────────────────────────────────────
MODEL_PATH = os.environ.get("MODEL_PATH", "models/dsm5_severity_random_forest_model.pkl")
META_PATH  = os.environ.get("META_PATH",  "models/model_metadata.pkl")

model    = joblib.load(MODEL_PATH)
metadata = joblib.load(META_PATH)

# ─── A1–A10 Keyword Map ────────────────────────────────────────────────────────
A_KEYWORDS = {
    "A1": ["no speech", "limited speech", "does not talk", "echolalia", "speech delay",
           "verbal delay", "non verbal", "nonverbal", "does not speak"],
    "A2": ["poor eye contact", "no eye contact", "does not respond to name",
           "avoids eye contact", "limited eye contact", "name response"],
    "A3": ["no pretend play", "does not play", "imaginative play absent",
           "no imaginative", "lacks pretend", "no symbolic play"],
    "A4": ["does not understand emotions", "poor empathy", "lacks empathy",
           "difficulty understanding feelings", "no emotional reciprocity"],
    "A5": ["resistant to change", "rigid routine", "easily upset",
           "inflexible", "upset by changes", "insists on sameness"],
    "A6": ["obsessive", "fixated interest", "repetitive interest",
           "intense interest", "restricted interest", "preoccupation"],
    "A7": ["sensory sensitive", "sensitive to sound", "touch sensitive",
           "sensory processing", "hypersensitive", "over sensitive", "auditory sensitivity"],
    "A8": ["poor social interaction", "avoids peers", "social withdrawal",
           "difficulty socializing", "limited social", "does not interact"],
    "A9": ["avoids physical contact", "does not like touch", "aversion to touch",
           "avoids being touched", "tactile defensiveness"],
    "A10": ["no danger awareness", "unsafe behavior", "poor safety awareness",
            "unaware of danger", "risk taking behavior", "impaired judgment"]
}

QUESTION_LABELS = {
    "A1": "Does your child speak very little or give unrelated answers?",
    "A2": "Does your child avoid eye contact or not respond when their name is called?",
    "A3": "Does your child not engage in pretend or imaginative play?",
    "A4": "Does your child struggle to understand others' feelings?",
    "A5": "Is your child easily upset by small changes in routine?",
    "A6": "Does your child have unusually intense or obsessive interests?",
    "A7": "Is your child over- or under-sensitive to sounds, smells, or touch?",
    "A8": "Does your child struggle to socialize with others?",
    "A9": "Does your child avoid physical contact?",
    "A10": "Does your child show little awareness of dangerous situations?"
}

DOMAIN_INFO = {
    "A1": "Social Communication", "A2": "Social Communication", "A3": "Social Communication",
    "A4": "Social Communication", "A5": "Restricted & Repetitive Behavior",
    "A6": "Restricted & Repetitive Behavior", "A7": "Restricted & Repetitive Behavior (Sensory)",
    "A8": "Social Communication", "A9": "Social Communication",
    "A10": "Restricted & Repetitive Behavior"
}

# ─── Auth helpers ─────────────────────────────────────────────────────────────
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        try:
            token = auth.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            g.guardian_id = payload["id"]
        except (jwt.InvalidTokenError, KeyError) as e:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

def serialize_doc(d):
    if d is None:
        return None
    d = dict(d)
    if "_id" in d:
        d["id"] = str(d.pop("_id"))
    return d

# ─── Helper Functions ──────────────────────────────────────────────────────────
def ocr_from_base64(image_b64: str) -> str:
    image_data = base64.b64decode(image_b64)
    np_arr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)[1]
    return pytesseract.image_to_string(gray)

def extract_sections(text: str) -> dict:
    sections = {"Chief Complaints": "", "Felt Needs": "", "Therapy Needs": ""}
    for section in sections.keys():
        pattern = rf"{section}(.+?)(?=Chief Complaints|Felt Needs|Therapy Needs|$)"
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            sections[section] = match.group(1).strip()
    return sections

def infer_a_scores(text: str) -> dict:
    text_lower = text.lower()
    scores = {}
    for key, keywords in A_KEYWORDS.items():
        scores[key] = None
        for kw in keywords:
            if kw in text_lower:
                scores[key] = 1
                break
    return scores

def compute_severity_details(a_scores: dict) -> dict:
    social_keys = ["A1","A2","A3","A4","A7","A8","A9"]
    restricted_keys = ["A5","A6","A10"]
    social_score = sum(a_scores.get(k, 0) or 0 for k in social_keys)
    restricted_score = sum(a_scores.get(k, 0) or 0 for k in restricted_keys)
    tss = 1.5 * social_score + 1.0 * restricted_score
    return {
        "social_communication_score": social_score,
        "restricted_behavior_score": restricted_score,
        "total_severity_score": round(tss, 2),
        "max_social": len(social_keys),
        "max_restricted": len(restricted_keys),
    }

# ─── Auth routes ───────────────────────────────────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "email and password required"}), 400
    email = data["email"].strip().lower()
    password = data["password"]
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if guardians_col.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    doc = {
        "email": email,
        "password_hash": password_hash,
        "fullName": data.get("fullName", ""),
        "phone": data.get("phone", ""),
        "relationship": data.get("relationship", "Parent"),
        "createdAt": datetime.utcnow().isoformat(),
    }
    r = guardians_col.insert_one(doc)
    guardian_id = str(r.inserted_id)
    token = jwt.encode(
        {"id": guardian_id, "email": email},
        SECRET_KEY,
        algorithm="HS256",
    )
    user = {
        "id": guardian_id,
        "email": doc["email"],
        "fullName": doc["fullName"],
        "phone": doc["phone"],
        "relationship": doc["relationship"],
    }
    return jsonify({"token": token, "user": user}), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "email and password required"}), 400
    email = data["email"].strip().lower()
    doc = guardians_col.find_one({"email": email})
    if not doc:
        return jsonify({"error": "Invalid email or password"}), 401
    if not bcrypt.checkpw(data["password"].encode("utf-8"), doc["password_hash"].encode("utf-8")):
        return jsonify({"error": "Invalid email or password"}), 401
    guardian_id = str(doc["_id"])
    token = jwt.encode(
        {"id": guardian_id, "email": email},
        SECRET_KEY,
        algorithm="HS256",
    )
    user = {
        "id": guardian_id,
        "email": doc["email"],
        "fullName": doc.get("fullName", ""),
        "phone": doc.get("phone", ""),
        "relationship": doc.get("relationship", "Parent"),
    }
    return jsonify({"token": token, "user": user})

# ─── API routes ────────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "Random Forest DSM-5 Classifier"})

@app.route("/api/ocr", methods=["POST"])
def ocr_report():
    data = request.get_json()
    if not data or "image_b64" not in data:
        return jsonify({"error": "image_b64 required"}), 400
    try:
        raw_text = ocr_from_base64(data["image_b64"])
        sections = extract_sections(raw_text)
        combined = " ".join(sections.values())
        a_scores = infer_a_scores(combined)
        unanswered = [k for k, v in a_scores.items() if v is None]
        return jsonify({
            "raw_text": raw_text, "sections": sections, "a_scores": a_scores,
            "unanswered": unanswered, "questions": QUESTION_LABELS,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/predict", methods=["POST"])
@token_required
def predict():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    guardian_id = g.guardian_id
    a_scores = data.get("a_scores", {})
    age = float(data.get("age", 7))
    sex = int(data.get("sex", 1))
    patient_id = data.get("patient_id")

    features = {k: int(a_scores.get(k, 0) or 0) for k in ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10"]}
    features["age"] = age
    features["sex"] = sex
    df = pd.DataFrame([features])
    prediction = int(model.predict(df)[0])
    severity_label = metadata["severity_levels"][prediction]
    domain_scores = compute_severity_details(features)
    radar_data = [
        {"indicator": key, "label": QUESTION_LABELS[key], "domain": DOMAIN_INFO[key], "value": int(a_scores.get(key, 0) or 0)}
        for key in [f"A{i}" for i in range(1, 11)]
    ]
    result = {
        "severity_level": prediction,
        "severity_label": severity_label,
        "domain_scores": domain_scores,
        "radar_data": radar_data,
        "a_scores": {k: int(v or 0) for k, v in a_scores.items()},
        "age": age, "sex": sex,
        "timestamp": datetime.utcnow().isoformat(),
    }
    if patient_id:
        assessments_col.insert_one({
            "guardian_id": guardian_id,
            "patient_id": patient_id,
            **result,
        })
    return jsonify(result)

@app.route("/api/patients", methods=["POST"])
@token_required
def create_patient():
    data = request.get_json()
    guardian_id = g.guardian_id
    patient_data = {
        "guardian_id": guardian_id,
        "name": data.get("name"),
        "dob": data.get("dob"),
        "sex": data.get("sex"),
        "diagnosis": data.get("diagnosis", ""),
        "notes": data.get("notes", ""),
        "created_at": datetime.utcnow().isoformat(),
    }
    r = patients_col.insert_one(patient_data)
    patient_id = str(r.inserted_id)
    out = {"patient_id": patient_id, **patient_data}
    out.pop("_id", None)
    return jsonify(out), 201

@app.route("/api/patients/<guardian_id>", methods=["GET"])
@token_required
def get_patients(guardian_id):
    if g.guardian_id != guardian_id:
        return jsonify({"error": "Forbidden"}), 403
    cursor = patients_col.find({"guardian_id": guardian_id})
    patients = []
    for d in cursor:
        d["patient_id"] = str(d.pop("_id"))
        d.pop("guardian_id", None)
        patients.append(d)
    return jsonify(patients)

@app.route("/api/assessments/<guardian_id>/<patient_id>", methods=["GET"])
@token_required
def get_assessments(guardian_id, patient_id):
    if g.guardian_id != guardian_id:
        return jsonify({"error": "Forbidden"}), 403
    cursor = assessments_col.find(
        {"guardian_id": guardian_id, "patient_id": patient_id}
    ).sort("timestamp", DESCENDING)
    assessments = []
    for d in cursor:
        d["assessment_id"] = str(d.pop("_id"))
        d.pop("guardian_id", None)
        d.pop("patient_id", None)
        assessments.append(d)
    return jsonify(assessments)

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 7001)))
