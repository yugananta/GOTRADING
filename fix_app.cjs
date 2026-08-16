const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Add scrolling reset on activeView change
const hookRegex = /const \[activeView, setActiveView\] = useState<ScreenView>\('feed'\);/;
code = code.replace(hookRegex, "const [activeView, setActiveView] = useState<ScreenView>('feed');\n  useEffect(() => {\n    window.scrollTo(0, 0);\n  }, [activeView]);");

// Center the header nav
code = code.replace(
  '<nav className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-5 text-xs font-bold text-gray-400 select-none pb-0.5">',
  '<nav className="flex-1 overflow-x-auto no-scrollbar flex items-center justify-center gap-5 text-xs font-bold text-gray-400 select-none pb-0.5">'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App patched');
