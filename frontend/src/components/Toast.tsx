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

const icons = { success: "\u2705", error: "\u274C", info: "\u2139\uFE0F", warning: "\u26A0\uFE0F" };

export default function Toast({ message, type = "success", duration = 4000, onClose }: ToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation on next frame
        requestAnimationFrame(() => setVisible(true));

        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div
            className={`fixed top-0 left-0 right-0 sm:top-4 sm:right-4 sm:left-auto z-[100] sm:max-w-sm border-b sm:border rounded-none sm:rounded-xl px-5 py-4 shadow-xl transition-all duration-300 ease-out ${
                visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
            } ${colors[type]}`}
            style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
        >
            <div className="flex items-center gap-3">
                <span className="text-lg">{icons[type]}</span>
                <p className="text-sm font-semibold flex-1">{message}</p>
                <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-auto text-current opacity-60 hover:opacity-100 p-1 touch-target flex items-center justify-center">&times;</button>
            </div>
        </div>
    );
}
