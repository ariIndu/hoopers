import React from 'react';
import { FileText, Hexagon, MessageSquare, Shield, Siren } from 'lucide-react';

const navItems = [
  { id: 'hive', label: 'Assets', icon: Hexagon },
  { id: 'incident', label: 'Incident log', icon: Siren },
  { id: 'chat', label: 'Team chat', icon: MessageSquare },
  { id: 'nessus', label: 'Vulnerability scan', icon: Shield },
  { id: 'board-brief', label: 'Board report', icon: FileText }
];

export default function Sidebar({ currentScreen, setScreen }) {
  return (
    <aside className="print-hide flex w-full shrink-0 flex-col border-b border-slate-200 bg-white md:w-56 md:border-b-0 md:border-r">
      <nav aria-label="Workspace tools" className="flex gap-1 overflow-x-auto p-2 md:flex-col md:gap-0.5 md:p-3">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setScreen(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition md:w-full ${
                active ? 'bg-amber-100 font-medium text-amber-950' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-amber-800' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <p className="mx-3 mb-3 mt-auto hidden rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-950 md:block">
        Don’t use corporate email, Slack, or Teams.
      </p>
    </aside>
  );
}
