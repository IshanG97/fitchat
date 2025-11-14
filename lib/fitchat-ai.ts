import OpenAI from 'openai';
import { DatabaseService } from './database';
import { ReminderService } from './reminder-service';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const aiTools = require('../config/ai-tools.json');

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export class FitChatAI {
  
  static async processMessage(
    userId: number, 
    userMessage: string, 
    messageType: string = 'text',
    messageId?: string
  ): Promise<{ reply: string; topic: string; dataRecorded: boolean; toolsUsed: string[]; metricsUpdated: boolean; metricsDetails: string }> {
    
    try {
      // Get recent conversation history
      const recentMessages = await DatabaseService.getRecentMessages(userId, 10);
      const conversationHistory = recentMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.message
      }));

      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      console.log('🧠 Processing message with FitChat AI');

      // Run both completions in parallel for better performance
      const [coachingCompletion, toolCompletion] = await Promise.all([
        // First: Get coaching response without tools
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: aiTools.system_prompts.fitness_coach
            },
            ...conversationHistory
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
        
        // Second: Check for tool calls needed (runs in parallel)
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a data extraction assistant. Extract any metrics, workouts, meals, or reminders from the user's message and call the appropriate tools.\n\nFor METRICS extraction, be aggressive and smart:\n- 'weight is 82kg' → body_weight: 82, unit: 'kg'\n- 'height 171' → height: 171, unit: 'cm' (assume cm for heights 150-200)\n- 'I am 171' → height: 171, unit: 'cm'\n- 'weigh 82' → body_weight: 82, unit: 'kg' (assume kg for weights 40-150)\n- Always extract ALL metrics mentioned in a single message\n\nFor reminders: only create them if the user explicitly asks for reminders AND provides specific times or says to use default times. Do not create reminders for vague requests like 'set reminders' without times. Only call tools if the user mentions specific data that should be recorded."
            },
            ...conversationHistory
          ],
          tools: aiTools.tools, // Include all tools including reminders
          tool_choice: "auto",
          temperature: 0.1,
          max_tokens: 500
        })
      ]);

      // Use coaching response for content, tool response for tools
      const coachingResponse = coachingCompletion.choices[0].message;
      const toolResponse = toolCompletion.choices[0].message;
      
      // Debug: Log both responses
      console.log('🔍 Coaching Response:', coachingResponse.content);
      console.log('🔍 Tool Response - Has tools:', !!toolResponse.tool_calls);
      console.log('🔍 Tool Response - Tool count:', toolResponse.tool_calls?.length || 0);
      
      let dataRecorded = false;
      let topic = 'General';
      let toolsUsed: string[] = [];
      let toolFeedback: string[] = [];

      // Process tool calls if any
      if (toolResponse.tool_calls) {
        console.log(`🔧 Processing ${toolResponse.tool_calls.length} tool calls`);
        
        for (const toolCall of toolResponse.tool_calls) {
          try {
            const feedback = await this.executeTool(toolCall, userId, messageId);
            toolsUsed.push(toolCall.function.name);
            if (feedback) toolFeedback.push(feedback);
            dataRecorded = true;
          } catch (error) {
            console.error(`❌ Tool execution failed for ${toolCall.function.name}:`, error);
            toolFeedback.push(`❌ Failed to execute ${toolCall.function.name}`);
          }
        }
      }

      // Determine topic from the message content
      topic = await this.determineMessageTopic(userMessage);

      // Separate metrics updates from other tool feedback
      let metricsUpdated = false;
      let metricsDetails = '';
      let otherToolFeedback: string[] = [];
      
      toolFeedback.forEach(feedback => {
        if (feedback.includes('**Metrics Updated**')) {
          metricsUpdated = true;
          metricsDetails = feedback;
        } else {
          otherToolFeedback.push(feedback);
        }
      });
      
      // Main response from coaching completion
      let finalReply = coachingResponse.content || 'I understand! Let me help you with that.';
      
      // Only add non-metrics tool feedback to main response
      if (otherToolFeedback.length > 0) {
        const feedbackText = otherToolFeedback.join('\n');
        finalReply = `${finalReply}\n\n${feedbackText}`;
      }

      return {
        reply: finalReply,
        topic,
        dataRecorded,
        toolsUsed,
        metricsUpdated,
        metricsDetails
      };

    } catch (error) {
      console.error('❌ FitChat AI processing failed:', error);
      return {
        reply: "I'm having trouble processing your message right now, but I'm here to help with your fitness journey!",
        topic: 'General',
        dataRecorded: false,
        toolsUsed: [],
        metricsUpdated: false,
        metricsDetails: ''
      };
    }
  }

  private static async executeTool(toolCall: ToolCall, userId: number, messageId?: string): Promise<string | null> {
    const { name, arguments: args } = toolCall.function;
    const parsedArgs = JSON.parse(args);

    console.log(`🔧 Executing tool: ${name}`, parsedArgs);

    switch (name) {
      case 'record_workout':
        return await this.recordWorkout(userId, parsedArgs, messageId);
        
      case 'record_meal':
        return await this.recordMeal(userId, parsedArgs, messageId);
        
      case 'update_user_metrics':
        return await this.updateUserMetrics(userId, parsedArgs);
        
      case 'create_reminders':
        return await this.createReminders(userId, parsedArgs);
        
      case 'get_weight_history':
        return await this.getWeightHistory(userId, parsedArgs);
        
      case 'get_workout_history':
        return await this.getWorkoutHistory(userId, parsedArgs);
        
      case 'get_nutrition_history':
        return await this.getNutritionHistory(userId, parsedArgs);
        
      case 'get_metrics_history':
        return await this.getMetricsHistory(userId, parsedArgs);
        
      case 'get_user_reminders':
        return await this.getUserReminders(userId, parsedArgs);
        
      default:
        console.warn(`Unknown tool: ${name}`);
        return null;
    }
  }

  private static async recordWorkout(userId: number, data: any, messageId?: string): Promise<string> {
    try {
      console.log('🔧 recordWorkout called with data:', JSON.stringify(data, null, 2));
      
      // Get current body weight for exercises that use it
      const bodyWeight = await DatabaseService.getLatestUserMetric(userId, 'body_weight');
      console.log('💪 Body weight found:', bodyWeight?.value || 'none');
      
      // Create workout record
      const workout = await DatabaseService.createWorkout({
        user_id: userId,
        message_id: messageId,
        workout_name: data.workout_name,
        workout_type: data.workout_type,
        duration_minutes: data.duration_minutes,
        notes: data.notes,
        completed_at: new Date().toISOString()
      });

      // Add exercises
      for (const exercise of data.exercises) {
        await DatabaseService.createWorkoutExercise({
          workout_id: workout.id,
          exercise_name: exercise.exercise_name,
          exercise_type: exercise.exercise_type,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          distance: exercise.distance,
          duration_seconds: exercise.duration_seconds,
          uses_body_weight: exercise.uses_body_weight,
          body_weight_used: exercise.uses_body_weight ? bodyWeight?.value : null,
          notes: exercise.notes
        });
      }

      console.log(`✅ Recorded workout with ${data.exercises.length} exercises`);
      return `📝 **Workout Recorded**: Saved ${data.exercises.length} exercises${data.workout_name ? ` for "${data.workout_name}"` : ''} to your fitness log`;
    } catch (error) {
      console.error('❌ Failed to record workout:', error);
      throw error;
    }
  }

  private static async recordMeal(userId: number, data: any, messageId?: string): Promise<string> {
    try {
      await DatabaseService.createMeal({
        user_id: userId,
        message_id: messageId,
        meal_type: data.meal_type,
        meal_description: data.meal_description,
        estimated_calories: data.estimated_calories,
        confidence_score: data.confidence_score,
        protein_grams: data.protein_grams,
        carbs_grams: data.carbs_grams,
        fat_grams: data.fat_grams,
        fiber_grams: data.fiber_grams,
        consumed_at: new Date().toISOString()
      });

      console.log(`✅ Recorded meal: ${data.meal_description} (${data.estimated_calories} cal)`);
      
      const confidenceText = data.confidence_score ? 
        ` (${Math.round(data.confidence_score * 100)}% confidence)` : '';
      
      return `🍽️ **Meal Logged**: ${data.meal_description} - ${data.estimated_calories} calories${confidenceText}`;
    } catch (error) {
      console.error('❌ Failed to record meal:', error);
      throw error;
    }
  }

  private static async updateUserMetrics(userId: number, data: any): Promise<string> {
    try {
      console.log('🔍 Metrics being processed:', JSON.stringify(data.metrics, null, 2));
      
      for (const metric of data.metrics) {
        await DatabaseService.createUserMetric({
          user_id: userId,
          metric_type: metric.metric_type,
          value: metric.value,
          unit: metric.unit,
          source: metric.source || 'user_prompt',
          recorded_at: new Date().toISOString()
        });
      }

      console.log(`✅ Updated ${data.metrics.length} user metrics`);
      
      const metricsList = data.metrics.map((m: any) => 
        `${m.metric_type.replace('_', ' ')}: ${m.value} ${m.unit}`
      ).join(', ');
      
      return `📊 **Metrics Updated**: ${metricsList}`;
    } catch (error) {
      console.error('❌ Failed to update user metrics:', error);
      throw error;
    }
  }

  private static async createReminders(userId: number, data: any): Promise<string> {
    try {
      console.log('🔧 createReminders called with data:', JSON.stringify(data, null, 2));
      
      const createdReminders: string[] = [];
      
      for (const reminder of data.reminders) {
        await ReminderService.createReminder(
          userId,
          reminder.title,
          reminder.reminder_type,
          reminder.frequency,
          reminder.frequency_details,
          reminder.message
        );

        let scheduleText = '';
        
        if (reminder.frequency === 'daily') {
          const time = reminder.frequency_details?.time || 'time not set';
          scheduleText = `daily at ${time}`;
        } else if (reminder.frequency === 'weekly' && reminder.frequency_details?.days) {
          const days = reminder.frequency_details.days;
          const time = reminder.frequency_details?.time || 'time not set';
          const dayNames = days.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
          scheduleText = `${dayNames} at ${time}`;
        } else if (reminder.frequency === 'monthly') {
          const time = reminder.frequency_details?.time || 'time not set';
          scheduleText = `monthly at ${time}`;
        } else {
          const time = reminder.frequency_details?.time || 'time not set';
          scheduleText = `${reminder.frequency} at ${time}`;
        }
        
        createdReminders.push(`"${reminder.title}" - ${scheduleText}`);
      }

      console.log(`✅ Created ${data.reminders.length} reminders`);
      
      return `⏰ **Reminders Set**: ${createdReminders.join(', ')}`;
    } catch (error) {
      console.error('❌ Failed to create reminders:', error);
      throw error;
    }
  }

  private static async determineMessageTopic(message: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use cheaper model for topic classification
        messages: [
          {
            role: "system",
            content: aiTools.system_prompts.topic_classifier
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      });

      const topic = completion.choices[0]?.message?.content?.trim();
      
      // Validate topic
      const validTopics = ['Workout', 'Nutrition', 'Goals', 'Progress', 'Recovery', 'General'];
      return validTopics.includes(topic || '') ? topic! : 'General';
      
    } catch (error) {
      console.error('❌ Topic determination failed:', error);
      return 'General';
    }
  }

  // Database query methods for historical data
  private static async getWeightHistory(userId: number, data: any): Promise<string> {
    try {
      const days = data.days || 30;
      const limit = data.limit || 50;
      
      const weightData = await DatabaseService.getUserMetricHistory(userId, 'body_weight', days, limit);
      
      if (!weightData || weightData.length === 0) {
        return "📊 **Weight History**: No weight data found. Start tracking by telling me your current weight!";
      }
      
      const recentWeight = weightData[0];
      const oldestWeight = weightData[weightData.length - 1];
      const weightChange = recentWeight.value - oldestWeight.value;
      const changeText = weightChange > 0 ? `+${weightChange.toFixed(1)}` : `${weightChange.toFixed(1)}`;
      
      let summary = `📊 **Weight History** (last ${days} days):\n`;
      summary += `Current: ${recentWeight.value} ${recentWeight.unit}\n`;
      summary += `Change: ${changeText} ${recentWeight.unit} over ${days} days\n`;
      summary += `Records: ${weightData.length} entries`;
      
      return summary;
    } catch (error) {
      console.error('❌ Failed to get weight history:', error);
      return "📊 **Weight History**: Unable to retrieve weight data right now.";
    }
  }

  private static async getWorkoutHistory(userId: number, data: any): Promise<string> {
    try {
      const days = data.days || 30;
      const limit = data.limit || 20;
      const workoutType = data.workout_type;
      
      const workouts = await DatabaseService.getUserWorkoutHistory(userId, days, limit, workoutType);
      
      if (!workouts || workouts.length === 0) {
        return "🏋️ **Workout History**: No workouts found. Let's get started - tell me about your next workout!";
      }
      
      let summary = `🏋️ **Workout History** (last ${days} days):\n`;
      summary += `Total workouts: ${workouts.length}\n`;
      
      const typeCount = workouts.reduce((acc: any, w) => {
        acc[w.workout_type || 'other'] = (acc[w.workout_type || 'other'] || 0) + 1;
        return acc;
      }, {});
      
      summary += `Types: ${Object.entries(typeCount).map(([type, count]) => `${type} (${count})`).join(', ')}`;
      
      return summary;
    } catch (error) {
      console.error('❌ Failed to get workout history:', error);
      return "🏋️ **Workout History**: Unable to retrieve workout data right now.";
    }
  }

  private static async getNutritionHistory(userId: number, data: any): Promise<string> {
    try {
      const days = data.days || 7;
      const limit = data.limit || 30;
      
      const meals = await DatabaseService.getUserNutritionHistory(userId, days, limit);
      
      if (!meals || meals.length === 0) {
        return "🍽️ **Nutrition History**: No meal data found. Start logging by describing what you eat!";
      }
      
      const totalCalories = meals.reduce((sum, meal) => sum + meal.estimated_calories, 0);
      const avgDailyCalories = Math.round(totalCalories / days);
      
      let summary = `🍽️ **Nutrition History** (last ${days} days):\n`;
      summary += `Total meals logged: ${meals.length}\n`;
      summary += `Average daily calories: ${avgDailyCalories}\n`;
      summary += `Total calories: ${Math.round(totalCalories)}`;
      
      return summary;
    } catch (error) {
      console.error('❌ Failed to get nutrition history:', error);
      return "🍽️ **Nutrition History**: Unable to retrieve nutrition data right now.";
    }
  }

  private static async getMetricsHistory(userId: number, data: any): Promise<string> {
    try {
      const metricType = data.metric_type;
      const days = data.days || 30;
      const limit = data.limit || 50;
      
      const metrics = await DatabaseService.getUserMetricHistory(userId, metricType, days, limit);
      
      if (!metrics || metrics.length === 0) {
        return `📊 **${metricType.replace('_', ' ')} History**: No data found for this metric.`;
      }
      
      const recent = metrics[0];
      const oldest = metrics[metrics.length - 1];
      const change = recent.value - oldest.value;
      const changeText = change > 0 ? `+${change.toFixed(1)}` : `${change.toFixed(1)}`;
      
      let summary = `📊 **${metricType.replace('_', ' ')} History** (last ${days} days):\n`;
      summary += `Current: ${recent.value} ${recent.unit}\n`;
      summary += `Change: ${changeText} ${recent.unit}\n`;
      summary += `Records: ${metrics.length} entries`;
      
      return summary;
    } catch (error) {
      console.error('❌ Failed to get metrics history:', error);
      return `📊 **Metrics History**: Unable to retrieve ${data.metric_type} data right now.`;
    }
  }

  private static async getUserReminders(userId: number, data: any): Promise<string> {
    try {
      const reminderType = data.reminder_type;
      const activeOnly = data.active_only !== false; // default true
      
      const reminders = await DatabaseService.getUserReminders(userId, reminderType, activeOnly);
      
      if (!reminders || reminders.length === 0) {
        return "⏰ **Your Reminders**: No reminders found. Want me to set some up for you?";
      }
      
      let summary = `⏰ **Your Current Reminders**:\n`;
      
      reminders.forEach((reminder, index) => {
        const days = reminder.frequency_details?.days;
        const time = reminder.frequency_details?.time || 'time not set';
        
        let schedule = '';
        if (reminder.frequency === 'daily') {
          schedule = `Daily at ${time}`;
        } else if (reminder.frequency === 'weekly' && days) {
          schedule = `${days.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')} at ${time}`;
        } else if (reminder.frequency === 'monthly') {
          schedule = `Monthly at ${time}`;
        } else {
          schedule = `${reminder.frequency} at ${time}`;
        }
        
        summary += `${index + 1}. ${reminder.title} - ${schedule}\n`;
      });
      
      return summary.trim();
    } catch (error) {
      console.error('❌ Failed to get user reminders:', error);
      return "⏰ **Your Reminders**: Unable to retrieve reminders right now.";
    }
  }

  // Image analysis method
  static async analyzeImage(imagePath: string): Promise<string> {
    try {
      const fs = require('fs');
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image. If it's a food/meal image, provide a detailed description of the food items you see, estimated portions, and any relevant nutritional context. If it's NOT food-related (e.g., workout equipment, gym photos, etc.), simply describe what you see briefly and acknowledge it's not a meal. Be natural and conversational in your response."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content ||
        "I can see your image, but I'm having trouble analyzing it right now.";

    } catch (error) {
      console.error('❌ Image analysis failed:', error);
      throw error;
    }
  }

  // Video analysis method (consolidated from separate function)
  static async analyzeWorkoutVideo(framePaths: string[]): Promise<string> {
    try {
      const base64Frames = framePaths.map(framePath => {
        const fs = require('fs');
        const imageBuffer = fs.readFileSync(framePath);
        return imageBuffer.toString('base64');
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this workout video frames for form, technique, and provide detailed feedback. Focus on:\n- Exercise identification\n- Form assessment (good/needs improvement)\n- Specific technique cues\n- Safety considerations\n- Motivational feedback\nProvide constructive, encouraging feedback."
              },
              ...base64Frames.map(base64 => ({
                type: "image_url" as const,
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: "high" as const
                }
              }))
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || 
        "I can see your workout video, but I'm having trouble analyzing it right now. Keep up the great work!";

    } catch (error) {
      console.error('❌ Video analysis failed:', error);
      throw error;
    }
  }
}