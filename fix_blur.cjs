const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf-8');

  code = code.replace(/blur-\[2px\]/g, 'blur-[1.5px]');
  code = code.replace(/bg-\[\#121620\]\/80 backdrop-blur-md/g, 'bg-[#121620]/60 backdrop-blur-xl');

  fs.writeFileSync(file, code);
  console.log('Fixed', file);
}

fixFile('src/components/Journal.tsx');
fixFile('src/components/Outlook.tsx');
