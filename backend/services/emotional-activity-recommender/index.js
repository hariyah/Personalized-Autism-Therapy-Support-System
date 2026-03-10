const express = require('express');
const cors = require('cors');
const multer = require('multer');
const emotionService = require('./emotionService');
const ollamaService = require('./ollamaService');
const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 7003;

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024 // 16MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, bmp)'));
    }
  }
});

// Enhanced activities database with new fields
const activities = [
  // Social Activities
  {
    id: 1,
    title: "Social Story Reading",
    category: "social",
    description: "Read personalized social stories to help understand social situations and appropriate responses.",
    duration: "15-20 minutes",
    difficulty: "easy",
    materials: ["Social story book", "Quiet space"],
    benefits: ["Understanding social cues", "Empathy development", "Communication skills"],
    ageRange: "4-12 years",
    icon: "📚",
    costLevel: "low",
    socialRequirement: "low",
    emotionMapping: {
      happy: 0.7,
      sad: 0.3,
      anxious: 0.2,
      calm: 0.9,
      excited: 0.5,
      frustrated: 0.1,
      neutral: 0.8
    },
    interestTags: ["visual", "reading", "quiet", "structured"]
  },
  {
    id: 2,
    title: "Role-Playing Games",
    category: "social",
    description: "Practice social interactions through role-playing different scenarios like greetings, sharing, or asking for help.",
    duration: "20-30 minutes",
    difficulty: "medium",
    materials: ["Props (optional)", "Scenario cards"],
    benefits: ["Social confidence", "Conversation skills", "Problem-solving"],
    ageRange: "5-14 years",
    icon: "🎭",
    costLevel: "low",
    socialRequirement: "high",
    emotionMapping: {
      happy: 0.8,
      sad: 0.4,
      anxious: 0.3,
      calm: 0.7,
      excited: 0.9,
      frustrated: 0.2,
      neutral: 0.7
    },
    interestTags: ["play-based", "movement", "structured"]
  },
  {
    id: 3,
    title: "Group Circle Time",
    category: "social",
    description: "Participate in structured group activities focusing on turn-taking, listening, and sharing.",
    duration: "15-25 minutes",
    difficulty: "medium",
    materials: ["Circle time props", "Visual schedule"],
    benefits: ["Group interaction", "Turn-taking", "Active listening"],
    ageRange: "4-10 years",
    icon: "⭕",
    costLevel: "free",
    socialRequirement: "high",
    emotionMapping: {
      happy: 0.9,
      sad: 0.3,
      anxious: 0.2,
      calm: 0.8,
      excited: 0.7,
      frustrated: 0.1,
      neutral: 0.8
    },
    interestTags: ["visual", "structured", "group"]
  },
  {
    id: 4,
    title: "Peer Buddy System",
    category: "social",
    description: "Pair with a peer buddy for structured play and social interaction activities.",
    duration: "30-45 minutes",
    difficulty: "medium",
    materials: ["Activity materials", "Visual supports"],
    benefits: ["Peer relationships", "Social modeling", "Friendship skills"],
    ageRange: "6-16 years",
    icon: "👫",
    costLevel: "free",
    socialRequirement: "high",
    emotionMapping: {
      happy: 0.9,
      sad: 0.5,
      anxious: 0.3,
      calm: 0.8,
      excited: 0.8,
      frustrated: 0.2,
      neutral: 0.7
    },
    interestTags: ["play-based", "group", "structured"]
  },
  
  // Behavioral Activities
  {
    id: 5,
    title: "Visual Schedule Routine",
    category: "behavioral",
    description: "Use visual schedules to establish predictable routines and reduce anxiety.",
    duration: "Ongoing",
    difficulty: "easy",
    materials: ["Visual schedule board", "Picture cards"],
    benefits: ["Routine establishment", "Anxiety reduction", "Independence"],
    ageRange: "3-12 years",
    icon: "📅",
    costLevel: "low",
    socialRequirement: "none",
    emotionMapping: {
      happy: 0.6,
      sad: 0.4,
      anxious: 0.9,
      calm: 0.8,
      excited: 0.3,
      frustrated: 0.7,
      neutral: 0.9
    },
    interestTags: ["visual", "structured", "quiet"]
  },
  {
    id: 6,
    title: "Calm Down Corner",
    category: "behavioral",
    description: "Create and use a designated safe space with calming tools for emotional regulation.",
    duration: "5-15 minutes",
    difficulty: "easy",
    materials: ["Soft seating", "Sensory tools", "Calming visuals"],
    benefits: ["Self-regulation", "Emotional awareness", "Coping strategies"],
    ageRange: "4-16 years",
    icon: "🧘",
    costLevel: "medium",
    socialRequirement: "none",
    emotionMapping: {
      happy: 0.3,
      sad: 0.8,
      anxious: 0.9,
      calm: 0.7,
      excited: 0.2,
      frustrated: 0.9,
      neutral: 0.6
    },
    interestTags: ["sensory", "quiet", "visual"]
  },
  {
    id: 7,
    title: "Token Reward System",
    category: "behavioral",
    description: "Implement a visual token system to reinforce positive behaviors and track progress.",
    duration: "Ongoing",
    difficulty: "easy",
    materials: ["Token board", "Tokens", "Reward chart"],
    benefits: ["Positive reinforcement", "Behavior tracking", "Motivation"],
    ageRange: "4-14 years",
    icon: "⭐",
    costLevel: "low",
    socialRequirement: "none",
    emotionMapping: {
      happy: 0.8,
      sad: 0.5,
      anxious: 0.4,
      calm: 0.9,
      excited: 0.7,
      frustrated: 0.6,
      neutral: 0.8
    },
    interestTags: ["visual", "structured"]
  },
  {
    id: 8,
    title: "Sensory Break Activities",
    category: "behavioral",
    description: "Engage in structured sensory activities to help regulate sensory needs and behaviors.",
    duration: "10-20 minutes",
    difficulty: "easy",
    materials: ["Sensory tools", "Movement equipment"],
    benefits: ["Sensory regulation", "Focus improvement", "Stress reduction"],
    ageRange: "3-16 years",
    icon: "🎨",
    costLevel: "medium",
    socialRequirement: "none",
    emotionMapping: {
      happy: 0.7,
      sad: 0.6,
      anxious: 0.8,
      calm: 0.8,
      excited: 0.6,
      frustrated: 0.8,
      neutral: 0.7
    },
    interestTags: ["sensory", "movement", "hands-on"]
  },
  {
    id: 9,
    title: "First-Then Board",
    category: "behavioral",
    description: "Use visual first-then boards to help understand task sequences and expectations.",
    duration: "5-10 minutes",
    difficulty: "easy",
    materials: ["First-then board", "Picture cards"],
    benefits: ["Task completion", "Transition support", "Understanding expectations"],
    ageRange: "3-10 years",
    icon: "✅",
    costLevel: "low",
    socialRequirement: "none",
    emotionMapping: {
      happy: 0.6,
      sad: 0.4,
      anxious: 0.8,
      calm: 0.9,
      excited: 0.3,
      frustrated: 0.7,
      neutral: 0.9
    },
    interestTags: ["visual", "structured"]
  },
  
  // Emotional Activities
  {
    id: 10,
    title: "Emotion Identification Cards",
    category: "emotional",
    description: "Practice identifying and labeling different emotions using visual cards and facial expressions.",
    duration: "10-15 minutes",
    difficulty: "easy",
    materials: ["Emotion cards", "Mirror"],
    benefits: ["Emotion recognition", "Self-awareness", "Vocabulary development"],
    ageRange: "4-12 years",
    icon: "😊",
    costLevel: "low",
    socialRequirement: "low",
    emotionMapping: {
      happy: 0.8,
      sad: 0.7,
      anxious: 0.6,
      calm: 0.9,
      excited: 0.7,
      frustrated: 0.6,
      neutral: 0.9
    },
    interestTags: ["visual", "structured", "quiet"]
  },
  {
    id: 11,
    title: "Feelings Journal",
    category: "emotional",
    description: "Create a daily journal to express feelings through drawing, writing, or pictures.",
    duration: "10-20 minutes",
    difficulty: "medium",
    materials: ["Journal", "Art supplies"],
    benefits: ["Emotional expression", "Self-reflection", "Communication"],
    ageRange: "6-16 years",
    icon: "📖",
    costLevel: "low",
    socialRequirement: "none",
    emotionMapping: {
      happy: 0.7,
      sad: 0.9,
      anxious: 0.7,
      calm: 0.8,
      excited: 0.6,
      frustrated: 0.8,
      neutral: 0.7
    },
    interestTags: ["visual", "artistic", "quiet", "writing"]
  },
  {
    id: 12,
    title: "Mindfulness Breathing",
    category: "emotional",
    description: "Practice simple breathing exercises and mindfulness techniques for emotional regulation.",
    duration: "5-10 minutes",
    difficulty: "easy",
    materials: ["Breathing visual guide", "Quiet space"],
    benefits: ["Stress reduction", "Emotional regulation", "Focus"],
    ageRange: "5-16 years",
    icon: "🌬️",
    costLevel: "free",
    socialRequirement: "none",
    emotionMapping: {
      happy: 0.5,
      sad: 0.8,
      anxious: 0.9,
      calm: 0.7,
      excited: 0.3,
      frustrated: 0.9,
      neutral: 0.8
    },
    interestTags: ["quiet", "structured"]
  },
  {
    id: 13,
    title: "Empathy Building Stories",
    category: "emotional",
    description: "Read and discuss stories that help understand others' feelings and perspectives.",
    duration: "15-25 minutes",
    difficulty: "medium",
    materials: ["Story books", "Discussion prompts"],
    benefits: ["Empathy development", "Perspective-taking", "Social understanding"],
    ageRange: "5-14 years",
    icon: "💙",
    costLevel: "low",
    socialRequirement: "low",
    emotionMapping: {
      happy: 0.8,
      sad: 0.6,
      anxious: 0.4,
      calm: 0.9,
      excited: 0.5,
      frustrated: 0.3,
      neutral: 0.8
    },
    interestTags: ["reading", "quiet", "structured"]
  },
  {
    id: 14,
    title: "Emotion Thermometer",
    category: "emotional",
    description: "Use a visual emotion thermometer to identify and communicate emotional intensity levels.",
    duration: "5-10 minutes",
    difficulty: "easy",
    materials: ["Emotion thermometer chart", "Markers"],
    benefits: ["Emotional awareness", "Communication", "Self-regulation"],
    ageRange: "5-14 years",
    icon: "🌡️",
    costLevel: "free",
    socialRequirement: "none",
    emotionMapping: {
      happy: 0.7,
      sad: 0.8,
      anxious: 0.7,
      calm: 0.8,
      excited: 0.6,
      frustrated: 0.8,
      neutral: 0.9
    },
    interestTags: ["visual", "structured"]
  },
  {
    id: 15,
    title: "Art Therapy Expression",
    category: "emotional",
    description: "Express emotions through various art activities like drawing, painting, or sculpting.",
    duration: "20-40 minutes",
    difficulty: "medium",
    materials: ["Art supplies", "Paper/canvas"],
    benefits: ["Emotional expression", "Creativity", "Stress relief"],
    ageRange: "4-16 years",
    icon: "🎨",
    costLevel: "medium",
    socialRequirement: "none",
    emotionMapping: {
      happy: 0.8,
      sad: 0.9,
      anxious: 0.7,
      calm: 0.8,
      excited: 0.8,
      frustrated: 0.9,
      neutral: 0.7
    },
    interestTags: ["artistic", "hands-on", "visual", "creative"]
  }
];

const SENSORY_KEYWORD_RE =
  /\bsensory\b|\bsensory[- ]?(break|activity|activities|tool|tools|tray|input|processing|exploration|regulation)\b/i;

function activityTextForFilter(activity) {
  const parts = [
    activity?.title,
    activity?.description,
    activity?.recommendedReason,
    ...(Array.isArray(activity?.materials) ? activity.materials : []),
    ...(Array.isArray(activity?.benefits) ? activity.benefits : []),
    ...(Array.isArray(activity?.interestTags) ? activity.interestTags : [])
  ];
  return parts.join(' ').toLowerCase();
}

function isSensoryActivity(activity) {
  if (!activity || typeof activity !== 'object') return false;
  return SENSORY_KEYWORD_RE.test(activityTextForFilter(activity));
}

function filterNonSensoryActivities(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((activity) => !isSensoryActivity(activity));
}

// Emotion label harmonization
// Internal canonical labels used in recommendation engine: happy, sad, anxious, calm, excited, frustrated, neutral
// Dataset model labels: Natural, anger, fear, joy, sadness, surprise
// Mapping dataset -> internal
const datasetToInternalMap = {
  'Natural': 'calm',
  'anger': 'frustrated',
  'fear': 'anxious',
  'joy': 'happy',
  'sadness': 'sad',
  'surprise': 'excited'
};
const internalToDatasetMap = Object.fromEntries(Object.entries(datasetToInternalMap).map(([k,v]) => [v,k]));
const acceptedEmotions = new Set([
  'happy','sad','anxious','calm','excited','frustrated','neutral','uncertain', // internal
  'Natural','anger','fear','joy','sadness','surprise', // dataset
  'Uncertain','uncertain' // UI uncertain state
]);
function normalizeEmotion(label) {
  if (!label) return 'Natural';
  const trimmed = String(label).trim();
  if (!trimmed) return 'Natural';
  // Handle uncertain (any case) as distinct state
  if (trimmed.toLowerCase() === 'uncertain') return 'Uncertain';
  // Only allow dataset/model labels
  const datasetLabels = ['Natural','anger','fear','joy','sadness','surprise'];
  if (datasetLabels.includes(trimmed)) return trimmed;
  // Fallback: try case-insensitive match
  const found = datasetLabels.find(l => l.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;
  return 'Natural'; // fallback to a safe default
}

// Enhanced child profiles with all 5 factors
const childProfiles = [
  {
    id: 1,
    name: "Alex",
    age: 7,
    needs: {
      social: "high",
      behavioral: "medium",
      emotional: "high"
    },
    preferences: ["visual", "structured", "quiet"],
    strengths: ["artistic", "detail-oriented"],
    challenges: ["social interactions", "emotional regulation"],
    socialStatus: "medium",
    financialStatus: "medium",
    autismDetails: {
      severity: 2,
      type: "ASD-2",
      specificNeeds: ["communication", "sensory processing"]
    },
    interests: ["visual", "artistic", "reading", "quiet", "structured"],
    currentEmotion: "calm",
    emotionHistory: []
  },
  {
    id: 2,
    name: "Sam",
    age: 9,
    needs: {
      social: "medium",
      behavioral: "high",
      emotional: "medium"
    },
    preferences: ["movement", "hands-on", "music"],
    strengths: ["physical activity", "rhythm"],
    challenges: ["routine transitions", "impulse control"],
    socialStatus: "high",
    financialStatus: "high",
    autismDetails: {
      severity: 3,
      type: "ASD-2",
      specificNeeds: ["behavior regulation", "attention"]
    },
    interests: ["movement", "music", "hands-on", "play-based"],
    currentEmotion: "happy",
    emotionHistory: []
  },
  {
    id: 3,
    name: "Jordan",
    age: 5,
    needs: {
      social: "high",
      behavioral: "high",
      emotional: "high"
    },
    preferences: ["sensory", "play-based", "visual"],
    strengths: ["curiosity", "imagination"],
    challenges: ["communication", "emotional expression"],
    socialStatus: "low",
    financialStatus: "low",
    autismDetails: {
      severity: 4,
      type: "ASD-3",
      specificNeeds: ["communication", "social interaction", "sensory regulation"]
    },
    interests: ["sensory", "play-based", "visual", "movement"],
    currentEmotion: "anxious",
    emotionHistory: []
  }
];

// Enhanced Multi-Factor Recommendation Algorithm
function getRecommendations(childId, limit = 6) {
  const child = childProfiles.find(c => c.id === childId);
  if (!child) return [];

  const currentEmotion = child.currentEmotion || "neutral";
  const candidateActivities = filterNonSensoryActivities(activities);
  if (!candidateActivities.length) return [];

  // Score activities based on all 5 factors
  const scoredActivities = candidateActivities.map(activity => {
    let score = 0;
    
    // FACTOR 1: Emotion-based scoring (Weight: 15 points)
    const emotionScore = activity.emotionMapping[currentEmotion] || 0;
    score += emotionScore * 15;
    
    // FACTOR 2: Social Status matching (Weight: 10 points)
    const socialStatusMap = { low: 0, medium: 1, high: 2 };
    const socialReqMap = { none: 0, low: 1, medium: 2, high: 3 };
    const childSocialLevel = socialStatusMap[child.socialStatus] || 1;
    const activitySocialReq = socialReqMap[activity.socialRequirement] || 0;
    
    if (childSocialLevel >= activitySocialReq) {
      score += 10;
    } else {
      score += Math.max(0, 10 - (activitySocialReq - childSocialLevel) * 3);
    }
    
    // FACTOR 3: Financial/Economic Status matching (Weight: 12 points)
    const costMap = { free: 0, low: 1, medium: 2, high: 3 };
    const financialMap = { low: 0, medium: 1, high: 2 };
    const childFinancialLevel = financialMap[child.financialStatus] || 1;
    const activityCostLevel = costMap[activity.costLevel] || 0;
    
    if (childFinancialLevel >= activityCostLevel) {
      score += 12;
    } else {
      score += Math.max(0, 12 - (activityCostLevel - childFinancialLevel) * 5);
    }
    
    // FACTOR 4: Autism Details matching (Weight: 15 points)
    if (child.autismDetails.severity >= 4 && activity.difficulty === "easy") {
      score += 8;
    } else if (child.autismDetails.severity >= 3 && activity.difficulty !== "hard") {
      score += 5;
    }
    
    const needsMatch = child.autismDetails.specificNeeds.some(need =>
      activity.benefits.some(benefit => 
        benefit.toLowerCase().includes(need.toLowerCase())
      )
    );
    if (needsMatch) {
      score += 7;
    }
    
    // FACTOR 5: Interests matching (Weight: 12 points)
    const matchingInterests = activity.interestTags.filter(tag => 
      child.interests.includes(tag)
    ).length;
    if (matchingInterests > 0) {
      score += (matchingInterests / Math.max(activity.interestTags.length, child.interests.length)) * 12;
    }
    
    // EXISTING FACTORS
    const categoryNeed = child.needs[activity.category];
    if (categoryNeed === "high") score += 10;
    else if (categoryNeed === "medium") score += 5;
    
    if (activity.materials.some(m => m.toLowerCase().includes("visual")) && 
        child.preferences.includes("visual")) score += 5;
    
    if (activity.ageRange.includes(child.age.toString())) score += 3;
    
    if (activity.benefits.some(b => 
      child.challenges.some(c => b.toLowerCase().includes(c.toLowerCase().split(" ")[0]))
    )) score += 5;
    
    return { 
      ...activity, 
      score: Math.round(score * 100) / 100
    };
  });

  return scoredActivities
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...activity }) => activity);
}

function normalizeTokens(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map(v => String(v || '').trim().toLowerCase())
    .filter(Boolean);
}

function mapBudgetLevel(financialStatus) {
  const v = String(financialStatus || '').trim().toLowerCase();
  if (v === 'free') return 0;
  if (v === 'low') return 1;
  if (v === 'medium' || v === 'moderate') return 2;
  if (v === 'high') return 3;
  return 2;
}

function mapCostLevel(costLevel) {
  const v = String(costLevel || '').trim().toLowerCase();
  if (v === 'free') return 0;
  if (v === 'low') return 1;
  if (v === 'medium') return 2;
  if (v === 'high') return 3;
  return 1;
}

function mapSocialContextLevel(socialStatus) {
  const v = String(socialStatus || '').trim().toLowerCase();
  if (['alone', 'none'].includes(v)) return 0;
  if (['with-parent', 'with parent', 'with-family', 'with family', 'family', 'caregiver', 'low'].includes(v)) return 1;
  if (['medium'].includes(v)) return 2;
  if (['group', 'community', 'high'].includes(v)) return 3;
  return 1;
}

function mapSocialRequirementLevel(socialRequirement) {
  const v = String(socialRequirement || '').trim().toLowerCase();
  if (v === 'none') return 0;
  if (v === 'low') return 1;
  if (v === 'medium') return 2;
  if (v === 'high') return 3;
  return 1;
}

function toInternalEmotion(emotion) {
  const raw = String(emotion || '').trim();
  if (!raw) return 'neutral';
  if (datasetToInternalMap[raw]) return datasetToInternalMap[raw];
  const lower = raw.toLowerCase();
  if (['happy', 'sad', 'anxious', 'calm', 'excited', 'frustrated', 'neutral'].includes(lower)) {
    return lower;
  }
  return 'neutral';
}

function preferredCategoryFromEmotion(emotion) {
  const e = toInternalEmotion(emotion);
  if (['happy', 'excited'].includes(e)) return 'social';
  if (['sad', 'anxious', 'calm'].includes(e)) return 'emotional';
  if (['frustrated'].includes(e)) return 'behavioral';
  return 'behavioral';
}

function matchesAgeRange(activityAgeRange, childAge) {
  const age = Number(childAge);
  if (!Number.isFinite(age)) return true;
  const text = String(activityAgeRange || '');
  const match = text.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return true;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return true;
  return age >= min && age <= max;
}

const INTEREST_KEYWORD_MAP = {
  train: ['train', 'vehicle', 'rail'],
  cartoon: ['cartoon', 'animation', 'character'],
  music: ['music', 'rhythm', 'song', 'instrument', 'dance'],
  dance: ['dance', 'movement', 'rhythm', 'music'],
  art: ['art', 'draw', 'paint', 'creative', 'craft'],
  sports: ['sport', 'movement', 'physical', 'ball'],
  puzzles: ['puzzle', 'jigsaw', 'maze', 'riddle', 'logic'],
  outdoors: ['outdoor', 'nature', 'park', 'garden', 'trail', 'bird'],
  reading: ['reading', 'book', 'story', 'journal'],
  visual: ['visual', 'picture', 'card', 'schedule'],
  structured: ['structured', 'routine', 'schedule', 'first-then'],
  quiet: ['quiet', 'calm', 'mindful', 'breathing'],
  'play-based': ['play', 'role-play', 'pretend', 'interactive'],
  movement: ['movement', 'dance', 'physical', 'active'],
  'hands-on': ['hands-on', 'craft', 'build'],
  sensory: ['calm', 'focus', 'structured'],
  artistic: ['art', 'draw', 'paint', 'creative'],
  creative: ['creative', 'art', 'craft', 'expression'],
  writing: ['writing', 'journal', 'story', 'book'],
  'trains, cars, and vehicles': ['train', 'car', 'vehicle', 'movement'],
  dinosaurs: ['dinosaur', 'fossil', 'prehistoric', 'dino'],
  'weather and space': ['weather', 'space', 'star', 'planet', 'outdoor'],
  pets: ['pet', 'animal', 'care'],
  'birdwatching or insects': ['bird', 'insect', 'nature', 'outdoor'],
  'marine life': ['marine', 'ocean', 'fish', 'water', 'nature'],
  'drawing, painting, and art creation': ['draw', 'paint', 'art', 'creative'],
  crafting: ['craft', 'hands-on', 'create', 'build'],
  'cultural traditions': ['culture', 'family', 'story', 'social'],
  'books and stories': ['book', 'story', 'reading']
};

const INTEREST_NORMALIZATION_MAP = {
  dinosaur: 'dinosaurs',
  dinasour: 'dinosaurs',
  dinasours: 'dinosaurs',
  puzzle: 'puzzles',
  outside: 'outdoors',
  outdoor: 'outdoors',
  'out door': 'outdoors',
  'play based': 'play-based',
  'with parent': 'with-parent',
  'with family': 'with-family'
};

function getInterestKeywords(interest) {
  const raw = String(interest || '').trim().toLowerCase();
  if (!raw) return [];
  const canonical = INTEREST_NORMALIZATION_MAP[raw] || raw;
  if (INTEREST_KEYWORD_MAP[canonical]) return INTEREST_KEYWORD_MAP[canonical];
  const parts = raw.split(/[^a-z0-9]+/).filter(token => token.length >= 3);
  return parts.length ? parts : [raw];
}

function normalizeSelectedInterests(values) {
  return normalizeTokens(values).map((interest) => INTEREST_NORMALIZATION_MAP[interest] || interest);
}

function activitySearchText(activity) {
  const content = [
    activity?.title,
    activity?.description,
    ...(Array.isArray(activity?.benefits) ? activity.benefits : []),
    ...(Array.isArray(activity?.materials) ? activity.materials : []),
    ...(Array.isArray(activity?.interestTags) ? activity.interestTags : [])
  ]
    .map(v => String(v || '').toLowerCase())
    .join(' ');
  return content;
}

function toWordSet(text) {
  return new Set(
    String(text || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
}

function keywordMatchesWordSet(keyword, wordSet) {
  const parts = String(keyword || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (!parts.length) return false;
  return parts.every((part) => wordSet.has(part));
}

function getMatchedInterests(activity, selectedInterests) {
  const interests = normalizeSelectedInterests(selectedInterests);
  if (!interests.length) return [];
  const textWords = toWordSet(activitySearchText(activity));
  const tags = normalizeTokens(activity.interestTags || []);
  const tagWords = toWordSet(tags.join(' '));
  const matched = [];

  for (const interest of interests) {
    const keywords = getInterestKeywords(interest);
    const hasMatch = keywords.some((keyword) =>
      keywordMatchesWordSet(keyword, textWords) || keywordMatchesWordSet(keyword, tagWords)
    );
    if (hasMatch) matched.push(interest);
  }
  return matched;
}

function getMatchedInterestsFromCoreText(activity, selectedInterests) {
  const interests = normalizeSelectedInterests(selectedInterests);
  if (!interests.length) return [];
  const coreText = [
    activity?.title,
    activity?.description,
    ...(Array.isArray(activity?.benefits) ? activity.benefits : []),
    ...(Array.isArray(activity?.materials) ? activity.materials : [])
  ]
    .map(v => String(v || ''))
    .join(' ');
  const textWords = toWordSet(coreText);
  const matched = [];

  for (const interest of interests) {
    const keywords = getInterestKeywords(interest);
    const hasMatch = keywords.some((keyword) => keywordMatchesWordSet(keyword, textWords));
    if (hasMatch) matched.push(interest);
  }
  return matched;
}

function fitsBudget(activity, financialStatus) {
  return mapCostLevel(activity?.costLevel) <= mapBudgetLevel(financialStatus);
}

function fitsSocialContext(activity, socialStatus) {
  return mapSocialRequirementLevel(activity?.socialRequirement) <= mapSocialContextLevel(socialStatus);
}

function computeAgeRangeForChild(age) {
  const n = Number(age);
  if (!Number.isFinite(n) || n <= 0) return '4-12 years';
  const min = Math.max(3, Math.floor(n - 2));
  const max = Math.max(min + 1, Math.ceil(n + 3));
  return `${min}-${max} years`;
}

function chooseDifficultyBySeverity(severity) {
  const s = Number(severity);
  if (!Number.isFinite(s)) return 'easy';
  if (s >= 4) return 'easy';
  if (s >= 3) return 'easy';
  return 'medium';
}

function chooseCostByBudget(financialStatus) {
  const level = mapBudgetLevel(financialStatus);
  if (level <= 0) return 'free';
  if (level === 1) return 'low';
  if (level === 2) return 'medium';
  return 'high';
}

function chooseSocialRequirementByContext(socialStatus) {
  const level = mapSocialContextLevel(socialStatus);
  if (level <= 0) return 'none';
  if (level === 1) return 'low';
  if (level === 2) return 'medium';
  return 'high';
}

function buildEmotionMappingForContext(emotion) {
  const mapping = {
    happy: 0.55,
    sad: 0.55,
    anxious: 0.55,
    calm: 0.55,
    excited: 0.55,
    frustrated: 0.55,
    neutral: 0.55
  };
  const internal = toInternalEmotion(emotion);
  mapping[internal] = 0.95;
  return mapping;
}

const INTEREST_ACTIVITY_TEMPLATES = {
  puzzles: {
    title: 'Puzzle Treasure Hunt',
    category: 'behavioral',
    description:
      'Create a short puzzle hunt with picture clues and logic steps, then complete a final jigsaw or maze challenge.',
    duration: '20-30 minutes',
    materials: ['Printable puzzle clues', 'Simple jigsaw or maze sheets', 'Reward sticker'],
    benefits: ['Problem solving', 'Attention', 'Task completion'],
    tags: ['puzzles', 'logic', 'structured'],
    icon: 'puzzle'
  },
  outdoors: {
    title: 'Nature Scavenger Walk',
    category: 'social',
    description:
      'Take a guided outdoor walk to find items from a visual checklist and talk through each discovery.',
    duration: '20-35 minutes',
    materials: ['Visual scavenger checklist', 'Small collection bag', 'Water bottle'],
    benefits: ['Outdoor exploration', 'Communication', 'Flexible thinking'],
    tags: ['outdoors', 'nature', 'movement'],
    icon: 'outdoor'
  },
  dinosaurs: {
    title: 'Dinosaur Fossil Discovery',
    category: 'emotional',
    description:
      'Set up a dinosaur themed fossil dig using clue cards and discuss each find through simple story prompts.',
    duration: '25-35 minutes',
    materials: ['Toy dinosaurs or fossil cards', 'Dinosaur clue cards', 'Dinosaur picture guide'],
    benefits: ['Imaginative play', 'Structured exploration', 'Language growth'],
    tags: ['dinosaurs', 'play-based', 'structured'],
    icon: 'dinosaur'
  }
};

function toTitleCase(text) {
  return String(text || '')
    .split(/[\s\-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getInterestIconKey(interest) {
  const key = String(interest || '').toLowerCase();
  if (/(music|song|rhythm|melody)/.test(key)) return 'music';
  if (/(reading|book|story|journal|writing)/.test(key)) return 'reading';
  if (/(puzzle|logic|maze)/.test(key)) return 'puzzle';
  if (/(outdoor|nature|walk|trail)/.test(key)) return 'outdoor';
  if (/(dinosaur|fossil)/.test(key)) return 'dinosaur';
  if (/(art|draw|paint|craft|creative)/.test(key)) return 'art';
  return 'activity';
}

function buildInterestAnchorActivities(context, limit = 6) {
  const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 10);
  const selectedInterests = [...new Set(normalizeSelectedInterests(context.interests))]
    .filter((interest) => interest !== 'sensory')
    .slice(0, safeLimit);
  if (!selectedInterests.length) return [];

  const baseCost = chooseCostByBudget(context.financialStatus);
  const baseSocial = chooseSocialRequirementByContext(context.socialStatus);
  const baseDifficulty = chooseDifficultyBySeverity(context.autismProfile?.severity);
  const emotionMapping = buildEmotionMappingForContext(context.emotion);
  const ageRange = computeAgeRangeForChild(context.childAge);
  const anchors = [];
  const usedTitles = new Set();

  function addAnchor(template, primaryInterest, extraInterests = []) {
    if (anchors.length >= safeLimit) return;
    const title = String(template?.title || '').trim();
    if (!title) return;
    const key = title.toLowerCase();
    if (usedTitles.has(key)) return;
    usedTitles.add(key);

    const selectedMention = [...new Set([primaryInterest, ...extraInterests])]
      .filter((interest) => selectedInterests.includes(interest));
    anchors.push({
      id: 800000 + anchors.length,
      title,
      category: template.category || preferredCategoryFromEmotion(context.emotion),
      description: template.description || `Use a structured activity centered on ${primaryInterest}.`,
      duration: template.duration || '15-25 minutes',
      difficulty: baseDifficulty,
      materials: template.materials || ['Simple themed materials', 'Visual instruction cards'],
      benefits: template.benefits || ['Interest-based engagement', 'Communication', 'Emotional regulation'],
      ageRange,
      icon: template.icon || getInterestIconKey(primaryInterest),
      costLevel: baseCost,
      socialRequirement: baseSocial,
      emotionMapping,
      interestTags: [...new Set([primaryInterest, ...(extraInterests || []), ...(template.tags || [])])],
      recommendedReason:
        `Designed around selected interests (${selectedMention.join(', ')}) while considering ` +
        `${toInternalEmotion(context.emotion)} emotion, ${context.financialStatus} budget, and ${context.socialStatus} social setting.`
    });
  }

  for (const interest of selectedInterests) {
    const template = INTEREST_ACTIVITY_TEMPLATES[interest] || {
      title: `${toTitleCase(interest)} Focus Session`,
      category: preferredCategoryFromEmotion(context.emotion),
      description: `Use a structured activity centered on ${interest} with visual supports and short guided steps.`,
      duration: '15-25 minutes',
      materials: ['Simple themed materials', 'Visual instruction cards'],
      benefits: ['Interest-based engagement', 'Communication', 'Emotional regulation'],
      tags: [interest],
      icon: getInterestIconKey(interest)
    };
    addAnchor(template, interest);
  }

  const has = (interest) => selectedInterests.includes(interest);
  if (has('puzzles') && has('outdoors')) {
    addAnchor(
      {
        title: 'Outdoor Puzzle Trail',
        category: 'social',
        description: 'Set up puzzle clues around an outdoor space and solve each step to complete a final trail challenge.',
        duration: '25-35 minutes',
        materials: ['Puzzle clue cards', 'Outdoor checklist', 'Pencil or marker'],
        benefits: ['Problem solving', 'Outdoor engagement', 'Flexible thinking'],
        tags: ['puzzles', 'outdoors', 'nature'],
        icon: 'puzzle'
      },
      'puzzles',
      ['outdoors']
    );
  }
  if (has('outdoors') && has('dinosaurs')) {
    addAnchor(
      {
        title: 'Outdoor Dinosaur Fossil Hunt',
        category: 'social',
        description: 'Create an outdoor dinosaur fossil hunt with hidden clues and a simple discovery story at each stop.',
        duration: '25-40 minutes',
        materials: ['Dinosaur clue cards', 'Small toy fossils', 'Collection bag'],
        benefits: ['Interest engagement', 'Communication', 'Outdoor exploration'],
        tags: ['outdoors', 'dinosaurs', 'nature'],
        icon: 'dinosaur'
      },
      'outdoors',
      ['dinosaurs']
    );
  }
  if (has('puzzles') && has('dinosaurs')) {
    addAnchor(
      {
        title: 'Dinosaur Puzzle Expedition',
        category: 'behavioral',
        description: 'Solve dinosaur themed puzzles and sequence cards to complete a mini expedition mission.',
        duration: '20-30 minutes',
        materials: ['Dinosaur puzzle sheets', 'Sequence cards', 'Sticker rewards'],
        benefits: ['Planning skills', 'Attention', 'Interest-based motivation'],
        tags: ['puzzles', 'dinosaurs', 'logic'],
        icon: 'puzzle'
      },
      'puzzles',
      ['dinosaurs']
    );
  }

  let variant = 1;
  while (anchors.length < safeLimit) {
    const interest = selectedInterests[anchors.length % selectedInterests.length];
    addAnchor(
      {
        title: `${toTitleCase(interest)} Adventure ${variant}`,
        category: preferredCategoryFromEmotion(context.emotion),
        description: `Run a short guided ${interest} activity with clear steps, visuals, and structured turn-taking.`,
        duration: '15-25 minutes',
        materials: ['Themed activity cards', 'Simple props', 'Progress chart'],
        benefits: ['Interest engagement', 'Self-regulation', 'Communication'],
        tags: [interest],
        icon: getInterestIconKey(interest)
      },
      interest
    );
    variant += 1;
  }

  return anchors;
}

function getCandidatePoolForContext(context, desiredCount) {
  const safeActivities = filterNonSensoryActivities(activities);
  const minNeeded = Math.max(3, Math.min(Number(desiredCount) || 6, safeActivities.length));
  const interests = normalizeSelectedInterests(context.interests);
  const strict = safeActivities.filter(
    (activity) => fitsBudget(activity, context.financialStatus) && fitsSocialContext(activity, context.socialStatus)
  );
  const strictInterestMatches = interests.length
    ? strict.filter((activity) => getMatchedInterests(activity, interests).length > 0).length
    : strict.length;
  if (strict.length >= minNeeded && (!interests.length || strictInterestMatches > 0)) return strict;

  const budgetRelaxedMax = Math.min(3, mapBudgetLevel(context.financialStatus) + 1);
  const socialRelaxedMax = Math.min(3, mapSocialContextLevel(context.socialStatus) + 1);
  const relaxed = safeActivities.filter(
    (activity) =>
      mapCostLevel(activity?.costLevel) <= budgetRelaxedMax &&
      mapSocialRequirementLevel(activity?.socialRequirement) <= socialRelaxedMax
  );

  if (interests.length) {
    const relaxedInterestMatches = relaxed.filter(
      (activity) => getMatchedInterests(activity, interests).length > 0
    ).length;
    if (relaxedInterestMatches > strictInterestMatches) return relaxed;
  }
  if (relaxed.length >= minNeeded) return relaxed;
  return strict.length > 0 ? strict : safeActivities;
}

function scoreActivityByFormContext(activity, context) {
  const interestTokens = normalizeSelectedInterests(context.interests);
  const matchedInterests = getMatchedInterests(activity, interestTokens);
  const activityText = activitySearchText(activity);
  const specificNeeds = normalizeTokens(context.autismProfile?.specificNeeds || []);

  let score = 0;
  const budgetFits = fitsBudget(activity, context.financialStatus);
  const socialFits = fitsSocialContext(activity, context.socialStatus);
  const internalEmotion = toInternalEmotion(context.emotion);
  const emotionScore = Number(activity.emotionMapping?.[internalEmotion] || 0);
  const preferredCategory = preferredCategoryFromEmotion(context.emotion);

  const matches = {
    interests: matchedInterests,
    needs: specificNeeds.filter(need => activityText.includes(need))
  };
  score += emotionScore * 35;
  if (activity.category === preferredCategory) score += 12;

  if (interestTokens.length > 0) {
    score += matches.interests.length * 16;
    if (matches.interests.length === 0) score -= 12;
  }

  if (budgetFits) score += 18;
  else score -= (mapCostLevel(activity.costLevel) - mapBudgetLevel(context.financialStatus)) * 30;
  if (socialFits) score += 16;
  else score -= (mapSocialRequirementLevel(activity.socialRequirement) - mapSocialContextLevel(context.socialStatus)) * 24;

  const severity = Number(context.autismProfile?.severity);
  const difficulty = String(activity.difficulty || '').toLowerCase();
  if (Number.isFinite(severity)) {
    if (severity >= 4 && difficulty === 'easy') score += 8;
    else if (severity <= 2 && (difficulty === 'medium' || difficulty === 'hard')) score += 4;
    else if (severity >= 3 && difficulty !== 'hard') score += 4;
  }

  if (matches.needs.length > 0) score += Math.min(10, matches.needs.length * 5);
  if (matchesAgeRange(activity.ageRange, context.childAge)) score += 4;

  return {
    score,
    matches,
    fit: {
      budgetFits,
      socialFits,
      emotionScore
    }
  };
}

function buildReasonFromMatches(activity, context, matches, fit) {
  const reasons = [];
  if (matches.interests.length > 0) {
    reasons.push(`matches interests (${matches.interests.slice(0, 2).join(', ')})`);
  }
  if (matches.needs.length > 0) {
    reasons.push(`supports needs (${matches.needs.slice(0, 2).join(', ')})`);
  }
  if (fit?.budgetFits) {
    reasons.push(`fits the ${context.financialStatus} budget`);
  }
  if (fit?.socialFits) {
    reasons.push(`fits the ${context.socialStatus} social setting`);
  }
  if (!fit?.budgetFits && matches.interests.length > 0) {
    reasons.push(`is slightly above the ${context.financialStatus} budget but keeps interest alignment`);
  }
  if (!fit?.socialFits && matches.interests.length > 0) {
    reasons.push(`may need extra support for the ${context.socialStatus} social setting`);
  }
  const emotion = toInternalEmotion(context.emotion);
  if (Number(fit?.emotionScore || 0) >= 0.55) {
    reasons.push(`aligns with current emotion (${emotion})`);
  }
  if (reasons.length === 0) {
    return 'Matches submitted factors across emotion, interests, budget, and social setting.';
  }
  return `Recommended because it ${reasons.slice(0, 4).join(', ')}.`;
}

function selectFormAwareRecommendations(scored, context, limit) {
  const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 10);
  if (!scored.length) return [];
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const selected = [];
  const usedIds = new Set();

  const interestsProvided = normalizeSelectedInterests(context.interests).length > 0;
  if (interestsProvided) {
    const withInterestsAndConstraints = sorted.filter(
      item => item.matches.interests.length > 0 && item.fit.budgetFits && item.fit.socialFits
    );
    const minInterestCoverage = Math.min(
      withInterestsAndConstraints.length,
      Math.max(2, Math.ceil(safeLimit * 0.6))
    );
    for (const item of withInterestsAndConstraints) {
      if (selected.length >= minInterestCoverage) break;
      selected.push(item);
      usedIds.add(item.activity.id);
    }
  }

  for (const item of sorted) {
    if (selected.length >= safeLimit) break;
    if (usedIds.has(item.activity.id)) continue;
    selected.push(item);
    usedIds.add(item.activity.id);
  }

  // If strict constraints remove all interest-aligned options, include one best tradeoff item.
  if (interestsProvided) {
    const selectedInterestCount = selected.filter(item => item.matches.interests.length > 0).length;
    if (selectedInterestCount === 0) {
      const interestTradeoff = sorted.find(item => item.matches.interests.length > 0 && !usedIds.has(item.activity.id));
      if (interestTradeoff) {
        if (selected.length >= safeLimit) {
          const removed = selected.pop();
          if (removed) usedIds.delete(removed.activity.id);
        }
        selected.push(interestTradeoff);
        usedIds.add(interestTradeoff.activity.id);
      }
    }
  }

  return selected.slice(0, safeLimit);
}

function getFormAwareFallbackRecommendations(context, limit = 6) {
  const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 10);
  const interestAnchors = filterNonSensoryActivities(buildInterestAnchorActivities(context, safeLimit));
  const basePool = getCandidatePoolForContext(context, safeLimit);
  const candidatePool = filterNonSensoryActivities([...interestAnchors, ...basePool]).filter((activity, index, arr) => {
    const key = String(activity?.title || '').trim().toLowerCase();
    if (!key) return false;
    return arr.findIndex((item) => String(item?.title || '').trim().toLowerCase() === key) === index;
  });
  const scored = candidatePool
    .map(activity => {
      const { score, matches, fit } = scoreActivityByFormContext(activity, context);
      return { activity, score, matches, fit };
    })
    .sort((a, b) => b.score - a.score);

  const selected = selectFormAwareRecommendations(scored, context, safeLimit);
  return selected
    .map(({ activity, matches, fit }) => ({
      ...activity,
      recommendedReason: buildReasonFromMatches(activity, context, matches, fit)
    }));
}

function isBrokenRecommendationTitle(title) {
  const t = String(title || '').trim().toLowerCase();
  if (!t || t.length < 3) return true;
  if (/[{}\[\]]/.test(t)) return true;
  if (t.includes('":"') || t.includes('",') || t.includes('":')) return true;
  if (/^(social|behavioral|emotional)\s+activity(?:\s+\d+)?$/.test(t)) return true;
  if (/^activity(?:\s+\d+)?$/.test(t)) return true;
  if (/^(category|difficulty|duration|name|quantity|materials?|benefits?|social(requirement)?|cost(level)?|interest(tags)?)\s*["']?\s*:/.test(t)) {
    return true;
  }
  return false;
}

function shouldUseFormFallback(generated, context = null, expectedCount = null) {
  if (!Array.isArray(generated) || generated.length === 0) return true;
  if (generated.some((item) => isSensoryActivity(item))) return true;
  if (Number.isFinite(Number(expectedCount))) {
    const minAcceptable = Math.max(3, Math.ceil(Number(expectedCount) * 0.8));
    if (generated.length < minAcceptable) return true;
  }
  const brokenTitleCount = generated.filter(item => isBrokenRecommendationTitle(item?.title)).length;
  if (brokenTitleCount >= Math.ceil(generated.length / 3)) return true;

  if (!context) return false;
  const interestsProvided = normalizeSelectedInterests(context.interests).length > 0;
  const interestMatchedCount = generated.filter(
    (item) => getMatchedInterestsFromCoreText(item, context.interests).length > 0
  ).length;
  const budgetMismatchCount = generated.filter((item) => !fitsBudget(item, context.financialStatus)).length;
  const socialMismatchCount = generated.filter((item) => !fitsSocialContext(item, context.socialStatus)).length;

  if (interestsProvided) {
    const minInterestCoverage = Math.max(2, Math.ceil(generated.length * 0.6));
    if (interestMatchedCount < minInterestCoverage) return true;
  }
  if (budgetMismatchCount > Math.floor(generated.length / 2)) return true;
  if (socialMismatchCount > Math.floor(generated.length / 2)) return true;
  return false;
}

function normalizeChildFinancialStatus(financialStatus) {
  const level = mapBudgetLevel(financialStatus);
  if (level <= 1) return 'low';
  if (level === 2) return 'medium';
  return 'high';
}

function normalizeChildSocialStatus(socialStatus) {
  const level = mapSocialContextLevel(socialStatus);
  if (level <= 1) return 'low';
  if (level === 2) return 'medium';
  return 'high';
}

function deriveNeedsFromSeverity(severity) {
  const s = Number(severity);
  if (!Number.isFinite(s)) {
    return { social: 'medium', behavioral: 'medium', emotional: 'medium' };
  }
  if (s >= 4) return { social: 'high', behavioral: 'high', emotional: 'high' };
  if (s >= 3) return { social: 'medium', behavioral: 'high', emotional: 'medium' };
  return { social: 'medium', behavioral: 'medium', emotional: 'medium' };
}

function sanitizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((v) => String(v || '').trim()).filter(Boolean))];
}

// API Routes
app.get('/api/activities', (req, res) => {
  const { category } = req.query;
  if (category) {
    const filtered = activities.filter(a => a.category === category);
    return res.json(filtered);
  }
  res.json(activities);
});

app.get('/api/activities/:id', (req, res) => {
  const activity = activities.find(a => a.id === parseInt(req.params.id));
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  res.json(activity);
});

app.get('/api/children', (req, res) => {
  res.json(childProfiles);
});

app.post('/api/children', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const age = Number(req.body?.age);

  if (!name) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!Number.isFinite(age) || age < 1 || age > 18) {
    return res.status(400).json({ error: 'Age must be between 1 and 18.' });
  }

  const severityRaw = req.body?.autismDetails?.severity ?? req.body?.autismSeverity ?? 3;
  const severity = Math.max(1, Math.min(5, Number.isFinite(Number(severityRaw)) ? Number(severityRaw) : 3));
  const autismType = String(req.body?.autismDetails?.type || req.body?.autismType || 'ASD-2').trim() || 'ASD-2';
  const specificNeeds = sanitizeStringArray(req.body?.autismDetails?.specificNeeds || []);

  const interests = normalizeSelectedInterests(req.body?.interests || []);
  const preferences = interests.length > 0 ? interests.slice(0, 8) : ['visual', 'structured'];
  const socialStatus = normalizeChildSocialStatus(req.body?.socialStatus);
  const financialStatus = normalizeChildFinancialStatus(req.body?.financialStatus);

  const nextId = childProfiles.reduce((max, child) => Math.max(max, Number(child.id) || 0), 0) + 1;
  const newChild = {
    id: nextId,
    name,
    age: Math.round(age),
    needs: deriveNeedsFromSeverity(severity),
    preferences,
    strengths: sanitizeStringArray(req.body?.strengths || []),
    challenges: sanitizeStringArray(req.body?.challenges || []),
    socialStatus,
    financialStatus,
    autismDetails: {
      severity,
      type: autismType,
      specificNeeds
    },
    interests,
    currentEmotion: 'neutral',
    emotionHistory: []
  };

  childProfiles.push(newChild);
  return res.status(201).json(newChild);
});

app.get('/api/children/:id', (req, res) => {
  const child = childProfiles.find(c => c.id === parseInt(req.params.id));
  if (!child) {
    return res.status(404).json({ error: 'Child not found' });
  }
  res.json(child);
});

app.put('/api/children/:id', (req, res) => {
  const childId = parseInt(req.params.id);
  const child = childProfiles.find(c => c.id === childId);
  if (!child) {
    return res.status(404).json({ error: 'Child not found' });
  }
  
  if (req.body.currentEmotion) {
    const timestamp = new Date().toISOString();
    child.emotionHistory.push({
      emotion: req.body.currentEmotion,
      timestamp: timestamp
    });
    if (child.emotionHistory.length > 50) {
      child.emotionHistory.shift();
    }
    child.currentEmotion = req.body.currentEmotion;
  }
  
  if (req.body.socialStatus) child.socialStatus = req.body.socialStatus;
  if (req.body.financialStatus) child.financialStatus = req.body.financialStatus;
  if (req.body.autismDetails) child.autismDetails = { ...child.autismDetails, ...req.body.autismDetails };
  if (req.body.interests) child.interests = req.body.interests;
  
  res.json(child);
});

app.post('/api/emotion/:childId', async (req, res) => {
  const childId = parseInt(req.params.childId);
  const { emotion, confidence } = req.body;
  if (!emotion) {
    return res.status(400).json({ error: 'Emotion is required.' });
  }
  const normalized = normalizeEmotion(emotion);
  const validInternal = new Set(['happy','sad','anxious','calm','excited','frustrated','neutral']);
  if (!validInternal.has(normalized)) {
    return res.status(400).json({ error: 'Invalid emotion. Must be one of: happy, sad, anxious, calm, excited, frustrated, neutral OR dataset labels Natural, anger, fear, joy, sadness, surprise or Uncertain' });
  }
  
  const child = childProfiles.find(c => c.id === childId);
  if (!child) {
    return res.status(404).json({ error: 'Child not found' });
  }
  
  const timestamp = new Date().toISOString();
  child.emotionHistory.push({
    emotion: normalized,
    originalLabel: emotion,
    confidence: confidence || 1.0,
    timestamp: timestamp
  });
  
  if (child.emotionHistory.length > 50) {
    child.emotionHistory.shift();
  }
  
  child.currentEmotion = normalized;
  
  res.json({
    success: true,
    child: child,
    message: `Emotion updated to ${normalized} (original: ${emotion})`
  });
});

// NEW: Image upload endpoint for emotion recognition
app.post('/api/emotion/:childId/recognize', upload.single('image'), async (req, res) => {
  const childId = parseInt(req.params.childId);
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  
  const child = childProfiles.find(c => c.id === childId);
  if (!child) {
    return res.status(404).json({ error: 'Child not found' });
  }
  
  try {
    // Child profile recognition endpoint remains upload-based.
    const filename = req.file.originalname || 'upload.jpg';
    const prediction = await emotionService.predictEmotionFromImage(req.file.buffer, filename, 'upload');
    const normalized = normalizeEmotion(prediction.emotion);
    const confidence = prediction.confidence || 0;
    const allPreds = prediction.allPredictions || {};
    // Compute top-2 margin
    const probs = Object.values(allPreds).map(Number).filter(v => !Number.isNaN(v));
    const sorted = probs.sort((a,b) => b - a);
    const margin = sorted.length >= 2 ? (sorted[0] - sorted[1]) : confidence;

    const timestamp = new Date().toISOString();
    // Always log the result in history
    child.emotionHistory.push({
      emotion: normalized,
      originalLabel: prediction.emotion,
      confidence,
      margin,
      timestamp,
      source: 'ml_model'
    });
    if (child.emotionHistory.length > 50) {
      child.emotionHistory.shift();
    }

    // Gate updating currentEmotion on confidence and margin
    // Relaxed gating to reflect lower-confidence but correct predictions
    const MIN_CONF = 0.4;
    const MIN_MARGIN = 0.05;
    let message;
    if (confidence >= MIN_CONF && margin >= MIN_MARGIN) {
      child.currentEmotion = normalized;
      message = `Emotion recognized: ${normalized} (original: ${prediction.emotion}) (confidence: ${(confidence * 100).toFixed(2)}%)`;
    } else {
      message = `Low confidence (${(confidence * 100).toFixed(2)}%) or margin (${(margin * 100).toFixed(2)}%) — not updating profile emotion.`;
    }

    res.json({
      success: true,
      child,
      prediction: {
        emotion: normalized,
        confidence,
        margin,
        allPredictions: allPreds
      },
      message
    });
  } catch (error) {
    console.error('Error recognizing emotion:', error);
    res.status(500).json({
      error: error.message || 'Failed to recognize emotion',
      hint: 'Make sure the ML service is running on port 5000'
    });
  }
});

// NEW: Check ML service health
app.get('/api/ml-service/health', async (req, res) => {
  try {
    const isHealthy = await emotionService.checkMLServiceHealth();
    res.json({
      healthy: isHealthy,
      serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5000'
    });
  } catch (error) {
    res.json({
      healthy: false,
      error: error.message
    });
  }
});

// Compatibility endpoint: frontend expects POST /api/predict-emotion
// Accepts multipart form-data with field 'image' and forwards to ML service
app.post('/api/predict-emotion', upload.single('image'), async (req, res) => {
  // Fast-fail if ML service appears down to avoid generic network errors
  try {
    const healthy = await emotionService.checkMLServiceHealth();
    if (!healthy) {
      return res.status(503).json({
        success: false,
        error: 'ML service unavailable',
        hint: 'Start the ML service on port 5000 using ml_service/start_service_with_env.bat and ensure BEST_MODEL_PATH.txt points to a valid model.'
      });
    }
  } catch (e) {
    // Continue to normal flow; detailed errors handled below
  }

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image file provided' });
  }

  try {
    const filename = req.file.originalname || 'upload.jpg';
    const source = filename.toLowerCase() === 'camera.jpg' ? 'camera' : 'upload';
    const prediction = await emotionService.predictEmotionFromImage(req.file.buffer, filename, source);
    // Normalize to internal labels for UI; show Uncertain only when flagged
    const isUncertain = String(prediction.emotion || '').toLowerCase() === 'uncertain';
    const normalized = normalizeEmotion(prediction.emotion);

    // Build harmonized predictions.
    // Camera mode excludes "Natural" in UI, but we still inspect raw Natural score
    // for camera-only rescue rules.
    const rawDatasetLabels = ['Natural','anger','fear','joy','sadness','surprise'];
    const rawPreds = {};
    if (prediction.allPredictions) {
      for (const key of rawDatasetLabels) {
        const found = Object.prototype.hasOwnProperty.call(prediction.allPredictions, key)
          ? prediction.allPredictions[key]
          : 0;
        rawPreds[key] = Number(found || 0);
      }
    }

    // Camera breakdown excludes Natural and is normalized so bars are meaningful.
    const harmonizedPreds = source === 'camera'
      ? {
          anger: Number(rawPreds.anger || 0),
          fear: Number(rawPreds.fear || 0),
          joy: Number(rawPreds.joy || 0),
          sadness: Number(rawPreds.sadness || 0),
          surprise: Number(rawPreds.surprise || 0)
        }
      : {
          Natural: Number(rawPreds.Natural || 0),
          anger: Number(rawPreds.anger || 0),
          fear: Number(rawPreds.fear || 0),
          joy: Number(rawPreds.joy || 0),
          sadness: Number(rawPreds.sadness || 0),
          surprise: Number(rawPreds.surprise || 0)
        };

    if (source === 'camera') {
      const sum = Object.values(harmonizedPreds).reduce((acc, v) => acc + Number(v || 0), 0);
      if (sum > 0) {
        for (const k of Object.keys(harmonizedPreds)) {
          harmonizedPreds[k] = Number(harmonizedPreds[k]) / sum;
        }
      }
    }

    // Camera-only decision logic with surprise rescue.
    function decideCameraEmotionFromBreakdown(preds, naturalRaw) {
      const labels = ['anger', 'fear', 'joy', 'sadness', 'surprise'];
      const scored = labels
        .map(label => [label, Number(preds[label] || 0)])
        .sort((a, b) => b[1] - a[1]);

      let topLabel = scored[0]?.[0] || 'Uncertain';
      let topConf = Number(scored[0]?.[1] || 0);
      const secondConf = Number(scored[1]?.[1] || 0);
      let margin = topConf - secondConf;

      const CAMERA_MIN_MARGIN = Number(process.env.CAMERA_MIN_MARGIN || 0.05);
      const CAMERA_MIN_CONF_EMOTION = Number(process.env.CAMERA_MIN_CONF_EMOTION || 0.20);

      // Surprise rescue:
      // If Natural dominates in raw model output and, after removing Natural,
      // fear dominates with very low explicit surprise, treat as surprise.
      const fear = Number(preds.fear || 0);
      const joy = Number(preds.joy || 0);
      const surprise = Number(preds.surprise || 0);
      if (
        topLabel === 'fear' &&
        Number(naturalRaw || 0) >= 0.60 &&
        fear >= 0.55 &&
        surprise <= 0.12 &&
        joy >= 0.05
      ) {
        return { emotion: 'surprise', confidence: Math.max(fear, surprise), rescuedFromFear: true };
      }

      if (topConf <= 0 || topConf < CAMERA_MIN_CONF_EMOTION || margin < CAMERA_MIN_MARGIN) {
        return { emotion: 'Uncertain', confidence: topConf };
      }
      return { emotion: topLabel, confidence: topConf };
    }

    const cameraDecision = source === 'camera'
      ? decideCameraEmotionFromBreakdown(harmonizedPreds, rawPreds.Natural)
      : null;
    let responsePredictions = harmonizedPreds;
    if (source === 'camera' && cameraDecision?.rescuedFromFear) {
      // The model often encodes surprised faces under fear after removing Natural.
      // Keep UI breakdown consistent with the rescued headline label.
      responsePredictions = { ...harmonizedPreds };
      const rescuedSurprise = Number(harmonizedPreds.fear || 0);
      const priorSurprise = Number(harmonizedPreds.surprise || 0);
      responsePredictions.surprise = rescuedSurprise;
      responsePredictions.fear = priorSurprise;
    }
    const finalEmotion = source === 'camera'
      ? cameraDecision.emotion
      : (isUncertain ? 'Uncertain' : normalized);
    const finalConfidence = source === 'camera'
      ? cameraDecision.confidence
      : prediction.confidence;

    return res.json({
      success: true,
      emotion: finalEmotion,
      original_emotion: prediction.emotion,
      confidence: finalConfidence,
      all_predictions: responsePredictions
    });
  } catch (error) {
    console.error('Error in /api/predict-emotion:', error.message || error);
    // If ML service not reachable, return helpful hint
    const msg = error.message || 'Prediction failed';
    // Map common connectivity/timeouts for clearer UI messaging
    if (error.code === 'ECONNREFUSED' || msg.toLowerCase().includes('connect') || msg.toLowerCase().includes('timeout')) {
      return res.status(503).json({
        success: false,
        error: 'Cannot reach ML service',
        hint: 'Ensure ML is running on http://127.0.0.1:7004 and not blocked by firewall. Try running ml_service/start_service_with_env.bat.'
      });
    }
    return res.status(500).json({ success: false, error: msg });
  }
});

app.get('/api/emotion/:childId/history', (req, res) => {
  const childId = parseInt(req.params.childId);
  const child = childProfiles.find(c => c.id === childId);
  if (!child) {
    return res.status(404).json({ error: 'Child not found' });
  }
  res.json(child.emotionHistory);
});

// POST endpoint for fully dynamic LLM-generated recommendations (Ollama)
app.post('/api/recommendations/:childId', async (req, res) => {
  const childId = parseInt(req.params.childId);
  const child = childProfiles.find(c => c.id === childId);
  
  if (!child) {
    return res.status(404).json({ error: 'Child not found' });
  }
  
  // Extract factors from request body or use child profile defaults
  const emotion = req.body.emotion || child.currentEmotion || 'Natural';
  const interests = Array.isArray(req.body.interests) ? req.body.interests : (child.interests || []);
  const financialStatus = req.body.financialStatus || child.financialStatus || 'medium';
  const socialStatus = req.body.socialStatus || child.socialStatus || 'alone';
  const autismSeverityRaw = req.body.autismProfile?.severity ?? child.autismDetails?.severity ?? 3;
  const autismSeverity = Number.isFinite(Number(autismSeverityRaw)) ? Number(autismSeverityRaw) : 3;
  const autismType = req.body.autismProfile?.type || child.autismDetails?.type || 'ASD-2';
  const autismSpecificNeeds = Array.isArray(req.body.autismProfile?.specificNeeds)
    ? req.body.autismProfile.specificNeeds
    : (Array.isArray(child.autismDetails?.specificNeeds) ? child.autismDetails.specificNeeds : []);

  const recommendationContext = {
    childName: child.name,
    childAge: child.age,
    emotion,
    interests,
    financialStatus,
    socialStatus,
    autismProfile: {
      severity: autismSeverity,
      type: autismType,
      specificNeeds: autismSpecificNeeds
    }
  };

  const topKRaw = req.body.top_k ?? req.body.topK ?? 6;
  const topK = Math.min(Math.max(Number(topKRaw) || 6, 1), 10);

  // Generate with Ollama first, then quality-gate and fall back to deterministic form-aware scoring when needed.
  try {
    const generated = filterNonSensoryActivities(
      await ollamaService.generateRecommendations(recommendationContext, topK)
    );
    if (shouldUseFormFallback(generated, recommendationContext, topK)) {
      const fallbackRecommendations = filterNonSensoryActivities(
        getFormAwareFallbackRecommendations(recommendationContext, topK)
      );
      return res.json(fallbackRecommendations);
    }
    return res.json(generated.slice(0, topK));
  } catch (error) {
    console.warn('Ollama recommendation failed:', error.message || error);
    const fallbackRecommendations = filterNonSensoryActivities(
      getFormAwareFallbackRecommendations(recommendationContext, topK)
    );
    if (fallbackRecommendations.length > 0) {
      return res.json(fallbackRecommendations);
    }
    return res.status(503).json({
      error: 'Failed to generate recommendations with Ollama.',
      detail: error.message || 'Unknown Ollama error',
      hint: 'Start Ollama and install a model (for example: ollama pull llama3.1:8b).'
    });
  }
});

app.get('/api/recommendations/:childId', (req, res) => {
  const childId = parseInt(req.params.childId);
  const limit = parseInt(req.query.limit) || 6;
  const recommendations = getRecommendations(childId, limit);
  res.json(recommendations);
});

app.get('/api/categories', (req, res) => {
  const categories = [...new Set(activities.map(a => a.category))];
  res.json(categories);
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
  console.log(`${activities.length} activities loaded`);
  console.log(`${childProfiles.length} child profiles available`);
  console.log(`Multi-factor recommendation system active`);
});
