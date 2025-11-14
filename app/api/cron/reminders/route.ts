// app/api/cron/reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ReminderService } from '@/lib/reminder-service';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('⏰ Processing due reminders...');
    
    const startTime = Date.now();
    const results = await ReminderService.processDueReminders();
    const duration = Date.now() - startTime;
    
    console.log(`✅ Processed ${results.sent} reminders, ${results.errors} errors in ${duration}ms`);
    
    return NextResponse.json({ 
      success: true, 
      sent: results.sent,
      errors: results.errors,
      duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Reminders cron job failed:', error);
    return NextResponse.json({ 
      error: 'Reminder processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    service: 'reminder-processing',
    timestamp: new Date().toISOString()
  });
}