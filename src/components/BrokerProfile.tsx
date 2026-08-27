import React from 'react';
import { ArrowRight, ShieldCheck, Building2, Globe, FileText, ChevronLeft } from 'lucide-react';
import { MetaTraderLogo } from './MetaTraderLogo';

interface BrokerProfileProps {
  onBack: () => void;
  onContinue: () => void;
}

export const BrokerProfile: React.FC<BrokerProfileProps> = ({ onBack, onContinue }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <button 
        onClick={onBack}
        className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:text-white mb-2 flex items-center gap-1"
      >
        <ChevronLeft size={14} />
        Back to Brokers
      </button>

      <div className="bg-white dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-[86px] h-[86px] shrink-0 overflow-hidden bg-[#FE2C3C] rounded-2xl">
            <img src="/axi_logo.svg" alt="Axi Logo" className="w-full h-full object-cover block" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Axi (AxiTrader)</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Premium Partner</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Est. 2007</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Building2 size={14} />
              About Us
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Axi is a globally recognized online trading broker, providing access to top-tier liquidity and advanced trading tools. Built by traders for traders, Axi offers competitive spreads, fast execution, and a robust trading environment tailored for both beginners and experienced professionals.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#181D28] border border-gray-200 dark:border-gray-800/60 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-400">
                <Globe size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Headquarters</span>
              </div>
              <p className="text-xs text-gray-900 dark:text-white font-medium">Sydney, Australia</p>
            </div>
            <div className="bg-[#181D28] border border-gray-200 dark:border-gray-800/60 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-400">
                <FileText size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Regulation</span>
              </div>
              <p className="text-xs text-gray-900 dark:text-white font-medium">ASIC, FCA, DFSA</p>
            </div>
          </div>

          <div>
             <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck size={14} />
              Supported Platforms
            </h3>
            <div className="flex gap-3">
              <div className="flex-1 bg-[#181D28] border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <MetaTraderLogo variant="mt4" className="w-full h-full" />
                </div>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">MetaTrader 4</span>
              </div>
              <div className="flex-1 bg-[#181D28] border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <MetaTraderLogo variant="mt5" className="w-full h-full" />
                </div>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">MetaTrader 5</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onContinue}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 mt-4"
        >
          Connect with Axi
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
