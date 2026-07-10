'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Search, FileText, Play, Layers, ListVideo, HelpCircle, Users, Shield, FileCheck, Image as ImageIcon, Globe, User as UserIcon, MessageCircle, ExternalLink, Eye, ChevronRight, SlidersHorizontal, X, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/Language/LanguageProvider';
interface AdminSearchHit {
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
  metadata?: Record<string, string | undefined>;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: Record<string, string> }> = {
  article: { icon: <FileText size={18} />, color: 'from-blue-500 to-cyan-500', label: { ar: 'مقالات', en: 'Articles' } },
  episode: { icon: <Play size={18} />, color: 'from-emerald-500 to-teal-500', label: { ar: 'حلقات', en: 'Episodes' } },
  season: { icon: <Layers size={18} />, color: 'from-orange-500 to-rose-500', label: { ar: 'مواسم', en: 'Seasons' } },
  playlist: { icon: <ListVideo size={18} />, color: 'from-pink-500 to-purple-500', label: { ar: 'قوائم تشغيل', en: 'Playlists' } },
  faq: { icon: <HelpCircle size={18} />, color: 'from-cyan-500 to-blue-500', label: { ar: 'أسئلة شائعة', en: 'FAQs' } },
  team: { icon: <Users size={18} />, color: 'from-violet-500 to-indigo-500', label: { ar: 'فريق', en: 'Team' } },
  privacy: { icon: <Shield size={18} />, color: 'from-green-500 to-emerald-500', label: { ar: 'خصوصية', en: 'Privacy' } },
  terms: { icon: <FileCheck size={18} />, color: 'from-purple-500 to-violet-500', label: { ar: 'شروط', en: 'Terms' } },
  heroSlider: { icon: <ImageIcon size={18} />, color: 'from-rose-500 to-pink-500', label: { ar: 'شرائح البطل', en: 'Hero Sliders' } },
  socialLink: { icon: <Globe size={18} />, color: 'from-sky-500 to-indigo-500', label: { ar: 'روابط تواصل', en: 'Social Links' } },
  user: { icon: <UserIcon size={18} />, color: 'from-amber-500 to-orange-500', label: { ar: 'مستخدمون', en: 'Users' } },
  comment: { icon: <MessageCircle size={18} />, color: 'from-gray-500 to-slate-500', label: { ar: 'تعليقات', en: 'Comments' } },
};

const typeOptions = [
  { value: 'all', label: { ar: 'الكل', en: 'All' } },
  ...Object.entries(typeConfig).map(([key, cfg]) => ({
    value: key,
    label: cfg.label,
  })),
];

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: `${Math.random() * 200 + 100}px`,
            height: `${Math.random() * 200 + 100}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `admin-float ${Math.random() * 10 + 8}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            background: i % 2 === 0
              ? 'radial-gradient(circle, rgba(99,102,241,0.3), transparent)'
              : 'radial-gradient(circle, rgba(168,85,247,0.2), transparent)',
          }}
        />
      ))}
    </div>
  );
}

export default function AdminSearchPage() {
  const { language, isRTL } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminSearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [searchTime, setSearchTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const saved = localStorage.getItem('adminRecentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const performSearch = useCallback(async (q: string, type: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      setTotalCount(0);
      setSearchTime(0);
      return;
    }
    setIsLoading(true);
    setImgErrors({});
    const startTime = Date.now();
    try {
      const params = new URLSearchParams({ q, limit: '50' });
      if (type !== 'all') params.set('type', type);
      const res = await fetch(`/api/admin/search?${params}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.results || []);
      setTotalCount(data.totalCount || 0);
      setSearchTime(Date.now() - startTime);
    } catch (err) {
      console.error('Admin search error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(val, typeFilter), 300);
  };

  const handleTypeChange = (type: string) => {
    setTypeFilter(type);
    if (query.length >= 2) performSearch(query, type);
  };

  const filteredResults = useMemo(
    () => results.filter(r => typeFilter === 'all' || r.type === typeFilter),
    [results, typeFilter]
  );

  const groupedResults = useMemo(() => {
    return filteredResults.reduce<Record<string, AdminSearchHit[]>>((acc, r) => {
      if (!acc[r.type]) acc[r.type] = [];
      acc[r.type].push(r);
      return acc;
    }, {});
  }, [filteredResults]);

  const groupedEntries = useMemo(() => Object.entries(groupedResults), [groupedResults]);

  return (
    <div className={`min-h-screen ${isRTL ? 'rtl' : ''}`}>
      <style>{`
        @keyframes admin-float {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
          25% { transform: translate(30px, -40px) scale(1.1); opacity: 0.25; }
          50% { transform: translate(-20px, -80px) scale(0.9); opacity: 0.2; }
          75% { transform: translate(-40px, -20px) scale(1.05); opacity: 0.25; }
        }
        @keyframes admin-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.1), 0 0 40px rgba(168,85,247,0.05); }
          50% { box-shadow: 0 0 30px rgba(99,102,241,0.2), 0 0 60px rgba(168,85,247,0.1); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .admin-search-glow { animation: admin-glow 3s ease-in-out infinite; }
        .admin-result-card { animation: fadeSlideUp 0.4s ease-out both; }
        @media (max-width: 640px) {
          .admin-result-card { animation-duration: 0.3s; }
          .admin-results-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .admin-results-grid { grid-template-columns: 1fr 1fr !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(99,102,241,0.2); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(99,102,241,0.4); }
      `}</style>

      {/* Search Hero */}
      <div className="relative bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 overflow-hidden">
        <FloatingOrbs />
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-purple-600 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Search size={18} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {language === 'ar' ? 'بحث الإدارة' : 'Admin Search'}
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              {language === 'ar' ? 'متقدم' : 'Advanced'}
            </span>
          </div>
          <p className="text-indigo-200/60 text-sm mb-6 max-w-xl">
            {language === 'ar'
              ? 'ابحث في جميع أقسام لوحة التحكم وانتقل مباشرة إلى المكان المطلوب للتعديل أو المعاينة'
              : 'Search across all admin sections and navigate directly to edit or preview'}
          </p>

          {/* Search Input */}
          <div className="relative admin-search-glow">
            <div className="relative bg-white/[0.07] backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-xl overflow-hidden group focus-within:bg-white/[0.1] focus-within:border-indigo-400/40 transition-all duration-500">
              <div className="flex items-center px-5 py-4">
                <Search size={20} className="text-indigo-300/50 group-focus-within:text-indigo-300/80 transition-colors flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  placeholder={language === 'ar'
                    ? 'ابحث عن مقالات، حلقات، مستخدمين، تعليقات...'
                    : 'Search for articles, episodes, users, comments...'}
                  className="flex-1 bg-transparent text-white text-lg placeholder-indigo-300/30 mx-4 focus:outline-none"
                />
                {isLoading && (
                  <div className="w-5 h-5 border-2 border-indigo-300/30 border-t-indigo-400 rounded-full animate-spin flex-shrink-0" />
                )}
                <div className="hidden sm:flex items-center gap-1.5 text-indigo-300/30 text-xs">
                  <kbd className="px-2 py-1 bg-white/5 rounded text-[10px] border border-white/10 font-mono">Ctrl</kbd>
                  <span className="text-white/20">+</span>
                  <kbd className="px-2 py-1 bg-white/5 rounded text-[10px] border border-white/10 font-mono">K</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Toggle + Controls */}
          <div className="flex items-center justify-between mt-5 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                  showFilters
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                    : 'bg-white/5 text-indigo-200/50 border-white/10 hover:bg-white/10 hover:text-indigo-200/80'
                }`}
              >
                <SlidersHorizontal size={14} />
                {language === 'ar' ? 'تصفية' : 'Filters'}
                {typeFilter !== 'all' && (
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">1</span>
                )}
              </button>
              {typeFilter !== 'all' && (
                <button
                  onClick={() => handleTypeChange('all')}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-indigo-300/60 hover:text-indigo-300 bg-white/5 hover:bg-white/10 transition-all"
                >
                  <X size={12} />
                  {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
                </button>
              )}
            </div>
            {query.length >= 2 && (
              <div className="text-xs text-indigo-200/40">
                {searchTime > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {searchTime}ms
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className={`flex flex-wrap gap-2 mt-4 transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            {typeOptions.map((opt, i) => {
              const cfg = typeConfig[opt.value];
              return (
                <button
                  key={opt.value}
                  onClick={() => handleTypeChange(opt.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                    typeFilter === opt.value
                      ? 'bg-indigo-500/20 text-white border-indigo-400/30 shadow-lg shadow-indigo-500/10'
                      : 'bg-white/5 text-indigo-200/50 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                  style={{ transitionDelay: `${i * 30}ms` }}
                >
                  {cfg?.icon}
                  {opt.label[language as 'ar' | 'en']}
                </button>
              );
            })}
          </div>

          {/* Quick Type Filters (always visible) */}
          <div className="flex flex-wrap gap-2 mt-4">
            {typeOptions.slice(0, 6).map(opt => {
              const cfg = typeConfig[opt.value];
              const isActive = typeFilter === opt.value;
              const bgColor = isActive && cfg ? cfg.color : '';
              return (
                <button
                  key={opt.value}
                  onClick={() => handleTypeChange(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${bgColor} text-white shadow-lg shadow-indigo-500/15`
                      : 'bg-white/8 text-indigo-200/60 hover:bg-white/15 hover:text-white backdrop-blur-sm'
                  }`}
                >
                  {cfg?.icon}
                  {opt.label[language as 'ar' | 'en']}
                </button>
              );
            })}
            {typeOptions.length > 6 && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-indigo-200/40 hover:bg-white/10 transition-all border border-white/5"
              >
                +{typeOptions.length - 6}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/50 border-t-indigo-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 border-3 border-purple-200 dark:border-purple-900/50 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
            </p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && query.length >= 2 && totalCount === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center shadow-inner">
              <Search size={44} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              {language === 'ar'
                ? `لم يتم العثور على نتائج لـ "${query}"`
                : `No results found for "${query}"`
              }
            </p>
            <div className="flex items-center justify-center gap-3">
              {typeFilter !== 'all' && (
                <button
                  onClick={() => { setTypeFilter('all'); performSearch(query, 'all'); }}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                >
                  {language === 'ar' ? 'البحث في الكل' : 'Search all types'}
                </button>
              )}
              <button
                onClick={() => { setQuery(''); setResults([]); setTotalCount(0); inputRef.current?.focus(); }}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-all active:scale-95"
              >
                {language === 'ar' ? 'بحث جديد' : 'New search'}
              </button>
            </div>
          </div>
        )}

        {/* Idle State */}
        {!isLoading && query.length < 2 && (
          <div className="text-center py-16">
            <div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center shadow-inner">
              <Sparkles size={52} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {language === 'ar' ? 'ابحث في لوحة التحكم' : 'Search Admin Panel'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm">
              {language === 'ar'
                ? 'اكتب كلمة مفتاحية للبحث في جميع أقسام الإدارة وانتقل مباشرة للتعديل'
                : 'Type a keyword to search across all admin sections and navigate directly'}
            </p>

            {/* Quick categories */}
            <div className="mt-8 max-w-lg mx-auto">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
                <TrendingUp size={12} />
                {language === 'ar' ? 'أقسام سريعة' : 'Quick sections'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {typeOptions.slice(1, 8).map(opt => {
                  const cfg = typeConfig[opt.value];
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { handleTypeChange(opt.value); inputRef.current?.focus(); }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-gray-200 dark:border-gray-700/50"
                    >
                      {cfg?.icon}
                      {opt.label[language as 'ar' | 'en']}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mt-10 max-w-sm mx-auto">
                <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
                  <Clock size={12} />
                  {language === 'ar' ? 'عمليات بحث حديثة' : 'Recent Searches'}
                </h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recentSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(s); performSearch(s, typeFilter); }}
                      className="px-3.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-gray-200 dark:border-gray-700/50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {language === 'ar' ? 'نتائج البحث' : 'Search Results'}
                  <span className="text-gray-400 font-normal mx-2">({totalCount})</span>
                </h2>
                {query && (
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    &ldquo;{query}&rdquo;
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {searchTime > 0 && (
                  <span className="text-xs text-gray-400 hidden sm:flex items-center gap-1">
                    <Clock size={12} />
                    {searchTime}ms
                  </span>
                )}
                {typeFilter !== 'all' && (
                  <button
                    onClick={() => handleTypeChange('all')}
                    className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    {language === 'ar' ? 'عرض الكل' : 'Show all'}
                  </button>
                )}
              </div>
            </div>

            {groupedEntries.map(([type, items], groupIdx) => {
              const cfg = typeConfig[type];
              return (
                <div key={type} className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white shadow-sm`}>
                      {cfg?.icon}
                    </div>
                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
                      {cfg?.label[language as 'ar' | 'en'] || type}
                    </h3>
                    <span className="text-sm text-gray-400">({items.length})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((item, itemIdx) => {
                      const hasImage = item.imageUrl && !imgErrors[`${item.type}-${item.id}`];
                      const delay = groupIdx * 0.1 + itemIdx * 0.05;
                      return (
                        <div
                          key={`${item.type}-${item.id}`}
                          className="admin-result-card group bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-indigo-200 dark:hover:border-indigo-700/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                          style={{ animationDelay: `${delay}s` }}
                        >
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Image/Icon */}
                              <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 relative shadow-sm">
                                {hasImage ? (
                                  <NextImage
                                    src={item.imageUrl!}
                                    alt=""
                                    width={44}
                                    height={44}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgErrors(prev => ({ ...prev, [`${item.type}-${item.id}`]: true }))}
                                  />
                                ) : (
                                  <div className={`w-full h-full bg-gradient-to-br ${cfg?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white`}>
                                    {cfg?.icon}
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={item.adminUrl}
                                  className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1 flex items-center gap-1.5"
                                >
                                  {language === 'ar' ? item.title : item.titleEn}
                                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 text-indigo-400" />
                                </Link>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                                  {(language === 'ar' ? item.description : item.descriptionEn) || item.slug || ''}
                                </p>
                                <div className="flex items-center gap-2 mt-2.5">
                                  <Link
                                    href={item.adminUrl}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-2.5 py-1 rounded-lg transition-all hover:shadow-md hover:shadow-indigo-500/20 active:scale-95"
                                  >
                                    <Eye size={12} />
                                    {language === 'ar' ? 'تعديل' : 'Edit'}
                                  </Link>
                                  {item.previewUrl && (
                                    <Link
                                      href={item.previewUrl}
                                      target="_blank"
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2.5 py-1 rounded-lg transition-all active:scale-95"
                                    >
                                      <ExternalLink size={12} />
                                      {language === 'ar' ? 'معاينة' : 'Preview'}
                                    </Link>
                                  )}
                                  {item.metadata?.role && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium ml-auto">
                                      {item.metadata.role}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Search Summary Footer */}
            {groupedEntries.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span>
                  {language === 'ar'
                    ? `${totalCount} نتيجة في ${groupedEntries.length} قسم`
                    : `${totalCount} results across ${groupedEntries.length} sections`}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {searchTime}ms
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
