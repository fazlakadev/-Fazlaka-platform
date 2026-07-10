'use client';
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/components/Language/LanguageProvider";
import { FaShieldAlt, FaArrowRight, FaLock, FaUserShield, FaCookieBite, FaEnvelope } from "react-icons/fa";

type Section = {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string[];
  bodyEn: string[];
};

const sections: Section[] = [
  {
    id: "collection",
    titleAr: "ما البيانات التي نجمعها",
    titleEn: "What data we collect",
    bodyAr: [
      "عند إنشاء حساب على منصة فذلكة، نجمع المعلومات التي تزودنا بها مباشرة مثل الاسم والبريد الإلكتروني وكلمة المرور.",
      "قد نجمع أيضاً بيانات استخدام تقنية مثل نوع المتصفح، نظام التشغيل، وعنوان IP لأغراض تحسين الأداء والأمان.",
      "إذا اخترت التسجيل عبر حساب جوجل، نحصل على بياناتك الأساسية من جوجل وفقاً لإعدادات الخصوصية لديك."
    ],
    bodyEn: [
      "When you create an account on Falthaka, we collect information you provide directly such as your name, email and password.",
      "We may also collect technical usage data such as browser type, operating system and IP address to improve performance and security.",
      "If you sign up via Google, we receive your basic profile data from Google according to your privacy settings."
    ]
  },
  {
    id: "usage",
    titleAr: "كيف نستخدم بياناتك",
    titleEn: "How we use your data",
    bodyAr: [
      "نستخدم بياناتك لتوفير خدمات المنصة، والتحقق من هويتك، وإدارة حسابك وتخصيص تجربة المحتوى المعروض لك.",
      "قد نستخدم بريدك الإلكتروني لإرسال رسائل مهمة تتعلق بحسابك أو تحديثات النشرة البريدية إذا كنت مشتركاً فيها.",
      "لا نبيع بياناتك الشخصية لأي طرف ثالث تحت أي ظرف."
    ],
    bodyEn: [
      "We use your data to provide platform services, verify your identity, manage your account and personalize your content experience.",
      "We may use your email to send important account-related messages or newsletter updates if you are subscribed.",
      "We never sell your personal data to any third party under any circumstances."
    ]
  },
  {
    id: "cookies",
    titleAr: "ملفات الارتباط (Cookies)",
    titleEn: "Cookies",
    bodyAr: [
      "نستخدم ملفات الارتباط لحفظ تفضيلاتك مثل اللغة والوضع الليلي وتسجيل الجلسة لتسهيل تصفحك للموقع.",
      "يمكنك التحكم في ملفات الارتباط أو تعطيلها من إعدادات المتصفح، مع العلم أن بعض الميزات قد تتأثر."
    ],
    bodyEn: [
      "We use cookies to remember your preferences such as language, dark mode and session login to make browsing easier.",
      "You can control or disable cookies from your browser settings, noting that some features may be affected."
    ]
  },
  {
    id: "security",
    titleAr: "أمان بياناتك",
    titleEn: "Data security",
    bodyAr: [
      "نطبق إجراءات أمنية قياسية لحماية بياناتك من الوصول غير المصرح به أو الفقدان أو الإفصاح.",
      "كلمات المرور مخزنة بصيغة مشفرة ولا يمكن الاطلاع عليها بصيغتها الأصلية."
    ],
    bodyEn: [
      "We apply standard security measures to protect your data from unauthorized access, loss or disclosure.",
      "Passwords are stored in encrypted form and cannot be viewed in their original state."
    ]
  },
  {
    id: "rights",
    titleAr: "حقوقك",
    titleEn: "Your rights",
    bodyAr: [
      "لديك الحق في الوصول إلى بياناتك الشخصية، وتصحيحها، أو طلب حذفها في أي وقت.",
      "لطلب حذف حسابك أو بياناتك، يمكنك التواصل مع فريق الدعم عبر صفحة \"تواصل معنا\"."
    ],
    bodyEn: [
      "You have the right to access your personal data, correct it, or request its deletion at any time.",
      "To request account or data deletion, you can contact our support team via the \"Contact Us\" page."
    ]
  }
];

export default function PrivacyPolicyPage() {
  const { isRTL, language } = useLanguage();
  const t = language === 'ar'
    ? { title: "سياسة الخصوصية", subtitle: "كيف نحمي بياناتك ونستخدمها على منصة فذلكة", updated: "آخر تحديث:", back: "العودة للرئيسية", contact: "تواصل معنا" }
    : { title: "Privacy Policy", subtitle: "How we protect and use your data on Falthaka", updated: "Last updated:", back: "Back to Home", contact: "Contact Us" };

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
          className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-950 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-10 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-2xl">
              <FaShieldAlt className="text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{t.title}</h1>
              <p className="mt-2 text-blue-100 max-w-xl">{t.subtitle}</p>
              <p className="mt-3 text-sm text-blue-200">{t.updated} {updatedDate}</p>
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
                <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 p-2 rounded-lg">
                  {section.id === 'cookies' ? <FaCookieBite /> : section.id === 'security' ? <FaLock /> : section.id === 'rights' ? <FaUserShield /> : <FaEnvelope />}
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
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg">
            {t.contact}
            <FaArrowRight className={isRTL ? 'rotate-180' : ''} />
          </Link>
        </div>
      </div>
    </div>
  );
}
