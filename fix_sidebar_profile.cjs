const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /<button onClick=\{\(\) => setActiveView\('account'\)\} className=\{`flex items-center gap-3 px-3 py-2\.5 rounded-xl transition \$\{activeView === 'account' \? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'\}`\}>\n                <ShieldCheck size=\{18\} \/>\n                <span className="text-sm">Account<\/span>\n              <\/button>/,
  `<button onClick={() => setActiveView('profile')} className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl transition \${activeView === 'profile' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}\`}>
                <User size={18} />
                <span className="text-sm">Profile</span>
              </button>`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed profile button in left sidebar');
