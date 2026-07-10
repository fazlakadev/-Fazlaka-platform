"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
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
  Signal,
} from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"
import { useTheme } from "next-themes"

const SessionMap = dynamic(() => import("./SessionMap"), { ssr: false })

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
    justNow: "الآن",
    securityNote: "سيتم تسجيل الخروج من هذا الجهاز فوراً. سيتعين عليه إعادة تسجيل الدخول للوصول مرة أخرى.",
    confirm: "تأكيد الحذف",
    cancel: "إلغاء",
    sessionInfo: "معلومات الجلسة",
    locationMap: "موقع الجلسة",
    activeSessions: "الجلسات النشطة",
    otherSessions: "جلسات أخرى",
    signedIn: "تاريخ التسجيل",
    lastActivity: "النشاط الأخير",
    deviceInfo: "معلومات الجهاز",
    connectionInfo: "معلومات الاتصال",
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
    justNow: "Just now",
    securityNote: "This device will be signed out immediately. You'll need to sign in again to access your account.",
    confirm: "Confirm revoke",
    cancel: "Cancel",
    sessionInfo: "Session Info",
    locationMap: "Session Location",
    activeSessions: "Active Sessions",
    otherSessions: "Other sessions",
    signedIn: "Signed in",
    lastActivity: "Last activity",
    deviceInfo: "Device Info",
    connectionInfo: "Connection Info",
  },
}

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
  location: { country: string; city: string; region: string; flag: string; lat: number; lng: number } | null
  createdAt: string
  lastActive: string
  expiresAt: string
  isRevoked: boolean
  isCurrent?: boolean
}

function relativeTime(iso: string, language: "ar" | "en"): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 60) return language === "ar" ? "الآن" : "Just now"
  const min = Math.floor(diffSec / 60)
  if (diffSec < 3600)
    return language === "ar"
      ? `منذ ${min} دقيقة`
      : `${min} minute${min > 1 ? "s" : ""} ago`
  const hrs = Math.floor(diffSec / 3600)
  if (diffSec < 86400)
    return language === "ar" ? `منذ ${hrs} ساعة` : `${hrs} hour${hrs > 1 ? "s" : ""} ago`
  const days = Math.floor(diffSec / 86400)
  return language === "ar" ? `منذ ${days} يوم` : `${days} day${days > 1 ? "s" : ""} ago`
}

function isActiveNow(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 2 * 60 * 1000
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
    Chrome: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-500/20",
    Firefox: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-500/20",
    Safari: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 ring-1 ring-purple-200 dark:ring-purple-500/20",
    Edge: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400 ring-1 ring-cyan-200 dark:ring-cyan-500/20",
    Opera: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-500/20",
    "Samsung Internet": "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-500/20",
  }
  const cls = colorMap[browser ?? ""] ?? "bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-500/20"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {browser ?? "Unknown"}
    </span>
  )
}

export default function SessionsSettings() {
  const { status } = useSession()
  const { isRTL, language } = useLanguage()
  const { resolvedTheme } = useTheme()
  const t = translations[language]

  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isRevokingAll, setIsRevokingAll] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false)
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)
  const [, setTick] = useState(0)

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

  useEffect(() => {
    const id = setInterval(() => setTick((p) => p + 1), 30000)
    return () => clearInterval(id)
  }, [])

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

  const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t.sessions}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.subtitle}</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800/30 flex items-start ${isRTL ? "flex-row-reverse" : ""}`}
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
            className={`p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/30 flex items-start ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={isRTL ? { marginLeft: "0.5rem" } : { marginRight: "0.5rem" }} />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-800/20">
        <div className={`flex items-start ${isRTL ? "flex-row-reverse" : ""}`}>
          <Shield className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" style={isRTL ? { marginLeft: "0.75rem" } : { marginRight: "0.75rem" }} />
          <p className="text-sm text-blue-600 dark:text-blue-300">{t.securityNote}</p>
        </div>
      </div>

      {currentSession && (
        <SessionCard
          session={currentSession}
          isCurrent={true}
          t={t}
          isRTL={isRTL}
          language={language}
          isDark={isDark}
          onRevoke={() => setConfirmRevokeId(currentSession.id)}
          isRevoking={revokingId === currentSession.id}
        />
      )}

      {otherSessions.length > 0 && (
        <div className="space-y-4">
          <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.otherSessions} ({otherSessions.length})
            </h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setConfirmRevokeAll(true)}
              disabled={isRevokingAll}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 ${isRTL ? "flex-row-reverse" : ""}`}
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
                isDark={isDark}
                onRevoke={() => setConfirmRevokeId(s.id)}
                isRevoking={revokingId === s.id}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && sessions.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Wifi className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t.noSessions}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      <AnimatePresence>
        {confirmRevokeId && (
          <ModalOverlay onClose={() => setConfirmRevokeId(null)}>
            <ModalCard isRTL={isRTL}>
              <div className={`flex items-center gap-3 mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.revokeConfirmTitle}</h3>
              </div>
              <p className={`text-sm text-gray-600 dark:text-gray-400 mb-2 ${isRTL ? "text-right" : ""}`}>{t.revokeConfirmMsg}</p>
              <p className={`text-xs text-red-500 dark:text-red-400 mb-6 ${isRTL ? "text-right" : ""}`}>{t.securityNote}</p>
              <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button onClick={() => setConfirmRevokeId(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                  {t.cancel}
                </button>
                <button
                  onClick={() => handleRevoke(confirmRevokeId)}
                  disabled={revokingId === confirmRevokeId}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                >
                  {revokingId === confirmRevokeId ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {t.confirm}
                </button>
              </div>
            </ModalCard>
          </ModalOverlay>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmRevokeAll && (
          <ModalOverlay onClose={() => setConfirmRevokeAll(false)}>
            <ModalCard isRTL={isRTL}>
              <div className={`flex items-center gap-3 mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                  <LogOut className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.revokeAllOthers}</h3>
              </div>
              <p className={`text-sm text-gray-600 dark:text-gray-400 mb-2 ${isRTL ? "text-right" : ""}`}>{t.revokeAllConfirm}</p>
              <p className={`text-xs text-red-500 dark:text-red-400 mb-6 ${isRTL ? "text-right" : ""}`}>{t.revokeAllWarning}</p>
              <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button onClick={() => setConfirmRevokeAll(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                  {t.cancel}
                </button>
                <button
                  onClick={handleRevokeAll}
                  disabled={isRevokingAll}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                >
                  {isRevokingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  {t.confirm}
                </button>
              </div>
            </ModalCard>
          </ModalOverlay>
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
  isDark,
  onRevoke,
  isRevoking,
}: {
  session: SessionRow
  isCurrent: boolean
  t: typeof translations.ar
  isRTL: boolean
  language: "ar" | "en"
  isDark: boolean
  onRevoke: () => void
  isRevoking: boolean
}) {
  const [expanded, setExpanded] = useState(isCurrent)
  const active = useMemo(() => isActiveNow(session.lastActive), [session.lastActive])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-2xl shadow-sm border overflow-hidden transition-all duration-200 ${
        isCurrent
          ? "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-gray-800 border-emerald-200 dark:border-emerald-800/40"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isRTL ? "flex-row-reverse" : ""} ${expanded ? "border-b border-gray-100 dark:border-gray-700/40" : ""}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={`flex-shrink-0 p-2.5 rounded-xl transition-colors ${
            isCurrent
              ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400"
          }`}>
            {deviceIcon(session.deviceType)}
          </div>
          <div>
            <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {session.device ?? session.os ?? t.unknown}
              </span>
              {isCurrent && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/20">
                  {t.thisDevice}
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1.5 mt-1 ${isRTL ? "flex-row-reverse" : ""}`}>
              {browserBadge(session.browser)}
              {session.os && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {session.os}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          {isCurrent && active ? (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t.activeNow}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {relativeTime(session.lastActive, language)}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-5">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoBlock
                  icon={<Monitor className="w-4 h-4" />}
                  label={t.device}
                  value={session.device ?? t.unknown}
                  sub={session.os}
                  isRTL={isRTL}
                />
                <InfoBlock
                  icon={<Globe className="w-4 h-4" />}
                  label={t.browser}
                  value={session.browser ?? t.unknown}
                  sub={session.browserVersion}
                  isRTL={isRTL}
                />
                <InfoBlock
                  icon={<Wifi className="w-4 h-4" />}
                  label={t.ip}
                  value={session.ip ?? "—"}
                  isRTL={isRTL}
                />
                <InfoBlock
                  icon={<Clock className="w-4 h-4" />}
                  label={t.signedInAt}
                  value={relativeTime(session.createdAt, language)}
                  isRTL={isRTL}
                />
                <InfoBlock
                  icon={<Signal className="w-4 h-4" />}
                  label={t.lastActive}
                  value={active ? t.activeNow : relativeTime(session.lastActive, language)}
                  highlight={active}
                  isRTL={isRTL}
                />
                <InfoBlock
                  icon={<Shield className="w-4 h-4" />}
                  label={t.os}
                  value={session.os ?? t.unknown}
                  sub={session.osVersion}
                  isRTL={isRTL}
                />
              </div>

              {/* Location Map Section — always visible */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-sm">
                <div className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/80 dark:to-gray-800/40 border-b border-gray-200 dark:border-gray-700/50 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/15">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.locationMap}</span>
                  </div>
                  {session.location ? (
                    <div className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <span className="text-sm">{session.location.flag}</span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {session.location.region || session.location.city}{(session.location.region || session.location.city) && session.location.country ? ", " : ""}{session.location.country}
                      </span>
                    </div>
                  ) : session.ip ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{session.ip}</span>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                  )}
                </div>
                {session.location && session.location.lat && session.location.lng ? (
                  <div className="h-[220px]">
                    <SessionMap
                      lat={session.location.lat}
                      lng={session.location.lng}
                      city={session.location.city}
                      region={session.location.region}
                      country={session.location.country}
                      flag={session.location.flag}
                      isDark={isDark}
                    />
                  </div>
                ) : (
                  <div className="h-[140px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-900/40">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700/60 flex items-center justify-center mb-3">
                      <MapPin className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.localDev}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {session.ip ? session.ip : t.unknown}
                    </p>
                  </div>
                )}
              </div>

              {/* Revoke button */}
              <div className={`flex justify-end ${isRTL ? "flex-row-reverse" : ""}`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRevoke()
                  }}
                  disabled={isRevoking}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-all"
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
// Info Block (used inside session cards)
// ─────────────────────────────────────────────

function InfoBlock({
  icon,
  label,
  value,
  sub,
  highlight,
  isRTL,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string | null
  highlight?: boolean
  isRTL: boolean
}) {
  return (
    <div className={`space-y-1 ${isRTL ? "text-right" : ""}`}>
      <div className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <p className={`text-sm font-semibold ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>
          {value}
        </p>
        {sub && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Modal Helpers
// ─────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {children}
    </motion.div>
  )
}

function ModalCard({ children, isRTL: _isRTL }: { children: React.ReactNode; isRTL: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-gray-700"
    >
      {children}
    </motion.div>
  )
}
