const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf-8');

  // Replace the old overlay wrapper
  const oldRegex = /<div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 h-screen">/g;
  const newWrapper = '<div className="absolute inset-x-0 top-0 bottom-0 z-30 flex flex-col items-center pt-28 px-4 pb-24">';
  
  if (code.match(oldRegex)) {
    code = code.replace(oldRegex, newWrapper);
  } else {
    console.log('Regex not matched in', file);
  }

  fs.writeFileSync(file, code);
  console.log('Fixed', file);
}

fixFile('src/components/Journal.tsx');
fixFile('src/components/Outlook.tsx');
