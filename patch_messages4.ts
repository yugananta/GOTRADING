import fs from 'fs';

const file = 'src/components/Messages.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'className="w-full h-full object-contain scale-125 -ml-1 -mt-1"', 
  'className="w-full h-full object-contain scale-[1.2] -ml-1 -mt-1"'
);

code = code.replace(
  'className="fixed top-20 left-4 w-16 h-16 sm:w-20 sm:h-20 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all z-20 cursor-pointer overflow-hidden p-0 border border-slate-200"',
  'className="fixed top-20 left-4 w-14 h-14 sm:w-16 sm:h-16 bg-transparent rounded-full flex items-center justify-center hover:scale-105 transition-all z-20 cursor-pointer p-0 border-none"'
);

fs.writeFileSync(file, code);
