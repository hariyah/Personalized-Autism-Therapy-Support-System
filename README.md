Personalized-Autism-Therapy-Support-System
A web-based AI-powered platform that helps parents, guardians, and therapists deliver personalized autism care through intelligent analytics, behavior tracking, and real-time therapy recommendations.
 AI-Assisted Caregiver–Therapist Collaboration System for Autism Support (ACT-CS)
Final Year Research Project – PP1 (Checklist Submission)
 Project Overview
This project presents an AI-Assisted Caregiver–Therapist Collaboration System for Autism Support, designed to improve communication and response efficiency between caregivers and therapists using voice-based AI processing.
Caregivers often describe a child’s behavior verbally, which can be time-consuming and difficult for therapists to analyze at scale. This system enables caregivers to submit voice notes, which are automatically processed using speech and natural language processing models to generate structured insights for therapists.

The system performs:
  Voice → Text transcription
  Issue identification
  Urgency assessment
  Therapist-friendly summarization
The final output supports decision-making, not diagnosis, and aims to reduce therapist workload while improving response prioritization.

  Main Objectives
 Build a voice-based AI pipeline for autism caregiver reporting
 Train and compare multiple Transformer-based NLP models
 Select the best-performing models based on evaluation
 Develop a web application (frontend + backend) for real-world interaction
 Demonstrate software engineering best practices and reproducibility

  System Architecture
 🔹 High-Level Workflow
Caregiver Voice Input
        │
        ▼
Speech-to-Text (Whisper)
        │
        ▼
Issue Classification (RoBERTa)
        │
        ▼
Urgency Classification (DistilBERT)
        │
        ▼
Text Summarization (T5)
        │
        ▼
Therapist Dashboard (Web Application)

 🧪 Models Used

 🎙️ Speech-to-Text (ASR)

 Model: Whisper-small
 Framework: HuggingFace Transformers
 Input: Caregiver voice recordings
 Output: Clean text transcript

  Issue Classification
 Models Trained:
   DistilBERT (baseline)
   RoBERTa (final)
   DeBERTa (comparison)

 Final Selected Model: RoBERTa-base
 Performance: Test Accuracy ≈ 100%, Weighted F1 ≈ 100%
 Reason for Selection:
   Best performance–efficiency trade-off
   Faster inference than DeBERTa
   Suitable for deployment

Saved Model Folder:


models/issue_classifier_roberta/

 🚨 Urgency Classification
 Models Trained:
   DistilBERT (final)
   RoBERTa (comparison)

 Final Selected Model: DistilBERT
 Performance: Test Accuracy ≈ 85–95%
 Reason for Selection:
   Simpler classification task
   Strong baseline performance
   Lightweight and efficient

Saved Model Folder:
models/urgency_classifier/

 📝 Text Summarization
 Model: T5-small
 Purpose: Generate concise therapist-friendly summaries
 Evaluation: Qualitative (clarity and relevance)

Saved Model Folder:


models/summarization_t5/
  Final Selected Models (Used in System)
Task                   	  Model            
Speech-to-Text         	  Whisper-small    
Issue Classification   	  RoBERTa-base
Urgency Classification	  DistilBERT
Summarization   	        T5-small     

 📁 Project Folder Structure
ACT-CS/
│
├── models/
│   ├── issue_classifier_roberta/
│   ├── urgency_classifier/
│   └── summarization_t5/
│
├── notebooks/
│   ├── 01_data_preparation.ipynb
│   ├── 02_train_issue_classifier_bert.ipynb
│   ├── 03_train_urgency_classifier_bert.ipynb
│   ├── 04_train_summarization_t5.ipynb
│   ├── 06_train_text_classifier_compare.ipynb
│   ├── 07_train_issue_classifier_deberta.ipynb
│   └── 05_full_pipeline_inference_with_voice.ipynb
│
├── client/         React + Tailwind frontend
├── server/         Node.js + Express backend
├── ai-service/     Python FastAPI AI microservice
├── README.md
└── requirements.txt

 Notebook Responsibilities

| Notebook                                    | Purpose                                  
| ------------------------------------------- | ---------------------------------------- 
| 01_data_preparation.ipynb                   | Dataset cleaning & train/val/test splits 
| 02_train_issue_classifier_bert.ipynb        | Baseline issue model               
| 06_train_text_classifier_compare.ipynb      | Final issue model (RoBERTa) 
| 07_train_issue_classifier_deberta.ipynb     | Issue model comparison       
| 03_train_urgency_classifier_bert.ipynb      | Final urgency model       
| 04_train_summarization_t5.ipynb             | Summarization model training        
| 05_full_pipeline_inference_with_voice.ipynb | Final end-to-end voice pipeline     

  Web Application Overview
 Frontend
 Framework: React
 Styling: Tailwind CSS
 Features:

   Voice upload
   Result visualization
   Therapist dashboard

 Backend
 Framework: Node.js + Express
 Database: MongoDB
 Role:

   Store submissions
   Communicate with AI service
   Serve dashboard data

 AI Service
 Framework: FastAPI (Python)
 Role:
   Run trained models
   Return structured AI outputs via API

 ⚙️ Dependencies
 Core
 Python 3.9+
 Transformers (HuggingFace)
 Torch
 NumPy, Pandas
 Scikit-learn

 Web
 Node.js
 Express
 MongoDB
 React
 Tailwind CSS

 Audio
 Whisper
 Librosa
 FFmpeg

 🔁 Version Control & Collaboration (PP1 Requirement)

This repository demonstrates:
✅ Structured Git commits
✅ Incremental development
✅ Multiple notebooks with clear progression
✅ Reproducible experiments
✅ Clear separation of training, evaluation, and deployment
Evaluators can verify progress through commit history and repository structure.

 PP1 Checklist Summary
 ✔ Git repository created
 ✔ README documentation completed
 ✔ Model architecture explained
 ✔ Notebooks clearly defined
 ✔ Frontend + backend development included
 ✔ Final demo pipeline implemented

 👤 Author Contribution
Role: AI Modeling & System Integration
Contributions:
 Dataset preparation
 NLP model training & evaluation
 Overfitting analysis & model selection
 End-to-end voice pipeline
 AI backend integration
 Web application architecture

