const fs = require('fs');
let code = fs.readFileSync('src/components/CreatePost.tsx', 'utf-8');

code = code.replace(
  /className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm mb-3"/g,
  'className="bg-white rounded-2xl border border-slate-200 p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-3"'
);

fs.writeFileSync('src/components/CreatePost.tsx', code);
