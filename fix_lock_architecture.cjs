const fs = require('fs');

function processJournal() {
  let code = fs.readFileSync('src/components/Journal.tsx', 'utf-8');

  // 1. Remove the old outer blur wrapper
  code = code.replace(
    '<div className={`w-full space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300 transition-all ${isJournalLocked ? "blur-[1.5px] pointer-events-none opacity-50" : ""}`}>',
    '<div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-300">'
  );
  
  // 2. Insert new relative wrapper right before TAB 1
  code = code.replace(
    '{/* TAB 1: MISSION GOAL */}',
    '<div className="relative w-full mt-4">\n        <div className={`space-y-4 transition-all duration-300 ${isJournalLocked ? "blur-[1.5px] pointer-events-none opacity-50 select-none" : ""}`}>\n      {/* TAB 1: MISSION GOAL */}'
  );

  // 3. Close the new inner wrapper and change the lock overlay
  const lockOverlayOld = /\{\/\* LOCK OVERLAY \*\/\}\s*\{isJournalLocked && \(\s*<div className="fixed inset-x-0 top-0 bottom-0 z-30 flex flex-col items-center pt-\[15vh\] px-4 pb-24">[\s\S]*?Fitur Terkunci<\/h3>\s*<p className="text-xs text-gray-400 leading-relaxed font-medium">\s*Hubungkan akun trading Anda untuk membuka Jurnal Trading otomatis & analisis risiko premium\.\s*<\/p>\s*<\/div>\s*<div className="space-y-3 relative z-10 w-full pt-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

  const newLockOverlay = `</div>
        {/* LOCK OVERLAY */}
        {isJournalLocked && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-16 px-4 pointer-events-auto">
            <div className="bg-white/90 dark:bg-[#121620]/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 text-center space-y-5 relative overflow-hidden max-w-[280px] w-full shadow-2xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative mx-auto w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center shadow-lg">
                <Lock size={24} className="text-rose-500 dark:text-rose-400" />
              </div>
              <div className="space-y-1.5 relative z-10">
                <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">Fitur Terkunci</h3>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  Hubungkan akun trading Anda untuk membuka Jurnal Trading otomatis & analisis risiko premium.
                </p>
              </div>
              <div className="space-y-2.5 relative z-10 w-full pt-2">
                <button
                  onClick={() => {
                    showToast("🔗 Menghubungkan ke Akun...", 2000);
                    setTimeout(() => {
                      setIsJournalLocked(false);
                      showToast("🔓 Jurnal Berhasil Dibuka!", 3000);
                    }, 1500);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock size={12}/> Hubungkan Akun Trading
                </button>
                <button
                  onClick={() => {
                    setIsJournalLocked(false);
                    showToast("🔓 Akses Jurnal Dibuka (Demo)", 3000);
                  }}
                  className="w-full py-2.5 bg-gray-100 dark:bg-[#1B2132] hover:bg-gray-200 dark:hover:bg-[#252E46] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold text-[9px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Demo Mode
                </button>
              </div>
            </div>
          </div>
        )}
      </div>`;

  code = code.replace(lockOverlayOld, newLockOverlay);
  fs.writeFileSync('src/components/Journal.tsx', code);
  console.log('Journal.tsx refactored');
}

function processOutlook() {
  let code = fs.readFileSync('src/components/Outlook.tsx', 'utf-8');

  // Add relative wrapper around the content
  code = code.replace(
    '<div className={`space-y-6 transition-all duration-300 ${isOutlookLocked ? \'blur-[1.5px] pointer-events-none opacity-50\' : \'\'}`}>',
    '<div className="relative w-full mt-2">\n        <div className={`space-y-6 transition-all duration-300 ${isOutlookLocked ? \'blur-[1.5px] pointer-events-none opacity-50 select-none\' : \'\'}`}>'
  );

  const lockOverlayOld = /\{\/\* LOCK OVERLAY \*\/\}\s*\{isOutlookLocked && \(\s*<div className="fixed inset-x-0 top-0 bottom-0 z-30 flex flex-col items-center pt-\[15vh\] px-4 pb-24 pointer-events-auto">[\s\S]*?Fitur Terkunci<\/h3>\s*<p className="text-xs text-gray-400 leading-relaxed font-medium">\s*Hubungkan akun trading Anda untuk membuka Jurnal Trading otomatis & analisis risiko premium\.\s*<\/p>\s*<\/div>\s*<div className="space-y-3 relative z-10 w-full pt-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

  const newLockOverlay = `</div>
        {/* LOCK OVERLAY */}
        {isOutlookLocked && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-start pt-20 px-4 pointer-events-auto">
            <div className="bg-white/90 dark:bg-[#121620]/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 text-center space-y-5 relative overflow-hidden max-w-[280px] w-full shadow-2xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative mx-auto w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center shadow-lg">
                <Lock size={24} className="text-rose-500 dark:text-rose-400" />
              </div>
              <div className="space-y-1.5 relative z-10">
                <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">Fitur Terkunci</h3>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  Hubungkan akun trading Anda untuk membuka Live SMC Analysis, Market Insights, dan Economic Calendar premium.
                </p>
              </div>
              <div className="space-y-2.5 relative z-10 w-full pt-2">
                <button
                  onClick={() => {
                    showToast("🔗 Menghubungkan ke Akun...", 2000);
                    setTimeout(() => {
                      setIsOutlookLocked(false);
                      showToast("🔓 Analisis Premium Dibuka!", 3000);
                    }, 1500);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock size={12}/> Hubungkan Akun Trading
                </button>
                <button
                  onClick={() => {
                    setIsOutlookLocked(false);
                    showToast("🔓 Akses Premium Dibuka (Demo)", 3000);
                  }}
                  className="w-full py-2.5 bg-gray-100 dark:bg-[#1B2132] hover:bg-gray-200 dark:hover:bg-[#252E46] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold text-[9px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Demo Mode
                </button>
              </div>
            </div>
          </div>
        )}
      </div>`;

  code = code.replace(lockOverlayOld, newLockOverlay);
  fs.writeFileSync('src/components/Outlook.tsx', code);
  console.log('Outlook.tsx refactored');
}

processJournal();
processOutlook();
