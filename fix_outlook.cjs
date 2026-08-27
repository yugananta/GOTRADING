const fs = require('fs');

let code = fs.readFileSync('src/components/Outlook.tsx', 'utf-8');

const oldRegex = /<div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">/g;
const newWrapper = '<div className="absolute inset-x-0 top-0 bottom-0 z-30 flex flex-col items-center pt-28 px-4 pb-24 pointer-events-auto">';
code = code.replace(oldRegex, newWrapper);

fs.writeFileSync('src/components/Outlook.tsx', code);
console.log('Fixed Outlook.tsx');
