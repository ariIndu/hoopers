import React, { useState } from 'react';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Check, Clock3, Eye, LockKeyhole, Plus, RotateCcw, ShieldCheck } from 'lucide-react';

const actionTypes = [
  { value: 'NOTE', label: 'Update' },
  { value: 'ALERT', label: 'Alert' },
  { value: 'CONTAINMENT', label: 'Containment' },
  { value: 'RECOVERY', label: 'Recovery' }
];

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
  const { canWrite } = useAuth();

  const [form, setForm] = useState({
    title: incident?.title || '',
    severity: incident?.severity || 'Critical',
    attackVector: incident?.attackVector || '',
    phase: incident?.phase || 'Contain',
    summary: incident?.summary || '',
    networkState: incident?.networkState || ''
  });
  const [noteText, setNoteText] = useState('');
  const [actionType, setActionType] = useState('NOTE');
  const [savingIncident, setSavingIncident] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  async function handleSaveIncident(event) {
    event.preventDefault();
    if (!canWrite) return;
    setSavingIncident(true);
    setSaveMessage('');
    try {
      await updateIncident(form);
      setSaveMessage('Incident details saved.');
    } catch (error) {
      alert(`Could not save incident details: ${error.message}`);
    } finally {
      setSavingIncident(false);
    }
  }

  async function handleAddNote(event) {
    event.preventDefault();
    if (!canWrite || !noteText.trim() || savingNote) return;
    setSavingNote(true);
    try {
      await addTimelineNote(noteText.trim(), actionType);
      setNoteText('');
    } catch (error) {
      alert(`Could not add log entry: ${error.message}`);
    } finally {
      setSavingNote(false);
    }
  }

  const orderedTimeline = [...timeline].reverse();

  return (
    <section className="screen-scroll flex-1 overflow-y-auto bg-slate-50 p-5 md:p-7">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{incident?.id || 'Incident'}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Incident log</h1>
          </div>
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            integrity.valid ? 'bg-white text-slate-700' : 'bg-rose-50 text-rose-800'
          }`}>
            {integrity.valid ? <ShieldCheck className="h-4 w-4 text-amber-700" /> : <AlertTriangle className="h-4 w-4" />}
            <span>{integrity.valid ? 'Log integrity verified' : `Integrity issue at entry ${integrity.failedSeq}`}</span>
            <button type="button" onClick={onOpenTamperDetails} className="ml-1 underline underline-offset-2">
              Details
            </button>
          </div>
        </header>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-600">Audit log is protected with a SHA-256 hash chain.</p>
          <div className="flex flex-wrap gap-2">
            {integrity.valid ? (
              <button
                type="button"
                onClick={triggerTamperDemo}
                disabled={isTampering || !canWrite}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Test integrity check
              </button>
            ) : (
              <button
                type="button"
                onClick={restoreIntegrity}
                disabled={isTampering || !canWrite}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isTampering ? 'animate-spin' : ''}`} />
                Restore sample log
              </button>
            )}
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.4fr)]">
          <form onSubmit={handleSaveIncident} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-semibold text-slate-900">Incident details</h2>
                <p className="mt-1 text-xs text-slate-500">Keep the current status and response summary up to date.</p>
              </div>
              <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                {incident?.severity || form.severity}
              </span>
            </div>

            {saveMessage && (
              <p role="status" className="mb-3 flex items-center gap-2 text-xs text-emerald-700">
                <Check className="h-4 w-4" />{saveMessage}
              </p>
            )}

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Title
                <input
                  type="text"
                  value={form.title}
                  onChange={event => setForm({ ...form, title: event.target.value })}
                  disabled={!canWrite}
                  required
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  Severity
                  <select
                    value={form.severity}
                    onChange={event => setForm({ ...form, severity: event.target.value })}
                    disabled={!canWrite}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 focus:border-amber-600 focus:outline-none disabled:bg-slate-50"
                  >
                    {['Critical', 'High', 'Medium', 'Low'].map(value => <option key={value}>{value}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Response phase
                  <select
                    value={form.phase}
                    onChange={event => setForm({ ...form, phase: event.target.value })}
                    disabled={!canWrite}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 focus:border-amber-600 focus:outline-none disabled:bg-slate-50"
                  >
                    {['Detect', 'Contain', 'Eradicate', 'Recover'].map(value => <option key={value}>{value}</option>)}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Summary
                <textarea
                  rows={5}
                  value={form.summary}
                  onChange={event => setForm({ ...form, summary: event.target.value })}
                  disabled={!canWrite}
                  className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal leading-6 text-slate-900 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
                />
              </label>

              <details className="group rounded-lg border border-slate-200 px-3">
                <summary className="cursor-pointer py-2.5 text-sm font-medium text-slate-700">Additional context</summary>
                <div className="space-y-3 pb-3">
                  <label className="block text-xs font-medium text-slate-600">
                    Initial access
                    <input
                      type="text"
                      value={form.attackVector}
                      onChange={event => setForm({ ...form, attackVector: event.target.value })}
                      disabled={!canWrite}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm font-normal text-slate-800 focus:border-amber-600 focus:outline-none disabled:bg-slate-50"
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-600">
                    Network status
                    <input
                      type="text"
                      value={form.networkState}
                      onChange={event => setForm({ ...form, networkState: event.target.value })}
                      disabled={!canWrite}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm font-normal text-slate-800 focus:border-amber-600 focus:outline-none disabled:bg-slate-50"
                    />
                  </label>
                </div>
              </details>

              {canWrite && (
                <button
                  type="submit"
                  disabled={savingIncident}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
                >
                  <LockKeyhole className="h-4 w-4" />
                  {savingIncident ? 'Saving…' : 'Save incident details'}
                </button>
              )}
              {!canWrite && <p className="text-xs text-slate-500">Read-only access</p>}
            </div>
          </form>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-semibold text-slate-900">Activity</h2>
                <p className="mt-1 text-xs text-slate-500">{timeline.length} recorded updates</p>
              </div>
              <Eye className="h-4 w-4 text-slate-400" />
            </div>

            {canWrite && (
              <form onSubmit={handleAddNote} className="mb-5 flex flex-wrap gap-2">
                <select
                  value={actionType}
                  onChange={event => setActionType(event.target.value)}
                  aria-label="Activity type"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  {actionTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
                <input
                  type="text"
                  value={noteText}
                  onChange={event => setNoteText(event.target.value)}
                  placeholder="Add an update"
                  aria-label="Add an update"
                  required
                  className="min-w-[180px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
                <button
                  type="submit"
                  disabled={savingNote || !noteText.trim()}
                  aria-label="Add activity"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{savingNote ? 'Adding…' : 'Add'}</span>
                </button>
              </form>
            )}

            <ol className="space-y-0">
              {orderedTimeline.map(item => (
                <li key={item.seq} className="relative border-l border-slate-200 pb-5 pl-5 last:pb-0">
                  <span className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
                    ['ALERT', 'RANSOM', 'EXFIL_FLAG'].includes(item.actionType) ? 'bg-amber-600' : 'bg-slate-300'
                  }`} />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-slate-900">{item.actor}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      {item.actionType === 'EXFIL_FLAG' ? 'DATA EXPOSURE' : item.actionType}
                    </span>
                    <time className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400">
                      <Clock3 className="h-3 w-3" />
                      {new Date(item.ts).toLocaleString()}
                    </time>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-slate-700">{item.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </section>
  );
}
