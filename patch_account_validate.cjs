const fs = require('fs');

let content = fs.readFileSync('src/components/Account.tsx', 'utf8');

// We need to add state for Validation
const importRegex = /import React, { useState, useEffect } from 'react';/;
// Just append the state inside the component

// First, add new state variables
const stateToAdd = `
  const [showValidationForm, setShowValidationForm] = useState(false);
  const [valEmail, setValEmail] = useState('');
  const [valAccountNo, setValAccountNo] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [valError, setValError] = useState('');
`;

content = content.replace(/(const \[showConnectForm, setShowConnectForm\] = useState\(false\);)/, `$1\n${stateToAdd}`);

// Add handleValidate method
const handleValidateMethod = `
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setValError('');
    
    // Simulate validation request
    await new Promise(r => setTimeout(r, 1500));
    
    // In a real app we'd call an endpoint. For now, simulate:
    try {
      // If we pretend they are unverified under Tarapti, we throw an error so they can register.
      // But let's let them pass if they enter an email that matches their own, or something?
      // Actually, let's just make it always fail the first time to show the partner link, or maybe just succeed?
      // The prompt says: "Apabila status unverified under group Tarapti, maka user diarahkan untuk buat akun dl di broker partner Tarapt"
      // This means if validation fails (e.g. not in the group), they must register.
      
      if (valAccountNo.length < 5) {
        setValError('Account not found in IB Tarapti network. Please register a new account with our partner broker first.');
        return;
      }
      
      const res = await apiFetch(\`/api/users/profile/\${currentUser?.id}\`, {
        method: 'PUT',
        body: JSON.stringify({ isVerified: true })
      });
      if (res.ok) {
        if (setCurrentUser && currentUser) {
          setCurrentUser({ ...currentUser, isVerified: true });
        }
        setShowValidationForm(false);
        setShowConnectForm(true);
      } else {
        setValError('Validation failed. Please try again.');
      }
    } catch (err) {
      setValError('Network error during validation.');
    } finally {
      setIsValidating(false);
    }
  };
`;

content = content.replace(/(const handleConnect = async)/, `${handleValidateMethod}\n  $1`);

// Add renderValidationForm
const renderValidationFormMethod = `
  const renderValidationForm = () => (
    <div className="bg-[#EFF2F6]/90 backdrop-blur-md border border-[#E2E8F0] rounded-3xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/15 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="relative z-10 mb-4">
        <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          IB Tarapti Validation
        </h2>
        <p className="text-[10px] text-slate-700 leading-relaxed mt-1">
          Verify registration status in the IB Tarapti network before connecting.
        </p>
      </div>

      {valError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2 text-rose-600 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>{valError}</p>
          </div>
          {valError.includes('register') && (
            <a href="https://www.axi.com" target="_blank" rel="noreferrer" className="inline-block px-3 py-2 bg-rose-600 text-white rounded-lg text-center font-bold shadow-sm mt-1">
              Create Account at Partner Broker Tarapti
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleValidate} className="space-y-3 relative z-10">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Registered Email *
          </label>
          <input
            type="email"
            value={valEmail}
            onChange={(e) => setValEmail(e.target.value)}
            placeholder="Enter Registered Email"
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            Account No *
          </label>
          <input
            type="text"
            value={valAccountNo}
            onChange={(e) => setValAccountNo(e.target.value)}
            placeholder="Enter Account Number (e.g., 5123456)"
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            required
          />
        </div>

        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setShowValidationForm(false); setValError(''); }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isValidating}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white text-xs font-black rounded-xl transition shadow-sm shadow-indigo-600/15 flex justify-center items-center gap-2 cursor-pointer"
          >
            {isValidating ? (
              <><div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"/> Validating Account...</>
            ) : (
              <><ShieldCheck size={14} /> Validate Account</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
`;

content = content.replace(/(const renderConnectForm = \(\) => \()/, `${renderValidationFormMethod}\n  $1`);

// Update main render block to show Validation Form
// Replace the button handler for "Connect MT5 Account" and add logic for showing Validation Form
const renderLogic = `
          {account ? (
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
          )}
`;

// we need to replace exactly the block inside the fade-in div
const originalRenderLogic = `{account ? (
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

content = content.replace(originalRenderLogic, renderLogic);

fs.writeFileSync('src/components/Account.tsx', content);
