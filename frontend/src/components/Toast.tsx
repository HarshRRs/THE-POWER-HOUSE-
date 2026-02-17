"use client";

import { useEffect, useState } from "react";

interface ToastProps {
    message: string;
    type?: "success" | "error" | "info" | "warning";
    duration?: number;
    onClose: () => void;
}

const colors = {
    success: "bg-success-light border-success/30 text-success",
    error: "bg-accent-light border-accent/30 text-accent",
    info: "bg-info-light border-info/30 text-info",
    warning: "bg-warning-light border-warning/30 text-warning",
};

const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };

export default function Toast({ message, type = "success", duration = 4000, onClose }: ToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div
            className={`fixed top-4 right-4 z-[100] max-w-sm border rounded-xl px-5 py-4 shadow-xl transition-all duration-300 ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                } ${colors[type]}`}
        >
            <div className="flex items-center gap-3">
                <span className="text-lg">{icons[type]}</span>
                <p className="text-sm font-semibold">{message}</p>
                <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-auto text-current opacity-60 hover:opacity-100">✕</button>
            </div>
        </div>
    );
}
