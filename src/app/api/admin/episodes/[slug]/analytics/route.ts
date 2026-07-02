import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const ADMIN_ROLES = ['OWNER', 'EDITOR', 'ADMIN'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    const episode = await prisma.episode.findUnique({
      where: { slug },
    });

    if (!episode) {
      return NextResponse.json({ success: false, error: 'Episode not found' }, { status: 404 });
    }

    // Total views = count of ViewHistory records
    const totalViews = await prisma.viewHistory.count({
      where: { contentId: episode.id, contentType: 'EPISODE' },
    });

    // Viewers list with user info
    const viewers = await prisma.viewHistory.findMany({
      where: { contentId: episode.id, contentType: 'EPISODE' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    // Likes list with user info
    const likes = await prisma.favorite.findMany({
      where: { episodeId: episode.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    // Comments with user info
    const comments = await prisma.comment.findMany({
      where: { episodeId: episode.id },
      orderBy: { createdAt: 'desc' },
      include: {
        userRelation: { select: { id: true, name: true, email: true, image: true, role: true } },
        _count: { select: { likes: true, replies: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        content: {
          id: episode.id,
          title: episode.title,
          titleEn: episode.titleEn,
          slug: episode.slug,
          thumbnailUrl: episode.thumbnailUrl,
          thumbnailUrlEn: episode.thumbnailUrlEn,
        },
        totalViews,
        viewers,
        likes,
        comments,
      },
    });
  } catch (error) {
    console.error('Episode analytics error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    const episode = await prisma.episode.findUnique({ where: { slug } });
    if (!episode) {
      return NextResponse.json({ success: false, error: 'Episode not found' }, { status: 404 });
    }

    const { commentId } = await request.json();
    if (!commentId) {
      return NextResponse.json({ success: false, error: 'Missing commentId' }, { status: 400 });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
