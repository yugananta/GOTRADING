import React, { useState } from 'react';
import { apiFetch } from '../utils/apiFetch.ts';

export const LogoUpload: React.FC = () => {
  const [status, setStatus] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'chat') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(`Mengunggah ${type === 'chat' ? 'Logo Chat' : 'Logo Utama'}...`);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const res = await apiFetch('/api/upload-logo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64, type })
        });
        if (res.ok) {
          setStatus('Logo berhasil diunggah! Memuat ulang...');
          setTimeout(() => window.location.href = '/', 1200);
        } else {
          setStatus('Gagal mengunggah logo.');
        }
      } catch (err) {
        setStatus('Error saat mengunggah.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (type: 'main' | 'chat') => {
    setStatus(`Menghapus ${type === 'chat' ? 'Logo Chat' : 'Logo Utama'}...`);
    try {
      const res = await apiFetch('/api/delete-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        setStatus('Logo berhasil dihapus!');
        setTimeout(() => window.location.href = '/', 1200);
      } else {
        setStatus('Gagal menghapus logo.');
      }
    } catch (err) {
      setStatus('Error saat menghapus logo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-2 text-slate-800">Upload & Kelola Logo</h2>
        <p className="text-gray-600 mb-6 text-sm">Upload logo baru atau hapus logo saat ini agar Anda dapat mengunggahnya kembali.</p>
        
        <div className="space-y-3">
          <label className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg cursor-pointer transition shadow-sm">
            Pilih & Upload Logo Utama
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/svg+xml" 
              className="hidden" 
              onChange={(e) => handleFileChange(e, 'main')} 
            />
          </label>

          <button 
            type="button"
            onClick={() => handleDelete('main')}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-2.5 px-4 rounded-lg transition text-sm flex items-center justify-center gap-2"
          >
            <span>🗑️</span> Hapus Logo Utama Saat Ini
          </button>
          
          <hr className="my-4 border-slate-200" />

          <label className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg cursor-pointer transition shadow-sm">
            Pilih & Upload Logo Floating Chat
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/svg+xml" 
              className="hidden" 
              onChange={(e) => handleFileChange(e, 'chat')} 
            />
          </label>

          <button 
            type="button"
            onClick={() => handleDelete('chat')}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-2.5 px-4 rounded-lg transition text-sm flex items-center justify-center gap-2"
          >
            <span>🗑️</span> Hapus Logo Chat Saat Ini
          </button>
        </div>
        
        {status && (
          <p className="mt-4 text-sm font-medium text-blue-600 bg-blue-50 py-2 rounded-md">{status}</p>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100">
          <a href="/" className="inline-block text-sm text-slate-500 hover:text-slate-800 font-medium">
            ← Kembali ke Aplikasi Utama
          </a>
        </div>
      </div>
    </div>
  );
};
