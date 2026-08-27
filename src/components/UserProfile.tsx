import React, { useState, useEffect } from 'react';
import { User, Post } from '../types.js';
import { useApp } from './AppContext.tsx';
import { PostCard } from './PostCard.tsx';
import { 
  ChevronLeft, MapPin, Calendar, Link as LinkIcon, 
  MessageSquare, UserPlus, UserCheck, Clock, Shield, Activity, Sparkles, Send, Check, X, CheckCircle2, ShieldAlert, Loader2, BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils/apiFetch';
import { getCountryFlag } from '../utils/formatters.ts';

interface UserProfileProps {
  userId: string;
  onBack: () => void;
}

// Memory cache for trader profiles to ensure instant profile view rendering
const userProfileCache: Record<string, User> = {};

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onBack }) => {
  const { 
    currentUser, 
    setCurrentUser,
    posts: appPosts,
    getConnectionStatus, 
    sendConnectionRequest, 
    acceptConnectionRequest,
    declineConnectionRequest,
    setActiveChatPartnerId, 
    setActiveView,
    viewUserProfile,
    showToast 
  } = useApp();

  const [user, setUser] = useState<User | null>(() => {
    if (userProfileCache[userId]) return userProfileCache[userId];
    const match = appPosts?.find(p => p.userId === userId);
    if (match) {
      const parts = (match.authorName || '').trim().split(' ');
      return {
        id: userId,
        firstName: parts[0] || 'Trader',
        lastName: parts.slice(1).join(' ') || '',
        username: match.authorUsername || 'trader',
        avatar: match.authorAvatar || '👤',
        tradingExperience: match.authorRole || 'Trader',
        city: match.authorCity || 'Jakarta',
        country: match.authorCountry || 'Indonesia',
        followersCount: 0,
        followingCount: 0,
      } as User;
    }
    return null;
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(!user);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'declined' | 'received_pending'>('none');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);

  // Follows modal states
  const [showFollowsModal, setShowFollowsModal] = useState<'followers' | 'following' | null>(null);
  const [followsData, setFollowsData] = useState<{ followingDetails: any[]; followerDetails: any[] } | null>(null);
  const [loadingFollows, setLoadingFollows] = useState(false);
  const [followsSearchQuery, setFollowsSearchQuery] = useState('');

  const openFollowsModal = async (type: 'followers' | 'following') => {
    setShowFollowsModal(type);
    setLoadingFollows(true);
    try {
      const res = await apiFetch(`/api/users/${userId}/follows`);
      if (res.ok) {
        const data = await res.json();
        setFollowsData({
          followingDetails: data.followingDetails || [],
          followerDetails: data.followerDetails || []
        });
      }
    } catch (e) {
      console.error("Failed to fetch follows:", e);
    } finally {
      setLoadingFollows(false);
    }
  };

  const currentList = showFollowsModal === 'followers' 
    ? (followsData?.followerDetails || []) 
    : (followsData?.followingDetails || []);

  const filteredFollowsList = currentList.filter(u => {
    const query = followsSearchQuery.toLowerCase();
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const username = (u.username || '').toLowerCase();
    return fullName.includes(query) || username.includes(query);
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiFetch(`/api/users/profile/${userId}`);
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          userProfileCache[userId] = userData;
        }
        
        const postsRes = await apiFetch(`/api/posts?userId=${userId}`);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData);
        }

        const status = await getConnectionStatus(userId);
        setConnectionStatus(status);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const fetchFollowState = async () => {
      if (!currentUser) return;
      try {
        const res = await apiFetch(`/api/users/${currentUser.id}/follows`);
        if (res.ok) {
          const data = await res.json();
          const following = data.following || [];
          setIsFollowing(following.includes(userId));
        }
        
        // Check if target user follows current user
        const targetRes = await apiFetch(`/api/users/${userId}/follows`);
        if (targetRes.ok) {
          const targetData = await targetRes.json();
          const targetFollowing = targetData.following || [];
          setFollowsMe(targetFollowing.includes(currentUser.id));
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchUser();
    fetchFollowState();
  }, [userId, currentUser?.id]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    if (isFollowing) {
      setShowUnfollowConfirm(true);
      return;
    }
    await performFollowAction();
  };

  const performFollowAction = async () => {
    if (!currentUser) return;

    // Optimistic Update
    const oldIsFollowing = isFollowing;
    const oldFollowersCount = user?.followersCount || 0;
    const oldCurrentUserFollowingCount = currentUser?.followingCount || 0;
    
    const nextIsFollowing = !oldIsFollowing;
    setIsFollowing(nextIsFollowing);
    if (user) {
      setUser({
        ...user,
        followersCount: nextIsFollowing ? oldFollowersCount + 1 : Math.max(0, oldFollowersCount - 1)
      });
    }
    setCurrentUser({
      ...currentUser,
      followingCount: nextIsFollowing ? oldCurrentUserFollowingCount + 1 : Math.max(0, oldCurrentUserFollowingCount - 1)
    });

    try {
      const res = await apiFetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser.id })
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.followed === 'boolean') {
          setIsFollowing(data.followed);
        }
        showToast(nextIsFollowing ? `Mulai mengikuti ${user?.firstName}` : `Batal mengikuti ${user?.firstName}`);
      } else {
        // Rollback
        setIsFollowing(oldIsFollowing);
        if (user) {
          setUser({ ...user, followersCount: oldFollowersCount });
        }
        setCurrentUser({ ...currentUser, followingCount: oldCurrentUserFollowingCount });
        showToast("Gagal mengubah status mengikuti.");
      }
    } catch (e) {
      console.error(e);
      // Rollback
      setIsFollowing(oldIsFollowing);
      if (user) {
        setUser({ ...user, followersCount: oldFollowersCount });
      }
      setCurrentUser({ ...currentUser, followingCount: oldCurrentUserFollowingCount });
      showToast("Koneksi bermasalah. Batal mengubah status mengikuti.");
    }
  };

  const refreshUserPosts = async () => {
    try {
      const postsRes = await apiFetch(`/api/posts?userId=${userId}`);
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnect = async () => {
    if (connectionStatus === 'none') {
      await sendConnectionRequest(userId);
      setConnectionStatus('pending');
    }
  };

  const handleMessage = () => {
    setActiveChatPartnerId(userId);
    setActiveView('messages');
    showToast(`Opening chat with ${user?.firstName}...`);
  };

  if (loading && !user) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="relative">
          <button 
            onClick={onBack}
            className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-gray-700 dark:text-gray-200 cursor-pointer shadow-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            title="Kembali"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-32 w-full rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="absolute -bottom-8 left-6 w-20 h-20 rounded-2xl bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900 flex items-center justify-center text-2xl" />
        </div>
        <div className="pt-8 space-y-4 px-2">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">User not found.</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header / Cover */}
      <div className="relative">
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="h-32 w-full overflow-hidden rounded-3xl bg-slate-200">
          {user.coverPhoto || (user as any).cover_photo ? (
            <img src={user.coverPhoto || (user as any).cover_photo} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-violet-600" />
          )}
        </div>

        <div className="absolute -bottom-10 left-6">
          <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl relative">
            <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-black overflow-hidden">
              {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) ? (
                <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user.avatar
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Name and Subtitle under the profile picture */}
      <div className="pt-14 px-6 space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h2 className="text-xl font-black text-slate-900 leading-none">{user.firstName} {user.lastName}</h2>
          {(user.mt5Connected || user.isVerified) && (
            <BadgeCheck size={20} className="text-blue-500 fill-blue-500 shrink-0 text-white" />
          )}
          <Shield size={16} className="text-indigo-500" />
          {followsMe && (
            <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Mengikuti Anda
            </span>
          )}
        </div>

        {/* Subtitle status: Verified / Unverified Member */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {(user.mt5Connected || user.isVerified) ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/25">
              <CheckCircle2 size={13} className="text-emerald-500" />
              Verified Member
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
              <ShieldAlert size={13} className="text-slate-400" />
              Unverified Member
            </span>
          )}
        </div>

        {/* Social Stats indicators */}
        <div className="flex gap-6 pt-2.5 text-[13px] border-t border-slate-100 dark:border-gray-800/20 mt-2">
          <button 
            onClick={() => openFollowsModal('followers')}
            className="hover:underline decoration-indigo-500 underline-offset-4 cursor-pointer text-left"
          >
            <span className="text-slate-900 dark:text-white font-bold">{user.followersCount || 0}</span>{' '}
            <span className="text-slate-500 dark:text-gray-500">followers</span>
          </button>
          <button 
            onClick={() => openFollowsModal('following')}
            className="hover:underline decoration-indigo-500 underline-offset-4 cursor-pointer text-left"
          >
            <span className="text-slate-900 dark:text-white font-bold">{user.followingCount || 0}</span>{' '}
            <span className="text-slate-500 dark:text-gray-500">following</span>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 flex gap-2">
        <motion.button 
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={handleFollowToggle}
          className={`flex-1 py-2.5 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isFollowing 
              ? 'bg-slate-100 dark:bg-gray-850 text-slate-600 dark:text-gray-300 hover:bg-slate-200/80 dark:hover:bg-gray-700/80 border border-slate-200/40 dark:border-gray-700' 
              : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-sm'
          }`}
        >
          {isFollowing ? <Check size={14} className="text-emerald-500" /> : <UserPlus size={14} />}
          {isFollowing ? 'Following' : (followsMe ? 'Follow Back' : 'Follow')}
        </motion.button>
        
        <button 
          onClick={handleMessage}
          className="flex-1 py-2.5 bg-white dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-200 rounded-full font-bold text-xs transition-all active:scale-95 hover:bg-slate-50 dark:hover:bg-gray-700/80 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Send size={14} className="rotate-45 -mt-0.5 text-indigo-500" />
          Message
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Headline</h3>
          <p className="text-sm font-bold text-slate-800 leading-relaxed">{user.headline}</p>
        </div>

        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">About</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{user.bio}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <button 
            onClick={() => {
              if (user?.city) {
                setActiveView('groups');
              }
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition cursor-pointer active:scale-95 text-left"
            title="Buka Halaman Grup Komunitas"
          >
            <MapPin size={14} className="shrink-0 text-red-500 fill-red-500/20" />
            <span className="text-xs font-bold underline decoration-indigo-500/25 underline-offset-2">{user.city}, {user.country}</span>
          </button>
          <div className="flex items-center gap-2 text-slate-500">
            <Activity size={14} />
            <span className="text-xs font-bold">{user.tradingExperience}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles size={14} />
            <span className="text-xs font-bold">{user.reputationPoints} Reputation</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <LinkIcon size={14} />
            <span className="text-xs font-bold">{user.tradingAsset} Expert</span>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="space-y-4 pb-10">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Recent Analysis</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{posts.length} Posts</span>
        </div>

        {posts.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-10 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No public posts yet.</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onPostUpdated={refreshUserPosts} />
          ))
        )}
      </div>

      {/* Follows Modal */}
      <AnimatePresence>
        {showFollowsModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowFollowsModal(null);
                setFollowsSearchQuery('');
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative bg-white dark:bg-[#121620] w-full max-w-md h-[500px] rounded-3xl border border-slate-100 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden z-10 text-left"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white capitalize">
                    {showFollowsModal === 'followers' ? 'Followers' : 'Following'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {showFollowsModal === 'followers' 
                      ? `${filteredFollowsList.length} orang mengikuti` 
                      : `mengikuti ${filteredFollowsList.length} orang`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowFollowsModal(null);
                    setFollowsSearchQuery('');
                  }}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-gray-850 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search bar */}
              <div className="px-5 py-3 bg-slate-50/50 dark:bg-[#181D28]/30 border-b border-slate-100 dark:border-gray-800">
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Cari trader..."
                    value={followsSearchQuery}
                    onChange={(e) => setFollowsSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-gray-800/60 rounded-full py-1.5 pl-9 pr-4 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* List area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {loadingFollows ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2.5">
                    <Loader2 size={24} className="text-indigo-600 animate-spin" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Memuat list...</span>
                  </div>
                ) : filteredFollowsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-wide">
                      {followsSearchQuery ? 'Tidak ada hasil yang cocok.' : 'Belum ada data.'}
                    </p>
                  </div>
                ) : (
                  filteredFollowsList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowFollowsModal(null);
                        setFollowsSearchQuery('');
                        viewUserProfile(item.id);
                      }}
                      className="p-2.5 bg-slate-50/50 dark:bg-[#181D28]/40 hover:bg-slate-50 dark:hover:bg-[#181D28] border border-slate-100 dark:border-gray-800/40 hover:border-slate-200 dark:hover:border-gray-700/60 rounded-2xl flex items-center gap-3 cursor-pointer transition active:scale-[0.98]"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200/20 shadow-xs">
                        {item.avatar && item.avatar.length > 2 ? (
                          <img src={item.avatar} alt={item.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{(item.firstName?.[0] || 'U').toUpperCase()}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.firstName} {item.lastName}
                          </span>
                          {item.country && (
                            <span className="text-[10px]" title={item.country}>
                              {getCountryFlag(item.country)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 dark:text-gray-400 mt-0.5">
                          <span className="truncate">@{item.username}</span>
                          {item.city && <span className="opacity-50">• {item.city}</span>}
                        </div>
                      </div>

                      {/* Badge */}
                      {item.tradingAsset && (
                        <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider shrink-0 border border-indigo-100/30 dark:border-indigo-900/10">
                          {item.tradingAsset}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unfollow Confirmation Modal */}
      <AnimatePresence>
        {showUnfollowConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUnfollowConfirm(false)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white dark:bg-[#151c2c] w-full max-w-[340px] rounded-3xl p-6 border border-slate-100 dark:border-gray-800 shadow-2xl z-10 text-left space-y-4"
            >
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Setop ikuti {user?.firstName} {user?.lastName}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Postingannya tidak akan muncul lagi di timeline beranda Anda. Anda tetap dapat melihat profilnya, kecuali jika postingannya dilindungi.
              </p>
              <div className="flex items-center justify-end gap-6 pt-2">
                <button
                  onClick={() => setShowUnfollowConfirm(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  onClick={async () => {
                    setShowUnfollowConfirm(false);
                    await performFollowAction();
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition cursor-pointer"
                >
                  Setop Ikuti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
