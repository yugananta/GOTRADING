const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Change main app background
code = code.replace(/bg-\[#f3f2ef\]/g, "bg-white");
// Change feed backgrounds
code = code.replace(/bg-slate-300/g, "bg-white");

fs.writeFileSync('src/App.tsx', code);
