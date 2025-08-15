import React, { useState } from 'react';
import {
    Users,
    Search,
    Filter,
    Download,
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Building2,
    Mail,
    Phone,
} from 'lucide-react';

const ViewAllAccounts = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedPlan, setSelectedPlan] = useState('all');
    const [sortBy, setSortBy] = useState('company');
    const [sortOrder, setSortOrder] = useState('asc');

    // Sample customer data
    const customers = [
        {
            id: 'CUST-001',
            company: 'Global Logistics Corp',
            email: 'admin@globallogistics.com',
            phone: '+1 (555) 123-4567',
            plan: 'Enterprise',
            status: 'Active',
            joinDate: '2024-01-15',
            lastLogin: '2024-08-14',
            revenue: 2500,
            instances: 12,
            users: 45,
            location: 'New York, USA',
            paymentStatus: 'Paid'
        },
        {
            id: 'CUST-002',
            company: 'Urban Delivery Services',
            email: 'contact@urbandelivery.com',
            phone: '+1 (555) 234-5678',
            plan: 'Professional',
            status: 'Active',
            joinDate: '2024-02-20',
            lastLogin: '2024-08-15',
            revenue: 899,
            instances: 3,
            users: 12,
            location: 'Los Angeles, USA',
            paymentStatus: 'Paid'
        },
        {
            id: 'CUST-003',
            company: 'FastTrack Shipping',
            email: 'info@fasttrack.com',
            phone: '+1 (555) 345-6789',
            plan: 'Starter',
            status: 'Trial',
            joinDate: '2024-08-10',
            lastLogin: '2024-08-14',
            revenue: 199,
            instances: 1,
            users: 3,
            location: 'Chicago, USA',
            paymentStatus: 'Trial'
        },
        {
            id: 'CUST-004',
            company: 'Metro Transport Ltd',
            email: 'admin@metrotransport.com',
            phone: '+1 (555) 456-7890',
            plan: 'Professional',
            status: 'Suspended',
            joinDate: '2023-11-05',
            lastLogin: '2024-07-28',
            revenue: 899,
            instances: 2,
            users: 8,
            location: 'Houston, USA',
            paymentStatus: 'Overdue'
        },
        {
            id: 'CUST-005',
            company: 'QuickMove Solutions',
            email: 'support@quickmove.com',
            phone: '+1 (555) 567-8901',
            plan: 'Enterprise',
            status: 'Active',
            joinDate: '2024-03-12',
            lastLogin: '2024-08-15',
            revenue: 2500,
            instances: 8,
            users: 32,
            location: 'Miami, USA',
            paymentStatus: 'Paid'
        },
        {
            id: 'CUST-006',
            company: 'Northern Freight Co',
            email: 'ops@northernfreight.com',
            phone: '+1 (555) 678-9012',
            plan: 'Professional',
            status: 'Active',
            joinDate: '2024-06-18',
            lastLogin: '2024-08-13',
            revenue: 899,
            instances: 4,
            users: 15,
            location: 'Seattle, USA',
            paymentStatus: 'Paid'
        },
        {
            id: 'CUST-007',
            company: 'Express Cargo Hub',
            email: 'admin@expresscargo.com',
            phone: '+1 (555) 789-0123',
            plan: 'Starter',
            status: 'Active',
            joinDate: '2024-07-22',
            lastLogin: '2024-08-15',
            revenue: 199,
            instances: 1,
            users: 5,
            location: 'Denver, USA',
            paymentStatus: 'Paid'
        },
        {
            id: 'CUST-008',
            company: 'Pacific Shipping Inc',
            email: 'contact@pacificship.com',
            phone: '+1 (555) 890-1234',
            plan: 'Enterprise',
            status: 'Cancelled',
            joinDate: '2023-08-30',
            lastLogin: '2024-05-20',
            revenue: 0,
            instances: 0,
            users: 0,
            location: 'San Francisco, USA',
            paymentStatus: 'Cancelled'
        }
    ];



    // Filter customers based on search and filters
    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = selectedFilter === 'all' || customer.status.toLowerCase() === selectedFilter.toLowerCase();
        const matchesPlan = selectedPlan === 'all' || customer.plan.toLowerCase() === selectedPlan.toLowerCase();

        return matchesSearch && matchesStatus && matchesPlan;
    });

    const handleSort = (field: any) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                            <Users className="w-8 h-8 text-purple-600 mr-3" />
                            Admin Accounts
                        </h1>
                        <p className="text-gray-600 mt-1">Manage all customer accounts and subscriptions</p>
                    </div>
                    <div className="flex items-center space-x-3">

                        <button className="bg-purple-600 hover:bg-purple-700 !text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Customer
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>


                    </div>
                </div>

                {/* Results Summary */}
                <div className="mb-6">
                    <p className="text-gray-600">
                        Showing <span className="font-medium">{filteredCustomers.length}</span> of <span className="font-medium">{customers.length}</span> customers
                    </p>
                </div>

                {/* Accounts Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[200px]"
                                        onClick={() => handleSort('company')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Company</span>
                                            <Filter className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                                        Contact Info
                                    </th>

                                    <th
                                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[120px]"
                                        onClick={() => handleSort('revenue')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Revenue</span>
                                            <Filter className="w-3 h-3" />
                                        </div>
                                    </th>
                                  
                                    <th
                                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[150px]"
                                        onClick={() => handleSort('joinDate')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Join Date</span>
                                            <Filter className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                                            <div className="flex items-center">
                                                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                                                    <Building2 className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{customer.company}</div>
                                                    <div className="text-sm text-gray-500">{customer.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap min-w-[250px]">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                    {customer.email}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                    {customer.phone}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap min-w-[120px]">
                                            <div className="text-sm text-gray-900">
                                                {customer.revenue > 0 ? `$${customer.revenue}/mo` : 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {customer.paymentStatus}
                                            </div>
                                        </td>
                                     
                                        <td className="px-6 py-4 whitespace-nowrap min-w-[150px]">
                                            <div className="space-y-1">
                                                <div className="text-sm text-gray-900">{customer.joinDate}</div>
                                                <div className="text-sm text-gray-500">Last: {customer.lastLogin}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap min-w-[120px]">
                                            <div className="flex items-center space-x-2">
                                                <button className="text-gray-400 hover:text-purple-600 p-1 rounded">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="text-gray-400 hover:text-blue-600 p-1 rounded">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="text-gray-400 hover:text-red-600 p-1 rounded">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button className="text-gray-400 hover:text-gray-600 p-1 rounded">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing 1 to {filteredCustomers.length} of {customers.length} results
                    </div>
                    <div className="flex space-x-2">
                        <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
                            Previous
                        </button>
                        <button className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                            1
                        </button>
                        <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                            2
                        </button>
                        <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewAllAccounts;