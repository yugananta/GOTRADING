const fs = require('fs');
let code = fs.readFileSync('src/components/Outlook.tsx', 'utf-8');

code = code.replace(/blur-\[4px\]/g, 'blur-[2px]');
code = code.replace(
  'className="bg-[#121620] border border-gray-800 rounded-3xl p-8 text-center space-y-6 relative overflow-hidden max-w-sm w-full shadow-2xl"',
  'className="bg-[#121620]/80 backdrop-blur-md border border-gray-800/80 rounded-3xl p-8 text-center space-y-6 relative overflow-hidden max-w-sm w-full shadow-2xl"'
);

fs.writeFileSync('src/components/Outlook.tsx', code);
console.log('Outlook locked patched');
