import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext.tsx';
import { 
  ShieldCheck, RefreshCw, Radio, Server, Globe, Key, UserCheck, Trash2, 
  Search, Users, Newspaper, Send, CheckCircle, AlertTriangle, MessageSquare, 
  Sliders, Shield, Eye, Award, ExternalLink
} from 'lucide-react';
import { User, Post } from '../types.ts';
import { apiFetch } from '../utils/apiFetch';
import { parseUTCDate } from '../utils/dateUtils.ts';

export const AdminPortal: React.FC = () => {
  const { currentUser, showToast, fetchPosts, posts } = useApp();
  const [activeTab, setActiveTab] = useState<'integrations' | 'users' | 'posts' | 'broadcast'>('integrations');
  
  // States for API Settings
  const [mt5Server, setMt5Server] = useState('axi-live-server');
  const [mt5Login, setMt5Login] = useState('2091384');
  const [mt5Password, setMt5Password] = useState('••••••••••••');
  const [mt5Port, setMt5Port] = useState('443');
  const [mt5Status, setMt5Status] = useState<'connected' | 'disconnected' | 'testing'>('connected');
  
  const [newsProvider, setNewsProvider] = useState<'rss' | 'newsapi'>('rss');
  const [newsRssUrl, setNewsRssUrl] = useState('https://www.forexlive.com/rss');
  const [newsApiKey, setNewsApiKey] = useState('');
  const [syncedNews, setSyncedNews] = useState<any[]>([]);
  const [syncingNews, setSyncingNews] = useState(false);

  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [fcmServerKey, setFcmServerKey] = useState('');

  // States for User Management
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // States for Broadcast
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'market_pulse' | 'like' | 'follow' | 'comment'>('market_pulse');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Fetch users and settings on mount
  useEffect(() => {
    fetchAdminSettings();
    fetchUsers();
  }, []);

  const fetchAdminSettings = async () => {
    try {
      const res = await apiFetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setMt5Server(data.mt5Server || 'axi-live-server');
        setMt5Login(data.mt5Login || '2091384');
        setMt5Port(data.mt5Port || '443');
        setNewsProvider(data.newsProvider || 'rss');
        setNewsRssUrl(data.newsRssUrl || 'https://www.forexlive.com/rss');
        setNewsApiKey(data.newsApiKey || '');
        setTelegramBotToken(data.telegramBotToken || '');
        setTelegramChatId(data.telegramChatId || '');
        setFcmServerKey(data.fcmServerKey || '');
        setMt5Status(data.mt5Status || 'connected');
      }
    } catch (err) {
      console.error('Failed to load admin settings', err);
    }
  };

  const saveAdminSettings = async (silent = false) => {
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mt5Server,
          mt5Login,
          mt5Password,
          mt5Port,
          newsProvider,
          newsRssUrl,
          newsApiKey,
          telegramBotToken,
          telegramChatId,
          fcmServerKey,
          mt5Status
        })
      });
      if (res.ok && !silent) {
        showToast('Integration settings updated successfully!');
      }
    } catch (err) {
      showToast('Error saving integration settings.');
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiFetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      showToast('Error loading registered users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleTestMT5 = async () => {
    setMt5Status('testing');
    try {
      const res = await apiFetch('/api/admin/mt5/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mt5Server, mt5Login, mt5Password, mt5Port })
      });
      const data = await res.json();
      if (res.ok) {
        setMt5Status('connected');
        showToast(data.message || 'MetaTrader 5 connection verified!');
      } else {
        setMt5Status('disconnected');
        showToast(data.error || 'MT5 connection failure.');
      }
    } catch (err) {
      setMt5Status('disconnected');
      showToast('Connection error during MT5 validation.');
    }
  };

  const handleSyncNews = async () => {
    setSyncingNews(true);
    try {
      const res = await apiFetch('/api/admin/news/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsProvider, newsRssUrl, newsApiKey })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncedNews(data.articles || []);
        showToast(data.message || 'News feeds aggregated!');
        saveAdminSettings(true);
      } else {
        showToast('Error syncing news feed.');
      }
    } catch (err) {
      showToast('Error contacting News integration API.');
    } finally {
      setSyncingNews(false);
    }
  };

  const handleUpdateUser = async (userToUpdate: User) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userToUpdate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userToUpdate)
      });
      if (res.ok) {
        showToast(`User ${userToUpdate.username} updated successfully!`);
        setEditingUser(null);
        fetchUsers();
      } else {
        showToast('Failed to update user profile.');
      }
    } catch (err) {
      showToast('Error updating user.');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you absolutely sure you want to suspend/delete ${username}?`)) return;
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(`User ${username} suspended/removed.`);
        fetchUsers();
      } else {
        showToast('Failed to suspend user.');
      }
    } catch (err) {
      showToast('Error deleting user.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await apiFetch(`/api/posts/${postId}?userId=${currentUser?.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      if (res.ok) {
        showToast('Post moderated and removed.');
        fetchPosts(); // Refresh active feed posts
      } else {
        showToast('Failed to delete post.');
      }
    } catch (err) {
      showToast('Error moderating post.');
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      showToast('Broadcast message cannot be empty.');
      return;
    }
    setSendingBroadcast(true);
    try {
      const res = await apiFetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage, type: broadcastType })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Platform-wide broadcast completed!');
        setBroadcastMessage('');
      } else {
        showToast('Failed to deliver broadcast.');
      }
    } catch (err) {
      showToast('Error while dispatching broadcast.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Filtered list of users
  const filteredUsers = usersList.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div id="admin_portal_container" className="space-y-6">
      {/* Admin Panel Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-lg border border-slate-800">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="w-8 h-8 text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight">Tarapti System Administration</h1>
        </div>
        <p className="text-xs text-slate-300 font-sans max-w-lg">
          Configure systems integration API keys, control automated web scrapers, MetaTrader 5 live bridges, and manage traders accounts on the platform.
        </p>
      </div>

      {/* Administration Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'integrations' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>API Integrations</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'users' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users Manager</span>
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'posts' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Moderation</span>
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'broadcast' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Broadcast</span>
        </button>
      </div>

      {/* TAB CONTENT: API INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* MT5 Web Bridge Client Connection */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">MetaTrader 5 (MT5) Integration</h3>
                  <p className="text-[10px] text-slate-500">Sync broker server databases, trade orders history, and copy-trading parameters.</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 ${
                mt5Status === 'connected' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : mt5Status === 'testing' 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                  mt5Status === 'connected' ? 'bg-emerald-500' : mt5Status === 'testing' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                }`} />
                {mt5Status === 'connected' ? 'Bridges Live' : mt5Status === 'testing' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">MT5 Server Address</label>
                <input
                  type="text"
                  value={mt5Server}
                  onChange={(e) => setMt5Server(e.target.value)}
                  placeholder="e.g. axi-live-server"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">MT5 Login ID</label>
                <input
                  type="text"
                  value={mt5Login}
                  onChange={(e) => setMt5Login(e.target.value)}
                  placeholder="e.g. 2091384"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Gateway Port</label>
                <input
                  type="text"
                  value={mt5Port}
                  onChange={(e) => setMt5Port(e.target.value)}
                  placeholder="443"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Bridge Secret Password</label>
                <input
                  type="password"
                  value={mt5Password}
                  onChange={(e) => setMt5Password(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={handleTestMT5}
                disabled={mt5Status === 'testing'}
                className="flex-1 py-2 text-xs font-semibold bg-slate-950 text-white hover:bg-slate-900 rounded-lg shadow-sm flex items-center justify-center space-x-1 transition-all disabled:opacity-50"
              >
                {mt5Status === 'testing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Ping-testing Endpoint...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5" />
                    <span>Test MT5 Handshake</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => saveAdminSettings()}
                className="px-4 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200"
              >
                Save config
              </button>
            </div>
          </div>

          {/* Global News Aggregators Setup */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Trading News Aggregator Systems</h3>
                <p className="text-[10px] text-slate-500">Inject automated economic releases, headlines, and analysis feeds to Outlook module.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="flex items-center space-x-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    checked={newsProvider === 'rss'}
                    onChange={() => setNewsProvider('rss')}
                    className="accent-indigo-600"
                  />
                  <span>RSS Aggregator Scraper</span>
                </label>
                <label className="flex items-center space-x-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    checked={newsProvider === 'newsapi'}
                    onChange={() => setNewsProvider('newsapi')}
                    className="accent-indigo-600"
                  />
                  <span>NewsAPI JSON Bridge</span>
                </label>
              </div>

              {newsProvider === 'rss' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">RSS Feed URL</label>
                  <input
                    type="url"
                    value={newsRssUrl}
                    onChange={(e) => setNewsRssUrl(e.target.value)}
                    placeholder="https://www.forexlive.com/rss"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">NewsAPI Bearer Token</label>
                  <input
                    type="text"
                    value={newsApiKey}
                    onChange={(e) => setNewsApiKey(e.target.value)}
                    placeholder="Enter NewsAPI token key"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={handleSyncNews}
                disabled={syncingNews}
                className="flex-1 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {syncingNews ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing Target Feeds...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Sync & Pull News Articles</span>
                  </>
                )}
              </button>
            </div>

            {syncedNews.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 mt-2">
                <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Synced News Sample output</div>
                {syncedNews.map((art, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <span className="font-semibold text-slate-800 line-clamp-1 flex-1 pr-2">{art.title}</span>
                    <span className="text-[10px] text-indigo-600 whitespace-nowrap">{art.source} • {art.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social Alert gateways */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Social Notification Channels & Gateway</h3>
                <p className="text-[10px] text-slate-500">Deploy alerts immediately to Telegram Channels, FCM instances, and WhatsApp targets.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Telegram Bot Token</label>
                  <input
                    type="password"
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    placeholder="Token code (Optional)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Telegram Chat ID / Group</label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="@channel or chat_id"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Firebase FCM Cloud Server Key</label>
                <input
                  type="password"
                  value={fcmServerKey}
                  onChange={(e) => setFcmServerKey(e.target.value)}
                  placeholder="Key for FCM notification relays (Optional)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => saveAdminSettings()}
              className="w-full py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm transition-all"
            >
              Update API credentials
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USERS MANAGER */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Registered Traders List ({usersList.length})</span>
            </h3>
            <button 
              onClick={fetchUsers} 
              className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center space-x-1"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Reload list</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user by name, username or email..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-4">No users match your search criteria.</p>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="p-3 border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 rounded-xl flex items-center justify-between transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {user.avatar || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-950">{user.firstName} {user.lastName}</span>
                          <span className="text-[9px] text-slate-500">@{user.username}</span>
                          {user.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded-full text-[8px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">Admin</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">{user.email} • {user.city}, {user.country}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-semibold text-slate-700">{user.tradingExperience}</span>
                          <span className="text-[9px] text-indigo-600 font-bold">{user.reputationPoints} Rep Points</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="Edit User Profile Parameters"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      {currentUser?.id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                          title="Suspend / Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* User Edit Modal / Subpanel */}
          {editingUser && (
            <div className="border border-indigo-100 bg-indigo-50/45 p-4 rounded-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="text-xs font-bold text-slate-900">Modify @{editingUser.username}'s Status</span>
                <button onClick={() => setEditingUser(null)} className="text-[10px] text-slate-500 hover:underline">Cancel</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Reputation Points</label>
                  <input
                    type="number"
                    value={editingUser.reputationPoints}
                    onChange={(e) => setEditingUser({ ...editingUser, reputationPoints: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Account Role</label>
                  <select
                    value={editingUser.role || 'user'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="user">Standard Trader Account</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Trading Level</label>
                  <select
                    value={editingUser.tradingExperience}
                    onChange={(e) => setEditingUser({ ...editingUser, tradingExperience: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Pro Trader">Pro Trader</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Preferred Asset</label>
                  <select
                    value={editingUser.tradingAsset}
                    onChange={(e) => setEditingUser({ ...editingUser, tradingAsset: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Forex">Forex</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Stocks">Stocks</option>
                    <option value="Indices">Indices</option>
                    <option value="Commodities">Commodities</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUpdateUser(editingUser)}
                className="w-full py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
              >
                Apply Profile Changes
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: POSTS MODERATION */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Platform Feed Moderation</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-bold">{posts.length} Active Posts</span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {posts.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-4">No community posts detected.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="p-3 border border-slate-100 rounded-xl space-y-2 hover:bg-slate-50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                        {post.authorAvatar || 'P'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-950 block">{post.authorName}</span>
                        <span className="text-[9px] text-slate-500">@{post.authorUsername} • {parseUTCDate(post.timestamp).toLocaleDateString(navigator.language || 'id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).replace(/\s*(AM|PM|am|pm)/gi, '')}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-all flex items-center space-x-1"
                      title="Delete / Moderate Post"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="text-[10px] font-bold">Remove</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-800 line-clamp-3 bg-white p-2 rounded-lg border border-slate-100 font-sans">
                    {post.content}
                  </p>
                  
                  {post.images && post.images.length > 0 && (
                    <div className="text-[9px] font-bold text-indigo-600">
                      📎 Contains {post.images.length} attachment image(s)
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: BROADCAST ANNOUNCEMENTS */}
      {activeTab === 'broadcast' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Broadcast Announcement</h3>
              <p className="text-[10px] text-slate-500">Deliver high-priority system announcements directly to all traders' notification center.</p>
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Alert Type Category</label>
              <select
                value={broadcastType}
                onChange={(e) => setBroadcastType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="market_pulse">Market Pulse Volatility Alerts</option>
                <option value="like">System Updates / Releases</option>
                <option value="follow">Admin Urgent Announcements</option>
                <option value="comment">Risk Management Reminders</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Announcement Message</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter important alert details here. E.g. 'ATTENTION: High Volatility expected at 01:30 PM UTC due to FOMC Interest Rate Statement! Please manage risk!'"
                rows={4}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={sendingBroadcast}
              className="w-full py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
            >
              {sendingBroadcast ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching to users database...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast System Alert</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
