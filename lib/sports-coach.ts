// lib/sports-coach.ts
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import axios from 'axios';

export interface WorkoutData {
  type: string;
  duration: number;
  intensity: number;
  heartRate?: number;
  caloriesBurned?: number;
  timestamp: Date;
}

export interface BiometricData {
  heartRate: number;
  steps: number;
  sleepHours: number;
  recoveryScore: number;
  fatigueLevel: number;
}

export interface TrainingPlan {
  id: string;
  name: string;
  workouts: WorkoutData[];
  duration: number;
  goals: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PerformanceDiary {
  date: string;
  mood: number;
  energy: number;
  goals: string[];
  achievements: string[];
  reflections: string;
}

export class SportsCoach {
  private elevenLabs: ElevenLabsClient;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.elevenLabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY || '',
    });
  }

  async generateVoiceFeedback(message: string): Promise<ArrayBuffer> {
    try {
      const audioStream = await this.elevenLabs.textToSpeech.convert(
        "21m00Tcm4TlvDq8ikWAM", // Rachel voice
        {
          text: message,
          modelId: "eleven_monolingual_v1",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.8,
            style: 0.2,
          },
        }
      );

      // Convert stream to ArrayBuffer
      const reader = audioStream.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result.buffer;
    } catch (error) {
      console.error('Error generating voice feedback:', error);
      // Return empty ArrayBuffer on error
      return new ArrayBuffer(0);
    }
  }

  async analyzeWorkoutForm(_videoData: string): Promise<string> {
    const formAnalysis = {
      posture: "Good",
      alignment: "Needs improvement",
      timing: "Excellent",
      recommendations: [
        "Keep your core engaged throughout the movement",
        "Focus on controlling the eccentric phase",
        "Maintain neutral spine position"
      ]
    };

    return this.generateFeedbackMessage(formAnalysis);
  }

  async adjustTrainingPlan(biometrics: BiometricData, currentPlan: TrainingPlan): Promise<TrainingPlan> {
    const adjustedPlan = { ...currentPlan };
    
    if (biometrics.fatigueLevel > 7) {
      adjustedPlan.workouts = adjustedPlan.workouts.map(workout => ({
        ...workout,
        intensity: Math.max(workout.intensity - 0.2, 0.3),
        duration: Math.max(workout.duration * 0.8, 20)
      }));
    } else if (biometrics.recoveryScore > 8) {
      adjustedPlan.workouts = adjustedPlan.workouts.map(workout => ({
        ...workout,
        intensity: Math.min(workout.intensity + 0.1, 1.0),
        duration: Math.min(workout.duration * 1.1, 90)
      }));
    }

    return adjustedPlan;
  }

  async getWeatherBasedExercises(location: string): Promise<string[]> {
    try {
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      );

      const weather = weatherResponse.data.weather[0].main.toLowerCase();
      const temp = weatherResponse.data.main.temp;

      if (weather.includes('rain')) {
        return ['Indoor yoga', 'Bodyweight circuits', 'Stair climbing', 'Indoor cardio'];
      } else if (temp > 25) {
        return ['Swimming', 'Early morning runs', 'Outdoor yoga', 'Beach volleyball'];
      } else if (temp < 10) {
        return ['Indoor cycling', 'Hot yoga', 'Gym workouts', 'Mall walking'];
      } else {
        return ['Hiking', 'Outdoor running', 'Park workouts', 'Cycling'];
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return ['General fitness', 'Cardio', 'Strength training', 'Flexibility work'];
    }
  }

  async createPerformanceDiary(entry: Partial<PerformanceDiary>): Promise<PerformanceDiary> {
    const diaryEntry: PerformanceDiary = {
      date: new Date().toISOString().split('T')[0],
      mood: entry.mood || 5,
      energy: entry.energy || 5,
      goals: entry.goals || [],
      achievements: entry.achievements || [],
      reflections: entry.reflections || '',
    };

    // Store in database (mock for now)
    console.log('Saving diary entry:', diaryEntry);
    
    return diaryEntry;
  }

  async generateMotivationalMessage(biometrics: BiometricData, recentPerformance: WorkoutData[]): Promise<string> {
    const averageIntensity = recentPerformance.reduce((sum, workout) => sum + workout.intensity, 0) / recentPerformance.length;
    
    let message = "Hey champion! ";
    
    if (biometrics.recoveryScore > 7) {
      message += "Your recovery looks great! This is the perfect time to push yourself a bit harder. ";
    } else if (biometrics.fatigueLevel > 6) {
      message += "I can see you've been working hard. Remember, rest is when the magic happens. ";
    }

    if (averageIntensity > 0.8) {
      message += "Your intensity has been incredible lately. You're crushing your goals!";
    } else if (averageIntensity < 0.5) {
      message += "Every small step counts. Let's gradually build up that intensity together.";
    }

    return message;
  }

  async processConversation(userInput: string, _context: unknown): Promise<string> {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('tired') || lowerInput.includes('fatigue')) {
      return "I understand you're feeling tired. Let's focus on some light recovery exercises today. How about some gentle stretching or a short walk?";
    }
    
    if (lowerInput.includes('motivated') || lowerInput.includes('energy')) {
      return "That's the spirit! Let's channel that energy into a great workout. What type of exercise are you in the mood for today?";
    }
    
    if (lowerInput.includes('form') || lowerInput.includes('technique')) {
      return "Form is everything! I'll analyze your movement and give you real-time feedback. Make sure your camera can see your full body.";
    }
    
    if (lowerInput.includes('plan') || lowerInput.includes('schedule')) {
      return "Let me create a personalized plan for you. I'll consider your current fitness level, goals, and recovery status.";
    }
    
    return "I'm here to help you achieve your fitness goals! Tell me how you're feeling today or what you'd like to work on.";
  }

  private generateFeedbackMessage(analysis: { posture?: string; recommendations?: string[] }): string {
    let feedback = "Great work! Here's what I observed: ";
    
    if (analysis.posture === "Good") {
      feedback += "Your posture looks solid. ";
    } else {
      feedback += "Let's work on your posture a bit. ";
    }
    
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      feedback += "Here are some tips: " + analysis.recommendations.join(". ") + ".";
    }
    
    return feedback;
  }
}

export function createSportsCoach(userId: string): SportsCoach {
  return new SportsCoach(userId);
}