const fs = require('fs');
let code = fs.readFileSync('src/components/MarketWatchTicker.tsx', 'utf8');

code = code.replace("border-t border-slate-200 dark:border-white/5", "border-b border-slate-200 dark:border-white/5");

fs.writeFileSync('src/components/MarketWatchTicker.tsx', code);
console.log("Patched MarketWatchTicker border");
