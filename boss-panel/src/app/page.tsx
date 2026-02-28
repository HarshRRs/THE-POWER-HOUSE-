'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import DashboardView from '@/components/views/DashboardView';
import ClientsView from '@/components/views/ClientsView';
import PrefecturesView from '@/components/views/PrefecturesView';
import VfsView from '@/components/views/VfsView';
import StreamView from '@/components/views/StreamView';
import AlertsView from '@/components/views/AlertsView';
import SettingsView from '@/components/views/SettingsView';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
      case 'clients':
        return <ClientsView />;
      case 'prefectures':
        return <PrefecturesView />;
      case 'vfs':
        return <VfsView />;
      case 'stream':
        return <StreamView />;
      case 'alerts':
        return <AlertsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-8">
        {/* Fixed Header for Desktop */}
        <div className="hidden lg:block sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-text tracking-tight">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h1>
                <p className="text-sm text-text-muted mt-0.5">
                  {activeTab === 'dashboard' && 'Monitor your appointment system'}
                  {activeTab === 'clients' && 'Manage your clients'}
                  {activeTab === 'prefectures' && 'View prefecture availability'}
                  {activeTab === 'vfs' && 'VFS center management'}
                  {activeTab === 'stream' && 'Live activity feed'}
                  {activeTab === 'alerts' && 'Configure notifications'}
                  {activeTab === 'settings' && 'System configuration'}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gold">Har Har Mahadev</p>
                  <p className="text-xs text-amber-400">JAY Shakti Maa</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                  <span className="text-sm text-text-muted">System Online</span>
                </div>
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

      {/* Mobile Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
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
