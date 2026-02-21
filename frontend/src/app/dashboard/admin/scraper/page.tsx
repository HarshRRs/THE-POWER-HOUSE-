"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import StatCard from "@/components/admin/StatCard";

interface QueueStats {
    active: number;
    waiting: number;
    delayed?: number;
    failed: number;
    completed?: number;
}

interface FailedJob {
    id: string;
    name: string;
    data: Record<string, unknown>;
    failedReason: string;
    timestamp: number;
    attemptsMade: number;
}

interface ScraperStatus {
    queues: {
        scraper: QueueStats;
        notifications: QueueStats;
    };
    recentFailed: FailedJob[];
}

export default function AdminScraperPage() {
    const [status, setStatus] = useState<ScraperStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await api.get("/admin/scraper/status");
            setStatus(res.data.data);
        } catch {
            // Handle error
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleRetry = async (jobId: string) => {
        setRetrying(jobId);
        try {
            await api.post(`/admin/scraper/retry/${jobId}`);
            fetchStatus();
        } catch {
            // Handle error
        } finally {
            setRetrying(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!status) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-black text-gray-900">Scraper & Files d&apos;attente</h1>
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Actualisation 5s
                </div>
            </div>

            {/* Queue Stats */}
            <div>
                <h2 className="text-sm font-black text-gray-900 uppercase mb-3">File Scraper</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <StatCard icon="⚡" label="Actifs" value={status.queues.scraper.active} color="green" />
                    <StatCard icon="⏳" label="En attente" value={status.queues.scraper.waiting} color="amber" />
                    <StatCard icon="🕐" label="Differes" value={status.queues.scraper.delayed || 0} color="blue" />
                    <StatCard icon="❌" label="Echoues" value={status.queues.scraper.failed} color="red" />
                    <StatCard icon="✅" label="Termines" value={status.queues.scraper.completed || 0} color="green" />
                </div>
            </div>

            <div>
                <h2 className="text-sm font-black text-gray-900 uppercase mb-3">File Notifications</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatCard icon="⚡" label="Actifs" value={status.queues.notifications.active} color="green" />
                    <StatCard icon="⏳" label="En attente" value={status.queues.notifications.waiting} color="amber" />
                    <StatCard icon="❌" label="Echoues" value={status.queues.notifications.failed} color="red" />
                </div>
            </div>

            {/* Failed Jobs */}
            <div>
                <h2 className="text-sm font-black text-gray-900 uppercase mb-3">Jobs Echoues Recents</h2>
                {status.recentFailed.length === 0 ? (
                    <div className="bg-green-50 rounded-xl p-6 text-center">
                        <p className="text-sm font-bold text-green-600">Aucun job echoue</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {status.recentFailed.map((job) => (
                            <div key={job.id} className="bg-white rounded-xl p-4 card-shadow border border-gray-100">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900">{job.name || "scraper-job"}</p>
                                        <p className="text-xs text-red-500 mt-1">{job.failedReason}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Tentatives: {job.attemptsMade} | {new Date(job.timestamp).toLocaleString("fr-FR")}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRetry(job.id!)}
                                        disabled={retrying === job.id}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50"
                                    >
                                        {retrying === job.id ? "..." : "Reessayer"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
