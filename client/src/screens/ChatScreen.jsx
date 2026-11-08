import React, { useState, useEffect, useRef } from 'react';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, Send, ShieldAlert, Lock, Radio, 
  Terminal, User, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';

export default function ChatScreen() {
  const { messages, sendChatMessage } = useIncident();
  const { user } = useAuth();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendChatMessage(input.trim());
      setInput('');
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  function handleSendCanned(text) {
    setInput(text);
  }

  const tacticalSnippets = [
    'VLAN 40 isolation confirmed complete. Core L3 routes dropped.',
    'Forensic volatile RAM image dumped from AD-DC-01.',
    'Winstead PC external breach counsel retained under privilege.',
    'Under HIPAA 45 CFR § 164.404, we have a 60-day notification clock on PHI.',
    'Air-gapped backup NAS-AIRGAP verified untampered and clean.',
    'Do NOT communicate ransom details over corporate Teams or Slack.'
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-84px)] overflow-hidden bg-slate-50 p-6 space-y-4">
      
      {/* Air-gapped Out-of-band Critical Warning Banner - Clean Amber Alert */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-100 border border-amber-300 rounded-xl text-amber-800">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-amber-950 tracking-tight font-sans">
                Out-of-Band Air-Gapped Tactical Channel
              </h2>
              <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                RESTRICTED
              </span>
            </div>
            <p className="text-xs text-amber-900/80 mt-0.5">
              Protocol: Do not use corporate email, Slack, or Microsoft Teams. Internal mail servers are assumed compromised.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Local WebSocket Bus // Zero External Relays</span>
        </div>
      </div>

      {/* Main Chat Container - Clean White Card */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between overflow-hidden shadow-xs">
        
        {/* Messages Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => {
            const isMe = msg.sender === user?.username;

            return (
              <div 
                key={msg.id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-2 mb-1 px-1">
                  <span className="text-xs font-bold text-slate-800">
                    {msg.senderName || msg.sender}
                  </span>
                  
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                    msg.role === 'Admin' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    msg.role === 'Responder' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {msg.role}
                  </span>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(msg.ts).toLocaleTimeString()}
                  </span>
                </div>

                <div className={`max-w-xl p-3.5 rounded-2xl text-xs font-mono leading-relaxed shadow-xs ${
                  isMe
                    ? 'bg-amber-50 border border-amber-300 text-amber-950 rounded-tr-none'
                    : 'bg-slate-100 border border-slate-200 text-slate-900 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Tactical Canned Presets */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto text-xs font-sans">
          <span className="text-slate-500 font-medium flex items-center gap-1 flex-shrink-0">
            <Terminal className="w-3.5 h-3.5 text-amber-600" />
            Quick Directives:
          </span>
          {tacticalSnippets.map((snippet, i) => (
            <button
              key={i}
              onClick={() => handleSendCanned(snippet)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 whitespace-nowrap transition text-xs shadow-xs"
            >
              {snippet.substring(0, 32)}...
            </button>
          ))}
        </div>

        {/* Chat Input Form */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            placeholder="Broadcast tactical directive to incident response team..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={sending}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono shadow-xs"
            required
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>

      </div>

    </div>
  );
}
