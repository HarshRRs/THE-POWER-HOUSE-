"use client";

import { LayoutDashboard, Map, List, Activity } from "lucide-react";

interface Props {
  activeTab: 'dashboard' | 'map' | 'list' | 'stream';
  onTabChange: (tab: 'dashboard' | 'map' | 'list' | 'stream') => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'list', label: 'List', icon: List },
  { id: 'stream', label: 'Live', icon: Activity },
] as const;

export default function MobileNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden glass border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
