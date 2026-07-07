import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        parentId: null,
        userId: { not: null },
      },
      orderBy: [
        { likes: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
      take: 5,
      include: {
        userRelation: {
          select: { id: true, name: true, image: true, role: true },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    const testimonials = comments.map((c) => ({
      name: c.userRelation?.name || c.name || 'مستخدم',
      role: c.userRelation?.role === 'ADMIN' ? 'مشرف' : c.userRelation?.role === 'OWNER' ? 'المالك' : 'مستخدم',
      text: c.content,
      avatar: c.userRelation?.image || c.userImageUrl || undefined,
      likes: c._count.likes,
    }));

    return NextResponse.json({ data: testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ data: [] });
  }
}
