const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Add Sun/Moon icons to import
code = code.replace('Pencil, Lock, Globe} from', 'Pencil, Lock, Globe, Sun, Moon} from');

// Add theme state
code = code.replace('const [clearedMockAlerts, setClearedMockAlerts] = useState(false);', 
  "const [clearedMockAlerts, setClearedMockAlerts] = useState(false);\n  const [isDarkMode, setIsDarkMode] = useState(true);\n  useEffect(() => {\n    if (isDarkMode) document.documentElement.classList.add('dark');\n    else document.documentElement.classList.remove('dark');\n  }, [isDarkMode]);"
);

// Add toggle button
const searchBtn = `<button \n              onClick={() => setGlobalSearchOpen(true)}\n              className="p-1.5 hover:bg-gray-800/40 rounded-full transition text-gray-400 hover:text-white"\n            >\n              <Search size={18} />\n            </button>`;

const newButtons = `<button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800/40 rounded-full transition text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => setGlobalSearchOpen(true)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800/40 rounded-full transition text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Search size={18} />
            </button>`;

code = code.replace(searchBtn, newButtons);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx theme toggle added');
