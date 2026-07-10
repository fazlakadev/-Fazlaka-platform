// src/components/Search/SearchResults.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  getRelativeTime,
  isToday,
  isYesterday
} from '@/utils/dateUtils';
import { SemanticSearchResult } from '@/services/semanticSearch';
import Image from 'next/image';

type Language = 'ar' | 'en';
type ContentType = 'article' | 'episode' | 'season' | 'playlist';

const typeConfig: Record<ContentType, { color: string; gradient: string; border: string }> = {
  article: { color: 'from-blue-500 to-cyan-500', gradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', border: 'border-blue-200 dark:border-blue-800' },
  episode: { color: 'from-emerald-500 to-teal-500', gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
  season: { color: 'from-orange-500 to-rose-500', gradient: 'from-orange-50 to-rose-50 dark:from-orange-950/30 dark:to-rose-950/30', border: 'border-orange-200 dark:border-orange-800' },
  playlist: { color: 'from-pink-500 to-purple-500', gradient: 'from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30', border: 'border-pink-200 dark:border-pink-800' }
};

function SearchResultImage({ src, alt, defaultSrc, children }: { src: string; alt: string; defaultSrc: string; children: React.ReactNode }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative h-full w-full">
      {imgError ? (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => {
            if (imgSrc !== defaultSrc) {
              setImgSrc(defaultSrc);
            } else {
              setImgError(true);
            }
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      {children}
    </div>
  );
}

export default function SearchResults({ 
  results, 
  language
}: { 
  results: SemanticSearchResult[]; 
  language: Language;
}) {
  const getTypeLabel = (type: ContentType) => {
    const labels: Record<Language, Record<ContentType, string>> = {
      ar: {
        article: 'مقال',
        episode: 'حلقة',
        season: 'موسم',
        playlist: 'قائمة تشغيل'
      },
      en: {
        article: 'Article',
        episode: 'Episode',
        season: 'Season',
        playlist: 'Playlist'
      }
    };
    return labels[language][type] || type;
  };

  const getTypeIcon = (type: ContentType) => {
    const icons: Record<ContentType, React.ReactNode> = {
      article: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      episode: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      season: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      playlist: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    };
    return icons[type] || icons.article;
  };

  const getResultUrl = (result: SemanticSearchResult) => {
    const { type, data } = result;
    
    switch (type) {
      case 'article': return `/articles/${data.slug}`;
      case 'episode': return `/episodes/${data.slug}`;
      case 'season': return `/seasons/${data.slug}`;
      case 'playlist': return `/playlists/${data._id || data.id}`;
      default: return '/';
    }
  };

  const getResultImage = (result: SemanticSearchResult): string => {
    const { type, data } = result;
    switch (type) {
      case 'article': return String(data.featuredImageUrl || data.featuredImageUrlEn || '/images/default-article.jpg');
      case 'episode': return String(data.thumbnailUrl || data.thumbnailUrlEn || '/images/default-episode.jpg');
      case 'season': return String(data.thumbnailUrl || data.thumbnailUrlEn || '/images/default-season.jpg');
      case 'playlist': return String(data.imageUrl || data.imageUrlEn || '/images/default-playlist.jpg');
      default: return '/images/default-content.jpg';
    }
  };

  const getResultTitle = (result: SemanticSearchResult): string => {
    const { type, data } = result;
    switch (type) {
      case 'article': case 'episode': case 'season': case 'playlist':
        return String(result.highlightedTitle || data.localizedTitle || data.title || '');
      default: return String(result.highlightedTitle || data.title || data.name || '');
    }
  };

  const getResultDescription = (result: SemanticSearchResult): string => {
    const { type, data } = result;
    switch (type) {
      case 'article': return String(result.highlightedDescription || data.localizedExcerpt || data.excerpt || '');
      case 'episode': case 'season': case 'playlist':
        return String(result.highlightedDescription || data.localizedDescription || data.description || '');
      default: return String(result.highlightedDescription || data.description || '');
    }
  };

  const getResultDate = (result: SemanticSearchResult): string => {
    const { data } = result;
    return String(data.publishedAt || data.createdAt || data.updatedAt || '');
  };

  const getFormattedDate = (date: string | Date) => {
    if (isToday(date)) return language === 'ar' ? 'اليوم' : 'Today';
    if (isYesterday(date)) return language === 'ar' ? 'أمس' : 'Yesterday';
    return getRelativeTime(date, language);
  };

  const shouldShowIcon = (_result: SemanticSearchResult) => {
    return false;
  };

  return (
    <div className="space-y-5">
      {results.map((result, index) => {
        const type = result.type as ContentType;
        const cfg = typeConfig[type] || typeConfig.article;
        return (
          <div key={`${result.type}-${result.data._id || result.data.id || index}`} className="search-result-card group">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/50 hover:border-indigo-200 dark:hover:border-indigo-700/50 overflow-hidden hover:-translate-y-1 hover:scale-[1.01]">
              <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="md:w-[280px] h-52 md:h-auto relative overflow-hidden">
                  {shouldShowIcon(result) ? (
                    <Link href={getResultUrl(result)} className="block h-full">
                      <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${cfg.gradient}`}>
                        <div className="text-6xl text-gray-400 dark:text-gray-500 opacity-50">
                          {getTypeIcon(type)}
                        </div>
                        <div className={`absolute top-3 left-3 bg-gradient-to-r ${cfg.color} text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg`}>
                          {getTypeIcon(type)}
                          <span>{getTypeLabel(type)}</span>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Link href={getResultUrl(result)} className="block h-full">
                      <SearchResultImage
                        src={getResultImage(result)}
                        alt={getResultTitle(result)}
                        defaultSrc="/images/default-content.jpg"
                      >
                        <div className={`absolute top-3 left-3 bg-gradient-to-r ${cfg.color} text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg`}>
                          {getTypeIcon(type)}
                          <span>{getTypeLabel(type)}</span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <span className="text-white/90 text-sm font-medium">
                            {getFormattedDate(getResultDate(result))}
                          </span>
                        </div>
                      </SearchResultImage>
                    </Link>
                  )}
                </div>
                
                {/* Content Section */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 leading-tight">
                      <Link href={getResultUrl(result)} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        <span dangerouslySetInnerHTML={{ __html: getResultTitle(result) }} />
                      </Link>
                    </h3>
                    {result.relevance && (
                      <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-full border border-indigo-100 dark:border-indigo-800/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {Math.round(result.score * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: getResultDescription(result) }} />
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {getFormattedDate(getResultDate(result))}
                      </span>
                    </div>
                    <span className="text-indigo-500 dark:text-indigo-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {language === 'ar' ? 'عرض المزيد ←' : 'View more →'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
