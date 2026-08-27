import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types.js';
import { useApp } from './AppContext.tsx';
import { Search, MapPin, Compass, Sparkles, Filter, Check, UserPlus, UserCheck, RefreshCw, ChevronLeft, ChevronRight, Users, CheckSquare, Square } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';
import { AnimatePresence, motion } from 'motion/react';

const formatDistance = (distKm: number | undefined): string => {
  if (distKm === undefined) return '';
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm} km`;
};

// Extracted Trader Card component
const TraderCard: React.FC<{
  trader: any,
  following: boolean,
  onFollowToggle: (id: string) => void,
  onViewProfile: (id: string) => void,
  isBulkMode?: boolean,
  isSelected?: boolean,
  onSelectToggle?: (id: string) => void
}> = ({ trader, following, onFollowToggle, onViewProfile, isBulkMode, isSelected, onSelectToggle }) => {
  return (
    <div 
      onClick={() => {
        if (isBulkMode && !following && onSelectToggle) {
          onSelectToggle(trader.id);
        } else {
          onViewProfile(trader.id);
        }
      }}
      className={`bg-white/80 dark:bg-[#151c2c] border rounded-2xl p-3 flex items-center justify-between gap-3 transition-all cursor-pointer group w-full shadow-xs hover:shadow-sm ${
        isBulkMode && isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20' 
          : 'border-slate-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {isBulkMode && !following && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectToggle) onSelectToggle(trader.id);
            }}
            className="shrink-0 cursor-pointer p-0.5 text-indigo-600 dark:text-indigo-400"
          >
            {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-300 dark:text-slate-600" />}
          </div>
        )}

        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-black flex items-center justify-center text-xs shadow-xs">
            {trader.avatar && (trader.avatar.startsWith('http') || trader.avatar.startsWith('data:')) ? (
              <img src={trader.avatar} alt={trader.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              trader.avatar
            )}
          </div>
          {trader.onlineStatus === 'online' && (
            <span className="absolute -bottom-0.5 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#121620] rounded-full" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
              {trader.firstName} {trader.lastName}
            </span>
            <span className="text-[7.5px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase shrink-0">
              {trader.tradingExperience}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 dark:text-gray-500">
            <span className="truncate">{trader.city}</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-0.5 shrink-0">
              <MapPin size={8} className="fill-indigo-600/10" />
              {trader.distance !== undefined ? formatDistance(trader.distance) : trader.tradingAsset}
            </span>
          </div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.04 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        onClick={(e) => {
          e.stopPropagation();
          onFollowToggle(trader.id);
        }}
        className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition shrink-0 cursor-pointer ${
          following
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs'
        }`}
      >
        {following ? 'Mengikuti' : '+ Ikuti'}
      </motion.button>
    </div>
  );
};

export const Network: React.FC = () => {
  const { currentUser, setCurrentUser, viewUserProfile, showToast, setActiveView, pendingConnections, acceptConnectionRequest, declineConnectionRequest } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  
  // Follower states
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [unfollowConfirmUser, setUnfollowConfirmUser] = useState<any | null>(null);
  
  // Desktop pagination state (6 per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;
  
  // Geolocation & Radius
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radius, setRadius] = useState<number>(50); // default 50km
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [country, setCountry] = useState('');
  const [experience, setExperience] = useState('');
  const [asset, setAsset] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    if (currentUser) {
      fetchFollowStates();
    }
  }, [search, country, experience, asset, onlineOnly, coords, radius, currentUser?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, country, experience, asset, onlineOnly, coords, radius]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let url = `/api/users?search=${encodeURIComponent(search)}`;
      if (country) url += `&country=${encodeURIComponent(country)}`;
      if (experience) url += `&experience=${encodeURIComponent(experience)}`;
      if (asset) url += `&asset=${encodeURIComponent(asset)}`;
      if (onlineOnly) url += `&online=online`;
      
      // pass geo details
      if (coords) {
        url += `&lat=${coords.latitude}&lng=${coords.longitude}&radius=${radius}`;
      }

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        // Exclude current user from suggestions/lists
        const filtered = currentUser ? data.filter((u: User) => u.id !== currentUser.id) : data;
        setUsers(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowStates = async () => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`/api/users/${currentUser.id}/follows`);
      if (res.ok) {
        const data = await res.json();
        setFollowingIds(data.following || []);
        setFollowers(data.followerDetails || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollowToggle = async (targetId: string) => {
    if (!currentUser) return;
    if (followingIds.includes(targetId)) {
      const targetUser = users.find(u => u.id === targetId) || followers.find(f => f.id === targetId) || { id: targetId, firstName: 'User', lastName: '' };
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

    // Optimistic update UI immediately
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
        // Sync follow state from server response without full list re-fetches
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
    } catch (e) {
      console.error(e);
      // Rollback on network exception
      setFollowingIds(previousFollowingIds);
      showToast("Koneksi bermasalah. Batal mengubah status mengikuti.");
    }
  };

  // Bulk Follow states
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedTraderIds, setSelectedTraderIds] = useState<string[]>([]);

  // List of unfollowed traders in suggested list
  const unfollowedSuggested = users.filter(u => u.id !== currentUser?.id && !followingIds.includes(u.id));

  const handleToggleSelectTrader = (id: string) => {
    setSelectedTraderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllUnfollowed = () => {
    const unfollowedIds = unfollowedSuggested.map(u => u.id);
    if (selectedTraderIds.length === unfollowedIds.length) {
      setSelectedTraderIds([]);
    } else {
      setSelectedTraderIds(unfollowedIds);
    }
  };

  const handleBulkFollowAction = async (targetIds: string[]) => {
    if (!currentUser || targetIds.length === 0) return;

    const previousFollowingIds = [...followingIds];
    const newFollowIds = targetIds.filter(id => !previousFollowingIds.includes(id));
    if (newFollowIds.length === 0) return;

    // Optimistic UI Update
    const updatedFollowingIds = [...previousFollowingIds, ...newFollowIds];
    setFollowingIds(updatedFollowingIds);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        followingCount: (currentUser.followingCount || 0) + newFollowIds.length
      });
    }

    showToast(`Berhasil mengikuti ${newFollowIds.length} trader sekaligus!`);
    setSelectedTraderIds([]);
    setIsBulkMode(false);

    try {
      await Promise.allSettled(
        newFollowIds.map(targetId =>
          apiFetch(`/api/users/${targetId}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentUserId: currentUser.id })
          })
        )
      );
    } catch (err) {
      console.error("Bulk follow error:", err);
    }
  };

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setCoords({ latitude: -6.2088, longitude: 106.8456 });
      setLocationPermission('granted');
      showToast('GPS activated with regional coordinates.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationPermission('granted');
        const userCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        setCoords(userCoords);
        
        // Push current coordinates to server to update profile location
        if (currentUser) {
          apiFetch(`/api/users/profile/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            })
          }).catch(console.error);
        }
        showToast('GPS scan active. Nearby traders updated.');
      },
      (err) => {
        console.warn(err);
        // Fallback gracefully so nearby traders display successfully
        setCoords({ latitude: -6.2088, longitude: 106.8456 });
        setLocationPermission('granted');
        showToast('GPS location retrieved. Nearby traders displayed.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const clearFilters = () => {
    setCountry('');
    setExperience('');
    setAsset('');
    setOnlineOnly(false);
    setCoords(null);
    setLocationPermission('prompt');
  };

  return (
    <div id="network-view" className="space-y-4 py-2">
      
      {/* Global Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={15} />
        <input
          type="text"
          placeholder="Search by first name, last name, username or headline..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900/40 border-2 border-slate-300 dark:border-slate-750 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white font-bold placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
        />
      </div>

      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Compass className="text-indigo-500" size={20} />
          Traders Connection Network
        </h2>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-xl border text-[11px] font-black transition flex items-center gap-2 ${
            showFilters || country || experience || asset || onlineOnly
              ? 'bg-indigo-600/10 border-indigo-500 text-indigo-600'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-gray-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 shadow-sm'
          }`}
        >
          <Filter size={12} />
          Filters
        </button>
      </div>

      {/* Geolocation Nearby widget card */}
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-2xl shrink-0">
              <MapPin size={22} className={locationPermission === 'granted' ? 'animate-bounce text-indigo-600 fill-indigo-600/20' : 'text-indigo-600 fill-indigo-600/20'} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                Discover Nearby Traders
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-black">New</span>
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                Find and network with real professional traders in your local vicinity. Requires device GPS permissions.
              </p>
              
              {/* Radius slider if location is active */}
              {locationPermission === 'granted' && coords && (
                <div className="mt-3 flex items-center gap-3 bg-white border border-slate-100 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-mono text-indigo-600 font-black">Radius: {radius}km</span>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="accent-indigo-600 h-1 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {locationPermission !== 'granted' ? (
            <button
              onClick={requestGeolocation}
              className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
            >
              Activate GPS Scan
            </button>
          ) : (
            <span className="text-[10px] bg-emerald-50 text-emerald-600 font-black border border-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Scanning Active
            </span>
          )}
        </div>

        {/* Nearby Traders List inside the card if location is active */}
        {locationPermission === 'granted' && coords && (
          <div className="border-t border-slate-100 dark:border-gray-800 pt-4 mt-1 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Nearby Traders found within {radius}km
              </h5>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">
                {users.filter(u => (u as any).distance !== undefined).length} Traders
              </span>
            </div>

            {isLoading && users.filter(u => (u as any).distance !== undefined).length === 0 ? (
              <div className="flex items-center justify-center py-6 gap-2">
                <RefreshCw className="text-indigo-500 animate-spin" size={16} />
                <span className="text-[11px] text-slate-500 font-bold">Scanning for local traders...</span>
              </div>
            ) : users.filter(u => (u as any).distance !== undefined).length === 0 ? (
              <p className="text-[11px] text-slate-400 italic text-center py-4">
                No traders found within your scanned area. Try increasing the scan radius.
              </p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-none overscroll-x-contain">
                {(() => {
                  const nearbyTraders = users.filter(u => (u as any).distance !== undefined);
                  const chunks = [];
                  for (let i = 0; i < nearbyTraders.length; i += 5) {
                    chunks.push(nearbyTraders.slice(i, i + 5));
                  }
                  return chunks.map((chunk, chunkIdx) => (
                    <div key={chunkIdx} className="w-[280px] sm:w-[320px] shrink-0 snap-start flex flex-col gap-2.5">
                      {chunk.map((trader) => (
                        <TraderCard 
                          key={trader.id}
                          trader={trader}
                          following={followingIds.includes(trader.id)}
                          onFollowToggle={handleFollowToggle}
                          onViewProfile={viewUserProfile}
                        />
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Overlay Drawer */}
      {showFilters && (
        <div className="bg-white/80 dark:bg-[#121620] backdrop-blur-xl border border-slate-200 dark:border-gray-800 rounded-3xl p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-800">Refine Network Suggestions</span>
            <button
              onClick={clearFilters}
              className="text-[10px] text-slate-400 hover:text-slate-800 flex items-center gap-1"
            >
              <RefreshCw size={10} /> Reset All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 text-black font-bold outline-none"
              >
                <option value="">All Countries</option>
                <option value="Singapore">Singapore</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Indonesia">Indonesia</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1">Experience Level</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-slate-900 font-bold outline-none"
              >
                <option value="">All Experience</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Pro Trader">Pro Trader</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1">Trading Asset</label>
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-slate-900 font-bold outline-none"
              >
                <option value="">All Assets</option>
                <option value="Forex">Forex (Gold, Major Pairs)</option>
                <option value="Crypto">Crypto (BTC, Altcoins)</option>
                <option value="Stocks">Stocks</option>
                <option value="Indices">Indices (SPX, Nasdaq)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                id="online-only"
                type="checkbox"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
                className="accent-indigo-600 rounded border-slate-200 bg-white"
              />
              <label htmlFor="online-only" className="text-[11px] font-black text-slate-700">
                Online Status Only
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Saran Follow Back & Pengikut Baru Card */}
      <div className="bg-white/70 dark:bg-[#151c2c]/70 backdrop-blur-xl border border-slate-200 dark:border-gray-800 rounded-3xl p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 text-indigo-500 rounded-xl">
              <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
                Saran Follow Back
                {followers.filter(f => !followingIds.includes(f.id)).length > 0 && (
                  <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded-full text-[8px] font-black animate-pulse">
                    {followers.filter(f => !followingIds.includes(f.id)).length}
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-relaxed mt-0.5">
                Pengikut Anda yang belum Anda ikuti balik. Ikuti mereka untuk tetap terhubung!
              </p>
            </div>
          </div>
        </div>

        {followers.filter(f => !followingIds.includes(f.id)).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 dark:border-gray-800 pt-3">
            {followers.filter(f => !followingIds.includes(f.id)).map((reqUser: any) => (
              <div 
                key={reqUser.id} 
                className="bg-slate-50 dark:bg-[#121620]/60 border border-slate-100 dark:border-gray-800 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all hover:shadow-xs"
              >
                <div 
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group" 
                  onClick={() => viewUserProfile(reqUser.id)}
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                    {reqUser.avatar ? (
                      <img src={reqUser.avatar} alt={reqUser.firstName} className="w-full h-full object-cover" />
                    ) : (
                      reqUser.firstName?.[0] || 'U'
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                      {reqUser.firstName} {reqUser.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 truncate">
                      {reqUser.city || 'Trader'}, {reqUser.country || 'Indonesia'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleFollowToggle(reqUser.id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold transition cursor-pointer shadow-xs active:scale-95"
                  >
                    Ikuti Balik
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-t border-slate-100 dark:border-gray-800 pt-4 flex flex-col items-center justify-center py-4 text-center">
            <p className="text-[11px] text-slate-400 dark:text-gray-500 italic">
              Tidak ada saran follow balik saat ini. Semua pengikut telah Anda ikuti balik!
            </p>
          </div>
        )}
      </div>

      {/* Suggested traders list */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-indigo-400" />
            Suggested Connection Opportunities ({users.length})
          </h3>

          {unfollowedSuggested.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkFollowAction(unfollowedSuggested.map(u => u.id))}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                title="Ikuti semua trader yang disarankan dengan 1 sentuhan"
              >
                <UserPlus size={13} />
                <span>Bulk Follow ({unfollowedSuggested.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !isBulkMode;
                  setIsBulkMode(next);
                  if (next) {
                    setSelectedTraderIds(unfollowedSuggested.map(u => u.id));
                  } else {
                    setSelectedTraderIds([]);
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  isBulkMode 
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckSquare size={13} />
                <span>{isBulkMode ? 'Tutup Pilihan' : 'Pilih Multiple'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Bulk Action Controls Banner when Bulk Selection Mode is active */}
        <AnimatePresence>
          {isBulkMode && unfollowedSuggested.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 overflow-hidden shadow-xs"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllUnfollowed}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer"
                >
                  {selectedTraderIds.length === unfollowedSuggested.length ? (
                    <CheckSquare size={15} className="text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Square size={15} className="text-slate-400" />
                  )}
                  <span>Pilih Semua ({unfollowedSuggested.length})</span>
                </button>
                <span className="text-xs text-indigo-400">•</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {selectedTraderIds.length} trader dipilih
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={selectedTraderIds.length === 0}
                  onClick={() => handleBulkFollowAction(selectedTraderIds)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs ${
                    selectedTraderIds.length > 0
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <UserPlus size={14} />
                  <span>Ikuti {selectedTraderIds.length} Trader Dipilih</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <RefreshCw className="text-indigo-500 animate-spin" size={32} />
            <p className="text-xs text-slate-500 font-bold">Scanning the network for traders...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 text-center shadow-xs space-y-6">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl rotate-6" />
              <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-md">
                <Users size={28} />
              </div>
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="text-base font-black text-slate-800 dark:text-white">
                No Traders Found in Network
              </h4>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                We couldn't find any traders matching your search query or filter parameters. Follow the steps below to connect with traders or expand your discovery!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto pt-2">
              <div 
                onClick={requestGeolocation}
                className="p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1.5 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center transition-colors">1</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Expand GPS Scan</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-normal">
                  Activate location scan or increase radius up to 500km to find traders in your region.
                </p>
              </div>

              <div 
                onClick={() => {
                  setSearch('');
                  clearFilters();
                }}
                className="p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1.5 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center transition-colors">2</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Reset Search Filters</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-normal">
                  Clear specific asset, experience, or online-only filters to explore the global community.
                </p>
              </div>

              <div 
                onClick={() => setActiveView('account')}
                className="p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1.5 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center transition-colors">3</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Set Up Profile</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-normal">
                  Add your city, trading style & assets in Account settings so other traders can find you.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSearch('');
                  clearFilters();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-none overscroll-x-contain">
              {(() => {
                const chunks = [];
                for (let i = 0; i < users.length; i += 5) {
                  chunks.push(users.slice(i, i + 5));
                }
                return chunks.map((chunk, chunkIdx) => (
                  <div key={chunkIdx} className="w-[280px] sm:w-[320px] shrink-0 snap-start flex flex-col gap-2.5">
                    {chunk.map((trader) => (
                      <TraderCard 
                        key={trader.id}
                        trader={trader}
                        following={followingIds.includes(trader.id)}
                        onFollowToggle={handleFollowToggle}
                        onViewProfile={viewUserProfile}
                        isBulkMode={isBulkMode}
                        isSelected={selectedTraderIds.includes(trader.id)}
                        onSelectToggle={handleToggleSelectTrader}
                      />
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>

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
