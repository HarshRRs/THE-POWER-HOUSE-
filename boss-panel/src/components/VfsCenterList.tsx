'use client';

import { useState, useEffect } from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { authHeaders } from '@/lib/utils';

interface VfsCenter {
  id: string;
  configId: string;
  name: string;
  destinationCountry: string;
  sourceCountry: string;
  city: string;
  centerCode: string;
  bookingUrl: string;
  checkInterval: number;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR' | 'CAPTCHA_BLOCKED';
  lastScrapedAt: string | null;
  lastSlotFoundAt: string | null;
  consecutiveErrors: number;
  _count?: {
    alerts: number;
    detections: number;
  };
}

interface VfsCenterListProps {
  apiUrl: string;
}

const countryFlags: Record<string, string> = {
  'Italy': '🇮🇹',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Belgium': '🇧🇪',
  'Netherlands': '🇳🇱',
  'Portugal': '🇵🇹',
  'Spain': '🇪🇸',
  'India': '🇮🇳',
};

export function VfsCenterList({ apiUrl }: VfsCenterListProps) {
  const [centers, setCenters] = useState<VfsCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCenters() {
      try {
        const res = await fetch(`${apiUrl}/vfs`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to fetch VFS centers');
        const data = await res.json();
        setCenters(data.centers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchCenters();
  }, [apiUrl]);

  const getStatusColor = (status: VfsCenter['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-success';
      case 'PAUSED': return 'bg-warning';
      case 'ERROR': return 'bg-danger';
      case 'CAPTCHA_BLOCKED': return 'bg-orange-500';
      default: return 'bg-muted';
    }
  };

  const getTimeSince = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Group centers by destination country
  const groupedCenters = centers.reduce((acc, center) => {
    const key = center.destinationCountry;
    if (!acc[key]) acc[key] = [];
    acc[key].push(center);
    return acc;
  }, {} as Record<string, VfsCenter[]>);

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
          <h3 className="font-semibold">VFS Centers</h3>
        </div>
        <p className="text-danger text-center py-4 text-sm">{error}</p>
      </div>
    );
  }

  if (centers.length === 0) {
    return (
      <div className="glass rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border mb-4">
          <Globe className="h-4 w-4 text-blue-400" />
          <h3 className="font-semibold">VFS Centers</h3>
        </div>
        <p className="text-muted text-center py-4 text-sm">
          No VFS centers configured. Run /api/vfs/sync to populate.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-400" />
          VFS Centers ({centers.length})
        </h3>
        <span className="text-xs text-muted">European Visas</span>
      </div>

      <div className="divide-y divide-border">
        {Object.entries(groupedCenters).map(([country, countryCenters]) => (
          <div key={country}>
            <button
              onClick={() => setExpandedCountry(expandedCountry === country ? null : country)}
              className="w-full px-4 py-3 hover:bg-surface/50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{countryFlags[country] || '🌍'}</span>
                <span className="font-medium text-sm">{country}</span>
                <span className="text-xs text-muted">({countryCenters.length} cities)</span>
              </div>
              <div className="flex items-center gap-2">
                {countryCenters.filter(c => c.status === 'ACTIVE').length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-success/20 text-success">
                    {countryCenters.filter(c => c.status === 'ACTIVE').length} active
                  </span>
                )}
                <span className="text-muted text-xs">{expandedCountry === country ? '▲' : '▼'}</span>
              </div>
            </button>
            
            {expandedCountry === country && (
              <div className="bg-surface/30 divide-y divide-border/50">
                {countryCenters.map((center) => (
                  <div
                    key={center.id}
                    className="px-4 py-2 pl-10 hover:bg-surface/50 transition-colors group flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{center.city}</h4>
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(center.status)} flex-shrink-0`} />
                        {center.status === 'CAPTCHA_BLOCKED' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                            CAPTCHA
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted">
                          Last: {getTimeSince(center.lastScrapedAt)}
                        </span>
                        {center._count && (
                          <>
                            <span className="text-xs text-muted">
                              {center._count.alerts} alerts
                            </span>
                            <span className="text-xs text-muted">
                              {center._count.detections} found
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <a
                      href={center.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-primary/10 rounded-lg flex-shrink-0"
                      aria-label={`Open booking page for ${center.city}`}
                    >
                      <ExternalLink className="h-4 w-4 text-primary" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Visa categories legend */}
      <div className="px-4 py-2 border-t border-border">
        <div className="flex flex-wrap gap-1">
          {['Tourist', 'Business', 'Student', 'Work'].map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 rounded text-xs bg-surface border border-border text-muted"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
