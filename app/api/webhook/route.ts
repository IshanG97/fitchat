import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { FitChatAI } from '@/lib/fitchat-ai';
import VideoProcessingTracker from '@/lib/video-processing-tracker';
import prompts from '@/config/prompts.json';
import {
  extract_message_data,
  download_whatsapp_audio,
  download_whatsapp_video,
  transcribe_audio,
  extract_video_frames,
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

    // Send immediate feedback for video analysis BEFORE duplicate check
    if (message_data.video_id) {
      console.log('📹 Processing workout video for form analysis');
      VideoProcessingTracker.markVideoProcessingStart(message_data.sender_wa_id);
      // Send immediate feedback - duplicate webhooks will send duplicate "analyzing" messages
      // but this is better UX than making user wait for database query
      await send_text_message(message_data.sender_wa_id, "🎬 Analyzing your workout video... This may take a moment. Please wait for my analysis before sending follow-up questions!");
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
    let isVideoAnalysis = false;

    if (message_data.audio_id) {
      const audio_path = await download_whatsapp_audio(message_data.audio_id);
      user_text = await transcribe_audio(audio_path);
    } else if (message_data.video_id) {
      console.log('📹 Processing workout video for form analysis');
      const video_path = await download_whatsapp_video(message_data.video_id);
      
      try {
        // Extract frames from video
        const framePaths = await extract_video_frames(video_path, 5);
        console.log(`🎬 Extracted ${framePaths.length} frames for analysis`);
        
        // Analyze workout form with FitChat AI
        user_text = await FitChatAI.analyzeWorkoutVideo(framePaths);
        isVideoAnalysis = true;
        
        // Mark video processing as complete
        VideoProcessingTracker.markVideoProcessingComplete(message_data.sender_wa_id);
        
        // Clean up video and frame files
        try {
          const fs = require('fs');
          const path = require('path');
          
          fs.unlinkSync(video_path);
          framePaths.forEach(framePath => {
            fs.unlinkSync(framePath);
            // Also remove the frame directory if empty
            const frameDir = path.dirname(framePath);
            try {
              fs.rmdirSync(frameDir);
            } catch (e) {
              // Directory might not be empty, ignore
            }
          });
        } catch (cleanupError) {
          console.warn('Could not clean up video files:', cleanupError);
        }
        
      } catch (error) {
        console.error('Error processing workout video:', error);
        // Load error message from prompts
        user_text = prompts.video_processing_error;
        
        // Don't treat this as video analysis since it failed
        isVideoAnalysis = false;
      }
    } else if (message_data.text) {
      user_text = message_data.text;
      
      // Check if user is asking about form/video while video is being processed
      const isRecentVideoProcessing = VideoProcessingTracker.isRecentlyProcessingVideo(message_data.sender_wa_id);
      const isFormQuestion = /\b(form|technique|analysis|what.*think|how.*look|feedback)\b/i.test(user_text.toLowerCase());
      
      if (isRecentVideoProcessing && isFormQuestion) {
        console.log('🎬 User asking about form while video is being processed');
        await send_text_message(message_data.sender_wa_id, "I'm still analyzing your workout video! Please wait a moment for my detailed form analysis. 🎬⏳");
        return NextResponse.json({ status: 'handled (video processing in progress)' });
      }
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

      // Determine message type for logging
      const messageType = message_data.video_id ? 'video' : 
                         message_data.audio_id ? 'audio' : 'text';
      const logContent = isVideoAnalysis ? 
        `[VIDEO ANALYSIS] ${user_text}` : user_text;

      // Process message with FitChat AI system
      console.log('🧠 Processing message with FitChat AI');
      const aiResponse = await FitChatAI.processMessage(
        user.id,
        logContent, 
        messageType,
        message_data.message_id
      );

      // Log user message with topic
      try {
        await DatabaseService.logMessageWithTopic(
          user.id,
          'user',
          logContent,
          messageType,
          aiResponse.topic,
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
      
      // Generate unique message ID for assistant response
      const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Log assistant response with same topic
      await DatabaseService.logMessageWithTopic(
        user.id,
        'assistant',
        aiResponse.reply,
        'text',
        aiResponse.topic,
        undefined,
        assistantMessageId
      );

      console.log(`🧠 Logged assistant response to database (topic: ${aiResponse.topic})`);
      if (aiResponse.dataRecorded) {
        console.log(`💾 AI successfully recorded structured data using tools: ${aiResponse.toolsUsed.join(', ')}`);
      }

      // Send main coaching reply to user
      if (message_data.audio_id) {
        // For audio messages, respond with audio
        const voice_path = await generate_voice_with_elevenlabs(aiResponse.reply);
        const media_id = await upload_audio_to_whatsapp(voice_path);
        await send_audio_message(message_data.sender_wa_id, media_id);
      } else {
        // For text and video messages, respond with text
        await send_text_message(message_data.sender_wa_id, aiResponse.reply);
      }

      // Send separate metrics confirmation if metrics were updated (with slight delay)
      if (aiResponse.metricsUpdated && aiResponse.metricsDetails) {
        // Small delay to ensure main message is delivered first
        setTimeout(async () => {
          await send_text_message(message_data.sender_wa_id, aiResponse.metricsDetails);
        }, 1000);
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}