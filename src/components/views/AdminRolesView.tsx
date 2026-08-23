import React, { useState } from 'react';
import { ShieldCheck, UserPlus, Check, Lock } from 'lucide-react';
import { AdminUser, AdminRole } from '../../types';
import { Badge } from '../ui/Badge';

interface AdminRolesViewProps {
  admins: AdminUser[];
}

export const AdminRolesView: React.FC<AdminRolesViewProps> = ({ admins }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');

  const rbacMatrix = [
    { permission: 'users.view', OWNER: true, ADMIN: true, MARKETING: true, FINANCE: false, SUPPORT: true, ANALYST: true, DEVELOPER: false },
    { permission: 'users.suspend', OWNER: true, ADMIN: true, MARKETING: false, FINANCE: false, SUPPORT: false, ANALYST: false, DEVELOPER: false },
    { permission: 'trading.sync', OWNER: true, ADMIN: true, MARKETING: false, FINANCE: false, SUPPORT: true, ANALYST: true, DEVELOPER: true },
    { permission: 'finance.approve', OWNER: true, ADMIN: false, MARKETING: false, FINANCE: true, SUPPORT: false, ANALYST: false, DEVELOPER: false },
    { permission: 'integration.rotate_key', OWNER: true, ADMIN: false, MARKETING: false, FINANCE: false, SUPPORT: false, ANALYST: false, DEVELOPER: false },
    { permission: 'audit.view', OWNER: true, ADMIN: true, MARKETING: false, FINANCE: true, SUPPORT: false, ANALYST: true, DEVELOPER: true }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Admin Users & Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-slate-400">Least Privilege Principle enforcement and granular module permissions</p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'users' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin Accounts
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'matrix' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            RBAC Permission Matrix
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3">ADMIN NAME</th>
                <th className="p-3">EMAIL</th>
                <th className="p-3">ROLE</th>
                <th className="p-3">2FA ENFORCED</th>
                <th className="p-3">LAST ACTIVE</th>
                <th className="p-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {admins.map(a => (
                <tr key={a.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-white">{a.name}</td>
                  <td className="p-3 font-mono text-slate-400">{a.email}</td>
                  <td className="p-3"><Badge variant="purple font-bold">{a.role}</Badge></td>
                  <td className="p-3 font-mono">{a.twoFactorEnabled ? '🟢 Enabled' : '🔴 Disabled'}</td>
                  <td className="p-3 font-mono text-slate-400">{a.lastActive}</td>
                  <td className="p-3"><Badge variant="success">{a.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">PERMISSION SLUG</th>
                <th className="p-3 text-center">OWNER</th>
                <th className="p-3 text-center">ADMIN</th>
                <th className="p-3 text-center">MARKETING</th>
                <th className="p-3 text-center">FINANCE</th>
                <th className="p-3 text-center">SUPPORT</th>
                <th className="p-3 text-center">ANALYST</th>
                <th className="p-3 text-center">DEVELOPER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {rbacMatrix.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">{r.permission}</td>
                  <td className="p-3 text-center">{r.OWNER ? '✅' : '❌'}</td>
                  <td className="p-3 text-center">{r.ADMIN ? '✅' : '❌'}</td>
                  <td className="p-3 text-center">{r.MARKETING ? '✅' : '❌'}</td>
                  <td className="p-3 text-center">{r.FINANCE ? '✅' : '❌'}</td>
                  <td className="p-3 text-center">{r.SUPPORT ? '✅' : '❌'}</td>
                  <td className="p-3 text-center">{r.ANALYST ? '✅' : '❌'}</td>
                  <td className="p-3 text-center">{r.DEVELOPER ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
