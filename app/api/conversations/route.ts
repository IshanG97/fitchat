import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await DatabaseService.getConversationMessages(parseInt(conversationId));
      return NextResponse.json(messages);
    }

    if (userId) {
      // Get all open conversations for a user
      const conversations = await DatabaseService.getOpenConversations(parseInt(userId));
      return NextResponse.json(conversations);
    }

    return NextResponse.json({ error: 'userId or conversationId parameter required' }, { status: 400 });
  } catch (error) {
    console.error('Error getting conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, topic, status = 'open' } = await req.json();

    if (!user_id || !topic) {
      return NextResponse.json({ error: 'user_id and topic are required' }, { status: 400 });
    }

    const conversation = await DatabaseService.createConversation(user_id, topic, status);
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId parameter required' }, { status: 400 });
    }

    const updates = await req.json();
    const conversation = await DatabaseService.updateConversation(parseInt(conversationId), updates);
    
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}