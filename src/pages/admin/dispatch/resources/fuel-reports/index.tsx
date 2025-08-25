import React, { useState } from "react";
import { Plus, Search, MoreVertical, Filter } from "lucide-react";
import NewFuelReportSidebar from "./NewFuelReportSidebar";

const Index = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Dummy fuel report data
    const fuelReports = [
        {
            id: "FR-001",
            reporter: "Alice Johnson",
            driver: "John Doe",
            vehicle: "Truck Alpha",
            status: "Approved",
            volume: "50 L",
            odometer: "120,345 km",
            createdAt: "2024-01-15",
        },
        {
            id: "FR-002",
            reporter: "Bob Smith",
            driver: "Jane Smith",
            vehicle: "Van Beta",
            status: "Pending",
            volume: "40 L",
            odometer: "89,234 km",
            createdAt: "2024-01-18",
        },
        {
            id: "FR-003",
            reporter: "Charlie Brown",
            driver: "Mike Johnson",
            vehicle: "Truck Gamma",
            status: "Rejected",
            volume: "60 L",
            odometer: "150,678 km",
            createdAt: "2024-01-20",
        },
        {
            id: "FR-004",
            reporter: "David Wilson",
            driver: "Sarah Wilson",
            vehicle: "Van Delta",
            status: "Approved",
            volume: "35 L",
            odometer: "102,456 km",
            createdAt: "2024-01-22",
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "approved":
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "rejected":
                return "bg-red-100 text-red-800";
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
                            <h1 className="text-2xl font-semibold text-gray-900">Fuel Reports</h1>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Fuel Reports"
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
                                <span>Create Fuel Report</span>
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
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Odometer</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {fuelReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{report.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{report.reporter}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{report.driver}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{report.vehicle}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                        report.status
                                                    )}`}
                                                >
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{report.volume}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{report.odometer}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{report.createdAt}</td>
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
            <NewFuelReportSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
        </div>
    );
};

export default Index;
