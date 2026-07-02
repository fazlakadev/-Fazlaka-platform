'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Eye, Heart, MessageCircle, ArrowLeft, Clock, User, AlertCircle, Trash2, Edit, Play, Calendar, ThumbsUp, ExternalLink, Search, Users, Ban, MailWarning, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { pusherClient } from '@/lib/pusher';

interface ContentInfo {
  id: string; title: string; titleEn: string; slug: string;
  thumbnailUrl?: string | null; thumbnailUrlEn?: string | null;
}

interface UserInfo {
  id: string; name: string | null; email: string | null; image: string | null; role?: string;
}

interface Viewer {
  id: string; createdAt: string; userId: string;
  user: UserInfo | null;
}

interface Like {
  id: string; createdAt: string; userId: string;
  user: UserInfo;
}

interface Comment {
  id: string; content: string; createdAt: string; isEdited: boolean;
  userRelation: UserInfo | null;
  _count: { likes: number; replies: number };
}

interface AnalyticsData {
  content: ContentInfo;
  totalViews: number;
  viewers: Viewer[];
  likes: Like[];
  comments: Comment[];
}

export default function EpisodeAnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'viewers' | 'likes' | 'comments'>('viewers');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commentSearch, setCommentSearch] = useState('');
  const [editModal, setEditModal] = useState<{ id: string; content: string } | null>(null);
  const [actionModal, setActionModal] = useState<{ id: string; type: 'delete' | 'warn' | 'ban' } | null>(null);
  const [reason, setReason] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/episodes/${slug}/analytics`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (!json.data) throw new Error('Invalid response');
      setData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time updates via Pusher
  useEffect(() => {
    if (!data?.content.id) return;
    const channelName = `comments-${data.content.id}`;
    const channel = pusherClient.subscribe(channelName);
    channel.bind('new-comment', () => { fetchData(); });
    const dashChannel = pusherClient.subscribe('admin-dashboard');
    dashChannel.bind('refresh', () => { fetchData(); });
    return () => {
      channel.unbind_all(); channel.unsubscribe();
      dashChannel.unbind_all(); dashChannel.unsubscribe();
    };
  }, [data?.content.id, fetchData]);

  const handleEditSubmit = async () => {
    if (!editModal) return;
    setActionLoading(editModal.id);
    try {
      await fetch(`/api/admin/comments/${editModal.id}/action`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', newContent: editModal.content }),
      });
      setEditModal(null); fetchData();
    } finally { setActionLoading(null); }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(actionModal.id);
    try {
      await fetch(`/api/admin/comments/${actionModal.id}/action`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionModal.type, reason }),
      });
      setActionModal(null); setReason(''); fetchData();
    } finally { setActionLoading(null); }
  };

  const filteredComments = data?.comments.filter(c => {
    if (!commentSearch) return true;
    const q = commentSearch.toLowerCase();
    return c.content.toLowerCase().includes(q) || c.userRelation?.name?.toLowerCase().includes(q);
  }) || [];

  const formatDate = (d: string) => new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 font-semibold text-lg mb-2">Failed to load analytics</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button onClick={fetchData} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-semibold">Retry</button>
      </div>
    </div>
  );

  if (!data) return null;

  const thumbnail = data.content.thumbnailUrl || data.content.thumbnailUrlEn || '';

  const TabButton = ({ tab, icon: Icon, label, count }: { tab: typeof activeTab; icon: LucideIcon; label: string; count: number }) => (
    <button onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'}`}>
      <Icon size={16} /> {label} <span className="opacity-60">({count})</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900" dir="ltr">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <Link href="/admin/episodes" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-8 w-fit">
          <ArrowLeft size={18} /> Back to Episodes
        </Link>

        {/* Hero Card */}
        <div className="relative bg-gradient-to-br from-gray-800/80 via-gray-800/40 to-purple-900/30 rounded-3xl border border-gray-700/50 overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-transparent pointer-events-none" />
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="shrink-0 w-full md:w-48 h-48 rounded-2xl overflow-hidden bg-gray-700 border border-gray-600/50 shadow-2xl">
              {thumbnail ? (
                <Image src={thumbnail} alt="" width={192} height={192} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Play className="w-12 h-12 text-gray-500" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{data.content.title || data.content.titleEn}</h1>
                  <p className="text-gray-400 text-sm truncate">{data.content.slug}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/admin/episodes/${data.content.slug}/edit`} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-indigo-600/30">
                    <Edit size={16} /> Edit
                  </Link>
                  <a href={`/episodes/${data.content.slug}`} target="_blank" className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-all text-sm font-semibold">
                    <ExternalLink size={16} /> View
                  </a>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-600/30">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{data.totalViews.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Total Views</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{data.likes.length.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Total Likes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{data.comments.length.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Total Comments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <TabButton tab="viewers" icon={Users} label="Viewers" count={data.viewers.length} />
          <TabButton tab="likes" icon={ThumbsUp} label="Likes" count={data.likes.length} />
          <TabButton tab="comments" icon={MessageCircle} label="Comments" count={data.comments.length} />
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
          {/* VIEWERS */}
          {activeTab === 'viewers' && (
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users size={20} className="text-purple-400" /> Viewers ({data.viewers.length})
              </h2>
              {data.viewers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No viewers yet</p>
              ) : (
                <div className="space-y-2">
                  {data.viewers.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                          {v.user?.image ? <Image src={v.user.image} alt="" width={36} height={36} className="w-full h-full object-cover" /> : <User size={16} className="text-gray-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{v.user?.name || 'Anonymous'}</p>
                          {v.user?.email && <p className="text-xs text-gray-500 truncate">{v.user.email}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                        <Clock size={12} /> {formatDate(v.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LIKES */}
          {activeTab === 'likes' && (
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Heart size={20} className="text-red-400" /> Likes ({data.likes.length})
              </h2>
              {data.likes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No likes yet</p>
              ) : (
                <div className="space-y-2">
                  {data.likes.map((like) => (
                    <div key={like.id} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                          {like.user?.image ? <Image src={like.user.image} alt="" width={36} height={36} className="w-full h-full object-cover" /> : <User size={16} className="text-gray-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{like.user?.name || 'Anonymous'}</p>
                          {like.user?.email && <p className="text-xs text-gray-500 truncate">{like.user.email}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                        <Heart size={12} className="text-red-400 fill-red-400" /> {formatDate(like.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMMENTS */}
          {activeTab === 'comments' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageCircle size={20} className="text-blue-400" /> Comments ({data.comments.length})
                </h2>
                <div className="relative max-w-xs w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={commentSearch} onChange={e => setCommentSearch(e.target.value)} placeholder="Search comments..." className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>
              </div>
              {filteredComments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No comments yet</p>
              ) : (
                <div className="space-y-3">
                  {filteredComments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                            {comment.userRelation?.image ? <Image src={comment.userRelation.image} alt="" width={36} height={36} className="w-full h-full object-cover" /> : <User size={16} className="text-gray-400" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white truncate">{comment.userRelation?.name || 'Anonymous'}</p>
                              {comment.userRelation?.email && <span className="text-xs text-gray-500 hidden sm:inline">{comment.userRelation.email}</span>}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <Calendar size={11} /> {formatDate(comment.createdAt)}
                              {comment.isEdited && <span className="text-yellow-400">(edited)</span>}
                              <span className="flex items-center gap-1"><ThumbsUp size={11} />{comment._count.likes}</span>
                              <span className="flex items-center gap-1"><MessageCircle size={11} />{comment._count.replies}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => setEditModal({ id: comment.id, content: comment.content })} className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-all" title="Edit"><Edit size={14} /></button>
                          <button onClick={() => setActionModal({ id: comment.id, type: 'delete' })} className="p-2 bg-gray-600/20 hover:bg-gray-600/40 text-gray-400 rounded-lg transition-all" title="Delete"><Trash2 size={14} /></button>
                          <button onClick={() => setActionModal({ id: comment.id, type: 'warn' })} className="p-2 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 rounded-lg transition-all" title="Warn"><MailWarning size={14} /></button>
                          <button onClick={() => setActionModal({ id: comment.id, type: 'ban' })} className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-all" title="Ban"><Ban size={14} /></button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-xl border border-gray-700" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-4">Edit Comment</h3>
            <textarea value={editModal.content} onChange={e => setEditModal({ ...editModal, content: e.target.value })} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white h-32 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors text-sm font-semibold">Cancel</button>
              <button onClick={handleEditSubmit} disabled={actionLoading === editModal.id} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                {actionLoading === editModal.id && <Loader2 size={14} className="animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
          <div className="bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-xl border border-gray-700" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-4 capitalize">
              {actionModal.type === 'delete' ? 'Delete Comment' : actionModal.type === 'warn' ? 'Warn User' : 'Ban User'}
            </h3>
            {actionModal.type !== 'delete' && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Reason / Message:</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm" placeholder="Write the reason here..." />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setActionModal(null)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors text-sm font-semibold">Cancel</button>
              <button onClick={handleAction} disabled={actionLoading === actionModal.id} className={`px-4 py-2 text-white rounded-xl transition-colors text-sm font-semibold disabled:opacity-50 flex items-center gap-2 ${actionModal.type === 'ban' ? 'bg-red-600 hover:bg-red-700' : actionModal.type === 'warn' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-500'}`}>
                {actionLoading === actionModal.id && <Loader2 size={14} className="animate-spin" />} Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
