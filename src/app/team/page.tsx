'use client';
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/components/Language/LanguageProvider";
import { FaArrowRight, FaUsers, FaLinkedin, FaTwitter, FaGlobe } from "react-icons/fa";

type TeamMember = {
  id: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  bioAr: string;
  bioEn: string;
  image: string;
  social?: { type: 'linkedin' | 'twitter' | 'website'; url: string }[];
};

const team: TeamMember[] = [
  {
    id: "founder",
    nameAr: "أحمد فذلكة",
    nameEn: "Ahmed Falthaka",
    roleAr: "المؤسس والرئيس التنفيذي",
    roleEn: "Founder & CEO",
    bioAr: "رائد أعمال شغوف بنشر المعرفة العلمية، أسس منصة فذلكة بهدف تبسيط العلوم للجمهور العربي وجعلها في متناول الجميع.",
    bioEn: "A passionate entrepreneur dedicated to spreading scientific knowledge, Ahmed founded Falthaka to simplify science for Arabic-speaking audiences.",
    image: "",
    social: [{ type: 'twitter', url: 'https://x.com/FazlakaPlatform' }]
  },
  {
    id: "content-manager",
    nameAr: "سارة المنصوري",
    nameEn: "Sara Al-Mansoori",
    roleAr: "مديرة المحتوى",
    roleEn: "Content Manager",
    bioAr: "تقود فريق التحرير وتشرف على جودة المحتوى التعليمي المقدم عبر الحلقات والمقالات لضمان وصول المعلومة بأفضل صورة.",
    bioEn: "She leads the editorial team and oversees the quality of educational content across episodes and articles.",
    image: "",
    social: [{ type: 'linkedin', url: 'https://linkedin.com' }]
  },
  {
    id: "editor-in-chief",
    nameAr: "خالد الزهراني",
    nameEn: "Khaled Al-Zahrani",
    roleAr: "رئيس التحرير",
    roleEn: "Editor-in-Chief",
    bioAr: "متخصص في صياغة المحتوى العلمي بأسلوب سلس، يضمن دقة المعلومات وسهولة عرضها على المشاهدين والقراء.",
    bioEn: "Specialized in crafting scientific content in a smooth style, ensuring accuracy and clarity for viewers and readers.",
    image: "",
    social: [{ type: 'website', url: 'https://falthaka.com' }]
  },
  {
    id: "designer",
    nameAr: "ليلى الحربي",
    nameEn: "Layla Al-Harbi",
    roleAr: "مصممة الجرافيك",
    roleEn: "Graphic Designer",
    bioAr: "تصمم الهويات البصرية والرسوميات التي تجعل المحتوى التعليمي أكثر جاذبية وسهولة في الفهم.",
    bioEn: "Designs visual identities and graphics that make educational content more engaging and easier to understand.",
    image: "",
    social: [{ type: 'linkedin', url: 'https://linkedin.com' }]
  }
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + parts[parts.length - 1][0]);
}

const socialIcons = {
  linkedin: FaLinkedin,
  twitter: FaTwitter,
  website: FaGlobe
};

export default function TeamPage() {
  const { isRTL, language } = useLanguage();
  const t = language === 'ar'
    ? { title: "فريق العمل", subtitle: "تعرف على الفريق الذي يقف وراء منصة فذلكة", back: "العودة للرئيسية", about: "تعرف علينا" }
    : { title: "Our Team", subtitle: "Meet the team behind the Falthaka platform", back: "Back to Home", about: "About Us" };

  const [isDark, setIsDark] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setIsDark(saved === 'true');
    else setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  return (
    <div className={`min-h-screen pt-24 pb-16 px-4 ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'} transition-colors duration-300`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Head>
        <title>{t.title} - فذلكة | Falthaka</title>
        <meta name="description" content={t.subtitle} />
      </Head>

      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-950 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-12 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-2xl">
              <FaUsers className="text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{t.title}</h1>
              <p className="mt-2 text-blue-100 max-w-xl">{t.subtitle}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member, idx) => {
            const IconComp = member.social?.[0] ? socialIcons[member.social[0].type] : null;
            return (
              <motion.div
                key={member.id}
                initial={reduceMotion ? {} : { opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className={`rounded-2xl p-6 shadow-sm border text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 bg-gradient-to-br from-indigo-500 to-purple-600`}>
                  {getInitials(language === 'ar' ? member.nameAr : member.nameEn)}
                </div>
                <h3 className="text-lg font-bold">{language === 'ar' ? member.nameAr : member.nameEn}</h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-3">{language === 'ar' ? member.roleAr : member.roleEn}</p>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {language === 'ar' ? member.bioAr : member.bioEn}
                </p>
                {IconComp && member.social && (
                  <a
                    href={member.social[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex mt-4 items-center justify-center w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
                    aria-label="social"
                  >
                    <IconComp />
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium">
            {t.back}
            <FaArrowRight className={isRTL ? 'rotate-180' : ''} />
          </Link>
          <Link href="/about" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg">
            {t.about}
            <FaArrowRight className={isRTL ? 'rotate-180' : ''} />
          </Link>
        </div>
      </div>
    </div>
  );
}
