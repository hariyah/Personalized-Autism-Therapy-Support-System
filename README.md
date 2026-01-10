
# AI-Driven Personalized Behavioral, Emotional & Social Therapy Autism Appropriate Activity Recommendation System 
<img width="400" height="500" alt="image" src="https://github.com/user-attachments/assets/e0adf18a-a1b5-4f83-b7d5-c54f4ba787d1"  /> <img width="300" height="900" alt="image" src="https://github.com/user-attachments/assets/850018e9-e915-4d0d-a3f4-f78a91617773" /> <img width="300" height="300" alt="image" src="https://github.com/user-attachments/assets/8555da41-850d-4eb5-9777-49f047972557"/> 




## 1. PROJECT OVERVIEW

This project proposes an **Emotion-Aware Personalized Therapy Activity Recommendation System** to assist caregivers and therapists in delivering adaptive therapy for children across the autism spectrum. Facial images are captured through a camera-based input or image upload, enabling flexible real-time or offline emotion analysis and applies a **DenseNet-121 Convolutional Neural Network** to perform **real-time** emotion detection. The detected emotions are classified into predefined categories and combined with child profile and interest data using a **deep learning–based recommendation model** to generate suitable **behavioral**, **emotional**, and **social** therapy activities.

The model classifies the child’s emotional state into six predefined emotions: **Neutral**, **Joy**, **Fear**, **Anger**, **Sadness** and **Surprise**. These detected emotions are combined with the child’s personal interests and profile information using a deep learning–based recommendation model to generate suitable behavioral, emotional, and social therapy activities.

To improve transparency and usability, the system integrates an explainable AI module using a lightweight **Large Language Model** (Phi-2 via Ollama), which provides step-by-step activity instructions, adaptation tips, and safety warnings. Implemented as a scalable web-based application, the solution offers an objective, interest-driven, and cost-effective approach to enhancing therapy engagement and personalization.


## 3. ARCHITECHTURAL DIAGRAM

<img width="1018" height="568" alt="image" src="https://github.com/user-attachments/assets/fbfb5548-73ab-46c6-98b7-300e9708ff14" />



## 2. FEATURES &  MAJOR UPDATES AND BREAKTHROUGHS OF THE PROJECT

- **Real Time Emotion Detection :** Use Densenet-121 model to detect emotion through image upload and camera integration to capture image and detect emotion.
- **Personalized Activity Recommendations**: AI-powered recommendations based on each child's unique profile and needs.
- **Child Profile Management**: Create and manage profiles for multiple children with specific needs tracking.
- **Activity Library**: Comprehensive collection of activities categorized by:
  - **Social**: Activities to improve social interactions, communication, and peer relationships.
  - **Behavioral**: Activities to support behavior management, routines, and self-regulation.
  - **Emotional**: Activities to enhance emotional awareness, expression, and regulation.
- **Beautiful, Modern UI**: Responsive design with intuitive interface for caregivers and therapists.
- **Detailed Activity Information**: Each activity includes materials, duration, difficulty, benefits, and age recommendations.


## 4. SYSTEM ARCHITECTURE AND WORKFLOW

1) Real-Time Emotion Prediction Using DenseNet-121
2) Child Interest and Contextual Data Collection
3) Personalized Activity Recommendation Engine
4) Explainable Guidance and Decision Support
5) Web-Based Integration and User Interface


## 5. PROJECT DEPENDENCIES

### 1) Root Package (Project-level)
-  {
      "dotenv": "^17.2.3"
   }
  

### 2) Frontend (React JS - Port 3000)
-  Framework: React 19.2.0

### 3) Core Dependencies:
-  react: 19.2.0
-  react-dom: 19.2.0
-  react-scripts: 5.0.1
-  axios: 1.6.0 (HTTP client for API calls)
-  react-icons: 5.5.0 (Icon library)

### 4) Testing Libraries:
- @testing-library/react: 16.3.0
- @testing-library/jest-dom: 6.9.1
- @testing-library/dom: 10.4.1
- @testing-library/user-event: 13.5.0
- web-vitals: 2.1.4

### 5) Backend (MONGO DB, Express API - Port 3001)
- Framework: Express 5.1.0

### 6) Other Dependencies:
- express: 5.1.0 (Web server framework)
- cors: 2.8.5 (Cross-origin resource sharing)
- multer: 1.4.5-lts.1 (File upload middleware)
- axios: 1.6.0 (HTTP client for ML service)
- form-data: 4.0.0 (Multipart form handling)

### 7) Web Framework:
- Fast API
- werkzeug

### 8) Machine Learning & Deep Learning:
- Tensorflow (DenseNet-121 model)
- Keras
- Numpy
- Scikit-learn
- Scipy

### 9) Image Processing:
- Opencv-python (Face detection, Haar cascade)
- Pillow (Image manipulation)


### 6. HOW TO USE MY COMPONENT

1. **Select a Child Profile**: Choose from available child profiles to view personalized recommendations
2. **View Recommendations**: See top 6 recommended activities based on the child's specific needs
3. **Browse All Activities**: Filter activities by category (Social, Behavioral, Emotional) or view all
4. **Activity Details**: Click on any activity card to view detailed information including:
   - Full description
   - Required materials
   - Duration and difficulty level
   - Age range
   - Specific benefits

## 7. CORE FEATURES OVERVIEW

### (1) Emotion Recognition (DenseNet-121)
- **Real-time emotion detection** from uploaded images
- **6 emotion classes:** Natural (0), joy (1), fear (2), anger (3), sadness (4), surprise (5)
- **High accuracy** model trained on autistic children emotions dataset
- **DenseNet-121 architecture** with transfer learning and fine-tuning
- **API integration** for seamless emotion updates

### (2) Deep Learning Recommendation System
The system uses a **neural network** (deep learning model) that considers:
- **Real-time emotion** (from DenseNet-121) - 6 features (one-hot encoded)
- **Personal interests** - 19 binary features (train, cartoon, music, dance, art, etc.)
- **Financial/economic status** - 4 features (free, low, medium, high)
- **Social status** - 4 features (alone, with-parent, group, community)
- **Autism profile** - 2 features (severity 1-5, type)
- **Model Architecture**: 256 → 128 → 64 → output (sigmoid activation)
- **Training**: Synthetic data generation with rule-based labels
- **Output**: Activity recommendation scores for personalized suggestions

### (3) Activity Categories

**Social Activities** 
- Social story reading
- Role-playing games
- Group circle time
- Peer buddy systems

**Behavioral Activities** 
- Visual schedule routines
- Calm down corners
- Token reward systems
- Sensory break activities

**Emotional Activities** 
- Emotion identification
- Feelings journals
- Mindfulness breathing
- Empathy building stories

## 8. FUTURE ENHANCEMENTS

- User authentication for caregivers and therapists
- Progress tracking and activity completion logging
- Custom child profile creation
- Activity customization and notes
- Integration with therapy session scheduling
- Analytics and progress reports
- Real-time webcam emotion detection
- Emotion trend analysis and visualization

## 9. ACKNOWLEDGEMENT

Built with care for caregivers and therapists supporting children with autism spectrum disorder.
