"use client";

import { useEffect, useState, useRef } from "react";

interface CountdownTimerProps {
    expiresAt: string | null;
    className?: string;
    showLabel?: boolean;
}

export default function CountdownTimer({ expiresAt, className = "", showLabel = true }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState("");
    const [percentage, setPercentage] = useState(100);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!expiresAt) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setTimeLeft("Aucun plan");
            setPercentage(0);
            return;
        }

        const update = () => {
            const now = Date.now();
            const end = new Date(expiresAt).getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft("Expiré");
                setPercentage(0);
                if (intervalRef.current) clearInterval(intervalRef.current);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeLeft(`${days}j ${hours}h`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}min`);
            } else {
                setTimeLeft(`${minutes}min`);
            }

            // Rough percentage (assuming max 30 day plan)
            const maxMs = 30 * 24 * 60 * 60 * 1000;
            setPercentage(Math.min(100, (diff / maxMs) * 100));
        };

        update();
        intervalRef.current = setInterval(update, 60000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [expiresAt]);

    const isUrgent = percentage < 20;

    return (
        <div className={className}>
            {showLabel && <p className="text-xs font-bold text-accent uppercase tracking-wide">⏱️ Temps restant</p>}
            <p className={`text-2xl font-black mt-2 ${isUrgent ? "text-accent" : "text-gray-900"}`}>{timeLeft}</p>
            <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? "bg-accent" : "bg-primary"}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
