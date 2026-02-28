"use client";

import { Activity, Zap, Radio } from "lucide-react";

export default function Header() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="h-8 w-8 text-primary" />
            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-success pulse-ring" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider">
              RDVPriority <span className="text-primary">NEXUS</span>
            </h1>
            <p className="text-xs text-muted">Command Center v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-primary">Har Har Mahadev</p>
            <p className="text-xs text-warning">JAY Shakti Maa</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Radio className="h-4 w-4 text-success" />
            <span className="text-muted">System:</span>
            <span className="font-mono text-success">ONLINE</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-warning" />
            <span className="text-muted">Mode:</span>
            <span className="font-mono text-warning">AGGRESSIVE</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 border border-border">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-mono">LIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
}
