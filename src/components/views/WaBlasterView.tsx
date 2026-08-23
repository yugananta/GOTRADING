import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Zap,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  QrCode,
  Paperclip,
  Users,
  Sliders,
  Check,
  XCircle,
  BarChart2,
  Copy,
  Search,
  Sparkles
} from 'lucide-react';
import { WaBlastCampaign } from '../../types';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface WaBlasterViewProps {
  campaigns: WaBlastCampaign[];
  onDispatchBlast: (
    campaign: Omit<
      WaBlastCampaign,
      'id' | 'createdAt' | 'sentCount' | 'deliveredCount' | 'failedCount' | 'status'
    >
  ) => void;
}

export const WaBlasterView: React.FC<WaBlasterViewProps> = ({
  campaigns,
  onDispatchBlast
}) => {
  const [campaignName, setCampaignName] = useState('');
  const [targetSegment, setTargetSegment] = useState('Trader Verified MT5');
  const [customRecipients, setCustomRecipients] = useState('');
  const [messageContent, setMessageContent] = useState(
    '🔥 *Sinyal Trading XAUUSD Today!*\nBuy @ 2420.50 | TP: 2435.00 | SL: 2412.00\n\nHalo {{name}}, akun MT5 #{{mt5_acc}} Anda berhak klaim *100% Deposit Bonus* hari ini. Hubungi IB Support Anda sekarang!'
  );
  const [mediaUrl, setMediaUrl] = useState('');
  const [delayPerMsg, setDelayPerMsg] = useState(4);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [showQrModal, setShowQrModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Target Segment estimated counts
  const segmentRecipientCounts: Record<string, number> = {
    'Semua Registered Users': 1540,
    'Trader Verified MT5': 480,
    'Sub-IB & Master IB Network': 185,
    'Active Depositors (Balance > $500)': 620,
    'Dormant Traders (>30 Hari)': 320,
    'Custom Numbers List': customRecipients
      ? customRecipients.split(',').filter(n => n.trim().length > 0).length
      : 0
  };

  const currentRecipientCount = segmentRecipientCounts[targetSegment] || 100;

  const handleInsertTag = (tag: string) => {
    setMessageContent(prev => prev + ' ' + tag);
  };

  const handleInsertFormat = (prefix: string, suffix: string) => {
    setMessageContent(prev => prev + ` ${prefix}teks${suffix}`);
  };

  const handleStartBlast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !messageContent.trim()) return;

    setIsSending(true);
    setSendProgress(0);

    const interval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSending(false);

          onDispatchBlast({
            campaignName,
            targetSegment,
            totalRecipients: currentRecipientCount,
            messageContent,
            mediaUrl: mediaUrl || undefined,
            delayPerMsgSeconds: delayPerMsg
          });

          setCampaignName('');
          setMessageContent('');
          setMediaUrl('');
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  const filteredCampaigns = campaigns.filter(
    c =>
      c.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.targetSegment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Gateway Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> WHATSAPP BLASTER (DIRECT MARKETING GATEWAY)
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400" /> HIGH DELIVERABILITY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kirim pesan promosi, sinyal trading, pendaftaran bonus, dan re-engagement otomatis langsung ke nomor WhatsApp trader secara cepat dan aman.
          </p>
        </div>

        {/* WA Gateway Status Badge */}
        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <span className="text-white font-bold block">WA Gateway Connected</span>
              <span className="text-[10px] text-slate-400">+62 821-8888-9900 (Business API)</span>
            </div>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" /> Pairing QR
          </button>
        </div>
      </div>

      {/* Main Form & Live Mobile Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campaign Composer Form (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" /> Buat WA Blast Campaign Baru
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Anti-Ban Throttling Enabled</span>
          </div>

          <form onSubmit={handleStartBlast} className="space-y-4 text-xs">
            {/* Campaign Name */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                NAMA CAMPAIGN BLAST <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder="Contoh: Promo Bonus Deposit 100% Weekend Special"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Target Segment */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                TARGET RECIPIENTS / SEGMENT AUDIENS
              </label>
              <select
                value={targetSegment}
                onChange={e => setTargetSegment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Trader Verified MT5">Trader Verified MT5 (~480 Kontak)</option>
                <option value="Semua Registered Users">Semua Registered Users (~1,540 Kontak)</option>
                <option value="Sub-IB & Master IB Network">Sub-IB &amp; Master IB Network (~185 Kontak)</option>
                <option value="Active Depositors (Balance > $500)">Active Depositors (Balance &gt; $500) (~620 Kontak)</option>
                <option value="Dormant Traders (>30 Hari)">Dormant Traders (&gt;30 Hari Inaktif) (~320 Kontak)</option>
                <option value="Custom Numbers List">Custom Phone Numbers (CSV / Manual)</option>
              </select>
            </div>

            {targetSegment === 'Custom Numbers List' && (
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  DAFTAR NOMOR WHATSAPP (Pisahkan dengan Koma)
                </label>
                <textarea
                  rows={2}
                  value={customRecipients}
                  onChange={e => setCustomRecipients(e.target.value)}
                  placeholder="+628123456789, +6282199887766, +6285711223344"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Message Composer Tools */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">
                  PESAN WHATSAPP <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-slate-400">Gunakan Format WhatsApp (*bold*, _italic_)</span>
              </div>

              {/* Formatting Helper Buttons */}
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 border border-b-0 border-slate-800 rounded-t-xl">
                <button
                  type="button"
                  onClick={() => handleInsertFormat('*', '*')}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold"
                  title="Bold"
                >
                  *Bold*
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertFormat('_', '_')}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] italic"
                  title="Italic"
                >
                  _Italic_
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertFormat('~', '~')}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] line-through"
                  title="Strikethrough"
                >
                  ~Strike~
                </button>

                <div className="w-px h-4 bg-slate-800 my-auto mx-1" />

                {/* Dynamic Personalization Variables */}
                <button
                  type="button"
                  onClick={() => handleInsertTag('{{name}}')}
                  className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono font-bold hover:bg-emerald-500/30"
                >
                  + &#123;&#123;name&#125;&#123;
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('{{mt5_acc}}')}
                  className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono font-bold hover:bg-emerald-500/30"
                >
                  + &#123;&#123;mt5_acc&#125;&#123;
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('{{city}}')}
                  className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono font-bold hover:bg-emerald-500/30"
                >
                  + &#123;&#123;city&#125;&#123;
                </button>
              </div>

              <textarea
                rows={5}
                required
                value={messageContent}
                onChange={e => setMessageContent(e.target.value)}
                placeholder="Tuliskan isi pesan WA Blast Anda di sini..."
                className="w-full bg-slate-950 border border-slate-800 rounded-b-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
              />
            </div>

            {/* Media Attachment URL */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" /> ATTACHMENT MEDIA URL (Gambar / Chart PDF Optional)
              </label>
              <input
                type="url"
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Throttle Settings */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> Delay Jeda Antar Pesan:
              </span>
              <div className="flex items-center gap-2">
                {[2, 4, 6, 8].map(sec => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDelayPerMsg(sec)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      delayPerMsg === sec
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Sending Progress Bar (if active) */}
            {isSending && (
              <div className="space-y-1.5 p-3 bg-slate-950 border border-emerald-500/40 rounded-xl">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> DISPATCHING WHATSAPP BLAST...
                  </span>
                  <span className="text-white font-bold">{sendProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${sendProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Dispatch Button */}
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              LUNCURKAN WA BLAST KE {currentRecipientCount} KONTAK
            </button>
          </form>
        </div>

        {/* Live Mobile Screen Preview (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" /> Tampilan Mobile Device WhatsApp Trader
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                Live Chat Bubble
              </span>
            </div>

            {/* Simulated Phone Screen */}
            <div className="max-w-xs mx-auto bg-slate-950 rounded-3xl border-4 border-slate-800 p-3 shadow-2xl relative">
              {/* Phone Notch */}
              <div className="w-20 h-3 bg-slate-800 rounded-b-xl mx-auto mb-2" />

              {/* Chat Screen Header */}
              <div className="bg-emerald-900/60 p-2.5 rounded-t-xl flex items-center gap-2 border-b border-emerald-800/40">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-xs">
                  AT
                </div>
                <div>
                  <span className="text-white font-bold text-xs block leading-tight">ApexTrader Official</span>
                  <span className="text-[9px] text-emerald-300 font-mono">Official Verified Business</span>
                </div>
              </div>

              {/* Chat Body */}
              <div className="bg-[#0b141a] p-3 rounded-b-xl min-h-[320px] space-y-2 text-xs">
                {/* Media Attachment Card (if present) */}
                {mediaUrl && (
                  <div className="bg-[#202c33] rounded-lg overflow-hidden border border-slate-700/50 max-w-[90%] ml-auto">
                    <img
                      src={mediaUrl}
                      alt="Attachment Preview"
                      className="w-full h-32 object-cover"
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Message Bubble */}
                <div className="bg-[#005c4b] text-slate-100 p-3 rounded-2xl rounded-tr-none max-w-[92%] ml-auto shadow-md space-y-1 text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
                  {messageContent || 'Ketikkan isi pesan WA Blast untuk melihat simulasi visual...'}
                  <div className="text-[9px] text-emerald-200/80 text-right font-mono mt-1 flex items-center justify-end gap-1">
                    <span>12:45</span>
                    <span className="text-sky-300">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
            <span className="text-emerald-400 font-bold block text-xs">
              💡 Karakteristik Personalization WA Blast:
            </span>
            <p>
              Setiap pesan akan diganti secara otomatis dengan nama asli user (misal: <span className="text-white font-bold">David Chen</span>) dan akun MT5 (misal: <span className="text-white font-bold">#3301928</span>) untuk meningkatkan rasio baca (Open Rate &gt; 92%).
            </p>
          </div>
        </div>
      </div>

      {/* Campaign History & Statistics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" /> Riwayat WhatsApp Blast Campaigns
            </h3>
            <span className="text-xs text-slate-400">Daftar blast yang pernah dikirimkan beserta performa deliverability</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari campaign WA blast..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px]">
              <tr>
                <th className="p-3">CAMPAIGN ID &amp; NAMA</th>
                <th className="p-3">TARGET SEGMENT</th>
                <th className="p-3">TOTAL KONTAK</th>
                <th className="p-3">TERKIRIM (DELIVERED)</th>
                <th className="p-3">GAGAL (FAILED)</th>
                <th className="p-3">THROTTLE DELAY</th>
                <th className="p-3">WAKTU EKSEKUSI</th>
                <th className="p-3 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredCampaigns.map(camp => {
                const deliverabilityPct = Math.round((camp.deliveredCount / camp.totalRecipients) * 100);

                return (
                  <tr key={camp.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        {camp.campaignName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {camp.id}</div>
                    </td>

                    <td className="p-3 text-slate-300">{camp.targetSegment}</td>

                    <td className="p-3 font-bold text-white">{camp.totalRecipients} Kontak</td>

                    <td className="p-3 text-emerald-400 font-bold">
                      {camp.deliveredCount} ({deliverabilityPct}%)
                    </td>

                    <td className="p-3 text-rose-400 font-bold">{camp.failedCount}</td>

                    <td className="p-3 text-slate-400">{camp.delayPerMsgSeconds}s / msg</td>

                    <td className="p-3 text-slate-400">{camp.createdAt}</td>

                    <td className="p-3 text-center">
                      <Badge variant={camp.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {camp.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Pairing Modal */}
      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Pairing WhatsApp Business Gateway API"
      >
        <div className="space-y-4 text-center py-2">
          <p className="text-xs text-slate-400">
            Buka aplikasi WhatsApp Business di HP Anda &gt; Tiga Titik Menu &gt; Linked Devices &gt; Scan QR Code di bawah ini.
          </p>

          <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center shadow-xl border-4 border-emerald-500/30">
            {/* Mock QR graphic */}
            <div className="w-full h-full bg-slate-900 rounded-xl p-2 flex flex-col justify-between items-center text-emerald-400 font-mono text-[10px]">
              <QrCode className="w-32 h-32 text-white my-auto animate-pulse" />
              <span>SCAN WITH WA BUSINESS</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono">
            Status: <span className="text-emerald-400 font-bold">SESSION ACTIVE (+62 821-8888-9900)</span>
          </div>

          <button
            onClick={() => setShowQrModal(false)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
          >
            Tutup
          </button>
        </div>
      </Modal>
    </div>
  );
};
