"use client"

import { useLanguage } from "@/components/Language/LanguageProvider"
import { Facebook, Instagram, Youtube, Users, BookOpen } from "lucide-react"
import { FaTiktok, FaXTwitter } from "react-icons/fa6"
import { motion } from "framer-motion"

const socialLinks = [
  { href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA", icon: <Youtube className="w-5 h-5" />, label: "YouTube", color: "hover:bg-red-500/10 hover:text-red-500" },
  { href: "https://www.instagram.com/fazlaka_platform/", icon: <Instagram className="w-5 h-5" />, label: "Instagram", color: "hover:bg-pink-500/10 hover:text-pink-500" },
  { href: "https://www.facebook.com/profile.php?id=61579582675453", icon: <Facebook className="w-5 h-5" />, label: "Facebook", color: "hover:bg-blue-500/10 hover:text-blue-500" },
  { href: "https://www.tiktok.com/@fazlaka_platform", icon: <FaTiktok className="w-5 h-5" />, label: "TikTok", color: "hover:bg-gray-500/10 hover:text-gray-400" },
  { href: "https://x.com/FazlakaPlatform", icon: <FaXTwitter className="w-5 h-5" />, label: "Twitter", color: "hover:bg-blue-400/10 hover:text-blue-400" },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isRTL, language } = useLanguage()
  const t = language === "ar" ? {
    platformName: "فذلكه",
    platformDesc: "منصة تعليمية رائدة تقدم محتوى علمي مميز وتفاعلي",
    educationalContent: "محتوى تعليمي",
    educationalContentDesc: "دروس شاملة في مختلف المجالات العلمية",
    interactiveCommunity: "مجتمع تفاعلي",
    interactiveCommunityDesc: "تواصل مع زملائك وشارك المعرفة",
    followUs: "تابعنا على",
    whyChooseUs: "لماذا تختار منصتنا؟",
    reliableContent: "محتوى علمي موثوق ومحدث باستمرار",
    supportiveCommunity: "مجتمع تعليمي تفاعلي وداعم",
    resourceLibrary: "وصول لمكتبة ضخمة من الموارد التعليمية",
  } : {
    platformName: "fazlaka",
    platformDesc: "A leading educational platform offering distinctive and interactive scientific content",
    educationalContent: "Educational Content",
    educationalContentDesc: "Comprehensive lessons in various scientific fields",
    interactiveCommunity: "Interactive Community",
    interactiveCommunityDesc: "Connect with colleagues and share knowledge",
    followUs: "Follow Us On",
    whyChooseUs: "Why Choose Our Platform?",
    reliableContent: "Reliable and constantly updated scientific content",
    supportiveCommunity: "Interactive and supportive educational community",
    resourceLibrary: "Access to a huge library of educational resources",
  }

  const features = [
    { icon: <BookOpen className="w-6 h-6" />, title: t.educationalContent, desc: t.educationalContentDesc, color: "from-blue-500 to-cyan-500" },
    { icon: <Users className="w-6 h-6" />, title: t.interactiveCommunity, desc: t.interactiveCommunityDesc, color: "from-purple-500 to-indigo-500" },
  ]

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/50 to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-500 px-4 py-12 relative overflow-hidden ${isRTL ? "rtl" : "ltr"}`}>
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      {/* Ambient orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-blue-400/10 dark:bg-blue-400/5 blur-3xl" />
      <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-purple-400/10 dark:bg-purple-400/5 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-[100px]" />

      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Brand section */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-3/5 text-center lg:text-start order-2 lg:order-1"
          >
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
              {t.platformName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 max-w-lg mx-auto lg:mx-0">
              {t.platformDesc}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="p-4 rounded-2xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-3`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            <div>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">{t.followUs}</p>
              <div className={`flex gap-2 ${isRTL ? "flex-row-reverse justify-center lg:justify-start" : "justify-center lg:justify-start"}`}>
                {socialLinks.map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-all ${s.color}`}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div className={`mt-8 space-y-2 ${isRTL ? "text-right" : "text-left"}`}>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.whyChooseUs}</p>
              {[t.reliableContent, t.supportiveCommunity, t.resourceLibrary].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Form section */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full lg:w-2/5 order-1 lg:order-2"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
