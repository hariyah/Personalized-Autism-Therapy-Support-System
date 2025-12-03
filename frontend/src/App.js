import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

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
      console.error('Error updating emotion:', error);
      alert('Error updating emotion: ' + (error.response?.data?.error || error.message));
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

  const stats = {
    totalActivities: activities.length,
    socialActivities: activities.filter(a => a.category === 'social').length,
    behavioralActivities: activities.filter(a => a.category === 'behavioral').length,
    emotionalActivities: activities.filter(a => a.category === 'emotional').length,
    totalChildren: children.length,
    activeRecommendations: recommendations.length
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
            <span className="logo-icon">🌟</span>
            <h2>Therapy Support</h2>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${currentView === 'activities' ? 'active' : ''}`}
            onClick={() => setCurrentView('activities')}
          >
            <span className="nav-icon">📚</span>
            <span>Activity Library</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
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
          />
        ) : (
          <ActivitiesView
            activities={filteredActivities}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            getCategoryColor={getCategoryColor}
            setSelectedActivity={setSelectedActivity}
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
  setPredictedEmotion
}) {
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
          <h1>Welcome Back! 👋</h1>
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
          icon="👶"
          title="Total Children"
          value={stats.totalChildren}
          color="#4A90E2"
          subtitle="Active profiles"
        />
        <StatCard
          icon="⭐"
          title="Recommendations"
          value={stats.activeRecommendations}
          color="#F5A623"
          subtitle="For selected child"
        />
        <StatCard
          icon="📚"
          title="Total Activities"
          value={stats.totalActivities}
          color="#7ED321"
          subtitle="Available in library"
        />
        <StatCard
          icon="📊"
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
            icon="👥"
          />
          <CategoryStatCard
            category="behavioral"
            count={stats.behavioralActivities}
            color={getCategoryColor('behavioral')}
            icon="🎯"
          />
          <CategoryStatCard
            category="emotional"
            count={stats.emotionalActivities}
            color={getCategoryColor('emotional')}
            icon="💙"
          />
        </div>
      </div>

      {/* Emotion Display Section */}
      {selectedChild && (
        <section className="dashboard-section emotion-section">
          <div className="section-header">
            <h2 className="section-title">😊 Current Emotion Status</h2>
            <p className="section-description">
              Real-time emotion: <strong>{selectedChild.currentEmotion || 'neutral'}</strong>
            </p>
          </div>
          <div className="emotion-display">
            <div className={`emotion-badge emotion-${selectedChild.currentEmotion || 'neutral'}`}>
              {selectedChild.currentEmotion || 'neutral'}
            </div>
            <div className="emotion-info">
              {selectedChild.socialStatus && (
                <p><strong>Social Status:</strong> {selectedChild.socialStatus}</p>
              )}
              {selectedChild.financialStatus && (
                <p><strong>Financial Status:</strong> {selectedChild.financialStatus}</p>
              )}
              {selectedChild.autismDetails && (
                <>
                  <p><strong>Autism Severity:</strong> {selectedChild.autismDetails.severity}/5</p>
                  <p><strong>Type:</strong> {selectedChild.autismDetails.type}</p>
                </>
              )}
            </div>
          </div>
          <div className="emotion-input-section">
            <p className="emotion-input-label">Update Emotion (for CNN integration):</p>
            <div className="emotion-input-group">
              <select 
                className="emotion-select"
                value={emotionInput}
                onChange={(e) => setEmotionInput(e.target.value)}
              >
                <option value="">Select emotion...</option>
                {validEmotions.map(emotion => (
                  <option key={emotion} value={emotion}>{emotion}</option>
                ))}
              </select>
              <button 
                className="btn-emotion-update"
                onClick={handleEmotionUpdate}
                disabled={!emotionInput}
              >
                Update Emotion
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Image Upload Section for Emotion Detection */}
      <section className="dashboard-section image-upload-section">
        <div className="section-header">
          <h2 className="section-title">📸 Emotion Recognition via Image</h2>
          <p className="section-description">
            Upload an image to automatically detect emotion using our DenseNet-121 AI model
          </p>
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
                <span className="upload-icon">📷</span>
                <p className="upload-text">Click to upload or drag image</p>
                <p className="upload-hint">PNG, JPG, GIF or BMP (Max 16MB)</p>
              </div>
            </label>
          </div>

          {/* Uploaded Image Preview */}
          {uploadedImage && (
            <div className="image-preview-container">
              <h3>Uploaded Image</h3>
              <img src={uploadedImage} alt="Uploaded" className="image-preview" />
            </div>
          )}

          {/* Loading State */}
          {predictionLoading && (
            <div className="prediction-loading">
              <div className="spinner"></div>
              <p>Analyzing emotion...</p>
            </div>
          )}

          {/* Error Message */}
          {predictionError && (
            <div className="prediction-error">
              <p>⚠️ {predictionError}</p>
              <p className="error-hint">Make sure the ML service is running on port 5000</p>
            </div>
          )}

          {/* Prediction Results */}
          {predictedEmotion && !predictionLoading && (
            <div className="prediction-results">
              <h3>🎯 Prediction Results</h3>
              <div className="main-prediction">
                <div className={`emotion-badge emotion-${predictedEmotion.emotion}`}>
                  {predictedEmotion.emotion}
                </div>
                <p className="confidence-score">
                  Confidence: <strong>{(predictedEmotion.confidence * 100).toFixed(2)}%</strong>
                </p>
              </div>

              {/* All Predictions */}
              {predictedEmotion.allPredictions && Object.keys(predictedEmotion.allPredictions).length > 0 && (
                <div className="all-predictions">
                  <h4>All Predictions:</h4>
                  <div className="prediction-bars">
                    {Object.entries(predictedEmotion.allPredictions).map(([emotion, confidence]) => (
                      <div key={emotion} className="prediction-bar-item">
                        <span className="emotion-name">{emotion}</span>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
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
                    updateEmotion(selectedChild.id, predictedEmotion.emotion, predictedEmotion.confidence);
                    setUploadedImage(null);
                    setPredictedEmotion(null);
                  }}
                >
                  Apply to {selectedChild.name}'s Profile
                </button>
              )}
            </div>
          )}
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
            <h2 className="section-title">✨ Personalized Recommendations for {selectedChild.name}</h2>
            <p className="section-description">
              Top activities tailored to {selectedChild.name}'s specific needs, emotion, and preferences
            </p>
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
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => setCurrentView('activities')}>
            <span className="action-icon">🔍</span>
            <span className="action-text">Browse All Activities</span>
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">📝</span>
            <span className="action-text">View Progress Reports</span>
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">➕</span>
            <span className="action-text">Add New Child Profile</span>
          </button>
          <button className="quick-action-btn">
            <span className="action-icon">📊</span>
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

export default App;
