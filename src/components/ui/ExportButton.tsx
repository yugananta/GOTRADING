import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Check } from 'lucide-react';

interface ExportButtonProps {
  filename: string;
  data: any[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ filename, data }) => {
  const [open, setOpen] = useState(false);
  const [exported, setExported] = useState<string | null>(null);

  const handleExportCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExported('CSV');
    setOpen(false);
    setTimeout(() => setExported(null), 3000);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${filename}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExported('JSON');
    setOpen(false);
    setTimeout(() => setExported(null), 3000);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-slate-400" />
        {exported ? `Exported ${exported}!` : 'Export'}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-30 py-1">
          <button
            onClick={handleExportCSV}
            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            Export JSON
          </button>
        </div>
      )}
    </div>
  );
};
