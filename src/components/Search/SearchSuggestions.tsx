// src/components/Search/SearchSuggestions.tsx
'use client';

interface SearchSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isRTL: boolean;
}

export default function SearchSuggestions({ 
  suggestions, 
  onSuggestionClick, 
  isRTL 
}: SearchSuggestionsProps) {
  return (
    <div className={`relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-xl shadow-indigo-500/5 border border-gray-100 dark:border-gray-700/50 z-20 overflow-hidden max-w-2xl mx-auto ${isRTL ? 'rtl' : ''}`}>
      <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700/30">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {isRTL ? 'اقتراحات' : 'Suggestions'}
        </p>
      </div>
      <ul className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
        {suggestions.map((suggestion, index) => (
          <li key={index}>
            <button
              className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all duration-150 flex items-center gap-3 group"
              onClick={() => onSuggestionClick(suggestion)}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {suggestion}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
