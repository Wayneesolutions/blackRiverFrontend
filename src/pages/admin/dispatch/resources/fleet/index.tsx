import React, { useState } from "react";
import { Plus, Search, MoreVertical, Truck, Filter } from "lucide-react";
import NewFleetSidebar from "./NewFleetSidebar";

const Index = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Dummy fleet data
    const fleets = [
        {
            id: "FLT-001",
            name: "Alpha Logistics",
            serviceArea: "North Zone",
            parentFleet: "Main Fleet A",
            vendor: "Vendor One",
            zone: "Zone 1",
            manpower: 120,
            activeManpower: 98,
            task: "Deliveries",
            status: "Active",
            createdAt: "2024-01-15",
        },
        {
            id: "FLT-002",
            name: "Beta Carriers",
            serviceArea: "South Zone",
            parentFleet: "Main Fleet B",
            vendor: "Vendor Two",
            zone: "Zone 2",
            manpower: 85,
            activeManpower: 75,
            task: "Maintenance",
            status: "Inactive",
            createdAt: "2024-01-18",
        },
        {
            id: "FLT-003",
            name: "Gamma Movers",
            serviceArea: "East Zone",
            parentFleet: "Main Fleet A",
            vendor: "Vendor Three",
            zone: "Zone 3",
            manpower: 60,
            activeManpower: 54,
            task: "Cargo",
            status: "Active",
            createdAt: "2024-01-20",
        },
        {
            id: "FLT-004",
            name: "Delta Transport",
            serviceArea: "West Zone",
            parentFleet: "Main Fleet C",
            vendor: "Vendor One",
            zone: "Zone 4",
            manpower: 150,
            activeManpower: 120,
            task: "Freight",
            status: "Active",
            createdAt: "2024-01-22",
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800";
            case "inactive":
                return "bg-red-100 text-red-800";
            case "maintenance":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <div className="flex-1">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-semibold text-gray-900">Fleets</h1>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Fleets"
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
                                <span>Create Fleets</span>
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
                                            Name
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Service Area
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Parent Fleet
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vendor
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Zone
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Manpower
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Active Manpower
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Task
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
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
                                    {fleets.map((fleet) => (
                                        <tr key={fleet.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Truck className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {fleet.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {fleet.serviceArea}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {fleet.parentFleet}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {fleet.vendor}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {fleet.zone}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">
                                                {fleet.id}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {fleet.manpower}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {fleet.activeManpower}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {fleet.task}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                        fleet.status
                                                    )}`}
                                                >
                                                    {fleet.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {fleet.createdAt}
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
            <NewFleetSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
        </div>
    );
};

export default Index;
