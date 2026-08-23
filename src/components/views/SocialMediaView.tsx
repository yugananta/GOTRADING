import React, { useState } from 'react';
import {
  MessageSquareShare,
  ThumbsUp,
  MessageCircle,
  Share2,
  Pin,
  Star,
  ShieldAlert,
  Trash2,
  Check,
  X,
  Plus,
  Send,
  Image as ImageIcon,
  Users,
  Megaphone,
  Sparkles,
  Tag,
  Radio,
  Layers,
  Award
} from 'lucide-react';
import { SocialPost, SocialReport } from '../../types';
import { Badge } from '../ui/Badge';

interface SocialMediaViewProps {
  posts: SocialPost[];
  reports: SocialReport[];
  onModeratePost: (postId: string, action: 'PUBLISH' | 'UNPUBLISH' | 'DELETE' | 'FEATURE') => void;
  onCreateAdminPost?: (title: string, content: string, groupName: string, isPinned: boolean, imageUrl?: string, hashtags?: string[]) => void;
  onTogglePinPost?: (postId: string) => void;
}

export const SocialMediaView: React.FC<SocialMediaViewProps> = ({
  posts,
  reports,
  onModeratePost,
  onCreateAdminPost,
  onTogglePinPost
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'reports' | 'analytics'>('feed');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Form State for Admin Post
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postGroupName, setPostGroupName] = useState('Feed Utama Komunitas');
  const [isPinnedCard, setIsPinnedCard] = useState(true);
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postHashtagsInput, setPostHashtagsInput] = useState('GotradingOfficial, SignalVIP, Announcement');

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    const hashtagsArray = postHashtagsInput
      .split(',')
      .map(h => h.trim().replace(/^#/, ''))
      .filter(Boolean);

    if (onCreateAdminPost) {
      onCreateAdminPost(
        postTitle,
        postContent,
        postGroupName,
        isPinnedCard,
        postImageUrl || undefined,
        hashtagsArray
      );
    }

    // Reset Form
    setPostTitle('');
    setPostContent('');
    setPostImageUrl('');
    setIsComposerOpen(false);
  };

  // Separate Pinned Card Posts vs Regular Posts
  const pinnedPosts = posts.filter(p => p.isPinned);
  const filteredPosts = posts.filter(p => {
    if (selectedGroupFilter === 'ALL') return true;
    return p.groupName === selectedGroupFilter;
  });

  const availableGroups = [
    'Feed Utama Komunitas',
    'Grup VIP Signals & Analytics',
    'Grup Master IB & Sub-IB',
    'Grup Diskusi XAUUSD (Gold)',
    'Grup Edukasi & Scalping'
  ];

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquareShare className="w-5 h-5 text-emerald-400" /> COMMUNITY FEED & ADMIN PINNED POSTS
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Fitur posting langsung admin untuk Card Post Pinned di Feed/Grup, moderasi postingan, dan penyelesaian laporan komunitas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsComposerOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" /> Posting Di Card Post Pinned
          </button>
        </div>
      </div>

      {/* Navigation & Group Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-mono text-[11px] mr-1">Filter Grup:</span>
          <button
            onClick={() => setSelectedGroupFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
              selectedGroupFilter === 'ALL'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            Semua Feed & Grup ({posts.length})
          </button>

          {availableGroups.map(grp => (
            <button
              key={grp}
              onClick={() => setSelectedGroupFilter(grp)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                selectedGroupFilter === grp
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white bg-slate-950'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>

        <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs shrink-0">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
              activeTab === 'feed' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Feed Community ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
              activeTab === 'reports' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Laporan Queue ({reports.filter(r => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
              activeTab === 'analytics' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Analitik Sosial
          </button>
        </div>
      </div>

      {/* ADMIN POST CREATOR FORM MODAL */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Buat Posting Admin & Card Post Pinned</h3>
                  <p className="text-xs text-slate-400">Posting pengumuman resmi admin di feed atau grup pilihan</p>
                </div>
              </div>

              <button
                onClick={() => setIsComposerOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreatePostSubmit} className="p-6 space-y-4 text-xs">
              {/* Group Destination */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">TUJUAN GRUP / FEED</label>
                <select
                  value={postGroupName}
                  onChange={e => setPostGroupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {availableGroups.map(grp => (
                    <option key={grp} value={grp}>{grp}</option>
                  ))}
                </select>
              </div>

              {/* Card Post Pinned Checkbox Toggle */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Pin className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-bold text-amber-400 text-xs block">PIN SEBAGAI CARD POST PINNED</span>
                    <span className="text-[11px] text-slate-300">
                      Postingan ini akan disematkan di bagian atas grup/feed sebagai Kartu Pengumuman Pinned.
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isPinnedCard}
                  onChange={e => setIsPinnedCard(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">JUDUL POSTING / PENGUMUMAN (OPSIONAL)</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  placeholder="Contoh: 🚀 Sinyal Gold XAUUSD High Probability & Promo Bonus Deposit 50%"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-bold text-xs"
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">ISI KONTEN POSTING *</label>
                <textarea
                  rows={4}
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder="Tuliskan analisis trading, sinyal, pengumuman resmi, atau berita promo di sini..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed text-xs"
                />
              </div>

              {/* Image URL Input */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> URL GAMBAR / BANNER ANALISIS (OPSIONAL)
                </label>
                <input
                  type="url"
                  value={postImageUrl}
                  onChange={e => setPostImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              {/* Hashtags Input */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" /> HASHTAGS (Pisahkan Komma)
                </label>
                <input
                  type="text"
                  value={postHashtagsInput}
                  onChange={e => setPostHashtagsInput(e.target.value)}
                  placeholder="GotradingOfficial, SignalGold, Bonus100"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                >
                  <Send className="w-4 h-4" /> Publikasikan Posting Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="space-y-6">
          {/* 1. PINNED POST CARDS SECTION */}
          {pinnedPosts.length > 0 && (
            <div className="p-5 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/40 rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Pin className="w-4 h-4 fill-amber-400" /> CARD POST PINNED (PENGUMUMAN RESMI ADMIN)
                </div>
                <span className="text-[10px] text-amber-300/80 font-mono font-bold">
                  {pinnedPosts.length} Card Posts Disematkan
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedPosts.map(p => (
                  <div
                    key={p.id}
                    className="p-4 bg-slate-950 border border-amber-500/30 rounded-xl space-y-3 relative hover:border-amber-400 transition-all shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img src={p.userAvatar} alt={p.userName} className="w-7 h-7 rounded-full border border-amber-400/50" />
                        <div>
                          <span className="font-bold text-white text-xs block">{p.userName}</span>
                          <span className="text-[10px] text-amber-400 font-mono font-semibold">{p.groupName || 'Feed Komunitas'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Badge variant="warning font-bold">📌 CARD PINNED</Badge>
                        {onTogglePinPost && (
                          <button
                            onClick={() => onTogglePinPost(p.id)}
                            className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                            title="Unpin Card Post"
                          >
                            <Pin className="w-3.5 h-3.5 fill-amber-400" />
                          </button>
                        )}
                      </div>
                    </div>

                    {p.title && (
                      <h4 className="font-bold text-amber-300 text-sm tracking-tight">{p.title}</h4>
                    )}

                    <p className="text-xs text-slate-200 leading-relaxed">{p.content}</p>

                    {p.mediaUrls && p.mediaUrls.length > 0 && (
                      <div className="rounded-lg overflow-hidden border border-slate-800 max-h-48">
                        <img src={p.mediaUrls[0]} alt="Media" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
                      <div className="flex gap-3">
                        <span className="flex items-center gap-1 text-slate-300 font-bold"><ThumbsUp className="w-3 h-3 text-emerald-400" /> {p.likesCount}</span>
                        <span className="flex items-center gap-1 text-slate-300 font-bold"><MessageCircle className="w-3 h-3 text-sky-400" /> {p.commentsCount}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{p.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. REGULAR COMMUNITY & GROUP POSTS */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> SEMUA POSTINGAN FEED & GRUP KOMUNITAS
            </h3>

            {filteredPosts.map(p => (
              <div key={p.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={p.userAvatar} alt={p.userName} className="w-8 h-8 rounded-full border border-slate-700" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{p.userName}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                          {p.groupName || 'Feed Komunitas'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{p.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.isPinned && <Badge variant="warning">PINNED CARD</Badge>}
                    {p.isFeatured && <Badge variant="purple font-bold">FEATURED</Badge>}
                    <Badge variant={p.status === 'PUBLISHED' ? 'success' : 'danger'}>{p.status}</Badge>
                  </div>
                </div>

                {p.title && (
                  <h4 className="font-bold text-white text-sm tracking-tight">{p.title}</h4>
                )}

                <p className="text-xs text-slate-200 leading-relaxed">{p.content}</p>

                {p.mediaUrls && p.mediaUrls.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 max-h-64 max-w-xl">
                    <img src={p.mediaUrls[0]} alt="Media" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {p.hashtags.map(h => (
                    <span key={h} className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                      #{h}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4 font-mono">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {p.likesCount}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {p.commentsCount}</span>
                    <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> {p.sharesCount}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Pin Card Post */}
                    {onTogglePinPost && (
                      <button
                        onClick={() => onTogglePinPost(p.id)}
                        className={`p-1.5 rounded transition-colors flex items-center gap-1 text-[11px] font-bold ${
                          p.isPinned
                            ? 'text-amber-400 bg-amber-500/20 border border-amber-500/30'
                            : 'text-slate-400 bg-slate-800 hover:text-amber-400'
                        }`}
                        title={p.isPinned ? 'Unpin Card Post' : 'Pin Sebagai Card Post'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        {p.isPinned ? 'Pinned' : 'Pin Card'}
                      </button>
                    )}

                    <button
                      onClick={() => onModeratePost(p.id, 'FEATURE')}
                      className="p-1.5 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded transition-colors"
                      title="Toggle Featured Status"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onModeratePost(p.id, 'DELETE')}
                      className="p-1.5 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded transition-colors"
                      title="Delete Post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-400 text-xs">[{r.reason}]</span>
                  <span className="text-xs text-white">Reported by {r.reporterName}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{r.details}</p>
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded hover:bg-emerald-500/20">
                  Dismiss Laporan
                </button>
                <button className="px-3 py-1 bg-rose-500/10 text-rose-400 text-xs font-semibold rounded hover:bg-rose-500/20">
                  Hapus Post & Peringatkan User
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400">
          <p className="font-bold text-white mb-1">Community Social Engagement Overview</p>
          <p className="text-xs">Daily Active Posters: 480 • Total Weekly Interactions: 14,200 • Spam Rate: &lt; 0.2%</p>
        </div>
      )}
    </div>
  );
};
