"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface WebSocketData {
  prefectures: any[];
  recentDetections: any[];
  timestamp: string;
}

interface SlotDetection {
  prefectureId?: string;
  prefectureName?: string;
  consulateId?: string;
  consulateName?: string;
  vfsCenterId?: string;
  vfsCenterName?: string;
  categoryName?: string;
  slotsAvailable: number;
  slotDate?: string;
  slotTime?: string;
  bookingUrl: string;
  procedure?: string;
  timestamp: string;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<WebSocketData | null>(null);
  const [latestDetection, setLatestDetection] = useState<SlotDetection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket");
      setIsConnected(false);
    });

    socket.on("initial_data", (initialData: WebSocketData) => {
      console.log("📊 Received initial data:", initialData);
      setData(initialData);
    });

    socket.on("slot_detected", (detection: SlotDetection) => {
      console.log("🔔 New slot detected:", detection);
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
      console.log("🔄 Prefecture status update:", update);
      
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
      console.log("📈 Ticker update:", update);
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
