import React, { useState } from 'react';
import { X, MapPin, Truck } from 'lucide-react';
import type { FC } from "react";


interface NewVehicleSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}


const NewVehicleSidebar: FC<NewVehicleSidebarProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        internalId: '',
        plateNumber: '',
        vinNumber: '',
        make: '',
        model: '',
        year: '',
        driverAssigned: '',
        status: 'Active',
        latitude: '',
        longitude: '',
        avatar: ''
    });

    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [openAvatar, setOpenAvatar] = useState(true);
    const [openDetails, setOpenDetails] = useState(true);
    const vehicleAvatars = [
        { id: 'generic_male_driver', name: 'Generic Male Driver', selected: false },
        { id: '2_door_truck', name: '2 Door Truck', selected: true },
        { id: '3_door_hatchback', name: '3 Door Hatchback', selected: false },
        { id: '4_door_truck', name: '4 Door Truck', selected: false },
        { id: '5_door_hatchback', name: '5 Door Hatchback', selected: false }
    ];

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        // Handle form submission here
        console.log('Form submitted:', formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>

            {/* Sidebar */}
            <div className="absolute right-0 top-0 h-full w-126 bg-white shadow-xl overflow-y-auto">
                {/* Header */}
                <div className="border-b border-gray-200 flex-shrink-0 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">New Vehicle</h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>


                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Details Panel */}
                    <div className="bg-gray-50 p-4 rounded-md">
                        <div
                            className="flex items-center justify-between cursor-pointer mb-4"
                            onClick={() => setOpenDetails(!openDetails)}
                        >
                            <h3 className="text-lg font-medium text-gray-900">Details</h3>
                            <svg
                                className={`w-5 h-5 text-gray-500 transform transition-transform ${openDetails ? "rotate-180" : ""
                                    }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 
                10.586l3.293-3.293a1 1 0 111.414 
                1.414l-4 4a1 1 0 01-1.414 
                0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>

                        {openDetails && (
                            <div className="space-y-4">
                                {/* Fields */}
                                <div className="grid grid-cols-2 gap-4">
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Plate Number
                                        </label>
                                        <input
                                            type="text"
                                            name="plateNumber"
                                            value={formData.plateNumber}
                                            onChange={handleInputChange}
                                            placeholder="Plate Number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Add the rest of your input/select fields here (VIN, Make, Model, etc.) */}

                                <button
                                    type="button"
                                    className="mt-2 text-blue-600 text-sm hover:text-blue-700 flex items-center"
                                >
                                    <MapPin className="w-4 h-4 mr-1" />
                                    Select from map
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Avatar Panel */}
                    <div className="bg-gray-50 p-4 rounded-md">
                        <div
                            className="flex items-center justify-between cursor-pointer mb-4"
                            onClick={() => setOpenAvatar(!openAvatar)}
                        >
                            <h3 className="text-lg font-medium text-gray-900">Avatar</h3>
                            <svg
                                className={`w-5 h-5 text-gray-500 transform transition-transform ${openAvatar ? "rotate-180" : ""
                                    }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 
                10.586l3.293-3.293a1 1 0 111.414 
                1.414l-4 4a1 1 0 01-1.414 
                0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>

                        {openAvatar && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select map avatar <span className="text-gray-400 text-xs">ℹ</span>
                                    </label>
                                    <select
                                        value={selectedAvatar}
                                        onChange={(e) => setSelectedAvatar(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select avatar</option>
                                        {vehicleAvatars.map((avatar) => (
                                            <option key={avatar.id} value={avatar.id}>
                                                {avatar.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col space-y-2">
                                    {vehicleAvatars.map((avatar) => (
                                        <div
                                            key={avatar.id}
                                            className="flex items-center justify-between p-2 border rounded-md"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                    <Truck className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <span className="text-sm text-gray-700">{avatar.name}</span>
                                            </div>
                                            {avatar.selected && (
                                                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 p-4 bg-white rounded-md flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <Truck className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500">Vehicle Preview</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                  <div className="p-4  absolute border-t border-gray-200 flex-shrink-0 bg-white sticky !bottom-0 z-[102] shadow-lg">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 !mr-2 rounded-md text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 !text-white rounded-md hover:bg-blue-700"
                >
                    Create Vehicle
                </button>
            </div>
            </div>
            {/* Footer */}

          


        </div>
    );
};

export default NewVehicleSidebar;