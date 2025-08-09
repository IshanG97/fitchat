// lib/database.ts
import { supabaseAdmin } from './supabase';
import { User, Conversation, Message, Task } from './supabase';

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
    messageType: 'text' | 'audio' = 'text',
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
}