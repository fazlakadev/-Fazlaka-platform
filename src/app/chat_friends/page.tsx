"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { pusherClient } from "@/lib/pusher";
import {
  User, MessageCircle, UserPlus, UserCheck, Check, X, Loader2, Send, ArrowLeft,
  Edit, Trash2, ImagePlus, Search, ExternalLink, Eye, Users, Clock, Ban
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/Language/LanguageProvider";

// --- Translations ---
const translations: Record<string, any> = {
  ar: {
    friends: "الأصدقاء",
    requests: "الطلبات",
    search: "بحث",
    noFriends: "لا يوجد أصدقاء بعد",
    noRequests: "لا توجد طلبات معلقة",
    noRequestsSent: "لم ترسل أي طلب",
    friendRequests: "طلبات الصداقة",
    sentRequests: "الطلبات المرسلة",
    addFriend: "إضافة صديق",
    searchPlaceholder: "ابحث بالاسم أو الكود...",
    sendRequest: "إرسال طلب",
    requestSent: "تم الإرسال",
    accept: "قبول",
    reject: "رفض",
    cancel: "إلغاء",
    noUsersFound: "لا يوجد مستخدمين",
    searchHint: "أدخل اسماً أو كوداً للبحث",
    startChat: "ابدأ محادثة",
    typeMessage: "اكتب رسالة...",
    online: "متصل",
    offline: "غير متصل",
    viewProfile: "عرض الملف",
    close: "إغلاق",
    deleteConfirm: "حذف الرسالة؟",
    deleteWarning: "لا يمكن التراجع عن هذا الإجراء",
    delete: "حذف",
    welcome: "مرحباً بعودتك!",
    welcomeHint: "اختر صديقاً لبدء المحادثة",
    edited: "تم التعديل",
    friend: "صديق",
    chat: "محادثة",
    pending: "معلقة",
  },
  en: {
    friends: "Friends",
    requests: "Requests",
    search: "Search",
    noFriends: "No friends yet",
    noRequests: "No pending requests",
    noRequestsSent: "You haven't sent any requests",
    friendRequests: "Friend Requests",
    sentRequests: "Sent Requests",
    addFriend: "Add Friend",
    searchPlaceholder: "Search by name or code...",
    sendRequest: "Send Request",
    requestSent: "Sent",
    accept: "Accept",
    reject: "Reject",
    cancel: "Cancel",
    noUsersFound: "No users found",
    searchHint: "Enter a name or code to search",
    startChat: "Start Chat",
    typeMessage: "Type a message...",
    online: "Online",
    offline: "Offline",
    viewProfile: "View Profile",
    close: "Close",
    deleteConfirm: "Delete Message?",
    deleteWarning: "This action cannot be undone.",
    delete: "Delete",
    welcome: "Welcome Back!",
    welcomeHint: "Select a friend to start chatting.",
    edited: "edited",
    friend: "Friend",
    chat: "Chat",
    pending: "Pending",
  }
};

// --- Interfaces ---
interface Friend {
  id: string;
  status: string;
  requesterId: string;
  receiverId: string;
  requester: { id: string; name: string | null; image: string | null; };
  receiver: { id: string; name: string | null; image: string | null; };
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  imageUrl?: string;
  createdAt: string;
  isEdited?: boolean;
  sender?: { name: string | null; image: string | null; };
}

interface ChatPartner {
  id: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
  banner?: string | null;
}

interface SearchedUser {
  id: string;
  name: string | null;
  image: string | null;
}

type TabType = "friends" | "requests" | "search";

export default function ChatFriendsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");
  const { isRTL, language } = useLanguage();
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequestsList, setSentRequestsList] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const [selectedChat, setSelectedChat] = useState<{
    id: string | null;
    friend: ChatPartner;
  } | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, messageId: string} | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [addFriendSearch, setAddFriendSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Data Fetching ---
  const fetchFriends = useCallback(async () => {
    if (!session) return;
    setLoadingFriends(true);
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      const allFriends: Friend[] = data.friends || [];
      setFriends(allFriends.filter((f: Friend) => f.status === "ACCEPTED"));
      setPendingRequests(allFriends.filter((f: Friend) => f.status === "PENDING" && f.receiverId === session.user?.id));
      setSentRequestsList(allFriends.filter((f: Friend) => f.status === "PENDING" && f.requesterId === session.user?.id));
      setSentRequestIds(allFriends.filter((f: Friend) => f.status === "PENDING" && f.requesterId === session.user?.id).map((f: Friend) => f.receiverId));
    } catch (error) {
      console.error("Error fetching friends", error);
    } finally {
      setLoadingFriends(false);
    }
  }, [session]);

  useEffect(() => {
    fetchFriends();
    if (session?.user?.id) {
      const channel = pusherClient.subscribe(`private-user-${session.user.id}`);
      channel.bind("friend-request", () => { fetchFriends(); });
      channel.bind("friend-accepted", () => { fetchFriends(); });
      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    }
  }, [session, fetchFriends]);

  useEffect(() => {
    if (initialUserId && session && !selectedChat) {
      fetch(`/api/user/${initialUserId}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setSelectedChat({ id: null, friend: data });
            setActiveTab("friends");
          }
        });
    }
  }, [initialUserId, session, selectedChat]);

  // --- Chat Logic ---
  useEffect(() => {
    const initChat = async () => {
      if (!selectedChat?.friend?.id) return;
      setIsLoadingChat(true);
      setMessages([]);
      setContextMenu(null);
      setEditingMessageId(null);

      try {
        const url = selectedChat.id
          ? `/api/messages?conversationId=${selectedChat.id}`
          : `/api/messages?friendId=${selectedChat.friend.id}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) {
          setMessages(data.messages || []);
          if (data.conversationId && !selectedChat.id) {
            setSelectedChat(prev => prev ? { ...prev, id: data.conversationId } : null);
          }
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setIsLoadingChat(false);
      }
    };
    initChat();
  }, [selectedChat?.friend?.id, selectedChat?.id]);

  useEffect(() => {
    if (!selectedChat?.id) return;
    const channel = pusherClient.subscribe(`private-conversation-${selectedChat.id}`);

    channel.bind("new-message", (newMessage: Message) => {
      setMessages((prev) => prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]);
    });
    channel.bind("message-updated", (updatedMsg: Message) => {
      setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
    });
    channel.bind("message-deleted", (data: { messageId: string }) => {
      setMessages((prev) => prev.filter(m => m.id !== data.messageId));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [selectedChat?.id]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // --- Actions ---
  const handleSend = async (imageUrl?: string) => {
    const content = input.trim();
    if (!content && !imageUrl) return;
    setInput("");

    const res = await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        receiverId: selectedChat?.friend.id,
        content,
        imageUrl,
        conversationId: selectedChat?.id
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const newMsg = await res.json();
      if (!selectedChat?.id && newMsg.conversationId) {
        setSelectedChat(prev => prev ? { ...prev, id: newMsg.conversationId } : null);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'chat');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) await handleSend(data.url);
      else alert(data.error || "Failed to upload");
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAccept = async (requesterId: string) => {
    await fetch('/api/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ requesterId, action: 'ACCEPT' }),
      headers: { 'Content-Type': 'application/json' }
    });
    fetchFriends();
  };

  const handleReject = async (requesterId: string) => {
    await fetch('/api/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ requesterId, action: 'REJECT' }),
      headers: { 'Content-Type': 'application/json' }
    });
    fetchFriends();
  };

  const handleCancelRequest = async (receiverId: string) => {
    await fetch(`/api/friends/cancel?userId=${receiverId}`, { method: 'DELETE' });
    fetchFriends();
  };

  const handleSearchUsers = async () => {
    if (!addFriendSearch) return;
    setIsSearchingUsers(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/users/search?q=${addFriendSearch}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        body: JSON.stringify({ receiverId }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setSentRequestIds(prev => [...prev, receiverId]);
      } else {
        const data = await res.json();
        alert(data.error || "Error sending request");
      }
    } catch (error) {
      console.error("Error sending request", error);
    }
  };

  const handleEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    await fetch("/api/messages", {
      method: "PUT",
      body: JSON.stringify({ messageId, content: editContent }),
      headers: { "Content-Type": "application/json" },
    });
    setEditingMessageId(null);
    setEditContent("");
    setContextMenu(null);
  };

  const handleDelete = async (messageId: string) => {
    await fetch(`/api/messages?messageId=${messageId}`, { method: "DELETE" });
    setContextMenu(null);
    setDeleteConfirmId(null);
  };

  const canModify = (createdAt: string) => (new Date().getTime() - new Date(createdAt).getTime()) < 10 * 60 * 1000;
  const formatTime = (date: string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    const isMe = msg.senderId === session?.user?.id;
    if (!isMe || !canModify(msg.createdAt)) return;

    const menuWidth = 200;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + 120 > window.innerHeight) y = window.innerHeight - 120 - 10;

    setContextMenu({ x, y, messageId: msg.id });
  };

  const handleTouchStart = (e: React.TouchEvent, msg: Message) => {
    const isMe = msg.senderId === session?.user?.id;
    if (!isMe || !canModify(msg.createdAt)) return;
    longPressTimerRef.current = setTimeout(() => {
      const touch = e.touches[0];
      let x = touch.clientX;
      if (x + 200 > window.innerWidth) x = window.innerWidth - 200 - 10;
      setContextMenu({ x, y: touch.clientY, messageId: msg.id });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const getFriend = (f: Friend) =>
    f.requester.id === session?.user?.id ? f.receiver : f.requester;

  const filteredFriends = friends.filter(f => {
    const friendUser = getFriend(f);
    return friendUser.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isFriend = (userId: string) =>
    friends.some(f => f.requester.id === userId || f.receiver.id === userId);

  // --- Tab Buttons ---
  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: "friends", label: t.friends, icon: Users },
    { key: "requests", label: t.requests, icon: UserPlus },
    { key: "search", label: t.search, icon: Search },
  ];

  // --- Render ---
  return (
    <div className={`min-h-screen flex flex-col bg-slate-100 dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-100 transition-colors duration-300 overflow-x-hidden ${isRTL ? 'rtl' : 'ltr'}`}>

      <div className="w-full h-40 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex-shrink-0 shadow-lg" />

      <div className="flex flex-1 w-full max-w-screen-2xl mx-auto relative z-10 -mt-16 px-2 md:px-0">

        {/* --- Sidebar --- */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`w-full md:w-96 border-r border-slate-200/50 dark:border-zinc-800/50 flex flex-col bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl rounded-tl-3xl ${selectedChat ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Tabs */}
          <div className="p-4 pb-0">
            <h1 className="text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-4">
              {t.friends}
            </h1>
            <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const badge = tab.key === "requests" ? pendingRequests.length : null;
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setHasSearched(false); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {badge != null && badge > 0 && (
                      <span className="bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search within friends */}
          {activeTab === "friends" && (
            <div className="p-4 pb-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-700 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {loadingFriends ? (
              <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-indigo-600"/></div>
            ) : activeTab === "friends" ? (
              /* --- FRIENDS LIST --- */
              filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 px-4 text-center">
                  <UserCheck className="w-10 h-10 mb-3 opacity-30" />
                  <p className="font-medium">{t.noFriends}</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredFriends.map((friend, index) => {
                    const friendUser = getFriend(friend);
                    return (
                      <motion.button
                        key={friend.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => setSelectedChat({ id: null, friend: friendUser })}
                        whileHover={{ scale: 1.01, x: 5, transition: { duration: 0.1 } }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors group relative overflow-hidden"
                      >
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-700 shadow-sm group-hover:ring-2 group-hover:ring-indigo-500 transition-all duration-200 flex-shrink-0">
                          {friendUser.image ? (
                            <Image src={friendUser.image} alt="" width={56} height={56} className="object-cover transition-transform duration-300 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-300 to-purple-300 dark:from-indigo-600 dark:to-purple-700">
                              <User className="w-6 h-6 text-white"/>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left z-10">
                          <h4 className="font-semibold text-sm text-slate-800 dark:text-zinc-100">{friendUser.name}</h4>
                          <p className="text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">{t.startChat}</p>
                        </div>
                        <MessageCircle className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      </motion.button>
                    );
                  })}
                </div>
              )
            ) : activeTab === "requests" ? (
              /* --- REQUESTS (INCOMING + SENT) --- */
              <div className="p-4 space-y-6">
                {/* Incoming */}
                {pendingRequests.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                      <UserPlus className="w-3.5 h-3.5" /> {t.friendRequests} ({pendingRequests.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingRequests.map((req) => (
                        <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 p-[2px] shadow-sm flex-shrink-0">
                              <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-black">
                                {req.requester.image ? <Image src={req.requester.image} alt="" width={40} height={40} className="object-cover"/> : <User className="w-4 h-4 text-slate-400 mx-auto mt-2"/>}
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-white">{req.requester.name}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleAccept(req.requester.id)} className="p-2 bg-emerald-500 text-white rounded-full shadow-md hover:bg-emerald-600"><Check className="w-4 h-4"/></motion.button>
                            <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleReject(req.requester.id)} className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full hover:bg-rose-200"><X className="w-4 h-4"/></motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sent */}
                {sentRequestsList.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> {t.sentRequests} ({sentRequestsList.length})
                    </h3>
                    <div className="space-y-2">
                      {sentRequestsList.map((req) => (
                        <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-700 flex-shrink-0">
                              {req.receiver.image ? <Image src={req.receiver.image} alt="" width={40} height={40} className="object-cover"/> : <User className="w-4 h-4 text-slate-400 mx-auto mt-2"/>}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-white">{req.receiver.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1 rounded-full">{t.pending}</span>
                            <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleCancelRequest(req.receiver.id)} className="p-1.5 bg-slate-200 dark:bg-zinc-700 text-slate-500 rounded-full hover:bg-rose-100 hover:text-rose-500 transition-colors"><Ban className="w-3.5 h-3.5"/></motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingRequests.length === 0 && sentRequestsList.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center">
                    <UserPlus className="w-10 h-10 mb-3 opacity-30" />
                    <p className="font-medium">{t.noRequests}</p>
                  </div>
                )}
              </div>
            ) : (
              /* --- SEARCH TAB --- */
              <div className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={addFriendSearch}
                    onChange={(e) => setAddFriendSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                    className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-700 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearchUsers}
                  disabled={isSearchingUsers || !addFriendSearch}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 transition-all text-sm"
                >
                  {isSearchingUsers ? <Loader2 className="w-4 h-4 animate-spin inline-block" /> : null}
                  {isSearchingUsers ? "..." : t.search}
                </motion.button>

                {/* Results */}
                <div className="flex-1">
                  {isSearchingUsers ? (
                    <div className="flex justify-center items-center h-32"><Loader2 className="w-6 h-6 animate-spin text-indigo-500"/></div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-700 flex-shrink-0">
                              {user.image ? <Image src={user.image} alt="" width={40} height={40} className="object-cover"/> : <User className="w-5 h-5 text-slate-400 mx-auto mt-2"/>}
                            </div>
                            <span className="font-medium text-slate-700 dark:text-white text-sm">{user.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/users/${user.id}`} target="_blank">
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors" title={t.viewProfile}>
                                <Eye className="w-4 h-4"/>
                              </motion.button>
                            </Link>
                            {sentRequestIds.includes(user.id) ? (
                              <span className="text-xs text-slate-400 bg-slate-200 dark:bg-zinc-700 px-3 py-1.5 rounded-full">{t.requestSent}</span>
                            ) : isFriend(user.id) ? (
                              <span className="text-xs text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">{t.friend}</span>
                            ) : (
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSendFriendRequest(user.id)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-full font-semibold transition-colors shadow-md">
                                {t.addFriend}
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : hasSearched ? (
                    <p className="text-center text-slate-400 text-sm py-10">{t.noUsersFound}</p>
                  ) : (
                    <p className="text-center text-slate-400 text-sm py-10">{t.searchHint}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* --- Main Chat Area --- */}
        <div className={`flex-1 flex flex-col relative ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>

          <AnimatePresence mode="wait">
            {selectedChat ? (
              <motion.div
                key={selectedChat.friend.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full w-full bg-slate-50 dark:bg-zinc-950 rounded-tr-3xl shadow-2xl overflow-hidden"
              >
                {/* Chat Header */}
                <div className="flex items-center gap-4 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800 z-20">
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setSelectedChat(null)}
                    className="text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors md:hidden"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileModal(true)}
                    className="relative group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-transparent group-hover:border-indigo-500 transition-all duration-200 shadow-lg ring-2 ring-white dark:ring-zinc-900">
                      {selectedChat.friend.image ? (
                        <Image src={selectedChat.friend.image} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-lg text-white">
                          {selectedChat.friend.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                  </motion.button>

                  <div className="flex-1">
                    <h2 className="font-bold text-slate-900 dark:text-white">{selectedChat.friend.name}</h2>
                    <p className="text-xs text-emerald-500 font-medium">{t.online}</p>
                  </div>
                </div>

                {/* Messages Area */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 bg-slate-100 dark:bg-zinc-950">
                  {isLoadingChat ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin"/></div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-sm">{t.startChat}</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.senderId === session?.user?.id;

                      return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.02, type: "spring", stiffness: 200, damping: 20 }}
                          className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-white dark:border-zinc-800 shadow-sm">
                              {msg.sender?.image ? <Image src={msg.sender.image} alt="" width={32} height={32}/> : <div className="w-full h-full bg-slate-300 dark:bg-zinc-600 flex items-center justify-center"><User className="w-4 h-4 text-white"/></div>}
                            </div>
                          )}

                          <div className={`relative max-w-[70%] ${isMe ? "order-1" : ""}`}>
                            {editingMessageId === msg.id ? (
                              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-xl">
                                <input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="bg-transparent w-full outline-none text-sm" autoFocus/>
                                <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                                  <button onClick={() => setEditingMessageId(null)} className="text-xs text-slate-500 flex items-center gap-1"><X className="w-3 h-3"/> {t.cancel}</button>
                                  <button onClick={() => handleEdit(msg.id)} className="text-xs text-white bg-indigo-600 px-3 py-1 rounded-full flex items-center gap-1"><Check className="w-3 h-3"/> Save</button>
                                </div>
                              </motion.div>
                            ) : (
                              <div
                                onContextMenu={(e) => handleContextMenu(e, msg)}
                                onTouchStart={(e) => handleTouchStart(e, msg)}
                                onTouchEnd={handleTouchEnd}
                                onClick={() => msg.imageUrl && setViewingImage(msg.imageUrl)}
                                className={`rounded-3xl transition-all overflow-hidden relative cursor-pointer ${
                                  isMe
                                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
                                    : "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-100 dark:border-zinc-700 shadow-sm hover:shadow-md"
                                }`}
                              >
                                {msg.imageUrl && (
                                  <div className="relative w-60 h-60 bg-slate-100 dark:bg-zinc-700">
                                    <Image src={msg.imageUrl} alt="Image" fill className="object-cover"/>
                                  </div>
                                )}
                                {msg.content && (
                                  <div className="px-4 py-2.5">
                                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className={`flex items-center gap-1 mt-1 px-2 ${isMe ? "justify-end" : "justify-start"}`}>
                              {msg.isEdited && <span className="text-[10px] text-slate-400 italic">{t.edited}</span>}
                              <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 rounded-full px-4 py-2 border border-transparent focus-within:border-indigo-500 focus-within:shadow-lg focus-within:shadow-indigo-500/10 transition-all">
                    <motion.label whileHover={{ rotate: 15 }} className={`cursor-pointer p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors ${isUploading ? 'pointer-events-none opacity-50' : ''}`}>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={isUploading}/>
                      {isUploading ? <Loader2 className="w-5 h-5 text-indigo-600 animate-spin"/> : <ImagePlus className="w-5 h-5 text-indigo-500"/>}
                    </motion.label>
                    <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !editingMessageId && handleSend()}
                      placeholder={t.typeMessage} className="flex-1 bg-transparent outline-none placeholder-slate-400 text-sm"
                    />
                    <motion.button whileHover={{ scale: 1.1, rotate: -10 }} whileTap={{ scale: 0.9 }} onClick={() => handleSend()}
                      disabled={!input.trim() || isUploading} className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-white shadow-lg hover:shadow-indigo-500/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden md:flex flex-1 items-center justify-center bg-slate-100 dark:bg-zinc-950 rounded-tr-3xl">
                <div className="text-center p-8">
                  <motion.div animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/20"
                  >
                    <MessageCircle className="w-10 h-10 text-white"/>
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-700 dark:text-white">{t.welcome}</h3>
                  <p className="text-sm text-slate-400 mt-2">{t.welcomeHint}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: -10 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-2 z-[100] w-48 overflow-hidden backdrop-blur-lg"
          >
            <button onClick={() => { setEditingMessageId(contextMenu.messageId); const msg = messages.find(m => m.id === contextMenu.messageId); if(msg) setEditContent(msg.content || ""); setContextMenu(null); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
            ><Edit className="w-4 h-4"/> Edit</button>
            <button onClick={() => { setDeleteConfirmId(contextMenu.messageId); setContextMenu(null); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
            ><Trash2 className="w-4 h-4"/> Delete</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && selectedChat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowProfileModal(false)}>
            <motion.div initial={{ scale: 0.5, y: 100, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.5, y: 100, opacity: 0 }} transition={{ type: "spring", damping: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
              <div className="relative h-40 w-full">
                {selectedChat.friend.banner ? <Image src={selectedChat.friend.banner} alt="" fill className="object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />}
                <div className="absolute -bottom-16 inset-x-0 flex justify-center">
                  <motion.div className="relative cursor-pointer" whileHover={{ scale: 1.05 }} onClick={() => selectedChat.friend.image && setViewingImage(selectedChat.friend.image)}>
                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden bg-slate-200 dark:bg-zinc-800 shadow-2xl transition-all duration-300 hover:ring-4 hover:ring-indigo-500/50">
                      {selectedChat.friend.image ? <Image src={selectedChat.friend.image} alt="" width={128} height={128} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-white bg-gradient-to-br from-slate-300 to-slate-400 dark:from-zinc-700 dark:to-zinc-800"><User className="w-16 h-16"/></div>}
                    </div>
                  </motion.div>
                </div>
              </div>
              <div className="pt-20 pb-6 px-6 text-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedChat.friend.name}</h3>
                {selectedChat.friend.bio && <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800"><p className="text-sm text-slate-600 dark:text-slate-400 italic">&ldquo;{selectedChat.friend.bio}&rdquo;</p></div>}
                <div className="mt-6 space-y-3">
                  <Link href={`/users/${selectedChat.friend.id}`} passHref>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30" onClick={() => setShowProfileModal(false)}>
                      <ExternalLink className="w-4 h-4"/> {t.viewProfile}
                    </motion.button>
                  </Link>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowProfileModal(false)}
                    className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-white rounded-full font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                  >{t.close}</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirmId(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7" /></div>
              <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">{t.deleteConfirm}</h3>
              <p className="text-sm text-slate-500 mb-6">{t.deleteWarning}</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-sm text-slate-700 dark:text-white">{t.cancel}</button>
                <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-2.5 bg-rose-600 text-white rounded-full font-semibold hover:bg-rose-700 transition-colors text-sm shadow-lg shadow-rose-500/30">{t.delete}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Viewer */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 cursor-pointer" onClick={() => setViewingImage(null)}>
            <motion.button whileHover={{ scale: 1.1 }} className="absolute top-4 right-4 text-white/50 hover:text-white p-2 bg-white/10 rounded-full backdrop-blur-sm z-10"><X className="w-6 h-6"/></motion.button>
            <motion.img src={viewingImage} initial={{ scale: 0.5, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.5, opacity: 0, rotate: 10 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"/>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
