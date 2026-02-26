'use client';

import { useState, useEffect } from 'react';
import { Plus, UserPlus, Globe, MapPin, Briefcase } from 'lucide-react';
import { authHeaders, authJsonHeaders } from '@/lib/utils';

interface VfsConfig {
  id: string;
  name: string;
  countryCode: string;
  destinationCountry: string;
  centers: Array<{
    id: string;
    name: string;
    city: string;
    code: string;
  }>;
  visaCategories: Array<{
    id: string;
    name: string;
    procedures: string[];
  }>;
}

interface CreateVfsAlertProps {
  apiUrl: string;
  onAlertCreated?: () => void;
}

export function CreateVfsAlert({ apiUrl, onAlertCreated }: CreateVfsAlertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [configs, setConfigs] = useState<VfsConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

  useEffect(() => {
    if (isOpen && configs.length === 0) {
      fetchConfigs();
    }
  }, [isOpen]);

  async function fetchConfigs() {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/vfs/configs`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch VFS configs');
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const selectedConfig = configs.find(c => c.id === selectedCountry);

  const handleCenterToggle = (centerId: string) => {
    setSelectedCenters(prev =>
      prev.includes(centerId)
        ? prev.filter(c => c !== centerId)
        : [...prev, centerId]
    );
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAllCenters = () => {
    if (!selectedConfig) return;
    if (selectedCenters.length === selectedConfig.centers.length) {
      setSelectedCenters([]);
    } else {
      setSelectedCenters(selectedConfig.centers.map(c => c.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim()) {
      setError('Client name is required');
      return;
    }
    if (!selectedCountry) {
      setError('Please select a country');
      return;
    }
    if (selectedCenters.length === 0) {
      setError('Please select at least one city');
      return;
    }
    if (selectedCategories.length === 0) {
      setError('Please select at least one visa category');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/vfs/alerts`, {
        method: 'POST',
        headers: authJsonHeaders(),
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || null,
          configId: selectedCountry,
          centerIds: selectedCenters,
          categoryIds: selectedCategories,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create alert');
      }

      const data = await res.json();
      setSuccess(`Created ${data.alertsCreated} alert(s) for ${clientName}`);
      
      // Reset form
      setClientName('');
      setClientEmail('');
      setSelectedCountry('');
      setSelectedCenters([]);
      setSelectedCategories([]);
      
      // Callback
      onAlertCreated?.();
      
      // Close after delay
      setTimeout(() => {
        setSuccess(null);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="glass rounded-xl border border-border p-4 hover:bg-surface/50 transition-colors w-full group"
      >
        <div className="flex items-center justify-center gap-2 text-primary">
          <UserPlus className="h-5 w-5" />
          <span className="font-medium">Add Client VFS Alert</span>
        </div>
        <p className="text-xs text-muted mt-1">
          Monitor visa appointments for a client
        </p>
      </button>
    );
  }

  return (
    <div className="glass rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
        <h3 className="font-semibold flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          New Client VFS Alert
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted hover:text-foreground p-1"
          aria-label="Close form"
        >
          X
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Error/Success Messages */}
        {error && (
          <div className="p-2 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-2 bg-success/10 border border-success/30 rounded text-success text-sm">
            {success}
          </div>
        )}

        {/* Client Info */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">Client Name *</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., John Doe"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Client Email (optional)</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="e.g., john@example.com"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Country Selection */}
        <div>
          <label className="text-xs text-muted flex items-center gap-1 mb-2">
            <Globe className="h-3 w-3" />
            Select Country *
          </label>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {configs.map((config) => (
                <button
                  key={config.id}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(config.id);
                    setSelectedCenters([]);
                    setSelectedCategories([]);
                  }}
                  className={`p-2 rounded-lg border text-sm flex items-center gap-2 transition-colors ${
                    selectedCountry === config.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-surface'
                  }`}
                >
                  <span>{countryFlags[config.destinationCountry] || '🌍'}</span>
                  <span>{config.destinationCountry}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* City Selection */}
        {selectedConfig && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Select Cities *
              </label>
              <button
                type="button"
                onClick={handleSelectAllCenters}
                className="text-xs text-primary hover:underline"
              >
                {selectedCenters.length === selectedConfig.centers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedConfig.centers.map((center) => (
                <button
                  key={center.id}
                  type="button"
                  onClick={() => handleCenterToggle(center.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    selectedCenters.includes(center.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-surface'
                  }`}
                >
                  {center.city}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Selection */}
        {selectedConfig && selectedCenters.length > 0 && (
          <div>
            <label className="text-xs text-muted flex items-center gap-1 mb-2">
              <Briefcase className="h-3 w-3" />
              Visa Category *
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedConfig.visaCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    selectedCategories.includes(category.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-surface'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {selectedConfig && selectedCenters.length > 0 && selectedCategories.length > 0 && (
          <div className="p-3 bg-surface rounded-lg text-sm">
            <p className="text-muted">
              Monitoring <span className="text-foreground font-medium">{selectedCenters.length}</span> cities 
              for <span className="text-foreground font-medium">{selectedCategories.length}</span> visa types 
              = <span className="text-primary font-medium">{selectedCenters.length * selectedCategories.length}</span> alerts
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !clientName || !selectedCountry || selectedCenters.length === 0 || selectedCategories.length === 0}
          className="w-full py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create Alert
            </>
          )}
        </button>
      </form>
    </div>
  );
}
