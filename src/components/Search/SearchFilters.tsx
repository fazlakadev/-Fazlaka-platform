// src/components/Search/SearchFilters.tsx
'use client';

import { useState } from 'react';

interface FilterOptions {
  type: string;
  sortBy: string;
  dateRange: string;
}

interface LocalizedTexts {
  filters: string;
  contentType: string;
  all: string;
  article: string;
  episode: string;
  season: string;
  playlist: string;
  team: string;
  faq: string;
  privacy: string;
  terms: string;
  sortBy: string;
  relevance: string;
  date: string;
  title: string;
  dateRange: string;
  week: string;
  month: string;
  year: string;
}

interface SearchFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  language: string;
  texts: LocalizedTexts;
}

const typePills = [
  { value: 'all', icon: '⊙' },
  { value: 'article', icon: '📄' },
  { value: 'episode', icon: '🎬' },
  { value: 'season', icon: '📺' },
  { value: 'playlist', icon: '📋' },
  { value: 'team', icon: '👥' },
  { value: 'faq', icon: '❓' },
  { value: 'privacy', icon: '🔒' },
  { value: 'terms', icon: '📝' },
];

export default function SearchFilters({ 
  filters, 
  onFilterChange, 
  language, 
  texts 
}: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {texts.filters}
          </h3>
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* Content */}
      <div className={`transition-all duration-300 overflow-hidden ${expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 pt-0 space-y-5">
          {/* Content Type - Pills */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {texts.contentType}
            </h4>
            <div className="flex flex-wrap gap-2">
              {typePills.map(pill => (
                <button
                  key={pill.value}
                  onClick={() => onFilterChange({ ...filters, type: pill.value })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    filters.type === pill.value
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 scale-105'
                      : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  {pill.icon} {pill.value === 'all' ? texts.all : texts[pill.value as keyof LocalizedTexts] as string}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sort By */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {texts.sortBy}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'relevance', label: texts.relevance },
                { value: 'date', label: texts.date },
                { value: 'title', label: texts.title }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => onFilterChange({ ...filters, sortBy: option.value })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                    filters.sortBy === option.value
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-md'
                      : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Date Range */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {texts.dateRange}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: texts.all },
                { value: 'week', label: texts.week },
                { value: 'month', label: texts.month },
                { value: 'year', label: texts.year }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => onFilterChange({ ...filters, dateRange: option.value })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                    filters.dateRange === option.value
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                      : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Reset */}
          <button
            onClick={() => onFilterChange({ type: 'all', sortBy: 'relevance', dateRange: 'all' })}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-medium transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
          >
            {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
          </button>
        </div>
      </div>
    </div>
  );
}
