"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { WebSocketData, SlotDetection } from "@/types";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<WebSocketData | null>(null);
  const [latestDetection, setLatestDetection] = useState<SlotDetection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket - use current origin in production, localhost in dev
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    // In browser, if API_URL points to localhost but we're on a real domain, use current origin
    let wsUrl = apiUrl.replace(/\/api\/?$/, '');
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      wsUrl = window.location.origin;
    }
    const socket = io(wsUrl, {
      path: '/socket.io',
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (process.env.NODE_ENV === 'development') console.log("Connected to WebSocket");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      if (process.env.NODE_ENV === 'development') console.log("Disconnected from WebSocket");
      setIsConnected(false);
    });

    socket.on("initial_data", (initialData: WebSocketData) => {
      if (process.env.NODE_ENV === 'development') console.log("Received initial data");
      setData(initialData);
    });

    socket.on("slot_detected", (detection: SlotDetection) => {
      if (process.env.NODE_ENV === 'development') console.log("New slot detected:", detection);
      setLatestDetection(detection);
      
      // Update data with new detection
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recentDetections: [detection, ...prev.recentDetections].slice(0, 50),
        };
      });

      // Play sound alert
      playNotificationSound();
    });

    socket.on("prefecture_status_update", (update: any) => {
      if (process.env.NODE_ENV === 'development') console.log("Prefecture status update:", update);
      
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          prefectures: prev.prefectures.map((p) =>
            p.id === update.prefectureId ? { ...p, ...update } : p
          ),
        };
      });
    });

    socket.on("ticker_update", (update: any) => {
      if (process.env.NODE_ENV === 'development') console.log("Ticker update:", update);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribeToPrefecture = useCallback((prefectureId: string) => {
    socketRef.current?.emit("subscribe_prefecture", prefectureId);
  }, []);

  const subscribeToProcedure = useCallback((procedure: string) => {
    socketRef.current?.emit("subscribe_procedure", procedure);
  }, []);

  return {
    isConnected,
    data,
    latestDetection,
    subscribeToPrefecture,
    subscribeToProcedure,
  };
}

function playNotificationSound() {
  // Create a short beep sound
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}
