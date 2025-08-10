// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/frontend operations
export const supabase = createClient(supabaseUrl, supabaseKey);

// Service role client for server-side operations that need elevated permissions
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types for TypeScript
export interface User {
  id: number;
  phone: string;
  name: string;
  personality?: string;
  last_seen: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  topic: string;
  status: 'open' | 'closed';
  started_at: string;
}

export interface Message {
  id: number;
  user_id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  message: string;
  message_type: 'text' | 'audio' | 'video';
  audio_id?: string;
  message_id?: string;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  conversation_id: number;
  type: 'Reminder' | 'Goal';
  active: boolean;
  freq: number;
  content: string;
  created_at: string;
}

export interface UserMetric {
  id: number;
  user_id: number;
  metric_type: string; // Allow any metric type
  value: number;
  unit: string;
  source: 'manual' | 'apple_health' | 'user_prompt';
  recorded_at: string;
  created_at: string;
}

export interface Reminder {
  id: number;
  user_id: number;
  title: string;
  message?: string;
  reminder_type?: string;
  frequency: string;
  frequency_details: any; // JSONB field
  next_due: string;
  last_sent?: string;
  snooze_until?: string;
  active: boolean;
  completed: boolean;
  created_at: string;
}

export interface Workout {
  id: number;
  user_id: number;
  message_id?: string;
  workout_name?: string;
  workout_type?: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
  duration_minutes?: number;
  notes?: string;
  started_at?: string;
  completed_at: string;
  created_at: string;
}

export interface WorkoutExercise {
  id: number;
  workout_id: number;
  exercise_name: string;
  exercise_type?: 'strength' | 'cardio' | 'flexibility' | 'isometric';
  sets?: number;
  reps?: number[];
  weight?: number;
  distance?: number;
  duration_seconds?: number;
  uses_body_weight: boolean;
  body_weight_used?: number;
  notes?: string;
  created_at: string;
}

export interface Meal {
  id: number;
  user_id: number;
  conversation_id: number;
  message_id?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  meal_description: string;
  estimated_calories: number;
  confidence_score?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  fiber_grams?: number;
  consumed_at: string;
  created_at: string;
}