import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import { useApp } from './AppContext.tsx';
import { Send, Paperclip, Video as VideoIcon, Calendar, Image, Smile, TrendingUp, TrendingDown, Pin, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils/apiFetch';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabaseClient.ts';

interface CreatePostProps {
  onPostCreated: () => void | Promise<void>;
}

interface AttachedMediaItem {
  url: string;
  type: 'image' | 'video';
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { t } = useTranslation();
  const { currentUser, viewUserProfile, showToast, logApiDiagnostic, setPosts } = useApp();
  const [content, setContent] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<AttachedMediaItem[]>([]);
  const [newPostSentiment, setNewPostSentiment] = useState<'Bullish' | 'Bearish' | null>(null);
  const [isPinnedPost, setIsPinnedPost] = useState(false);
  const [isOfficialPost, setIsOfficialPost] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canPinOrOfficial = !!currentUser && (
    (currentUser as any).isAdmin || 
    (currentUser as any).isVerified || 
    currentUser.username === 'gotrading' || 
    currentUser.username === 'admin'
  );

  const handlePost = async () => {
    if (!currentUser) {
      showToast('Silakan login terlebih dahulu untuk memposting.');
      return;
    }
    if (isReading || isUploading || isSubmitting || isSubmittingRef.current) return;
    const contentToPost = content.trim();
    if (!contentToPost && attachedMedia.length === 0) return;

    const savedContent = content;
    const savedMedia = [...attachedMedia];
    const savedSentiment = newPostSentiment;
    const savedPinned = isPinnedPost;
    const savedOfficial = isOfficialPost;

    // Construct optimistic post
    const tempPostId = 'temp-' + Date.now();
    const optimisticPost: any = {
      id: tempPostId,
      userId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
      authorUsername: currentUser.username,
      authorAvatar: currentUser.avatar || '',
      authorRole: (currentUser as any).tradingExperience || "Trader",
      authorCity: currentUser.city,
      authorCountry: currentUser.country,
      authorVerified: (currentUser as any).isVerified,
      content: contentToPost,
      images: attachedMedia.filter(m => m.type === 'image').map(m => m.url),
      videoUrl: attachedMedia.find(m => m.type === 'video')?.url || undefined,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
      repostsCount: 0,
      likedBy: [],
      bookmarkedBy: [],
      repostedBy: [],
      timestamp: new Date().toISOString(),
      tags: [],
      isOfficial: isOfficialPost || (currentUser.username === 'gotrading' || (currentUser as any).isAdmin),
      isPinned: isPinnedPost,
      marketBias: newPostSentiment || undefined,
      isSending: true
    };

    // Prepend optimism
    setPosts(prev => [optimisticPost, ...prev]);

    // Clear UI instantly
    setContent('');
    setAttachedMedia([]);
    setNewPostSentiment(null);
    setIsPinnedPost(false);
    setIsOfficialPost(false);

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const requestPayload = {
      userId: currentUser.id,
      content: contentToPost,
      marketBias: savedSentiment,
      images: savedMedia.filter(m => m.type === 'image').map(m => m.url),
      videoUrl: savedMedia.find(m => m.type === 'video')?.url || undefined,
      isPinned: savedPinned,
      isOfficial: savedOfficial || (currentUser.username === 'gotrading' || (currentUser as any).isAdmin)
    };

    try {
      const response = await apiFetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      let resData = null;
      try {
        resData = await response.json();
      } catch {
        resData = { rawStatus: response.status };
      }

      logApiDiagnostic('CREATE_POST', {
        url: '/api/posts',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestPayload
      }, response, resData);

      if (response.ok) {
        // Sync real post data from server (id, timestamp, etc.) and remove isSending flag
        if (resData && resData.id) {
          setPosts(prev => prev.map(p => p.id === tempPostId ? { ...optimisticPost, ...resData, id: resData.id, isSending: false } : p));
        } else {
          setPosts(prev => prev.map(p => p.id === tempPostId ? { ...p, isSending: false } : p));
        }
      } else {
        // Rollback on server error
        setPosts(prev => prev.filter(p => p.id !== tempPostId));
        setContent(savedContent);
        setAttachedMedia(savedMedia);
        setNewPostSentiment(savedSentiment);
        setIsPinnedPost(savedPinned);
        setIsOfficialPost(savedOfficial);
        showToast('Gagal memposting. Silakan coba lagi.');
      }
    } catch (e) {
      logApiDiagnostic('CREATE_POST_ERROR', {
        url: '/api/posts',
        method: 'POST',
        body: requestPayload
      }, undefined, undefined, e);
      console.error(e);
      // Rollback on network exception
      setPosts(prev => prev.filter(p => p.id !== tempPostId));
      setContent(savedContent);
      setAttachedMedia(savedMedia);
      setNewPostSentiment(savedSentiment);
      setIsPinnedPost(savedPinned);
      setIsOfficialPost(savedOfficial);
      showToast('Gagal terhubung. Batal memposting.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (attachedMedia.length >= 3) {
        showToast('Maksimum 3 media yang dapat dilampirkan per postingan.');
        return;
      }

      setIsReading(true);
      setIsUploading(true);
      try {
        let fileToRead = file;
        
        // Compress image if it's not a video
        if (!file.type.startsWith('video/')) {
          fileToRead = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true
          });
        } else if (file.size > 15 * 1024 * 1024) {
          showToast('Ukuran file video maksimal adalah 15MB.');
          setIsReading(false);
          setIsUploading(false);
          return;
        }

        const uniqueFileName = `${currentUser.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

        // Upload directly to Supabase Storage bucket 'post-media'
        const { data, error } = await supabase.storage
          .from('post-media')
          .upload(uniqueFileName, fileToRead, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('post-media')
          .getPublicUrl(uniqueFileName);

        if (!urlData || !urlData.publicUrl) {
          throw new Error('Gagal mendapatkan public URL dari storage.');
        }

        const publicUrl = urlData.publicUrl;

        setAttachedMedia(prev => [...prev, {
          url: publicUrl,
          type: file.type.startsWith('video/') ? 'video' : 'image'
        }]);

        showToast('Media berhasil diunggah!');
      } catch (error: any) {
        console.error("Upload error:", error);
        showToast(`Gagal mengunggah media: ${error?.message || 'terjadi kesalahan'}`);
      } finally {
        setIsReading(false);
        setIsUploading(false);
      }
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!currentUser) return null;

  return (
    <div id="create-post-wrapper" className="mb-3">
      {/* Admin/Verified Pin & Official Controls OUTSIDE the Create Post Card */}
      {canPinOrOfficial && (
        <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2 px-2 mb-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Pin size={12} className="text-indigo-600 shrink-0" />
            Opsi Publikasi Feed:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPinnedPost(!isPinnedPost)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1 border shadow-xs shrink-0 ${
                isPinnedPost 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Sematkan postingan di paling atas feed"
            >
              <Pin size={12} className={isPinnedPost ? "fill-white text-white shrink-0" : "text-blue-600 shrink-0"} />
              <span>Pin Post</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOfficialPost(!isOfficialPost)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1 border shadow-xs shrink-0 ${
                isOfficialPost 
                  ? 'bg-amber-600 border-amber-600 text-white shadow-amber-500/20' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Tandai sebagai Post Official"
            >
              <CheckCircle2 size={12} className={isOfficialPost ? "text-white shrink-0" : "text-amber-600 shrink-0"} />
              <span>Official Post</span>
            </button>
          </div>
        </div>
      )}

      <div id="create-post-module" className="bg-white rounded-2xl border border-slate-200 p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <div className="flex gap-3">
          <div 
            onClick={() => viewUserProfile(currentUser.id)}
            className="w-10 h-10 rounded-full overflow-hidden bg-indigo-500 text-white font-bold flex items-center justify-center text-sm shrink-0 border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
          >
            {currentUser.avatar && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:')) ? (
              <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              currentUser.avatar || "👤"
            )}
          </div>

          <div className="flex-1 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('feed.postPlaceholder')}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none min-h-[50px]"
            />

            {/* Uploading Progress Spinner */}
            {isUploading && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/30 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Mengunggah media ke Cloud Storage... Silakan tunggu.</span>
              </div>
            )}

            {/* Attached Media Preview */}
            {attachedMedia.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedMedia.map((media, i) => {
                  const isVideo = media.type === 'video';
                  return (
                    <div key={i} className="relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200">
                      {isVideo ? (
                        <video src={media.url} className="w-full h-full object-cover bg-black" muted playsInline />
                      ) : (
                        <img src={media.url} className="w-full h-full object-cover" alt="Preview" />
                      )}
                      <button
                        type="button"
                        onClick={() => setAttachedMedia(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black cursor-pointer text-xs"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-1.5 border-t border-slate-100 pt-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <label className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition flex items-center gap-1.5 text-xs font-semibold shrink-0">
                  <Image size={16} className="text-emerald-500 shrink-0" />
                  <span className="hidden sm:inline">Foto/Gambar/Video</span>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleMediaUpload}
                    disabled={isUploading}
                  />
                </label>

                {/* Sentiment selector */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setNewPostSentiment(newPostSentiment === 'Bullish' ? null : 'Bullish')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${newPostSentiment === 'Bullish' ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    <TrendingUp size={12} className="shrink-0" /> Bullish
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPostSentiment(newPostSentiment === 'Bearish' ? null : 'Bearish')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${newPostSentiment === 'Bearish' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    <TrendingDown size={12} className="shrink-0" /> Bearish
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePost}
                disabled={isReading || isUploading || isSubmitting || (!content.trim() && attachedMedia.length === 0)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100 cursor-pointer shrink-0 ml-auto"
              >
                <Send size={14} className="shrink-0" />
                <span>{t('feed.postButton')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
