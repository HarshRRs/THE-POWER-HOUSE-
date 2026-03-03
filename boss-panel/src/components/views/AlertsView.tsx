'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import CountryCodePicker from '@/components/CountryCodePicker';
import {
  MapPin,
  Building2,
  Plus,
  Trash2,
  Bell,
  BellOff,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

// Types
interface ClientAlert {
  id: string;
  name: string;
  phone: string;
  system: 'PREFECTURE' | 'EMBASSY';
  prefectureId: string | null;
  consulateId: string | null;
  categoryCode: string;
  categoryName: string;
  isActive: boolean;
  notificationsSent: number;
  lastNotifiedAt: string | null;
  createdAt: string;
}

interface PrefectureCategory {
  code: string;
  name: string;
  procedure: string;
}

interface PrefectureMatrix {
  id: string;
  name: string;
  department: string;
  categories: PrefectureCategory[];
}

interface SlotMatrixResponse {
  prefectures: PrefectureMatrix[];
  embassy: {
    id: string;
    name: string;
  } | null;
}

// Embassy categories (fixed)
const EMBASSY_CATEGORIES = [
  { code: 'PASSPORT', name: 'Passport Services' },
  { code: 'OCI', name: 'OCI Services' },
  { code: 'VISA', name: 'Visa Services' },
  { code: 'BIRTH', name: 'Birth Registration' },
];

export default function AlertsView() {
  const [alerts, setAlerts] = useState<ClientAlert[]>([]);
  const [prefectures, setPrefectures] = useState<PrefectureMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await apiFetch('/api/boss/client-alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  }, []);

  const fetchPrefectures = useCallback(async () => {
    try {
      const res = await apiFetch('/api/boss/slot-matrix');
      if (res.ok) {
        const data: SlotMatrixResponse = await res.json();
        setPrefectures(data.prefectures);
      }
    } catch (err) {
      console.error('Error fetching prefectures:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAlerts(), fetchPrefectures()]);
      setLoading(false);
    };
    loadData();

    // Auto-refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts, fetchPrefectures]);

  // Create alert
  const handleCreateAlert = async (alertData: {
    name: string;
    phone: string;
    system: 'PREFECTURE' | 'EMBASSY';
    prefectureId?: string;
    consulateId?: string;
    categoryCode: string;
    categoryName: string;
  }) => {
    setError(null);
    try {
      const res = await apiFetch('/api/boss/client-alerts', {
        method: 'POST',
        body: JSON.stringify(alertData),
      });
      if (res.ok) {
        await fetchAlerts();
        return true;
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create alert');
        return false;
      }
    } catch (err) {
      setError('Network error');
      return false;
    }
  };

  // Toggle alert
  const handleToggle = async (id: string) => {
    try {
      const res = await apiFetch(`/api/boss/client-alerts/${id}/toggle`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? updated : a))
        );
      }
    } catch (err) {
      console.error('Error toggling alert:', err);
    }
  };

  // Delete alert
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this alert?')) return;
    try {
      const res = await apiFetch(`/api/boss/client-alerts/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Forms Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prefecture Alert Form */}
        <PrefectureAlertForm
          prefectures={prefectures}
          onSubmit={handleCreateAlert}
        />

        {/* Embassy Alert Form */}
        <EmbassyAlertForm onSubmit={handleCreateAlert} />
      </div>

      {/* Alerts List */}
      <AlertList
        alerts={alerts}
        prefectures={prefectures}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onRefresh={fetchAlerts}
      />
    </div>
  );
}

// ═══════════════════════════════════════
// PREFECTURE ALERT FORM
// ═══════════════════════════════════════

function PrefectureAlertForm({
  prefectures,
  onSubmit,
}: {
  prefectures: PrefectureMatrix[];
  onSubmit: (data: {
    name: string;
    phone: string;
    system: 'PREFECTURE' | 'EMBASSY';
    prefectureId?: string;
    categoryCode: string;
    categoryName: string;
  }) => Promise<boolean>;
}) {
  const [selectedPrefecture, setSelectedPrefecture] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+33');
  const [submitting, setSubmitting] = useState(false);

  // Get categories for selected prefecture
  const categories =
    prefectures.find((p) => p.id === selectedPrefecture)?.categories || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrefecture || !selectedCategory || !name || !phone) return;

    const category = categories.find((c) => c.code === selectedCategory);
    if (!category) return;

    setSubmitting(true);
    const success = await onSubmit({
      name,
      phone,
      system: 'PREFECTURE',
      prefectureId: selectedPrefecture,
      categoryCode: selectedCategory,
      categoryName: category.name,
    });

    if (success) {
      setSelectedPrefecture('');
      setSelectedCategory('');
      setName('');
      setPhone('+33');
    }
    setSubmitting(false);
  };

  const isValid =
    selectedPrefecture && selectedCategory && name.trim() && phone.length > 4;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-sky-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Prefecture Alert</h3>
            <p className="text-xs text-slate-500">
              Get notified when slots are available
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Prefecture Select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Prefecture
          </label>
          <select
            value={selectedPrefecture}
            onChange={(e) => {
              setSelectedPrefecture(e.target.value);
              setSelectedCategory('');
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            <option value="">Select prefecture...</option>
            {prefectures
              .sort((a, b) => a.department.localeCompare(b.department))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.department} - {p.name}
                </option>
              ))}
          </select>
        </div>

        {/* Category Select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={!selectedPrefecture || categories.length === 0}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {!selectedPrefecture
                ? 'Select prefecture first...'
                : categories.length === 0
                ? 'No categories available'
                : 'Select category...'}
            </option>
            {categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Person Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Phone Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            WhatsApp Number
          </label>
          <CountryCodePicker value={phone} onChange={setPhone} />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-lg font-medium text-sm hover:bg-sky-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Create Prefecture Alert
        </button>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════
// EMBASSY ALERT FORM
// ═══════════════════════════════════════

function EmbassyAlertForm({
  onSubmit,
}: {
  onSubmit: (data: {
    name: string;
    phone: string;
    system: 'PREFECTURE' | 'EMBASSY';
    consulateId?: string;
    categoryCode: string;
    categoryName: string;
  }) => Promise<boolean>;
}) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+33');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !name || !phone) return;

    const category = EMBASSY_CATEGORIES.find((c) => c.code === selectedCategory);
    if (!category) return;

    setSubmitting(true);
    const success = await onSubmit({
      name,
      phone,
      system: 'EMBASSY',
      consulateId: 'indian-embassy-paris',
      categoryCode: selectedCategory,
      categoryName: category.name,
    });

    if (success) {
      setSelectedCategory('');
      setName('');
      setPhone('+33');
    }
    setSubmitting(false);
  };

  const isValid = selectedCategory && name.trim() && phone.length > 4;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-amber-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Indian Embassy Alert</h3>
            <p className="text-xs text-slate-500">
              Get notified for embassy appointments
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Category Select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Service Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Select category...</option>
            {EMBASSY_CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Person Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Phone Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            WhatsApp Number
          </label>
          <CountryCodePicker value={phone} onChange={setPhone} />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Create Embassy Alert
        </button>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════
// ALERTS LIST
// ═══════════════════════════════════════

function AlertList({
  alerts,
  prefectures,
  onToggle,
  onDelete,
  onRefresh,
}: {
  alerts: ClientAlert[];
  prefectures: PrefectureMatrix[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}) {
  // Create prefecture lookup
  const prefectureMap = new Map(prefectures.map((p) => [p.id, p]));

  const getLocationName = (alert: ClientAlert) => {
    if (alert.system === 'EMBASSY') {
      return 'Indian Embassy Paris';
    }
    const prefecture = prefectureMap.get(alert.prefectureId || '');
    return prefecture ? `${prefecture.department} - ${prefecture.name}` : alert.prefectureId;
  };

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Active Alerts</h3>
            <p className="text-xs text-slate-500">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No alerts yet</p>
          <p className="text-slate-400 text-xs mt-1">
            Create an alert above to get notified when slots are available
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Location
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Phone
                </th>
                <th className="px-4 py-3 text-center font-medium text-slate-600">
                  Sent
                </th>
                <th className="px-4 py-3 text-center font-medium text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-center font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="border-b border-slate-50 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {alert.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        alert.system === 'PREFECTURE'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {alert.system === 'PREFECTURE' ? (
                        <MapPin className="w-3 h-3" />
                      ) : (
                        <Building2 className="w-3 h-3" />
                      )}
                      {alert.system}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                    {getLocationName(alert)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {alert.categoryName}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                    {maskPhone(alert.phone)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                      {alert.notificationsSent}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onToggle(alert.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        alert.isActive
                          ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                      title={alert.isActive ? 'Active - Click to pause' : 'Paused - Click to activate'}
                    >
                      {alert.isActive ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onDelete(alert.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="Delete alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
