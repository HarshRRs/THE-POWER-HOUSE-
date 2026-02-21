"use client";

import { useState } from "react";
import api from "@/lib/api";

interface RefundEligibility {
  userId: string;
  userEmail: string;
  plan: string;
  planExpiresAt: string;
  totalDetections: number;
  eligibleForRefund: boolean;
  reason?: string;
}

export default function RefundManagement() {
  const [userId, setUserId] = useState("");
  const [eligibility, setEligibility] = useState<RefundEligibility | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [message, setMessage] = useState("");

  const checkEligibility = async () => {
    if (!userId) return;
    
    setLoading(true);
    setMessage("");
    try {
      const res = await api.get(`/admin/refunds/check/${userId}`);
      setEligibility(res.data.data);
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Failed to check eligibility");
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async () => {
    if (!userId || !reason) return;
    
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post(`/admin/refunds/process/${userId}`, { reason });
      setMessage(res.data.data.message);
      setEligibility(null);
      setUserId("");
      setReason("");
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Failed to process refund");
    } finally {
      setLoading(false);
    }
  };

  const processBatchRefunds = async () => {
    setBatchLoading(true);
    setMessage("");
    try {
      const res = await api.post("/admin/refunds/batch");
      const data = res.data.data;
      setMessage(`Batch processing completed: ${data.totalProcessed} processed, ${data.successfulRefunds} successful, ${data.failedRefunds} failed`);
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Failed to process batch refunds");
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-900">Gestion des Remboursements</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes("completed") || message.includes("successful") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message}
        </div>
      )}

      {/* Manual Refund Section */}
      <div className="card-govt bg-white rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Remboursement Manuel</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Entrez l'ID utilisateur"
              className="w-full input-mobile"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={checkEligibility}
              disabled={!userId || loading}
              className="btn-press w-full gradient-urgent text-white py-2.5 rounded-lg font-bold text-sm disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Vérifier Éligibilité"}
            </button>
          </div>
        </div>

        {eligibility && (
          <div className={`p-4 rounded-lg mb-4 ${eligibility.eligibleForRefund ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
            <h3 className="font-bold mb-2">
              Utilisateur: {eligibility.userEmail} ({eligibility.plan})
            </h3>
            <p className="text-sm mb-2">
              Détections trouvées: {eligibility.totalDetections}
            </p>
            <p className={`text-sm font-bold ${eligibility.eligibleForRefund ? "text-green-700" : "text-yellow-700"}`}>
              {eligibility.eligibleForRefund 
                ? "✅ Éligible pour remboursement automatique" 
                : `❌ Non éligible: ${eligibility.reason}`}
            </p>
            
            {eligibility.eligibleForRefund && (
              <div className="mt-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Raison du remboursement</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Expliquez pourquoi ce remboursement est nécessaire..."
                  className="w-full input-mobile h-24"
                />
                <button
                  onClick={processRefund}
                  disabled={!reason.trim() || loading}
                  className="mt-2 btn-press w-full gradient-primary text-white py-2.5 rounded-lg font-bold text-sm disabled:opacity-50"
                >
                  {loading ? "Traitement..." : "Traiter le Remboursement"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Batch Processing Section */}
      <div className="card-govt bg-white rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Traitement Par Lots</h2>
        <p className="text-gray-600 text-sm mb-4">
          Traite automatiquement tous les remboursements éligibles pour les plans Urgence Totale expirés
        </p>
        <button
          onClick={processBatchRefunds}
          disabled={batchLoading}
          className="btn-press gradient-urgent text-white px-6 py-3 rounded-lg font-bold text-sm disabled:opacity-50"
        >
          {batchLoading ? "Traitement en cours..." : "Traiter Tous les Remboursements Éligibles"}
        </button>
      </div>

      {/* Information Panel */}
      <div className="card-govt bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-blue-800 mb-3">Politique de Remboursement</h2>
        <ul className="text-blue-700 text-sm space-y-2">
          <li>• <strong>Urgence 24h (4,99€):</strong> Pas de remboursement</li>
          <li>• <strong>Urgence 7 jours (14,99€):</strong> 50% remboursé si aucun créneau détecté</li>
          <li>• <strong>Urgence Totale (29,99€/mois):</strong> 100% remboursé si aucun RDV trouvé (garantie automatique)</li>
          <li className="mt-3 pt-2 border-t border-blue-200">
            <strong>Note:</strong> Les remboursements automatiques ne s'appliquent pas en cas de mauvaise configuration ou site indisponible
          </li>
        </ul>
      </div>
    </div>
  );
}