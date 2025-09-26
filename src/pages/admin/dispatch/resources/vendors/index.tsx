import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Building2,
  Filter,
  Edit,
  Trash2,
  X,
} from "lucide-react";
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

  // Edit modal state
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Vendor>>({});

  // Fetch vendors
  const fetchVendors = async () => {
    setLoading(true);
    const res = await listVendor();
    if (res?.success) {
      setVendors(res.data || []);
    } else {
      alert(res?.message || "Failed to fetch vendors");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;
    const res = await deleteVendor(id);
    if (res?.success) {
      alert(res.message);
      fetchVendors();
    } else {
      alert(res?.message || "Failed to delete vendor");
    }
  };

  // Status Toggle
  const handleStatusToggle = async (vendor: Vendor) => {
    const newStatus =
      vendor.status.toLowerCase() === "active" ? "inactive" : "active";
    const res = await updateStatusVendor(vendor._id, { status: newStatus });
    if (res?.success) {
      alert(res.message);
      fetchVendors();
    } else {
      alert(res?.message || "Failed to update status");
    }
  };

  // Open Edit Modal
  const handleEdit = (vendor: Vendor) => {
    setEditVendor(vendor);
    setEditForm(vendor); // pre-fill
    setIsEditModalOpen(true);
  };

  // Save Edit
  const handleUpdateVendor = async () => {
    if (!editVendor) return;
    const res = await updateVendor(editVendor._id, editForm);
    if (res?.success) {
      alert(res.message);
      setIsEditModalOpen(false);
      setEditVendor(null);
      fetchVendors();
    } else {
      alert(res?.message || "Failed to update vendor");
    }
  };

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
                    {vendors.length > 0 ? (
                      vendors.map((vendor) => (
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
                          <td className="px-6 py-4 text-sm text-gray-500">
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
                          <td className="px-6 py-4 text-sm flex space-x-2">
                            <button
                              onClick={() => handleEdit(vendor)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(vendor._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
  <div className="fixed inset-0 flex items-center justify-center z-50  bg-opacity-20">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative border border-gray-200">
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        onClick={() => setIsEditModalOpen(false)}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Modal Header */}
      <h2 className="text-xl font-semibold text-gray-900 mb-5">Edit Vendor</h2>

      {/* Form */}
      <div className="grid grid-cols-1 gap-4">
        <input
          type="text"
          placeholder="Name"
          value={editForm.name || ""}
          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          value={editForm.email || ""}
          onChange={(e) =>
            setEditForm({ ...editForm, email: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Phone"
          value={editForm.phone || ""}
          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Website"
          value={editForm.website || ""}
          onChange={(e) =>
            setEditForm({ ...editForm, website: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Type"
          value={editForm.type || ""}
          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Address"
          value={editForm.address || ""}
          onChange={(e) =>
            setEditForm({ ...editForm, address: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Modal Footer */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => setIsEditModalOpen(false)}
          className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateVendor}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
