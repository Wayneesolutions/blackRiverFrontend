import React, { useState, useEffect } from "react";
import { listTrailers } from "../../../../axios/api/fleet.maintenance";

interface Trailer {
  _id: string;
  trailer: string;
  plateNumber: string;
  type: string;
  ownerShip: string;
  lastDispatch: string;
  lastDropLocation: string;
  note?: string;
  operationStatus: string;
  loadStatus: string;
  compilance: string;
}

function Trailers() {
  const [search, setSearch] = useState<string>("");
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrailers();
  }, []);

  const fetchTrailers = async () => {
    try {
      setLoading(true);
      const response = await listTrailers();
      
      if (response?.success && response.dataa) {
        setTrailers(response.dataa);
        setError(null);
      } else {
        setError(response?.message || "Failed to load trailers");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while fetching trailers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = trailers.filter((trailer) =>
    (trailer.trailer + " " + trailer.plateNumber + " " + trailer.type)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading trailers...</p>
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Trailer Listing</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by trailer ID, plate, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-50 text-gray-700 uppercase text-sm">
              <th className="p-4">Trailer ID</th>
              <th className="p-4">Plate Number</th>
              <th className="p-4">Type</th>
              <th className="p-4">Ownership</th>
              <th className="p-4">Last Dispatch</th>
              <th className="p-4">Last Drop Location</th>
              <th className="p-4">Operation Status</th>
              <th className="p-4">Load Status</th>
              <th className="p-4">Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((trailer) => (
              <tr key={trailer._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-800">{trailer.trailer}</td>
                <td className="p-4 text-gray-600">{trailer.plateNumber}</td>
                <td className="p-4 text-gray-600">{trailer.type}</td>
                <td className="p-4 text-gray-600">{trailer.ownerShip}</td>
                <td className="p-4 text-gray-600">{trailer.lastDispatch}</td>
                <td className="p-4 text-gray-600">{trailer.lastDropLocation}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      trailer.operationStatus === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {trailer.operationStatus}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      trailer.loadStatus === "loaded"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {trailer.loadStatus}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{trailer.compilance}</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="p-6 text-center text-gray-500 italic"
                >
                  No trailers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Trailers;