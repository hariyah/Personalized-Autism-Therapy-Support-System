import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AutismCareApp.css';
import {
  FiHome, FiBook, FiTarget, FiSettings, FiUser, FiUpload,
  FiSmile, FiHeart, FiDollarSign, FiUsers, FiInfo,
  FiCheckCircle, FiX, FiArrowRight, FiStar, FiTrendingUp,
  FiActivity, FiAward, FiZap, FiSearch, FiFileText, FiBarChart2,
  FiUserPlus, FiLayers, FiTrendingDown, FiPieChart, FiCpu, FiMapPin, FiClock,
  FiBookOpen, FiMusic, FiPenTool, FiWind, FiClipboard, FiSun,
  FiCamera
} from 'react-icons/fi';
import { FaPuzzlePiece, FaPaw } from 'react-icons/fa';
import { GiDinosaurRex } from 'react-icons/gi';

const API_BASE_URL = (import.meta.env?.VITE_EMOTIONAL_API_URL) || 'http://localhost:7777/emotional/api';

export default function AutismCareApp() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [emotionInput, setEmotionInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [predictedEmotion, setPredictedEmotion] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [formInputs, setFormInputs] = useState({
    interests: [],
    financialStatus: '',
    socialStatus: '',
    autismType: '',
    autismSeverity: 3,
  });
  const [formRecommendations, setFormRecommendations] = useState([]);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [lastRecommendationContext, setLastRecommendationContext] = useState(null);
  const [latestDetectionSnapshot, setLatestDetectionSnapshot] = useState({
    childId: null,
    emotion: '',
    source: 'profile',
    confidence: null,
    timestamp: ''
  });

  useEffect(() => {
    fetchChildren();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchRecommendations(selectedChild.id);
    }
  }, [selectedChild]);

  useEffect(() => {
    setFormRecommendations([]);
    setLastRecommendationContext(null);
  }, [selectedChild?.id]);

  const fetchChildren = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/children`);
      setChildren(response.data);
      if (response.data.length > 0) {
        setSelectedChild(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/activities`);
      setActivities(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setLoading(false);
    }
  };

  const fetchRecommendations = async (childId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/recommendations/${childId}`);
      const nextRecommendations = filterNonSensoryRecommendations(response.data);
      setRecommendations(nextRecommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  // Function to update emotion (for CNN integration)
  const updateEmotion = async (childId, emotion, confidence = 1.0) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/emotion/${childId}`, {
        emotion: emotion,
        confidence: confidence
      });
      setSelectedChild(response.data.child);
      setChildren((prevChildren) =>
        prevChildren.map((child) => (child.id === childId ? response.data.child : child))
      );
      // Refresh recommendations after emotion update
      fetchRecommendations(childId);
    } catch (error) {
      // Only log error, do not show pop-up or alert
      console.error('Error updating emotion:', error);
    }
  };

  // Function to handle image upload and emotion prediction
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/bmp'].includes(file.type)) {
      setPredictionError('Please upload an image file (JPEG, PNG, GIF, BMP)');
      return;
    }

    // Validate file size (max 16MB)
    if (file.size > 16 * 1024 * 1024) {
      setPredictionError('File size must be less than 16MB');
      return;
    }

    setPredictionLoading(true);
    setPredictionError(null);
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
    };
    reader.readAsDataURL(file);

    // Send to backend for emotion prediction
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_BASE_URL}/predict-emotion`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });

      if (response.data.success) {
        setPredictedEmotion({
          emotion: response.data.emotion,
          confidence: response.data.confidence,
          allPredictions: response.data.all_predictions || {}
        });

        // Auto-update child emotion if available
        if (selectedChild && response.data.emotion) {
          updateEmotion(selectedChild.id, response.data.emotion, response.data.confidence);
        }
      } else {
        setPredictionError(response.data.message || 'Failed to predict emotion');
      }
    } catch (error) {
      console.error('Error predicting emotion:', error);
      setPredictionError(
        error.response?.data?.error || 
        error.message || 
        'ML service not available. Please ensure the Python ML service is running on port 5000.'
      );
    } finally {
      setPredictionLoading(false);
    }
  };

  const filteredActivities = selectedCategory === 'all' 
    ? activities 
    : activities.filter(a => a.category === selectedCategory);

  const getCategoryColor = (category) => {
    const colors = {
      social: '#4A90E2',
      behavioral: '#F5A623',
      emotional: '#7ED321'
    };
    return colors[category] || '#9B59B6';
  };

  const getNeedLevelColor = (level) => {
    const colors = {
      high: '#E74C3C',
      medium: '#F39C12',
      low: '#27AE60'
    };
    return colors[level] || '#95A5A6';
  };

  const handleAddNewChild = () => {
    setShowAddChildModal(true);
  };

  const handleViewProgressReports = (child) => {
    if (!child) {
      alert('Please select a child profile first to view progress reports.');
      return;
    }
    setShowProgressModal(true);
  };

  const handleViewAnalytics = (child) => {
    if (!child) {
      alert('Please select a child profile first to view analytics.');
      return;
    }
    setShowAnalyticsModal(true);
  };

  const createChildProfileRequest = async (payload) => {
    const endpointCandidates = Array.from(new Set([
      `${API_BASE_URL}/children`,
      `${API_BASE_URL.replace('localhost', '127.0.0.1')}/children`,
      '/api/children'
    ]));

    let lastError = null;

    for (const endpoint of endpointCandidates) {
      try {
        return await axios.post(endpoint, payload, { timeout: 20000 });
      } catch (error) {
        lastError = error;
        const status = Number(error?.response?.status || 0);
        // Keep trying endpoint fallbacks only for 404 or pure network failures.
        if (status && status !== 404) {
          throw error;
        }
      }
    }

    throw lastError || new Error('Child profile creation request failed.');
  };

  const handleCreateChild = async (newChildPayload) => {
    try {
      const response = await createChildProfileRequest(newChildPayload);
      const createdChild = response.data;
      setChildren((prev) => [...prev, createdChild]);
      setSelectedChild(createdChild);

      // Clear stale emotion detection visuals so new profile can drive fresh updates.
      setUploadedImage(null);
      setPredictedEmotion(null);
      setPredictionError(null);
      setEmotionInput('');

      setShowAddChildModal(false);
      setShowProgressModal(false);
      setShowAnalyticsModal(false);
      setCurrentView('dashboard');
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      if (status === 404) {
        throw new Error('Child profile creation endpoint was not found (404). Restart the backend on port 3001 and try again.');
      }
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create child profile.';
      throw new Error(message);
    }
  };

  const stats = {
    totalActivities: activities.length,
    socialActivities: activities.filter(a => a.category === 'social').length,
    behavioralActivities: activities.filter(a => a.category === 'behavioral').length,
    emotionalActivities: activities.filter(a => a.category === 'emotional').length,
    totalChildren: children.length,
    activeRecommendations: formRecommendations.length ? formRecommendations.length : recommendations.length
  };

  const interestOptions = [
    'train', 'cartoon', 'music', 'dance', 'art', 'sports', 'puzzles', 'outdoors',
    'reading', 'visual', 'structured', 'quiet', 'play-based', 'movement',
    'trains, cars, and vehicles', 'dinosaurs', 'weather and space', 'pets',
    'birdwatching or insects', 'marine life', 'drawing, painting, and art creation',
    'crafting', 'cultural traditions', 'books and stories'
  ];
  const financialOptions = ['Financially Struggling','Financially Stable','Financially Comfortable','Financially Well-Off'];
  const socialOptions = ['alone','with-parent','with-family','community'];

  const submitRecommendationRequest = async () => {
    const payload = {
      emotion: predictedEmotion?.emotion || selectedChild?.currentEmotion || null,
      interests: formInputs.interests.map(interest => String(interest).toLowerCase()),
      financialStatus: formInputs.financialStatus,
      socialStatus: formInputs.socialStatus,
      autismProfile: { type: formInputs.autismType, severity: Number(formInputs.autismSeverity) },
      topK: 5
    };
    if (!selectedChild) {
      alert('Please select a child profile first.');
      return;
    }
    if (!payload.emotion) {
      alert('Please upload an image to detect emotion or select a child with an existing emotion.');
      return;
    }

    try {
      const resp = await axios.post(`${API_BASE_URL}/recommendations/${selectedChild.id}`, payload, { timeout: 150000 });
      const recommendations = Array.isArray(resp.data) ? resp.data : resp.data?.recommendations;
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error('No activities were returned from Ollama.');
      }
      const nonSensoryRecommendations = filterNonSensoryRecommendations(recommendations);
      if (nonSensoryRecommendations.length === 0) {
        throw new Error('Only sensory activities were returned. Please try again with different inputs.');
      }
      setFormRecommendations(nonSensoryRecommendations);
      setLastRecommendationContext({
        childId: selectedChild.id,
        emotion: payload.emotion,
        interests: payload.interests,
        financialStatus: payload.financialStatus,
        socialStatus: payload.socialStatus,
        autismProfile: payload.autismProfile,
        generatedAt: new Date().toISOString()
      });
    } catch (err) {
      const hint = err?.response?.data?.hint;
      const message = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Unknown error';
      const combined = hint ? `${message} (${hint})` : message;
      alert('Failed to get recommendations from Ollama: ' + combined);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your therapy support system...</p>
      </div>
    );
  }

  const activeRecommendations = formRecommendations.length ? formRecommendations : recommendations;

  return (
    <div className="autism-care-app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <FiActivity className="logo-icon" />
            <h2>Autism Care</h2>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <FiHome className="nav-icon" />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'activities' ? 'active' : ''}`}
            onClick={() => setCurrentView('activities')}
          >
            <FiBook className="nav-icon" />
            <span>Activity Library</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'recommendations' ? 'active' : ''}`}
            onClick={() => setCurrentView('recommendations')}
          >
            <FiTarget className="nav-icon" />
            <span>Recommendations</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'recommendation-form' ? 'active' : ''}`}
            onClick={() => setCurrentView('recommendation-form')}
          >
            <FiSettings className="nav-icon" />
            <span>Get Recommendations</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <FiUser />
            </div>
            <div className="user-details">
              <p className="user-role">Caregiver/Therapist</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-container">
        {currentView === 'dashboard' ? (
          <DashboardView
            children={children}
            selectedChild={selectedChild}
            setSelectedChild={setSelectedChild}
            recommendations={recommendations}
            stats={stats}
            getCategoryColor={getCategoryColor}
            getNeedLevelColor={getNeedLevelColor}
            setSelectedActivity={setSelectedActivity}
            setCurrentView={setCurrentView}
            updateEmotion={updateEmotion}
            emotionInput={emotionInput}
            setEmotionInput={setEmotionInput}
            handleImageUpload={handleImageUpload}
            uploadedImage={uploadedImage}
            predictedEmotion={predictedEmotion}
            predictionLoading={predictionLoading}
            predictionError={predictionError}
            setUploadedImage={setUploadedImage}
            setPredictedEmotion={setPredictedEmotion}
            setLatestDetectionSnapshot={setLatestDetectionSnapshot}
            handleAddNewChild={handleAddNewChild}
            handleViewProgressReports={handleViewProgressReports}
            handleViewAnalytics={handleViewAnalytics}
          />
        ) : currentView === 'activities' ? (
          <ActivitiesView
            activities={filteredActivities}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            getCategoryColor={getCategoryColor}
            setSelectedActivity={setSelectedActivity}
          />
        ) : currentView === 'recommendation-form' ? (
          <RecommendationFormView
            selectedChild={selectedChild}
            formInputs={formInputs}
            setFormInputs={setFormInputs}
            interestOptions={interestOptions}
            financialOptions={financialOptions}
            socialOptions={socialOptions}
            submitRecommendationRequest={submitRecommendationRequest}
            formRecommendations={formRecommendations}
            predictedEmotion={predictedEmotion}
            getCategoryColor={getCategoryColor}
            setSelectedActivity={setSelectedActivity}
            setCurrentView={setCurrentView}
          />
        ) : (
          <RecommendationsView
            selectedChild={selectedChild}
            recommendations={activeRecommendations}
            activities={activities}
            getCategoryColor={getCategoryColor}
            onSelect={setSelectedActivity}
            predictedEmotion={predictedEmotion}
          />
        )}
      </main>

      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          getCategoryColor={getCategoryColor}
          onClose={() => setSelectedActivity(null)}
        />
      )}

      {/* Add Child Modal */}
      {showAddChildModal && (
        <AddChildModal
          onClose={() => setShowAddChildModal(false)}
          onAdd={handleCreateChild}
        />
      )}

      {/* Progress Reports Modal */}
      {showProgressModal && (
        <ProgressReportsModal
          selectedChild={selectedChild}
          recommendations={activeRecommendations}
          activities={activities}
          recommendationContext={lastRecommendationContext}
          onClose={() => setShowProgressModal(false)}
        />
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <AnalyticsModal
          selectedChild={selectedChild}
          recommendations={activeRecommendations}
          activities={activities}
          recommendationContext={lastRecommendationContext}
          latestDetectionSnapshot={latestDetectionSnapshot}
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}
    </div>
  );
}

// Enhanced Dashboard View Component
function DashboardView({ 
  children, 
  selectedChild, 
  setSelectedChild, 
  recommendations, 
  stats,
  getCategoryColor,
  getNeedLevelColor,
  setSelectedActivity,
  setCurrentView,
  updateEmotion,
  emotionInput,
  setEmotionInput,
  handleImageUpload,
  uploadedImage,
  predictedEmotion,
  predictionLoading,
  predictionError,
  setUploadedImage,
  setPredictedEmotion,
  setLatestDetectionSnapshot,
  handleAddNewChild,
  handleViewProgressReports,
  handleViewAnalytics
}) {
  // 6 emotions as required: Natural (0), joy (1), fear (2), anger (3), sadness (4), surprise (5)
  // Use the exact order and names from class_indices.json
  const validEmotions = ["Natural", "anger", "fear", "joy", "sadness", "surprise"];
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const liveIntervalRef = useRef(null);
  const liveLoadingRef = useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [liveDetecting, setLiveDetecting] = useState(false);
  const [lastDetectedAt, setLastDetectedAt] = useState('');
  const [cameraCapturedImage, setCameraCapturedImage] = useState(null);
  const [cameraPredictedEmotion, setCameraPredictedEmotion] = useState(null);
  const [latestDetectedEmotion, setLatestDetectedEmotion] = useState('');
  const [latestDetectionSource, setLatestDetectionSource] = useState('profile');
  const cameraConfidence = Number(cameraPredictedEmotion?.confidence || 0);
  const displayEmotion = String(latestDetectedEmotion || selectedChild?.currentEmotion || 'calm').trim();
  const uploadConfidence = Number(predictedEmotion?.confidence || 0);
  const displayConfidence = latestDetectionSource === 'camera'
    ? (cameraConfidence > 0 ? cameraConfidence : null)
    : latestDetectionSource === 'upload'
    ? (uploadConfidence > 0 ? uploadConfidence : null)
    : null;

  const sourceLabels = {
    profile: 'Profile',
    upload: 'Image Upload',
    camera: 'Camera Detection',
    manual: 'Manual Update'
  };

  const handleEmotionUpdate = () => {
    if (selectedChild && emotionInput && validEmotions.includes(emotionInput)) {
      updateEmotion(selectedChild.id, emotionInput);
      setLatestDetectedEmotion(emotionInput);
      setLatestDetectionSource('manual');
      setLatestDetectionSnapshot({
        childId: selectedChild.id,
        emotion: emotionInput,
        source: 'manual',
        confidence: null,
        timestamp: new Date().toISOString()
      });
      setEmotionInput('');
    } else {
      alert('Please enter a valid emotion: ' + validEmotions.join(', '));
    }
  };

  useEffect(() => {
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setLatestDetectedEmotion('');
    setLatestDetectionSource('profile');
    setLatestDetectionSnapshot({
      childId: selectedChild?.id ?? null,
      emotion: String(selectedChild?.currentEmotion || '').trim(),
      source: 'profile',
      confidence: null,
      timestamp: new Date().toISOString()
    });
  }, [selectedChild?.id]);

  useEffect(() => {
    const detected = String(predictedEmotion?.emotion || '').trim();
    if (detected) {
      setLatestDetectedEmotion(detected);
      setLatestDetectionSource('upload');
      setLatestDetectionSnapshot({
        childId: selectedChild?.id ?? null,
        emotion: detected,
        source: 'upload',
        confidence: Number(predictedEmotion?.confidence || 0),
        timestamp: new Date().toISOString()
      });
    }
  }, [predictedEmotion]);

  const startCamera = async () => {
    if (cameraActive) return;
    setCameraError(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Unable to access camera. Please allow camera permissions and try again.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    setLiveDetecting(false);
    setCameraLoading(false);
    liveLoadingRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureAndPredict = async () => {
    if (!cameraActive) {
      setCameraError('Start the camera to capture a frame.');
      return;
    }
    if (!videoRef.current || !canvasRef.current) return;
    if (liveLoadingRef.current) return;

    setCameraError(null);
    setCameraLoading(true);
    liveLoadingRef.current = true;

    try {
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Camera is not ready yet.');
      }
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCameraCapturedImage(dataUrl);

      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append('image', blob, 'camera.jpg');

      const response = await axios.post(`${API_BASE_URL}/predict-emotion`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      });

      if (response.data.success) {
        setCameraPredictedEmotion({
          emotion: response.data.emotion,
          confidence: response.data.confidence,
          allPredictions: response.data.all_predictions || {}
        });
        const detected = String(response.data.emotion || '').trim();
        if (detected) {
          setLatestDetectedEmotion(detected);
          setLatestDetectionSource('camera');
          setLatestDetectionSnapshot({
            childId: selectedChild?.id ?? null,
            emotion: detected,
            source: 'camera',
            confidence: Number(response.data.confidence || 0),
            timestamp: new Date().toISOString()
          });
        }
        setLastDetectedAt(new Date().toLocaleTimeString());
      } else {
        setCameraError(response.data.message || 'Failed to predict emotion');
      }
    } catch (error) {
      console.error('Error predicting emotion from camera:', error);
      setCameraError(
        error.response?.data?.error || 
        error.message || 
        'ML service not available. Please ensure the Python ML service is running on port 5000.'
      );
    } finally {
      setCameraLoading(false);
      liveLoadingRef.current = false;
    }
  };

  const toggleLiveDetection = () => {
    if (!cameraActive) return;
    if (liveDetecting) {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
      setLiveDetecting(false);
      return;
    }
    setLiveDetecting(true);
    captureAndPredict();
    liveIntervalRef.current = setInterval(() => {
      if (!cameraActive || liveLoadingRef.current) return;
      captureAndPredict();
    }, 3000);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>
            <FiSmile className="welcome-icon" />
            Welcome Back!
          </h1>
          <p className="dashboard-subtitle">Monitor and manage therapy activities for your children</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setCurrentView('activities')}>
            Browse Activities
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard
          icon={<FiUsers />}
          title="Total Children"
          value={stats.totalChildren}
          color="#4A90E2"
          subtitle="Active profiles"
        />
        <StatCard
          icon={<FiStar />}
          title="Recommendations"
          value={stats.activeRecommendations}
          color="#F5A623"
          subtitle="For selected child"
        />
        <StatCard
          icon={<FiBook />}
          title="Total Activities"
          value={stats.totalActivities}
          color="#FF6B6B"
          subtitle="Available in library"
        />
        <StatCard
          icon={<FiLayers />}
          title="Categories"
          value="3"
          color="#9B59B6"
          subtitle="Social, Behavioral, Emotional"
        />
      </div>

      <div className="category-stats">
        <h2 className="section-title">Activity Categories</h2>
        <div className="category-cards">
          <CategoryStatCard
            category="social"
            count={stats.socialActivities}
            color={getCategoryColor('social')}
            icon={<FiUsers />}
          />
          <CategoryStatCard
            category="behavioral"
            count={stats.behavioralActivities}
            color={getCategoryColor('behavioral')}
            icon={<FiTarget />}
          />
          <CategoryStatCard
            category="emotional"
            count={stats.emotionalActivities}
            color={getCategoryColor('emotional')}
            icon={<FiHeart />}
          />
        </div>
      </div>

      {/* Image Upload Section for Emotion Detection */}
      <section className="dashboard-section image-upload-section">
        <div className="section-header">
          <div className="title-with-icon">
            <div className="icon-wrapper ai-icon">
              <FiUpload className="section-icon" />
            </div>
            <div className="title-text-container">
              <h2 className="section-title">AI Emotion Recognition</h2>
              <p className="section-description">
                Upload an image to detect emotions using our advanced DenseNet-121 neural network
              </p>
            </div>
          </div>
        </div>
        
        <div className="image-upload-container">
          <div className="upload-area">
            <input 
              type="file" 
              id="image-upload" 
              className="image-input"
              onChange={handleImageUpload}
              accept="image/*"
              disabled={predictionLoading}
            />
            <label htmlFor="image-upload" className="upload-label">
              <div className="upload-content">
                <div className="upload-icon-circle">
                  <FiUpload className="upload-icon-svg" />
                </div>
                <p className="upload-text">Drop your image here</p>
                <p className="upload-text-secondary">or click to browse</p>
                <div className="upload-formats">
                  <span className="format-badge">PNG</span>
                  <span className="format-badge">JPG</span>
                  <span className="format-badge">GIF</span>
                  <span className="format-badge">BMP</span>
                </div>
                <p className="upload-hint">Maximum file size: 16MB</p>
              </div>
            </label>
          </div>

          {/* Uploaded Image Preview */}
          {uploadedImage && (
            <div className="image-preview-container">
              <div className="preview-header">
                <FiCheckCircle className="preview-icon" />
                <h3>Image Ready for Analysis</h3>
              </div>
              <div className="preview-wrapper">
                <img src={uploadedImage} alt="Uploaded" className="image-preview" />
              </div>
            </div>
          )}

          {/* Loading State */}
          {predictionLoading && (
            <div className="prediction-loading">
              <div className="loading-animation">
                <div className="spinner"></div>
                <div className="pulse-ring"></div>
              </div>
              <p className="loading-text">Analyzing emotional patterns...</p>
              <p className="loading-subtext">Our AI is processing your image</p>
            </div>
          )}

          {/* Error Message */}
          {predictionError && (
            <div className="prediction-error">
              <div className="error-icon-wrapper">
                <FiX className="error-icon" />
              </div>
              <p className="error-title">{predictionError}</p>
              <p className="error-hint">Make sure the ML service is running on port 5000</p>
            </div>
          )}

          {/* Prediction Results */}
          {predictedEmotion && !predictionLoading && (
            <div className="prediction-results">
              <div className="results-header">
                <FiTarget className="results-icon" />
                <h3>Analysis Complete</h3>
              </div>
              
              <div className="main-prediction">
                <div className="prediction-card">
                  <span className="prediction-label">Detected Emotion</span>
                  <div className={`emotion-badge-large emotion-${predictedEmotion.emotion}`}>
                    <span className="emotion-badge-text">{predictedEmotion.emotion}</span>
                  </div>
                  <div className="confidence-display">
                    <div className="confidence-bar-container">
                      <div 
                        className="confidence-bar-fill" 
                        style={{ width: `${(predictedEmotion.confidence * 100).toFixed(2)}%` }}
                      ></div>
                    </div>
                    <p className="confidence-text">
                      <strong>{(predictedEmotion.confidence * 100).toFixed(2)}%</strong> Confidence
                    </p>
                  </div>
                </div>
              </div>

              {/* All Predictions */}
              {predictedEmotion.allPredictions && Object.keys(predictedEmotion.allPredictions).length > 0 && (
                <div className="all-predictions">
                  <h4 className="predictions-subtitle">
                    <FiBarChart2 className="subtitle-icon" />
                    Detailed Emotion Breakdown
                  </h4>
                  <div className="prediction-bars">
                    {Object.entries(predictedEmotion.allPredictions)
                      .sort(([, a], [, b]) => b - a)
                      .map(([emotion, confidence]) => (
                      <div key={emotion} className="prediction-bar-item">
                        <span className="emotion-name">{emotion}</span>
                        <div className="progress-bar-modern">
                          <div 
                            className={`progress-fill-modern emotion-${emotion.toLowerCase()}`}
                            style={{ width: `${(confidence * 100).toFixed(1)}%` }}
                          ></div>
                        </div>
                        <span className="confidence-percent">{(confidence * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply to Child */}
              {selectedChild && (
                <button 
                  className="btn-apply-emotion"
                  onClick={() => {
                    const e = (predictedEmotion?.emotion || '').trim();
                    // Only allow validEmotions from the model
                    if (!e || e.toLowerCase() === 'uncertain') {
                      alert('Cannot apply Uncertain emotion to profile. Please upload a clearer image or choose a specific emotion.');
                      return;
                    }
                    // Normalize emotion label (case-insensitive)
                    const normalizedEmotion = validEmotions.find(em => em.toLowerCase() === e.toLowerCase());
                    if (!normalizedEmotion) {
                      alert('Invalid emotion label: ' + e + '\nPlease use one of: ' + validEmotions.join(', '));
                      return;
                    }
                    updateEmotion(selectedChild.id, normalizedEmotion, predictedEmotion.confidence);
                    setUploadedImage(null);
                    setPredictedEmotion(null);
                  }}
                  disabled={String(predictedEmotion?.emotion || '').toLowerCase() === 'uncertain'}
                >
                  Apply to {selectedChild.name}'s Profile
                </button>
              )}
            </div>
          )}
        </div>

        <div className="camera-detection">
          <div className="camera-header">
            <div className="camera-title">
              <div className="camera-icon-wrapper">
                <FiCamera className="camera-title-icon" />
              </div>
              <div className="camera-title-text">
                <h3>Live Camera Detection</h3>
                <p>Capture real-time emotion snapshots with your camera</p>
              </div>
            </div>
            <div className="camera-status">
              <span className={`status-dot ${cameraActive ? 'on' : 'off'}`}></span>
              <span>{cameraActive ? 'Camera On' : 'Camera Off'}</span>
            </div>
          </div>

          <div className="camera-body">
            <div className="camera-preview">
              <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
              {!cameraActive && (
                <div className="camera-placeholder">
                  <FiCamera className="camera-placeholder-icon" />
                  <p>Start the camera to preview</p>
                </div>
              )}
              {cameraLoading && (
                <div className="camera-loading-overlay">
                  <div className="camera-spinner"></div>
                  <span>Analyzing frame...</span>
                </div>
              )}
            </div>

            <div className="camera-capture-panel">
              <div className="capture-header">
                <FiCheckCircle className="capture-icon" />
                <h4>Captured Image</h4>
              </div>
              <div className="capture-preview">
                {cameraCapturedImage ? (
                  <img src={cameraCapturedImage} alt="Camera capture" />
                ) : (
                  <div className="capture-placeholder">
                    <FiUpload className="capture-placeholder-icon" />
                    <p>Captured image will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="camera-controls-row">
            <div className="camera-controls">
              <button className="camera-btn primary" onClick={startCamera} disabled={cameraActive}>
                Start Camera
              </button>
              <button className="camera-btn secondary" onClick={stopCamera} disabled={!cameraActive}>
                Stop Camera
              </button>
              <button
                className="camera-btn"
                onClick={captureAndPredict}
                disabled={!cameraActive || cameraLoading || liveDetecting}
              >
                Capture & Analyze
              </button>
              <button
                className={`camera-btn ${liveDetecting ? 'danger' : 'ghost'}`}
                onClick={toggleLiveDetection}
                disabled={!cameraActive}
              >
                {liveDetecting ? 'Stop Live Detection' : 'Start Live Detection'}
              </button>
              <p className="camera-hint">Live detection captures a frame every 3 seconds.</p>
              {lastDetectedAt && (
                <p className="camera-last-detect">Last capture: {lastDetectedAt}</p>
              )}
              {cameraError && <p className="camera-error">{cameraError}</p>}
            </div>
          </div>

          <canvas ref={canvasRef} className="camera-canvas" />
        </div>

        <div className="camera-analysis-section">
          <div className="camera-analysis-header">
            <div className="camera-analysis-title">
              <FiTarget className="camera-analysis-icon" />
              <span>Analysis Complete</span>
            </div>
            <span className="camera-analysis-subtitle">Camera-based emotion insights</span>
          </div>

          {cameraPredictedEmotion ? (
            <>
              <div className="camera-analysis-hero">
                <div className="camera-analysis-label">Detected Emotion</div>
                <div className={`camera-detected-pill emotion-${String(cameraPredictedEmotion.emotion || '').toLowerCase()}`}>
                  <span className="camera-detected-text">{cameraPredictedEmotion.emotion}</span>
                </div>
                <div className="camera-confidence">
                  <div className="camera-confidence-track">
                    <div
                      className="camera-confidence-fill"
                      style={{ width: `${(cameraConfidence * 100).toFixed(2)}%` }}
                    ></div>
                  </div>
                  <div className="camera-confidence-text">
                    <strong>{(cameraConfidence * 100).toFixed(2)}%</strong> Confidence
                  </div>
                </div>
              </div>

              {cameraPredictedEmotion.allPredictions && Object.keys(cameraPredictedEmotion.allPredictions).length > 0 && (
                <div className="camera-analysis-breakdown">
                  <h4>
                    <FiBarChart2 className="camera-analysis-subicon" />
                    Detailed Emotion Breakdown
                  </h4>
                  <div className="camera-analysis-bars">
                    {Object.entries(cameraPredictedEmotion.allPredictions)
                      .sort(([, a], [, b]) => b - a)
                      .map(([emotion, confidence]) => (
                        <div key={emotion} className="camera-analysis-bar">
                          <span className="camera-analysis-name">{emotion}</span>
                          <div className="camera-analysis-track">
                            <div
                              className={`camera-analysis-fill emotion-${String(emotion).toLowerCase()}`}
                              style={{ width: `${(confidence * 100).toFixed(1)}%` }}
                            ></div>
                          </div>
                          <span className="camera-analysis-value">{(confidence * 100).toFixed(1)}%</span>
                        </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedChild && (
                <button
                  className="camera-apply-btn"
                  onClick={() => {
                    const e = (cameraPredictedEmotion?.emotion || '').trim();
                    if (!e || e.toLowerCase() === 'uncertain') {
                      alert('Cannot apply Uncertain emotion to profile. Please capture a clearer image or choose a specific emotion.');
                      return;
                    }
                    const normalizedEmotion = validEmotions.find(em => em.toLowerCase() === e.toLowerCase());
                    if (!normalizedEmotion) {
                      alert('Invalid emotion label: ' + e + '\nPlease use one of: ' + validEmotions.join(', '));
                      return;
                    }
                    updateEmotion(selectedChild.id, normalizedEmotion, cameraConfidence);
                  }}
                  disabled={String(cameraPredictedEmotion?.emotion || '').toLowerCase() === 'uncertain'}
                >
                  Apply to {selectedChild.name}'s Profile
                </button>
              )}
            </>
          ) : (
            <div className="camera-analysis-empty">
              Capture a frame to generate camera analysis results.
            </div>
          )}
        </div>
      </section>

      {/* Emotion Display Section */}
      {selectedChild && (
        <section className="dashboard-section emotion-section">
          <div className="emotion-status-header">
            <div className="emotion-title-wrapper">
              <div className="emotion-header-text">
                <h2 className="emotion-section-title">Current Emotion Status</h2>
                <p className="emotion-subtitle">Real-time monitoring and profile details</p>
              </div>
            </div>
          </div>

          <div className="emotion-status-grid">
            {/* Main Emotion Card */}
            <div className="emotion-main-card">
              <div className="emotion-card-header">
                <span className="emotion-label-text">Real-time emotion</span>
              </div>
              <div className={`emotion-display-large emotion-${displayEmotion || 'calm'}`}>
                <div className="emotion-text-large">
                  {(displayEmotion || 'calm').charAt(0).toUpperCase() + (displayEmotion || 'calm').slice(1)}
                </div>
                <div className="emotion-live-meta">
                  <span className={`emotion-source-badge source-${latestDetectionSource}`}>
                    {sourceLabels[latestDetectionSource] || 'Live'}
                  </span>
                  {displayConfidence !== null && (
                    <span className="emotion-confidence-badge">
                      {(displayConfidence * 100).toFixed(1)}% confidence
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="emotion-side-stack">
              {/* Update Emotion Section */}
              <div className="emotion-update-card">
                <div className="emotion-update-header">
                  <div className="update-icon">
                    <FiSettings />
                  </div>
                  <span className="update-title">Update Emotion</span>
                </div>
                <div className="emotion-update-controls">
                  <select 
                    className="emotion-select-modern"
                    value={emotionInput}
                    onChange={(e) => setEmotionInput(e.target.value)}
                  >
                    <option value="">Select emotion...</option>
                    {validEmotions.map(emotion => (
                      <option key={emotion} value={emotion}>
                        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button 
                    className="btn-emotion-update-modern"
                    onClick={handleEmotionUpdate}
                    disabled={!emotionInput}
                  >
                    <span>Apply</span>
                  </button>
                </div>
              </div>

              {/* Profile Details Card */}
              <div className="emotion-details-card">
                <div className="emotion-card-header">
                  <span className="emotion-label-text">Profile Details</span>
                </div>
                <div className="emotion-details-grid">
                  {selectedChild.socialStatus && (
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FiUsers />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Social Status</span>
                        <span className="detail-value">{selectedChild.socialStatus}</span>
                      </div>
                    </div>
                  )}
                  {selectedChild.financialStatus && (
                    <div className="detail-item">
                      <div className="detail-icon">
                        <FiDollarSign />
                      </div>
                      <div className="detail-content">
                        <span className="detail-label">Financial Status</span>
                        <span className="detail-value">{selectedChild.financialStatus}</span>
                      </div>
                    </div>
                  )}
                  {selectedChild.autismDetails && (
                    <>
                      <div className="detail-item">
                        <div className="detail-icon">
                          <FiBarChart2 />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Autism Severity</span>
                          <span className="detail-value">{selectedChild.autismDetails.severity}/5</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-icon">
                          <FiInfo />
                        </div>
                        <div className="detail-content">
                          <span className="detail-label">Type</span>
                          <span className="detail-value">{selectedChild.autismDetails.type}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Link to Recommendation Form */}
      <section className="dashboard-section recommendation-link-section">
        <div className="section-header">
          <div className="header-content-wrapper">
            <h2 className="section-title">
              <FiZap className="section-icon" />
              Get Personalized Recommendations
            </h2>
            <p className="section-description">Create personalized activity recommendations based on emotion, interests, and profile.</p>
          </div>
        </div>
        <div className="quick-link-card" onClick={() => setCurrentView('recommendation-form')}>
          <div className="quick-link-content">
            <FiSettings className="quick-link-icon" />
            <div>
              <h3>Open Recommendation Form</h3>
              <p>Fill in details to get AI-powered activity suggestions</p>
            </div>
            <FiArrowRight className="quick-link-arrow" />
          </div>
        </div>
      </section>

      <section className="dashboard-section quick-actions-section">
        <h2 className="section-title">
          <FiZap className="section-icon" />
          Quick Actions
        </h2>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => setCurrentView('activities')}>
            <FiSearch className="action-icon" />
            <span className="action-text">Browse All Activities</span>
          </button>
          <button className="quick-action-btn" onClick={() => handleViewProgressReports(selectedChild)}>
            <FiFileText className="action-icon" />
            <span className="action-text">View Progress Reports</span>
          </button>
          <button className="quick-action-btn" onClick={() => handleAddNewChild()}>
            <FiUserPlus className="action-icon" />
            <span className="action-text">Add New Child Profile</span>
          </button>
          <button className="quick-action-btn" onClick={() => handleViewAnalytics(selectedChild)}>
            <FiBarChart2 className="action-icon" />
            <span className="action-text">View Analytics</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function ActivitiesView({ activities, selectedCategory, setSelectedCategory, getCategoryColor, setSelectedActivity }) {
  return (
    <div className="activities-page">
      <header className="page-header">
        <h1>Activity Library</h1>
        <p>Browse and explore all available therapy activities</p>
      </header>

      <div className="category-filters">
        <button
          className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All Activities
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'social' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('social')}
          style={{ borderColor: getCategoryColor('social') }}
        >
          Social
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'behavioral' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('behavioral')}
          style={{ borderColor: getCategoryColor('behavioral') }}
        >
          Behavioral
        </button>
        <button
          className={`filter-btn ${selectedCategory === 'emotional' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('emotional')}
          style={{ borderColor: getCategoryColor('emotional') }}
        >
          Emotional
        </button>
      </div>

      <div className="activity-grid">
        {activities.map(activity => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            getCategoryColor={getCategoryColor}
            onSelect={() => setSelectedActivity(activity)}
          />
        ))}
      </div>
    </div>
  );
}

function RecommendationsView({ selectedChild, recommendations, activities, getCategoryColor, onSelect, predictedEmotion }) {
  const totals = {
    social: recommendations.filter(a => a.category === 'social').length,
    behavioral: recommendations.filter(a => a.category === 'behavioral').length,
    emotional: recommendations.filter(a => a.category === 'emotional').length,
  };
  const allTotals = {
    social: activities.filter(a => a.category === 'social').length,
    behavioral: activities.filter(a => a.category === 'behavioral').length,
    emotional: activities.filter(a => a.category === 'emotional').length,
  };

  const percent = (num, den) => den ? Math.round((num / den) * 100) : 0;

  return (
    <div className="activities-page">
      <header className="page-header">
        <h1>Personalized Recommendations</h1>
        <p>
          {selectedChild ? `For ${selectedChild.name}` : 'Select a child'}
          {predictedEmotion?.emotion ? ' | Emotion: ' + predictedEmotion.emotion : ''}
        </p>
      </header>

      {/* Summary charts */}
      <div className="stats-grid">
        {['social','behavioral','emotional'].map(cat => (
          <div key={cat} className="stat-card" style={{ borderTopColor: getCategoryColor(cat) }}>
            <div className="stat-content" style={{ width: '100%' }}>
              <p className="stat-title" style={{ color: '#2c3e50' }}>{cat[0].toUpperCase() + cat.slice(1)}</p>
              <div className="progress-bar" style={{ height: 12 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${percent(totals[cat], allTotals[cat])}%` }}
                ></div>
              </div>
              <p className="stat-subtitle">
                {totals[cat]} of {allTotals[cat]} - {percent(totals[cat], allTotals[cat])}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recommended activities list */}
      <div className="activity-grid">
        {recommendations.map(activity => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            getCategoryColor={getCategoryColor}
            onSelect={() => onSelect(activity)}
          />
        ))}
        {recommendations.length === 0 && (
          <div className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
            <p>No recommendations yet. Generate them from Dashboard using the input form.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color, subtitle }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <div className="stat-icon" style={{ backgroundColor: color + '20', color: color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        <p className="stat-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}

function CategoryStatCard({ category, count, color, icon }) {
  return (
    <div className="category-stat-card" style={{ borderLeftColor: color }}>
      <div className="category-stat-icon" style={{ color: color }}>
        {icon}
      </div>
      <div className="category-stat-content">
        <h3 className="category-stat-value">{count}</h3>
        <p className="category-stat-label">{category.charAt(0).toUpperCase() + category.slice(1)} Activities</p>
      </div>
    </div>
  );
}

// Add Child Modal Component
function AddChildModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    autismType: '',
    autismSeverity: 3,
    interests: [],
    financialStatus: 'Financially Comfortable',
    socialStatus: 'with-parent'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age) return;

    setSubmitError('');
    setIsSubmitting(true);

    try {
      await onAdd({
        name: String(formData.name || '').trim(),
        age: parseInt(formData.age, 10),
        interests: formData.interests.map((interest) => String(interest).toLowerCase()),
        financialStatus: formData.financialStatus,
        socialStatus: formData.socialStatus,
        autismDetails: {
          type: String(formData.autismType || '').trim() || 'ASD-2',
          severity: Number(formData.autismSeverity),
          specificNeeds: []
        }
      });
    } catch (error) {
      setSubmitError(error?.message || 'Unable to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const interestOptions = ['music', 'art', 'sports', 'reading', 'animals', 'technology', 'nature', 'games'];
  
  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-child-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FiX />
        </button>
        
        <div className="add-child-header">
          <div className="header-icon-wrapper">
            <FiUserPlus className="header-icon" />
          </div>
          <h2>Create New Child Profile</h2>
          <p className="header-subtitle">Enter the child's information to personalize their therapy experience</p>
        </div>
        
        <form className="add-child-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="section-title">
              <FiUser /> Basic Information
            </h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Child's Name <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter child's full name"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Age <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <FiInfo className="input-icon" />
                  <input
                    type="number"
                    required
                    className="form-input"
                    min="1"
                    max="18"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Age (1-18)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">
              <FiTarget /> Autism Profile
            </h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Autism Type</label>
                <div className="input-wrapper">
                  <FiTarget className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    value={formData.autismType}
                    onChange={(e) => setFormData({ ...formData, autismType: e.target.value })}
                    placeholder="e.g., ASD Level 1, Level 2, Level 3"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Support Needs Level</label>
                <div className="severity-selector">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`severity-btn ${formData.autismSeverity === level ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, autismSeverity: level })}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <small className="form-hint">1 = Minimal support | 5 = Substantial support</small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">
              <FiHeart /> Interests & Preferences
            </h3>
            
            <div className="form-group full-width">
              <label className="form-label">Select Interests</label>
              <div className="interest-chips">
                {interestOptions.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    className={`interest-chip ${formData.interests.includes(interest) ? 'selected' : ''}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {formData.interests.includes(interest) && <FiCheckCircle />}
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">
              <FiSettings /> Social & Financial Settings
            </h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <FiDollarSign /> Financial Status
                </label>
                <select
                  className="form-select"
                  value={formData.financialStatus}
                  onChange={(e) => setFormData({ ...formData, financialStatus: e.target.value })}
                >
                  <option value="Financially Struggling">Free Activities</option>
                  <option value="Financially Stable">Low Budget</option>
                  <option value="Financially Comfortable">Medium Budget</option>
                  <option value="Financially Well-Off">Premium Budget</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <FiUsers /> Social Preference
                </label>
                <select
                  className="form-select"
                  value={formData.socialStatus}
                  onChange={(e) => setFormData({ ...formData, socialStatus: e.target.value })}
                >
                  <option value="alone">Independent/Alone</option>
                  <option value="with-parent">With Parent/Guardian</option>
                  <option value="with-family">With Family</option>
                  <option value="community">Community Setting</option>
                </select>
              </div>
            </div>
          </div>

          {submitError && <p className="add-child-error">{submitError}</p>}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              <FiX /> Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              <FiCheckCircle /> {isSubmitting ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Progress Reports Modal Component
function ProgressReportsModal({ selectedChild, recommendations = [], activities = [], recommendationContext, onClose }) {
  if (!selectedChild) return null;

  const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
  const normalize = (value) => String(value || '').trim().toLowerCase();
  const unique = (items) => Array.from(new Set(items.filter(Boolean)));
  const toLabel = (value) => {
    const text = String(value || '').trim();
    if (!text) return 'N/A';
    return text
      .replace(/[-_]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };
  const formatDateTime = (value) => {
    const parsed = value ? new Date(value) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return 'Unknown time';
    return parsed.toLocaleString();
  };

  const toInternalEmotion = (emotion) => {
    const token = normalize(emotion);
    const mapping = {
      natural: 'calm',
      joy: 'happy',
      fear: 'anxious',
      anger: 'frustrated',
      sadness: 'sad',
      surprise: 'excited'
    };
    return mapping[token] || token || 'neutral';
  };

  const mapBudgetLevel = (status) => {
    const token = normalize(status);
    if (!token) return 2;
    if (token.includes('struggling') || token === 'free') return 0;
    if (token.includes('stable') || token.includes('low')) return 1;
    if (token.includes('comfortable') || token.includes('medium') || token.includes('moderate')) return 2;
    if (token.includes('well-off') || token.includes('high') || token.includes('premium')) return 3;
    return 2;
  };

  const mapCostLevel = (costLevel) => {
    const token = normalize(costLevel);
    if (token === 'free') return 0;
    if (token === 'low') return 1;
    if (token === 'medium') return 2;
    if (token === 'high') return 3;
    return 1;
  };

  const mapSocialContextLevel = (status) => {
    const token = normalize(status);
    if (['alone', 'none'].includes(token)) return 0;
    if (['with-parent', 'with parent', 'with-family', 'with family', 'family', 'caregiver', 'low'].includes(token)) return 1;
    if (['medium'].includes(token)) return 2;
    if (['community', 'group', 'high'].includes(token)) return 3;
    return 1;
  };

  const mapSocialRequirementLevel = (requirement) => {
    const token = normalize(requirement);
    if (token === 'none') return 0;
    if (token === 'low') return 1;
    if (token === 'medium') return 2;
    if (token === 'high') return 3;
    return 1;
  };

  const getActivityText = (activity) => {
    const content = [
      activity?.title,
      activity?.description,
      activity?.recommendedReason,
      ...asArray(activity?.benefits),
      ...asArray(activity?.materials),
      ...asArray(activity?.interestTags)
    ];
    return content.join(' ').toLowerCase();
  };

  const usingRecommendationContext =
    recommendationContext && Number(recommendationContext.childId) === Number(selectedChild.id);

  const contextEmotion = usingRecommendationContext
    ? recommendationContext?.emotion || selectedChild.currentEmotion || 'Natural'
    : selectedChild.currentEmotion || 'Natural';
  const contextInterests = unique(
    (
      usingRecommendationContext
        ? asArray(recommendationContext?.interests)
        : asArray(selectedChild.interests)
    ).map(normalize)
  );
  const contextFinancialStatus = usingRecommendationContext
    ? recommendationContext?.financialStatus || selectedChild.financialStatus || 'medium'
    : selectedChild.financialStatus || 'medium';
  const contextSocialStatus = usingRecommendationContext
    ? recommendationContext?.socialStatus || selectedChild.socialStatus || 'alone'
    : selectedChild.socialStatus || 'alone';
  const contextAutismType = usingRecommendationContext
    ? recommendationContext?.autismProfile?.type || selectedChild.autismDetails?.type || 'Not specified'
    : selectedChild.autismDetails?.type || 'Not specified';
  const contextSeverity = usingRecommendationContext
    ? recommendationContext?.autismProfile?.severity || selectedChild.autismDetails?.severity || 'N/A'
    : selectedChild.autismDetails?.severity || 'N/A';

  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];
  const safeActivities = Array.isArray(activities) ? activities : [];
  const emotionHistory = Array.isArray(selectedChild.emotionHistory) ? selectedChild.emotionHistory : [];

  const therapistFeedbackItems = unique(
    [
      ...asArray(selectedChild.therapistFeedback),
      ...asArray(selectedChild.feedback),
      ...asArray(selectedChild.therapistNotes),
      ...asArray(selectedChild.challenges),
      ...asArray(selectedChild.autismDetails?.specificNeeds)
    ]
      .map((entry) => String(entry || '').trim())
      .filter(Boolean)
  );

  const therapistFeedbackTokens = unique(
    therapistFeedbackItems.flatMap((entry) =>
      entry
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter((token) => token.length >= 4)
    )
  );
  const hasTherapistFeedback = therapistFeedbackTokens.length > 0;

  const matchesInterests = (activity) => {
    if (contextInterests.length === 0) return true;
    const tags = asArray(activity?.interestTags).map(normalize);
    if (tags.some((tag) => contextInterests.includes(tag))) return true;
    const text = getActivityText(activity);
    return contextInterests.some((interest) => text.includes(interest));
  };

  const matchesBudget = (activity) =>
    mapCostLevel(activity?.costLevel) <= mapBudgetLevel(contextFinancialStatus);

  const matchesSocialSetting = (activity) =>
    mapSocialRequirementLevel(activity?.socialRequirement) <= mapSocialContextLevel(contextSocialStatus);

  const emotionAlignment = (activity) => {
    const key = toInternalEmotion(contextEmotion);
    const value = Number(activity?.emotionMapping?.[key] || 0);
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(1, value));
  };

  const matchesTherapistFeedback = (activity) => {
    if (!hasTherapistFeedback) return false;
    const text = getActivityText(activity);
    return therapistFeedbackTokens.some((token) => text.includes(token));
  };

  const positiveEmotionSignals = new Set(['calm', 'happy', 'joy', 'neutral', 'natural', 'excited']);
  const challengingEmotionSignals = new Set(['sad', 'sadness', 'anxious', 'fear', 'frustrated', 'anger']);
  const trendSample = emotionHistory.slice(-12);
  let positiveCount = 0;
  let trackedCount = 0;
  trendSample.forEach((entry) => {
    const emotionToken = normalize(entry?.emotion || entry?.originalLabel);
    if (positiveEmotionSignals.has(emotionToken)) {
      positiveCount += 1;
      trackedCount += 1;
    } else if (challengingEmotionSignals.has(emotionToken)) {
      trackedCount += 1;
    }
  });
  const emotionalTrendScore = trackedCount > 0 ? positiveCount / trackedCount : 0.5;

  const categoryMeta = [
    { key: 'social', label: 'Social Development', icon: FiUsers },
    { key: 'behavioral', label: 'Behavioral Progress', icon: FiTarget },
    { key: 'emotional', label: 'Emotional Growth', icon: FiHeart }
  ];

  const totalRecommended = safeRecommendations.length;
  const recommendationCoverage = safeActivities.length
    ? Math.round((Math.min(totalRecommended, safeActivities.length) / safeActivities.length) * 100)
    : 0;
  const fullyAlignedCount = safeRecommendations.filter(
    (activity) => matchesInterests(activity) && matchesBudget(activity) && matchesSocialSetting(activity)
  ).length;
  const therapistAlignedCount = hasTherapistFeedback
    ? safeRecommendations.filter((activity) => matchesTherapistFeedback(activity)).length
    : 0;

  const categoryProgress = categoryMeta.map((category) => {
    const scoped = safeRecommendations.filter((activity) => activity?.category === category.key);
    const libraryCount = safeActivities.filter((activity) => activity?.category === category.key).length;
    const plannedShare = totalRecommended > 0 ? scoped.length / totalRecommended : 0;

    const interestAlignedCount = scoped.filter((activity) => matchesInterests(activity)).length;
    const budgetAlignedCount = scoped.filter((activity) => matchesBudget(activity)).length;
    const socialAlignedCount = scoped.filter((activity) => matchesSocialSetting(activity)).length;
    const feedbackAlignedCount = scoped.filter((activity) => matchesTherapistFeedback(activity)).length;

    const avgEmotionFit = scoped.length > 0
      ? scoped.reduce((sum, activity) => sum + emotionAlignment(activity), 0) / scoped.length
      : 0;

    const inputAlignmentScore = scoped.length > 0
      ? (
          (interestAlignedCount / scoped.length) +
          (budgetAlignedCount / scoped.length) +
          (socialAlignedCount / scoped.length) +
          avgEmotionFit
        ) / 4
      : 0;

    const feedbackScore = scoped.length > 0 && hasTherapistFeedback
      ? feedbackAlignedCount / scoped.length
      : 0;

    const outcomeSignal = category.key === 'emotional' ? emotionalTrendScore : inputAlignmentScore;
    const weightedScore = hasTherapistFeedback
      ? (plannedShare * 0.35) + (inputAlignmentScore * 0.35) + (feedbackScore * 0.2) + (outcomeSignal * 0.1)
      : (plannedShare * 0.4) + (inputAlignmentScore * 0.45) + (outcomeSignal * 0.15);

    return {
      ...category,
      score: Math.round(Math.max(0, Math.min(1, weightedScore)) * 100),
      plannedCount: scoped.length,
      libraryCount,
      inputAlignmentPct: Math.round(inputAlignmentScore * 100),
      feedbackPct: Math.round(feedbackScore * 100),
      topActivities: scoped.slice(0, 2).map((activity) => activity.title).filter(Boolean)
    };
  });

  const overallScore = categoryProgress.length > 0
    ? Math.round(categoryProgress.reduce((sum, category) => sum + category.score, 0) / categoryProgress.length)
    : 0;

  const timelineEntries = emotionHistory.slice(-6).reverse();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content progress-report-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FiX />
        </button>

        <div className="progress-report-header">
          <div className="progress-report-title">
            <FiFileText className="progress-report-title-icon" />
            <div>
              <h2>Progress Reports - {selectedChild.name}</h2>
              <p>
                Data source: {usingRecommendationContext ? 'Latest recommendation form inputs + generated outputs' : 'Current child profile + generated outputs'}
              </p>
            </div>
          </div>
        </div>

        <div className="progress-report-content">
          <div className="progress-report-overview">
            <div className="progress-report-kpi">
              <span className="progress-kpi-label">Overall Progress</span>
              <strong>{overallScore}%</strong>
              <small>Weighted from fit, output balance, and therapist signals</small>
            </div>
            <div className="progress-report-kpi">
              <span className="progress-kpi-label">Activities Planned</span>
              <strong>{totalRecommended}</strong>
              <small>{recommendationCoverage}% of current library</small>
            </div>
            <div className="progress-report-kpi">
              <span className="progress-kpi-label">Input Alignment</span>
              <strong>{totalRecommended > 0 ? Math.round((fullyAlignedCount / totalRecommended) * 100) : 0}%</strong>
              <small>{fullyAlignedCount} of {totalRecommended} activities fit inputs</small>
            </div>
            <div className="progress-report-kpi">
              <span className="progress-kpi-label">Feedback Coverage</span>
              <strong>{hasTherapistFeedback && totalRecommended > 0 ? Math.round((therapistAlignedCount / totalRecommended) * 100) : 0}%</strong>
              <small>
                {hasTherapistFeedback
                  ? `${therapistAlignedCount} activities reflect therapist feedback`
                  : 'No therapist feedback inputs yet'}
              </small>
            </div>
          </div>

          <div className="progress-score-grid">
            {categoryProgress.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.key} className={`progress-score-card tone-${category.key}`}>
                  <div className="progress-score-head">
                    <div className="progress-score-title">
                      <Icon className="progress-score-icon" />
                      <h3>{category.label}</h3>
                    </div>
                    <span className="progress-score-value">{category.score}%</span>
                  </div>

                  <div className="progress-score-meter">
                    <div className={`progress-score-fill tone-${category.key}`} style={{ width: `${category.score}%` }}></div>
                  </div>

                  <div className="progress-score-meta">
                    <span>{category.plannedCount}/{category.libraryCount} activities planned</span>
                    <span>Input fit {category.inputAlignmentPct}%</span>
                    <span>Feedback match {category.feedbackPct}%</span>
                  </div>

                  {category.topActivities.length > 0 && (
                    <p className="progress-score-note">
                      Top picks: {category.topActivities.join(', ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="progress-insight-grid">
            <section className="progress-panel">
              <h3><FiSettings /> Input Snapshot</h3>
              <div className="progress-data-grid">
                <div className="progress-data-item">
                  <span>Emotion</span>
                  <strong>{toLabel(contextEmotion)}</strong>
                </div>
                <div className="progress-data-item">
                  <span>Financial Status</span>
                  <strong>{toLabel(contextFinancialStatus)}</strong>
                </div>
                <div className="progress-data-item">
                  <span>Social Setting</span>
                  <strong>{toLabel(contextSocialStatus)}</strong>
                </div>
                <div className="progress-data-item">
                  <span>Autism Profile</span>
                  <strong>{toLabel(contextAutismType)} | Severity {contextSeverity}</strong>
                </div>
              </div>
              <div className="progress-chip-list">
                {contextInterests.length > 0 ? (
                  contextInterests.map((interest) => (
                    <span key={interest} className="progress-chip">{toLabel(interest)}</span>
                  ))
                ) : (
                  <span className="progress-empty">No interests provided in current input context.</span>
                )}
              </div>
            </section>

            <section className="progress-panel">
              <h3><FiStar /> Activity Outputs</h3>
              {safeRecommendations.length > 0 ? (
                <ul className="progress-output-list">
                  {safeRecommendations.slice(0, 6).map((activity, idx) => (
                    <li key={`${activity.id || activity.title || idx}-${idx}`} className="progress-output-item">
                      <div className="progress-output-head">
                        <strong>{activity.title || 'Untitled activity'}</strong>
                        <span className={`progress-category-badge category-${normalize(activity.category)}`}>
                          {toLabel(activity.category)}
                        </span>
                      </div>
                      <p>{activity.recommendedReason || activity.description || 'No detailed reasoning available.'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="progress-empty">No activity outputs yet. Generate recommendations to populate this section.</p>
              )}
            </section>

            <section className="progress-panel">
              <h3><FiClipboard /> Therapist Feedback</h3>
              {therapistFeedbackItems.length > 0 ? (
                <>
                  <div className="progress-chip-list">
                    {therapistFeedbackItems.slice(0, 8).map((item, idx) => (
                      <span key={`${item}-${idx}`} className="progress-chip feedback">{item}</span>
                    ))}
                  </div>
                  <div className="progress-feedback-summary">
                    <FiCheckCircle />
                    <span>
                      {therapistAlignedCount} of {totalRecommended} planned activities align with therapist feedback.
                    </span>
                  </div>
                </>
              ) : (
                <p className="progress-empty">No therapist feedback recorded. Add challenges, notes, or specific needs to improve alignment scoring.</p>
              )}
            </section>

            <section className="progress-panel">
              <h3><FiTrendingUp /> Recent Activity History</h3>
              {timelineEntries.length > 0 ? (
                <ul className="progress-history-list">
                  {timelineEntries.map((entry, idx) => {
                    const confidence = Number(entry?.confidence || 0);
                    return (
                      <li key={`${entry?.timestamp || idx}-${idx}`} className="progress-history-item">
                        <div className="progress-history-row">
                          <span className="progress-history-emotion">{toLabel(entry?.emotion || entry?.originalLabel || 'Unknown')}</span>
                          <span className="progress-history-time"><FiClock /> {formatDateTime(entry?.timestamp)}</span>
                        </div>
                        <div className="progress-history-meta">
                          {entry?.source && <span>Source: {toLabel(entry.source)}</span>}
                          {confidence > 0 && <span>Confidence: {(confidence * 100).toFixed(1)}%</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="progress-empty">No activity history yet for this child profile.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics Modal Component
function AnalyticsModal({
  selectedChild,
  recommendations = [],
  activities = [],
  recommendationContext,
  latestDetectionSnapshot,
  onClose
}) {
  if (!selectedChild) return null;

  const asArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
  const normalize = (value) => String(value || '').trim().toLowerCase();
  const unique = (items) => Array.from(new Set(items.filter(Boolean)));
  const toLabel = (value) => {
    const text = String(value || '').trim();
    if (!text) return 'N/A';
    return text
      .replace(/[-_]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };
  const formatDateTime = (value) => {
    const parsed = value ? new Date(value) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return 'Unknown time';
    return parsed.toLocaleString();
  };

  const toInternalEmotion = (emotion) => {
    const token = normalize(emotion);
    const mapping = {
      natural: 'calm',
      joy: 'happy',
      fear: 'anxious',
      anger: 'frustrated',
      sadness: 'sad',
      surprise: 'excited'
    };
    return mapping[token] || token || 'neutral';
  };

  const mapBudgetLevel = (status) => {
    const token = normalize(status);
    if (!token) return 2;
    if (token.includes('struggling') || token === 'free') return 0;
    if (token.includes('stable') || token.includes('low')) return 1;
    if (token.includes('comfortable') || token.includes('medium') || token.includes('moderate')) return 2;
    if (token.includes('well-off') || token.includes('high') || token.includes('premium')) return 3;
    return 2;
  };

  const mapCostLevel = (costLevel) => {
    const token = normalize(costLevel);
    if (token === 'free') return 0;
    if (token === 'low') return 1;
    if (token === 'medium') return 2;
    if (token === 'high') return 3;
    return 1;
  };

  const mapSocialContextLevel = (status) => {
    const token = normalize(status);
    if (['alone', 'none'].includes(token)) return 0;
    if (['with-parent', 'with parent', 'with-family', 'with family', 'family', 'caregiver', 'low'].includes(token)) return 1;
    if (['medium'].includes(token)) return 2;
    if (['community', 'group', 'high'].includes(token)) return 3;
    return 1;
  };

  const mapSocialRequirementLevel = (requirement) => {
    const token = normalize(requirement);
    if (token === 'none') return 0;
    if (token === 'low') return 1;
    if (token === 'medium') return 2;
    if (token === 'high') return 3;
    return 1;
  };

  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];
  const safeActivities = Array.isArray(activities) ? activities : [];
  const emotionHistory = Array.isArray(selectedChild.emotionHistory) ? selectedChild.emotionHistory : [];

  const latestEmotionEntry = emotionHistory.length > 0 ? emotionHistory[emotionHistory.length - 1] : null;
  const isSnapshotForSelectedChild =
    Number(latestDetectionSnapshot?.childId) === Number(selectedChild.id);
  const snapshotEmotion = isSnapshotForSelectedChild
    ? String(latestDetectionSnapshot?.emotion || '').trim()
    : '';
  const latestEmotionLabel =
    snapshotEmotion ||
    latestEmotionEntry?.emotion ||
    latestEmotionEntry?.originalLabel ||
    selectedChild.currentEmotion ||
    'Natural';
  const latestEmotionConfidence = snapshotEmotion
    ? Number(latestDetectionSnapshot?.confidence || 0)
    : Number(latestEmotionEntry?.confidence || 0);
  const latestEmotionSource = snapshotEmotion
    ? toLabel(latestDetectionSnapshot?.source || 'live')
    : latestEmotionEntry?.source
    ? toLabel(latestEmotionEntry.source)
    : 'Profile update';
  const latestEmotionTimestamp = snapshotEmotion
    ? latestDetectionSnapshot?.timestamp
    : latestEmotionEntry?.timestamp;

  const usingRecommendationContext =
    recommendationContext && Number(recommendationContext.childId) === Number(selectedChild.id);

  const contextEmotion = usingRecommendationContext
    ? recommendationContext?.emotion || selectedChild.currentEmotion || 'Natural'
    : selectedChild.currentEmotion || 'Natural';
  const contextInterests = unique(
    (
      usingRecommendationContext
        ? asArray(recommendationContext?.interests)
        : asArray(selectedChild.interests)
    ).map(normalize)
  );
  const contextFinancialStatus = usingRecommendationContext
    ? recommendationContext?.financialStatus || selectedChild.financialStatus || 'medium'
    : selectedChild.financialStatus || 'medium';
  const contextSocialStatus = usingRecommendationContext
    ? recommendationContext?.socialStatus || selectedChild.socialStatus || 'alone'
    : selectedChild.socialStatus || 'alone';
  const contextAutismType = usingRecommendationContext
    ? recommendationContext?.autismProfile?.type || selectedChild.autismDetails?.type || 'Not specified'
    : selectedChild.autismDetails?.type || 'Not specified';
  const contextSeverity = usingRecommendationContext
    ? recommendationContext?.autismProfile?.severity || selectedChild.autismDetails?.severity || 'N/A'
    : selectedChild.autismDetails?.severity || 'N/A';
  const contextGeneratedAt = usingRecommendationContext ? recommendationContext?.generatedAt : null;

  const therapistFeedbackItems = unique(
    [
      ...asArray(selectedChild.therapistFeedback),
      ...asArray(selectedChild.feedback),
      ...asArray(selectedChild.therapistNotes),
      ...asArray(selectedChild.challenges),
      ...asArray(selectedChild.autismDetails?.specificNeeds)
    ]
      .map((entry) => String(entry || '').trim())
      .filter(Boolean)
  );
  const therapistFeedbackTokens = unique(
    therapistFeedbackItems.flatMap((entry) =>
      entry
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter((token) => token.length >= 4)
    )
  );
  const hasTherapistFeedback = therapistFeedbackTokens.length > 0;

  const getActivityText = (activity) => {
    const content = [
      activity?.title,
      activity?.description,
      activity?.recommendedReason,
      ...asArray(activity?.benefits),
      ...asArray(activity?.materials),
      ...asArray(activity?.interestTags)
    ];
    return content.join(' ').toLowerCase();
  };

  const matchesInterests = (activity) => {
    if (contextInterests.length === 0) return true;
    const tags = asArray(activity?.interestTags).map(normalize);
    if (tags.some((tag) => contextInterests.includes(tag))) return true;
    const text = getActivityText(activity);
    return contextInterests.some((interest) => text.includes(interest));
  };
  const matchesBudget = (activity) =>
    mapCostLevel(activity?.costLevel) <= mapBudgetLevel(contextFinancialStatus);
  const matchesSocialSetting = (activity) =>
    mapSocialRequirementLevel(activity?.socialRequirement) <= mapSocialContextLevel(contextSocialStatus);
  const matchesTherapistFeedback = (activity) => {
    if (!hasTherapistFeedback) return false;
    const text = getActivityText(activity);
    return therapistFeedbackTokens.some((token) => text.includes(token));
  };
  const emotionAlignment = (activity) => {
    const key = toInternalEmotion(contextEmotion);
    const value = Number(activity?.emotionMapping?.[key] || 0);
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(1, value));
  };

  const categoryMeta = [
    { key: 'social', label: 'Social Development', icon: FiUsers },
    { key: 'behavioral', label: 'Behavioral Support', icon: FiTarget },
    { key: 'emotional', label: 'Emotional Growth', icon: FiHeart }
  ];

  const totalRecommended = safeRecommendations.length;
  const recommendationCoverage = safeActivities.length
    ? Math.round((Math.min(totalRecommended, safeActivities.length) / safeActivities.length) * 100)
    : 0;
  const inputAlignedCount = safeRecommendations.filter(
    (activity) =>
      matchesInterests(activity) &&
      matchesBudget(activity) &&
      matchesSocialSetting(activity) &&
      emotionAlignment(activity) >= 0.35
  ).length;
  const therapistAlignedCount = hasTherapistFeedback
    ? safeRecommendations.filter((activity) => matchesTherapistFeedback(activity)).length
    : 0;

  const inputFitPct = totalRecommended > 0 ? Math.round((inputAlignedCount / totalRecommended) * 100) : 0;
  const feedbackFitPct = hasTherapistFeedback && totalRecommended > 0
    ? Math.round((therapistAlignedCount / totalRecommended) * 100)
    : 0;
  const emotionFitPct = totalRecommended > 0
    ? Math.round(
        (safeRecommendations.reduce((sum, activity) => sum + emotionAlignment(activity), 0) / totalRecommended) * 100
      )
    : 0;

  const categoryRows = categoryMeta.map((category) => {
    const scoped = safeRecommendations.filter((activity) => normalize(activity?.category) === category.key);
    const count = scoped.length;
    const pct = totalRecommended > 0 ? Math.round((count / totalRecommended) * 100) : 0;
    const categoryInputFit = count > 0
      ? Math.round(
          (scoped.filter(
            (activity) => matchesInterests(activity) && matchesBudget(activity) && matchesSocialSetting(activity)
          ).length / count) * 100
        )
      : 0;
    const categoryEmotionFit = count > 0
      ? Math.round((scoped.reduce((sum, activity) => sum + emotionAlignment(activity), 0) / count) * 100)
      : 0;
    const categoryFeedbackFit = hasTherapistFeedback && count > 0
      ? Math.round((scoped.filter((activity) => matchesTherapistFeedback(activity)).length / count) * 100)
      : 0;

    return {
      ...category,
      count,
      pct,
      inputFit: categoryInputFit,
      emotionFit: categoryEmotionFit,
      feedbackFit: categoryFeedbackFit
    };
  });

  const focusCategory = categoryRows.reduce(
    (best, current) => (current.count > best.count ? current : best),
    categoryRows[0] || { label: 'No focus', count: 0 }
  );

  const positiveEmotionSignals = new Set(['calm', 'happy', 'joy', 'neutral', 'natural', 'excited', 'surprise']);
  const challengingEmotionSignals = new Set(['sad', 'sadness', 'anxious', 'fear', 'frustrated', 'anger']);
  const trendWindow = emotionHistory.slice(-12);
  let positiveCount = 0;
  let trackedCount = 0;
  trendWindow.forEach((entry) => {
    const emotionToken = normalize(entry?.emotion || entry?.originalLabel);
    if (positiveEmotionSignals.has(emotionToken)) {
      positiveCount += 1;
      trackedCount += 1;
    } else if (challengingEmotionSignals.has(emotionToken)) {
      trackedCount += 1;
    }
  });
  const emotionalTrendPct = trackedCount > 0 ? Math.round((positiveCount / trackedCount) * 100) : 50;
  const trendLabel =
    emotionalTrendPct >= 65 ? 'Improving' : emotionalTrendPct >= 45 ? 'Stable' : 'Needs more support';

  const generatedAtTime = contextGeneratedAt ? new Date(contextGeneratedAt).getTime() : Number.NaN;
  const postGuidanceEntries = Number.isFinite(generatedAtTime)
    ? emotionHistory.filter((entry) => {
        const entryTime = new Date(entry?.timestamp || '').getTime();
        return Number.isFinite(entryTime) && entryTime >= generatedAtTime;
      })
    : [];
  const timelineEntries = (postGuidanceEntries.length > 0 ? postGuidanceEntries : emotionHistory)
    .slice(-6)
    .reverse();
  const timelineCaption = postGuidanceEntries.length > 0
    ? 'Entries since recommendation form submission.'
    : 'Most recent emotion detections and updates.';

  const therapistMatchedActivities = hasTherapistFeedback
    ? safeRecommendations.filter((activity) => matchesTherapistFeedback(activity)).slice(0, 4)
    : [];
  const categoryPalette = {
    social: '#6B9CF6',
    behavioral: '#5EC8FF',
    emotional: '#53e0bc'
  };
  const categoryChartSegments = categoryRows.map((category) => ({
    ...category,
    color: categoryPalette[category.key] || '#9db8dd'
  }));
  const categoryChartGradient = (() => {
    const nonZeroSegments = categoryChartSegments.filter((segment) => segment.count > 0);
    if (nonZeroSegments.length === 0 || totalRecommended === 0) {
      return 'conic-gradient(#dcecff 0deg 360deg)';
    }

    let currentAngle = 0;
    const stops = nonZeroSegments.map((segment, idx) => {
      const sweep = (segment.count / totalRecommended) * 360;
      const endAngle = idx === nonZeroSegments.length - 1 ? 360 : currentAngle + sweep;
      const stop = `${segment.color} ${currentAngle.toFixed(2)}deg ${endAngle.toFixed(2)}deg`;
      currentAngle = endAngle;
      return stop;
    });

    return `conic-gradient(${stops.join(', ')})`;
  })();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content analytics-report-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FiX />
        </button>

        <div className="analytics-report-header">
          <div className="analytics-report-title-wrap">
            <FiBarChart2 className="analytics-report-title-icon" />
            <div>
              <h2>Analytics Report - {selectedChild.name}</h2>
              <p>
                {usingRecommendationContext
                  ? 'Driven by latest recommendation form + generated activities + therapist feedback'
                  : 'Driven by current child profile + generated activities + therapist feedback'}
              </p>
            </div>
          </div>
          <div className="analytics-report-generated">
            <span>Last sync</span>
            <strong>{formatDateTime(contextGeneratedAt || latestEmotionTimestamp)}</strong>
          </div>
        </div>

        <div className="analytics-report-content">
          <div className="analytics-kpi-grid">
            <div className="analytics-kpi-card tone-emotion">
              <span className="analytics-kpi-label">Current Emotion</span>
              <strong>{toLabel(latestEmotionLabel)}</strong>
              <small>
                {latestEmotionConfidence > 0
                  ? `Source ${latestEmotionSource} | Confidence ${(latestEmotionConfidence * 100).toFixed(1)}%`
                  : `Source ${latestEmotionSource}`}
              </small>
            </div>
            <div className="analytics-kpi-card tone-input">
              <span className="analytics-kpi-label">Input Match</span>
              <strong>{inputFitPct}%</strong>
              <small>{inputAlignedCount} of {totalRecommended} activities fit the form inputs</small>
            </div>
            <div className="analytics-kpi-card tone-output">
              <span className="analytics-kpi-label">Activities Generated</span>
              <strong>{totalRecommended}</strong>
              <small>{recommendationCoverage}% of current activity library</small>
            </div>
            <div className="analytics-kpi-card tone-feedback">
              <span className="analytics-kpi-label">Therapist Alignment</span>
              <strong>{feedbackFitPct}%</strong>
              <small>
                {hasTherapistFeedback
                  ? `${therapistAlignedCount} activities align with therapist signals`
                  : 'No therapist feedback recorded yet'}
              </small>
            </div>
            <div className="analytics-kpi-card tone-trend">
              <span className="analytics-kpi-label">Emotion Trend</span>
              <strong>{emotionalTrendPct}%</strong>
              <small>{trendLabel} | Emotion fit {emotionFitPct}% | Focus {focusCategory.label}</small>
            </div>
          </div>

          <div className="analytics-panel-grid">
            <section className="analytics-panel analytics-panel-with-chart">
              <h3><FiSettings /> Recommendation Form Details</h3>
              <div className="analytics-data-grid">
                <div className="analytics-data-item">
                  <span>Detected emotion input</span>
                  <strong>{toLabel(contextEmotion)}</strong>
                </div>
                <div className="analytics-data-item">
                  <span>Financial status</span>
                  <strong>{toLabel(contextFinancialStatus)}</strong>
                </div>
                <div className="analytics-data-item">
                  <span>Social setting</span>
                  <strong>{toLabel(contextSocialStatus)}</strong>
                </div>
                <div className="analytics-data-item">
                  <span>Autism profile</span>
                  <strong>{toLabel(contextAutismType)} | Severity {contextSeverity}</strong>
                </div>
              </div>
              <div className="analytics-chip-list">
                {contextInterests.length > 0 ? (
                  contextInterests.map((interest) => (
                    <span key={interest} className="analytics-chip">{toLabel(interest)}</span>
                  ))
                ) : (
                  <span className="analytics-empty">No interests available in the current recommendation context.</span>
                )}
              </div>
              <div className="analytics-pie-wrap">
                <div
                  className="analytics-pie-chart"
                  style={{ '--analytics-pie-fill': categoryChartGradient }}
                  role="img"
                  aria-label="Distribution of generated activities by category"
                >
                  <div className="analytics-pie-hole">
                    <strong>{totalRecommended}</strong>
                    <span>Activities</span>
                  </div>
                </div>
                <ul className="analytics-pie-legend">
                  {categoryChartSegments.map((segment) => (
                    <li key={`chart-${segment.key}`}>
                      <span className="analytics-pie-dot" style={{ backgroundColor: segment.color }}></span>
                      <span>{segment.label}</span>
                      <strong>{segment.pct}%</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="analytics-panel">
              <h3><FiTarget /> Activities Generated</h3>
              <div className="analytics-category-list">
                {categoryRows.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div key={category.key} className="analytics-category-item">
                      <div className="analytics-category-head">
                        <div className="analytics-category-title">
                          <Icon />
                          <span>{category.label}</span>
                        </div>
                        <strong>{category.count}</strong>
                      </div>
                      <div className="analytics-meter">
                        <div className={`analytics-meter-fill tone-${category.key}`} style={{ width: `${category.pct}%` }}></div>
                      </div>
                      <div className="analytics-category-meta">
                        <span>{category.pct}% of output</span>
                        <span>Input fit {category.inputFit}%</span>
                        <span>Emotion fit {category.emotionFit}%</span>
                        <span>Feedback fit {category.feedbackFit}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {safeRecommendations.length > 0 ? (
                <ul className="analytics-output-list">
                  {safeRecommendations.slice(0, 5).map((activity, idx) => (
                    <li key={`${activity.id || activity.title || idx}-${idx}`} className="analytics-output-item">
                      <div className="analytics-output-head">
                        <strong>{activity.title || 'Untitled activity'}</strong>
                        <span>{toLabel(activity.category)}</span>
                      </div>
                      <p>{activity.recommendedReason || activity.description || 'No output rationale available.'}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="analytics-empty">No generated activities yet. Submit the recommendation form first.</p>
              )}
            </section>

            <section className="analytics-panel">
              <h3><FiClipboard /> Therapist Feedback After Activity Guidance</h3>
              {therapistFeedbackItems.length > 0 ? (
                <>
                  <div className="analytics-chip-list">
                    {therapistFeedbackItems.slice(0, 10).map((item, idx) => (
                      <span key={`${item}-${idx}`} className="analytics-chip feedback">{item}</span>
                    ))}
                  </div>
                  <div className="analytics-feedback-summary">
                    <FiCheckCircle />
                    <span>{therapistAlignedCount} of {totalRecommended} generated activities align with therapist feedback.</span>
                  </div>
                  {therapistMatchedActivities.length > 0 && (
                    <ul className="analytics-simple-list">
                      {therapistMatchedActivities.map((activity, idx) => (
                        <li key={`${activity.id || activity.title || idx}-feedback-${idx}`}>{activity.title || 'Untitled activity'}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="analytics-empty">
                  No therapist feedback is recorded yet. Add therapist notes, challenges, or specific needs to improve this section.
                </p>
              )}
            </section>

            <section className="analytics-panel">
              <h3><FiTrendingUp /> Outcome Timeline</h3>
              <p className="analytics-caption">{timelineCaption}</p>
              {timelineEntries.length > 0 ? (
                <ul className="analytics-history-list">
                  {timelineEntries.map((entry, idx) => {
                    const confidence = Number(entry?.confidence || 0);
                    return (
                      <li key={`${entry?.timestamp || idx}-${idx}`} className="analytics-history-item">
                        <div className="analytics-history-row">
                          <strong>{toLabel(entry?.emotion || entry?.originalLabel || 'Unknown')}</strong>
                          <span><FiClock /> {formatDateTime(entry?.timestamp)}</span>
                        </div>
                        <div className="analytics-history-meta">
                          {entry?.source && <span>Source {toLabel(entry.source)}</span>}
                          {confidence > 0 && <span>Confidence {(confidence * 100).toFixed(1)}%</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="analytics-empty">No emotion history recorded for this child yet.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function cleanRecommendationLabelText(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const withoutLabel = text.replace(
    /^(?:["'`]?)(recommendation|recommendedReason|title|description)(?:["'`]?)\s*:\s*/i,
    ''
  );
  const noLeadingRecommendation = withoutLabel.replace(/^recommendations?\b\s*[:-]?\s*/i, '');
  return noLeadingRecommendation.replace(/^[`"' ]+|[`"' ]+$/g, '').trim();
}

function formatCostLevelLabel(costLevel) {
  const raw = String(costLevel || '').trim().toLowerCase();
  if (!raw) return 'Not specified';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function getPrimaryBenefitText(activity) {
  if (Array.isArray(activity?.benefits) && activity.benefits.length > 0) {
    return cleanRecommendationLabelText(activity.benefits[0]);
  }
  const reason = cleanRecommendationLabelText(activity?.recommendedReason || '');
  if (reason) return reason;
  return 'Supports emotional balance and engagement.';
}

const SENSORY_KEYWORD_RE =
  /\bsensory\b|\bsensory[- ]?(break|activity|activities|tool|tools|tray|input|processing|exploration|regulation)\b/i;

function buildActivitySearchText(activity) {
  const parts = [
    cleanRecommendationLabelText(activity?.title || ''),
    cleanRecommendationLabelText(activity?.description || ''),
    cleanRecommendationLabelText(activity?.recommendedReason || ''),
    ...(Array.isArray(activity?.materials) ? activity.materials : []),
    ...(Array.isArray(activity?.benefits) ? activity.benefits : []),
    ...(Array.isArray(activity?.interestTags) ? activity.interestTags : [])
  ];
  return parts.join(' ').toLowerCase();
}

function isSensoryRecommendation(activity) {
  if (!activity || typeof activity !== 'object') return false;
  const text = buildActivitySearchText(activity);
  return SENSORY_KEYWORD_RE.test(text);
}

function filterNonSensoryRecommendations(items) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !isSensoryRecommendation(item));
}

const TWEMOJI_ICON_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg';
const REAL_WORLD_ICON_SRC = {
  dinosaur: `${TWEMOJI_ICON_BASE}/1f996.svg`,
  puzzle: `${TWEMOJI_ICON_BASE}/1f9e9.svg`,
  outdoor: `${TWEMOJI_ICON_BASE}/1f333.svg`,
  music: `${TWEMOJI_ICON_BASE}/1f3b8.svg`,
  reading: `${TWEMOJI_ICON_BASE}/1f4da.svg`,
  art: `${TWEMOJI_ICON_BASE}/1f3a8.svg`,
  sports: `${TWEMOJI_ICON_BASE}/26bd.svg`,
  pets: `${TWEMOJI_ICON_BASE}/1f43e.svg`,
  vehicle: `${TWEMOJI_ICON_BASE}/1f697.svg`,
  dance: `${TWEMOJI_ICON_BASE}/1f57a.svg`,
  calm: `${TWEMOJI_ICON_BASE}/1f9d8.svg`,
  structured: `${TWEMOJI_ICON_BASE}/1f4cb.svg`,
  social: `${TWEMOJI_ICON_BASE}/1f465.svg`,
  activity: `${TWEMOJI_ICON_BASE}/1f31f.svg`
};

function makeIconMeta(Icon, startColor, endColor, foregroundColor = '#ffffff', imageSrc = '') {
  return { Icon, startColor, endColor, foregroundColor, imageSrc };
}

function getActivityIconMeta(activity) {
  const iconCode = String(activity?.icon || '').trim().toUpperCase();
  const title = cleanRecommendationLabelText(activity?.title || '');
  const description = cleanRecommendationLabelText(activity?.description || '');
  const tags = Array.isArray(activity?.interestTags) ? activity.interestTags.join(' ') : '';
  const interestTagText = Array.isArray(activity?.interestTags)
    ? activity.interestTags.map((tag) => String(tag || '').toLowerCase()).join(' ')
    : '';
  const searchable = `${title} ${description} ${tags}`.toLowerCase();

  // Interest-first mapping for stronger relevance
  if (/\b(pet|pets|animal|animals|dog|cat|puppy|kitten|bird|birds|fish|marine|insect|insects)\b/.test(interestTagText) ||
      /\b(pet|pets|animal|animals|dog|cat|puppy|kitten|bird|birds|fish|marine|insect|insects)\b/.test(searchable)) {
    return makeIconMeta(FaPaw, '#F97316', '#EF4444', '#ffffff', REAL_WORLD_ICON_SRC.pets);
  }
  if (/\b(train|car|cars|vehicle|vehicles|truck|bus|transport)\b/.test(interestTagText) ||
      /\b(train|car|cars|vehicle|vehicles|truck|bus|transport)\b/.test(searchable)) {
    return makeIconMeta(FiActivity, '#F59E0B', '#F97316', '#ffffff', REAL_WORLD_ICON_SRC.vehicle);
  }
  if (/\b(dance|movement|rhythm)\b/.test(interestTagText) || /\b(dance|movement|rhythm)\b/.test(searchable)) {
    return makeIconMeta(FiMusic, '#EC4899', '#F43F5E', '#ffffff', REAL_WORLD_ICON_SRC.dance);
  }
  if (iconCode.startsWith('DINO') || /dinosaur|fossil|jurassic/.test(searchable)) {
    return makeIconMeta(GiDinosaurRex, '#F97316', '#F59E0B', '#ffffff', REAL_WORLD_ICON_SRC.dinosaur);
  }
  if (iconCode.startsWith('PUZ') || /puzzle|jigsaw|maze|logic/.test(searchable)) {
    return makeIconMeta(FaPuzzlePiece, '#6366F1', '#3B82F6', '#ffffff', REAL_WORLD_ICON_SRC.puzzle);
  }
  if (iconCode.startsWith('OUT') || /outdoor|nature|scavenger|trail|walk|park|garden/.test(searchable)) {
    return makeIconMeta(FiSun, '#22C55E', '#14B8A6', '#ffffff', REAL_WORLD_ICON_SRC.outdoor);
  }
  if (iconCode.startsWith('MUS') || /music|song|rhythm|melody|audio|instrument/.test(searchable)) {
    return makeIconMeta(FiMusic, '#EC4899', '#F97316', '#ffffff', REAL_WORLD_ICON_SRC.music);
  }
  if (iconCode.startsWith('READ') || /read|book|story|journal|writing|literacy/.test(searchable)) {
    return makeIconMeta(FiBookOpen, '#0EA5E9', '#2563EB', '#ffffff', REAL_WORLD_ICON_SRC.reading);
  }
  if (iconCode.startsWith('ART') || /draw|paint|art|craft|creative|design/.test(searchable)) {
    return makeIconMeta(FiPenTool, '#F43F5E', '#FB7185', '#ffffff', REAL_WORLD_ICON_SRC.art);
  }
  if (/sport|soccer|football|cricket|team|exercise|athletic/.test(searchable)) {
    return makeIconMeta(FiTarget, '#F97316', '#EF4444', '#ffffff', REAL_WORLD_ICON_SRC.sports);
  }
  if (/breath|mindful|calm|relax|emotion|feeling/.test(searchable)) {
    return makeIconMeta(FiWind, '#14B8A6', '#22D3EE', '#ffffff', REAL_WORLD_ICON_SRC.calm);
  }
  if (/schedule|checklist|token|routine|first-then|board|plan/.test(searchable)) {
    return makeIconMeta(FiClipboard, '#A855F7', '#6366F1', '#ffffff', REAL_WORLD_ICON_SRC.structured);
  }
  if (/social|peer|buddy|group|role[- ]?play|conversation|family/.test(searchable)) {
    return makeIconMeta(FiUsers, '#10B981', '#3B82F6', '#ffffff', REAL_WORLD_ICON_SRC.social);
  }
  return makeIconMeta(FiActivity, '#0EA5E9', '#2563EB', '#ffffff', REAL_WORLD_ICON_SRC.activity);
}

function ActivityVisualIcon({ meta, className }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = meta.Icon || FiActivity;
  const showImage = Boolean(meta.imageSrc) && !imageFailed;
  const iconStyle = {
    '--icon-start': meta.startColor,
    '--icon-end': meta.endColor,
    '--icon-foreground': meta.foregroundColor
  };

  return (
    <span className={className} style={iconStyle} aria-hidden="true">
      {showImage ? (
        <img
          src={meta.imageSrc}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <Icon />
      )}
    </span>
  );
}

// Enhanced Activity Card Component
function ActivityCard({ activity, getCategoryColor, onSelect }) {
  const descriptionText = cleanRecommendationLabelText(activity.description);
  const benefitText = getPrimaryBenefitText(activity);
  const costText = formatCostLevelLabel(activity.costLevel);
  const iconMeta = getActivityIconMeta(activity);

  return (
    <div className="activity-card" onClick={onSelect}>
      <div className="activity-card-header">
        <ActivityVisualIcon meta={iconMeta} className="activity-icon" />
        <span 
          className="category-badge"
          style={{ backgroundColor: getCategoryColor(activity.category) }}
        >
          {activity.category}
        </span>
      </div>
      <h3 className="activity-title">{cleanRecommendationLabelText(activity.title)}</h3>
      <div className="activity-brief-list">
        <p className="activity-brief-item activity-brief-description">
          <strong>Description:</strong> {descriptionText}
        </p>
        <p className="activity-brief-item">
          <strong>Cost:</strong> {costText}
        </p>
        <p className="activity-brief-item activity-brief-benefit">
          <strong>Benefit:</strong> {benefitText}
        </p>
      </div>
      
      <div className="activity-footer">
        <span className="activity-duration">Duration: {activity.duration}</span>
        <span className={`difficulty-badge difficulty-${activity.difficulty}`}>
          {activity.difficulty}
        </span>
      </div>
    </div>
  );
}

// Enhanced Activity Modal Component
function ActivityModal({ activity, getCategoryColor, onClose }) {
  const descriptionText = cleanRecommendationLabelText(activity.description);
  const benefitText = getPrimaryBenefitText(activity);
  const costText = formatCostLevelLabel(activity.costLevel);
  const reasonText = cleanRecommendationLabelText(activity.recommendedReason);
  const iconMeta = getActivityIconMeta(activity);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><FiX /></button>
        <div className="modal-header">
          <ActivityVisualIcon meta={iconMeta} className="activity-icon-large" />
          <h2>{cleanRecommendationLabelText(activity.title)}</h2>
          <span 
            className="category-badge-large"
            style={{ backgroundColor: getCategoryColor(activity.category) }}
          >
            {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
          </span>
        </div>
        <div className="modal-body">
          <div className="activity-recommendation-format">
            <div className="activity-format-row">
              <strong>Description:</strong>
              <span>{descriptionText}</span>
            </div>
            <div className="activity-format-row">
              <strong>Cost:</strong>
              <span>{costText}</span>
            </div>
            <div className="activity-format-row">
              <strong>Benefit:</strong>
              <span>{benefitText}</span>
            </div>
          </div>
          {reasonText && (
            <div className="activity-why-callout">
              <strong>Why this is recommended:</strong> {reasonText}
            </div>
          )}
          
          <div className="activity-details-grid">
            <div className="detail-item">
              <strong>Duration:</strong>
              <span>{activity.duration}</span>
            </div>
            <div className="detail-item">
              <strong>Difficulty:</strong>
              <span className={`difficulty-badge difficulty-${activity.difficulty}`}>
                {activity.difficulty}
              </span>
            </div>
            <div className="detail-item">
              <strong>Age Range:</strong>
              <span>{activity.ageRange}</span>
            </div>
            {activity.socialRequirement && (
              <div className="detail-item">
                <strong>Social Requirement:</strong>
                <span>{activity.socialRequirement}</span>
              </div>
            )}
          </div>

          <div className="activity-section">
            <h3>Materials Needed</h3>
            <ul className="materials-list">
              {activity.materials.map((material, idx) => (
                <li key={idx}>{material}</li>
              ))}
            </ul>
          </div>

          {/* Interest Tags */}
          {activity.interestTags && activity.interestTags.length > 0 && (
            <div className="activity-section">
              <h3>Interest Tags</h3>
              <div className="tags-grid">
                {activity.interestTags.map((tag, idx) => (
                  <span key={idx} className="interest-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="activity-section">
            <h3>Benefits</h3>
            <div className="benefits-grid">
              {activity.benefits.map((benefit, idx) => (
                <div key={idx} className="benefit-tag">
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Beautiful Recommendation Form View Component
function RecommendationFormView({
  selectedChild,
  formInputs,
  setFormInputs,
  interestOptions,
  financialOptions,
  socialOptions,
  submitRecommendationRequest,
  formRecommendations,
  predictedEmotion,
  getCategoryColor,
  setSelectedActivity,
  setCurrentView
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const interestIcons = {
    train: '\u{1F686}',
    cartoon: '\u{1F3AC}',
    music: '\u{1F3B5}',
    dance: '\u{1F483}',
    art: '\u{1F3A8}',
    sports: '\u{26BD}',
    puzzles: '\u{1F9E9}',
    outdoors: '\u{1F3DE}',
    reading: '\u{1F4D6}',
    visual: '\u{1F441}\uFE0F',
    structured: '\u{1F4CB}',
    quiet: '\u{1F92B}',
    'play-based': '\u{1F3AE}',
    movement: '\u{1F3C3}',
    'hands-on': '\u{270B}',
    sensory: '\u{1F50D}',
    artistic: '\u{1F58C}\uFE0F',
    creative: '\u{2728}',
    writing: '\u{270D}\uFE0F',
    'trains, cars, and vehicles': '\u{1F699}',
    dinosaurs: '\u{1F996}',
    'weather and space': '\u{1FA90}',
    pets: '\u{1F436}',
    'birdwatching or insects': '\u{1F426}',
    'marine life': '\u{1F420}',
    'drawing, painting, and art creation': '\u{1F58C}\uFE0F',
    crafting: '\u2702\uFE0F',
    'cultural traditions': '\u{1F3DB}\uFE0F',
    'books and stories': '\u{1F4DA}'
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitRecommendationRequest();
    setIsSubmitting(false);
    if (formRecommendations.length > 0) {
      setCurrentStep(4);
    }
  };

  return (
    <div className="recommendation-form-page">
      <div className="form-header">
        <div className="form-header-content">
          <h1 className="form-title">
            <FiSettings className="title-icon" />
            Personalized Activity Recommendations
          </h1>
          <p className="form-subtitle">
            Fill in the details below to get AI-powered activity suggestions tailored to the child's needs
          </p>
        </div>
        <div className="progress-indicator">
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">Step {currentStep} of {totalSteps}</span>
        </div>
      </div>

      <div className="form-container">
        {/* Step 1: Emotion Status */}
        <div className={`form-step step-emotion ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-header">
            <div className="step-number">{currentStep > 1 ? <FiCheckCircle /> : '1'}</div>
            <div className="step-title-content">
              <h2>
                <FiSmile className="step-icon" />
                Current Emotion
              </h2>
              <p>Detected emotion from uploaded image or select manually</p>
            </div>
          </div>
          <div className="step-content">
            {predictedEmotion ? (
              <div className="emotion-status-card">
                <div className="emotion-display-large">
                  <div className={`emotion-badge-large emotion-${predictedEmotion.emotion}`}>
                    <span>{predictedEmotion.emotion}</span>
                  </div>
                  <div className="confidence-display">
                    <span className="confidence-label">Confidence:</span>
                    <span className="confidence-value">{(predictedEmotion.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <p className="emotion-note">
                  <FiInfo /> This emotion will be used for recommendations
                </p>
              </div>
            ) : (
              <div className="emotion-status-card empty">
                <FiSmile className="empty-icon" />
                <p>No emotion detected yet. Upload an image from the Dashboard to detect emotion.</p>
                <button 
                  className="btn-secondary"
                  onClick={() => setCurrentView('dashboard')}
                >
                  <FiUpload /> Go to Dashboard
                </button>
              </div>
            )}
            <button 
              className="btn-step-next"
              onClick={() => setCurrentStep(2)}
              disabled={!predictedEmotion}
            >
              Continue <FiArrowRight />
            </button>
          </div>
        </div>

        {/* Step 2: Interests */}
        <div className={`form-step step-interests ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-header">
            <div className="step-number">{currentStep > 2 ? <FiCheckCircle /> : '2'}</div>
            <div className="step-title-content">
              <h2>
                <FiStar className="step-icon" />
                Personal Interests
              </h2>
              <p>Select the child's interests (you can select multiple)</p>
            </div>
          </div>
          <div className="step-content">
            <div className="interests-grid">
              {interestOptions.map(opt => {
                const active = formInputs.interests.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`interest-card ${active ? 'active' : ''}`}
                    onClick={() => {
                      const set = new Set(formInputs.interests);
                      if (set.has(opt)) set.delete(opt); else set.add(opt);
                      setFormInputs({ ...formInputs, interests: Array.from(set) });
                    }}
                  >
                    <span className="interest-icon">{interestIcons[opt] || '\u2B50'}</span>
                    <span className="interest-label">{opt}</span>
                    {active && <FiCheckCircle className="check-icon" />}
                  </button>
                );
              })}
            </div>
            <div className="step-navigation">
              <button className="btn-step-back" onClick={() => setCurrentStep(1)}>
                <FiArrowRight className="rotate" /> Back
              </button>
              <button className="btn-step-next" onClick={() => setCurrentStep(3)}>
                Continue <FiArrowRight />
              </button>
            </div>
          </div>
        </div>

        {/* Step 3: Financial & Social Status */}
        <div className={`form-step step-context ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="step-header">
            <div className="step-number">{currentStep > 3 ? <FiCheckCircle /> : '3'}</div>
            <div className="step-title-content">
              <h2>
                <FiUsers className="step-icon" />
                Financial & Social Status
              </h2>
              <p>Help us recommend activities that fit the child's environment</p>
            </div>
          </div>
          <div className="step-content">
            <div className="form-fields-grid">
              <div className="form-field-card">
                <label className="field-label">
                  <FiDollarSign className="field-icon" />
                  Financial Status
                </label>
                <select
                  className="form-select"
                  value={formInputs.financialStatus}
                  onChange={(e) => setFormInputs({ ...formInputs, financialStatus: e.target.value })}
                >
                  <option value="">Select financial status...</option>
                  {financialOptions.map(o => (
                    <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                  ))}
                </select>
                <p className="field-hint">This helps us recommend cost-appropriate activities</p>
              </div>
              <div className="form-field-card">
                <label className="field-label">
                  <FiUsers className="field-icon" />
                  Social Status
                </label>
                <select
                  className="form-select"
                  value={formInputs.socialStatus}
                  onChange={(e) => setFormInputs({ ...formInputs, socialStatus: e.target.value })}
                >
                  <option value="">Select social status...</option>
                  {socialOptions.map(o => (
                    <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1).replace('-', ' ')}</option>
                  ))}
                </select>
                <p className="field-hint">Preferred social setting for activities</p>
              </div>
            </div>
            <div className="step-navigation">
              <button className="btn-step-back" onClick={() => setCurrentStep(2)}>
                <FiArrowRight className="rotate" /> Back
              </button>
              <button className="btn-step-next" onClick={() => setCurrentStep(4)}>
                Continue <FiArrowRight />
              </button>
            </div>
          </div>
        </div>

        {/* Step 4: Autism Profile & Submit */}
        <div className={`form-step step-profile ${currentStep >= 4 ? 'active' : ''}`}>
          <div className="step-header">
            <div className="step-number">4</div>
            <div className="step-title-content">
              <h2>
                <FiTarget className="step-icon" />
                Autism Profile
              </h2>
              <p>Provide autism-specific information for better recommendations</p>
            </div>
          </div>
          <div className="step-content">
            <div className="form-fields-grid">
              <div className="form-field-card">
                <label className="field-label">
                  <FiInfo className="field-icon" />
                  Autism Type
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., ASD Level 1, ASD Level 2, ASD Level 3"
                  value={formInputs.autismType}
                  onChange={(e) => setFormInputs({ ...formInputs, autismType: e.target.value })}
                />
                <p className="field-hint">Enter the autism spectrum diagnosis type</p>
              </div>
              <div className="form-field-card">
                <label className="field-label">
                  <FiTrendingUp className="field-icon" />
                  Autism Severity
                </label>
                <div className="severity-selector">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`severity-btn ${formInputs.autismSeverity === level ? 'active' : ''}`}
                      onClick={() => setFormInputs({ ...formInputs, autismSeverity: level })}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="field-hint">Select severity level (1 = mild, 5 = severe)</p>
              </div>
            </div>
            <div className="step-navigation">
              <button className="btn-step-back" onClick={() => setCurrentStep(3)}>
                <FiArrowRight className="rotate" /> Back
              </button>
              <button 
                className="btn-submit-large"
                onClick={handleSubmit}
                disabled={isSubmitting || !predictedEmotion}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner-small"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FiZap /> Generate Recommendations
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {formRecommendations && formRecommendations.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h2>
                <FiAward className="results-icon" />
                Recommended Activities
              </h2><br />
              <p>Based on the form details, here are the top {formRecommendations.length} personalized recommendations</p>
            </div>
            <div className="activity-grid">
              {formRecommendations.map((activity, idx) => (
                <div 
                  key={activity.id} 
                  className="activity-card-animated"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                  onClick={() => setSelectedActivity(activity)}
                >
                  <ActivityCard
                    activity={activity}
                    getCategoryColor={getCategoryColor}
                    onSelect={() => setSelectedActivity(activity)}
                  />
                </div>
              ))}
            </div>
            <button 
              className="btn-view-all"
              onClick={() => setCurrentView('recommendations')}
            >
              <FiArrowRight /> View All Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

