import { useState } from 'react';
import { Plus, Search, MoreVertical, User, Filter } from 'lucide-react';
import NewDriverSidebar from './NewDriverSidebar';
import { listDriver } from '../../../../../axios/api/distapcher';

const DriversTable = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Updated drivers data with new fields
    const drivers = [
        { 
            id: 1, 
            name: 'John Doe', 
            internalId: 'DRV-001',
            vendor: 'Vendor A', 
            vehicle: 'Truck-001', 
            license: 'DL12345678',
            phone: '+1234567890', 
            createdAt: '2024-01-15'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <div className="flex-1">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-semibold text-gray-900">Drivers</h1>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search drivers..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                                <Filter className="w-5 h-5" />
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
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Internal ID</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {drivers.map((driver) => (
                                        <tr key={driver.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{driver.internalId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.vendor}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.vehicle}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{driver.license}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.phone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.createdAt}</td>
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
            <NewDriverSidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />
        </div>
    );
};

export default DriversTable;