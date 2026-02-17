"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function DemoBanner() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        api.get("/health").then(res => {
            if (res.data.data.database !== "ok") {
                setIsOffline(true);
            }
        }).catch(() => {
            setIsOffline(true);
        });
    }, []);

    if (!isOffline) return null;

    return (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 text-xs py-1.5 px-4 text-center font-medium fixed bottom-0 left-0 right-0 z-50">
            ⚡ Demo Mode: Database is offline. Using mock data for demonstration.
        </div>
    );
}
