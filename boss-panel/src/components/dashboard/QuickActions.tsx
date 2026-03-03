'use client';

import { Plus, MessageCircle, MapPin, Settings2 } from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (tab: string) => void;
}

const actions = [
  { id: 'clients', label: 'Add Client', icon: Plus, color: 'text-sky-600 bg-sky-50 hover:bg-sky-100' },
  { id: 'whatsapp', label: 'WhatsApp Alerts', icon: MessageCircle, color: 'text-green-600 bg-green-50 hover:bg-green-100' },
  { id: 'prefectures', label: 'Prefectures', icon: MapPin, color: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
  { id: 'control', label: 'System Control', icon: Settings2, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
];

export default function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <div className="bg-white rounded-xl border border-sky-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${action.color}`}
            >
              <Icon size={16} />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
