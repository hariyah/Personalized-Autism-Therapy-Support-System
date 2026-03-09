import React from 'react';

function ResultsDisplay({ results }) {
  const {
    transcript = '',
    issue_label = 'UNKNOWN',
    issue_top3 = [],
    urgency_label = 'UNKNOWN',
    summary = '',
  } = results || {};

  const getIssueIcon = (label) => {
    const icons = {
      'aggression': '😠',
      'anxiety_meltdown': '😰',
      'daily_progress': '✅',
      'feeding_issue': '🍽️',
      'health_concern': '🏥',
      'regression_social': '👥',
      'regression_speech': '🗣️',
      'repetitive_behavior': '🔄',
      'routine_change': '📅',
      'school_concern': '🏫',
      'self_injury': '⚠️',
      'sensory_overload': '🔊',
      'sleep_issue': '😴',
    };
    return icons[label?.toLowerCase()] || '📊';
  };

  const getUrgencyStyles = (label) => {
    switch (label?.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatLabel = (label) => {
    return label
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">

      {/* Header Summary Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 md:items-start md:justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Primary Analysis</h3>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
              {getIssueIcon(issue_label)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{formatLabel(issue_label)}</h2>
              <p className="text-slate-500">identified with {(issue_top3[0]?.score * 100).toFixed(0)}% confidence</p>
            </div>
          </div>
        </div>

        <div className={`px-6 py-4 rounded-xl border-2 flex flex-col items-center justify-center min-w-[140px] text-center ${getUrgencyStyles(urgency_label)}`}>
          <span className="text-sm font-semibold opacity-80 uppercase tracking-widest">Urgency</span>
          <span className="text-xl font-bold mt-1">{formatLabel(urgency_label)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transcript Card */}
        {transcript && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="flex items-center space-x-2 text-lg font-bold text-slate-800 mb-4">
              <span>📝</span>
              <span>Transcript</span>
            </h3>
            <div className="p-4 bg-slate-50 rounded-xl text-slate-600 italic leading-relaxed text-sm h-48 overflow-y-auto custom-scrollbar">
              "{transcript}"
            </div>
          </div>
        )}

        {/* AI Summary Card */}
        {summary && summary !== 'No transcript available' && (
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 shadow-sm border border-indigo-50">
            <h3 className="flex items-center space-x-2 text-lg font-bold text-slate-800 mb-4">
              <span>✨</span>
              <span>AI Insights</span>
            </h3>
            <div className="text-slate-700 leading-relaxed text-sm">
              {summary}
            </div>
          </div>
        )}
      </div>

      {/* Recommended Actions */}
      <div className="bg-white rounded-2xl shadow-lg shadow-emerald-50 border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
          <h3 className="font-bold text-emerald-900 flex items-center space-x-2">
            <span>💡</span>
            <span>Recommended Actions</span>
          </h3>
        </div>
        <div className="p-6">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dynamic Recommendations based on issue_label */}
            {issue_label === 'sensory_overload' && (
              <>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Reduce environmental stimuli (lower noise, dim lights)</span>
                </li>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Provide calming sensory tools (fidget items, weighted blanket)</span>
                </li>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Create a quiet space for recovery</span>
                </li>
              </>
            )}
            {issue_label === 'anxiety_meltdown' && (
              <>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Implement calming strategies (deep breathing, grounding)</span>
                </li>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Establish a safe space away from triggers</span>
                </li>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Use preferred comfort items</span>
                </li>
              </>
            )}
            {issue_label === 'sleep_issue' && (
              <>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Establish consistent sleep schedule</span>
                </li>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Create bedtime routine</span>
                </li>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Reduce screen time before bed</span>
                </li>
              </>
            )}
            {issue_label === 'feeding_issue' && (
              <>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Identify preferred textures and flavors</span>
                </li>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Introduce new foods gradually</span>
                </li>
                <li className="flex items-start space-x-3 text-slate-700">
                  <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Use visual supports for meal planning</span>
                </li>
              </>
            )}

            {/* Fallback if no specific recommendations match or minimal match */}
            {!['sensory_overload', 'anxiety_meltdown', 'sleep_issue', 'feeding_issue'].includes(issue_label) && (
              <li className="col-span-1 md:col-span-2 text-slate-500 italic">
                Consult with a specialist for tailored advice on this specific behavioral pattern.
              </li>
            )}

            {urgency_label === 'high' && (
              <li className="col-span-1 md:col-span-2 bg-red-50 p-4 rounded-lg flex items-start space-x-3 border border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 font-medium">Immediate professional intervention may be required based on the high urgency score.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Confidence/Disclaimer */}
      <div className="text-center text-xs text-slate-400 mt-8 mb-4">
        ⓘ These results are AI-generated analyses. Always consult with healthcare professionals for diagnosis and treatment plans.
      </div>

    </div>
  );
}

export default ResultsDisplay;
