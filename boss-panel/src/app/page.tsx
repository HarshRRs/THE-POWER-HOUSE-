"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StatsGrid from "@/components/StatsGrid";
import PrefectureMap from "@/components/PrefectureMap";
import SlotStream from "@/components/SlotStream";
import PrefectureList from "@/components/PrefectureList";
import ProcedureFilter from "@/components/ProcedureFilter";

export default function Dashboard() {
  const [selectedProcedure, setSelectedProcedure] = useState<string>("ALL");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate connection status
    setIsConnected(true);
  }, []);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <Header />
      
      <main className="p-6">
        {/* Stats Overview */}
        <StatsGrid />

        {/* Main Content Grid */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          {/* Left Column - Map & Filters */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Procedure Filter */}
            <ProcedureFilter 
              selected={selectedProcedure}
              onSelect={setSelectedProcedure}
            />

            {/* Live Map */}
            <PrefectureMap 
              selectedProcedure={selectedProcedure}
            />

            {/* Slot Stream Ticker */}
            <SlotStream />
          </div>

          {/* Right Column - Prefecture List */}
          <div className="col-span-12 lg:col-span-4">
            <PrefectureList 
              selectedProcedure={selectedProcedure}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
