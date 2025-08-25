import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { FC } from "react";

interface NewFleetSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewFleetSidebar: FC<NewFleetSidebarProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        fleetName: '',
        parentFleet: '',
        vendor: '',
        assignToServiceArea: '',
        status: 'Active',
        taskMission: ''

    });

    const [openDetails, setOpenDetails] = useState(true);



    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };



    const handleSubmit = () => {
        console.log('Form submitted:', formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={onClose}></div>

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-126 bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">New Fleet</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                            <h3 className="text-lg font-medium text-gray-900">Fleet Details</h3>
                            <svg
                                className={`w-5 h-5 text-gray-500 transform transition-transform ${openDetails ? "rotate-180" : ""
                                    }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>

                        {openDetails && (
                            <div className="space-y-4">


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fleet Name
                                    </label>
                                    <input
                                        type="text"
                                        name="fleetName"
                                        value={formData.fleetName}
                                        onChange={handleInputChange}
                                        placeholder="Fleet Name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>



                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Parent Fleet
                                        </label>
                                        <input
                                            type="text"
                                            name="parentFleet"
                                            value={formData.parentFleet}
                                            onChange={handleInputChange}
                                            placeholder="Select parent fleet to assign"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vendor
                                        </label>
                                        <input
                                            type="text"
                                            name="vendor"
                                            value={formData.vendor}
                                            onChange={handleInputChange}
                                            placeholder="Select vendor to assign fleet"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Assign to Service Area
                                        </label>
                                        <input
                                            type="text"
                                            name="assignToServiceArea"
                                            value={formData.assignToServiceArea}
                                            onChange={handleInputChange}
                                            placeholder="Select service area to assign"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
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
                                            <option value="Active">Active</option>
                                            <option value="Disabled">Disabled</option>
                                            <option value="Decommissioned">Decommissioned</option>
                                        </select>
                                    </div>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Task/ Mission
                                    </label>
                                    <input
                                        type="text"
                                        name="taskMission"
                                        value={formData.taskMission}
                                        onChange={handleInputChange}
                                        placeholder="Task/ Mission"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                </div>

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
                            className="px-4 py-2 border border-gray-300 !mr-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-600 !text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Create Fleet
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NewFleetSidebar;