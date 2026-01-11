import { Link } from 'react-router-dom';
import { useState } from 'react';
import { profilesApi } from '../api/client';
import type { ChildProfile } from '../types';
import { FaChildReaching } from 'react-icons/fa6';

interface ProfileCardProps {
  profile: ChildProfile;
  onDelete?: () => void;
}

export default function ProfileCard({ profile, onDelete }: ProfileCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showDeleteConfirm) {
      try {
        setIsDeleting(true);
        await profilesApi.delete(profile._id);
        if (onDelete) {
          onDelete();
        }
      } catch (err) {
        console.error('Failed to delete profile:', err);
        alert('Failed to delete profile. Please try again.');
      } finally {
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      }
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="card card-hover p-5 relative group">
      <Link
        to={`/profile/${profile._id}`}
        className="block"
      >
        <div className="flex items-start gap-2 mb-4">
          <FaChildReaching className="text-xl text-pastel-green-600 mt-0.5 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pastel-green-600 transition-colors">
            {profile.name}
          </h3>
        </div>
        <div className="text-sm text-gray-600 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Age:</span>
            <span className="badge badge-primary">{profile.age} years</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-500">Communication:</span>
            <span className="badge badge-primary">
              {profile.communication_level}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-500">Autism Level:</span>
            <span className="badge badge-secondary">
              {profile.autism_level}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-gray-500 block mb-1">Goals:</span>
            <p className="text-xs text-gray-600 leading-relaxed">
              {profile.goals.length > 0 ? profile.goals.join(', ') : 'None set'}
            </p>
          </div>
        </div>
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 z-20 p-1.5 hover:bg-red-50 rounded"
        title="Delete profile"
      >
        {showDeleteConfirm ? (
          <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200">{isDeleting ? 'Deleting...' : 'Confirm?'}</span>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>
    </div>
  );
}

