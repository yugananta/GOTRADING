import React, { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Post, Comment } from '../types.js';
import { useApp } from './AppContext.tsx';
import { ThumbsUp, MessageSquare, Repeat2, Bookmark, MoreHorizontal, Edit, Trash2, Send, CornerUpRight, Trash, Share2 as ShareIcon, Pin, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, X, Maximize2, Minimize2, Loader2, BadgeCheck } from 'lucide-react';
import { saveOfflineInteraction } from '../utils/offlineSync.ts';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils/apiFetch';
import { formatRelativeTime } from '../utils/dateUtils.ts';
import { MediaViewer } from './MediaViewer.tsx';

interface PostCardProps {
  post: Post;
  onPostUpdated: () => void;
}

const PostCardComponent: React.FC<PostCardProps> = ({ post, onPostUpdated }) => {
  const { t: rawT } = useTranslation();
  const t = (key: string, fallback?: string): string => {
    const val = rawT(key);
    if (!val || val.startsWith('common.') || val.startsWith('nav.') || val === key) {
      return fallback || key.split('.').pop() || key;
    }
    return val;
  };
  const { currentUser, fetchPosts, fetchNotifications, fetchSessions, viewUserProfile, showToast, setPosts } = useApp();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [lightboxFit, setLightboxFit] = useState<'fill' | 'fit'>('fill');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);

  const isOfficial = post.isOfficial || post.authorRole?.toLowerCase().includes('admin');
  const isPinned = post.isPinned || isOfficial;

  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [liked, setLiked] = useState(currentUser ? post.likedBy.includes(currentUser.id) : false);
  const [bookmarked, setBookmarked] = useState(currentUser ? post.bookmarkedBy?.includes(currentUser.id) : false);
  const [isHeartPopping, setIsHeartPopping] = useState(false);
  const [heartBurst, setHeartBurst] = useState<Array<{ id: number; x: number; y: number; scale: number; rot: number }>>([]);

  // Truncation logic for long posts
  const MAX_CHAR_LIMIT = 220;
  const MAX_LINE_LIMIT = 3;
  const postContent = post.content || '';
  const contentLines = postContent.split('\n');
  const isLongContent = postContent.length > MAX_CHAR_LIMIT || contentLines.length > MAX_LINE_LIMIT;

  const getTruncatedContent = () => {
    if (!isLongContent || isExpanded) {
      return postContent;
    }
    let truncated = postContent.slice(0, MAX_CHAR_LIMIT);
    if (truncated.length === MAX_CHAR_LIMIT) {
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 160) {
        truncated = truncated.slice(0, lastSpace);
      }
    }
    const lines = truncated.split('\n');
    if (lines.length > MAX_LINE_LIMIT) {
      truncated = lines.slice(0, MAX_LINE_LIMIT).join('\n');
    }
    return `${truncated.trim()}...`;
  };

  useEffect(() => {
    setLikesCount(post.likesCount);
    setLiked(currentUser ? post.likedBy.includes(currentUser.id) : false);
    setBookmarked(currentUser ? post.bookmarkedBy?.includes(currentUser.id) : false);
  }, [post, currentUser]);

  useEffect(() => {
    if (commentsOpen && users.length === 0) {
      apiFetch('/api/users')
        .then(r => r.json())
        .then(data => setUsers(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [commentsOpen]);

  const isReposted = currentUser ? post.repostedBy?.includes(currentUser.id) : false;
  const isOwnPost = currentUser ? (post.userId === currentUser.id || currentUser.role === 'admin' || (currentUser as any).isAdmin === true || currentUser.username === 'admin') : false;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isDeleted) return null;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?post=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gotrading Post',
          text: post.content?.slice(0, 100) || 'Check out this trading post',
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }

    const copyToClipboard = async (text: string) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (e) {
          console.warn('navigator.clipboard.writeText failed, using fallback', e);
        }
      }
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    };

    try {
      const success = await copyToClipboard(shareUrl);
      if (success) {
        showToast(t('common.post.shareLinkCopied') || 'Link tautan berhasil disalin!');
      } else {
        // Fallback to prompt if all clipboard access fails
        prompt(t('common.post.copyLinkFailed') || 'Salin tautan ini secara manual:', shareUrl);
        showToast(t('common.post.shareLinkCopied') || 'Link tautan berhasil disalin!');
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      showToast(t('common.post.copyLinkFailed') || 'Gagal menyalin tautan');
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    
    // Optimistic UI updates
    const nextLiked = !liked;
    const nextLikesCount = likesCount + (nextLiked ? 1 : -1);
    setLiked(nextLiked);
    setLikesCount(nextLikesCount);

    // Pop animation state
    setIsHeartPopping(true);
    setTimeout(() => setIsHeartPopping(false), 500);

    if (nextLiked) {
      const newBurst = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 44,
        y: -18 - Math.random() * 28,
        scale: 0.5 + Math.random() * 0.65,
        rot: (Math.random() - 0.5) * 40,
      }));
      setHeartBurst(newBurst);
      setTimeout(() => setHeartBurst([]), 850);
    }

    if (!navigator.onLine) {
      await saveOfflineInteraction('like', post.id, currentUser.id);
      window.dispatchEvent(new CustomEvent('offline-interaction-queued', {
        detail: { type: 'like', postId: post.id }
      }));
      return;
    }

    try {
      const res = await apiFetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        onPostUpdated();
      } else {
        setLiked(liked);
        setLikesCount(likesCount);
      }
    } catch (e) {
      console.warn('Like request failed, saving offline interaction', e);
      await saveOfflineInteraction('like', post.id, currentUser.id);
      window.dispatchEvent(new CustomEvent('offline-interaction-queued', {
        detail: { type: 'like', postId: post.id }
      }));
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) return;
    
    // Optimistic UI updates
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    if (!navigator.onLine) {
      await saveOfflineInteraction('bookmark', post.id, currentUser.id);
      window.dispatchEvent(new CustomEvent('offline-interaction-queued', {
        detail: { type: 'bookmark', postId: post.id }
      }));
      return;
    }

    try {
      const res = await apiFetch(`/api/posts/${post.id}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        onPostUpdated();
      } else {
        setBookmarked(bookmarked);
      }
    } catch (e) {
      console.warn('Bookmark request failed, saving offline interaction', e);
      await saveOfflineInteraction('bookmark', post.id, currentUser.id);
      window.dispatchEvent(new CustomEvent('offline-interaction-queued', {
        detail: { type: 'bookmark', postId: post.id }
      }));
    }
  };

  const handleRepost = async () => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`/api/posts/${post.id}/repost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        onPostUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadComments = async () => {
    try {
      const res = await apiFetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next) {
      loadComments();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !commentText.trim()) return;

    try {
      const res = await apiFetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, content: commentText })
      });
      if (res.ok) {
        setCommentText('');
        loadComments();
        onPostUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    if (!currentUser || !replyText.trim()) return;

    try {
      const formattedContent = `[reply:${parentCommentId}]${replyText}`;
      const res = await apiFetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, content: formattedContent })
      });
      if (res.ok) {
        setReplyText('');
        setReplyingToId(null);
        loadComments();
        onPostUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdit = async () => {
    if (!currentUser || !editContent.trim()) return;
    try {
      const res = await apiFetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, content: editContent })
      });
      if (res.ok) {
        setIsEditing(false);
        onPostUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    setDeleting(true);

    try {
      // Sending userId in both body and query for maximum compatibility
      const res = await apiFetch(`/api/posts/${post.id}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        setIsDeleted(true);
        setShowDeleteModal(false);
        showToast(t('common.post.deleteSuccess') || 'Postingan berhasil dihapus');
        setPosts(prev => prev.filter(p => p.id !== post.id));
        onPostUpdated();
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast((t('common.post.deleteFailed') || 'Gagal menghapus postingan: ') + (errorData.error || res.statusText));
      }
    } catch (e) {
      console.error(e);
      showToast(t('common.post.deleteError') || 'Terjadi kesalahan saat menghapus postingan');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;

    try {
      const res = await apiFetch(`/api/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        loadComments();
        onPostUpdated();
        showToast('Komentar berhasil dihapus');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // SVG Chart points calculations
  const renderSvgChart = () => {
    if (!post.chart || !post.chart.points || post.chart.points.length === 0) return null;
    const pts = post.chart.points;
    const values = pts.map(p => p.value);
    const minVal = Math.min(...values) * 0.9995;
    const maxVal = Math.max(...values) * 1.0005;
    const valRange = maxVal - minVal;

    const width = 500;
    const height = 110;
    const paddingX = 20;
    const paddingY = 15;

    const coords = pts.map((p, i) => {
      const x = paddingX + (i / (pts.length - 1)) * (width - 2 * paddingX);
      const y = height - paddingY - ((p.value - minVal) / valRange) * (height - 2 * paddingY);
      return { x, y };
    });

    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      pathD += ` L ${coords[i].x} ${coords[i].y}`;
    }

    const isBullish = post.chart.status === 'Bullish';
    const chartColor = isBullish ? '#10B981' : post.chart.status === 'Bearish' ? '#EF4444' : '#F59E0B';

    return (
      <div className="bg-slate-50 dark:bg-[#10141E] border border-slate-200 dark:border-gray-800/60 rounded-2xl p-4 mt-3 select-none">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-semibold text-slate-800 dark:text-gray-200">{post.chart.pair}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${
            isBullish 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
              : post.chart.status === 'Bearish'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
          }`}>
            {post.chart.status}
          </span>
        </div>

        <div className="relative">
          {/* Subtle Grid Lines */}
          <svg className="w-full h-[110px]" viewBox={`0 0 ${width} ${height}`}>
            <g stroke="#1F2937" strokeWidth="0.5" strokeDasharray="2 3">
              <line x1="0" y1="20" x2={width} y2="20" />
              <line x1="0" y1="55" x2={width} y2="55" />
              <line x1="0" y1="90" x2={width} y2="90" />
            </g>
            
            {/* Draw Path */}
            <path
              d={pathD}
              fill="none"
              stroke={chartColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Gradient Area below path */}
            <path
              d={`${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`}
              fill={`url(#grad-${post.id})`}
              opacity="0.12"
            />

            <defs>
              <linearGradient id={`grad-${post.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            {/* Dots at major points */}
            {coords.map((c, idx) => (
              <circle
                key={idx}
                cx={c.x}
                cy={c.y}
                r="3"
                fill={idx === coords.length - 1 ? '#FFFFFF' : chartColor}
                stroke={chartColor}
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderCommentsList = () => {
    if (comments.length === 0) {
      return <p className="text-xs text-slate-400 italic">No comments yet. Be the first to comment!</p>;
    }

    const parsedComments: any[] = comments.map((c) => {
      const match = c.content.match(/^\[reply:([^\]]+)\](.*)/s);
      if (match) {
        return {
          ...c,
          isReply: true,
          parentId: match[1],
          cleanContent: match[2].trim(),
          replies: [] as any[]
        };
      }
      return {
        ...c,
        isReply: false,
        cleanContent: c.content,
        replies: [] as any[]
      };
    });

    const rootComments = parsedComments.filter(c => !c.isReply);
    const replies = parsedComments.filter(c => c.isReply);

    const rootRepliesMap: { [key: string]: typeof parsedComments } = {};
    rootComments.forEach(rc => {
      rootRepliesMap[rc.id] = [];
    });

    replies.forEach(reply => {
      let parent = rootComments.find(rc => rc.id === reply.parentId);
      if (parent) {
        rootRepliesMap[parent.id].push(reply);
      } else {
        // Find root parent if nested deeper
        let currentParentId = reply.parentId;
        let foundRoot = false;
        for (let i = 0; i < 5; i++) {
          const pReply = replies.find(r => r.id === currentParentId);
          if (pReply) {
            const rootParent = rootComments.find(rc => rc.id === pReply.parentId);
            if (rootParent) {
              rootRepliesMap[rootParent.id].push(reply);
              foundRoot = true;
              break;
            }
            currentParentId = pReply.parentId;
          } else {
            break;
          }
        }
        if (!foundRoot) {
          rootComments.push(reply);
        }
      }
    });

    rootComments.forEach(rc => {
      rc.replies = rootRepliesMap[rc.id] || [];
    });

    return rootComments.map((rc) => {
      const cIsVerified = rc.userId === currentUser?.id
        ? (currentUser.mt5Connected || currentUser.isVerified || false)
        : !!(rc.authorVerified || (rc as any).authorMt5Connected);

      return (
        <div key={rc.id} className="space-y-2 border-b border-slate-100/60 pb-2.5 last:border-b-0">
          {/* Root Comment Row */}
          <div className="flex gap-2.5 items-start">
            <div 
              onClick={() => viewUserProfile(rc.userId)}
              className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 shrink-0 text-xs font-bold flex items-center justify-center cursor-pointer shadow-2xs"
            >
              {rc.authorAvatar && (rc.authorAvatar.startsWith('http') || rc.authorAvatar.startsWith('data:')) ? (
                <img src={rc.authorAvatar} alt={rc.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                rc.authorAvatar || "👤"
              )}
            </div>
            <div className="flex-1 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span 
                    onClick={() => viewUserProfile(rc.userId)}
                    className="text-xs font-extrabold text-slate-900 cursor-pointer hover:text-indigo-600 block leading-tight"
                  >
                    {rc.authorName}
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium block">
                    {rc.authorCity || (rc.userId === currentUser?.id ? currentUser.city : 'Tasikmalaya')}, {rc.authorCountry || (rc.userId === currentUser?.id ? currentUser.country : 'Indonesia')} • <span className={cIsVerified ? "text-emerald-600 font-bold" : "text-slate-400"}>{cIsVerified ? "Verified Member" : "Unverified Member"}</span>
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 shrink-0">{relativeTime(rc.timestamp)}</span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">{rc.cleanContent}</p>
              
              {/* Reply & Delete Action Buttons */}
              {currentUser && (
                <div className="mt-1 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setReplyingToId(rc.id);
                      setReplyText(`@${rc.authorName} `);
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <CornerUpRight size={10} />
                    <span>{t('common.reply', 'Balas')}</span>
                  </button>
                  
                  {(rc.userId === currentUser.id || post.userId === currentUser.id) && (
                    <button
                      onClick={() => handleDeleteComment(rc.id)}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash size={10} />
                      <span>{t('common.delete', 'Hapus')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Replies Container */}
          {rc.replies && rc.replies.length > 0 && (
            <div className="pl-6 border-l-2 border-slate-200 ml-3.5 space-y-2 mt-1">
              {rc.replies.map((reply) => {
                const rIsVerified = reply.userId === currentUser?.id
                  ? (currentUser.mt5Connected || currentUser.isVerified || false)
                  : !!(reply.authorVerified || (reply as any).authorMt5Connected);
                return (
                  <div key={reply.id} className="flex gap-2 items-start">
                    <div 
                      onClick={() => viewUserProfile(reply.userId)}
                      className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 shrink-0 text-[10px] font-bold flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      {reply.authorAvatar && (reply.authorAvatar.startsWith('http') || reply.authorAvatar.startsWith('data:')) ? (
                        <img src={reply.authorAvatar} alt={reply.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        reply.authorAvatar || "👤"
                      )}
                    </div>
                    <div className="flex-1 bg-slate-50/70 p-2 rounded-xl border border-slate-100 shadow-3xs">
                      <div className="flex items-start justify-between mb-0.5">
                        <div>
                          <span 
                            onClick={() => viewUserProfile(reply.userId)}
                            className="text-[11px] font-extrabold text-slate-800 cursor-pointer hover:text-indigo-600 block leading-tight"
                          >
                            {reply.authorName}
                          </span>
                          <span className="text-[8px] text-slate-400 font-medium block">
                            {reply.authorCity || (reply.userId === currentUser?.id ? currentUser.city : 'Tasikmalaya')} • <span className={rIsVerified ? "text-emerald-600 font-bold" : "text-slate-400"}>{rIsVerified ? "Verified" : "Member"}</span>
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-400 shrink-0">{relativeTime(reply.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        {reply.cleanContent}
                      </p>

                      {/* Reply of reply & Delete action */}
                      {currentUser && (
                        <div className="mt-0.5 flex items-center gap-3">
                          <button
                            onClick={() => {
                              setReplyingToId(reply.id);
                              setReplyText(`@${reply.authorName} `);
                            }}
                            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            <CornerUpRight size={8} />
                            <span>{t('common.reply', 'Balas')}</span>
                          </button>
                          
                          {(reply.userId === currentUser.id || post.userId === currentUser.id) && (
                            <button
                              onClick={() => handleDeleteComment(reply.id)}
                              className="text-[9px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash size={8} />
                              <span>{t('common.delete', 'Hapus')}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply Form Inline (Show right below the selected comment or reply) */}
          {replyingToId && (replyingToId === rc.id || rc.replies.some(r => r.id === replyingToId)) && (
            <div className="pl-6 ml-3.5 mt-1">
              <form 
                onSubmit={(e) => handleReplySubmit(e, rc.id)} 
                className="flex gap-2 items-center bg-slate-100/60 p-2 rounded-xl border border-slate-200"
              >
                <span className="text-[10px] font-black text-slate-400 shrink-0 select-none pl-1">↳</span>
                <input
                  type="text"
                  required
                  placeholder={`Reply...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40 cursor-pointer shrink-0"
                >
                  <Send size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyText('');
                  }}
                  className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 px-1 py-1.5 cursor-pointer"
                >
                  {t('common.cancel', 'Batal')}
                </button>
              </form>
            </div>
          )}
        </div>
      );
    });
  };

  const relativeTime = (isoString: string) => {
    return formatRelativeTime(isoString);
  };

  return (
    <div className="mb-4 select-text">
      {/* Official/Pinned Header outside the Card */}
      {isPinned && (
        <div className="flex items-center gap-1.5 px-3 py-1 mb-1.5 text-slate-500 dark:text-slate-400 select-none">
          <Pin size={13} className="fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400 -rotate-45 shrink-0" />
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tracking-wide">
            {isOfficial ? (t('common.post.official') || 'Official Announcement') : (t('common.post.pinned') || 'Pinned Post')}
          </span>
        </div>
      )}

      <motion.div 
        id={`post-card-${post.id}`} 
        className="bg-white dark:bg-slate-900/40 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-gray-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-gray-700 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ 
          type: "spring",
          stiffness: 350,
          damping: 30,
          opacity: { duration: 0.25 }
        }}
      >
        {/* Top Header */}
        <div className="p-4 pb-2 flex items-start justify-between gap-3">
        <div 
          className="flex items-start gap-3 cursor-pointer"
          onClick={() => viewUserProfile(post.userId)}
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-sm border-2 border-white shrink-0">
            {post.authorAvatar && (post.authorAvatar.startsWith('http') || post.authorAvatar.startsWith('data:')) ? (
              <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              post.authorAvatar || "T"
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-slate-900">{post.authorName}</span>
              {(() => {
                const isVerifiedAuthor = post.userId === currentUser?.id
                  ? (currentUser.mt5Connected || currentUser.isVerified || false)
                  : !!(post.authorVerified || (post as any).authorMt5Connected);
                return isVerifiedAuthor ? (
                  <BadgeCheck size={16} className="text-blue-500 fill-blue-500 shrink-0 text-white" />
                ) : null;
              })()}
              {isOfficial && (
                <div className="flex items-center gap-1 bg-[#2563eb] text-white px-2 py-0.5 rounded-full">
                  <span className="text-[9px] font-bold">Official</span>
                  <CheckCircle2 size={10} fill="white" className="text-[#2563eb]" />
                </div>
              )}
              <span className="text-[11px] text-slate-400 font-medium">
                @{post.authorUsername || post.authorName.toLowerCase().replace(/\s/g, '')}
              </span>
            </div>
            {/* Admin Badge & Time */}
            {isOfficial && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-bold text-[#2563eb] bg-[#eff6ff] px-3 py-0.5 rounded-md border border-[#dbeafe]">
                  Official Admin
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {relativeTime(post.timestamp)}
                </span>
              </div>
            )}
            
            {/* User subtitle: City, Country, Status (Verified/Unverified) */}
            {!isOfficial && (() => {
              const postCity = post.authorCity || (post.userId === currentUser?.id ? currentUser.city : 'Tasikmalaya');
              const postCountry = post.authorCountry || (post.userId === currentUser?.id ? currentUser.country : 'Indonesia');
              const isVerified = post.userId === currentUser?.id
                ? (currentUser.mt5Connected || currentUser.isVerified || false)
                : !!(post.authorVerified || (post as any).authorMt5Connected);

              return (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mt-0.5 flex-wrap">
                  <span>{postCity}, {postCountry}</span>
                  <span className="text-slate-300">•</span>
                  <span className={isVerified ? "text-emerald-600 font-bold" : "text-slate-400"}>
                    {isVerified ? t('account.verifiedMember') : t('account.unverifiedMember')}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400">{relativeTime(post.timestamp)}</span>
                  {(post.isSending || post.id?.toString().startsWith('temp')) && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 px-2 py-0.2 rounded-full font-bold animate-pulse shrink-0">
                        <Loader2 size={10} className="animate-spin" />
                        mengirim...
                      </span>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Options Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-slate-400 hover:text-slate-900 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <MoreHorizontal size={18} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-xl py-1.5 w-32 shadow-xl z-20 animate-in fade-in slide-in-from-top-1">
              {isOwnPost ? (
                <>
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit size={12} /> {t('common.post.editPost')}
                  </button>
                  <button
                    onClick={() => { setShowDeleteModal(true); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-500 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={12} /> {t('common.post.deletePost')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { showToast('Post flagged. Our compliance team will review it.'); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
                >
                  {t('common.post.flagContent')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-3">
        {post.marketBias && (
          <div className="mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              post.marketBias === 'Bullish' 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-100 text-rose-700 border border-rose-200'
            }`}>
              {post.marketBias === 'Bullish' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {post.marketBias === 'Bullish' ? t('feed.bullish') : t('feed.bearish')}
            </span>
          </div>
        )}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 min-h-[100px]"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                {t('common.common.cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
              >
                {t('common.common.save')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {getTruncatedContent()}
            </div>
            {isLongContent && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg w-fit"
              >
                <span>
                  {isExpanded 
                    ? t('common.post.showLess', 'Sembunyikan') 
                    : t('common.post.showMore', 'Lihat selengkapnya')}
                </span>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        )}

        {/* Render attached multi-images if any */}
        {post.images && post.images.length > 0 && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-slate-100 dark:border-gray-800 space-y-1 bg-slate-50 dark:bg-slate-900/40">
            {post.images.map((img, i) => {
              const imgLower = img.toLowerCase();
              const isVideo = img.startsWith('data:video/') || 
                              imgLower.endsWith('.mp4') || 
                              imgLower.endsWith('.webm') || 
                              imgLower.endsWith('.ogg') ||
                              imgLower.includes('.mp4?') ||
                              imgLower.includes('.webm?') ||
                              imgLower.includes('.ogg?') ||
                              imgLower.includes('video/');
              if (isVideo) {
                return (
                  <div key={i} className="relative group cursor-pointer overflow-hidden rounded-2xl" onClick={() => { setLightboxFit('fill'); setLightboxMedia({ url: img, type: 'video' }); }}>
                    <video
                      src={img}
                      autoPlay
                      muted
                      playsInline
                      loop
                      preload="auto"
                      className="w-full h-auto max-h-[500px] object-cover pointer-events-none block rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition flex items-center justify-center">
                      <span className="bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold backdrop-blur-xs">Buka Video Full Screen</span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="relative group cursor-pointer overflow-hidden rounded-2xl" onClick={() => { setLightboxFit('fill'); setLightboxMedia({ url: img, type: 'image' }); }}>
                  <img
                    src={img}
                    alt="Post attachment"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[500px] object-cover group-hover:scale-[1.01] transition-transform duration-300 block rounded-2xl"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Render attached video if any */}
        {post.videoUrl && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-slate-100 dark:border-gray-800 relative group cursor-pointer bg-slate-50 dark:bg-slate-900/40" onClick={() => { setLightboxFit('fill'); setLightboxMedia({ url: post.videoUrl!, type: 'video' }); }}>
            <video
              src={post.videoUrl}
              autoPlay
              muted
              playsInline
              loop
              preload="auto"
              className="w-full h-auto max-h-[500px] object-cover pointer-events-none block rounded-2xl"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition flex items-center justify-center">
              <span className="bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold backdrop-blur-xs">Buka Video Full Screen</span>
            </div>
          </div>
        )}
        {renderSvgChart()}
      </div>

      {/* Action Footer */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-slate-50">
        <div className="flex items-center gap-1 sm:gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all relative ${
              liked ? 'text-blue-600 bg-blue-50 font-black' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold'
            } text-[11px] cursor-pointer`}
          >
            <div className="relative">
              <ThumbsUp size={16} className={liked ? 'fill-blue-600 stroke-blue-600' : ''} />
              {/* Pop like animation overlay */}
              <AnimatePresence>
                {isHeartPopping && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <ThumbsUp size={16} className="fill-blue-600 text-blue-600" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Particle Burst */}
              {heartBurst.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{ x: p.x, y: p.y, scale: p.scale, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <div className="text-[10px]" style={{ transform: `rotate(${p.rot}deg)` }}>👍</div>
                </motion.div>
              ))}
            </div>
            <span>{likesCount > 0 ? likesCount : t('common.post.like', 'Like')}</span>
          </button>

          <button
            onClick={toggleComments}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              showComments ? 'text-blue-600 bg-blue-50 font-black' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold'
            } text-[11px] cursor-pointer`}
          >
            <MessageSquare size={16} />
            <span>{post.commentsCount > 0 ? post.commentsCount : t('common.post.comment', 'Comment')}</span>
          </button>

          <button
            onClick={handleRepost}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              isReposted ? 'text-emerald-600 bg-emerald-50 font-black' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold'
            } text-[11px] cursor-pointer`}
          >
            <Repeat2 size={16} />
            <span>{post.repostsCount > 0 ? post.repostsCount : t('common.post.repost', 'Repost')}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmark}
            className={`p-2 rounded-xl transition-all ${
              bookmarked ? 'text-amber-600 bg-amber-50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            } cursor-pointer`}
          >
            <Bookmark size={17} className={bookmarked ? 'fill-amber-600' : ''} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition cursor-pointer"
          >
            <ShareIcon size={17} />
          </button>
        </div>
      </div>

      {/* Inline Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="border-t border-slate-50 bg-slate-50/40 p-4"
          >
            <div className="mb-4">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('common.post.writeComment', 'Tulis komentar...')}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
            <div className="space-y-4">
              {renderCommentsList()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t('common.post.deleteTitle') || 'Hapus Postingan?'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {t('common.post.deleteConfirm') || 'Apakah Anda yakin ingin menghapus postingan ini? Tindakan ini tidak dapat dibatalkan.'}
            </p>
            <div className="flex gap-3">
              <button
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 transition text-xs cursor-pointer disabled:opacity-50"
              >
                {t('common.cancel') || 'Batal'}
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 font-medium text-white hover:bg-rose-700 transition text-xs cursor-pointer shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  t('common.post.delete') || 'Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {lightboxMedia && (
        <MediaViewer
          post={post}
          mediaUrl={lightboxMedia.url}
          mediaType={lightboxMedia.type}
          onClose={() => setLightboxMedia(null)}
          onPostUpdated={onPostUpdated}
        />
      )}
    </motion.div>
    </div>
  );
};

export const PostCard = memo(PostCardComponent);
