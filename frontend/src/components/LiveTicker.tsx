"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";

const FALLBACK_SUCCESSES = [
    "Surveillance active des prefectures en cours...",
    "Detecteur de creneaux en fonctionnement...",
    "Monitoring en temps reel des creneaux disponibles...",
];

export default function LiveTicker() {
    const [messages, setMessages] = useState<string[]>(FALLBACK_SUCCESSES);

    useEffect(() => {
        api.get("/health/recent-successes")
            .then((res) => {
                const data = res.data?.data;
                if (Array.isArray(data) && data.length > 0) {
                    setMessages(data);
                }
            })
            .catch(() => {
                // Keep fallback messages
            });
    }, []);
    return (
        <div className="bg-primary/5 border-b border-primary/10 overflow-hidden py-2 relative z-50">
            <div className="flex items-center gap-4">
                <div className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded ml-4 shrink-0 uppercase tracking-wider animate-pulse">
                    En direct
                </div>
                <div className="flex overflow-hidden mask-linear-fade">
                    <motion.div
                        className="flex gap-8 whitespace-nowrap"
                        animate={{ x: [0, -1000] }}
                        transition={{
                            repeat: Infinity,
                            ease: "linear",
                            duration: 20, // Adjust speed here
                        }}
                    >
                        {[...messages, ...messages, ...messages].map((text, i) => (
                            <span key={i} className="text-sm text-gray-600 font-medium flex items-center gap-2">
                                {text}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
