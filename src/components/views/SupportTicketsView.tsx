import React, { useState } from 'react';
import { Headphones, Send, User, Shield, MessageSquare } from 'lucide-react';
import { SupportTicket } from '../../types';
import { Badge } from '../ui/Badge';

interface SupportTicketsViewProps {
  tickets: SupportTicket[];
  onReply: (ticketId: string, text: string, isInternal?: boolean) => void;
}

export const SupportTicketsView: React.FC<SupportTicketsViewProps> = ({ tickets, onReply }) => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(tickets[0] || null);
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTicket && replyText.trim()) {
      onReply(selectedTicket.id, replyText, isInternal);
      setReplyText('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Headphones className="w-5 h-5 text-sky-400" /> Support Desk & Customer Tickets
        </h2>
        <p className="text-xs text-slate-400">Respond to trader inquiries, assign staff, and log internal team notes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="space-y-2">
          {tickets.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTicket(t)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                selectedTicket?.id === t.id
                  ? 'bg-slate-900 border-emerald-500/50 shadow-lg'
                  : 'bg-slate-950 border-slate-800/80 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-xs truncate">{t.subject}</span>
                <Badge variant={t.priority === 'HIGH' ? 'danger' : 'info'}>{t.priority}</Badge>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{t.userName} • ID: {t.id}</p>
            </button>
          ))}
        </div>

        {/* Ticket Chat View */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[520px]">
          {selectedTicket ? (
            <>
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedTicket.subject}</h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Category: {selectedTicket.category} • Staff: {selectedTicket.assignedStaff || 'Unassigned'}
                  </span>
                </div>
                <Badge variant={selectedTicket.status === 'OPEN' ? 'warning' : 'success'}>
                  {selectedTicket.status}
                </Badge>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-2 custom-scrollbar text-xs">
                {selectedTicket.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg max-w-lg ${
                      msg.sender === 'USER'
                        ? 'bg-slate-950 border border-slate-800 text-slate-200 ml-auto'
                        : msg.isInternalNote
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                        : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] opacity-75 mb-1">
                      <span>{msg.senderName} {msg.isInternalNote && '(INTERNAL STAFF NOTE)'}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSend} className="space-y-2 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={e => setIsInternal(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                    />
                    <span className="font-mono text-[11px]">Add as Private Internal Note (Hidden from User)</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your response or internal note..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Reply
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="m-auto text-slate-500 text-xs">Select a ticket to view messages</div>
          )}
        </div>
      </div>
    </div>
  );
};
