import React, { useState, useEffect } from 'react';
import { Search, X, Users, CreditCard, Headphones, KeyRound } from 'lucide-react';
import { UserProfile, TradingAccount, SupportTicket, ApiCredential } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  accounts: TradingAccount[];
  tickets: SupportTicket[];
  credentials: ApiCredential[];
  onSelectUser: (user: UserProfile) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  users,
  accounts,
  tickets,
  credentials,
  onSelectUser
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const matchedUsers = query ? users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()) || u.id.toLowerCase().includes(query.toLowerCase())) : [];
  const matchedAccounts = query ? accounts.filter(a => a.accountNumber.includes(query) || a.userName.toLowerCase().includes(query.toLowerCase())) : [];
  const matchedTickets = query ? tickets.filter(t => t.subject.toLowerCase().includes(query.toLowerCase()) || t.id.toLowerCase().includes(query.toLowerCase())) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950">
          <Search className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Global search across users, accounts, tickets, API keys..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
          {!query && (
            <div className="text-center text-slate-500 py-8 font-mono">
              Type to search across 28 admin modules...
            </div>
          )}

          {matchedUsers.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" /> Users ({matchedUsers.length})
              </div>
              <div className="space-y-1">
                {matchedUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded hover:bg-slate-800 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="font-bold text-white block">{u.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                    </div>
                    <span className="font-mono text-emerald-400">{u.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedAccounts.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-sky-400" /> Trading Accounts ({matchedAccounts.length})
              </div>
              <div className="space-y-1">
                {matchedAccounts.map(a => (
                  <div key={a.id} className="p-2 rounded bg-slate-950 flex items-center justify-between font-mono">
                    <span className="text-white font-bold">{a.accountNumber} ({a.broker})</span>
                    <span className="text-emerald-400">${a.balance.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
