"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/Language/LanguageProvider';

export interface FeaturedTexts {
  featuredTitle: string;
  featuredSubtitle: string;
  play: string;
  views: string;
  testimonialsTitle: string;
}

interface PopularItem {
  contentId: string;
  contentType: string;
  slug?: string;
  title?: string;
  titleEn?: string | null;
  _sum?: { count: number };
  item?: { thumbnailUrl?: string } | null;
}

export interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar?: string;
  likes?: number;
}

export default function FeaturedSection({
  texts,
  testimonials: fallbackTestimonials,
}: {
  texts: FeaturedTexts;
  testimonials: Testimonial[];
}) {
  const { language, isRTL } = useLanguage();
  const [featured, setFeatured] = useState<PopularItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    fetch('/api/content/popular?type=EPISODE&limit=1')
      .then(res => res.json())
      .then(json => { if (json.success && json.data?.[0]) setFeatured(json.data[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // جلب آراء حقيقية من قاعدة البيانات
  useEffect(() => {
    fetch('/api/testimonials')
      .then(res => res.json())
      .then(json => {
        if (json.data && json.data.length > 0) {
          setTestimonials(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // تبديل تلقائي لآراء المستخدمين
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const id = setInterval(() => {
      setActiveTestimonial(p => (p + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(id);
  }, [testimonials.length]);

  const featuredTitle = featured ? (language === 'ar' ? featured.title : featured.titleEn || featured.title) : '';
  const t = testimonials[activeTestimonial];

  return (
    <section className="relative py-24 lg:py-28 bg-gradient-to-b from-[#030712] via-[#060d1c] to-[#030712] overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* ===== الحلقة المميّزة ===== */}
          <div dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-semibold mb-4">
                ★ {texts.featuredTitle}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{texts.featuredSubtitle}</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl">{texts.featuredTitle}</p>
            </motion.div>

            {loading ? (
              <div className="relative aspect-video rounded-3xl bg-white/5 animate-pulse" />
            ) : featured ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 }}
              >
                <Link href={`/episodes/${featured.slug}`} className="group relative block aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                  <div className="absolute inset-0 bg-slate-900">
                    {featured.item?.thumbnailUrl && (
                      <Image
                        src={featured.item.thumbnailUrl}
                        alt={featuredTitle || ''}
                        fill
                        className="object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/30 to-transparent" />

                  {/* عدّاد المشاهدات */}
                  {typeof featured._sum?.count === 'number' && (
                    <div className="absolute top-4 end-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs text-white">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="font-semibold">{featured._sum.count.toLocaleString()}</span>
                      <span className="text-white/60">{texts.views}</span>
                    </div>
                  )}

                  {/* زر تشغيل */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="relative w-20 h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl"
                    >
                      <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-60" />
                      <svg className="relative h-8 w-8 text-white ms-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    </motion.div>
                  </div>

                  {/* العنوان في الأسفل */}
                  <div className="absolute bottom-0 inset-x-0 p-6">
                    <h3 className="text-xl md:text-2xl font-bold text-white line-clamp-2">{featuredTitle}</h3>
                    <span className="mt-2 inline-flex items-center gap-2 text-cyan-300 text-sm font-semibold">
                      {texts.play}
                      <span className="rtl:rotate-180">→</span>
                    </span>
                  </div>
                </Link>
              </motion.div>
            ) : null}
          </div>

          {/* ===== آراء المستخدمين ===== */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{texts.testimonialsTitle}</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mb-10" />

            {t && (
              <div className="relative">
                {/* علامة اقتباس كبيرة */}
                <div className="absolute -top-4 -start-2 text-8xl text-white/5 font-serif select-none leading-none">&ldquo;</div>

                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl"
                >
                  {/* نجوم */}
                  <div className="flex gap-1 mb-5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.95 6.7 7.05.6-5.3 4.85 1.6 7.85L12 18.3 5.7 22l1.6-7.85L2 9.3l7.05-.6L12 2z" /></svg>
                    ))}
                  </div>

                  <p className="text-lg text-slate-200 leading-relaxed mb-6 min-h-[4.5rem]">&ldquo;{t.text}&rdquo;</p>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
                      {t.avatar ? (
                        <Image src={t.avatar} alt={t.name} width={48} height={48} className="w-full h-full object-cover" />
                      ) : (
                        t.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{t.name}</div>
                      <div className="text-sm text-slate-400">{t.role}</div>
                    </div>
                  </div>
                </motion.div>

                {/* نقاط التنقّل */}
                <div className="flex justify-center gap-2 mt-8 rtl:flex-row-reverse">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTestimonial(i)}
                      aria-label={`testimonial ${i + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 ${activeTestimonial === i ? 'w-8 bg-amber-400' : 'w-2 bg-white/25 hover:bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
