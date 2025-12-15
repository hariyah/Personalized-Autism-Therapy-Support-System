import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { 
  FiHome, FiBook, FiTarget, FiSettings, FiUser, FiUpload, 
  FiSmile, FiHeart, FiDollarSign, FiUsers, FiInfo, 
  FiCheckCircle, FiX, FiArrowRight, FiStar, FiTrendingUp,
  FiActivity, FiAward, FiZap, FiSearch, FiFileText, FiBarChart2,
  FiUserPlus, FiLayers, FiTrendingDown, FiPieChart, FiCpu, FiMapPin
} from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
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

  useEffect(() => {
    fetchChildren();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchRecommendations(selectedChild.id);
    }
  }, [selectedChild]);

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
      setRecommendations(response.data);
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

  const stats = {
    totalActivities: activities.length,
    socialActivities: activities.filter(a => a.category === 'social').length,
    behavioralActivities: activities.filter(a => a.category === 'behavioral').length,
    emotionalActivities: activities.filter(a => a.category === 'emotional').length,
    totalChildren: children.length,
    activeRecommendations: recommendations.length
  };

  const interestOptions = ['train','cartoon','music','dance','art','sports','puzzles','outdoors'];
  const financialOptions = ['free','low','medium','high'];
  const socialOptions = ['alone','with-parent','group','community'];

  const submitRecommendationRequest = async () => {
    const payload = {
      emotion: predictedEmotion?.emotion || selectedChild?.currentEmotion || null,
      interests: formInputs.interests,
      financialStatus: formInputs.financialStatus,
      socialStatus: formInputs.socialStatus,
      autismProfile: { type: formInputs.autismType, severity: Number(formInputs.autismSeverity) },
    };
    if (!payload.emotion) {
      alert('Please upload an image to detect emotion or select a child with an existing emotion.');
      return;
    }
    try {
      // Prefer backend if it supports POST recommendations
      if (selectedChild) {
        try {
          const resp = await axios.post(`${API_BASE_URL}/recommendations/${selectedChild.id}`, payload, { timeout: 20000 });
          if (Array.isArray(resp.data) || Array.isArray(resp.data?.recommendations)) {
            setFormRecommendations(Array.isArray(resp.data) ? resp.data : resp.data.recommendations);
            return;
          }
        } catch(e) {
          // Fallback to client-side scoring
          console.warn('POST recommendations not available, using client-side scoring. Reason:', e?.message || e);
        }
      }
      // Client-side scoring fallback using activities
      const emotionMap = { Natural:'social', joy:'emotional', fear:'emotional', anger:'behavioral', sadness:'emotional', surprise:'social' };
      const targetCategory = emotionMap[String(payload.emotion).trim()] || 'emotional';
      const scored = activities.map(a => {
        let score = 0;
        if (a.category === targetCategory) score += 3;
        if (payload.interests?.length && a.interestTags) {
          const overlap = a.interestTags.filter(t => payload.interests.includes(String(t).toLowerCase()));
          score += overlap.length;
        }
        if (payload.financialStatus && a.costLevel) {
          // prefer activities within or below budget
          const order = ['free','low','medium','high'];
          const want = order.indexOf(payload.financialStatus);
          const cost = order.indexOf(a.costLevel);
          if (cost <= want) score += 2; else score -= 1;
        }
        if (payload.socialStatus && a.socialRequirement) {
          // simple match bonus
          if (String(a.socialRequirement).toLowerCase().includes(String(payload.socialStatus).toLowerCase())) score += 1;
        }
        if (payload.autismProfile?.severity) {
          // easier activities for higher severity
          if (a.difficulty === 'easy' && payload.autismProfile.severity >= 3) score += 1;
          if (a.difficulty === 'hard' && payload.autismProfile.severity >= 4) score -= 1;
        }
        return { item: a, score };
      })
      .sort((x,y) => y.score - x.score)
      .slice(0, 8)
      .map(s => s.item);
      setFormRecommendations(scored);
    } catch (err) {
      alert('Failed to get recommendations: ' + (err?.response?.data?.error || err.message));
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

  return (
    <div className="App">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <FiActivity className="logo-icon" />
            <h2>Therapy Support</h2>
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
            recommendations={formRecommendations.length ? formRecommendations : recommendations}
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
          onAdd={(newChild) => {
            // In a real app, this would call an API
            alert(`Child profile "${newChild.name}" would be added. This feature requires backend integration.`);
            setShowAddChildModal(false);
          }}
        />
      )}

      {/* Progress Reports Modal */}
      {showProgressModal && (
        <ProgressReportsModal
          selectedChild={selectedChild}
          onClose={() => setShowProgressModal(false)}
        />
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <AnalyticsModal
          selectedChild={selectedChild}
          recommendations={recommendations}
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
  handleAddNewChild,
  handleViewProgressReports,
  handleViewAnalytics
}) {
  // 6 emotions as required: Natural (0), joy (1), fear (2), anger (3), sadness (4), surprise (5)
  // Use the exact order and names from class_indices.json
  const validEmotions = ["Natural", "anger", "fear", "joy", "sadness", "surprise"];

  const handleEmotionUpdate = () => {
    if (selectedChild && emotionInput && validEmotions.includes(emotionInput)) {
      updateEmotion(selectedChild.id, emotionInput);
      setEmotionInput('');
    } else {
      alert('Please enter a valid emotion: ' + validEmotions.join(', '));
    }
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

      {/* Emotion Display Section */}
      {selectedChild && (
        <section className="dashboard-section emotion-section">
          <div className="emotion-status-header">
            <div className="emotion-title-wrapper">
              <div className="emotion-header-icon">😊</div>
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
              <div className={`emotion-display-large emotion-${selectedChild.currentEmotion || 'calm'}`}>
                <div className="emotion-icon-large">
                  {selectedChild.currentEmotion === 'happy' ? '😊' : 
                   selectedChild.currentEmotion === 'sad' ? '😢' : 
                   selectedChild.currentEmotion === 'angry' ? '😠' : 
                   selectedChild.currentEmotion === 'fear' ? '😰' : 
                   selectedChild.currentEmotion === 'surprise' ? '😲' : '😌'}
                </div>
                <div className="emotion-text-large">
                  {(selectedChild.currentEmotion || 'calm').charAt(0).toUpperCase() + (selectedChild.currentEmotion || 'calm').slice(1)}
                </div>
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
                    <div className="detail-icon">👥</div>
                    <div className="detail-content">
                      <span className="detail-label">Social Status</span>
                      <span className="detail-value">{selectedChild.socialStatus}</span>
                    </div>
                  </div>
                )}
                {selectedChild.financialStatus && (
                  <div className="detail-item">
                    <div className="detail-icon">💰</div>
                    <div className="detail-content">
                      <span className="detail-label">Financial Status</span>
                      <span className="detail-value">{selectedChild.financialStatus}</span>
                    </div>
                  </div>
                )}
                {selectedChild.autismDetails && (
                  <>
                    <div className="detail-item">
                      <div className="detail-icon">📊</div>
                      <div className="detail-content">
                        <span className="detail-label">Autism Severity</span>
                        <span className="detail-value">{selectedChild.autismDetails.severity}/5</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-icon">🔖</div>
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

          {/* Update Emotion Section */}
          <div className="emotion-update-card">
            <div className="emotion-update-header">
              <div className="update-icon">🔄</div>
              <span className="update-title">Update Emotion (for CNN integration)</span>
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
                <span>Update Emotion</span>
              </button>
            </div>
          </div>
        </section>
      )}

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
                    <FiSmile className="emotion-badge-icon" />
                    <span>{predictedEmotion.emotion}</span>
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
      </section>

      {/* Quick Link to Recommendation Form */}
      <section className="dashboard-section">
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

      <section className="dashboard-section">
        <h2 className="section-title">Select Child Profile</h2>
        <div className="child-cards">
          {children.map(child => (
            <div
              key={child.id}
              className={`child-card ${selectedChild?.id === child.id ? 'active' : ''}`}
              onClick={() => setSelectedChild(child)}
            >
              <div className="child-avatar">{child.name.charAt(0)}</div>
              <h3>{child.name}</h3>
              <p className="child-age">Age: {child.age} years</p>
              
              {/* Show current emotion */}
              {child.currentEmotion && (
                <div className="child-emotion">
                  <span className={`emotion-indicator emotion-${child.currentEmotion}`}>
                    {child.currentEmotion}
                  </span>
                </div>
              )}
              
              {/* Show additional info */}
              {(child.financialStatus || child.socialStatus || child.autismDetails) && (
                <div className="child-additional-info">
                  {child.financialStatus && child.socialStatus && (
                    <p><small>💰 {child.financialStatus} | 👥 {child.socialStatus}</small></p>
                  )}
                  {child.autismDetails && (
                    <p><small>ASD: {child.autismDetails.severity}/5 ({child.autismDetails.type})</small></p>
                  )}
                </div>
              )}
              
              <div className="needs-indicators">
                <div className="need-item">
                  <span className="need-label">Social:</span>
                  <span 
                    className="need-badge" 
                    style={{ backgroundColor: getNeedLevelColor(child.needs.social) }}
                  >
                    {child.needs.social}
                  </span>
                </div>
                <div className="need-item">
                  <span className="need-label">Behavioral:</span>
                  <span 
                    className="need-badge" 
                    style={{ backgroundColor: getNeedLevelColor(child.needs.behavioral) }}
                  >
                    {child.needs.behavioral}
                  </span>
                </div>
                <div className="need-item">
                  <span className="need-label">Emotional:</span>
                  <span 
                    className="need-badge" 
                    style={{ backgroundColor: getNeedLevelColor(child.needs.emotional) }}
                  >
                    {child.needs.emotional}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedChild && recommendations.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <div className="header-content-wrapper">
              <h2 className="section-title">✨ Personalized Recommendations for {selectedChild.name}</h2>
              <p className="section-description">
                Top activities tailored to {selectedChild.name}'s specific needs, emotion, and preferences
              </p>
            </div>
          </div>
          <div className="activity-grid">
            {recommendations.slice(0, 6).map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                getCategoryColor={getCategoryColor}
                onSelect={() => setSelectedActivity(activity)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-section">
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
        <h1>📚 Activity Library</h1>
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
        <h1>🧠 Personalized Recommendations</h1>
        <p>
          {selectedChild ? `For ${selectedChild.name}` : 'Select a child'}
          {predictedEmotion?.emotion ? ` • Emotion: ${predictedEmotion.emotion}` : ''}
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
                {totals[cat]} of {allTotals[cat]} • {percent(totals[cat], allTotals[cat])}%
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
    financialStatus: 'medium',
    socialStatus: 'alone'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.age) {
      onAdd({
        ...formData,
        age: parseInt(formData.age),
        id: Date.now(),
        needs: { social: 'medium', behavioral: 'medium', emotional: 'medium' },
        preferences: formData.interests,
        strengths: [],
        challenges: [],
        currentEmotion: 'Natural',
        emotionHistory: []
      });
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
                  <option value="free">Free Activities</option>
                  <option value="low">Low Budget</option>
                  <option value="medium">Medium Budget</option>
                  <option value="high">Premium Budget</option>
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
                  <option value="group">Small Group</option>
                  <option value="community">Community Setting</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              <FiX /> Cancel
            </button>
            <button type="submit" className="btn-submit">
              <FiCheckCircle /> Create Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Progress Reports Modal Component
function ProgressReportsModal({ selectedChild, onClose }) {
  if (!selectedChild) return null;

  const progressData = {
    social: 75,
    behavioral: 68,
    emotional: 82
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FiX />
        </button>
        <div className="modal-header">
          <FiFileText className="modal-header-icon" />
          <h2>Progress Reports - {selectedChild.name}</h2>
        </div>
        <div className="progress-reports-content">
          <div className="progress-summary">
            <div className="progress-card">
              <div className="progress-header">
                <FiUsers className="progress-icon" />
                <h3>Social Development</h3>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progressData.social}%` }}></div>
              </div>
              <p className="progress-percentage">{progressData.social}%</p>
            </div>
            <div className="progress-card">
              <div className="progress-header">
                <FiTarget className="progress-icon" />
                <h3>Behavioral Progress</h3>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progressData.behavioral}%` }}></div>
              </div>
              <p className="progress-percentage">{progressData.behavioral}%</p>
            </div>
            <div className="progress-card">
              <div className="progress-header">
                <FiHeart className="progress-icon" />
                <h3>Emotional Growth</h3>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progressData.emotional}%` }}></div>
              </div>
              <p className="progress-percentage">{progressData.emotional}%</p>
            </div>
          </div>
          <div className="progress-details">
            <h3>
              <FiTrendingUp /> Recent Activity History
            </h3>
            <div className="activity-timeline">
              {selectedChild.emotionHistory?.slice(-5).reverse().map((entry, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <p className="timeline-emotion">{entry.emotion || entry.originalLabel}</p>
                    <p className="timeline-date">{new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics Modal Component
function AnalyticsModal({ selectedChild, recommendations, onClose }) {
  if (!selectedChild) return null;

  const categoryBreakdown = {
    social: recommendations.filter(a => a.category === 'social').length,
    behavioral: recommendations.filter(a => a.category === 'behavioral').length,
    emotional: recommendations.filter(a => a.category === 'emotional').length
  };

  const total = categoryBreakdown.social + categoryBreakdown.behavioral + categoryBreakdown.emotional;
  const emotionHistory = selectedChild.emotionHistory || [];
  const primaryEmotion = emotionHistory.length > 0 ? emotionHistory[emotionHistory.length - 1] : selectedChild.currentEmotion || 'Natural';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content analytics-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FiX />
        </button>
        
        <div className="analytics-header">
          <div className="analytics-header-top">
            <div className="profile-section">
              <div className="profile-avatar">
                <FiUser className="avatar-icon" />
              </div>
              <div className="profile-info">
                <h2>{selectedChild.name}'s Analytics</h2>
                <p className="profile-subtitle">Comprehensive therapy insights & progress tracking</p>
              </div>
            </div>
            <div className="total-card">
              <div className="total-number">{recommendations.length}</div>
              <div className="total-label">Recommendations</div>
            </div>
          </div>
        </div>

        <div className="analytics-content">
          {/* Current Emotion Status */}
          <div className="emotion-status-section">
            <h3 className="section-header">
              <FiSmile className="header-icon" /> Emotional Wellness
            </h3>
            <div className="emotion-status-container">
              {/* Primary Emotion Card */}
              <div className="emotion-primary-card">
                <div className="emotion-card-inner">
                  <div className={`emotion-circle emotion-${primaryEmotion?.toLowerCase() || 'natural'}`}>
                    <FiSmile className="emotion-large-icon" />
                  </div>
                  <div className="emotion-info">
                    <div className="emotion-label">Current Emotion</div>
                    <div className={`emotion-value emotion-${primaryEmotion?.toLowerCase() || 'natural'}`}>
                      {primaryEmotion || 'Natural'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement & Streak */}
              <div className="emotion-stats-grid">
                <div className="stat-card engagement-stat">
                  <div className="stat-header">
                    <FiZap className="stat-icon" />
                    <span>Engagement</span>
                  </div>
                  <div className="stat-meter">
                    <div className="meter-fill" style={{ width: `${Math.min(100, (recommendations.length / 15) * 100)}%` }}></div>
                  </div>
                  <div className="stat-text">{Math.round(Math.min(100, (recommendations.length / 15) * 100))}% Active</div>
                </div>
                <div className="stat-card streak-stat">
                  <div className="stat-header">
                    <FiAward className="stat-icon" />
                    <span>Streak</span>
                  </div>
                  <div className="streak-large">{emotionHistory.length}</div>
                  <div className="stat-text">Session Entries</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Distribution */}
          <div className="distribution-section">
            <h3 className="section-header">
              <FiTarget className="header-icon" /> Activity Distribution
            </h3>
            <div className="distribution-grid">
              <div className="distribution-card social">
                <div className="dist-header">
                  <FiUsers className="dist-icon" />
                  <div className="dist-title">Social</div>
                </div>
                <div className="dist-number">{categoryBreakdown.social}</div>
                <div className="dist-bar">
                  <div className="dist-fill social" style={{ width: `${total > 0 ? (categoryBreakdown.social / total) * 100 : 0}%` }}></div>
                </div>
                <div className="dist-percentage">{total > 0 ? Math.round((categoryBreakdown.social / total) * 100) : 0}%</div>
              </div>

              <div className="distribution-card behavioral">
                <div className="dist-header">
                  <FiTarget className="dist-icon" />
                  <div className="dist-title">Behavioral</div>
                </div>
                <div className="dist-number">{categoryBreakdown.behavioral}</div>
                <div className="dist-bar">
                  <div className="dist-fill behavioral" style={{ width: `${total > 0 ? (categoryBreakdown.behavioral / total) * 100 : 0}%` }}></div>
                </div>
                <div className="dist-percentage">{total > 0 ? Math.round((categoryBreakdown.behavioral / total) * 100) : 0}%</div>
              </div>

              <div className="distribution-card emotional">
                <div className="dist-header">
                  <FiHeart className="dist-icon" />
                  <div className="dist-title">Emotional</div>
                </div>
                <div className="dist-number">{categoryBreakdown.emotional}</div>
                <div className="dist-bar">
                  <div className="dist-fill emotional" style={{ width: `${total > 0 ? (categoryBreakdown.emotional / total) * 100 : 0}%` }}></div>
                </div>
                <div className="dist-percentage">{total > 0 ? Math.round((categoryBreakdown.emotional / total) * 100) : 0}%</div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="metrics-section">
            <h3 className="section-header">
              <FiTrendingUp className="header-icon" /> Key Metrics
            </h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <FiTrendingUp className="metric-icon trending" />
                <div className="metric-content">
                  <span className="metric-label">Progress</span>
                  <span className="metric-value">On Track</span>
                </div>
              </div>
              <div className="metric-card">
                <FiTarget className="metric-icon engagement" />
                <div className="metric-content">
                  <span className="metric-label">Engagement</span>
                  <span className="metric-value">High</span>
                </div>
              </div>
              <div className="metric-card">
                <FiStar className="metric-icon focus" />
                <div className="metric-content">
                  <span className="metric-label">Focus Area</span>
                  <span className="metric-value">
                    {categoryBreakdown.social >= categoryBreakdown.behavioral && categoryBreakdown.social >= categoryBreakdown.emotional
                      ? 'Social'
                      : categoryBreakdown.behavioral >= categoryBreakdown.emotional
                      ? 'Behavioral'
                      : 'Emotional'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Activity Card Component
function ActivityCard({ activity, getCategoryColor, onSelect }) {
  const getCostColor = (cost) => {
    const colors = { free: '#27AE60', low: '#F39C12', medium: '#E67E22', high: '#E74C3C' };
    return colors[cost] || '#95A5A6';
  };

  return (
    <div className="activity-card" onClick={onSelect}>
      <div className="activity-card-header">
        <span className="activity-icon">{activity.icon}</span>
        <span 
          className="category-badge"
          style={{ backgroundColor: getCategoryColor(activity.category) }}
        >
          {activity.category}
        </span>
      </div>
      <h3 className="activity-title">{activity.title}</h3>
      <p className="activity-description-short">{activity.description}</p>
      
      {/* Show cost and social info */}
      {activity.costLevel && (
        <div className="activity-meta">
          <span className="cost-badge" style={{ backgroundColor: getCostColor(activity.costLevel) }}>
            💰 {activity.costLevel}
          </span>
          {activity.socialRequirement && activity.socialRequirement !== 'none' && (
            <span className="social-badge">
              👥 {activity.socialRequirement}
            </span>
          )}
        </div>
      )}
      
      <div className="activity-footer">
        <span className="activity-duration">⏱️ {activity.duration}</span>
        <span className={`difficulty-badge difficulty-${activity.difficulty}`}>
          {activity.difficulty}
        </span>
      </div>
    </div>
  );
}

// Enhanced Activity Modal Component
function ActivityModal({ activity, getCategoryColor, onClose }) {
  const getCostColor = (cost) => {
    const colors = { free: '#27AE60', low: '#F39C12', medium: '#E67E22', high: '#E74C3C' };
    return colors[cost] || '#95A5A6';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-header">
          <span className="activity-icon-large">{activity.icon}</span>
          <h2>{activity.title}</h2>
          <span 
            className="category-badge-large"
            style={{ backgroundColor: getCategoryColor(activity.category) }}
          >
            {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
          </span>
        </div>
        <div className="modal-body">
          <p className="activity-description">{activity.description}</p>
          
          <div className="activity-details-grid">
            <div className="detail-item">
              <strong>⏱️ Duration:</strong>
              <span>{activity.duration}</span>
            </div>
            <div className="detail-item">
              <strong>📊 Difficulty:</strong>
              <span className={`difficulty-badge difficulty-${activity.difficulty}`}>
                {activity.difficulty}
              </span>
            </div>
            <div className="detail-item">
              <strong>👶 Age Range:</strong>
              <span>{activity.ageRange}</span>
            </div>
            {/* Cost and Social Requirements */}
            {activity.costLevel && (
              <div className="detail-item">
                <strong>💰 Cost Level:</strong>
                <span className="cost-badge" style={{ backgroundColor: getCostColor(activity.costLevel) }}>
                  {activity.costLevel}
                </span>
              </div>
            )}
            {activity.socialRequirement && (
              <div className="detail-item">
                <strong>👥 Social Requirement:</strong>
                <span>{activity.socialRequirement}</span>
              </div>
            )}
          </div>

          <div className="activity-section">
            <h3>📦 Materials Needed</h3>
            <ul className="materials-list">
              {activity.materials.map((material, idx) => (
                <li key={idx}>{material}</li>
              ))}
            </ul>
          </div>

          {/* Interest Tags */}
          {activity.interestTags && activity.interestTags.length > 0 && (
            <div className="activity-section">
              <h3>🏷️ Interest Tags</h3>
              <div className="tags-grid">
                {activity.interestTags.map((tag, idx) => (
                  <span key={idx} className="interest-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="activity-section">
            <h3>💡 Benefits</h3>
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
    train: '🚂', cartoon: '🎬', music: '🎵', dance: '💃', art: '🎨',
    sports: '⚽', puzzles: '🧩', outdoors: '🌳', reading: '📖', visual: '👁️',
    structured: '📋', quiet: '🤫', 'play-based': '🎮', movement: '🏃',
    'hands-on': '✋', sensory: '👂', artistic: '🖌️', creative: '✨', writing: '✍️'
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
        <div className={`form-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
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
                    <FiHeart />
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
        <div className={`form-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
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
                    <span className="interest-icon">{interestIcons[opt] || '⭐'}</span>
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
        <div className={`form-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
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
        <div className={`form-step ${currentStep >= 4 ? 'active' : ''}`}>
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
              </h2>
              <p>Based on your inputs, here are the top {formRecommendations.length} personalized recommendations</p>
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

export default App;
