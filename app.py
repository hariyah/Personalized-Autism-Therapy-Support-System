import streamlit as st
import pandas as pd
import joblib
import cv2
import numpy as np
import pytesseract
from PIL import Image
import os

# 1. POINT TO TESSERACT INSTALLATION
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# 2. PATHS TO YOUR BACKEND
MODEL_PATH = r'C:\Users\rorojith\Desktop\Autism\models\dsm5_severity_random_forest_model.pkl'
META_PATH = r'C:\Users\rorojith\Desktop\Autism\models\model_metadata.pkl'

st.set_page_config(page_title="Autism Diagnosis Support", layout="wide")
st.title("Autism DSM-5 Severity Classifier")

# Load model logic
@st.cache_resource
def load_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH), joblib.load(META_PATH)
    else:
        st.error("Model files not found! Check your 'backend' folder.")
        st.stop()

model, metadata = load_model()

# 3. SIDEBAR: DEMOGRAPHICS
st.sidebar.header("Patient Input")
age = st.sidebar.slider("Age (Years)", 1, 18, 7)
sex = st.sidebar.selectbox("Sex", options=[("Male", 1), ("Female", 0)], format_func=lambda x: x[0])[1]

# 4. STEP 1: OCR IMAGE UPLOAD
st.subheader("Step 1: Upload Therapy Report")
uploaded_file = st.file_uploader("Upload image (Scanned reports work best with high contrast)", type=["jpg", "jpeg", "png"])

# Temporary storage for detected symptoms
detected_a = {f"A{i}": False for i in range(1, 11)}

if uploaded_file:
    # Convert PIL Image to OpenCV format
    image = Image.open(uploaded_file)
    img_array = np.array(image.convert('RGB'))
    open_cv_image = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    
    st.image(image, caption="Uploaded Report", width=350)
    
    with st.spinner("Optimizing image and extracting text..."):
        # --- ENHANCED PREPROCESSING PIPELINE ---
        
        # 1. Grayscale
        gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)
        
        # 2. Rescale (Upscaling by 1.5x helps Tesseract recognize smaller fonts)
        gray = cv2.resize(gray, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)
        
        # 3. Denoising (Removes 'salt and pepper' noise from scans)
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        
        # 4. Adaptive Thresholding (Crucial for scanned pages with uneven lighting)
        # It calculates thresholds for small pixel regions rather than the whole image.
        processed_img = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )

        # Run OCR with Page Segmentation Mode 6 (Assumes a single uniform block of text)
        # oem 3 = Default (LSTM), psm 6 = Uniform block of text
        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(processed_img, config=custom_config).lower()
        
        # Optional: Display extracted text for debugging
        with st.expander("View Extracted Text (Debug)"):
            st.write(text)

        # --- KEYWORD INFERENCE LOGIC ---
        # Expanded dictionary to catch more medical/clinical terminology
        symptom_keywords = {
            "A1": ["speech", "communication", "verbal", "non-verbal", "language", "delayed", "unrelated"],
            "A2": ["eye contact", "gaze", "facial expression", "respond", "name"],
            "A3": ["pretend", "imaginative", "play", "games"],
            "A4": ["feelings", "empathy", "understand", "emotions"],
            "A5": ["change", "routine", "upset", "inflexible"],
            "A6": ["interests", "obsessive", "intense", "fixated"],
            "A7": ["sounds", "smells", "touch", "sensitive", "sensory"],
            "A8": ["socialize", "social", "interaction", "friends"],
            "A9": ["physical", "contact", "touch", "hug"],
            "A10": ["danger", "safety", "awareness", "harm"]
        }

        for code, terms in symptom_keywords.items():
            if any(term in text for term in terms):
                detected_a[code] = True

# 5. STEP 2: MANUAL VERIFICATION
st.subheader("Step 2: Verify & Fill Symptoms")
st.info("The AI highlighted symptoms based on keywords found in the report. Please verify.")

cols = st.columns(2)
final_answers = {}

questions = {
    "A1": "The person speaks very little or give unrelated answers?",
    "A2": "The person avoids eye contact or not respond when their name is called?",
    "A3": "The person does not engage in pretend or imaginative play?",
    "A4": "The person struggles to understand others’ feelings?",
    "A5": "The person easily upset by small changes?",
    "A6": "The person have unusually intense or obsessive interests?",
    "A7": "The person over or under-sensitive to sounds, smells, touch, etc.?",
    "A8": "The person struggles to socialize with others?",
    "A9": "The person avoids physical contact?",
    "A10": "The person shows little awareness of dangerous situations?"
}

for i in range(1, 11):
    key = f"A{i}"
    col = cols[0] if i <= 5 else cols[1]
    # Checkbox uses AI suggestion as default value
    final_answers[key] = 1 if col.checkbox(questions[key], value=detected_a[key]) else 0

# 6. STEP 3: PREDICT
if st.button("Generate DSM-5 Severity Level"):
    # Ensure dataframe matches the training features exactly
    input_df = pd.DataFrame([{**final_answers, "age": age, "sex": sex}])
    
    # Predict using the model
    prediction = model.predict(input_df)[0]
    result = metadata["severity_levels"][prediction]
    
    st.success(f"### Predicted Result: {result}")
    st.balloons()