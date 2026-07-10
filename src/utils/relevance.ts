import { fetchChatbotKnowledge } from '@/services/chatbotData';
import { Article } from '@/types/article';
import { Episode } from '@prisma/client';
import { performSemanticSearch, SemanticSearchResult } from '@/services/semanticSearch';

// تعريف واجهة أساسية لعناصر المحتوى - تم تحديثها لتقبل null
interface BaseContentItem {
  _id?: string;
  title?: string | null; // أضفنا null
  name?: string | null;  // أضفنا null
  publishedAt?: Date | string | null; // أضفنا null
  createdAt?: Date | string | null;   // أضفنا null
}

// تعريف نوع لبيانات النتائج ذات الصلة
type RelevantResultData = 
  | BaseContentItem 
  | BaseContentItem[] 
  | SemanticSearchResult['data'];

// تعريف واجهة موسعة لـ ChatbotKnowledge لدعم الخصائص المحتملة
interface ExtendedChatbotKnowledge {
  episodes?: Episode[];
  articles?: Article[];
  seasons?: BaseContentItem[];
  playlists?: BaseContentItem[];
}

const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().replace(/[^\u0600-\u06FF\s]/g, '');
};

export async function findRelevantInfo(userMessage: string, language: string = 'ar') {
  console.log("🔍 Starting a comprehensive, multi-intent search...");

  try {
    const knowledgeBase = await fetchChatbotKnowledge(language) as ExtendedChatbotKnowledge;
    const normalizedUserMessage = normalizeText(userMessage);
    console.log("🔑 Normalized User Message:", normalizedUserMessage);

    const relevantResults: { type: string; data: RelevantResultData; query: string; relevance: string }[] = [];

    // --- البحث عن الحلقات (الأحدث أو الكل) ---
    if (normalizedUserMessage.includes('حلقه') || normalizedUserMessage.includes('حلقات')) {
      if (normalizedUserMessage.includes('احدث') || normalizedUserMessage.includes('اخير') || normalizedUserMessage.includes('جديد')) {
        console.log("🎯 Detected a 'latest/newest episode' question.");
        if (knowledgeBase.episodes && knowledgeBase.episodes.length > 0) {
          const sortedEpisodes = knowledgeBase.episodes.sort((a: Episode, b: Episode) => {
            const dateA = new Date(a.publishedAt || a.createdAt || 0);
            const dateB = new Date(b.publishedAt || b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          relevantResults.push({ 
            type: 'latest_episode', 
            data: sortedEpisodes[0], 
            query: 'ما هي أحدث حلقة؟',
            relevance: 'صلة مباشرة'
          });
        }
      } else {
        console.log("🎯 Detected an 'all episodes' question.");
        if (knowledgeBase.episodes && knowledgeBase.episodes.length > 0) {
          relevantResults.push({ 
            type: 'episode_list', 
            data: knowledgeBase.episodes, 
            query: 'ما هي الحلقات المتاحة؟',
            relevance: 'صلة مباشرة'
          });
        }
      }
    }

    // --- البحث عن المقالات (الأحدث أو الكل) ---
    if (normalizedUserMessage.includes('مقال') || normalizedUserMessage.includes('مقالات')) {
      if (normalizedUserMessage.includes('احدث') || normalizedUserMessage.includes('اخير') || normalizedUserMessage.includes('جديد')) {
        console.log("🎯 Detected a 'latest/newest article' question.");
        if (knowledgeBase.articles && knowledgeBase.articles.length > 0) {
          const sortedArticles = knowledgeBase.articles.sort((a: Article, b: Article) => {
            const dateA = new Date(a.publishedAt || a.createdAt || 0);
            const dateB = new Date(b.publishedAt || b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          relevantResults.push({ 
            type: 'latest_article', 
            data: sortedArticles[0], 
            query: 'ما هو أحدث مقال؟',
            relevance: 'صلة مباشرة'
          });
        }
      } else {
        console.log("🎯 Detected an 'all articles' question.");
        if (knowledgeBase.articles && knowledgeBase.articles.length > 0) {
          relevantResults.push({ 
            type: 'article_list', 
            data: knowledgeBase.articles, 
            query: 'ما هي المقالات المتاحة؟',
            relevance: 'صلة مباشرة'
          });
        }
      }
    }
    
    // --- البحث عن المواسم (الأحدث أو الكل) ---
    if (normalizedUserMessage.includes('موسم') || normalizedUserMessage.includes('مواسم')) {
      if (normalizedUserMessage.includes('احدث') || normalizedUserMessage.includes('اخير') || normalizedUserMessage.includes('جديد')) {
        console.log("🎯 Detected a 'latest/newest season' question.");
        if (knowledgeBase.seasons && knowledgeBase.seasons.length > 0) {
          const sortedSeasons = knowledgeBase.seasons.sort((a: BaseContentItem, b: BaseContentItem) => {
            const dateA = new Date(a.publishedAt || a.createdAt || 0);
            const dateB = new Date(b.publishedAt || b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          relevantResults.push({ 
            type: 'latest_season', 
            data: sortedSeasons[0], 
            query: 'ما هو أحدث موسم؟',
            relevance: 'صلة مباشرة'
          });
        }
      } else {
        console.log("🎯 Detected an 'all seasons' question.");
        if (knowledgeBase.seasons && knowledgeBase.seasons.length > 0) {
          relevantResults.push({ 
            type: 'season_list', 
            data: knowledgeBase.seasons, 
            query: 'ما هي المواسم المتاحة؟',
            relevance: 'صلة مباشرة'
          });
        }
      }
    }

    // --- البحث عن قوائم التشغيل (الأحدث أو الكل) ---
    if (normalizedUserMessage.includes('قائم') && normalizedUserMessage.includes('تشغيل')) {
      console.log("🎯 Detected a playlist-related question.");
      if (normalizedUserMessage.includes('احدث') || normalizedUserMessage.includes('اخير') || normalizedUserMessage.includes('جديد')) {
        console.log("🎯 Detected a 'latest/newest playlist' question.");
        if (knowledgeBase.playlists && knowledgeBase.playlists.length > 0) {
          const sortedPlaylists = knowledgeBase.playlists.sort((a: BaseContentItem, b: BaseContentItem) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          relevantResults.push({ 
            type: 'latest_playlist', 
            data: sortedPlaylists[0], 
            query: 'ما هي أحدث قائمة تشغيل؟',
            relevance: 'صلة مباشرة'
          });
        }
      } else {
        console.log("🎯 Detected an 'all playlists' question.");
        if (knowledgeBase.playlists && knowledgeBase.playlists.length > 0) {
          relevantResults.push({ 
            type: 'playlist_list', 
            data: knowledgeBase.playlists, 
            query: 'ما هي قوائم التشغيل المتاحة؟',
            relevance: 'صلة مباشرة'
          });
        }
      }
    }

    // --- بحث عام في المقالات والحلقات إذا لم يتم العثور على نية محددة ---
    if (relevantResults.length === 0) {
      console.log("🔎 Performing a general search in articles and episodes...");
      
      // البحث عن تطابق مباشر في العناوين
      knowledgeBase.articles?.forEach((article: Article) => {
        if (normalizeText(article.title).includes(normalizedUserMessage)) {
          relevantResults.push({ 
            type: 'article', 
            data: article, 
            query: userMessage,
            relevance: 'صلة قوية'
          });
        }
      });
      
      knowledgeBase.episodes?.forEach((episode: Episode) => {
        if (normalizeText(episode.title).includes(normalizedUserMessage)) {
          relevantResults.push({ 
            type: 'episode', 
            data: episode, 
            query: userMessage,
            relevance: 'صلة قوية'
          });
        }
      });
      
      // إذا لم يتم العثور على تطابق مباشر، استخدم البحث الدلالي
      if (relevantResults.length === 0) {
        console.log("🧠 No direct matches found, using semantic search...");
        try {
          const semanticResults = await performSemanticSearch(userMessage, language);
          
          semanticResults.forEach(result => {
            relevantResults.push({
              type: result.type,
              data: result.data,
              query: userMessage,
              relevance: result.relevance
            });
          });
        } catch (error) {
          console.error("Error in semantic search:", error);
        }
      }
    }

    console.log("✅ Found comprehensive relevant info:", relevantResults);
    return relevantResults;

  } catch (error) {
    console.error("❌ CRITICAL ERROR in findRelevantInfo:", error);
    return [];
  }
}