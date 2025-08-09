// app/api/sports-coach/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSportsCoach } from '@/lib/sports-coach';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, message, context } = body;

    const coach = createSportsCoach(userId);
    
    // Generate conversational response
    const textResponse = await coach.processConversation(message, context);
    
    // Generate voice feedback
    const voiceBuffer = await coach.generateVoiceFeedback(textResponse);
    
    // Convert ArrayBuffer to base64 for JSON response
    const voiceBase64 = Buffer.from(voiceBuffer).toString('base64');
    
    return NextResponse.json({
      textResponse,
      voiceResponse: voiceBase64,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Sports coach feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}