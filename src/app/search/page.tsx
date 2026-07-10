// src/app/search/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { useSearchParams } from 'next/navigation';
import { 
  searchFromClient, 
  getSearchSuggestionsFromClient,
  getTrendingSearchesFromClient,
  saveSearchHistory
} from '@/services/searchClient';
import { SearchResultFromAPI } from '@/services/searchClient';
import SearchFilters from '@/components/Search/SearchFilters';
import SearchResults from '@/components/Search/SearchResults';
import SearchSuggestions from '@/components/Search/SearchSuggestions';
import AIAssistantSearch from '@/components/Search/AIAssistantSearch';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20 dark:opacity-10"
          style={{
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 8 + 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            background: i % 3 === 0
              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
              : i % 3 === 1
                ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                : 'linear-gradient(135deg, #10b981, #06b6d4)',
          }}
        />
      ))}
    </div>
  );
}

function SearchPageContent() {
  const { data: session } = useSession();
  const { language, isRTL } = useLanguage();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultFromAPI | null>({
    semanticResults: [],
    suggestions: [],
    trendingSearches: [],
    relatedContent: [],
    totalCount: 0,
    searchTime: 0
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    sortBy: 'relevance',
    dateRange: 'all',
  });
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async (searchQuery: string, activeFilters: typeof filters) => {
    if (!searchQuery.trim()) {
      setResults(prev => prev ? { ...prev, semanticResults: [], totalCount: 0 } : null);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(false);
    
    try {
      const searchResults = await searchFromClient(searchQuery, language, {
        limit: 20,
        ...activeFilters
      });
      
      setResults(searchResults);
      saveSearchHistory(searchQuery, session?.user?.id);
      
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  }, [language, session?.user?.id]);

  const getSuggestions = useCallback(async (value: string) => {
    try {
      const searchSuggestions = await getSearchSuggestionsFromClient(value, language);
      setSuggestions(searchSuggestions.map(s => s.text));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  }, [language]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion, filters);
  }, [handleSearch, filters]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (value.trim()) {
        handleSearch(value, filters);
      } else {
        setResults(prev => prev ? { ...prev, semanticResults: [], totalCount: 0 } : null);
      }
    }, 500);
    
    if (value.trim()) {
      getSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [handleSearch, getSuggestions, filters]);

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    if (query.trim()) {
      handleSearch(query, newFilters);
    }
  }, [query, handleSearch]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query, filters);
  }, [query, handleSearch, filters]);

  const loadTrendingSearches = useCallback(async () => {
    try {
      const trending = await getTrendingSearchesFromClient(language);
      setResults(prev => ({
        semanticResults: prev?.semanticResults || [],
        suggestions: prev?.suggestions || [],
        relatedContent: prev?.relatedContent || [],
        totalCount: prev?.totalCount || 0,
        searchTime: prev?.searchTime || 0,
        trendingSearches: trending
      }));
    } catch (error) {
      console.error('Error loading trending searches:', error);
    }
  }, [language]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery, filters);
    } else {
      loadTrendingSearches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const texts = {
    ar: {
      pageTitle: 'البحث في فذلكة',
      subtitle: 'اكتشف محتوى غني ومنوع',
      placeholder: 'ابحث عن مقالات، حلقات، مواسم، قوائم تشغيل، أعضاء الفريق...',
      searchButton: 'بحث',
      noResults: 'لم يتم العثور على نتائج',
      loading: 'جاري البحث...',
      filters: 'الفلاتر',
      sortBy: 'ترتيب حسب',
      relevance: 'الصلة',
      date: 'التاريخ',
      title: 'العنوان',
      dateRange: 'نطاق التاريخ',
      all: 'الكل',
      week: 'الأسبوع الماضي',
      month: 'الشهر الماضي',
      year: 'السنة الماضية',
      contentType: 'نوع المحتوى',
      article: 'مقالات',
      episode: 'حلقات',
      season: 'مواسم',
      playlist: 'قوائم تشغيل',
      team: 'الفريق',
      faq: 'الأسئلة الشائعة',
      privacy: 'سياسة الخصوصية',
      terms: 'شروط وأحكام',
      suggestions: 'اقتراحات البحث',
      searchHistory: 'سجل البحث',
      trendingSearches: 'عمليات البحث الشائعة',
      advancedSearch: 'بحث متقدم',
      resultsCount: '{count} نتيجة',
      relatedContent: 'محتوى ذو صلة',
      searchTime: 'وقت البحث: {time}ms',
      startSearching: 'ابدأ البحث',
      startHint: 'اكتب كلمات مفتاحية في مربع البحث للعثور على المحتوى الذي تبحث عنه',
      noResultsHint: 'جرب استخدام كلمات مفتاحية مختلفة أو تحقق من تهجئة الكلمات',
      searchResultsFor: 'نتائج البحث عن: "{query}"',
      newSearch: 'بحث جديد'
    },
    en: {
      pageTitle: 'Search in Fazlaka',
      subtitle: 'Discover rich and diverse content',
      placeholder: 'Search for articles, episodes, seasons, playlists, team members...',
      searchButton: 'Search',
      noResults: 'No results found',
      loading: 'Searching...',
      filters: 'Filters',
      sortBy: 'Sort by',
      relevance: 'Relevance',
      date: 'Date',
      title: 'Title',
      dateRange: 'Date range',
      all: 'All',
      week: 'Last week',
      month: 'Last month',
      year: 'Last year',
      contentType: 'Content type',
      article: 'Articles',
      episode: 'Episodes',
      season: 'Seasons',
      playlist: 'Playlists',
      team: 'Team',
      faq: 'FAQs',
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      suggestions: 'Search suggestions',
      searchHistory: 'Search history',
      trendingSearches: 'Trending searches',
      advancedSearch: 'Advanced search',
      resultsCount: '{count} results',
      relatedContent: 'Related content',
      searchTime: 'Search time: {time}ms',
      startSearching: 'Start searching',
      startHint: 'Type keywords in the search box to find the content you are looking for',
      noResultsHint: 'Try using different keywords or check the spelling of your words',
      searchResultsFor: 'Search results for: "{query}"',
      newSearch: 'New search'
    }
  };

  const t = texts[language];

  const filterTexts = {
    filters: t.filters,
    contentType: t.contentType,
    all: t.all,
    article: t.article,
    episode: t.episode,
    season: t.season,
    playlist: t.playlist,
    team: t.team,
    faq: t.faq,
    privacy: t.privacy,
    terms: t.terms,
    sortBy: t.sortBy,
    relevance: t.relevance,
    date: t.date,
    title: t.title,
    dateRange: t.dateRange,
    week: t.week,
    month: t.month,
    year: t.year
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.4; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.1), 0 0 40px rgba(245,158,11,0.05); }
          50% { box-shadow: 0 0 30px rgba(99,102,241,0.2), 0 0 60px rgba(245,158,11,0.1); }
        }
        .search-hero-glow { animation: glow 3s ease-in-out infinite; }
        .search-result-card { animation: fadeSlideUp 0.4s ease-out both; }
        .search-result-card:nth-child(1) { animation-delay: 0.05s; }
        .search-result-card:nth-child(2) { animation-delay: 0.1s; }
        .search-result-card:nth-child(3) { animation-delay: 0.15s; }
        .search-result-card:nth-child(4) { animation-delay: 0.2s; }
        .search-result-card:nth-child(5) { animation-delay: 0.25s; }
        .search-result-card:nth-child(6) { animation-delay: 0.3s; }
        .search-result-card:nth-child(7) { animation-delay: 0.35s; }
        .search-result-card:nth-child(8) { animation-delay: 0.4s; }
      `}</style>
      <div className={`min-h-screen ${isRTL ? 'rtl' : ''}`}>
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-indigo-50 via-white to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
          <FloatingParticles />
          <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 bg-gradient-to-r from-indigo-600 via-purple-500 to-amber-500 dark:from-indigo-400 dark:via-purple-400 dark:to-amber-400 bg-clip-text text-transparent">
                {t.pageTitle}
              </h1>
              <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-light">
                {t.subtitle}
              </p>
            </div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto" id="search-form">
              <div className="relative search-hero-glow">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-amber-500/20 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-amber-500/10 rounded-2xl blur-xl" />
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-indigo-500/5 border border-white/40 dark:border-gray-700/40">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="w-full py-4 px-6 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none text-lg rounded-2xl"
                    placeholder={t.placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.trim() && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 rounded-full" />
                  <button
                    type="submit"
                    className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* Suggestions (outside overflow hero for visibility) */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="max-w-5xl mx-auto px-4 relative" style={{ marginTop: '-0.5rem' }}>
            <SearchSuggestions 
              suggestions={suggestions} 
              onSuggestionClick={handleSuggestionClick}
              isRTL={isRTL}
            />
          </div>
        )}
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-1/4">
              <SearchFilters 
                filters={filters} 
                onFilterChange={handleFilterChange}
                language={language}
                texts={filterTexts}
              />
            </div>
            
            {/* Results */}
            <div className="lg:w-3/4">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-purple-200 dark:border-purple-800 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                    </div>
                  </div>
                </div>
              ) : results ? (
                <>
                  {query && results.totalCount > 0 && (
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                        {t.resultsCount.replace('{count}', results.totalCount.toString())}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400">
                        {language === 'ar' 
                          ? `نتائج البحث عن: "${query}"`
                          : `Search results for: "${query}"`
                        }
                      </p>
                      {results.searchTime > 0 && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          {t.searchTime.replace('{time}', results.searchTime.toString())}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {results.semanticResults.length > 0 ? (
                    <>
                      <SearchResults 
                        results={results.semanticResults} 
                        language={language}
                      />
                      
                      <AIAssistantSearch 
                        query={query}
                        language={language}
                      />
                    </>
                  ) : query ? (
                    <div className="text-center py-16">
                      <div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {t.noResults}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        {t.noResultsHint}
                      </p>
                      
                      <AIAssistantSearch 
                        query={query}
                        language={language}
                      />
                      
                      <button
                        onClick={() => {
                          setQuery('');
                          setResults(prev => prev ? { ...prev, semanticResults: [], totalCount: 0 } : null);
                          searchInputRef.current?.focus();
                        }}
                        className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
                      >
                        {t.newSearch}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-50 to-amber-50 dark:from-indigo-900/20 dark:to-amber-900/20 rounded-full flex items-center justify-center shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-indigo-400 dark:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {t.startSearching}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        {t.startHint}
                      </p>
                      
                      {results.trendingSearches && results.trendingSearches.length > 0 && (
                        <div className="max-w-lg mx-auto">
                          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                            {t.trendingSearches}
                          </h4>
                          <div className="flex flex-wrap gap-3 justify-center">
                            {results.trendingSearches.map((trending, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(trending)}
                                className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-300 rounded-full text-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/10"
                              >
                                {trending}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {results.relatedContent && results.relatedContent.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                        {t.relatedContent}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {results.relatedContent.map((item, index) => (
                          <div key={index} className="group bg-white dark:bg-gray-800/50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700/50 hover:border-indigo-200 dark:hover:border-indigo-700/50 overflow-hidden hover:-translate-y-1">
                            <div className="p-5">
                              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {item.data.title || item.data.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {item.data.description || item.data.excerpt || item.data.bio}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-200 dark:border-purple-800 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
