"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import DataTable from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";

interface Payment {
    id: string;
    user: { id: string; email: string };
    plan: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    paidAt: string | null;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [summary, setSummary] = useState({ totalRevenue: 0, averageOrderValue: 0, totalPayments: 0 });
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);

    const fetchPayments = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "20" });
            if (statusFilter !== "ALL") params.set("status", statusFilter);
            const res = await api.get(`/admin/payments?${params}`);
            setPayments(res.data.data.payments);
            setPagination(res.data.data.pagination);
            setSummary(res.data.data.summary);
        } catch {
            // Handle error
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchPayments(1); }, [fetchPayments]);

    const columns = [
        {
            key: "createdAt",
            label: "Date",
            render: (row: Payment) => (
                <span className="text-xs">{new Date(row.createdAt).toLocaleDateString("fr-FR")}</span>
            ),
        },
        {
            key: "email",
            label: "Utilisateur",
            render: (row: Payment) => <span className="font-semibold text-xs">{row.user.email}</span>,
        },
        {
            key: "plan",
            label: "Plan",
            render: (row: Payment) => <span className="text-xs font-bold">{row.plan.replace(/_/g, " ")}</span>,
        },
        {
            key: "amount",
            label: "Montant",
            render: (row: Payment) => (
                <span className="font-bold">{(row.amount / 100).toFixed(2)}€</span>
            ),
        },
        {
            key: "status",
            label: "Statut",
            render: (row: Payment) => <StatusBadge status={row.status} />,
        },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-black text-gray-900">Paiements & Revenus</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon="💰" label="Revenu total" value={`${(summary.totalRevenue / 100).toFixed(0)}€`} color="green" />
                <StatCard icon="📊" label="Panier moyen" value={`${(summary.averageOrderValue / 100).toFixed(2)}€`} color="blue" />
                <StatCard icon="🧾" label="Paiements" value={summary.totalPayments} color="purple" />
            </div>

            {/* Filter */}
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-white font-semibold"
            >
                <option value="ALL">Tous les statuts</option>
                <option value="COMPLETED">Completes</option>
                <option value="PENDING">En attente</option>
                <option value="FAILED">Echoues</option>
                <option value="REFUNDED">Rembourses</option>
            </select>

            <DataTable
                columns={columns}
                data={payments}
                loading={loading}
                emptyMessage="Aucun paiement trouve"
                pagination={{
                    ...pagination,
                    onPageChange: (page) => fetchPayments(page),
                }}
            />
        </div>
    );
}
