import React, { useState, useEffect } from "react";
import NewService from "./NewService";
import {
  listServiceRate,
  deleteServiceRate,
  updateServiceRate,
} from "../../../../../axios/api/distapcher";
import { message } from "antd";

const ServicePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateData, setUpdateData] = useState({});

  // Fetch services from API
  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await listServiceRate();
      if (res.success) {
        setServices(res.data);
      } else {
        alert(res.message || "Failed to fetch services");
      }
    } catch (err) {
      alert(err.message || "Something went wrong");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    
      const res = await deleteServiceRate(id);
      if (res.success) {
        message.success(res.message || "Deleted successfully");
        fetchServices();
      } else {
        message.error(res.message || "Delete failed");
      }
    
  };

  // Handle update
  const handleUpdate = async () => {
    
      const res = await updateServiceRate(selectedService._id, updateData);
      if (res.success) {
        message.success(res.message || "Updated successfully");
        setUpdateModalOpen(false);
        setSelectedService(null);
        fetchServices();
      } else {
        message.error(res.message || "Update failed");
      }
    
  };

  const openUpdateModal = (service) => {
    setSelectedService(service);
    setUpdateData({
      serviceName: service.serviceName,
      price: service.price,
      duration: service.duration,
      tags: service.tags?.join(", "),
      orderType: service.orderType,
      rateCalculationMethod: service.rateCalculationMethod,
      cashOnDeliver: service.cashOnDeliver,
      cashOnDeliverMethod: service.cashOnDeliverMethod,
      peekHoursStart: service.peekHoursPricing?.peakHoursStart,
      peekHoursEnd: service.peekHoursPricing?.peakHoursEnd,
      peekHoursMethod: service.peekHoursPricing?.peakHoursMethod,
      serviceRestriction: service.serviceRestriction,
    });
    setUpdateModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background */}
      <div className="absolute inset-0 bg-opacity-40 backdrop-blur-sm pointer-events-none"></div>
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex-1 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 bg-white bg-opacity-70 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
            Service Rate
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(true)}
              className="bg-white hover:bg-gray-100 text-gray-700 font-medium px-5 py-2 rounded-lg shadow border border-gray-300 transition-all duration-200 backdrop-blur-sm"
            >
              Filters
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 !text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm border border-blue-400"
            >
              + New Service
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-xl border border-white border-opacity-50 shadow-xl overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 bg-opacity-80 backdrop-blur-sm text-left font-semibold text-gray-700">
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Service Name</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Price</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Duration</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Order Type</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Rate Method</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">COD</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Peak Hours</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Restriction</th>
                <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Tags</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-6">
                    No services found
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr
                    key={service._id}
                    className="hover:bg-blue-50 hover:bg-opacity-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 border-r border-gray-100">{service.serviceName}</td>
                    <td className="px-6 py-4 border-r border-gray-100 font-mono text-green-600 font-semibold">{service.price}</td>
                    <td className="px-6 py-4 border-r border-gray-100">{service.duration}</td>
                    <td className="px-6 py-4 border-r border-gray-100">{service.orderType}</td>
                    <td className="px-6 py-4 border-r border-gray-100">{service.rateCalculationMethod}</td>
                    <td className="px-6 py-4 border-r border-gray-100">{service.cashOnDeliver ? "Yes" : "No"}</td>
                    <td className="px-6 py-4 border-r border-gray-100">
                      {service.peekHoursPricing?.peakHoursStart} - {service.peekHoursPricing?.peakHoursEnd} ({service.peekHoursPricing?.peakHoursMethod})
                    </td>
                    <td className="px-6 py-4 border-r border-gray-100">{service.serviceRestriction}</td>
                    <td className="px-6 py-4 border-r border-gray-100 italic">{service.tags?.join(", ") || "No tags"}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        className=" text-white px-3 py-1 rounded bg-blue-500 hover:bg-blue-600"
                        onClick={() => openUpdateModal(service)}
                      >
                        Update
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        onClick={() => handleDelete(service._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Service Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full max-w-lg w-full sm:w-[42rem] bg-white bg-opacity-95 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 border-opacity-50 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <NewService onClose={() => setSidebarOpen(false)} />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-gray-900/50 backdrop-blur-sm transition-all duration-500"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Filters Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full max-w-md w-full bg-white bg-opacity-95 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 ${
          filtersOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Filters</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select className="w-full mt-1 border rounded-lg p-2">
              <option>All</option>
              <option>In Transit</option>
              <option>Delivered</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <input
              type="text"
              className="w-full mt-1 border rounded-lg p-2"
              placeholder="Enter customer"
            />
          </div>
          <button
            className=" text-white px-4 py-2 rounded-lg shadow bg-blue-500 hover:bg-blue-600"
            onClick={() => setFiltersOpen(false)}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Update Modal */}
      {updateModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-lg relative">
            <h2 className="text-xl font-bold mb-4">Update Service</h2>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Service Name"
                value={updateData.serviceName || ""}
                onChange={(e) => setUpdateData({ ...updateData, serviceName: e.target.value })}
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="Price"
                value={updateData.price || ""}
                onChange={(e) => setUpdateData({ ...updateData, price: e.target.value })}
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="Duration"
                value={updateData.duration || ""}
                onChange={(e) => setUpdateData({ ...updateData, duration: e.target.value })}
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={updateData.tags || ""}
                onChange={(e) => setUpdateData({ ...updateData, tags: e.target.value })}
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="Order Type"
                value={updateData.orderType || ""}
                onChange={(e) => setUpdateData({ ...updateData, orderType: e.target.value })}
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="Rate Method"
                value={updateData.rateCalculationMethod || ""}
                onChange={(e) =>
                  setUpdateData({ ...updateData, rateCalculationMethod: e.target.value })
                }
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="COD Method"
                value={updateData.cashOnDeliverMethod || ""}
                onChange={(e) =>
                  setUpdateData({ ...updateData, cashOnDeliverMethod: e.target.value })
                }
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="Peak Start"
                value={updateData.peekHoursStart || ""}
                onChange={(e) => setUpdateData({ ...updateData, peekHoursStart: e.target.value })}
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="Peak End"
                value={updateData.peekHoursEnd || ""}
                onChange={(e) => setUpdateData({ ...updateData, peekHoursEnd: e.target.value })}
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="Peak Method"
                value={updateData.peekHoursMethod || ""}
                onChange={(e) => setUpdateData({ ...updateData, peekHoursMethod: e.target.value })}
                className="border rounded p-2"
              />
              <input
                type="text"
                placeholder="Restriction"
                value={updateData.serviceRestriction || ""}
                onChange={(e) =>
                  setUpdateData({ ...updateData, serviceRestriction: e.target.value })
                }
                className="border rounded p-2"
              />
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setUpdateModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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

export default ServicePage;
