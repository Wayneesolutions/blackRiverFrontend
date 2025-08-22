import React, { useState } from 'react';
import { X, MapPin, Truck, Image as ImageIcon, FileText } from 'lucide-react';
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
        avatar: '',
        vehicleImages: [] as File[],
        documentImages: [] as File[]
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files) {
            const fileArray = Array.from(files);
            setFormData(prev => ({
                ...prev,
                [name]: [...(prev[name as keyof typeof prev] as File[]), ...fileArray]
            }));
        }
    };

    const removeImage = (index: number, fieldName: 'vehicleImages' | 'documentImages') => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: prev[fieldName].filter((_, i) => i !== index)
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
                        <h2 className="text-lg font-semibold text-gray-900">New Vehicle</h2>
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
                            <h3 className="text-lg font-medium text-gray-900">Details</h3>
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
                                {/* Basic Fields */}
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* VIN and Make */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            VIN Number
                                        </label>
                                        <input
                                            type="text"
                                            name="vinNumber"
                                            value={formData.vinNumber}
                                            onChange={handleInputChange}
                                            placeholder="VIN Number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Make
                                        </label>
                                        <input
                                            type="text"
                                            name="make"
                                            value={formData.make}
                                            onChange={handleInputChange}
                                            placeholder="Vehicle make"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Model and Year */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Model
                                        </label>
                                        <input
                                            type="text"
                                            name="model"
                                            value={formData.model}
                                            onChange={handleInputChange}
                                            placeholder="Vehicle model"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Year
                                        </label>
                                        <input
                                            type="number"
                                            name="year"
                                            value={formData.year}
                                            onChange={handleInputChange}
                                            placeholder="Vehicle year"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Driver and Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Driver Assigned
                                        </label>
                                        <select
                                            name="driverAssigned"
                                            value={formData.driverAssigned}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Driver</option>
                                            <option value="driver1">John Doe</option>
                                            <option value="driver2">Jane Smith</option>
                                            <option value="driver3">Mike Johnson</option>
                                        </select>
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
                                            <option value="Inactive">Inactive</option>
                                            <option value="Maintenance">Maintenance</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Coordinates */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Coordinates
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="number"
                                            name="latitude"
                                            value={formData.latitude}
                                            onChange={handleInputChange}
                                            placeholder="Latitude"
                                            step="any"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="number"
                                            name="longitude"
                                            value={formData.longitude}
                                            onChange={handleInputChange}
                                            placeholder="Longitude"
                                            step="any"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="mt-2 text-blue-600 text-sm hover:text-blue-700 flex items-center"
                                    >
                                        <MapPin className="w-4 h-4 mr-1" />
                                        Select from map
                                    </button>
                                </div>

                                {/* Image Upload Fields */}
                                <div className="space-y-4">
                                    {/* Vehicle Images */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vehicle Images
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                            <div className="text-center">
                                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="mt-4">
                                                    <label htmlFor="vehicle-images" className="cursor-pointer">
                                                        <span className="mt-2 block text-sm font-medium text-gray-900">
                                                            Upload vehicle images
                                                        </span>
                                                        <span className="mt-2 block text-xs text-gray-500">
                                                            PNG, JPG, GIF up to 10MB each
                                                        </span>
                                                    </label>
                                                    <input
                                                        id="vehicle-images"
                                                        name="vehicleImages"
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="sr-only"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Display uploaded images */}
                                        {formData.vehicleImages.length > 0 && (
                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                {formData.vehicleImages.map((image, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={URL.createObjectURL(image)}
                                                            alt={`Vehicle ${index + 1}`}
                                                            className="h-20 w-full object-cover rounded border"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index, 'vehicleImages')}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Document Images */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Document Images (Registration, Insurance, etc.)
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                            <div className="text-center">
                                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="mt-4">
                                                    <label htmlFor="document-images" className="cursor-pointer">
                                                        <span className="mt-2 block text-sm font-medium text-gray-900">
                                                            Upload documents
                                                        </span>
                                                        <span className="mt-2 block text-xs text-gray-500">
                                                            PNG, JPG, PDF up to 10MB each
                                                        </span>
                                                    </label>
                                                    <input
                                                        id="document-images"
                                                        name="documentImages"
                                                        type="file"
                                                        multiple
                                                        accept="image/*,.pdf"
                                                        onChange={handleImageUpload}
                                                        className="sr-only"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Display uploaded documents */}
                                        {formData.documentImages.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {formData.documentImages.map((doc, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                                        <span className="text-sm text-gray-700 truncate">
                                                            {doc.name}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index, 'documentImages')}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            Create Vehicle
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NewVehicleSidebar;