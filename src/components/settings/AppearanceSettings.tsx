"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/Language/LanguageProvider"
import { Sun, Moon, Type, Globe, Palette, Check } from "lucide-react"

const translations = {
  ar: {
    appearanceSettings: "إعدادات المظهر",
    theme: "السمة",
    darkMode: "الوضع الليلي",
    lightMode: "الوضع النهاري",
    languageSettings: "اللغة",
    arabic: "العربية",
    english: "English",
    fontSize: "حجم الخط",
    small: "صغير",
    medium: "متوسط",
    large: "كبير",
    previewText: "نص تجريبي",
    customizeExperience: "خصّص تجربتك البصرية",
    themeDesc: "اختر المظهر المناسب لك",
    languageDesc: "غيّر لغة واجهة التطبيق",
    fontDesc: "اضبط حجم النص حسب رغبتك",
  },
  en: {
    appearanceSettings: "Appearance Settings",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    languageSettings: "Language",
    arabic: "العربية",
    english: "English",
    fontSize: "Font Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    previewText: "Preview Text",
    customizeExperience: "Customize your visual experience",
    themeDesc: "Choose the look that suits you",
    languageDesc: "Change the app interface language",
    fontDesc: "Adjust text size to your preference",
  }
}

const fontSizes = [
  { key: "small", label: "A", scale: "text-xs" },
  { key: "medium", label: "A", scale: "text-sm" },
  { key: "large", label: "A", scale: "text-base" },
]

export default function AppearanceSettings() {
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  const [isDark, setIsDark] = useState(false)
  const [fontSize, setFontSize] = useState("medium")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedDark = localStorage.getItem("darkMode")
    if (savedDark !== null) {
      setIsDark(savedDark === "true")
      if (savedDark === "true") document.documentElement.classList.add("dark")
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setIsDark(prefersDark)
      if (prefersDark) document.documentElement.classList.add("dark")
    }
    const savedFont = localStorage.getItem("fontSize")
    if (savedFont) {
      setFontSize(savedFont)
      document.documentElement.classList.add(`font-${savedFont}`)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem("darkMode", String(isDark))
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark, mounted])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.remove("font-small", "font-medium", "font-large")
    document.documentElement.classList.add(`font-${fontSize}`)
    localStorage.setItem("fontSize", fontSize)
  }, [fontSize, mounted])

  const toggleLanguage = () => {
    localStorage.setItem("language", isRTL ? "en" : "ar")
    window.location.reload()
  }

  if (!mounted) return null

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.appearanceSettings}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.customizeExperience}</p>
      </div>

      {/* Theme */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{t.theme}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.themeDesc}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setIsDark(false)}
            className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
              !isDark
                ? "border-blue-500 shadow-lg shadow-blue-500/10"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            {!isDark && (
              <div className="absolute top-3 left-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            )}
            <div className="h-20 bg-gradient-to-b from-blue-50 to-white rounded-xl mb-4 flex items-center justify-center border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center shadow-md">
                <Sun className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.lightMode}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{language === "ar" ? "خلفية فاتحة" : "Bright background"}</p>
          </button>

          <button
            onClick={() => setIsDark(true)}
            className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
              isDark
                ? "border-blue-500 shadow-lg shadow-blue-500/10"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            {isDark && (
              <div className="absolute top-3 left-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            )}
            <div className="h-20 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl mb-4 flex items-center justify-center border border-gray-700">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
                <Moon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.darkMode}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{language === "ar" ? "خلفية داكنة" : "Dark background"}</p>
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{t.languageSettings}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.languageDesc}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => { if (!isRTL) toggleLanguage() }}
            className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 ${
              isRTL
                ? "border-blue-500 shadow-lg shadow-blue-500/10"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            {isRTL && (
              <div className="absolute top-3 left-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            )}
            <div className="flex flex-col items-center justify-center py-2">
              <span className="text-3xl mb-2">🇸🇦</span>
              <p className="font-bold text-gray-900 dark:text-white">{t.arabic}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">RTL</p>
            </div>
          </button>

          <button
            onClick={() => { if (isRTL) toggleLanguage() }}
            className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 ${
              !isRTL
                ? "border-blue-500 shadow-lg shadow-blue-500/10"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            {!isRTL && (
              <div className="absolute top-3 left-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            )}
            <div className="flex flex-col items-center justify-center py-2">
              <span className="text-3xl mb-2">🇺🇸</span>
              <p className="font-bold text-gray-900 dark:text-white">{t.english}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">LTR</p>
            </div>
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Type className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{t.fontSize}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.fontDesc}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-700/50">
            <p className={`text-gray-800 dark:text-gray-200 ${fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-base" : "text-sm"}`}>
              {t.previewText} — {language === "ar" ? "هذا نص تجريبي لعرض حجم الخط الحالي" : "This is sample text to preview the current font size"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {fontSizes.map((size) => (
              <button
                key={size.key}
                onClick={() => setFontSize(size.key)}
                className={`flex-1 relative py-3 rounded-xl text-center transition-all duration-300 ${
                  fontSize === size.key
                    ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 shadow-sm"
                    : "bg-gray-100 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <span className={`font-bold ${size.key === "small" ? "text-sm" : size.key === "large" ? "text-xl" : "text-base"} ${fontSize === size.key ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}>
                  {size.label}
                </span>
                <p className={`text-[10px] mt-0.5 ${fontSize === size.key ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}>
                  {size.key === "small" ? t.small : size.key === "large" ? t.large : t.medium}
                </p>
                {fontSize === size.key && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
