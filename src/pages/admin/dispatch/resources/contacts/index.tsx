import React, { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Building2, Filter } from "lucide-react";
import NewContactSidebar from "./NewContactSidebar";
import NewCustomerSidebar from "./NewCustomerSidebar";
import { listContact, deleteContact, searchContact } from '../../../../../axios/adminApi'
import { createCustomer, updateCustomer, deleteCustomer, searchCustomer, listCustomer } from '../../../../../axios/adminApi'

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");
  const [contacts, setContacts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch contacts and customers on mount
  useEffect(() => {
    fetchContacts();
    fetchCustomers();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await listContact();
      if (res?.success) {
        setContacts(res.data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await listCustomer();
      if (res?.success) {
        setCustomers(res.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (activeTab === "contacts") {
        await deleteContact(id);
        fetchContacts();
      } else {
        await deleteCustomer(id);
        fetchCustomers();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleSearch = async (e) => {
    setSearchQuery(e.target.value);
    try {
      if (e.target.value.trim() !== "") {
        if (activeTab === "contacts") {
          const res = await searchContact(e.target.value);
          setContacts(res.data);
        } else {
          const res = await searchCustomer(e.target.value);
          setCustomers(res.data);
        }
      } else {
        if (activeTab === "contacts") {
          fetchContacts();
        } else {
          fetchCustomers();
        }
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
    if (activeTab === "contacts") {
      fetchContacts();
    } else {
      fetchCustomers();
    }
  };

  const tableData = activeTab === "contacts" ? contacts : customers;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
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
                placeholder={`Search ${activeTab === "contacts" ? "Contacts" : "Customers"}`}
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
              className="bg-blue-600 !text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === "contacts" ? "Create Contact" : "Create Customer"}</span>
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === "contacts" ? "Address" : "Title"}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableData.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{row.name}</td>
                    <td className="px-6 py-4">{row.email}</td>
                    <td className="px-6 py-4">{row.phone}</td>
                    <td className="px-6 py-4">
                      {activeTab === "contacts" 
                        ? row.address 
                        : row.title || (row.placeDetails?.name && `${row.placeDetails.name}, ${row.placeDetails.city || ''}`)
                      }
                    </td>
                    <td className="px-6 py-4">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(row._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tableData.length === 0 && (
              <p className="text-center py-6 text-gray-500">No records found</p>
            )}
          </div>
        </div>
      </div>

      {/* Conditional Sidebar */}
      {activeTab === "contacts" ? (
        <NewContactSidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      ) : (
        <NewCustomerSidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      )}
    </div>
  );
};

export default Index;