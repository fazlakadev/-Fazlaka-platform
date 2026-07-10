"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  LogOut,
  Trash2,
  RefreshCw,
  Wifi,
} from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"

// ─────────────────────────────────────────────
// Translations
// ─────────────────────────────────────────────

const translations = {
  ar: {
    sessions: "الجلسات النشطة",
    subtitle: "إدارة الأجهزة المسجلة بحسابك. يمكنك رؤية مكان ووقت تسجيل الدخول من كل جهاز.",
    thisDevice: "هذا الجهاز",
    activeNow: "نشط الآن",
    lastActive: "آخر نشاط",
    signedInAt: "سجل الدخول في",
    ip: "العنوان IP",
    device: "الجهاز",
    browser: "المتصفح",
    os: "نظام التشغيل",
    location: "الموقع",
    revokeSession: "حذف الجلسة",
    revokeAllOthers: "حذف جميع الجلسات الأخرى",
    revokeAllConfirm: "هل أنت متأكد من حذف جميع الجلسات الأخرى؟",
    revokeAllWarning: "ستضطر جميع الأجهزة الأخرى إلى تسجيل الدخول مجدداً.",
    revokeConfirmTitle: "تأكيد حذف الجلسة",
    revokeConfirmMsg: "سيتم تسجيل الخروج من هذا الجهاز فوراً ولا يمكن التراجع.",
    noSessions: "لا توجد جلسات نشطة",
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجاح",
    sessionRevoked: "تم حذف الجلسة بنجاح",
    allRevoked: "تم حذف جميع الجلسات الأخرى بنجاح",
    revokeFailed: "فشل في حذف الجلسة",
    revokeAllFailed: "فشل في حذف الجلسات",
    desktop: "كمبيوتر",
    mobile: "موبايل",
    tablet: "تابلت",
    unknown: "غير معروف",
    localDev: "جهاز محلي",
    minutesAgo: "منذ {n} دقيقة",
    hoursAgo: "منذ {n} ساعة",
    daysAgo: "منذ {n} يوم",
    justNow: "الآن",
    securityNote: "سيتم تسجيل الخروج من هذا الجهاز فوراً. سيتعين عليه إعادة تسجيل الدخول للوصول مرة أخرى.",
    confirm: "تأكيد الحذف",
    cancel: "إلغاء",
  },
  en: {
    sessions: "Active Sessions",
    subtitle: "Manage devices logged into your account. You can see where and when each session was active.",
    thisDevice: "This device",
    activeNow: "Active now",
    lastActive: "Last active",
    signedInAt: "Signed in at",
    ip: "IP Address",
    device: "Device",
    browser: "Browser",
    os: "OS",
    location: "Location",
    revokeSession: "Revoke session",
    revokeAllOthers: "Sign out of all other sessions",
    revokeAllConfirm: "Are you sure you want to revoke all other sessions?",
    revokeAllWarning: "You'll need to sign in again on all other devices.",
    revokeConfirmTitle: "Confirm session revocation",
    revokeConfirmMsg: "This device will be signed out immediately. This action cannot be undone.",
    noSessions: "No active sessions",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    sessionRevoked: "Session revoked successfully",
    allRevoked: "All other sessions revoked successfully",
    revokeFailed: "Failed to revoke session",
    revokeAllFailed: "Failed to revoke sessions",
    desktop: "Desktop",
    mobile: "Mobile",
    tablet: "Tablet",
    unknown: "Unknown",
    localDev: "Local",
    minutesAgo: "{n} minutes ago",
    hoursAgo: "{n} hours ago",
    daysAgo: "{n} days ago",
    justNow: "Just now",
    securityNote: "This device will be signed out immediately. You'll need to sign in again to access your account.",
    confirm: "Confirm revoke",
    cancel: "Cancel",
  },
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface SessionRow {
  id: string
  jti: string
  ip: string | null
  device: string | null
  deviceType: string | null
  browser: string | null
  browserVersion: string | null
  os: string | null
  osVersion: string | null
  location: { country: string; city: string; flag: string } | null
  createdAt: string
  lastActive: string
  expiresAt: string
  isRevoked: boolean
  isCurrent?: boolean
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function relativeTime(iso: string, language: "ar" | "en"): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 60) return language === "ar" ? "الآن" : "Just now"
  const min = Math.floor(diffSec / 60)
  if (diffSec < 3600)
    return language === "ar"
      ? `منذ ${min} دقيقة${min > 2 ? "" : ""}`
      : `${min} minute${min > 1 ? "s" : ""} ago`
  const hrs = Math.floor(diffSec / 3600)
  if (diffSec < 86400)
    return language === "ar" ? `منذ ${hrs} ساعة` : `${hrs} hour${hrs > 1 ? "s" : ""} ago`
  const days = Math.floor(diffSec / 86400)
  return language === "ar" ? `منذ ${days} يوم` : `${days} day${days > 1 ? "s" : ""} ago`
}

function deviceIcon(type: string | null) {
  switch (type) {
    case "mobile":
      return <Smartphone className="w-5 h-5" />
    case "tablet":
      return <Tablet className="w-5 h-5" />
    case "desktop":
    default:
      return <Monitor className="w-5 h-5" />
  }
}

function browserBadge(browser: string | null) {
  const colorMap: Record<string, string> = {
    Chrome: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Firefox: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    Safari: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Edge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    Opera: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "Samsung Internet": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  }
  const cls = colorMap[browser ?? ""] ?? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {browser ?? "Unknown"}
    </span>
  )
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function SessionsSettings() {
  const { status } = useSession()
  const { isRTL, language } = useLanguage()
  const t = translations[language]

  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isRevokingAll, setIsRevokingAll] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false)
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)

  // ── Fetch sessions ──
  const fetchSessions = useCallback(async () => {
    if (status !== "authenticated") return
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/user/sessions")
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } catch {
      setError(t.error)
    } finally {
      setIsLoading(false)
    }
  }, [status, t.error])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // ── Revoke single ──
  const handleRevoke = async (sessionId: string) => {
    setError("")
    setSuccess("")
    setRevokingId(sessionId)
    try {
      const res = await fetch(`/api/user/sessions/${sessionId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      setSuccess(t.sessionRevoked)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      const revoked = sessions.find((s) => s.id === sessionId)
      if (revoked?.isCurrent) {
        signOut({ callbackUrl: "/sign-in" })
      }
    } catch {
      setError(t.revokeFailed)
    } finally {
      setRevokingId(null)
      setConfirmRevokeId(null)
    }
  }

  // ── Revoke all others ──
  const handleRevokeAll = async () => {
    setError("")
    setSuccess("")
    setIsRevokingAll(true)
    try {
      const res = await fetch("/api/user/sessions", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setSuccess(data.message || t.allRevoked)
      setSessions((prev) => prev.filter((s) => s.isCurrent))
      setConfirmRevokeAll(false)
    } catch {
      setError(t.revokeAllFailed)
    } finally {
      setIsRevokingAll(false)
    }
  }

  // ── Clear messages after delay ──
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("")
        setError("")
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const currentSession = sessions.find((s) => s.isCurrent)
  const otherSessions = sessions.filter((s) => !s.isCurrent)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.sessions}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.subtitle}</p>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800/30 flex items-start ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={isRTL ? { marginLeft: "0.5rem" } : { marginRight: "0.5rem" }} />
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800/30 flex items-start ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={isRTL ? { marginLeft: "0.5rem" } : { marginRight: "0.5rem" }} />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security note */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
        <div className={`flex items-start ${isRTL ? "flex-row-reverse" : ""}`}>
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" style={isRTL ? { marginLeft: "0.5rem" } : { marginRight: "0.5rem" }} />
          <p className="text-sm text-blue-700 dark:text-blue-300">{t.securityNote}</p>
        </div>
      </div>

      {/* Current Session */}
      {currentSession && (
        <SessionCard
          session={currentSession}
          isCurrent={true}
          t={t}
          isRTL={isRTL}
          language={language}
                onRevoke={() => setConfirmRevokeId(currentSession.id)}
          isRevoking={revokingId === currentSession.id}
        />
      )}

      {/* Other Sessions */}
      {otherSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === "ar" ? "جلسات أخرى" : "Other sessions"} ({otherSessions.length})
            </h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setConfirmRevokeAll(true)}
              disabled={isRevokingAll}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
            >
              {isRevokingAll ? (
                <RefreshCw className="w-4 h-4 animate-spin" style={isRTL ? { marginLeft: "0.5rem" } : { marginRight: "0.5rem" }} />
              ) : (
                <LogOut className="w-4 h-4" style={isRTL ? { marginLeft: "0.5rem" } : { marginRight: "0.5rem" }} />
              )}
              {t.revokeAllOthers}
            </motion.button>
          </div>
          <div className="space-y-3">
            {otherSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                isCurrent={false}
                t={t}
                isRTL={isRTL}
                language={language}
                onRevoke={() => setConfirmRevokeId(s.id)}
                isRevoking={revokingId === s.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sessions.length === 0 && (
        <div className="text-center py-12">
          <Wifi className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t.noSessions}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Confirm revoke single session modal */}
      <AnimatePresence>
        {confirmRevokeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmRevokeId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm mx-4 border border-gray-200 dark:border-gray-700"
            >
              <div className={`flex items-center gap-3 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.revokeConfirmTitle}</h3>
              </div>
              <p className={`text-sm text-gray-600 dark:text-gray-400 mb-2 ${isRTL ? "text-right" : ""}`}>{t.revokeConfirmMsg}</p>
              <p className={`text-xs text-red-600 dark:text-red-400 mb-6 ${isRTL ? "text-right" : ""}`}>{t.securityNote}</p>
              <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button
                  onClick={() => setConfirmRevokeId(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => handleRevoke(confirmRevokeId)}
                  disabled={revokingId === confirmRevokeId}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                >
                  {revokingId === confirmRevokeId ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {t.confirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm revoke all modal */}
      <AnimatePresence>
        {confirmRevokeAll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmRevokeAll(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm mx-4 border border-gray-200 dark:border-gray-700"
            >
              <div className={`flex items-center gap-3 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                  <LogOut className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.revokeAllOthers}</h3>
              </div>
              <p className={`text-sm text-gray-600 dark:text-gray-400 mb-2 ${isRTL ? "text-right" : ""}`}>{t.revokeAllConfirm}</p>
              <p className={`text-xs text-red-600 dark:text-red-400 mb-6 ${isRTL ? "text-right" : ""}`}>{t.revokeAllWarning}</p>
              <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button
                  onClick={() => setConfirmRevokeAll(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleRevokeAll}
                  disabled={isRevokingAll}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                >
                  {isRevokingAll ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  {t.confirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────
// Session Card
// ─────────────────────────────────────────────

function SessionCard({
  session,
  isCurrent,
  t,
  isRTL,
  language,
  onRevoke,
  isRevoking,
}: {
  session: SessionRow
  isCurrent: boolean
  t: typeof translations.ar
  isRTL: boolean
  language: "ar" | "en"
  onRevoke: () => void
  isRevoking: boolean
}) {
  const [expanded, setExpanded] = useState(isCurrent)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden transition-colors ${
        isCurrent
          ? "border-green-200 dark:border-green-700/50 ring-1 ring-green-100 dark:ring-green-900/30"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* Header row */}
      <div
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          {/* Device icon */}
          <div
            className={`flex-shrink-0 p-2 rounded-xl ${
              isCurrent
                ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
          >
            {deviceIcon(session.deviceType)}
          </div>
          <div>
            <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {session.device ?? session.os ?? t.unknown}
              </span>
              {isCurrent && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  {t.thisDevice}
                </span>
              )}
            </div>
            <div className={`flex items-center gap-2 mt-0.5 ${isRTL ? "flex-row-reverse" : ""}`}>
              {browserBadge(session.browser)}
              {session.os && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {session.os}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          {/* Active indicator */}
          <span className={`w-2 h-2 rounded-full ${isCurrent ? "bg-green-500 animate-pulse" : "bg-gray-400 dark:bg-gray-500"}`} />
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700/50">
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <DetailItem
                  icon={<Monitor className="w-4 h-4" />}
                  label={t.device}
                  value={session.device ?? t.unknown}
                  isRTL={isRTL}
                />
                <DetailItem
                  icon={<Globe className="w-4 h-4" />}
                  label={t.browser}
                  value={session.browser ?? t.unknown}
                  isRTL={isRTL}
                />
                <DetailItem
                  icon={<Wifi className="w-4 h-4" />}
                  label={t.ip}
                  value={session.ip ?? "—"}
                  isRTL={isRTL}
                />
                <DetailItem
                  icon={<MapPin className="w-4 h-4" />}
                  label={t.location}
                  value={
                    session.location
                      ? `${session.location.flag} ${session.location.city}, ${session.location.country}`
                      : session.ip
                        ? t.localDev
                        : t.unknown
                  }
                  isRTL={isRTL}
                />
                <DetailItem
                  icon={<Clock className="w-4 h-4" />}
                  label={t.lastActive}
                  value={relativeTime(session.lastActive, language)}
                  isRTL={isRTL}
                />
                <DetailItem
                  icon={<Clock className="w-4 h-4" />}
                  label={t.signedInAt}
                  value={relativeTime(session.createdAt, language)}
                  isRTL={isRTL}
                />
                <DetailItem
                  icon={<MapPin className="w-4 h-4" />}
                  label={t.os}
                  value={session.os ?? t.unknown}
                  isRTL={isRTL}
                />
              </div>

              {/* Revoke button */}
              <div className="mt-4 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRevoke()
                  }}
                  disabled={isRevoking}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-all"
                >
                  {isRevoking ? (
                    <RefreshCw className="w-4 h-4 animate-spin" style={isRTL ? { marginLeft: "0.5rem" } : { marginRight: "0.5rem" }} />
                  ) : (
                    <Trash2 className="w-4 h-4" style={isRTL ? { marginLeft: "0.5rem" } : { marginRight: "0.5rem" }} />
                  )}
                  {t.revokeSession}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Detail Item (reused inside each card)
// ─────────────────────────────────────────────

function DetailItem({
  icon,
  label,
  value,
  isRTL,
}: {
  icon: React.ReactNode
  label: string
  value: string
  isRTL: boolean
}) {
  return (
    <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
      <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{icon}</span>
      <span className="text-gray-500 dark:text-gray-400 text-xs">{label}:</span>
      <span className="text-gray-900 dark:text-white text-xs font-medium truncate">{value}</span>
    </div>
  )
}
