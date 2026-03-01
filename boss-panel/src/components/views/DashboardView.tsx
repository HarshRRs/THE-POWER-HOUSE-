'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import PowerStatsGrid from '@/components/dashboard/PowerStatsGrid';
import SlotMatrix from '@/components/dashboard/SlotMatrix';
import SystemHealth from '@/components/dashboard/SystemHealth';
import TopPrefectures from '@/components/dashboard/TopPrefectures';
import QuickActions from '@/components/dashboard/QuickActions';
import { Zap, Activity, Sparkles } from 'lucide-react';

export default function DashboardView({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { isConnected, latestDetection } = useWebSocket();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              COMMAND CENTER
            </h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30">
              <Activity className="w-4 h-4 text-cyan animate-pulse" />
              <span className="text-xs text-cyan font-medium">LIVE</span>
            </div>
          </div>
          <p className="text-text-muted mt-1 text-sm">
            Full booking automation monitoring & control
          </p>
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
              ALL SYSTEMS GO
            </div>
          )}
        </div>
      </div>

      {/* Latest Detection Alert */}
      {latestDetection && (
        <div className="card p-4 border-l-4 border-l-green-500 bg-gradient-to-r from-green-500/10 to-transparent animate-fade-in tech-corner">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-lg flex items-center gap-2">
                SLOT DETECTED
                <span className="text-xs font-normal text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
                  LIVE
                </span>
              </p>
              <p className="text-green-300">
                {latestDetection.prefectureName || latestDetection.vfsCenterName} 
                {latestDetection.slotDate && ` - ${latestDetection.slotDate}`}
                {latestDetection.slotTime && ` at ${latestDetection.slotTime}`}
              </p>
            </div>
            <div className="hidden sm:block">
              <span className="text-xs text-text-muted bg-surfaceLight px-3 py-1 rounded-full">
                Just now
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Power Stats Grid - Main Metrics */}
      <PowerStatsGrid />

      {/* Main Content - 3 Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">
        {/* Left Column - Slot Matrix (Full Width on Mobile, 8 cols on XL) */}
        <div className="xl:col-span-8">
          <SlotMatrix />
        </div>

        {/* Right Column - Sidebar Components */}
        <div className="xl:col-span-4 space-y-4">
          {/* System Health */}
          <SystemHealth />

          {/* Quick Actions */}
          <QuickActions onNavigate={onNavigate} />

          {/* Top Prefectures */}
          <TopPrefectures />
        </div>
      </div>
    </div>
  );
}
