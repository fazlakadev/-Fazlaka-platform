"use client";

import Image from 'next/image';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '@/components/Language/LanguageProvider';

// --- Types ---
interface HeroSlider {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO';
  image?: string;
  imageEn?: string;
  localizedImage?: string;
  videoUrl?: string;
  videoUrlEn?: string;
  localizedVideoUrl?: string;
  title?: string;
  titleEn?: string;
  localizedTitle?: string;
  linkUrl?: string;
  linkText?: string;
  linkTextEn?: string;
  localizedLinkText?: string;
}

export interface HeroTexts {
  platformName: string;
  slogan: string;
  subSlogan: string;
  explore: string;
  learnMore: string;
}

const IMAGE_DURATION = 7000; // مدة عرض سلايد الصورة قبل الانتقال التلقائي

const getMedia = (slide: HeroSlider, language: string) => ({
  image: slide.localizedImage || (language === 'en' ? slide.imageEn || slide.image : slide.image),
  videoUrl: slide.localizedVideoUrl || (language === 'en' ? slide.videoUrlEn || slide.videoUrl : slide.videoUrl),
  title: slide.localizedTitle || (language === 'en' ? slide.titleEn || slide.title : slide.title),
  linkText: slide.localizedLinkText || (language === 'en' ? slide.linkTextEn || slide.linkText : slide.linkText),
});

// =============== أيقونات التحكم ===============
const PlayIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
);
const VolumeOnIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 00-2.5-4.03v8.05A4.5 4.5 0 0016.5 12zM14 3.23v2.06a7 7 0 010 13.42v2.06A9 9 0 0014 3.23z" /></svg>
);
const VolumeOffIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.96 8.96 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
);
const FullscreenIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
);
const ChevronIcon = ({ className = '', dir = 'right' }: { className?: string; dir?: 'right' | 'left' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ transform: dir === 'left' ? 'scaleX(-1)' : undefined }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
const Spinner = () => (
  <svg className="animate-spin h-12 w-12 text-white/90" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// =============== مكوّن سلايد واحد (الخلفية) ===============
function SlideBackground({
  slide,
  active,
  language,
  mounted,
  videoRef,
  videoState,
  onVideo,
  onError,
}: {
  slide: HeroSlider;
  active: boolean;
  language: string;
  mounted: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoState: { playing: boolean; muted: boolean; buffering: boolean; error: boolean };
  onVideo: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onError: () => void;
}) {
  const { image, videoUrl } = getMedia(slide, language);
  const isVideo = slide.mediaType === 'VIDEO' && !!videoUrl;

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      aria-hidden={!active}
    >
      {/* طبقة الصورة (تظهر دائماً كـ poster، وللصور هي المحتوى الأساسي) */}
      {image && (
        <div className={`absolute inset-0 ${active && !isVideo ? 'animate-kenburns' : ''}`}>
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      {/* طبقة الفيديو — تُركّب فقط للسلايد النشط أو السلايدات السابقة المحفوظة */}
      {isVideo && mounted && !videoState.error && (
        <video
          ref={active ? videoRef : undefined}
          key={slide.id}
          src={videoUrl}
          poster={image}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted={videoState.muted}
          autoPlay={active}
          loop={false}
          preload="auto"
          onPlay={onVideo}
          onPause={onVideo}
          onWaiting={onVideo}
          onPlaying={onVideo}
          onTimeUpdate={onVideo}
          onLoadedMetadata={onVideo}
          onEnded={onVideo}
          onError={onError}
        />
      )}

      {/* مؤشر التحميل للفيديو */}
      {isVideo && active && videoState.buffering && !videoState.error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Spinner />
        </div>
      )}
    </div>
  );
}

// =============== الهيرو الرئيسي ===============
export default function HeroSection({ texts }: { texts: HeroTexts }) {
  const { language, isRTL } = useLanguage();
  const [sliders, setSliders] = useState<HeroSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [mountedVideos, setMountedVideos] = useState<Set<string>>(new Set());
  const [paused, setPaused] = useState(false); // إيقاف مؤقت عام للسلايدر

  // حالة الفيديو (مرتبطة بالسلايد النشط)
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0); // 0-100
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const imageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // parallax عند التمرير
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 120]);
  const contentY = useTransform(scrollY, [0, 600], [0, -40]);
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  // جلب السلايدرات
  useEffect(() => {
    fetch(`/api/hero-slider?lang=${language}`)
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setSliders(arr);
        if (arr[0]?.mediaType === 'VIDEO') setMountedVideos(s => new Set(s).add(arr[0].id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [language]);

  const activeSlide = sliders[active];
  const isActiveVideo = !!activeSlide && activeSlide.mediaType === 'VIDEO' && !!getMedia(activeSlide, language).videoUrl;

  const next = useCallback(() => {
    setActive(prev => (prev + 1) % Math.max(sliders.length, 1));
  }, [sliders.length]);
  const prev = useCallback(() => {
    setActive(p => (p - 1 + sliders.length) % Math.max(sliders.length, 1));
  }, [sliders.length]);
  const goTo = (i: number) => setActive(i);

  // عند تغيّر السلايد النشط: إعادة ضبط حالة الفيديو + تركيب فيديو السلايد الجديد إن لزم
  useEffect(() => {
    setProgress(0);
    setCurrent(0);
    setDuration(0);
    setVideoError(false);
    setBuffering(false);
    if (activeSlide?.mediaType === 'VIDEO') {
      setMountedVideos(s => {
        const n = new Set(s);
        n.add(activeSlide.id);
        return n;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // التشغيل التلقائي للصور فقط (الفيديو ينتقل عند onEnded)
  useEffect(() => {
    if (paused || loading || sliders.length === 0) return;
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    if (!isActiveVideo) {
      imageTimerRef.current = setTimeout(() => next(), IMAGE_DURATION);
    }
    return () => { if (imageTimerRef.current) clearTimeout(imageTimerRef.current); };
  }, [active, paused, loading, sliders.length, isActiveVideo, next]);

  // دعم لوحة المفاتيح
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { if (isRTL) { prev(); } else { next(); } }
      else if (e.key === 'ArrowLeft') { if (isRTL) { next(); } else { prev(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, isRTL]);

  // معالجة أحداث الفيديو
  const handleVideo = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    switch (e.type) {
      case 'loadedmetadata': setDuration(v.duration || 0); setPlaying(true); v.play().catch(() => {}); break;
      case 'play': setPlaying(true); setBuffering(false); break;
      case 'pause': setPlaying(false); break;
      case 'waiting': setBuffering(true); break;
      case 'playing': setBuffering(false); break;
      case 'timeupdate':
        setCurrent(v.currentTime);
        if (v.duration) setProgress((v.currentTime / v.duration) * 100);
        break;
      case 'ended': next(); break;
    }
  };
  const handleVideoError = () => setVideoError(true);

  // تحكّم مخصّص
  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  };
  const toggleMute = () => {
    const v = videoRef.current;
    const m = !muted; setMuted(m);
    if (v) v.muted = m;
    if (!m && v) v.play().catch(() => {});
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current; if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  };
  const toggleFullscreen = () => {
    const el = sectionRef.current; if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const sloganParts = texts.slogan.split('..');
  const slideText = activeSlide ? getMedia(activeSlide, language) : null;
  const videoState = { playing, muted, buffering, error: videoError };

  return (
    <section ref={sectionRef} className="group/section relative min-h-screen w-full overflow-hidden bg-[#030712]">
      {/* ===== الخلفية السينمائية ===== */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 z-0 scale-110">
        {loading ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[#030712] via-[#0a1428] to-[#030712]" />
        ) : sliders.length > 0 ? (
          sliders.map(slide => (
            <SlideBackground
              key={slide.id}
              slide={slide}
              active={active === sliders.indexOf(slide)}
              language={language}
              mounted={mountedVideos.has(slide.id)}
              videoRef={videoRef}
              videoState={videoState}
              onVideo={handleVideo}
              onError={handleVideoError}
            />
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#030712] via-[#0a1428] to-[#030712]" />
        )}
      </motion.div>

      {/* ===== الطبقات الفوقية للتباين والعمق ===== */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#030712] via-[#030712]/40 to-[#030712]/30" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#030712]/90 via-[#030712]/30 to-transparent" />

      {/* تأثير Aurora المتحرك */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-1/4 left-1/4 w-[700px] h-[700px] rounded-full bg-cyan-500/15 blur-[120px]"
          animate={{ x: [0, 80, 0], y: [0, 40, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[120px]"
          animate={{ x: [0, -60, 0], y: [0, 60, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* طبقة Grain خفيفة */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />

      {/* ===== المحتوى النصّي ===== */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 min-h-screen flex items-center"
      >
        <div className="container mx-auto px-4 lg:px-8 py-32 lg:py-0">
          <div className={`max-w-3xl ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* شارة */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
              </span>
              <span className="text-sm text-white/90 font-medium tracking-wide">{texts.platformName}</span>
            </motion.div>

            {/* العنوان الرئيسي */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6"
            >
              <span className="block bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent drop-shadow-2xl">
                {sloganParts[0]}
              </span>
              {sloganParts[1] && (
                <span className="block bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                  {sloganParts[1]}
                </span>
              )}
            </motion.h1>

            {/* عنوان السلايد الحالي (متغيّر) */}
            <div className="h-7 mb-4 overflow-hidden">
              <AnimatePresence mode="wait">
                {slideText?.title && (
                  <motion.p
                    key={active}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                    className="text-lg md:text-xl font-semibold text-cyan-300/90"
                  >
                    {slideText.title}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-lg md:text-xl text-slate-300/90 max-w-2xl mb-10 leading-relaxed font-light"
            >
              {texts.subSlogan}
            </motion.p>

            {/* أزرار CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/episodes"
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl font-bold shadow-2xl shadow-indigo-600/40 transition-all hover:shadow-indigo-500/60 hover:-translate-y-1 flex items-center gap-2 overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10">{texts.explore}</span>
                <svg className="h-5 w-5 relative z-10 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              {slideText?.linkText && activeSlide?.linkUrl && (
                <Link
                  href={activeSlide.linkUrl}
                  className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-1"
                >
                  {slideText.linkText}
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ===== مؤشّر التمرير ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 hidden lg:flex flex-col items-center gap-2 text-white/50"
      >
        <span className="text-xs tracking-widest uppercase">{isRTL ? 'مرّر للأسفل' : 'Scroll'}</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2"
        >
          <span className="w-1 h-2 rounded-full bg-white/70" />
        </motion.div>
      </motion.div>

      {/* ===== شريط التقدّم العلوي ===== */}
      <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/10">
        {isActiveVideo ? (
          <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-[width] duration-200" style={{ width: `${progress}%` }} />
        ) : (
          !paused && !loading && sliders.length > 0 && (
            <div key={active} className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 origin-left animate-hero-progress" />
          )
        )}
      </div>

      {/* ===== أزرار التنقل الجانبية ===== */}
      <div className="absolute inset-y-0 left-0 right-0 z-20 pointer-events-none">
        <button onClick={prev} aria-label="previous"
          className={`pointer-events-auto absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4 lg:right-8' : 'left-4 lg:left-8'} w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white/80 hover:text-white hover:bg-white/20 border border-white/10 transition-all opacity-0 group-hover/section:opacity-100 hover:scale-110`}
        >
          <ChevronIcon dir={isRTL ? 'right' : 'left'} className="h-6 w-6" />
        </button>
        <button onClick={next} aria-label="next"
          className={`pointer-events-auto absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-4 lg:left-8' : 'right-4 lg:right-8'} w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white/80 hover:text-white hover:bg-white/20 border border-white/10 transition-all opacity-0 group-hover/section:opacity-100 hover:scale-110`}
        >
          <ChevronIcon dir={isRTL ? 'left' : 'right'} className="h-6 w-6" />
        </button>
      </div>

      {/* ===== تحكّم الفيديو (يظهر فقط للسلايدات الفيديو) ===== */}
      <AnimatePresence>
        {isActiveVideo && !videoError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-2xl w-[90%] flex items-center gap-3 text-white bg-black/40 backdrop-blur-lg rounded-2xl px-4 py-2"
          >
            <button onClick={togglePlay} aria-label="play" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md transition flex-shrink-0">
              {playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5 ml-0.5" />}
            </button>
            <span className="text-xs tabular-nums text-white/70 w-10 flex-shrink-0">{fmt(current)}</span>
            <div onClick={seek} className="flex-1 h-1.5 rounded-full bg-white/20 cursor-pointer group relative min-w-0">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500" style={{ width: `${progress}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition" style={{ left: `${progress}%` }} />
            </div>
            <span className="text-xs tabular-nums text-white/70 w-10 flex-shrink-0">{fmt(duration)}</span>
            <button onClick={toggleMute} aria-label="mute" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md transition flex-shrink-0">
              {muted ? <VolumeOffIcon className="h-5 w-5" /> : <VolumeOnIcon className="h-5 w-5" />}
            </button>
            <button onClick={toggleFullscreen} aria-label="fullscreen" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md transition flex-shrink-0">
              <FullscreenIcon className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== العدّاد + النقاط + الإيقاف المؤقت (أسفل اليمين) ===== */}
      <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 z-20 flex items-center gap-4">
        {/* العدّاد */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white tabular-nums">{String(active + 1).padStart(2, '0')}</span>
          <span className="text-xs text-white/40">/ {String(Math.max(sliders.length, 0)).padStart(2, '0')}</span>
        </div>

        {/* نقاط الترقيم */}
        <div className="hidden md:flex items-center gap-1.5">
          {sliders.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              aria-label={`slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${active === i ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>

        {/* زر إيقاف مؤقت */}
        <button
          onClick={() => setPaused(p => !p)}
          aria-label="pause autoplay"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white/80 hover:text-white transition"
        >
          {paused ? <PlayIcon className="h-4 w-4 ml-0.5" /> : <PauseIcon className="h-4 w-4" />}
        </button>
      </div>

      <style jsx>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.12) translate(-1.5%, -1.5%); }
        }
        .animate-kenburns :global(img) { animation: kenburns 8s ease-out forwards; }
        @keyframes hero-progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .animate-hero-progress { transform-origin: left; animation: hero-progress ${IMAGE_DURATION}ms linear forwards; }
        [dir="rtl"] .animate-hero-progress { transform-origin: right; }
      `}</style>
    </section>
  );
}
