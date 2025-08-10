#!/usr/bin/env node

// FitChat database schema
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Environment check:');
console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to Supabase...');
    
    console.log('🗑️ Clearing existing data...');
    
    const tables = ['users', 'messages', 'message_summaries', 'reminders', 'user_metrics', 'workouts', 'workout_exercises', 'meals'];
    
    for (const table of tables) {
      try {
        await supabase.from(table).delete().neq('id', -1);
        console.log(`✅ Cleared ${table} table`);
      } catch (error) {
        console.log(`Note: Could not clear ${table} (may not exist)`);
      }
    }
    
    console.log('🏗️ Generating database schema...');
    console.log('');
    console.log('Please run the following SQL commands in your Supabase SQL Editor:');
    console.log('');
    console.log('-- =============================================================================');
    console.log('-- FITCHAT DATABASE SCHEMA');
    console.log('-- Optimized for performance and scalability');
    console.log('-- =============================================================================');
    console.log('');
    
    const schema = `
-- Drop existing tables if they exist
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS message_summaries CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS user_metrics CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  personality TEXT,
  timezone TEXT DEFAULT 'UTC',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);

-- Simplified messages table (no conversations dependency)
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'audio', 'video')),
  topic TEXT DEFAULT 'General', -- Store topic directly
  audio_id TEXT,
  message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_message_id UNIQUE (message_id)
);

CREATE INDEX idx_messages_user_topic_date ON messages(user_id, topic, created_at DESC);
CREATE INDEX idx_messages_user_date ON messages(user_id, created_at DESC);
CREATE INDEX idx_messages_message_id ON messages(message_id);

-- Message summaries for efficient context loading
CREATE TABLE message_summaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  summary TEXT NOT NULL,
  message_count INTEGER NOT NULL,
  date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
  date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_summaries_user_topic ON message_summaries(user_id, topic);
CREATE INDEX idx_summaries_date_range ON message_summaries(date_range_start, date_range_end);

-- Enhanced reminders with full scheduling support
CREATE TABLE reminders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  reminder_type TEXT CHECK (reminder_type IN ('workout', 'weigh_in', 'meal', 'custom', 'goal_check')),
  
  -- Flexible scheduling
  frequency TEXT CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'custom')),
  frequency_details JSONB, -- {"days": ["monday", "wednesday"], "time": "09:00", "interval": 2}
  
  -- Timing
  next_due TIMESTAMP WITH TIME ZONE NOT NULL,
  last_sent TIMESTAMP WITH TIME ZONE,
  snooze_until TIMESTAMP WITH TIME ZONE,
  
  -- Status
  active BOOLEAN DEFAULT true,
  completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_user_active ON reminders(user_id, active);
CREATE INDEX idx_reminders_next_due ON reminders(next_due) WHERE active = true;
CREATE INDEX idx_reminders_type ON reminders(reminder_type);

-- User metrics (health data)
CREATE TABLE user_metrics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- Allow any metric type - AI will determine appropriate ones
  value FLOAT NOT NULL,
  unit TEXT NOT NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'apple_health', 'user_prompt')),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_metrics_user_type_date ON user_metrics(user_id, metric_type, recorded_at DESC);

-- Workouts table
CREATE TABLE workouts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES messages(message_id) ON DELETE SET NULL,
  workout_name TEXT,
  workout_type TEXT CHECK (workout_type IN ('strength', 'cardio', 'flexibility', 'sports', 'other')),
  duration_minutes INTEGER,
  notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workouts_user_date ON workouts(user_id, completed_at DESC);
CREATE INDEX idx_workouts_type ON workouts(workout_type);
CREATE INDEX idx_workouts_message_id ON workouts(message_id);

-- Workout exercises
CREATE TABLE workout_exercises (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  exercise_type TEXT CHECK (exercise_type IN ('strength', 'cardio', 'flexibility', 'isometric')),
  sets INTEGER,
  reps INTEGER[],
  weight FLOAT,
  distance FLOAT,
  duration_seconds INTEGER,
  uses_body_weight BOOLEAN DEFAULT false,
  body_weight_used FLOAT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_name ON workout_exercises(exercise_name);

-- Meals table  
CREATE TABLE meals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES messages(message_id) ON DELETE SET NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  meal_description TEXT NOT NULL,
  estimated_calories FLOAT NOT NULL,
  confidence_score FLOAT,
  protein_grams FLOAT,
  carbs_grams FLOAT,
  fat_grams FLOAT,
  fiber_grams FLOAT,
  consumed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meals_user_date ON meals(user_id, consumed_at DESC);
CREATE INDEX idx_meals_type ON meals(meal_type);
CREATE INDEX idx_meals_message_id ON meals(message_id);
`;

    console.log(schema);
    console.log('-- =============================================================================');
    console.log('-- END OF SCHEMA');
    console.log('-- =============================================================================');
    console.log('');
    console.log('🎯 INSTRUCTIONS:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to https://supabase.com/dashboard/project/ekybvchxqaxlxamjbfqw/sql/new');
    console.log('3. Paste the SQL and click "Run"');
    console.log('4. Your FitChat database will be ready! 🎉');
    console.log('');
    console.log('📋 Key features:');
    console.log('- ✅ No conversations table - topics stored directly on messages');
    console.log('- ✅ Message summaries for efficient context loading');
    console.log('- ✅ Enhanced reminders with flexible scheduling + timezone support');
    console.log('- ✅ Optimized indexes for performance');
    console.log('- ✅ Full health data logging (workouts, meals, metrics)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();