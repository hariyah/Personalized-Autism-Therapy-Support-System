import json
import os
import random
from typing import Dict, List, Optional, Tuple

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

MODEL_FILENAME = "treatment_pipeline.joblib"
METADATA_FILENAME = "metadata.json"

ISSUE_PROFILES = {
    "aggression": {
        "symptoms": [
            "child hit a caregiver during demand situations",
            "throwing objects when corrected",
            "sudden aggressive reaction after frustration",
            "kicking or pushing during transitions",
            "verbal escalation followed by physical aggression",
            "becoming physically unsafe when denied a preferred item"
        ],
        "contexts": [
            "the behavior increased during routine demands",
            "family reported difficulty calming the child once triggered",
            "the episode ended after the environment was reduced",
            "school staff observed the same pattern this week",
            "the child needed extended recovery time after the event"
        ],
        "suggestions": [
            "Use calm, low-demand communication and reduce immediate triggers before redirecting behavior.",
            "Track the trigger, environment, and recovery time for each aggression episode.",
            "Coordinate a consistent behavior support response with caregivers across settings."
        ]
    },
    "anxiety_meltdown": {
        "symptoms": [
            "child cried intensely before a routine change",
            "panic-like behavior appeared during transition",
            "the child became overwhelmed and inconsolable in a crowded setting",
            "anxiety signs escalated into a meltdown after unexpected demands",
            "the child showed shaking and distress before losing regulation",
            "parent reported repeated meltdowns around uncertainty"
        ],
        "contexts": [
            "the child needed isolation to recover",
            "warning signs were visible before the peak of distress",
            "the behavior appeared when expectations changed quickly",
            "caregivers reported better recovery with early reassurance",
            "the pattern is affecting daily routines"
        ],
        "suggestions": [
            "Use grounding or breathing prompts early when distress signs begin.",
            "Provide a predictable calming routine and a quiet recovery space.",
            "Prepare transitions with visual supports or advance warnings."
        ]
    },
    "daily_progress": {
        "symptoms": [
            "child followed directions more consistently today",
            "improved regulation was observed during therapy",
            "the child used a new coping skill successfully",
            "positive social engagement increased this week",
            "better tolerance for structured tasks was reported",
            "parent reported a strong day with fewer behavioral concerns"
        ],
        "contexts": [
            "the improvement happened with familiar routines",
            "the child responded well to reinforcement",
            "caregivers want to maintain the current progress",
            "this is a useful baseline for future comparison",
            "the child completed more activities than usual"
        ],
        "suggestions": [
            "Continue the routines and supports linked to the current positive progress.",
            "Reinforce successful behaviors quickly with specific praise or preferred rewards.",
            "Document strengths from this session so they can be repeated consistently."
        ]
    },
    "feeding_issue": {
        "symptoms": [
            "child refused most foods except a few preferred items",
            "gagging occurred with unfamiliar textures",
            "mealtime distress increased around new foods",
            "restricted eating is affecting nutrition variety",
            "the child avoids meals with strong smells",
            "parent reported feeding struggles every evening"
        ],
        "contexts": [
            "the issue appears strongly linked to sensory preferences",
            "family is worried about nutrition and hydration",
            "meal routines have become highly stressful",
            "the child tolerates only a narrow range of foods",
            "caregivers want a structured introduction plan"
        ],
        "suggestions": [
            "Offer preferred foods with one low-pressure new option and avoid forced intake.",
            "Review texture, smell, or sensory triggers that may be affecting meals.",
            "Arrange feeding-focused follow-up if weight, hydration, or nutrition are affected."
        ]
    },
    "health_concern": {
        "symptoms": [
            "new behavior changes may be linked to pain or illness",
            "sudden irritability raised concern for an underlying medical issue",
            "the child showed discomfort and reduced tolerance today",
            "sleep and appetite changed along with new symptoms",
            "caregiver reported physical complaints with behavioral decline",
            "the child seemed unwell and less interactive than baseline"
        ],
        "contexts": [
            "the change is more abrupt than usual behavioral variation",
            "family wants medical follow-up guidance",
            "pain cannot be ruled out from the history",
            "the concern may require pediatric review",
            "the child is showing reduced participation in routine activities"
        ],
        "suggestions": [
            "Review for pain, illness, medication effects, or sleep disruption contributing to the symptoms.",
            "Escalate to pediatric review if symptoms are new, worsening, or medically concerning.",
            "Document onset, duration, and associated behaviors for follow-up."
        ]
    },
    "regression_social": {
        "symptoms": [
            "child is avoiding peers more than before",
            "social withdrawal increased over the last two weeks",
            "the child stopped engaging in familiar social routines",
            "eye contact and shared interaction have decreased",
            "parent noticed loss of previous social gains",
            "play with others has declined noticeably"
        ],
        "contexts": [
            "caregivers are concerned about regression from baseline",
            "the change may be connected to stress or environment",
            "social participation dropped both at home and school",
            "familiar people are easier than group settings",
            "the family wants structured re-engagement steps"
        ],
        "suggestions": [
            "Reintroduce structured social interaction in short, predictable blocks.",
            "Use familiar adults or peers before increasing social demand.",
            "Monitor recent stressors that may be linked to social withdrawal."
        ]
    },
    "regression_speech": {
        "symptoms": [
            "child is using fewer words than before",
            "speech output dropped suddenly this month",
            "the child relies more on gestures after prior verbal gains",
            "communication attempts are reduced across settings",
            "parent reported regression in expressive language",
            "speech participation declined after recent stressors"
        ],
        "contexts": [
            "the family wants guidance before the regression deepens",
            "communication pressure seems to worsen the pattern",
            "school and home both noticed reduced expressive language",
            "the child still responds but speaks less often",
            "previous communication supports may need to be reintroduced"
        ],
        "suggestions": [
            "Reduce communication pressure and allow extra response time.",
            "Support communication with visuals, gestures, or AAC tools when available.",
            "Schedule speech-language follow-up if regression persists."
        ]
    },
    "repetitive_behavior": {
        "symptoms": [
            "repetitive motor behavior increased during the day",
            "the child repeated the same action for long periods",
            "stimming became harder to interrupt during tasks",
            "the behavior appears to rise with stress or sensory load",
            "caregivers reported repetitive routines blocking transitions",
            "the child uses repetitive behavior to regulate"
        ],
        "contexts": [
            "the pattern may be serving a calming function",
            "transitions become difficult once the repetition starts",
            "sensory demand seems to increase the frequency",
            "the behavior is not dangerous but is limiting participation",
            "family wants safer replacement strategies"
        ],
        "suggestions": [
            "Review whether the behavior is serving a sensory, calming, or escape function.",
            "Schedule sensory or movement breaks before the behavior escalates.",
            "Redirect to a predictable replacement activity once the child is regulated."
        ]
    },
    "routine_change": {
        "symptoms": [
            "distress increased after a schedule change",
            "the child struggled when the routine shifted unexpectedly",
            "morning transition became difficult after a new plan",
            "behavior worsened when familiar steps were changed",
            "the child needs strong predictability and reacted to change",
            "caregivers reported more dysregulation after routine disruption"
        ],
        "contexts": [
            "the child improves when changes are previewed",
            "visual schedules reduced distress in earlier situations",
            "the family wants a smoother transition strategy",
            "routine changes are currently affecting daily functioning",
            "the child needs more preparation than usual"
        ],
        "suggestions": [
            "Use countdowns, visuals, and simple transition language before changes.",
            "Keep one familiar activity available while the new routine is introduced.",
            "Slow the pace of change if distress increases."
        ]
    },
    "school_concern": {
        "symptoms": [
            "teacher reported increased distress at school",
            "the child is refusing school tasks more often",
            "behavior concerns are stronger in the classroom",
            "school transitions and demands are causing dysregulation",
            "parent and school both reported classroom challenges",
            "the child is struggling with academic participation"
        ],
        "contexts": [
            "home and school need a shared support plan",
            "the issue may be setting-specific",
            "staff observations are important for comparison",
            "classroom expectations may need adjustment",
            "the child appears more regulated outside school"
        ],
        "suggestions": [
            "Compare the pattern with school observations to identify setting-specific triggers.",
            "Request consistent supports, transition cues, and trigger tracking in class.",
            "Arrange a school-home review if school distress is increasing."
        ]
    },
    "self_injury": {
        "symptoms": [
            "child hit their own head during distress",
            "self-biting or self-harm behavior was reported today",
            "the child became unsafe toward self during meltdown",
            "caregiver observed repeated self-injury during escalation",
            "the behavior poses immediate safety concern",
            "self-directed harm increased with dysregulation"
        ],
        "contexts": [
            "safety planning is urgent in this case",
            "close supervision is required",
            "the family needs crisis guidance immediately",
            "injury risk is higher than baseline",
            "an in-person safety review may be needed"
        ],
        "suggestions": [
            "Prioritize immediate safety and remove accessible self-harm risks.",
            "Document triggers, intensity, and recovery details for urgent clinical review.",
            "Escalate promptly for in-person assessment and a formal safety plan."
        ]
    },
    "sensory_overload": {
        "symptoms": [
            "child covered ears and became distressed in a noisy place",
            "bright lights and crowding triggered dysregulation",
            "the child could not tolerate the sensory environment",
            "sensory overload caused withdrawal and distress",
            "auditory sensitivity escalated the behavior",
            "the child needed to leave the environment to recover"
        ],
        "contexts": [
            "noise and light appear to be major triggers",
            "the child recovers better in low stimulation spaces",
            "family wants practical environmental supports",
            "the sensory load exceeded the child’s regulation capacity",
            "the pattern affects community outings"
        ],
        "suggestions": [
            "Reduce noise, light, crowding, or other sensory load before re-engaging demands.",
            "Offer regulating sensory tools already known to help the child.",
            "Plan recovery breaks and access to a low-stimulation environment."
        ]
    },
    "sleep_issue": {
        "symptoms": [
            "child is waking repeatedly at night",
            "bedtime resistance increased significantly",
            "poor sleep is affecting daytime behavior",
            "the child is taking a long time to fall asleep",
            "sleep disruption led to reduced regulation",
            "caregivers reported exhaustion due to night waking"
        ],
        "contexts": [
            "the pattern may be worsening overall daytime function",
            "family needs a consistent sleep plan",
            "sensory discomfort or anxiety may be contributing",
            "sleep data would help guide follow-up",
            "the issue is affecting the whole household"
        ],
        "suggestions": [
            "Keep bedtime and wake time consistent and reduce stimulating activity before sleep.",
            "Review anxiety, sensory discomfort, and illness patterns that may affect sleep.",
            "Track sleep onset, night waking, and daytime behavior to guide follow-up."
        ]
    }
}

URGENCY_PHRASES = {
    "low": [
        "the concern is mild and manageable right now",
        "caregivers reported the issue is present but stable",
        "monitoring is needed but there is no immediate danger",
        "the child returned to baseline fairly quickly"
    ],
    "medium": [
        "the issue is affecting daily routines and needs follow-up soon",
        "caregivers are struggling to manage the pattern consistently",
        "the concern is moderate and interfering with home or school",
        "the child needs a near-term plan before the pattern escalates"
    ],
    "high": [
        "the situation may need urgent clinical attention",
        "safety and escalation are immediate concerns",
        "the child is at high risk of harm or severe disruption",
        "caregivers need urgent support and rapid review"
    ]
}

GENERAL_NOTES = [
    "doctor noted the child was harder to redirect than baseline",
    "parent described similar episodes over several recent days",
    "the note included concern about triggers and recovery time",
    "caregivers asked for a clear treatment direction",
    "the report was written after observing the current symptom pattern"
]

SYNTHETIC_TEMPLATES = [
    "Clinical note: {symptom}. {context}. {urgency_phrase}. {general_note}.",
    "Parent update says {symptom}. {urgency_phrase}. {context}.",
    "Behavior summary: {symptom}; {context}; {urgency_phrase}.",
    "During review the doctor recorded that {symptom}. {general_note}. {urgency_phrase}.",
    "Therapy note reports {symptom}. {context}. {general_note}."
]


def format_label(label: str) -> str:
    return " ".join(part.capitalize() for part in str(label or "unknown").split("_") if part) or "Unknown"


def profile_id(issue_label: str, urgency_label: str) -> str:
    return f"{issue_label}__{urgency_label}"


def build_feature_text(transcript: str, issue_label: str, urgency_label: str) -> str:
    return f"issue {issue_label} urgency {urgency_label} transcript {transcript}"


def build_fallback_treatment_suggestions(issue_label: str, urgency_label: str) -> List[str]:
    suggestions = list(ISSUE_PROFILES.get(issue_label, {}).get("suggestions", [
        "Continue documenting symptoms, triggers, and recovery patterns for clinician review.",
        "Use consistent routines and low-stress communication while monitoring change over time.",
        "Escalate to a specialist if symptoms intensify, become unsafe, or affect daily function."
    ]))

    if urgency_label == "high":
        suggestions.insert(0, "Arrange urgent clinician review and confirm an immediate safety plan with caregivers.")
    elif urgency_label == "medium":
        suggestions.append("Review this pattern soon and monitor closely for escalation over the next few days.")
    elif urgency_label == "low":
        suggestions.append("Continue observation and compare the next update against this baseline record.")

    deduped: List[str] = []
    for suggestion in suggestions:
        if suggestion not in deduped:
            deduped.append(suggestion)
    return deduped[:4]


def build_profile_catalog() -> Dict[str, Dict[str, object]]:
    catalog: Dict[str, Dict[str, object]] = {}
    for issue_label in ISSUE_PROFILES:
        for urgency_label in URGENCY_PHRASES:
            pid = profile_id(issue_label, urgency_label)
            catalog[pid] = {
                "issue_label": issue_label,
                "urgency_label": urgency_label,
                "display_name": f"{format_label(issue_label)} ({format_label(urgency_label)})",
                "suggestions": build_fallback_treatment_suggestions(issue_label, urgency_label)
            }
    return catalog


def generate_synthetic_training_data(samples_per_profile: int = 120, seed: int = 42) -> Tuple[List[str], List[str], Dict[str, Dict[str, object]]]:
    rng = random.Random(seed)
    profiles = build_profile_catalog()
    samples: List[str] = []
    labels: List[str] = []

    for issue_label, profile in ISSUE_PROFILES.items():
        for urgency_label, urgency_phrases in URGENCY_PHRASES.items():
            pid = profile_id(issue_label, urgency_label)
            for _ in range(samples_per_profile):
                transcript = rng.choice(SYNTHETIC_TEMPLATES).format(
                    symptom=rng.choice(profile["symptoms"]),
                    context=rng.choice(profile["contexts"]),
                    urgency_phrase=rng.choice(urgency_phrases),
                    general_note=rng.choice(GENERAL_NOTES)
                )
                samples.append(build_feature_text(transcript, issue_label, urgency_label))
                labels.append(pid)

    return samples, labels, profiles


def train_treatment_model(output_dir: str, samples_per_profile: int = 120, seed: int = 42) -> Dict[str, object]:
    samples, labels, profiles = generate_synthetic_training_data(samples_per_profile=samples_per_profile, seed=seed)
    x_train, x_test, y_train, y_test = train_test_split(
        samples,
        labels,
        test_size=0.2,
        random_state=seed,
        stratify=labels
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, max_features=50000)),
        ("clf", LogisticRegression(max_iter=3000))
    ])
    pipeline.fit(x_train, y_train)

    predictions = pipeline.predict(x_test)
    accuracy = accuracy_score(y_test, predictions)

    os.makedirs(output_dir, exist_ok=True)
    joblib.dump(pipeline, os.path.join(output_dir, MODEL_FILENAME))

    metadata = {
        "samples_per_profile": samples_per_profile,
        "seed": seed,
        "train_size": len(x_train),
        "test_size": len(x_test),
        "accuracy": float(accuracy),
        "profiles": profiles,
        "training_mode": "synthetic_bootstrap"
    }

    with open(os.path.join(output_dir, METADATA_FILENAME), "w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)

    return metadata


def load_treatment_model(model_dir: str) -> Tuple[Optional[Pipeline], Optional[Dict[str, object]]]:
    model_path = os.path.join(model_dir, MODEL_FILENAME)
    metadata_path = os.path.join(model_dir, METADATA_FILENAME)
    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        return None, None

    model = joblib.load(model_path)
    with open(metadata_path, "r", encoding="utf-8") as handle:
        metadata = json.load(handle)
    return model, metadata


def predict_treatment_suggestions(
    model: Optional[Pipeline],
    metadata: Optional[Dict[str, object]],
    transcript: str,
    issue_label: str,
    urgency_label: str
) -> Dict[str, object]:
    fallback_suggestions = build_fallback_treatment_suggestions(issue_label, urgency_label)
    if model is None or metadata is None:
        return {
            "treatment_suggestions": fallback_suggestions,
            "treatment_profile": profile_id(issue_label, urgency_label),
            "treatment_model_used": False,
            "treatment_model_confidence": None,
            "treatment_training_mode": "rule_fallback"
        }

    feature_text = build_feature_text(transcript, issue_label, urgency_label)
    predicted_profile = str(model.predict([feature_text])[0])
    confidence = None

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba([feature_text])[0]
        confidence = float(max(probabilities))

    profile = metadata.get("profiles", {}).get(predicted_profile, {})
    suggestions = profile.get("suggestions") or fallback_suggestions

    if profile.get("issue_label") != issue_label or profile.get("urgency_label") != urgency_label:
        predicted_profile = profile_id(issue_label, urgency_label)
        suggestions = fallback_suggestions

    return {
        "treatment_suggestions": suggestions,
        "treatment_profile": predicted_profile,
        "treatment_model_used": True,
        "treatment_model_confidence": confidence,
        "treatment_training_mode": metadata.get("training_mode", "synthetic_bootstrap")
    }
