import React, { useState } from 'react';
import { Plus, Search, MoreVertical, Truck, Filter } from 'lucide-react';
import NewVehicleSidebar from './NewVehicleSidebar';

const VehiclesTable = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Dummy vehicles data
    const vehicles = [
        {
            id: 1,
            name: 'Truck Alpha',
            plateNumber: 'ABC-1234',
            driverAssigned: 'John Doe',
            internalId: 'VEH-001',
            status: 'Active',
            createdAt: '2024-01-15'
        },
        {
            id: 2,
            name: 'Van Beta',
            plateNumber: 'XYZ-5678',
            driverAssigned: 'Jane Smith',
            internalId: 'VEH-002',
            status: 'Active',
            createdAt: '2024-01-16'
        },
        {
            id: 3,
            name: 'Truck Gamma',
            plateNumber: 'DEF-9012',
            driverAssigned: 'Mike Johnson',
            internalId: 'VEH-003',
            status: 'Maintenance',
            createdAt: '2024-01-17'
        },
        {
            id: 4,
            name: 'Van Delta',
            plateNumber: 'GHI-3456',
            driverAssigned: 'Sarah Wilson',
            internalId: 'VEH-004',
            status: 'Active',
            createdAt: '2024-01-18'
        },
        {
            id: 5,
            name: 'Truck Epsilon',
            plateNumber: 'JKL-7890',
            driverAssigned: 'David Brown',
            internalId: 'VEH-005',
            status: 'Inactive',
            createdAt: '2024-01-19'
        },
        {
            id: 6,
            name: 'Van Zeta',
            plateNumber: 'MNO-2468',
            driverAssigned: 'Lisa Garcia',
            internalId: 'VEH-006',
            status: 'Active',
            createdAt: '2024-01-20'
        }
    ];

    const getStatusColor = (status: any) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            case 'maintenance':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
                            <h1 className="text-2xl font-semibold text-gray-900">Vehicles</h1>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Vehicles"
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
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create Vehicle</span>
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
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Plate Number</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver Assigned</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {vehicles.map((vehicle) => (
                                        <tr key={vehicle.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Truck className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">{vehicle.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{vehicle.plateNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.driverAssigned}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{vehicle.internalId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                                                    {vehicle.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.createdAt}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
            <NewVehicleSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
        </div>
    );
};

export default VehiclesTable;