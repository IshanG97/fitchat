// lib/reminder-service.ts
import { DatabaseService } from './database';
import { send_text_message } from './whatsapp';

interface ReminderFrequencyDetails {
  time: string;              // "07:00"
  timezone?: string;         // "America/New_York" 
  days?: string[];          // ["monday", "wednesday"] for weekly
  day_of_month?: number;    // 15 for monthly on 15th
  interval_days?: number;   // 3 for every 3 days
}

export class ReminderService {
  
  static async processDueReminders(): Promise<{sent: number, errors: number}> {
    console.log('⏰ Checking for due reminders...');
    
    let sent = 0;
    let errors = 0;
    
    try {
      // Get all due reminders
      const dueReminders = await DatabaseService.getDueReminders();
      
      console.log(`📋 Found ${dueReminders.length} due reminders`);
      
      for (const reminder of dueReminders) {
        try {
          // Get user info
          const user = await DatabaseService.getUserById(reminder.user_id);
          if (!user) {
            console.error(`❌ User not found for reminder ${reminder.id}`);
            errors++;
            continue;
          }
          
          // Send reminder message
          const message = reminder.message || this.getDefaultReminderMessage(reminder.reminder_type);
          await send_text_message(user.phone, `⏰ ${reminder.title}\n\n${message}`);
          
          // Update reminder status and calculate next due date
          const nextDue = this.calculateNextDueDate(reminder);
          await DatabaseService.updateReminder(reminder.id, {
            last_sent: new Date().toISOString(),
            next_due: nextDue,
            snooze_until: null // Clear any snooze
          });
          
          sent++;
          console.log(`✅ Sent reminder "${reminder.title}" to ${user.name}`);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Failed to send reminder ${reminder.id}:`, error);
          errors++;
        }
      }
      
    } catch (error) {
      console.error('❌ Error processing reminders:', error);
      errors++;
    }
    
    return { sent, errors };
  }
  
  static async createReminder(
    userId: number, 
    title: string, 
    reminderType: string,
    frequency: string,
    frequencyDetails: ReminderFrequencyDetails,
    message?: string
  ): Promise<any> {
    const nextDue = this.calculateNextDueDate({
      frequency,
      frequency_details: frequencyDetails
    });
    
    return await DatabaseService.createReminder({
      user_id: userId,
      title,
      message,
      reminder_type: reminderType,
      frequency,
      frequency_details: frequencyDetails,
      next_due: nextDue.toISOString(),
      active: true
    });
  }
  
  private static calculateNextDueDate(reminder: any): Date {
    const now = new Date();
    const details: ReminderFrequencyDetails = reminder.frequency_details || {};
    
    switch (reminder.frequency) {
      case 'once':
        // For one-time reminders, mark as completed
        return new Date('2099-12-31'); // Far future date
        
      case 'daily':
        const [hours, minutes] = (details.time || '09:00').split(':');
        const nextDaily = new Date();
        nextDaily.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (nextDaily <= now) {
          nextDaily.setDate(nextDaily.getDate() + 1);
        }
        return nextDaily;
        
      case 'weekly':
        // TODO: Implement weekly scheduling with specific days
        const nextWeekly = new Date(now);
        nextWeekly.setDate(now.getDate() + 7);
        return nextWeekly;
        
      case 'monthly':
        const nextMonthly = new Date(now);
        nextMonthly.setMonth(now.getMonth() + 1);
        if (details.day_of_month) {
          nextMonthly.setDate(details.day_of_month);
        }
        return nextMonthly;
        
      case 'custom':
        const intervalDays = details.interval_days || 1;
        const nextCustom = new Date(now);
        nextCustom.setDate(now.getDate() + intervalDays);
        return nextCustom;
        
      default:
        // Default to daily
        const nextDefault = new Date(now);
        nextDefault.setDate(now.getDate() + 1);
        return nextDefault;
    }
  }
  
  private static getDefaultReminderMessage(type: string): string {
    const messages = {
      'workout': 'Time to get moving! Your body will thank you later. 💪',
      'weigh_in': 'Quick weigh-in time! Track your progress and stay motivated. ⚖️',
      'meal': 'Meal time! Remember to fuel your body with nutritious foods. 🥗',
      'goal_check': 'How are you progressing toward your fitness goals? 🎯',
      'custom': 'Friendly reminder from your fitness coach! 🏃‍♀️'
    };
    
    return messages[type as keyof typeof messages] || messages.custom;
  }
}