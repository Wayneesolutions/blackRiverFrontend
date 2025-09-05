import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import type { FC, ChangeEvent } from "react";
import { createContact } from "../../../../../axios/adminApi"; // ✅ import your API
import NewPlacesSidebar from "../places/NewPlacesSidebar";

interface NewContactSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewContactSidebar: FC<NewContactSidebarProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    address: "",
    internalId: "",
  });

  const [openDetails, setOpenDetails] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        console.log("✅ Contact created:", res.data);
        onClose(); // close sidebar after success
      } else {
        console.error("❌ Failed to create contact:", res?.message);
        alert(res?.message || "Failed to create contact");
      }
    } catch (error) {
      console.error("❌ API error:", error);
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
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[32rem] bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              New Contact
            </h2>
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
          {/* Details Panel */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div
              className="flex items-center justify-between cursor-pointer mb-4"
              onClick={() => setOpenDetails(!openDetails)}
            >
              <h3 className="text-lg font-medium text-gray-900">
                Contact Details
              </h3>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform ${
                  openDetails ? "rotate-180" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 
                  1.414l-4 4a1 1 0 01-1.414 
                  0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {openDetails && (
              <div className="space-y-4">
                {/* Name & Email */}
                <div className="grid grid-cols-2 gap-4">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Phone & Title */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+65 8123 4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Internal ID */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Address with New Address Button */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Select Address"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsSidebarOpen(true)}
                      className="bg-gray-100 px-3 py-2 rounded-md border border-gray-300 
                      text-gray-700 hover:bg-gray-200 flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New</span>
                    </button>
                  </div>
                </div>

                {/* Address Sidebar */}
                <NewPlacesSidebar
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white sticky bottom-0 z-[102] shadow-lg">
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 
              hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
              transition-colors disabled:opacity-50"
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
