const fs = require('fs');
let code = fs.readFileSync('src/components/Journal.tsx', 'utf-8');

// Remove my previous broken overlay at the bottom if it exists
const brokenOverlayRegex = /<\/div>\s*\{isJournalLocked && \([\s\S]*?\{\/\* POPUP 2: BENTO INTELLIGENCE ANALYSIS DRAWER \*\/\}/;
code = code.replace(brokenOverlayRegex, '{/* POPUP 2: BENTO INTELLIGENCE ANALYSIS DRAWER */}');

const brokenOverlayRegex2 = /\{isJournalLocked && \([\s\S]*?\{\/\* POPUP 2: BENTO INTELLIGENCE ANALYSIS DRAWER \*\/\}/;
code = code.replace(brokenOverlayRegex2, '{/* POPUP 2: BENTO INTELLIGENCE ANALYSIS DRAWER */}');

// Remove the `if (isJournalLocked)` block
const ifStart = code.indexOf('if (isJournalLocked) {');
const nextReturn = code.indexOf('return (', code.indexOf(');', ifStart));
if (ifStart !== -1 && nextReturn !== -1) {
  code = code.substring(0, ifStart) + code.substring(nextReturn);
}

// Modify the main return div
const originalDiv = 'return (\n    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">';
const newDiv = 'return (\n    <div className={`w-full space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300 relative ${isJournalLocked ? "blur-[4px] pointer-events-none opacity-50" : ""}`}>';
code = code.replace(originalDiv, newDiv);

// Inject lock overlay right before the end
const endDiv = '{/* POPUP 2: BENTO INTELLIGENCE ANALYSIS DRAWER */}';
const lockOverlay = `
      {/* LOCK OVERLAY */}
      {isJournalLocked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 h-screen">
          <div className="bg-[#121620] border border-gray-800 rounded-3xl p-8 text-center space-y-6 relative overflow-hidden max-w-sm w-full shadow-2xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative mx-auto w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center shadow-lg">
              <Lock size={28} className="text-rose-400" />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Fitur Terkunci</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Hubungkan akun trading Anda untuk membuka Jurnal Trading otomatis & analisis risiko premium.
              </p>
            </div>
            <div className="space-y-3 relative z-10 w-full pt-2">
              <button
                onClick={() => {
                  showToast("🔗 Menghubungkan ke Akun...", 2000);
                  setTimeout(() => {
                    setIsJournalLocked(false);
                    showToast("🔓 Jurnal Berhasil Dibuka!", 3000);
                  }, 1500);
                }}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock size={14}/> Hubungkan Akun Trading
              </button>
              <button
                onClick={() => {
                  setIsJournalLocked(false);
                  showToast("🔓 Akses Jurnal Dibuka (Demo)", 3000);
                }}
                className="w-full py-3 bg-[#1B2132] hover:bg-[#252E46] border border-gray-800 text-gray-300 hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Demo Mode
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* POPUP 2: BENTO INTELLIGENCE ANALYSIS DRAWER */}
`;
code = code.replace(endDiv, lockOverlay);

fs.writeFileSync('src/components/Journal.tsx', code);
console.log('patched successfully');
