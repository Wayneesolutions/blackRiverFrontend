import React from "react";

const Index = () => {
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
    <div className="p-4 bg-[#FFF7F7] min-h-screen">
      {/* Date */}
      <p className="text-sm mb-2">
        Today : {today}
      </p>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 text-left text-sm font-semibold text-gray-700">
              <th className="px-6 py-4 border-r border-gray-200">Drivers on Trip</th>
              <th className="px-6 py-4 border-r border-gray-200">Order Number</th>
              <th className="px-6 py-4 border-r border-gray-200">Order by</th>
              <th className="px-6 py-4 border-r border-gray-200">Pickup Location</th>
              <th className="px-6 py-4 border-r border-gray-200">Delivery Location</th>
              <th className="px-6 py-4">Tags</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="text-sm hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 border-r border-gray-100 align-top">
                  {row.drivers.map((driver, i) => (
                    <div key={i} className="font-medium text-gray-800">{driver}</div>
                  ))}
                </td>
                <td className="px-6 py-4 border-r border-gray-100 font-mono text-blue-600 font-semibold">{row.orderNumber}</td>
                <td className="px-6 py-4 border-r border-gray-100 font-medium text-gray-800">{row.orderBy}</td>
                <td className="px-6 py-4 border-r border-gray-100 text-gray-700">{row.pickupLocation}</td>
                <td className="px-6 py-4 border-r border-gray-100 text-gray-700">{row.deliveryLocation}</td>
                <td className="px-6 py-4 text-gray-500 italic">{row.tags || "No tags"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Index;