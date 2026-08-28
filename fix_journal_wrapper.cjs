const fs = require('fs');
let code = fs.readFileSync('src/components/Journal.tsx', 'utf-8');

const originalReturn = 'return (\n    <div className={`w-full space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300 relative ${isJournalLocked ? "blur-[4px] pointer-events-none opacity-50" : ""}`}>';

const newReturn = 'return (\n    <div className="py-2 max-w-lg mx-auto min-h-screen relative">\n      <div className={`w-full space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300 transition-all ${isJournalLocked ? "blur-[4px] pointer-events-none opacity-50" : ""}`}>';

code = code.replace(originalReturn, newReturn);

// Also we need to close that new outer div at the very end
// Find the last closing tag
const lastIndex = code.lastIndexOf('</div>\n  );\n};');
if (lastIndex !== -1) {
  code = code.substring(0, lastIndex) + '</div>\n    </div>\n  );\n};';
} else {
    // try slightly different
    const altIndex = code.lastIndexOf('</div>\n  );');
    if (altIndex !== -1) {
       code = code.substring(0, altIndex) + '</div>\n    </div>\n  );';
    }
}

// And move the lock overlay outside the blurred div!
// Currently the lock overlay is at line 1228, before POPUP 2, which is ALSO inside the blurred div!
// Actually, POPUP 2 should also not be blurred if it opens, though it shouldn't open if locked.
// The easiest way is to close the blurred div right before LOCK OVERLAY.

const lockStart = '{/* LOCK OVERLAY */}';
code = code.replace(lockStart, '</div>\n\n      {/* LOCK OVERLAY */}');

// But since we added a closing div, we don't need to add it at the very end anymore!
// Let's undo the lastIndex change by doing this replacement sequentially.
