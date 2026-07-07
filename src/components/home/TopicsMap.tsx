"use client";

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/Language/LanguageProvider';

export interface TopicItem {
  title: string;
  desc: string;
  icon: string;
  href: string;
  gradient: string;
}

export interface TopicsTexts {
  title: string;
  subtitle: string;
}

// بطاقة بتأثير 3D tilt يتبع الماوس
function TopicCard({ topic, index }: { topic: TopicItem; index: number }) {
  const { isRTL } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(10px)`;
  };
  const handleLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0)';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link href={topic.href} className="block group" dir={isRTL ? 'rtl' : 'ltr'}>
        <div
          ref={ref}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          style={{ transition: 'transform 0.25s ease-out', transformStyle: 'preserve-3d' }}
          className={`relative h-full p-7 rounded-3xl border border-white/10 bg-gradient-to-br ${topic.gradient} bg-opacity-10 overflow-hidden cursor-pointer`}
        >
          {/* خلفية معتمة فوق التدرّج */}
          <div className="absolute inset-0 bg-[#0a0f1e]/80 backdrop-blur-sm" />

          {/* توهّج عند المرور */}
          <div className={`absolute -inset-1 bg-gradient-to-br ${topic.gradient} opacity-0 group-hover:opacity-25 blur-2xl transition-opacity duration-500`} />

          {/* رمز كبير شفّاف في الخلفية */}
          <div className="absolute -bottom-4 -end-4 text-8xl opacity-[0.07] leading-none select-none">{topic.icon}</div>

          <div className="relative z-10">
            <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${topic.gradient} text-white text-2xl shadow-lg mb-5`}>
              {topic.icon}
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-white mb-2 group-hover:text-white transition-colors">
              {topic.title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">{topic.desc}</p>

            {/* سهم ظاهر عند المرور */}
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 opacity-0 group-hover:opacity-100 group-hover:gap-2.5 transition-all">
              {isRTL ? 'تصفّح' : 'Explore'}
              <span className="rtl:rotate-180">→</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function TopicsMap({ texts, topics }: { texts: TopicsTexts; topics: TopicItem[] }) {
  return (
    <section className="relative py-24 lg:py-28 bg-[#030712] overflow-hidden">
      {/* خلفية متدرّجة */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-indigo-500/8 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{texts.title}</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">{texts.subtitle}</p>
          <div className="w-20 h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 mx-auto rounded-full mt-5" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, i) => (
            <TopicCard key={topic.title} topic={topic} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
