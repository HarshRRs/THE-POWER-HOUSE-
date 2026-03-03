'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, CheckCheck, XCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

export default function WhatsAppView() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sent: 0, delivered: 0, failed: 0 });

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch('/api/admin/alerts');
      if (res.ok) {
        const json = await res.json();
        const d = json.data || json || {};
        setAlerts(Array.isArray(d) ? d : d.alerts || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/api/admin/notifications/stats');
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json || {};
        const whatsapp = data.deliveryStats?.byChannel?.WHATSAPP || data.byChannel?.WHATSAPP || data.whatsapp || {};
        setStats({
          sent: whatsapp.sent || data.totalSent || 0,
          delivered: whatsapp.delivered || 0,
          failed: whatsapp.failed || data.totalFailed || 0,
        });
        setNotifications(data.recentFailures || data.recent || []);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchAlerts(); fetchNotifications(); }, []);

  const toggleAlert = async (id: string) => {
    try {
      await apiFetch(`/api/admin/alerts/${id}/toggle`, { method: 'PATCH' });
      fetchAlerts();
    } catch { /* ignore */ }
  };

  const statCards = [
    { label: 'Sent', value: stats.sent, icon: Send, color: 'text-sky-600 bg-sky-50' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-600 bg-red-50' },
    { label: 'Rate', value: stats.sent > 0 ? `${Math.round((stats.delivered / stats.sent) * 100)}%` : '--', icon: MessageCircle, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-sky-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}><Icon size={20} /></div>
              <div>
                <p className="text-xs text-slate-500 uppercase">{s.label}</p>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-sky-50">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Active Alerts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sky-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Procedure</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Slots Found</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Last Check</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Active</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : alerts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No alerts configured</td></tr>
              ) : alerts.map(alert => (
                <tr key={alert.id} className="border-t border-sky-50 hover:bg-sky-50/30">
                  <td className="px-4 py-3 text-sm text-slate-600">{alert.user?.email || '--'}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                    {alert.prefecture?.name || alert.consulate?.name || alert.vfsCenter?.name || '--'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{alert.procedure || '--'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-sky-600">{alert.slotsFound || 0}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {alert.lastCheckedAt ? formatRelativeTime(alert.lastCheckedAt) : '--'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleAlert(alert.id)} className="transition-colors">
                      {alert.isActive
                        ? <ToggleRight size={24} className="text-emerald-500" />
                        : <ToggleLeft size={24} className="text-slate-300" />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
