import  { useState } from "react";
import { useVehicles } from "../../../../customHooks/useVehicles";

interface Vehicle {
  _id: string;
  internalId: string;
  plateNumber: string;
  vinNumber: string;
  make: string;
  model: string;
  year: number;
  status: string;
  hasTrailer: boolean;
  engineOn: boolean;
  speed: number;
  fuelLevel: number;
  odometer: number;
}

function Trucks() {
  const [search, setSearch] = useState<string>("");

  // Use the custom hook - it handles loading, error, and data fetching
  const { vehicles, loading, error, emptyMessage } = useVehicles();
  const sanitizedMessage = emptyMessage && emptyMessage.toLowerCase().includes('no company assigned') ? null : emptyMessage;

  // Filter vehicles based on search
  const filtered = vehicles.filter((truck: Vehicle) =>
    (truck.make + " " + truck.model + " " + truck.plateNumber + " " + truck.internalId)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Truck Listing</h1>

      {sanitizedMessage && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
          <span className="text-2xl">🚛</span>
          <span className="text-sm">{sanitizedMessage}</span>
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by make, model, plate, or internal ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-50 text-gray-700 uppercase text-sm">
              <th className="p-4">Internal ID</th>
              <th className="p-4">Plate Number</th>
              <th className="p-4">Make</th>
              <th className="p-4">Model</th>
              <th className="p-4">Year</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((truck: Vehicle) => (
              <tr key={truck._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-800">{truck.internalId}</td>
                <td className="p-4 text-gray-600">{truck.plateNumber}</td>
                <td className="p-4 text-gray-600">{truck.make}</td>
                <td className="p-4 text-gray-600">{truck.model}</td>
                <td className="p-4 text-gray-600">{truck.year}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${truck.status === "available"
                        ? "bg-green-100 text-green-700"
                        : truck.status === "in-use"
                          ? "bg-yellow-100 text-yellow-700"
                          : truck.status === "maintenance"
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
                  colSpan={6}
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

