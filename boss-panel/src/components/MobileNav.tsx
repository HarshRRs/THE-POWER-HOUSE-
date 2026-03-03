'use client';

import {
  Bell,
  Users,
  Building2,
  MessageCircle,
  Settings2,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'alerts',    label: 'Alerts',    icon: Bell },
  { id: 'clients',   label: 'Clients',   icon: Users },
  { id: 'embassy',   label: 'Embassy',   icon: Building2 },
  { id: 'whatsapp',  label: 'WhatsApp',  icon: MessageCircle },
  { id: 'control',   label: 'Control',   icon: Settings2 },
];

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-sky-100 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-[60px] px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                isActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span
                className={`text-[10px] font-medium leading-none ${
                  isActive ? 'text-sky-600' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
