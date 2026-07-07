import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: إحصائيات علنية عامة للصفحة الرئيسية (بدون مصادقة)
// ترجع: { episodes, articles, members, totalViews }
export async function GET() {
  try {
    const [episodes, articles, members, episodeViews, articleViews] = await Promise.all([
      prisma.episode.count(),
      prisma.article.count(),
      prisma.user.count(),
      prisma.episode.aggregate({ _sum: { views: true } }).then(r => r._sum.views || 0),
      prisma.article.aggregate({ _sum: { views: true } }).then(r => r._sum.views || 0),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        episodes,
        articles,
        members,
        totalViews: episodeViews + articleViews,
      },
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
