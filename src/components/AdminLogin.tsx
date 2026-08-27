import React from 'react';
export const AdminLogin: React.FC<{ onBackToApp?: () => void }> = ({ onBackToApp }) => (
  <div className='p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 text-xs font-bold flex justify-between items-center'>
    <span>Admin Login Portal</span>
    {onBackToApp && <button onClick={onBackToApp} className='px-3 py-1 bg-indigo-600 rounded-lg'>Kembali ke App</button>}
  </div>
);
