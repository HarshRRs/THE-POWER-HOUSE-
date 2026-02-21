"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="flex items-center justify-center py-20">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-2xl p-8 card-shadow">
                    <div className="text-4xl mb-4">🔧</div>
                    <h2 className="text-lg font-black text-gray-900 mb-2">Erreur de chargement</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Impossible de charger cette section. Veuillez reessayer.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={reset}
                            className="gradient-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                            Reessayer
                        </button>
                        <Link
                            href="/dashboard"
                            className="px-5 py-2.5 rounded-xl font-bold text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Retour
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
