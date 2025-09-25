import React, { useState } from "react";
import { X } from "lucide-react";
import type { FC } from "react";
import { createFleet } from "../../../../../axios/api/distapcher";

interface NewFleetSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewFleetSidebar: FC<NewFleetSidebarProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    serviceArea: "",
    parentFleet: "",
    vendor: "",
    zone: "",
    manPower: "",
    activeManPower: "",
    task: "",
    status: "active",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await createFleet(formData);
      console.log("Fleet created:", res);
      if (res?.success) {
        alert("Fleet created successfully!");
        onClose();
      } else {
        alert(res?.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error creating fleet:", error);
      alert("Error creating fleet");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-126 bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">New Fleet</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
          {/* Fleet Details Form */}
          <div className="space-y-4">
            {/* Fleet Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fleet Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter fleet name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Service Area & Parent Fleet */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Area
                </label>
                <input
                  type="text"
                  name="serviceArea"
                  value={formData.serviceArea}
                  onChange={handleInputChange}
                  placeholder="Enter service area"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Fleet
                </label>
                <input
                  type="text"
                  name="parentFleet"
                  value={formData.parentFleet}
                  onChange={handleInputChange}
                  placeholder="Enter parent fleet"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Vendor & Zone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor (ObjectId)
                </label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  placeholder="Enter vendor id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone
                </label>
                <input
                  type="text"
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  placeholder="Enter zone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Manpower & Active Manpower */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Man Power
                </label>
                <input
                  type="text"
                  name="manPower"
                  value={formData.manPower}
                  onChange={handleInputChange}
                  placeholder="Enter manpower"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Active Man Power
                </label>
                <input
                  type="text"
                  name="activeManPower"
                  value={formData.activeManPower}
                  onChange={handleInputChange}
                  placeholder="Enter active manpower"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Task */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task / Mission
              </label>
              <input
                type="text"
                name="task"
                value={formData.task}
                onChange={handleInputChange}
                placeholder="Enter task or mission"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white sticky bottom-0 z-[102] shadow-lg">
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {loading ? "Creating..." : "Create Fleet"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewFleetSidebar;
