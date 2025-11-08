import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Building2,
  Filter,
  Edit,
  Trash2,
} from "lucide-react";
import { message } from "antd";
import NewVendorSidebar from "./NewVendorSidebar";
import {
  listVendor,
  updateVendor,
  updateStatusVendor,
  deleteVendor,
} from "../../../../../axios/api/distapcher";

interface Vendor {
  _id: string;
  internalId: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  type: string;
  status: string;
  address: string;
  country: string;
  createdAt: string;
}

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Edit modal state
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Vendor>>({});
  const [editLoading, setEditLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listVendor();
      if (res?.success) {
        setVendors(Array.isArray(res.data) ? res.data : []);
      } else {
        message.error(res?.message || "Failed to fetch vendors");
      }
    } catch (error: any) {
      console.error("Error fetching vendors:", error);
      message.error(error?.message || "Error fetching vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

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

  // Delete
  const openDeleteModal = useCallback((vendor: Vendor) => {
    setDeleteTarget(vendor);
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
      const res = await deleteVendor(deleteTarget._id);
      if (res?.success) {
        message.success(res.message || "Vendor deleted successfully");
        closeDeleteModal();
        fetchVendors();
      } else {
        message.error(res?.message || "Failed to delete vendor");
      }
    } catch (error: any) {
      console.error("Error deleting vendor:", error);
      message.error(error?.message || "Failed to delete vendor");
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, closeDeleteModal, fetchVendors]);

  // Status Toggle
  const handleStatusToggle = useCallback(
    async (vendor: Vendor) => {
      const newStatus =
        vendor.status.toLowerCase() === "active" ? "inactive" : "active";
      try {
        const res = await updateStatusVendor(vendor._id, { status: newStatus });
        if (res?.success) {
          message.success(res.message || "Status updated");
          fetchVendors();
        } else {
          message.error(res?.message || "Failed to update status");
        }
      } catch (error: any) {
        console.error("Error updating status:", error);
        message.error(error?.message || "Failed to update status");
      }
    },
    [fetchVendors]
  );

  // Open Edit Modal
  const handleEdit = useCallback((vendor: Vendor) => {
    setEditVendor(vendor);
    setEditForm(vendor); // pre-fill
    setIsEditModalOpen(true);
  }, []);

  // Save Edit
  const handleUpdateVendor = useCallback(async () => {
    if (!editVendor) return;
    setEditLoading(true);
    try {
      const res = await updateVendor(editVendor._id, editForm);
      if (res?.success) {
        message.success(res.message || "Vendor updated successfully");
        setIsEditModalOpen(false);
        setEditVendor(null);
        fetchVendors();
      } else {
        message.error(res?.message || "Failed to update vendor");
      }
    } catch (error: any) {
      console.error("Error updating vendor:", error);
      message.error(error?.message || "Failed to update vendor");
    } finally {
      setEditLoading(false);
    }
  }, [editVendor, editForm, fetchVendors]);

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vendors;
    return vendors.filter((vendor) => {
      const nameMatch = vendor.name?.toLowerCase().includes(query);
      const emailMatch = vendor.email?.toLowerCase().includes(query);
      const typeMatch = vendor.type?.toLowerCase().includes(query);
      return nameMatch || emailMatch || typeMatch;
    });
  }, [vendors, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">Vendors</h1>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Vendors"
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
                onClick={() => {
                  setIsSidebarOpen(true);
                }}
                className="bg-blue-600 !text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Vendor</span>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Internal ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredVendors.length > 0 ? (
                      filteredVendors.map((vendor) => (
                        <tr key={vendor._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {vendor.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {vendor.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-500">
                            {vendor.internalId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                            {vendor.type}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleStatusToggle(vendor)}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                vendor.status
                              )}`}
                            >
                              {vendor.status}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(vendor.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                              <button
                                onClick={() => handleEdit(vendor)}
                                className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => openDeleteModal(vendor)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No vendors found.
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

      {/* Sidebar for Create */}
      <NewVendorSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          fetchVendors();
        }}
      />

      {/* Edit Modal */}
      {isEditModalOpen && editVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold text-gray-900">Edit Vendor</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 transition-colors hover:text-gray-600"
                disabled={editLoading}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={editForm.email || ""}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Phone"
                value={editForm.phone || ""}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Website"
                value={editForm.website || ""}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Type"
                value={editForm.type || ""}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Address"
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={editLoading}
                className="rounded-md border border-gray-200 px-5 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateVendor}
                disabled={editLoading}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold text-red-600">Delete Vendor</h2>
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
