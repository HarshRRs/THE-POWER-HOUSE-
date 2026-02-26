'use client';

import { LayoutDashboard, Users, Activity, MoreHorizontal } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'stream', label: 'Live', icon: Activity },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const handleClick = (id: string) => {
    if (id === 'more') {
      onTabChange('prefectures');
    } else {
      onTabChange(id);
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 mobile-safe-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'more' && 
            ['prefectures', 'vfs', 'alerts', 'settings'].includes(activeTab));
          
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative ${
                isActive 
                  ? 'text-gold' 
                  : 'text-muted hover:text-text'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -top-1 w-1 h-1 rounded-full bg-gold shadow-gold" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
