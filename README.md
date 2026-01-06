# Personalized Autism Therapy Support System

A beautiful, modern web-based platform that helps caregivers and therapists deliver personalized autism care through intelligent activity recommendations. The system recommends activities to improve social, behavioral, and emotional aspects of children with autism.

## 🌟 Features

- **Personalized Activity Recommendations**: AI-powered recommendations based on each child's unique profile and needs
- **Child Profile Management**: Create and manage profiles for multiple children with specific needs tracking
- **Activity Library**: Comprehensive collection of activities categorized by:
  - **Social**: Activities to improve social interactions, communication, and peer relationships
  - **Behavioral**: Activities to support behavior management, routines, and self-regulation
  - **Emotional**: Activities to enhance emotional awareness, expression, and regulation
- **Beautiful, Modern UI**: Responsive design with intuitive interface for caregivers and therapists
- **Detailed Activity Information**: Each activity includes materials, duration, difficulty, benefits, and age recommendations

## 🎯 Project Structure

```
.
├── backend
│   ├── index.js          # Express API server with recommendation engine
│   ├── emotionService.js # ML service integration
│   ├── package.json
│   └── package-lock.json
├── frontend
│   ├── src
│   │   ├── App.js        # Main React application component
│   │   ├── App.css       # Beautiful styling and responsive design
│   │   ├── index.js
│   │   └── index.css
│   ├── public
│   └── package.json
├── ml_service
│   ├── train_model.py              # DenseNet-121 emotion training script
│   ├── train_recommendation_model.py  # Deep learning recommendation model training
│   ├── predict_emotion.py          # Emotion prediction script
│   ├── predict_recommendations.py   # Recommendation prediction script
│   ├── app.py                      # Flask API server for ML service
│   ├── download_dataset.py         # Dataset downloader
│   ├── requirements.txt            # Python dependencies
│   ├── models/                     # Trained models (after training)
│   └── dataset/                    # Dataset (after download)
└── README.md
```

## 🛠️ Technologies Used

*   **Frontend:** React 19, Axios, Modern CSS with gradients and animations
*   **Backend:** Node.js, Express.js, CORS, Multer (file uploads)
*   **ML Service:** Python, TensorFlow, Keras, DenseNet-121, Flask
*   **Emotion Detection:** DenseNet-121 CNN (6 emotion classes)
*   **Recommendation Engine:** Deep Neural Network (256→128→64) based on:
    - Real-time emotion (from DenseNet-121)
    - Personal interests (19 categories)
    - Financial/economic status (4 levels)
    - Social status (4 levels)
    - Autism profile (severity, type)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v14 or higher)
*   npm (v6 or higher)
*   Python (3.8 or higher)
*   pip (Python package manager)

**For detailed setup instructions, see [PROJECT_SETUP.md](additional files/PROJECT_SETUP.md) or [QUICK_START.md](additional files/QUICK_START.md)**

### Installation

1.  Clone the repository
    ```sh
    git clone https://github.com/your_username_/Personalized-Autism-Therapy-Support-System.git
    cd Personalized-Autism-Therapy-Support-System
    ```

2.  Install backend dependencies
    ```sh
    cd backend
    npm install
    ```

3.  Install frontend dependencies
    ```sh
    cd ../frontend
    npm install
    ```

4.  Install Python ML dependencies
    ```sh
    cd ../ml_service
    pip install -r requirements.txt
    ```

5.  Download dataset and train models (see [PROJECT_SETUP.md](additional files/PROJECT_SETUP.md))

## 🎮 Running the Application

### Start the Backend Server

Open a terminal and run:
```sh
cd backend
npm start
```

The backend server will start on `http://localhost:3001`

### Start the ML Service

Open a terminal and run:
```sh
cd ml_service
python app.py
```

The ML service will start on `http://localhost:5000`

### Start the Frontend Application

Open a new terminal and run:
```sh
cd frontend
npm start
```

The frontend will automatically open in your browser at `http://localhost:3000`

**Note:** All three services (ML Service, Backend, Frontend) must be running simultaneously.

## 📖 How to Use

1. **Select a Child Profile**: Choose from available child profiles to view personalized recommendations
2. **View Recommendations**: See top 6 recommended activities based on the child's specific needs
3. **Browse All Activities**: Filter activities by category (Social, Behavioral, Emotional) or view all
4. **Activity Details**: Click on any activity card to view detailed information including:
   - Full description
   - Required materials
   - Duration and difficulty level
   - Age range
   - Specific benefits

## 🎨 Features Overview

### Emotion Recognition (DenseNet-121)
- **Real-time emotion detection** from uploaded images
- **6 emotion classes:** Natural (0), joy (1), fear (2), anger (3), sadness (4), surprise (5)
- **High accuracy** model trained on autistic children emotions dataset
- **DenseNet-121 architecture** with transfer learning and fine-tuning
- **API integration** for seamless emotion updates

### Deep Learning Recommendation System
The system uses a **neural network** (deep learning model) that considers:
- **Real-time emotion** (from DenseNet-121) - 6 features (one-hot encoded)
- **Personal interests** - 19 binary features (train, cartoon, music, dance, art, etc.)
- **Financial/economic status** - 4 features (free, low, medium, high)
- **Social status** - 4 features (alone, with-parent, group, community)
- **Autism profile** - 2 features (severity 1-5, type)
- **Model Architecture**: 256 → 128 → 64 → output (sigmoid activation)
- **Training**: Synthetic data generation with rule-based labels
- **Output**: Activity recommendation scores for personalized suggestions

### Activity Categories

**Social Activities** (Blue theme)
- Social story reading
- Role-playing games
- Group circle time
- Peer buddy systems

**Behavioral Activities** (Orange theme)
- Visual schedule routines
- Calm down corners
- Token reward systems
- Sensory break activities

**Emotional Activities** (Green theme)
- Emotion identification
- Feelings journals
- Mindfulness breathing
- Empathy building stories

## 🔧 API Endpoints

### Child & Activity Endpoints
- `GET /api/children` - Get all child profiles
- `GET /api/children/:id` - Get specific child profile
- `PUT /api/children/:id` - Update child profile
- `GET /api/activities` - Get all activities (optional `?category=social` filter)
- `GET /api/activities/:id` - Get specific activity details
- `GET /api/recommendations/:childId` - Get personalized recommendations for a child
- `GET /api/categories` - Get all activity categories

### Emotion Endpoints
- `POST /api/emotion/:childId` - Update emotion manually
- `POST /api/emotion/:childId/recognize` - Recognize emotion from uploaded image
- `POST /api/predict-emotion` - Predict emotion from image (returns 6 emotion probabilities)
- `GET /api/emotion/:childId/history` - Get emotion history
- `GET /api/ml-service/health` - Check ML service health

### Recommendation Endpoints
- `GET /api/recommendations/:childId` - Get rule-based recommendations
- `POST /api/recommendations/:childId` - Get ML-based recommendations (deep learning model)

## 🤖 ML Service Setup

### Quick Start

1. **Navigate to ML service:**
   ```bash
   cd ml_service
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Download dataset:**
   ```bash
   python download_dataset.py
   ```

4. **Train the model:**
   ```bash
   python train_model.py
   ```

5. **Start ML service:**
   ```bash
   python app.py
   ```

For detailed setup instructions, see [SETUP_GUIDE.md](additional files/ml_service/SETUP_GUIDE.md)

## 🎯 Future Enhancements

- User authentication for caregivers and therapists
- Progress tracking and activity completion logging
- Custom child profile creation
- Activity customization and notes
- Integration with therapy session scheduling
- Analytics and progress reports
- Real-time webcam emotion detection
- Emotion trend analysis and visualization

## 📝 License

ISC

## 💝 Contributing

This is a research project for 4th year studies. Contributions and feedback are welcome!

## 🙏 Acknowledgments

Built with care for caregivers and therapists supporting children with autism spectrum disorder.