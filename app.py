import streamlit as st
import pandas as pd
import joblib
import cv2
import numpy as np
import pytesseract
from PIL import Image
import os
import shap
import matplotlib.pyplot as plt
import google.generativeai as genai
from fpdf import FPDF
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# 1. POINT TO TESSERACT INSTALLATION
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# 2. PATHS TO  BACKEND
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

# --- PDF GENERATION HELPER ---
def clean_text(text):
    # Replacements for common unicode characters that fpdf (latin-1) can't handle
    replacements = {
        "\u2013": "-",  # en-dash
        "\u2014": "--", # em-dash
        "\u2018": "'",  # left single quote
        "\u2019": "'",  # right single quote
        "\u201c": '"',  # left double quote
        "\u201d": '"',  # right double quote
        "\u2022": "*"   # bullet
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    # Finally encode to latin-1, replacing any other unknowns with ?
    return text.encode('latin-1', 'replace').decode('latin-1')

def create_pdf(text, age, sex, result):
    class PDF(FPDF):
        def header(self):
            self.set_font('Arial', 'B', 15)
            self.cell(0, 10, 'Autism Severity Clinical Profile', 0, 1, 'C')
            self.ln(5)

        def footer(self):
            self.set_y(-15)
            self.set_font('Arial', 'I', 8)
            self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    pdf = PDF()
    pdf.add_page()
    
    # --- Patient Demographics Section ---
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, "Patient Demographics", ln=True)
    pdf.set_font("Arial", size=11)
    
    # Draw a line 
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(2)
    
    pdf.cell(0, 6, txt=f"Age: {age} years", ln=True)
    pdf.cell(0, 6, txt=f"Sex: {'Male' if sex == 1 else 'Female'}", ln=True)
    pdf.cell(0, 6, txt=clean_text(f"Assessment Result: {result}"), ln=True)
    pdf.ln(5)
    
    # --- Clinical Profile Section (Markdown Parsing) ---
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, "Clinical Profile", ln=True)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    
    # Basic Markdown Parser using clean_text for sanitization
    # Resets font for content
    pdf.set_font("Arial", size=11)
    
    cleaned_text = clean_text(text)
    lines = cleaned_text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            pdf.ln(2)
            continue
            
        # Headers (##)
        if line.startswith('##') or line.startswith('**') and line.endswith('**') and len(line) < 60:
            # Treat as subheader
            header_text = line.replace('#', '').replace('*', '').strip()
            pdf.ln(3)
            pdf.set_font("Arial", 'B', 11)
            pdf.multi_cell(0, 6, header_text)
            pdf.set_font("Arial", size=11)
            
        # Bullet Points
        elif line.startswith('- ') or line.startswith('* '):
            list_text = line[2:].strip()
            # Handle bolding inside lines (simple check)
            if "**" in list_text:
                # Simple replacement for now, just removing markers to look clean
                # Proper bold mixing in FPDF is hard without splitting cells
                list_text = list_text.replace('**', '')
                
            pdf.set_x(15) # Indent
            pdf.multi_cell(0, 6, f"{chr(149)} {list_text}") # Bullet char
        
        # Regular Text
        else:
            # Handle bolding inside paragraphs
            clean_line = line.replace('**', '') 
            pdf.multi_cell(0, 6, clean_line)
            
    return pdf.output(dest='S').encode('latin-1', 'replace')

import auth

# --- SESSION STATE INITIALIZATION ---
if "logged_in" not in st.session_state:
    st.session_state["logged_in"] = False
if "username" not in st.session_state:
    st.session_state["username"] = ""

def login_page():
    # Use columns to center the login form and make it more concise
    _, col, _ = st.columns([1, 2, 1])
    with col:
        with st.container(border=True):
            st.title("Login")
            username = st.text_input("Username", key="login_username")
            password = st.text_input("Password", type="password", key="login_password")
            if st.button("Login", key="login_btn"):
                user = auth.authenticate_user(username, password)
                if user:
                    st.session_state["logged_in"] = True
                    st.session_state["username"] = username
                    st.success(f"Welcome back, {username}!")
                    st.rerun()
                else:
                    st.error("Invalid username or password")

def signup_page():
    # Use columns to center the signup form
    _, col, _ = st.columns([1, 2, 1])
    with col:
        with st.container(border=True):
            st.title("Sign Up")
            email = st.text_input("Email", key="signup_email")
            username = st.text_input("Username", key="signup_username")
            password = st.text_input("Password", type="password", key="signup_password")
            if st.button("Sign Up", key="signup_btn"):
                if username and password and email:
                    success, msg = auth.create_user(username, email, password)
                    if success:
                        st.success(msg)
                        st.info("Please go to the Login tab to sign in.")
                    else:
                        st.error(msg)
                else:
                    st.warning("Please fill in all fields")

def main_app():
    if st.sidebar.button("Logout"):
        st.session_state["logged_in"] = False
        st.session_state["username"] = ""
        st.rerun()

    st.write(f"Logged in as: **{st.session_state['username']}**")
    
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
            
            # # Optional: Display extracted text for debugging
            # with st.expander("View Extracted Text (Debug)"):
            #     st.write(text)

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
        
        st.markdown(f"### Predicted Result: {result}")

        # --- EXPLAINABLE AI (XAI) ---
        st.markdown("---")
        st.subheader("Why this prediction?")
        st.write("The chart below shows how each symptom contributed to the result.")

        # Calculate SHAP values
        # TreeExplainer is efficient for Random Forests
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(input_df)

        # SHAP returns a list of arrays for classification (one per class) OR a single array.
        if isinstance(shap_values, list):
            # Case A: List of arrays (one per class), each (n_samples, n_features)
            shap_val = shap_values[prediction][0]
            expected_val = explainer.expected_value[prediction]
        
        elif isinstance(shap_values, np.ndarray):
            if len(shap_values.shape) == 3:
                 # Case B: Array of shape (n_samples, n_features, n_classes)
                 # shap_val should be (n_features,)
                 shap_val = shap_values[0, :, prediction]
                 expected_val = explainer.expected_value[prediction]
            elif len(shap_values.shape) == 2:
                 # Case C: Single output (binary/regression), shape (n_samples, n_features)
                 shap_val = shap_values[0]
                 expected_val = explainer.expected_value[0] if isinstance(explainer.expected_value, (list, np.ndarray)) else explainer.expected_value
            else:
                 st.error(f"Unexpected SHAP values shape: {shap_values.shape}")
                 st.stop()
        else:
            st.error(f"Unexpected SHAP values type: {type(shap_values)}")
            st.stop()

        # Create figure for the plot
        fig, ax = plt.subplots()
        
        # Force plot or waterfall plot are good for local explanation
        # Waterfall is often clearer for single instances
        shap.plots.waterfall(shap.Explanation(values=shap_val, 
                                             base_values=expected_val, 
                                             data=input_df.iloc[0], 
                                             feature_names=input_df.columns), 
                             show=False)
        
        st.pyplot(fig)
        
        # Simple textual explanation of top contributor
        # Find feature with max absolute impact
        max_idx = np.argmax(np.abs(shap_val))
        top_feature = input_df.columns[max_idx]
        impact = "increased" if shap_val[max_idx] > 0 else "decreased"
        
        st.info(f"**Key Driver:** The feature **'{top_feature}'** had the strongest influence and **{impact}** the severity score.")

        # --- GEMINI AI PROFILE ---
        st.markdown("---")
        st.subheader("AI Clinical Profile")

        if not os.getenv("GEMINI_API_KEY"):
            st.warning("⚠️ Gemini API Key not found. Please set `GEMINI_API_KEY` in your `.env` file to generate the clinical profile.")
        else:
            with st.spinner("Generating human-readable profile..."):
                try:
                    # Prepare data for the LLM
                    top_features_indices = np.argsort(np.abs(shap_val))[-5:][::-1] # Top 5 features
                    top_features_desc = []
                    for idx in top_features_indices:
                        feat_name = input_df.columns[idx]
                        feat_impact = shap_val[idx]
                        direction = "contributes to higher severity" if feat_impact > 0 else "contributes to lower severity"
                        top_features_desc.append(f"- {questions.get(feat_name, feat_name)} ({direction})")
                    
                    features_text = "\n".join(top_features_desc)
                    
                    prompt = f"""
                    You are a helpful clinical assistant for autism diagnosis support.
                    
                    Patient Demographics:
                    - Age: {age} years
                    - Sex: {"Male" if sex == 1 else "Female"}
                    
                    Clinical Assessment Result:
                    - Predicted DSM-5 Severity Level: {result}
                    
                    Key Clinical Observations (from automated analysis):
                    {features_text}
                    
                    Task:
                    Write a coherent, human-readable profile for this patient. 
                    Explain the severity level and the reasons for detection based on the observations. 
                    Use a professional but accessible tone. Avoid medical jargon where simple terms suffice.
                    Do not give a medical diagnosis, but rather a "support profile" based on the screener.
                    """
                    
                    model_gemini = genai.GenerativeModel('gemini-2.5-flash')
                    response = model_gemini.generate_content(prompt)
                    
                    st.markdown(response.text)
                    
                    # --- DOWNLOAD PDF ---
                    st.write("")
                    pdf_bytes = create_pdf(response.text, age, sex, result)
                    st.download_button(
                        label="Download Profile as PDF",
                        data=pdf_bytes,
                        file_name="clinical_profile.pdf",
                        mime="application/pdf"
                    )
                    
                except Exception as e:
                    st.error(f"Error generating profile: {e}")

# --- APP FLOW CONTROL ---

if st.session_state["logged_in"]:
    main_app()
else:
    tab1, tab2 = st.tabs(["Login", "Sign Up"])
    with tab1:
        login_page()
    with tab2:
        signup_page()