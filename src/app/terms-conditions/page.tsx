'use client';
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/components/Language/LanguageProvider";
import { FaFileContract, FaArrowRight, FaCheckCircle, FaUserShield, FaBan, FaLifeRing } from "react-icons/fa";

type Section = {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string[];
  bodyEn: string[];
};

const sections: Section[] = [
  {
    id: "acceptance",
    titleAr: "قبول الشروط",
    titleEn: "Acceptance of terms",
    bodyAr: [
      "باستخدامك لمنصة فذلكة فإنك تقر بقراءتك وAcceptance لهذه الشروط والأحكام والموافقة عليها.",
      "إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى التوقف عن استخدام المنصة."
    ],
    bodyEn: [
      "By using Falthaka you acknowledge that you have read, understood and agree to these terms and conditions.",
      "If you do not agree with any part of these terms, please stop using the platform."
    ]
  },
  {
    id: "accounts",
    titleAr: "حسابات المستخدمين",
    titleEn: "User accounts",
    bodyAr: [
      "أنت مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة بك وعن جميع النشاطات التي تتم عبر حسابك.",
      "يجب تقديم معلومات صحيحة ودقيقة عند التسجيل، وتحديثها عند أي تغيير.",
      "يحق لإدارة المنصة تعليق أو إنهاء أي حساب يخالف هذه الشروط."
    ],
    bodyEn: [
      "You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.",
      "You must provide accurate and truthful information when registering and keep it updated.",
      "The platform administration reserves the right to suspend or terminate any account that violates these terms."
    ]
  },
  {
    id: "content",
    titleAr: "المحتوى واستخدامه",
    titleEn: "Content and usage",
    bodyAr: [
      "جميع المحتويات (فيديو، مقالات، حلقات) ملك لمنصة فذلكة أو مرخصة لها، ومحمية بقوانين الملكية الفكرية.",
      "يسمح لك بعرض وتصفح المحتوى للاستخدام الشخصي غير التجاري فقط، ولا يجوز نسخه أو إعادة نشره دون إذن خطي.",
      "قد يحتوي المحتوى على روابط لجهات خارجية، ونحن غير مسؤولين عن محتواها."
    ],
    bodyEn: [
      "All content (videos, articles, episodes) is owned by or licensed to Falthaka and protected by intellectual property laws.",
      "You may view and browse content for personal, non-commercial use only; copying or republishing without written permission is prohibited.",
      "Content may include third-party links for which we are not responsible."
    ]
  },
  {
    id: "conduct",
    titleAr: "سلوك المستخدم",
    titleEn: "User conduct",
    bodyAr: [
      "يُمنع نشر محتوى مخالف للقوانين، أو مسيء، أو يحض على الكراهية، أو ينتهك حقوق الغير.",
      "يُمنع استخدام المنصة لأي غرض غير قانوني أو للإضرار بالمنصة أو مستخدميها."
    ],
    bodyEn: [
      "Posting unlawful, abusive, hateful or rights-infringing content is prohibited.",
      "Using the platform for any illegal purpose or to harm the platform or its users is prohibited."
    ]
  },
  {
    id: "liability",
    titleAr: "حدود المسؤولية",
    titleEn: "Limitation of liability",
    bodyAr: [
      "تُقدم المنصة كما هي دون أي ضمانات صريحة أو ضمنية بخلاف ما هو منصوص عليه صراحةً.",
      "لن تتحمل فذلكة المسؤولية عن أي أضرار غير مباشرة ناتجة عن استخدام المنصة."
    ],
    bodyEn: [
      "The platform is provided \"as is\" without warranties other than those expressly stated.",
      "Falthaka shall not be liable for any indirect damages arising from the use of the platform."
    ]
  },
  {
    id: "changes",
    titleAr: "تعديل الشروط",
    titleEn: "Changes to terms",
    bodyAr: [
      "نحتفظ بحق تعديل هذه الشروط والأحكام من وقت لآخر، وسيتم نشر التعديلات على هذه الصفحة.",
      "استمرارك في استخدام المنصة بعد التعديل يعني موافقتك على الشروط المحدثة."
    ],
    bodyEn: [
      "We reserve the right to modify these terms from time to time; changes will be posted on this page.",
      "Your continued use of the platform after changes means you accept the updated terms."
    ]
  }
];

export default function TermsPage() {
  const { isRTL, language } = useLanguage();
  const t = language === 'ar'
    ? { title: "الشروط والأحكام", subtitle: "القواعد التي تحكم استخدامك لمنصة فذلكة", updated: "آخر تحديث:", back: "العودة للرئيسية", contact: "تواصل معنا" }
    : { title: "Terms & Conditions", subtitle: "The rules governing your use of Falthaka", updated: "Last updated:", back: "Back to Home", contact: "Contact Us" };

  const [isDark, setIsDark] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setIsDark(saved === 'true');
    else setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const updatedDate = new Date().getFullYear();

  return (
    <div className={`min-h-screen pt-24 pb-16 px-4 ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'} transition-colors duration-300`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Head>
        <title>{t.title} - فذلكة | Falthaka</title>
        <meta name="description" content={t.subtitle} />
      </Head>

      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-purple-600 to-pink-700 dark:from-purple-900 dark:to-pink-950 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-10 relative overflow-hidden"
        >
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-2xl">
              <FaFileContract className="text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{t.title}</h1>
              <p className="mt-2 text-purple-100 max-w-xl">{t.subtitle}</p>
              <p className="mt-3 text-sm text-purple-200">{t.updated} {updatedDate}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <motion.section
              key={section.id}
              initial={reduceMotion ? {} : { opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className={`rounded-2xl p-6 md:p-8 shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 p-2 rounded-lg">
                  {section.id === 'accounts' ? <FaUserShield /> : section.id === 'conduct' ? <FaBan /> : section.id === 'liability' ? <FaLifeRing /> : section.id === 'changes' ? <FaCheckCircle /> : <FaFileContract />}
                </div>
                <h2 className="text-xl md:text-2xl font-bold">{language === 'ar' ? section.titleAr : section.titleEn}</h2>
              </div>
              <div className="space-y-3 text-base leading-relaxed">
                {(language === 'ar' ? section.bodyAr : section.bodyEn).map((p, i) => (
                  <p key={i} className={isDark ? 'text-gray-300' : 'text-gray-600'}>{p}</p>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium">
            {t.back}
            <FaArrowRight className={isRTL ? 'rotate-180' : ''} />
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg">
            {t.contact}
            <FaArrowRight className={isRTL ? 'rotate-180' : ''} />
          </Link>
        </div>
      </div>
    </div>
  );
}
