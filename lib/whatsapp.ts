// lib/whatsapp.ts
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { DatabaseService } from './database';
import { createSportsCoach } from './sports-coach';
import OpenAI from 'openai';

import prompts from '../config/prompts.json';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID!;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MessageData {
  sender_wa_id: string;
  sender_name: string;
  text?: string;
  audio_id?: string;
  video_id?: string;
  message_id?: string;
  timestamp?: string;
  type?: string;
  raw?: any;
}

export function extract_message_data(body: any): MessageData | null {
  try {
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message) return null;

    const messageType = message.type;

    return {
      sender_wa_id: message.from,
      sender_name: contact?.profile?.name || 'Unknown',
      message_id: message.id,
      timestamp: message.timestamp,
      type: messageType,
      text: messageType === 'text' ? message.text?.body : undefined,
      audio_id: messageType === 'audio' ? message.audio?.id : undefined,
      video_id: messageType === 'video' ? message.video?.id : undefined,
      raw: message,
    };
  } catch (error) {
    console.error('⚠️ Error extracting message:', error);
    return null;
  }
}

export async function download_whatsapp_audio(audioId: string): Promise<string> {
  try {
    // Get media URL
    const mediaResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${audioId}`,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        },
      }
    );

    const mediaUrl = mediaResponse.data.url;

    // Download the audio file
    const audioResponse = await axios.get(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      },
      responseType: 'stream',
    });

    // Save to temporary file
    const tempDir = '/tmp';
    const fileName = `audio_${audioId}_${Date.now()}.ogg`;
    const filePath = path.join(tempDir, fileName);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const writer = fs.createWriteStream(filePath);
    audioResponse.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading WhatsApp audio:', error);
    throw error;
  }
}

export async function download_whatsapp_video(videoId: string): Promise<string> {
  try {
    // Get media URL
    const mediaResponse = await axios.get(
      `https://graph.facebook.com/v22.0/${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        },
      }
    );

    const mediaUrl = mediaResponse.data.url;

    // Download the video file
    const videoResponse = await axios.get(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      },
      responseType: 'stream',
    });

    // Save to temporary file
    const tempDir = '/tmp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = `${tempDir}/video_${Date.now()}.mp4`;
    const writer = fs.createWriteStream(filePath);
    videoResponse.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading WhatsApp video:', error);
    throw error;
  }
}

export async function extract_video_frames(videoPath: string, frameCount: number = 5): Promise<string[]> {
  try {
    const frameDir = `/tmp/frames_${Date.now()}`;
    if (!fs.existsSync(frameDir)) {
      fs.mkdirSync(frameDir, { recursive: true });
    }

    // Check if ffmpeg is available
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      // First check if ffmpeg exists
      const checkFFmpeg = spawn('ffmpeg', ['-version']);
      
      checkFFmpeg.on('error', (error: any) => {
        if (error.code === 'ENOENT') {
          console.warn('⚠️ FFmpeg not found. Please install FFmpeg to enable video frame extraction.');
          console.warn('📋 Install instructions:');
          console.warn('   Windows: choco install ffmpeg');
          console.warn('   macOS: brew install ffmpeg');
          console.warn('   Ubuntu: sudo apt install ffmpeg');
          reject(new Error('FFmpeg not installed. Video analysis requires FFmpeg to extract frames.'));
        } else {
          reject(error);
        }
      });

      checkFFmpeg.on('close', (code: any) => {
        if (code === 0 || code === 1) { // FFmpeg exists (returns 1 for version check)
          // FFmpeg is available, proceed with frame extraction
          const ffmpeg = spawn('ffmpeg', [
            '-i', videoPath,
            '-vf', `select='not(mod(n\\,${Math.floor(30 / frameCount)}))',scale=640:480`,
            '-vsync', 'vfr',
            '-q:v', '2',
            `${frameDir}/frame_%03d.jpg`
          ]);

          ffmpeg.stderr.on('data', (data: any) => {
            console.log('FFmpeg:', data.toString());
          });

          ffmpeg.on('close', (code: any) => {
            if (code === 0) {
              const frameFiles = fs.readdirSync(frameDir)
                .filter(file => file.endsWith('.jpg'))
                .map(file => `${frameDir}/${file}`)
                .sort();
              
              resolve(frameFiles.slice(0, frameCount));
            } else {
              reject(new Error(`FFmpeg process exited with code ${code}`));
            }
          });

          ffmpeg.on('error', (error: any) => {
            reject(error);
          });
        }
      });
    });
  } catch (error) {
    console.error('Error extracting video frames:', error);
    throw error;
  }
}

export async function analyze_workout_form(framePaths: string[]): Promise<string> {
  try {
    // Convert frames to base64 for GPT-4o Vision
    const frameImages = framePaths.map(framePath => {
      const imageBuffer = fs.readFileSync(framePath);
      const base64Image = imageBuffer.toString('base64');
      return {
        type: "image_url" as const,
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`,
          detail: "high" as const
        }
      };
    });

    // Analyze frames with GPT-4o Vision
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompts.video_form_analysis.replace('{frame_count}', framePaths.length.toString())
            },
            ...frameImages
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    return completion.choices[0]?.message?.content || "Unable to analyze workout form. Please ensure the video shows clear exercise movements.";
  } catch (error) {
    console.error('Error analyzing workout form:', error);
    throw error;
  }
}

export async function transcribe_audio(audioPath: string): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      language: 'en',
    });

    // Clean up temporary file
    try {
      fs.unlinkSync(audioPath);
    } catch (cleanupError) {
      console.warn('Could not clean up audio file:', cleanupError);
    }

    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

export async function generate_video_followup_response(senderId: string, analysisResult: string): Promise<{ reply: string; topic: string }> {
  try {
    // Get user from database
    const user = await DatabaseService.getUserByPhone(senderId);
    if (!user) {
      throw new Error(`User not found: ${senderId}`);
    }

    // Build followup prompt
    const followupPrompt = prompts.video_analysis_followup
      .replace('{analysis_result}', analysisResult);

    // Generate response using GPT-5-mini
    const completion = await openai.responses.create({
      model: 'gpt-5-mini',
      input: followupPrompt,
      reasoning: {
        effort: "low" as const
      },
      store: true
    });

    const response = completion.output_text || "Great job sharing your workout video! Keep focusing on your form and you'll see amazing progress.";
    
    return { reply: response, topic: 'Workout' };
  } catch (error) {
    console.error('Error generating video followup:', error);
    return { 
      reply: "Thanks for sharing your workout video! Keep up the great work on improving your form.", 
      topic: 'Workout' 
    };
  }
}

export async function generate_llm_response(senderId: string): Promise<{ reply: string; topic?: string; tool_call?: any }> {
  try {
    // Get user from database
    const user = await DatabaseService.getUserByPhone(senderId);
    if (!user) {
      throw new Error(`User not found: ${senderId}`);
    }

    // Get recent conversation history
    const recentMessages = await DatabaseService.getRecentMessages(user.id, 10);
    
    // Build conversation input using prompts
    const systemPrompt = prompts.fitness_coach_system
      .replace('{user_name}', user.name)
      .replace('{user_personality}', user.personality || 'balanced');

    let conversationInput = systemPrompt + '\n\n';

    // Add conversation history
    if (recentMessages.length > 0) {
      conversationInput += "Conversation history:\n";
      recentMessages.forEach(msg => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        conversationInput += `${role}: ${msg.message}\n`;
      });
      conversationInput += "\nRespond to the user's latest message:";
    }

    // Generate response using OpenAI Responses API
    const completion = await openai.responses.create({
      model: 'gpt-5-mini',
      input: conversationInput,
      reasoning: {
        effort: "low" as const
      },
      store: true
    });

    // Extract response content from GPT-5 Responses API
    const response = completion.output_text || "I'm here to help with your fitness journey!";
    const latestMessage = recentMessages[recentMessages.length - 1]?.message || 'Hello';
    
    // Determine topic based on conversation content
    let topic = 'General';
    const lowerMessage = latestMessage.toLowerCase();
    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise') || lowerMessage.includes('train')) {
      topic = 'Workout';
    } else if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('food')) {
      topic = 'Nutrition';
    } else if (lowerMessage.includes('recovery') || lowerMessage.includes('sleep') || lowerMessage.includes('rest')) {
      topic = 'Recovery';
    } else if (lowerMessage.includes('goal') || lowerMessage.includes('progress')) {
      topic = 'Goals';
    }

    return {
      reply: response,
      topic,
    };
  } catch (error) {
    console.error('Error generating LLM response:', error);
    return {
      reply: "I'm having trouble processing your request right now. Please try again in a moment!",
      topic: 'General'
    };
  }
}

export function get_intent(history: any): { type?: string; content?: string } {
  // Simple intent detection - can be enhanced with more sophisticated NLP
  if (!history || !Array.isArray(history.recentMessages)) {
    return {};
  }

  const lastMessage = history.recentMessages[history.recentMessages.length - 1]?.toLowerCase() || '';
  
  if (lastMessage.includes('remind me') || lastMessage.includes('reminder')) {
    return {
      type: 'reminder',
      content: lastMessage
    };
  }
  
  if (lastMessage.includes('goal') || lastMessage.includes('target')) {
    return {
      type: 'goal',
      content: lastMessage
    };
  }

  return {};
}

export async function send_text_message(toNumber: string, message: string): Promise<void> {
  try {
    const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;
    
    // Debug: uncomment next lines if token issues occur
    // const tokenPreview = WHATSAPP_TOKEN ? 
    //   `${WHATSAPP_TOKEN.substring(0, 10)}...${WHATSAPP_TOKEN.substring(WHATSAPP_TOKEN.length - 10)}` : 'undefined';
    // console.log('🔑 Token preview:', tokenPreview);
    // console.log('📞 Phone number ID:', PHONE_NUMBER_ID);
    
    const payload = {
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'text',
      text: {
        body: message,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📤 Status:', response.status);
    console.log('📤 Response:', response.data);
  } catch (error) {
    console.error('Error sending text message:', error);
    throw error;
  }
}

export async function generate_voice_with_elevenlabs(text: string): Promise<string> {
  try {
    const coach = createSportsCoach('default-user');
    const audioBuffer = await coach.generateVoiceFeedback(text);
    
    // Save to temporary file
    const tempDir = '/tmp';
    const fileName = `voice_${Date.now()}.mp3`;
    const filePath = path.join(tempDir, fileName);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(filePath, Buffer.from(audioBuffer));
    return filePath;
  } catch (error) {
    console.error('Error generating voice:', error);
    throw error;
  }
}

export async function upload_audio_to_whatsapp(audioPath: string): Promise<string> {
  try {
    const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/media`;
    
    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath));
    form.append('type', 'audio/mp3');
    form.append('messaging_product', 'whatsapp');

    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      },
    });

    // Clean up temporary file
    try {
      fs.unlinkSync(audioPath);
    } catch (cleanupError) {
      console.warn('Could not clean up audio file:', cleanupError);
    }

    return response.data.id;
  } catch (error) {
    console.error('Error uploading audio to WhatsApp:', error);
    throw error;
  }
}

export async function send_audio_message(toNumber: string, mediaId: string): Promise<void> {
  try {
    const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'audio',
      audio: { id: mediaId },
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📤 Audio Status:', response.status);
    console.log('📤 Audio Response:', response.data);
  } catch (error) {
    console.error('Error sending audio message:', error);
    throw error;
  }
}

// Export for scheduler
export { send_text_message as sendTextMessage };