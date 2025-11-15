import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Truck,
  Filter,
  Edit,
  Trash2,
  RefreshCw,
  X,
} from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import NewFleetSidebar from "./NewFleetSidebar";
import {
  listFleet,
  deleteFleet,
  updateFleet,
  updateStatusFleet,
} from "../../../../../axios/api/distapcher";

interface Fleet {
  _id: string;
  name: string;
  serviceArea?: string;
  parentFleet?: string;
  vendor?: string;
  zone?: string;
  manPower?: number | string;
  activeManPower?: number | string;
  task?: string;
  status?: string;
  createdAt: string;
  [key: string]: any;
}

type NotificationType = 'success' | 'error';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
}

const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // For edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFleet, setEditFleet] = useState<Fleet | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Fleet | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch fleet list
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const fetchFleets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listFleet();
      if (res.success) {
        setFleets(Array.isArray(res.data) ? res.data : []);
      } else {
        addNotification('error', res.message || "Failed to fetch fleets");
      }
    } catch (error: any) {
      console.error("Error fetching fleets:", error);
      addNotification('error', error?.message || "Error fetching fleets");
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchFleets();
  }, [fetchFleets]);

  const openDeleteModal = useCallback((fleet: Fleet) => {
    setDeleteTarget(fleet);
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
      const res = await deleteFleet(deleteTarget._id);
      if (res.success) {
        addNotification('success', res.message || "Fleet deleted successfully");
        closeDeleteModal();
        fetchFleets();
      } else {
        addNotification('error', res.message || "Failed to delete fleet");
      }
    } catch (error: any) {
      console.error("Error deleting fleet:", error);
      addNotification('error', error?.message || "Error deleting fleet");
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, closeDeleteModal, fetchFleets, addNotification]);

  const handleStatusUpdate = useCallback(
    async (id: string) => {
      try {
        const res = await updateStatusFleet(id);
        if (res.success) {
          addNotification('success', res.message || "Status updated");
          fetchFleets();
        } else {
          addNotification('error', res.message || "Failed to update status");
        }
      } catch (error: any) {
        console.error("Error updating status:", error);
        addNotification('error', error?.message || "Failed to update status");
      }
    },
    [fetchFleets, addNotification]
  );

  const handleUpdate = useCallback(async () => {
    if (!editFleet) return;
    setEditLoading(true);
    try {
      const res = await updateFleet(editFleet._id, editFleet);
      if (res.success) {
        addNotification('success', res.message || "Fleet updated successfully");
        setEditModalOpen(false);
        setEditFleet(null);
        fetchFleets();
      } else {
        addNotification('error', res.message || "Failed to update fleet");
      }
    } catch (error: any) {
      console.error("Error updating fleet:", error);
      addNotification('error', error?.message || "Failed to update fleet");
    } finally {
      setEditLoading(false);
    }
  }, [editFleet, fetchFleets, addNotification]);

  const handleOpenCreateSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const handleCloseCreateSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    fetchFleets();
  }, [fetchFleets]);

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredFleets = useMemo(
    () =>
      fleets.filter((fleet) =>
        (fleet.name ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [fleets, search]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications Container - High z-index */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-3 max-w-md">
        {notifications.map(notification => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">Fleets</h1>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Fleets"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleOpenCreateSidebar}
                className="bg-blue-600 !text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Fleet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Area
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Fleet
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zone
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manpower
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Manpower
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-500">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredFleets.length > 0 ? (
                    filteredFleets.map((fleet) => (
                      <tr key={fleet._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Truck className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {fleet.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {fleet.serviceArea}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {fleet.parentFleet}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {fleet.vendor}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {fleet.zone}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {fleet.manPower}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {fleet.activeManPower}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {fleet.task}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              fleet.status
                            )}`}
                          >
                            {fleet.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(fleet.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
  <div className="inline-flex items-center gap-2">

    <button
      onClick={() => {
        setEditFleet({ ...fleet });
        setEditModalOpen(true);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 
                 px-3 py-1.5 text-xs font-medium text-blue-700 
                 hover:bg-blue-100 hover:border-blue-400 transition-all"
    >
      <Edit className="h-4 w-4" />
      Edit
    </button>

    <button
      onClick={() => openDeleteModal(fleet)}
      className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 
                 px-3 py-1.5 text-xs font-medium text-red-600 
                 hover:bg-red-100 hover:border-red-400 transition-all"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </button>

    <button
      onClick={() => handleStatusUpdate(fleet._id)}
      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50
                 px-3 py-1.5 text-xs font-medium text-emerald-700
                 hover:bg-emerald-100 hover:border-emerald-400 transition-all"
    >
      <RefreshCw className="h-4 w-4" />
      Update Status
    </button>

  </div>
</td>



                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Truck className="w-12 h-12 text-gray-300 mb-2" />
                          <p className="text-gray-500 font-medium">No fleets found</p>
                          {search && (
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar for Create Fleet */}
      <NewFleetSidebar
        isOpen={isSidebarOpen}
        mode="create"
        onClose={handleCloseCreateSidebar}
        onSuccess={fetchFleets}
      />

      {/* Edit Fleet Modal - Improved UI */}
      {editModalOpen && editFleet && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Edit Fleet</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Update fleet information</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditFleet(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-6">
                {/* Fleet Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fleet Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFleet.name || ""}
                    onChange={(e) => setEditFleet({ ...editFleet, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter fleet name"
                    required
                  />
                </div>

                {/* Service Area & Parent Fleet */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Service Area
                    </label>
                    <input
                      type="text"
                      value={editFleet.serviceArea || ""}
                      onChange={(e) => setEditFleet({ ...editFleet, serviceArea: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter service area"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Parent Fleet
                    </label>
                    <input
                      type="text"
                      value={editFleet.parentFleet || ""}
                      onChange={(e) => setEditFleet({ ...editFleet, parentFleet: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter parent fleet"
                    />
                  </div>
                </div>

                {/* Vendor & Zone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vendor (ObjectId)
                    </label>
                    <input
                      type="text"
                      value={editFleet.vendor || ""}
                      onChange={(e) => setEditFleet({ ...editFleet, vendor: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter vendor id"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Zone
                    </label>
                    <input
                      type="text"
                      value={editFleet.zone || ""}
                      onChange={(e) => setEditFleet({ ...editFleet, zone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter zone"
                    />
                  </div>
                </div>

                {/* Manpower & Active Manpower */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Man Power
                    </label>
                    <input
                      type="number"
                      value={editFleet.manPower || ""}
                      onChange={(e) => setEditFleet({ ...editFleet, manPower: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter manpower"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Active Man Power
                    </label>
                    <input
                      type="number"
                      value={editFleet.activeManPower || ""}
                      onChange={(e) => setEditFleet({ ...editFleet, activeManPower: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter active manpower"
                    />
                  </div>
                </div>

                {/* Task */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Task / Mission
                  </label>
                  <input
                    type="text"
                    value={editFleet.task || ""}
                    onChange={(e) => setEditFleet({ ...editFleet, task: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter task or mission"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editFleet.status || "active"}
                    onChange={(e) => setEditFleet({ ...editFleet, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0 bg-white shadow-lg">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditFleet(null);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={editLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editLoading ? "Updating..." : "Update Fleet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-semibold text-red-600">Delete Fleet</h2>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={deleteLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">{deleteTarget.name}</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-6 py-3 bg-red-600 !text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Index;
