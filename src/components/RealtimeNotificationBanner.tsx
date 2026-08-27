import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, UserCheck, MessageSquare, Bell, Check, X, ArrowRight, Target, 
  AlertTriangle, Globe, ChevronDown, ChevronUp, Lock, ShieldCheck
} from 'lucide-react';
import { Notification } from '../types.js';
import { useApp } from './AppContext.tsx';
import { TaraptiLogo } from './TaraptiLogo.tsx';
import { formatLinkedInTime } from '../utils/dateUtils.ts';
import { showDeviceNotification } from '../utils/pushNotification.ts';

export interface RealtimeEventData {
  id: string;
  type: string;
  notification: Notification;
  timestamp: number;
}

interface RealtimeNotificationBannerProps {
  event: RealtimeEventData | null;
  onDismiss: () => void;
}

export const RealtimeNotificationBanner: React.FC<RealtimeNotificationBannerProps> = ({
  event,
  onDismiss,
}) => {
  const { acceptConnectionRequest, declineConnectionRequest, setActiveView, setActiveChatPartnerId } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!event) return;

    // Fire native web browser desktop notification
    const fromName = event.notification.fromUserName || 'Tarapti';
    const msg = event.notification.message || 'Anda memiliki notifikasi baru';
    const notifTitle = getHeaderTitle(event.notification, event.type);

    showDeviceNotification(notifTitle, {
      body: msg,
      icon: '/tarapti_logo_1784421680053.jpg',
      tag: 'tarapti-realtime-' + event.id
    });

    // Auto dismiss in-app floating banner after 8 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);

    return () => clearTimeout(timer);
  }, [event]);

  if (!event) return null;

  const { notification, type } = event;

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;
    setIsProcessing(true);
    await acceptConnectionRequest(notification.fromUserId);
    setIsProcessing(false);
    onDismiss();
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;
    setIsProcessing(true);
    await declineConnectionRequest(notification.fromUserId);
    setIsProcessing(false);
    onDismiss();
  };

  const handleOpenMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.fromUserId) {
      setActiveChatPartnerId(notification.fromUserId);
    }
    setActiveView('messages');
    onDismiss();
  };

  const handleCardClick = () => {
    if (!notification) {
      setActiveView('notifications');
      onDismiss();
      return;
    }

    switch (notification.type) {
      case 'message':
        if (notification.fromUserId) {
          setActiveChatPartnerId(notification.fromUserId);
        }
        setActiveView('messages');
        break;

      case 'friend_request':
      case 'friend_accepted':
      case 'follow':
        setActiveView('network');
        break;

      case 'profit_target_daily':
      case 'profit_target_weekly':
      case 'drawdown_daily':
      case 'drawdown_weekly':
        setActiveView('journal');
        break;

      case 'market_pulse':
      case 'high_news':
        setActiveView('outlook');
        break;

      case 'like':
      case 'comment':
      case 'reply':
      case 'mention':
      case 'repost':
      default:
        setActiveView('feed');
        break;
    }
    onDismiss();
  };

  const formattedTime = formatLinkedInTime(notification.timestamp);
  const headerTitle = getHeaderTitle(notification, type);
  const isVerifiedOrSecure = notification.isVerified || type === 'FRIEND_ACCEPTED' || type === 'profit_target_daily' || type === 'profit_target_weekly';

  const avatarSrc = notification.fromUserAvatar && notification.fromUserAvatar.startsWith('http')
    ? notification.fromUserAvatar
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(notification.fromUserName || 'TaraptiUser')}`;

  return (
    <AnimatePresence>
      <motion.div
        key={event.id}
        initial={{ y: -90, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -70, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="fixed top-4 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none"
      >
        <div 
          onClick={handleCardClick}
          className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/12 p-3.5 pointer-events-auto relative overflow-hidden cursor-pointer hover:bg-slate-50/95 dark:hover:bg-slate-800/90 transition-all duration-150 group"
        >
          {/* Top subtle gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500" />

          {/* Header Row: Tarapti Logo + Title + Time + Lock + Chevron */}
          <div className="flex items-center justify-between gap-2 mb-1.5 pt-0.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Tarapti Logo Square Badge */}
              <div className="w-5 h-5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-center shrink-0 p-0.5">
                <TaraptiLogo height={14} onlyEmblem={true} />
              </div>

              {/* Title / Action Headline */}
              <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                {headerTitle}
              </span>

              {/* Timestamp like 19.00 / 17.52 */}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal shrink-0">
                {formattedTime}
              </span>

              {/* Blue Security / Lock Icon Badge */}
              {isVerifiedOrSecure && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white shrink-0 shadow-2xs" title="Terverifikasi & Aman">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              )}
            </div>

            {/* Chevron toggle / Close button */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title={isExpanded ? "Ciutkan" : "Perluas"}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition ml-0.5"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Content & Right Side Avatar Thumbnail */}
          {isExpanded && (
            <div className="flex items-start justify-between gap-3 pt-0.5">
              {/* Left Body Text & Action Buttons */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-slate-700 dark:text-slate-300 font-normal leading-relaxed line-clamp-2">
                  {notification.message || 'Ada pembaruan baru dari komunitas Tarapti.'}
                </p>

                {/* Quick Action Buttons */}
                <div className="mt-2.5 flex items-center gap-2">
                  {type === 'FRIEND_REQUEST' && (
                    <>
                      <button
                        onClick={handleAccept}
                        disabled={isProcessing}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Terima
                      </button>
                      <button
                        onClick={handleDecline}
                        disabled={isProcessing}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-lg transition-all"
                      >
                        Tolak
                      </button>
                    </>
                  )}

                  {type === 'NEW_MESSAGE' && (
                    <button
                      onClick={handleOpenMessage}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Buka Chat
                    </button>
                  )}

                  {type === 'FRIEND_ACCEPTED' && (
                    <button
                      onClick={handleOpenMessage}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Kirim Pesan
                    </button>
                  )}

                  {(type === 'NOTIFICATION' || type === 'like' || type === 'comment' || type === 'POST') && (
                    <button
                      onClick={handleCardClick}
                      className="px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 font-semibold text-xs rounded-lg transition-all flex items-center gap-1 shadow-xs"
                    >
                      Lihat Detail
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Side Image Thumbnail (Avatar) */}
              <div className="shrink-0 relative">
                <img 
                  src={avatarSrc} 
                  alt="Thumbnail" 
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200/90 dark:border-slate-700 shadow-2xs bg-slate-100 dark:bg-slate-800"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

function getHeaderTitle(n: Notification, type: string): string {
  const name = n.fromUserName || 'Member Tarapti';
  switch (type) {
    case 'FRIEND_REQUEST':
      return `${name} ingin terhubung`;
    case 'FRIEND_ACCEPTED':
      return `${name} menerima pertemanan`;
    case 'NEW_MESSAGE':
    case 'message':
      return `${name} mengirim pesan`;
    case 'like':
      return `${name} menyukai postingan Anda`;
    case 'comment':
      return `${name} mengomentari postingan`;
    case 'profit_target_daily':
    case 'profit_target_weekly':
      return `Pemberitahuan Profit Tarapti`;
    case 'drawdown_daily':
    case 'drawdown_weekly':
      return `Peringatan Risiko Akun Anda`;
    case 'high_news':
      return `Pemberitahuan Berita Ekonomi`;
    default:
      return `${name} memosting`;
  }
}
