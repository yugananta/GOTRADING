const fs = require('fs');
let code = fs.readFileSync('src/components/Outlook.tsx', 'utf-8');

const lockIndex = code.indexOf('{/* LOCK OVERLAY */}');
if (lockIndex !== -1) {
  const beforeLock = code.substring(0, lockIndex);
  
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
    </div>
  );
};`;
  
  code = beforeLock + newLockOverlay;
  
  // also fix the double dark:text-gray-400 from earlier script throughout the file just in case
  code = code.replace(/dark:text-gray-500 dark:text-gray-400/g, 'dark:text-gray-500');
  
  fs.writeFileSync('src/components/Outlook.tsx', code);
  console.log('Fixed Outlook.tsx div Forcefully!');
}
