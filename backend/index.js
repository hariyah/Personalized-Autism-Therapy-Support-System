const express = require('express');
const cors = require('cors');
const multer = require('multer');
const emotionService = require('./emotionService');
const app = express();
const port = 3001;

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
  if (!label) return 'neutral';
  const trimmed = String(label).trim();
  if (!trimmed) return 'neutral';
  // Handle uncertain (any case) as distinct state
  if (trimmed.toLowerCase() === 'uncertain') return 'uncertain';
  // Direct dataset mapping (case-sensitive in keys), try fallback case-insensitive
  if (datasetToInternalMap[trimmed]) return datasetToInternalMap[trimmed];
  const lower = trimmed.toLowerCase();
  const ciMap = {
    'natural': 'calm',
    'anger': 'frustrated',
    'fear': 'anxious',
    'joy': 'happy',
    'sadness': 'sad',
    'surprise': 'excited'
  };
  if (ciMap[lower]) return ciMap[lower];
  return trimmed; // assume already internal or neutral
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

  // Score activities based on all 5 factors
  const scoredActivities = activities.map(activity => {
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
    // Call ML service to predict emotion
    const prediction = await emotionService.predictEmotionFromImage(req.file.buffer, 'file');
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
    const MIN_CONF = 0.5;
    const MIN_MARGIN = 0.1;
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
    const prediction = await emotionService.predictEmotionFromImage(req.file.buffer, 'file');
    // Normalize to internal labels for UI; show Uncertain only when flagged
    const isUncertain = String(prediction.emotion || '').toLowerCase() === 'uncertain';
    const normalized = normalizeEmotion(prediction.emotion);

    // Build harmonized predictions using dataset labels for charts
    const datasetLabels = ['Natural','anger','fear','joy','sadness','surprise'];
    const harmonizedPreds = {};
    if (prediction.allPredictions) {
      for (const key of datasetLabels) {
        const found = Object.prototype.hasOwnProperty.call(prediction.allPredictions, key)
          ? prediction.allPredictions[key]
          : 0;
        harmonizedPreds[key] = found;
      }
    }

    return res.json({
      success: true,
      emotion: isUncertain ? 'Uncertain' : normalized,
      original_emotion: prediction.emotion,
      confidence: prediction.confidence,
      all_predictions: harmonizedPreds
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
        hint: 'Ensure ML is running on http://127.0.0.1:5000 and not blocked by firewall. Try running ml_service/start_service_with_env.bat.'
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
  console.log(`🚀 Backend server running at http://localhost:${port}`);
  console.log(`📊 ${activities.length} activities loaded`);
  console.log(`👶 ${childProfiles.length} child profiles available`);
  console.log(`✨ Multi-factor recommendation system active`);
});
