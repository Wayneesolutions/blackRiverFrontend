import React, { useState } from "react";

// Mock data (replace with API data later)
const mockTrucks = [
  {
    _id: "1",
    internalId: "VH001",
    plateNumber: "AB12CD1234",
    make: "Volvo",
    model: "FH16",
    year: 2020,
    driver: { name: "John Doe" },
    status: "moving",
  },
  {
    _id: "2",
    internalId: "VH002",
    plateNumber: "XY98ZZ5678",
    make: "Scania",
    model: "R500",
    year: 2021,
    driver: { name: "Amit Sharma" },
    status: "idle",
  },
  {
    _id: "3",
    internalId: "VH003",
    plateNumber: "KA12TR4321",
    make: "Mercedes",
    model: "Actros",
    year: 2019,
    driver: { name: "Priya Verma" },
    status: "stopped",
  },
];

function Trucks() {
  const [search, setSearch] = useState("");

  const filtered = mockTrucks.filter((truck) =>
    (truck.make + " " + truck.model + " " + truck.plateNumber + " " + truck.driver?.name)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Heading */}
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Truck Listing</h1>

      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by make, model, plate, or driver..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-50 text-gray-700 uppercase text-sm">
              <th className="p-4">Internal ID</th>
              <th className="p-4">Plate Number</th>
              <th className="p-4">Make</th>
              <th className="p-4">Model</th>
              <th className="p-4">Year</th>
              <th className="p-4">Driver</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((truck) => (
              <tr key={truck._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-800">{truck.internalId}</td>
                <td className="p-4 text-gray-600">{truck.plateNumber}</td>
                <td className="p-4 text-gray-600">{truck.make}</td>
                <td className="p-4 text-gray-600">{truck.model}</td>
                <td className="p-4 text-gray-600">{truck.year}</td>
                <td className="p-4 text-gray-600">{truck.driver?.name}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      truck.status === "moving"
                        ? "bg-green-100 text-green-700"
                        : truck.status === "idle"
                        ? "bg-yellow-100 text-yellow-700"
                        : truck.status === "stopped"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {truck.status}
                  </span>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-6 text-center text-gray-500 italic"
                >
                  No trucks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Trucks;
