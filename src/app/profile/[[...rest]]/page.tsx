"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Calendar, Settings, Lock, MailPlus, MessageCircle, Users, UserPlus, Check, X, Copy, UserCheck, Link2, History, Play, FileText, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"
import FriendsPopup from "@/components/Friends/FriendsPopup"

const translations = {
  ar: {
    profile: "الملف الشخصي",
    name: "الاسم",
    bio: "نبذة شخصية",
    settings: "الإعدادات",
    noBio: "لا توجد نبذة شخصية",
    user: "مستخدم",
    email: "البريد الإلكتروني",
    primaryEmail: "البريد الأساسي",
    secondaryEmails: "البريد الإلكتروني الثانوي",
    memberSince: "عضو منذ",
    accountInfo: "معلومات الحساب",
    accountSuspended: "تم تعليق الحساب",
    suspendedMessage: "هذا الحساب معلق ولا يمكن الوصول إلى الإعدادات. يرجى التواصل مع الدعم للمزيد من التفاصيل.",
    contactSupport: "تواصل مع الدعم",
    bannedStatus: "محظور",
    verified: "موثق",
    notVerified: "غير موثق",
    primary: "أساسي",
    goToChat: "الذهاب للمحادثات",
    friendRequests: "الطلبات",
    friendsTitle: "الأصدقاء",
    pendingRequests: "طلبات الصداقة المعلقة",
    noFriends: "لا يوجد أصدقاء بعد.",
    noRequests: "لا توجد طلبات معلقة.",
    accept: "قبول",
    reject: "رفض",
    userCode: "كود المستخدم",
    copyCode: "نسخ الكود",
    copied: "تم النسخ!",
    addFriend: "إضافة صديق",
    shareProfile: "مشاركة الملف",
    copyLink: "نسخ الرابط",
    linkCopied: "تم نسخ الرابط!",
    newsletter: "النشرة البريدية",
    newsletterActive: "مشترك",
    newsletterNotSubscribed: "غير مشترك",
    unsubscribe: "إلغاء الاشتراك",
    newsletterStatus: "حالة الاشتراك",
    viewHistory: "سجل المشاهدات",
    noViewHistory: "لا يوجد سجل مشاهدات",
    viewAllHistory: "عرض الكل",
    deleteView: "حذف",
    episode: "حلقة",
    article: "مقال",
    viewed: "تمت المشاهدة",
    formatDate: (date: Date) => {
      const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
    }
  },
  en: {
    profile: "Profile",
    name: "Name",
    bio: "Bio",
    settings: "Settings",
    noBio: "No bio available",
    user: "User",
    email: "Email",
    primaryEmail: "Primary Email",
    secondaryEmails: "Secondary Emails",
    memberSince: "Member Since",
    accountInfo: "Account Information",
    accountSuspended: "Account Suspended",
    suspendedMessage: "This account is suspended and settings are inaccessible. Please contact support for more details.",
    contactSupport: "Contact Support",
    bannedStatus: "Banned",
    verified: "Verified",
    notVerified: "Not Verified",
    primary: "Primary",
    goToChat: "Go to Chats",
    friendRequests: "Requests",
    friendsTitle: "Friends",
    pendingRequests: "Pending Friend Requests",
    noFriends: "No friends yet.",
    noRequests: "No pending requests.",
    accept: "Accept",
    reject: "Reject",
    userCode: "User Code",
    copyCode: "Copy Code",
    copied: "Copied!",
    addFriend: "Add Friend",
    shareProfile: "Share Profile",
    copyLink: "Copy Link",
    linkCopied: "Link Copied!",
    newsletter: "Newsletter",
    newsletterActive: "Subscribed",
    newsletterNotSubscribed: "Not subscribed",
    unsubscribe: "Unsubscribe",
    newsletterStatus: "Subscription Status",
    viewHistory: "View History",
    noViewHistory: "No view history",
    viewAllHistory: "View All",
    deleteView: "Delete",
    episode: "Episode",
    article: "Article",
    viewed: "Viewed",
    formatDate: (date: Date) => {
      return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
    }
  }
}

interface Friendship {
  id: string
  status: string
  requesterId: string
  receiverId: string
  requester: { id: string; name: string | null; image: string | null }
  receiver: { id: string; name: string | null; image: string | null }
}

const GlassCard = motion.div

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isRTL, language } = useLanguage()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [image, setImage] = useState("")
  const [banner, setBanner] = useState("")
  const [createdAt, setCreatedAt] = useState<Date | null>(null)
  const [secondaryEmails, setSecondaryEmails] = useState<Array<{ email: string; isVerified: boolean }>>([])
  const [isBanned, setIsBanned] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([])
  const [friends, setFriends] = useState<Friendship[]>([])
  const [viewHistory, setViewHistory] = useState<Array<{ id: string; contentId: string; contentType: string; slug: string | null; title: string | null; createdAt: string }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [nlSubscribed, setNlSubscribed] = useState<boolean | null>(null)
  const [nlUnsubscribing, setNlUnsubscribing] = useState(false)

  const t = translations[language]

  const fetchFriendsData = useCallback(async () => {
    try {
      const res = await fetch('/api/friends')
      if (res.ok) {
        const data = await res.json()
        const friendsData: Friendship[] = data.friends || []
        setPendingRequests(friendsData.filter((f) => f.status === 'PENDING' && f.receiverId === session?.user?.id))
        setFriends(friendsData.filter((f) => f.status === 'ACCEPTED'))
      }
    } catch { console.error("Error fetching friends data") }
  }, [session])

  const fetchViewHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/user/view-history')
      if (res.ok) { const json = await res.json(); setViewHistory(json.data || []) }
    } catch {} finally { setHistoryLoading(false) }
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/sign-in"); return }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user/${session.user.id}`)
        if (response.ok) {
          const userData = await response.json()
          setName(userData.name || "")
          setBio(userData.bio || "")
          setImage(userData.image || session.user?.image || "")
          setBanner(userData.banner || "")
          setCreatedAt(userData.createdAt ? new Date(userData.createdAt) : null)
          setSecondaryEmails(userData.secondaryEmails || [])
          setIsBanned(userData.banned || false)
        }
      } catch { console.error("Error fetching user data") }
    }

    const fetchNLStatus = async () => {
      if (!session?.user?.email) return
      try {
        const res = await fetch(`/api/newsletter/preferences?email=${encodeURIComponent(session.user.email)}`)
        const json = await res.json()
        setNlSubscribed(json.data?.status === 'ACTIVE')
      } catch { setNlSubscribed(false) }
    }

    fetchUserData(); fetchFriendsData(); fetchNLStatus(); fetchViewHistory()
  }, [session, status, router, fetchFriendsData, fetchViewHistory])

  const handleCopyCode = () => {
    if (session?.user?.id) { navigator.clipboard.writeText(session.user.id); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000) }
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      navigator.clipboard.writeText(`${window.location.origin}/users/${session.user.id}`)
      setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleAcceptRequest = async (requesterId: string) => {
    await fetch('/api/friends/accept', { method: 'POST', body: JSON.stringify({ requesterId, action: 'ACCEPT' }), headers: { 'Content-Type': 'application/json' } })
    setPendingRequests(prev => prev.filter(r => r.requester.id !== requesterId))
    const res = await fetch('/api/friends')
    if (res.ok) { const data = await res.json(); setFriends((data.friends || []).filter((f: Friendship) => f.status === 'ACCEPTED')) }
  }

  const handleRejectRequest = async (requesterId: string) => {
    await fetch('/api/friends/accept', { method: 'POST', body: JSON.stringify({ requesterId, action: 'REJECT' }), headers: { 'Content-Type': 'application/json' } })
    setPendingRequests(prev => prev.filter(r => r.requester.id !== requesterId))
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${isRTL ? 'rtl' : 'ltr'}`}>

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 transition-colors duration-500 ${
          isBanned
            ? 'bg-gradient-to-b from-red-50 via-gray-50 to-gray-100 dark:from-red-950/20 dark:via-gray-900 dark:to-gray-950'
            : 'bg-gradient-to-b from-blue-50 via-gray-50 to-gray-100 dark:from-blue-950/20 dark:via-gray-900 dark:to-gray-950'
        }`} />
        <div className={`absolute top-0 w-full h-96 transition-colors duration-500 ${
          isBanned
            ? 'bg-gradient-to-b from-red-200/30 to-transparent dark:from-red-900/20'
            : 'bg-gradient-to-b from-blue-200/30 to-transparent dark:from-indigo-900/20'
        }`} />
        <div className={`absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-[100px] transition-colors duration-500 ${
          isBanned ? 'bg-red-300/20 dark:bg-red-600/20' : 'bg-blue-300/20 dark:bg-blue-600/20'
        }`} />
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-8 pb-12 relative z-10">

        {/* Hero Card */}
        <GlassCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative backdrop-blur-xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden mb-8 border transition-all duration-500 ${
            isBanned
              ? 'border-red-200 dark:border-red-800/50 shadow-red-500/10'
              : 'border-gray-200 dark:border-gray-700/50 shadow-blue-500/5'
          }`}
        >
          <div className={`h-40 relative overflow-hidden transition-all duration-500 ${
            isBanned ? 'bg-gradient-to-r from-red-400 to-rose-500 dark:from-red-800 dark:to-rose-900' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700'
          }`}>
            {banner && <Image src={banner} alt="Profile Banner" fill className={`object-cover transition-opacity duration-500 ${isBanned ? 'opacity-50' : 'opacity-100'}`} />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            {isBanned && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
                <Lock className="w-16 h-16 text-red-200 drop-shadow-lg animate-pulse" />
              </div>
            )}
          </div>

          <div className="px-8 pb-8 pt-4">
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-20 mb-6 gap-6">
              <div className="relative z-20">
                <div className={`relative h-32 w-32 rounded-full border-4 overflow-hidden shadow-xl ${
                  isBanned
                    ? 'border-red-200 dark:border-red-800 bg-red-100 dark:bg-red-950'
                    : 'border-white dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
                }`}>
                  {image || session.user?.image ? (
                    <Image src={image || session.user?.image || ""} alt="User" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                      <User className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  {isBanned && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/30 rounded-full">
                      <Lock className="w-10 h-10 text-white drop-shadow" />
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center md:text-start flex-1 mb-2">
                <h2 className={`text-3xl font-bold mb-1 transition-colors duration-300 ${
                  isBanned ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {name || session.user?.name || t.user}
                </h2>
                <p className={`max-w-lg text-lg transition-colors duration-300 ${
                  isBanned ? 'text-red-400 dark:text-red-300/80' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {bio || t.noBio}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* User Code Card */}
        {!isBanned && (
          <GlassCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700/50 mb-8"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <UserCheck className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-bold">{t.userCode}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{session.user?.id}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={handleCopyCode} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all text-gray-700 dark:text-gray-300 text-sm border border-gray-200 dark:border-gray-600">
                  {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? t.copied : t.copyCode}
                </button>
                <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-all text-blue-600 dark:text-blue-400 text-sm border border-blue-200 dark:border-blue-800/50">
                  {copiedLink ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  {copiedLink ? t.linkCopied : t.copyLink}
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Account Info */}
        <GlassCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`bg-white dark:bg-gray-800 backdrop-blur-xl rounded-3xl p-8 shadow-xl border transition-all duration-500 ${
            isBanned
              ? 'border-red-200 dark:border-red-800/50 opacity-90'
              : 'border-gray-200 dark:border-gray-700/50'
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xl font-bold flex items-center gap-2 transition-colors duration-300 ${
              isBanned ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'
            }`}>
              <div className={`w-1 h-6 rounded-full transition-colors duration-300 ${
                isBanned ? 'bg-red-500' : 'bg-blue-500'
              }`} />
              {t.accountInfo}
            </h3>
            <div className="flex gap-2">
              {isBanned ? (
                <button disabled className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full cursor-not-allowed border border-gray-200 dark:border-gray-600">
                  <Lock className="h-5 w-5" />
                </button>
              ) : (
                <Link href="/settings">
                  <button className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full transition-all border border-gray-200 dark:border-gray-600">
                    <Settings className="h-5 w-5" />
                  </button>
                </Link>
              )}
            </div>
          </div>

          {isBanned && (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 100 }}
              className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 rounded-2xl text-center border border-red-200 dark:border-red-800/50">
              <h4 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">{t.accountSuspended}</h4>
              <p className="text-sm text-red-500 dark:text-red-300/80">{t.suspendedMessage}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
              isBanned ? 'bg-red-50 dark:bg-red-950/20' : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors duration-300 ${
                  isBanned ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400'
                }`}>
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isBanned ? 'text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>{t.primaryEmail}</p>
                  <p className={`font-semibold ${isBanned ? 'text-red-600 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>{session.user?.email}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                isBanned ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
              }`}>
                {isBanned ? t.bannedStatus : t.primary}
              </span>
            </div>

            {/* Secondary Emails */}
            {secondaryEmails.map((emailObj, index) => (
              <div key={index} className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                isBanned ? 'bg-red-50 dark:bg-red-950/20 opacity-70' : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isBanned ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-purple-50 dark:bg-purple-950/30 text-purple-500 dark:text-purple-400'}`}>
                    <MailPlus className="h-6 w-6" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isBanned ? 'text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>{t.secondaryEmails}</p>
                    <p className={`font-semibold ${isBanned ? 'text-red-600 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>{emailObj.email}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  isBanned
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : emailObj.isVerified
                      ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
                      : 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400'
                }`}>
                  {isBanned ? t.bannedStatus : (emailObj.isVerified ? t.verified : t.notVerified)}
                </span>
              </div>
            ))}

            {/* Member Since */}
            <div className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
              isBanned ? 'bg-red-50 dark:bg-red-950/20' : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isBanned ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400'}`}>
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isBanned ? 'text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>{t.memberSince}</p>
                  <p className={`font-semibold ${isBanned ? 'text-red-600 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>
                    {createdAt ? t.formatDate(createdAt) : "Unknown"}
                  </p>
                </div>
              </div>
              {isBanned && (
                <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-bold">
                  <Lock className="h-4 w-4 inline-block" />
                </div>
              )}
            </div>

            {/* Newsletter */}
            <div className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
              isBanned ? 'bg-red-50 dark:bg-red-950/20' : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isBanned ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400'}`}>
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isBanned ? 'text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>{t.newsletterStatus}</p>
                  <p className={`font-semibold ${isBanned ? 'text-red-600 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>
                    {nlSubscribed === null ? '...' : nlSubscribed ? t.newsletterActive : t.newsletterNotSubscribed}
                  </p>
                </div>
              </div>
              {nlSubscribed === true && !isBanned && (
                <button
                  onClick={async () => {
                    setNlUnsubscribing(true)
                    try {
                      await fetch('/api/newsletter/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: session?.user?.email }) })
                      setNlSubscribed(false)
                    } catch {}
                    setNlUnsubscribing(false)
                  }}
                  disabled={nlUnsubscribing}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50"
                >
                  {nlUnsubscribing ? '...' : t.unsubscribe}
                </button>
              )}
            </div>

            {isBanned && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 py-3 px-6 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all shadow-lg shadow-red-500/20"
              >
                {t.contactSupport}
              </motion.button>
            )}
          </div>
        </GlassCard>

        {/* Friends */}
        {!isBanned && (
          <div className="mt-8 space-y-8">
            {pendingRequests.length > 0 && (
              <GlassCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-yellow-200 dark:border-yellow-800/30"
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 rounded-full bg-yellow-500" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-yellow-500" />
                    {t.pendingRequests} ({pendingRequests.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {req.requester.image ? <Image src={req.requester.image} alt="" width={40} height={40} /> : <User className="w-full h-full p-2 text-gray-400" />}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{req.requester.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAcceptRequest(req.requester.id)} className="p-2 bg-green-500 hover:bg-green-600 rounded-full text-white transition-colors"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleRejectRequest(req.requester.id)} className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            <GlassCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 rounded-full bg-blue-500" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    {t.friendsTitle} ({friends.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <FriendsPopup
                    acceptedFriendIds={friends.filter(f => f.status === 'ACCEPTED').flatMap(f => [f.requesterId, f.receiverId])}
                    onFriendAction={fetchFriendsData}
                    trigger={
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-500/20">
                        <UserPlus className="w-4 h-4" /> {t.friendRequests}
                      </button>
                    }
                  />
                  <Link href="/chat_friends">
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20">
                      <MessageCircle className="w-4 h-4" /> {t.goToChat}
                    </button>
                  </Link>
                </div>
              </div>

              {friends.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-center py-4">{t.noFriends}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((friendship) => {
                    const friend = friendship.requester.id === session?.user?.id ? friendship.receiver : friendship.requester
                    return (
                      <Link href={`/chat_friends?userId=${friend.id}`} key={friendship.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 p-[2px]">
                          <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 overflow-hidden">
                            {friend.image ? <Image src={friend.image} alt="" width={48} height={48} className="object-cover" /> : <User className="w-full h-full p-2 text-gray-400" />}
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{friend.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{t.profile}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {/* View History */}
        {!isBanned && (
          <GlassCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700/50 mt-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full bg-purple-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-500" />
                  {t.viewHistory} ({viewHistory.length})
                </h3>
              </div>
              {viewHistory.length > 0 && (
                <Link href="/view-history" className="flex items-center gap-2 px-4 py-1.5 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full text-xs font-semibold transition-all">
                  <Eye className="w-3 h-3" /> {t.viewAllHistory}
                </Link>
              )}
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
              </div>
            ) : viewHistory.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-center py-4">{t.noViewHistory}</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {viewHistory.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/60 shrink-0">
                        {item.contentType === 'EPISODE' ? <Play className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{item.title || 'Untitled'}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                          <span className={`px-1.5 py-0.5 rounded ${
                            item.contentType === 'EPISODE'
                              ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                              : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400'
                          }`}>
                            {item.contentType === 'EPISODE' ? t.episode : t.article}
                          </span>
                          <span>{t.viewed} {new Date(item.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                        </div>
                      </div>
                    </div>
                    <a href={`/${item.contentType === 'EPISODE' ? 'episodes' : 'articles'}/${item.slug}`} target="_blank" className="p-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-500 rounded-lg transition-colors shrink-0">
                      <Eye className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  )
}
