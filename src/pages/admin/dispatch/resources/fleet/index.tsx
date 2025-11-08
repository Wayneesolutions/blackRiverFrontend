import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Truck,
  Filter,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { message } from "antd";
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
  const fetchFleets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listFleet();
      if (res.success) {
        setFleets(Array.isArray(res.data) ? res.data : []);
      } else {
        message.error(res.message || "Failed to fetch fleets");
      }
    } catch (error: any) {
      console.error("Error fetching fleets:", error);
      message.error(error?.message || "Error fetching fleets");
    } finally {
      setLoading(false);
    }
  }, []);

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
        message.success(res.message || "Fleet deleted successfully");
        closeDeleteModal();
        fetchFleets();
      } else {
        message.error(res.message || "Failed to delete fleet");
      }
    } catch (error: any) {
      console.error("Error deleting fleet:", error);
      message.error(error?.message || "Error deleting fleet");
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, closeDeleteModal, fetchFleets]);

  const handleStatusUpdate = useCallback(
    async (id: string) => {
      try {
        const res = await updateStatusFleet(id);
        if (res.success) {
          message.success(res.message || "Status updated");
          fetchFleets();
        } else {
          message.error(res.message || "Failed to update status");
        }
      } catch (error: any) {
        console.error("Error updating status:", error);
        message.error(error?.message || "Failed to update status");
      }
    },
    [fetchFleets]
  );

  const handleUpdate = useCallback(async () => {
    if (!editFleet) return;
    setEditLoading(true);
    try {
      const res = await updateFleet(editFleet._id, editFleet);
      if (res.success) {
        message.success(res.message || "Fleet updated successfully");
        setEditModalOpen(false);
        setEditFleet(null);
        fetchFleets();
      } else {
        message.error(res.message || "Failed to update fleet");
      }
    } catch (error: any) {
      console.error("Error updating fleet:", error);
      message.error(error?.message || "Failed to update fleet");
    } finally {
      setEditLoading(false);
    }
  }, [editFleet, fetchFleets]);

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
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-blue-600 !text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Fleets</span>
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
                        Loading...
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
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                            <button
                              onClick={() => {
                                setEditFleet({ ...fleet });
                                setEditModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(fleet)}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(fleet._id)}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-100 transition-colors"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Update Status
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="px-6 py-4 text-center">
                        No fleets found
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
        onClose={() => {
          setIsSidebarOpen(false);
          fetchFleets();
        }}
      />

      {/* Edit Fleet Modal */}
      {editModalOpen && editFleet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-semibold">Edit Fleet</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {[
                "name",
                "serviceArea",
                "parentFleet",
                "vendor",
                "zone",
                "manPower",
                "activeManPower",
                "task",
                "status",
              ].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                    {field}
                  </label>
                  {field === "status" ? (
                    <select
                      value={editFleet[field]}
                      onChange={(e) =>
                        setEditFleet({ ...editFleet, [field]: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editFleet[field]}
                      onChange={(e) =>
                        setEditFleet({ ...editFleet, [field]: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={editLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {editLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-semibold text-red-600">Delete Fleet</h2>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={deleteLoading}
              >
                ✕
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
                className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
