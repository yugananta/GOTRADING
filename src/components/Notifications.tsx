import React, { useState } from 'react';
import { useApp } from './AppContext.tsx';
import { formatRelativeTime, formatLinkedInTime } from '../utils/dateUtils.ts';
import { TaraptiLogo } from './TaraptiLogo.tsx';
import { requestNotificationPermission, showDeviceNotification } from '../utils/pushNotification.ts';
import { 
  Bell, ThumbsUp, MessageSquare, Repeat2, UserPlus, Mail, Check, AlertCircle, 
  Activity, TrendingUp, AlertTriangle, Newspaper, ShieldAlert, Sparkles, 
  ChevronDown, ChevronUp, CheckCheck, Trash2, SlidersHorizontal, ArrowUpRight,
  UserCheck, Lock, ShieldCheck, Globe, X, ExternalLink, RefreshCw, HelpCircle
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    viewUserProfile,
    triggerTestNotification,
    acceptConnectionRequest,
    declineConnectionRequest,
    setActiveView,
    setActiveChatPartnerId,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'profit' | 'social' | 'system'>('all');
  const [showSimulator, setShowSimulator] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const handleRequestPermission = async () => {
    if (browserPermission === 'denied') {
      setShowGuideModal(true);
      showToast("Izin notifikasi ditolak oleh browser. Buka petunjuk untuk mengaktifkan kembali.");
      return;
    }

    const res = await requestNotificationPermission();
    setBrowserPermission(res === 'unsupported' ? 'unsupported' : res);
    if (res === 'granted') {
      showToast("Notifikasi browser berhasil diaktifkan!");
      showDeviceNotification("Notifikasi Tarapti Aktif", {
        body: "Anda akan menerima notifikasi real-time berdesain LinkedIn.",
        icon: '/tarapti_logo_1784421680053.jpg'
      });
    } else if (res === 'denied') {
      setShowGuideModal(true);
      showToast("Izin notifikasi ditolak oleh browser. Buka petunjuk unblock.");
    }
  };

  const handleNotificationClick = (n: any) => {
    // 1. Mark as read
    if (!n.isRead) {
      markNotificationRead(n.id);
    }

    // 2. Navigate based on notification type
    switch (n.type) {
      case 'message':
        if (n.fromUserId) {
          setActiveChatPartnerId(n.fromUserId);
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
      case 'friend_post':
      case 'POST':
      default:
        setActiveView('feed');
        break;
    }
  };

  const getNotificationCategory = (type: string): 'profit' | 'social' | 'system' => {
    if (type.includes('profit') || type.includes('drawdown')) return 'profit';
    if (type === 'high_news' || type === 'market_pulse') return 'system';
    return 'social';
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    return getNotificationCategory(n.type) === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const profitUnread = notifications.filter(n => !n.isRead && getNotificationCategory(n.type) === 'profit').length;
  const socialUnread = notifications.filter(n => !n.isRead && getNotificationCategory(n.type) === 'social').length;
  const systemUnread = notifications.filter(n => !n.isRead && getNotificationCategory(n.type) === 'system').length;

  const getLinkedInHeaderTitle = (n: any) => {
    const name = n.fromUserName || 'Member Tarapti';
    switch (n.type) {
      case 'friend_request':
        return `${name} ingin terhubung`;
      case 'friend_accepted':
        return `${name} menerima pertemanan`;
      case 'message':
      case 'NEW_MESSAGE':
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
        return `Pemberitahuan Berita Pasar`;
      default:
        return `${name} memosting`;
    }
  };

  return (
    <div id="notifications-view" className="space-y-4 py-2 max-w-2xl mx-auto">
      
      {/* Title Header */}
      <div className="flex items-center justify-between bg-white dark:bg-[#121620] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-sm">
            <Bell size={20} className="animate-swing text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                Pemberitahuan Tarapti
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-extrabold bg-indigo-600 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Notifikasi real-time & browser resmi Tarapti
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            <CheckCheck size={14} />
            <span className="hidden sm:inline">Tandai Dibaca</span>
          </button>
        )}
      </div>

      {/* Browser Notification Banner Box */}
      <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-purple-800/50 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 p-1">
              <TaraptiLogo height={24} onlyEmblem={true} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                Notifikasi Browser Tarapti
                {browserPermission === 'granted' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                    <Check size={11} /> Aktif
                  </span>
                ) : browserPermission === 'denied' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/30 flex items-center gap-1">
                    <AlertTriangle size={11} /> Ditolak Browser
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    Resmi
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {browserPermission === 'denied'
                  ? 'Izin notifikasi ditolak oleh browser Anda. Klik tombol di kanan untuk petunjuk mengaktifkan kembali.'
                  : 'Fitur notifikasi melayang & browser desktop dengan logo Tarapti, timestamp, dan lencana terverifikasi.'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {browserPermission === 'granted' ? (
              <span className="text-xs text-emerald-300 font-semibold px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center gap-1">
                <Check size={14} /> Terhubung
              </span>
            ) : browserPermission === 'denied' ? (
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition shadow-sm shrink-0 whitespace-nowrap active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <HelpCircle size={14} />
                Cara Mengaktifkan
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl transition shadow-sm shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                Aktifkan Di Browser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#121620] dark:text-slate-300 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span>Semua</span>
          {unreadCount > 0 && (
            <span className={`px-1.5 py-0.2 text-[10px] rounded-md ${activeTab === 'all' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profit')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'profit'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#121620] dark:text-slate-300 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <TrendingUp size={14} className="text-emerald-500" />
          <span>Profit & Risiko</span>
          {profitUnread > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-emerald-500 text-white">
              {profitUnread}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'social'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#121620] dark:text-slate-300 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <MessageSquare size={14} className="text-indigo-500" />
          <span>Sosial & Komunitas</span>
          {socialUnread > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-indigo-500 text-white">
              {socialUnread}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'system'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#121620] dark:text-slate-300 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Activity size={14} className="text-amber-500" />
          <span>Berita & Sinyal</span>
          {systemUnread > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-amber-500 text-white">
              {systemUnread}
            </span>
          )}
        </button>
      </div>

      {/* Simulator Toggle Box */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-3.5 transition-all">
        <button
          type="button"
          onClick={() => setShowSimulator(!showSimulator)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>Simulator Notifikasi Tarapti</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
              Uji Coba
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-normal">
            <span>{showSimulator ? 'Sembunyikan' : 'Buka Panel Uji'}</span>
            {showSimulator ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        {showSimulator && (
          <div className="pt-3 mt-2 border-t border-indigo-100/80 dark:border-indigo-900/40 space-y-2">
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Klik tombol di bawah untuk memicu notifikasi resmi Tarapti di layar & browser:
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => triggerTestNotification('like')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-lg border border-purple-200 dark:border-purple-800/60 shadow-xs transition cursor-pointer"
              >
                📝 Mayur memosting
              </button>
              <button
                onClick={() => triggerTestNotification('friend_request')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-400 text-xs font-medium rounded-lg border border-sky-200 dark:border-sky-800/60 shadow-xs transition cursor-pointer"
              >
                👤 Permintaan Teman
              </button>
              <button
                onClick={() => triggerTestNotification('new_message')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-800/60 shadow-xs transition cursor-pointer"
              >
                📩 Pesan Baru
              </button>
              <button
                onClick={() => triggerTestNotification('profit_target_daily')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-lg border border-emerald-200 dark:border-emerald-800/60 shadow-xs transition cursor-pointer"
              >
                🎯 Target Profit
              </button>
              <button
                onClick={() => triggerTestNotification('high_news')}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-lg border border-amber-200 dark:border-amber-800/60 shadow-xs transition cursor-pointer"
              >
                🔴 Berita Ekonomi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications Cards Stream (LinkedIn Android Notification Style) */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center">
              <Bell size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Belum Ada Notifikasi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Notifikasi baru akan muncul di sini secara real-time.
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const timeStr = formatLinkedInTime(n.timestamp);
            const relativeStr = formatRelativeTime(n.timestamp);
            const headerTitle = getLinkedInHeaderTitle(n);

            const avatarSrc = n.fromUserAvatar && (n.fromUserAvatar.startsWith('http') || n.fromUserAvatar.startsWith('data:'))
              ? n.fromUserAvatar
              : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(n.fromUserName || 'TaraptiUser')}`;

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`group relative bg-white dark:bg-[#121620] border rounded-2xl p-3.5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:border-blue-400/80 dark:hover:border-blue-600/80 ${
                  !n.isRead
                    ? 'border-indigo-200/90 dark:border-indigo-900/80 bg-gradient-to-r from-indigo-50/20 via-white to-white dark:from-indigo-950/20 dark:via-[#121620] dark:to-[#121620]'
                    : 'border-slate-200/80 dark:border-slate-800/80 opacity-95'
                }`}
              >
                {/* Top Header Row (LinkedIn Style): Tarapti Logo + Title + Time + Lock + Chevron */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Tarapti Logo Small Badge */}
                    <div className="w-5 h-5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-center shrink-0 p-0.5">
                      <TaraptiLogo height={14} onlyEmblem={true} />
                    </div>

                    {/* Title / Action Header */}
                    <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {headerTitle}
                    </span>

                    {/* Time (e.g. 19.00 / 17.52) */}
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal shrink-0">
                      {timeStr}
                    </span>

                    {/* Blue Lock Badge */}
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white shrink-0 shadow-2xs" title="Terverifikasi & Aman">
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  {/* Right Chevron Down */}
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
                </div>

                {/* Body Content & Right Side Image Thumbnail */}
                <div className="flex items-start justify-between gap-3 pt-0.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-700 dark:text-slate-300 font-normal leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {relativeStr}
                      </span>
                    </div>

                    {/* Friend Request Action buttons */}
                    {n.type === 'friend_request' && (
                      <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={async () => {
                            if (n.fromUserId) await acceptConnectionRequest(n.fromUserId);
                            markNotificationRead(n.id);
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <UserCheck size={12} />
                          Terima Pertemanan
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (n.fromUserId) await declineConnectionRequest(n.fromUserId);
                            markNotificationRead(n.id);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Side Avatar / Thumbnail */}
                  <div className="shrink-0 relative">
                    <img 
                      src={avatarSrc} 
                      alt={n.fromUserName || 'Avatar'} 
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200/80 dark:border-slate-700 shadow-2xs bg-slate-100 dark:bg-slate-800"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Unread Pulsing Dot */}
                {!n.isRead && (
                  <div className="absolute top-3.5 right-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full block ring-4 ring-blue-500/20 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Unblock Notification Permission Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Izin Notifikasi Ditolak Browser
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Browser memblokir permintaan notifikasi untuk domain ini.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-white">Cara mengizinkan notifikasi di browser Anda:</p>
              
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Ikon Gembok / Setelan Situs: </span>
                  Klik ikon gembok <Lock size={12} className="inline mx-0.5 text-slate-500" /> atau "Site Settings" di sebelah kiri baris URL browser Anda.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Ubah Izin Notifikasi: </span>
                  Cari opsi <span className="font-bold">Notifikasi (Notifications)</span> lalu ubah dari <span className="text-rose-600 font-bold">Ditolak / Block</span> menjadi <span className="text-emerald-600 font-bold">Izinkan / Allow</span>.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Muat Ulang Halaman: </span>
                  Muat ulang (refresh) halaman web ini untuk memperbarui izin.
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full sm:w-auto flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <ExternalLink size={14} />
                Buka di Tab Baru
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGuideModal(false);
                  window.location.reload();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <RefreshCw size={14} />
                Muat Ulang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
