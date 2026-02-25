"use client";

import { useState } from "react";
import Header from "@/components/Header";
import StatsGrid from "@/components/StatsGrid";
import PrefectureMap from "@/components/PrefectureMap";
import SlotStream from "@/components/SlotStream";
import PrefectureList from "@/components/PrefectureList";
import ProcedureFilter from "@/components/ProcedureFilter";
import MobileNav from "@/components/MobileNav";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Dashboard() {
  const [selectedProcedure, setSelectedProcedure] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'list' | 'stream'>('dashboard');
  const { isConnected, latestDetection } = useWebSocket();

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <Header />
      
      <main className="p-4 md:p-6 pb-24 md:pb-6">
        {/* Connection Status Banner */}
        {!isConnected && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-center">
            <p className="text-danger text-sm">
              ⚠️ Connexion en cours... Les données peuvent ne pas être à jour.
            </p>
          </div>
        )}

        {/* Latest Detection Alert */}
        {latestDetection && (
          <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg animate-pulse">
            <p className="text-success text-sm font-medium">
              🔔 Nouveau créneau détecté: {latestDetection.prefectureName} - {latestDetection.slotDate} {latestDetection.slotTime}
            </p>
          </div>
        )}

        {/* Stats Overview */}
        <StatsGrid />

        {/* Desktop Layout */}
        <div className="hidden lg:grid mt-6 grid-cols-12 gap-6">
          <div className="col-span-8 space-y-6">
            <ProcedureFilter 
              selected={selectedProcedure}
              onSelect={setSelectedProcedure}
            />
            <PrefectureMap selectedProcedure={selectedProcedure} />
            <SlotStream />
          </div>
          <div className="col-span-4">
            <PrefectureList selectedProcedure={selectedProcedure} />
          </div>
        </div>

        {/* Mobile Layout - Tab based */}
        <div className="lg:hidden mt-4 space-y-4">
          {activeTab === 'dashboard' && (
            <>
              <ProcedureFilter 
                selected={selectedProcedure}
                onSelect={setSelectedProcedure}
              />
              <SlotStream />
            </>
          )}
          {activeTab === 'map' && (
            <PrefectureMap selectedProcedure={selectedProcedure} />
          )}
          {activeTab === 'list' && (
            <PrefectureList selectedProcedure={selectedProcedure} />
          )}
          {activeTab === 'stream' && (
            <SlotStream />
          )}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
