const fs = require('fs');
let code = fs.readFileSync('src/components/Journal.tsx', 'utf-8');

code = code.replace(/bg-violet-600 border-violet-600 text-white shadow-md scale-\[1\.02\] ring-2 ring-violet-600\/30/g, "bg-indigo-600 border-indigo-600 text-white shadow-md scale-[1.02] ring-2 ring-indigo-600/30");
code = code.replace(/bg-purple-600 border-purple-600 text-white shadow-md scale-\[1\.02\] ring-2 ring-purple-600\/30/g, "bg-indigo-600 border-indigo-600 text-white shadow-md scale-[1.02] ring-2 ring-indigo-600/30");

code = code.replace(/text-violet-100/g, "text-indigo-100");
code = code.replace(/text-purple-100/g, "text-indigo-100");

code = code.replace(/hover:border-violet-300/g, "hover:border-indigo-300");
code = code.replace(/hover:border-purple-300/g, "hover:border-indigo-300");

code = code.replace(/group-hover:text-violet-500/g, "group-hover:text-indigo-500");
code = code.replace(/group-hover:text-purple-500/g, "group-hover:text-indigo-500");

fs.writeFileSync('src/components/Journal.tsx', code);
