// app/api/cron/summarization/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MessageSummarizer } from '@/lib/message-summarizer';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting scheduled message summarization...');
    
    const startTime = Date.now();
    await MessageSummarizer.runSummarizationJob();
    const duration = Date.now() - startTime;
    
    console.log(`✅ Message summarization completed in ${duration}ms`);
    
    return NextResponse.json({ 
      success: true, 
      duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Summarization cron job failed:', error);
    return NextResponse.json({ 
      error: 'Summarization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    service: 'message-summarization',
    timestamp: new Date().toISOString()
  });
}