// app/api/sports-coach/training-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSportsCoach, type BiometricData, type TrainingPlan } from '@/lib/sports-coach';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, biometrics, currentPlan, location } = body;

    const coach = createSportsCoach(userId);
    
    // Adjust training plan based on biometrics
    let adjustedPlan: TrainingPlan;
    if (currentPlan && biometrics) {
      adjustedPlan = await coach.adjustTrainingPlan(biometrics as BiometricData, currentPlan as TrainingPlan);
    } else {
      // Create a default plan if none provided
      adjustedPlan = {
        id: 'default-' + Date.now(),
        name: 'Personalized Fitness Plan',
        workouts: [
          {
            type: 'cardio',
            duration: 30,
            intensity: 0.7,
            timestamp: new Date(),
          },
          {
            type: 'strength',
            duration: 45,
            intensity: 0.8,
            timestamp: new Date(),
          },
          {
            type: 'flexibility',
            duration: 20,
            intensity: 0.5,
            timestamp: new Date(),
          }
        ],
        duration: 7,
        goals: ['Build endurance', 'Increase strength', 'Improve flexibility'],
        difficulty: 'intermediate',
      };
    }
    
    // Get weather-based exercise suggestions
    const weatherExercises = location ? await coach.getWeatherBasedExercises(location) : [];
    
    // Generate motivational message
    const motivationalMessage = biometrics ? 
      await coach.generateMotivationalMessage(biometrics as BiometricData, adjustedPlan.workouts) :
      "Ready to crush your fitness goals? Let's make today count!";
    
    // Generate voice feedback
    const voiceBuffer = await coach.generateVoiceFeedback(motivationalMessage);
    const voiceBase64 = Buffer.from(voiceBuffer).toString('base64');
    
    return NextResponse.json({
      trainingPlan: adjustedPlan,
      weatherExercises,
      motivationalMessage,
      voiceResponse: voiceBase64,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Training plan error:', error);
    return NextResponse.json(
      { error: 'Failed to generate training plan' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const location = searchParams.get('location');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const coach = createSportsCoach(userId);
    
    // Get weather-based exercises
    const weatherExercises = location ? await coach.getWeatherBasedExercises(location) : [];
    
    return NextResponse.json({
      weatherExercises,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Weather exercises error:', error);
    return NextResponse.json(
      { error: 'Failed to get weather exercises' },
      { status: 500 }
    );
  }
}