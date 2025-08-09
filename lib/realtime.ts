// lib/realtime.ts
import { RealtimeClient } from '@supabase/realtime-js';
import { scheduleTaskReminder } from './scheduler';

class RealtimeService {
  private client: RealtimeClient | null = null;
  private isConnected = false;

  async initialize() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_ANON_KEY!;
      
      const wsUrl = `wss://${supabaseUrl.replace('https://', '')}/realtime/v1`;
      
      this.client = new RealtimeClient(wsUrl, {
        params: { apikey: supabaseKey }
      });

      await this.setupTaskListener();
      
      this.client.connect();
      this.isConnected = true;
      
      console.log('📡 Realtime client initialized and connected');
    } catch (error) {
      console.error('Error initializing realtime client:', error);
    }
  }

  private async setupTaskListener() {
    if (!this.client) return;

    const taskChannel = this.client.channel('task-changes');
    
    // Listen for new tasks being inserted
    taskChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks'
      },
      async (payload) => {
        console.log('🔔 New task detected:', payload.new);
        
        const task = payload.new as any;
        if (task.active) {
          try {
            await scheduleTaskReminder(task.id, task.user_id, task.content, task.freq);
            console.log(`📅 Auto-scheduled new task #${task.id}`);
          } catch (error) {
            console.error(`Error auto-scheduling task ${task.id}:`, error);
          }
        }
      }
    );

    // Listen for task updates (activate/deactivate, frequency changes)
    taskChannel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks'
      },
      async (payload) => {
        console.log('🔄 Task updated:', payload.new);
        
        const oldTask = payload.old as any;
        const newTask = payload.new as any;
        
        // Handle activation/deactivation
        if (oldTask.active !== newTask.active) {
          if (newTask.active) {
            await scheduleTaskReminder(newTask.id, newTask.user_id, newTask.content, newTask.freq);
            console.log(`📅 Task #${newTask.id} activated and scheduled`);
          } else {
            // Note: unscheduling is handled in the API endpoint
            console.log(`📅 Task #${newTask.id} deactivated`);
          }
        }
      }
    );

    // Listen for task deletions
    taskChannel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'tasks'
      },
      (payload) => {
        console.log('🗑️ Task deleted:', payload.old);
        // Note: unscheduling is handled in the API endpoint
      }
    );

    taskChannel.subscribe((status) => {
      console.log('📡 Task channel subscription status:', status);
    });
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      this.client.disconnect();
      this.isConnected = false;
      console.log('📡 Realtime client disconnected');
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Alternative polling-based approach for environments where WebSockets are problematic
  async startPolling() {
    console.log('📊 Starting polling-based task monitoring (fallback for realtime)');
    
    // Poll every 30 seconds for new tasks
    setInterval(async () => {
      try {
        // This would require a mechanism to track last checked timestamp
        // For simplicity, we'll rely on the realtime approach primarily
        console.log('📊 Polling for task changes...');
      } catch (error) {
        console.error('Error during task polling:', error);
      }
    }, 30000);
  }
}

// Create singleton instance
export const realtimeService = new RealtimeService();

// Auto-initialize when module is imported (in server environment)
if (typeof window === 'undefined') {
  realtimeService.initialize().catch(console.error);
}

export default realtimeService;