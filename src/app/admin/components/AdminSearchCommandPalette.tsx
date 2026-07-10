'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Play, Layers, ListVideo, HelpCircle, Users, Shield, FileCheck, Globe, User as UserIcon, MessageCircle, ChevronRight, ArrowUpDown, ExternalLink, Eye, BarChart3, ArrowRight } from 'lucide-react';
import Image from 'next/image';
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
  analyticsUrl?: string;
  metadata?: Record<string, string | undefined>;
}

const typeIcons: Record<string, React.ReactNode> = {
  article: <FileText size={16} />,
  episode: <Play size={16} />,
  season: <Layers size={16} />,
  playlist: <ListVideo size={16} />,
  faq: <HelpCircle size={16} />,
  team: <Users size={16} />,
  privacy: <Shield size={16} />,
  terms: <FileCheck size={16} />,
  heroSlider: <FileText size={16} />,
  socialLink: <Globe size={16} />,
  user: <UserIcon size={16} />,
  comment: <MessageCircle size={16} />,
};

const typeColors: Record<string, string> = {
  article: 'from-blue-500 to-cyan-500',
  episode: 'from-emerald-500 to-teal-500',
  season: 'from-orange-500 to-rose-500',
  playlist: 'from-pink-500 to-purple-500',
  faq: 'from-cyan-500 to-blue-500',
  team: 'from-violet-500 to-indigo-500',
  privacy: 'from-green-500 to-emerald-500',
  terms: 'from-purple-500 to-violet-500',
  heroSlider: 'from-rose-500 to-pink-500',
  socialLink: 'from-sky-500 to-indigo-500',
  user: 'from-amber-500 to-orange-500',
  comment: 'from-gray-500 to-slate-500',
};

const typeLabels: Record<string, { ar: string; en: string }> = {
  article: { ar: 'مقال', en: 'Article' },
  episode: { ar: 'حلقة', en: 'Episode' },
  season: { ar: 'موسم', en: 'Season' },
  playlist: { ar: 'قائمة تشغيل', en: 'Playlist' },
  faq: { ar: 'سؤال شائع', en: 'FAQ' },
  team: { ar: 'فريق', en: 'Team' },
  privacy: { ar: 'خصوصية', en: 'Privacy' },
  terms: { ar: 'شروط', en: 'Terms' },
  heroSlider: { ar: 'شريحة بطل', en: 'Hero Slider' },
  socialLink: { ar: 'رابط تواصل', en: 'Social Link' },
  user: { ar: 'مستخدم', en: 'User' },
  comment: { ar: 'تعليق', en: 'Comment' },
};

interface AdminSearchCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSearchCommandPalette({ isOpen, onClose }: AdminSearchCommandPaletteProps) {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminSearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    setImgErrors({});
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}&limit=12`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.results || []);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Admin search error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setImgErrors({});
      setTimeout(() => inputRef.current?.focus(), 100);
      const saved = localStorage.getItem('adminRecentSearches');
      if (saved) setRecentSearches(JSON.parse(saved));
    }
  }, [isOpen]);

  useEffect(() => {
    if (query) performSearch(query);
  }, [query, performSearch, language]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(val), 250);
  };

  const saveRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('adminRecentSearches', JSON.stringify(updated));
  };

  const navigateTo = (url: string, searchQuery: string) => {
    saveRecentSearch(searchQuery);
    onClose();
    router.push(url);
  };

  const openInNewTab = (url: string, searchQuery: string) => {
    saveRecentSearch(searchQuery);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigateTo(results[selectedIndex].adminUrl, query);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const el = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]" onClick={onClose}>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      <div
        ref={paletteRef}
        className={`relative w-full max-w-xl mx-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-indigo-500/15 border border-gray-200 dark:border-gray-700/50 overflow-hidden ${isRTL ? 'rtl' : ''}`}
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideDown 0.25s ease-out' }}
      >
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideDown { from { opacity: 0; transform: translateY(-20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
          @keyframes pulse-dot { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
        `}</style>

        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
            <Search size={18} className="text-indigo-500" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={language === 'ar' ? 'ابحث في لوحة التحكم... (مقالات، حلقات، مستخدمين، تعليقات)' : 'Search admin panel... (articles, episodes, users, comments)'}
            className="flex-1 bg-transparent text-gray-800 dark:text-gray-200 text-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            {language === 'ar' ? (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono border border-gray-200 dark:border-gray-700">
                Alt+K
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono border border-gray-200 dark:border-gray-700">
                Alt+K
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[440px] overflow-y-auto custom-scrollbar">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="w-8 h-8 border-3 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            </div>
          )}

          {/* No results */}
          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="flex flex-col items-center py-14 text-gray-400">
              <div className="w-16 h-16 mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <Search size={32} className="opacity-40" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {language === 'ar' ? `لا توجد نتائج لـ "${query}"` : `No results for "${query}"`}
              </p>
            </div>
          )}

          {/* Recent Searches */}
          {!isLoading && query.length < 2 && recentSearches.length > 0 && (
            <div className="p-4 pb-2">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'عمليات بحث حديثة' : 'Recent Searches'}
                </p>
              </div>
              <div className="space-y-1">
                {recentSearches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s); performSearch(s); }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 flex items-center gap-3 group"
                    style={{ animation: `slideDown 0.2s ease-out ${i * 0.05}s both` }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                      <Search size={14} className="opacity-40 group-hover:opacity-60" />
                    </div>
                    <span className="flex-1">{s}</span>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {!isLoading && results.length > 0 && (
            <div className="p-2">
              {(() => {
                const grouped: Record<string, AdminSearchHit[]> = {};
                results.forEach(r => {
                  if (!grouped[r.type]) grouped[r.type] = [];
                  grouped[r.type].push(r);
                });
                return Object.entries(grouped).map(([type, items], groupIdx) => (
                  <div key={type}>
                    <div className="flex items-center gap-2 px-3 py-2 mt-1">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${typeColors[type] || 'from-gray-400 to-gray-500'} animate-pulse`} style={{ animationDelay: `${groupIdx * 0.1}s` }} />
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {typeLabels[type]?.[language === 'ar' ? 'ar' : 'en'] || type}
                      </span>
                      <span className="text-xs text-gray-300 dark:text-gray-600">({items.length})</span>
                    </div>
                    {items.map((item, itemIdx) => {
                      const globalIdx = results.indexOf(item);
                      return (
                        <div
                          key={`${item.type}-${item.id}`}
                          className={`rounded-xl transition-all duration-150 overflow-hidden ${
                            selectedIndex === globalIdx
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800/50'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                          style={{ animation: `slideDown 0.2s ease-out ${(groupIdx * 0.1 + itemIdx * 0.03)}s both` }}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                        >
                          <div className="flex items-start gap-3 px-3 py-3">
                            {/* Image/Icon */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden relative">
                              {item.imageUrl && !imgErrors[`${item.type}-${item.id}`] ? (
                                <Image
                                  src={item.imageUrl}
                                  alt=""
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                  onError={() => setImgErrors(prev => ({ ...prev, [`${item.type}-${item.id}`]: true }))}
                                />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${typeColors[type] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white`}>
                                  {typeIcons[type] || <Search size={16} />}
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                {language === 'ar' ? item.title : item.titleEn}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                {(language === 'ar' ? item.description : item.descriptionEn) || item.slug || ''}
                              </div>
                              {item.metadata?.role && (
                                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                                  {item.metadata.role}
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex-shrink-0 flex items-center gap-0.5">
                              <button
                                onClick={() => navigateTo(item.adminUrl, query)}
                                className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/50 text-gray-400 hover:text-indigo-500 transition-all"
                                title={language === 'ar' ? 'تعديل' : 'Edit'}
                              >
                                <Eye size={14} />
                              </button>
                              {(item.type === 'article' || item.type === 'episode') && item.analyticsUrl && (
                                <button
                                  onClick={() => navigateTo(item.analyticsUrl!, query)}
                                  className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-gray-400 hover:text-amber-500 transition-all"
                                  title={language === 'ar' ? 'تحليلات' : 'Analytics'}
                                >
                                  <BarChart3 size={14} />
                                </button>
                              )}
                              {item.previewUrl && (
                                <button
                                  onClick={() => item.previewUrl && openInNewTab(item.previewUrl, query)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                                  title={language === 'ar' ? 'معاينة' : 'Preview'}
                                >
                                  <ExternalLink size={14} />
                                </button>
                              )}
                              <ChevronRight size={15} className="text-gray-300 dark:text-gray-600" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && query.length < 2 && recentSearches.length === 0 && (
            <div className="flex flex-col items-center py-14 text-gray-400">
              <div className="w-16 h-16 mb-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center shadow-inner">
                <Search size={32} className="text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'ابدأ الكتابة للبحث' : 'Start typing to search'}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
                {language === 'ar'
                  ? 'ابحث في المقالات، الحلقات، المستخدمين، وجميع أقسام الإدارة'
                  : 'Search articles, episodes, users, and all admin sections'}
              </p>
            </div>
          )}

          {/* Footer */}
          {!isLoading && results.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800">
              <div className="px-5 py-3 text-xs text-gray-400 flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1"><ArrowUpDown size={12} /> {language === 'ar' ? 'تنقل' : 'Navigate'}</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono border border-gray-200 dark:border-gray-700">↵</kbd> {language === 'ar' ? 'فتح' : 'Open'}</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono border border-gray-200 dark:border-gray-700">Esc</kbd> {language === 'ar' ? 'إغلاق' : 'Close'}</span>
              </div>
              <button
                onClick={() => { onClose(); router.push('/admin/search'); }}
                className="w-full px-5 py-2.5 text-xs font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2 border-t border-gray-50 dark:border-gray-800/50"
              >
                <ArrowRight size={13} />
                {language === 'ar' ? 'فتح صفحة البحث المتقدم' : 'Open advanced search page'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
