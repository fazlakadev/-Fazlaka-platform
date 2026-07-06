import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const history = await prisma.viewHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('Get view history error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await prisma.viewHistory.deleteMany({ where: { id, userId } });
    } else {
      await prisma.viewHistory.deleteMany({ where: { userId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete view history error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
