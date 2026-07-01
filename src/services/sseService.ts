import { pusherServer } from '@/lib/pusher';

export function sendNotificationToUser(userId: string, notification: Record<string, unknown>): boolean {
  try {
    pusherServer.trigger(`private-user-${userId}`, 'notification', notification);
    return true;
  } catch {
    return false;
  }
}

export function broadcastNotification(notification: Record<string, unknown>): number {
  try {
    pusherServer.trigger('general-notifications', 'notification', notification);
    return 1;
  } catch {
    return 0;
  }
}
