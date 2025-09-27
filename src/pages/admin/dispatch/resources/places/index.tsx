import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Filter,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import NewPlacesSidebar from "./NewPlacesSidebar";
import {
  listPlace,
  deletePlace,
  updateStatusPlace,
  updatePlace,
} from "../../../../../axios/api/dispatcher.places";

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );

  // For update modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // Fetch places from API
  const fetchPlaces = async () => {
    setLoading(true);
    const res = await listPlace();
    if (res?.success) {
      setPlaces(res.data);
    } else {
      setMessage({ type: "error", text: res?.message || "Failed to fetch places" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this place?")) return;
    const res = await deletePlace(id);
    if (res?.success) {
      setMessage({ type: "success", text: res.message });
      fetchPlaces();
    } else {
      setMessage({ type: "error", text: res?.message || "Delete failed" });
    }
  };

  // Status update handler
  const handleStatusUpdate = async (id: string) => {
    const res = await updateStatusPlace(id);
    if (res?.success) {
      setMessage({ type: "success", text: res.message });
      fetchPlaces();
    } else {
      setMessage({ type: "error", text: res?.message || "Status update failed" });
    }
  };

  // Edit Modal Open
  const handleEdit = (place: any) => {
    setEditData({ ...place });
    setIsEditModalOpen(true);
  };

  // Edit Modal Save
  const handleEditSave = async () => {
    if (!editData) return;
    const res = await updatePlace(editData._id, editData);
    if (res?.success) {
      setMessage({ type: "success", text: res.message });
      setIsEditModalOpen(false);
      fetchPlaces();
    } else {
      setMessage({ type: "error", text: res?.message || "Update failed" });
    }
  };

  // Simple filtering
  const filteredPlaces = places.filter((place) =>
    place?.name?.toLowerCase().includes(search.toLowerCase())
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
              <button
                onClick={fetchPlaces}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
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
                          <td className="px-6 py-4 text-sm flex space-x-3">
                            <button
                              className="text-blue-500 hover:text-blue-700"
                              onClick={() => handleEdit(place)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(place._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-4 h-4" />
                            </button>
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

      {/* Edit Modal */}
     {isEditModalOpen && editData && (
  <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50 transition-opacity">
    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 animate-fadeIn">
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Edit Place</h2>
        <button
          onClick={() => setIsEditModalOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Modal Body */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={editData.name || ""}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Street</label>
          <input
            type="text"
            value={editData.street1 || ""}
            onChange={(e) => setEditData({ ...editData, street1: e.target.value })}
            className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              value={editData.city || ""}
              onChange={(e) => setEditData({ ...editData, city: e.target.value })}
              className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input
              type="text"
              value={editData.state || ""}
              onChange={(e) => setEditData({ ...editData, state: e.target.value })}
              className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Postal Code</label>
            <input
              type="text"
              value={editData.postalCode || ""}
              onChange={(e) =>
                setEditData({ ...editData, postalCode: e.target.value })
              }
              className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              value={editData.country || ""}
              onChange={(e) => setEditData({ ...editData, country: e.target.value })}
              className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => setIsEditModalOpen(false)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleEditSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Index;
