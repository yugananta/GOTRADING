const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Root div
code = code.replace(
  /className=\{`\$\{activeView !== 'messages' \? 'min-h-screen pb-24 md:pb-6' : 'h-\[100dvh\] overflow-hidden'\} bg-white text-black flex flex-col font-sans max-w-lg mx-auto border-x border-slate-200 shadow-2xl relative`\}/,
  `className={\`\${activeView !== 'messages' ? 'min-h-screen pb-24 lg:pb-0' : 'h-[100dvh] overflow-hidden'} bg-slate-50 text-black flex flex-col font-sans w-full relative\`}`
);

// 2. Global Header
code = code.replace(
  /<header className="sticky top-0 bg-white border-b border-slate-200 z-40 px-4 py-2 pb-1\.5 shrink-0 space-y-2">/g,
  `<header className="sticky top-0 bg-white border-b border-slate-200 z-40 shrink-0 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-2 pb-1.5 space-y-2">`
);

code = code.replace(
  /<\/header>\n\s*\)}/g,
  `          </div>\n        </header>\n      )}`
);

// 3. Alerts (Offline, PWA)
code = code.replace(
  /<div className="bg-amber-600\/10 border-b border-amber-500\/25 px-4 py-2 flex items-center justify-between text-amber-400 select-none shrink-0 animate-in slide-in-from-top duration-200">/g,
  `<div className="bg-amber-600/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between text-amber-400 select-none shrink-0 animate-in slide-in-from-top duration-200 max-w-7xl mx-auto w-full">`
);
code = code.replace(
  /<div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-3 mx-4 rounded-2xl border border-indigo-500\/20 flex items-center justify-between mb-4 shadow-lg shrink-0">/g,
  `<div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-3 mx-4 lg:mx-auto lg:max-w-7xl lg:w-[calc(100%-2rem)] rounded-2xl border border-indigo-500/20 flex items-center justify-between mb-4 mt-4 shadow-lg shrink-0">`
);

// 4. Main Body Wrapper
// We need to inject the sidebars around the <main> tag.
const mainStart = /<main ref=\{mainRef\} className=\{`flex-1 bg-white \$\{activeView !== 'messages' \? `overflow-y-auto \$\{activeView === 'feed' \? '' : 'px-4 py-2 space-y-4'\}` : 'overflow-hidden flex flex-col'\}`\}>/;

const sidebarsInjection = `
      {/* WEB DESKTOP LAYOUT WRAPPER */}
      <div className={\`flex-1 w-full max-w-7xl mx-auto lg:flex lg:gap-6 \${activeView !== 'messages' ? 'lg:pt-6 lg:px-6' : ''}\`}>
        
        {/* LEFT SIDEBAR (Web Desktop Only) */}
        {activeView !== 'messages' && (
          <aside className="hidden lg:flex flex-col w-[240px] shrink-0 gap-4">
            
            {/* Profile Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="h-16 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              <div className="px-4 pb-4 relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-2xl shadow-md border-4 border-white -mt-8 mb-2">
                  {currentUser.avatar}
                </div>
                <h3 className="font-bold text-slate-900 leading-tight">{currentUser.firstName} {currentUser.lastName}</h3>
                <p className="text-[11px] text-slate-500 mb-3">@{currentUser.username}</p>
                <button 
                  onClick={() => setActiveView('profile')}
                  className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 text-xs font-bold rounded-lg transition"
                >
                  View Profile
                </button>
              </div>
            </div>

            {/* Main Navigation Menu */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex flex-col gap-1">
              <button onClick={() => setActiveView('feed')} className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl transition \${activeView === 'feed' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}\`}>
                <LayoutDashboard size={18} />
                <span className="text-sm">Dashboard</span>
              </button>
              <button onClick={() => setActiveView('journal')} className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl transition relative \${activeView === 'journal' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}\`}>
                <BookOpen size={18} />
                <span className="text-sm">Journal</span>
                <div className="absolute right-3 bg-rose-500 text-white rounded-full p-[2px] shadow-sm"><Lock size={10} /></div>
              </button>
              <button onClick={() => setActiveView('account')} className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl transition \${activeView === 'account' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}\`}>
                <ShieldCheck size={18} />
                <span className="text-sm">Account</span>
              </button>
              <button onClick={() => setActiveView('outlook')} className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl transition \${activeView === 'outlook' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}\`}>
                <Globe size={18} />
                <span className="text-sm">Outlook</span>
              </button>
            </div>
            
          </aside>
        )}

        {/* CENTER MAIN CONTENT */}
        <main ref={mainRef} className={\`flex-1 max-w-[640px] mx-auto w-full \${activeView !== 'messages' ? \`lg:bg-transparent bg-white shadow-2xl lg:shadow-none border-x lg:border-none border-slate-200 \${activeView === 'feed' ? '' : 'px-4 py-2 space-y-4'}\` : 'overflow-hidden flex flex-col lg:bg-white lg:border lg:border-slate-200 lg:rounded-2xl lg:shadow-sm'}\`}>
`;

code = code.replace(mainStart, sidebarsInjection);

// We need to find the end of the <main> block and add the Right Sidebar and the closing div for the WEB DESKTOP LAYOUT WRAPPER.
const mainEnd = /<\/main>/;
const rightSidebarInjection = `
        </main>

        {/* RIGHT SIDEBAR (Web Desktop Only) */}
        {activeView !== 'messages' && (
          <aside className="hidden xl:flex flex-col w-[300px] shrink-0 gap-4">
            
            {/* Broker Partners Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Handshake size={14} className="text-indigo-500" />
                Broker Partners
              </h4>
              <div className="space-y-3">
                {[
                  { name: 'Gotrade', type: 'US Stocks', status: 'Connected' },
                  { name: 'Ajaib', type: 'Crypto & Stocks', status: 'Connect' }
                ].map((broker, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {broker.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{broker.name}</p>
                        <p className="text-[10px] text-slate-500">{broker.type}</p>
                      </div>
                    </div>
                    <button className={\`text-[9px] font-bold px-2 py-1 rounded-md transition \${broker.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}\`}>
                      {broker.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Calendar size={14} className="text-indigo-500" />
                Upcoming Events
              </h4>
              <div className="space-y-3">
                {[
                  { title: 'NFP Data Release', date: 'Tomorrow, 08:30 EST', impact: 'High' },
                  { title: 'FOMC Meeting', date: 'Wed, 14:00 EST', impact: 'High' }
                ].map((event, idx) => (
                  <div key={idx} className="border-l-2 border-indigo-500 pl-3">
                    <p className="text-xs font-bold text-slate-900">{event.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{event.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            <div className="px-2 flex flex-wrap gap-x-3 gap-y-2 text-[10px] font-medium text-slate-400">
              <a href="#" className="hover:text-indigo-600 transition">About</a>
              <a href="#" className="hover:text-indigo-600 transition">Accessibility</a>
              <a href="#" className="hover:text-indigo-600 transition">Help Center</a>
              <a href="#" className="hover:text-indigo-600 transition">Privacy & Terms</a>
              <div className="w-full pt-2 flex items-center gap-1.5 text-slate-500">
                <TaraptiLogo height={14} />
                <span>© 2026 Tarapti Inc.</span>
              </div>
            </div>

          </aside>
        )}
        
      </div>
`;

code = code.replace(mainEnd, rightSidebarInjection);

// 5. Update the mobile footer to be hidden on large screens
code = code.replace(
  /<footer className=\{`fixed bottom-0 left-1\/2 -translate-x-1\/2 bg-white border-t border-slate-200 py-3 px-4 w-full max-w-lg z-40 shrink-0 shadow-\[0_-4px_20px_-5px_rgba\(0,0,0,0\.05\)\] transition-all duration-300 ease-in-out \$\{isFooterVisible \? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'\}`\}>/g,
  `<footer className={\`lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 bg-white border-t border-slate-200 py-3 px-4 w-full max-w-lg z-40 shrink-0 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out \${isFooterVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}\`}>`
);

// We need to also wrap the posts inside a rounded container on desktop
// Let's modify the VIEW 1: HOME FEED 
code = code.replace(
  /<div className="pb-20 bg-white">/,
  `<div className="pb-20 lg:pb-0 bg-white lg:bg-transparent lg:rounded-2xl overflow-hidden">`
);

// We also need to fix bg-slate-300 to gap-2 and transparent bg
code = code.replace(
  /<div className="space-y-2 bg-slate-300 flex flex-col">/g,
  `<div className="space-y-2 bg-slate-300 lg:bg-transparent flex flex-col">`
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated for desktop web layout.');

