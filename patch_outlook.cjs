const fs = require('fs');
let code = fs.readFileSync('src/components/Outlook.tsx', 'utf-8');

code = code.replace(/bg-indigo-600 border-indigo-600 text-white shadow-md scale-\[1\.02\] ring-2 ring-indigo-600\/30/g, "bg-violet-600 border-violet-600 text-white shadow-md scale-[1.02] ring-2 ring-violet-600/30");
code = code.replace(/text-indigo-100/g, "text-violet-100");
code = code.replace(/hover:border-indigo-300/g, "hover:border-violet-300");
code = code.replace(/group-hover:text-indigo-500/g, "group-hover:text-violet-500");

fs.writeFileSync('src/components/Outlook.tsx', code);
