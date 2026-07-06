import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth-helper';
import { 
  fetchUserNotifications, 
  fetchUnreadNotificationsCount,
  markAllNotificationsAsRead 
} from '@/services/notifications';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const language = searchParams.get('language') || 'ar';
    
    const notifications = await fetchUserNotifications(userId, language, limit, skip);
    const unreadCount = await fetchUnreadNotificationsCount(userId);
    
    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { markAllAsRead } = body;
    
    if (markAllAsRead) {
      const success = await markAllNotificationsAsRead(userId);
      if (success) {
        return NextResponse.json({ success: true, message: 'All notifications marked as read' });
      }
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}