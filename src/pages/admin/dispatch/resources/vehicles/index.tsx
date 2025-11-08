import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Filter, Trash2, Search, Pencil } from 'lucide-react';
import { message } from 'antd';
import NewVehicleSidebar from './NewVehicleSidebar';
import { listVehicle, deleteVehicle, updateVehicle, createVehicle } from '../../../../../axios/api/distapcher';

export interface Vehicle {
  _id: string;
  internalId?: string;
  plateNumber?: string;
  vinNumber?: string;
  make?: string;
  model?: string;
  year?: string;
  status?: string;
  currentLocation?: { address?: string };
  vehicleImage?: Array<{ imageUrl: string }>;
}

const VehiclesTable = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarMode, setSidebarMode] = useState<'create' | 'edit'>('create');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('userInfo');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
      return null;
    }
  });

  const sanitizeMessage = useCallback((message?: string | null) => {
    if (!message) return null;
    return message.toLowerCase().includes('no company assigned') ? null : message;
  }, []);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listVehicle();
      const message = sanitizeMessage(res?.message || null);

      if (res?.success) {
        const data = Array.isArray(res?.data?.vehicles)
          ? res.data.vehicles
          : Array.isArray(res?.data)
            ? res.data
            : [];

        setVehicles(data);
        if (data.length === 0) {
          setEmptyStateMessage(message || 'No vehicles found.');
        } else {
          setEmptyStateMessage(null);
        }
      } else {
        setVehicles([]);
        setEmptyStateMessage(message || 'Failed to fetch vehicles.');
      }
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
      setEmptyStateMessage(sanitizeMessage(error?.message) || 'Failed to fetch vehicles.');
    } finally {
      setLoading(false);
    }
  }, [userInfo, sanitizeMessage]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'userInfo' && event.newValue) {
        try {
          setUserInfo(JSON.parse(event.newValue));
        } catch (error) {
          console.error('Error parsing userInfo from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

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

    return (
      internalId.toLowerCase().includes(query) ||
      plateNumber.toLowerCase().includes(query) ||
      make.toLowerCase().includes(query) ||
      model.toLowerCase().includes(query)
    );
  });
}, [vehicles, searchQuery]);

const canCreateVehicle = userInfo?.role === 'superadmin' || Boolean(userInfo?.company);

const handleOpenCreateSidebar = useCallback(() => {
  if (!canCreateVehicle) {
    message.warning('Assign a company to this account or use a superadmin role to create vehicles.');
  }
  setSidebarMode('create');
  setEditingVehicle(null);
  setIsSidebarOpen(true);
}, [canCreateVehicle]);

const handleEditVehicle = useCallback((vehicle: Vehicle) => {
  setSidebarMode('edit');
  setEditingVehicle(vehicle);
  setIsSidebarOpen(true);
}, []);

const handleSidebarSubmit = useCallback(
  async (vehiclePayload: FormData, vehicleId?: string) => {
    try {
      const response =
        sidebarMode === 'edit' && vehicleId
          ? await updateVehicle(vehicleId, vehiclePayload)
          : await createVehicle(vehiclePayload);

      if (response?.success) {
        message.success(
          response?.message ||
            (sidebarMode === 'edit'
              ? 'Vehicle updated successfully'
              : 'Vehicle created successfully')
        );
        setIsSidebarOpen(false);
        setEditingVehicle(null);
        setSidebarMode('create');
        fetchVehicles();
      } else {
        message.error(response?.message || 'Failed to save vehicle');
      }
    } catch (error: any) {
      const rawMessage = error?.response?.data?.message || error?.message;
      if (rawMessage?.toLowerCase()?.includes('permission')) {
        message.error('You do not have permission to update this vehicle. Please contact an administrator.');
      } else {
        message.error(rawMessage || 'Failed to save vehicle');
      }
    }
  },
  [fetchVehicles, sidebarMode]
);

const openDeleteModal = useCallback((vehicle: Vehicle) => {
  setDeleteTarget(vehicle);
  setDeleteModalOpen(true);
}, []);

const closeDeleteModal = useCallback(() => {
  setDeleteModalOpen(false);
  setDeleteTarget(null);
  setDeleteLoading(false);
}, []);

const handleConfirmDelete = useCallback(async () => {
  if (!deleteTarget) return;
  setDeleteLoading(true);
  try {
    const res = await deleteVehicle(deleteTarget._id);
    if (res?.success) {
      message.success(res?.message || 'Vehicle deleted successfully');
      setVehicles(prev => prev.filter(vehicle => vehicle._id !== deleteTarget._id));
      closeDeleteModal();
    } else {
      message.error(res?.message || 'Failed to delete vehicle');
    }
  } catch (error: any) {
    message.error(error?.message || 'Failed to delete vehicle');
  } finally {
    setDeleteLoading(false);
  }
}, [deleteTarget, closeDeleteModal]);

const handleSidebarClose = useCallback(() => {
  setIsSidebarOpen(false);
  setEditingVehicle(null);
  setSidebarMode('create');
}, []);

const sidebarInitialData = useMemo(() => {
  if (!editingVehicle) return undefined;
  return {
    _id: editingVehicle._id,
    internalId: editingVehicle.internalId || '',
    plateNumber: editingVehicle.plateNumber || '',
    vinNumber: editingVehicle.vinNumber || '',
    make: editingVehicle.make || '',
    model: editingVehicle.model || '',
    year: editingVehicle.year || '',
    status: editingVehicle.status || 'stopped',
    address: (editingVehicle as any)?.address || editingVehicle.currentLocation?.address || '',
  };
}, [editingVehicle]);

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
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
          onClick={handleOpenCreateSidebar}
          className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
            canCreateVehicle ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create Vehicle</span>
        </button>
      </div>
    </div>

    {emptyStateMessage && filteredVehicles.length === 0 && (
      <div className="mx-6 mt-4 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3">
        🚚
        <span className="text-sm">{emptyStateMessage}</span>
      </div>
    )}

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-5xl text-gray-300">🚚</div>
                      <p>No vehicles found.</p>
                      {emptyStateMessage && (
                        <p className="text-xs text-gray-400">{emptyStateMessage}</p>
                      )}
                    </div>
                  </td>
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
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status || '')}`}>
                        {vehicle.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{vehicle.currentLocation?.address || '-'}</td>
                    <td className="px-6 py-4">
                      {vehicle.vehicleImage && vehicle.vehicleImage.length > 0 ? (
                        <div className="flex space-x-2">
                          {vehicle.vehicleImage.map((img: any, idx: number) => (
                            <img
                              key={idx}
                              src={(img.imageUrl || '').replace(/\\/g, '/')}
                              alt="Vehicle"
                              className="h-20 w-20 object-cover rounded border"
                            />
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditVehicle(vehicle)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" /> Update
                        </button>
                        <button
                          onClick={() => openDeleteModal(vehicle)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
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
        mode={sidebarMode}
        initialData={sidebarInitialData}
        onClose={handleSidebarClose}
        onSubmit={handleSidebarSubmit}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border-b border-red-100">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Delete Vehicle</h3>
                <p className="text-sm text-red-600">
                  This action cannot be undone. Please confirm to delete this vehicle.
                </p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-gray-700">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900">{deleteTarget?.internalId || deleteTarget?.plateNumber || 'this vehicle'}</span>
                ?
              </p>
              <p className="text-sm text-gray-500">
                The vehicle record will be permanently removed and cannot be recovered.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesTable;

