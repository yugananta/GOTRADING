import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from './AppContext.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';
import { useTranslation } from 'react-i18next';
import { Post } from '../types.js';
import { PostCard } from './PostCard.tsx';
import { MapPin, Briefcase, Award, TrendingUp, Settings, LogOut, Grid, Image, Activity, Save, CheckCircle2 as CheckCircle, ShieldAlert, Loader2, X, Maximize2, Minimize2, Globe, ChevronDown, Handshake, Clock, Check } from 'lucide-react';
import { formatToK, getCountryFlag } from '../utils/formatters.ts';
import { apiFetch } from '../utils/apiFetch';
import { TaraptiPartners } from './TaraptiPartners.tsx';
import { MediaViewer } from './MediaViewer.tsx';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission, 
  showDeviceNotification 
} from '../utils/pushNotification.ts';

export const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, setCurrentUser, posts, fetchPosts, setActiveView, setActiveChatPartnerId, viewUserProfile } = useApp();
  const [ownPosts, setOwnPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'partners' | 'settings'>('posts');
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [lightboxFit, setLightboxFit] = useState<'fill' | 'fit'>('fill');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Follows modal states
  const [showFollowsModal, setShowFollowsModal] = useState<'followers' | 'following' | null>(null);
  const [followsData, setFollowsData] = useState<{ followingDetails: any[]; followerDetails: any[] } | null>(null);
  const [loadingFollows, setLoadingFollows] = useState(false);
  const [followsSearchQuery, setFollowsSearchQuery] = useState('');

  const openFollowsModal = async (type: 'followers' | 'following') => {
    setShowFollowsModal(type);
    if (!currentUser) return;
    setLoadingFollows(true);
    try {
      const res = await apiFetch(`/api/users/${currentUser.id}/follows`);
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

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
  ];
  const currentLangObj = languages.find(l => l.code === i18n.language) || languages[0];
  
  // Settings Form States
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser?.avatar && currentUser.avatar.length > 2 ? currentUser.avatar : ''
  );
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(
    currentUser?.coverPhoto && currentUser.coverPhoto.length > 2 ? currentUser.coverPhoto : ''
  );

  // Loading and skeleton states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [avatarImgLoading, setAvatarImgLoading] = useState(false);
  const [coverImgLoading, setCoverImgLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);


  const resizeImage = (
    file: File, 
    maxWidth: number, 
    maxHeight: number, 
    callback: (dataUrl: string) => void,
    onError?: () => void
  ) => {
    const reader = new FileReader();
    reader.onerror = () => onError && onError();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onerror = () => onError && onError();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          if (onError) onError();
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      setAvatarImgLoading(true);
      resizeImage(
        file, 
        400, 
        400, 
        (dataUrl) => {
          setAvatarUrl(dataUrl);
          setIsUploadingAvatar(false);
        },
        () => {
          setIsUploadingAvatar(false);
          setAvatarImgLoading(false);
        }
      );
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingCover(true);
      setCoverImgLoading(true);
      resizeImage(
        file, 
        1200, 
        1200, 
        (dataUrl) => {
          setCoverPhotoUrl(dataUrl);
          setIsUploadingCover(false);
        },
        () => {
          setIsUploadingCover(false);
          setCoverImgLoading(false);
        }
      );
    }
  };

  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [headline, setHeadline] = useState(currentUser?.headline || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [experience, setExperience] = useState(currentUser?.tradingExperience || 'Beginner');
  const [asset, setAsset] = useState(currentUser?.tradingAsset || 'Forex');
  const [marketPulseEnabled, setMarketPulseEnabled] = useState(currentUser?.marketPulseEnabled || false);
  const [marketPulseAssets, setMarketPulseAssets] = useState<string[]>(currentUser?.marketPulseAssets || [currentUser?.tradingAsset || 'Forex']);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // System Notification Sandbox States
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    return getNotificationPermission();
  });
  const [isTestingNotif, setIsTestingNotif] = useState(false);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
  };

  const handleTestNotification = async () => {
    setIsTestingNotif(true);
    const title = "Tarapti Social Network";
    const body = "Halo! Ini adalah notifikasi uji coba dari Tarapti. Koneksi trading Anda aktif & aman.";
    
    await showDeviceNotification(title, {
      body,
      icon: window.location.origin + '/tarapti_logo_1784421680053.jpg'
    });
    
    setTimeout(() => {
      setIsTestingNotif(false);
    }, 1000);
  };

  // Hook 1: Update own posts when the posts feed changes
  useEffect(() => {
    if (currentUser) {
      const filtered = posts.filter(p => p.userId === currentUser.id);
      setOwnPosts(filtered);
    }
  }, [posts, currentUser?.id]);

  // Hook 2: Only initialize/reset form fields when the logged-in user changes or updates
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setUsername(currentUser.username || '');
      setHeadline(currentUser.headline || '');
      setBio(currentUser.bio || '');
      setCity(currentUser.city || '');
      const curAvatar = currentUser.avatar && currentUser.avatar.length > 2 ? currentUser.avatar : '';
      const curCover = (currentUser.coverPhoto || currentUser.cover_photo) && (currentUser.coverPhoto || currentUser.cover_photo)!.length > 2 ? (currentUser.coverPhoto || currentUser.cover_photo)! : '';
      setAvatarUrl(curAvatar);
      setCoverPhotoUrl(curCover);
      setExperience(currentUser.tradingExperience || 'Beginner');
      setAsset(currentUser.tradingAsset || 'Forex');
      setMarketPulseEnabled(currentUser.marketPulseEnabled || false);
      setMarketPulseAssets(currentUser.marketPulseAssets || [currentUser.tradingAsset || 'Forex']);
    }
  }, [currentUser?.id, currentUser?.avatar, currentUser?.coverPhoto, currentUser?.cover_photo]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingProfile(true);

    try {
      const res = await apiFetch(`/api/users/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          headline,
          bio,
          city,
          tradingExperience: experience,
          tradingAsset: asset,
          marketPulseEnabled,
          marketPulseAssets,
          avatar: avatarUrl || currentUser.avatar,
          coverPhoto: coverPhotoUrl || currentUser.coverPhoto || currentUser.cover_photo
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSimulateVolatility = async () => {
    if (!currentUser) return;
    setIsSimulating(true);
    setSimulationResult(null);

    try {
      // Pick a random asset class from their followed ones, or a random one in general
      const followedAssets = marketPulseAssets.length > 0 ? marketPulseAssets : [asset];
      const randomAsset = followedAssets[Math.floor(Math.random() * followedAssets.length)];

      const res = await apiFetch('/api/pwa/market-pulse/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetClass: randomAsset })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.notifiedCount > 0) {
          setSimulationResult(`Success! Volatility alert triggered for ${data.chosenAsset}. Check your notification desk!`);
        } else {
          setSimulationResult(`Simulation active for ${data.chosenAsset}, but notifications only send if "Market Pulse" is enabled and you follow ${data.chosenAsset}.`);
        }
      } else {
        setSimulationResult("Failed to trigger simulation.");
      }
    } catch (e) {
      console.error(e);
      setSimulationResult("Error during simulation request.");
    } finally {
      setIsSimulating(false);
      setTimeout(() => setSimulationResult(null), 5000);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      apiFetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      })
        .catch(err => console.error("Logout failed:", err))
        .finally(() => {
          setCurrentUser(null);
          localStorage.removeItem('tarapti_user');
        });
    }
  };

  if (!currentUser) return null;

  // Extract media items (images) from own posts
  const mediaUrls = ownPosts.flatMap(p => p.images || []).filter(url => !!url);

  return (
    <div id="profile-view" className="space-y-4 py-2">
      
      {/* Upper Cover & Avatar area - LinkedIn Style */}
      <div className="bg-white dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden relative shadow-sm">
        
        {/* Cover Photo */}
        <div className="h-32 bg-slate-200 dark:bg-[#1B2132] relative overflow-hidden group cursor-pointer" onClick={() => coverFileInputRef.current?.click()} title="Klik untuk mengubah foto background profile">
          <input 
            type="file" 
            ref={coverFileInputRef} 
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !currentUser) return;
              setIsUploadingCover(true);
              resizeImage(
                file, 
                1200, 
                1200, 
                async (dataUrl) => {
                  setCoverPhotoUrl(dataUrl);
                  try {
                    const res = await apiFetch(`/api/users/profile/${currentUser.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        firstName: currentUser.firstName,
                        lastName: currentUser.lastName,
                        username: currentUser.username,
                        headline: currentUser.headline,
                        bio: currentUser.bio,
                        city: currentUser.city,
                        tradingExperience: currentUser.tradingExperience,
                        tradingAsset: currentUser.tradingAsset,
                        marketPulseEnabled: currentUser.marketPulseEnabled,
                        marketPulseAssets: currentUser.marketPulseAssets,
                        avatar: currentUser.avatar,
                        coverPhoto: dataUrl
                      })
                    });
                    if (res.ok) {
                      const updated = await res.json();
                      setCurrentUser(updated);
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsUploadingCover(false);
                  }
                },
                () => setIsUploadingCover(false)
              );
            }}
            accept="image/*" 
            className="hidden" 
          />
          {(isUploadingCover || isSavingProfile) && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-10 flex items-center justify-center gap-2 text-white font-bold text-xs animate-pulse">
              <Loader2 size={18} className="animate-spin text-white" />
              <span>{t('profile.processing_banner')}</span>
            </div>
          )}
          {currentUser.coverPhoto || currentUser.cover_photo ? (
            <img
              src={currentUser.coverPhoto || currentUser.cover_photo}
              alt="Cover background"
              className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-300 to-slate-200 dark:from-slate-800 dark:to-slate-900" />
          )}

          {/* Hover Overlay Hint */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 z-15">
            <Settings size={14} className="animate-spin-slow" />
            <span>Ubah Background Profile</span>
          </div>
          
          {/* Settings & Language float toggles */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              className="p-2 bg-white/80 dark:bg-black/60 backdrop-blur-md text-slate-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white rounded-full transition border border-white/50 shadow-sm cursor-pointer flex items-center justify-center"
              title="Ubah Background Profile"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Profile Details Container - Overlapping Avatar */}
        <div className="px-5 pb-6 relative pt-15">
          
          {/* Avatar frame without flag badge */}
          <div className="absolute -top-12 left-5 z-20 w-24 h-24">
            <div className="w-full h-full rounded-full border-4 border-white dark:border-[#121620] bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-black text-3xl flex items-center justify-center shadow-md overflow-hidden relative">
              {(isUploadingAvatar || isSavingProfile) && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-10 flex flex-col items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-white" />
                </div>
              )}
              {currentUser.avatar && currentUser.avatar.length > 2 ? (
                <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
              ) : (
                currentUser.avatar || "👤"
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-roboto font-bold text-slate-900 dark:text-white leading-tight">{currentUser.firstName} {currentUser.lastName}</h3>
              <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                {currentUser.tradingExperience}
              </span>
            </div>

            {/* Subtitle status: Verified / Unverified Member */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {(currentUser.mt5Connected || currentUser.isVerified) ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  <CheckCircle size={13} className="text-emerald-500" />
                  {t('profile.verified_member')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <ShieldAlert size={13} className="text-slate-400" />
                  {t('profile.unverified_member')}
                </span>
              )}
            </div>
            
            <p className="text-[14px] font-roboto font-medium text-slate-800 dark:text-gray-300 leading-snug max-w-lg pt-1">
              {currentUser.headline}
            </p>
          </div>

          {/* Location / Experience pills */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 text-xs text-slate-500 dark:text-gray-400 font-medium">
            <button 
              onClick={() => {
                if (currentUser?.city) {
                  setActiveView('groups');
                }
              }}
              className="flex items-center gap-1.5 hover:text-indigo-600 transition cursor-pointer active:scale-95"
              title="Buka Halaman Grup Komunitas Kota"
            >
              <MapPin size={14} className="text-red-500 fill-red-500/20 shrink-0" />
              <span className="underline decoration-indigo-500/35 underline-offset-2">{currentUser.city}, {currentUser.country}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <Briefcase size={14} className="text-slate-400" />
              <span>Trading {currentUser.tradingAsset}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award size={14} className="text-amber-500" />
              <span className="text-amber-600 dark:text-amber-500 font-bold">{formatToK(currentUser.reputationPoints)} Points</span>
            </div>
          </div>

          {/* Bio text */}
          {currentUser.bio && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800/40">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('profile.about')}</h4>
              <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed italic">
                "{currentUser.bio}"
              </p>
            </div>
          )}

          {/* Social Stats indicators */}
          <div className="flex gap-6 pt-5 border-t border-slate-100 dark:border-gray-800/40 mt-4 text-[13px]">
            <button 
              onClick={() => openFollowsModal('followers')}
              className="hover:underline decoration-indigo-500 underline-offset-4 cursor-pointer text-left"
            >
              <span className="text-slate-900 dark:text-white font-bold">{formatToK(currentUser.followersCount)}</span>{' '}
              <span className="text-slate-500 dark:text-gray-500">followers</span>
            </button>
            <button 
              onClick={() => openFollowsModal('following')}
              className="hover:underline decoration-indigo-500 underline-offset-4 cursor-pointer text-left"
            >
              <span className="text-slate-900 dark:text-white font-bold">{formatToK(currentUser.followingCount)}</span>{' '}
              <span className="text-slate-500 dark:text-gray-500">following</span>
            </button>
          </div>

        </div>

      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 text-xs pb-2 sm:pb-0">
        <div className="flex flex-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'posts', label: t('profile.my_trading_posts'), icon: Grid },
            { id: 'partners', label: 'Tarapti Partners', icon: Handshake },
            { id: 'media', label: t('profile.media_gallery'), icon: Image },
            { id: 'settings', label: t('profile.edit_profile_settings'), icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 font-bold transition border-b-2 flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-gray-900 dark:text-white font-extrabold'
                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Pane display */}
      <div className="space-y-4">
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {ownPosts.length === 0 ? (
              <div className="bg-white dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center text-gray-400 dark:text-gray-500 text-xs">
                You haven't shared any analysis yet. Launch your first post on the Home Dashboard!
              </div>
            ) : (
              ownPosts.map(post => (
                <PostCard key={post.id} post={post} onPostUpdated={() => {}} />
              ))
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="bg-white dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
            {mediaUrls.length === 0 ? (
              <p className="text-center py-10 text-gray-400 dark:text-gray-500 text-xs">{t('profile.no_media')}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mediaUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt="Trader attachment"
                    onClick={() => setLightboxMedia({ url, type: (url.startsWith('data:video/') || url.endsWith('.mp4')) ? 'video' : 'image' })}
                    className="aspect-square object-cover rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:opacity-90 transition"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'partners' && (
          <TaraptiPartners />
        )}

        {activeTab === 'settings' && (
          <div className="bg-[#f4f6fa] rounded-[24px] p-5 mb-8">
            <div className="mb-6 space-y-4">
              <LanguageSelector />
              
              {/* 24-Hour Time Format Setting */}
              <div className="bg-white border border-slate-200 rounded-[20px] p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 leading-tight">Format Jam System</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Format 24-Jam (Tanpa AM / PM)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold text-[11px]">
                  <Check size={14} className="text-emerald-600" />
                  <span>24-Jam (Aktif)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4 px-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-100/80 flex items-center justify-center shadow-sm">
                <Settings size={20} className="text-indigo-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">{t('profile.profile_config')}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{t('profile.account_preferences')}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 mb-2">
                <div className="flex-1 border border-slate-200 p-4 rounded-[20px] bg-white">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Avatar Image</label>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-indigo-300 flex items-center justify-center font-bold text-white text-lg shrink-0 border border-slate-200 relative cursor-pointer group"
                      onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                    >
                      {(isUploadingAvatar || avatarImgLoading) && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10 animate-pulse">
                          <Loader2 size={20} className="animate-spin text-white" />
                        </div>
                      )}
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          className="w-full h-full object-cover" 
                          alt="Avatar" 
                          referrerPolicy="no-referrer"
                          onLoad={() => setAvatarImgLoading(false)}
                          onError={() => setAvatarImgLoading(false)}
                        />
                      ) : (
                        currentUser?.avatar && currentUser.avatar.length > 2 ? (
                          <img 
                            src={currentUser.avatar} 
                            className="w-full h-full object-cover" 
                            alt="Avatar" 
                            referrerPolicy="no-referrer"
                            onLoad={() => setAvatarImgLoading(false)}
                            onError={() => setAvatarImgLoading(false)}
                          />
                        ) : (
                          currentUser?.avatar || "👤"
                        )
                      )}
                    </div>
                    <div className="flex-1">
                      <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                      <button 
                        type="button" 
                        disabled={isUploadingAvatar}
                        onClick={() => fileInputRef.current?.click()} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-indigo-600" />
                            <span>Processing Photo...</span>
                          </>
                        ) : (
                          <span>{avatarUrl ? 'Change Image' : 'Upload Image'}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 border border-slate-200 p-4 rounded-[20px] bg-white">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cover Banner</label>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-24 h-16 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 relative cursor-pointer group"
                      onClick={() => !isUploadingCover && coverFileInputRef.current?.click()}
                    >
                      {(isUploadingCover || coverImgLoading) && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10 animate-pulse">
                          <Loader2 size={20} className="animate-spin text-white" />
                        </div>
                      )}
                      {coverPhotoUrl ? (
                        <img 
                          src={coverPhotoUrl} 
                          className="w-full h-full object-cover" 
                          alt="Cover" 
                          referrerPolicy="no-referrer"
                          onLoad={() => setCoverImgLoading(false)}
                          onError={() => setCoverImgLoading(false)}
                        />
                      ) : (
                        (currentUser?.coverPhoto || currentUser?.cover_photo) && (currentUser?.coverPhoto || currentUser?.cover_photo)!.length > 2 ? (
                          <img 
                            src={currentUser?.coverPhoto || currentUser?.cover_photo} 
                            className="w-full h-full object-cover" 
                            alt="Cover" 
                            referrerPolicy="no-referrer"
                            onLoad={() => setCoverImgLoading(false)}
                            onError={() => setCoverImgLoading(false)}
                          />
                        ) : (
                          <Image size={24} className="text-slate-300" />
                        )
                      )}
                    </div>
                    <div className="flex-1">
                      <input type="file" ref={coverFileInputRef} onChange={handleCoverChange} accept="image/*" className="hidden" />
                      <button 
                        type="button" 
                        disabled={isUploadingCover}
                        onClick={() => coverFileInputRef.current?.click()} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isUploadingCover ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-indigo-600" />
                            <span>Processing Banner...</span>
                          </>
                        ) : (
                          <span>{coverPhotoUrl ? 'Change Banner' : 'Upload Banner'}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl text-xs mb-6 text-center flex items-center justify-center gap-2 font-bold shadow-sm animate-in fade-in zoom-in-95">
                <CheckCircle size={16} className="text-emerald-500" /> 
                Profile parameters synchronized successfully.
              </div>
            )}

            <div className="grid grid-cols-2 gap-5 text-xs">
              <div className="col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 text-xs font-black">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Equities Trader"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Biography</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your trading philosophy..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 h-28 resize-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City / Region</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trading Experience</label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Pro Trader">Pro Trader</option>
                </select>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Asset Focus</label>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Forex">Forex Markets</option>
                  <option value="Crypto">Cryptocurrencies</option>
                  <option value="Stocks">Equities & Stocks</option>
                  <option value="Indices">Global Indices</option>
                  <option value="Commodities">Commodities & Futures</option>
                </select>
              </div>

              {/* Market Pulse Notification Toggle & Configuration Section */}
              <div className="col-span-2 pt-8 mt-4 border-t border-slate-200">
                <div className="bg-white border border-slate-200 rounded-[20px] p-6 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center">
                          <Activity size={14} className="text-rose-500" />
                        </div>
                        Market Pulse Alerts
                      </label>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs font-medium">
                        Real-time volatility intelligence for your monitored portfolios.
                      </p>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setMarketPulseEnabled(!marketPulseEnabled)}
                      className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        marketPulseEnabled ? 'bg-slate-900' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          marketPulseEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {marketPulseEnabled && (
                    <div className="space-y-5 pt-5 border-t border-slate-200/50 animate-in slide-in-from-top-2 duration-300">
                      <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
                          Monitored Asset Classes
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {["Forex", "Crypto", "Stocks", "Indices", "Commodities"].map((assetItem) => {
                            const isChecked = marketPulseAssets.includes(assetItem);
                            return (
                              <button
                                key={assetItem}
                                type="button"
                                onClick={() => {
                                  if (isChecked) {
                                    setMarketPulseAssets(marketPulseAssets.filter(x => x !== assetItem));
                                  } else {
                                    setMarketPulseAssets([...marketPulseAssets, assetItem]);
                                  }
                                }}
                                className={`flex items-center justify-center px-4 py-3 rounded-2xl border text-[11px] font-black transition-all ${
                                  isChecked
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                              >
                                {assetItem}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Simulation Trigger */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-slate-900 uppercase">Alert Sandbox</span>
                          <p className="text-[10px] text-slate-400 font-medium">Trigger test volatility event.</p>
                        </div>
                        <button
                          type="button"
                          disabled={isSimulating || marketPulseAssets.length === 0}
                          onClick={handleSimulateVolatility}
                          className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 text-slate-900 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                        >
                          <Activity size={12} className={isSimulating ? "animate-spin text-rose-500" : ""} />
                          {isSimulating ? "Spiking..." : "Test Pulse"}
                        </button>
                      </div>

                      {simulationResult && (
                        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 p-4 rounded-2xl text-[10px] text-center font-black animate-in fade-in slide-in-from-bottom-2">
                          {simulationResult}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSavingProfile || isUploadingAvatar || isUploadingCover}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Menyimpan Profil...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Profile
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Tarapti System Notification Sandbox & Logo Display */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    Uji Notifikasi Pop-up Tarapti
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium max-w-md leading-relaxed">
                    Aktifkan notifikasi pop-up sistem untuk menerima peringatan langsung di layar HP atau desktop Anda, lengkap dengan Logo Tarapti resmi.
                  </p>
                </div>
                
                {/* Status Badge */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Status:</span>
                  <div className={`px-3 py-1 rounded-full border text-[10px] font-black flex items-center gap-1.5 ${
                    notifPermission === 'granted' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : notifPermission === 'denied'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      notifPermission === 'granted' ? 'bg-emerald-500' : notifPermission === 'denied' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    {notifPermission === 'granted' ? 'Izin Aktif' : notifPermission === 'denied' ? 'Izin Diblokir' : 'Menunggu Izin'}
                  </div>
                </div>
              </div>

              {/* Logo Preview and Sandbox action wrapper */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                
                {/* Box 1: GoTrading Hub Official Logo Preview */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md border border-slate-200/50 shrink-0 bg-white">
                    <img 
                      src="/tarapti_logo_1784421680053.jpg" 
                      alt="GoTrading Hub Logo" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Ikon Notifikasi Resmi</span>
                    <h5 className="text-xs font-black text-slate-800">Logo GoTrading Hub</h5>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Logo ini akan tampil sebagai ikon pop-up pada layar notifikasi perangkat Anda.
                    </p>
                    <a
                      href="/logo-upload"
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm"
                    >
                      ⚙️ Kelola & Upload Logo
                    </a>
                  </div>
                </div>

                {/* Box 2: Test Action Buttons */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-center gap-2.5">
                  {notifPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Activity size={12} /> Aktifkan Izin Sistem
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    disabled={isTestingNotif}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Activity size={12} className={isTestingNotif ? "animate-pulse" : ""} />
                    {isTestingNotif ? 'Mengirim...' : 'Kirim Notifikasi Uji Coba'}
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Prominent Session Sign-Out Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="bg-rose-50 border border-rose-100 rounded-[24px] p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Account Session (Session Security)
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Securely log out of your trader profile on this device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-rose-200 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <LogOut size={13} /> Log Out
                </button>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Facebook Reels & Media Viewer */}
      {lightboxMedia && (() => {
        const associatedPost = ownPosts.find(p => p.images && p.images.includes(lightboxMedia.url)) || ownPosts.find(p => p.videoUrl === lightboxMedia.url);
        const fallbackPost: Post = {
          id: 'temp-' + Date.now(),
          userId: currentUser?.id || '',
          authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Trader',
          authorUsername: currentUser?.username || 'trader',
          authorAvatar: currentUser?.avatar || '',
          authorRole: currentUser?.headline || 'Member',
          content: 'Media attachment',
          likesCount: 0,
          commentsCount: 0,
          bookmarksCount: 0,
          repostsCount: 0,
          likedBy: [],
          bookmarkedBy: [],
          repostedBy: [],
          timestamp: new Date().toISOString(),
          tags: []
        };
        return (
          <MediaViewer
            post={associatedPost || fallbackPost}
            mediaUrl={lightboxMedia.url}
            mediaType={lightboxMedia.type}
            onClose={() => setLightboxMedia(null)}
            onPostUpdated={() => {}}
          />
        );
      })()}

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

    </div>
  );
};
