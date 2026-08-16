const fs = require('fs');
let code = fs.readFileSync('src/components/Outlook.tsx', 'utf-8');

// Replace Card 1
code = code.replace(
  /className=\{\`group relative overflow-hidden rounded-2xl p-2\.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border \$\{[\s\S]*?\}\`\}/g,
  function(match) {
    if (match.includes("activeTab === 'news'")) {
      return `className={\`group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border \${
            activeTab === 'news'
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-white/30 z-10'
              : 'bg-indigo-600/90 border-indigo-500 text-indigo-50 hover:bg-indigo-600 shadow-sm opacity-85 hover:opacity-100'
          }\`}`;
    } else if (match.includes("activeTab === 'technical'")) {
      return `className={\`group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border \${
            activeTab === 'technical'
              ? 'bg-violet-600 border-violet-400 text-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-white/30 z-10'
              : 'bg-violet-600/90 border-violet-500 text-violet-50 hover:bg-violet-600 shadow-sm opacity-85 hover:opacity-100'
          }\`}`;
    }
    return match;
  }
);

// For news
code = code.replace(/\{activeTab === 'news' \? 'text-violet-100 shrink-0' : 'text-slate-400 shrink-0'\}/g, "'text-indigo-200 shrink-0'");
code = code.replace(/\{`text-\[10px\] sm:text-\[11px\] font-black truncate \$\{activeTab === 'news' \? 'text-white' : 'text-slate-700'\}`\}/g, "'text-[10px] sm:text-[11px] font-black truncate text-white'");
code = code.replace(/\{`text-\[9px\] sm:text-\[10px\] leading-tight font-medium line-clamp-2 \$\{activeTab === 'news' \? 'text-violet-100' : 'text-slate-500'\}`\}/g, "'text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-indigo-100'");
code = code.replace(/\{`pt-1\.5 flex items-center justify-between text-\[8px\] sm:text-\[9px\] font-extrabold uppercase tracking-wider \$\{activeTab === 'news' \? 'text-white' : 'text-slate-400 group-hover:text-violet-500'\}`\}/g, "'pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-indigo-200'");

// For technical
code = code.replace(/\{activeTab === 'technical' \? 'text-violet-100 shrink-0' : 'text-slate-400 shrink-0'\}/g, "'text-violet-200 shrink-0'");
code = code.replace(/\{`text-\[10px\] sm:text-\[11px\] font-black truncate \$\{activeTab === 'technical' \? 'text-white' : 'text-slate-700'\}`\}/g, "'text-[10px] sm:text-[11px] font-black truncate text-white'");
code = code.replace(/\{`text-\[9px\] sm:text-\[10px\] leading-tight font-medium line-clamp-2 \$\{activeTab === 'technical' \? 'text-violet-100' : 'text-slate-500'\}`\}/g, "'text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-violet-100'");
code = code.replace(/\{`pt-1\.5 flex items-center justify-between text-\[8px\] sm:text-\[9px\] font-extrabold uppercase tracking-wider \$\{activeTab === 'technical' \? 'text-white' : 'text-slate-400 group-hover:text-violet-500'\}`\}/g, "'pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-violet-200'");

fs.writeFileSync('src/components/Outlook.tsx', code);
