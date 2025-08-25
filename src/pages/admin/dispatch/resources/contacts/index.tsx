import React, { useState } from "react";
import { Plus, Search, MoreVertical, Building2, Filter } from "lucide-react";
import NewContactSidebar from "./NewContactSidebar";
import NewCustomerSidebar from "./NewCustomerSidebar";

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"contacts" | "customers">("contacts");

  // Dummy Contacts Data
  const contacts = [
    { id: "CNT-001", internalId: "INT-2001", name: "Alice Johnson", email: "alice.johnson@example.com", phone: "+1 555-1234", address: "45 Market St, San Francisco, CA", createdAt: "2024-02-05" },
    { id: "CNT-002", internalId: "INT-2002", name: "Bob Williams", email: "bob.williams@example.com", phone: "+44 7700 900123", address: "78 High St, London, UK", createdAt: "2024-02-08" },
    { id: "CNT-003", internalId: "INT-2003", name: "Clara Smith", email: "clara.smith@example.com", phone: "+65 8123 4567", address: "12 Orchard Rd, Singapore", createdAt: "2024-02-10" },
  ];

  // Dummy Customers Data
  const customers = [
    { id: "CUS-101", internalId: "INT-3001", name: "Acme Corp", email: "contact@acmecorp.com", phone: "+1 212-555-7890", address: "500 Madison Ave, New York, NY", createdAt: "2024-01-25" },
    { id: "CUS-102", internalId: "INT-3002", name: "Global Freight Ltd", email: "support@globalfreight.com", phone: "+49 30 123456", address: "Unter den Linden 1, Berlin, Germany", createdAt: "2024-02-02" },
    { id: "CUS-103", internalId: "INT-3003", name: "Oceanic Traders", email: "sales@oceanictraders.com", phone: "+91 98765 43210", address: "Marine Drive, Mumbai, India", createdAt: "2024-02-12" },
  ];

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
                className={`pb-2 px-2 text-sm font-medium ${activeTab === "contacts" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                Contacts
              </button>
              <button
                onClick={() => setActiveTab("customers")}
                className={`pb-2 px-2 text-sm font-medium ${activeTab === "customers" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Internal ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{row.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{row.id}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{row.internalId}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.address}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.createdAt}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Conditional Sidebar */}
      {activeTab === "contacts" ? (
        <NewContactSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      ) : (
        <NewCustomerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
};

export default Index;
