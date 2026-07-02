"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { History, Play, FileText, Eye, Trash2, Search, ArrowLeft, Clock, X, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

const translations = {
  ar: {
    title: "سجل المشاهدات",
    subtitle: "جميع المحتويات التي شاهدتها مؤخراً",
    all: "الكل",
    episodes: "حلقات",
    articles: "مقالات",
    search: "بحث في السجل...",
    clearAll: "مسح الكل",
    noHistory: "لا يوجد سجل مشاهدات بعد",
    noHistoryDesc: "عندما تشاهد حلقة أو مقال، سيظهر هنا",
    startExploring: "ابدأ الاستكشاف",
    episode: "حلقة",
    article: "مقال",
    viewed: "تمت المشاهدة",
    delete: "حذف",
    view: "عرض",
    confirmClear: "هل أنت متأكد من مسح كل سجل المشاهدات؟",
    confirm: "نعم، مسح الكل",
    cancel: "إلغاء",
    items: "عنصر",
    justNow: "منذ لحظات",
    minutesAgo: "منذ دقيقة",
    minutesAgo_plural: "منذ {m} دقائق",
    hoursAgo: "منذ ساعة",
    hoursAgo_plural: "منذ {h} ساعات",
    daysAgo: "منذ يوم",
    daysAgo_plural: "منذ {d} أيام",
  },
  en: {
    title: "View History",
    subtitle: "All the content you've viewed recently",
    all: "All",
    episodes: "Episodes",
    articles: "Articles",
    search: "Search history...",
    clearAll: "Clear All",
    noHistory: "No view history yet",
    noHistoryDesc: "When you watch an episode or article, it will appear here",
    startExploring: "Start Exploring",
    episode: "Episode",
    article: "Article",
    viewed: "Viewed",
    delete: "Delete",
    view: "View",
    confirmClear: "Are you sure you want to clear all view history?",
    confirm: "Yes, Clear All",
    cancel: "Cancel",
    items: "items",
    justNow: "Just now",
    minutesAgo: "1 minute ago",
    minutesAgo_plural: "{m} minutes ago",
    hoursAgo: "1 hour ago",
    hoursAgo_plural: "{h} hours ago",
    daysAgo: "1 day ago",
    daysAgo_plural: "{d} days ago",
  },
}

interface ViewItem {
  id: string
  contentId: string
  contentType: string
  slug: string | null
  title: string | null
  thumbnailUrl: string | null
  createdAt: string
}

function timeAgo(dateStr: string, t: Record<string, string>): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return t.justNow
  if (mins < 60) return mins === 1 ? t.minutesAgo : t.minutesAgo_plural.replace("{m}", String(mins))
  if (hours < 24) return hours === 1 ? t.hoursAgo : t.hoursAgo_plural.replace("{h}", String(hours))
  return days === 1 ? t.daysAgo : t.daysAgo_plural.replace("{d}", String(days))
}

export default function ViewHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isRTL, language } = useLanguage()
  const t = translations[language]

  const [history, setHistory] = useState<ViewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"ALL" | "EPISODE" | "ARTICLE">("ALL")
  const [search, setSearch] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/user/view-history")
      if (!res.ok) throw new Error(res.status === 401 ? "Unauthorized" : "Failed to load")
      const json = await res.json()
      setHistory(json.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load view history")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/sign-in"); return }
    fetchHistory()
  }, [status, session, router, fetchHistory])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    setDeletingId(id)
    try {
      const res = await fetch(`/api/user/view-history?id=${id}`, { method: "DELETE" })
      if (res.ok) setHistory(prev => prev.filter(v => v.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const handleClearAll = async () => {
    setShowConfirm(false)
    try {
      const res = await fetch("/api/user/view-history", { method: "DELETE" })
      if (res.ok) setHistory([])
    } catch {}
  }

  const filtered = history.filter(item => {
    if (filter !== "ALL" && item.contentType !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      const title = item.title?.toLowerCase() || ""
      const slug = item.slug?.toLowerCase() || ""
      if (!title.includes(q) && !slug.includes(q)) return false
    }
    return true
  })

  if (status === "loading") return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/profile" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> {language === "ar" ? "العودة إلى الملف الشخصي" : "Back to Profile"}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <History className="w-7 h-7 text-purple-400" />
                {t.title}
              </h1>
              <p className="text-gray-400 mt-1 text-sm">{t.subtitle}</p>
            </div>
            {history.length > 0 && (
              <button onClick={() => setShowConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl text-sm font-semibold transition-all border border-red-600/30">
                <Trash2 className="w-4 h-4" /> {t.clearAll}
              </button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              {(["ALL", "EPISODE", "ARTICLE"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"}`}>
                  {f === "ALL" ? t.all : f === "EPISODE" ? t.episodes : t.articles}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats bar */}
        {!loading && !error && history.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-4 text-sm text-gray-500">
            {filtered.length} / {history.length} {t.items}
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-semibold text-lg mb-2">{error}</p>
            <button onClick={fetchHistory} className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm">{language === "ar" ? "إعادة المحاولة" : "Retry"}</button>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-white text-xl font-semibold mb-2">{t.noHistory}</p>
            <p className="text-gray-500 mb-6">{t.noHistoryDesc}</p>
            <Link href="/episodes" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold">
              <Play className="w-4 h-4" /> {t.startExploring}
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden ${item.contentType === "EPISODE" ? "bg-blue-600/20" : "bg-green-600/20"}`}>
                    {item.thumbnailUrl ? (
                      <Image src={item.thumbnailUrl} alt="" width={64} height={64} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.contentType === "EPISODE" ? <Play className="w-6 h-6 text-blue-400" /> : <FileText className="w-6 h-6 text-green-400" />}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{item.title || (language === "ar" ? "بدون عنوان" : "Untitled")}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.contentType === "EPISODE" ? "bg-blue-600/20 text-blue-400" : "bg-green-600/20 text-green-400"}`}>
                        {item.contentType === "EPISODE" ? t.episode : t.article}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(item.createdAt, t)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/${item.contentType === "EPISODE" ? "episodes" : "articles"}/${item.slug}`}
                      target="_blank"
                      className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-xl transition-all hover:scale-105"
                      title={t.view}
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={deletingId === item.id}
                      className="p-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                      title={t.delete}
                    >
                      {deletingId === item.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Clear All Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white text-lg font-semibold text-center mb-2">{t.confirmClear}</p>
              <p className="text-gray-400 text-sm text-center mb-6">{history.length} {t.items}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors font-semibold text-sm">{t.cancel}</button>
                <button onClick={handleClearAll} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold text-sm">{t.confirm}</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
