import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profilesApi, recommendationsApi, outcomesApi } from '../api/client';
import type { ChildProfile, RecommendationResponse, PlanRequest, ActivityOutcome, ChildProfileCreate, ScheduledActivity } from '../types';
import RecommendationForm from '../components/RecommendationForm';
import ProfileModal from '../components/ProfileModal';
import OutcomeModal from '../components/OutcomeModal';
import LoadingAnimation from '../components/LoadingAnimation';
import { cleanActivityName } from '../utils/activityNameCleaner';

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [recentOutcomes, setRecentOutcomes] = useState<ActivityOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [outcomeModal, setOutcomeModal] = useState<{ activity: ScheduledActivity } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      loadProfile();
      loadRecentOutcomes();
    }
  }, [id]);

  const loadProfile = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await profilesApi.getById(id);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentOutcomes = async () => {
    if (!id) return;
    try {
      const data = await outcomesApi.getAll(id);
      setRecentOutcomes(data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load outcomes:', err);
    }
  };

  const handleGetRecommendations = async (planRequest: PlanRequest) => {
    if (!id) return;
    try {
      setLoadingRecommendations(true);
      setError(null);
      const response = await recommendationsApi.getRecommendations({
        profile_id: id,
        plan_request: planRequest,
      });
      setRecommendations(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate activity plan');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleLogOutcome = (activity: ScheduledActivity) => {
    setOutcomeModal({ activity });
  };

  const handleOutcomeSubmitted = () => {
    loadRecentOutcomes();
    setOutcomeModal(null);
    // Optionally refresh recommendations to incorporate learning
  };

  const handleUpdateProfile = async (profileUpdate: Partial<ChildProfileCreate>) => {
    if (!id) return;
    try {
      await profilesApi.update(id, profileUpdate);
      await loadProfile(); // Reload the profile to show updated data
      setShowEditModal(false);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteProfile = async () => {
    if (!id) return;
    try {
      await profilesApi.delete(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-pastel-green-200 border-t-pastel-green-500 rounded-full animate-spin"></div>
          <div className="text-soft-green-600 font-medium">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-soft-green-600 mb-4">Profile not found</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-pastel-green-600 hover:text-pastel-green-700 font-medium transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-6 text-pastel-green-600 hover:text-pastel-green-700 font-medium transition-colors flex items-center gap-2"
      >
        <span>←</span>
        <span>Back to Dashboard</span>
      </button>

      <div className="card p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-1">{profile.name}</h1>
            <p className="text-blue-600">Child Profile Details</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="btn-secondary"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Delete Profile
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Age:</span>
              <span className="font-medium">{profile.age} years</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Communication Level:</span>
              <span className="badge badge-primary">
                {profile.communication_level}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Autism Level:</span>
              <span className="badge badge-secondary">
                {profile.autism_level}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-500 text-sm mb-2">Sensory Sensitivity:</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Sound:</span>
                  <span className="badge badge-primary">
                    {profile.sensory_sensitivity.sound}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Light:</span>
                  <span className="badge badge-primary">
                    {profile.sensory_sensitivity.light}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Touch:</span>
                  <span className="badge badge-primary">
                    {profile.sensory_sensitivity.touch}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-2">Goals:</p>
              <p className="text-sm text-gray-700">{profile.goals.length > 0 ? profile.goals.join(', ') : 'None'}</p>
            </div>
          </div>
        </div>
      </div>


      <RecommendationForm
        onSubmit={handleGetRecommendations}
        isSubmitting={loadingRecommendations}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {loadingRecommendations && (
        <div className="card p-6 mb-6">
          <LoadingAnimation message="Generating your personalized activity plan..." />
        </div>
      )}

      {recommendations && !loadingRecommendations && (
        <div>
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">{recommendations.plan.plan_name}</h2>
              <span className="px-3 py-1 bg-pastel-green-50 text-pastel-green-700 rounded-md text-xs font-medium border border-pastel-green-200">
                {recommendations.plan.plan_type} Plan
              </span>
            </div>
            <p className="text-gray-600 mb-6">{recommendations.plan.plan_overview}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Total Duration</p>
                <p className="text-2xl font-semibold text-gray-900">{recommendations.plan.total_duration_minutes} min</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Total Activities</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {recommendations.plan.schedule.reduce((sum, phase) => sum + phase.activities.length, 0)}
                </p>
              </div>
              <div className="bg-pastel-green-50 p-4 rounded-lg border border-pastel-green-200">
                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Plan Type</p>
                <p className="text-2xl font-semibold text-gray-900">{recommendations.plan.plan_type}</p>
              </div>
            </div>

            {recommendations.plan.planning_rationale && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-pastel-green-500 border border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Planning Rationale</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{recommendations.plan.planning_rationale}</p>
              </div>
            )}

            {recommendations.plan.materials_summary && recommendations.plan.materials_summary.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Materials Needed</h3>
                <div className="flex flex-wrap gap-2">
                  {recommendations.plan.materials_summary.map((material, idx) => (
                    <span key={idx} className="bg-white text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-200">
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <h3 className="text-2xl font-semibold text-gray-900 mb-6 mt-6">Activity Plan by Phase</h3>
          {recommendations.plan.schedule.map((phase, phaseIdx) => (
            <div key={phaseIdx} className="card p-5 mb-5" style={{ animationDelay: `${phaseIdx * 0.1}s` }}>
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-xl font-semibold text-gray-900">{phase.phase}</h4>
                <span className={`px-3 py-1 rounded-md text-xs font-medium border ${
                  phase.phase === 'Warm-up' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  phase.phase === 'Core' ? 'bg-pastel-green-50 text-pastel-green-700 border-pastel-green-200' :
                  'bg-gray-50 text-gray-700 border-gray-200'
                }`}>
                  Phase {phase.order}
                </span>
              </div>
              <div className="space-y-5">
                {phase.activities.map((activity, actIdx) => (
                  <div key={actIdx} className="border-l-2 border-pastel-green-500 pl-4 py-4 bg-gray-50 rounded-r-lg mb-4 border border-gray-200 hover:border-gray-300 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 text-base mb-2">{cleanActivityName(activity.activity_name)}</h5>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="badge badge-primary">
                            {activity.domain}
                          </span>
                          <span className="badge badge-secondary">
                            {activity.recommended_duration_minutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed italic pl-2">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      <span className="font-medium text-gray-700">Why here:</span> {activity.why_this_activity_here}
                    </p>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-pastel-green-600 hover:text-pastel-green-700 transition-colors">
                        View Details
                      </summary>
                      <div className="mt-3 space-y-3 text-sm bg-white p-4 rounded-lg border border-gray-200">
                        <div>
                          <strong className="text-gray-900">Difficulty Adaptation:</strong>
                          <p className="text-gray-600 mt-1">{activity.difficulty_adaptation}</p>
                        </div>
                        <div>
                          <strong className="text-gray-900">Step-by-Step:</strong>
                          <ol className="list-decimal list-inside text-gray-600 space-y-1 mt-1 ml-2">
                            {activity.step_by_step.map((step, stepIdx) => (
                              <li key={stepIdx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                        <div>
                          <strong className="text-gray-900">Sensory Considerations:</strong>
                          <p className="text-gray-600 mt-1">{activity.sensory_considerations}</p>
                        </div>
                        <div>
                          <strong className="text-gray-900">Expected Outcome:</strong>
                          <p className="text-gray-600 mt-1">{activity.expected_outcome}</p>
                        </div>
                      </div>
                    </details>
                    <button
                      onClick={() => handleLogOutcome(activity)}
                      className="mt-3 btn-primary text-sm py-2 px-4"
                    >
                      Log Activity Outcome
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditModal && (
        <ProfileModal
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateProfile}
          initialProfile={profile}
        />
      )}

      {outcomeModal && (
        <OutcomeModal
          profileId={profile._id}
          activityId={outcomeModal.activity.activity_id}
          activityName={cleanActivityName(outcomeModal.activity.activity_name)}
          onClose={() => setOutcomeModal(null)}
          onSubmitted={handleOutcomeSubmitted}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="card p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-soft-green-800 mb-4">Delete Profile</h2>
            <p className="text-soft-green-700 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-soft-green-800">{profile.name}</strong>'s profile? 
              This action cannot be undone and will also delete all associated activity outcomes.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium border border-red-600 hover:border-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

