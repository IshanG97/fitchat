// app/api/sports-coach/diary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSportsCoach, type PerformanceDiary } from '@/lib/sports-coach';
import { DatabaseService } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, entry } = body;

    const coach = createSportsCoach(userId);
    
    // Get or create user first
    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create diary entry
    const diaryEntry = await coach.createPerformanceDiary(entry as Partial<PerformanceDiary>);
    
    // Store diary entry as a message in database for persistence
    const conversation = await DatabaseService.findOrCreateConversation(user.id, 'Diary');
    await DatabaseService.logMessage(
      user.id,
      conversation.id,
      'user',
      `Diary Entry: Mood: ${diaryEntry.mood}/10, Energy: ${diaryEntry.energy}/10. Goals: ${diaryEntry.goals.join(', ')}. Achievements: ${diaryEntry.achievements.join(', ')}. Reflections: ${diaryEntry.reflections}`,
      'text'
    );
    
    // Generate encouraging response based on the diary entry
    let response = "Thanks for sharing your thoughts! ";
    
    if (entry.mood && entry.mood < 5) {
      response += "I can see you're having a tough day. Remember, every champion faces challenges. ";
    } else if (entry.mood && entry.mood > 7) {
      response += "Love the positive energy! Let's channel this into an amazing workout. ";
    }
    
    if (entry.achievements && entry.achievements.length > 0) {
      response += `Congratulations on ${entry.achievements.join(', ')}! These wins matter. `;
    }
    
    if (entry.goals && entry.goals.length > 0) {
      response += `Your goals of ${entry.goals.join(', ')} are within reach. Let's work towards them together!`;
    }

    // Log the coach's response
    await DatabaseService.logMessage(
      user.id,
      conversation.id,
      'assistant',
      response,
      'text'
    );
    
    // Generate voice response
    const voiceBuffer = await coach.generateVoiceFeedback(response);
    const voiceBase64 = Buffer.from(voiceBuffer).toString('base64');
    
    return NextResponse.json({
      diaryEntry,
      response,
      voiceResponse: voiceBase64,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Diary entry error:', error);
    return NextResponse.json(
      { error: 'Failed to create diary entry' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's diary entries from conversation history
    const user = await DatabaseService.getUserById(parseInt(userId));
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get diary conversation
    const diaryConversation = await DatabaseService.getConversationByTopic(user.id, 'Diary');
    let diaryEntries: PerformanceDiary[] = [];

    if (diaryConversation) {
      const messages = await DatabaseService.getConversationMessages(diaryConversation.id);
      
      // Parse diary entries from messages
      diaryEntries = messages
        .filter(msg => msg.role === 'user' && msg.message.startsWith('Diary Entry:'))
        .map(msg => {
          // Simple parsing - in production you'd want more robust parsing
          const date = msg.created_at.split('T')[0];
          return {
            date,
            mood: 5, // Default values, could be parsed from message
            energy: 5,
            goals: [],
            achievements: [],
            reflections: msg.message.replace('Diary Entry: ', ''),
          };
        });
    }

    // Filter by date range if provided
    let filteredEntries = diaryEntries;
    if (startDate && endDate) {
      filteredEntries = diaryEntries.filter(entry => 
        entry.date >= startDate && entry.date <= endDate
      );
    }
    
    return NextResponse.json({
      entries: filteredEntries,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Diary retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve diary entries' },
      { status: 500 }
    );
  }
}