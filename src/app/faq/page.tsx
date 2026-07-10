'use client';
import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/Language/LanguageProvider";
import Head from "next/head";
import {
  FaQuestionCircle, FaComments, FaLightbulb, FaSearch, FaTimes, FaFilter, FaHeadset, FaArrowRight, FaInfoCircle,
  FaChevronDown, FaChevronUp
} from "react-icons/fa";

type FaqItem = {
  id: string;
  category: string;
  categoryEn: string;
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
};

// محتوى ثابت للأسئلة الشائعة (بدون قاعدة بيانات)
const faqs: FaqItem[] = [
  {
    id: "what-is-falthaka",
    category: "عام", categoryEn: "General",
    question: "ما هي منصة فذلكة؟",
    questionEn: "What is Falthaka platform?",
    answer: "فذلكة هي منصة عربية متخصصة في نشر المعرفة والثقافة العلمية من خلال محتوى تعليمي ممتع ومنظم وسهل. نهدف إلى تبسيط العلوم وتقديمها بلغة واضحة عبر قناتنا على يوتيوب ومقالاتنا وحلقاتنا المتنوعة.",
    answerEn: "Falthaka is an Arabic platform dedicated to spreading knowledge and scientific culture through fun, organized and easy educational content. We simplify science and present it in a clear language through our YouTube channel, articles and episodes."
  },
  {
    id: "create-account",
    category: "الحساب", categoryEn: "Account",
    question: "كيف يمكنني إنشاء حساب؟",
    questionEn: "How can I create an account?",
    answer: "يمكنك إنشاء حساب من خلال الضغط على زر \"تسجيل الدخول\" في أعلى الصفحة، ثم اختيار \"إنشاء حساب\" وملء بياناتك (الاسم، البريد الإلكتروني، كلمة المرور). كما يمكنك التسجيل بسرعة عبر حساب جوجل.",
    answerEn: "You can create an account by clicking \"Sign In\" at the top of the page, then choose \"Sign Up\" and fill in your details (name, email, password). You can also sign up quickly using your Google account."
  },
  {
    id: "free-content",
    category: "عام", categoryEn: "General",
    question: "هل المحتوى مجاني؟",
    questionEn: "Is the content free?",
    answer: "نعم، جميع مقاطع الفيديو والمقالات والحلقات على منصة فذلكة متاحة مجاناً للجميع بهدف نشر المعرفة والثقافة العلمية دون قيود.",
    answerEn: "Yes, all videos, articles and episodes on Falthaka are freely available to everyone in order to spread scientific knowledge and culture without restrictions."
  },
  {
    id: "youtube-channel",
    category: "المتابعة", categoryEn: "Following",
    question: "كيف أتابع القناة على يوتيوب؟",
    questionEn: "How do I follow the YouTube channel?",
    answer: "يمكنك زيارة قناتنا على يوتيوب والضغط على زر \"اشتراك\" لتصلك كل جديد. كما يمكنك متابعتنا عبر إنستجرام وفيس بوك وتيك توك وإكس من خلال صفحة \"تابعنا\".",
    answerEn: "You can visit our YouTube channel and click the \"Subscribe\" button to get all our updates. You can also follow us on Instagram, Facebook, TikTok and X via the \"Follow Us\" page."
  },
  {
    id: "contact-support",
    category: "الدعم", categoryEn: "Support",
    question: "كيف يمكنني التواصل مع الدعم؟",
    questionEn: "How can I contact support?",
    answer: "يمكنك التواصل مع فريق الدعم عبر صفحة \"تواصل معنا\" لإرسال رسالة، أو عبر البريد الإلكتروني، أو الانضمام إلى سيرفر الديسكورد الخاص بنا للمساعدة الفورية.",
    answerEn: "You can reach our support team via the \"Contact Us\" page to send a message, via email, or by joining our Discord server for instant help."
  },
  {
    id: "favorites",
    category: "الحساب", categoryEn: "Account",
    question: "كيف أحفظ المحتوى المفضل لدي؟",
    questionEn: "How do I save my favorite content?",
    answer: "بمجرد تسجيل الدخول، يمكنك الضغط على أيقونة القلب في أي حلقة أو مقال لإضافته إلى قائمة مفضلاتك، والوصول إليها لاحقاً من صفحة \"مفضلاتي\".",
    answerEn: "Once signed in, you can click the heart icon on any episode or article to add it to your favorites, and access it later from the \"My Favorites\" page."
  },
  {
    id: "privacy",
    category: "السياسات", categoryEn: "Policies",
    question: "ما هي سياسة الخصوصية لديكم؟",
    questionEn: "What is your privacy policy?",
    answer: "نحن نلتزم بحماية بياناتك الشخصية واستخدامها فقط لتحسين تجربتك. يمكنك الاطلاع على التفاصيل الكاملة في صفحة \"سياسة الخصوصية\".",
    answerEn: "We are committed to protecting your personal data and using it only to improve your experience. You can review the full details in our \"Privacy Policy\" page."
  },
  {
    id: "delete-account",
    category: "الحساب", categoryEn: "Account",
    question: "كيف يمكنني حذف حسابي؟",
    questionEn: "How can I delete my account?",
    answer: "يمكنك حذف حسابك من إعدادات الحساب الشخصية، أو التواصل مع فريق الدعم وسنقوم بحذف بياناتك بناءً على طلبك مع الالتزام بسياسة الخصوصية.",
    answerEn: "You can delete your account from your account settings, or contact our support team and we will delete your data upon request in accordance with our privacy policy."
  }
];

const translations = {
  ar: {
    home: "الرئيسية",
    content: "محتوانا",
    episodes: "الحلقات",
    playlists: "قوائم التشغيل",
    seasons: "المواسم",
    articles: "المقالات",
    about: "تعرف علينا",
    whoWeAre: "من نحن",
    team: "الفريق",
    contact: "التواصل",
    contactUs: "تواصل معنا",
    faq: "الأسئلة الشائعة",
    search: "ابحث عن سؤال أو كلمة مفتاحية...",
    searchResults: "نتائج البحث",
    noResults: "لا توجد نتائج مطابقة",
    searching: "جاري البحث...",
    viewAllResults: "عرض جميع نتائج البحث",
    signIn: "تسجيل دخول",
    signUp: "إنشاء حساب",
    manageAccount: "إدارة الحساب",
    favorites: "مفضلاتي",
    signOut: "تسجيل الخروج",
    notifications: "الإشعارات",
    viewAll: "مشاهدة الكل",
    noNotifications: "لا توجد إشعارات جديدة",
    loading: "جاري التحميل...",
    terms: "شروط وأحكام",
    privacy: "سياسة الخصوصية",
    episode: "حلقة",
    article: "مقال",
    playlist: "قائمة تشغيل",
    faqItem: "سؤال شائع",
    season: "موسم",
    teamMember: "عضو الفريق",
    termsItem: "شروط وأحكام",
    privacyItem: "سياسة الخصوصية",
    darkMode: "تبديل الوضع الليلي",
    language: "تبديل اللغة",
    copyright: "© {year} فذلكة",
    pageTitle: "الأسئلة الأكثر شيوعاً",
    pageSubtitle: "إجابات على استفساراتكم حول منصة فذلكة وخدماتنا التعليمية",
    searchButton: "البحث عن سؤال",
    contactButton: "تواصل معنا",
    faqSectionTitle: "الأسئلة الشائعة",
    faqSectionSubtitle: "إجابات على استفساراتكم حول منصة فذلكة وخدماتنا التعليمية",
    categories: "التصنيفات",
    allCategories: "جميع التصنيفات",
    filterBy: "التصفية حسب:",
    removeFilter: "إزالة التصفية",
    noQuestions: "لا توجد أسئلة",
    noQuestionsMessage: "لا توجد أسئلة تطابق بحثك أو الفئة المحددة",
    clearSearch: "مسح البحث",
    cancelFilter: "إلغاء الفلتر",
    needHelp: "هل تحتاج إلى مساعدة إضافية؟",
    helpMessage: "فريق الدعم متاح لمساعدتك في أي استفسار. لا تتردد في التواصل معنا للحصول على المساعدة التي تحتاجها.",
    contactDirectly: "تواصل معنا مباشرة",
    errorLoading: "حدث خطأ أثناء تحميل الأسئلة. يرجى المحاولة مرة أخرى لاحقاً.",
    tryAgain: "إعادة المحاولة",
    questionOpened: "لقد تم فتح السؤال الذي بحثت عنه أدناه",
    noQuestionsAvailable: "لا توجد أسئلة شائعة حالياً",
    noTitle: "(بدون عنوان)",
    noAnswer: "لا يوجد جواب.",
    aboutUs: "من نحن",
    aboutUsDescription: "تعرف على رؤيتنا وقصتنا والفريق الذي يقف وراء فذلكة",
    heroTitle: "الأسئلة الشائعة",
    heroHighlight: "فريق فذلكه",
    heroSubtitle: "نحن هنا لمساعدتك. ابحث عن إجابات لأسئلتك الشائعة أو تواصل مع فريق فذلكه للحصول على الدعم الفني. نسعى دائماً لتقديم أفضل خدمة ممكنة.",
    contactTitle: "تواصل معنا",
    contactSubtitle: "فريق فذلكه متاح للإجابة على استفساراتك ومساعدتك",
    contactEmail: "البريد الإلكتروني",
    contactPhone: "الهاتف",
    contactAddress: "العنوان",
    goToContact: "انتقل إلى صفحة التواصل"
  },
  en: {
    home: "Home",
    content: "Content",
    episodes: "Episodes",
    playlists: "Playlists",
    seasons: "Seasons",
    articles: "Articles",
    about: "About",
    whoWeAre: "Who We Are",
    team: "Team",
    contact: "Contact",
    contactUs: "Contact Us",
    faq: "FAQ",
    search: "Search for a question or keyword...",
    searchResults: "Search Results",
    noResults: "No matching results",
    searching: "Searching...",
    viewAllResults: "View All Results",
    signIn: "Sign In",
    signUp: "Sign Up",
    manageAccount: "Manage Account",
    favorites: "My Favorites",
    signOut: "Sign Out",
    notifications: "Notifications",
    viewAll: "View All",
    noNotifications: "No new notifications",
    loading: "Loading...",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    episode: "Episode",
    article: "Article",
    playlist: "Playlist",
    faqItem: "FAQ",
    season: "Season",
    teamMember: "Team Member",
    termsItem: "Terms & Conditions",
    privacyItem: "Privacy Policy",
    darkMode: "Toggle Dark Mode",
    language: "Toggle Language",
    copyright: "© {year} Falthaka",
    pageTitle: "Frequently Asked Questions",
    pageSubtitle: "Answers to your inquiries about our platform and educational services",
    searchButton: "Search for a question",
    contactButton: "Contact us",
    faqSectionTitle: "Frequently Asked Questions",
    faqSectionSubtitle: "Answers to your inquiries about our platform and educational services",
    categories: "Categories",
    allCategories: "All Categories",
    filterBy: "Filter by:",
    removeFilter: "Remove Filter",
    noQuestions: "No questions",
    noQuestionsMessage: "No questions match your search or selected category",
    clearSearch: "Clear Search",
    cancelFilter: "Cancel Filter",
    needHelp: "Need additional help?",
    helpMessage: "Our support team is available to help you with any inquiry. Don't hesitate to contact us to get help you need.",
    contactDirectly: "Contact us directly",
    errorLoading: "An error occurred while loading questions. Please try again later.",
    tryAgain: "Try Again",
    questionOpened: "The question you searched for has been opened below",
    noQuestionsAvailable: "No frequently asked questions available at the moment",
    noTitle: "(No title)",
    noAnswer: "No answer available.",
    aboutUs: "About Us",
    aboutUsDescription: "Learn about our vision, story, and the team behind Falthaka",
    heroTitle: "Frequently Asked Questions",
    heroHighlight: "Falthaka Team",
    heroSubtitle: "We're here to help. Find answers to your frequently asked questions or contact the Falthaka team for technical support. We always strive to provide the best possible service.",
    contactTitle: "Contact Us",
    contactSubtitle: "The Falthaka team is available to answer your inquiries and help you",
    contactEmail: "Email",
    contactPhone: "Phone",
    contactAddress: "Address",
    goToContact: "Go to Contact Page"
  }
};

function FaqContent() {
  const { isRTL, language } = useLanguage();

  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const faqIdFromSearch = searchParams.get("faq");

  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [contentHeights, setContentHeights] = useState<Record<string, string>>({});

  const t = translations[language];

  useEffect(() => {
    setMounted(true);
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    function measure() {
      const heights: Record<string, string> = {};
      Object.entries(contentRefs.current).forEach(([id, el]) => {
        if (el) heights[id] = `${el.scrollHeight}px`;
      });
      setContentHeights(heights);
    }
    const timeout = setTimeout(measure, 30);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", measure);
    };
  }, [faqs]);

  useEffect(() => {
    if (faqIdFromSearch && faqs.length > 0) {
      const faq = faqs.find(f => f.id === faqIdFromSearch);
      if (faq) {
        setOpenFaq(faq.id);
        setTimeout(() => {
          const element = document.getElementById(`faq-${faq.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  }, [faqIdFromSearch, faqs]);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch = searchTerm.trim()
      ? faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.questionEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answerEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.categoryEn.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesCategory = activeCategory
      ? (language === 'ar' ? faq.category : faq.categoryEn) === activeCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id: string) => {
    const el = contentRefs.current[id];
    if (el) {
      const h = `${el.scrollHeight}px`;
      setContentHeights((s) => ({ ...s, [id]: h }));
    }
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  const setContentRef = (id: string) => (el: HTMLDivElement | null) => {
    contentRefs.current[id] = el;
  };

  const categories = Array.from(new Set(
    faqs.map(faq => language === 'ar' ? faq.category : faq.categoryEn)
  )) as string[];

  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = faqs.filter(faq =>
      language === 'ar' ? faq.category === category : faq.categoryEn === category
    ).length;
    return acc;
  }, {} as Record<string, number>);

  const HeroSection = () => (
    <div className="relative mb-12 overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-950"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10 animate-shimmer"></div>
      <div className="absolute -top-40 -right-40 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      <div className="relative z-10 py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className={`${isRTL ? 'lg:order-1' : 'lg:order-2'}`}>
            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
              <span className="text-white font-medium flex items-center text-sm sm:text-base">
                <FaQuestionCircle className="mr-2" />
                {t.faq}
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight ${isRTL ? '' : 'font-sans tracking-wide'}`}>
              {t.heroTitle} <span className="text-yellow-300">{t.heroHighlight}</span>
            </h1>
            <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl">
              <span className={isRTL ? '' : 'font-sans'}>
                {t.heroSubtitle}
              </span>
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <Link
                href="#faq-search"
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-all duration-300 flex items-center shadow-lg"
              >
                <FaSearch className="mr-2" />
                {t.search}
              </Link>
              <Link
                href="#contact-section"
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-all duration-300 flex items-center shadow-lg"
              >
                <FaComments className="mr-2" />
                {t.contactButton}
              </Link>
            </div>
          </div>
          <div className={`${isRTL ? 'lg:order-2' : 'lg:order-1'} flex justify-center items-center`}>
            <div className="relative w-full max-w-md mx-auto">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-2xl transform transition-all duration-500 hover:scale-105 animate-float">
                <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="h-8 bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      {faqs.slice(0, 3).map((faq) => (
                        <div key={faq.id} className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                            <FaQuestionCircle className="text-white text-xl" />
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-center">
                      <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center">
                        <FaSearch className="mr-2" />
                        {t.search}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                <FaQuestionCircle className="text-white text-xl" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-400 to-blue-500 p-3 rounded-full shadow-lg animate-float" style={{ animationDelay: '2s' }}>
                <FaLightbulb className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-shimmer" style={{ animationDelay: '1s', animationDirection: 'reverse' }}></div>
    </div>
  );

  const AboutUsSection = () => (
    <motion.div
      initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="mb-12"
    >
      <div className="relative bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-3xl p-6 md:p-8 border border-teal-100 dark:border-teal-800 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
            <div className="flex items-center justify-center md:justify-start mb-4">
              <div className="bg-teal-100 dark:bg-teal-800/50 p-4 rounded-full shadow-lg">
                <FaInfoCircle className="text-teal-600 dark:text-teal-300 text-3xl" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {t.aboutUs}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl">
              {t.aboutUsDescription}
            </p>
          </div>
          <Link href="/about">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold py-4 px-8 md:px-10 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center transform hover:-translate-y-1"
            >
              {t.aboutUs}
              <FaArrowRight className={`${isRTL ? 'ml-3' : 'mr-3'} text-xl`} />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );

  const ContactSection = () => (
    <motion.div
      id="contact-section"
      initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mb-12"
    >
      <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-6 md:p-8 border border-indigo-100 dark:border-indigo-800 text-center overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 dark:bg-indigo-800/50 p-5 rounded-full shadow-lg">
              <FaHeadset className="text-indigo-600 dark:text-indigo-300 text-4xl" />
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t.contactTitle}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            {t.contactSubtitle}
          </p>
          <Link href="/contact">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 md:px-10 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center mx-auto transform hover:-translate-y-1"
            >
              {t.goToContact}
              <FaArrowRight className={`${isRTL ? 'ml-3' : 'mr-3'} text-xl`} />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      <div className="container mx-auto max-w-5xl relative z-10">
        <HeroSection />

        <motion.main
          id="faq-search"
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 relative shadow-xl border border-gray-200 dark:border-gray-700 mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 flex flex-col md:flex-row items-center justify-center md:justify-start">
                <motion.div animate={reduceMotion ? {} : { rotate: [0, 5, 0, -5, 0] }} transition={{ repeat: Infinity, duration: 6, repeatDelay: 3, ease: "easeInOut" }}>
                  <FaQuestionCircle className={`w-8 h-8 md:w-10 md:h-10 ${isRTL ? 'ml-3' : 'mr-3'} text-indigo-600 dark:text-indigo-400`} />
                </motion.div>
                <span className="mt-2 md:mt-0">{t.faqSectionTitle}</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-base md:text-lg">{t.faqSectionSubtitle}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-grow">
              <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full p-3 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300`}
                suppressHydrationWarning={true}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300`}>
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setActiveCategory(activeCategory ? null : (language === 'ar' ? categories[0] : categories[0]))} suppressHydrationWarning={true} className="flex items-center justify-center w-full md:w-auto px-4 md:px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all duration-300">
                <FaFilter className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="truncate">{activeCategory ? activeCategory : t.categories}</span>
                {activeCategory && (<span className={`${isRTL ? 'ml-2' : 'mr-2'} bg-white text-indigo-600 text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0`}>1</span>)}
              </button>

              {activeCategory && (
                <div className={`absolute z-40 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto ${isRTL ? 'right-0' : 'left-0'}`}>
                  {categories.map((category) => (
                    <div key={category} className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 flex items-center justify-between ${activeCategory === category ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`} onClick={() => setActiveCategory(category)}>
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{category}</span>
                      <span className={`${isRTL ? 'ml-2' : 'mr-2'} text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full flex-shrink-0`}>{categoryCounts[category] || 0}</span>
                    </div>
                  ))}
                  <div className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200" onClick={() => setActiveCategory(null)}>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t.allCategories}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeCategory && (
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400">{isRTL ? ' : ' : ''}{t.filterBy}</span>
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium truncate max-w-xs">{activeCategory}</span>
                <span className="text-gray-600 dark:text-gray-400">{isRTL ? '' : ' : '}</span>
              </div>
              <button onClick={() => setActiveCategory(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center flex-shrink-0">
                <FaTimes className={`${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t.removeFilter}
              </button>
            </div>
          )}

          {faqIdFromSearch && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-700 dark:text-blue-300 flex items-center">
                <FaInfoCircle className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.questionOpened}
              </p>
            </motion.div>
          )}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">{t.noQuestions}</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">{searchTerm || activeCategory ? t.noQuestionsMessage : t.noQuestionsAvailable}</p>
              {(searchTerm || activeCategory) && (
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {searchTerm && (<button onClick={() => setSearchTerm("")} className="px-6 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors font-medium">{t.clearSearch}</button>)}
                  {activeCategory && (<button onClick={() => setActiveCategory(null)} className="px-6 py-3 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors font-medium">{t.cancelFilter}</button>)}
                </div>
              )}
            </div>
          )}

          {filteredFaqs.length > 0 && (
            <div className="space-y-4">
              {filteredFaqs.map((f) => {
                const isOpen = openFaq === f.id;
                const question = language === 'ar' ? f.question : f.questionEn;
                const answer = language === 'ar' ? f.answer : f.answerEn;
                const category = language === 'ar' ? f.category : f.categoryEn;

                return (
                  <motion.div key={f.id} id={`faq-${f.id}`} initial={reduceMotion ? {} : { opacity: 0, y: 10 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300 ${isOpen ? 'shadow-lg' : 'shadow-sm'}`}>
                    <button
                      onClick={() => toggleFaq(f.id)}
                      aria-expanded={isOpen}
                      className="w-full p-5 text-left flex items-start justify-between bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 transition-colors duration-200"
                      suppressHydrationWarning={true}
                    >
                      <div className="flex items-start min-w-0 flex-1 gap-4">
                        <div className="p-2 rounded-lg bg-white/20 flex-shrink-0 mt-1">
                          <FaQuestionCircle className="text-white text-lg" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-semibold text-white text-lg leading-tight ${isRTL ? 'text-right' : 'text-left'}`}>{question || t.noTitle}</h3>
                          {category && (
                            <span className="inline-block mt-2 px-3 py-1 bg-white/20 text-white text-xs rounded-full">
                              {category}
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.span
                        animate={reduceMotion ? {} : { rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className={`${isRTL ? 'mr-3' : 'ml-3'} flex-shrink-0 text-white mt-2`}
                        aria-hidden
                      >
                        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                      </motion.span>
                    </button>

                    <motion.div
                      ref={setContentRef(f.id)}
                      style={{ maxHeight: isOpen ? contentHeights[f.id] ?? undefined : 0, overflow: "hidden", transition: reduceMotion ? undefined : "max-height 200ms ease, opacity 200ms ease", opacity: isOpen ? 1 : 0 }}
                      aria-hidden={!isOpen}
                    >
                      <div className="p-6 pt-0">
                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{answer || t.noAnswer}</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.main>

        <AboutUsSection />
        <ContactSection />
      </div>

      <style jsx global>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 3s infinite; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.3; } }
        .animate-pulse-slow { animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes float-animation { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .float-animation { animation: float-animation 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      <Head>
        <title>الأسئلة الشائعة - فذلكة | Frequently Asked Questions - Falthaka</title>
        <meta name="description" content="إجابات على الأسئلة الأكثر شيوعاً حول منصة فذلكة وخدماتنا التعليمية. Find answers to frequently asked questions about our platform and educational services." />
        <meta name="keywords" content="أسئلة شائعة, فذلكة, قناة علمية, يوتيوب, تعليم, FAQ, Falthaka" />
        <meta property="og:title" content="الأسئلة الشائعة - فذلكة | Frequently Asked Questions - Falthaka" />
        <meta property="og:description" content="إجابات على الأسئلة الأكثر شيوعاً حول منصة فذلكة وخدماتنا التعليمية." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://falthaka.com/faq" />
      </Head>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>}>
        <FaqContent />
      </Suspense>
    </>
  );
}
