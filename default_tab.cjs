const fs = require('fs');
let code = fs.readFileSync('src/components/Journal.tsx', 'utf-8');
code = code.replace("useState<'goals' | 'ledger'>('ledger')", "useState<'goals' | 'ledger'>('goals')");
fs.writeFileSync('src/components/Journal.tsx', code);
console.log('switched tab successfully');
