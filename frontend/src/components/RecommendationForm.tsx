import { useState, useEffect } from 'react';
import type { PlanRequest, Budget, AttentionLevel, Environment } from '../types';
import { recommendationsApi } from '../api/client';

interface RecommendationFormProps {
  onSubmit: (planRequest: PlanRequest) => void;
  isSubmitting: boolean;
}

export default function RecommendationForm({ onSubmit, isSubmitting }: RecommendationFormProps) {
  const [budget, setBudget] = useState<Budget>('medium');
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);
  const [allMaterials, setAllMaterials] = useState<string[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [attentionLevel, setAttentionLevel] = useState<AttentionLevel>('medium');
  const [environment, setEnvironment] = useState<Environment>('home');

  useEffect(() => {
    // Fetch available materials from dataset
    const fetchMaterials = async () => {
      try {
        setLoadingMaterials(true);
        const materials = await recommendationsApi.getMaterials();
        setAllMaterials(materials);
      } catch (error) {
        console.error('Failed to fetch materials:', error);
      } finally {
        setLoadingMaterials(false);
      }
    };
    fetchMaterials();
  }, []);

  const handleMaterialChange = (material: string) => {
    if (availableMaterials.includes(material)) {
      setAvailableMaterials(availableMaterials.filter(m => m !== material));
    } else {
      setAvailableMaterials([...availableMaterials, material]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Normalize materials to lowercase for backend matching
    const normalizedMaterials = availableMaterials.map(m => m.toLowerCase().trim());
    onSubmit({
      budget,
      available_materials: normalizedMaterials,
      attention_level: attentionLevel,
      environment: environment,
      plan_type: 'daily', // Always use daily plan
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Generate Activity Plan</h2>
        <p className="text-gray-600">
          Provide your budget and available materials to generate a personalized activity plan.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Budget
          </label>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value as Budget)}
            className="input-field"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Available Materials
          </label>
          {loadingMaterials ? (
            <div className="text-sm text-gray-500 py-2">Loading materials...</div>
          ) : (
            <>
              <div className="border border-gray-300 rounded-lg p-3 max-h-[200px] overflow-y-auto bg-white">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allMaterials.map((material) => (
                    <label
                      key={material}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={availableMaterials.includes(material)}
                        onChange={() => handleMaterialChange(material)}
                        className="w-4 h-4 text-pastel-green-600 border-gray-300 rounded focus:ring-pastel-green-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">{material}</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Select multiple materials by checking the boxes. Selected materials will be prioritized in activity selection.
              </p>
              {availableMaterials.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-1.5 font-medium">Selected ({availableMaterials.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {availableMaterials.map((material) => (
                      <span
                        key={material}
                        className="inline-flex items-center gap-1 bg-pastel-green-50 text-pastel-green-700 px-3 py-1 rounded-md text-sm font-medium border border-pastel-green-200"
                      >
                        {material}
                        <button
                          type="button"
                          onClick={() => handleMaterialChange(material)}
                          className="text-pastel-green-600 hover:text-pastel-green-800 font-bold ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Attention Level
          </label>
          <select
            value={attentionLevel}
            onChange={(e) => setAttentionLevel(e.target.value as AttentionLevel)}
            className="input-field"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Environment
          </label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as Environment)}
            className="input-field"
          >
            <option value="home">Home</option>
            <option value="therapy">Therapy</option>
            <option value="school">School</option>
            <option value="outdoor">Outdoor</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full"
        >
          {isSubmitting ? 'Generating Activity Plan...' : 'Generate Activity Plan'}
        </button>
      </div>
    </form>
  );
}

