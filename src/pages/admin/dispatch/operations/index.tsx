import React, { useState } from "react";
import NewLoad from "../NewLoad";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const data = [
    {
      drivers: ["Sunny", "Sandy"],
      orderNumber: "1258969",
      orderBy: "Riya Enterprises",
      pickupLocation: "Winnipeg",
      deliveryLocation: "Touranga",
      tags: "",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Pattern */}
      <div className="absolute inset-0  bg-opacity-40 backdrop-blur-sm pointer-events-none"></div>
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex-1 p-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-700 bg-white bg-opacity-70 backdrop-blur-sm px-3 py-1 rounded-lg">
            Today: {today}
          </p>
          <button
            onClick={() => setSidebarOpen(true)}
            className="bg-green-500 hover:bg-green-600 !text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm border border-green-400"
          >
            + New Load
          </button>
        </div>

        {/* Table */}
        <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-xl border border-white border-opacity-50 shadow-xl overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 bg-opacity-80 backdrop-blur-sm text-left font-semibold text-gray-700">
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Drivers on Trip</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Order Number</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Order by</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Pickup Location</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Delivery Location</th>
                <th className="px-6 py-4">Tags</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50 hover:bg-opacity-50 transition-colors duration-200">
                  <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 align-top">
                    {row.drivers.map((driver, i) => (
                      <div key={i} className="text-gray-800 font-medium">{driver}</div>
                    ))}
                  </td>
                  <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 font-mono text-blue-600 font-semibold">
                    {row.orderNumber}
                  </td>
                  <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 text-gray-800 font-medium">
                    {row.orderBy}
                  </td>
                  <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 text-gray-700">
                    {row.pickupLocation}
                  </td>
                  <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 text-gray-700">
                    {row.deliveryLocation}
                  </td>
                  <td className="px-6 py-4 text-gray-500 italic">
                    {row.tags || "No tags"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {/* Right Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full max-w-lg w-full sm:w-[42rem] bg-white bg-opacity-95 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 border-opacity-50 ${sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <NewLoad onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-gray-900/50 backdrop-blur-sm transition-all duration-500"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
