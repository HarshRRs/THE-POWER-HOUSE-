'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import AlertsView from '@/components/views/AlertsView';
import PrefecturesView from '@/components/views/PrefecturesView';
import EmbassyView from '@/components/views/EmbassyView';
import ClientsView from '@/components/views/ClientsView';
import WhatsAppView from '@/components/views/WhatsAppView';
import AnalyticsView from '@/components/views/AnalyticsView';
import ControlView from '@/components/views/ControlView';

type TabId = 'alerts' | 'prefectures' | 'embassy' | 'clients' | 'whatsapp' | 'analytics' | 'control';

interface TabMeta {
  title: string;
  description: string;
}

const TAB_META: Record<TabId, TabMeta> = {
  alerts:      { title: 'Alerts',             description: 'Create WhatsApp alert subscriptions' },
  prefectures: { title: 'Prefectures',       description: 'Monitor all French prefectures' },
  embassy:     { title: 'Indian Embassy',    description: 'Embassy slot monitoring' },
  clients:     { title: 'Clients',           description: 'Manage your clients' },
  whatsapp:    { title: 'WhatsApp Alerts',   description: 'Alert delivery & tracking' },
  analytics:   { title: 'Analytics',         description: 'Performance insights' },
  control:     { title: 'System Control',    description: 'Manage scrapers & workers' },
};

function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('alerts');

  const meta = TAB_META[activeTab] ?? TAB_META['alerts'];

  const renderView = () => {
    switch (activeTab) {
      case 'alerts':
        return <AlertsView />;
      case 'prefectures':
        return <PrefecturesView />;
      case 'embassy':
        return <EmbassyView />;
      case 'clients':
        return <ClientsView />;
      case 'whatsapp':
        return <WhatsAppView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'control':
        return <ControlView />;
      default:
        return <AlertsView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabId)} />

      {/* Main Content Area */}
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-8">

        {/* Desktop Header */}
        <div className="hidden lg:block sticky top-0 z-30 bg-white border-b border-sky-200 shadow-sm">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
                  {meta.title}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {meta.description}
                </p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-700">System Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 lg:pt-0">
          <div className="px-4 lg:px-8 py-4 lg:py-8">
            {renderView()}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabId)} />
    </div>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Dashboard />;
}

export default function BossDashboard() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
