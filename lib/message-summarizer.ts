// lib/message-summarizer.ts
import { DatabaseService } from './database';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const config = require('../config/database-config.json');

export class MessageSummarizer {
  
  static async checkSummarizationNeeded(userId: number, topic: string): Promise<boolean> {
    const messageCount = await DatabaseService.getMessageCountByTopic(userId, topic);
    const daysSinceLastSummary = await this.getDaysSinceLastSummary(userId, topic);
    
    return messageCount > config.message_history.summary_threshold || 
           daysSinceLastSummary > config.message_history.max_days_full_history;
  }
  
  static async summarizeMessages(userId: number, topic: string): Promise<void> {
    console.log(`📝 Summarizing messages for user ${userId}, topic: ${topic}`);
    
    // Get messages to summarize (older than threshold)
    const messagesToSummarize = await DatabaseService.getMessagesForSummary(
      userId, 
      topic, 
      config.message_history.summary_chunk_size
    );
    
    if (messagesToSummarize.length === 0) return;
    
    // Create AI summary
    const summary = await this.createAISummary(messagesToSummarize, topic);
    
    // Save summary to database
    await DatabaseService.createMessageSummary({
      user_id: userId,
      topic,
      summary,
      message_count: messagesToSummarize.length,
      date_range_start: messagesToSummarize[0].created_at,
      date_range_end: messagesToSummarize[messagesToSummarize.length - 1].created_at
    });
    
    // Optionally delete old messages (configurable)
    if (config.performance.message_cleanup_after_days > 0) {
      await DatabaseService.deleteOldMessages(
        userId, 
        topic, 
        config.performance.message_cleanup_after_days
      );
    }
    
    console.log(`✅ Summarized ${messagesToSummarize.length} messages for ${topic}`);
  }
  
  private static async createAISummary(messages: any[], topic: string): Promise<string> {
    const conversationText = messages.map(m => 
      `${m.role}: ${m.message}`
    ).join('\n');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Summarize this fitness conversation about ${topic}. Focus on:
          - Key fitness goals and progress discussed
          - Important workout details and achievements  
          - Nutrition habits and changes
          - Health metrics mentioned
          - Coaching advice given
          Keep it concise but preserve important context for future conversations.`
        },
        {
          role: "user", 
          content: `Summarize this conversation:\n\n${conversationText}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });
    
    return completion.choices[0]?.message?.content || 'Summary unavailable';
  }
  
  private static async getDaysSinceLastSummary(userId: number, topic: string): Promise<number> {
    const lastSummary = await DatabaseService.getLatestSummary(userId, topic);
    if (!lastSummary) return 999; // No summary exists
    
    const daysDiff = Math.floor((Date.now() - new Date(lastSummary.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff;
  }
  
  // Background job to summarize messages
  static async runSummarizationJob(): Promise<void> {
    console.log('🔄 Starting message summarization job...');
    
    const usersNeedingSummary = await DatabaseService.getUsersNeedingSummary();
    
    for (const user of usersNeedingSummary) {
      const topics = await DatabaseService.getUserTopicsNeedingSummary(user.id);
      
      for (const topic of topics) {
        try {
          await this.summarizeMessages(user.id, topic);
          
          // Rate limiting to avoid API overload
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Failed to summarize for user ${user.id}, topic ${topic}:`, error);
        }
      }
    }
    
    console.log('✅ Message summarization job completed');
  }
}