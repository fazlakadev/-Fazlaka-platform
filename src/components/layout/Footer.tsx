"use client";
import { motion } from "framer-motion";
import {
  ChevronRight, List, Calendar, Users,
  FileText, BookOpen, Mail, Video,
  Grid, HelpCircle
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import NewsletterSubscribe from "@/components/newsletter/NewsletterSubscribe";
import { FaYoutube, FaInstagram, FaFacebookF, FaTiktok as FaTiktokIcon } from 'react-icons/fa';

const translations = {
  ar: {
    followUs: "تابعنا على منصات التواصل الاجتماعي",
    content: "المحتوى",
    episodes: "الحلقات",
    playlists: "قوائم التشغيل",
    seasons: "المواسم",
    articles: "المقالات",
    aboutUs: "تعرف علينا",
    whoWeAre: "من نحن",
    platforms: "تجدنا على",
    team: "الفريق",
    contact: "التواصل",
    contactUs: "تواصل معنا",
    support: "الدعم",
    faq: "الأسئلة الشائعة",
    policies: "السياسات",
    privacyPolicy: "سياسة الخصوصية",
    termsConditions: "الشروط والأحكام",
    backToHome: "العودة إلى الصفحة الرئيسية",
    copyright: "جميع الحقوق محفوظة.",
    scienceMeaning: "العلم معنى",
    fun: "ممتع",
    organized: "منظم",
    easy: "سهل",
    platformDescription: "منصة تعليمية حديثة لعرض العلوم بشكل",
    toDevelopSkills: "لتطوير مهاراتك.",
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    twitter: "Twitter",
    home: "الرئيسية",
    search: "بحث",
    newsletter: "النشرة البريدية",
    newsletterDesc: "اشترك في نشرتنا البريدية ليصلك كل جديد"
  },
  en: {
    followUs: "Follow us on social media",
    content: "Content",
    episodes: "Episodes",
    playlists: "Playlists",
    seasons: "Seasons",
    articles: "Articles",
    aboutUs: "About Us",
    whoWeAre: "Who We Are",
    platforms: "Find us on",
    team: "Team",
    contact: "Contact",
    contactUs: "Contact Us",
    support: "Support",
    faq: "FAQ",
    policies: "Policies",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    backToHome: "Back to Home",
    copyright: "All rights reserved.",
    scienceMeaning: "Science with meaning",
    fun: "fun",
    organized: "organized",
    easy: "easy",
    platformDescription: "A modern educational platform for presenting science in a",
    toDevelopSkills: "way to develop your skills.",
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    twitter: "Twitter",
    home: "Home",
    search: "Search",
    newsletter: "Newsletter",
    newsletterDesc: "Subscribe to our newsletter to get the latest updates"
  }
};

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

const STATIC_SOCIAL_LINKS: SocialLink[] = [
  { id: 'youtube', platform: 'youtube', url: 'https://youtube.com/@Falthaka' },
  { id: 'instagram', platform: 'instagram', url: 'https://instagram.com/falthaka' },
  { id: 'facebook', platform: 'facebook', url: 'https://facebook.com/falthaka' },
  { id: 'tiktok', platform: 'tiktok', url: 'https://tiktok.com/@falthaka' },
  { id: 'twitter', platform: 'twitter', url: 'https://x.com/falthaka' },
];

function getSocialIcon(platform: string) {
  switch (platform) {
    case 'youtube': return FaYoutube;
    case 'instagram': return FaInstagram;
    case 'facebook': return FaFacebookF;
    case 'tiktok': return FaTiktokIcon;
    case 'x':
    case 'twitter': return FaXTwitter;
    default: return FaXTwitter;
  }
}

function getPlatformName(platform: string, language: string) {
  const names: Record<string, { ar: string; en: string }> = {
    youtube: { ar: 'يوتيوب', en: 'YouTube' },
    instagram: { ar: 'انستجرام', en: 'Instagram' },
    facebook: { ar: 'فيس بوك', en: 'Facebook' },
    tiktok: { ar: 'تيك توك', en: 'TikTok' },
    x: { ar: 'إكس', en: 'X' },
    twitter: { ar: 'إكس', en: 'X' }
  };
  return names[platform]?.[language as 'ar' | 'en'] || platform;
}

function getSocialColor(platform: string) {
  switch (platform) {
    case 'youtube': return 'from-red-500 to-red-600';
    case 'instagram': return 'from-pink-500 to-purple-500';
    case 'facebook': return 'from-blue-500 to-blue-600';
    case 'tiktok': return 'from-black to-gray-800';
    case 'x':
    case 'twitter': return 'from-gray-700 to-gray-900';
    default: return 'from-gray-500 to-gray-600';
  }
}

export default function Footer() {
  const year = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);
  const [isRTL, setIsRTL] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
      setIsRTL(savedLanguage === 'ar');
    } else {
      const browserLang = navigator.language || 'en';
      setIsRTL(browserLang.includes('ar'));
    }

    const updateDark = () => {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) setIsDark(saved === 'true');
      else setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    updateDark();
    const handleStorage = (e: StorageEvent) => { if (e.key === 'darkMode') updateDark(); };
    window.addEventListener('storage', handleStorage);
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    setSocialLinks(STATIC_SOCIAL_LINKS);
    setLoading(false);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('storage', handleStorage);
      observer.disconnect();
    };
  }, []);

  const t = translations[isRTL ? 'ar' : 'en'];
  const logoSrc = isRTL ? "/logo.png" : "/logoE.png";
  const logoAlt = isRTL ? "فذلكة" : "fazlaka";

  const contentLinks = [
    { href: "/episodes", text: t.episodes, icon: <Video className="w-4 h-4" /> },
    { href: "/playlists", text: t.playlists, icon: <List className="w-4 h-4" /> },
    { href: "/seasons", text: t.seasons, icon: <Calendar className="w-4 h-4" /> },
    { href: "/articles", text: t.articles, icon: <FileText className="w-4 h-4" /> },
  ];

  const aboutLinks = [
    { href: "/about", text: t.whoWeAre, icon: <BookOpen className="w-4 h-4" /> },
    { href: "/follow-us", text: t.platforms, icon: <Grid className="w-4 h-4" /> },
    { href: "/team", text: t.team, icon: <Users className="w-4 h-4" /> },
  ];

  const contactLinks = [
    { href: "/contact", text: t.contactUs, icon: <Mail className="w-4 h-4" /> },
    { href: "/support", text: t.support, icon: <HelpCircle className="w-4 h-4" /> },
    { href: "/faq", text: t.faq, icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const policyLinks = [
    { href: "/privacy-policy", text: t.privacyPolicy, color: "text-blue-500 hover:text-blue-600 dark:hover:text-blue-400" },
    { href: "/terms-conditions", text: t.termsConditions, color: "text-purple-500 hover:text-purple-600 dark:hover:text-purple-400" },
  ];

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted) return null;

  const validSocialLinks = socialLinks.filter(social =>
    ['youtube', 'instagram', 'facebook', 'tiktok', 'x', 'twitter'].includes(social.platform)
  );

  const cardBg = isDark
    ? "bg-gray-800/40 border-gray-700/40"
    : "bg-white/70 border-gray-200/60";
  const sectionCardBg = isDark
    ? "bg-gray-800/30 border-gray-700/30"
    : "bg-white/60 border-gray-200/50";
  return (
    <>
      <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </div>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={`pt-16 pb-12 relative overflow-hidden transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0f172a] text-gray-200'
            : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-700'
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Animated background — dark only */}
        {isDark && (
          <div className="absolute inset-0 overflow-hidden">
            {!isMobile && <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5" />}
            {!isMobile && (
              <>
                <motion.div
                  className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
                  animate={{ x: [0, 30, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.div
                  className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
                  animate={{ x: [0, -30, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 18, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.div
                  className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
                />
              </>
            )}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Logo + Social */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className={`${cardBg} backdrop-blur-sm rounded-3xl p-8 border shadow-xl mb-16 transition-colors duration-300`}
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="relative cursor-pointer transition-all duration-300 mb-6"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogoClick}
              >
                <Image src={logoSrc} alt={logoAlt} width={isMobile ? 120 : 140} height={isMobile ? 120 : 140} className="object-contain" priority />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className={`text-base max-w-2xl mb-8 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-500'}`}
              >
                {t.platformDescription} {t.fun}، {t.organized}، و{t.easy} {t.toDevelopSkills}
              </motion.p>

              {!loading && validSocialLinks.length > 0 && (
                <motion.div className="mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }}>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    {t.followUs}
                  </h3>
                </motion.div>
              )}

              {!loading && validSocialLinks.length > 0 && (
                <motion.div className="flex flex-wrap justify-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}>
                  {validSocialLinks.map((social, index) => {
                    const Icon = getSocialIcon(social.platform);
                    const platformName = getPlatformName(social.platform, isRTL ? 'ar' : 'en');
                    const socialColor = getSocialColor(social.platform);
                    return (
                      <motion.a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.2 + index * 0.1, type: "spring", stiffness: 100 }}
                        whileHover={{ y: -5, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex flex-col items-center justify-center ${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-2xl ${isDark ? 'bg-gray-700/60' : 'bg-gray-100 hover:bg-gray-200'} hover:bg-gradient-to-br ${socialColor} transition-all duration-300 border ${isDark ? 'border-gray-600/50' : 'border-gray-200 hover:border-transparent'} group overflow-hidden shadow-lg relative`}
                        aria-label={platformName}
                      >
                        <div className={`${isMobile ? 'text-xl' : 'text-2xl'} ${isDark ? 'text-gray-300' : 'text-gray-500'} group-hover:text-white transition-all duration-300 group-hover:scale-110 z-10`}>
                          <Icon />
                        </div>
                      </motion.a>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className={`${cardBg} backdrop-blur-sm rounded-3xl p-8 border shadow-xl mb-16 transition-colors duration-300`}
          >
            <div className="max-w-md mx-auto">
              <NewsletterSubscribe variant="footer" language={isRTL ? 'ar' : 'en'} checkSession />
            </div>
          </motion.div>

          {/* Main sections */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className={`${isMobile ? 'grid grid-cols-1 gap-6' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'} mb-16`}
          >
            {/* Content */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.6 }}
              className={`${sectionCardBg} backdrop-blur-sm rounded-2xl p-6 border shadow-xl transition-colors duration-300`}>
              <div className="flex justify-center items-center mb-6">
                <div className={`flex-1 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.content}</h3>
                </div>
              </div>
              <ul className="space-y-3">
                {contentLinks.map((link, index) => (
                  <motion.li key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2 + index * 0.1, duration: 0.5 }}>
                    <Link href={link.href} className={`${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700/30' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} transition-all duration-300 flex items-center group p-3 rounded-xl relative overflow-hidden`}>
                      <span className={`${isRTL ? 'ml-3' : 'mr-3'} text-blue-500 transition-all duration-300 group-hover:scale-110 z-10`}>{link.icon}</span>
                      <span className="flex-1 transition-all duration-300 z-10">{link.text}</span>
                      {!isMobile && (
                        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-300 z-10`} />
                      )}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* About */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7, duration: 0.6 }}
              className={`${sectionCardBg} backdrop-blur-sm rounded-2xl p-6 border shadow-xl transition-colors duration-300`}>
              <div className="flex justify-center items-center mb-6">
                <div className={`flex-1 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.aboutUs}</h3>
                </div>
              </div>
              <ul className="space-y-3">
                {aboutLinks.map((link, index) => (
                  <motion.li key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.1 + index * 0.1, duration: 0.5 }}>
                    <Link href={link.href} className={`${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700/30' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} transition-all duration-300 flex items-center group p-3 rounded-xl relative overflow-hidden`}>
                      <span className={`${isRTL ? 'ml-3' : 'mr-3'} text-purple-500 transition-all duration-300 group-hover:scale-110 z-10`}>{link.icon}</span>
                      <span className="flex-1 transition-all duration-300 z-10">{link.text}</span>
                      {!isMobile && (
                        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-300 z-10`} />
                      )}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Contact */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.6 }}
              className={`${sectionCardBg} backdrop-blur-sm rounded-2xl p-6 border shadow-xl transition-colors duration-300`}>
              <div className="flex justify-center items-center mb-6">
                <div className={`flex-1 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.contact}</h3>
                </div>
              </div>
              <ul className="space-y-3">
                {contactLinks.map((link, index) => (
                  <motion.li key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.2 + index * 0.1, duration: 0.5 }}>
                    <Link href={link.href} className={`${isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700/30' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} transition-all duration-300 flex items-center group p-3 rounded-xl relative overflow-hidden`}>
                      <span className={`${isRTL ? 'ml-3' : 'mr-3'} text-green-500 transition-all duration-300 group-hover:scale-110 z-10`}>{link.icon}</span>
                      <span className="flex-1 transition-all duration-300 z-10">{link.text}</span>
                      {!isMobile && (
                        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-300 z-10`} />
                      )}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4, duration: 0.8 }}
            className={`pt-8 border-t text-center ${isDark ? 'border-gray-700/30' : 'border-gray-200'}`}
          >
            <motion.p
              className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 0.8 }}
            >
              {year} {isRTL ? 'فذلكة' : 'fazlaka'.toUpperCase()}. {t.copyright}
            </motion.p>
            <motion.div
              className="flex justify-center items-center flex-wrap gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.8 }}
            >
              {policyLinks.map((link, index) => (
                <motion.div key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href={link.href} className={`${link.color} transition-all duration-300 text-sm font-medium px-6 py-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    {link.text}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut", delay: 3 }}
          />
        </div>
      </motion.footer>

      <style jsx global>{`
        .bg-grid-pattern {
          background-image: linear-gradient(rgba(255,255,255, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </>
  );
}
