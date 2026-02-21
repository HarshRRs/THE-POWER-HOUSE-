"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";

interface AdminUser {
    id: string;
    email: string;
    role: string;
    plan: string;
    planExpiresAt: string | null;
    emailVerified: boolean;
    createdAt: string;
    _count: { alerts: number; payments: number; notifications: number };
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "20" });
            if (search) params.set("search", search);
            if (planFilter !== "ALL") params.set("plan", planFilter);
            const res = await api.get(`/admin/users?${params}`);
            setUsers(res.data.data.users);
            setPagination(res.data.data.pagination);
        } catch {
            // Silently handle
        } finally {
            setLoading(false);
        }
    }, [search, planFilter]);

    useEffect(() => {
        const debounce = setTimeout(() => fetchUsers(1), 300);
        return () => clearTimeout(debounce);
    }, [fetchUsers]);

    const columns = [
        {
            key: "email",
            label: "Email",
            render: (row: AdminUser) => (
                <div>
                    <span className="font-semibold">{row.email}</span>
                    {!row.emailVerified && <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">Non verifie</span>}
                </div>
            ),
        },
        {
            key: "role",
            label: "Role",
            render: (row: AdminUser) => <StatusBadge status={row.role} />,
        },
        {
            key: "plan",
            label: "Plan",
            render: (row: AdminUser) => (
                <div>
                    <StatusBadge status={row.plan === "NONE" ? "FREE" : row.plan.replace(/_/g, " ")} />
                    {row.planExpiresAt && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            Exp. {new Date(row.planExpiresAt).toLocaleDateString("fr-FR")}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: "alerts",
            label: "Alertes",
            render: (row: AdminUser) => <span className="font-bold">{row._count.alerts}</span>,
        },
        {
            key: "payments",
            label: "Paiements",
            render: (row: AdminUser) => <span>{row._count.payments}</span>,
        },
        {
            key: "createdAt",
            label: "Inscription",
            render: (row: AdminUser) => (
                <span className="text-xs text-gray-500">{new Date(row.createdAt).toLocaleDateString("fr-FR")}</span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-black text-gray-900">Gestion des Utilisateurs</h1>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par email..."
                    className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-white"
                />
                <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-white font-semibold"
                >
                    <option value="ALL">Tous les plans</option>
                    <option value="NONE">Gratuit</option>
                    <option value="URGENCE_24H">Urgence 24h</option>
                    <option value="URGENCE_7J">Urgence 7j</option>
                    <option value="URGENCE_TOTAL">Urgence Total</option>
                </select>
            </div>

            <DataTable
                columns={columns}
                data={users}
                loading={loading}
                emptyMessage="Aucun utilisateur trouve"
                pagination={{
                    ...pagination,
                    onPageChange: (page) => fetchUsers(page),
                }}
            />
        </div>
    );
}
