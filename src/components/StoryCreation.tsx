import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Camera, X, Image as ImageIcon, Send } from 'lucide-react';
import { useApp } from './AppContext.tsx';

interface StoryCreationProps {
  onClose: () => void;
  onPost: (imageUrl: string) => void;
}

export const StoryCreation: React.FC<StoryCreationProps> = ({ onClose, onPost }) => {
  const { t } = useTranslation();
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const { currentUser } = useApp();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStoryImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (storyImage) {
      onPost(storyImage);
      onClose();
    }
  };

  const isVideo = (url: string) => {
    if (!url) return false;
    return url.includes('video/') || url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pt-safe">
        <button 
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition"
        >
          <X size={24} />
        </button>
        <span className="text-white font-bold text-sm shadow-sm">Buat cerita</span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full flex flex-col bg-[#111]">
        {storyImage ? (
          <div className="relative flex-1 flex items-center justify-center">
            {isVideo(storyImage) ? (
              <video 
                src={storyImage} 
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                controls={false}
                loop
              />
            ) : (
              <img src={storyImage} alt="Story Preview" className="w-full h-full object-contain" />
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center mb-6">
              <Camera size={36} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Bagikan Momen Anda</h3>
            <p className="text-sm text-gray-400 mb-8 max-w-xs">Pilih foto atau video untuk dibagikan dengan teman-teman Anda.</p>
            
            <label className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-md cursor-pointer transition flex items-center gap-2">
              <ImageIcon size={20} />
              Pilih dari Galeri
              <input 
                type="file" 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}
      </div>

      {/* Footer / Send Button */}
      {storyImage && (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-white/50 overflow-hidden bg-slate-800">
               {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.firstName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {currentUser?.firstName?.[0] || 'U'}
                  </div>
                )}
            </div>
            <span className="text-white font-bold text-sm shadow-sm">{t('feed.yourStory')}</span>
          </div>

          <button 
            onClick={handlePost}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition flex items-center gap-2"
          >
            Bagikan
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
