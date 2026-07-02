import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');

    if (!contentId || !contentType) {
      return NextResponse.json({ error: 'Missing contentId or contentType' }, { status: 400 });
    }

    const count = await prisma.viewHistory.count({
      where: { contentId, contentType: contentType.toUpperCase() },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('View count error:', error);
    return NextResponse.json({ error: 'InternalError' }, { status: 500 });
  }
}
