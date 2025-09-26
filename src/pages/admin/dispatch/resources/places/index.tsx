import React, { useState } from "react";
import { Plus, Search, MoreVertical, MapPin, Filter } from "lucide-react";
import NewPlacesSidebar from "./NewPlacesSidebar";
import { listPlace,deletePlace,updateStatusPlace,updatePlace } from "../../../../../axios/api/dispatcher.places";
const Index = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Dummy places data
    const places = [
        {
            id: "PLC-001",
            address: "123 Main St, New York, NY",
            postalCode: "10001",
            country: "USA",
            createdAt: "2024-01-15",
        },
        {
            id: "PLC-002",
            address: "456 Oak Ave, Los Angeles, CA",
            postalCode: "90001",
            country: "USA",
            createdAt: "2024-01-18",
        },
        {
            id: "PLC-003",
            address: "789 Pine Rd, Toronto, ON",
            postalCode: "M4B 1B3",
            country: "Canada",
            createdAt: "2024-01-20",
        },
        {
            id: "PLC-004",
            address: "101 Maple St, London",
            postalCode: "SW1A 1AA",
            country: "UK",
            createdAt: "2024-01-22",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <div className="flex-1">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-semibold text-gray-900">Places</h1>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Places"
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
                                <span>Create Place</span>
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
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Address
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Postal Code
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Country
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created At
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {places.map((place) => (
                                        <tr key={place.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <MapPin className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {place.address}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">
                                                {place.id}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {place.postalCode}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {place.country}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {place.createdAt}
                                            </td>
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
            </div>

            {/* Sidebar Component */}
            <NewPlacesSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
        </div>
    );
};

export default Index;
