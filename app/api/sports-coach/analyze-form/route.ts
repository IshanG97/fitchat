// app/api/sports-coach/analyze-form/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSportsCoach } from '@/lib/sports-coach';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, videoData, exerciseType } = body;

    if (!videoData) {
      return NextResponse.json(
        { error: 'Video data is required' },
        { status: 400 }
      );
    }

    const coach = createSportsCoach(userId);
    
    // Analyze form from video data
    const formAnalysis = await coach.analyzeWorkoutForm(videoData);
    
    // Generate voice feedback for the analysis
    const voiceBuffer = await coach.generateVoiceFeedback(formAnalysis);
    const voiceBase64 = Buffer.from(voiceBuffer).toString('base64');
    
    return NextResponse.json({
      analysis: formAnalysis,
      voiceResponse: voiceBase64,
      exerciseType,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Form analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze form' },
      { status: 500 }
    );
  }
}