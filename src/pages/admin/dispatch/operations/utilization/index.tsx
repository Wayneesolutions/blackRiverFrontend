import { useState, useEffect } from "react";
import { Truck, Package, MapPin, CheckCircle, XCircle } from "lucide-react";
import { getUtilization } from "../../../../../axios/api/distapcher";

interface Truck {
  id: string;
  _id?: string;
  unitNumber?: string;
  internalId?: string;
  plateNumber: string;
  vinNumber?: string;
  make: string;
  model: string;
  year?: string;
  type?: string;
  weight?: string;
  uom?: string;
  registrationCountry?: string;
  registrationProvince?: string;
  status?: string;
  operationStatus?: string;
  ownership?: string;
  subType?: string;
  currentLocation: string;
  latitude?: string;
  longitude?: string;
  speed?: number;
  fuelLevel?: number;
  odometer?: number;
  driver?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  trailer?: {
    _id: string;
    unitNumber?: string;
    trailer?: string;
    plateNumber?: string;
  } | null;
  serviceStatus: string;
  capacity?: string;
  serialNumber?: string;
  compliance?: string;
  category?: string;
}

interface Trailer {
  id: string;
  _id?: string;
  unitNumber?: string;
  internalId?: string;
  trailer?: string;
  trailerNumber: string;
  plateNumber: string;
  vinNumber?: string;
  make?: string;
  model?: string;
  year?: string;
  type?: string;
  weight?: string;
  uom?: string;
  registrationCountry?: string;
  registrationProvince?: string;
  status?: string;
  operationStatus?: string;
  loadedStatus?: string;
  ownership?: string;
  subType?: string;
  currentLocation: string;
  latitude?: string;
  longitude?: string;
  speed?: number;
  capacity?: string;
  isAttached?: boolean;
  attachedVehicle?: {
    _id: string;
    unitNumber?: string;
    plateNumber?: string;
    make?: string;
    model?: string;
  } | null;
  cargoDetails?: any;
  sensors?: any;
  trailerStatus: string;
  serviceStatus: string;
  compliance?: string;
  category?: string;
}

const UtilizationPage = () => {

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
    (truck) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (truck.plateNumber || '').toLowerCase().includes(searchLower) ||
        (truck.currentLocation || '').toLowerCase().includes(searchLower) ||
        (truck.make || '').toLowerCase().includes(searchLower) ||
        (truck.model || '').toLowerCase().includes(searchLower) ||
        (truck.unitNumber || '').toLowerCase().includes(searchLower) ||
        (truck.internalId || '').toLowerCase().includes(searchLower) ||
        (truck.vinNumber || '').toLowerCase().includes(searchLower) ||
        (truck.driver?.name || '').toLowerCase().includes(searchLower)
      );
    }
  );

  const filteredTrailers = trailers.filter(
    (trailer) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (trailer.plateNumber || '').toLowerCase().includes(searchLower) ||
        (trailer.trailerNumber || '').toLowerCase().includes(searchLower) ||
        (trailer.trailer || '').toLowerCase().includes(searchLower) ||
        (trailer.currentLocation || '').toLowerCase().includes(searchLower) ||
        (trailer.unitNumber || '').toLowerCase().includes(searchLower) ||
        (trailer.internalId || '').toLowerCase().includes(searchLower) ||
        (trailer.vinNumber || '').toLowerCase().includes(searchLower)
      );
    }
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
                          Unit/Plate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Make/Model/Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Driver
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Details
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Trailer/Plate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Make/Model/Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Attached Vehicle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Load Status
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
                      <td colSpan={activeTab === "trucks" ? 6 : 6} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : activeTab === "trucks" ? (
                    filteredTrucks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No trucks found
                        </td>
                      </tr>
                    ) : (
                      filteredTrucks.map((truck) => (
                        <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{truck.plateNumber || 'N/A'}</div>
                            <div className="text-xs text-gray-500">
                              Unit: {truck.unitNumber || truck.internalId || 'N/A'}
                            </div>
                            {truck.vinNumber && (
                              <div className="text-xs text-gray-400">VIN: {truck.vinNumber}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{truck.make || 'N/A'} {truck.model || ''}</div>
                            {truck.year && (
                              <div className="text-xs text-gray-500">Year: {truck.year}</div>
                            )}
                            {truck.type && (
                              <div className="text-xs text-gray-500">Type: {truck.type}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {truck.driver ? (
                              <>
                                <div className="text-sm text-gray-900">{truck.driver.name || 'N/A'}</div>
                                {truck.driver.phone && (
                                  <div className="text-xs text-gray-500">{truck.driver.phone}</div>
                                )}
                              </>
                            ) : (
                              <div className="text-sm text-gray-400">No driver assigned</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-gray-900">
                              <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-xs">{truck.currentLocation || 'Unknown'}</span>
                            </div>
                            {truck.speed !== undefined && truck.speed > 0 && (
                              <div className="text-xs text-gray-500">Speed: {truck.speed} km/h</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getServiceStatusBadge(truck.serviceStatus)}
                            {truck.operationStatus && (
                              <div className="text-xs text-gray-500 mt-1">{truck.operationStatus}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {truck.odometer !== undefined && (
                              <div>Odometer: {truck.odometer.toLocaleString()} km</div>
                            )}
                            {truck.fuelLevel !== undefined && (
                              <div>Fuel: {truck.fuelLevel}%</div>
                            )}
                            {truck.capacity && (
                              <div>Capacity: {truck.capacity}</div>
                            )}
                            {truck.trailer && (
                              <div className="text-xs text-blue-600">Trailer: {truck.trailer.unitNumber || truck.trailer.trailer || truck.trailer.plateNumber}</div>
                            )}
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    filteredTrailers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No trailers found
                        </td>
                      </tr>
                    ) : (
                      filteredTrailers.map((trailer) => (
                        <tr key={trailer.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{trailer.plateNumber || 'N/A'}</div>
                            <div className="text-xs text-gray-500">
                              Trailer: {trailer.trailerNumber || trailer.trailer || 'N/A'}
                            </div>
                            {(trailer.unitNumber || trailer.internalId) && (
                              <div className="text-xs text-gray-400">
                                Unit: {trailer.unitNumber || trailer.internalId}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {(trailer.make || trailer.model) && (
                              <div className="text-sm text-gray-900">{trailer.make || ''} {trailer.model || ''}</div>
                            )}
                            {trailer.type && (
                              <div className="text-xs text-gray-500">Type: {trailer.type}</div>
                            )}
                            {trailer.year && (
                              <div className="text-xs text-gray-500">Year: {trailer.year}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {trailer.attachedVehicle ? (
                              <>
                                <div className="text-sm text-gray-900">
                                  {trailer.attachedVehicle.unitNumber || trailer.attachedVehicle.plateNumber || 'N/A'}
                                </div>
                                {(trailer.attachedVehicle.make || trailer.attachedVehicle.model) && (
                                  <div className="text-xs text-gray-500">
                                    {trailer.attachedVehicle.make} {trailer.attachedVehicle.model}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-sm text-gray-400">Not attached</div>
                            )}
                            {trailer.isAttached && (
                              <div className="text-xs text-green-600">Attached</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center text-sm text-gray-900">
                              <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-xs">{trailer.currentLocation || 'Unknown'}</span>
                            </div>
                            {trailer.speed !== undefined && trailer.speed > 0 && (
                              <div className="text-xs text-gray-500">Speed: {trailer.speed} km/h</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getTrailerStatusBadge(trailer.trailerStatus)}
                            {trailer.loadedStatus && (
                              <div className="text-xs text-gray-500 mt-1">{trailer.loadedStatus}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getServiceStatusBadge(trailer.serviceStatus)}
                            {trailer.operationStatus && (
                              <div className="text-xs text-gray-500 mt-1">{trailer.operationStatus}</div>
                            )}
                            {trailer.capacity && (
                              <div className="text-xs text-gray-500 mt-1">Cap: {trailer.capacity}</div>
                            )}
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

