const fs = require('fs');
let code = fs.readFileSync('src/components/StoriesList.tsx', 'utf-8');

code = code.replace(
  /className="bg-white dark:bg-\[#121620\] border-b border-slate-100 dark:border-gray-800 py-3 sm:py-4 mb-2 lg:mb-4 lg:rounded-2xl lg:border"/g,
  'className="bg-white dark:bg-[#121620] border-b border-slate-200 dark:border-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] py-3 sm:py-4 mb-2 lg:mb-4 lg:rounded-2xl lg:border"'
);

fs.writeFileSync('src/components/StoriesList.tsx', code);
