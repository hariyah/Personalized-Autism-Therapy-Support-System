const axios = require('axios');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);
const OLLAMA_TAGS_TIMEOUT_MS = Number(process.env.OLLAMA_TAGS_TIMEOUT_MS || 3500);
const PREFERRED_MODELS = [
  process.env.OLLAMA_MODEL,
  'tinyllama:latest',
  'llama3.1:8b',
  'llama3.2:3b',
  'qwen2.5:7b',
  'mistral:7b',
  'phi3:mini'
].filter(Boolean);

const VALID_CATEGORIES = new Set(['social', 'behavioral', 'emotional']);
const VALID_DIFFICULTY = new Set(['easy', 'medium', 'hard']);
const VALID_COST = new Set(['free', 'low', 'medium', 'high']);
const VALID_SOCIAL_REQUIREMENT = new Set(['none', 'low', 'medium', 'high']);
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

function cleanText(value, fallback = '', maxLen = 240) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  return text.slice(0, maxLen);
}

function cleanList(value, fallback = [], maxItems = 8, itemMaxLen = 64) {
  if (!Array.isArray(value)) return fallback;
  const out = value
    .map((item) => {
      if (typeof item === 'string') return cleanText(item, '', itemMaxLen);
      if (item && typeof item === 'object') {
        const named = item.name || item.label || item.title || item.value || '';
        return cleanText(named, '', itemMaxLen);
      }
      return cleanText(item, '', itemMaxLen);
    })
    .filter(Boolean)
    .slice(0, maxItems);
  return out.length ? out : fallback;
}

function normalizeEnum(value, validSet, fallback) {
  const text = cleanText(value).toLowerCase();
  const synonyms = {
    moderate: 'medium',
    difficult: 'hard',
    advanced: 'hard',
    beginner: 'easy',
    no: 'none',
    minimal: 'low',
    basic: 'low',
    affordable: 'low',
    expensive: 'high'
  };
  const normalized = synonyms[text] || text;
  if (validSet.has(normalized)) return normalized;
  if (validSet.has(text)) return text;
  return fallback;
}

function mapSocialRequirement(status) {
  const v = cleanText(status).toLowerCase();
  if (['alone', 'none'].includes(v)) return 'none';
  if (['with-parent', 'with parent', 'with-family', 'with family', 'family', 'caregiver', 'low'].includes(v)) return 'low';
  if (['group', 'community', 'high'].includes(v)) return 'high';
  if (['medium'].includes(v)) return 'medium';
  return 'low';
}

function mapCostLevel(financialStatus) {
  const v = cleanText(financialStatus).toLowerCase();
  if (v === 'moderate') return 'medium';
  if (VALID_COST.has(v)) return v;
  if (v === 'low') return 'low';
  if (v === 'medium') return 'medium';
  if (v === 'high') return 'high';
  return 'low';
}

function normalizeCategory(value) {
  const raw = cleanText(value).toLowerCase();
  if (VALID_CATEGORIES.has(raw)) return raw;
  if (raw.includes('social') || raw.includes('peer') || raw.includes('group')) return 'social';
  if (raw.includes('behavior') || raw.includes('sensory') || raw.includes('routine') || raw.includes('focus')) return 'behavioral';
  if (raw.includes('emotion') || raw.includes('feeling') || raw.includes('mindful') || raw.includes('calm')) return 'emotional';
  return 'emotional';
}

function normalizeContextTokens(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => cleanText(value).toLowerCase())
    .filter(Boolean);
}

function includesAnyKeyword(values, keywords) {
  return values.some((value) => keywords.some((keyword) => value.includes(keyword)));
}

function getContextSignals(context) {
  const interests = normalizeContextTokens(context.interests);
  const socialStatus = cleanText(context.socialStatus).toLowerCase();
  const emotion = cleanText(context.emotion).toLowerCase();

  const hasMusicInterest = includesAnyKeyword(interests, ['music', 'rhythm', 'song', 'instrument', 'dance']);
  const hasOutdoorInterest = includesAnyKeyword(interests, ['outdoor', 'nature', 'park', 'garden', 'trail', 'birdwatch']);
  const withFamilySetting = ['with-family', 'with family', 'family', 'with-parent', 'with parent', 'parent', 'caregiver']
    .some((keyword) => socialStatus.includes(keyword));
  const surpriseEmotion = ['surprise', 'excited'].includes(emotion);

  return {
    interests,
    socialStatus,
    emotion,
    hasMusicInterest,
    hasOutdoorInterest,
    withFamilySetting,
    surpriseEmotion
  };
}

function buildContextGuidance(context) {
  const signals = getContextSignals(context);
  const guidance = [
    'Make every activity specific and practical. Avoid generic placeholders.',
    'Do not use titles like "Child Activity", "Surprise Activity", or similar templates.',
    'Do not propose sensory activities, sensory breaks, or sensory regulation tasks.'
  ];

  if (signals.surpriseEmotion) {
    guidance.push('Since the child feels surprise, combine grounding with positive discovery.');
  }
  if (signals.hasMusicInterest) {
    guidance.push('At least half of activities should use music, rhythm, singing, or instruments.');
  }
  if (signals.hasOutdoorInterest) {
    guidance.push('At least half of activities should include outdoor or nature exploration where possible.');
  }
  if (signals.withFamilySetting) {
    guidance.push('At least two activities should explicitly involve family participation.');
  }
  if (signals.surpriseEmotion && signals.hasMusicInterest && signals.hasOutdoorInterest && signals.withFamilySetting) {
    guidance.push(
      'Strongly align with this pattern: Outdoor Nature Walk with Music, Music and Movement Session, ' +
      'Nature Observation with Music and Reflection, Interactive Music Session, Surprise Nature Picnic, ' +
      'Family Musical Jam Session, Interactive Musical Nature Scavenger Hunt.'
    );
  }

  return guidance;
}

function matchesSurpriseMusicOutdoorsFamilyProfile(context) {
  const signals = getContextSignals(context);
  return signals.surpriseEmotion && signals.hasMusicInterest && signals.hasOutdoorInterest && signals.withFamilySetting;
}

function buildSurpriseMusicOutdoorsFamilyActivities(context) {
  const childName = cleanText(context.childName, 'The child', 50);
  const childRef = childName || 'The child';

  return [
    {
      title: 'Outdoor Nature Walk with Music',
      category: 'emotional',
      description:
        'Take a walk in a nearby park while listening to calming or favorite songs and pause to notice trees, wind, and birds.',
      recommendedReason:
        `Helps ${childRef} feel grounded after surprise by combining movement, nature, and familiar music.`,
      duration: '20-30 minutes',
      difficulty: 'easy',
      materials: ['Portable speaker or headphones', 'Water bottle', 'Comfortable shoes'],
      benefits: ['Emotional regulation', 'Calm focus', 'Physical movement'],
      socialRequirement: 'low',
      costLevel: 'free',
      interestTags: ['music', 'outdoors', 'nature']
    },
    {
      title: 'Music and Movement Session',
      category: 'behavioral',
      description:
        'Play upbeat songs and guide simple dance steps, clapping rhythms, or drumming patterns in the living room or yard.',
      recommendedReason:
        `Lets ${childRef} channel surprise into safe body movement while practicing rhythm and emotional release.`,
      duration: '15-20 minutes',
      difficulty: 'easy',
      materials: ['Music player', 'Open movement space', 'Simple rhythm instruments'],
      benefits: ['Self-regulation', 'Motor planning', 'Emotional expression'],
      socialRequirement: 'low',
      costLevel: 'free',
      interestTags: ['music', 'movement']
    },
    {
      title: 'Nature Observation with Music and Reflection',
      category: 'emotional',
      description:
        'Sit or lie on grass while listening to calm instrumental tracks and noticing colors, sounds, and movement in nature.',
      recommendedReason:
        `Supports calm focus for ${childRef} by pairing soothing music with guided outdoor observation.`,
      duration: '10-20 minutes',
      difficulty: 'easy',
      materials: ['Blanket', 'Soft instrumental playlist'],
      benefits: ['Calm attention', 'Emotional balance', 'Observation skills'],
      socialRequirement: 'none',
      costLevel: 'free',
      interestTags: ['music', 'nature', 'mindfulness']
    },
    {
      title: 'Interactive Music Session',
      category: 'behavioral',
      description:
        'Use a keyboard, hand drum, or household objects to improvise sounds, copy rhythms, and take turns creating short songs.',
      recommendedReason:
        `Gives ${childRef} an active way to process surprise through creative control, predictability, and fun.`,
      duration: '15-25 minutes',
      difficulty: 'easy',
      materials: ['Simple instruments or household objects'],
      benefits: ['Creative expression', 'Turn-taking', 'Confidence building'],
      socialRequirement: 'low',
      costLevel: 'low',
      interestTags: ['music', 'hands-on']
    },
    {
      title: 'Surprise Nature Picnic Adventure',
      category: 'social',
      description:
        'Plan an impromptu family picnic in a park with a small positive surprise such as a favorite snack or discovery activity.',
      recommendedReason:
        `Reframes surprise into a positive shared experience and strengthens family connection for ${childRef}.`,
      duration: '30-45 minutes',
      difficulty: 'easy',
      materials: ['Picnic mat', 'Snacks', 'Outdoor activity item'],
      benefits: ['Positive surprise tolerance', 'Family bonding', 'Flexible thinking'],
      socialRequirement: 'high',
      costLevel: 'low',
      interestTags: ['outdoors', 'family']
    },
    {
      title: 'Family Musical Jam Session',
      category: 'social',
      description:
        'Invite family members to play rhythms together using instruments or home objects, then rotate who leads the next pattern.',
      recommendedReason:
        `Builds social communication and emotional support as ${childRef} participates in shared music with family.`,
      duration: '20-30 minutes',
      difficulty: 'easy',
      materials: ['Simple instruments', 'Household percussion items'],
      benefits: ['Family interaction', 'Communication', 'Joint attention'],
      socialRequirement: 'high',
      costLevel: 'free',
      interestTags: ['music', 'family']
    },
    {
      title: 'Musical Nature Scavenger Hunt',
      category: 'social',
      description:
        'Create an outdoor scavenger hunt for leaves, stones, and flowers, and pair each find with a matching sound, beat, or song.',
      recommendedReason:
        `Keeps surprise playful and organized for ${childRef} while blending exploration, music, and family teamwork.`,
      duration: '20-35 minutes',
      difficulty: 'medium',
      materials: ['Simple checklist', 'Basket or bag', 'Music player (optional)'],
      benefits: ['Exploration skills', 'Focus', 'Collaborative play'],
      socialRequirement: 'high',
      costLevel: 'free',
      interestTags: ['music', 'outdoors', 'family']
    }
  ];
}

function countKeywordMatches(activities, keywords) {
  return activities.filter((activity) => {
    const text = cleanText(
      `${activity?.title || ''} ${activity?.description || ''} ${activity?.recommendedReason || ''}`
    ).toLowerCase();
    return keywords.some((keyword) => text.includes(keyword));
  }).length;
}

function hasStrongSurpriseMusicOutdoorsFamilyCoverage(activities) {
  const musicKeywords = ['music', 'song', 'rhythm', 'instrument'];
  const outdoorKeywords = ['outdoor', 'nature', 'park', 'garden', 'scavenger'];
  const familyKeywords = ['family', 'parent', 'caregiver'];

  const musicCount = countKeywordMatches(activities, musicKeywords);
  const outdoorCount = countKeywordMatches(activities, outdoorKeywords);
  const familyCount = countKeywordMatches(activities, familyKeywords);

  return musicCount >= 2 && outdoorCount >= 2 && familyCount >= 1;
}

function iconForCategory(category) {
  if (category === 'social') return '👥';
  if (category === 'behavioral') return '🎯';
  return '💛';
}

function computeAgeRange(age) {
  const n = Number(age);
  if (!Number.isFinite(n) || n <= 0) return '4-12 years';
  const min = Math.max(3, Math.floor(n - 2));
  const max = Math.max(min + 1, Math.ceil(n + 3));
  return `${min}-${max} years`;
}

function extractJson(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_) {}

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch (_) {}
  }

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    } catch (_) {}
  }

  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    try {
      return JSON.parse(raw.slice(firstBracket, lastBracket + 1));
    } catch (_) {}
  }

  return null;
}

function titleKey(value) {
  return cleanText(value, '', 80)
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripLeadingLabelArtifacts(value, maxLen = 280) {
  let text = cleanText(value, '', maxLen);
  if (!text) return '';

  text = text.replace(/^[`"' ]+|[`"' ]+$/g, '').trim();

  const keyValueMatch = text.match(
    /^(?:["'`]?)(title|description|recommendedReason|recommendation)(?:["'`]?)\s*:\s*(.+)$/i
  );
  if (keyValueMatch && keyValueMatch[2]) {
    text = keyValueMatch[2].trim();
  }

  text = text.replace(/^[`"' ]+|[`"' ]+$/g, '').trim();
  text = text.replace(/^recommendations?\b\s*[:\-]?\s*/i, '').trim();

  return cleanText(text, '', maxLen);
}

function isInvalidTitle(value) {
  const title = cleanText(value, '', 120).toLowerCase();
  if (!title) return true;
  if (title.length < 3) return true;
  if (title.startsWith("child's ") || title.startsWith('child ')) return true;
  if (
    title.includes('"title"') ||
    title.includes('"category"') ||
    title.includes('"description"') ||
    title.includes('"recommendation"') ||
    title.includes('"recommendedreason"')
  ) return true;
  if (/^(social|behavioral|emotional|communication|sensory processing)\s+(surprise\s+)?activity(?:\s+\d+)?$/.test(title)) return true;
  if (/^(category|difficulty|duration|name|quantity|materials?|benefits?|social(requirement)?|cost(level)?|interest(tags)?)\s*["']?\s*:/.test(title)) return true;
  if (title.includes('":"') || title.includes('",') || title.includes('":')) return true;
  if (/^activity(?:\s+\d+)?$/.test(title) || title === 'surprise activity') return true;
  if (title.includes('{') || title.includes('}') || title.includes('[') || title.includes(']')) return true;
  if (title === 'none' || title === 'n/a' || title === 'null') return true;
  return false;
}

function sanitizeActivity(activity, index, context, forcedCategory = null) {
  const category = forcedCategory && VALID_CATEGORIES.has(forcedCategory)
    ? forcedCategory
    : normalizeCategory(activity.category);
  const fallbackTitle = `${category.charAt(0).toUpperCase() + category.slice(1)} Activity ${index + 1}`;
  const rawTitle = stripLeadingLabelArtifacts(activity.title, 80);
  const title = isInvalidTitle(rawTitle) ? fallbackTitle : rawTitle;
  const description = cleanText(
    stripLeadingLabelArtifacts(activity.description, 360),
    'A personalized autism-support activity tailored to the current profile.',
    360
  );
  const duration = cleanText(activity.duration, '15-20 minutes', 40);
  const difficulty = normalizeEnum(activity.difficulty, VALID_DIFFICULTY, 'easy');
  const ageRange = cleanText(activity.ageRange, computeAgeRange(context.childAge), 40);
  const materials = cleanList(activity.materials, ['Simple household materials'], 8, 60);
  const benefits = cleanList(activity.benefits, ['Supports emotional and behavioral growth'], 8, 80);
  const interestTags = cleanList(activity.interestTags, context.interests.slice(0, 4), 8, 40);
  const socialRequirement = normalizeEnum(
    activity.socialRequirement,
    VALID_SOCIAL_REQUIREMENT,
    mapSocialRequirement(context.socialStatus)
  );
  const costLevel = normalizeEnum(activity.costLevel, VALID_COST, mapCostLevel(context.financialStatus));
  const recommendedReason = cleanText(
    stripLeadingLabelArtifacts(activity.recommendedReason ?? activity.recommendation, 180),
    `Matches the current emotion, interests, and environment for ${cleanText(context.childName, 'the child', 40)}.`,
    220
  );

  return {
    id: Number(`${Date.now()}${index}`),
    title,
    category,
    description,
    duration,
    difficulty,
    materials,
    benefits,
    ageRange,
    icon: cleanText(activity.icon, iconForCategory(category), 4),
    costLevel,
    socialRequirement,
    interestTags,
    recommendedReason
  };
}

function getCategoryPriority(emotion) {
  const e = cleanText(emotion, '').toLowerCase();
  if (['fear', 'sadness', 'sad', 'anxious'].includes(e)) return ['emotional', 'behavioral', 'social'];
  if (['anger', 'frustrated'].includes(e)) return ['behavioral', 'emotional', 'social'];
  if (['joy', 'happy', 'surprise', 'excited'].includes(e)) return ['social', 'emotional', 'behavioral'];
  return ['social', 'behavioral', 'emotional'];
}

function buildCategoryPlan(count, emotion) {
  const safeCount = Math.min(Math.max(Number(count) || 6, 1), 10);
  const order = getCategoryPriority(emotion);
  const base = Math.floor(safeCount / 3);
  const extra = safeCount % 3;

  const quotas = {
    social: base,
    behavioral: base,
    emotional: base
  };

  for (let i = 0; i < extra; i += 1) {
    quotas[order[i]] += 1;
  }

  return order
    .map((category) => ({ category, count: quotas[category] }))
    .filter((item) => item.count > 0);
}

async function fetchInstalledModels(timeoutMs = OLLAMA_TAGS_TIMEOUT_MS) {
  const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: timeoutMs });
  const models = Array.isArray(response.data?.models) ? response.data.models : [];
  return models
    .map((m) => String(m?.name || '').trim())
    .filter(Boolean);
}

async function resolveModel() {
  if (process.env.OLLAMA_MODEL) {
    return process.env.OLLAMA_MODEL;
  }

  try {
    const modelNames = await fetchInstalledModels();

    for (const preferred of PREFERRED_MODELS) {
      if (modelNames.includes(preferred)) return preferred;
    }
    return modelNames[0] || PREFERRED_MODELS[0];
  } catch (error) {
    throw new Error(
      `Cannot connect to Ollama at ${OLLAMA_BASE_URL}. Ensure the Ollama app/service is running.`
    );
  }
}

function buildMessages(context, count, excludedTitles = [], categoryHint = null) {
  const systemPrompt =
    'You create practical autism therapy activities for children. Return valid JSON only, with no markdown.';
  const limitedInterests = Array.isArray(context.interests) ? context.interests.slice(0, 10) : [];
  const limitedNeeds = Array.isArray(context.autismProfile?.specificNeeds) ? context.autismProfile.specificNeeds.slice(0, 8) : [];
  const guidanceLines = buildContextGuidance(context);
  const userPrompt = [
    'Return ONLY a valid JSON object.',
    `Generate exactly ${count} unique personalized activities.`,
    `Child: ${context.childName || 'Child'}, age ${context.childAge}, emotion ${context.emotion}.`,
    `Interests: ${limitedInterests.join(', ') || 'none'}.`,
    `Financial status: ${context.financialStatus}, social status: ${context.socialStatus}.`,
    `Autism profile: severity ${context.autismProfile?.severity}, type ${context.autismProfile?.type}.`,
    `Specific needs: ${limitedNeeds.join(', ') || 'none'}.`,
    `Do not repeat or closely match these titles: ${excludedTitles.join(', ') || 'none'}.`,
    ...guidanceLines,
    'Use categories only from: social, behavioral, emotional.',
    ...(categoryHint ? [`All generated activities must use category: ${categoryHint}.`] : []),
    'Each activity object must include: title, category, description, recommendedReason, duration, difficulty, materials, benefits, socialRequirement, costLevel, interestTags.',
    'Title must be 3-8 words and concrete.',
    'Description must describe what to do in 1-2 sentences.',
    'recommendedReason must be one sentence explaining why this fits the child profile.',
    'Use only enum values: difficulty=[easy,medium,hard], socialRequirement=[none,low,medium,high], costLevel=[free,low,medium,high].',
    'materials, benefits, and interestTags must be arrays of short strings.',
    'Output format:',
    '{"activities":[{"title":"","category":"","description":"","recommendedReason":"","duration":"","difficulty":"easy","materials":[],"benefits":[],"socialRequirement":"low","costLevel":"low","interestTags":[]}]}'
  ].join('\n');

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
}

async function callOllamaGenerate(model, messages, options = {}) {
  const { useJsonFormat = true, timeoutMs = OLLAMA_TIMEOUT_MS, ...generationOverrides } = options;
  const generationOptions = { temperature: 0.2, top_p: 0.9, repeat_penalty: 1.1, num_predict: 600, ...generationOverrides };
  const fallbackPrompt = messages.map((m) => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n');

  const response = await axios.post(
    `${OLLAMA_BASE_URL}/api/generate`,
    {
      model,
      stream: false,
      ...(useJsonFormat ? { format: 'json' } : {}),
      options: generationOptions,
      prompt: fallbackPrompt
    },
    { timeout: timeoutMs }
  );
  return response.data?.response || '';
}

function extractActivitiesFromParsed(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.titles)) return parsed.titles.map((title) => ({ title }));
  if (Array.isArray(parsed.activities)) return parsed.activities;
  if (parsed.activities && typeof parsed.activities === 'object') return Object.values(parsed.activities);
  if (Array.isArray(parsed.recommendations)) return parsed.recommendations;
  if (Array.isArray(parsed.data?.activities)) return parsed.data.activities;
  if (Array.isArray(parsed.result?.activities)) return parsed.result.activities;
  if (Array.isArray(parsed.items)) return parsed.items;
  return [];
}

function extractActivitiesFromText(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return [];

  const jsonLike = [];
  const objectRegex = /"title"\s*:\s*"([^"]{1,120})"[\s\S]{0,500}?"category"\s*:\s*"([^"]{1,80})"[\s\S]{0,1400}?"description"\s*:\s*"([^"]{1,700})"[\s\S]{0,700}?"(?:recommendedReason|recommendation)"\s*:\s*"([^"]{0,700})"/gi;
  let match;
  while ((match = objectRegex.exec(text)) !== null) {
    jsonLike.push({
      title: cleanText(match[1], '', 80),
      category: cleanText(match[2], '', 40),
      description: cleanText(match[3], '', 280),
      recommendedReason: cleanText(match[4], '', 180)
    });
    if (jsonLike.length >= 12) break;
  }
  if (jsonLike.length) {
    return jsonLike;
  }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const activityLike = lines
    .map((line) => line.replace(/^[-*#\d.)\s]+/, '').trim())
    .filter((line) => line.length >= 6 && line.length <= 120)
    .filter((line) => !/"(title|category|description|recommendedReason|recommendation)"/i.test(line))
    .filter((line) => !/[{}\[\]]/.test(line));

  const deduped = [];
  const seen = new Set();
  for (const line of activityLike) {
    if (/^\{|\[|\"activities\"/i.test(line)) continue;
    const key = titleKey(line);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push({ title: line });
    if (deduped.length >= 12) break;
  }
  return deduped;
}

function extractActivities(rawText) {
  const parsed = extractJson(rawText);
  const parsedActivities = extractActivitiesFromParsed(parsed);
  if (parsedActivities.length) return parsedActivities;
  return extractActivitiesFromText(rawText);
}

function enforceCategoryMix(activities, emotion) {
  if (!Array.isArray(activities) || activities.length < 3) return activities;
  const plan = buildCategoryPlan(activities.length, emotion);
  const quota = { social: 0, behavioral: 0, emotional: 0 };
  for (const item of plan) {
    quota[item.category] = item.count;
  }

  const result = activities.map((item) => ({ ...item }));
  const counts = { social: 0, behavioral: 0, emotional: 0 };
  for (const item of result) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }

  function findDonorIndex(targetCategory) {
    let bestIndex = -1;
    let bestSurplus = 0;
    for (let i = result.length - 1; i >= 0; i -= 1) {
      const c = result[i].category;
      if (!VALID_CATEGORIES.has(c) || c === targetCategory) continue;
      const surplus = (counts[c] || 0) - (quota[c] || 0);
      if (surplus > bestSurplus) {
        bestSurplus = surplus;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  for (const target of ['social', 'behavioral', 'emotional']) {
    while ((counts[target] || 0) < (quota[target] || 0)) {
      const donorIndex = findDonorIndex(target);
      if (donorIndex < 0) break;
      const donorCategory = result[donorIndex].category;
      counts[donorCategory] -= 1;
      result[donorIndex].category = target;
      result[donorIndex].icon = iconForCategory(target);
      counts[target] += 1;
    }
  }

  return result;
}

async function generateRecommendations(context, count = 6) {
  const safeCount = Math.min(Math.max(Number(count) || 6, 1), 10);
  const model = await resolveModel();
  if (!model) {
    throw new Error('No Ollama model available. Pull a model (for example: ollama pull llama3.1:8b).');
  }
  const isSlowModel = /tinyllama/i.test(model);
  const tinyllamaTimeoutMs = Number(process.env.OLLAMA_TINYLLAMA_TIMEOUT_MS || 65000);
  const requestTimeoutMs = isSlowModel ? Math.min(OLLAMA_TIMEOUT_MS, tinyllamaTimeoutMs) : OLLAMA_TIMEOUT_MS;

  const uniqueTitles = new Set();
  const sanitized = [];
  let lastError = null;

  const attempts = [
    async (messages) => {
      const rawText = await callOllamaGenerate(model, messages, { temperature: 0.1, num_predict: 280, timeoutMs: requestTimeoutMs });
      return extractActivities(rawText);
    },
    async (messages) => {
      const rawText = await callOllamaGenerate(model, messages, { useJsonFormat: false, temperature: 0.15, num_predict: 180, timeoutMs: requestTimeoutMs });
      return extractActivities(rawText);
    }
  ];
  const maxCycles = isSlowModel ? 1 : 2;
  for (let cycle = 0; cycle < maxCycles && sanitized.length < safeCount; cycle += 1) {
    const attempt = attempts[cycle % attempts.length];
    const remaining = Math.max(1, safeCount - sanitized.length);
    const messages = buildMessages(context, remaining, Array.from(uniqueTitles));
    let rawActivities = [];
    try {
      rawActivities = await attempt(messages);
    } catch (err) {
      lastError = err;
      continue;
    }
    if (!Array.isArray(rawActivities) || rawActivities.length === 0) {
      continue;
    }
    for (let i = 0; i < rawActivities.length && sanitized.length < safeCount; i += 1) {
      const next = sanitizeActivity(rawActivities[i] || {}, sanitized.length + i, context);
      if (isSensoryActivity(next)) continue;
      const key = titleKey(next.title);
      if (!key || uniqueTitles.has(key)) continue;
      uniqueTitles.add(key);
      sanitized.push(next);
    }
  }

  if (!sanitized.length) {
    const message = String(lastError?.message || 'Ollama returned no structured activities.');
    if (/timed out|timeout/i.test(message)) {
      throw new Error(`Ollama timed out after ${requestTimeoutMs}ms while using model "${model}".`);
    }
    throw new Error(message);
  }

  let trimmed = filterNonSensoryActivities(sanitized).slice(0, safeCount);
  if (matchesSurpriseMusicOutdoorsFamilyProfile(context) && !hasStrongSurpriseMusicOutdoorsFamilyCoverage(trimmed)) {
    const profileAnchored = buildSurpriseMusicOutdoorsFamilyActivities(context)
      .slice(0, safeCount)
      .map((item, idx) => sanitizeActivity(item, idx, context, item.category));
    trimmed = filterNonSensoryActivities(profileAnchored);
  }

  return enforceCategoryMix(trimmed, context.emotion);
}

function buildRankingMessages(context, catalog, count) {
  const systemPrompt = 'You are an autism therapy recommendation assistant. Select the best activities from the provided catalog. Return valid JSON only.';
  const catalogCompact = catalog.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    difficulty: a.difficulty,
    costLevel: a.costLevel,
    socialRequirement: a.socialRequirement,
    interestTags: Array.isArray(a.interestTags) ? a.interestTags : []
  }));

  const userPrompt = [
    `Pick exactly ${count} activities by ID for this child profile.`,
    `Emotion: ${context.emotion}`,
    `Interests: ${(context.interests || []).join(', ') || 'none'}`,
    `Financial status: ${context.financialStatus}`,
    `Social status: ${context.socialStatus}`,
    `Autism severity: ${context.autismProfile?.severity}`,
    `Autism type: ${context.autismProfile?.type}`,
    `Specific needs: ${(context.autismProfile?.specificNeeds || []).join(', ') || 'none'}`,
    'Output format exactly:',
    '{"selected_ids":[1,2,3],"reasons":{"1":"short reason","2":"short reason"}}',
    'Use only ids from this catalog JSON:',
    JSON.stringify(catalogCompact)
  ].join('\n');

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
}

function parseSelectedIds(parsed, validIdSet, count) {
  let candidates = [];
  if (Array.isArray(parsed?.selected_ids)) {
    candidates = parsed.selected_ids;
  } else if (Array.isArray(parsed?.ids)) {
    candidates = parsed.ids;
  } else if (Array.isArray(parsed?.activities)) {
    candidates = parsed.activities.map((item) => item?.id ?? item?.activity_id ?? item);
  } else if (Array.isArray(parsed)) {
    candidates = parsed;
  }

  const selected = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const id = Number(candidate);
    if (!Number.isFinite(id) || !validIdSet.has(id) || seen.has(id)) continue;
    selected.push(id);
    seen.add(id);
    if (selected.length >= count) break;
  }

  return selected;
}

async function rankActivities(context, catalog, count = 6) {
  const safeCount = Math.min(Math.max(Number(count) || 6, 1), 10);
  const safeCatalog = Array.isArray(catalog)
    ? catalog.filter((a) => Number.isFinite(Number(a?.id)) && !isSensoryActivity(a))
    : [];
  if (!safeCatalog.length) {
    throw new Error('Activity catalog is required for ranking.');
  }

  const model = await resolveModel();
  if (!model) {
    throw new Error('No Ollama model available. Pull a model (for example: ollama pull llama3.1:8b).');
  }

  const messages = buildRankingMessages(context, safeCatalog, safeCount);
  const validIdSet = new Set(safeCatalog.map((a) => Number(a.id)));

  let parsed = null;
  try {
    const rawText = await callOllamaGenerate(model, messages, { temperature: 0.15, num_predict: 140 });
    parsed = extractJson(rawText);
  } catch (_) {}

  let selectedIds = parseSelectedIds(parsed, validIdSet, safeCount);
  if (!selectedIds.length) {
    const rawText = await callOllamaGenerate(model, messages, { temperature: 0.15, num_predict: 160 });
    parsed = extractJson(rawText);
    selectedIds = parseSelectedIds(parsed, validIdSet, safeCount);
  }

  if (!selectedIds.length) {
    throw new Error('Ollama returned no valid ranked activity IDs.');
  }

  const reasonsRaw = parsed && typeof parsed.reasons === 'object' ? parsed.reasons : {};
  const reasons = {};
  for (const id of selectedIds) {
    const reason = cleanText(reasonsRaw[String(id)], '', 180);
    reasons[String(id)] = reason;
  }

  return {
    selectedIds,
    reasons
  };
}

module.exports = {
  generateRecommendations,
  rankActivities
};
