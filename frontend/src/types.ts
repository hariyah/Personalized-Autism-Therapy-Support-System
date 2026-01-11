export type CommunicationLevel = "nonverbal" | "limited" | "verbal";
export type AutismLevel = "Level 1" | "Level 2" | "Level 3";
export type SensoryLevel = "low" | "med" | "high";
export type Goal = "attention" | "memory" | "social" | "motor" | "emotion";
export type Category = "attention" | "memory" | "social" | "motor" | "emotion" | "mixed";
export type Difficulty = "easy" | "medium" | "hard";
export type Mood = "calm" | "anxious" | "energetic" | "tired" | "focused" | "distracted";
export type AttentionLevel = "low" | "medium" | "high";
export type Environment = "home" | "therapy" | "school" | "outdoor";

export interface SensorySensitivity {
  sound: SensoryLevel;
  light: SensoryLevel;
  touch: SensoryLevel;
}

export interface ChildProfile {
  _id: string;
  name: string;
  age: number;
  communication_level: CommunicationLevel;
  autism_level: AutismLevel;
  sensory_sensitivity: SensorySensitivity;
  goals: Goal[];
  created_at: string;
  updated_at: string;
}

export interface ChildProfileCreate {
  name: string;
  age: number;
  communication_level: CommunicationLevel;
  autism_level: AutismLevel;
  sensory_sensitivity: SensorySensitivity;
  goals: Goal[];
}

export interface Activity {
  _id: string;
  name: string;
  category: Category;
  skill_targets: string[];
  materials: string[];
  steps: string[];
  duration_minutes: number;
  difficulty: Difficulty;
  sensory_load: SensorySensitivity;
  safety_notes: string;
  suitable_ages: number[];
  created_at: string;
  updated_at: string;
}

export interface ActivityCreate {
  name: string;
  category: Category;
  skill_targets: string[];
  materials: string[];
  steps: string[];
  duration_minutes: number;
  difficulty: Difficulty;
  sensory_load: SensorySensitivity;
  safety_notes: string;
  suitable_ages: number[];
}

export type Budget = "low" | "medium" | "high";

export type PlanType = "daily" | "weekly";

export interface PlanRequest {
  budget: Budget;
  available_materials: string[];
  attention_level: AttentionLevel;
  environment: Environment;
  plan_type: PlanType;
  time_available_minutes?: number;
}

export interface RecommendationRequest {
  profile_id: string;
  plan_request: PlanRequest;
}

export interface ActivityRecommendation {
  activity_id: string;
  activity_name: string;
  reason: string;
  difficulty_adaptation: string;
  step_by_step_instructions: string[];
  sensory_safe_variants: string[];
  expected_benefit: string;
  success_checklist: string[];
}

// Legacy types - kept for backward compatibility
export interface ActivityPlan {
  plan_name: string;
  plan_overview: string;
  duration_days: number;
  total_activities: number;
  activities: ActivityRecommendation[];
  schedule?: string;
  materials_needed: string[];
  estimated_cost: string;
  success_indicators: string[];
}

// New phase-based structured plan types
export interface ScheduledActivity {
  activity_id: string;
  activity_name: string;
  domain: string;
  description: string;
  recommended_duration_minutes: number;
  difficulty_adaptation: string;
  why_this_activity_here: string;
  step_by_step: string[];
  sensory_considerations: string;
  expected_outcome: string;
}

export interface PlanPhase {
  phase: "Warm-up" | "Core" | "Calming";
  order: number;
  activities: ScheduledActivity[];
}

// New timetable-style interfaces
export interface TimetableBlock {
  time_range: string;
  phase: "Warm-up" | "Core" | "Calming";
  activity_id: string;
  activity_name: string;
  domain: string;
  why: string;
  steps: string[];
}

export interface TimetableDay {
  day: string;
  start_time?: string;
  blocks: TimetableBlock[];
}

export interface TimetablePlan {
  plan_type: "Daily" | "Weekly";
  plan_title: string;
  overview: string;
  total_duration_minutes: number;
  materials_needed: string[];
  timetable: TimetableDay[];
  caregiver_notes: string;
}

// Keep old interfaces for backward compatibility
export interface StructuredActivityPlan {
  plan_type: "Daily" | "Weekly";
  plan_name: string;
  plan_overview: string;
  total_duration_minutes: number;
  planning_rationale: string;
  materials_summary: string[];
  schedule: PlanPhase[];
}

export interface RecommendationResponse {
  plan: StructuredActivityPlan;
  generated_at: string;
}

export interface ActivityOutcome {
  _id?: string;
  profile_id: string;
  activity_id: string;
  engagement: number;
  stress: number;
  success: number;
  notes: string;
  completed_at: string;
}

export interface ActivityOutcomeCreate {
  profile_id: string;
  activity_id: string;
  engagement: number;
  stress: number;
  success: number;
  notes: string;
}

// Auth types
export interface User {
  id: string;
  username: string;
  email: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

