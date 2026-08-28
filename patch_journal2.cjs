const fs = require('fs');
let code = fs.readFileSync('src/components/Journal.tsx', 'utf-8');

// Replace Card 1
code = code.replace(
  /className=\{\`group relative overflow-hidden rounded-2xl p-2\.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border \$\{[\s\S]*?\}\`\}/g,
  function(match) {
    if (match.includes("activeTab === 'goals'")) {
      return `className={\`group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border \${
            activeTab === 'goals'
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-white/30 z-10'
              : 'bg-indigo-600/90 border-indigo-500 text-indigo-50 hover:bg-indigo-600 shadow-sm opacity-85 hover:opacity-100'
          }\`}`;
    } else if (match.includes("activeTab === 'ledger'")) {
      return `className={\`group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border \${
            activeTab === 'ledger'
              ? 'bg-violet-600 border-violet-400 text-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-white/30 z-10'
              : 'bg-violet-600/90 border-violet-500 text-violet-50 hover:bg-violet-600 shadow-sm opacity-85 hover:opacity-100'
          }\`}`;
    } else if (match.includes("activeTab === 'history'")) {
      return `className={\`group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border \${
            activeTab === 'history'
              ? 'bg-purple-600 border-purple-400 text-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-white/30 z-10'
              : 'bg-purple-600/90 border-purple-500 text-purple-50 hover:bg-purple-600 shadow-sm opacity-85 hover:opacity-100'
          }\`}`;
    }
    return match;
  }
);

// We also need to fix text colors inside so they are white always.
// For goals
code = code.replace(/\{activeTab === 'goals' \? 'text-indigo-100 shrink-0' : 'text-slate-400 shrink-0'\}/g, "'text-indigo-200 shrink-0'");
code = code.replace(/\{`text-\[10px\] sm:text-\[11px\] font-black truncate \$\{activeTab === 'goals' \? 'text-white' : 'text-slate-700'\}`\}/g, "'text-[10px] sm:text-[11px] font-black truncate text-white'");
code = code.replace(/\{`text-\[9px\] sm:text-\[10px\] leading-tight font-medium line-clamp-2 \$\{activeTab === 'goals' \? 'text-indigo-100' : 'text-slate-500'\}`\}/g, "'text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-indigo-100'");
code = code.replace(/\{`pt-1\.5 flex items-center justify-between text-\[8px\] sm:text-\[9px\] font-extrabold uppercase tracking-wider \$\{activeTab === 'goals' \? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'\}`\}/g, "'pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-indigo-200'");

// For ledger
code = code.replace(/\{activeTab === 'ledger' \? 'text-indigo-100 shrink-0' : 'text-slate-400 shrink-0'\}/g, "'text-violet-200 shrink-0'");
code = code.replace(/\{`text-\[10px\] sm:text-\[11px\] font-black truncate \$\{activeTab === 'ledger' \? 'text-white' : 'text-slate-700'\}`\}/g, "'text-[10px] sm:text-[11px] font-black truncate text-white'");
code = code.replace(/\{`text-\[9px\] sm:text-\[10px\] leading-tight font-medium line-clamp-2 \$\{activeTab === 'ledger' \? 'text-indigo-100' : 'text-slate-500'\}`\}/g, "'text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-violet-100'");
code = code.replace(/\{`pt-1\.5 flex items-center justify-between text-\[8px\] sm:text-\[9px\] font-extrabold uppercase tracking-wider \$\{activeTab === 'ledger' \? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'\}`\}/g, "'pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-violet-200'");

// For history
code = code.replace(/\{activeTab === 'history' \? 'text-indigo-100 shrink-0' : 'text-slate-400 shrink-0'\}/g, "'text-purple-200 shrink-0'");
code = code.replace(/\{`text-\[10px\] sm:text-\[11px\] font-black truncate \$\{activeTab === 'history' \? 'text-white' : 'text-slate-700'\}`\}/g, "'text-[10px] sm:text-[11px] font-black truncate text-white'");
code = code.replace(/\{`text-\[9px\] sm:text-\[10px\] leading-tight font-medium line-clamp-2 \$\{activeTab === 'history' \? 'text-indigo-100' : 'text-slate-500'\}`\}/g, "'text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-purple-100'");
code = code.replace(/\{`pt-1\.5 flex items-center justify-between text-\[8px\] sm:text-\[9px\] font-extrabold uppercase tracking-wider \$\{activeTab === 'history' \? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'\}`\}/g, "'pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-purple-200'");

fs.writeFileSync('src/components/Journal.tsx', code);
