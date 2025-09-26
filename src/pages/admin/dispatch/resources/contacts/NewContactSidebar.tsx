import React, { useState, ChangeEvent, FC } from "react";
import { X } from "lucide-react";
import { createContact } from "../../../../../axios/api/distapcher";

interface NewContactSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewContactSidebar: FC<NewContactSidebarProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    internalId: "",
    country: "",
    city: "",
    state: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await createContact(formData);

      if (res?.success) {
        alert(res.message || "Contact created successfully!");
        onClose();
      } else {
        alert(res?.message || "Failed to create contact");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while creating the contact");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[100]"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[28rem] bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New Contact</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal ID
              </label>
              <input
                type="text"
                name="internalId"
                value={formData.internalId}
                onChange={handleInputChange}
                placeholder="Internal ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Country"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="State"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white sticky bottom-0 z-[102] shadow-lg">
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Create Contact"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewContactSidebar;
