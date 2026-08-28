const fs = require('fs');

let code = fs.readFileSync('src/components/Outlook.tsx', 'utf-8');

const oldTechBtn = /className=\{\`flex-1 py-2 text-xs font-bold rounded-lg transition-all \$\{\s*activeTab === 'technical' \? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600\/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800\/20'\s*\}\`\}/;

const newTechBtn = `className={\`flex-1 py-2 text-xs font-bold rounded-lg transition-all \${
            activeTab === 'technical' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
              : 'bg-blue-500/10 text-blue-400 hover:text-blue-200 hover:bg-blue-500/20'
          }\`}`;
          
if(code.match(oldTechBtn)) {
   code = code.replace(oldTechBtn, newTechBtn);
   console.log('Fixed technical btn');
}

const oldNewsBtn = /className=\{\`flex-1 py-2 text-xs font-bold rounded-lg transition-all \$\{\s*activeTab === 'news' \? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600\/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800\/20'\s*\}\`\}/;

const newNewsBtn = `className={\`flex-1 py-2 text-xs font-bold rounded-lg transition-all \${
            activeTab === 'news' 
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
              : 'bg-violet-500/10 text-violet-400 hover:text-violet-200 hover:bg-violet-500/20'
          }\`}`;

if(code.match(oldNewsBtn)) {
   code = code.replace(oldNewsBtn, newNewsBtn);
   console.log('Fixed news btn');
}

fs.writeFileSync('src/components/Outlook.tsx', code);
