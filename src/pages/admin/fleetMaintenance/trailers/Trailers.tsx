import { useState, useEffect } from "react";
import { listTrailers } from "../../../../axios/api/fleet.maintenance";

interface Trailer {
  _id: string;
  trailer: string;
  internalId?: string;
  plateNumber: string;
  type: string;
  capacity: string;
  ownerShip?: string;
  lastDispatch?: string;
  lastDropLocation?: string;
  note?: string;
  operationStatus: string;
  loadStatus?: string;
  compilance?: string;
  status?: string;
  isAttached?: boolean;
  attachedVehicle?: {
    _id: string;
    plateNumber: string;
    make: string;
    model: string;
    driver?: {
      name: string;
    };
  };
  currentLocation?: {
    address?: string;
    latitude?: string;
    longitude?: string;
    updatedAt?: string;
  };
  speed?: number;
  cargoDetails?: {
    cargoType?: string;
    weight?: number;
  };
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
      console.log('🔄 Fetching trailers...');
      const response = await listTrailers();
      console.log('📡 Trailers API response:', response);
      
      if (response?.success && response.data) {
        console.log('✅ Trailers loaded successfully:', response.data.length, 'trailers');
        setTrailers(response.data);
        setError(null);
      } else {
        console.error('❌ Failed to load trailers:', response?.message);
        setError(response?.message || "Failed to load trailers");
      }
    } catch (err: any) {
      console.error('❌ Error fetching trailers:', err);
      setError(err?.message || "An error occurred while fetching trailers");
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
              <th className="p-4">Capacity</th>
              <th className="p-4">Operation Status</th>
              <th className="p-4">Attached Vehicle</th>
              <th className="p-4">Location</th>
              <th className="p-4">Speed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((trailer) => (
              <tr key={trailer._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-800">{trailer.trailer}</td>
                <td className="p-4 text-gray-600">{trailer.plateNumber}</td>
                <td className="p-4 text-gray-600 capitalize">{trailer.type?.replace('_', ' ')}</td>
                <td className="p-4 text-gray-600">{trailer.capacity || 'N/A'}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      trailer.operationStatus === "available"
                        ? "bg-green-100 text-green-700"
                        : trailer.operationStatus === "in_transit"
                        ? "bg-blue-100 text-blue-700"
                        : trailer.operationStatus === "maintenance"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {trailer.operationStatus?.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-gray-600">
                  {trailer.isAttached && trailer.attachedVehicle ? (
                    <div>
                      <div className="font-medium">{trailer.attachedVehicle.plateNumber}</div>
                      <div className="text-xs text-gray-500">
                        {trailer.attachedVehicle.make} {trailer.attachedVehicle.model}
                      </div>
                      {trailer.attachedVehicle.driver && (
                        <div className="text-xs text-gray-500">
                          Driver: {trailer.attachedVehicle.driver.name}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">Not attached</span>
                  )}
                </td>
                <td className="p-4 text-gray-600">
                  {trailer.currentLocation?.address || 'N/A'}
                </td>
                <td className="p-4 text-gray-600">
                  {trailer.speed ? `${trailer.speed} km/h` : 'N/A'}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
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