'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { X, UserCheck, Calendar, Clock, MapPin, Send, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  bookingSystem: string;
  procedureType: string;
  categoryCode: string | null;
  prefectureId: string | null;
  prefecture: { name: string; department: string } | null;
  consulateId: string | null;
  consulate: { name: string } | null;
  datePreference: string;
  preferredAfter: string | null;
  preferredBefore: string | null;
  priority: string;
  createdAt: string;
}

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillData?: {
    prefectureId?: string;
    prefectureName?: string;
    categoryCode?: string;
    categoryName?: string;
    slotDate?: string;
    slotTime?: string;
  };
}

export default function ManualBookingModal({ 
  isOpen, 
  onClose, 
  prefillData 
}: ManualBookingModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [categoryCode, setCategoryCode] = useState(prefillData?.categoryCode || '');
  const [slotDate, setSlotDate] = useState(prefillData?.slotDate || '');
  const [slotTime, setSlotTime] = useState(prefillData?.slotTime || '');
  const [bookingUrl, setBookingUrl] = useState('');
  const [skipAutoSubmit, setSkipAutoSubmit] = useState(false);

  // Fetch available clients
  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  // Update form when prefill data changes
  useEffect(() => {
    if (prefillData) {
      if (prefillData.categoryCode) setCategoryCode(prefillData.categoryCode);
      if (prefillData.slotDate) setSlotDate(prefillData.slotDate);
      if (prefillData.slotTime) setSlotTime(prefillData.slotTime);
    }
  }, [prefillData]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/boss/clients/available');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const json = await response.json();
      const data = json.success && json.data ? json.data : [];
      setClients(data);
      
      // Auto-select first matching client if prefill has prefectureId
      if (prefillData?.prefectureId && data.length > 0) {
        const matchingClient = data.find((c: Client) => c.prefectureId === prefillData.prefectureId);
        if (matchingClient) {
          setSelectedClientId(matchingClient.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setError('Failed to load available clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }
    if (!categoryCode) {
      setError('Please enter a category code');
      return;
    }
    if (!slotDate) {
      setError('Please enter a slot date');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch('/api/boss/manual-book', {
        method: 'POST',
        body: JSON.stringify({
          clientId: selectedClientId,
          categoryCode,
          slotDate,
          slotTime: slotTime || undefined,
          bookingUrl: bookingUrl || undefined,
          skipAutoSubmit,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Booking failed');
      }

      setSuccess(`Booking triggered! Job ID: ${json.data?.jobId || 'unknown'}`);
      
      // Reset form after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to trigger booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Manual Booking</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Prefill Info Banner */}
        {prefillData?.prefectureName && (
          <div className="mx-4 mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-cyan-300 text-sm">
              <MapPin className="w-4 h-4" />
              <span>
                Booking for: <strong>{prefillData.prefectureName}</strong>
                {prefillData.categoryName && ` - ${prefillData.categoryName}`}
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Client
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading clients...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-yellow-400 text-sm py-2">
                No clients available for booking
              </div>
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">-- Select a client --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName} - {client.prefecture?.name || client.consulate?.name || 'N/A'} ({client.priority})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Client Details */}
          {selectedClient && (
            <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400">Phone:</span>{' '}
                  <span className="text-white">{selectedClient.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400">Procedure:</span>{' '}
                  <span className="text-white">{selectedClient.procedureType}</span>
                </div>
                <div>
                  <span className="text-gray-400">Preference:</span>{' '}
                  <span className="text-white">{selectedClient.datePreference}</span>
                </div>
                {selectedClient.categoryCode && (
                  <div>
                    <span className="text-gray-400">Category:</span>{' '}
                    <span className="text-white">{selectedClient.categoryCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Code */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category Code (Demarche)
            </label>
            <input
              type="text"
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
              placeholder="e.g., 16040, 1922, 2200"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Slot Date
              </label>
              <input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Slot Time (optional)
              </label>
              <input
                type="time"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Advanced Options */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
              Advanced Options
            </summary>
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Booking URL (optional)
                </label>
                <input
                  type="url"
                  value={bookingUrl}
                  onChange={(e) => setBookingUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skipAutoSubmit"
                  checked={skipAutoSubmit}
                  onChange={(e) => setSkipAutoSubmit(e.target.checked)}
                  className="w-4 h-4 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500"
                />
                <label htmlFor="skipAutoSubmit" className="text-sm text-gray-300">
                  Skip auto-submit (fill form only, don't submit)
                </label>
              </div>
            </div>
          </details>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedClientId || !categoryCode || !slotDate}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Triggering...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Trigger Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
