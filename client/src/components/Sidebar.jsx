import React from 'react';
import { Hexagon, Zap, MessageSquare, Shield, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useIncident } from '../context/IncidentContext';

export default function Sidebar({ currentScreen, setScreen }) {
  const { metrics, messages, nessusData } = useIncident();

  const navItems = [
    {
      id: 'hive',
      label: 'Hive & Assets',
      desc: 'Scope & Asset Library',
      icon: Hexagon,
      badge: metrics.encrypted + metrics.exfiltrated > 0 ? `${metrics.encrypted + metrics.exfiltrated} compromised` : null,
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200'
    },
    {
      id: 'incident',
      label: 'Incident Log',
      desc: 'Documentation & Timeline',
      icon: Zap,
      badge: 'SEV-1',
      badgeColor: 'bg-amber-50 text-amber-800 border border-amber-300'
    },
    {
      id: 'chat',
      label: 'Tactical Chat',
      desc: 'Air-Gapped Comms',
      icon: MessageSquare,
      badge: messages.length > 0 ? `${messages.length}` : null,
      badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200'
    },
    {
      id: 'nessus',
      label: 'Nessus Scanner',
      desc: 'Vulnerability Posture',
      icon: Shield,
      badge: nessusData?.severityCounts?.critical ? `${nessusData.severityCounts.critical} Crit` : null,
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200'
    },
    {
      id: 'board-brief',
      label: 'Board Brief',
      desc: 'CISO Executive Memo',
      icon: FileText,
      badge: 'HIPAA/PHI',
      badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200'
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 shadow-xs">
      
      {/* Navigation Links */}
      <div className="p-3.5 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
          Command Modules
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`w-full text-left px-3.5 py-3 rounded-xl transition flex items-center justify-between group ${
                isActive
                  ? 'bg-amber-50 border border-amber-300 text-amber-950 font-semibold shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg transition ${
                  isActive 
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' 
                    : 'bg-slate-100 text-slate-500 group-hover:text-amber-700 group-hover:bg-amber-100/60'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-sm tracking-tight ${isActive ? 'text-amber-950 font-bold' : 'text-slate-800 font-medium'}`}>
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {item.desc}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Out-of-band Air-gap Status Box */}
      <div className="p-3.5 m-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2 mb-1.5 text-slate-900 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Hardened Node Isolation</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Zero external internet dependencies or CDNs. 100% operational in hostile corporate networks.
        </p>
        <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>LAN THREAT:</span>
          <span className="text-rose-700 font-bold">HOSTILE / ADVERSARY</span>
        </div>
      </div>

    </aside>
  );
}
