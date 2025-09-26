import React, { useState, useEffect, ChangeEvent } from "react";
import { Plus, Search, X, Filter } from "lucide-react";
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

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fetch contacts
  const fetchContacts = async () => {
    const res = await listContact();
    if (res?.success) setContacts(res.data || []);
  };

  // Fetch customers
  const fetchCustomers = async () => {
    const res = await listCustomer();
    if (res?.success) setCustomers(res.data || []);
  };

  useEffect(() => {
    fetchContacts();
    fetchCustomers();
  }, []);

  // Delete item
  const handleDelete = async (id: string, type: "contact" | "customer") => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    const res =
      type === "contact" ? await deleteContact(id) : await deleteCustomer(id);
    if (res?.success) {
      type === "contact" ? fetchContacts() : fetchCustomers();
    } else {
      alert(res?.message || "Delete failed");
    }
  };

  // Open edit modal
  const handleEdit = (item: Contact | Customer) => {
    setEditItem(item);
    setEditForm({
      internalId: item.internalId,
      name: item.name,
      email: item.email,
      phone: item.phone,
      country: item.country,
    });
    setIsEditModalOpen(true);
  };

  // Input change in edit modal
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Update item
  const handleUpdate = async () => {
    if (!editItem) return;
    const type = activeTab === "contacts" ? "contact" : "customer";
    const res =
      type === "contact"
        ? await updateContact(editItem._id, editForm)
        : await updateCustomer(editItem._id, editForm);

    if (res?.success) {
      type === "contact" ? fetchContacts() : fetchCustomers();
      setIsEditModalOpen(false);
    } else {
      alert(res?.message || "Update failed");
    }
  };

  // Search
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.internalId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.internalId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
    fetchContacts();
    fetchCustomers();
  };

  const tableData =
    activeTab === "contacts" ? filteredContacts : filteredCustomers;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Tabs */}
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("contacts")}
              className={`pb-2 px-2 text-sm font-medium ${
                activeTab === "contacts"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Contacts
            </button>
            <button
              onClick={() => setActiveTab("customers")}
              className={`pb-2 px-2 text-sm font-medium ${
                activeTab === "customers"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Customers
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}`}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === "contacts" ? "Create Contact" : "Create Customer"}</span>
          </button>
        </div>
      </div>

      {/* Table */}
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
                      <td className="px-6 py-4">{item.internalId}</td>
                      <td className="px-6 py-4">{item.name}</td>
                      <td className="px-6 py-4">{item.email}</td>
                      <td className="px-6 py-4">{item.phone}</td>
                      <td className="px-6 py-4">{item.country}</td>
                      <td className="px-6 py-4">{item.role}</td>
                      <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 flex space-x-5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id, activeTab === "contacts" ? "contact" : "customer")}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No {activeTab} found.
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
        <NewContactSidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      ) : (
        <NewCustomerSidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-fadeIn">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setIsEditModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 text-sm mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={editForm.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                onClick={handleUpdate}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
