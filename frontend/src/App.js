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
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'activities'

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

  // Calculate statistics
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
      {/* Sidebar Navigation */}
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

      {/* Main Content */}
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

      {/* Activity Detail Modal */}
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

// Dashboard View Component
function DashboardView({ 
  children, 
  selectedChild, 
  setSelectedChild, 
  recommendations, 
  stats,
  getCategoryColor,
  getNeedLevelColor,
  setSelectedActivity,
  setCurrentView
}) {
  return (
    <div className="dashboard">
      {/* Header */}
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

      {/* Statistics Cards */}
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

      {/* Category Breakdown */}
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

      {/* Child Profile Selector */}
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

      {/* Recommendations Section */}
      {selectedChild && recommendations.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">✨ Personalized Recommendations for {selectedChild.name}</h2>
            <p className="section-description">
              Top activities tailored to {selectedChild.name}'s specific needs and preferences
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

      {/* Quick Actions */}
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

// Activities View Component
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

// Stat Card Component
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

// Category Stat Card Component
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

// Activity Card Component
function ActivityCard({ activity, getCategoryColor, onSelect }) {
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
      <div className="activity-footer">
        <span className="activity-duration">⏱️ {activity.duration}</span>
        <span className={`difficulty-badge difficulty-${activity.difficulty}`}>
          {activity.difficulty}
        </span>
      </div>
    </div>
  );
}

// Activity Modal Component
function ActivityModal({ activity, getCategoryColor, onClose }) {
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
          </div>

          <div className="activity-section">
            <h3>📦 Materials Needed</h3>
            <ul className="materials-list">
              {activity.materials.map((material, idx) => (
                <li key={idx}>{material}</li>
              ))}
            </ul>
          </div>

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
