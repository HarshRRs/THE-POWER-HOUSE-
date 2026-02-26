'use client';

import { Settings, Database, Bell, Shield, Globe, Zap } from 'lucide-react';

export default function SettingsView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">SETTINGS</h1>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30">
            <Settings className="w-4 h-4 text-cyan" />
            <span className="text-xs text-cyan font-medium">CONFIGURATION</span>
          </div>
        </div>
        <p className="text-text-muted mt-1">Configure your admin panel preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="card p-6 tech-corner">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan to-cyan-dark flex items-center justify-center shadow-glow-cyan">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">General</h3>
              <p className="text-sm text-text-muted">Basic panel settings</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-cyan block mb-2 uppercase tracking-wider text-xs font-medium">Language</label>
              <select className="select w-full">
                <option>English</option>
                <option>French</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-cyan block mb-2 uppercase tracking-wider text-xs font-medium">Timezone</label>
              <select className="select w-full">
                <option>Europe/Paris (CET)</option>
                <option>UTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card p-6 tech-corner">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Notifications</h3>
              <p className="text-sm text-text-muted">Alert preferences</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text">Email Alerts</span>
              <div className="w-12 h-6 rounded-full bg-cyan/20 relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-cyan shadow-glow-cyan" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text">Push Notifications</span>
              <div className="w-12 h-6 rounded-full bg-surfaceLight relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-text-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card p-6 tech-corner">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Security</h3>
              <p className="text-sm text-text-muted">Access control</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text">Two-Factor Auth</span>
              <div className="w-12 h-6 rounded-full bg-cyan/20 relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-cyan shadow-glow-cyan" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text">Session Timeout</span>
              <span className="text-cyan font-medium">30 min</span>
            </div>
          </div>
        </div>

        {/* API Settings */}
        <div className="card p-6 tech-corner">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">API</h3>
              <p className="text-sm text-text-muted">Integration settings</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-cyan block mb-2 uppercase tracking-wider text-xs font-medium">API Key</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value="••••••••••••••••" 
                  readOnly 
                  className="input flex-1"
                />
                <button className="btn btn-secondary px-4">
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
