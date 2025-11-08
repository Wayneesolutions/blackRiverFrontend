import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { message } from "antd";
import NewPlacesSidebar from "./NewPlacesSidebar";
import {
  listPlace,
  deletePlace,
  updateStatusPlace,
  updatePlace,
} from "../../../../../axios/api/dispatcher.places";

interface Place {
  _id: string;
  name: string;
  street1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  status?: string;
  createdAt: string;
  [key: string]: any;
}

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<Place | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Place | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPlace();
      if (res?.success) {
        setPlaces(Array.isArray(res.data) ? res.data : []);
      } else {
        message.error(res?.message || "Failed to fetch places");
      }
    } catch (error: any) {
      console.error("Error fetching places:", error);
      message.error(error?.message || "Failed to fetch places");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const openEditModal = useCallback((place: Place) => {
    setEditData({ ...place });
    setEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditData(null);
    setEditLoading(false);
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!editData) return;
    setEditLoading(true);
    try {
      const res = await updatePlace(editData._id, editData);
      if (res?.success) {
        message.success(res.message || "Place updated successfully");
        closeEditModal();
        fetchPlaces();
      } else {
        message.error(res?.message || "Update failed");
      }
    } catch (error: any) {
      console.error("Error updating place:", error);
      message.error(error?.message || "Update failed");
    } finally {
      setEditLoading(false);
    }
  }, [editData, closeEditModal, fetchPlaces]);

  const openDeleteModal = useCallback((place: Place) => {
    setDeleteTarget(place);
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
      const res = await deletePlace(deleteTarget._id);
      if (res?.success) {
        message.success(res.message || "Place deleted successfully");
        closeDeleteModal();
        fetchPlaces();
      } else {
        message.error(res?.message || "Delete failed");
      }
    } catch (error: any) {
      console.error("Error deleting place:", error);
      message.error(error?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, closeDeleteModal, fetchPlaces]);

  const handleStatusUpdate = useCallback(
    async (id: string) => {
      try {
        const res = await updateStatusPlace(id);
        if (res?.success) {
          message.success(res.message || "Status updated");
          fetchPlaces();
        } else {
          message.error(res?.message || "Status update failed");
        }
      } catch (error: any) {
        console.error("Error updating status:", error);
        message.error(error?.message || "Status update failed");
      }
    },
    [fetchPlaces]
  );

  const filteredPlaces = useMemo(
    () =>
      places.filter((place) =>
        place?.name?.toLowerCase().includes(search.toLowerCase())
      ),
    [places, search]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">Places</h1>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Places"
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
                <span>Create Place</span>
              </button>
            </div>
          </div>
        </div>

       

        {/* Table */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Name</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Address</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Postal Code</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Country</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Status</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Created At</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPlaces.length > 0 ? (
                      filteredPlaces.map((place) => (
                        <tr key={place._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{place.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {`${place.street1 || ""}, ${place.city || ""}, ${place.state || ""}`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{place.postalCode}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{place.country}</td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              onClick={() => handleStatusUpdate(place._id)}
                              className={`cursor-pointer px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                place.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {place.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(place.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                              <button
                                className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                                onClick={() => openEditModal(place)}
                              >
                                Edit
                              </button>
                              <button
                                className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                                onClick={() => openDeleteModal(place)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          No places found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Component */}
      <NewPlacesSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        refreshPlaces={fetchPlaces}
      />

      {editModalOpen && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold text-gray-900">Edit Place</h2>
              <button
                onClick={closeEditModal}
                disabled={editLoading}
                className="text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editData.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Street</label>
                <input
                  type="text"
                  value={editData.street1 || ""}
                  onChange={(e) => setEditData({ ...editData, street1: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={editData.city || ""}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    value={editData.state || ""}
                    onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    value={editData.postalCode || ""}
                    onChange={(e) => setEditData({ ...editData, postalCode: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    value={editData.country || ""}
                    onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                disabled={editLoading}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold text-red-600">Delete Place</h2>
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
