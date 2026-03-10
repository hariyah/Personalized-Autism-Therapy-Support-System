import { useState } from 'react';
import type { ActivityRecommendation } from '../types';
import OutcomeModal from './OutcomeModal';
import { cleanActivityName } from '../utils/activityNameCleaner';

interface RecommendationCardProps {
  recommendation: ActivityRecommendation;
  profileId: string;
  onOutcomeSubmitted: () => void;
}

export default function RecommendationCard({
  recommendation,
  profileId,
  onOutcomeSubmitted,
}: RecommendationCardProps) {
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {cleanActivityName(recommendation.activity_name)}
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Why this activity?</h4>
            <p className="text-gray-600 text-sm">{recommendation.reason}</p>
          </div>

          {showDetails && (
            <>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Difficulty Adaptation</h4>
                <p className="text-gray-600 text-sm">{recommendation.difficulty_adaptation}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-1">Step-by-Step Instructions</h4>
                <ol className="list-decimal list-inside text-gray-600 text-sm space-y-1">
                  {recommendation.step_by_step_instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              {recommendation.sensory_safe_variants.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Sensory-Safe Variants</h4>
                  <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                    {recommendation.sensory_safe_variants.map((variant, idx) => (
                      <li key={idx}>{variant}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-700 mb-1">Expected Benefit</h4>
                <p className="text-gray-600 text-sm">{recommendation.expected_benefit}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-1">Success Checklist</h4>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  {recommendation.success_checklist.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setShowOutcomeModal(true)}
          className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
        >
          Log Activity Outcome
        </button>
      </div>

      {showOutcomeModal && (
        <OutcomeModal
          profileId={profileId}
          activityId={recommendation.activity_id}
          activityName={cleanActivityName(recommendation.activity_name)}
          onClose={() => setShowOutcomeModal(false)}
          onSubmitted={onOutcomeSubmitted}
        />
      )}
    </>
  );
}

