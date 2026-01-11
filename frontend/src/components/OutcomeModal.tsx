import { useState } from 'react';
import { outcomesApi } from '../api/client';
import type { ActivityOutcomeCreate } from '../types';
import { cleanActivityName } from '../utils/activityNameCleaner';

interface OutcomeModalProps {
  profileId: string;
  activityId: string;
  activityName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function OutcomeModal({
  profileId,
  activityId,
  activityName,
  onClose,
  onSubmitted,
}: OutcomeModalProps) {
  const [engagement, setEngagement] = useState(3);
  const [stress, setStress] = useState(3);
  const [success, setSuccess] = useState(3);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const outcome: ActivityOutcomeCreate = {
        profile_id: profileId,
        activity_id: activityId,
        engagement,
        stress,
        success,
        notes,
      };

      await outcomesApi.create(outcome);
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit outcome');
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingSlider = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}: {value}/5
      </label>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Log Outcome: {cleanActivityName(activityName)}
        </h2>

        <form onSubmit={handleSubmit}>
          <RatingSlider
            label="Engagement"
            value={engagement}
            onChange={setEngagement}
          />
          <RatingSlider label="Stress Level" value={stress} onChange={setStress} />
          <RatingSlider label="Success" value={success} onChange={setSuccess} />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any observations or notes about the activity..."
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Outcome'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

