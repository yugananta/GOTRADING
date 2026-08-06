import { PostCard } from "./PostCard.tsx";
import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext.tsx';
import { SponsoredBadge } from './SponsoredBadge.tsx';
import { Post, Comment } from '../types.js';
import { 
  Users, Pin, ShieldCheck, ThumbsUp, MessageSquare, Send, Share2, Image as ImageIcon,
  CheckCircle2, Plus, ArrowLeft, Search, MoreHorizontal, Sparkles, AlertCircle,
  TrendingUp, TrendingDown, MapPin, Globe, Filter, UserCheck, X, ChevronDown, ChevronUp,
  UserPlus, Clock, Check
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { poll } from '../utils/polling.ts';
import { apiFetch } from '../utils/apiFetch';
import { getSupabase } from '../lib/supabaseClient.ts';
import { deserializePost } from '../utils/postUtils.ts';
import { formatRelativeTime } from '../utils/dateUtils.ts';

interface GroupViewProps {
  initialGroupId?: string;
  onBack?: () => void;
}

export const GroupView: React.FC<GroupViewProps> = ({ initialGroupId, onBack }) => {
  const { 
    currentUser, 
    setCurrentUser,
    setActiveView, 
    viewUserProfile,
    sendConnectionRequest,
    acceptConnectionRequest,
    declineConnectionRequest,
    getConnectionStatus,
    showToast
  } = useApp();

  // Member list modal states
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [unfollowConfirmUser, setUnfollowConfirmUser] = useState<any | null>(null);

  const handleOpenMemberList = async () => {
    setIsMemberListOpen(true);
    setLoadingMembers(true);
    try {
      const locationVal = activeTab === 'city' ? selectedCity : selectedProvince;
      const url = activeTab === 'city'
        ? `/api/users?city=${encodeURIComponent(locationVal)}`
        : `/api/users?province=${encodeURIComponent(locationVal)}`;
      
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        // Exclude current user from the list
        const filtered = currentUser ? data.filter((u: any) => u.id !== currentUser.id) : data;
        setGroupMembers(filtered);
      }

      if (currentUser) {
        const followsRes = await apiFetch(`/api/users/${currentUser.id}/follows`);
        if (followsRes.ok) {
          const followsData = await followsRes.json();
          setFollowingIds(followsData.following || []);
        }
      }
    } catch (e) {
      console.error("Error fetching group members:", e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleFollowMember = async (targetId: string) => {
    if (!currentUser) return;
    if (followingIds.includes(targetId)) {
      const targetUser = groupMembers.find(m => m.id === targetId) || { id: targetId, firstName: 'User', lastName: '' };
      setUnfollowConfirmUser(targetUser);
      return;
    }
    await performFollowAction(targetId);
  };

  const performFollowAction = async (targetId: string) => {
    if (!currentUser) return;

    // Save previous state for rollback
    const previousFollowingIds = [...followingIds];
    const isCurrentlyFollowing = previousFollowingIds.includes(targetId);

    // Optimistic update
    const updatedFollowingIds = isCurrentlyFollowing
      ? previousFollowingIds.filter(id => id !== targetId)
      : [...previousFollowingIds, targetId];

    setFollowingIds(updatedFollowingIds);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        followingCount: isCurrentlyFollowing
          ? Math.max(0, (currentUser.followingCount || 0) - 1)
          : (currentUser.followingCount || 0) + 1
      });
    }

    try {
      const res = await apiFetch(`/api/users/${targetId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser.id })
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.followed === 'boolean') {
          if (data.followed) {
            setFollowingIds(prev => prev.includes(targetId) ? prev : [...prev, targetId]);
          } else {
            setFollowingIds(prev => prev.filter(id => id !== targetId));
          }
        }
      } else {
        // Rollback on server error
        setFollowingIds(previousFollowingIds);
        showToast("Gagal mengubah status mengikuti.");
      }
    } catch (err) {
      console.error("Failed to follow member:", err);
      // Rollback on network error
      setFollowingIds(previousFollowingIds);
      showToast("Koneksi bermasalah. Batal mengubah status mengikuti.");
    }
  };

  // Selected Group State: fixed strictly to user's registered domicile (city & province)
  const userCity = currentUser?.city || 'Jakarta Selatan';
  const userProvince = currentUser?.province || 'DKI Jakarta';

  const defaultCityGroupId = `group_city_${userCity.toLowerCase().replace(/\s+/g, '_')}`;
  const defaultProvinceGroupId = `group_province_${userProvince.toLowerCase().replace(/\s+/g, '_')}`;

  const [activeTab, setActiveTab] = useState<'city' | 'province'>(
    initialGroupId?.startsWith('group_province_') ? 'province' : 'city'
  );
  const [feedFilter, setFeedFilter] = useState<'latest' | 'top' | 'milestones'>('latest');

  const selectedCity = userCity;
  const selectedProvince = userProvince;

  // Group Posts State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // New Post Form State
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostSentiment, setNewPostSentiment] = useState<'Bullish' | 'Bearish' | 'Neutral' | null>(null);
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active expanded comments map (postId -> boolean)
  const [expandedComments, setExpandedComments] = useState<{ [postId: string]: boolean }>({});
  const [postComments, setPostComments] = useState<{ [postId: string]: Comment[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({});

  // Group Rules Dropdown, Official Daily Posts & Joined State
  const [showRulesDropdown, setShowRulesDropdown] = useState(false);
  const [isPinnedSectionExpanded, setIsPinnedSectionExpanded] = useState(false);
  const [isCreatingOfficialPost, setIsCreatingOfficialPost] = useState(false);
  const [newOfficialTitle, setNewOfficialTitle] = useState('');
  const [newOfficialContent, setNewOfficialContent] = useState('');
  const [isJoined, setIsJoined] = useState(true);

  // Map of groupId -> Array of Official Posts (Newest first)
  const [officialPostsMap, setOfficialPostsMap] = useState<{ [groupId: string]: Array<any> }>({});
  // Expanded state map for official posts (postId -> boolean)
  const [expandedOfficialPosts, setExpandedOfficialPosts] = useState<{ [postId: string]: boolean }>({});
  // Expanded state map for official post comments section (postId -> boolean)
  const [expandedOfficialComments, setExpandedOfficialComments] = useState<{ [postId: string]: boolean }>({});
  // Comment inputs for each official post (postId -> string)
  const [officialCommentInputs, setOfficialCommentInputs] = useState<{ [postId: string]: string }>({});

  // Dynamic Group Statistics (Real Member & Message count from Database)
  const [groupStats, setGroupStats] = useState<{
    city: { members: number; messages: number };
    province: { members: number; messages: number };
  }>({
    city: { members: 0, messages: 0 },
    province: { members: 0, messages: 0 }
  });

  // Derived current group info
  const currentGroupId = activeTab === 'city' 
    ? `group_city_${selectedCity.toLowerCase().replace(/\s+/g, '_')}`
    : `group_province_${selectedProvince.toLowerCase().replace(/\s+/g, '_')}`;

  const currentGroupName = activeTab === 'city'
    ? `Komunitas Trader ${selectedCity}`
    : `Komunitas Trader ${selectedProvince}`;

  const currentGroupTypeLabel = activeTab === 'city' ? `Grup Kota (${selectedCity})` : `Grup Provinsi (${selectedProvince})`;
  const locationName = activeTab === 'city' ? selectedCity : selectedProvince;

  // Helper to retrieve official posts for current group
  const getOfficialPosts = (groupId: string) => {
    const official = posts.filter(p => p.isOfficial && (p.groupId === groupId || !p.groupId));
    return official.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const currentOfficialPosts = getOfficialPosts(currentGroupId);
  
  const activePinnedPost = currentOfficialPosts.length > 0 && (Date.now() - new Date(currentOfficialPosts[0].timestamp || Date.now()).getTime()) < 24 * 60 * 60 * 1000
    ? currentOfficialPosts[0] 
    : null;
    

  // Admin creating a NEW official post (prepends to top, pushing older ones down)
  const handleCreateOfficialPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficialTitle.trim() || !newOfficialContent.trim()) return;

    const formattedTitle = newOfficialTitle.trim().startsWith("📌") 
      ? newOfficialTitle.trim() 
      : `📌 ${newOfficialTitle.trim()}`;

    const payload = {
      userId: "tarapti_official_admin",
      title: formattedTitle,
      content: newOfficialContent.trim(),
      groupId: currentGroupId,
      isOfficial: true,
      isPinned: true
    };

    try {
      const res = await apiFetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const createdPost = await res.json();
        setPosts(prev => [createdPost, ...prev]);
        setExpandedOfficialPosts(prev => ({ ...prev, [createdPost.id]: true }));
        setIsPinnedSectionExpanded(true);
      }
    } catch (err) {
      console.error(err);
    }

    setIsCreatingOfficialPost(false);
    setNewOfficialTitle("");
    setNewOfficialContent("");
  };

  // Toggle expansion of an official post
  const toggleExpandOfficialPost = (postId: string) => {
    setExpandedOfficialPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Toggle dropdown for official post comments section
  const toggleExpandOfficialComments = (postId: string) => {
    setExpandedOfficialComments(prev => {
      const isCurrentlyExpanded = prev[postId] !== undefined ? prev[postId] : true;
      return { ...prev, [postId]: !isCurrentlyExpanded };
    });
    // Auto expand the post if it was collapsed
    setExpandedOfficialPosts(prev => ({ ...prev, [postId]: true }));
  };

  // Like an official post
  const handleLikeOfficialPost = (postId: string) => {
    setOfficialPostsMap(prev => {
      const posts = prev[currentGroupId] || currentOfficialPosts;
      const updated = posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: {
              count: p.likes.liked ? p.likes.count - 1 : p.likes.count + 1,
              liked: !p.likes.liked
            }
          };
        }
        return p;
      });
      return { ...prev, [currentGroupId]: updated };
    });
  };

  // Add comment to an official post
  const handleAddOfficialComment = async (postId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const commentText = officialCommentInputs[postId]?.trim();
    if (!commentText || !currentUser) return;

    const authorName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username;

    const newComment = {
      id: `oc_${Date.now()}`,
      postId,
      userId: currentUser.id,
      authorName: authorName,
      authorUsername: currentUser.username,
      authorAvatar: currentUser.avatar || '👤',
      content: commentText,
      timestamp: new Date().toISOString(),
      likes: 0,
      liked: false,
    };

    setOfficialPostsMap(prev => {
      const posts = prev[currentGroupId] || currentOfficialPosts;
      const updated = posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), newComment]
          };
        }
        return p;
      });
      return { ...prev, [currentGroupId]: updated };
    });

    setOfficialCommentInputs(prev => ({ ...prev, [postId]: '' }));

    try {
      await apiFetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          content: commentText
        })
      });
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  // Like comment on an official post
  const handleLikeOfficialComment = (postId: string, commentId: string) => {
    setOfficialPostsMap(prev => {
      const posts = prev[currentGroupId] || currentOfficialPosts;
      const updated = posts.map(p => {
        if (p.id === postId) {
          const updatedComments = (p.comments || []).map((c: any) => {
            if (c.id === commentId) {
              return {
                ...c,
                likes: c.liked ? c.likes - 1 : c.likes + 1,
                liked: !c.liked
              };
            }
            return c;
          });
          return { ...p, comments: updatedComments };
        }
        return p;
      });
      return { ...prev, [currentGroupId]: updated };
    });
  };
  const fetchPosts = async () => {
    try {
      const res = await apiFetch(`/api/posts?groupId=${currentGroupId}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const seededPosts = getSeededGroupPosts(currentGroupId, currentGroupName, activeTab === "city" ? selectedCity : selectedProvince);
        const serverPosts = Array.isArray(data) ? data : seededPosts;
        
        setPosts(prev => {
          // Keep posts that are currently being sent (optimistic) 
          // and merge with server data, but remove those that are no longer on server
          const sendingPosts = prev.filter(p => p.isSending);
          
          // Filter out posts that are not on server AND not currently being sent
          // This ensures deleted posts are removed from the view
          return [...sendingPosts, ...serverPosts.filter(p => !sendingPosts.some(sp => sp.id === p.id))];
        });
      }
    } catch (err) {
      console.error("Error fetching group posts:", err);
    }
  };


  useEffect(() => {
    // Initial loading state
    setLoadingPosts(true);
    fetchPosts();

    // Supabase Realtime Subscription for this group
    const supabase = getSupabase();
    let channel: any = null;

    if (supabase) {
      channel = supabase
        .channel(`group-posts-${currentGroupId}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'Post',
            filter: `groupId=eq.${currentGroupId}`
          },
          (payload) => {
            const newPost = deserializePost(payload.new);
            setPosts(prev => {
              // 1. If we already have this post ID, don't add it again
              if (prev.some(p => p.id === newPost.id)) return prev;
              
              // 2. Handle optimistic update overlap
              const filtered = prev.filter(p => {
                const isMatch = p.isSending && 
                                p.userId === newPost.userId && 
                                p.content === newPost.content;
                return !isMatch;
              });

              return [newPost, ...filtered];
            });
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'Post',
            filter: `groupId=eq.${currentGroupId}`
          },
          (payload) => {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'Post',
            filter: `groupId=eq.${currentGroupId}`
          },
          (payload) => {
            const updatedPost = deserializePost(payload.new);
            setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
          }
        )
        .subscribe();
    }

    // Poll for group stats every 60s (stats still need polling as they are aggregated)
    const stopStatsPolling = poll<{ city: { members: number; messages: number }; province: { members: number; messages: number } }>(
      `/api/groups/stats?city=${encodeURIComponent(selectedCity)}&province=${encodeURIComponent(selectedProvince)}`,
      (data) => setGroupStats(data),
      () => {},
      60000
    );

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      stopStatsPolling();
    };
  }, [currentGroupId]);

  useEffect(() => {
    // Refresh stats when posts change (e.g. after a new post is added locally)
    const refreshStats = async () => {
      try {
        const res = await apiFetch(`/api/groups/stats?city=${encodeURIComponent(selectedCity)}&province=${encodeURIComponent(selectedProvince)}`);
        if (res.ok) {
          const data = await res.json();
          setGroupStats(data);
        }
      } catch (err) {}
    };
    refreshStats();
  }, [posts]);

  // Seeded Official and Community Posts for Groups
  const getSeededGroupPosts = (groupId: string, groupName: string, locationName: string): Post[] => {
    return [
      {
        id: `post_official_${groupId}_1`,
        groupId: groupId,
        userId: 'gotrading_official_admin',
        authorName: 'GoTrading Hub',
        authorUsername: 'gotradinghub',
        authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80',
        authorRole: 'Official Admin',
        authorCity: locationName,
        authorCountry: 'Indonesia',
        isOfficial: true,
        isPinned: true,
        content: `📌 OFFICIAL ANNOUNCEMENT FROM GOTRADING HUB (VERIFIED ✓)\n\nWelcome to ${groupName}! 🚀\n\nThis group is the official space for gathering, discussing technical analysis, sharing knowledge, and getting financial market updates for traders in the ${locationName} region.\n\nCommunity Rules:\n1. Discuss politely and respect each other's opinions.\n2. Include Risk Management (Stop Loss & Take Profit) when sharing signals/analysis.\n3. Strictly no spamming, scamming, or illegal promotions.\n\nLet's build a healthy and consistently profitable trading environment together! 🔥`,
        likesCount: 0,
        commentsCount: 0,
        bookmarksCount: 0,
        repostsCount: 0,
        likedBy: [],
        bookmarkedBy: [],
        repostedBy: [],
        timestamp: new Date().toISOString(),
        tags: ['GoTradingHub', 'TraderCommunity', locationName.replace(/\s+/g, '')]
      }
    ];
  };

  // Handle create new post in group
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostImage) return;

    if (!currentUser) {
      showToast("Silakan login terlebih dahulu untuk membuat postingan.");
      return;
    }

    const savedContent = newPostContent;
    const savedImage = newPostImage;
    const savedSentiment = newPostSentiment;

    // Construct optimistic post
    const tempPostId = `temp_group_post_${Date.now()}`;
    const optimisticPost: Post = {
      id: tempPostId,
      groupId: currentGroupId,
      userId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
      authorUsername: currentUser.username,
      authorAvatar: currentUser.avatar || '👤',
      authorRole: currentUser.tradingExperience || 'Member',
      authorCity: selectedCity,
      authorCountry: currentUser.country || 'Indonesia',
      content: newPostContent,
      images: newPostImage ? [newPostImage] : [],
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
      repostsCount: 0,
      likedBy: [],
      bookmarkedBy: [],
      repostedBy: [],
      timestamp: new Date().toISOString(),
      tags: [selectedCity.replace(/\s+/g, '')],
      chart: newPostSentiment ? {
        pair: 'MARKET',
        timeframe: 'H1',
        status: newPostSentiment,
        points: []
      } : undefined,
      isSending: true
    };

    // Prepend to posts state & clear form fields immediately
    setPosts(prev => [optimisticPost, ...prev]);
    setNewPostContent('');
    setNewPostImage(null);
    setNewPostSentiment(null);

    setIsSubmitting(true);
    try {
      const payload = {
        userId: currentUser.id,
        content: savedContent,
        groupId: currentGroupId,
        images: savedImage ? [savedImage] : [],
        chart: savedSentiment ? {
          pair: 'MARKET',
          timeframe: 'H1',
          status: savedSentiment,
          points: []
        } : undefined
      };

      const res = await apiFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdPost = await res.json();
        // Replace temp optimistic post with real server response post
        setPosts(prev => prev.map(p => p.id === tempPostId ? { ...optimisticPost, ...createdPost, id: createdPost.id || tempPostId, isSending: false } : p));
      } else {
        // Rollback on server error
        setPosts(prev => prev.filter(p => p.id !== tempPostId));
        setNewPostContent(savedContent);
        setNewPostImage(savedImage);
        setNewPostSentiment(savedSentiment);
        showToast("Gagal memposting. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Failed to create group post:", err);
      // Rollback on network exception
      setPosts(prev => prev.filter(p => p.id !== tempPostId));
      setNewPostContent(savedContent);
      setNewPostImage(savedImage);
      setNewPostSentiment(savedSentiment);
      showToast("Koneksi bermasalah. Batal memposting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Like on a Post
  const handleLikePost = async (post: Post) => {
    const isLiked = post.likedBy?.includes(currentUser?.id || 'current_user');
    const updatedLikedBy = isLiked
      ? (post.likedBy || []).filter(id => id !== (currentUser?.id || 'current_user'))
      : [...(post.likedBy || []), currentUser?.id || 'current_user'];
    
    const updatedLikesCount = isLiked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1;

    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likesCount: updatedLikesCount, likedBy: updatedLikedBy } : p));

    try {
      await apiFetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      });
    } catch (e) {
      // Ignored
    }
  };

  // Toggle comments expand and fetch
  const toggleComments = async (postId: string) => {
    const isExpanded = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanded }));

    if (isExpanded && !postComments[postId]) {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const res = await apiFetch(`/api/posts/${postId}`);
        if (res.ok) {
          const data = await res.json();
          setPostComments(prev => ({ ...prev, [postId]: data.comments || [] }));
        } else {
          // Fallback
          setPostComments(prev => ({
            ...prev,
            [postId]: []
          }));
        }
      } catch (err) {
        setPostComments(prev => ({ ...prev, [postId]: [] }));
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
      }
    }
  };

  // Submit comment on a post
  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim() || !currentUser) return;

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      postId,
      userId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      authorUsername: currentUser.username,
      authorAvatar: currentUser.avatar || '👤',
      content: commentText.trim(),
      timestamp: new Date().toISOString()
    };

    // Update local comment list immediately
    setPostComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));

    // Reset input
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    // Increment post comments count
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));

    try {
      await apiFetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          content: commentText.trim()
        })
      });
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-20">
      
      {/* COMPACT STATIC GROUP BADGE & HEADER CARD */}
      <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-3 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-indigo-100/70 pb-2 mb-1">
          <span className="text-xs font-black uppercase text-indigo-950 tracking-wider">Trader Community</span>
          <SponsoredBadge />
        </div>
        {/* BADGES KOTA & PROVINSI & ATURAN KOMUNITAS INSIDE CARD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('city')}
              className={`flex-1 sm:flex-none py-2 px-4 rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                activeTab === 'city'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/15'
                  : 'bg-white text-indigo-950 border-indigo-100 hover:bg-indigo-50/50'
              }`}
            >
              <span className={`text-[9px] font-black tracking-wider uppercase text-center ${activeTab === 'city' ? 'text-indigo-200' : 'text-indigo-500'}`}>City Group</span>
              <span className="text-xs font-black text-center">{selectedCity}</span>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('city');
                  handleOpenMemberList();
                }}
                className={`flex items-center gap-1 text-[9px] font-medium hover:underline cursor-pointer ${activeTab === 'city' ? 'text-indigo-100' : 'text-indigo-500/80'}`}
              >
                <Users size={10} />
                <span>{groupStats.city.members.toLocaleString('en-US')} Members</span>
                <span className="opacity-50">•</span>
                <span>{groupStats.city.messages.toLocaleString('en-US')} Messages</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('province')}
              className={`flex-1 sm:flex-none py-2 px-4 rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                activeTab === 'province'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/15'
                  : 'bg-white text-indigo-950 border-indigo-100 hover:bg-indigo-50/50'
              }`}
            >
              <span className={`text-[9px] font-black tracking-wider uppercase text-center ${activeTab === 'province' ? 'text-indigo-200' : 'text-indigo-500'}`}>Province Group</span>
              <span className="text-xs font-black text-center">{selectedProvince}</span>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('province');
                  handleOpenMemberList();
                }}
                className={`flex items-center gap-1 text-[9px] font-medium hover:underline cursor-pointer ${activeTab === 'province' ? 'text-indigo-100' : 'text-indigo-500/80'}`}
              >
                <Users size={10} />
                <span>{groupStats.province.members.toLocaleString('en-US')} Members</span>
                <span className="opacity-50">•</span>
                <span>{groupStats.province.messages.toLocaleString('en-US')} Messages</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {/* Member List Button */}
            <button
              onClick={() => handleOpenMemberList()}
              className="flex-1 sm:flex-none px-3.5 py-2.5 sm:py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-emerald-500/20 cursor-pointer shrink-0"
              title="View Group Member List"
            >
              <Users size={14} className="text-emerald-600" />
              <span>Group Members</span>
            </button>

            {/* Aturan Dropdown Badge Button */}
            <button
              onClick={() => setShowRulesDropdown(!showRulesDropdown)}
              className="flex-1 sm:flex-none px-3.5 py-2.5 sm:py-2 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-indigo-100 cursor-pointer shrink-0"
            >
              <AlertCircle size={14} className="text-indigo-600" />
              <span>Rules</span>
              {showRulesDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* DROPDOWN RULES PANEL */}
        <AnimatePresence>
          {showRulesDropdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-indigo-50/30 rounded-xl border border-indigo-100 p-3 space-y-3 text-xs text-slate-700 shadow-inner"
            >
              {/* WELCOME MESSAGE FROM GOTRADING HUB */}
              <div className="bg-gradient-to-r from-indigo-600/90 via-indigo-600/95 to-indigo-600/90 border border-indigo-700 rounded-xl p-3 space-y-1 shadow-2xs text-white">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white text-indigo-600 font-black text-[9px] flex items-center justify-center shrink-0 shadow-xs">
                    G
                  </div>
                  <span className="font-extrabold text-white text-xs flex items-center gap-1">
                    GoTrading Hub
                    <CheckCircle2 size={11} className="fill-white text-indigo-600 inline" />
                  </span>
                  <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-md ml-auto border border-white/10">
                    Welcome 🚀
                  </span>
                </div>
                <h4 className="font-black text-white text-xs pt-0.5">
                  Welcome to the Trader Community of {activeTab === 'city' ? selectedCity : selectedProvince}! 🚀
                </h4>
                <p className="text-[11px] text-indigo-100 leading-normal font-medium">
                  This group is the official space for gathering, discussing technical analysis, sharing knowledge, and getting financial market updates for traders in the <strong className="text-yellow-300 font-extrabold">{activeTab === 'city' ? selectedCity : selectedProvince}</strong> region.
                </p>
              </div>

              {/* RULES SECTION */}
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100/80 mb-2">
                  <span className="font-extrabold text-indigo-950 flex items-center gap-1.5 text-xs">
                    <ShieldCheck size={14} className="text-indigo-600" />
                    Rules & Guidelines of {currentGroupName}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-medium">Hub Policy</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100/60 shadow-3xs">
                    <strong className="text-indigo-600 block mb-0.5 text-[11px]">1. Mutual Respect</strong>
                    <span className="text-[11px] text-slate-600 leading-normal">Respect differences in member analysis & trading style. No bigotry or provocation.</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100/60 shadow-3xs">
                    <strong className="text-indigo-600 block mb-0.5 text-[11px]">2. Risk Management</strong>
                    <span className="text-[11px] text-slate-600 leading-normal">Always include SL & TP levels or technical considerations when sharing signals.</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100/60 shadow-3xs">
                    <strong className="text-indigo-600 block mb-0.5 text-[11px]">3. Fraud & Spam Free</strong>
                    <span className="text-[11px] text-slate-600 leading-normal">Strictly forbidden to offer fund deposits, fraudulent investments, or external group promotions.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION POSTINGAN HARIAN OFFICIAL GOTRADING HUB (DISEMATKAN / TOP) */}
      <div className="space-y-3">
        {/* SECTION HEADER & ADMIN ACTION BUTTON */}
        <div className="flex items-center justify-between px-1 cursor-pointer select-none" onClick={() => setIsPinnedSectionExpanded(!isPinnedSectionExpanded)}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              <Pin size={13} className="fill-white" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>GoTrading Hub Official Posts (Pinned)</span>
              {isPinnedSectionExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </h3>
          </div>

          {currentUser?.role === 'admin' && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsCreatingOfficialPost(!isCreatingOfficialPost); }}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold transition shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>{isCreatingOfficialPost ? 'Cancel' : 'Create New Official Post'}</span>
            </button>
          )}
        </div>

        {/* ADMIN FORM: CREATING NEW OFFICIAL POST */}
        {isCreatingOfficialPost && isPinnedSectionExpanded && (
          <form onSubmit={handleCreateOfficialPost} className="bg-white p-4 rounded-2xl border-2 border-indigo-500 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                Create New Daily Official Post
              </span>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                Automatically Becomes the Newest Post (Top Pinned)
              </span>
            </div>

            <input
              type="text"
              value={newOfficialTitle}
              onChange={(e) => setNewOfficialTitle(e.target.value)}
              placeholder="Daily Post Title (e.g. BTC Outlook & Market Briefing)..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />

            <textarea
              value={newOfficialContent}
              onChange={(e) => setNewOfficialContent(e.target.value)}
              placeholder="Write briefing summary, asset watchlist, or official announcement..."
              rows={4}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-medium">
                Older posts automatically move below member posts.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingOfficialPost(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  Publish Official Post
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 1 LATEST OFFICIAL POST (TOP PINNED) */}
        {isPinnedSectionExpanded && (
          <div>
          {(() => {
            if (!activePinnedPost) {
              return (
                <div className="bg-slate-50/70 rounded-xl border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Pin size={18} className="text-slate-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-500">No Pinned Posts</h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    No official daily updates from Tarapti in the last 24 hours.
                  </p>
                </div>
              );
            }

            const post: any = activePinnedPost;
            const isExpanded = !!expandedOfficialPosts[post.id];
            const isCommentsExpanded = expandedOfficialComments[post.id] !== undefined ? expandedOfficialComments[post.id] : true;
            const commentsList = post.comments || [];
            const likesData = post.likes || { count: 0, liked: false };
            const commentInputValue = officialCommentInputs[post.id] || '';

            return (
                <div className="bg-white rounded-xl border border-indigo-200 shadow-2xs overflow-hidden transition-all">
                  {/* COMPACT 1-ROW HEADER & TITLE */}
                  <div
                    onClick={() => toggleExpandOfficialPost(post.id)}
                    className="p-2.5 bg-gradient-to-r from-indigo-50/90 via-violet-50/70 to-indigo-50/90 hover:from-indigo-100/90 transition flex items-center justify-between gap-2 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                        <Pin size={12} className="fill-white" />
                      </div>
                      <div className="min-w-0 flex items-center gap-1.5 truncate">
                        <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                          <span>Official</span>
                          <CheckCircle2 size={9} className="fill-white inline" />
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {post.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                          • {post.date}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-indigo-600 shrink-0">
                      {isExpanded ? 'Close' : 'View'}
                    </span>
                  </div>

                  {/* BOTTOM ACTION BAR (Like, Comment, View Post) */}
                  <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {/* LIKE BUTTON */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleLikeOfficialPost(post.id); }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition border cursor-pointer ${
                          likesData.liked
                             ? 'bg-rose-500 border-rose-600 text-white'
                             : 'bg-slate-50 hover:bg-rose-50 border-slate-200 text-slate-700 hover:text-rose-600'
                        }`}
                      >
                        <ThumbsUp size={12} className={likesData.liked ? 'fill-white text-white' : ''} />
                        <span>Like ({likesData.count})</span>
                      </button>

                      {/* COMMENT BUTTON */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleExpandOfficialComments(post.id); toggleExpandOfficialPost(post.id); }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 cursor-pointer transition"
                      >
                        <MessageSquare size={12} />
                        <span>Comment ({commentsList.length})</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpandOfficialPost(post.id)}
                      className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide' : 'View Details'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* DROPDOWN EXPANDED CONTENT */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}
                        className="overflow-hidden border-t border-slate-200/80 bg-slate-50/60 p-4 space-y-3.5 text-xs text-slate-700"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                              G
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
                                <span>GoTrading Hub</span>
                                <CheckCircle2 size={12} className="fill-blue-600 text-white" />
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium">Diterbitkan: {post.date}</p>
                            </div>
                          </div>

                          <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-bold px-2 py-0.5 rounded-md">
                            Official Pinned Post
                          </span>
                        </div>

                        {/* MAIN POST CONTENT */}
                        <div className="space-y-2.5 text-slate-800 font-medium leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                          {post.content}
                        </div>

                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {post.tags.map((tag: string, idx: number) => (
                              <span key={idx} className="text-[10px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* ACTION BAR (LIKE & COMMENTS SUMMARY) */}
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                          <div className="flex items-center gap-4">
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.92 }}
                              type="button"
                              onClick={() => handleLikeOfficialPost(post.id)}
                              className={`flex items-center gap-1.5 font-bold transition cursor-pointer ${
                                likesData.liked ? 'text-rose-600' : 'hover:text-rose-600'
                              }`}
                            >
                              <ThumbsUp size={16} className={`transition-transform duration-200 ${likesData.liked ? 'fill-rose-600 text-rose-600 scale-110' : ''}`} />
                              <span>{likesData.count} Likes</span>
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.92 }}
                              type="button"
                              onClick={() => toggleExpandOfficialComments(post.id)}
                              className="flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900 transition cursor-pointer"
                            >
                              <MessageSquare size={16} />
                              <span>{commentsList.length} Comments</span>
                              {isCommentsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </motion.button>
                          </div>

                          <div className="text-[10px] text-slate-400 font-medium">
                            Official Community Discussion
                          </div>
                        </div>

                        {/* COMMENTS SECTION FOR THIS OFFICIAL POST (INTERACTIVE DROPDOWN) */}
                        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs transition-all">
                          <div
                            onClick={() => toggleExpandOfficialComments(post.id)}
                            className="p-3 bg-slate-50/90 hover:bg-slate-100 transition flex items-center justify-between cursor-pointer select-none border-b border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquare size={14} className="text-indigo-600" />
                              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                                Member Discussion Comments ({commentsList.length})
                              </h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                                Open to All Members
                              </span>
                              <button
                                type="button"
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <span>{isCommentsExpanded ? 'Hide' : 'View Comments'}</span>
                                {isCommentsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isCommentsExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
                                className="p-3.5 space-y-3 overflow-hidden bg-white"
                              >
                                {/* List of comments */}
                                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                                  {commentsList.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No comments yet. Be the first to share your thoughts!</p>
                                  ) : (
                                    commentsList.map((comment: any) => (
                                      <div key={comment.id} className="flex gap-2.5 items-start">
                                        <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 shrink-0 text-xs font-bold flex items-center justify-center text-slate-700 shadow-2xs">
                                          {comment.authorAvatar?.length > 2 ? (
                                            <img src={comment.authorAvatar} className="w-full h-full object-cover" alt="Avatar" />
                                          ) : (
                                            comment.authorAvatar || "👤"
                                          )}
                                        </div>
                                        <div className="flex-1 bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200/70">
                                          <div className="flex items-start justify-between mb-1">
                                            <div>
                                              <span className="text-xs font-extrabold text-slate-900 block leading-tight">{comment.authorName}</span>
                                              <span className="text-[9px] text-slate-500 font-medium block">
                                                {comment.authorCity || selectedCity}, {comment.authorCountry || 'Indonesia'} • <span className={(comment.authorVerified || (comment.userId === currentUser?.id && (currentUser.mt5Connected || currentUser.isVerified))) ? "text-emerald-600 font-bold" : "text-slate-400"}>{(comment.authorVerified || (comment.userId === currentUser?.id && (currentUser.mt5Connected || currentUser.isVerified))) ? "Verified Member" : "Unverified Member"}</span>
                                              </span>
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-medium shrink-0">{formatRelativeTime(comment.timestamp)}</span>
                                          </div>
                                          <p className="text-xs text-slate-700 font-medium leading-relaxed">{comment.content}</p>
                                          <div className="flex items-center gap-2 pt-1.5">
                                            <motion.button
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                              type="button"
                                              onClick={() => handleLikeOfficialComment(post.id, comment.id)}
                                              className={`text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                                comment.liked ? 'text-rose-600' : 'text-slate-400 hover:text-rose-600'
                                              }`}
                                            >
                                              <ThumbsUp size={11} className={`transition-transform duration-200 ${comment.liked ? 'fill-rose-600 text-rose-600 scale-110' : ''}`} />
                                              <span>{comment.likes > 0 ? comment.likes : ''} Likes</span>
                                            </motion.button>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>

                                {/* Input Add Comment */}
                                <form
                                  onSubmit={(e) => handleAddOfficialComment(post.id, e)}
                                  className="flex gap-2 pt-1"
                                >
                                  <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                    {currentUser?.avatar && (currentUser.avatar.startsWith("http") || currentUser.avatar.startsWith("data:")) ? (
                                      <img src={currentUser.avatar} className="w-full h-full object-cover" alt="You" />
                                    ) : (
                                      currentUser?.firstName?.charAt(0) || currentUser?.username?.charAt(0) || 'U'
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    value={commentInputValue}
                                    onChange={(e) =>
                                      setOfficialCommentInputs((prev) => ({
                                        ...prev,
                                        [post.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Write a comment on this daily post..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!commentInputValue.trim()}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                                  >
                                    <Send size={12} />
                                    <span>Send</span>
                                  </button>
                                </form>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* CREATE POST IN GROUP (Facebook Style Composer) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-500 text-white flex items-center justify-center font-bold shrink-0 border border-slate-200">
            {currentUser?.avatar && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:')) ? (
              <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
            ) : (
              currentUser?.avatar || "👤"
            )}
          </div>

          <form onSubmit={handleCreatePost} className="flex-1 space-y-3">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={`Write a post or share an analysis for ${currentGroupName} members...`}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none min-h-[70px]"
            />

            {/* Attached Image Preview */}
            {newPostImage && (
              <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200">
                <img src={newPostImage} className="w-full h-full object-cover" alt="Preview" />
                <button
                  type="button"
                  onClick={() => setNewPostImage(null)}
                  className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <div className="flex items-center gap-2">
                <label className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition flex items-center gap-1.5 text-xs font-semibold">
                  <ImageIcon size={16} className="text-emerald-500" />
                  <span className="hidden sm:inline">Photo/Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setNewPostImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {/* Sentiment selector */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewPostSentiment(newPostSentiment === 'Bullish' ? null : 'Bullish')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${newPostSentiment === 'Bullish' ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    🐂 Bullish
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPostSentiment(newPostSentiment === 'Bearish' ? null : 'Bearish')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${newPostSentiment === 'Bearish' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    🐻 Bearish
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (!newPostContent.trim() && !newPostImage)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100 cursor-pointer"
              >
                <Send size={14} />
                <span>Post</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FEED FILTER TOGGLE */}
      <div className="flex items-center border-b border-slate-100 pb-2 mb-4 sticky top-0 z-10 bg-white/90 backdrop-blur-md pt-2 px-1 rounded-xl shadow-sm">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar w-full">
          <button 
            onClick={() => setFeedFilter('latest')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${feedFilter === 'latest' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <Clock size={12} className="mr-1.5" />Latest Posts
          </button>
          <button 
            onClick={() => setFeedFilter('top')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${feedFilter === 'top' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <TrendingUp size={12} className="mr-1.5" />Top Discussions
          </button>
          <button 
            onClick={() => setFeedFilter('milestones')}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${feedFilter === 'milestones' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <Sparkles size={12} className="mr-1.5" />Member Milestones
          </button>
        </div>
      </div>

      {/* GROUP FEED LIST (Official Posts & Member Posts) */}
      <div className="space-y-4">
        {loadingPosts && posts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-slate-100 rounded w-24" />
                    <div className="h-2 bg-slate-50 rounded w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                </div>
                <div className="h-40 bg-slate-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (() => {
          let feedPosts = posts.filter(p => activePinnedPost ? p.id !== activePinnedPost.id : true);
          
          if (feedFilter === 'top') {
            feedPosts = [...feedPosts].sort((a, b) => ((b.likesCount || 0) + (b.commentsCount || 0)) - ((a.likesCount || 0) + (a.commentsCount || 0)));
          } else if (feedFilter === 'milestones') {
            feedPosts = feedPosts.filter(p => p.isOfficial || (p.content && p.content.toLowerCase().match(/milestone|achieve|target|profit|win|success|welcome|verified/)));
          } else {
            // latest is already sorted by date usually, assuming it's correctly sorted. If not we can sort by date here
            // feedPosts already sorted originally
          }

          return feedPosts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
              <div className="mb-4 text-slate-300">
                <MessageSquare size={48} className="mx-auto opacity-20" />
              </div>
              <p className="font-bold text-slate-400">Belum ada postingan di grup ini.</p>
              <p className="text-[10px] mt-1">Jadilah member pertama yang berbagi analisa!</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {feedPosts.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <PostCard post={post} onPostUpdated={fetchPosts} />
                </motion.div>
              ))}
            </AnimatePresence>
          );
        })()}
      </div>

      {/* MEMBER LIST MODAL */}
      <AnimatePresence>
        {isMemberListOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200 dark:border-gray-800 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/20">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black text-slate-950 dark:text-white leading-none">
                      {activeTab === 'city' ? selectedCity : selectedProvince} Members
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Connect and network with fellow local traders
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMemberListOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 hover:text-slate-850 dark:hover:text-white transition flex items-center justify-center cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
                {loadingMembers ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2.5">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Loading member list...</p>
                  </div>
                ) : groupMembers.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No other registered members in the {activeTab === 'city' ? selectedCity : selectedProvince} group yet.
                  </div>
                ) : (
                  groupMembers.map((member) => {
                    const isFollowing = followingIds.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        className="p-3.5 bg-slate-50 dark:bg-gray-800/20 hover:bg-slate-100/50 dark:hover:bg-gray-800/40 rounded-2xl border border-slate-100 dark:border-gray-800/60 transition flex items-center justify-between gap-3"
                      >
                        {/* Member Details */}
                        <div 
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                          onClick={() => {
                            setIsMemberListOpen(false);
                            viewUserProfile(member.id);
                          }}
                        >
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center font-black text-indigo-700 text-xs border border-slate-200">
                              {member.avatar && (member.avatar.startsWith('http') || member.avatar.startsWith('data:') || member.avatar.startsWith('/')) ? (
                                <img src={member.avatar} alt={member.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                member.avatar || "👤"
                              )}
                            </div>
                            {member.onlineStatus === 'online' && (
                              <span className="absolute -bottom-0.5 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition leading-tight">
                                {member.firstName} {member.lastName}
                              </h4>
                              <span className="text-[8px] font-black px-1.5 py-0.2 bg-slate-200/60 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-md uppercase tracking-wider scale-90">
                                {member.tradingExperience}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                              {member.headline || `Trader ${member.tradingAsset || 'Forex'}`}
                            </p>
                          </div>
                        </div>

                        {/* Follow Action Buttons */}
                        <div className="shrink-0">
                          <motion.button
                            whileTap={{ scale: 0.88 }}
                            whileHover={{ scale: 1.04 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            onClick={() => handleFollowMember(member.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition cursor-pointer flex items-center gap-1.5 ${
                              isFollowing 
                                ? 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-gray-300 border border-slate-200/40 dark:border-gray-750' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                            }`}
                          >
                            {isFollowing ? <Check size={12} className="text-emerald-500" /> : <UserPlus size={12} />}
                            {isFollowing ? 'Following' : 'Follow'}
                          </motion.button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unfollow Confirmation Modal */}
      <AnimatePresence>
        {unfollowConfirmUser && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUnfollowConfirmUser(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white dark:bg-[#151c2c] w-full max-w-[340px] rounded-3xl p-6 border border-slate-100 dark:border-gray-800 shadow-2xl z-10 text-left space-y-4"
            >
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Setop ikuti {unfollowConfirmUser.firstName} {unfollowConfirmUser.lastName || ''}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Postingannya tidak akan muncul lagi di timeline beranda Anda. Anda tetap dapat melihat profilnya, kecuali jika postingannya dilindungi.
              </p>
              <div className="flex items-center justify-end gap-6 pt-2">
                <button
                  onClick={() => setUnfollowConfirmUser(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  onClick={async () => {
                    const targetId = unfollowConfirmUser.id;
                    setUnfollowConfirmUser(null);
                    await performFollowAction(targetId);
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
    </div>
  );
};

export default GroupView;
