"use client";

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { motion, useInView, useMotionValue, animate } from 'framer-motion';
import { useLanguage } from '@/components/Language/LanguageProvider';

export interface StatsTexts {
  episodes: string;
  articles: string;
  members: string;
  views: string;
}

interface StatsData {
  episodes: number;
  articles: number;
  members: number;
  totalViews: number;
}

// عدّاد يتزايد عند الظهور
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const count = useMotionValue(0);
  const [rounded, setRounded] = useState(0);

  useEffect(() => {
    const unsub = count.on('change', v => setRounded(Math.floor(v)));
    return () => unsub();
  }, [count]);

  useEffect(() => {
    if (inView && to > 0) {
      const controls = animate(count, to, { duration: 2, ease: 'easeOut' });
      return controls.stop;
    }
  }, [inView, to, count]);

  const display = rounded >= 1000 ? (rounded / 1000).toFixed(rounded >= 10000 ? 0 : 1) : String(rounded);
  const isK = rounded >= 1000;

  return (
    <span ref={ref} className="tabular-nums">
      {display}{isK ? 'K' : ''}{suffix}
    </span>
  );
}

const IconEpisode = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const IconArticle = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const IconMembers = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-3-3" />
  </svg>
);
const IconViews = () => (
  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function StatsSection({ texts }: { texts: StatsTexts }) {
  const { isRTL } = useLanguage();
  const [data, setData] = useState<StatsData>({ episodes: 0, articles: 0, members: 0, totalViews: 0 });

  useEffect(() => {
    fetch('/api/stats/public')
      .then(res => res.json())
      .then(json => { if (json.success) setData(json.data); })
      .catch(() => {});
  }, []);

  const items: { key: keyof StatsData; label: string; Icon: () => ReactElement; color: string }[] = [
    { key: 'episodes', label: texts.episodes, Icon: IconEpisode, color: 'from-cyan-400 to-sky-500' },
    { key: 'articles', label: texts.articles, Icon: IconArticle, color: 'from-indigo-400 to-blue-500' },
    { key: 'members', label: texts.members, Icon: IconMembers, color: 'from-purple-400 to-fuchsia-500' },
    { key: 'totalViews', label: texts.views, Icon: IconViews, color: 'from-amber-400 to-orange-500' },
  ];

  return (
    <section className="relative py-24 bg-[#030712] overflow-hidden">
      {/* توهّج خلفي خفيف */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative p-6 lg:p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-white/20 transition-all duration-500 hover:-translate-y-2"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* توهّج عند المرور */}
              <div className={`absolute -inset-px rounded-3xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className={`inline-flex p-3.5 rounded-2xl bg-gradient-to-br ${item.color} text-white mb-5 shadow-lg`}>
                  <item.Icon />
                </div>
                <div className={`text-4xl lg:text-5xl font-extrabold bg-gradient-to-r ${item.color} bg-clip-text text-transparent leading-none mb-2`}>
                  <Counter to={data[item.key]} suffix="+" />
                </div>
                <div className="text-sm lg:text-base text-slate-400 font-medium">{item.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
