"use client";

import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { useSession } from 'next-auth/react';
import FavoriteButton from '@/components/Favorites/FavoriteButton';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import MarqueeSection from '@/components/home/MarqueeSection';
import FeaturedSection from '@/components/home/FeaturedSection';
import TopicsMap, { type TopicItem } from '@/components/home/TopicsMap';

// --- Interfaces ---
interface Episode { id: string; slug: string; localizedTitle?: string; localizedThumbnailUrl?: string; publishedAt?: string | Date | null; }
interface Article { id: string; slug: string; localizedTitle?: string; localizedExcerpt?: string; localizedFeaturedImageUrl?: string; publishedAt?: string | Date | null; }

// --- Translations ---
const translations = {
  ar: {
    platformName: "فذلكة",
    slogan: "نُبسّط المعرفة.. لنصنع عقولاً واعية.",
    subSlogan: "منصة علمية عربية تقدم المحتوى العميق بأسلوب مبسط وجذاب.",
    explore: "استكشف المحتوى",
    learnMore: "اعرف المزيد",
    latestEpisodes: "أحدث الحلقات",
    latestArticles: "أحدث المقالات",
    viewAll: "عرض الكل",
    whyUs: "لماذا فذلكة؟",
    why_simplified: "تبسيط عميق",
    why_simplified_desc: "نحول المفاهيم المعقدة إلى أفكار سهلة وممتعة.",
    why_quality: "محتوى موثوق",
    why_quality_desc: "مصادر علمية دقيقة ومراجع واضحة لكل معلومة.",
    why_community: "مجتمع واعي",
    why_community_desc: "نقاشات هادفة وبيئة تعليمية محفزة.",
    // إحصائيات
    stats_episodes: "حلقة",
    stats_articles: "مقال",
    stats_members: "عضو",
    stats_views: "مشاهدة",
    // Marquee
    marquee: [
      { text: "علوم", icon: "🔬" },
      { text: "تكنولوجيا", icon: "💡" },
      { text: "فكر", icon: "🧠" },
      { text: "تاريخ", icon: "📜" },
      { text: "فلسفة", icon: "⚖️" },
      { text: "مجتمع", icon: "🌍" },
      { text: "فضاء", icon: "🚀" },
      { text: "طبيعة", icon: "🌿" },
    ],
    // خريطة المواضيع
    topics_title: "اكتشف عوالماً جديدة",
    topics_subtitle: "انتقل بين مجالات المعرفة المختلفة وابدأ رحلتك في أي ميدان يثير فضولك.",
    topics: [
      { title: "العلوم", desc: "من الكم إلى الكون، أبسط أعقد الظواهر.", icon: "🔬", href: "/search?q=علوم", gradient: "from-cyan-500 to-blue-600" },
      { title: "التكنولوجيا", desc: "الذكاء الاصطناعي، البرمجة ومستقبل التقنية.", icon: "💡", href: "/search?q=تكنولوجيا", gradient: "from-indigo-500 to-violet-600" },
      { title: "الفكر والفلسفة", desc: "أسئلة وجودية ونقاشات تثري العقل.", icon: "🧠", href: "/search?q=فلسفة", gradient: "from-purple-500 to-fuchsia-600" },
      { title: "التاريخ", desc: "محطات وحضارات شكّلت عالمنا اليوم.", icon: "📜", href: "/search?q=تاريخ", gradient: "from-amber-500 to-orange-600" },
      { title: "الفضاء", desc: "كواكب، نجوم وأسرار الكون البعيد.", icon: "🚀", href: "/search?q=فضاء", gradient: "from-sky-500 to-cyan-600" },
      { title: "المجتمع", desc: "قضايا إنسانية وعلاقات تشكّل حياتنا.", icon: "🌍", href: "/search?q=مجتمع", gradient: "from-emerald-500 to-teal-600" },
    ] as TopicItem[],
    // Featured
    featured_title: "الأكثر مشاهدة",
    featured_subtitle: "حلقة أثارت اهتمام جمهورنا",
    featured_desc: "ابدأ بأكثر المحتوى تأثيراً على المنصة.",
    play: "شاهد الآن",
    views: "مشاهدة",
    testimonials_title: "ماذا يقول جمهورنا؟",
    testimonials: [
      { name: "أحمد المصري", role: "طالب طب", text: "فذلكة غيّرت طريقة فهمي للعلم. محتوى عميق بس مبسّط جداً، صار جزء من يومي." },
      { name: "سارة عبد الله", role: "مهندسة برمجيات", text: "أفضل منصة عربية للمحتوى العلمي الجاد. الجودة والتنظيم مذهلان فعلاً." },
      { name: "خالد العتيبي", role: "أستاذ فيزياء", text: "أرشح حلقات فذلكة لطلابي دائماً. تشرح المفاهيم الصعبة بأسلوب آسر." },
    ],
    // النشرة
    newsletter_title: "ابقَ على اطلاع",
    newsletter_desc: "اشترك في نشرتنا البريدية ليصلك كل جديد فوراً.",
    newsletter_placeholder: "بريدك الإلكتروني",
    newsletter_btn: "اشترك",
    footer_rights: "جميع الحقوق محفوظة",
  },
  en: {
    platformName: "Fazlaka",
    slogan: "Simplifying Knowledge.. Creating Conscious Minds.",
    subSlogan: "An Arabic scientific platform delivering deep content in a simplified and engaging way.",
    explore: "Explore Content",
    learnMore: "Learn More",
    latestEpisodes: "Latest Episodes",
    latestArticles: "Latest Articles",
    viewAll: "View All",
    whyUs: "Why Fazlaka?",
    why_simplified: "Deep Simplification",
    why_simplified_desc: "Turning complex concepts into easy, enjoyable ideas.",
    why_quality: "Reliable Content",
    why_quality_desc: "Accurate scientific sources and clear references.",
    why_community: "Conscious Community",
    why_community_desc: "Meaningful discussions and a stimulating environment.",
    stats_episodes: "Episodes",
    stats_articles: "Articles",
    stats_members: "Members",
    stats_views: "Views",
    marquee: [
      { text: "Science", icon: "🔬" },
      { text: "Tech", icon: "💡" },
      { text: "Ideas", icon: "🧠" },
      { text: "History", icon: "📜" },
      { text: "Philosophy", icon: "⚖️" },
      { text: "Society", icon: "🌍" },
      { text: "Space", icon: "🚀" },
      { text: "Nature", icon: "🌿" },
    ],
    topics_title: "Discover New Worlds",
    topics_subtitle: "Navigate across different fields of knowledge and start your journey in any area that sparks your curiosity.",
    topics: [
      { title: "Science", desc: "From quantum to cosmos, simplifying the complex.", icon: "🔬", href: "/search?q=science", gradient: "from-cyan-500 to-blue-600" },
      { title: "Technology", desc: "AI, programming and the future of tech.", icon: "💡", href: "/search?q=technology", gradient: "from-indigo-500 to-violet-600" },
      { title: "Thought & Philosophy", desc: "Existential questions and mind-enriching debates.", icon: "🧠", href: "/search?q=philosophy", gradient: "from-purple-500 to-fuchsia-600" },
      { title: "History", desc: "Milestones and civilizations that shaped our world.", icon: "📜", href: "/search?q=history", gradient: "from-amber-500 to-orange-600" },
      { title: "Space", desc: "Planets, stars and the secrets of the universe.", icon: "🚀", href: "/search?q=space", gradient: "from-sky-500 to-cyan-600" },
      { title: "Society", desc: "Human issues and relationships that shape our lives.", icon: "🌍", href: "/search?q=society", gradient: "from-emerald-500 to-teal-600" },
    ] as TopicItem[],
    featured_title: "Most Watched",
    featured_subtitle: "An episode that captured our audience",
    featured_desc: "Start with the most impactful content on the platform.",
    play: "Watch Now",
    views: "views",
    testimonials_title: "What Our Audience Says",
    testimonials: [
      { name: "Ahmed M.", role: "Medical Student", text: "Fazlaka changed how I understand science. Deep content but so simplified — it's part of my daily routine." },
      { name: "Sarah A.", role: "Software Engineer", text: "The best Arabic platform for serious scientific content. The quality and organization are truly amazing." },
      { name: "Khaled O.", role: "Physics Teacher", text: "I always recommend Fazlaka episodes to my students. They explain hard concepts in a captivating way." },
    ],
    newsletter_title: "Stay Updated",
    newsletter_desc: "Subscribe to our newsletter to receive updates instantly.",
    newsletter_placeholder: "Your email",
    newsletter_btn: "Subscribe",
    footer_rights: "All rights reserved",
  }
} as const;

const getT = (lang: string) => translations[lang as keyof typeof translations] || translations.ar;

const formatContentDate = (date?: string | Date | null, language = 'ar') => {
  if (!date) return '';
  return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// --- Icons ---
const SimplifyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
);
const QualityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
);
const CommunityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);

// --- Skeleton ---
const Skeleton = ({ className }: { className: string }) => (
  <div className={`bg-slate-800/50 rounded-lg animate-pulse ${className}`} />
);

// --- مؤشر التقدم عند التمرير ---
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 origin-left z-[100]"
    />
  );
};

// --- زر العودة للأعلى ---
const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (v) => setVisible(v > 400));
    return () => unsubscribe();
  }, [scrollY]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <motion.button
      initial={false}
      animate={visible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-2xl shadow-indigo-500/30 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </motion.button>
  );
};

// --- غلاف الأنيميشن عند الظهور (فريمير موشن) ---
const AnimatedSection = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.section
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
    className={className}
  >
    {children}
  </motion.section>
);

const WhyUsSection = () => {
  const { language } = useLanguage();
  const t = getT(language);

  const features = [
    { key: 'why_simplified', Icon: SimplifyIcon, color: 'text-cyan-400', bgGradient: 'from-cyan-500/10 to-transparent', glow: 'from-cyan-500/20' },
    { key: 'why_quality', Icon: QualityIcon, color: 'text-indigo-400', bgGradient: 'from-indigo-500/10 to-transparent', glow: 'from-indigo-500/20' },
    { key: 'why_community', Icon: CommunityIcon, color: 'text-purple-400', bgGradient: 'from-purple-500/10 to-transparent', glow: 'from-purple-500/20' },
  ];

  return (
    <AnimatedSection className="py-24 bg-[#030712] relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t.whyUs}</h2>
          <div className="w-20 h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 mx-auto rounded-full animate-gradient-shift" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className={`group relative p-8 rounded-3xl border border-white/5 backdrop-blur-sm transition-all duration-500 hover:-translate-y-3 hover:border-white/15 overflow-hidden bg-white/[0.02] ${i === 1 ? 'animate-float' : ''}`}
            >
              <div className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-tr ${f.glow} to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-white/5 to-transparent" />

              <div className="relative z-10">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${f.bgGradient} ${f.color} mb-6`}>
                  <f.Icon />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{t[f.key as keyof typeof t] as string}</h3>
                <p className="text-slate-400 leading-relaxed">{t[`${f.key}_desc` as keyof typeof t] as string}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

const LatestEpisodes = () => {
  const { language } = useLanguage();
  const t = getT(language);
  const [eps, setEps] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/episodes?language=${language}`)
      .then(res => res.json())
      .then(data => { setEps(data.episodes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [language]);

  return (
    <AnimatedSection className="py-24 bg-[#030712] relative">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">{t.latestEpisodes}</h2>
            <div className="w-16 h-1 bg-cyan-500 rounded-full" />
          </div>
          <Link href="/episodes" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center gap-2 group">
            {t.viewAll}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-video mb-4" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ))
          ) : (
            eps.slice(0, 4).map((ep, i) => (
              <motion.article
                key={ep.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-cyan-500/35 hover:bg-white/[0.06]"
              >
                <Link href={`/episodes/${ep.slug}`} className="block">
                  <div className="relative aspect-video overflow-hidden bg-slate-800">
                    {ep.localizedThumbnailUrl && (
                      <Image src={ep.localizedThumbnailUrl} alt={ep.localizedTitle || ''} fill className="object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" sizes="(max-width: 768px) 100vw, 25vw" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-black/10 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition-transform border border-white/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white ms-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-lg group-hover:text-cyan-400 transition-colors line-clamp-2">{ep.localizedTitle}</h3>
                  </div>
                </Link>
                <div className="px-4 pb-4 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span>{formatContentDate(ep.publishedAt, language)}</span>
                  <FavoriteButton contentId={ep.id} contentType="episode" />
                </div>
              </motion.article>
            ))
          )}
        </div>
      </div>
    </AnimatedSection>
  );
};

const LatestArticles = () => {
  const { language } = useLanguage();
  const t = getT(language);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles?language=${language}`)
      .then(res => res.json())
      .then(data => { setArticles(data.articles || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [language]);

  return (
    <AnimatedSection className="py-24 bg-[#030712]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">{t.latestArticles}</h2>
            <div className="w-16 h-1 bg-indigo-500 rounded-full" />
          </div>
          <Link href="/articles" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-2 group">
            {t.viewAll}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden border border-white/5">
                <Skeleton className="h-56 w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ))
          ) : (
            articles.slice(0, 3).map((article, i) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group relative rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/35 transition-all duration-500 hover:-translate-y-2 bg-white/[0.03]"
              >
                <Link href={`/articles/${article.slug}`} className="block">
                  <div className="relative h-56 bg-slate-800 overflow-hidden">
                    {article.localizedFeaturedImageUrl && (
                      <Image src={article.localizedFeaturedImageUrl} alt={article.localizedTitle || ''} fill className="object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />
                  </div>
                  <div className="p-6 pb-3 relative">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">{article.localizedTitle}</h3>
                  </div>
                </Link>
                <div className="px-6 pb-5 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span>{formatContentDate(article.publishedAt, language)}</span>
                  <FavoriteButton contentId={article.id} contentType="article" />
                </div>
              </motion.article>
            ))
          )}
        </div>
      </div>
    </AnimatedSection>
  );
};

const MostViewed = () => {
  const { language } = useLanguage();
  interface PopularItem { contentId: string; contentType: string; slug?: string; title?: string; titleEn?: string | null; _sum?: { count: number }; item?: { thumbnailUrl?: string } | null }
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await fetch('/api/content/popular?type=EPISODE&limit=4');
        const data = await res.json();
        if (data.success) setPopularItems(data.data);
      } catch { /* تجاهل */ }
      setLoading(false);
    };
    fetchPopular();
  }, [language]);

  if (!loading && popularItems.length === 0) return null;

  return (
    <AnimatedSection className="py-24 bg-[#030712]">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {language === 'ar' ? 'الأكثر مشاهدة' : 'Most Viewed'}
          </h2>
          <p className="text-gray-400 mt-3 text-lg">
            {language === 'ar' ? 'أكثر الحلقات مشاهدة على المنصة' : 'Most watched episodes on the platform'}
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-video mb-3" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularItems.map((item: PopularItem, i: number) => (
              <motion.div
                key={item.contentId}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link
                  href={`/episodes/${item.slug}`}
                  className="group relative block rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-800">
                    {item.item?.thumbnailUrl ? (
                      <Image
                        src={item.item.thumbnailUrl}
                        alt={item.title || ''}
                        fill
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-cyan-900/40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                    <div className="absolute top-2 end-2 bg-indigo-500/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                      {item._sum?.count || 0} {language === 'ar' ? 'مشاهدة' : 'views'}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold line-clamp-2 group-hover:text-indigo-400 transition-colors">
                      {language === 'ar' ? item.title : item.titleEn || item.title}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AnimatedSection>
  );
};

const NewsletterSection = () => {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const t = getT(language);
  const [email, setEmail] = useState('');
  const [nlStatus, setNlStatus] = useState<'idle' | 'loading' | 'success' | 'existing' | 'error'>('idle');
  const [nlMsg, setNlMsg] = useState('');
  const [nlSubscribed, setNlSubscribed] = useState<boolean | null>(null);
  const [nlUnsubscribing, setNlUnsubscribing] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/newsletter/preferences?email=${encodeURIComponent(session.user.email)}`)
      .then(res => res.json())
      .then(json => setNlSubscribed(json.data?.status === 'ACTIVE'))
      .catch(() => setNlSubscribed(false));
  }, [session?.user?.email]);

  const handleNLSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNlStatus('error');
      setNlMsg(language === 'ar' ? 'بريد إلكتروني غير صحيح' : 'Invalid email');
      return;
    }
    setNlStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, language }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.message === 'AlreadySubscribed') {
          setNlSubscribed(true);
          setNlStatus('existing');
          setNlMsg(language === 'ar' ? 'أنت مشترك بالفعل!' : 'Already subscribed!');
        } else {
          setNlSubscribed(true);
          setNlStatus('success');
          setNlMsg(language === 'ar' ? 'تم الاشتراك! تحقق من بريدك' : 'Subscribed! Check your email');
          setEmail('');
        }
      } else {
        setNlStatus('error');
        setNlMsg(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
      }
    } catch {
      setNlStatus('error');
      setNlMsg(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
    }
  };

  const handleNLUnsubscribe = async () => {
    if (!session?.user?.email) return;
    setNlUnsubscribing(true);
    try {
      await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      });
      setNlSubscribed(false);
      setNlMsg(language === 'ar' ? 'تم إلغاء الاشتراك' : 'Unsubscribed');
      setNlStatus('success');
    } catch { /* تجاهل */ }
    setNlUnsubscribing(false);
  };

  return (
    <AnimatedSection className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-cyan-600 to-cyan-500 animate-gradient-shift" />
      <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)", backgroundSize: '40px 40px' }} />

      <div className="absolute top-0 end-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 rtl:translate-x-[-50%] blur-3xl" />
      <div className="absolute bottom-0 start-0 w-80 h-80 bg-indigo-900/50 rounded-full translate-y-1/2 rtl:translate-x-1/2 blur-3xl" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
        {nlSubscribed === true ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
              {language === 'ar' ? 'أنت مشترك!' : "You're subscribed!"}
            </h2>
            <p className="text-white/80 max-w-lg mx-auto text-lg">
              {language === 'ar' ? 'أنت مشترك في نشرتنا البريدية' : 'You are subscribed to our newsletter'}
            </p>
            <button onClick={handleNLUnsubscribe} disabled={nlUnsubscribing} className="mt-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-all border border-white/20 disabled:opacity-50">
              {nlUnsubscribing ? '...' : (language === 'ar' ? 'إلغاء الاشتراك' : 'Unsubscribe')}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">{t.newsletter_title}</h2>
            <p className="text-white/90 mb-10 max-w-lg mx-auto text-lg">{t.newsletter_desc}</p>

            <form onSubmit={handleNLSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setNlStatus('idle'); }}
                placeholder={t.newsletter_placeholder}
                className="flex-1 px-6 py-4 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/60 backdrop-blur-md text-lg shadow-lg"
              />
              <button type="submit" disabled={nlStatus === 'loading'} className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 disabled:opacity-70">
                {nlStatus === 'loading' ? (language === 'ar' ? 'جاري...' : 'Sending...') : t.newsletter_btn}
              </button>
            </form>

            {nlStatus !== 'idle' && nlStatus !== 'loading' && (
              <p className={`mt-4 text-sm ${nlStatus === 'success' || nlStatus === 'existing' ? 'text-green-200' : 'text-red-200'}`}>{nlMsg}</p>
            )}
          </>
        )}
      </div>
    </AnimatedSection>
  );
};

const Footer = () => {
  const { language } = useLanguage();
  const t = getT(language);
  return (
    <footer className="py-8 border-t border-white/5 bg-[#030712]">
      <div className="container mx-auto px-4 lg:px-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} {t.platformName}. {t.footer_rights}.</p>
      </div>
    </footer>
  );
};

// --- Main Page ---
export default function Home() {
  const { isRTL, language } = useLanguage();
  const t = getT(language);

  return (
    <div className={`min-h-screen bg-[#030712] text-white antialiased selection:bg-cyan-500/30 selection:text-cyan-200 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ===== مؤشر التقدم عند التمرير ===== */}
      <ScrollProgress />

      {/* ===== زر العودة للأعلى ===== */}
      <ScrollToTop />

      {/* ===== الهيرو السينمائي ===== */}
      <HeroSection texts={{
        platformName: t.platformName,
        slogan: t.slogan,
        subSlogan: t.subSlogan,
        explore: t.explore,
        learnMore: t.learnMore,
      }} />

      {/* ===== شريط المواضيع المتحرك ===== */}
      <MarqueeSection items={[...t.marquee]} />

      {/* ===== لماذا فذلكة ===== */}
      <WhyUsSection />

      {/* ===== أحدث الحلقات ===== */}
      <LatestEpisodes />

      {/* ===== عدّاد الإحصائيات ===== */}
      <StatsSection texts={{
        episodes: t.stats_episodes,
        articles: t.stats_articles,
        members: t.stats_members,
        views: t.stats_views,
      }} />

      {/* ===== حلقة مميّزة + آراء ===== */}
      <FeaturedSection
        texts={{
          featuredTitle: t.featured_title,
          featuredSubtitle: t.featured_subtitle,
          play: t.play,
          views: t.views,
          testimonialsTitle: t.testimonials_title,
        }}
        testimonials={[...t.testimonials]}
      />

      {/* ===== خريطة المواضيع التفاعلية ===== */}
      <TopicsMap
        texts={{ title: t.topics_title, subtitle: t.topics_subtitle }}
        topics={[...t.topics]}
      />

      {/* ===== أحدث المقالات ===== */}
      <LatestArticles />

      {/* ===== الأكثر مشاهدة ===== */}
      <MostViewed />

      {/* ===== النشرة البريدية ===== */}
      <NewsletterSection />

      <Footer />

      <style jsx global>{`
        html { scroll-behavior: smooth; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #030712; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #06b6d4, #6366f1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #22d3ee, #818cf8); }

        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.2); }
          50% { box-shadow: 0 0 40px rgba(6, 182, 212, 0.4); }
        }
        .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift { background-size: 200% 200%; animation: gradient-shift 8s ease infinite; }

        ::selection { background: rgba(6, 182, 212, 0.3); color: #a5f3fc; }
      `}</style>
    </div>
  );
}
