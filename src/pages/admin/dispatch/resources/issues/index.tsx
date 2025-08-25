import React, { useState } from "react";
import { Plus, Search, MoreVertical, Filter } from "lucide-react";
import NewIssuesSidebar from "./NewIssuesSidebar";

const Index = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Dummy issue data
    const issues = [
        {
            id: "ISS-001",
            priority: "High",
            type: "Fuel",
            category: "Overconsumption",
            reporter: "Raman's Beauty Lounge",
            assign: "John Manager",
            driver: "Mike Johnson",
            vehicle: "Truck Alpha",
            status: "Open",
            createdAt: "2024-02-10",
        },
        {
            id: "ISS-002",
            priority: "Medium",
            type: "Maintenance",
            category: "Engine",
            reporter: "Alice Corp",
            assign: "Sarah Lead",
            driver: "Jane Smith",
            vehicle: "Van Beta",
            status: "In Progress",
            createdAt: "2024-02-11",
        },
        {
            id: "ISS-003",
            priority: "Low",
            type: "Accident",
            category: "Minor Damage",
            reporter: "Bob Enterprises",
            assign: "Tom Admin",
            driver: "John Doe",
            vehicle: "Car Gamma",
            status: "Closed",
            createdAt: "2024-02-12",
        },
        {
            id: "ISS-004",
            priority: "High",
            type: "Compliance",
            category: "Paperwork",
            reporter: "Delta Logistics",
            assign: "Chris Ops",
            driver: "Mike Johnson",
            vehicle: "Truck Beta",
            status: "Open",
            createdAt: "2024-02-13",
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "open":
                return "bg-red-100 text-red-800";
            case "in progress":
                return "bg-yellow-100 text-yellow-800";
            case "closed":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case "high":
                return "text-red-600 font-semibold";
            case "medium":
                return "text-yellow-600 font-semibold";
            case "low":
                return "text-green-600 font-semibold";
            default:
                return "text-gray-600";
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
                            <h1 className="text-2xl font-semibold text-gray-900">Issues</h1>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Issues"
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
                                <span>Create Issue</span>
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
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assign</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {issues.map((issue) => (
                                        <tr key={issue.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-mono text-gray-700">{issue.id}</td>
                                            <td className={`px-6 py-4 text-sm ${getPriorityColor(issue.priority)}`}>
                                                {issue.priority}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{issue.type}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{issue.category}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{issue.reporter}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{issue.assign}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{issue.driver}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{issue.vehicle}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(issue.status)}`}
                                                >
                                                    {issue.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{issue.createdAt}</td>
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
            <NewIssuesSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
        </div>
    );
};

export default Index;
