import React from 'react';
import { Megaphone, Plus, Gift, Award, DollarSign } from 'lucide-react';
import { Campaign } from '../../types';
import { Badge } from '../ui/Badge';

interface CampaignsViewProps {
  campaigns: Campaign[];
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({ campaigns }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" /> Marketing Campaigns & Promotions
          </h2>
          <p className="text-xs text-slate-400">Manage deposit bonuses, promotional rewards, and referral programs</p>
        </div>

        <button className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-colors">
          <Plus className="w-4 h-4" /> Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map(c => (
          <div key={c.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{c.name}</span>
              <Badge variant="success">{c.status}</Badge>
            </div>

            <p className="text-xs text-slate-300">{c.description}</p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-3 rounded border border-slate-800">
              <div>
                <span className="text-slate-500 block">REQUIREMENT:</span>
                <span className="text-white font-semibold">{c.requirement}</span>
              </div>
              <div>
                <span className="text-slate-500 block">REWARD:</span>
                <span className="text-emerald-400 font-bold">{c.reward}</span>
              </div>
              <div>
                <span className="text-slate-500 block">BUDGET CLAIMED:</span>
                <span className="text-amber-400 font-bold">${c.claimedUsd.toLocaleString()} / ${c.budgetUsd.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">PARTICIPANTS:</span>
                <span className="text-white font-bold">{c.participantsCount} Traders</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
