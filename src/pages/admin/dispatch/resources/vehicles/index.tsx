import { useState, useEffect, useMemo } from 'react';
import { Plus, Filter, Trash2, MoreVertical, Search } from 'lucide-react';
import NewVehicleSidebar from './NewVehicleSidebar';
import { listVehicle, deleteVehicle } from '../../../../../axios/api/distapcher';

interface Vehicle {
  _id: string;
  internalId?: string;
  plateNumber?: string;
  vinNumber?: string;
  make?: string;
  model?: string;
  year?: string;
  status?: string;
  driver?: { name?: string };
  currentLocation?: { address?: string };
  vehicleImage?: Array<{ imageUrl: string }>;
  trailer?: { serialNumber?: string };
}

const VehiclesTable = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userInfoReady, setUserInfoReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        setUserInfo(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
    } finally {
      setUserInfoReady(true);
    }
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await listVehicle();
      if (res?.success) {
        const data = Array.isArray(res?.data?.vehicles)
          ? res.data.vehicles
          : Array.isArray(res?.data)
            ? res.data
            : [];
        setVehicles(data);
        if (res?.message && data.length === 0) {
          setEmptyStateMessage(res.message);
        } else if (data.length > 0) {
          setEmptyStateMessage(null);
        }
      } else {
        setVehicles([]);
        setEmptyStateMessage(res?.message || 'Failed to fetch vehicles.');
      }
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
      setEmptyStateMessage(error?.message || 'Failed to fetch vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfoReady) {
      return;
    }

    const isSuperadmin = userInfo?.role === 'superadmin';
    const hasCompany = Boolean(userInfo?.company);

    if (!isSuperadmin && !hasCompany) {
      setVehicles([]);
      setEmptyStateMessage('No company assigned to the current admin.');
      setLoading(false);
      return;
    }

    fetchVehicles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfoReady, userInfo]);

  const getStatusColor = (status: string) => {
  if (!status) {
    return 'bg-gray-100 text-gray-800';
  }

  switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'moving':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      const res = await deleteVehicle(vehicleId);
      if (res.success) fetchVehicles();
    } catch (error) {
      console.error(error);
    }
  };

const filteredVehicles = useMemo(() => {
  if (!searchQuery.trim()) {
    return vehicles;
  }

  const query = searchQuery.toLowerCase();
  return vehicles.filter((vehicle) => {
    const internalId = vehicle.internalId || '';
    const plateNumber = vehicle.plateNumber || '';
    const make = vehicle.make || '';
    const model = vehicle.model || '';
    const driver = vehicle.driver?.name || '';

    return (
      internalId.toLowerCase().includes(query) ||
      plateNumber.toLowerCase().includes(query) ||
      make.toLowerCase().includes(query) ||
      model.toLowerCase().includes(query) ||
      driver.toLowerCase().includes(query)
    );
  });
}, [vehicles, searchQuery]);

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
    </div>
  );
}

if (emptyStateMessage && vehicles.length === 0) {
  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center text-center space-y-4">
      <div className="text-5xl text-gray-300">🚚</div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800">No vehicle data available</h2>
        <p className="text-gray-500">{emptyStateMessage}</p>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-semibold text-gray-900">Vehicles</h1>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search vehicles..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button className="p-2 text-gray-400 hover:text-gray-600">
          <Filter className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-blue-600 !text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Vehicle</span>
        </button>
      </div>
    </div>

    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto">
        <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trailer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-4">No vehicles found.</td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{vehicle.internalId}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{vehicle.plateNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{vehicle.vinNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{vehicle.make}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{vehicle.model}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{vehicle.year}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{vehicle.driver?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{vehicle.currentLocation?.address || '-'}</td>
                    <td className="px-6 py-4">
                      {vehicle.vehicleImage?.length > 0 ? (
                        <div className="flex space-x-2">
                          {vehicle.vehicleImage.map((img: any, idx: number) => (
                            <img
                              key={idx}
                              src={img.imageUrl.replace(/\\/g, '/')}
                              alt="Vehicle"
                              className="h-20 w-20 object-cover rounded border"
                            />
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{vehicle.trailer?.serialNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 relative">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === vehicle._id ? null : vehicle._id)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openMenuId === vehicle._id && (
                          <div className="absolute right-0 mt-2 w-28 bg-white border rounded shadow-md z-10">
                            <button
                              onClick={() => {
                                handleDelete(vehicle._id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sidebar */}
      <NewVehicleSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
};

export default VehiclesTable;
