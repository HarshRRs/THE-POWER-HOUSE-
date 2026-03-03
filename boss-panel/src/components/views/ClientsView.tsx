'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Trash2, ChevronDown, ChevronUp, X, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatRelativeTime, getProcedureLabel } from '@/lib/utils';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  system: string;
  prefectureId?: string;
  prefecture?: { name: string };
  vfsCenterId?: string;
  vfsCenter?: { name: string };
  consulateId?: string;
  consulate?: { name: string };
  procedure: string;
  categoryCode?: string;
  status: string;
  bookingStatus: string;
  autoBook: boolean;
  priceAgreed: number;
  amountPaid: number;
  notes: string;
  createdAt: string;
}

const bookingStatusColors: Record<string, string> = {
  IDLE: 'text-slate-600 bg-slate-50',
  WAITING_SLOT: 'text-sky-700 bg-sky-50',
  BOOKING: 'text-amber-700 bg-amber-50',
  CAPTCHA_WAIT: 'text-orange-700 bg-orange-50',
  BOOKED: 'text-emerald-700 bg-emerald-50',
  FAILED: 'text-red-700 bg-red-50',
};

export default function ClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    system: 'PREFECTURE',
    prefectureId: '', procedureType: '', categoryCode: '',
    consulateId: '', embassyServiceType: '',
    vfsCenterId: '', destinationCountry: '', visaCategory: '',
    autoBook: false, priceAgreed: 0, notes: '',
  });

  const fetchClients = useCallback(async () => {
    try {
      const res = await apiFetch('/api/booking/clients');
      if (res.ok) {
        const json = await res.json();
        setClients(json.data || json || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch('/api/booking/stats');
      if (res.ok) {
        const json = await res.json();
        setStats(json.data || json);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchClients(); fetchStats(); }, [fetchClients, fetchStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/booking/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ firstName: '', lastName: '', email: '', phone: '', system: 'PREFECTURE', prefectureId: '', procedureType: '', categoryCode: '', consulateId: '', embassyServiceType: '', vfsCenterId: '', destinationCountry: '', visaCategory: '', autoBook: false, priceAgreed: 0, notes: '' });
        fetchClients();
        fetchStats();
      }
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    try {
      await apiFetch(`/api/booking/clients/${id}`, { method: 'DELETE' });
      fetchClients();
      fetchStats();
    } catch { /* ignore */ }
  };

  const getLocation = (c: Client) => {
    if (c.prefecture?.name) return c.prefecture.name;
    if (c.consulate?.name) return c.consulate.name;
    if (c.vfsCenter?.name) return c.vfsCenter.name;
    return c.prefectureId || c.consulateId || c.vfsCenterId || '--';
  };

  const filtered = clients.filter(c => {
    const matchSearch = !search || `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.bookingStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const statCards = [
    { label: 'Total', value: stats?.total ?? clients.length, icon: Users, color: 'text-sky-600 bg-sky-50' },
    { label: 'Waiting', value: stats?.waiting ?? 0, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Booked', value: stats?.booked ?? 0, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Revenue', value: `€${stats?.revenue ?? 0}`, icon: DollarSign, color: 'text-violet-600 bg-violet-50' },
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

      {/* Add Client */}
      <div className="bg-white rounded-xl border border-sky-100 shadow-sm">
        <button onClick={() => setShowForm(!showForm)} className="w-full flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-sky-600" />
            <span className="font-semibold text-slate-900">Add New Client</span>
          </div>
          {showForm ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="px-6 pb-6 border-t border-sky-50 pt-4">
            {/* System Toggle */}
            <div className="flex gap-2 mb-4">
              {['PREFECTURE', 'EMBASSY', 'VFS'].map(sys => (
                <button key={sys} type="button" onClick={() => setForm(f => ({ ...f, system: sys }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${form.system === sys ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-50'}`}>
                  {sys}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="First Name *" required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="input" />
              <input placeholder="Last Name *" required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="input" />
              <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" />
              <input placeholder="Phone *" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" />

              {form.system === 'PREFECTURE' && (
                <>
                  <input placeholder="Prefecture ID (e.g. paris_75)" value={form.prefectureId} onChange={e => setForm(f => ({ ...f, prefectureId: e.target.value }))} className="input" />
                  <input placeholder="Procedure Type" value={form.procedureType} onChange={e => setForm(f => ({ ...f, procedureType: e.target.value }))} className="input" />
                </>
              )}
              {form.system === 'EMBASSY' && (
                <>
                  <input placeholder="Consulate ID" value={form.consulateId} onChange={e => setForm(f => ({ ...f, consulateId: e.target.value }))} className="input" />
                  <input placeholder="Service Type" value={form.embassyServiceType} onChange={e => setForm(f => ({ ...f, embassyServiceType: e.target.value }))} className="input" />
                </>
              )}
              {form.system === 'VFS' && (
                <>
                  <input placeholder="VFS Center ID" value={form.vfsCenterId} onChange={e => setForm(f => ({ ...f, vfsCenterId: e.target.value }))} className="input" />
                  <input placeholder="Destination Country" value={form.destinationCountry} onChange={e => setForm(f => ({ ...f, destinationCountry: e.target.value }))} className="input" />
                </>
              )}

              <input placeholder="Price Agreed (€)" type="number" value={form.priceAgreed || ''} onChange={e => setForm(f => ({ ...f, priceAgreed: Number(e.target.value) }))} className="input" />
              <input placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input" />
            </div>

            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.autoBook} onChange={e => setForm(f => ({ ...f, autoBook: e.target.checked }))} className="rounded border-sky-300 text-sky-600" />
                Auto-Book
              </label>
              <div className="flex-1" />
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Add Client</button>
            </div>
          </form>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select">
          <option value="ALL">All Status</option>
          <option value="IDLE">Idle</option>
          <option value="WAITING_SLOT">Waiting</option>
          <option value="BOOKING">Booking</option>
          <option value="BOOKED">Booked</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sky-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">System</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sky-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No clients found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-t border-sky-50 hover:bg-sky-50/30 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-slate-400">{c.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">{c.system}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getLocation(c)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getProcedureLabel(c.procedure)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${bookingStatusColors[c.bookingStatus] || 'text-slate-600 bg-slate-50'}`}>
                      {c.bookingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">€{c.amountPaid}/{c.priceAgreed}</td>
                  <td className="px-4 py-3">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
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
