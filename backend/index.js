const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Sample activities database
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
    icon: "📚"
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
    icon: "🎭"
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
    icon: "⭕"
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
    icon: "👫"
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
    icon: "📅"
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
    icon: "🧘"
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
    icon: "⭐"
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
    icon: "🎨"
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
    icon: "✅"
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
    icon: "😊"
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
    icon: "📖"
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
    icon: "🌬️"
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
    icon: "💙"
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
    icon: "🌡️"
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
    icon: "🎨"
  }
];

// Sample child profiles
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
    challenges: ["social interactions", "emotional regulation"]
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
    challenges: ["routine transitions", "impulse control"]
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
    challenges: ["communication", "emotional expression"]
  }
];

// Recommendation algorithm
function getRecommendations(childId, limit = 6) {
  const child = childProfiles.find(c => c.id === childId);
  if (!child) return [];

  // Score activities based on child's needs and preferences
  const scoredActivities = activities.map(activity => {
    let score = 0;
    
    // Match category needs
    const categoryNeed = child.needs[activity.category];
    if (categoryNeed === "high") score += 10;
    else if (categoryNeed === "medium") score += 5;
    
    // Match preferences
    if (activity.materials.some(m => m.toLowerCase().includes("visual")) && 
        child.preferences.includes("visual")) score += 5;
    if (activity.difficulty === "easy" && child.challenges.length > 2) score += 3;
    if (activity.ageRange.includes(child.age.toString())) score += 3;
    
    // Boost activities that address specific challenges
    if (activity.benefits.some(b => 
      child.challenges.some(c => b.toLowerCase().includes(c.toLowerCase().split(" ")[0]))
    )) score += 5;
    
    return { ...activity, score };
  });

  // Sort by score and return top recommendations
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
});
