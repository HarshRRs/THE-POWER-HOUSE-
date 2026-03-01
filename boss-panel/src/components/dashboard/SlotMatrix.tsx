'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Grid3x3, RefreshCw, Eye, Calendar, UserCheck } from 'lucide-react';
import ManualBookingModal from './ManualBookingModal';

interface CategoryCell {
  code: string;
  name: string;
  procedure: string;
  status: 'available' | 'recent' | 'no_slots' | 'not_checked' | 'error' | 'captcha';
  slotsCount: number;
  slotDate: string | null;
  slotTime: string | null;
  lastChecked: string | null;
  lastSlotFound: string | null;
}

interface PrefectureRow {
  id: string;
  name: string;
  department: string;
  tier: number;
  categories: CategoryCell[];
}

interface SlotMatrixData {
  prefectures: PrefectureRow[];
  embassy: {
    id: string;
    name: string;
    categories: CategoryCell[];
  } | null;
  lastUpdated: string;
}

const STATUS_COLORS = {
  available: 'bg-green-500 hover:bg-green-400',
  recent: 'bg-yellow-500 hover:bg-yellow-400',
  no_slots: 'bg-red-500/60 hover:bg-red-500',
  not_checked: 'bg-gray-600 hover:bg-gray-500',
  error: 'bg-orange-500 hover:bg-orange-400',
  captcha: 'bg-purple-500 hover:bg-purple-400',
};

const STATUS_LABELS = {
  available: 'Slots Available',
  recent: 'Recent Slots',
  no_slots: 'No Slots',
  not_checked: 'Not Checked',
  error: 'Error',
  captcha: 'CAPTCHA',
};

export default function SlotMatrix() {
  const [matrixData, setMatrixData] = useState<SlotMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{
    prefectureId: string;
    prefectureName: string;
    category: CategoryCell;
  } | null>(null);
  const [triggeringCheck, setTriggeringCheck] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const { isConnected } = useWebSocket();

  // Fetch matrix data
  const fetchMatrixData = async () => {
    try {
      const response = await apiFetch('/api/boss/slot-matrix');
      if (!response.ok) {
        console.error('Slot matrix API error:', response.status);
        return;
      }
      const json = await response.json();
      // Handle both wrapped {success, data} and direct response formats
      const data = json.data || json;
      if (data && data.prefectures) {
        setMatrixData(data);
      }
    } catch (error) {
      console.error('Failed to fetch slot matrix:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrixData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMatrixData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle WebSocket updates
  useEffect(() => {
    const handleMatrixUpdate = (event: CustomEvent) => {
      const update = event.detail;
      setMatrixData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          prefectures: prev.prefectures.map(p => {
            if (p.id !== update.prefectureId) return p;
            return {
              ...p,
              categories: p.categories.map(c => {
                if (c.code !== update.categoryCode) return c;
                return {
                  ...c,
                  status: update.status,
                  slotsCount: update.slotsCount || c.slotsCount,
                  slotDate: update.slotDate || c.slotDate,
                  slotTime: update.slotTime || c.slotTime,
                };
              }),
            };
          }),
        };
      });
    };

    window.addEventListener('slot_matrix_update', handleMatrixUpdate as EventListener);
    return () => window.removeEventListener('slot_matrix_update', handleMatrixUpdate as EventListener);
  }, []);

  // Trigger manual check
  const triggerCheck = async (prefectureId: string, categoryCode: string) => {
    const key = `${prefectureId}:${categoryCode}`;
    setTriggeringCheck(key);
    
    try {
      await apiFetch(`/api/boss/category/${prefectureId}/${categoryCode}/check`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to trigger check:', error);
    } finally {
      setTriggeringCheck(null);
    }
  };

  // Get all unique category names across prefectures
  const allCategories = (matrixData?.prefectures || [])
    .flatMap(p => (p.categories || []).map(c => c.name))
    .filter((v, i, a) => a.indexOf(v) === i);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Grid3x3 className="w-5 h-5 text-cyan" />
          <h2 className="text-lg font-semibold text-white">Live Slot Matrix</h2>
        </div>
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="w-6 h-6 text-cyan animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Grid3x3 className="w-5 h-5 text-cyan" />
          <h2 className="text-lg font-semibold text-white">Live Slot Matrix</h2>
          {isConnected && (
            <span className="badge badge-cyan text-xs">LIVE</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMatrixData}
            className="p-2 rounded-lg bg-surface hover:bg-surfaceLight transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-text-muted" />
          </button>
          <span className="text-xs text-text-muted">
            Updated: {matrixData?.lastUpdated ? new Date(matrixData.lastUpdated).toLocaleTimeString('fr-FR') : '-'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-border">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${color.split(' ')[0]}`} />
            <span className="text-xs text-text-muted">{STATUS_LABELS[status as keyof typeof STATUS_LABELS]}</span>
          </div>
        ))}
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-text-muted font-medium sticky left-0 bg-surface z-10">
                Prefecture
              </th>
              {matrixData?.prefectures[0]?.categories.map(cat => (
                <th key={cat.code} className="py-2 px-2 text-center text-text-muted font-medium text-xs whitespace-nowrap">
                  {cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixData?.prefectures.map(prefecture => (
              <tr key={prefecture.id} className="border-b border-border/50 hover:bg-surface/50">
                <td className="py-2 px-3 sticky left-0 bg-surface z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{prefecture.name}</span>
                    <span className="text-xs text-text-muted">({prefecture.department})</span>
                  </div>
                </td>
                {prefecture.categories.map(category => (
                  <td key={category.code} className="py-2 px-2 text-center">
                    <button
                      onClick={() => setSelectedCell({
                        prefectureId: prefecture.id,
                        prefectureName: prefecture.name,
                        category,
                      })}
                      className={`w-8 h-8 rounded-lg ${STATUS_COLORS[category.status]} transition-all cursor-pointer flex items-center justify-center mx-auto`}
                      title={`${category.name}: ${STATUS_LABELS[category.status]}`}
                    >
                      {category.status === 'available' && category.slotsCount > 0 && (
                        <span className="text-xs font-bold text-white">{category.slotsCount}</span>
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
            
            {/* Indian Embassy Row */}
            {matrixData?.embassy && (
              <tr className="border-t-2 border-cyan/30 bg-cyan/5">
                <td className="py-2 px-3 sticky left-0 bg-surface z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan font-medium">{matrixData.embassy.name}</span>
                  </div>
                </td>
                {matrixData.embassy.categories.map(category => (
                  <td key={category.code} className="py-2 px-2 text-center">
                    <button
                      onClick={() => setSelectedCell({
                        prefectureId: matrixData.embassy!.id,
                        prefectureName: matrixData.embassy!.name,
                        category,
                      })}
                      className={`w-8 h-8 rounded-lg ${STATUS_COLORS[category.status]} transition-all cursor-pointer flex items-center justify-center mx-auto`}
                      title={`${category.name}: ${STATUS_LABELS[category.status]}`}
                    >
                      {category.status === 'available' && category.slotsCount > 0 && (
                        <span className="text-xs font-bold text-white">{category.slotsCount}</span>
                      )}
                    </button>
                  </td>
                ))}
                {/* Fill empty cells if embassy has fewer categories */}
                {matrixData.prefectures[0]?.categories.length > matrixData.embassy.categories.length && 
                  Array(matrixData.prefectures[0].categories.length - matrixData.embassy.categories.length)
                    .fill(0)
                    .map((_, i) => <td key={`empty-${i}`} className="py-2 px-2" />)
                }
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cell Detail Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedCell(null)}>
          <div className="card p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {selectedCell.prefectureName}
              </h3>
              <button onClick={() => setSelectedCell(null)} className="text-text-muted hover:text-white">
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-muted">Category</p>
                <p className="text-white font-medium">{selectedCell.category.name}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${STATUS_COLORS[selectedCell.category.status].split(' ')[0]}`} />
                <span className="text-white">{STATUS_LABELS[selectedCell.category.status]}</span>
              </div>

              {selectedCell.category.slotsCount > 0 && (
                <div>
                  <p className="text-sm text-text-muted">Slots Available</p>
                  <p className="text-2xl font-bold text-green-400">{selectedCell.category.slotsCount}</p>
                </div>
              )}

              {selectedCell.category.slotDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan" />
                  <span className="text-white">
                    {selectedCell.category.slotDate} {selectedCell.category.slotTime && `at ${selectedCell.category.slotTime}`}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-muted">Last Checked</p>
                  <p className="text-white">
                    {selectedCell.category.lastChecked 
                      ? new Date(selectedCell.category.lastChecked).toLocaleString('fr-FR')
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted">Last Slot Found</p>
                  <p className="text-white">
                    {selectedCell.category.lastSlotFound 
                      ? new Date(selectedCell.category.lastSlotFound).toLocaleString('fr-FR')
                      : 'Never'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => triggerCheck(selectedCell.prefectureId, selectedCell.category.code)}
                  disabled={triggeringCheck === `${selectedCell.prefectureId}:${selectedCell.category.code}`}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                >
                  {triggeringCheck === `${selectedCell.prefectureId}:${selectedCell.category.code}` ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  Check Now
                </button>
                <button
                  onClick={() => {
                    setShowBookingModal(true);
                  }}
                  className="flex-1 btn bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      <ManualBookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
        }}
        prefillData={selectedCell ? {
          prefectureId: selectedCell.prefectureId,
          prefectureName: selectedCell.prefectureName,
          categoryCode: selectedCell.category.code,
          categoryName: selectedCell.category.name,
          slotDate: selectedCell.category.slotDate || undefined,
          slotTime: selectedCell.category.slotTime || undefined,
        } : undefined}
      />
    </div>
  );
}
