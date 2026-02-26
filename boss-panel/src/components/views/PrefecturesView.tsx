'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, ExternalLink, Filter, Zap } from 'lucide-react';

interface Prefecture {
  id: string;
  name: string;
  department: string;
  region: string;
  tier: number;
  status: 'hot' | 'warm' | 'cold';
  lastSlotFoundAt: string | null;
  bookingUrl: string;
}

export default function PrefecturesView() {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  useEffect(() => {
    fetch('/api/boss/prefectures')
      .then(res => res.json())
      .then(data => {
        setPrefectures(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredPrefectures = prefectures.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.department.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' || p.tier === parseInt(tierFilter);
    return matchesSearch && matchesTier;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-gradient-to-br from-cyan to-cyan-dark shadow-glow-cyan';
      case 'warm': return 'bg-cyan/30';
      default: return 'bg-surfaceLight';
    }
  };

  const getTierBadge = (tier: number) => {
    const colors: Record<number, string> = {
      1: 'bg-red-500/10 text-red-400 border-red-500/30',
      2: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      3: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    };
    return colors[tier] || 'bg-surfaceLight text-text-muted';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">PREFECTURES</h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30">
              <MapPin className="w-4 h-4 text-cyan" />
              <span className="text-xs text-cyan font-medium">{prefectures.length} TOTAL</span>
            </div>
          </div>
          <p className="text-text-muted mt-1">Manage prefecture availability and monitoring</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 tech-corner">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search prefectures..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="select"
          >
            <option value="all">All Tiers</option>
            <option value="1">Tier 1 (Priority)</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
          </select>
        </div>
      </div>

      {/* Prefectures Grid */}
      <div className="card overflow-hidden tech-corner">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>Department</th>
                <th>Region</th>
                <th>Tier</th>
                <th>Last Slot</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="spinner" />
                      <span className="text-text-muted">Loading prefectures...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPrefectures.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state py-16">
                      <MapPin className="w-12 h-12 text-cyan/30 mb-4" />
                      <p className="empty-state-title">No prefectures found</p>
                      <p className="empty-state-description">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPrefectures.map((pref) => (
                  <tr key={pref.id} className="hover:bg-cyan/5 transition-colors group">
                    <td>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(pref.status)}`} />
                    </td>
                    <td>
                      <span className="font-semibold text-white group-hover:text-cyan transition-colors">{pref.name}</span>
                    </td>
                    <td>
                      <span className="text-text">{pref.department}</span>
                    </td>
                    <td>
                      <span className="text-text-muted">{pref.region}</span>
                    </td>
                    <td>
                      <span className={`badge ${getTierBadge(pref.tier)}`}>
                        Tier {pref.tier}
                      </span>
                    </td>
                    <td>
                      <span className="text-text-muted text-sm">
                        {pref.lastSlotFoundAt 
                          ? new Date(pref.lastSlotFoundAt).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </td>
                    <td>
                      <a
                        href={pref.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-cyan/10 transition-colors inline-flex"
                      >
                        <ExternalLink className="w-4 h-4 text-text-muted hover:text-cyan transition-colors" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
