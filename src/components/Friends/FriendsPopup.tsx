"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/Language/LanguageProvider";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Search, X, Check, Ban, Clock, User, Loader2, Eye, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { pusherClient } from "@/lib/pusher";

interface RequestUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface FriendRequest {
  id: string;
  requester: RequestUser;
  receiver: RequestUser;
  status: string;
  requesterId: string;
  receiverId: string;
}

interface SearchedUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface FriendsPopupProps {
  /** قائمة الـ IDs اللي المستخدم أرسل لهم طلب (عشان نعرض Sent) */
  sentRequestIds?: string[];
  /** قائمة الاصدقاء المقبولين (عشان نتجنب إظهار زر الإضافة) */
  acceptedFriendIds?: string[];
  /** callback بعد إرسال/قبول/إلغاء طلب (عشان الصفحة الأم ت refreshes) */
  onFriendAction?: () => void;
  /** زر مخصص بدل الـ FAB (اختياري) */
  trigger?: React.ReactNode;
  /** السيطرة على فتح/غلق المودال من الخارج */
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const translations: Record<string, Record<string, string>> = {
  ar: {
    requests: "طلبات الصداقة",
    sentRequests: "الطلبات المرسلة",
    search: "بحث",
    searchPlaceholder: "ابحث بالاسم...",
    noRequests: "لا توجد طلبات",
    noSent: "لم ترسل أي طلب",
    noUsers: "لا يوجد مستخدمين",
    searchHint: "ابحث عن مستخدمين جدد",
    accept: "قبول",
    reject: "رفض",
    cancel: "إلغاء",
    addFriend: "إضافة صديق",
    requestSent: "تم الإرسال",
    friend: "صديق",
    pending: "معلقة",
    viewProfile: "عرض الملف",
  },
  en: {
    requests: "Friend Requests",
    sentRequests: "Sent Requests",
    search: "Search",
    searchPlaceholder: "Search by name...",
    noRequests: "No pending requests",
    noSent: "No sent requests",
    noUsers: "No users found",
    searchHint: "Search for new users",
    accept: "Accept",
    reject: "Reject",
    cancel: "Cancel",
    addFriend: "Add Friend",
    requestSent: "Sent",
    friend: "Friend",
    pending: "Pending",
    viewProfile: "View Profile",
  },
};

export default function FriendsPopup({ sentRequestIds: _sentRequestIds, acceptedFriendIds, onFriendAction, trigger, isOpen: externalOpen, setIsOpen: externalSetOpen }: FriendsPopupProps) {
  const { data: session } = useSession();
  const { isRTL: _isRTL, language } = useLanguage();
  const t = translations[language];

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalSetOpen || setInternalOpen;
  const [tab, setTab] = useState<"requests" | "search">("requests");

  // Requests state
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [localSentIds, setLocalSentIds] = useState<string[]>(_sentRequestIds || []);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalSentIds(_sentRequestIds || []);
  }, [_sentRequestIds]);

  const fetchRequests = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        const all: FriendRequest[] = data.friends || [];
        setIncomingRequests(all.filter((f) => f.status === "PENDING" && f.receiverId === session.user?.id));
        setOutgoingRequests(all.filter((f) => f.status === "PENDING" && f.requesterId === session.user?.id));
        setLocalSentIds(all.filter((f) => f.status === "PENDING" && f.requesterId === session.user?.id).map((f) => f.receiverId));
      }
    } catch { /* ignore */ } finally {
      setLoadingRequests(false);
    }
  }, [session]);

  useEffect(() => {
    if (isOpen) fetchRequests();
  }, [isOpen, fetchRequests]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = pusherClient.subscribe(`private-user-${session.user.id}`);
    const handler = () => { if (isOpen) fetchRequests(); };
    channel.bind("friend-request", handler);
    channel.bind("friend-accepted", handler);
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [session, isOpen, fetchRequests]);

  // --- Actions ---
  const handleAccept = async (requesterId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requesterId));
    await fetch("/api/friends/accept", {
      method: "POST",
      body: JSON.stringify({ requesterId, action: "ACCEPT" }),
      headers: { "Content-Type": "application/json" },
    });
    setProcessingIds((prev) => { const n = new Set(prev); n.delete(requesterId); return n; });
    setIncomingRequests((prev) => prev.filter((r) => r.requesterId !== requesterId));
    onFriendAction?.();
  };

  const handleReject = async (requesterId: string) => {
    await fetch("/api/friends/accept", {
      method: "POST",
      body: JSON.stringify({ requesterId, action: "REJECT" }),
      headers: { "Content-Type": "application/json" },
    });
    setIncomingRequests((prev) => prev.filter((r) => r.requesterId !== requesterId));
    onFriendAction?.();
  };

  const handleCancel = async (receiverId: string) => {
    await fetch(`/api/friends/cancel?userId=${receiverId}`, { method: "DELETE" });
    setOutgoingRequests((prev) => prev.filter((r) => r.receiverId !== receiverId));
    setLocalSentIds((prev) => prev.filter((id) => id !== receiverId));
    onFriendAction?.();
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/users/search?q=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch { /* ignore */ } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    setProcessingIds((prev) => new Set(prev).add(receiverId));
    const res = await fetch("/api/friends", {
      method: "POST",
      body: JSON.stringify({ receiverId }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      setLocalSentIds((prev) => [...prev, receiverId]);
      onFriendAction?.();
    } else {
      const data = await res.json();
      alert(data.error || "Error");
    }
    setProcessingIds((prev) => { const n = new Set(prev); n.delete(receiverId); return n; });
  };

  const totalPending = incomingRequests.length;

  return (
    <>
      {/* Trigger Button (FAB or custom) */}
      {trigger ? (
        <span onClick={() => setIsOpen(true)}>{trigger}</span>
      ) : (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center text-white hover:scale-110 hover:rotate-12 transition-all"
          whileHover={{ scale: 1.15, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
        >
          <UserPlus className="w-6 h-6" />
          {totalPending > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg shadow-rose-500/50 ring-2 ring-white dark:ring-zinc-900">
              {totalPending}
            </span>
          )}
        </motion.button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-zinc-800/50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1">
                  <button
                    onClick={() => setTab("requests")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tab === "requests"
                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    {t.requests}
                    {incomingRequests.length > 0 && (
                      <span className="bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {incomingRequests.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setTab("search")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tab === "search"
                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    {t.search}
                  </button>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[60vh] p-4">
                {tab === "requests" ? (
                  loadingRequests ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                  ) : (
                    <div className="space-y-5">
                      {/* Incoming */}
                      {incomingRequests.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
                            <UserPlus className="w-3.5 h-3.5" /> {t.requests} ({incomingRequests.length})
                          </h4>
                          <div className="space-y-2">
                            {incomingRequests.map((req) => (
                              <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-700 flex-shrink-0">
                                    {req.requester.image ? <Image src={req.requester.image} alt="" width={40} height={40} className="object-cover" /> : <User className="w-5 h-5 text-slate-400 mx-auto mt-2" />}
                                  </div>
                                  <span className="text-sm font-semibold text-slate-700 dark:text-white">{req.requester.name}</span>
                                </div>
                                <div className="flex gap-1.5">
                                  <Link href={`/users/${req.requesterId}`} onClick={() => setIsOpen(false)}>
                                    <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors" title={t.viewProfile}><Eye className="w-4 h-4" /></button>
                                  </Link>
                                  <button onClick={() => handleAccept(req.requesterId)} disabled={processingIds.has(req.requesterId)} className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50">
                                    {processingIds.has(req.requesterId) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  </button>
                                  <button onClick={() => handleReject(req.requesterId)} className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full hover:bg-rose-200"><X className="w-4 h-4" /></button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Outgoing */}
                      {outgoingRequests.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {t.sentRequests} ({outgoingRequests.length})
                          </h4>
                          <div className="space-y-2">
                            {outgoingRequests.map((req) => (
                              <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-700 flex-shrink-0">
                                    {req.receiver.image ? <Image src={req.receiver.image} alt="" width={40} height={40} className="object-cover" /> : <User className="w-5 h-5 text-slate-400 mx-auto mt-2" />}
                                  </div>
                                  <span className="text-sm font-semibold text-slate-700 dark:text-white">{req.receiver.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1 rounded-full">{t.pending}</span>
                                  <button onClick={() => handleCancel(req.receiverId)} className="p-1.5 bg-slate-200 dark:bg-zinc-700 text-slate-500 rounded-full hover:bg-rose-100 hover:text-rose-500"><Ban className="w-3.5 h-3.5" /></button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                          <UserPlus className="w-10 h-10 mb-3 opacity-30" />
                          <p className="font-medium text-sm">{t.noRequests}</p>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  /* Search Tab */
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-700 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery}
                      className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 transition-all text-sm"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin inline-block" /> : null}
                      {isSearching ? "..." : t.search}
                    </button>

                    {isSearching ? (
                      <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.map((user) => {
                          const isSent = localSentIds.includes(user.id);
                          const isFriend = acceptedFriendIds?.includes(user.id);
                          const isProcessing = processingIds.has(user.id);
                          return (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-700 flex-shrink-0">
                                  {user.image ? <Image src={user.image} alt="" width={40} height={40} className="object-cover" /> : <User className="w-5 h-5 text-slate-400 mx-auto mt-2" />}
                                </div>
                                <span className="font-medium text-sm text-slate-700 dark:text-white">{user.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Link href={`/users/${user.id}`} onClick={() => setIsOpen(false)}>
                                  <button className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors" title={t.viewProfile}><Eye className="w-4 h-4" /></button>
                                </Link>
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                ) : isSent ? (
                                  <span className="text-xs text-slate-400 bg-slate-200 dark:bg-zinc-700 px-3 py-1.5 rounded-full">{t.requestSent}</span>
                                ) : isFriend ? (
                                  <span className="text-xs text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">{t.friend}</span>
                                ) : (
                                  <button onClick={() => handleSendRequest(user.id)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-full font-semibold transition-all shadow-md">
                                    {t.addFriend}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : hasSearched ? (
                      <p className="text-center text-slate-400 text-sm py-6">{t.noUsers}</p>
                    ) : (
                      <p className="text-center text-slate-400 text-sm py-6">{t.searchHint}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
