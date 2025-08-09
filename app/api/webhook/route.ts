import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { scheduleTaskReminder } from '@/lib/scheduler';
import {
  extract_message_data,
  download_whatsapp_audio,
  transcribe_audio,
  generate_llm_response,
  get_intent,
  send_text_message,
  generate_voice_with_elevenlabs,
  upload_audio_to_whatsapp,
  send_audio_message,
} from '@/lib/whatsapp';

const VERIFICATION_TOKEN = process.env.WEBHOOK_VERIFICATION_TOKEN!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hub_mode = searchParams.get('hub.mode');
  const hub_challenge = searchParams.get('hub.challenge');
  const hub_verify_token = searchParams.get('hub.verify_token');

  console.log(`📡 Received token: '${hub_verify_token}' | Expected: '${VERIFICATION_TOKEN}'`);

  if (hub_mode === 'subscribe' && hub_verify_token === VERIFICATION_TOKEN) {
    return new NextResponse(hub_challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📦 Incoming webhook payload:', body);

    const message_data = extract_message_data(body);

    if (!message_data) {
      return NextResponse.json({ status: 'ignored (no message data)' });
    }

    // Check for duplicate messages
    if (message_data.message_id) {
      const isDuplicate = await DatabaseService.messageExists(message_data.message_id);
      if (isDuplicate) {
        console.log(`📦 Duplicate message ignored: ${message_data.message_id}`);
        return NextResponse.json({ status: 'ignored (duplicate message)' });
      }
    }

    let user_text = '';

    if (message_data.audio_id) {
      const audio_path = await download_whatsapp_audio(message_data.audio_id);
      user_text = await transcribe_audio(audio_path);
    } else if (message_data.text) {
      user_text = message_data.text;
    } else {
      return NextResponse.json({ status: 'ignored (no valid input)' });
    }

    // --- User Management & Database Logging ---
    try {
      // Get or create user
      const user = await DatabaseService.getOrCreateUser(
        message_data.sender_wa_id,
        message_data.sender_name
      );

      // Find or create conversation
      let conversation = await DatabaseService.findOrCreateConversation(user.id, 'General');

      // Log user message temporarily
      let tempMessage;
      try {
        tempMessage = await DatabaseService.logMessage(
          user.id,
          conversation.id,
          'user',
          user_text,
          message_data.audio_id ? 'audio' : 'text',
          message_data.audio_id,
          message_data.message_id
        );
      } catch (error: any) {
        if (error.message?.includes('unique_message_id') || error.code === '23505') {
          console.log(`📦 Duplicate message caught by constraint: ${message_data.message_id}`);
          return NextResponse.json({ status: 'ignored (duplicate message)' });
        }
        throw error;
      }

      console.log('📥 Logged user message to database');

      // Generate LLM response with conversation history
      console.log('🧠 Generating LLM response for user:', user.id);
      const llmResponse = await generate_llm_response(message_data.sender_wa_id);
      const currentTopic = llmResponse.topic || 'General';

      // Determine final conversation based on topic
      let finalConversationId = conversation.id;
      let topicSwitched = false;

      if (currentTopic !== conversation.topic) {
        // Look for existing conversation with same topic
        const topicConversation = await DatabaseService.getConversationByTopic(user.id, currentTopic);
        
        if (topicConversation) {
          finalConversationId = topicConversation.id;
          console.log(`📝 Found existing conversation #${finalConversationId} for topic: ${currentTopic}`);
        } else {
          // Create new conversation for this topic
          const newConversation = await DatabaseService.createConversation(user.id, currentTopic);
          finalConversationId = newConversation.id;
          console.log(`📝 Created new conversation #${finalConversationId} for topic: ${currentTopic}`);
        }

        if (finalConversationId !== conversation.id) {
          topicSwitched = true;
          // Move message to correct conversation
          await DatabaseService.updateMessage(tempMessage.id, {
            conversation_id: finalConversationId
          });
          console.log(`📝 Moved message to correct conversation #${finalConversationId}`);
        }
      }

      // Generate unique message ID for assistant response
      const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Log assistant response
      await DatabaseService.logMessage(
        user.id,
        finalConversationId,
        'assistant',
        llmResponse.reply,
        'text',
        undefined,
        assistantMessageId
      );

      console.log('🧠 Logged assistant response to database');

      // Task detection and creation
      const context = {
        recentMessages: [user_text],
        biometrics: {
          heartRate: 75,
          steps: 8000,
          sleepHours: 7,
          recoveryScore: 7,
          fatigueLevel: 4,
        }
      };

      const intent = get_intent(context);
      if (intent.type && intent.content) {
        console.log(`🎯 Detected intent: ${intent.type} - ${intent.content}`);
        
        try {
          const taskType = intent.type === 'reminder' ? 'Reminder' : 'Goal';
          const frequency = user.personality === 'anxious' ? 2 : 0.5;
          
          const newTask = await DatabaseService.createTask({
            user_id: user.id,
            conversation_id: finalConversationId,
            type: taskType,
            active: true,
            freq: frequency,
            content: intent.content
          });

          // Schedule the task
          await scheduleTaskReminder(newTask.id, user.id, intent.content, frequency);
          console.log(`📅 Created and scheduled task #${newTask.id}`);
        } catch (taskError) {
          console.error('Error creating task:', taskError);
        }
      }

      // Send topic switch notification if needed
      if (topicSwitched) {
        const debugMessage = `🔄 Switching to ${currentTopic} topic`;
        await send_text_message(message_data.sender_wa_id, debugMessage);
      }

      // Send reply to user
      if (message_data.text) {
        await send_text_message(message_data.sender_wa_id, llmResponse.reply);
      }

      if (message_data.audio_id) {
        const voice_path = await generate_voice_with_elevenlabs(llmResponse.reply);
        const media_id = await upload_audio_to_whatsapp(voice_path);
        await send_audio_message(message_data.sender_wa_id, media_id);
      }

      console.log('📤 Reply sent to user:', message_data.sender_wa_id);

      return NextResponse.json({ status: 'received' });

    } catch (dbError) {
      console.error('Database error:', dbError);
      // Still try to send a response even if database operations fail
      const fallbackReply = "I'm having trouble with my memory right now, but I'm still here to help with your fitness journey!";
      await send_text_message(message_data.sender_wa_id, fallbackReply);
      return NextResponse.json({ status: 'partial_success', error: 'database_error' });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}