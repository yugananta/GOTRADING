const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  '<div className="min-h-screen bg-[#0B0E14] text-gray-100 flex flex-col font-sans pb-24 md:pb-6 max-w-lg mx-auto border-x border-gray-800/60 shadow-2xl relative">',
  '<div className="min-h-screen bg-gray-50 dark:bg-[#0B0E14] text-gray-900 dark:text-gray-100 flex flex-col font-sans pb-24 md:pb-6 max-w-lg mx-auto border-x border-gray-200 dark:border-gray-800/60 shadow-2xl relative transition-colors duration-300">'
);

code = code.replace(
  '<header className="sticky top-0 bg-[#0B0E14]/90 backdrop-blur-md border-b border-gray-800/80 z-40 p-4 shrink-0 space-y-3.5">',
  '<header className="sticky top-0 bg-white/90 dark:bg-[#0B0E14]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/80 z-40 p-4 shrink-0 space-y-3.5 transition-colors duration-300">'
);

code = code.replace(
  '<h1 className="text-sm font-bold tracking-tight text-white uppercase leading-none">Tarapti</h1>',
  '<h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white uppercase leading-none">Tarapti</h1>'
);

code = code.replace(
  'text-white border-b-2 border-indigo-500 font-extrabold',
  'text-gray-900 dark:text-white border-b-2 border-indigo-500 font-extrabold'
);

code = code.replace(
  '<div className="fixed bottom-0 w-full max-w-lg mx-auto bg-[#0B0E14]/90 backdrop-blur-md border-t border-gray-800/80 z-50 px-6 py-4 flex justify-between items-center">',
  '<div className="fixed bottom-0 w-full max-w-lg mx-auto bg-white/90 dark:bg-[#0B0E14]/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800/80 z-50 px-6 py-4 flex justify-between items-center transition-colors duration-300">'
);

// We need to fix the bottom nav buttons too
const navBtnRegex = /text-white scale-110/g;
code = code.replace(navBtnRegex, 'text-indigo-600 dark:text-white scale-110');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx light mode patched');
