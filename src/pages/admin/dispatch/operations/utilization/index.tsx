import { useState, useEffect } from "react";
import { Truck, Package, MapPin, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../../../../../utils/auth";
import { getUtilization } from "../../../../../axios/api/distapcher";

interface Truck {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  currentLocation: string;
  serviceStatus: string;
}

interface Trailer {
  id: string;
  plateNumber: string;
  trailerNumber: string;
  currentLocation: string;
  trailerStatus: string;
  serviceStatus: string;
}

const UtilizationPage = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const isDispatcher = userRole === 'dispatcher';
  const basePath = isDispatcher ? '/dispatch' : '/admin/dispatch';

  const [activeTab, setActiveTab] = useState<"trucks" | "trailers">("trucks");
  const [searchTerm, setSearchTerm] = useState("");
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUtilizationData();
  }, []);

  const fetchUtilizationData = async () => {
    try {
      setLoading(true);
      const response = await getUtilization();
      if (response.success && response.data) {
        setTrucks(response.data.trucks || []);
        setTrailers(response.data.trailers || []);
      }
    } catch (error) {
      console.error("Error fetching utilization data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrucks = trucks.filter(
    (truck) =>
      truck.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.currentLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTrailers = trailers.filter(
    (trailer) =>
      trailer.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trailer.trailerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trailer.currentLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getServiceStatusBadge = (status: string) => {
    if (status.toLowerCase() === "in service") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          In Service
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Out of Service
      </span>
    );
  };

  const getTrailerStatusBadge = (status: string) => {
    if (status.toLowerCase() === "loaded") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Loaded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Empty
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="relative w-full mx-auto">
   

        {/* Main content */}
        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header Section */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
             
                <h1 className="text-xl font-bold text-black">Truck & Trailer Utilization</h1>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-4">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("trucks")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "trucks"
                      ? "border-[#42aeec] text-[#42aeec]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Trucks ({trucks.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("trailers")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "trailers"
                      ? "border-[#42aeec] text-[#42aeec]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Trailers ({trailers.length})
                  </div>
                </button>
              </nav>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {activeTab === "trucks" ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Plate Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Make/Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Current Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Service Status
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Plate Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Trailer Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Current Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Trailer Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Service Status
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={activeTab === "trucks" ? 4 : 5} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : activeTab === "trucks" ? (
                    filteredTrucks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No trucks found
                        </td>
                      </tr>
                    ) : (
                      filteredTrucks.map((truck) => (
                        <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{truck.plateNumber}</div>
                            <div className="text-xs text-gray-500">ID: {truck.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{truck.make}</div>
                            <div className="text-xs text-gray-500">{truck.model}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                              {truck.currentLocation}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getServiceStatusBadge(truck.serviceStatus)}
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    filteredTrailers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No trailers found
                        </td>
                      </tr>
                    ) : (
                      filteredTrailers.map((trailer) => (
                        <tr key={trailer.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{trailer.plateNumber}</div>
                            <div className="text-xs text-gray-500">ID: {trailer.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{trailer.trailerNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                              {trailer.currentLocation}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getTrailerStatusBadge(trailer.trailerStatus)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getServiceStatusBadge(trailer.serviceStatus)}
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtilizationPage;

