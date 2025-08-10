// lib/database.ts
import { supabaseAdmin } from './supabase';
import { User, Conversation, Message, Task, UserMetric, Workout, WorkoutExercise, Meal, Reminder } from './supabase';

export class DatabaseService {
  // User operations
  static async createUser(phone: string, name: string, personality?: string): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({ phone, name, personality })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserByPhone(phone: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getUserById(userId: number): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateLastSeen(userId: number): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getMessageByMessageId(messageId: string): Promise<Message | null> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('message_id', messageId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async messageExists(messageId: string): Promise<boolean> {
    const message = await this.getMessageByMessageId(messageId);
    return message !== null;
  }

  // Conversation operations
  static async createConversation(userId: number, topic: string, status: 'open' | 'closed' = 'open'): Promise<Conversation> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({ user_id: userId, topic, status })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getOpenConversations(userId: number): Promise<Conversation[]> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('started_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getConversationByTopic(userId: number, topic: string): Promise<Conversation | null> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('topic', topic)
      .eq('status', 'open')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateConversation(conversationId: number, updates: Partial<Conversation>): Promise<Conversation> {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Message operations
  static async createMessage(messageData: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert(messageData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getRecentMessages(userId: number, limit: number = 20): Promise<Message[]> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data || []).reverse(); // Return in chronological order
  }

  static async getConversationMessages(conversationId: number): Promise<Message[]> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async updateMessage(messageId: number, updates: Partial<Message>): Promise<Message> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update(updates)
      .eq('id', messageId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Task operations
  static async createTask(taskData: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert(taskData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserTasks(userId: number, activeOnly: boolean = true): Promise<Task[]> {
    let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', userId);
    
    if (activeOnly) {
      query = query.eq('active', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async updateTask(taskId: number, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteTask(taskId: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) throw error;
  }

  // Helper functions for fitness-specific operations
  static async getOrCreateUser(phone: string, name: string): Promise<User> {
    let user = await this.getUserByPhone(phone);
    if (!user) {
      user = await this.createUser(phone, name);
    }
    return user;
  }

  static async findOrCreateConversation(userId: number, topic: string): Promise<Conversation> {
    let conversation = await this.getConversationByTopic(userId, topic);
    if (!conversation) {
      conversation = await this.createConversation(userId, topic);
    }
    return conversation;
  }

  static async logMessage(
    userId: number,
    conversationId: number,
    role: 'user' | 'assistant',
    message: string,
    messageType: 'text' | 'audio' | 'video' = 'text',
    audioId?: string,
    messageId?: string
  ): Promise<Message> {
    return this.createMessage({
      user_id: userId,
      conversation_id: conversationId,
      role,
      message,
      message_type: messageType,
      audio_id: audioId,
      message_id: messageId
    });
  }

  // Simplified message logging with topic (no conversations dependency)
  static async logMessageWithTopic(
    userId: number,
    role: 'user' | 'assistant',
    message: string,
    messageType: 'text' | 'audio' | 'video' = 'text',
    topic: string = 'General',
    audioId?: string,
    messageId?: string
  ): Promise<Message> {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id: userId,
        role,
        message,
        message_type: messageType,
        topic,
        audio_id: audioId,
        message_id: messageId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // === Health Logging Methods ===

  // User metrics (body weight, health data)
  static async createUserMetric(metricData: Omit<UserMetric, 'id' | 'created_at'>): Promise<UserMetric> {
    const { data, error } = await supabaseAdmin
      .from('user_metrics')
      .insert(metricData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getLatestBodyWeight(userId: number): Promise<number | null> {
    const { data, error } = await supabaseAdmin
      .from('user_metrics')
      .select('value')
      .eq('user_id', userId)
      .eq('metric_type', 'body_weight')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data?.value || null;
  }

  static async getLatestUserMetric(userId: number, metricType: string): Promise<UserMetric | null> {
    const { data, error } = await supabaseAdmin
      .from('user_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('metric_type', metricType)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateBodyWeight(userId: number, weight: number, unit: string = 'lbs', source: string = 'user_prompt'): Promise<UserMetric> {
    return this.createUserMetric({
      user_id: userId,
      metric_type: 'body_weight',
      value: weight,
      unit,
      source: source as 'manual' | 'apple_health' | 'user_prompt',
      recorded_at: new Date().toISOString()
    });
  }

  static async getWeightHistory(userId: number, days?: number): Promise<UserMetric[]> {
    let query = supabaseAdmin
      .from('user_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('metric_type', 'body_weight')
      .order('recorded_at', { ascending: false });
    
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      query = query.gte('recorded_at', cutoffDate.toISOString());
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Workout operations
  static async createWorkout(workoutData: Omit<Workout, 'id' | 'created_at'>): Promise<Workout> {
    const { data, error } = await supabaseAdmin
      .from('workouts')
      .insert(workoutData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async addExerciseToWorkout(exerciseData: Omit<WorkoutExercise, 'id' | 'created_at'>): Promise<WorkoutExercise> {
    const { data, error } = await supabaseAdmin
      .from('workout_exercises')
      .insert(exerciseData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Alias for unified AI interface
  static async createWorkoutExercise(exerciseData: Omit<WorkoutExercise, 'id' | 'created_at'>): Promise<WorkoutExercise> {
    return this.addExerciseToWorkout(exerciseData);
  }

  static async getUserWorkouts(userId: number, limit: number = 20): Promise<Workout[]> {
    const { data, error } = await supabaseAdmin
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  static async getWorkoutExercises(workoutId: number): Promise<WorkoutExercise[]> {
    const { data, error } = await supabaseAdmin
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Meal operations
  static async createMeal(mealData: Omit<Meal, 'id' | 'created_at'>): Promise<Meal> {
    const { data, error } = await supabaseAdmin
      .from('meals')
      .insert(mealData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateMealCalories(mealId: number, calories: number, confidenceScore?: number): Promise<Meal> {
    const updates: any = { estimated_calories: calories };
    if (confidenceScore !== undefined) {
      updates.confidence_score = confidenceScore;
    }

    const { data, error } = await supabaseAdmin
      .from('meals')
      .update(updates)
      .eq('id', mealId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserMeals(userId: number, days?: number): Promise<Meal[]> {
    let query = supabaseAdmin
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('consumed_at', { ascending: false });
    
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      query = query.gte('consumed_at', cutoffDate.toISOString());
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Smart prompting helpers
  static async getRequiredHealthPrompts(userId: number, context: 'workout' | 'meal' = 'workout'): Promise<string[]> {
    const prompts: string[] = [];
    
    if (context === 'workout') {
      // Check if we have body weight data
      const hasWeight = await this.getLatestBodyWeight(userId);
      if (!hasWeight) {
        prompts.push('body_weight');
      }
    }
    
    return prompts;
  }

  // === Reminder Methods ===

  static async createReminder(reminderData: Omit<Reminder, 'id' | 'created_at'>): Promise<Reminder> {
    const { data, error } = await supabaseAdmin
      .from('reminders')
      .insert(reminderData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getDueReminders(): Promise<Reminder[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('reminders')
      .select('*')
      .eq('active', true)
      .lte('next_due', now)
      .is('snooze_until', null);
    
    if (error) throw error;
    return data || [];
  }

  static async updateReminder(id: number, updates: Partial<Reminder>): Promise<Reminder> {
    const { data, error } = await supabaseAdmin
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // === History Query Methods ===

  static async getUserMetricHistory(userId: number, metricType: string, days: number = 30, limit: number = 50): Promise<UserMetric[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { data, error } = await supabaseAdmin
      .from('user_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('metric_type', metricType)
      .gte('recorded_at', cutoffDate.toISOString())
      .order('recorded_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  static async getUserWorkoutHistory(userId: number, days: number = 30, limit: number = 20, workoutType?: string): Promise<Workout[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    let query = supabaseAdmin
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', cutoffDate.toISOString())
      .order('completed_at', { ascending: false })
      .limit(limit);
    
    if (workoutType) {
      query = query.eq('workout_type', workoutType);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }

  static async getUserNutritionHistory(userId: number, days: number = 7, limit: number = 30): Promise<Meal[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { data, error } = await supabaseAdmin
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .gte('consumed_at', cutoffDate.toISOString())
      .order('consumed_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  static async getUserReminders(userId: number, reminderType?: string, activeOnly: boolean = true): Promise<Reminder[]> {
    let query = supabaseAdmin
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (activeOnly) {
      query = query.eq('active', true);
    }
    
    if (reminderType) {
      query = query.eq('reminder_type', reminderType);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }
}