'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Globe,
  Settings,
  Bell,
  Activity,
  Menu,
  X,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'prefectures', label: 'Prefectures', icon: MapPin },
  { id: 'vfs', label: 'VFS Centers', icon: Globe },
  { id: 'stream', label: 'Live Stream', icon: Activity },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-sidebar text-white z-50 flex-col shadow-sidebar border-r border-cyan/20">
        {/* Logo - Sticky */}
        <div className="flex flex-col px-6 py-6 border-b border-cyan/20 bg-sidebar flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan to-cyan-dark flex items-center justify-center shadow-glow-cyan animate-pulse-glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">
                BOSS<span className="text-cyan">ADMIN</span>
              </h1>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
              <p className="text-xs text-cyan font-medium tracking-wider uppercase">
                System Online
              </p>
            </div>
          </div>
          <div className="mt-2 text-right">
            <p className="text-sm font-semibold text-amber-400">Har Har Mahadev</p>
            <p className="text-xs text-orange-400">JAY Shakti Maa</p>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan/20 to-cyan-dark/20 text-cyan font-semibold border border-cyan/30 shadow-glow-cyan'
                      : 'text-text-muted hover:bg-cyan/5 hover:text-cyan'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-all ${isActive ? 'text-cyan' : 'group-hover:text-cyan'}`} />
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan shadow-glow-cyan" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section - Sticky */}
        <div className="px-3 py-4 border-t border-cyan/20 bg-sidebar flex-shrink-0">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan/20 to-cyan-dark/20 text-cyan font-semibold border border-cyan/30 shadow-glow-cyan'
                    : 'text-text-muted hover:bg-cyan/5 hover:text-cyan'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-all ${isActive ? 'text-cyan' : 'group-hover:text-cyan'}`} />
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan shadow-glow-cyan" />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Mobile Header - Fixed Sticky */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar text-white z-50 flex items-center justify-between px-4 shadow-header border-b border-cyan/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan to-cyan-dark flex items-center justify-center shadow-glow-cyan">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base">
              BOSS<span className="text-cyan">ADMIN</span>
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
              <p className="text-[10px] text-cyan tracking-wider uppercase">Online</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-cyan/10 transition-colors border border-cyan/20"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileOpen ? <X className="w-5 h-5 text-cyan" /> : <Menu className="w-5 h-5 text-cyan" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`lg:hidden fixed top-16 left-0 right-0 bg-sidebar border-b border-cyan/20 text-white z-40 transition-all duration-300 overflow-hidden ${
        mobileOpen ? 'max-h-[calc(100vh-4rem)]' : 'max-h-0'
      }`}>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan/20 to-cyan-dark/20 text-cyan font-semibold border border-cyan/30'
                    : 'text-text-muted hover:bg-cyan/5 hover:text-cyan'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-all ${isActive ? 'text-cyan' : 'group-hover:text-cyan'}`} />
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan shadow-glow-cyan" />
                )}
              </button>
            );
          })}
          <div className="border-t border-cyan/20 my-3" />
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan/20 to-cyan-dark/20 text-cyan font-semibold border border-cyan/30'
                    : 'text-text-muted hover:bg-cyan/5 hover:text-cyan'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-all ${isActive ? 'text-cyan' : 'group-hover:text-cyan'}`} />
                <span className="text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan shadow-glow-cyan" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
