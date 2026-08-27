const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The replacement was looking for exact whitespace. Let's do it carefully.
code = code.replace("        <MarketWatchTicker />\n      </header>\n      )}", "      </header>\n      )}");

fs.writeFileSync('src/App.tsx', code);
console.log("Patched MarketWatchTicker remove");
