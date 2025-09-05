import React, { useState } from 'react';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import type { FC } from "react";
import NewPlacesSidebar from "../places/NewPlacesSidebar";
import { createCustomer } from '../../../../../axios/adminApi';

interface NewCustomerSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewCustomerSidebar: FC<NewCustomerSidebarProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        title: '',
        internalId: '',
        userAccount: '',
        selectedUserName: '',
        selectedUserEmail: '',
        selectedUserPhone: '',
        // Place details for address
        placeDetails: {
            name: '',
            street1: '',
            street2: '',
            neighbourHood: '',
            building: '',
            streetAccessCode: '',
            postalCode: '',
            city: '',
            state: '',
            country: '',
            cordinates: {
                longitude: '',
                latitude: ''
            },
            phone: ''
        }
    });

    const [openDetails, setOpenDetails] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({
        userAccount: false
    });

    const users = [
        { id: 'USR-001', name: 'Alice Johnson', email: 'alice.johnson@example.com', phone: '+1 555-1234' },
        { id: 'USR-002', name: 'Bob Williams', email: 'bob.williams@example.com', phone: '+44 7700 900123' },
        { id: 'USR-003', name: 'Clara Smith', email: 'clara.smith@example.com', phone: '+65 8123 4567' },
    ];

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUserAccountChange = (userId: string) => {
        const selectedUser = users.find(u => u.id === userId);
        if (selectedUser) {
            setFormData(prev => ({
                ...prev,
                userAccount: userId,
                selectedUserName: selectedUser.name,
                selectedUserEmail: selectedUser.email,
                selectedUserPhone: selectedUser.phone
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                userAccount: '',
                selectedUserName: '',
                selectedUserEmail: '',
                selectedUserPhone: ''
            }));
        }
    };

    const toggleSection = (section: keyof typeof collapsedSections) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handlePlaceSelect = (placeData: any) => {
        setFormData(prev => ({
            ...prev,
            placeDetails: {
                ...prev.placeDetails,
                ...placeData
            }
        }));
        setIsSidebarOpen(false);
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            
            // Prepare data according to your customer model
            const customerData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                title: formData.title,
                internalId: formData.internalId,
                placeDetails: formData.placeDetails.name ? formData.placeDetails : undefined
            };

            // Remove empty placeDetails if no address was selected
            if (!customerData.placeDetails?.name) {
                delete customerData.placeDetails;
            }

            const response = await createCustomer(customerData);
            
            if (response?.success) {
                console.log('Customer created successfully:', response);
                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    title: '',
                    internalId: '',
                    userAccount: '',
                    selectedUserName: '',
                    selectedUserEmail: '',
                    selectedUserPhone: '',
                    placeDetails: {
                        name: '',
                        street1: '',
                        street2: '',
                        neighbourHood: '',
                        building: '',
                        streetAccessCode: '',
                        postalCode: '',
                        city: '',
                        state: '',
                        country: '',
                        cordinates: {
                            longitude: '',
                            latitude: ''
                        },
                        phone: ''
                    }
                });
                onClose();
            } else {
                console.error('Error creating customer:', response);
                alert('Error creating customer. Please try again.');
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Error creating customer. Please try again.');
        } finally {
            setIsLoading(false);
        }
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
                        <h2 className="text-lg font-semibold text-gray-900">New Customer</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                    {/* User Account Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3 bg-gray-100 p-3 rounded-md">
                            <h3 className="text-sm font-medium text-gray-900">User Account</h3>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => toggleSection('userAccount')}>
                                    {collapsedSections.userAccount ?
                                        <ChevronUp className="w-4 h-4 text-gray-400" /> :
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    }
                                </button>
                            </div>
                        </div>

                        {!collapsedSections.userAccount && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">User Account</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                                        value={formData.userAccount}
                                        onChange={(e) => handleUserAccountChange(e.target.value)}
                                    >
                                        <option value="">Select Account...</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} - {user.email} - {user.phone}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {formData.userAccount && (
                                    <div className="space-y-3 bg-gray-50 p-3 rounded-md">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                                                value={formData.selectedUserName}
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Email</label>
                                            <input
                                                type="email"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                                                value={formData.selectedUserEmail}
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Phone</label>
                                            <input
                                                type="tel"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                                                value={formData.selectedUserPhone}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Customer Details Panel */}
                    <div className="bg-gray-50 p-4 rounded-md">
                        <div
                            className="flex items-center justify-between cursor-pointer mb-4"
                            onClick={() => setOpenDetails(!openDetails)}
                        >
                            <h3 className="text-lg font-medium text-gray-900">Customer Details</h3>
                            <svg
                                className={`w-5 h-5 text-gray-500 transform transition-transform ${openDetails ? "rotate-180" : ""}`}
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
                                {/* Name & Email */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Name"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Internal Id */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Internal Id
                                        </label>
                                        <input
                                            type="text"
                                            name="internalId"
                                            value={formData.internalId}
                                            onChange={handleInputChange}
                                            placeholder="Internal Id"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div></div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={formData.placeDetails.name ? 
                                                `${formData.placeDetails.name}, ${formData.placeDetails.city || ''}` : 
                                                ''
                                            }
                                            placeholder="Select Address"
                                            className="flex-1 px-3 py-2 !mr-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                            readOnly
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsSidebarOpen(true)}
                                            className="bg-gray-100 px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-200 flex items-center space-x-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>New Address</span>
                                        </button>
                                    </div>
                                </div>

                                <NewPlacesSidebar
                                    isOpen={isSidebarOpen}
                                    onClose={() => setIsSidebarOpen(false)}
                                    onPlaceSelect={handlePlaceSelect}
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
                            className="px-4 py-2 border border-gray-300 !mr-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-600 !text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            disabled={isLoading || !formData.name.trim()}
                        >
                            {isLoading ? 'Creating...' : 'Create Customer'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NewCustomerSidebar;