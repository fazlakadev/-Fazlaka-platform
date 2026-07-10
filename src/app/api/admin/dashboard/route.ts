import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ActivityItem {
  id: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();

    const start = new Date(startDate);
    const end = new Date(endDate);

    const duration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - duration);
    const previousEnd = start;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const [currentCounts, previousCounts, totalContentTypeCounts] = await Promise.all([
      Promise.all([
        prisma.article.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.episode.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.season.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]),
      Promise.all([
        prisma.article.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),
        prisma.episode.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),
        prisma.season.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),
        prisma.user.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),
      ]),
      Promise.all([
        prisma.article.count(),
        prisma.episode.count(),
        prisma.season.count(),
        prisma.playlist.count(),
      ]),
    ]);

    const totalCounts = await Promise.all([
      prisma.article.count(),
      prisma.episode.count(),
      prisma.season.count(),
      prisma.playlist.count(),
      prisma.heroSlider.count(),
      prisma.ticket.count(),
      prisma.user.count(),
      prisma.comment.count(),
      prisma.favorite.count(),
      prisma.newsletterSubscriber.count(),
    ]);

    const engagementCounts = await Promise.all([
      prisma.episode.aggregate({ _sum: { views: true } }).then(r => r._sum.views || 0),
      prisma.article.aggregate({ _sum: { views: true } }).then(r => r._sum.views || 0),
      prisma.favorite.count(),
      prisma.comment.count(),
    ]);

    const [topEpisodes, topArticles, periodComments, periodLikes, periodViews] = await Promise.all([
      prisma.episode.findMany({
        orderBy: { views: 'desc' },
        take: 5,
        select: {
          id: true, title: true, titleEn: true, slug: true,
          thumbnailUrl: true, thumbnailUrlEn: true, views: true,
          _count: { select: { favorites: true, comments: true } }
        }
      }),
      prisma.article.findMany({
        orderBy: { views: 'desc' },
        take: 5,
        select: {
          id: true, title: true, titleEn: true, slug: true,
          featuredImageUrl: true, featuredImageUrlEn: true, views: true,
          _count: { select: { favorites: true, comments: true } }
        }
      }),
      prisma.comment.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.favorite.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.viewHistory.count({ where: { createdAt: { gte: start, lte: end } } }),
    ]);

    const [newsletterStats, friendsStats, chatStats, aiChatStats] = await Promise.all([
      Promise.all([
        prisma.newsletterSubscriber.count(),
        prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } }),
        prisma.newsletterSubscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
        prisma.newsletterCampaign.count(),
        prisma.newsletterCampaign.count({ where: { status: 'SENT' } }),
        prisma.newsletterCampaign.count({ where: { status: 'DRAFT' } }),
        prisma.newsletterCampaign.aggregate({ _sum: { sentCount: true, openCount: true, clickCount: true } }).then(r => ({ sent: r._sum.sentCount || 0, opens: r._sum.openCount || 0, clicks: r._sum.clickCount || 0 })),
      ]),
      Promise.all([
        prisma.friendship.count(),
        prisma.friendship.count({ where: { status: 'PENDING' } }),
        prisma.friendship.count({ where: { status: 'ACCEPTED' } }),
        prisma.conversation.count(),
        prisma.message.count(),
        prisma.message.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]),
      Promise.all([
        prisma.chatHistory.count(),
        prisma.chatHistory.count({ where: { isPublic: true } }),
      ]),
      prisma.chatHistory.findMany({ select: { messages: true } }).then(chats => {
        let totalMessages = 0;
        for (const chat of chats) {
          const msgs = chat.messages as unknown[];
          totalMessages += Array.isArray(msgs) ? msgs.length : 0;
        }
        return totalMessages;
      }),
    ]);

    const [
      newsletterSubsTotal, newsletterSubsActive, newsletterSubsUnsubscribed,
      newsletterCampaignsTotal, newsletterCampaignsSent, newsletterCampaignsDraft,
      newsletterCampaignStats
    ] = newsletterStats;

    const [
      friendshipsTotal, friendshipsPending, friendshipsAccepted,
      conversationsTotal, messagesTotal, messagesPeriod
    ] = friendsStats;

    const [chatHistoriesTotal, chatHistoriesPublic] = chatStats;
    const aiChatTotalMessages = aiChatStats;

    const [articlesCount, episodesCount, seasonsCount, usersCount] = currentCounts;
    const [prevArticles, prevEpisodes, prevSeasons, prevUsers] = previousCounts;
    const [totalArticles, totalEpisodes, totalSeasons, totalPlaylists] = totalContentTypeCounts;

    const [
      _totalArticles, _totalEpisodes, _totalSeasons, _totalPlaylists,
      _totalHeroSliders, _totalTickets, _totalUsers,
      _totalComments, _totalFavorites, _totalNewsletterSubs
    ] = totalCounts;

    const articlesChange = calculateChange(articlesCount, prevArticles);
    const episodesChange = calculateChange(episodesCount, prevEpisodes);
    const seasonsChange = calculateChange(seasonsCount, prevSeasons);
    const usersChange = calculateChange(usersCount, prevUsers);

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const interval = Math.max(1, Math.floor(daysDiff / 10));

    const [articlesForChart, episodesForChart, usersForChart] = await Promise.all([
      prisma.article.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { createdAt: true } }),
      prisma.episode.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { createdAt: true } }),
      prisma.user.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { createdAt: true } }),
    ]);

    const chartData = [];
    for (let i = 0; i < daysDiff; i += interval) {
      const dayStart = new Date(start);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + interval - 1);
      dayEnd.setHours(23, 59, 59, 999);

      const countInRange = (items: { createdAt: Date }[]) =>
        items.filter(item => item.createdAt >= dayStart && item.createdAt <= dayEnd).length;

      chartData.push({
        name: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        nameEn: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        articles: countInRange(articlesForChart),
        episodes: countInRange(episodesForChart),
        users: countInRange(usersForChart)
      });
    }

    const contentTypeData = [
      { name: 'المقالات', nameEn: 'Articles', value: totalArticles, color: '#3b82f6' },
      { name: 'الحلقات', nameEn: 'Episodes', value: totalEpisodes, color: '#10b981' },
      { name: 'المواسم', nameEn: 'Seasons', value: totalSeasons, color: '#f59e0b' },
      { name: 'قوائم التشغيل', nameEn: 'Playlists', value: totalPlaylists, color: '#ef4444' }
    ];

    const [epViewsSum, artViewsSum, likesCount, commentsCount] = engagementCounts;
    const totalViewsOverall = epViewsSum + artViewsSum;

    const totalContentCount = totalArticles + totalEpisodes;
    const avgViewsPerContent = totalContentCount > 0 ? Math.round(totalViewsOverall / totalContentCount) : 0;
    const avgLikesPerContent = totalContentCount > 0 ? Math.round(likesCount / totalContentCount) : 0;
    const avgCommentsPerContent = totalContentCount > 0 ? Math.round(commentsCount / totalContentCount) : 0;
    const engagementRate = totalViewsOverall > 0
      ? Math.round(((likesCount + commentsCount) / totalViewsOverall) * 1000) / 10
      : 0;

    const [
      recentArticles, recentEpisodes, recentSeasons, recentPlaylists,
      recentUsers
    ] = await Promise.all([
      prisma.article.findMany({ orderBy: { createdAt: 'desc' }, take: 2 }),
      prisma.episode.findMany({ orderBy: { createdAt: 'desc' }, take: 2 }),
      prisma.season.findMany({ orderBy: { createdAt: 'desc' }, take: 1 }),
      prisma.playlist.findMany({ orderBy: { createdAt: 'desc' }, take: 1 }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 1 }),
    ]);

    const formatActivity = (items: ActivityItem[], type: string, titleField: string, titleEnField: string, timeField: string = 'createdAt') => {
      return items.map(item => ({
        id: item.id,
        type,
        title: String(item[titleField] || 'N/A'),
        titleEn: String(item[titleEnField] || item[titleField] || 'N/A'),
        timestamp: item[timeField]
      }));
    };

    const recentActivity = [
      ...formatActivity(recentArticles, 'article', 'title', 'titleEn'),
      ...formatActivity(recentEpisodes, 'episode', 'title', 'titleEn'),
      ...formatActivity(recentSeasons, 'season', 'title', 'titleEn'),
      ...formatActivity(recentPlaylists, 'playlist', 'title', 'titleEn'),
      ...formatActivity(recentUsers, 'user', 'name', 'name'),
    ]
    .sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime())
    .slice(0, 10);

    return NextResponse.json({
      stats: {
        articles: articlesCount,
        episodes: episodesCount,
        seasons: seasonsCount,
        users: usersCount,
        articlesChange,
        episodesChange,
        seasonsChange,
        usersChange,
        articlesChangeType: articlesChange >= 0 ? 'increase' : 'decrease',
        episodesChangeType: episodesChange >= 0 ? 'increase' : 'decrease',
        seasonsChangeType: seasonsChange >= 0 ? 'increase' : 'decrease',
        usersChangeType: usersChange >= 0 ? 'increase' : 'decrease'
      },
      chartData,
      contentTypeData,
      recentActivity,
      totalViews: totalViewsOverall,
      totalLikes: likesCount,
      totalComments: commentsCount,
      totalCounts: {
        articles: _totalArticles,
        episodes: _totalEpisodes,
        seasons: _totalSeasons,
        playlists: _totalPlaylists,
        heroSliders: _totalHeroSliders,
        tickets: _totalTickets,
        users: _totalUsers,
        comments: _totalComments,
        favorites: _totalFavorites,
        newsletterSubscribers: _totalNewsletterSubs,
      },
      viewHistoryCount: 0,
      engagement: {
        avgViewsPerContent,
        avgLikesPerContent,
        avgCommentsPerContent,
        engagementRate,
      },
      topContent: {
        episodes: topEpisodes.map(e => ({
          id: e.id, title: e.title, titleEn: e.titleEn, slug: e.slug,
          thumbnailUrl: e.thumbnailUrl, thumbnailUrlEn: e.thumbnailUrlEn,
          views: e.views, likes: e._count.favorites, comments: e._count.comments,
        })),
        articles: topArticles.map(a => ({
          id: a.id, title: a.title, titleEn: a.titleEn, slug: a.slug,
          thumbnailUrl: a.featuredImageUrl, thumbnailUrlEn: a.featuredImageUrlEn,
          views: a.views, likes: a._count.favorites, comments: a._count.comments,
        })),
      },
      periodEngagement: {
        comments: periodComments,
        likes: periodLikes,
        views: periodViews,
      },
      newsletterAnalytics: {
        totalSubscribers: newsletterSubsTotal,
        activeSubscribers: newsletterSubsActive,
        unsubscribed: newsletterSubsUnsubscribed,
        totalCampaigns: newsletterCampaignsTotal,
        sentCampaigns: newsletterCampaignsSent,
        draftCampaigns: newsletterCampaignsDraft,
        totalSent: newsletterCampaignStats.sent,
        totalOpens: newsletterCampaignStats.opens,
        totalClicks: newsletterCampaignStats.clicks,
      },
      friendsAnalytics: {
        totalFriendships: friendshipsTotal,
        pendingFriendships: friendshipsPending,
        acceptedFriendships: friendshipsAccepted,
        totalConversations: conversationsTotal,
        totalMessages: messagesTotal,
        periodMessages: messagesPeriod,
      },
      aiChatAnalytics: {
        totalChats: chatHistoriesTotal,
        publicChats: chatHistoriesPublic,
        totalMessages: aiChatTotalMessages,
      },
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
