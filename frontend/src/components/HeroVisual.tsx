"use client";

import { motion } from "framer-motion";

export default function HeroVisual() {
  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Visual Representation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-white/80 text-sm ml-2">RDVPriority Dashboard</span>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold text-white">101</div>
                <div className="text-white/80 text-sm">Prefectures</div>
                <div className="text-green-300 text-xs mt-1">✓ Monitoring</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-white/80 text-sm">Surveillance</div>
                <div className="text-blue-300 text-xs mt-1">✓ Active</div>
              </div>
            </div>
            
            {/* Live Feed */}
            <div className="bg-black/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">Live Updates</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 text-sm">LIVE</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/90">Paris 8ème</span>
                  <span className="text-green-300 font-medium">✓ Slot Found</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/90">Lyon 2ème</span>
                  <span className="text-yellow-300">Scanning...</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/90">Marseille</span>
                  <span className="text-blue-300">✓ Notified</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-28 h-28 bg-gradient-to-br from-green-400 to-teal-500 rounded-full opacity-20 blur-xl"></div>
        </motion.div>
        
        {/* Right Side - Benefits List */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">⚡</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Instant Notifications</h3>
              <p className="text-white/70">Get alerted within seconds when appointment slots become available at any prefecture.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🔒</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Secure & Reliable</h3>
              <p className="text-white/70">Bank-level security protecting your personal information and appointment data.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎯</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Smart Matching</h3>
              <p className="text-white/70">Our AI prioritizes the best appointment slots based on your preferences and urgency.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}