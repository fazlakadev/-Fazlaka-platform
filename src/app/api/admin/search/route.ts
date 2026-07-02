// src/app/api/admin/search/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_ROLES = ['OWNER', 'EDITOR', 'ADMIN'];

interface AdminSearchResult {
  id: string;
  type: string;
  title: string;
  titleEn: string;
  slug?: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  adminUrl: string;
  previewUrl?: string;
  analyticsUrl?: string;
  metadata?: Record<string, string | undefined>;
}

async function searchModel(
  model: any,
  fields: string[],
  q: string,
  limit: number,
  skip: number,
  select: Record<string, boolean>,
  mapResult: (item: any) => AdminSearchResult
): Promise<{ items: AdminSearchResult[]; count: number }> {
  const orConditions = fields.map(f => ({
    [f]: { contains: q, mode: 'insensitive' as const },
  }));

  const items = await model.findMany({
    where: { OR: orConditions },
    take: limit,
    skip,
    orderBy: { updatedAt: 'desc' },
    select,
  });

  const count = await model.count({
    where: { OR: orConditions.slice(0, 2) },
  });

  return { items: items.map(mapResult), count };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);
    const offset = Number(searchParams.get('offset')) || 0;

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [], totalCount: 0 });
    }

    const queries: Record<string, () => Promise<{ items: AdminSearchResult[]; count: number }>> = {};

    if (type === 'all' || type === 'article') {
      queries.article = () => searchModel(
        prisma.article,
        ['title', 'titleEn', 'excerpt', 'excerptEn'],
        q, limit, offset,
        { id: true, title: true, titleEn: true, slug: true, excerpt: true, excerptEn: true, featuredImageUrl: true, featuredImageUrlEn: true },
        (i: any) => ({
          id: i.id, type: 'article', title: i.title, titleEn: i.titleEn,
          slug: i.slug, description: i.excerpt || '', descriptionEn: i.excerptEn || '',
          imageUrl: i.featuredImageUrl || i.featuredImageUrlEn || undefined,
          adminUrl: `/admin/articles/${i.slug}/edit`,
          previewUrl: `/articles/${i.slug}`,
          analyticsUrl: `/admin/articles/${i.slug}/edit?tab=analytics`,
        })
      );
    }

    if (type === 'all' || type === 'episode') {
      queries.episode = () => searchModel(
        prisma.episode,
        ['title', 'titleEn', 'description', 'descriptionEn'],
        q, limit, offset,
        { id: true, title: true, titleEn: true, slug: true, description: true, descriptionEn: true, thumbnailUrl: true, thumbnailUrlEn: true },
        (i: any) => ({
          id: i.id, type: 'episode', title: i.title, titleEn: i.titleEn,
          slug: i.slug, description: i.description || '', descriptionEn: i.descriptionEn || '',
          imageUrl: i.thumbnailUrl || i.thumbnailUrlEn || undefined,
          adminUrl: `/admin/episodes/${i.slug}/edit`,
          previewUrl: `/episodes/${i.slug}`,
          analyticsUrl: `/admin/episodes/${i.slug}/edit?tab=analytics`,
        })
      );
    }

    if (type === 'all' || type === 'season') {
      queries.season = () => searchModel(
        prisma.season,
        ['title', 'titleEn', 'description', 'descriptionEn'],
        q, limit, offset,
        { id: true, title: true, titleEn: true, slug: true, description: true, descriptionEn: true, thumbnailUrl: true, thumbnailUrlEn: true },
        (i: any) => ({
          id: i.id, type: 'season', title: i.title, titleEn: i.titleEn,
          slug: i.slug, description: i.description || '', descriptionEn: i.descriptionEn || '',
          imageUrl: i.thumbnailUrl || i.thumbnailUrlEn || undefined,
          adminUrl: `/admin/seasons/${i.slug}/edit`,
          previewUrl: `/seasons/${i.slug}`,
        })
      );
    }

    if (type === 'all' || type === 'playlist') {
      queries.playlist = () => searchModel(
        prisma.playlist,
        ['title', 'titleEn', 'description', 'descriptionEn'],
        q, limit, offset,
        { id: true, title: true, titleEn: true, slug: true, description: true, descriptionEn: true, imageUrl: true, imageUrlEn: true },
        (i: any) => ({
          id: i.id, type: 'playlist', title: i.title, titleEn: i.titleEn,
          slug: i.slug, description: i.description || '', descriptionEn: i.descriptionEn || '',
          imageUrl: i.imageUrl || i.imageUrlEn || undefined,
          adminUrl: `/admin/playlists/${i.slug}/edit`,
          previewUrl: `/playlists/${i.slug}`,
        })
      );
    }

    if (type === 'all' || type === 'faq') {
      queries.faq = () => searchModel(
        prisma.fAQ,
        ['question', 'questionEn', 'answer', 'answerEn'],
        q, limit, offset,
        { id: true, question: true, questionEn: true, category: true, categoryEn: true },
        (i: any) => ({
          id: i.id, type: 'faq', title: i.question, titleEn: i.questionEn || '',
          slug: i.id, description: i.category || '', descriptionEn: i.categoryEn || '',
          adminUrl: `/admin/faqs/${i.id}/edit`,
          metadata: { category: i.category, categoryEn: i.categoryEn },
        })
      );
    }

    if (type === 'all' || type === 'team') {
      queries.team = () => searchModel(
        prisma.team,
        ['name', 'nameEn', 'role', 'roleEn'],
        q, limit, offset,
        { id: true, name: true, nameEn: true, slug: true, role: true, roleEn: true, imageUrl: true, imageUrlEn: true },
        (i: any) => ({
          id: i.id, type: 'team', title: i.name, titleEn: i.nameEn,
          slug: i.slug, description: i.role || '', descriptionEn: i.roleEn || '',
          imageUrl: i.imageUrl || i.imageUrlEn || undefined,
          adminUrl: `/admin/team/${i.id}/edit`,
          previewUrl: `/team/${i.slug}`,
        })
      );
    }

    if (type === 'all' || type === 'privacy') {
      queries.privacy = () => searchModel(
        prisma.privacy,
        ['title', 'titleEn', 'description', 'descriptionEn'],
        q, limit, offset,
        { id: true, title: true, titleEn: true, sectionType: true, description: true, descriptionEn: true },
        (i: any) => ({
          id: i.id, type: 'privacy', title: i.title || i.sectionType, titleEn: i.titleEn || i.sectionType,
          description: i.description || '', descriptionEn: i.descriptionEn || '',
          adminUrl: `/admin/privacy/${i.id}/edit`,
        })
      );
    }

    if (type === 'all' || type === 'terms') {
      queries.terms = () => searchModel(
        prisma.terms,
        ['title', 'titleEn', 'description', 'descriptionEn'],
        q, limit, offset,
        { id: true, title: true, titleEn: true, sectionType: true, description: true, descriptionEn: true },
        (i: any) => ({
          id: i.id, type: 'terms', title: i.title || i.sectionType, titleEn: i.titleEn || i.sectionType,
          description: i.description || '', descriptionEn: i.descriptionEn || '',
          adminUrl: `/admin/terms/${i.id}/edit`,
        })
      );
    }

    if (type === 'all' || type === 'heroSlider') {
      queries.heroSlider = () => searchModel(
        prisma.heroSlider,
        ['title', 'titleEn', 'description', 'descriptionEn'],
        q, limit, offset,
        { id: true, title: true, titleEn: true, description: true, descriptionEn: true, image: true, imageEn: true },
        (i: any) => ({
          id: i.id, type: 'heroSlider', title: i.title, titleEn: i.titleEn,
          description: i.description || '', descriptionEn: i.descriptionEn || '',
          imageUrl: i.image || i.imageEn || undefined,
          adminUrl: `/admin/hero-sliders/${i.id}/edit`,
        })
      );
    }

    if (type === 'all' || type === 'socialLink') {
      queries.socialLink = () => searchModel(
        prisma.socialLink,
        ['platform', 'url'],
        q, limit, offset,
        { id: true, platform: true, url: true },
        (i: any) => ({
          id: i.id, type: 'socialLink', title: i.platform, titleEn: i.platform,
          description: i.url, descriptionEn: i.url,
          adminUrl: `/admin/social-links/${i.id}/edit`,
        })
      );
    }

    if (type === 'all' || type === 'user') {
      queries.user = () => searchModel(
        prisma.user,
        ['name', 'email'],
        q, limit, offset,
        { id: true, name: true, email: true, image: true, role: true, banned: true },
        (i: any) => ({
          id: i.id, type: 'user', title: i.name || i.email, titleEn: i.name || i.email,
          description: i.email || '', descriptionEn: i.email || '',
          imageUrl: i.image || undefined,
          adminUrl: `/admin/users/${i.id}`,
          metadata: { role: i.role, banned: String(i.banned) },
        })
      );
    }

    if (type === 'all' || type === 'comment') {
      queries.comment = () => searchModel(
        prisma.comment,
        ['content', 'name', 'email'],
        q, limit, offset,
        { id: true, content: true, name: true, email: true, episodeId: true, articleId: true, createdAt: true },
        (i: any) => ({
          id: i.id, type: 'comment',
          title: i.content?.substring(0, 80) || '',
          titleEn: i.content?.substring(0, 80) || '',
          description: `${i.name || i.email || 'Unknown'} | ${new Date(i.createdAt).toLocaleDateString()}`,
          descriptionEn: `${i.name || i.email || 'Unknown'} | ${new Date(i.createdAt).toLocaleDateString()}`,
          adminUrl: '/admin/comments',
          metadata: { episodeId: i.episodeId, articleId: i.articleId },
        })
      );
    }

    const allResults: AdminSearchResult[] = [];
    let totalCount = 0;

    for (const queryFn of Object.values(queries)) {
      const { items, count } = await queryFn();
      allResults.push(...items);
      totalCount += count;
    }

    allResults.sort((a, b) => a.title.localeCompare(b.title));

    return NextResponse.json({ results: allResults.slice(0, limit), totalCount });
  } catch (error) {
    console.error('Admin search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
