import { useState, useEffect, useCallback, useMemo, useRef, type ChangeEvent } from "react";
import { Plus, Search, Edit2, Trash2, X, UserPlus, Users } from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import NewContactSidebar from "./NewContactSidebar";
import NewCustomerSidebar from "./NewCustomerSidebar";
import {
  listContact,
  deleteContact,
  updateContact,
  listCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../../../../axios/api/distapcher";

interface Contact {
  _id: string;
  internalId: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  role: string;
  createdAt: string;
}

interface Customer {
  _id: string;
  internalId: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  role: string;
  createdAt: string;
}

interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'warning';
  message: string;
}

const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    warning: <FaExclamationCircle className="text-yellow-500" size={24} />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
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
  const [activeTab, setActiveTab] = useState("contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('userInfo');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
      return null;
    }
  });

  // Edit modal state
  const [editItem, setEditItem] = useState<Contact | Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    internalId: "",
    name: "",
    email: "",
    phone: "",
    country: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ item: Contact | Customer; type: "contact" | "customer" } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const notificationIdRef = useRef(0);

  // Handle different userInfo structures (userData.company or direct company)
  const userRole = userInfo?.role || userInfo?.userData?.role;
  const userCompany = userInfo?.company || userInfo?.userData?.company;
  const canCreate = userRole === 'superadmin' || Boolean(userCompany);

  const showToast = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    const id = notificationIdRef.current++;
    setNotifications((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const normalizeEmptyMessage = useCallback((message?: string | null) => {
    if (!message) return null;
    return message.toLowerCase().includes('no company assigned') ? null : message;
  }, []);

  const updateEmptyState = useCallback((message?: string, hasData?: boolean) => {
    const sanitized = normalizeEmptyMessage(message);
    if (sanitized && !hasData) {
      setEmptyStateMessage(sanitized);
    } else if (hasData) {
      setEmptyStateMessage(null);
    } else if (!sanitized) {
      setEmptyStateMessage(null);
    }
  }, [normalizeEmptyMessage]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await listContact();
      if (res?.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setContacts(data);
        updateEmptyState(res?.message, data.length > 0 || customers.length > 0);
      } else if (res?.message) {
        setContacts([]);
        updateEmptyState(res.message, customers.length > 0);
        showToast('warning', res.message);
      } else {
        setContacts([]);
      }
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
      updateEmptyState(error?.message, customers.length > 0);
      showToast('error', error?.message || "Failed to fetch contacts");
    }
  }, [customers.length, updateEmptyState, showToast]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await listCustomer();
      if (res?.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setCustomers(data);
        updateEmptyState(res?.message, data.length > 0 || contacts.length > 0);
      } else if (res?.message) {
        setCustomers([]);
        updateEmptyState(res.message, contacts.length > 0);
        showToast('warning', res.message);
      } else {
        setCustomers([]);
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
      updateEmptyState(error?.message, contacts.length > 0);
      showToast('error', error?.message || "Failed to fetch customers");
    }
  }, [contacts.length, updateEmptyState, showToast]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);

    if (!userInfo) {
      setContacts([]);
      setCustomers([]);
      setEmptyStateMessage(null);
      setLoading(false);
      return;
    }

    // Handle different userInfo structures (userData.company or direct company)
    const userRole = userInfo?.role || userInfo?.userData?.role;
    const userCompany = userInfo?.company || userInfo?.userData?.company;
    const isSuperadmin = userRole === 'superadmin';
    const isDispatcher = userRole === 'dispatcher';
    const hasCompany = Boolean(userCompany);

    // Allow dispatchers to call API even if company is not visible in localStorage
    // The backend will handle company filtering based on the authenticated user
    if (!isSuperadmin && !isDispatcher && !hasCompany) {
      setContacts([]);
      setCustomers([]);
      setEmptyStateMessage('No company assigned. Please complete company settings to view contacts.');
      setLoading(false);
      return;
    }

    await Promise.all([fetchContacts(), fetchCustomers()]);
    setLoading(false);
  }, [userInfo, fetchContacts, fetchCustomers]);

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
    fetchAllData();
  }, [fetchAllData]);

  // Delete item
  const openDeleteModal = useCallback((item: Contact | Customer, type: "contact" | "customer") => {
    setDeleteTarget({ item, type });
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
      const res =
        deleteTarget.type === "contact"
          ? await deleteContact(deleteTarget.item._id)
          : await deleteCustomer(deleteTarget.item._id);
      if (res?.success) {
        showToast('success', res.message || `${deleteTarget.type === "contact" ? "Contact" : "Customer"} deleted successfully`);
        deleteTarget.type === "contact" ? fetchContacts() : fetchCustomers();
        closeDeleteModal();
      } else {
        showToast('error', res?.message || "Delete failed");
      }
    } catch (error: any) {
      console.error("Error deleting item:", error);
      showToast('error', error?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, fetchContacts, fetchCustomers, closeDeleteModal, showToast]);

  // Open edit modal
  const handleEdit = useCallback((item: Contact | Customer) => {
    setEditItem(item);
    setEditForm({
      internalId: item.internalId,
      name: item.name,
      email: item.email,
      phone: item.phone,
      country: item.country,
    });
    setIsEditModalOpen(true);
  }, []);

  // Input change in edit modal
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Update item
  const handleUpdate = useCallback(async () => {
    if (!editItem) return;
    const type = activeTab === "contacts" ? "contact" : "customer";
    setEditLoading(true);
    try {
      const res =
        type === "contact"
          ? await updateContact(editItem._id, editForm)
          : await updateCustomer(editItem._id, editForm);

      if (res?.success) {
        showToast('success', res.message || `${type === "contact" ? "Contact" : "Customer"} updated successfully`);
        type === "contact" ? fetchContacts() : fetchCustomers();
        setIsEditModalOpen(false);
        setEditItem(null);
      } else {
        showToast('error', res?.message || "Update failed");
      }
    } catch (error: any) {
      console.error("Error updating item:", error);
      showToast('error', error?.message || "Update failed");
    } finally {
      setEditLoading(false);
    }
  }, [activeTab, editItem, editForm, fetchContacts, fetchCustomers, showToast]);

  // Search
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredContacts = useMemo(
    () =>
      contacts.filter((c) => {
        const term = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.internalId.toLowerCase().includes(term)
        );
      }),
    [contacts, searchQuery]
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) => {
        const term = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.internalId.toLowerCase().includes(term)
        );
      }),
    [customers, searchQuery]
  );

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
    fetchAllData();
  };

  const tableData =
    activeTab === "contacts" ? filteredContacts : filteredCustomers;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDF8FF]">
      <div className="fixed top-4 right-4 z-[10000] space-y-2">
        {notifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>

      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("contacts")}
              className={`pb-2 px-2 text-sm font-medium flex items-center gap-2 ${activeTab === "contacts"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Users className="w-4 h-4" />
              Contacts
            </button>
            <button
              onClick={() => setActiveTab("customers")}
              className={`pb-2 px-2 text-sm font-medium flex items-center gap-2 ${activeTab === "customers"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Users className="w-4 h-4" />
              Customers
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}`}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {canCreate && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
              }}
              className="!text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity flex items-center space-x-2 text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              <span>{activeTab === "contacts" ? "Create Contact" : "Create Customer"}</span>
            </button>
          )}
        </div>
      </div>

      {emptyStateMessage && tableData.length === 0 && (
        <div className="mx-6 mt-4 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <Users className="w-5 h-5" />
          <span>{emptyStateMessage}</span>
        </div>
      )}

      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Internal ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
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
                {tableData.length > 0 ? (
                  tableData.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{item.internalId}</td>
                      <td className="px-6 py-4 text-sm">{item.name}</td>
                      <td className="px-6 py-4 text-sm">{item.email}</td>
                      <td className="px-6 py-4 text-sm">{item.phone}</td>
                      <td className="px-6 py-4 text-sm">{item.country}</td>
                      <td className="px-6 py-4 text-sm">{item.role}</td>
                      <td className="px-6 py-4 text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            style={{
                              background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                            }}
                            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium !text-white hover:opacity-90 transition-opacity"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              openDeleteModal(item, activeTab === "contacts" ? "contact" : "customer")
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="w-12 h-12 text-gray-300" />
                        <p className="text-sm">No {activeTab} found.</p>
                        {emptyStateMessage && (
                          <p className="text-xs text-gray-400">{emptyStateMessage}</p>
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

      {/* Sidebars */}
      {activeTab === "contacts" ? (
        <NewContactSidebar isOpen={isSidebarOpen && canCreate} onClose={handleSidebarClose} />
      ) : (
        <NewCustomerSidebar isOpen={isSidebarOpen && canCreate} onClose={handleSidebarClose} />
      )}

      {isEditModalOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-fadeIn">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setIsEditModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Edit {activeTab === "contacts" ? "Contact" : "Customer"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 text-sm mb-1">Internal ID</label>
                <input
                  type="text"
                  name="internalId"
                  value={editForm.internalId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={editForm.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 !mr-3 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                onClick={() => setIsEditModalOpen(false)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                style={{
                  background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                }}
                className="px-4 py-2 !text-white rounded-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                onClick={handleUpdate}
                disabled={editLoading}
              >
                {editLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold text-red-600">
                Delete {deleteTarget.type === "contact" ? "Contact" : "Customer"}
              </h2>
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">{deleteTarget.item.name}</span>? This action cannot be undone.
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
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium !text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
