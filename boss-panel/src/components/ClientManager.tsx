'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlus, Users, Search, Power, CreditCard, 
  RefreshCw, AlertCircle, CheckCircle, Clock, 
  ChevronDown, ChevronUp, Trash2, Eye
} from 'lucide-react';
import { API_URL, getToken, authHeaders, authJsonHeaders } from '@/lib/utils';

interface ClientData {
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

const statusColors: Record<string, string> = {
  IDLE: 'text-gray-400',
  WAITING_SLOT: 'text-yellow-400',
  BOOKING: 'text-blue-400 animate-pulse',
  CAPTCHA_WAIT: 'text-orange-400 animate-pulse',
  PAYMENT_WAIT: 'text-purple-400 animate-pulse',
  BOOKED: 'text-green-400',
  FAILED: 'text-red-400',
};

const statusIcons: Record<string, typeof Clock> = {
  IDLE: Clock,
  WAITING_SLOT: Search,
  BOOKING: RefreshCw,
  CAPTCHA_WAIT: AlertCircle,
  PAYMENT_WAIT: CreditCard,
  BOOKED: CheckCircle,
  FAILED: AlertCircle,
};

const systemLabels: Record<string, string> = {
  PREFECTURE: 'Prefecture',
  VFS: 'VFS Global',
  EMBASSY: 'Embassy',
};

export default function ClientManager() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientLogs, setClientLogs] = useState<Record<string, BookingLog[]>>({});
  const [filter, setFilter] = useState<string>('all');

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
    } catch (err) {
      console.error('Failed to delete client:', err);
    }
  }

  async function recordPayment(clientId: string) {
    const amount = prompt('Enter payment amount (€):');
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

  const filteredClients = clients.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'active') return c.bookingStatus === 'WAITING_SLOT' || c.bookingStatus === 'BOOKING';
    if (filter === 'booked') return c.bookingStatus === 'BOOKED';
    if (filter === 'unpaid') return c.amountDue > 0 && c.bookingStatus === 'BOOKED';
    return c.bookingSystem === filter;
  });

  function getLocationName(client: ClientData): string {
    if (client.prefecture) return client.prefecture.name;
    if (client.vfsCenter) return `${client.vfsCenter.city} (${client.destinationCountry})`;
    if (client.consulate) return client.consulate.name;
    return 'N/A';
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Total Clients" value={stats.total} color="text-foreground" />
          <StatCard label="Waiting" value={stats.waiting} color="text-yellow-400" />
          <StatCard label="Booked" value={stats.booked} color="text-green-400" />
          <StatCard label="Revenue" value={`€${stats.totalCollected}`} color="text-primary" />
          <StatCard label="Pending" value={`€${stats.totalPending}`} color="text-orange-400" />
          <StatCard 
            label="2Captcha" 
            value={stats.captchaConfigured ? `$${stats.captchaBalance.toFixed(2)}` : 'Not set'} 
            color={stats.captchaConfigured ? 'text-green-400' : 'text-red-400'} 
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Clients</h2>
          <span className="text-xs text-muted">({filteredClients.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filters */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs px-2 py-1 bg-surface border border-border rounded"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="booked">Booked</option>
            <option value="unpaid">Unpaid</option>
            <option value="PREFECTURE">Prefecture</option>
            <option value="VFS">VFS</option>
            <option value="EMBASSY">Embassy</option>
          </select>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" />
            Add Client
          </button>
        </div>
      </div>

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

      {/* Client List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-8 text-muted">
          No clients found. Click &quot;Add Client&quot; to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredClients.map((client) => {
            const StatusIcon = statusIcons[client.bookingStatus] || Clock;
            const isExpanded = expandedClient === client.id;
            
            return (
              <div key={client.id} className="glass rounded-xl border border-border overflow-hidden">
                {/* Client Row */}
                <div className="px-4 py-3 flex items-center gap-3">
                  {/* Status */}
                  <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColors[client.bookingStatus] || 'text-muted'}`} />
                  
                  {/* Name + System */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {client.firstName} {client.lastName}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        client.bookingSystem === 'PREFECTURE' ? 'bg-blue-500/20 text-blue-400' :
                        client.bookingSystem === 'VFS' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {systemLabels[client.bookingSystem]}
                      </span>
                    </div>
                    <div className="text-xs text-muted truncate">
                      {getLocationName(client)} &bull; {client.procedureType.replace(/_/g, ' ')}
                    </div>
                  </div>

                  {/* Booking Info */}
                  {client.bookingDate && (
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-green-400 font-medium">
                        {new Date(client.bookingDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-[10px] text-muted">{client.bookingTime || ''}</div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="text-right">
                    <div className="text-xs font-medium">€{client.priceAgreed}</div>
                    <div className={`text-[10px] ${client.amountDue > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {client.amountDue > 0 ? `Due: €${client.amountDue}` : 'Paid'}
                    </div>
                  </div>

                  {/* Auto-book toggle */}
                  <button
                    onClick={() => toggleAutoBook(client.id)}
                    className={`p-1.5 rounded-lg ${client.autoBook ? 'bg-green-500/20 text-green-400' : 'bg-surface text-muted'}`}
                    title={client.autoBook ? 'Auto-book ON' : 'Auto-book OFF'}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>

                  {/* Actions */}
                  <button
                    onClick={() => recordPayment(client.id)}
                    className="p-1.5 rounded-lg bg-surface text-muted hover:text-primary"
                    title="Record payment"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedClient(null);
                      } else {
                        setExpandedClient(client.id);
                        fetchLogs(client.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-surface text-muted hover:text-foreground"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    onClick={() => deleteClient(client.id)}
                    className="p-1.5 rounded-lg bg-surface text-muted hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 bg-surface/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                      <div>
                        <span className="text-muted">Email:</span>
                        <span className="ml-1">{client.email || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted">Phone:</span>
                        <span className="ml-1">{client.phone}</span>
                      </div>
                      <div>
                        <span className="text-muted">Passport:</span>
                        <span className="ml-1">{client.passportNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted">Attempts:</span>
                        <span className="ml-1">{client.bookingAttempts}</span>
                      </div>
                      {client.bookingRef && (
                        <div className="col-span-2">
                          <span className="text-muted">Booking Ref:</span>
                          <span className="ml-1 text-green-400 font-mono">{client.bookingRef}</span>
                        </div>
                      )}
                      {client.lastAttemptError && (
                        <div className="col-span-4">
                          <span className="text-muted">Last Error:</span>
                          <span className="ml-1 text-red-400">{client.lastAttemptError}</span>
                        </div>
                      )}
                    </div>

                    {/* Booking Logs */}
                    {clientLogs[client.id] && clientLogs[client.id].length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-muted mb-2 flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Booking Log
                        </h4>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {clientLogs[client.id].map((log) => (
                            <div key={log.id} className="flex items-center gap-2 text-[11px]">
                              <span className="text-muted w-16 flex-shrink-0">
                                {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`font-mono px-1 rounded ${
                                log.action.includes('ERROR') || log.action.includes('FAILED') ? 'bg-red-500/20 text-red-400' :
                                log.action.includes('BOOKED') || log.action.includes('SUCCESS') ? 'bg-green-500/20 text-green-400' :
                                'bg-surface text-foreground'
                              }`}>
                                {log.action}
                              </span>
                              {log.details && <span className="text-muted truncate">{log.details}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="glass rounded-lg border border-border p-3">
      <div className="text-[10px] text-muted uppercase">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

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
    <div className="glass rounded-xl border border-border p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        Add New Client
      </h3>

      {error && (
        <div className="p-2 mb-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* System Selection */}
        <div className="flex gap-2">
          {(['PREFECTURE', 'VFS', 'EMBASSY'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSystem(s)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                system === s
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-surface'
              }`}
            >
              {systemLabels[s]}
            </button>
          ))}
        </div>

        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-3">
          <Input name="firstName" label="First Name *" required />
          <Input name="lastName" label="Last Name *" required />
          <Input name="email" label="Email" type="email" />
          <Input name="phone" label="Phone *" required />
          <Input name="dateOfBirth" label="Date of Birth" type="date" />
          <Input name="nationality" label="Nationality" defaultValue="Indian" />
          <Input name="passportNumber" label="Passport Number" />
          {system === 'PREFECTURE' && (
            <Input name="foreignerNumber" label="AGDREF / Foreigner No." />
          )}
        </div>

        {/* System-specific fields */}
        {system === 'PREFECTURE' && (
          <div className="grid grid-cols-2 gap-3">
            <Input name="prefectureId" label="Prefecture ID *" required placeholder="e.g., paris" />
            <div>
              <label className="text-xs text-muted block mb-1">Procedure Type *</label>
              <select name="procedureType" required className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm">
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
        )}

        {system === 'VFS' && (
          <div className="grid grid-cols-2 gap-3">
            <Input name="vfsLoginEmail" label="VFS Login Email *" required />
            <Input name="vfsLoginPassword" label="VFS Login Password *" type="password" required />
            <Input name="destinationCountry" label="Country *" required placeholder="e.g., Italy" />
            <Input name="preferredCity" label="City *" required placeholder="e.g., New Delhi" />
            <Input name="visaCategory" label="Visa Category *" required placeholder="e.g., Tourist" />
            <input type="hidden" name="procedureType" value="AUTRE" />
          </div>
        )}

        {system === 'EMBASSY' && (
          <div className="grid grid-cols-2 gap-3">
            <Input name="consulateId" label="Embassy/Consulate ID" placeholder="e.g., india-embassy-paris" />
            <Input name="passportFileNumber" label="Passport File Number" />
            <div>
              <label className="text-xs text-muted block mb-1">Service Type *</label>
              <select name="embassyServiceType" required className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm">
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
        )}

        {/* Business & Booking */}
        <div className="grid grid-cols-2 gap-3">
          <Input name="priceAgreed" label="Price (€) *" type="number" required defaultValue="150" />
          <div>
            <label className="text-xs text-muted block mb-1">Priority</label>
            <select name="priority" className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm">
              <option value="NORMAL">Normal</option>
              <option value="URGENT_7DAYS">Urgent (7 days)</option>
              <option value="EMERGENCY_24H">Emergency (24h)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="autoBook" id="autoBook" defaultChecked className="rounded" />
          <label htmlFor="autoBook" className="text-sm">Enable Auto-Booking</label>
        </div>

        <Input name="notes" label="Notes" placeholder="Special requirements..." />

        {/* Submit */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Client'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-surface border border-border rounded-lg text-sm hover:bg-surface/80"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({ name, label, type = 'text', required = false, placeholder = '', defaultValue = '' }: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}
