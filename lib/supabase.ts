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
  message_type: 'text' | 'audio';
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