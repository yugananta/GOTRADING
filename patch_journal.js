const fs = require('fs');
const file = 'src/components/Journal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports for Recharts
if (!content.includes('RadarChart')) {
  content = content.replace(
    "import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';",
    "import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';"
  );
}

// 2. Find the start and end of the goals tab
const startTag = "{/* TAB 1: MISSION GOAL */}";
const endTag = "{/* TAB 2: TRADING LEDGER */}";
// Wait, is there a TAB 2 tag? Let's check the exact string.
