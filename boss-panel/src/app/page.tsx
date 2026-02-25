"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StatsGrid from "@/components/StatsGrid";
import PrefectureMap from "@/components/PrefectureMap";
import SlotStream from "@/components/SlotStream";
import PrefectureList from "@/components/PrefectureList";
import ProcedureFilter from "@/components/ProcedureFilter";
import MobileNav from "@/components/MobileNav";

export default function Dashboard() {
  const [selectedProcedure, setSelectedProcedure] = useState<string>("ALL");
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'list' | 'stream'>('dashboard');

  useEffect(() => {
    setIsConnected(true);
  }, []);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <Header />
      
      <main className="p-4 md:p-6 pb-24 md:pb-6">
        {/* Stats Overview - Always visible */}
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
