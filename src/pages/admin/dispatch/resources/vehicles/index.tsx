import { useState, useEffect } from 'react';
import { Plus, Filter, Trash2, MoreVertical } from 'lucide-react';
import NewVehicleSidebar from './NewVehicleSidebar';
import { listVehicle, deleteVehicle } from '../../../../../axios/api/distapcher';

const VehiclesTable = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null); // track which dropdown is open

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await listVehicle();
      if (res.success) setVehicles(res.data.vehicles);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const getStatusColor = (status: string) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Vehicles</h1>
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Vehicle</span>
          </button>
        </div>
      </div>

      {/* Table */}
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
              {loading ? (
                <tr>
                  <td colSpan={12} className="text-center py-4">Loading...</td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-4">No vehicles found.</td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
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
