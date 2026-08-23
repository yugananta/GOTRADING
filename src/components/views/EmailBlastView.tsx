import React, { useState } from 'react';
import {
  Mail,
  Send,
  Sparkles,
  Server,
  BarChart2,
  CheckCircle2,
  Eye,
  MousePointer,
  AlertOctagon,
  Users,
  Search,
  FileText,
  Copy,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { EmailBlastCampaign } from '../../types';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface EmailBlastViewProps {
  campaigns: EmailBlastCampaign[];
  onDispatchBlast: (
    campaign: Omit<
      EmailBlastCampaign,
      'id' | 'createdAt' | 'sentCount' | 'openedCount' | 'clickedCount' | 'bounceCount' | 'status'
    >
  ) => void;
}

export const EmailBlastView: React.FC<EmailBlastViewProps> = ({
  campaigns,
  onDispatchBlast
}) => {
  const [subject, setSubject] = useState(
    '📊 Market Outlook & Sinyal Trading Mingguan Gold (XAU/USD)'
  );
  const [previewText, setPreviewText] = useState(
    'Simak analisa pergerakan harga Gold dan rilis data NFP minggu ini.'
  );
  const [templateName, setTemplateName] = useState('Weekly Signal Roundup');
  const [targetSegment, setTargetSegment] = useState('Semua Registered Users');
  const [senderName, setSenderName] = useState('ApexTrader Market Desk');
  const [senderEmail, setSenderEmail] = useState('marketing@apextrader.io');
  const [emailBody, setEmailBody] = useState(
    `<h2 style="color: #10b981;">Halo {{user_name}},</h2>
<p>Berikut adalah ringkasan analisa teknikal dan fundamental pasar minggu ini untuk pasangan mata uang dan komoditas utama:</p>

<div style="background-color: #0f172a; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; color: #ffffff; margin: 15px 0;">
  <strong>Sinyal Trading Emas (XAUUSD):</strong><br/>
  • Bias: <em>Bullish Continuation</em><br/>
  • Buy Zone: $2,415.00 - $2,420.00<br/>
  • Take Profit Target: $2,438.00 / $2,450.00<br/>
  • Stop Loss: $2,405.00
</div>

<p>Pastikan ketahanan margin dan equity akun MT5 <strong>#{{mt5_account}}</strong> Anda mencukupi sebelum mengeksekusi lot posisi.</p>

<p style="text-align: center; margin-top: 25px;">
  <a href="https://apextrader.io/trading-portal" style="background-color: #10b981; color: #020617; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">BUKA TRADING PORTAL AKUN Anda &rarr;</a>
</p>`
  );

  const [activePreviewTab, setActivePreviewTab] = useState<'EDITOR' | 'PREVIEW'>('EDITOR');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('gotrading.id@gmail.com');
  const [testSentToast, setTestSentToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Segment Counts
  const segmentRecipientCounts: Record<string, number> = {
    'Semua Registered Users': 1540,
    'Trader Verified MT5': 480,
    'Sub-IB & Partner Network': 185,
    'High Risk Traders (Drawdown > 5%)': 45,
    'Dormant Accounts (>30 Hari Inaktif)': 320,
    'VIP Traders (Balance > $10,000)': 95
  };

  const currentRecipientCount = segmentRecipientCounts[targetSegment] || 250;

  const handleSelectTemplate = (tmpl: string) => {
    setTemplateName(tmpl);

    if (tmpl === 'Weekly Signal Roundup') {
      setSubject('📊 Market Outlook & Sinyal Trading Mingguan Gold (XAU/USD)');
      setPreviewText('Simak analisa pergerakan harga Gold dan rilis data NFP minggu ini.');
    } else if (tmpl === 'Deposit Bonus Promo') {
      setSubject('🎁 Promo Spesial 100% Deposit Bonus Weekend Rewards');
      setPreviewText('Dapatkan tambahan kredit modal trading hingga $1,000.');
    } else if (tmpl === 'Risk Health Alert') {
      setSubject('⚠️ Peringatan Penting: Evaluasi Margin & Drawdown Trading Anda');
      setPreviewText('Mohon tinjau ulang alokasi lot dan margin akun trading MT5 Anda.');
    } else if (tmpl === 'IB Commission Statement') {
      setSubject('🎉 Payout Komisi IB Bulan Ini Telah Ditingkatkan');
      setPreviewText('Cek estimasi komisi dan jaringan sub-IB Anda bulan ini.');
    }
  };

  const handleInsertTag = (tag: string) => {
    setEmailBody(prev => prev + ` ${tag}`);
  };

  const handleStartBlast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !emailBody.trim()) return;

    setIsSending(true);
    setSendProgress(0);

    const interval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSending(false);

          onDispatchBlast({
            subject,
            templateName,
            targetSegment,
            totalRecipients: currentRecipientCount,
            senderName,
            senderEmail,
            previewText
          });

          return 100;
        }
        return prev + 25;
      });
    }, 350);
  };

  const handleSendTestEmail = () => {
    setTestSentToast(true);
    setTimeout(() => {
      setTestSentToast(false);
      setShowTestModal(false);
    }, 1500);
  };

  const filteredCampaigns = campaigns.filter(
    c =>
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.targetSegment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Gateway Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Mail className="w-5 h-5 text-sky-400" /> EMAIL BLAST &amp; NEWSLETTER MARKETING
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1">
              <Server className="w-3 h-3 text-sky-400" /> AWS SES / SENDGRID CONNECTED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kirimkan email newsletter, edukasi harian, pemberitahuan bonus deposit, dan statement komisi ke ribuan trader terdaftar dengan HTML template profesional.
          </p>
        </div>

        {/* ESP Server Status */}
        <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] block">SMTP GATEWAY STATUS</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> High Rep (99.8% Inbox Rate)
            </span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-slate-400 text-[10px] block">DAILY QUOTA</span>
            <span className="text-white font-bold">1,540 / 50,000 Emails</span>
          </div>
        </div>
      </div>

      {/* Editor & HTML Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Email Creator Form (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" /> Buat Email Blast Campaign Baru
            </h3>
            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700"
            >
              Send Test Email
            </button>
          </div>

          <form onSubmit={handleStartBlast} className="space-y-4 text-xs">
            {/* Template Selector */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                PILIH PRE-DESIGNED TEMPLATE EMAIL
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                {[
                  'Weekly Signal Roundup',
                  'Deposit Bonus Promo',
                  'Risk Health Alert',
                  'IB Commission Statement'
                ].map(tmpl => (
                  <button
                    key={tmpl}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-2.5 rounded-xl border text-[11px] text-left transition-all ${
                      templateName === tmpl
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Segment & Sender Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  TARGET SEGMENT AUDIENS
                </label>
                <select
                  value={targetSegment}
                  onChange={e => setTargetSegment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Semua Registered Users">Semua Registered Users (~1,540 Email)</option>
                  <option value="Trader Verified MT5">Trader Verified MT5 (~480 Email)</option>
                  <option value="Sub-IB & Partner Network">Sub-IB &amp; Partner Network (~185 Email)</option>
                  <option value="High Risk Traders (Drawdown > 5%)">High Risk Traders (Drawdown &gt; 5%) (~45 Email)</option>
                  <option value="Dormant Accounts (>30 Hari Inaktif)">Dormant Accounts (&gt;30 Hari Inaktif) (~320 Email)</option>
                  <option value="VIP Traders (Balance > $10,000)">VIP Traders (Balance &gt; $10,000) (~95 Email)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  SENDER IDENTITY (FROM NAME)
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Email Subject */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                EMAIL SUBJECT LINE <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Contoh: 📊 Market Outlook & Sinyal Trading Gold..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Preview Text */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                PREVIEW TEXT (SUB-HEADER DI INBOX EMAIL)
              </label>
              <input
                type="text"
                value={previewText}
                onChange={e => setPreviewText(e.target.value)}
                placeholder="Teks ringkas yang muncul setelah subject di Gmail/Outlook..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Email Body Editor & Variable Insertion */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">
                  KONTEN EMAIL (HTML / RICH TEXT)
                </label>

                {/* Variable chips */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleInsertTag('{{user_name}}')}
                    className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded text-[10px] font-mono font-bold hover:bg-sky-500/30"
                  >
                    + &#123;&#123;user_name&#125;&#123;
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag('{{mt5_account}}')}
                    className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded text-[10px] font-mono font-bold hover:bg-sky-500/30"
                  >
                    + &#123;&#123;mt5_account&#125;&#123;
                  </button>
                </div>
              </div>

              <textarea
                rows={8}
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-sky-500 leading-relaxed"
              />
            </div>

            {/* Sending Progress Bar (if active) */}
            {isSending && (
              <div className="space-y-1.5 p-3 bg-slate-950 border border-sky-500/40 rounded-xl">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-sky-400 font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> DISPATCHING EMAIL BLAST VIA AWS SES...
                  </span>
                  <span className="text-white font-bold">{sendProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${sendProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Launch Button */}
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-950/50 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              LUNCURKAN EMAIL BLAST KE {currentRecipientCount} EMAIL RECIPIENTS
            </button>
          </form>
        </div>

        {/* Email Live Preview Box (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" /> Live HTML Email Inbox Preview
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Gmail / Apple Mail View</span>
            </div>

            {/* Inbox Card Simulation */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
              {/* Inbox Header */}
              <div className="border-b border-slate-800 pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xs">{senderName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">09:15 AM</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">From: {senderEmail}</div>
                <div className="text-xs font-bold text-sky-300 pt-1">{subject}</div>
                {previewText && (
                  <div className="text-[11px] text-slate-400 italic line-clamp-1">{previewText}</div>
                )}
              </div>

              {/* Rendered HTML Body Preview */}
              <div
                className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/80 text-slate-200 text-xs leading-relaxed space-y-2 overflow-y-auto max-h-80"
                dangerouslySetInnerHTML={{
                  __html: emailBody
                    .replace(/\{\{user_name\}\}/g, 'Marcus Vance')
                    .replace(/\{\{mt5_account\}\}/g, '7721094')
                }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
            <span className="text-sky-400 font-bold block text-xs">
              📊 Perkiraan Performa Email Blast:
            </span>
            <p className="font-mono">
              • Expected Open Rate: <strong className="text-emerald-400">62.4%</strong><br />
              • Expected Click-Through Rate (CTR): <strong className="text-sky-400">28.1%</strong><br />
              • Unsubscribe Protection: Automatic 1-Click Link Included
            </p>
          </div>
        </div>
      </div>

      {/* Email Campaign History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-sky-400" /> Riwayat Email Blast Campaigns
            </h3>
            <span className="text-xs text-slate-400">Analisis statistik open rate, click rate, dan bounce rate per campaign</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari email campaign..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px]">
              <tr>
                <th className="p-3">SUBJECT &amp; TEMPLATE</th>
                <th className="p-3">TARGET SEGMENT</th>
                <th className="p-3">RECIPIENTS</th>
                <th className="p-3">OPENED (RATE %)</th>
                <th className="p-3">CLICKED (CTR %)</th>
                <th className="p-3">BOUNCED</th>
                <th className="p-3">DISPATCH TIME</th>
                <th className="p-3 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredCampaigns.map(camp => {
                const openRatePct = Math.round((camp.openedCount / camp.totalRecipients) * 100);
                const clickRatePct = Math.round((camp.clickedCount / camp.totalRecipients) * 100);

                return (
                  <tr key={camp.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-sky-400" />
                        {camp.subject}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Template: {camp.templateName} • ID: {camp.id}
                      </div>
                    </td>

                    <td className="p-3 text-slate-300">{camp.targetSegment}</td>

                    <td className="p-3 font-bold text-white">{camp.totalRecipients} Email</td>

                    <td className="p-3 text-emerald-400 font-bold">
                      {camp.openedCount} ({openRatePct}%)
                    </td>

                    <td className="p-3 text-sky-400 font-bold">
                      {camp.clickedCount} ({clickRatePct}%)
                    </td>

                    <td className="p-3 text-rose-400">{camp.bounceCount}</td>

                    <td className="p-3 text-slate-400">{camp.createdAt}</td>

                    <td className="p-3 text-center">
                      <Badge variant={camp.status === 'COMPLETED' ? 'success' : 'info'}>
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

      {/* Test Email Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Kirim Test Email ke Admin / Tester"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Kirim sampel email ini ke alamat email Anda sendiri sebelum melakukan blast massal ke seluruh audiens.
          </p>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">ALAMAT EMAIL PENERIMA TEST</label>
            <input
              type="email"
              value={testEmailAddress}
              onChange={e => setTestEmailAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          {testSentToast && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2">
              <Check className="w-4 h-4" /> Test Email berhasil dikirimkan ke {testEmailAddress}!
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setShowTestModal(false)}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              onClick={handleSendTestEmail}
              className="px-5 py-2 text-xs font-bold bg-sky-500 text-slate-950 rounded-xl hover:bg-sky-400 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Kirim Test Sekarang
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
