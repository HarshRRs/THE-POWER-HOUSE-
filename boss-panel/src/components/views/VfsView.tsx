'use client';

import { useState, useEffect } from 'react';
import { Globe, ExternalLink, ChevronDown, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { API_URL, authHeaders } from '@/lib/utils';

interface VfsCenter {
  id: string;
  name: string;
  destinationCountry: string;
  city: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  lastScrapedAt: string | null;
  bookingUrl: string;
}

export default function VfsView() {
  const [centers, setCenters] = useState<VfsCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  function fetchCenters() {
    setError(null);
    setLoading(true);
    fetch(`${API_URL}/vfs`, { headers: authHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load VFS centers (${res.status})`);
        return res.json();
      })
      .then(data => {
        setCenters(data.centers || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load VFS centers');
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchCenters();
  }, []);

  const groupedCenters = centers.reduce((acc, center) => {
    const key = center.destinationCountry;
    if (!acc[key]) acc[key] = [];
    acc[key].push(center);
    return acc;
  }, {} as Record<string, VfsCenter[]>);

  const countryFlags: Record<string, string> = {
    'Italy': '🇮🇹',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Switzerland': '🇨🇭',
    'Austria': '🇦🇹',
    'Belgium': '🇧🇪',
    'Netherlands': '🇳🇱',
    'Portugal': '🇵🇹',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge-success">Active</span>;
      case 'PAUSED':
        return <span className="badge badge-warning">Paused</span>;
      case 'ERROR':
        return <span className="badge badge-danger">Error</span>;
      default:
        return <span className="badge bg-surfaceLight text-text-muted">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">VFS CENTERS</h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30">
              <Globe className="w-4 h-4 text-cyan" />
              <span className="text-xs text-cyan font-medium">{centers.length} CENTERS</span>
            </div>
          </div>
          <p className="text-text-muted mt-1">Manage VFS Global center monitoring</p>
        </div>
      </div>

      {/* VFS Centers List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card p-8 tech-corner">
            <div className="flex flex-col items-center gap-3">
              <div className="spinner" />
              <span className="text-text-muted">Loading VFS centers...</span>
            </div>
          </div>
        ) : error ? (
          <div className="card p-8 tech-corner">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-red-400">{error}</p>
              <button onClick={fetchCenters} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-cyan/10 text-cyan rounded-lg hover:bg-cyan/20">
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            </div>
          </div>
        ) : Object.keys(groupedCenters).length === 0 ? (
          <div className="card p-8 tech-corner">
            <div className="empty-state">
              <Globe className="w-12 h-12 text-cyan/30 mb-4" />
              <p className="empty-state-title">No VFS centers found</p>
              <p className="empty-state-description">No centers are currently configured</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedCenters).map(([country, countryCenters]) => (
            <div key={country} className="card overflow-hidden tech-corner">
              {/* Country Header */}
              <button
                onClick={() => setExpandedCountry(expandedCountry === country ? null : country)}
                className="w-full p-4 flex items-center justify-between hover:bg-cyan/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{countryFlags[country] || '🌍'}</span>
                  <div>
                    <h3 className="font-semibold text-white">{country}</h3>
                    <p className="text-xs text-text-muted">{countryCenters.length} centers</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
                    <span className="text-xs text-cyan">
                      {countryCenters.filter(c => c.status === 'ACTIVE').length} active
                    </span>
                  </div>
                  {expandedCountry === country ? (
                    <ChevronDown className="w-5 h-5 text-cyan" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-text-muted" />
                  )}
                </div>
              </button>

              {/* Centers List */}
              {expandedCountry === country && (
                <div className="border-t border-cyan/10">
                  {countryCenters.map((center) => (
                    <div
                      key={center.id}
                      className="p-4 flex items-center justify-between hover:bg-cyan/5 transition-colors group border-b border-cyan/10 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-cyan transition-colors">{center.name}</p>
                          <p className="text-xs text-text-muted">{center.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(center.status)}
                        <a
                          href={center.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-cyan/10 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-text-muted hover:text-cyan transition-colors" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
