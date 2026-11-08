import React from 'react';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, Key, Hash, Check } from 'lucide-react';

export default function TamperModal({ isOpen, onClose }) {
  const { integrity, timeline, triggerTamperDemo, restoreIntegrity, isTampering } = useIncident();
  const { canWrite } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          integrity.valid ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              integrity.valid 
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                : 'bg-rose-100 border-rose-300 text-rose-800'
            }`}>
              {integrity.valid ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Tamper-Evident SHA-256 Audit Chain Inspector
                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  integrity.valid 
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold' 
                    : 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                }`}>
                  {integrity.valid ? 'CRYPTOGRAPHICALLY VALID' : 'COMPROMISED'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Independent client-side verification executing Web Crypto API (SHA-256) across all blocks
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Tamper Alert Callout if Invalid */}
          {!integrity.valid && (
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-950 text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>INTEGRITY FAILURE: Unsigned Record Manipulation Detected!</span>
              </div>
              <p className="leading-relaxed">
                {integrity.reason}
              </p>
              <div className="font-mono bg-white p-3 rounded-lg border border-rose-200 text-xs space-y-1 shadow-xs">
                <div><span className="text-slate-500">Compromised Block:</span> #{integrity.failedSeq}</div>
                <div><span className="text-slate-500">Recorded Actor:</span> {integrity.actor}</div>
                <div><span className="text-slate-500">Altered Content:</span> "{integrity.text}"</div>
                <div className="pt-1 text-rose-700 font-bold">
                  <span className="text-slate-500 font-normal">Expected SHA-256: </span>{integrity.expectedHash}
                </div>
                <div className="text-slate-500">
                  <span className="text-slate-500">Stored SHA-256:   </span>{integrity.recordedHash}
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-700">
                  In a court of law or regulatory investigation, this proof proves the logs were manipulated.
                </span>
                <button
                  onClick={restoreIntegrity}
                  disabled={isTampering || !canWrite}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs font-mono transition flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restore Authentic Logs
                </button>
              </div>
            </div>
          )}

          {/* Interactive Demo Explanation & Controls */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                Live Adversary Tampering Demonstration
              </div>
              <p className="text-xs text-slate-600 max-w-xl">
                Click <span className="text-rose-700 font-bold font-mono">Simulate Attacker Tamper</span> to modify entry #4 directly on the backend database (simulating an adversary trying to cover 42GB of exfiltration). The client will instantly catch the broken hash chain.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={triggerTamperDemo}
                disabled={isTampering || !canWrite}
                className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Simulate Attacker Tamper
              </button>

              <button
                onClick={restoreIntegrity}
                disabled={isTampering || !canWrite}
                className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restore Chain
              </button>
            </div>
          </div>

          {/* Block-by-Block Visual Ledger */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2 font-bold">
              <Hash className="w-4 h-4 text-amber-600" />
              Cryptographic Chain Ledger ({timeline.length} Blocks Verified)
            </h3>

            <div className="space-y-2 font-mono text-xs">
              {timeline.map((entry, idx) => {
                const isFailedBlock = !integrity.valid && entry.seq === integrity.failedSeq;
                return (
                  <div
                    key={entry.seq}
                    className={`p-3 rounded-xl border transition ${
                      isFailedBlock
                        ? 'bg-rose-50 border-rose-400 text-rose-950'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isFailedBlock 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          BLOCK #{entry.seq}
                        </span>
                        <span className="text-slate-900 font-semibold">{entry.actor}</span>
                        <span className="text-slate-400 text-[10px]">{new Date(entry.ts).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px]">
                        {isFailedBlock ? (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> HASH MISMATCH
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> VALID
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-slate-800 text-xs mb-2 pl-2 border-l-2 border-slate-300">
                      {entry.text}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg text-[10px] space-y-0.5 text-slate-500 overflow-x-auto border border-slate-100">
                      <div className="truncate">
                        <span className="text-slate-400">PREV_HASH: </span>
                        <span className="text-slate-600 font-mono">{entry.prevHash}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400">BLOCK_HASH: </span>
                        <span className={isFailedBlock ? 'text-rose-700 font-bold' : 'text-slate-800 font-semibold'}>
                          {entry.hash}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span className="font-mono">Formula: SHA256(seq | timestamp | actor | text | prevHash)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
