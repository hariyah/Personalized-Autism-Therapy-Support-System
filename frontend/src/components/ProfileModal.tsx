import { useState, useEffect } from 'react';
import type { ChildProfile, ChildProfileCreate, CommunicationLevel, AutismLevel, SensoryLevel, Goal } from '../types';

const MAX_CHILD_AGE = 16;
const MIN_CHILD_AGE = 2;
const MIN_NAME_LEN = 4;

function formatLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ageFromBirthDate(iso: string): number {
  if (!iso) return NaN;
  const [y, m, day] = iso.split('-').map(Number);
  if (!y || !m || !day) return NaN;
  const birth = new Date(y, m - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function minBirthDateISO(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - (MAX_CHILD_AGE + 1));
  return formatLocalISODate(d);
}

function maxBirthDateISO(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_CHILD_AGE);
  return formatLocalISODate(d);
}

interface ProfileModalProps {
  onClose: () => void;
  onSubmit: (profile: ChildProfileCreate | Partial<ChildProfileCreate>) => Promise<void>;
  initialProfile?: ChildProfile | null;
}

export default function ProfileModal({ onClose, onSubmit, initialProfile }: ProfileModalProps) {
  const isEditMode = !!initialProfile;

  const [formData, setFormData] = useState<Partial<ChildProfileCreate>>({
    name: '',
    age: 5,
    communication_level: 'verbal',
    autism_level: 'Level 2',
    sensory_sensitivity: {
      sound: 'low',
      light: 'low',
      touch: 'low',
    },
    goals: [],
  });

  /** Optional calendar helper only — not saved; clears when age is typed. */
  const [helperBirthIso, setHelperBirthIso] = useState('');

  useEffect(() => {
    if (initialProfile) {
      setFormData({
        name: initialProfile.name,
        age: initialProfile.age,
        communication_level: initialProfile.communication_level,
        autism_level: initialProfile.autism_level,
        sensory_sensitivity: initialProfile.sensory_sensitivity,
        goals: initialProfile.goals,
      });
      setHelperBirthIso('');
    }
  }, [initialProfile]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAgeNumberChange = (raw: string) => {
    setHelperBirthIso('');
    if (raw === '') {
      setFormData((prev) => ({ ...prev, age: undefined as unknown as number }));
      return;
    }
    const n = parseInt(raw, 10);
    if (Number.isFinite(n)) {
      setFormData((prev) => ({ ...prev, age: n }));
    }
  };

  const handleHelperCalendarChange = (iso: string) => {
    setHelperBirthIso(iso);
    const a = ageFromBirthDate(iso);
    if (Number.isFinite(a) && a >= 0) {
      setFormData((prev) => ({ ...prev, age: a }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = (formData.name || '').trim();
    if (!name || !formData.communication_level || !formData.autism_level) {
      setError('Please fill in all required fields');
      return;
    }
    if (name.length < MIN_NAME_LEN) {
      setError(`Name must be at least ${MIN_NAME_LEN} characters (after spaces are trimmed).`);
      return;
    }
    const age = Number(formData.age);
    if (!Number.isFinite(age) || age < MIN_CHILD_AGE || age > MAX_CHILD_AGE) {
      setError(`Age must be between ${MIN_CHILD_AGE} and ${MAX_CHILD_AGE}.`);
      return;
    }

    const payload = { ...formData, name, age };

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        await onSubmit(payload);
      } else {
        await onSubmit(payload as ChildProfileCreate);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} profile`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGoal = (goal: Goal) => {
    const currentGoals = formData.goals || [];
    if (currentGoals.includes(goal)) {
      setFormData({
        ...formData,
        goals: currentGoals.filter((g) => g !== goal),
      });
    } else {
      setFormData({
        ...formData,
        goals: [...currentGoals, goal],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {isEditMode ? 'Edit Child Profile' : 'Create Child Profile'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *{' '}
                <span className="text-xs text-gray-500 font-normal">(at least {MIN_NAME_LEN} characters)</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                minLength={MIN_NAME_LEN}
                autoComplete="name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-800">
                Age * <span className="text-xs text-gray-500 font-normal">({MIN_CHILD_AGE}–{MAX_CHILD_AGE} years)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1 min-w-0">
                  <label htmlFor="profile-age" className="sr-only">
                    Age in years
                  </label>
                  <input
                    id="profile-age"
                    type="number"
                    min={MIN_CHILD_AGE}
                    max={MAX_CHILD_AGE}
                    value={Number.isFinite(Number(formData.age)) ? formData.age : ''}
                    onChange={(e) => handleAgeNumberChange(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="flex-1 min-w-0 sm:border-l sm:border-gray-200 sm:pl-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Optional: birth date (sets age from calendar)
                  </label>
                  <input
                    type="date"
                    value={helperBirthIso}
                    min={minBirthDateISO()}
                    max={maxBirthDateISO()}
                    onChange={(e) => handleHelperCalendarChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono text-base [color-scheme:light]"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Only the number above is saved. Use the calendar if you prefer; typing a new age clears the calendar
                selection.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Communication Level *
              </label>
              <select
                value={formData.communication_level || 'verbal'}
                onChange={(e) =>
                  setFormData({ ...formData, communication_level: e.target.value as CommunicationLevel })
                }
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="nonverbal">Nonverbal</option>
                <option value="limited">Limited</option>
                <option value="verbal">Verbal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Autism Level * <span className="text-xs text-gray-500">(Support needed)</span>
              </label>
              <select
                value={formData.autism_level || 'Level 2'}
                onChange={(e) =>
                  setFormData({ ...formData, autism_level: e.target.value as AutismLevel })
                }
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Level 1">Level 1 (Mild Support)</option>
                <option value="Level 2">Level 2 (Moderate Support)</option>
                <option value="Level 3">Level 3 (High Support)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sensory Sensitivity *
              </label>
              {(['sound', 'light', 'touch'] as const).map((sense) => (
                <div key={sense} className="mb-2">
                  <label className="text-sm text-gray-600 capitalize">{sense}:</label>
                  <select
                    value={formData.sensory_sensitivity?.[sense] || 'low'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sensory_sensitivity: {
                          ...formData.sensory_sensitivity!,
                          [sense]: e.target.value as SensoryLevel,
                        },
                      })
                    }
                    className="ml-2 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="med">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goals
              </label>
              <div className="flex flex-wrap gap-2">
                {(['attention', 'memory', 'social', 'motor', 'emotion'] as Goal[]).map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`px-4 py-2 rounded-md transition ${
                      formData.goals?.includes(goal)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
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
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Profile' : 'Create Profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
