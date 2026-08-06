const fs = require('fs');

let code = fs.readFileSync('src/components/Journal.tsx', 'utf-8');

const oldLedgerBtn = /className=\{\`py-2 text-center text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 \$\{\s*activeTab === 'ledger'\s*\? 'bg-indigo-600 text-white shadow-md shadow-indigo-600\/10'\s*: 'text-gray-400 hover:text-white hover:bg-gray-800\/20'\s*\}\`\}/;

const newLedgerBtn = `className={\`py-2 text-center text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 \${
            activeTab === 'ledger' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
              : 'bg-indigo-500/10 text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/20'
          }\`}`;
          
if(code.match(oldLedgerBtn)) {
   code = code.replace(oldLedgerBtn, newLedgerBtn);
   console.log('Fixed ledger btn');
}

const oldGoalsBtn = /className=\{\`py-2 text-center text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 \$\{\s*activeTab === 'goals'\s*\? 'bg-indigo-600 text-white shadow-md shadow-indigo-600\/10'\s*: 'text-gray-400 hover:text-white hover:bg-gray-800\/20'\s*\}\`\}/;

const newGoalsBtn = `className={\`py-2 text-center text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 \${
            activeTab === 'goals' 
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
              : 'bg-emerald-500/10 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/20'
          }\`}`;

if(code.match(oldGoalsBtn)) {
   code = code.replace(oldGoalsBtn, newGoalsBtn);
   console.log('Fixed goals btn');
}

fs.writeFileSync('src/components/Journal.tsx', code);
