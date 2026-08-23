const fs = require('fs');
let code = fs.readFileSync('src/components/Journal.tsx', 'utf-8');

code = code.replace('{isJournalLocked && (', '</div>\n      {isJournalLocked && (');

fs.writeFileSync('src/components/Journal.tsx', code);
console.log('Fixed div');
