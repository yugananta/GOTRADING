const fs = require('fs');

let content = fs.readFileSync('src/components/Account.tsx', 'utf8');

// 1. Remove validation states
content = content.replace(/  const \[showValidationForm, setShowValidationForm\] = useState\(false\);\n/g, '');
content = content.replace(/  const \[valEmail, setValEmail\] = useState\(''\);\n/g, '');
content = content.replace(/  const \[valAccountNo, setValAccountNo\] = useState\(''\);\n/g, '');
content = content.replace(/  const \[isValidating, setIsValidating\] = useState\(false\);\n/g, '');
content = content.replace(/  const \[valError, setValError\] = useState\(''\);\n/g, '');

// 2. Remove handleValidate
content = content.replace(/  const handleValidate = async \(e: React\.FormEvent\) => \{[\s\S]*?^\s*\};\n/m, '');

// 3. Update handleConnect
const oldHandleConnect = `  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsConnecting(true);

    try {
      const res = await apiFetch('/api/metatrader/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          login, 
          password, 
          server: server === 'Other' ? customServer : server, 
          broker: broker === 'Other' ? customBroker : broker 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAccount(data.account);
        setTrades(data.trades);
        setShowConnectForm(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to connect account');
      }
    } catch (err) {
      setError('Network error connecting account');
    } finally {
      setIsConnecting(false);
    }
  };`;

const newHandleConnect = `  const [connectStepText, setConnectStepText] = useState('Connecting...');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsConnecting(true);
    setConnectStepText('Validating Account...');

    try {
      // Simulate backend validation delay
      await new Promise(r => setTimeout(r, 1500));

      if (!currentUser?.isVerified) {
         setError('Unverified account. Your account is not registered under Tarapti Group.');
         setIsConnecting(false);
         return;
      }

      setConnectStepText('Connecting to MT5...');

      const res = await apiFetch('/api/metatrader/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          login, 
          password, 
          server: server === 'Other' ? customServer : server, 
          broker: broker === 'Other' ? customBroker : broker 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAccount(data.account);
        setTrades(data.trades);
        setShowConnectForm(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to connect account');
      }
    } catch (err) {
      setError('Network error connecting account');
    } finally {
      setIsConnecting(false);
    }
  };`;

content = content.replace(oldHandleConnect, newHandleConnect);

// 4. Update the renderConnectForm submit button
content = content.replace(
  /<div className="w-3 h-3 border-2 border-white\/20 border-t-white rounded-full animate-spin"\/> Connecting\.\.\.<\/>/,
  `<div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"/> {connectStepText}</>`
);

// 5. Update the Error display to include link to partner broker if it matches unverified error
const oldErrorDisplay = `      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-600 text-xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}`;

const newErrorDisplay = `      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2 text-rose-600 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
          {error.includes('registered') && (
            <a href="https://www.axi.com" target="_blank" rel="noreferrer" className="inline-block px-3 py-2 bg-rose-600 text-white rounded-lg text-center font-bold shadow-sm mt-1">
              Create Account at Partner Broker Tarapti
            </a>
          )}
        </div>
      )}`;

content = content.replace(oldErrorDisplay, newErrorDisplay);

// 6. Remove renderValidationForm
content = content.replace(/  const renderValidationForm = \(\) => \([\s\S]*?^\s*\);\n/m, '');

// 7. Revert the main render logic
const oldMainRenderLogic = `          {account ? (
            renderConnectedOverview()
          ) : (
            showValidationForm ? (
              renderValidationForm()
            ) : showConnectForm ? (
              renderConnectForm()
            ) : (
              <div className="bg-[#EFF2F6]/90 backdrop-blur-md border border-[#E2E8F0] rounded-3xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                   <img src="/mt5-logo.png" alt="MT5" className="h-10 w-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <h2 className="text-base font-black text-slate-900 tracking-tight mb-2">No Broker Connected</h2>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-[280px] mb-6">
                  {!currentUser?.isVerified 
                    ? "Connect your MetaTrader 5 account to view your balance, equity, and recent trades directly in the app. You must validate your account first." 
                    : "Connect your MetaTrader 5 account to view your balance, equity, and recent trades directly in the app."}
                </p>
                <button
                  onClick={() => {
                    if (currentUser?.isVerified) {
                      setShowConnectForm(true);
                    } else {
                      setShowValidationForm(true);
                      setValEmail(currentUser?.email || '');
                    }
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-sm shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LinkIcon size={14} /> {currentUser?.isVerified ? "Connect MT5 Account" : "Validate Account"}
                </button>
              </div>
            )
          )}`;

const newMainRenderLogic = `          {account ? (
            renderConnectedOverview()
          ) : (
            showConnectForm ? (
              renderConnectForm()
            ) : (
              <div className="bg-[#EFF2F6]/90 backdrop-blur-md border border-[#E2E8F0] rounded-3xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                   <img src="/mt5-logo.png" alt="MT5" className="h-10 w-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <h2 className="text-base font-black text-slate-900 tracking-tight mb-2">No Broker Connected</h2>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-[280px] mb-6">
                  Connect your MetaTrader 5 account to view your balance, equity, and recent trades directly in the app.
                </p>
                <button
                  onClick={() => setShowConnectForm(true)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-sm shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LinkIcon size={14} /> Connect MT5 Account
                </button>
              </div>
            )
          )}`;

content = content.replace(oldMainRenderLogic, newMainRenderLogic);

fs.writeFileSync('src/components/Account.tsx', content);
