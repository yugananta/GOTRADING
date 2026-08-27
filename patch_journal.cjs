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

const startIndex = content.indexOf("{/* TAB 1: MISSION GOAL */}");
const endIndex = content.indexOf("{activeTab === 'ledger' && (", startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end bounds.");
    process.exit(1);
}

// Find the line containing endIndex and step back
const ledgerIndex = content.lastIndexOf("      {/* TAB 2: TRADING LEDGER */}", endIndex) !== -1 
  ? content.lastIndexOf("      {/* TAB 2: TRADING LEDGER */}", endIndex)
  : endIndex;

// We will replace everything from startIndex to ledgerIndex
const newTabContent = `      {/* TAB 1: PORTOFOLIO */}
      {activeTab === 'goals' && (
        <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Header Section */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                {/* Logo Grid */}
                <div className="grid grid-cols-2 grid-rows-2 gap-[1px] bg-white w-12 h-12 shrink-0">
                  <div className="bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">$</div>
                  <div className="bg-blue-400 flex items-center justify-center text-white font-bold text-sm relative">
                    €
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-[1px]">
                      <CheckCircle size={8} className="text-white" />
                    </div>
                  </div>
                  <div className="bg-amber-500 flex items-center justify-center text-white font-bold text-sm">£</div>
                  <div className="bg-rose-600 flex items-center justify-center text-white font-bold text-sm">¥</div>
                </div>
                
                {/* Title & Author */}
                <div className="flex flex-col justify-center">
                  <h2 className="text-[17px] font-bold text-[#205284] dark:text-blue-400 leading-tight">MSC SuperGold Pro</h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">by Bui Huy Dat</p>
                </div>
              </div>
              
              {/* Growth percentage */}
              <div className="flex flex-col items-end">
                <div className="text-[28px] font-bold text-[#00A651] leading-none">18 019%</div>
                <svg className="w-16 h-6 mt-1" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path d="M0,25 C20,25 40,22 60,20 C80,18 90,5 100,0" fill="none" stroke="#00bcd4" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="100" cy="0" r="2.5" fill="#00bcd4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800/60 border-b border-slate-100 dark:border-slate-800/60 py-3">
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-end gap-[2px] h-4">
                <div className="w-[4px] h-[60%] bg-[#ff9800] rounded-t-sm"></div>
                <div className="w-[4px] h-[80%] bg-[#ff9800] rounded-t-sm"></div>
                <div className="w-[4px] h-[100%] bg-[#ff9800] rounded-t-sm"></div>
                <div className="w-[4px] h-[40%] bg-[#ff9800] rounded-t-sm"></div>
                <div className="w-[4px] h-[60%] bg-slate-200 dark:bg-slate-700 rounded-t-sm"></div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Reliability</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">0.00 USD</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Floating profit</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
                <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">21 / 43K</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">&nbsp;</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[15px] font-bold text-slate-800 dark:text-slate-200">50</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">USD</span>
            </div>
          </div>

          {/* Account Subheader */}
          <div className="flex justify-between items-center px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800/60">
            <span className="text-[15px] font-semibold text-[#205284] dark:text-blue-400">NeotechFinancialServices-Live</span>
            <span className="text-[15px] font-bold text-slate-800 dark:text-slate-200">1:500</span>
          </div>

          {/* Warning Message */}
          <div className="px-4 sm:px-5 py-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60">
            <div className="w-4 h-4 rounded-full bg-[#fbc02d] text-white flex items-center justify-center text-[10px] font-bold shrink-0">!</div>
            <span className="text-[13px] text-slate-700 dark:text-slate-300">A large drawdown may occur on the account again</span>
          </div>

          {/* Radar Chart Area */}
          <div className="py-6 px-2 flex justify-center relative">
            <div className="w-full max-w-[400px] h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={[
                  { subject: 'Algo trading: 96%', A: 96, fullMark: 100 },
                  { subject: 'Profit Trades: 76.8%', A: 76.8, fullMark: 100 },
                  { subject: 'Loss Trades: 23.2%', A: 23.2, fullMark: 100 },
                  { subject: 'Trading activity: 9.4%', A: 9.4, fullMark: 100 },
                  { subject: 'Max deposit load: 30%', A: 30, fullMark: 100 },
                  { subject: 'Maximum drawdown: 53%', A: 53, fullMark: 100 },
                ]}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} />
                  <Radar name="Performance" dataKey="A" stroke="#00bcd4" strokeWidth={2} fill="#00bcd4" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Center Grid Overlays (for 0%, 50%, 100% labels) */}
            <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center gap-5">
               {/* Recharts automatically handles axes, but to match exactly we can let it be or add custom absolute text if needed. For now, Recharts handles it well enough. */}
            </div>
          </div>

          {/* Progress Bars Section */}
          <div className="px-4 sm:px-8 pb-8 pt-2 space-y-4">
            {/* Equity */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-[13px] text-slate-700 dark:text-slate-300">Equity</span>
              <span className="w-24 text-[13px] font-medium text-slate-800 dark:text-slate-200">966.64 USD</span>
              <div className="flex-1 h-6 flex items-center">
                <div className="h-full bg-[#80deea]" style={{ width: '15%' }}></div>
              </div>
            </div>
            {/* Profit */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-[13px] text-slate-700 dark:text-slate-300">Profit</span>
              <span className="w-24 text-[13px] font-medium text-slate-800 dark:text-slate-200">5 500.60 USD</span>
              <div className="flex-1 h-6 flex items-center">
                <div className="h-full bg-[#00bcd4]" style={{ width: '85%' }}></div>
              </div>
            </div>
            {/* Initial Deposit */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-[13px] text-slate-700 dark:text-slate-300">Initial Deposit</span>
              <span className="w-24 text-[13px] font-medium text-slate-800 dark:text-slate-200">451.49 USD</span>
              <div className="flex-1 h-6 flex items-center">
                <div className="h-full bg-[#80deea]" style={{ width: '8%' }}></div>
              </div>
            </div>
            {/* Withdrawals */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-[13px] text-slate-700 dark:text-slate-300">Withdrawals</span>
              <span className="w-24 text-[13px] font-medium text-slate-800 dark:text-slate-200">4 985.45 USD</span>
              <div className="flex-1 h-6 flex items-center">
                <div className="h-full bg-[#00bcd4]" style={{ width: '80%' }}></div>
              </div>
            </div>
            {/* Deposits */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-[13px] text-slate-700 dark:text-slate-300">Deposits</span>
              <span className="w-24 text-[13px] font-medium text-slate-800 dark:text-slate-200">0.00 USD</span>
              <div className="flex-1 h-6 flex items-center">
                {/* Empty */}
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.slice(0, startIndex) + newTabContent + content.slice(ledgerIndex);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched successfully!');
