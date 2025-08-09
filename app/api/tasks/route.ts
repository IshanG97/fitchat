import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { scheduleTaskReminder, unscheduleTaskReminder } from '@/lib/scheduler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
    }

    const tasks = await DatabaseService.getUserTasks(parseInt(userId), activeOnly);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      user_id,
      conversation_id,
      type,
      active = true,
      freq,
      content
    } = await req.json();

    if (!user_id || !type || !freq || !content) {
      return NextResponse.json(
        { error: 'user_id, type, freq, and content are required' },
        { status: 400 }
      );
    }

    const task = await DatabaseService.createTask({
      user_id,
      conversation_id: conversation_id || 0,
      type,
      active,
      freq,
      content
    });

    // Schedule the task if it's active
    if (active) {
      await scheduleTaskReminder(task.id, user_id, content, freq);
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId parameter required' }, { status: 400 });
    }

    const updates = await req.json();
    
    // Get the current task to check if it was active
    const currentTask = await DatabaseService.getUserTasks(0, false);
    const task = currentTask.find(t => t.id === parseInt(taskId));
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedTask = await DatabaseService.updateTask(parseInt(taskId), updates);

    // Handle scheduling changes
    if ('active' in updates) {
      if (updates.active && !task.active) {
        // Task was activated - schedule it
        await scheduleTaskReminder(updatedTask.id, updatedTask.user_id, updatedTask.content, updatedTask.freq);
      } else if (!updates.active && task.active) {
        // Task was deactivated - unschedule it
        unscheduleTaskReminder(updatedTask.id);
      }
    }

    // If frequency or content changed and task is active, reschedule
    if (updatedTask.active && ('freq' in updates || 'content' in updates)) {
      unscheduleTaskReminder(updatedTask.id);
      await scheduleTaskReminder(updatedTask.id, updatedTask.user_id, updatedTask.content, updatedTask.freq);
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId parameter required' }, { status: 400 });
    }

    // Unschedule the task first
    unscheduleTaskReminder(parseInt(taskId));

    // Delete from database
    await DatabaseService.deleteTask(parseInt(taskId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}