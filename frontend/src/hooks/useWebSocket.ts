"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface SlotDetection {
    prefectureId: string;
    prefectureName: string;
    department: string;
    slotsAvailable: number;
    bookingUrl?: string;
    slotDate?: string;
    slotTime?: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";

export function useWebSocket(token: string | null) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastDetection, setLastDetection] = useState<SlotDetection | null>(null);
    const [notifications, setNotifications] = useState<SlotDetection[]>([]);

    const showBrowserNotification = useCallback((detection: SlotDetection) => {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`🚨 ${detection.slotsAvailable} créneau(x) détecté(s)!`, {
                body: `${detection.prefectureName} (${detection.department}) — Réservez maintenant!`,
                icon: "/favicon.ico",
                tag: `slot-${detection.prefectureId}`,
            });
        }
    }, []);

    useEffect(() => {
        if (!token) return;

        const socket = io(WS_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socket.on("connect", () => setIsConnected(true));
        socket.on("disconnect", () => setIsConnected(false));

        socket.on("slot:detected", (data: SlotDetection) => {
            setLastDetection(data);
            setNotifications((prev) => [data, ...prev].slice(0, 50));
            showBrowserNotification(data);
        });

        socketRef.current = socket;

        // Request browser notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token, showBrowserNotification]);

    const clearNotifications = () => setNotifications([]);

    return {
        isConnected,
        lastDetection,
        notifications,
        clearNotifications,
        notificationCount: notifications.length,
    };
}
