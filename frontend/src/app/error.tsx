"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to Sentry
        Sentry.captureException(error);
        console.error("Global error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Une erreur est survenue</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Nous nous excusons pour ce desagrement. Veuillez reessayer.
                    </p>
                    <button
                        onClick={reset}
                        className="gradient-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        Reessayer
                    </button>
                </div>
            </div>
        </div>
    );
}
