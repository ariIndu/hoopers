import React, { useEffect, useRef, useState } from 'react';
import { useAuth, PRESET_USERS } from '../context/AuthContext';
import { useIncident } from '../context/IncidentContext';
import { Check, ChevronDown, Hexagon, Plus, Users } from 'lucide-react';

const initialForm = {
  title: '',
  severity: 'High',
  phase: 'Detect',
  attackVector: '',
  summary: ''
};

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Date not recorded';
}

export default function Navbar({ onOpenUsersModal, onOpenIncident }) {
  const { user, quickLogin, isAdmin, canWrite } = useAuth();
  const { incident, incidents, createIncident, wsConnected } = useIncident();
  const [userDropdown, setUserDropdown] = useState(false);
  const [incidentRegisterOpen, setIncidentRegisterOpen] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [savingIncident, setSavingIncident] = useState(false);
  const [formError, setFormError] = useState('');
  const registerRef = useRef(null);

  useEffect(() => {
    function dismissRegister(event) {
      if (event.type === 'keydown' && event.key === 'Escape') {
        setIncidentRegisterOpen(false);
        return;
      }
      if (event.type === 'pointerdown' && !registerRef.current?.contains(event.target)) {
        setIncidentRegisterOpen(false);
      }
    }

    document.addEventListener('pointerdown', dismissRegister);
    document.addEventListener('keydown', dismissRegister);
    return () => {
      document.removeEventListener('pointerdown', dismissRegister);
      document.removeEventListener('keydown', dismissRegister);
    };
  }, []);

  async function handleCreateIncident(event) {
    event.preventDefault();
    if (!canWrite || savingIncident) return;
    setSavingIncident(true);
    setFormError('');
    try {
      await createIncident(form);
      setForm(initialForm);
      setCreateFormOpen(false);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSavingIncident(false);
    }
  }

  return (
    <header className="print-hide z-40 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:px-6">
      <div ref={registerRef} className="relative flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setIncidentRegisterOpen(open => !open);
            setUserDropdown(false);
          }}
          aria-expanded={incidentRegisterOpen}
          aria-label="Open incident register"
          className="-ml-2 flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
        >
          <Hexagon className="h-7 w-7 shrink-0 fill-amber-300 text-amber-700" strokeWidth={1.5} />
          <span className="min-w-0">
            <span className="block font-semibold tracking-tight text-slate-950">Beeswax</span>
            <span className="hidden truncate text-xs text-slate-500 sm:block">{incident?.id || 'Incident workspace'}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>

        <span className="ml-1 hidden items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600 md:inline-flex">
          <i className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {wsConnected ? 'Connected' : 'Offline'}
        </span>

        {incidentRegisterOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 max-h-[80vh] w-[min(92vw,26rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-1 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Incident register</h2>
                <p className="mt-1 text-xs text-slate-500">{incidents.length} tracked incident{incidents.length === 1 ? '' : 's'}</p>
              </div>
              {canWrite && (
                <button
                  type="button"
                  onClick={() => {
                    setCreateFormOpen(open => !open);
                    setFormError('');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-2.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New incident
                </button>
              )}
            </div>

            {createFormOpen && (
              <form onSubmit={handleCreateIncident} className="my-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="block text-xs font-medium text-slate-700">
                  Incident title
                  <input
                    autoFocus
                    required
                    maxLength={160}
                    value={form.title}
                    onChange={event => setForm({ ...form, title: event.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm font-normal text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Severity
                    <select
                      value={form.severity}
                      onChange={event => setForm({ ...form, severity: event.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm font-normal"
                    >
                      {['Critical', 'High', 'Medium', 'Low'].map(value => <option key={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Phase
                    <select
                      value={form.phase}
                      onChange={event => setForm({ ...form, phase: event.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm font-normal"
                    >
                      {['Detect', 'Contain', 'Eradicate', 'Recover'].map(value => <option key={value}>{value}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block text-xs font-medium text-slate-700">
                  Initial access (optional)
                  <input
                    maxLength={240}
                    value={form.attackVector}
                    onChange={event => setForm({ ...form, attackVector: event.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm font-normal text-slate-900"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700">
                  Summary (optional)
                  <textarea
                    rows={2}
                    maxLength={4000}
                    value={form.summary}
                    onChange={event => setForm({ ...form, summary: event.target.value })}
                    className="mt-1 w-full resize-y rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm font-normal text-slate-900"
                  />
                </label>
                {formError && <p role="alert" className="text-xs text-red-700">{formError}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setCreateFormOpen(false)} className="rounded-md px-3 py-1.5 text-xs text-slate-600 hover:bg-white">
                    Cancel
                  </button>
                  <button type="submit" disabled={savingIncident || !form.title.trim()} className="rounded-md bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50">
                    {savingIncident ? 'Adding…' : 'Add to register'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 py-3">
              {incidents.map(item => {
                const isCurrent = item.id === incident?.id;
                const content = (
                  <>
                    <span className="flex min-w-0 items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">{item.title}</span>
                        <span className="mt-1 block text-xs text-slate-500">{item.id} · {formatDate(item.discoveredAt)}</span>
                      </span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        item.severity === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : item.severity === 'High'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.severity}
                      </span>
                    </span>
                    <span className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{item.phase || item.status} · {item.createdBy || 'System'}</span>
                      {isCurrent && <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-900">Current dashboard</span>}
                    </span>
                    {item.summary && <span className="mt-2 block line-clamp-2 text-xs leading-5 text-slate-600">{item.summary}</span>}
                  </>
                );

                return isCurrent ? (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onOpenIncident();
                      setIncidentRegisterOpen(false);
                    }}
                    className="block w-full rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-left hover:bg-amber-50"
                  >
                    {content}
                  </button>
                ) : (
                  <article key={item.id} className="rounded-lg border border-slate-200 p-3">
                    {content}
                    <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] leading-4 text-slate-500">
                      Register record only. The dashboard’s assets and activity remain scoped to the current case.
                    </p>
                  </article>
                );
              })}
              {incidents.length === 0 && <p className="px-2 py-5 text-center text-sm text-slate-500">No incidents are registered.</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenUsersModal}
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </button>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setUserDropdown(open => !open);
              setIncidentRegisterOpen(false);
            }}
            aria-expanded={userDropdown}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-left hover:bg-slate-50"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-950">
              {user?.name?.charAt(0) || 'U'}
            </span>
            <span className="hidden text-sm sm:block">
              <span className="block max-w-36 truncate font-medium text-slate-800">{user?.name || 'User'}</span>
              <span className="block text-xs text-slate-500">{user?.role}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {userDropdown && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <p className="px-2 py-1.5 text-xs font-medium text-slate-500">Switch demo user</p>
              {PRESET_USERS.map(preset => {
                const isCurrent = user?.username === preset.username;
                return (
                  <button
                    key={preset.username}
                    type="button"
                    onClick={() => {
                      quickLogin(preset.username);
                      setUserDropdown(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                  >
                    <span>
                      <span className="block text-sm font-medium text-slate-800">{preset.name}</span>
                      <span className="block text-xs text-slate-500">{preset.role}</span>
                    </span>
                    {isCurrent && <Check className="h-4 w-4 text-amber-700" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
