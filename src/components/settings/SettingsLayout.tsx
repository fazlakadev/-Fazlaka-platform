// components/settings/SettingsLayout.tsx

"use client"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation" // ← أضفنا useRouter
import { Edit, Shield, Globe, HelpCircle, LogOut, LogIn } from "lucide-react" // ← أضفنا LogIn
import { motion } from "framer-motion"

import { useLanguage } from "@/components/Language/LanguageProvider"

// Text translations
const translations = {
  ar: {
    settings: "الإعدادات",
    backToProfile: "العودة إلى الملف الشخصي",
    editProfile: "تعديل الملف الشخصي",
    accountSettings: "إعدادات الحساب",
    appearanceSettings: "إعدادات المظهر",
    aboutSettings: "حول",
    signOut: "تسجيل الخروج",
    signIn: "تسجيل الدخول", // ← إضافة نص جديد
  },
  en: {
    settings: "Settings",
    backToProfile: "Back to Profile",
    editProfile: "Edit Profile",
    accountSettings: "Account Settings",
    appearanceSettings: "Appearance Settings",
    aboutSettings: "About",
    signOut: "Sign Out",
    signIn: "Sign In", // ← إضافة نص جديد
  }
};

// تحديث الواجهة لقبول prop جديد
interface SettingsLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  authStatus: "loading" | "authenticated" | "unauthenticated"; // ← إضافة prop جديد
}

export default function SettingsLayout({ children, activeTab, setActiveTab, authStatus }: SettingsLayoutProps) {
  const router = useRouter() // ← استخدام useRouter
  const { isRTL, language } = useLanguage()
  const t = translations[language]

  const tabClassName = (tab: string) =>
    `relative w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-300 overflow-hidden ${
      activeTab === tab
        ? "text-blue-700 dark:text-cyan-200 shadow-sm"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-white/5"
    }`

  return (
    <div className={`min-h-screen flex flex-col bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#ecfeff_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_34%),linear-gradient(135deg,#020617_0%,#111827_52%,#172554_100%)] transition-colors duration-500 ${isRTL ? 'rtl' : ''}`}>
      {/* Empty space with header background at the top */}
      <div className="h-20 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl shadow-sm"></div>
      
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl shadow-sm border-b border-white/60 dark:border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-16">
              <motion.h1
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="text-xl font-semibold text-gray-900 dark:text-white"
              >
                {t.settings}
              </motion.h1>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="md:w-64 flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, x: isRTL ? 18 : -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="sticky top-24 bg-white/85 dark:bg-gray-900/75 backdrop-blur-2xl rounded-2xl shadow-xl shadow-blue-900/5 dark:shadow-black/30 p-3 space-y-1 border border-white/70 dark:border-white/10"
              >
                {/* ← عرض زر تعديل الملف الشخصي فقط إذا كان المستخدم مسجلاً */}
                {authStatus === "authenticated" && (
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={tabClassName("profile")}
                  >
                    {activeTab === "profile" && <motion.span layoutId="settingsActiveTab" className="absolute inset-0 bg-blue-100/90 dark:bg-cyan-500/10 rounded-lg" />}
                    <Edit className="h-5 w-5 mr-3" />
                    <span className="relative">{t.editProfile}</span>
                  </button>
                )}

                {/* ← عرض زر إعدادات الحساب فقط إذا كان المستخدم مسجلاً */}
                {authStatus === "authenticated" && (
                  <button
                    onClick={() => setActiveTab("security")}
                    className={tabClassName("security")}
                  >
                    {activeTab === "security" && <motion.span layoutId="settingsActiveTab" className="absolute inset-0 bg-blue-100/90 dark:bg-cyan-500/10 rounded-lg" />}
                    <Shield className="h-5 w-5 mr-3" />
                    <span className="relative">{t.accountSettings}</span>
                  </button>
                )}

                {/* ← زر المظهر متاح للجميع */}
                <button
                  onClick={() => setActiveTab("appearance")}
                  className={tabClassName("appearance")}
                >
                  {activeTab === "appearance" && <motion.span layoutId="settingsActiveTab" className="absolute inset-0 bg-blue-100/90 dark:bg-cyan-500/10 rounded-lg" />}
                  <Globe className="h-5 w-5 mr-3" />
                  <span className="relative">{t.appearanceSettings}</span>
                </button>

                {/* ← زر "حول" متاح للجميع */}
                <button
                  onClick={() => setActiveTab("about")}
                  className={tabClassName("about")}
                >
                  {activeTab === "about" && <motion.span layoutId="settingsActiveTab" className="absolute inset-0 bg-blue-100/90 dark:bg-cyan-500/10 rounded-lg" />}
                  <HelpCircle className="h-5 w-5 mr-3" />
                  <span className="relative">{t.aboutSettings}</span>
                </button>

                {/* ← عرض زر تسجيل الخروج أو تسجيل الدخول بناءً على الحالة */}
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  {authStatus === "authenticated" ? (
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      {t.signOut}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/sign-in")}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-left text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <LogIn className="h-5 w-5 mr-3" />
                      {t.signIn}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-blue-900/5 dark:shadow-black/30 p-6 border border-white/70 dark:border-white/10"
              >
                {children}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
