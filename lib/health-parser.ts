// lib/health-parser.ts
import { DatabaseService } from './database';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface WorkoutParsingResult {
  success: boolean;
  workout?: {
    name?: string;
    type?: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
    duration_minutes?: number;
    exercises: {
      name: string;
      type?: 'strength' | 'cardio' | 'flexibility' | 'isometric';
      sets?: number;
      reps?: number[];
      weight?: number;
      distance?: number;
      duration_seconds?: number;
      uses_body_weight?: boolean;
    }[];
  };
  missingInfo?: string[];
  questions?: string[];
}

export interface MealParsingResult {
  success: boolean;
  meal?: {
    type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
    description: string;
    estimated_calories: number;
    confidence_score: number;
    protein_grams?: number;
    carbs_grams?: number;
    fat_grams?: number;
    fiber_grams?: number;
  };
  questions?: string[];
}

// Check if exercise uses body weight
export function exerciseUsesBodyweight(exerciseName: string): boolean {
  const bodyweightExercises = [
    'push-up', 'pushup', 'push up',
    'pull-up', 'pullup', 'pull up', 'chin-up', 'chinup', 'chin up',
    'dip', 'dips',
    'squat', 'squats', 'air squat', 'bodyweight squat',
    'lunge', 'lunges',
    'burpee', 'burpees',
    'plank', 'planks',
    'sit-up', 'situp', 'sit up', 'crunches', 'crunch',
    'jumping jack', 'jumping jacks',
    'mountain climber', 'mountain climbers'
  ];
  
  return bodyweightExercises.some(bw => 
    exerciseName.toLowerCase().includes(bw.toLowerCase())
  );
}

// Parse workout description using AI
export async function parseWorkoutDescription(description: string, userId: number): Promise<WorkoutParsingResult> {
  try {
    // First, check what data we need from the user
    const missingPrompts = await DatabaseService.getRequiredHealthPrompts(userId, 'workout');
    
    // Use AI to parse the workout description
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a fitness tracking assistant. Parse workout descriptions and extract structured data.

Return JSON with this exact structure:
{
  "workout": {
    "name": "optional workout name",
    "type": "strength|cardio|flexibility|sports|other",
    "duration_minutes": number or null,
    "exercises": [
      {
        "name": "exact exercise name",
        "type": "strength|cardio|flexibility|isometric",
        "sets": number or null,
        "reps": [array of reps per set] or null,
        "weight": number or null,
        "distance": number or null,
        "duration_seconds": number or null,
        "uses_body_weight": boolean
      }
    ]
  },
  "confidence": 0.0-1.0,
  "needs_clarification": ["list of unclear items"]
}

Examples:
- "3 sets of 10 push-ups" -> reps: [10, 10, 10], uses_body_weight: true
- "bench pressed 185" -> weight: 185, needs clarification about sets/reps
- "ran 5 miles in 30 minutes" -> distance: 5, duration_seconds: 1800`
        },
        {
          role: "user",
          content: `Parse this workout: "${description}"`
        }
      ],
      temperature: 0.2,
      max_tokens: 1000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(response);
    
    // Check if we need additional info
    const questions: string[] = [];
    
    // Add body weight question if needed
    if (missingPrompts.includes('body_weight')) {
      const hasBodyweightExercise = parsed.workout.exercises.some((ex: any) => ex.uses_body_weight);
      if (hasBodyweightExercise) {
        questions.push("I'd love to track this properly! What's your current body weight? This helps me calculate the total resistance you're moving.");
      }
    }
    
    // Add clarification questions from AI
    if (parsed.needs_clarification && parsed.needs_clarification.length > 0) {
      if (parsed.needs_clarification.includes('sets') || parsed.needs_clarification.includes('reps')) {
        questions.push("How many sets and reps did you do?");
      }
      if (parsed.needs_clarification.includes('weight')) {
        questions.push("How much weight did you use?");
      }
      if (parsed.needs_clarification.includes('duration')) {
        questions.push("How long did the exercise take?");
      }
    }

    return {
      success: questions.length === 0,
      workout: parsed.workout,
      missingInfo: missingPrompts.concat(parsed.needs_clarification || []),
      questions
    };

  } catch (error) {
    console.error('Error parsing workout:', error);
    return {
      success: false,
      questions: ["I'd love to help track your workout! Can you tell me more details about what exercises you did, how many sets and reps?"]
    };
  }
}

// Parse meal description using AI
export async function parseMealDescription(description: string): Promise<MealParsingResult> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a nutrition tracking assistant. Parse meal descriptions and estimate nutritional information.

Return JSON with this exact structure:
{
  "meal": {
    "type": "breakfast|lunch|dinner|snack|other",
    "description": "cleaned up meal description",
    "estimated_calories": number,
    "confidence_score": 0.0-1.0,
    "protein_grams": number or null,
    "carbs_grams": number or null,
    "fat_grams": number or null,
    "fiber_grams": number or null
  }
}

Estimate calories conservatively but realistically. Include macros if you can estimate them with reasonable confidence (>0.6).
For ambiguous portions, ask for clarification.`
        },
        {
          role: "user",
          content: `Analyze this meal: "${description}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(response);
    
    // Check if we need clarification
    const questions: string[] = [];
    
    if (parsed.meal.confidence_score < 0.5) {
      questions.push("Can you provide more details about portion sizes or preparation method? This will help me give you a more accurate calorie estimate.");
    }

    return {
      success: questions.length === 0,
      meal: parsed.meal,
      questions
    };

  } catch (error) {
    console.error('Error parsing meal:', error);
    return {
      success: false,
      questions: ["I'd love to help track your meal! Can you describe what you ate with portion sizes?"]
    };
  }
}

// Log workout to database
export async function logWorkoutToDatabase(
  userId: number,
  conversationId: number,
  workoutData: any,
  messageId?: string
): Promise<{workout: any, exercises: any[]}> {
  // Get current body weight if needed
  let bodyWeight: number | null = null;
  const hasBodyweightExercise = workoutData.exercises.some((ex: any) => ex.uses_body_weight);
  
  if (hasBodyweightExercise) {
    bodyWeight = await DatabaseService.getLatestBodyWeight(userId);
  }

  // Create workout
  const workout = await DatabaseService.createWorkout({
    user_id: userId,
    conversation_id: conversationId,
    message_id: messageId,
    workout_name: workoutData.name,
    workout_type: workoutData.type,
    duration_minutes: workoutData.duration_minutes,
    completed_at: new Date().toISOString()
  });

  // Add exercises
  const exercises = [];
  for (const exerciseData of workoutData.exercises) {
    const exercise = await DatabaseService.addExerciseToWorkout({
      workout_id: workout.id,
      exercise_name: exerciseData.name,
      exercise_type: exerciseData.type,
      sets: exerciseData.sets,
      reps: exerciseData.reps,
      weight: exerciseData.weight,
      distance: exerciseData.distance,
      duration_seconds: exerciseData.duration_seconds,
      uses_body_weight: exerciseData.uses_body_weight || false,
      body_weight_used: exerciseData.uses_body_weight ? bodyWeight : undefined,
      notes: exerciseData.notes
    });
    exercises.push(exercise);
  }

  return { workout, exercises };
}

// Log meal to database
export async function logMealToDatabase(
  userId: number,
  conversationId: number,
  mealData: any,
  messageId?: string
): Promise<any> {
  return await DatabaseService.createMeal({
    user_id: userId,
    conversation_id: conversationId,
    message_id: messageId,
    meal_type: mealData.type,
    meal_description: mealData.description,
    estimated_calories: mealData.estimated_calories,
    confidence_score: mealData.confidence_score,
    protein_grams: mealData.protein_grams,
    carbs_grams: mealData.carbs_grams,
    fat_grams: mealData.fat_grams,
    fiber_grams: mealData.fiber_grams,
    consumed_at: new Date().toISOString()
  });
}