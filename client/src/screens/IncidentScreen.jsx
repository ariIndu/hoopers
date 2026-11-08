import React, { useState } from 'react';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, 
  Send, Lock, Hash, Clock, User, CheckCircle2, Shield, AlertOctagon, Terminal
} from 'lucide-react';

export default function IncidentScreen({ onOpenTamperDetails }) {
  const { 
    incident, 
    updateIncident, 
    timeline, 
    addTimelineNote, 
    integrity, 
    triggerTamperDemo, 
    restoreIntegrity, 
    isTampering 
  } = useIncident();

  const { canWrite, user } = useAuth();

  const [form, setForm] = useState({
    title: incident?.title || '',
    severity: incident?.severity || 'Critical',
    attackVector: incident?.attackVector || 'Unpatched Edge VPN (CVE-2024-21762) -> Credential Pivot',
    phase: incident?.phase || 'Contain',
    summary: incident?.summary || '',
    networkState: incident?.networkState || 'Segmented / Isolated VLAN 40'
  });

  const [noteText, setNoteText] = useState('');
  const [actionType, setActionType] = useState('NOTE');
  const [savingIncident, setSavingIncident] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [timelineFilter, setTimelineFilter] = useState('ALL');

  async function handleSaveIncident(e) {
    e.preventDefault();
    if (!canWrite) return;
    setSavingIncident(true);
    setSaveSuccess('');
    try {
      await updateIncident(form);
      setSaveSuccess('Incident documentation updated and sealed into tamper-evident audit chain.');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      alert('Failed to update incident: ' + err.message);
    } finally {
      setSavingIncident(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!canWrite || !noteText.trim()) return;
    try {
      await addTimelineNote(noteText.trim(), actionType);
      setNoteText('');
    } catch (err) {
      alert('Failed to log entry: ' + err.message);
    }
  }

  // Filter timeline entries
  const filteredTimeline = timeline.filter(entry => {
    if (timelineFilter === 'ALL') return true;
    if (timelineFilter === 'ALERT') return entry.actionType === 'ALERT';
    if (timelineFilter === 'COMMAND') return entry.actionType === 'COMMAND' || entry.actionType === 'CONTAINMENT';
    if (timelineFilter === 'RANSOM') return entry.actionType === 'RANSOM' || entry.actionType === 'EXFIL_FLAG';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-y-auto bg-slate-50 p-6 space-y-6">
      
      {/* Top Banner: Tamper-Evident Hash Chain Status & Tamper Demo */}
      <div className={`p-5 rounded-2xl border transition-all ${
        integrity.valid 
          ? 'bg-white border-slate-200 shadow-xs' 
          : 'bg-rose-50 border-2 border-rose-400 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl border ${
              integrity.valid 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-rose-100 border-rose-300 text-rose-700'
            }`}>
              {integrity.valid ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6 animate-bounce" />}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Tamper-Evident SHA-256 Audit Chain
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                    integrity.valid 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' 
                      : 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                  }`}>
                    {integrity.valid 
                      ? `INTEGRITY VERIFIED: ${integrity.totalEntries} BLOCKS` 
                      : `CORRUPTED AT BLOCK #${integrity.failedSeq}`
                    }
                  </span>
                </h2>
              </div>

              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {integrity.valid 
                  ? `Every timeline record, asset quarantine action, and incident update is cryptographically chained using SHA-256. Any backend database alteration is immediately flagged in the browser.` 
                  : integrity.reason
                }
              </p>

              <div className="mt-2 text-[11px] font-mono text-slate-500 flex items-center gap-2">
                <span>Engine: Web Crypto API (crypto.subtle)</span>
                <span>•</span>
                <button
                  onClick={onOpenTamperDetails}
                  className="text-amber-800 hover:text-amber-900 font-bold underline cursor-pointer"
                >
                  Inspect Full Cryptographic Hash Ledger ➔
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons for Tamper Demo */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            {integrity.valid ? (
              <button
                onClick={triggerTamperDemo}
                disabled={isTampering || !canWrite}
                className="px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs font-mono transition flex items-center gap-2 shadow-xs"
                title="Simulate attacker altering backend database to delete exfiltration notice"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Simulate Attacker Log Tamper</span>
              </button>
            ) : (
              <button
                onClick={restoreIntegrity}
                disabled={isTampering || !canWrite}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs font-mono transition flex items-center gap-2 shadow-xs"
                title="Restore authentic log and recompute hash chain"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Restore Authentic Audit Chain</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Grid: Incident Documentation Form (Left) & Realtime Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Incident Documentation Form - Clean White Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Incident Documentation &amp; Status
              </h3>
              <p className="text-xs text-slate-500">Formal NIST SP 800-61 / SANS documentation standard</p>
            </div>
            <span className="text-xs font-mono text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300 font-bold">
              {incident?.id}
            </span>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveIncident} className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Incident Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                disabled={!canWrite}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-60 shadow-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity Rating</label>
                <select
                  value={form.severity}
                  onChange={e => setForm({ ...form, severity: e.target.value })}
                  disabled={!canWrite}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-60 shadow-xs"
                >
                  <option value="Critical">Critical (SEV-1)</option>
                  <option value="High">High (SEV-2)</option>
                  <option value="Medium">Medium (SEV-3)</option>
                  <option value="Low">Low (SEV-4)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Response Phase</label>
                <select
                  value={form.phase}
                  onChange={e => setForm({ ...form, phase: e.target.value })}
                  disabled={!canWrite}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-60 shadow-xs"
                >
                  <option value="Detect">1. Detect</option>
                  <option value="Contain">2. Contain</option>
                  <option value="Eradicate">3. Eradicate</option>
                  <option value="Recover">4. Recover</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Attack Vector</label>
              <select
                value={form.attackVector}
                onChange={e => setForm({ ...form, attackVector: e.target.value })}
                disabled={!canWrite}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-60 shadow-xs"
              >
                <option value="Unpatched Edge VPN (CVE-2024-21762) -> Credential Pivot">
                  Unpatched Edge VPN (CVE-2024-21762)
                </option>
                <option value="Spearphishing with Malicious Office Payload">
                  Spearphishing with Malicious Payload
                </option>
                <option value="Compromised Admin Credentials / MFA Fatigue">
                  Compromised Admin Credentials / MFA Fatigue
                </option>
                <option value="Supply Chain / Third-Party Vendor Compromise">
                  Supply Chain / Third-Party Vendor Compromise
                </option>
                <option value="Shadow IT Cloud S3 Exposure without Authentication">
                  Shadow IT Cloud S3 Exposure without Authentication
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Network Containment Status</label>
              <input
                type="text"
                value={form.networkState}
                onChange={e => setForm({ ...form, networkState: e.target.value })}
                disabled={!canWrite}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-60 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Executive Summary</label>
              <textarea
                rows="4"
                value={form.summary}
                onChange={e => setForm({ ...form, summary: e.target.value })}
                disabled={!canWrite}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono leading-relaxed disabled:opacity-60 shadow-xs"
              />
            </div>

            {canWrite && (
              <button
                type="submit"
                disabled={savingIncident}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {savingIncident ? 'Sealing Block...' : 'Update & Chain to SHA-256 Ledger'}
              </button>
            )}

            {!canWrite && (
              <div className="text-center text-xs font-mono text-slate-400">
                [View-Only Account: Switch persona to Responder or Admin to edit]
              </div>
            )}

          </form>

        </div>

        {/* Real-time Timeline Section (Right) - Clean White Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          
          <div>
            {/* Header + Filter Bar */}
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-500" />
                  Live Incident Timeline Feed
                </h3>
                <p className="text-xs text-slate-500">WebSocket broadcast to all connected command terminals</p>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
                {['ALL', 'ALERT', 'COMMAND', 'RANSOM'].map(f => (
                  <button
                    key={f}
                    onClick={() => setTimelineFilter(f)}
                    className={`px-2.5 py-0.5 rounded-md transition ${
                      timelineFilter === f 
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="mt-4 space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {filteredTimeline.map((item, idx) => {
                const isFailedBlock = !integrity.valid && item.seq === integrity.failedSeq;
                return (
                  <div
                    key={item.seq}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isFailedBlock
                        ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          isFailedBlock
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          #{item.seq}
                        </span>

                        <span className="text-xs font-semibold text-slate-900">{item.actor}</span>
                        
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                          item.actionType === 'RANSOM' || item.actionType === 'EXFIL_FLAG' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          item.actionType === 'COMMAND' || item.actionType === 'CONTAINMENT' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          item.actionType === 'RECOVERY' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {item.actionType}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.ts).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 font-mono leading-relaxed mb-2">
                      {item.text}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-200/80">
                      <span className="truncate max-w-[280px]">
                        PREV: {item.prevHash.substring(0, 16)}...
                      </span>
                      <span className={`font-semibold ${isFailedBlock ? 'text-rose-700 font-bold' : 'text-slate-600'}`}>
                        HASH: {item.hash.substring(0, 16)}...
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Timeline Note Form */}
          {canWrite ? (
            <form onSubmit={handleAddNote} className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="font-semibold flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-600" />
                  Append Live Forensic Note
                </span>
                <select
                  value={actionType}
                  onChange={e => setActionType(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-[11px] font-mono text-slate-700 focus:outline-none"
                >
                  <option value="NOTE">General Note</option>
                  <option value="ALERT">Threat Alert</option>
                  <option value="CONTAINMENT">Containment Order</option>
                  <option value="EXFIL_FLAG">Exfil Flag</option>
                  <option value="RECOVERY">Recovery Validation</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type forensic observation or containment command..."
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs font-mono transition flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Append</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs font-mono text-slate-400">
              [Viewer Role: You are viewing live timeline feeds in read-only mode]
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
