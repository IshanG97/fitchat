// lib/scheduler.ts
import * as cron from 'node-cron';
import { DatabaseService } from './database';
import { sendTextMessage } from './whatsapp';

interface ScheduledTask {
  id: number;
  userId: number;
  content: string;
  frequency: number;
  cronExpression: string;
  task: cron.ScheduledTask;
}

class TaskScheduler {
  private scheduledTasks: Map<number, ScheduledTask> = new Map();

  constructor() {
    // Initialize scheduler on startup
    this.initializeScheduler();
  }

  async initializeScheduler() {
    try {
      // Load all active tasks from database and schedule them
      const activeTasks = await DatabaseService.getUserTasks(0, true); // Get all active tasks
      
      for (const task of activeTasks) {
        await this.scheduleTask(task.id, task.user_id, task.content, task.freq);
      }
      
      console.log(`📅 Initialized scheduler with ${activeTasks.length} tasks`);
    } catch (error) {
      console.error('Error initializing scheduler:', error);
    }
  }

  private parseFrequency(freq: number): string {
    // Convert frequency to cron expression
    // freq < 1 = hours, freq >= 1 = days
    if (freq < 1) {
      const hours = Math.max(1, Math.floor(freq * 24));
      return `0 */${hours} * * *`; // Every X hours
    } else {
      const days = Math.floor(freq);
      if (days === 1) {
        return '0 9 * * *'; // Daily at 9 AM
      } else {
        return `0 9 */${days} * *`; // Every X days at 9 AM
      }
    }
  }

  async scheduleTask(taskId: number, userId: number, content: string, frequency: number): Promise<void> {
    try {
      // Remove existing task if it exists
      this.unscheduleTask(taskId);

      const cronExpression = this.parseFrequency(frequency);
      
      const task = cron.schedule(cronExpression, async () => {
        await this.executeReminderJob(userId, content);
      }, {
        scheduled: true,
        timezone: 'America/New_York' // Adjust timezone as needed
      });

      const scheduledTask: ScheduledTask = {
        id: taskId,
        userId,
        content,
        frequency,
        cronExpression,
        task
      };

      this.scheduledTasks.set(taskId, scheduledTask);
      console.log(`📅 Scheduled task #${taskId} for user #${userId}: ${cronExpression}`);
    } catch (error) {
      console.error(`Error scheduling task ${taskId}:`, error);
    }
  }

  unscheduleTask(taskId: number): void {
    const scheduledTask = this.scheduledTasks.get(taskId);
    if (scheduledTask) {
      scheduledTask.task.destroy();
      this.scheduledTasks.delete(taskId);
      console.log(`📅 Unscheduled task #${taskId}`);
    }
  }

  private async executeReminderJob(userId: number, content: string): Promise<void> {
    try {
      const user = await DatabaseService.getUserById(userId);
      if (user) {
        await sendTextMessage(user.phone, content);
        console.log(`📤 Sent reminder to ${user.phone}: ${content}`);
      } else {
        console.error(`Error: Could not find user with ID ${userId} to send reminder.`);
      }
    } catch (error) {
      console.error(`Error sending reminder for user ${userId}:`, error);
    }
  }

  // Fitness-specific scheduling methods
  async scheduleWorkoutReminder(userId: number, workoutType: string, time: string = '08:00'): Promise<void> {
    const content = `🏋️ Time for your ${workoutType} workout! Let's crush those fitness goals today!`;
    const frequency = 1; // Daily
    
    // Create task in database
    const task = await DatabaseService.createTask({
      user_id: userId,
      conversation_id: 0, // Default conversation
      type: 'Reminder',
      active: true,
      freq: frequency,
      content
    });

    await this.scheduleTask(task.id, userId, content, frequency);
  }

  async scheduleProgressCheckIn(userId: number, frequency: number = 7): Promise<void> {
    const content = `📊 How's your fitness journey going? Share your progress and let me know how you're feeling!`;
    
    // Create task in database
    const task = await DatabaseService.createTask({
      user_id: userId,
      conversation_id: 0,
      type: 'Goal',
      active: true,
      freq: frequency,
      content
    });

    await this.scheduleTask(task.id, userId, content, frequency);
  }

  async scheduleRecoveryCheck(userId: number, frequency: number = 3): Promise<void> {
    const content = `💤 Recovery time! How are you feeling? Rate your energy (1-10) and let me know if you need a rest day.`;
    
    // Create task in database
    const task = await DatabaseService.createTask({
      user_id: userId,
      conversation_id: 0,
      type: 'Reminder',
      active: true,
      freq: frequency,
      content
    });

    await this.scheduleTask(task.id, userId, content, frequency);
  }

  async scheduleNutritionReminder(userId: number, frequency: number = 0.5): Promise<void> {
    const content = `🥗 Don't forget to log your meals! What did you eat for your last meal?`;
    
    // Create task in database
    const task = await DatabaseService.createTask({
      user_id: userId,
      conversation_id: 0,
      type: 'Reminder',
      active: true,
      freq: frequency,
      content
    });

    await this.scheduleTask(task.id, userId, content, frequency);
  }

  getScheduledTasks(): ScheduledTask[] {
    return Array.from(this.scheduledTasks.values());
  }

  getTaskById(taskId: number): ScheduledTask | undefined {
    return this.scheduledTasks.get(taskId);
  }
}

// Create singleton instance
export const taskScheduler = new TaskScheduler();

// Export convenience functions
export async function scheduleTaskReminder(taskId: number, userId: number, content: string, frequency: number) {
  await taskScheduler.scheduleTask(taskId, userId, content, frequency);
}

export function unscheduleTaskReminder(taskId: number) {
  taskScheduler.unscheduleTask(taskId);
}

export async function createWorkoutReminder(userId: number, workoutType: string, time?: string) {
  await taskScheduler.scheduleWorkoutReminder(userId, workoutType, time);
}

export async function createProgressCheckIn(userId: number, frequency?: number) {
  await taskScheduler.scheduleProgressCheckIn(userId, frequency);
}

export async function createRecoveryCheck(userId: number, frequency?: number) {
  await taskScheduler.scheduleRecoveryCheck(userId, frequency);
}

export async function createNutritionReminder(userId: number, frequency?: number) {
  await taskScheduler.scheduleNutritionReminder(userId, frequency);
}