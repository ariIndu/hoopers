import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, UserPlus, Shield, UserCheck, Key, Lock, AlertCircle } from 'lucide-react';

export default function UsersModal({ isOpen, onClose }) {
  const { token, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    name: '',
    role: 'Responder',
    password: '',
    title: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.username || !form.password) {
      setError('Username and password are required');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess(`User ${data.user.username} created successfully! Logged to tamper-evident audit chain.`);
      setForm({ username: '', name: '', role: 'Responder', password: '', title: '' });
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 border border-amber-300 rounded-lg text-amber-800">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Access Control &amp; RBAC Directory
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 font-semibold">Admin Only</span>
              </h2>
              <p className="text-xs text-slate-500">Manage incident response responders, privileges, and observers</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
          
          {/* Current Users Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Active Accounts ({users.length})
            </h3>
            
            <div className="space-y-2.5">
              {users.map(u => (
                <div key={u.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-xs font-mono text-slate-500">@{u.username}</div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                      u.role === 'Admin' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      u.role === 'Responder' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    <span>{u.title}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">Enforced Role Permissions:</div>
              <div>• <span className="text-amber-800 font-mono font-bold">Admin</span>: Full privileges, RBAC management, incident declaration</div>
              <div>• <span className="text-emerald-700 font-mono font-bold">Responder</span>: Asset status quarantine, timeline logs, tactical chat</div>
              <div>• <span className="text-slate-700 font-mono font-bold">Viewer</span>: Read-only access for external legal counsel &amp; observers</div>
            </div>
          </div>

          {/* Add User Form */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-600" />
              Enroll Response Operator
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <UserCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  placeholder="e.g. j.smith"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Smith"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Privilege</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                >
                  <option value="Responder">Responder (Read/Write Incident &amp; Assets)</option>
                  <option value="Admin">Admin (Full Control + RBAC)</option>
                  <option value="Viewer">Viewer (Read-Only Observer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Malware Analyst"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  placeholder="Temporary password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Stored securely with bcrypt 10 rounds.</span>
              </div>

              <button
                type="submit"
                disabled={!isAdmin}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                Create Account &amp; Log to Audit Chain
              </button>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span className="font-mono">Audit Log: Every account creation triggers a SHA-256 block creation</span>
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
