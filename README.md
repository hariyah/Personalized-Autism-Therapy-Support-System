1.	AI-Assisted Caregiver–Therapist Collaboration System for Autism Support (ACT-CS)
A Web-Based Voice-Driven AI System for Intelligent Autism Therapy Support
Final Year Research Project – PP1
________________________________________

2.	1. PROJECT OVERVIEW
      
The AI-Assisted Caregiver–Therapist Collaboration System (ACT-CS) is a web-based AI-powered platform designed to enhance communication efficiency, response prioritization, and workload reduction in autism therapy support.
Caregivers often describe a child’s behavioral concerns verbally, which results in unstructured, subjective, and time-consuming information for therapists to process. ACT-CS addresses this challenge by allowing caregivers to submit voice recordings, which are automatically processed using speech recognition and transformer-based natural language processing (NLP) models.
The system converts caregiver speech into structured, therapist-friendly insights, including:
•	Identified behavioral issues
•	Assessed urgency level
•	Concise summaries for quick review
________________________________________

3.	2. SYSTEM ARCHITECTURAL DIAGRAM
      
 <img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/6168fa1b-18c8-450e-8230-622c148e9fa5" />
 
________________________________

4.	3. FEATURES & MAJOR BREAKTHROUGHS
•	Voice-Based Caregiver Reporting
Caregivers submit real-world behavioral observations using voice input instead of lengthy forms.
•	Automatic Speech-to-Text Transcription
Uses Whisper-small for accurate transcription of caregiver speech.
•	Issue Classification Using Transformer Models
Classifies reported concerns using RoBERTa-base, achieving near-perfect accuracy.
•	Urgency Assessment Engine
Predicts priority levels using DistilBERT, enabling therapist response prioritization.
•	Therapist-Friendly Summarization
Generates concise summaries using T5-small to reduce cognitive load.
•	Modern Web Dashboard
Clean, responsive interface for therapists to review submissions efficiently.
•	Microservice-Based AI Architecture
Scalable FastAPI-based AI service separated from the main backend.
________________________________________

5.	4. SYSTEM WORKFLOW
      
6.	Caregiver records and uploads a voice note
7.	Speech-to-Text transcription using Whisper
8.	Behavioral issue classification using RoBERTa
9.	Urgency level prediction using DistilBERT
10.	Therapist-friendly summarization using T5
11.	Results displayed on therapist dashboard
________________________________________

12.	5. AI PIPELINE OVERVIEW
       
flowchart TD
 <img width="940" height="298" alt="image" src="https://github.com/user-attachments/assets/05decd55-2088-48d3-bca9-81803ab1270b" />
A[Caregiver Voice Input] --> B[Whisper ASR]
B --> C[Text Transcript]
C --> D[Issue Classification - RoBERTa]
D --> E[Urgency Classification - DistilBERT]
E --> F[Text Summarization - T5]
F --> G[Therapist Dashboard]
________________________________________

13.	6. MODELS USED & PERFORMANCE
14.	(1) Speech-to-Text
•	Model: Whisper-small
•	Framework: HuggingFace Transformers
•	Output: Clean caregiver transcript
________________________________________

15.	(2) Issue Classification
    
Model	Accuracy	Weighted F1
DistilBERT	~92%	~91%
RoBERTa (Selected)	≈100%	≈100%
DeBERTa	~99%	~99%

Selected Model: RoBERTa-base
Reason: Best accuracy-efficiency trade-off for deployment
📁 models/issue_classifier_roberta/
________________________________________

16.	(3) Urgency Classification
    
•	Model: DistilBERT
•	Accuracy: 85–95%
•	Reason: Lightweight and reliable for priority prediction
📁 models/urgency_classifier/
________________________________________

17.	(4) Text Summarization
•	Model: T5-small
•	Evaluation: Qualitative (clarity & relevance)
📁 models/summarization_t5/
________________________________________

18.	7. WEB APPLICATION OVERVIEW
       
19.	Frontend
    
•	Framework: React
•	Styling: Tailwind CSS
•	Features:
o	Voice upload
o	AI result visualization
o	Therapist dashboard
________________________________________

20.	Backend
    
•	Framework: Node.js + Express
•	Database: MongoDB
•	Responsibilities:
o	Submission management
o	AI service communication
o	Dashboard data delivery
________________________________________

21.	AI Microservice
    
•	Framework: FastAPI (Python)
•	Responsibilities:
o	Load trained models
o	Execute inference pipeline
o	Return structured AI outputs
________________________________________

22.	8. PROJECT STRUCTURE
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
│   ├── 05_full_pipeline_inference_with_voice.ipynb
│   ├── 06_train_text_classifier_compare.ipynb
│   └── 07_train_issue_classifier_deberta.ipynb
│
├── client/        # React frontend
├── server/        # Node.js backend
├── ai-service/    # FastAPI AI service
├── README.md
└── requirements.txt
________________________________________

23.	9. ETHICS, SAFETY & LIMITATIONS
        
•	 Not a diagnostic or clinical decision system
•	 Designed strictly for decision support
•	 No automated medical recommendations
•	 AI outputs require therapist interpretation
•	 Model bias mitigated through comparison and evaluation
________________________________________

24.	10. FUTURE ENHANCEMENTS
        
•	Therapist authentication & role management
•	Caregiver feedback loop
•	Historical behavior trend analysis
•	Multilingual speech support
•	Emotion detection integration
•	Clinical dataset fine-tuning
________________________________________

25.	11. PP1 CHECKLIST COMPLIANCE
        
✔ Git repository created
✔ README documentation completed
✔ Model architectures explained
✔ Notebooks clearly structured
✔ Frontend & backend implemented
✔ End-to-end demo pipeline available
________________________________________

26.	12. AUTHOR CONTRIBUTION
        
Role: AI Modeling & System Integration
•	Dataset preparation
•	Transformer model training & evaluation
•	Overfitting analysis & model selection
•	End-to-end voice pipeline development
•	AI microservice integration
•	System architecture design
________________________________________

27.	13. ACKNOWLEDGEMENT
        
Developed with the goal of supporting caregivers and therapists in delivering efficient, ethical, and scalable autism care using responsible artificial intelligence.
