'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Users,
  MessageCircle,
  BarChart3,
  Settings2,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard',   label: 'Command Center',   icon: LayoutDashboard },
  { id: 'prefectures', label: 'Prefectures',       icon: MapPin },
  { id: 'embassy',     label: 'Indian Embassy',    icon: Building2 },
  { id: 'clients',     label: 'Clients',           icon: Users },
  { id: 'whatsapp',    label: 'WhatsApp Alerts',   icon: MessageCircle },
  { id: 'analytics',   label: 'Analytics',         icon: BarChart3 },
  { id: 'control',     label: 'System Control',    icon: Settings2 },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (id: string) => {
    onTabChange(id);
    setMobileOpen(false);
  };

  const NavItem = ({ item }: { item: typeof menuItems[number] }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 text-sm group ${
          isActive
            ? 'bg-sky-50 text-sky-700 border-l-4 border-sky-600 font-semibold pl-3'
            : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700 border-l-4 border-transparent pl-3'
        }`}
      >
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${
            isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-sky-600'
          }`}
        />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* ───────────────── DESKTOP SIDEBAR ───────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-sky-100 shadow-sm z-50 flex-col">

        {/* Logo section */}
        <div className="px-5 py-5 border-b border-sky-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-600">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sky-700 text-sm tracking-tight leading-none">
                POWER HOUSE
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Immigration Monitor</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-sky-50 mx-4 mt-3" />

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
          {menuItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-2 py-4 border-t border-sky-100 flex-shrink-0 space-y-1">
          {/* System status */}
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium">Live</span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border-l-4 border-transparent pl-3"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ───────────────── MOBILE HEADER ───────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-sky-100 z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-600">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sky-700 text-sm tracking-tight">POWER HOUSE</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-sky-50 transition-colors"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? (
            <X className="w-5 h-5 text-slate-600" />
          ) : (
            <Menu className="w-5 h-5 text-slate-600" />
          )}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-14 left-0 right-0 bg-white border-b border-sky-100 z-40 transition-all duration-300 overflow-hidden ${
          mobileOpen ? 'max-h-[calc(100vh-3.5rem)]' : 'max-h-0'
        }`}
      >
        <nav className="px-2 py-3 space-y-0.5">
          {menuItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
          <div className="h-px bg-sky-50 mx-2 my-2" />
          <button
            onClick={() => { logout(); setMobileOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border-l-4 border-transparent pl-3"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Log Out</span>
          </button>
        </nav>
      </div>
    </>
  );
}
