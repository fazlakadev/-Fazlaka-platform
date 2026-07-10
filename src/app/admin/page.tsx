'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  FileText, Play, Users, Calendar, ArrowUp, ArrowDown, RefreshCw, ChevronDown,
  HelpCircle, Shield, Layers, FileCheck, ListVideo, Eye, Heart, MessageCircle,
  TrendingUp, Activity, BarChart3, UserPlus, BookOpen, Video,
  Globe, Mail, Image as ImageIcon, Layout, type LucideIcon,
  Clock, Star, UserCheck, CheckCircle, Zap, MessageSquare, Bot,
  Radio, Send, Inbox, PieChart as PieChartIcon
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { LineChartComponent, PieChartComponent, BarChartComponent, AreaChartComponent } from '@/components/charts';

interface StatCard {
  title: string; titleEn: string; value: number;
  change: number; changeType: 'increase' | 'decrease';
  icon: React.ReactNode; color: string; link?: string;
}

interface QuickLink {
  title: string; titleEn: string; icon: LucideIcon; color: string; link: string;
}

interface ChartDataItem {
  name: string; nameEn: string; articles: number; episodes: number; users: number;
  [key: string]: string | number;
}

interface ContentTypeItem {
  name: string; nameEn: string; value: number; color?: string;
  [key: string]: string | number | boolean | undefined;
}

interface TopContentItem {
  id: string; title: string; titleEn: string; slug: string;
  thumbnailUrl: string | null; thumbnailUrlEn: string | null;
  views: number; likes: number; comments: number;
}

interface ActivityItem {
  id: string; type: string; title: string; titleEn: string; timestamp: string;
}

interface TotalCounts {
  articles: number; episodes: number; seasons: number; playlists: number;
  heroSliders: number;
  tickets: number;
  users: number; comments: number; favorites: number; newsletterSubscribers: number;
}

interface Engagement {
  avgViewsPerContent: number; avgLikesPerContent: number;
  avgCommentsPerContent: number; engagementRate: number;
}

interface NewsletterAnalytics {
  totalSubscribers: number; activeSubscribers: number; unsubscribed: number;
  totalCampaigns: number; sentCampaigns: number; draftCampaigns: number;
  totalSent: number; totalOpens: number; totalClicks: number;
}

interface FriendsAnalytics {
  totalFriendships: number; pendingFriendships: number; acceptedFriendships: number;
  totalConversations: number; totalMessages: number; periodMessages: number;
}

interface AiChatAnalytics {
  totalChats: number; publicChats: number; totalMessages: number;
}

interface TopContent { episodes: TopContentItem[]; articles: TopContentItem[]; }

interface PeriodEngagement { comments: number; likes: number; views: number; }

interface StatCardData {
  articles: number; episodes: number; seasons: number; users: number;
  articlesChange: number; episodesChange: number; seasonsChange: number; usersChange: number;
  articlesChangeType: 'increase' | 'decrease'; episodesChangeType: 'increase' | 'decrease';
  seasonsChangeType: 'increase' | 'decrease'; usersChangeType: 'increase' | 'decrease';
}

interface DashboardData {
  stats: StatCardData; chartData: ChartDataItem[]; contentTypeData: ContentTypeItem[];
  recentActivity: ActivityItem[]; totalViews: number; totalLikes: number; totalComments: number;
  totalCounts: TotalCounts; engagement: Engagement;
  topContent: TopContent; periodEngagement: PeriodEngagement;
  newsletterAnalytics: NewsletterAnalytics; friendsAnalytics: FriendsAnalytics;
  aiChatAnalytics: AiChatAnalytics;
}

const quickLinks: QuickLink[] = [
  { title: 'المقالات', titleEn: 'Articles', icon: FileText, color: 'from-blue-500 to-blue-700', link: '/admin/articles' },
  { title: 'الحلقات', titleEn: 'Episodes', icon: Play, color: 'from-green-500 to-green-700', link: '/admin/episodes' },
  { title: 'المواسم', titleEn: 'Seasons', icon: Layers, color: 'from-orange-500 to-orange-700', link: '/admin/seasons' },
  { title: 'قوائم التشغيل', titleEn: 'Playlists', icon: ListVideo, color: 'from-pink-500 to-pink-700', link: '/admin/playlists' },
  { title: 'التعليقات', titleEn: 'Comments', icon: MessageCircle, color: 'from-violet-500 to-violet-700', link: '/admin/comments' },
  { title: 'المستخدمون', titleEn: 'Users', icon: UserPlus, color: 'from-purple-500 to-purple-700', link: '/admin/users' },
  { title: 'النشرة البريدية', titleEn: 'Newsletter', icon: Mail, color: 'from-teal-500 to-teal-700', link: '/admin/newsletter' },
  { title: 'شرائح البطل', titleEn: 'Hero Sliders', icon: ImageIcon, color: 'from-rose-500 to-rose-700', link: '/admin/hero-sliders' },
  { title: 'الدعم', titleEn: 'Support', icon: HelpCircle, color: 'from-emerald-500 to-emerald-700', link: '/admin/support' },
  { title: 'تحليلات الحلقات', titleEn: 'Episode Analytics', icon: BarChart3, color: 'from-fuchsia-500 to-fuchsia-700', link: '/admin/episodes' },
  { title: 'تحليلات المقالات', titleEn: 'Article Analytics', icon: BarChart3, color: 'from-lime-500 to-lime-700', link: '/admin/articles' },
];

const analyticsSections: { id: string; label: string; labelEn: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'نظرة عامة', labelEn: 'Overview', icon: Activity },
  { id: 'content', label: 'المحتوى', labelEn: 'Content', icon: BookOpen },
  { id: 'users', label: 'المستخدمون', labelEn: 'Users', icon: Users },
  { id: 'views', label: 'المشاهدات', labelEn: 'Views', icon: Eye },
  { id: 'engagement', label: 'التفاعل', labelEn: 'Engagement', icon: Heart },
  { id: 'inventory', label: 'المخزون', labelEn: 'Inventory', icon: Layers },
  { id: 'newsletter', label: 'النشرة البريدية', labelEn: 'Newsletter', icon: Mail },
  { id: 'friends', label: 'الأصدقاء والمحادثات', labelEn: 'Friends & Chats', icon: MessageSquare },
  { id: 'aichat', label: 'الذكاء الاصطناعي', labelEn: 'AI Chat', icon: Bot },
];

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<boolean>(false);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startRef.current) { startRef.current = true; setDisplay(value); return; }
    const startValue = display;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(startValue + (value - startValue) * ease));
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

const TypeIcon: Record<string, LucideIcon> = {
  article: FileText, episode: Play, season: Layers, playlist: ListVideo,
  user: UserPlus,
};

const TypeColor: Record<string, string> = {
  article: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  episode: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  season: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  playlist: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30',
  user: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
};

export default function AdminDashboard() {
  const { language, isRTL } = useLanguage();
  const { data: session } = useSession();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30days');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [showActivity, setShowActivity] = useState(false);

  const dateFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(e.target as Node)) {
        setShowDateFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [stats, setStats] = useState<StatCard[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [contentTypeData, setContentTypeData] = useState<ContentTypeItem[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalCounts, setTotalCounts] = useState<TotalCounts | null>(null);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [topContent, setTopContent] = useState<TopContent | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [periodEngagement, setPeriodEngagement] = useState<PeriodEngagement | null>(null);
  const [newsletterData, setNewsletterData] = useState<NewsletterAnalytics | null>(null);
  const [friendsData, setFriendsData] = useState<FriendsAnalytics | null>(null);
  const [aiChatData, setAiChatData] = useState<AiChatAnalytics | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const today = new Date();
      let startDate: Date;
      switch (dateRange) {
        case '7days': startDate = subDays(today, 7); break;
        case '90days': startDate = subDays(today, 90); break;
        case '1year': startDate = subDays(today, 365); break;
        default: startDate = subDays(today, 30);
      }

      const response = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: startOfDay(startDate).toISOString(), endDate: endOfDay(today).toISOString() }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data: DashboardData = await response.json();

      setStats([
        { title: 'المقالات', titleEn: 'Articles', value: data.stats.articles, change: data.stats.articlesChange, changeType: data.stats.articlesChangeType, icon: <FileText size={22} />, color: 'bg-blue-500', link: '/admin/articles' },
        { title: 'الحلقات', titleEn: 'Episodes', value: data.stats.episodes, change: data.stats.episodesChange, changeType: data.stats.episodesChangeType, icon: <Play size={22} />, color: 'bg-green-500', link: '/admin/episodes' },
        { title: 'المستخدمون', titleEn: 'Users', value: data.stats.users, change: data.stats.usersChange, changeType: data.stats.usersChangeType, icon: <Users size={22} />, color: 'bg-purple-500', link: '/admin/users' },
        { title: 'المواسم', titleEn: 'Seasons', value: data.stats.seasons, change: data.stats.seasonsChange, changeType: data.stats.seasonsChangeType, icon: <Layers size={22} />, color: 'bg-orange-500', link: '/admin/seasons' },
      ]);

      setChartData(Array.isArray(data.chartData) ? data.chartData : []);
      setContentTypeData(Array.isArray(data.contentTypeData) ? data.contentTypeData.map((c: Record<string, unknown>) => ({ name: (c.name || c.title) as string, nameEn: (c.nameEn || c.titleEn || c.name) as string, value: Number(c.value || c.count || 0), color: c.color as string | undefined })) : []);
      setTotalViews(data.totalViews || 0);
      setTotalLikes(data.totalLikes || 0);
      setTotalComments(data.totalComments || 0);
      setTotalCounts(data.totalCounts || null);
      setEngagement(data.engagement || null);
      setTopContent(data.topContent || null);
      setActivity(Array.isArray(data.recentActivity) ? data.recentActivity : []);
      setPeriodEngagement(data.periodEngagement || null);
      setNewsletterData(data.newsletterAnalytics || null);
      setFriendsData(data.friendsAnalytics || null);
      setAiChatData(data.aiChatAnalytics || null);
    } catch {
      console.error('Error fetching dashboard data:');
    } finally {
      setIsRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleRefresh = () => { setIsRefreshing(true); fetchDashboardData(); };

  const dateRangeOptions = [
    { value: '7days', label: language === 'ar' ? 'آخر 7 أيام' : 'Last 7 days' },
    { value: '30days', label: language === 'ar' ? 'آخر 30 يوم' : 'Last 30 days' },
    { value: '90days', label: language === 'ar' ? 'آخر 90 يوم' : 'Last 90 days' },
    { value: '1year', label: language === 'ar' ? 'السنة الماضية' : 'Last year' },
  ];

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const today = new Date();

  const formatTimeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} ${t('دقيقة', 'm')}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ${t('ساعة', 'h')}`;
    const days = Math.floor(hours / 24);
    return `${days} ${t('يوم', 'd')}`;
  };

  const inventoryItems = totalCounts ? [
    { label: t('المقالات', 'Articles'), value: totalCounts.articles, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('الحلقات', 'Episodes'), value: totalCounts.episodes, icon: Play, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: t('المواسم', 'Seasons'), value: totalCounts.seasons, icon: Layers, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: t('قوائم التشغيل', 'Playlists'), value: totalCounts.playlists, icon: ListVideo, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
    { label: t('شرائح البطل', 'Hero Sliders'), value: totalCounts.heroSliders, icon: ImageIcon, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { label: t('تذاكر الدعم', 'Support Tickets'), value: totalCounts.tickets, icon: HelpCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: t('التعليقات', 'Comments'), value: totalCounts.comments, icon: MessageCircle, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { label: t('الإعجابات', 'Favorites'), value: totalCounts.favorites, icon: Heart, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: t('المستخدمون', 'Users'), value: totalCounts.users, icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: t('مشتركي النشرة', 'Newsletter Subs'), value: totalCounts.newsletterSubscribers, icon: Mail, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  ] : [];

  /* ────────────────────────────────────────────────── */
  /*  NEWSLETTER CHART DATA                              */
  /* ────────────────────────────────────────────────── */
  const nlDistData = newsletterData ? [
    { name: t('نشط', 'Active'), nameEn: 'Active', value: newsletterData.activeSubscribers, color: '#10b981' },
    { name: t('غير مشترك', 'Unsubscribed'), nameEn: 'Unsubscribed', value: newsletterData.unsubscribed, color: '#ef4444' },
    { name: t('أخرى', 'Other'), nameEn: 'Other', value: Math.max(0, newsletterData.totalSubscribers - newsletterData.activeSubscribers - newsletterData.unsubscribed), color: '#f59e0b' },
  ] : [];

  const campaignStatusData = newsletterData ? [
    { name: t('مرسلة', 'Sent'), nameEn: 'Sent', value: newsletterData.sentCampaigns, color: '#10b981' },
    { name: t('مسودة', 'Draft'), nameEn: 'Draft', value: newsletterData.draftCampaigns, color: '#f59e0b' },
    { name: t('أخرى', 'Other'), nameEn: 'Other', value: Math.max(0, newsletterData.totalCampaigns - newsletterData.sentCampaigns - newsletterData.draftCampaigns), color: '#6366f1' },
  ] : [];

  /* ────────────────────────────────────────────────── */
  /*  FRIENDS CHART DATA                                 */
  /* ────────────────────────────────────────────────── */
  const friendsDistData = friendsData ? [
    { name: t('مقبولة', 'Accepted'), nameEn: 'Accepted', value: friendsData.acceptedFriendships, color: '#10b981' },
    { name: t('معلقة', 'Pending'), nameEn: 'Pending', value: friendsData.pendingFriendships, color: '#f59e0b' },
    { name: t('أخرى', 'Other'), nameEn: 'Other', value: Math.max(0, friendsData.totalFriendships - friendsData.acceptedFriendships - friendsData.pendingFriendships), color: '#ef4444' },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ===== HERO WELCOME (no overflow-hidden) ===== */}
      <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6 md:p-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent rounded-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30 rounded-3xl" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <Image src={session.user.image} alt="" width={56} height={56} className="w-14 h-14 rounded-2xl border-2 border-white/20 object-cover shadow-xl" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl font-bold shadow-xl">
                  {session?.user?.name?.[0] || 'A'}
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  {t('مرحباً', 'Welcome')}, {session?.user?.name || 'Admin'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-0.5 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10">
                    {session?.user?.role || 'ADMIN'}
                  </span>
                  <span className="text-xs text-white/50">|</span>
                  <span className="text-xs text-white/60 flex items-center gap-1">
                    <Calendar size={11} />
                    {format(today, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm md:text-base text-white/70 max-w-2xl mt-3">
            {t('نظرة عامة شاملة على إحصائيات وأداء الموقع مع تحليلات متقدمة', 'Comprehensive site statistics and performance with advanced analytics')}
          </p>
        </div>
      </div>

      {/* ===== CONTROLS ROW (outside hero, no overflow issues) ===== */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={isRefreshing} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm disabled:opacity-50 text-gray-700 dark:text-gray-200">
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? t('جاري...', 'Loading...') : t('تحديث', 'Refresh')}
          </button>
        </div>
        <div className="relative" ref={dateFilterRef}>
          <button onClick={() => setShowDateFilter(!showDateFilter)} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm text-gray-700 dark:text-gray-200">
            <Calendar size={15} />
            <span className="hidden sm:inline">{dateRangeOptions.find(o => o.value === dateRange)?.label}</span>
            <ChevronDown size={14} className={`transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
          </button>
          {showDateFilter && (
            <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-1.5 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden`}
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              {dateRangeOptions.map(option => (
                <button key={option.value} onClick={() => { setDateRange(option.value); setShowDateFilter(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${dateRange === option.value ? 'bg-purple-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== BIG STAT CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group relative bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Eye size={24} className="opacity-80" />
              <TrendingUp size={20} className="opacity-60" />
            </div>
            <p className="text-3xl font-bold tracking-tight"><AnimatedNumber value={totalViews} /></p>
            <p className="text-sm opacity-80 mt-1">{t('إجمالي المشاهدات', 'Total Views')}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-white/60">
              <UserCheck size={12} />
              {t('أسبوعي', 'Weekly')} <AnimatedNumber value={periodEngagement?.views || 0} duration={1000} />
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-5 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Heart size={24} className="opacity-80" />
              <ArrowUp size={20} className="opacity-60" />
            </div>
            <p className="text-3xl font-bold tracking-tight"><AnimatedNumber value={totalLikes} /></p>
            <p className="text-sm opacity-80 mt-1">{t('إجمالي الإعجابات', 'Total Likes')}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-white/60">
              <Star size={12} />
              {t('هذا الشهر', 'This month')} <AnimatedNumber value={periodEngagement?.likes || 0} duration={1000} />
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <MessageCircle size={24} className="opacity-80" />
              <Activity size={20} className="opacity-60" />
            </div>
            <p className="text-3xl font-bold tracking-tight"><AnimatedNumber value={totalComments} /></p>
            <p className="text-sm opacity-80 mt-1">{t('إجمالي التعليقات', 'Total Comments')}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-white/60">
              <MessageCircle size={12} />
              {t('جديد', 'New')}: <AnimatedNumber value={periodEngagement?.comments || 0} duration={1000} />
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Users size={24} className="opacity-80" />
              <UserPlus size={20} className="opacity-60" />
            </div>
            <p className="text-3xl font-bold tracking-tight"><AnimatedNumber value={stats[2]?.value || 0} /></p>
            <p className="text-sm opacity-80 mt-1">{t('إجمالي المستخدمين', 'Total Users')}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-white/60">
              <UserCheck size={12} />
              {t('جديد', 'New')}: <AnimatedNumber value={stats[0]?.value || 0} duration={1000} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== ENGAGEMENT METRICS ROW ===== */}
      {engagement && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
              <Eye size={14} />
              {t('متوسط المشاهدات', 'Avg Views/Content')}
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white"><AnimatedNumber value={engagement.avgViewsPerContent} /></p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
              <Heart size={14} />
              {t('متوسط الإعجابات', 'Avg Likes/Content')}
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white"><AnimatedNumber value={engagement.avgLikesPerContent} /></p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
              <MessageCircle size={14} />
              {t('متوسط التعليقات', 'Avg Comments/Content')}
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white"><AnimatedNumber value={engagement.avgCommentsPerContent} /></p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
              <Activity size={14} />
              {t('معدل التفاعل', 'Engagement Rate')}
            </div>
            <p className={`text-xl font-bold ${engagement.engagementRate > 10 ? 'text-green-600 dark:text-green-400' : engagement.engagementRate > 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
              {engagement.engagementRate}%
            </p>
          </div>
        </div>
      )}

      {/* ===== GROWTH STATS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Link key={idx} href={stat.link || '#'}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 hover:shadow-xl transition-all group hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.color} bg-opacity-15`}>
                <div className={`${stat.color.replace('bg-', 'text-')}`}>{stat.icon}</div>
              </div>
              <div className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                stat.changeType === 'increase'
                  ? 'text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-300'
                  : 'text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300'
              }`}>
                {stat.changeType === 'increase' ? <ArrowUp size={12} className="mr-0.5" /> : <ArrowDown size={12} className="mr-0.5" />}
                {Math.abs(stat.change)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t(stat.title, stat.titleEn)}</p>
          </Link>
        ))}
      </div>

      {/* ===== TOP CONTENT + ACTIVITY ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Play size={18} className="text-green-500" />
            {t('أكثر الحلقات مشاهدة', 'Top Episodes')}
          </h3>
          <div className="space-y-3">
            {topContent?.episodes?.length ? topContent.episodes.map((ep, i) => (
              <Link key={ep.id} href={`/admin/episodes/${ep.slug}/analytics`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{i + 1}</span>
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                  {ep.thumbnailUrl ? <Image src={ep.thumbnailUrl} alt="" width={40} height={40} className="w-full h-full object-cover" /> : <Play size={16} className="text-gray-400 m-auto mt-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {t(ep.title, ep.titleEn)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1"><Eye size={11} />{ep.views}</span>
                    <span className="flex items-center gap-1"><Heart size={11} />{ep.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={11} />{ep.comments}</span>
                  </div>
                </div>
              </Link>
            )) : <p className="text-sm text-gray-500 text-center py-8">{t('لا توجد بيانات', 'No data yet')}</p>}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText size={18} className="text-blue-500" />
            {t('أكثر المقالات مشاهدة', 'Top Articles')}
          </h3>
          <div className="space-y-3">
            {topContent?.articles?.length ? topContent.articles.map((art, i) => (
              <Link key={art.id} href={`/admin/articles/${art.slug}/analytics`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{i + 1}</span>
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                  {art.thumbnailUrl ? <Image src={art.thumbnailUrl} alt="" width={40} height={40} className="w-full h-full object-cover" /> : <FileText size={16} className="text-gray-400 m-auto mt-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {t(art.title, art.titleEn)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1"><Eye size={11} />{art.views}</span>
                    <span className="flex items-center gap-1"><Heart size={11} />{art.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={11} />{art.comments}</span>
                  </div>
                </div>
              </Link>
            )) : <p className="text-sm text-gray-500 text-center py-8">{t('لا توجد بيانات', 'No data yet')}</p>}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-indigo-500" />
              {t('آخر النشاطات', 'Recent Activity')}
            </h3>
            <button onClick={() => setShowActivity(!showActivity)} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">
              {showActivity ? t('إخفاء', 'Hide') : t('عرض الكل', 'View All')}
            </button>
          </div>
          <div className="space-y-1">
            {(showActivity ? activity : activity.slice(0, 4)).map((item) => {
              const Icon = TypeIcon[item.type] || Clock;
              return (
                <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className={`p-2 rounded-lg shrink-0 ${TypeColor[item.type] || 'text-gray-500 bg-gray-100 dark:bg-gray-700'}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{t(item.title, item.titleEn)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatTimeAgo(item.timestamp)} {t('منذ', 'ago')}</p>
                  </div>
                </div>
              );
            })}
            {activity.length === 0 && <p className="text-sm text-gray-500 text-center py-6">{t('لا توجد نشاطات', 'No activity yet')}</p>}
          </div>
        </div>
      </div>

      {/* ===== SITE INVENTORY ===== */}
      {inventoryItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Layers size={18} className="text-purple-500" />
            {t('مخزون الموقع', 'Site Inventory')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
            {inventoryItems.map((item, idx) => (
              <div key={idx} className={`${item.bg} rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700`}>
                <item.icon size={20} className={`${item.color} mx-auto mb-1.5`} />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{item.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 truncate">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== QUICK ACCESS ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <Layout size={22} className="text-purple-500" />
          {t('الوصول السريع', 'Quick Access')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {quickLinks.map((item, idx) => (
            <Link key={idx} href={item.link}
              className="group relative p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 border border-gray-100 dark:border-gray-700 hover:border-transparent hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/90 dark:bg-gray-800 flex items-center justify-center mb-3 group-hover:bg-white/20 group-hover:backdrop-blur-sm transition-all">
                  <item.icon size={20} className="text-gray-700 dark:text-gray-200 group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-white transition-colors">
                  {t(item.title, item.titleEn)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ===== ANALYTICS DASHBOARD ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 size={22} className="text-purple-500" />
              {t('تحليلات الموقع', 'Site Analytics')}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {analyticsSections.map(section => (
                <button key={section.id} onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activeSection === section.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                  <section.icon size={13} />
                  <span className="hidden sm:inline">{t(section.label, section.labelEn)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* ────────────── OVERVIEW (ENHANCED) ────────────── */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Line chart + Pie chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-500" />
                    {t('نمو المحتوى', 'Content Growth')}
                  </h3>
                  {chartData.length > 0 ? (
                    <LineChartComponent data={chartData} xAxisDataKey="name" language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={280}
                      lines={[
                        { dataKey: 'articles', stroke: '#3b82f6', name: 'المقالات', nameEn: 'Articles' },
                        { dataKey: 'episodes', stroke: '#10b981', name: 'الحلقات', nameEn: 'Episodes' },
                        { dataKey: 'users', stroke: '#8b5cf6', name: 'المستخدمون', nameEn: 'Users' },
                      ]} />
                  ) : <div className="h-[280px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات كافية', 'Not enough data')}</div>}
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <PieChartIcon size={18} className="text-indigo-500" />
                    {t('توزيع المحتوى', 'Content Distribution')}
                  </h3>
                  {contentTypeData.length > 0 ? (
                    <PieChartComponent data={contentTypeData} language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={280} />
                  ) : <div className="h-[280px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات كافية', 'Not enough data')}</div>}
                </div>
              </div>
              {/* BarChart comparison + mini stat cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-emerald-500" />
                    {t('مقارنة المحتوى حسب الفترة', 'Period Content Comparison')}
                  </h3>
                  {contentTypeData.length > 0 ? (
                    <BarChartComponent data={contentTypeData as unknown as Record<string, string | number>[]} xAxisDataKey="nameEn" language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={260}
                      bar={{ dataKey: 'value', fill: '#6366f1', name: 'الإجمالي', nameEn: 'Total', radius: 8 }} />
                  ) : <div className="h-[260px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات كافية', 'Not enough data')}</div>}
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Zap size={15} className="text-yellow-500" />
                      {t('مؤشرات سريعة', 'Quick Metrics')}
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{t('إجمالي المحتوى', 'Total Content')}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{(totalCounts ? totalCounts.articles + totalCounts.episodes : 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{t('إجمالي المستخدمين', 'Total Users')}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{totalCounts?.users.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{t('متوسط التفاعل', 'Engagement Rate')}</span>
                        <span className={`text-sm font-bold ${(engagement?.engagementRate || 0) > 10 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {engagement?.engagementRate || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{t('مشاهدات فريدة', 'Unique Viewers')}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white"><AnimatedNumber value={periodEngagement?.views || 0} /></span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {stats.slice(0, 2).map((s, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className={`${s.color.replace('bg-', 'text-')} text-xs font-bold`}>{Math.abs(s.change)}%</div>
                        <p className="text-xs text-gray-500 mt-0.5">{t(s.title, s.titleEn)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Period stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {stats.length > 0 && [
                  { label: t('المقالات', 'Articles'), value: stats[0]?.value || 0, change: stats[0]?.change || 0, type: stats[0]?.changeType, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                  { label: t('الحلقات', 'Episodes'), value: stats[1]?.value || 0, change: stats[1]?.change || 0, type: stats[1]?.changeType, icon: Play, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/30' },
                  { label: t('المستخدمون', 'Users'), value: stats[2]?.value || 0, change: stats[2]?.change || 0, type: stats[2]?.changeType, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl ${item.bg}`}><item.icon size={20} className={item.color} /></div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.type === 'increase' ? 'text-green-600 bg-green-100 dark:bg-green-900/50' : 'text-red-600 bg-red-100 dark:bg-red-900/50'}`}>
                        {item.type === 'increase' ? '+' : ''}{item.change}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ────────────── CONTENT ────────────── */}
          {activeSection === 'content' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-emerald-500" />
                    {t('نمو الحلقات', 'Episode Growth')}
                  </h3>
                  {chartData.length > 0 ? (
                    <AreaChartComponent data={chartData.map(d => ({ name: d.name, nameEn: d.nameEn, value: d.episodes }))} xAxisDataKey="name" language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={250}
                      area={{ dataKey: 'value', stroke: '#10b981', fill: '#10b981', name: 'الحلقات', nameEn: 'Episodes' }} />
                  ) : <div className="h-[250px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات كافية', 'Not enough data')}</div>}
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" />
                    {t('نمو المقالات', 'Article Growth')}
                  </h3>
                  {chartData.length > 0 ? (
                    <AreaChartComponent data={chartData.map(d => ({ name: d.name, nameEn: d.nameEn, value: d.articles }))} xAxisDataKey="name" language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={250}
                      area={{ dataKey: 'value', stroke: '#3b82f6', fill: '#3b82f6', name: 'المقالات', nameEn: 'Articles' }} />
                  ) : <div className="h-[250px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات كافية', 'Not enough data')}</div>}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Layers size={18} className="text-orange-500" />
                    {t('إحصائيات المحتوى', 'Content Statistics')}
                  </h3>
                  <div className="space-y-4">
                    {inventoryItems.slice(0, 6).map((item, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${item.bg} border border-gray-100 dark:border-gray-700`}>
                        <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-200 text-sm">
                          <item.icon size={16} className={item.color} />
                          {item.label}
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-500" />
                    {t('مقارنة المحتوى', 'Content Comparison')}
                  </h3>
                  {contentTypeData.length > 0 ? (
                    <BarChartComponent data={contentTypeData as unknown as Record<string, string | number>[]} xAxisDataKey="nameEn" language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={280}
                      bar={{ dataKey: 'value', fill: '#6366f1', name: 'المحتوى', nameEn: 'Content', radius: 8 }} />
                  ) : <div className="h-[280px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات كافية', 'Not enough data')}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ────────────── USERS ────────────── */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users size={18} className="text-purple-500" />
                    {t('نمو المستخدمين', 'User Growth')}
                  </h3>
                  {chartData.length > 0 ? (
                    <AreaChartComponent data={chartData.map(d => ({ name: d.name, nameEn: d.nameEn, value: d.users }))} xAxisDataKey="name" language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={280}
                      area={{ dataKey: 'value', stroke: '#8b5cf6', fill: '#8b5cf6', name: 'المستخدمون', nameEn: 'Users' }} />
                  ) : <div className="h-[280px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات كافية', 'Not enough data')}</div>}
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <UserPlus size={18} className="text-emerald-500" />
                    {t('إحصائيات المستخدمين', 'User Statistics')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{t('إجمالي المستخدمين', 'Total Users')}</span>
                      <span className="text-2xl font-bold text-purple-600">{totalCounts?.users.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{t('جدد هذه الفترة', 'Period New Users')}</span>
                      <span className="text-2xl font-bold text-blue-600">{stats[2]?.value.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{t('نسبة النمو', 'Growth Rate')}</span>
                      <span className={`text-2xl font-bold ${(stats[2]?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{stats[2]?.change || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────────── VIEWS ────────────── */}
          {activeSection === 'views' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Eye size={18} className="text-purple-500" />
                    {t('نظرة عامة على المشاهدات', 'Views Overview')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{t('إجمالي المشاهدات', 'Total Views')}</span>
                      <span className="text-2xl font-bold text-purple-600">{totalViews.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{t('متوسط المشاهدات', 'Avg Views/Content')}</span>
                      <span className="text-lg font-bold text-green-600">{engagement?.avgViewsPerContent || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{t('مشاهدات هذه الفترة', 'Period Views')}</span>
                      <span className="text-lg font-bold text-emerald-600"><AnimatedNumber value={periodEngagement?.views || 0} /></span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Video size={18} className="text-green-500" />
                    {t('مشاهدات الحلقات', 'Episode Viewership')}
                  </h3>
                  {chartData.length > 0 ? (
                    <BarChartComponent data={chartData.map(d => ({ name: d.name, nameEn: d.nameEn, value: d.episodes }))} xAxisDataKey="name" language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={280}
                      bar={{ dataKey: 'value', fill: '#10b981', name: 'المشاهدات', nameEn: 'Views', radius: 6 }} />
                  ) : <div className="h-[280px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات كافية', 'Not enough data')}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ────────────── ENGAGEMENT ────────────── */}
          {activeSection === 'engagement' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Heart size={18} className="text-red-500" />
                    {t('الإعجابات', 'Likes')}
                  </h3>
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="text-center">
                      <Heart size={48} className="text-red-400 mx-auto mb-3" />
                      <p className="text-5xl font-bold text-gray-900 dark:text-white"><AnimatedNumber value={totalLikes} /></p>
                      <p className="text-gray-500 mt-2">{t('إجمالي الإعجابات', 'Total Likes')}</p>
                      {periodEngagement && <p className="text-xs text-gray-400 mt-1">+{periodEngagement.likes} {t('هذا الشهر', 'this month')}</p>}
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MessageCircle size={18} className="text-blue-500" />
                    {t('التعليقات', 'Comments')}
                  </h3>
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="text-center">
                      <MessageCircle size={48} className="text-blue-400 mx-auto mb-3" />
                      <p className="text-5xl font-bold text-gray-900 dark:text-white"><AnimatedNumber value={totalComments} /></p>
                      <p className="text-gray-500 mt-2">{t('إجمالي التعليقات', 'Total Comments')}</p>
                      {periodEngagement && <p className="text-xs text-gray-400 mt-1">+{periodEngagement.comments} {t('هذا الشهر', 'this month')}</p>}
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-indigo-500" />
                    {t('مؤشرات التفاعل', 'Engagement Metrics')}
                  </h3>
                  <div className="space-y-4">
                    {engagement && [
                      { label: t('معدل التفاعل', 'Engagement Rate'), value: `${engagement.engagementRate}%`, color: engagement.engagementRate > 10 ? 'text-green-600' : engagement.engagementRate > 5 ? 'text-yellow-600' : 'text-red-600' },
                      { label: t('متوسط المشاهدات', 'Avg Views/Content'), value: engagement.avgViewsPerContent.toLocaleString(), color: 'text-blue-600' },
                      { label: t('متوسط الإعجابات', 'Avg Likes/Content'), value: engagement.avgLikesPerContent.toLocaleString(), color: 'text-red-600' },
                      { label: t('متوسط التعليقات', 'Avg Comments/Content'), value: engagement.avgCommentsPerContent.toLocaleString(), color: 'text-purple-600' },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{m.label}</span>
                        <span className={`text-lg font-bold ${m.color}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────────── INVENTORY ────────────── */}
          {activeSection === 'inventory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {inventoryItems.map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.bg}`}><item.icon size={20} className={item.color} /></div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  {t('ملخص الموقع', 'Site Summary')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                    <p className="text-2xl font-bold text-green-600">
                      {(totalCounts ? totalCounts.articles + totalCounts.episodes + totalCounts.seasons + totalCounts.playlists + totalCounts.heroSliders : 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">{t('إجمالي المحتوى', 'Total Content')}</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-2xl font-bold text-blue-600">{totalCounts?.users.toLocaleString() || 0}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{t('إجمالي المستخدمين', 'Total Users')}</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                    <p className="text-2xl font-bold text-purple-600">{(totalComments + totalLikes).toLocaleString()}</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{t('إجمالي التفاعلات', 'Total Interactions')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── NEWSLETTER ────────────────── */}
          {activeSection === 'newsletter' && (
            <div className="space-y-6">
              {newsletterData ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-5 text-white shadow-xl">
                      <Mail size={24} className="opacity-80 mb-2" />
                      <p className="text-3xl font-bold"><AnimatedNumber value={newsletterData.totalSubscribers} /></p>
                      <p className="text-sm opacity-80 mt-1">{t('إجمالي المشتركين', 'Total Subscribers')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl p-5 text-white shadow-xl">
                      <UserCheck size={24} className="opacity-80 mb-2" />
                      <p className="text-3xl font-bold"><AnimatedNumber value={newsletterData.activeSubscribers} /></p>
                      <p className="text-sm opacity-80 mt-1">{t('مشتركين نشطين', 'Active Subscribers')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-700 rounded-2xl p-5 text-white shadow-xl">
                      <Send size={24} className="opacity-80 mb-2" />
                      <p className="text-3xl font-bold"><AnimatedNumber value={newsletterData.totalCampaigns} /></p>
                      <p className="text-sm opacity-80 mt-1">{t('إجمالي الحملات', 'Total Campaigns')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-700 rounded-2xl p-5 text-white shadow-xl">
                      <Inbox size={24} className="opacity-80 mb-2" />
                      <p className="text-3xl font-bold"><AnimatedNumber value={newsletterData.totalSent} /></p>
                      <p className="text-sm opacity-80 mt-1">{t('إجمالي المرسل', 'Total Sent')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-teal-500" />
                        {t('توزيع المشتركين', 'Subscriber Distribution')}
                      </h3>
                      {nlDistData.length > 0 ? (
                        <PieChartComponent data={nlDistData} language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={250} />
                      ) : <div className="h-[250px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات', 'No data')}</div>}
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-indigo-500" />
                        {t('حالة الحملات', 'Campaign Status')}
                      </h3>
                      {campaignStatusData.length > 0 ? (
                        <BarChartComponent data={campaignStatusData as unknown as Record<string, string | number>[]} xAxisDataKey="nameEn" language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={250}
                          bar={{ dataKey: 'value', fill: '#6366f1', name: 'الحملات', nameEn: 'Campaigns', radius: 8 }} />
                      ) : <div className="h-[250px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات', 'No data')}</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                        <Radio size={14} />
                        {t('معدل الفتح', 'Open Rate')}
                      </div>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {newsletterData.totalSent > 0 ? Math.round((newsletterData.totalOpens / newsletterData.totalSent) * 100) : 0}%
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                        <Zap size={14} />
                        {t('معدل النقر', 'Click Rate')}
                      </div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {newsletterData.totalSent > 0 ? Math.round((newsletterData.totalClicks / newsletterData.totalSent) * 100) : 0}%
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                        {t('معدل الإلغاء', 'Unsub Rate')}
                      </div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {newsletterData.totalSubscribers > 0 ? Math.round((newsletterData.unsubscribed / newsletterData.totalSubscribers) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات', 'No data')}</div>
              )}
            </div>
          )}

          {/* ────────────────── FRIENDS & CHATS ────────────────── */}
          {activeSection === 'friends' && (
            <div className="space-y-6">
              {friendsData ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white shadow-xl">
                      <Users size={24} className="opacity-80 mb-2" />
                      <p className="text-3xl font-bold"><AnimatedNumber value={friendsData.totalFriendships} /></p>
                      <p className="text-sm opacity-80 mt-1">{t('إجمالي الصداقات', 'Total Friendships')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl p-5 text-white shadow-xl">
                      <UserCheck size={24} className="opacity-80 mb-2" />
                      <p className="text-3xl font-bold"><AnimatedNumber value={friendsData.acceptedFriendships} /></p>
                      <p className="text-sm opacity-80 mt-1">{t('صداقات مقبولة', 'Accepted')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-700 rounded-2xl p-5 text-white shadow-xl">
                      <Clock size={24} className="opacity-80 mb-2" />
                      <p className="text-3xl font-bold"><AnimatedNumber value={friendsData.pendingFriendships} /></p>
                      <p className="text-sm opacity-80 mt-1">{t('معلقة', 'Pending')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-700 rounded-2xl p-5 text-white shadow-xl">
                      <MessageSquare size={24} className="opacity-80 mb-2" />
                      <p className="text-3xl font-bold"><AnimatedNumber value={friendsData.totalMessages} /></p>
                      <p className="text-sm opacity-80 mt-1">{t('إجمالي الرسائل', 'Total Messages')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-indigo-500" />
                        {t('توزيع الصداقات', 'Friendship Distribution')}
                      </h3>
                      {friendsDistData.length > 0 ? (
                        <PieChartComponent data={friendsDistData} language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={250} />
                      ) : <div className="h-[250px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات', 'No data')}</div>}
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-emerald-500" />
                        {t('إحصائيات المحادثات', 'Chat Statistics')}
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{t('إجمالي المحادثات', 'Total Conversations')}</span>
                          <span className="text-2xl font-bold text-indigo-600">{friendsData.totalConversations}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{t('إجمالي الرسائل', 'Total Messages')}</span>
                          <span className="text-2xl font-bold text-blue-600">{friendsData.totalMessages.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{t('رسائل هذه الفترة', 'Period Messages')}</span>
                          <span className="text-2xl font-bold text-emerald-600">{friendsData.periodMessages.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات', 'No data')}</div>
              )}
            </div>
          )}

          {/* ────────────────── AI CHAT ────────────────── */}
          {activeSection === 'aichat' && (
            <div className="space-y-6">
              {aiChatData ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl p-5 text-white shadow-xl">
                      <Bot size={24} className="opacity-80 mb-2" />
                      <p className="text-3xl font-bold"><AnimatedNumber value={aiChatData.totalChats} /></p>
                      <p className="text-sm opacity-80 mt-1">{t('إجمالي المحادثات', 'Total AI Chats')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-700 rounded-2xl p-5 text-white shadow-xl">
                      <Globe size={24} className="opacity-80 mb-2" />
                      <p className="text-3xl font-bold"><AnimatedNumber value={aiChatData.publicChats} /></p>
                      <p className="text-sm opacity-80 mt-1">{t('محادثات عامة', 'Public Chats')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-5 text-white shadow-xl">
                      <MessageSquare size={24} className="opacity-80 mb-2" />
                      <p className="text-3xl font-bold"><AnimatedNumber value={aiChatData.totalMessages} /></p>
                      <p className="text-sm opacity-80 mt-1">{t('إجمالي الرسائل', 'Total Messages')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-violet-500" />
                        {t('حالة المحادثات', 'Chat Status')}
                      </h3>
                      {aiChatData.totalChats > 0 ? (
                        <PieChartComponent data={[
                          { name: t('خاص', 'Private'), nameEn: 'Private', value: Math.max(0, aiChatData.totalChats - aiChatData.publicChats), color: '#8b5cf6' },
                          { name: t('عام', 'Public'), nameEn: 'Public', value: aiChatData.publicChats, color: '#3b82f6' },
                        ]} language={language === 'ar' ? 'ar' : 'en'} isRTL={isRTL} height={250} />
                      ) : <div className="h-[250px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات', 'No data')}</div>}
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-emerald-500" />
                        {t('إحصائيات الذكاء الاصطناعي', 'AI Statistics')}
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{t('متوسط الرسائل لكل محادثة', 'Avg Msgs/Chat')}</span>
                          <span className="text-2xl font-bold text-violet-600">
                            {aiChatData.totalChats > 0 ? Math.round(aiChatData.totalMessages / aiChatData.totalChats) : 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{t('نسبة المحادثات العامة', 'Public Chat %')}</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {aiChatData.totalChats > 0 ? Math.round((aiChatData.publicChats / aiChatData.totalChats) * 100) : 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{t('إجمالي الرسائل', 'Total Messages')}</span>
                          <span className="text-2xl font-bold text-emerald-600">{aiChatData.totalMessages.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">{t('لا توجد بيانات', 'No data')}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
