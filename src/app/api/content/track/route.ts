import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { contentId, contentType, slug, title, thumbnailUrl } = await request.json();
    if (!contentId || !contentType) {
      return NextResponse.json({ success: false, error: 'MissingRequired' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // 1. Increment ContentView (aggregated)
    const existing = userId
      ? await prisma.contentView.findUnique({
          where: { contentId_contentType_userId: { contentId, contentType, userId } },
        })
      : await prisma.contentView.findFirst({
          where: { contentId, contentType, userId: null },
        });

    if (existing) {
      await prisma.contentView.update({
        where: { id: existing.id },
        data: { count: { increment: 1 } },
      });
    } else {
      await prisma.contentView.create({
        data: { contentId, contentType, slug, title, userId, count: 1 },
      });
    }

    // 2. Increment views on the content model and create ViewHistory for logged-in users
    if (userId) {
      const contentTypeUpper = contentType.toUpperCase();
      if (contentTypeUpper === 'EPISODE') {
        await prisma.episode.update({ where: { id: contentId }, data: { views: { increment: 1 } } });
      } else if (contentTypeUpper === 'ARTICLE') {
        await prisma.article.update({ where: { id: contentId }, data: { views: { increment: 1 } } });
      }

      await prisma.viewHistory.upsert({
        where: { userId_contentId_contentType: { userId, contentId, contentType: contentTypeUpper } },
        create: { userId, contentId, contentType: contentTypeUpper, slug, title, thumbnailUrl },
        update: { slug, title, thumbnailUrl, createdAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
