const fs = require('fs');

let content = fs.readFileSync('src/components/Account.tsx', 'utf8');

// 1. Add BROKERS constant outside component
const brokersConst = `
const BROKERS: Record<string, string[]> = {
  'Axi': ['Axi-Demo', 'Axi-Live', 'Axi-Live 2', 'Axi-Live 3', 'Axi-Live 4'],
  'Exness': ['Exness-MT5Trial', 'Exness-MT5Trial2', 'Exness-MT5Real', 'Exness-MT5Real2', 'Exness-MT5Real3', 'Exness-MT5Real4', 'Exness-MT5Real5'],
  'IC Markets': ['ICMarketsSC-MT5', 'ICMarketsSC-MT5-2', 'ICMarketsSC-MT5-3'],
  'FBS': ['FBS-Demo', 'FBS-Real'],
  'OctaFX': ['OctaFX-Demo', 'OctaFX-Real'],
  'Pepperstone': ['Pepperstone-Demo', 'Pepperstone-Edge01', 'Pepperstone-Edge02'],
  'Other': []
};
`;
content = content.replace(/export const Account: React\.FC = \(\) => \{/, brokersConst + '\nexport const Account: React.FC = () => {');

// 2. Add customBroker and customServer states
const customStates = `
  const [customBroker, setCustomBroker] = useState('');
  const [customServer, setCustomServer] = useState('');
`;
content = content.replace(/(const \[broker, setBroker\] = useState\(''\);)/, `$1${customStates}`);

// 3. Update handleConnect payload
content = content.replace(/body: JSON\.stringify\(\{ login, password, server, broker \}\),/, 
  `body: JSON.stringify({ 
          login, 
          password, 
          server: server === 'Other' ? customServer : server, 
          broker: broker === 'Other' ? customBroker : broker 
        }),`);

// 4. Update renderConnectForm inputs
const oldInputs = `        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Login (Account Number)
          </label>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="e.g. 12345678"
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
              Investor Password
            </label>
            <span className="text-[8px] text-indigo-500 uppercase font-bold tracking-wider flex items-center gap-1"><Lock size={8}/> Read Only</span>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your MT5 investor password"
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            required
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Server
          </label>
          <input
            type="text"
            value={server}
            onChange={(e) => setServer(e.target.value)}
            placeholder="e.g. Exness-MT5Real"
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Broker (Optional)
          </label>
          <input
            type="text"
            value={broker}
            onChange={(e) => setBroker(e.target.value)}
            placeholder="e.g. Exness"
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
          />
        </div>`;

const newInputs = `        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Broker *
          </label>
          <select
            value={broker}
            onChange={(e) => {
              setBroker(e.target.value);
              setServer('');
              setCustomBroker('');
              setCustomServer('');
            }}
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none focus:border-indigo-500 transition shadow-sm"
            required
          >
            <option value="" disabled>Select Broker</option>
            {Object.keys(BROKERS).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {broker === 'Other' && (
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
              Broker Name *
            </label>
            <input
              type="text"
              value={customBroker}
              onChange={(e) => setCustomBroker(e.target.value)}
              placeholder="Enter your broker name"
              className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
              required
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Server *
          </label>
          {broker && broker !== 'Other' && BROKERS[broker].length > 0 ? (
            <div className="space-y-2">
              <select
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none focus:border-indigo-500 transition shadow-sm"
                required
              >
                <option value="" disabled>Select Server</option>
                {BROKERS[broker].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Other">Other (Manual Entry)</option>
              </select>
              {server === 'Other' && (
                 <input
                   type="text"
                   value={customServer}
                   onChange={(e) => setCustomServer(e.target.value)}
                   placeholder="Enter server name manually"
                   className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
                   required
                 />
              )}
            </div>
          ) : (
             <input
               type="text"
               value={server}
               onChange={(e) => setServer(e.target.value)}
               placeholder="e.g. Exness-MT5Real"
               className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
               required={broker === 'Other' || (broker && BROKERS[broker]?.length === 0)}
             />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Login (Account Number)
          </label>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="e.g. 12345678"
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
              Investor Password
            </label>
            <span className="text-[8px] text-indigo-500 uppercase font-bold tracking-wider flex items-center gap-1"><Lock size={8}/> Read Only</span>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your MT5 investor password"
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            required
          />
        </div>`;

content = content.replace(oldInputs, newInputs);

fs.writeFileSync('src/components/Account.tsx', content);
