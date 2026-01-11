import { useState, useEffect } from 'react';
import { profilesApi } from '../api/client';
import type { ChildProfile, ChildProfileCreate } from '../types';
import ProfileCard from '../components/ProfileCard';
import ProfileModal from '../components/ProfileModal';
import { FaChildReaching } from 'react-icons/fa6';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function Dashboard() {
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await profilesApi.getAll();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (profile: ChildProfileCreate | Partial<ChildProfileCreate>) => {
    try {
      await profilesApi.create(profile as ChildProfileCreate);
      await loadProfiles();
      setShowCreateModal(false);
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-pastel-green-200 border-t-pastel-green-500 rounded-full animate-spin"></div>
          <div className="text-soft-green-600 font-medium">Loading profiles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 mb-1 tracking-tight">Child Profiles</h1>
          <p className="text-gray-600">Manage and create personalized activity plans</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          <span>Create New Profile</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-5 bg-red-50 border-l-4 border-red-400 text-red-800 rounded-lg slide-in">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-xl" />
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="text-center py-16 card max-w-xl mx-auto">
          <div className="flex justify-center mb-4">
            <FaChildReaching className="text-6xl text-pastel-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome</h2>
          <p className="text-gray-600 mb-6">
            Create your first profile to get started with personalized activity plans.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Your First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile, index) => (
            <div key={profile._id} style={{ animationDelay: `${index * 0.1}s` }} className="fade-in">
              <ProfileCard profile={profile} onDelete={loadProfiles} />
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <ProfileModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProfile}
        />
      )}
    </div>
  );
}

