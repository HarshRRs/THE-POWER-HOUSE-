"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Globe, AlertCircle, RefreshCw } from "lucide-react";
import { API_URL, authHeaders } from "@/lib/utils";

interface Consulate {
  id: string;
  name: string;
  country: string;
  city: string;
  type: string;
  baseUrl: string;
  status: string;
  lastScrapedAt: string | null;
  _count: {
    alerts: number;
    detections: number;
  };
}

export default function ConsulateList() {
  const [consulates, setConsulates] = useState<Consulate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function fetchConsulates() {
    setError(null);
    setLoading(true);
    fetch(`${API_URL}/consulates`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load consulates (${res.status})`);
        return res.json();
      })
      .then((res) => {
        setConsulates(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load consulates');
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchConsulates();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-success";
      case "PAUSED":
        return "bg-warning";
      case "ERROR":
        return "bg-danger";
      default:
        return "bg-muted";
    }
  };

  const getCountryFlag = (country: string) => {
    switch (country.toLowerCase()) {
      case "india":
        return "🇮🇳";
      default:
        return "🏛️";
    }
  };

  const getTimeSince = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const seconds = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000
    );
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="glass rounded-xl p-8 border border-border text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border mb-4">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Consulates</h3>
        </div>
        <div className="flex flex-col items-center gap-3 py-4">
          <AlertCircle className="h-8 w-8 text-danger" />
          <p className="text-danger text-sm">{error}</p>
          <button onClick={fetchConsulates} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (consulates.length === 0) {
    return (
      <div className="glass rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border mb-4">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Consulates</h3>
        </div>
        <p className="text-muted text-center py-4 text-sm">
          No consulates configured. Run seed to add Indian Embassy Paris.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Consulates ({consulates.length})
        </h3>
      </div>

      <div className="divide-y divide-border">
        {consulates.map((consulate) => (
          <div
            key={consulate.id}
            className="px-4 py-3 hover:bg-surface/50 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {getCountryFlag(consulate.country)}
                  </span>
                  <h4 className="font-medium text-sm truncate">
                    {consulate.name}
                  </h4>
                  <div
                    className={`h-2 w-2 rounded-full ${getStatusColor(
                      consulate.status
                    )} flex-shrink-0`}
                  />
                </div>
                <p className="text-xs text-muted mt-1">
                  {consulate.city}, {consulate.country} - {consulate.type}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted">
                    Alerts: {consulate._count.alerts}
                  </span>
                  <span className="text-xs text-muted">
                    Detections: {consulate._count.detections}
                  </span>
                  <span className="text-xs text-muted">
                    Last check: {getTimeSince(consulate.lastScrapedAt)}
                  </span>
                </div>

                {/* Service categories */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {["Passport", "OCI", "Visa", "Birth Reg."].map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded text-xs bg-surface border border-border text-muted"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={consulate.baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-primary/10 rounded-lg flex-shrink-0"
                aria-label={`Open ${consulate.name} website`}
              >
                <ExternalLink className="h-4 w-4 text-primary" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
