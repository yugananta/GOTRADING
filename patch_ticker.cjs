const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// First remove from the bottom of header
code = code.replace("        <MarketWatchTicker />\n      </header>", "      </header>");

// Now add to the top of the header
const headerTopOld = `      <header className="sticky top-0 bg-white border-b border-slate-200 z-50 shrink-0 shadow-sm">
        {isTopFeedDropdownOpen && (`;

const headerTopNew = `      <header className="sticky top-0 bg-white border-b border-slate-200 z-50 shrink-0 shadow-sm">
        <MarketWatchTicker />
        {isTopFeedDropdownOpen && (`;

if (code.includes(headerTopOld)) {
  code = code.replace(headerTopOld, headerTopNew);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched MarketWatchTicker position");
} else {
  console.log("Failed to find header top structure");
}
