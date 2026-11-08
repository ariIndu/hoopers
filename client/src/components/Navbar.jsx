import React, { useState } from 'react';
import { useAuth, PRESET_USERS } from '../context/AuthContext';
import { useIncident } from '../context/IncidentContext';
import { 
  ShieldCheck, ShieldAlert, Users, Radio, RefreshCw, 
  ChevronDown, AlertTriangle, Lock, CheckCircle2, User, Activity
} from 'lucide-react';

export default function Navbar({ onOpenUsersModal, onOpenTamperDetails }) {
  const { user, quickLogin, isAdmin, canWrite } = useAuth();
  const { 
    incident, 
    integrity, 
    wsConnected, 
    triggerTamperDemo, 
    restoreIntegrity, 
    isTampering, 
    updateIncident,
    timeline 
  } = useIncident();

  const [userDropdown, setUserDropdown] = useState(false);

  const phases = ['Detect', 'Contain', 'Eradicate', 'Recover'];

  async function handlePhaseChange(newPhase) {
    if (!canWrite) return;
    try {
      await updateIncident({ phase: newPhase });
    } catch (err) {
      alert('Failed to update phase: ' + err.message);
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      
      {/* Top Security & Status Banner */}
      <div className="bg-amber-50/80 px-4 py-1 border-b border-amber-200/50 flex items-center justify-between text-xs font-mono text-amber-950">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1.5 font-bold text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            AIR-GAPPED COMMAND NODE #01
          </span>
          <span className="text-amber-300">|</span>
          <span className="text-amber-800/80 font-medium">ISOLATED SECURE ZONE</span>
          <span className="text-amber-300">|</span>
          <span className="text-rose-700 font-semibold">Corporate Slack &amp; Email Untrusted</span>
        </div>
        
        <div className="flex items-center space-x-3 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <span className="text-xs font-sans">{wsConnected ? 'Live Sync Active' : 'Offline'}</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="font-sans">Incident: <strong className="font-mono text-slate-900">{incident?.id || 'INC-2026-8812'}</strong></span>
        </div>
      </div>

      {/* Main Command Bar */}
      <div className="px-5 py-2.5 flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <svg className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" stroke="#d97706" strokeWidth="1.5" fillOpacity="0.9" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-900 font-mono">
              BW
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black tracking-tight text-base text-slate-900 flex items-center gap-1.5">
                BEESWAX <span className="text-[11px] px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded font-mono font-bold">COMMAND</span>
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                {incident?.severity || 'CRITICAL'} SEV-1
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-sans">Cyber Incident Command Center</div>
          </div>
        </div>

        {/* NIST Phase Stepper - Clear HCI Flow */}
        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium uppercase text-slate-500 px-2.5">Phase:</span>
          <div className="flex items-center space-x-1">
            {phases.map((p, idx) => {
              const isActive = incident?.phase?.toLowerCase() === p.toLowerCase();
              return (
                <button
                  key={p}
                  disabled={!canWrite}
                  onClick={() => handlePhaseChange(p)}
                  className={`text-xs font-medium px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  } ${!canWrite ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className="text-[10px] opacity-60 font-mono">{idx + 1}.</span>
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cryptographic Hash Chain Badge & Tamper Demo Trigger */}
        <div className="flex items-center space-x-2.5">
          {integrity.valid ? (
            <div 
              onClick={onOpenTamperDetails}
              className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-mono hover:bg-emerald-100/70 transition shadow-xs"
              title="Click to inspect cryptographic SHA-256 block ledger"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong className="font-semibold text-emerald-900">VERIFIED:</strong> {integrity.totalEntries}/{integrity.totalEntries} Blocks (SHA-256)
              </span>
            </div>
          ) : (
            <div 
              onClick={onOpenTamperDetails}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-rose-50 border-2 border-rose-500 rounded-lg text-rose-900 text-xs font-mono shadow-xs animate-pulse"
              title="Click to inspect cryptographic discrepancy"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="font-bold">
                ⚠️ TAMPER DETECTED: BLOCK #{integrity.failedSeq}!
              </span>
            </div>
          )}

          {/* Tamper Simulation Controls */}
          {integrity.valid ? (
            <button
              onClick={triggerTamperDemo}
              disabled={isTampering || !canWrite}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              title="Simulates an attacker modifying audit logs to conceal exfiltration"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Tamper Demo</span>
            </button>
          ) : (
            <button
              onClick={restoreIntegrity}
              disabled={isTampering || !canWrite}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs"
              title="Restore genuine audit trail and re-verify cryptographic hash chain"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTampering ? 'animate-spin' : ''}`} />
              <span>Restore Chain</span>
            </button>
          )}

          {/* Users Modal Button (Admin only) */}
          {isAdmin && (
            <button
              onClick={onOpenUsersModal}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
              title="Manage Response Team & RBAC"
            >
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Users</span>
            </button>
          )}

          {/* Quick User Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdown(!userDropdown)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 transition text-left shadow-xs"
            >
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-900 border border-amber-300">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 leading-none">{user?.name}</div>
                <div className="text-[10px] font-mono text-amber-700 leading-tight mt-0.5">
                  {user?.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2 border-b border-slate-100 text-xs text-slate-500">
                  <div className="font-semibold text-slate-900">Switch Persona:</div>
                  <div className="text-[11px]">Test RBAC privileges instantly</div>
                </div>

                <div className="p-1.5 space-y-1">
                  {PRESET_USERS.map(p => {
                    const isCurrent = user?.username === p.username;
                    return (
                      <button
                        key={p.username}
                        onClick={() => {
                          quickLogin(p.username);
                          setUserDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-start justify-between ${
                          isCurrent 
                            ? 'bg-amber-50 border border-amber-300 text-amber-950 font-medium' 
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold flex items-center gap-1.5 text-slate-900">
                            {p.name}
                            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                              p.role === 'Admin' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                              p.role === 'Responder' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              'bg-slate-100 text-slate-700 border-slate-300'
                            }`}>
                              {p.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">{p.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                        </div>
                        {isCurrent && <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </header>
  );
}
