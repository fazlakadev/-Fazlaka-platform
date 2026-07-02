'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface AIAssistantSearchProps {
  query: string;
  language: string;
}

export default function AIAssistantSearch({ 
  query, 
  language 
}: AIAssistantSearchProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAskAI = () => {
    const chatUrl = `/chat?q=${encodeURIComponent(query)}`;
    router.push(chatUrl);
  };

  const texts = {
    ar: {
      title: 'لم تجد ما تبحث عنه؟',
      subtitle: 'اسأل مساعد فذلكة الذكي',
      description: 'يمكن للمساعد الذكي مساعدتك في العثور على ما تبحث عنه أو الإجابة على أسئلتك مباشرة',
      askButton: 'اسأل الذكاء الاصطناعي',
      examples: {
        title: 'أمثلة على الأسئلة:',
        questions: [
          'ما هي أحدث الحلول عن الذكاء الاصطناعي؟',
          'اشرح لي مفهوم البرمجة بلغة بسيطة',
          'ما هي أفضل المقالات للمبتدئين في تطوير الويب؟'
        ]
      }
    },
    en: {
      title: "Didn't find what you're looking for?",
      subtitle: 'Ask Fazlaka AI Assistant',
      description: 'The AI assistant can help you find what you are looking for or answer your questions directly',
      askButton: 'Ask AI Assistant',
      examples: {
        title: 'Example questions:',
        questions: [
          'What are latest episodes about artificial intelligence?',
          'Explain the concept of programming in simple terms',
          'What are the best articles for beginners in web development?'
        ]
      }
    }
  };

  const t = texts[language as keyof typeof texts];

  return (
    <div className="group relative my-8">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-all duration-500" />
      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/40 dark:border-gray-700/40">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-20 animate-pulse" />
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white dark:bg-gray-800 shadow-lg">
                <Image
                  src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
                  alt="Fazlaka AI Assistant"
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
              {t.title}
            </h3>
            <h4 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              {t.subtitle}
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              {t.description}
            </p>
            
            <button
              onClick={handleAskAI}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7s-8-3.134-8-7 3.582-7 8-7 8 3.134 8 7zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {t.askButton}
            </button>
            
            <div className="mt-5">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1.5 text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {isExpanded
                  ? (language === 'ar' ? 'إخفاء الأمثلة' : 'Hide examples')
                  : (language === 'ar' ? 'عرض الأمثلة' : 'Show examples')
                }
              </button>
              
              {isExpanded && (
                <div className="mt-3 p-4 bg-white/60 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {t.examples.title}
                  </h5>
                  <ul className="space-y-2">
                    {t.examples.questions.map((question, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mt-1.5 flex-shrink-0" />
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
