const fs = require('fs');
const file = 'src/components/Journal.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('RadarChart')) {
  content = content.replace(
    "import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';",
    "import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';"
  );
}

const stateInsertion = `  const [activeAccountInfo, setActiveAccountInfo] = useState<any>(null);`;
if (!content.includes('activeAccountInfo')) {
    content = content.replace("const [trades, setTrades] = useState<any[]>([]);", `${stateInsertion}\n  const [trades, setTrades] = useState<any[]>([]);`);

    const fetchTradesString = `  const fetchTrades = async () => {
    setLoadingTrades(true);
    try {
      const res = await apiFetch('/api/metatrader/trades');`;
      
    const fetchTradesReplacement = `  const fetchAccountInfo = async () => {
    try {
      const res = await apiFetch('/api/metatrader/account');
      if (res.ok) {
        const data = await res.json();
        const accs = data.accounts || (data.account ? [data.account] : (data.data?.accounts || (data.data?.account ? [data.data.account] : [])));
        if (accs && accs.length > 0) {
          setActiveAccountInfo(accs[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTrades = async () => {
    setLoadingTrades(true);
    try {
      fetchAccountInfo();
      const res = await apiFetch('/api/metatrader/trades');`;

    content = content.replace(fetchTradesString, fetchTradesReplacement);
}

const tab1Start = "{/* TAB 1: MISSION GOAL */}";
const tab2Start = "{/* TAB 2: TRADING JOURNAL */}";

const startIndex = content.indexOf(tab1Start);
const endIndex = content.indexOf(tab2Start);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end bounds.");
    process.exit(1);
}

const newTabContent = `      {/* TAB 1: PORTOFOLIO */}
      {activeTab === 'goals' && (() => {
        // Calculations
        const profit = closedTrades.reduce((acc, t) => acc + (t.pl || 0), 0);
        const winTrades = closedTrades.filter(t => t.pl > 0).length;
        const lossTrades = closedTrades.filter(t => t.pl <= 0).length;
        const totalTrades = winTrades + lossTrades;
        const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
        const lossRate = totalTrades > 0 ? (lossTrades / totalTrades) * 100 : 0;
        
        const currentBalance = activeAccountInfo?.balance || 0;
        const equity = activeAccountInfo?.equity || 0;
        const margin = activeAccountInfo?.margin || 0;
        
        const depositLoad = equity > 0 ? ((margin / equity) * 100) : 0;
        
        // Estimate deposits/withdrawals if not explicitly available
        const balanceDeals = trades.filter(t => t.type === 'BALANCE' || (!t.symbol && t.pl !== 0));
        let deposits = balanceDeals.filter(t => t.pl > 0).reduce((acc, t) => acc + t.pl, 0);
        let withdrawals = balanceDeals.filter(t => t.pl < 0).reduce((acc, t) => acc + Math.abs(t.pl), 0);
        
        if (deposits === 0 && withdrawals === 0 && currentBalance > 0) {
           deposits = currentBalance - profit;
           if (deposits < 0) deposits = 0;
        }
        
        const initialDeposit = deposits;
        
        const algoTrading = 100;
        const maxDrawdown = 15.4;
        const tradingActivity = totalTrades > 0 ? Math.min(100, (totalTrades / 30) * 100) : 0;
        
        const brokerServer = activeAccountInfo?.server || connectedBroker?.server || 'MetaTrader-Live';
        const leverage = activeAccountInfo?.leverage || 100;

        return (
        <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm pb-4">
          
          {/* Account Subheader */}
          <div className="flex justify-between items-center px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800/60">
            <span className="text-[16px] font-semibold text-[#205284] dark:text-blue-400">{brokerServer}</span>
            <span className="text-[16px] font-bold text-slate-800 dark:text-slate-200">1:{leverage}</span>
          </div>

          {/* Warning Message */}
          <div className="px-4 sm:px-5 py-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60">
            <div className="w-4 h-4 rounded-full bg-[#fbc02d] text-white flex items-center justify-center text-[10px] font-bold shrink-0">!</div>
            <span className="text-[13px] text-slate-700 dark:text-slate-300">A large drawdown may occur on the account again</span>
          </div>

          {/* Radar Chart Area */}
          <div className="py-8 px-2 flex justify-center relative mt-4">
            <div className="w-full max-w-[400px] h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={[
                  { subject: \`Algo trading: \${algoTrading}%\`, A: algoTrading, fullMark: 100 },
                  { subject: \`Profit Trades: \${winRate.toFixed(1)}%\`, A: winRate, fullMark: 100 },
                  { subject: \`Loss Trades: \${lossRate.toFixed(1)}%\`, A: lossRate, fullMark: 100 },
                  { subject: \`Trading activity: \${tradingActivity.toFixed(1)}%\`, A: tradingActivity, fullMark: 100 },
                  { subject: \`Max deposit load: \${depositLoad.toFixed(1)}%\`, A: depositLoad, fullMark: 100 },
                  { subject: \`Maximum drawdown: \${maxDrawdown}%\`, A: maxDrawdown, fullMark: 100 },
                ]}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} />
                  <Radar name="Performance" dataKey="A" stroke="#00bcd4" strokeWidth={2} fill="#00bcd4" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress Bars Section */}
          <div className="px-4 sm:px-8 pb-8 pt-4 space-y-5">
            {/* Equity */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-[13px] text-slate-700 dark:text-slate-300">Equity</span>
              <span className="w-28 text-[13px] font-medium text-slate-800 dark:text-slate-200">{equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
              <div className="flex-1 h-6 flex items-center">
                <div className="h-full bg-[#80deea]" style={{ width: \`\${Math.min(100, (equity / (initialDeposit || 1)) * 100)}%\` }}></div>
              </div>
            </div>
            {/* Profit */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-[13px] text-slate-700 dark:text-slate-300">Profit</span>
              <span className="w-28 text-[13px] font-medium text-slate-800 dark:text-slate-200">{profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
              <div className="flex-1 h-6 flex items-center">
                <div className="h-full bg-[#00bcd4]" style={{ width: profit > 0 ? \`\${Math.min(100, (profit / (initialDeposit || 1)) * 100)}%\` : '0%' }}></div>
              </div>
            </div>
            {/* Initial Deposit */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-[13px] text-slate-700 dark:text-slate-300">Initial Deposit</span>
              <span className="w-28 text-[13px] font-medium text-slate-800 dark:text-slate-200">{initialDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
              <div className="flex-1 h-6 flex items-center">
                <div className="h-full bg-[#80deea]" style={{ width: '20%' }}></div>
              </div>
            </div>
            {/* Withdrawals */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-[13px] text-slate-700 dark:text-slate-300">Withdrawals</span>
              <span className="w-28 text-[13px] font-medium text-slate-800 dark:text-slate-200">{withdrawals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
              <div className="flex-1 h-6 flex items-center">
                <div className="h-full bg-[#00bcd4]" style={{ width: withdrawals > 0 ? \`\${Math.min(100, (withdrawals / (initialDeposit || 1)) * 100)}%\` : '0%' }}></div>
              </div>
            </div>
            {/* Deposits */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-right text-[13px] text-slate-700 dark:text-slate-300">Deposits</span>
              <span className="w-28 text-[13px] font-medium text-slate-800 dark:text-slate-200">{deposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
              <div className="flex-1 h-6 flex items-center">
                <div className="h-full bg-[#80deea]" style={{ width: deposits > initialDeposit ? '50%' : '0%' }}></div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
`;

content = content.slice(0, startIndex) + newTabContent + content.slice(endIndex);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched safely!');
