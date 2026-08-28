const fs = require('fs');
let code = fs.readFileSync('src/components/Outlook.tsx', 'utf-8');

const regex = /<AdvancedRealTimeChart[\s\S]*?\/>/g;
// We need to keep the one inside MemoizedChart, so we replace ALL of them with MemoizedChart, 
// EXCEPT the one we just fixed.
// Let's just do it manually by finding the one after line 180.
code = code.replace(
  /<AdvancedRealTimeChart\s+theme="dark"\s+symbol=\{selectedPair\}[\s\S]*?\/>/g,
  '<MemoizedChart symbol={selectedPair} />'
);

fs.writeFileSync('src/components/Outlook.tsx', code);
console.log('Fixed all charts');
