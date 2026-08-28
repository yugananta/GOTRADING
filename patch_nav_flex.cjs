const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the absolute positioning with flex-1
code = code.replace(
  'className="hidden md:flex items-end justify-center absolute left-1/2 -translate-x-1/2 bottom-[-6px] z-50"',
  'className="hidden md:flex items-center justify-center flex-1 z-50"'
);
code = code.replace(
  '<nav className="flex items-center gap-5 text-xs font-bold text-slate-400 select-none pb-0">',
  '<nav className="flex items-center gap-4 lg:gap-6 text-xs font-bold text-slate-400 select-none">'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched Navigation position");
