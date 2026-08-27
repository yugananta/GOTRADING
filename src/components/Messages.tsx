import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from './AppContext.tsx';
import { TaraptiLogo } from './TaraptiLogo.tsx';
import { SponsoredBadge } from './SponsoredBadge.tsx';
import { 
  Search, Send, ArrowLeft, Image as ImageIcon, Smile, Check, CheckCheck, Loader2,
  MoreVertical, ChevronRight, Edit3, SquarePen, Star, Plus, Mic,
  FileText, Camera, AtSign, Users, X, BadgeCheck, UserPlus, Maximize2, Minimize2, Trash2,
  ChevronUp, ChevronDown, Filter
} from 'lucide-react';
import { playSound } from '../lib/audio';
import { apiFetch } from '../utils/apiFetch';
import { formatMessageDate as getFormattedMessageDate, formatLocalTime, parseUTCDate } from '../utils/dateUtils.ts';

const LOCAL_STORAGE_KEY_PREFIX = 'tarapti_chat_';

export const Messages: React.FC = () => {
  const {
    currentUser,
    sessions: dbSessions,
    fetchSessions,
    markSessionAsRead,
    activeChatPartnerId,
    setActiveChatPartnerId,
    chatHistory: dbChatHistory,
    fetchChatHistory,
    sendMessage: dbSendMessage,
    reactToMessage: dbReactToMessage,
    viewUserProfile,
    setActiveView,
    addStory,
    showToast
  } = useApp();

  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'spam' | 'unread'>('chats');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ url: string, name?: string, type?: string } | null>(null);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [lightboxFit, setLightboxFit] = useState<'fill' | 'fit'>('fill');

  // In-chat conversation search states
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatQuery, setInChatQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [filterOnlyMatches, setFilterOnlyMatches] = useState(false);
  
  // Tulis pesan modal states
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessageSearch, setNewMessageSearch] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Story modal state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyImage, setStoryImage] = useState<string | null>(null);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (messageId: string) => {
    longPressTimer.current = setTimeout(() => {
      setActiveReactionPickerId(messageId);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch registered users for "Tulis Pesan" modal and active contacts
  useEffect(() => {
    setLoadingUsers(true);
    apiFetch('/api/users')
      .then(res => {
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) return res.json();
        return [];
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAllUsers(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  const activeHistory = useMemo(() => {
    return activeChatPartnerId ? dbChatHistory : [];
  }, [activeChatPartnerId, dbChatHistory]);

  // Reset in-chat search state when switching conversation partners
  useEffect(() => {
    setShowInChatSearch(false);
    setInChatQuery('');
    setCurrentMatchIndex(0);
    setFilterOnlyMatches(false);
  }, [activeChatPartnerId]);

  // Find IDs of messages matching the search query
  const matchingMessageIds = useMemo(() => {
    if (!inChatQuery.trim() || !activeHistory) return [];
    const q = inChatQuery.trim().toLowerCase();
    return activeHistory
      .filter((m: any) => m && m.content && typeof m.content === 'string' && m.content.toLowerCase().includes(q))
      .map((m: any) => m.id);
  }, [inChatQuery, activeHistory]);

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchingMessageIds.length);
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchingMessageIds.length) % matchingMessageIds.length);
  };

  // Auto-scroll to focused match element when navigating or querying
  useEffect(() => {
    if (matchingMessageIds.length > 0 && matchingMessageIds[currentMatchIndex]) {
      const activeMatchId = matchingMessageIds[currentMatchIndex];
      const el = document.getElementById(`msg-${activeMatchId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatchIndex, matchingMessageIds]);

  // Highlight matching search term inside text
  const renderHighlightedText = (text: string, query: string, isSentByMe: boolean) => {
    if (!query || !query.trim() || !text) return text;
    const q = query.trim();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark
          key={index}
          className={
            isSentByMe 
              ? 'bg-amber-300 text-slate-900 font-bold px-0.5 rounded shadow-2xs' 
              : 'bg-yellow-300 text-slate-900 font-bold px-0.5 rounded shadow-2xs'
          }
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatPartnerId, dbChatHistory]);

  // Sync database sessions and history
  useEffect(() => {
    if (activeChatPartnerId) {
      fetchChatHistory(activeChatPartnerId);
      
      const interval = setInterval(() => {
        fetchChatHistory(activeChatPartnerId);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [activeChatPartnerId]);

  // Active Contacts dynamically sourced from registered users
  const activeContacts = useMemo(() => {
    return allUsers
      .filter(u => u.id !== currentUser?.id)
      .map(u => ({
        id: u.id,
        name: u.firstName,
        avatar: u.avatar || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80`,
        isOnline: u.onlineStatus === 'online'
      }))
      .slice(0, 10);
  }, [allUsers, currentUser]);

  // Helper to safely check if avatar is a valid URL or path string
  const isUrlAvatar = (avatar: any) => {
    return typeof avatar === 'string' && (
      avatar.startsWith('http://') || 
      avatar.startsWith('https://') || 
      avatar.startsWith('data:') || 
      avatar.startsWith('blob:') || 
      avatar.startsWith('/')
    );
  };

  // Helper to map images/avatars for users
  const getAvatarUrl = (userId: string, initials: any) => {
    if (isUrlAvatar(initials)) {
      return initials;
    }
    return null;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatPartnerId || (!inputText.trim() && !attachedFile)) return;

    await dbSendMessage(
      activeChatPartnerId, 
      inputText, 
      attachedFile?.type?.startsWith('image/') ? attachedFile.url : undefined,
      !attachedFile?.type?.startsWith('image/') ? attachedFile?.url : undefined,
      attachedFile?.name
    );
    setInputText('');
    setAttachedFile(null);
    setShowImagePanel(false);
    fetchChatHistory(activeChatPartnerId);
    fetchSessions();
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    await dbReactToMessage(messageId, emoji);
    setActiveReactionPickerId(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser || !activeChatPartnerId) return;
    if (!confirm('Hapus pesan ini?')) return;

    try {
      const res = await apiFetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        fetchChatHistory(activeChatPartnerId);
        setActiveReactionPickerId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleChatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert('Ukuran file maksimal adalah 25MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFile({
          url: reader.result as string,
          name: file.name,
          type: file.type
        });
        setShowImagePanel(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Build unified list of sessions (excluding groups)
  const getCombinedSessions = () => {
    const rawDb = Array.isArray(dbSessions) ? dbSessions : [];
    const result: any[] = [];
    rawDb.forEach(dbSess => {
      if (!dbSess) return;
      if (!dbSess.isGroup && !result.some(r => r.userId === dbSess.userId || (dbSess.username && r.username === dbSess.username))) {
        result.push({
          userId: dbSess.userId || '',
          username: dbSess.username || '',
          firstName: dbSess.firstName || '',
          lastName: dbSess.lastName || '',
          city: dbSess.city || 'Trading Member',
          country: dbSess.country || 'ID',
          avatar: dbSess.avatar || '',
          lastMessage: dbSess.lastMessage || 'Connected on Tarapti',
          lastMessageTime: dbSess.lastMessageTime || new Date().toISOString(),
          unreadCount: dbSess.unreadCount || 0,
          tradingExperience: dbSess.experience || 'Trader',
          isConnected: !!dbSess.isConnected,
          isGroup: !!dbSess.isGroup
        });
      }
    });

    return result;
  };

  const combinedSessions: any[] = getCombinedSessions();

  // Active Partner detail
  let activePartner: any = combinedSessions.find(s => s.userId === activeChatPartnerId);
  if (!activePartner && activeChatPartnerId) {
    const userFromAll = allUsers.find(u => u && (u.id === activeChatPartnerId || u.username === activeChatPartnerId));
    if (userFromAll) {
      activePartner = {
        userId: userFromAll.id || activeChatPartnerId,
        username: userFromAll.username || '',
        firstName: userFromAll.firstName || 'User',
        lastName: userFromAll.lastName || '',
        city: userFromAll.city || 'Trading Member',
        country: userFromAll.country || 'ID',
        avatar: userFromAll.avatar || userFromAll.firstName?.[0] || 'T',
        lastMessage: 'Percakapan baru',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        tradingExperience: 'Trader',
        isConnected: false,
        isGroup: false
      };
    } else {
      activePartner = {
        userId: activeChatPartnerId,
        username: '',
        firstName: 'Chat',
        lastName: '',
        city: 'Trading Member',
        country: 'ID',
        avatar: 'T',
        lastMessage: 'Percakapan baru',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        tradingExperience: 'Trader',
        isConnected: false,
        isGroup: false
      };
    }
  }

  // Filtered Sessions & Global User Search (Requirement 7)
  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    
    let list = combinedSessions.filter((s: any) => {
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const matchSearch = !query || 
        fullName.includes(query) || 
        (s.username && s.username.toLowerCase().includes(query)) ||
        (s.lastMessage && s.lastMessage.toLowerCase().includes(query)) ||
        (s.city && s.city.toLowerCase().includes(query));

      if (!matchSearch) return false;

      if (activeTab === 'chats') {
        return s.isConnected || s.isGroup || !!query;
      }
      if (activeTab === 'unread') {
        return (s.isConnected || s.isGroup) && s.unreadCount > 0;
      }
      if (activeTab === 'spam') {
        return !s.isConnected && !s.isGroup;
      }
      return true;
    });

    if (query) {
      const existingUserIds = new Set(list.map(s => s.userId));
      const additionalUsers = allUsers
        .filter(u => u.id !== currentUser?.id && !existingUserIds.has(u.id))
        .filter(u => {
          const fn = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
          return fn.includes(query) ||
            (u.username && u.username.toLowerCase().includes(query)) ||
            (u.city && u.city.toLowerCase().includes(query)) ||
            (u.tradingExperience && u.tradingExperience.toLowerCase().includes(query));
        })
        .map(u => ({
          userId: u.id,
          username: u.username || '',
          firstName: u.firstName || 'User',
          lastName: u.lastName || '',
          city: u.city || 'Trading Member',
          country: u.country || 'ID',
          avatar: u.avatar || u.firstName?.[0] || 'T',
          lastMessage: 'Profil User — Klik untuk kirim pesan / lihat profil',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          tradingExperience: u.tradingExperience || 'Trader',
          onlineStatus: u.onlineStatus,
          isOnline: u.onlineStatus === 'online',
          isConnected: false,
          isGroup: false,
          isSearchResult: true
        }));

      list = [...list, ...additionalUsers];
    }

    return list;
  }, [combinedSessions, search, activeTab, allUsers, currentUser]);

  const formatMessageDate = (isoString: string) => {
    return getFormattedMessageDate(isoString);
  };

  const formatTime = (isoString: string) => {
    return formatLocalTime(isoString, true);
  };

  if (!currentUser) return null;

  return (
    <div id="messages-view-fullscreen" className="bg-white flex flex-col flex-1 h-full w-full relative select-none max-w-lg mx-auto shadow-sm">
      
      {activeChatPartnerId === null ? (
        // LIST VIEW (Messenger Style matching Screenshot)
        <div className="flex flex-col h-full bg-white relative">
          
          {/* View Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setActiveView('feed');
                }}
                className="text-gray-700 hover:text-indigo-600 transition p-1.5 rounded-full cursor-pointer hover:bg-gray-100 flex items-center justify-center"
                title="Kembali ke Beranda"
                aria-label="Kembali ke Beranda"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-black text-slate-950 font-sans">
                Messages
              </h2>
            </div>
            <SponsoredBadge />
          </div>
          
          {/* Search Input Bar */}
          <div className="px-4 py-2.5 bg-white shrink-0">
            <div className="relative flex items-center bg-[#f0f2f5] rounded-full px-3.5 py-2">
              <Search className="text-gray-400 shrink-0 mr-2.5" size={18} />
              <input
                type="text"
                placeholder="Search messages or contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-[14px] text-gray-900 placeholder-gray-500 focus:outline-none p-0 font-normal"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 p-0.5">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Stories / Active Contacts Bar */}
          <div className="px-4 py-3 bg-white border-b border-gray-50 overflow-x-auto no-scrollbar shrink-0 flex items-center gap-4">
            
            {/* Buat Cerita Item */}
            <div 
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
              onClick={() => setShowStoryModal(true)}
            >
              <div className="relative mb-0.5">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center relative">
                  {isUrlAvatar(currentUser?.avatar) ? (
                    <img src={currentUser.avatar} alt={currentUser.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-gray-600 text-base">{currentUser.firstName?.[0] || 'U'}</span>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition" />
                </div>
                {/* Plus badge */}
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full p-[2px] shadow-sm flex items-center justify-center">
                  <div className="w-full h-full bg-gray-100 border border-gray-300 rounded-full flex items-center justify-center text-gray-900 font-bold">
                    <Plus size={12} strokeWidth={3} />
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-normal text-gray-600 text-center">Add story</span>
            </div>

            {/* Active Contact Avatars */}
            {activeContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => setActiveChatPartnerId(contact.id)}
                className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-100 bg-gray-100">
                    <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                  </div>
                  {contact.isOnline && (
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#31a24c] border-2 border-white rounded-full" />
                  )}
                </div>
                <span className="text-[11px] font-normal text-gray-700 text-center truncate max-w-[64px]">
                  {contact.name}
                </span>
              </button>
            ))}
          </div>

          {/* Filter Tabs (Chats, Unread, Spam) */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition ${
                activeTab === 'chats'
                  ? 'bg-[#e7f3ff] text-[#0064d1]'
                  : 'bg-[#f0f2f5] text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chats
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition ${
                activeTab === 'unread'
                  ? 'bg-[#e7f3ff] text-[#0064d1]'
                  : 'bg-[#f0f2f5] text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spam')}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition ${
                activeTab === 'spam'
                  ? 'bg-[#e7f3ff] text-[#0064d1]'
                  : 'bg-[#f0f2f5] text-gray-700 hover:bg-gray-200'
              }`}
            >
              Spam
            </button>
          </div>

          {/* Chat List Stream */}
          <div className="flex-1 overflow-y-auto pb-24 bg-white">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-xs font-medium px-6 leading-relaxed">
                No chat history found.<br />
                Click <span className="text-[#0084FF] font-bold">New message</span> to start a conversation.
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isUnread = s.unreadCount > 0 && activeChatPartnerId !== s.userId;
                const avatarUrl = isUrlAvatar(s.avatar) ? s.avatar : getAvatarUrl(s.userId, s.avatar);

                return (
                  <button
                    key={s.userId}
                    type="button"
                    onClick={() => {
                      setActiveChatPartnerId(s.userId);
                      markSessionAsRead(s.userId);
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition duration-150 hover:bg-gray-50/80 ${
                      isUnread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div 
                      className="relative shrink-0 cursor-pointer group/avatar"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (s.userId) viewUserProfile(s.userId);
                      }}
                      title="Lihat profil user"
                    >
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt={s.firstName} 
                          className="w-13 h-13 rounded-full object-cover border border-gray-100 group-hover/avatar:ring-2 group-hover/avatar:ring-indigo-500 transition"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs group-hover/avatar:ring-2 group-hover/avatar:ring-indigo-500 transition">
                          {s.avatar || s.firstName?.[0] || 'U'}
                        </div>
                      )}
                      {(s.onlineStatus === 'online' || s.isOnline) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Chat Text Info */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 min-w-0">
                          <h4 className={`text-[15px] truncate text-gray-900 ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                            {s.firstName} {s.lastName}
                          </h4>
                          {s.isVerified && (
                            <BadgeCheck size={15} className="text-blue-500 shrink-0 fill-current" />
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 font-normal shrink-0 ml-2">
                          {formatMessageDate(s.lastMessageTime)}
                        </span>
                      </div>

                      {/* Subtitle / Excerpt */}
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-[13px] truncate ${
                          isUnread ? 'text-gray-900 font-bold' : 'text-gray-500 font-normal'
                        }`}>
                          {s.lastMessage}
                        </p>
                        {s.replyBadge && (
                          <span className="text-xs shrink-0 ml-1.5">{s.replyBadge}</span>
                        )}
                        {isUnread && (
                          <span className="w-2.5 h-2.5 bg-[#0084FF] rounded-full shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Floating Action Button */}
          <button 
            type="button"
            onClick={() => setShowNewMessageModal(true)}
            className="fixed bottom-20 left-4 sm:bottom-8 sm:left-8 w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer p-0 border-none overflow-hidden"
            title="Tulis pesan baru"
          >
            <img 
              src="/chat_logo.png" 
              alt="Chat" 
              className="w-full h-full object-cover scale-110" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }} 
            />
            <div style={{ display: 'none' }} className="items-center justify-center w-full h-full bg-blue-600 text-white rounded-full">
              <SquarePen size={26} />
            </div>
          </button>

        </div>
      ) : (
        // DIRECT CHAT ROOM VIEW
        <div className="flex flex-col h-full bg-white relative">
          
          {/* Header 2: Chat Detail Row */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setActiveChatPartnerId(null);
                }}
                className="text-gray-700 hover:text-[#0084FF] active:bg-gray-100 transition p-1.5 rounded-full cursor-pointer flex items-center justify-center shrink-0"
                id="chat-detail-back-button"
                aria-label="Kembali ke daftar pesan"
              >
                <ArrowLeft size={22} />
              </button>
              
              <div 
                onClick={() => {
                  if (activePartner?.userId) viewUserProfile(activePartner.userId);
                }}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group hover:opacity-85 transition"
                title="Lihat Profil User"
              >
                <div className="relative shrink-0">
                  {isUrlAvatar(activePartner?.avatar) ? (
                    <img src={activePartner.avatar} alt={activePartner?.firstName || 'User'} className="w-9 h-9 rounded-full object-cover group-hover:ring-2 group-hover:ring-indigo-500 transition" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs group-hover:ring-2 group-hover:ring-indigo-500 transition">
                      {typeof activePartner?.avatar === 'string' && activePartner.avatar.length === 1 ? activePartner.avatar : (activePartner?.firstName?.[0] || 'T')}
                    </div>
                  )}
                  {(activePartner?.onlineStatus === 'online' || activePartner?.isOnline) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-gray-900 leading-tight truncate group-hover:text-indigo-600 transition">
                    {activePartner ? `${activePartner.firstName} ${activePartner.lastName}`.trim() : 'Chat'}
                  </h3>
                  <span className="text-[11px] text-gray-400 block font-normal">
                    {(activePartner?.onlineStatus === 'online' || activePartner?.isOnline) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                type="button" 
                onClick={() => {
                  const next = !showInChatSearch;
                  setShowInChatSearch(next);
                  if (!next) {
                    setInChatQuery('');
                    setCurrentMatchIndex(0);
                    setFilterOnlyMatches(false);
                  }
                }}
                className={`p-1.5 rounded-full transition cursor-pointer flex items-center justify-center ${
                  showInChatSearch 
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Cari dalam obrolan ini"
                aria-label="Cari dalam obrolan"
              >
                <Search size={19} />
              </button>
              <button type="button" className="text-gray-600 hover:text-gray-900 transition p-1.5 rounded-full hover:bg-gray-100 cursor-pointer">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Collapsible In-Chat Search Drawer */}
          <AnimatePresence>
            {showInChatSearch && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-50 dark:bg-slate-900/90 border-b border-gray-200/80 dark:border-gray-800 px-4 py-2.5 space-y-2 z-10 shrink-0 shadow-xs overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                    <input 
                      type="text"
                      value={inChatQuery}
                      onChange={(e) => {
                        setInChatQuery(e.target.value);
                        setCurrentMatchIndex(0);
                      }}
                      placeholder="Cari pesan, pasangan mata uang (XAUUSD, EURUSD), setup..."
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-full pl-9 pr-8 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      autoFocus
                    />
                    {inChatQuery && (
                      <button 
                        type="button"
                        onClick={() => {
                          setInChatQuery('');
                          setCurrentMatchIndex(0);
                        }}
                        className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full cursor-pointer"
                        title="Bersihkan pencarian"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {inChatQuery.trim() && matchingMessageIds.length > 0 && (
                    <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1 shadow-2xs">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 px-1">
                        {currentMatchIndex + 1}/{matchingMessageIds.length}
                      </span>
                      <button 
                        type="button"
                        onClick={handlePrevMatch}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition cursor-pointer"
                        title="Hasil sebelumnya"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={handleNextMatch}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition cursor-pointer"
                        title="Hasil berikutnya"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  )}

                  {inChatQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => setFilterOnlyMatches(!filterOnlyMatches)}
                      className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition shrink-0 cursor-pointer ${
                        filterOnlyMatches 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                      }`}
                      title="Filter pesan yang cocok saja"
                    >
                      <Filter size={12} />
                      {filterOnlyMatches ? 'Filtered' : 'Filter'}
                    </button>
                  )}
                </div>

                {/* Quick keyword suggestions */}
                {!inChatQuery && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0 mr-1">Cepat:</span>
                    {['📈 Signal', 'XAUUSD', 'EURUSD', 'Buy Limit', 'Sell Limit', 'Take Profit', 'Axi'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setInChatQuery(tag.replace('📈 ', ''));
                          setCurrentMatchIndex(0);
                        }}
                        className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-gray-700/80 rounded-full text-[10px] text-gray-600 dark:text-gray-300 hover:border-indigo-500 hover:text-indigo-600 font-semibold shrink-0 transition cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                {inChatQuery.trim() && matchingMessageIds.length === 0 && (
                  <div className="text-[11px] text-gray-400 font-medium pt-0.5 px-1">
                    Tidak ada pesan yang cocok dengan <span className="font-bold text-gray-600 dark:text-gray-300">"{inChatQuery}"</span>.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat history logs */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {activeHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs font-medium">
                Mulai percakapan dengan {activePartner?.firstName}...
              </div>
            ) : filterOnlyMatches && inChatQuery.trim() && matchingMessageIds.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs font-medium">
                Tidak ada pesan yang cocok dengan filter <span className="font-bold text-gray-600">"{inChatQuery}"</span>.
              </div>
            ) : (
              (filterOnlyMatches && inChatQuery.trim()
                ? activeHistory.filter((m: any) => matchingMessageIds.includes(m.id))
                : activeHistory
              ).map((m: any) => {
                const isSentByMe = m.senderId === currentUser.id;
                const isFocusedMatch = matchingMessageIds.length > 0 && matchingMessageIds[currentMatchIndex] === m.id;
                
                return (
                  <div key={m.id} id={`msg-${m.id}`} className={`flex gap-2.5 ${isSentByMe ? 'flex-row-reverse' : ''}`}>
                    <div 
                      className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'} max-w-[80%]`}
                      onTouchStart={() => handleTouchStart(m.id)}
                      onTouchMove={handleTouchEnd}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={() => handleTouchStart(m.id)}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={handleTouchEnd}
                    >
                      <div className={`px-3.5 py-2 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap transition-all duration-300 ${
                        isSentByMe 
                          ? 'bg-[#0084FF] text-white rounded-tr-xs' 
                          : 'bg-[#f0f2f5] text-gray-900 rounded-tl-xs'
                      } ${
                        isFocusedMatch ? 'ring-2 ring-amber-400 ring-offset-2 scale-[1.02] shadow-md' : ''
                      }`}>
                        {renderHighlightedText(m.content, inChatQuery, isSentByMe)}
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 px-1">
                        <span>{formatTime(m.timestamp)}</span>
                        {isSentByMe && (
                          <span className="flex items-center gap-0.5" title={m.read_at || m.readAt ? `Dibaca ${formatTime(m.read_at || m.readAt)}` : (m.isRead ? 'Dibaca' : 'Terkirim')}>
                            {m.read_at || m.readAt || m.isRead ? (
                              <CheckCheck size={13} className="text-[#0084FF] inline shrink-0" />
                            ) : (
                              <Check size={12} className="text-gray-400 inline shrink-0" />
                            )}
                          </span>
                        )}
                      </div>

                      {/* Reaction picker */}
                      {activeReactionPickerId === m.id && (
                        <div className="mt-1 p-1.5 bg-white border border-gray-200 rounded-xl flex items-center gap-1.5 shadow-lg z-30 animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex gap-1">
                            {['👍', '❤️', '🔥', '👏', '📈', '💯'].map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReact(m.id, emoji)}
                                className="text-base hover:scale-125 transition p-1 cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          {isSentByMe && (
                            <>
                              <div className="w-px h-6 bg-gray-200 mx-1" />
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(m.id)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Pesan"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Display existing reactions */}
                      {m.reactions && m.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(
                            m.reactions.reduce((acc: any, r: any) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([emoji, count]: [string, any]) => (
                            <span key={emoji} className="bg-gray-100 text-[10px] px-1.5 py-0.5 rounded-full">
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      )}

                      {m.image && (
                        <div 
                          onClick={() => setLightboxMedia({ url: m.image!, type: (m.image!.startsWith('data:video/') || m.image!.endsWith('.mp4')) ? 'video' : 'image' })}
                          className="mt-2 rounded-xl overflow-hidden border border-gray-100 max-w-xs shadow-xs cursor-pointer group/msgimg relative"
                        >
                          {m.image.startsWith('data:video/') || m.image.endsWith('.mp4') ? (
                            <video src={m.image} className="w-full h-auto block max-h-60 object-cover" />
                          ) : (
                            <img src={m.image} alt="Attachment" className="w-full h-auto block group-hover/msgimg:opacity-95 transition" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 shrink-0 flex items-center gap-2">
            
            <button
              type="button"
              onClick={() => { setShowImagePanel(!showImagePanel); setShowEmojiPicker(false); }}
              className="p-2 text-gray-500 hover:text-gray-900 transition rounded-full hover:bg-gray-100"
              title="Lampirkan file"
            >
              <Plus size={20} />
            </button>

            {attachedFile && (
              <div className="relative shrink-0">
                <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600 text-xs font-bold border border-blue-200">
                  DOC
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px]"
                >
                  <X size={8} />
                </button>
              </div>
            )}

            <input 
              type="file" 
              ref={chatFileInputRef} 
              className="hidden" 
              accept="image/*,video/*,application/pdf"
              onChange={handleChatFileUpload}
            />

            <div className="flex-1 bg-[#f0f2f5] rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="Tulis pesan..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-transparent border-none text-[14px] text-gray-900 placeholder-gray-500 focus:outline-none p-0"
              />
            </div>

            {!inputText.trim() && !attachedFile ? (
              <button
                type="button"
                className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition"
              >
                <Mic size={20} />
              </button>
            ) : (
              <button
                type="submit"
                className="bg-[#0084FF] text-white p-2 rounded-full hover:bg-blue-600 transition shadow-xs"
              >
                <Send size={16} />
              </button>
            )}
          </form>

        </div>
      )}

      {/* TULIS PESAN (NEW MESSAGE) MODAL */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg h-[85vh] sm:h-[600px] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <SquarePen className="text-[#0084FF]" size={20} />
                <h3 className="text-base font-bold text-gray-900">Pesan Baru</h3>
              </div>
              <button 
                type="button"
                onClick={() => { setShowNewMessageModal(false); setNewMessageSearch(''); }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search Input */}
            <div className="p-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="relative flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-2xs">
                <Search className="text-gray-400 mr-2 shrink-0" size={16} />
                <input
                  type="text"
                  placeholder="Ketik nama atau username..."
                  value={newMessageSearch}
                  onChange={(e) => setNewMessageSearch(e.target.value)}
                  className="w-full bg-transparent border-none text-xs text-gray-900 placeholder-gray-400 focus:outline-none p-0"
                  autoFocus
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-3 divide-y divide-gray-50">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12 gap-2 text-xs text-gray-400">
                  <Loader2 size={18} className="animate-spin text-[#0084FF]" />
                  <span>Memuat daftar anggota...</span>
                </div>
              ) : (
                (() => {
                  const combinedAll = [
                    ...allUsers.map(u => ({
                      userId: u.id,
                      username: u.username,
                      firstName: u.firstName,
                      lastName: u.lastName,
                      city: u.city || 'Member',
                      avatar: u.avatar || u.firstName?.[0]
                    }))
                  ];

                  // Deduplicate by userId
                  const uniqueUsers = combinedAll.filter((u, index, self) =>
                    index === self.findIndex(t => t.userId === u.userId) && u.userId !== currentUser.id
                  );

                  const filteredModalUsers = uniqueUsers.filter(u => {
                    const searchLower = newMessageSearch.toLowerCase();
                    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
                    return fullName.includes(searchLower) || u.username.toLowerCase().includes(searchLower);
                  });

                  if (filteredModalUsers.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-400 text-xs">
                        Tidak ada pengguna yang cocok dengan "{newMessageSearch}"
                      </div>
                    );
                  }

                  return filteredModalUsers.map((u) => {
                    const avatarUrl = isUrlAvatar(u.avatar) ? u.avatar : null;

                    return (
                      <div 
                        key={u.userId}
                        onClick={() => {
                          setActiveChatPartnerId(u.userId);
                          setShowNewMessageModal(false);
                          setNewMessageSearch('');
                        }}
                        className="py-2.5 px-3 flex items-center justify-between hover:bg-gray-50 rounded-xl transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={u.firstName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs border border-indigo-100">
                                {u.avatar && u.avatar.length <= 2 ? u.avatar : u.firstName?.[0]}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-[#0084FF] transition">
                              {u.firstName} {u.lastName}
                            </h4>
                            <p className="text-[11px] text-gray-400 truncate">
                              @{u.username} • {u.city}
                            </p>
                          </div>
                        </div>

                        <button 
                          type="button" 
                          className="text-[11px] font-bold text-[#0084FF] bg-blue-50 group-hover:bg-[#0084FF] group-hover:text-white px-3 py-1.5 rounded-full transition shrink-0"
                        >
                          Kirim Pesan
                        </button>
                      </div>
                    );
                  });
                })()
              )}
            </div>

          </div>
        </div>
      )}

      {/* STORY MODAL */}
      {showStoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg flex flex-col overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Buat Cerita</h3>
              <button 
                type="button"
                onClick={() => { setShowStoryModal(false); setStoryImage(null); }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center gap-4">
              <div 
                className="w-full aspect-[9/16] max-h-[60vh] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center relative overflow-hidden"
              >
                {storyImage ? (
                  <img src={storyImage} alt="Story Preview" className="w-full h-full object-cover" />
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer p-4 w-full h-full">
                    <Camera className="text-gray-400 mb-2" size={32} />
                    <span className="text-sm font-semibold text-gray-600">Pilih Foto/Video</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setStoryImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <button 
                disabled={!storyImage}
                onClick={() => {
                  if (storyImage) {
                    addStory(storyImage);
                    showToast('Cerita berhasil diunggah!');
                  }
                  setShowStoryModal(false);
                  setStoryImage(null);
                }}
                className="w-full bg-[#0084FF] text-white font-bold rounded-xl py-3 shadow-md hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bagikan Cerita
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Lightbox Modal (Original Media View with Zoom) */}
      <AnimatePresence>
        {lightboxMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-auto"
            onClick={() => setLightboxMedia(null)}
          >
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-[110]">
              <button
                type="button"
                onClick={() => setLightboxMedia(null)}
                className="p-3 bg-black/80 hover:bg-black text-white rounded-full shadow-2xl transition cursor-pointer border border-white/20 backdrop-blur-md flex items-center justify-center"
                title="Tutup"
              >
                <X size={22} />
              </button>
            </div>

            {/* Media Content - Original Aspect Ratio with Click-to-Zoom */}
            <div className="w-full h-full flex items-center justify-center relative z-10 p-2 overflow-auto">
              {lightboxMedia.type === 'video' ? (
                <video
                  src={lightboxMedia.url}
                  controls
                  autoPlay
                  playsInline
                  onClick={(e) => e.stopPropagation()}
                  className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-2xl shadow-2xl"
                />
              ) : (
                <img
                  src={lightboxMedia.url}
                  alt="Expanded view"
                  referrerPolicy="no-referrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const target = e.currentTarget;
                    if (target.style.transform === 'scale(1.5)') {
                      target.style.transform = 'scale(1)';
                      target.style.cursor = 'zoom-in';
                    } else {
                      target.style.transform = 'scale(1.5)';
                      target.style.cursor = 'zoom-out';
                    }
                  }}
                  style={{ transition: 'transform 0.3s ease', cursor: 'zoom-in' }}
                  className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-2xl shadow-2xl select-none"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
