const fs = require('fs');
let code = fs.readFileSync('src/components/Journal.tsx', 'utf-8');

const goalsStart = code.indexOf("{activeTab === 'goals' && (");
const ledgerStart = code.indexOf("{/* TAB 2: TRADING JOURNAL */}");

if (goalsStart !== -1 && ledgerStart !== -1) {
  const newGoals = `{activeTab === 'goals' && (
        <div className="space-y-4">
          
          {/* PERFORMANCE VS TARGET SUMMARY CHARTS CARD */}
          <div className="bg-white/95 dark:bg-[#121620] backdrop-blur-md border border-slate-200 dark:border-gray-800 rounded-3xl p-5 space-y-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-1.5">
                  <BarChart3 size={15} className="text-indigo-600" />
                  Visualisasi Performa vs Target
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Analisis aktual profit & drawdown terhadap target yang ditentukan.</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">
                Live Stats
              </span>
            </div>

            {/* Dynamic Status / Visual Alert Box (Moved from Simulator) */}
            {goalAlert && (
              <div className={\`p-3 rounded-xl border flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 shadow-sm \${
                goalAlert.type === 'success' 
                  ? 'bg-[#F0FDF4] border-[#DCFCE7] text-slate-900' 
                  : 'bg-[#FFF1F2] border-[#FFE4E6] text-slate-900'
              }\`}>
                {goalAlert.type === 'success' ? (
                  <CheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-600" />
                )}
                <div className="text-[10px]">
                  <span className={\`font-black uppercase tracking-widest block mb-0.5 \${goalAlert.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}\`}>
                    {goalAlert.type === 'success' ? 'Target Milestone Met!' : 'Caution: Limit Reached'}
                  </span>
                  <span className={\`leading-normal font-bold text-slate-800\`}>{goalAlert.message}</span>
                </div>
              </div>
            )}

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: 'Harian (Daily)',
                      Aktual: parseFloat(tradingStats.todayPL.replace(/[^\\d.-]/g, '')) || 0,
                      Target: Number(dailyTargetAmount) || 500,
                      Drawdown: 180,
                      BatasDD: Number(dailyRiskLimitAmount) || 300,
                    },
                    {
                      name: 'Mingguan (Weekly)',
                      Aktual: 1650,
                      Target: Number(weeklyTargetAmount) || 2000,
                      Drawdown: 620,
                      BatasDD: Number(weeklyRiskPercent) || 1000,
                    },
                  ]}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(value) => [\`$\${value}\`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Aktual" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit Aktual ($)" />
                  <Bar dataKey="Target" fill="#6366f1" radius={[4, 4, 0, 0]} name="Target Profit ($)" />
                  <Bar dataKey="Drawdown" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Drawdown Aktual ($)" />
                  <Bar dataKey="BatasDD" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Batas Maks DD ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Interactive Target Alert Demonstrations (Kept so notifs work!) */}
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-gray-800">
              <div className="text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">
                Interactive Target Alert Demonstrations
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSimulateWin}
                  className="py-2 px-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 dark:bg-emerald-600/10 dark:hover:bg-emerald-600/20 dark:border-emerald-500/20 rounded-xl text-[9px] font-bold text-emerald-600 dark:text-emerald-400 transition"
                >
                  Simulate Profit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSimulateLoss}
                  className="py-2 px-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 dark:bg-rose-600/10 dark:hover:bg-rose-600/20 dark:border-rose-500/20 rounded-xl text-[9px] font-bold text-rose-600 dark:text-rose-400 transition"
                >
                  Simulate Drawdown
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleResetPL}
                  className="py-2 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-[#1B2132] dark:hover:bg-[#252E46] dark:border-gray-800 rounded-xl text-[9px] font-bold text-slate-700 dark:text-gray-300 transition"
                >
                  Reset Status
                </motion.button>
              </div>
            </div>
          </div>

          {/* DETAILED PAST TRADING SESSIONS TABLE (TRADE HISTORY) */}
          <div className="bg-white/95 dark:bg-[#121620] backdrop-blur-md border border-slate-200 dark:border-gray-800 rounded-3xl p-5 space-y-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-emerald-600" />
                  Riwayat Sesi Trading & Risiko
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Daftar transaksi dan sesi trading terakhir dengan persentase risiko.</p>
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-gray-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-gray-700">
                5 Sesi Terakhir
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-gray-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Tanggal / Sesi</th>
                    <th className="py-3 px-3">Simbol / Aset</th>
                    <th className="py-3 px-3">Profit / Loss (P/L)</th>
                    <th className="py-3 px-3">Risiko (%)</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-gray-800 font-medium">
                  <tr className="hover:bg-slate-50/80 dark:hover:bg-gray-800/40 transition">
                    <td className="py-3.5 px-3 text-slate-900 dark:text-white font-semibold">22 Jul 2026, 14:30</td>
                    <td className="py-3.5 px-3">
                      <span className="bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-gray-200 px-2 py-0.5 rounded font-bold text-[11px]">XAUUSD</span>
                    </td>
                    <td className="py-3.5 px-3 text-emerald-600 font-bold">+$340.00</td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-gray-400">1.2%</td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">Target Tercapai</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 dark:hover:bg-gray-800/40 transition">
                    <td className="py-3.5 px-3 text-slate-900 dark:text-white font-semibold">21 Jul 2026, 10:15</td>
                    <td className="py-3.5 px-3">
                      <span className="bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-gray-200 px-2 py-0.5 rounded font-bold text-[11px]">EURUSD</span>
                    </td>
                    <td className="py-3.5 px-3 text-emerald-600 font-bold">+$180.50</td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-gray-400">0.8%</td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">Profit Sesi</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 dark:hover:bg-gray-800/40 transition">
                    <td className="py-3.5 px-3 text-slate-900 dark:text-white font-semibold">20 Jul 2026, 19:45</td>
                    <td className="py-3.5 px-3">
                      <span className="bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-gray-200 px-2 py-0.5 rounded font-bold text-[11px]">GBPUSD</span>
                    </td>
                    <td className="py-3.5 px-3 text-rose-600 font-bold">-$120.00</td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-gray-400">1.5%</td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-200 dark:border-rose-800">Drawdown</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      `;
  
  code = code.substring(0, goalsStart) + newGoals + code.substring(ledgerStart);
  fs.writeFileSync('src/components/Journal.tsx', code);
  console.log('patched successfully');
} else {
  console.log('failed to find blocks');
}
