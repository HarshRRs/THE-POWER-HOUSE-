'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import StatsCards from '@/components/dashboard/StatsCards';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuickActions from '@/components/dashboard/QuickActions';
import PrefectureHeatmap from '@/components/dashboard/PrefectureHeatmap';
import TopPrefectures from '@/components/dashboard/TopPrefectures';
import { Zap, Activity } from 'lucide-react';

export default function DashboardView({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { isConnected, latestDetection } = useWebSocket();

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              DASHBOARD
            </h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30">
              <Activity className="w-4 h-4 text-cyan" />
              <span className="text-xs text-cyan font-medium">LIVE MONITORING</span>
            </div>
          </div>
          <p className="text-text-muted mt-1 text-sm">Real-time appointment system monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          {!isConnected && (
            <div className="badge badge-warning">
              <span className="status-dot status-dot-warning mr-2 animate-pulse" />
              Reconnecting...
            </div>
          )}
          {isConnected && (
            <div className="badge badge-cyan">
              <Zap className="w-3 h-3 mr-1" />
              SYSTEM ONLINE
            </div>
          )}
        </div>
      </div>

      {/* Latest Detection Alert */}
      {latestDetection && (
        <div className="card p-4 border-l-4 border-l-cyan bg-gradient-to-r from-cyan/10 to-transparent animate-fade-in tech-corner">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan to-cyan-dark flex items-center justify-center flex-shrink-0 shadow-glow-cyan animate-pulse-glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-lg">NEW SLOT DETECTED</p>
              <p className="text-cyan">
                {latestDetection.prefectureName || latestDetection.vfsCenterName} - {latestDetection.slotDate} at {latestDetection.slotTime}
              </p>
            </div>
            <div className="hidden sm:block">
              <span className="text-xs text-text-muted bg-surfaceLight px-3 py-1 rounded-full">Just now</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-4 lg:space-y-6">
          <PrefectureHeatmap />
          <RecentActivity />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-4 lg:space-y-6">
          <QuickActions onNavigate={onNavigate} />
          <TopPrefectures />
        </div>
      </div>
    </div>
  );
}
