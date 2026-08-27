import React, { useState } from 'react';
import { Network } from './components/Network';
import { AppProvider } from './components/AppContext';
import { Home, Users, Compass, BookOpen, LineChart, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function AppContent() {
  const [activeTab, setActiveTab] = useState('network');
  const { t } = useTranslation();

  const tabs = [
    { id: 'home', icon: <Home size={24} />, label: t('nav.home', 'Home') },
    { id: 'network', icon: <Users size={24} />, label: t('nav.network', 'Network') },
    { id: 'connect', icon: <Compass size={24} />, label: t('nav.connect', 'Connect') },
    { id: 'journal', icon: <BookOpen size={24} />, label: t('nav.journal', 'Journal') },
    { id: 'outlook', icon: <LineChart size={24} />, label: t('nav.outlook', 'Outlook') },
    { id: 'profile', icon: <UserCircle size={24} />, label: t('nav.profile', 'Profile') }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Top Header Placeholder */}
      <header className="bg-white dark:bg-slate-800 shadow-sm px-4 py-3 sticky top-0 z-50">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Tarapti Trading</h1>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto h-full">
        {activeTab === 'network' ? (
          <Network />
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-4">
              {tabs.find(t => t.id === activeTab)?.icon}
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Styling and layout restored successfully. This module is ready for further development.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-50 px-2 sm:px-6">
        <div className="max-w-md mx-auto flex justify-between items-center py-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className={`transition-transform duration-200 ${activeTab === tab.id ? 'scale-110 mb-1' : 'scale-100 mb-1'}`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-medium transition-all duration-200 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
