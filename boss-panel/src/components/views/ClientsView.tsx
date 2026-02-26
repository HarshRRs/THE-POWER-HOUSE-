'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Power, CreditCard, Trash2, Eye, ChevronDown, ChevronUp, X, Clock, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { API_URL, getToken, authHeaders, authJsonHeaders } from '@/lib/utils';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  dateOfBirth: string | null;
  nationality: string;
  passportNumber: string | null;
  foreignerNumber: string | null;
  bookingSystem: 'PREFECTURE' | 'VFS' | 'EMBASSY';
  procedureType: string;
  autoBook: boolean;
  bookingStatus: string;
  status: string;
  priority: string;
  priceAgreed: number;
  amountPaid: number;
  amountDue: number;
  bookingDate: string | null;
  bookingTime: string | null;
  bookingRef: string | null;
  lastAttemptError: string | null;
  bookingAttempts: number;
  destinationCountry: string | null;
  preferredCity: string | null;
  visaCategory: string | null;
  embassyServiceType: string | null;
  prefecture?: { id: string; name: string } | null;
  vfsCenter?: { id: string; name: string; city: string } | null;
  consulate?: { id: string; name: string } | null;
  createdAt: string;
}

interface BookingLog {
  id: string;
  action: string;
  details: string | null;
  screenshotPath: string | null;
  createdAt: string;
}

interface BookingStats {
  total: number;
  waiting: number;
  booking: number;
  booked: number;
  failed: number;
  paid: number;
  totalRevenue: number;
  totalCollected: number;
  totalPending: number;
  captchaBalance: number;
  captchaConfigured: boolean;
}

const systemLabels: Record<string, string> = {
  PREFECTURE: 'Prefecture',
  VFS: 'VFS Global',
  EMBASSY: 'Embassy',
};

export default function ClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientLogs, setClientLogs] = useState<Record<string, BookingLog[]>>({});

  useEffect(() => {
    fetchClients();
    fetchStats();
    const interval = setInterval(() => {
      fetchClients();
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch(`${API_URL}/booking/clients`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API_URL}/booking/stats`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }

  async function fetchLogs(clientId: string) {
    try {
      const res = await fetch(`${API_URL}/booking/clients/${clientId}/logs`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setClientLogs(prev => ({ ...prev, [clientId]: data.logs || [] }));
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }

  async function toggleAutoBook(clientId: string) {
    try {
      await fetch(`${API_URL}/booking/clients/${clientId}/toggle-autobook`, {
        method: 'POST',
        headers: authHeaders(),
      });
      fetchClients();
    } catch (err) {
      console.error('Failed to toggle autobook:', err);
    }
  }

  async function deleteClient(clientId: string) {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await fetch(`${API_URL}/booking/clients/${clientId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      fetchClients();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete client:', err);
    }
  }

  async function recordPayment(clientId: string) {
    const amount = prompt('Enter payment amount (\u20AC):');
    if (!amount) return;
    const note = prompt('Payment note (optional):');

    try {
      await fetch(`${API_URL}/booking/clients/${clientId}/payment`, {
        method: 'POST',
        headers: authJsonHeaders(),
        body: JSON.stringify({ amount: parseFloat(amount), note }),
      });
      fetchClients();
      fetchStats();
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  }

  function getLocationName(client: Client): string {
    if (client.prefecture) return client.prefecture.name;
    if (client.vfsCenter) return `${client.vfsCenter.city}${client.destinationCountry ? ` (${client.destinationCountry})` : ''}`;
    if (client.consulate) return client.consulate.name;
    return 'N/A';
  }

  const filteredClients = clients.filter(c => {
    const matchesSearch = `${c.firstName} ${c.lastName} ${c.email || ''} ${c.phone}`.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'WAITING_SLOT' || filter === 'BOOKING' || filter === 'BOOKED' || filter === 'FAILED' || filter === 'PAYMENT_WAIT') {
      return matchesSearch && c.bookingStatus === filter;
    }
    if (filter === 'PREFECTURE' || filter === 'VFS' || filter === 'EMBASSY') {
      return matchesSearch && c.bookingSystem === filter;
    }
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BOOKED':
        return <span className="badge badge-success">Booked</span>;
      case 'WAITING_SLOT':
        return <span className="badge badge-warning">Waiting</span>;
      case 'BOOKING':
        return <span className="badge badge-primary">Booking...</span>;
      case 'CAPTCHA_WAIT':
        return <span className="badge badge-primary">CAPTCHA</span>;
      case 'PAYMENT_WAIT':
        return <span className="badge bg-violet-500/15 text-violet-400 border border-violet-500/30">Payment</span>;
      case 'FAILED':
        return <span className="badge badge-danger">Failed</span>;
      default:
        return <span className="badge bg-surfaceLight text-text-muted">{status}</span>;
    }
  };

  const getSystemBadge = (system: string) => {
    switch (system) {
      case 'PREFECTURE':
        return <span className="badge bg-cyan/10 text-cyan border border-cyan/30">Prefecture</span>;
      case 'VFS':
        return <span className="badge bg-violet-500/10 text-violet-400 border border-violet-500/30">VFS</span>;
      case 'EMBASSY':
        return <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/30">Embassy</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">CLIENTS</h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30">
              <Users className="w-4 h-4 text-cyan" />
              <span className="text-xs text-cyan font-medium">{clients.length} TOTAL</span>
            </div>
          </div>
          <p className="text-text-muted mt-1 text-sm">Manage your client bookings</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary text-sm group"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />}
          {showAddForm ? 'Close Form' : 'Add Client'}
        </button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="card p-3 tech-corner">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Total</p>
            <p className="text-xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="card p-3 tech-corner">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Waiting</p>
            <p className="text-xl font-bold text-amber-400">{stats.waiting}</p>
          </div>
          <div className="card p-3 tech-corner">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Booked</p>
            <p className="text-xl font-bold text-emerald-400">{stats.booked}</p>
          </div>
          <div className="card p-3 tech-corner">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Revenue</p>
            <p className="text-xl font-bold text-cyan">&euro;{stats.totalCollected}</p>
          </div>
          <div className="card p-3 tech-corner">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Pending</p>
            <p className="text-xl font-bold text-amber-400">&euro;{stats.totalPending}</p>
          </div>
          <div className="card p-3 tech-corner">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">2Captcha</p>
            <p className={`text-xl font-bold ${stats.captchaConfigured ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.captchaConfigured ? `$${stats.captchaBalance.toFixed(2)}` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Add Client Form */}
      {showAddForm && (
        <AddClientForm
          onCreated={() => {
            fetchClients();
            fetchStats();
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Filters */}
      <div className="card p-3 lg:p-4 tech-corner">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 text-sm"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="select text-sm"
          >
            <option value="all">All</option>
            <option value="WAITING_SLOT">Waiting</option>
            <option value="BOOKING">Booking</option>
            <option value="BOOKED">Booked</option>
            <option value="PAYMENT_WAIT">Payment Wait</option>
            <option value="FAILED">Failed</option>
            <option value="PREFECTURE">Prefecture</option>
            <option value="VFS">VFS</option>
            <option value="EMBASSY">Embassy</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="card overflow-hidden tech-corner">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>System</th>
                <th>Location</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="spinner" />
                      <span className="text-text-muted text-sm">Loading clients...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state py-16">
                      <Users className="w-12 h-12 text-cyan/30 mb-4" />
                      <p className="empty-state-title">No clients found</p>
                      <p className="empty-state-description">Add your first client to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    isExpanded={expandedClient === client.id}
                    logs={clientLogs[client.id] || []}
                    onToggleExpand={() => {
                      if (expandedClient === client.id) {
                        setExpandedClient(null);
                      } else {
                        setExpandedClient(client.id);
                        fetchLogs(client.id);
                      }
                    }}
                    onToggleAutoBook={() => toggleAutoBook(client.id)}
                    onRecordPayment={() => recordPayment(client.id)}
                    onDelete={() => deleteClient(client.id)}
                    getStatusBadge={getStatusBadge}
                    getSystemBadge={getSystemBadge}
                    getLocationName={getLocationName}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Client Row ──────────────────────────────────────────

function ClientRow({
  client, isExpanded, logs,
  onToggleExpand, onToggleAutoBook, onRecordPayment, onDelete,
  getStatusBadge, getSystemBadge, getLocationName,
}: {
  client: Client;
  isExpanded: boolean;
  logs: BookingLog[];
  onToggleExpand: () => void;
  onToggleAutoBook: () => void;
  onRecordPayment: () => void;
  onDelete: () => void;
  getStatusBadge: (s: string) => React.ReactNode;
  getSystemBadge: (s: string) => React.ReactNode;
  getLocationName: (c: Client) => string;
}) {
  return (
    <>
      <tr className="hover:bg-cyan/5 transition-colors group">
        <td>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-cyan-dark flex items-center justify-center shadow-glow-cyan flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {client.firstName[0]}{client.lastName[0]}
              </span>
            </div>
            <div>
              <p className="font-semibold text-white text-sm group-hover:text-cyan transition-colors">{client.firstName} {client.lastName}</p>
              <p className="text-xs text-text-muted">{client.email || client.phone}</p>
            </div>
          </div>
        </td>
        <td>{getSystemBadge(client.bookingSystem)}</td>
        <td>
          <span className="text-sm text-text">{getLocationName(client)}</span>
        </td>
        <td>{getStatusBadge(client.bookingStatus)}</td>
        <td>
          <div>
            <p className="font-semibold text-white text-sm">&euro;{client.priceAgreed}</p>
            {client.amountDue > 0 ? (
              <p className="text-xs text-amber-400">&euro;{client.amountDue} due</p>
            ) : (
              <p className="text-xs text-emerald-400">Paid</p>
            )}
          </div>
        </td>
        <td>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleAutoBook}
              className={`p-2 rounded-lg transition-colors ${client.autoBook ? 'bg-cyan/20 text-cyan' : 'hover:bg-cyan/10 text-text-muted'}`}
              title={client.autoBook ? 'Auto-book ON - click to disable' : 'Auto-book OFF - click to enable'}
            >
              <Power className="w-4 h-4" />
            </button>
            <button
              onClick={onRecordPayment}
              className="p-2 rounded-lg hover:bg-cyan/10 text-text-muted hover:text-cyan transition-colors"
              title="Record Payment"
            >
              <CreditCard className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleExpand}
              className="p-2 rounded-lg hover:bg-cyan/10 text-text-muted hover:text-cyan transition-colors"
              title="View Details"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
              title="Delete Client"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-sidebar/50 p-0">
            <div className="px-6 py-4 space-y-4">
              {/* Client Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-text-muted text-xs block">Phone</span>
                  <span className="text-text">{client.phone}</span>
                </div>
                <div>
                  <span className="text-text-muted text-xs block">Nationality</span>
                  <span className="text-text">{client.nationality}</span>
                </div>
                <div>
                  <span className="text-text-muted text-xs block">Passport</span>
                  <span className="text-text">{client.passportNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-text-muted text-xs block">Attempts</span>
                  <span className="text-text">{client.bookingAttempts}</span>
                </div>
                {client.bookingRef && (
                  <div className="col-span-2">
                    <span className="text-text-muted text-xs block">Booking Ref</span>
                    <span className="text-emerald-400 font-mono">{client.bookingRef}</span>
                  </div>
                )}
                {client.bookingDate && (
                  <div>
                    <span className="text-text-muted text-xs block">Booking Date</span>
                    <span className="text-emerald-400">{new Date(client.bookingDate).toLocaleDateString('fr-FR')} {client.bookingTime || ''}</span>
                  </div>
                )}
                {client.lastAttemptError && (
                  <div className="col-span-4">
                    <span className="text-text-muted text-xs block">Last Error</span>
                    <span className="text-red-400 text-xs">{client.lastAttemptError}</span>
                  </div>
                )}
              </div>

              {/* Booking Logs */}
              {logs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" /> Booking Log
                  </h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 text-xs">
                        <span className="text-text-muted w-16 flex-shrink-0 font-mono">
                          {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                          log.action.includes('ERROR') || log.action.includes('FAILED') ? 'bg-red-500/15 text-red-400' :
                          log.action.includes('BOOKED') || log.action.includes('SUCCESS') ? 'bg-emerald-500/15 text-emerald-400' :
                          'bg-surfaceLight text-text'
                        }`}>
                          {log.action}
                        </span>
                        {log.details && <span className="text-text-muted truncate">{log.details}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Add Client Form ────────────────────────────────────

function AddClientForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [system, setSystem] = useState<string>('PREFECTURE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const body: Record<string, any> = {};

    formData.forEach((value, key) => {
      if (value !== '') body[key] = value;
    });

    body.bookingSystem = system;
    body.autoBook = formData.get('autoBook') === 'on';
    body.priceAgreed = parseFloat(body.priceAgreed || '0');

    try {
      const res = await fetch(`${API_URL}/booking/clients`, {
        method: 'POST',
        headers: authJsonHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create client');
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-4 lg:p-6 tech-corner">
      <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
        <Plus className="w-4 h-4 text-cyan" />
        Add New Client
      </h3>

      {error && (
        <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* System Selection */}
        <div className="flex gap-2">
          {(['PREFECTURE', 'VFS', 'EMBASSY'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSystem(s)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                system === s
                  ? 'border-cyan bg-cyan/10 text-cyan shadow-glow-cyan'
                  : 'border-border bg-surface hover:bg-surfaceLight text-text-muted'
              }`}
            >
              {systemLabels[s]}
            </button>
          ))}
        </div>

        {/* Personal Info */}
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Personal Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput name="firstName" label="First Name *" required />
            <FormInput name="lastName" label="Last Name *" required />
            <FormInput name="email" label="Email" type="email" />
            <FormInput name="phone" label="Phone *" required />
            <FormInput name="dateOfBirth" label="Date of Birth" type="date" />
            <FormInput name="nationality" label="Nationality" defaultValue="Indian" />
            <FormInput name="passportNumber" label="Passport Number" />
            {system === 'PREFECTURE' && (
              <FormInput name="foreignerNumber" label="AGDREF / Foreigner No." />
            )}
          </div>
        </div>

        {/* System-specific fields */}
        {system === 'PREFECTURE' && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Prefecture Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput name="prefectureId" label="Prefecture ID *" required placeholder="e.g., paris" />
              <div>
                <label className="text-xs text-text-muted block mb-1.5">Procedure Type *</label>
                <select name="procedureType" required className="select w-full text-sm">
                  <option value="SALARIE_PAYSIPS">Salarie / Paysips</option>
                  <option value="ETUDIANT_RENEWAL">Etudiant Renewal</option>
                  <option value="CHANGEMENT_STATUT_ETUDIANT_SALARIE">Changement Statut</option>
                  <option value="VIE_FAMILIALE_MARIAGE">Vie Familiale (Mariage)</option>
                  <option value="ENTREPRENEUR">Entrepreneur</option>
                  <option value="DUPLICATA_PERDU">Duplicata</option>
                  <option value="RENEWAL_ANY">Renewal (Any)</option>
                  <option value="NATURALISATION">Naturalisation</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {system === 'VFS' && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3">VFS Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput name="vfsLoginEmail" label="VFS Login Email *" required />
              <FormInput name="vfsLoginPassword" label="VFS Login Password *" type="password" required />
              <FormInput name="destinationCountry" label="Country *" required placeholder="e.g., Italy" />
              <FormInput name="preferredCity" label="City *" required placeholder="e.g., New Delhi" />
              <FormInput name="visaCategory" label="Visa Category *" required placeholder="e.g., Tourist" />
              <input type="hidden" name="procedureType" value="AUTRE" />
            </div>
          </div>
        )}

        {system === 'EMBASSY' && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Embassy Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput name="consulateId" label="Embassy/Consulate ID" placeholder="e.g., india-embassy-paris" />
              <FormInput name="passportFileNumber" label="Passport File Number" />
              <div>
                <label className="text-xs text-text-muted block mb-1.5">Service Type *</label>
                <select name="embassyServiceType" required className="select w-full text-sm">
                  <option value="PASSPORT_RENEWAL">Passport Renewal</option>
                  <option value="PASSPORT_NEW">New Passport</option>
                  <option value="PASSPORT_TATKAL">Tatkal Passport</option>
                  <option value="OCI_REGISTRATION">OCI Registration</option>
                  <option value="OCI_RENEWAL">OCI Renewal</option>
                  <option value="CONSULAR_OTHER">Other</option>
                </select>
              </div>
              <input type="hidden" name="procedureType" value="AUTRE" />
            </div>
          </div>
        )}

        {/* Business & Booking */}
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Booking & Payment</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput name="priceAgreed" label="Price (&euro;) *" type="number" required defaultValue="150" />
            <div>
              <label className="text-xs text-text-muted block mb-1.5">Priority</label>
              <select name="priority" className="select w-full text-sm">
                <option value="NORMAL">Normal</option>
                <option value="URGENT_7DAYS">Urgent (7 days)</option>
                <option value="EMERGENCY_24H">Emergency (24h)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="autoBook" id="autoBook" defaultChecked className="rounded accent-cyan" />
          <label htmlFor="autoBook" className="text-sm text-text">Enable Auto-Booking</label>
        </div>

        <FormInput name="notes" label="Notes" placeholder="Special requirements..." />

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 btn btn-primary disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Client'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Form Input ──────────────────────────────────────────

function FormInput({ name, label, type = 'text', required = false, placeholder = '', defaultValue = '' }: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="text-xs text-text-muted block mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="input text-sm"
      />
    </div>
  );
}
