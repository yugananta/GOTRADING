import { useTranslation } from 'react-i18next';
import React, { useState, memo, useMemo } from 'react';
import { Plus, X, Trash2, Eye, ChevronUp } from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { StoryCreation } from './StoryCreation.tsx';
import { Story } from '../types.js';
import { apiFetch } from '../utils/apiFetch';

function formatViewedTime(isoString?: string): string {
  if (!isoString) return 'Baru saja';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hr lalu`;
}

const StoriesListComponent: React.FC = () => {
  const { currentUser, stories, addStory, fetchStories, recordStoryView, showToast } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [showViewersModal, setShowViewersModal] = useState(false);

  const handleOpenStory = (story: Story) => {
    setViewingStory(story);
    recordStoryView(story.id);
  };

  const handleCreatePost = (imgUrl: string) => {
    addStory(imgUrl);
  };

  const handleDeleteStory = async (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (!confirm('Hapus cerita ini?')) return;

    try {
      const res = await apiFetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        showToast('Cerita dihapus');
        if (viewingStory?.id === storyId) {
          setViewingStory(null);
          setShowViewersModal(false);
        }
        fetchStories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getUniqueStories = (storyList: Story[]) => {
    if (!Array.isArray(storyList)) return [];
    const latestByUser: Record<string, Story> = {};
    storyList.forEach(s => {
      if (!s.userId) return;
      if (!latestByUser[s.userId] || new Date(s.timestamp).getTime() > new Date(latestByUser[s.userId].timestamp).getTime()) {
        latestByUser[s.userId] = s;
      }
    });
    return Object.values(latestByUser).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const uniqueOtherStories = useMemo(() => getUniqueStories(stories.filter(s => s.userId !== currentUser?.id)), [stories, currentUser?.id]);
  const userLatestStory = useMemo(() => stories.filter(s => s.userId === currentUser?.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0], [stories, currentUser?.id]);

  const activeStoryObj = stories.find(s => s.id === viewingStory?.id) || viewingStory;
  const currentViewers = activeStoryObj?.viewers || [];

  const isVideo = (url: string) => {
    if (!url) return false;
    return url.includes('video/') || url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.startsWith('data:video/');
  };

  return (
    <div className="bg-white dark:bg-[#121620] border-b border-slate-200 dark:border-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] py-3 sm:py-4 mb-2 lg:mb-4 lg:rounded-2xl lg:border">
      <div className="flex gap-4 overflow-x-auto snap-x overscroll-x-contain no-swipe px-3 sm:px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Create Story Button */}
        {!userLatestStory && (
          <div className="shrink-0 snap-start flex flex-col items-center gap-1.5">
            <div className="relative">
              <button 
                onClick={() => setIsCreating(true)}
                className="w-[72px] h-[72px] rounded-full border border-slate-200 dark:border-gray-700 p-[3px] bg-white dark:bg-[#121620] cursor-pointer"
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="You" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-xl font-bold text-slate-400">{currentUser?.firstName?.[0] || 'U'}</span>
                  )}
                </div>
              </button>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full border-2 border-white dark:border-[#121620] flex items-center justify-center text-white">
                <Plus size={14} strokeWidth={3} />
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-gray-400">{t('feed.yourStory')}</span>
          </div>
        )}

        {/* User's own active story (if any) */}
        {userLatestStory && (
          <div 
            onClick={() => handleOpenStory(userLatestStory)}
            className="shrink-0 snap-start flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-full border-2 border-white dark:border-[#121620] overflow-hidden bg-white dark:bg-gray-900">
                {isVideo(userLatestStory.imageUrl) ? (
                  <video src={userLatestStory.imageUrl} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={userLatestStory.imageUrl} alt="You" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                )}
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-gray-400">{t('feed.yourStory')}</span>
          </div>
        )}

        {/* Other Users' Stories */}
        {uniqueOtherStories.map(story => (
          <div 
            key={story.id} 
            onClick={() => handleOpenStory(story)}
            className="shrink-0 snap-start flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className={`w-[72px] h-[72px] rounded-full p-[3px] transition-transform group-hover:scale-105 ${story.viewed ? 'bg-slate-200 dark:bg-gray-700' : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600'}`}>
              <div className="w-full h-full rounded-full border-2 border-white dark:border-[#121620] overflow-hidden bg-white dark:bg-gray-900">
                {isVideo(story.imageUrl) ? (
                  <video src={story.imageUrl} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={story.imageUrl} alt={story.user?.firstName} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                )}
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-700 dark:text-gray-300 truncate max-w-[74px] text-center">
              {story.user?.firstName}
            </span>
          </div>
        ))}
      </div>

      {isCreating && (
        <StoryCreation onClose={() => setIsCreating(false)} onPost={handleCreatePost} />
      )}

      {/* Story Viewer Modal (Full Screen) */}
      {viewingStory && (
        <div 
          className="fixed inset-0 bg-[#111] z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-200"
          onClick={() => {
            setViewingStory(null);
            setShowViewersModal(false);
          }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pt-6 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border border-white/50 overflow-hidden bg-slate-800">
                 {viewingStory?.user?.avatar ? (
                    <img src={viewingStory.user.avatar} alt={viewingStory.user.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                      {viewingStory?.user?.firstName?.[0] || 'U'}
                    </div>
                  )}
              </div>
              <div className="flex flex-col shadow-sm">
                <span className="text-white font-semibold text-sm drop-shadow-md">
                  {viewingStory?.user ? `${viewingStory.user.firstName} ${viewingStory.user.lastName || ''}` : 'Pengguna'}
                </span>
                <span className="text-white/80 text-[11px] drop-shadow-md">
                  {viewingStory?.timestamp ? formatViewedTime(viewingStory.timestamp as string) : 'Baru saja'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {viewingStory.userId === currentUser?.id && (
                <button 
                  className="w-10 h-10 rounded-full text-rose-500 flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
                  onClick={(e) => handleDeleteStory(e, viewingStory.id)}
                  title="Hapus Cerita"
                >
                   <Trash2 size={20} />
                </button>
              )}
              
              <button 
                className="w-10 h-10 rounded-full text-white flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingStory(null);
                  setShowViewersModal(false);
                }}
              >
                 <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Story Content */}
          <div className="flex-1 w-full h-full flex items-center justify-center relative">
            {isVideo(viewingStory.imageUrl) ? (
              <video 
                src={viewingStory.imageUrl} 
                className="w-full h-full object-contain bg-black"
                autoPlay
                playsInline
                muted
                controls={true}
                loop
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img 
                src={viewingStory.imageUrl} 
                alt="Story" 
                className="w-full h-full object-contain bg-black"
                onClick={(e) => e.stopPropagation()}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=800&q=80';
                }}
              />
            )}

            {/* Viewers Trigger Button at bottom */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center justify-center px-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewersModal(true);
                }}
                className="flex items-center gap-2 bg-black/60 hover:bg-black/80 active:scale-95 backdrop-blur-md text-white px-4 py-2.5 rounded-full border border-white/20 transition shadow-xl cursor-pointer"
              >
                <Eye size={18} className="text-blue-400" />
                <span className="text-xs font-semibold">
                  {currentViewers.length > 0 
                    ? `Dilihat oleh ${currentViewers.length} orang` 
                    : 'Belum ada penonton'}
                </span>
                <ChevronUp size={16} className="text-white/70 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Viewers Sheet/Modal */}
          {showViewersModal && (
            <div 
              className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setShowViewersModal(false);
              }}
            >
              <div 
                className="w-full sm:max-w-md bg-white dark:bg-[#181e2a] rounded-t-2xl sm:rounded-2xl max-h-[75vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-gray-800 animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Eye size={18} className="text-blue-500" />
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">
                      Penonton Cerita ({currentViewers.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowViewersModal(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-400 transition cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Viewers List */}
                <div className="p-3 overflow-y-auto max-h-[50vh] divide-y divide-slate-100 dark:divide-gray-800/60">
                  {currentViewers.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-400 dark:text-gray-500">
                        <Eye size={24} />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">
                        Belum ada yang melihat cerita ini
                      </p>
                    </div>
                  ) : (
                    currentViewers.map((viewer, idx) => (
                      <div key={viewer.userId || idx} className="flex items-center justify-between py-2.5 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-gray-700 overflow-hidden bg-slate-100 dark:bg-gray-800 shrink-0">
                            {viewer.user?.avatar ? (
                              <img src={viewer.user.avatar} alt={viewer.user.firstName || 'User'} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                {viewer.user?.firstName?.[0] || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-slate-800 dark:text-white leading-tight">
                              {viewer.user ? `${viewer.user.firstName} ${viewer.user.lastName || ''}`.trim() : 'Pengguna'}
                            </span>
                            {viewer.user?.username && (
                              <span className="text-xs text-slate-400 dark:text-gray-500">
                                @{viewer.user.username}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                            {formatViewedTime(viewer.viewedAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const StoriesList = memo(StoriesListComponent);
  const { t } = useTranslation();
