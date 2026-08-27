const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(/\s*{\/\* Domisili Badges \*\/}\s*<div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">[\s\S]*?<\/div>\s*<\/div>\s*{\/\* WEB ONLY: Center Navigation \+ Domisili Badges aligned side-by-side \*\/}/, '\n        </div>\n\n        {/* WEB ONLY: Center Navigation + Domisili Badges aligned side-by-side */}');

content = content.replace(/\s*{\/\* Domisili Badges aligned to the right \(under search\/right tray\) \*\/}\s*<div className="flex items-center gap-2 shrink-0">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/header>/, '\n        </div>\n        \n        </div>\n      </header>');

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('Cleaned badges');
