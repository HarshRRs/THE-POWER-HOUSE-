"use client";

// Dashboard Preview graphic

export default function DashboardPreview() {
  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Mock Dashboard Screenshot */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
        {/* Browser Window Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2 border-b border-gray-700">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex-1 text-center text-sm text-gray-400">
            dashboard.rdvpriority.fr
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Header Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">1,247</div>
              <div className="text-sm text-gray-400">Slots Found</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">101</div>
              <div className="text-sm text-gray-400">Prefectures</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">843</div>
              <div className="text-sm text-gray-400">Active Users</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">87%</div>
              <div className="text-sm text-gray-400">Success Rate</div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-3 gap-4">
            {/* Left Panel - Alerts */}
            <div className="col-span-2 bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Recent Alerts</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-green-900/20 rounded border border-green-800">
                  <div>
                    <div className="text-white font-medium">Paris Prefecture</div>
                    <div className="text-sm text-gray-400">Slot available in 2 hours</div>
                  </div>
                  <div className="text-green-400 font-bold">NEW</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-900/20 rounded border border-blue-800">
                  <div>
                    <div className="text-white font-medium">Lyon Prefecture</div>
                    <div className="text-sm text-gray-400">Appointment confirmed</div>
                  </div>
                  <div className="text-blue-400 text-sm">CONFIRMED</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded border border-gray-600">
                  <div>
                    <div className="text-gray-300 font-medium">Marseille Prefecture</div>
                    <div className="text-sm text-gray-500">Monitoring active</div>
                  </div>
                  <div className="text-gray-500 text-sm">ACTIVE</div>
                </div>
              </div>
            </div>

            {/* Right Panel - Notifications */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm text-white">Email sent</div>
                    <div className="text-xs text-gray-500">2 min ago</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm text-white">SMS delivered</div>
                    <div className="text-xs text-gray-500">5 min ago</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm text-white">WhatsApp notified</div>
                    <div className="text-xs text-gray-500">12 min ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements for realism */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-green-500 to-teal-600 rounded-full opacity-20 blur-xl"></div>
    </div>
  );
}