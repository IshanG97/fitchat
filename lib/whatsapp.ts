// lib/whatsapp.ts
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { DatabaseService } from './database';
import { createSportsCoach } from './sports-coach';
import OpenAI from 'openai';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID!;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MessageData {
  sender_wa_id: string;
  sender_name: string;
  text?: string;
  audio_id?: string;
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

export async function generate_llm_response(senderId: string): Promise<{ reply: string; topic?: string; tool_call?: any }> {
  try {
    // Get user from database
    const user = await DatabaseService.getUserByPhone(senderId);
    if (!user) {
      throw new Error(`User not found: ${senderId}`);
    }

    // Get recent conversation history
    const recentMessages = await DatabaseService.getRecentMessages(user.id, 10);
    
    // Build conversation input for Responses API
    let conversationInput = `You are FitChat, an AI fitness coach. You help users with workouts, nutrition, recovery, and achieving their fitness goals. Be encouraging, personalized, and knowledgeable about fitness.

User profile: ${user.name}, personality: ${user.personality || 'balanced'}
Keep responses conversational and under 100 words.

`;

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
      text: {
        verbosity: "medium"
      },
      reasoning: {
        effort: "minimal"
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