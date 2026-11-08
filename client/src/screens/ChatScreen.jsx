import React, { useEffect, useRef, useState } from 'react';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { Send } from 'lucide-react';

export default function ChatScreen() {
  const { messages, sendChatMessage, wsConnected } = useIncident();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await sendChatMessage(text);
      setInput('');
    } catch (error) {
      alert(`Could not send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="screen-scroll flex-1 overflow-y-auto bg-slate-50 p-4 md:p-7">
      <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h1 className="font-semibold text-slate-950">Incident response</h1>
            <p className="mt-0.5 text-xs text-slate-500">Team chat</p>
          </div>
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <i className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {wsConnected ? 'Connected' : 'Reconnecting'}
          </span>
        </header>

        <div className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-sm text-amber-950">
          Don’t use corporate email, Slack, or Teams for incident response.
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-6">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">No messages yet. Start the conversation with your response team.</p>
          )}
          {messages.map((message, index) => {
            const isMe = message.sender === user?.username;
            const sender = message.senderName || message.sender || 'Team member';
            const initials = sender.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
            const timestamp = message.ts ? new Date(message.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

            return (
              <div key={message.id || `${message.sender}-${index}`} className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {initials}
                </div>
                <div className={`max-w-[82%] ${isMe ? 'text-right' : ''}`}>
                  <div className={`mb-1 flex items-center gap-2 text-xs text-slate-500 ${isMe ? 'justify-end' : ''}`}>
                    <span className="font-medium text-slate-700">{isMe ? 'You' : sender}</span>
                    {timestamp && <time>{timestamp}</time>}
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 text-left text-sm leading-6 ${
                    isMe ? 'rounded-br-sm bg-amber-100 text-slate-900' : 'rounded-bl-sm bg-slate-100 text-slate-800'
                  }`}>
                    {message.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-slate-200 p-3 md:p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder="Message the response team"
              aria-label="Message the response team"
              disabled={sending}
              required
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
