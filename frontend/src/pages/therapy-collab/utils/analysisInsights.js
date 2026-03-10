const ISSUE_TREATMENTS = {
    aggression: [
        'Use calm, low-demand communication and reduce immediate triggers before redirecting behavior.',
        'Track the trigger, environment, and recovery time for each aggression episode.',
        'Coordinate a consistent behavior support response with caregivers across settings.'
    ],
    anxiety_meltdown: [
        'Use grounding or breathing prompts early when distress signs begin.',
        'Provide a predictable calming routine and a quiet recovery space.',
        'Prepare transitions with visual supports or advance warnings.'
    ],
    daily_progress: [
        'Continue the routines and supports linked to the current positive progress.',
        'Reinforce successful behaviors quickly with specific praise or preferred rewards.',
        'Document strengths from this session so they can be repeated consistently.'
    ],
    feeding_issue: [
        'Offer preferred foods with one low-pressure new option and avoid forced intake.',
        'Review texture, smell, or sensory triggers that may be affecting meals.',
        'Arrange feeding-focused follow-up if weight, hydration, or nutrition are affected.'
    ],
    health_concern: [
        'Review for pain, illness, medication effects, or sleep disruption contributing to the symptoms.',
        'Escalate to pediatric review if symptoms are new, worsening, or medically concerning.',
        'Document onset, duration, and associated behaviors for follow-up.'
    ],
    regression_social: [
        'Reintroduce structured social interaction in short, predictable blocks.',
        'Use familiar adults or peers before increasing social demand.',
        'Monitor recent stressors that may be linked to social withdrawal.'
    ],
    regression_speech: [
        'Reduce communication pressure and allow extra response time.',
        'Support communication with visuals, gestures, or AAC tools when available.',
        'Schedule speech-language follow-up if regression persists.'
    ],
    repetitive_behavior: [
        'Review whether the behavior is serving a sensory, calming, or escape function.',
        'Schedule sensory or movement breaks before the behavior escalates.',
        'Redirect to a predictable replacement activity once the child is regulated.'
    ],
    routine_change: [
        'Use countdowns, visuals, and simple transition language before changes.',
        'Keep one familiar activity available while the new routine is introduced.',
        'Slow the pace of change if distress increases.'
    ],
    school_concern: [
        'Compare the pattern with school observations to identify setting-specific triggers.',
        'Request consistent supports, transition cues, and trigger tracking in class.',
        'Arrange a school-home review if school distress is increasing.'
    ],
    self_injury: [
        'Prioritize immediate safety and remove accessible self-harm risks.',
        'Document triggers, intensity, and recovery details for urgent clinical review.',
        'Escalate promptly for in-person assessment and a formal safety plan.'
    ],
    sensory_overload: [
        'Reduce noise, light, crowding, or other sensory load before re-engaging demands.',
        'Offer regulating sensory tools already known to help the child.',
        'Plan recovery breaks and access to a low-stimulation environment.'
    ],
    sleep_issue: [
        'Keep bedtime and wake time consistent and reduce stimulating activity before sleep.',
        'Review anxiety, sensory discomfort, and illness patterns that may affect sleep.',
        'Track sleep onset, night waking, and daytime behavior to guide follow-up.'
    ]
};

const DEFAULT_TREATMENTS = [
    'Continue documenting symptoms, triggers, and recovery patterns for clinician review.',
    'Use consistent routines and low-stress communication while monitoring change over time.',
    'Escalate to a specialist if symptoms intensify, become unsafe, or affect daily function.'
];

export const formatAnalysisLabel = (label = 'unknown') => String(label)
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Unknown';

export const getIssueLabel = (analysis = {}) => analysis.issueLabel || analysis.issue_label || 'unknown';

export const URGENCY_LEVELS = [
    { key: 'high', label: 'High', shortLabel: 'High', color: '#f43f5e' },
    { key: 'medium', label: 'Medium', shortLabel: 'Med', color: '#f59e0b' },
    { key: 'low', label: 'Low', shortLabel: 'Low', color: '#10b981' }
];

export const normalizeUrgencyLabel = (label = 'unknown') => {
    const normalized = String(label || '').trim().toLowerCase();

    if (normalized === 'med') return 'medium';
    if (URGENCY_LEVELS.some(level => level.key === normalized)) {
        return normalized;
    }

    return 'unknown';
};

export const getUrgencyLabel = (analysis = {}) => normalizeUrgencyLabel(
    analysis.urgencyLabel || analysis.urgency_label || 'unknown'
);

export const getUrgencyCounts = (analyses = []) => analyses.reduce((acc, analysis) => {
    const urgency = getUrgencyLabel(analysis);

    if (urgency !== 'unknown') {
        acc[urgency] += 1;
    }

    return acc;
}, { high: 0, medium: 0, low: 0 });

export const getUrgencyChartData = (analyses = []) => {
    const counts = getUrgencyCounts(analyses);

    return URGENCY_LEVELS.map(level => ({
        ...level,
        value: counts[level.key]
    }));
};

export const getResultSummary = (analysis = {}) => {
    const savedSummary = analysis.resultSummary || analysis.result_summary;
    if (savedSummary) return savedSummary;

    const fallbackSummary = analysis.summary || '';
    const issue = formatAnalysisLabel(getIssueLabel(analysis));
    const urgency = formatAnalysisLabel(getUrgencyLabel(analysis)).toLowerCase();

    return fallbackSummary
        ? `${issue} was identified with ${urgency} urgency. ${fallbackSummary}`
        : `${issue} was identified with ${urgency} urgency.`;
};

export const getTreatmentSuggestions = (analysis = {}) => {
    const savedSuggestions = analysis.treatmentSuggestions || analysis.treatment_suggestions;
    if (Array.isArray(savedSuggestions) && savedSuggestions.length > 0) {
        return savedSuggestions;
    }

    const suggestions = [...(ISSUE_TREATMENTS[getIssueLabel(analysis)] || DEFAULT_TREATMENTS)];
    const urgency = getUrgencyLabel(analysis);

    if (urgency === 'high') {
        suggestions.unshift('Arrange urgent clinician review and confirm an immediate safety plan with caregivers.');
    } else if (urgency === 'medium') {
        suggestions.push('Review this pattern soon and monitor closely for escalation over the next few days.');
    } else if (urgency === 'low') {
        suggestions.push('Continue observation and compare the next update against this baseline record.');
    }

    return [...new Set(suggestions)].slice(0, 4);
};

export const getDoctorReview = (analysis = {}) => analysis.doctorReview || null;

export const getDisplayedSummary = (analysis = {}) => {
    const review = getDoctorReview(analysis);
    if (review?.finalSummary) return review.finalSummary;
    return getResultSummary(analysis);
};

export const getDisplayedTreatmentSuggestions = (analysis = {}) => {
    const review = getDoctorReview(analysis);
    if (Array.isArray(review?.finalTreatmentSuggestions) && review.finalTreatmentSuggestions.length > 0) {
        return review.finalTreatmentSuggestions;
    }
    return getTreatmentSuggestions(analysis);
};

export const getTreatmentStatusLabel = (analysis = {}) => {
    const review = getDoctorReview(analysis);
    return formatAnalysisLabel(review?.treatmentStatus || 'recommended');
};

export const getCareStageLabel = (analysis = {}) => {
    const review = getDoctorReview(analysis);
    return formatAnalysisLabel(review?.careStage || 'awaiting_review');
};
