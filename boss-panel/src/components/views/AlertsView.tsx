'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Power, RefreshCw, AlertCircle } from 'lucide-react';
import { API_URL, authHeaders } from '@/lib/utils';

interface Alert {
  id: string;
  userId: string;
  user?: { email: string };
  prefectureId?: string;
  prefecture?: { name: string };
  vfsCenterId?: string;
  vfsCenter?: { name: string };
  consulateId?: string;
  consulate?: { name: string };
  procedure: string;
  isActive: boolean;
  slotsFound: number;
  lastCheckedAt: string | null;
  createdAt: string;
}

export default function AlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function fetchAlerts() {
    setError(null);
    setLoading(true);
    fetch(`${API_URL}/admin/alerts`, { headers: authHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load alerts (${res.status})`);
        return res.json();
      })
      .then(data => {
        setAlerts(data.alerts || data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load alerts');
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function toggleAlert(alertId: string) {
    try {
      await fetch(`${API_URL}/admin/alerts/${alertId}/toggle`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      fetchAlerts();
    } catch {
      // silently refresh
    }
  }

  async function deleteAlert(alertId: string) {
    if (!confirm('Delete this alert?')) return;
    try {
      await fetch(`${API_URL}/admin/alerts/${alertId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      fetchAlerts();
    } catch {
      // silently refresh
    }
  }

  function getLocationName(alert: Alert): string {
    if (alert.prefecture?.name) return alert.prefecture.name;
    if (alert.vfsCenter?.name) return alert.vfsCenter.name;
    if (alert.consulate?.name) return alert.consulate.name;
    return alert.prefectureId || alert.vfsCenterId || alert.consulateId || 'Unknown';
  }

  function getAlertType(alert: Alert): string {
    if (alert.prefectureId) return 'Prefecture';
    if (alert.vfsCenterId) return 'VFS';
    if (alert.consulateId) return 'Consulate';
    return 'Unknown';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">ALERTS</h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30">
              <Bell className="w-4 h-4 text-cyan" />
              <span className="text-xs text-cyan font-medium">{alerts.length} ALERTS</span>
            </div>
          </div>
          <p className="text-text-muted mt-1">Manage appointment alerts and notifications</p>
        </div>
        <button onClick={fetchAlerts} className="btn btn-primary group" aria-label="Refresh alerts">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Alerts List */}
      <div className="card overflow-hidden tech-corner">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Location</th>
                <th>Procedure</th>
                <th>Status</th>
                <th>Slots Found</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex items-center justify-center py-16">
                      <div className="animate-spin h-6 w-6 border-2 border-cyan border-t-transparent rounded-full" />
                      <span className="ml-3 text-text-muted">Loading alerts...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <AlertCircle className="w-12 h-12 text-red-400" />
                      <p className="text-red-400">{error}</p>
                      <button onClick={fetchAlerts} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-cyan/10 text-cyan rounded-lg hover:bg-cyan/20">
                        <RefreshCw className="h-4 w-4" /> Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state py-16">
                      <Bell className="w-12 h-12 text-cyan/30 mb-4" />
                      <p className="empty-state-title">No alerts configured</p>
                      <p className="empty-state-description">
                        Alerts will appear here when clients create monitoring alerts
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                alerts.map(alert => (
                  <tr key={alert.id}>
                    <td className="text-sm">{alert.user?.email || alert.userId}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        getAlertType(alert) === 'Prefecture' ? 'bg-cyan/10 text-cyan' :
                        getAlertType(alert) === 'VFS' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-orange-500/10 text-orange-400'
                      }`}>
                        {getAlertType(alert)}
                      </span>
                    </td>
                    <td className="text-sm">{getLocationName(alert)}</td>
                    <td className="text-xs text-text-muted">{alert.procedure}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        alert.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {alert.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-sm font-mono">{alert.slotsFound}</td>
                    <td className="text-xs text-text-muted">
                      {new Date(alert.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleAlert(alert.id)}
                          className="p-1.5 rounded hover:bg-cyan/10 transition-colors"
                          title={alert.isActive ? 'Deactivate' : 'Activate'}
                          aria-label={alert.isActive ? 'Deactivate alert' : 'Activate alert'}
                        >
                          <Power className={`w-4 h-4 ${alert.isActive ? 'text-emerald-400' : 'text-text-muted'}`} />
                        </button>
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                          title="Delete"
                          aria-label="Delete alert"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
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
