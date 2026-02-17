"use client";

import { motion } from "framer-motion";

const RECENT_SUCCESSES = [
    "🔥 Julien V. a obtenu un RDV à Nanterre (il y a 2 min)",
    "✅ Sarah L. a sécurisé un créneau à Bobigny (il y a 5 min)",
    "🔥 Mohamed B. a trouvé un RDV à Créteil (il y a 8 min)",
    "✅ Thomas D. a obtenu un RDV à Versailles (il y a 12 min)",
    "🔥 Sophie M. a sécurisé un créneau à Évry (il y a 15 min)",
    "✅ Nicolas P. a trouvé un RDV à Cergy (il y a 19 min)",
    "🔥 Emma R. a obtenu un RDV à Raincy (il y a 22 min)",
];

export default function LiveTicker() {
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
                        {[...RECENT_SUCCESSES, ...RECENT_SUCCESSES, ...RECENT_SUCCESSES].map((text, i) => (
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
