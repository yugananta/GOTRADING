const fs = require('fs');
let code = fs.readFileSync('src/components/Journal.tsx', 'utf-8');

// Undo the extra closing div if we added it (we didn't because I didn't run a script that committed it, wait I did run it)
// Let me just reload and rewrite accurately

code = code.replace(/<div className=\{\`w-full space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300 relative \$\{isJournalLocked \? "blur-\[4px\] pointer-events-none opacity-50" : ""\}\`\}>/, 
'<div className="py-2 max-w-lg mx-auto min-h-screen relative">\n      <div className={`w-full space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300 transition-all ${isJournalLocked ? "blur-[4px] pointer-events-none opacity-50" : ""}`}>');

// We also added an extra `</div>` at the end of the file in the previous script? Let's check.
// `code = code.substring(0, altIndex) + '</div>\n    </div>\n  );';`
// So there are TWO extra closing divs at the end now. Let's fix the end of file.

code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\};$/, '</div>\n  );\n};');

// Move the lock overlay outside the blurred div
code = code.replace(/\{\/\* LOCK OVERLAY \*\/\}/, '</div>\n\n      {/* LOCK OVERLAY */}');

fs.writeFileSync('src/components/Journal.tsx', code);
console.log('Fixed wrapper');
