const ISSUE_TREATMENTS = {
    aggression: [
        'Use low-demand, calm language and reduce immediate triggers before redirecting behavior.',
        'Track the setting, trigger, and recovery time to identify repeat aggression patterns.',
        'Coordinate a behavior support plan with caregivers so responses stay consistent.'
    ],
    anxiety_meltdown: [
        'Introduce grounding or breathing prompts before the child reaches peak distress.',
        'Create a predictable calming routine with a safe, quiet recovery space.',
        'Use visual schedules or advance warnings when transitions may increase anxiety.'
    ],
    daily_progress: [
        'Continue the routines and supports linked to this positive progress.',
        'Reinforce successful behaviors immediately with specific praise or preferred rewards.',
        'Document strengths from this session to repeat them in home and school settings.'
    ],
    feeding_issue: [
        'Offer preferred foods alongside one low-pressure new food and avoid forcing intake.',
        'Review textures, smells, and sensory triggers that may be limiting eating.',
        'Consider feeding therapy follow-up if nutrition, weight, or hydration are affected.'
    ],
    health_concern: [
        'Review for pain, illness, medication effects, or sleep disruption contributing to symptoms.',
        'Escalate to pediatric review if symptoms are new, worsening, or medically concerning.',
        'Record onset, duration, and associated behaviors to support clinical follow-up.'
    ],
    regression_social: [
        'Use short, structured social activities with familiar adults or peers.',
        'Reintroduce previously successful social prompts gradually instead of increasing demands quickly.',
        'Monitor environmental stressors that may be linked to recent social withdrawal.'
    ],
    regression_speech: [
        'Reduce communication pressure and allow extra response time during interaction.',
        'Support expressive language with visuals, gestures, or communication aids.',
        'Arrange speech-language follow-up if the regression is persistent or worsening.'
    ],
    repetitive_behavior: [
        'Identify whether the repetitive behavior is serving a calming, sensory, or escape function.',
        'Use scheduled movement or sensory breaks before the behavior becomes disruptive.',
        'Redirect only after the child is regulated, using a predictable replacement activity.'
    ],
    routine_change: [
        'Prepare the child with countdowns, visuals, and simple transition language.',
        'Keep one familiar anchor activity available while the new routine is introduced.',
        'Review which routine changes triggered distress and slow the pace of change if needed.'
    ],
    school_concern: [
        'Share the observed pattern with school staff to compare behavior across settings.',
        'Request consistent classroom supports, transition cues, and trigger tracking.',
        'Schedule a school-home review if academic refusal or distress is increasing.'
    ],
    self_injury: [
        'Prioritize immediate safety, supervision, and removal of accessible self-harm risks.',
        'Document triggers, intensity, and recovery pattern for urgent clinician review.',
        'Escalate promptly for in-person assessment and a formal safety plan.'
    ],
    sensory_overload: [
        'Reduce noise, light, crowding, or other sensory load before re-engaging demands.',
        'Offer regulating sensory tools such as deep pressure, headphones, or fidget items if already tolerated.',
        'Plan short recovery breaks and a low-stimulation space after overload episodes.'
    ],
    sleep_issue: [
        'Keep bedtime and wake time consistent and limit stimulating activities before sleep.',
        'Review sensory discomfort, illness, or anxiety patterns that may be disrupting sleep.',
        'Track sleep onset, night waking, and daytime behavior to guide further review.'
    ]
};

const DEFAULT_TREATMENTS = [
    'Continue documenting symptoms, triggers, and recovery patterns for clinician review.',
    'Use consistent routines and low-stress communication while monitoring change over time.',
    'Escalate to a specialist if symptoms intensify, become unsafe, or affect daily function.'
];

function formatAnalysisLabel(label = 'unknown') {
    return String(label)
        .split('_')
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || 'Unknown';
}

function normalizeUrgencyLabel(label, fallback = 'medium') {
    const normalized = String(label || '').trim().toLowerCase();
    return ['low', 'medium', 'high'].includes(normalized) ? normalized : fallback;
}

function buildTreatmentSuggestions(issueLabel, urgencyLabel) {
    const normalizedUrgency = normalizeUrgencyLabel(urgencyLabel);
    const suggestions = [...(ISSUE_TREATMENTS[issueLabel] || DEFAULT_TREATMENTS)];

    if (normalizedUrgency === 'high') {
        suggestions.unshift('Arrange urgent clinician review and confirm an immediate safety plan with caregivers.');
    } else if (normalizedUrgency === 'medium') {
        suggestions.push('Review this pattern soon and monitor closely for escalation over the next few days.');
    } else if (normalizedUrgency === 'low') {
        suggestions.push('Continue observation and compare the next update against this baseline record.');
    }

    return [...new Set(suggestions)].slice(0, 4);
}

function buildResultSummary({ issueLabel, urgencyLabel, summary }) {
    const issue = formatAnalysisLabel(issueLabel);
    const urgency = formatAnalysisLabel(normalizeUrgencyLabel(urgencyLabel));
    const cleanSummary = String(summary || '').trim();

    if (!cleanSummary) {
        return `${issue} was identified with ${urgency.toLowerCase()} urgency.`;
    }

    return `${issue} was identified with ${urgency.toLowerCase()} urgency. ${cleanSummary}`;
}

module.exports = {
    formatAnalysisLabel,
    normalizeUrgencyLabel,
    buildTreatmentSuggestions,
    buildResultSummary
};
