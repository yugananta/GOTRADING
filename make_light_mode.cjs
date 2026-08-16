const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let code = fs.readFileSync(filePath, 'utf-8');

  // Backgrounds
  code = code.replace(/bg-\[\#121620\]/g, 'bg-white dark:bg-[#121620]');
  code = code.replace(/bg-\[\#1B2132\]/g, 'bg-gray-100 dark:bg-[#1B2132]');
  code = code.replace(/bg-\[\#0B0E14\]/g, 'bg-gray-50 dark:bg-[#0B0E14]');
  
  // Borders
  code = code.replace(/border-gray-800/g, 'border-gray-200 dark:border-gray-800');
  
  // Text colors (only gray-400, gray-500, gray-300 to not mess up colored text)
  code = code.replace(/text-gray-400/g, 'text-gray-500 dark:text-gray-400');
  code = code.replace(/text-gray-500/g, 'text-gray-400 dark:text-gray-500');
  code = code.replace(/text-gray-300/g, 'text-gray-700 dark:text-gray-300');
  
  // Headings/White text
  // We want to replace text-white with text-gray-900 dark:text-white
  // BUT only if it's not inside a button or colored badge.
  // This is tricky. A simple heuristic: if it has "font-bold" or "font-black" and no "bg-" color in the same className.
  // Actually, let's just do a safer replace for known heading patterns:
  code = code.replace(/text-white/g, 'text-gray-900 dark:text-white');
  
  // Revert text-white for buttons (e.g. text-white in bg-indigo-600)
  code = code.replace(/bg-indigo-600([^"}]*?)text-gray-900 dark:text-white/g, 'bg-indigo-600$1text-white');
  code = code.replace(/bg-blue-600([^"}]*?)text-gray-900 dark:text-white/g, 'bg-blue-600$1text-white');
  code = code.replace(/bg-emerald-600([^"}]*?)text-gray-900 dark:text-white/g, 'bg-emerald-600$1text-white');
  code = code.replace(/bg-rose-600([^"}]*?)text-gray-900 dark:text-white/g, 'bg-rose-600$1text-white');
  code = code.replace(/bg-violet-600([^"}]*?)text-gray-900 dark:text-white/g, 'bg-violet-600$1text-white');
  code = code.replace(/bg-\[\#EF3E42\]([^"}]*?)text-gray-900 dark:text-white/g, 'bg-[#EF3E42]$1text-white');

  fs.writeFileSync(filePath, code);
  console.log('Processed', file);
});
