import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { fetchUserNotifications, fetchUnreadNotificationsCount } from '@/services/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'ar';
  const since = searchParams.get('since') || '';

  const notifications = await fetchUserNotifications(userId, language, 20, 0);
  const unreadCount = await fetchUnreadNotificationsCount(userId);

  return NextResponse.json({
    type: 'notifications',
    data: { notifications, unreadCount, since }
  });
}