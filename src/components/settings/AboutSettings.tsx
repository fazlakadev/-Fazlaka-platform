"use client"

import { useLanguage } from "@/components/Language/LanguageProvider"
import Link from "next/link"
import { Info, Bug, Lightbulb, HelpCircle, Shield, FileText, ArrowUpRight, Heart } from "lucide-react"

const translations = {
  ar: {
    aboutSettings: "حول",
    version: "الإصدار",
    reportProblem: "الإبلاغ عن مشكلة",
    reportProblemDesc: "واجهت مشكلة؟ ساعدنا في إصلاحها",
    suggestions: "اقتراحات",
    suggestionsDesc: "شاركنا أفكارك لتحسين الخدمة",
    faq: "الأسئلة الشائعة",
    faqDesc: "ابحث عن إجابات سريعة",
    privacy: "سياسة الخصوصية",
    privacyDesc: "كيف نحمي بياناتك",
    terms: "الشروط والأحكام",
    termsDesc: "شروط استخدام الخدمة",
    helpSection: "المساعدة والدعم",
    legalSection: "قانوني",
    systemInfo: "معلومات النظام",
    appDesc: "فذلكه - منصتك المفضلة للمحتوى",
    madeWith: "صُنع بكل حب",
  },
  en: {
    aboutSettings: "About",
    version: "Version",
    reportProblem: "Report a Problem",
    reportProblemDesc: "Facing an issue? Help us fix it",
    suggestions: "Suggestions",
    suggestionsDesc: "Share your ideas to improve",
    faq: "FAQ",
    faqDesc: "Find quick answers",
    privacy: "Privacy Policy",
    privacyDesc: "How we protect your data",
    terms: "Terms & Conditions",
    termsDesc: "Terms of service",
    helpSection: "Help & Support",
    legalSection: "Legal",
    systemInfo: "System Information",
    appDesc: "Fazlaka — Your favorite content platform",
    madeWith: "Made with love",
  }
}

export default function AboutSettings() {
  const { language } = useLanguage()
  const t = translations[language]

  const supportLinks = [
    { href: "/support", icon: Bug, title: t.reportProblem, desc: t.reportProblemDesc, color: "from-red-500 to-rose-600", shadow: "shadow-red-500/20", bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-600 dark:text-red-400" },
    { href: "/contact", icon: Lightbulb, title: t.suggestions, desc: t.suggestionsDesc, color: "from-emerald-500 to-green-600", shadow: "shadow-emerald-500/20", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400" },
    { href: "/faq", icon: HelpCircle, title: t.faq, desc: t.faqDesc, color: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20", bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-600 dark:text-violet-400" },
  ]

  const legalLinks = [
    { href: "/privacy-policy", icon: Shield, title: t.privacy, desc: t.privacyDesc, color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400" },
    { href: "/terms-conditions", icon: FileText, title: t.terms, desc: t.termsDesc, color: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.aboutSettings}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.appDesc}</p>
      </div>

      {/* System Info */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-6 text-white shadow-xl shadow-blue-500/20">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t.systemInfo}</h3>
              <p className="text-sm text-white/70">{language === "ar" ? "تفاصيل التطبيق" : "App details"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div>
              <p className="text-sm text-white/70">{t.version}</p>
              <p className="text-2xl font-bold">1.0.0</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="text-3xl font-bold">FD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Help & Support */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
          {t.helpSection}
        </h3>
        <div className="space-y-3">
          {supportLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className={`w-12 h-12 rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
                <link.icon className={`w-5 h-5 ${link.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">{link.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{link.desc}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Legal */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
          {t.legalSection}
        </h3>
        <div className="space-y-3">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className={`w-12 h-12 rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
                <link.icon className={`w-5 h-5 ${link.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">{link.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{link.desc}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
          <Heart className="w-3.5 h-3.5 text-red-400" />
          <span>{t.madeWith}</span>
        </div>
      </div>
    </div>
  )
}
