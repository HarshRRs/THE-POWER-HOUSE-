'use client';

import { Plus, Bell, RefreshCw, Download, Zap } from 'lucide-react';

interface QuickActionsProps {
  onNavigate?: (tab: string) => void;
}

export default function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <div className="card p-4 lg:p-5 tech-corner">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-cyan" />
        <h3 className="font-semibold text-white text-sm tracking-wide">QUICK ACTIONS</h3>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => onNavigate?.('clients')}
          className="w-full btn btn-primary justify-start text-sm group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          Add New Client
        </button>
        <button
          onClick={() => onNavigate?.('alerts')}
          className="w-full btn btn-secondary justify-start text-sm group"
        >
          <Bell className="w-4 h-4 group-hover:text-cyan transition-colors" />
          Create Alert
        </button>
        <button className="w-full btn btn-secondary justify-start text-sm group">
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Sync Prefectures
        </button>
        <button className="w-full btn btn-secondary justify-start text-sm group">
          <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          Export Report
        </button>
      </div>
    </div>
  );
}
