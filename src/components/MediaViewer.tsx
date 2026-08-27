import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext.tsx';
import { X, ThumbsUp, MessageSquare, Send, Trash, Share2, Plus, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils/apiFetch';
import { formatRelativeTime } from '../utils/dateUtils.ts';
import { Post, Comment } from '../types.js';

interface MediaViewerProps {
  post: Post;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onClose: () => void;
  onPostUpdated: () => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  post: initialPost,
  mediaUrl,
  mediaType,
  onClose,
  onPostUpdated,
}) => {
  const { currentUser, setCurrentUser, showToast, viewUserProfile } = useApp();
  const [post, setPost] = useState<Post>(initialPost);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  
  // Comment Panel state
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Likes local state
  const [liked, setLiked] = useState(currentUser ? post.likedBy.includes(currentUser.id) : false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isHeartPopping, setIsHeartPopping] = useState(false);

  // Sync post updates
  useEffect(() => {
    setPost(initialPost);
    setLiked(currentUser ? initialPost.likedBy.includes(currentUser.id) : false);
    setLikesCount(initialPost.likesCount);
  }, [initialPost, currentUser]);

  // Fetch follow status on mount
  useEffect(() => {
    if (!currentUser || currentUser.id === post.userId) return;
    apiFetch(`/api/users/${currentUser.id}/follows`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
      .then((data) => {
        if (data && Array.isArray(data.following)) {
          setIsFollowing(data.following.includes(post.userId));
        }
      })
      .catch((err) => console.error('Error checking follow state in viewer:', err));
  }, [post.userId, currentUser]);

  // Load comments
  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await apiFetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  // Fetch comments when comments drawer is opened
  useEffect(() => {
    if (isCommentDrawerOpen) {
      loadComments();
    }
  }, [isCommentDrawerOpen, post.id]);

  const handleLike = async () => {
    if (!currentUser) return;
    
    const nextLiked = !liked;
    const nextLikesCount = likesCount + (nextLiked ? 1 : -1);
    
    // Optimistic state
    setLiked(nextLiked);
    setLikesCount(nextLikesCount);
    setIsHeartPopping(true);
    setTimeout(() => setIsHeartPopping(false), 600);

    try {
      const res = await apiFetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        onPostUpdated();
      } else {
        // Rollback
        setLiked(liked);
        setLikesCount(likesCount);
      }
    } catch (e) {
      console.error(e);
      // Rollback
      setLiked(liked);
      setLikesCount(likesCount);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || post.userId === currentUser.id) return;
    setLoadingFollow(true);
    
    const nextIsFollowing = !isFollowing;
    const oldCurrentUserFollowingCount = currentUser.followingCount || 0;
    
    // Optimistic UI change
    setIsFollowing(nextIsFollowing);
    setCurrentUser({
      ...currentUser,
      followingCount: nextIsFollowing ? oldCurrentUserFollowingCount + 1 : Math.max(0, oldCurrentUserFollowingCount - 1)
    });

    try {
      const res = await apiFetch(`/api/users/${post.userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser.id })
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof data.followed === 'boolean') {
          setIsFollowing(data.followed);
        }
        showToast(nextIsFollowing ? `Mulai mengikuti ${post.authorName}` : `Batal mengikuti ${post.authorName}`);
      } else {
        // Rollback
        setIsFollowing(!nextIsFollowing);
        setCurrentUser({ ...currentUser, followingCount: oldCurrentUserFollowingCount });
        showToast(t("common.toast.followError") || "Gagal mengubah status mengikuti.");
      }
    } catch (e) {
      console.error(e);
      setIsFollowing(!nextIsFollowing);
      setCurrentUser({ ...currentUser, followingCount: oldCurrentUserFollowingCount });
      showToast("Koneksi bermasalah.");
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await apiFetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, content: commentText })
      });
      if (res.ok) {
        setCommentText('');
        await loadComments();
        onPostUpdated();
        showToast("Komentar ditambahkan!");
      }
    } catch (e) {
      console.error(e);
      showToast("Gagal mengirim komentar.");
    } finally {
      setSubmittingComment(false);
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
        await loadComments();
        onPostUpdated();
        showToast('Komentar berhasil dihapus');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?post=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tarapti Reels',
          text: post.content?.slice(0, 100) || 'Lihat postingan menarik ini!',
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Error sharing:', err);
      }
    }

    // Fallback clipboard copy
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link tautan berhasil disalin!');
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      prompt('Salin tautan ini secara manual:', shareUrl);
      showToast('Link tautan berhasil disalin!');
    }
  };

  const authorIsVerified = post.authorVerified || (post as any).authorMt5Connected;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden font-sans">
      {/* Background container holding the image/video */}
      <div className="relative w-full h-full max-w-lg md:max-w-md mx-auto bg-black flex flex-col justify-between items-center overflow-hidden">
        
        {/* CLOSE MEDIA VIEWER BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-40 p-2.5 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-full transition border border-white/10 flex items-center justify-center cursor-pointer shadow-lg"
          title="Tutup Media Viewer"
        >
          <X size={20} />
        </button>

        {/* FULL SCREEN MEDIA AREA */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center z-0 bg-black" onClick={() => {
          if (isCommentDrawerOpen) setIsCommentDrawerOpen(false);
        }}>
          {mediaType === 'video' ? (
            <video
              src={mediaUrl}
              autoPlay
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Immersive view"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain select-none"
            />
          )}

          {/* Bottom Gradient Shadow for overlay legibility */}
          <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
        </div>

        {/* ================= OVERLAYS INSIDE MEDIA AREA ================= */}

        {/* Bottom Left: User Info Overlay */}
        <div className="absolute bottom-24 left-4 right-16 z-20 text-white flex flex-col gap-2 drop-shadow-[0_2px_8px_rgba(0,0,0,1)] select-text pointer-events-auto">
          <div className="flex items-center gap-2.5">
            {/* Circular Profile Picture with White Border */}
            <div 
              onClick={() => {
                onClose();
                viewUserProfile(post.userId);
              }}
              className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-800 shrink-0 cursor-pointer shadow-md"
            >
              {post.authorAvatar && (post.authorAvatar.startsWith('http') || post.authorAvatar.startsWith('data:')) ? (
                <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white font-bold text-sm">
                  {post.authorName.charAt(0)}
                </div>
              )}
            </div>

            {/* Poster Details and Follow Button */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span 
                  onClick={() => {
                    onClose();
                    viewUserProfile(post.userId);
                  }}
                  className="font-black text-sm tracking-wide hover:underline cursor-pointer truncate"
                >
                  {post.authorName}
                </span>
                {authorIsVerified && (
                  <span className="inline-flex items-center justify-center bg-blue-500 text-white p-0.5 rounded-full w-3.5 h-3.5 text-[8px]" title="Verified">
                    ✓
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-300 font-semibold truncate">
                @{post.authorUsername || post.authorName.toLowerCase().replace(/\s/g, '')}
              </span>
            </div>

            {/* Follow Button */}
            {currentUser && currentUser.id !== post.userId && (
              <button
                onClick={handleFollow}
                disabled={loadingFollow}
                className={`ml-1.5 px-3 py-1 text-[11px] font-black rounded-full transition-all duration-300 shadow-md flex items-center gap-1 cursor-pointer select-none ${
                  isFollowing
                    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check size={10} className="stroke-[3px]" />
                    <span>Diikuti</span>
                  </>
                ) : (
                  <>
                    <Plus size={10} className="stroke-[3px]" />
                    <span>Ikuti</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Caption text */}
          <p className="text-xs text-white/95 leading-relaxed font-semibold line-clamp-3 mt-1.5 max-w-xs md:max-w-md whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Bottom Right: Elegant Interactive Action Panel */}
        <div className="absolute bottom-28 right-4 z-20 flex flex-col items-center gap-2.5 select-none">
          {/* Like Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleLike}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative overflow-hidden hover:bg-white/10 active:scale-90 filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] ${
                liked ? 'text-blue-500' : 'text-white'
              }`}
            >
              <ThumbsUp 
                size={20} 
                className={`transition-all duration-300 ${
                  liked ? 'fill-blue-500 stroke-blue-500 scale-110' : 'stroke-[2.2px]'
                }`} 
              />
              <AnimatePresence>
                {isHeartPopping && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <ThumbsUp size={20} className="fill-blue-500 text-blue-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            <span className="text-[11px] text-white font-extrabold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              {likesCount}
            </span>
          </div>

          {/* Comment Button (clicking it pops open the drawer) */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setIsCommentDrawerOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all text-white hover:bg-white/10 active:scale-90 cursor-pointer filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]"
            >
              <MessageSquare size={20} className="stroke-[2.2px]" />
            </button>
            <span className="text-[11px] text-white font-extrabold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              {comments.length > 0 ? comments.length : post.commentsCount}
            </span>
          </div>

          {/* Share Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all text-white hover:bg-white/10 active:scale-90 cursor-pointer filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]"
            >
              <Share2 size={20} className="stroke-[2.2px]" />
            </button>
            <span className="text-[11px] text-white font-extrabold tracking-wide filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
              Bagikan
            </span>
          </div>
        </div>

        {/* BOTTOM ROW: AESTHETIC COMMENT INPUT BAR (Always visible when drawer is closed) */}
        {!isCommentDrawerOpen && (
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center bg-white rounded-full px-4 py-2.5 shadow-lg border border-slate-200">
            <input
              type="text"
              readOnly
              onClick={() => setIsCommentDrawerOpen(true)}
              placeholder="Tulis komentar..."
              className="flex-1 bg-transparent text-slate-800 text-xs placeholder-slate-400 focus:outline-none cursor-pointer font-medium"
            />
            <button 
              onClick={() => setIsCommentDrawerOpen(true)}
              className="text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
            >
              <Send size={15} />
            </button>
          </div>
        )}

        {/* ================= POPUP COMMENTS DRAWER PANEL ================= */}
        <AnimatePresence>
          {isCommentDrawerOpen && (
            <>
              {/* Semi-transparent drawer backdrop overlay to focus on comments */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCommentDrawerOpen(false)}
                className="absolute inset-0 bg-black/40 z-30 cursor-pointer"
              />

              {/* Sliding Bottom Drawer */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="absolute bottom-0 left-0 right-0 h-[65vh] bg-white rounded-t-3xl shadow-2xl z-40 flex flex-col overflow-hidden text-slate-800 border-t border-slate-200"
              >
                {/* Drawer Drag Bar & Header */}
                <div className="pt-2 pb-3.5 px-4 border-b border-slate-200 flex flex-col items-center shrink-0">
                  <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-3" />
                  <div className="w-full flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">
                      Komentar ({comments.length})
                    </span>
                    <button
                      onClick={() => setIsCommentDrawerOpen(false)}
                      className="p-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-full transition text-slate-600 dark:text-white/80 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Comment List Container */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-transparent">
                  {loadingComments ? (
                    <div className="flex flex-col items-center justify-center h-48 space-y-2">
                      <Loader2 className="animate-spin text-indigo-500" size={24} />
                      <span className="text-xs text-slate-500 dark:text-white/40 font-bold">Memuat komentar...</span>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                      <p className="text-xs text-slate-500 dark:text-white/40 font-black">Belum ada komentar</p>
                      <p className="text-[10px] text-slate-400 dark:text-white/30 mt-0.5">Jadilah yang pertama menuliskan pendapat Anda!</p>
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const commentIsVerified = comment.userId === currentUser?.id
                        ? (currentUser.mt5Connected || currentUser.isVerified || false)
                        : !!comment.authorVerified;
                      return (
                        <div key={comment.id} className="flex gap-2.5 items-start animate-in fade-in duration-200">
                          {/* Commenter Avatar */}
                          <div 
                            onClick={() => {
                              onClose();
                              viewUserProfile(comment.userId);
                            }}
                            className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 shrink-0 shadow-sm cursor-pointer"
                          >
                            {comment.authorAvatar && (comment.authorAvatar.startsWith('http') || comment.authorAvatar.startsWith('data:')) ? (
                              <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-white/20 text-slate-600 dark:text-white font-bold text-xs">
                                {comment.authorName.charAt(0)}
                              </div>
                            )}
                          </div>

                          {/* Comment Body */}
                          <div className="flex-1 bg-transparent py-0.5">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span 
                                    onClick={() => {
                                      onClose();
                                      viewUserProfile(comment.userId);
                                    }}
                                    className="text-xs font-extrabold text-slate-900 dark:text-white hover:underline cursor-pointer block leading-tight truncate"
                                  >
                                    {comment.authorName}
                                  </span>
                                  {commentIsVerified && (
                                    <span className="inline-flex items-center justify-center bg-blue-500 text-white text-[7px] w-3 h-3 rounded-full font-bold select-none">
                                      ✓
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-500 dark:text-white/40 font-semibold block mt-0.5">
                                  {comment.authorCity || 'Tasikmalaya'}, {comment.authorCountry || 'Indonesia'}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-500 dark:text-white/40 font-medium shrink-0 ml-2">
                                {formatRelativeTime(comment.timestamp)}
                              </span>
                            </div>

                            <p className="text-xs text-slate-800 dark:text-white/90 font-medium mt-1 leading-relaxed break-words whitespace-pre-wrap">
                              {comment.content}
                            </p>

                            {/* Actions on comment (Delete only) */}
                            {currentUser && (comment.userId === currentUser.id || post.userId === currentUser.id) && (
                              <div className="mt-1 flex justify-start">
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-[10px] font-bold text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash size={10} />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Submitting Comment Input Row */}
                <form 
                  onSubmit={handleAddComment}
                  className="p-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 flex gap-2 items-center shrink-0"
                >
                  <input
                    type="text"
                    required
                    placeholder="Tulis komentar baru..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={submittingComment}
                    className="flex-1 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition disabled:opacity-40 cursor-pointer shrink-0 shadow-sm"
                  >
                    {submittingComment ? (
                      <Loader2 size={13} className="animate-spin text-white" />
                    ) : (
                      <Send size={13} />
                    )}
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
