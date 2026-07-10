import { prisma } from '@/lib/prisma';
import { Article } from '@/types/article';

import { Episode, Season, Playlist } from '@prisma/client';

const CACHE_TTL = 30_000;
let knowledgeCache: { data: ChatbotKnowledge | null; timestamp: number } = { data: null, timestamp: 0 };

// تعريف واجهة لمحتوى PortableText (يستخدم محلياً)
export interface PortableTextBlock {
  _type: string;
  _key?: string;
  style?: string;
  markDefs?: Array<{
    _type: string;
    _key: string;
    [key: string]: unknown;
  }>;
  children: Array<{
    _type: string;
    text: string;
    marks?: string[];
  }>;
}

// تعريف الواجهات المحلية للكيانات التي تحتاج تعديلات أو تنسيق خاص
// تم تعديلها لتتوافق مع قيم null التي يرجعها Prisma

export interface ChatbotKnowledge {
  articles: Article[];
  episodes: Episode[];
  seasons: Season[];
  playlists: Playlist[];
  platformInfo: {
    name: string;
    description: string;
    mission: string;
    vision: string;
    foundedYear?: number;
    totalContent: number;
  };
}

export async function fetchChatbotKnowledge(_language: string = 'ar'): Promise<ChatbotKnowledge> {
  const now = Date.now();
  if (knowledgeCache.data && (now - knowledgeCache.timestamp) < CACHE_TTL) {
    return knowledgeCache.data;
  }
  try {
    const [articlesData, episodesData, seasonsData, playlistsData] = await Promise.all([
      prisma.article.findMany({ take: 20 }),
      prisma.episode.findMany({ take: 20 }),
      prisma.season.findMany({ take: 20 }),
      prisma.playlist.findMany({ take: 20 })
    ]);
    
    // لا نحتاج لإعادة تعريف الحقول، Prisma يقوم بذلك تلقائياً
    // فقط نقوم بـ Casting للأنواع المستوردة
    const articles = articlesData as Article[];
    const episodes = episodesData as Episode[];
    const seasons = seasonsData as Season[];
    const playlists = playlistsData as Playlist[];
    
    const totalContent = articles.length + episodes.length + seasons.length + playlists.length;
    
    const result = {
      articles,
      episodes,
      seasons,
      playlists,
      platformInfo: {
        name: "فذلكه",
        description: "منصة عربية متخصصة في نشر المعرفة والثقافة من خلال محتوى متنوع ومميز",
        mission: "نشر المعرفة وبناء وعي جمعي من خلال محتوى عالي الجودة يثري الفكر العربي",
        vision: "أن نكون المنصة الرائدة في نشر المعرفة والثقافة في العالم العربي",
        foundedYear: 2024,
        totalContent
      }
    };
    knowledgeCache = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error('Error fetching chatbot knowledge:', error);
    return {
      articles: [],
      episodes: [],
      seasons: [],
      playlists: [],
      platformInfo: {
        name: "فذلكه",
        description: "منصة عربية متخصصة",
        mission: "نشر المعرفة",
        vision: "الريادة في نشر المعرفة",
        totalContent: 0
      }
    };
  }
}

// تعريف نوع موحد لنتائج البحث
type SearchResultItem = Article | Episode | Season | Playlist;

export async function searchContent(query: string, type?: string, language: string = 'ar'): Promise<SearchResultItem[]> {
  try {
    const knowledgeBase = await fetchChatbotKnowledge(language);
    let results: SearchResultItem[] = [];
    
    if (!type || type === 'article') {
      results = results.concat(
        knowledgeBase.articles.filter(article => 
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          (article.excerpt && article.excerpt.toLowerCase().includes(query.toLowerCase()))
        )
      );
    }
    
    if (!type || type === 'episode') {
      results = results.concat(
        knowledgeBase.episodes.filter(episode => 
          episode.title.toLowerCase().includes(query.toLowerCase()) ||
          (episode.description && episode.description.toLowerCase().includes(query.toLowerCase()))
        )
      );
    }
    
    if (!type || type === 'season') {
      results = results.concat(
        knowledgeBase.seasons.filter(season => 
          season.title.toLowerCase().includes(query.toLowerCase()) ||
          (season.description && season.description.toLowerCase().includes(query.toLowerCase()))
        )
      );
    }
    
    if (!type || type === 'playlist') {
      results = results.concat(
        knowledgeBase.playlists.filter(playlist => 
          playlist.title.toLowerCase().includes(query.toLowerCase()) ||
          (playlist.description && playlist.description.toLowerCase().includes(query.toLowerCase()))
        )
      );
    }
    
    return results;
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
}