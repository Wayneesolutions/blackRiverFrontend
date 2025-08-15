import React, { useState } from 'react';
import {
    DollarSign,
    TrendingUp,
    Users,
    Calendar,
    Download,
    Eye,
    MoreHorizontal,
    Building2,
    CreditCard,
    AlertCircle,
    CheckCircle,
    Clock,

} from 'lucide-react';

const RevenueDashboard = () => {

    const [revenueFilter, setRevenueFilter] = useState('all');

    // Sample revenue data
    const revenueData = [
        {
            id: 'REV-001',
            customer: 'Global Logistics Corp',
            customerId: 'CUST-001',
            plan: 'Enterprise',
            amount: 2500,
            recurring: true,
            paymentDate: '2024-08-01',
            nextPayment: '2024-09-01',
            status: 'Paid',
            method: 'Credit Card',
            growth: 15.2
        },
        {
            id: 'REV-002',
            customer: 'Urban Delivery Services',
            customerId: 'CUST-002',
            plan: 'Professional',
            amount: 899,
            recurring: true,
            paymentDate: '2024-08-05',
            nextPayment: '2024-09-05',
            status: 'Paid',
            method: 'Bank Transfer',
            growth: 8.7
        },
        {
            id: 'REV-003',
            customer: 'QuickMove Solutions',
            customerId: 'CUST-005',
            plan: 'Enterprise',
            amount: 2500,
            recurring: true,
            paymentDate: '2024-08-12',
            nextPayment: '2024-09-12',
            status: 'Paid',
            method: 'Credit Card',
            growth: 22.1
        },
        {
            id: 'REV-004',
            customer: 'Northern Freight Co',
            customerId: 'CUST-006',
            plan: 'Professional',
            amount: 899,
            recurring: true,
            paymentDate: '2024-08-18',
            nextPayment: '2024-09-18',
            status: 'Paid',
            method: 'Credit Card',
            growth: -5.3
        },
        {
            id: 'REV-005',
            customer: 'Express Cargo Hub',
            customerId: 'CUST-007',
            plan: 'Starter',
            amount: 199,
            recurring: true,
            paymentDate: '2024-08-22',
            nextPayment: '2024-09-22',
            status: 'Paid',
            method: 'Credit Card',
            growth: 12.4
        },
        {
            id: 'REV-006',
            customer: 'FastTrack Shipping',
            customerId: 'CUST-003',
            plan: 'Starter',
            amount: 199,
            recurring: false,
            paymentDate: '2024-08-10',
            nextPayment: 'Trial',
            status: 'Trial',
            method: 'N/A',
            growth: 0
        },
        {
            id: 'REV-007',
            customer: 'Metro Transport Ltd',
            customerId: 'CUST-004',
            plan: 'Professional',
            amount: 899,
            recurring: true,
            paymentDate: '2024-07-28',
            nextPayment: '2024-08-28',
            status: 'Overdue',
            method: 'Credit Card',
            growth: -12.8
        }
    ];

    // Revenue metrics
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.status === 'Paid' ? item.amount : 0), 0);
    const monthlyRecurring = revenueData.filter(item => item.recurring && item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
    const overdueAmount = revenueData.filter(item => item.status === 'Overdue').reduce((sum, item) => sum + item.amount, 0);
    const trialRevenuePotential = revenueData.filter(item => item.status === 'Trial').reduce((sum, item) => sum + item.amount, 0);

    const getStatusColor = (status: any) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Overdue': return 'bg-red-100 text-red-800';
            case 'Trial': return 'bg-blue-100 text-blue-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };


    const getStatusIcon = (status: any) => {
        switch (status) {
            case 'Paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'Overdue': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'Trial': return <Clock className="w-4 h-4 text-blue-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };


    const filteredRevenue = revenueData.filter(item => {
        if (revenueFilter === 'all') return true;
        if (revenueFilter === 'paid') return item.status === 'Paid';
        if (revenueFilter === 'overdue') return item.status === 'Overdue';
        if (revenueFilter === 'trial') return item.status === 'Trial';
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                            Revenue Dashboard
                        </h1>
                        <p className="text-gray-600 mt-1">Track revenue, payments, and financial metrics</p>
                    </div>

                </div>
            </div>

            <div className="p-6">
                {/* Revenue Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Total Revenue */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                                <div className="flex items-center mt-2">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className="text-sm text-green-600">+12.5% from last month</span>
                                </div>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Monthly Recurring Revenue */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Monthly Recurring</p>
                                <p className="text-2xl font-bold text-gray-900">${monthlyRecurring.toLocaleString()}</p>
                                <div className="flex items-center mt-2">
                                    <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                                    <span className="text-sm text-blue-600">+8.2% growth</span>
                                </div>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Overdue Payments */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Overdue Amount</p>
                                <p className="text-2xl font-bold text-gray-900">${overdueAmount.toLocaleString()}</p>
                                <div className="flex items-center mt-2">
                                    <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                                    <span className="text-sm text-red-600">Needs attention</span>
                                </div>
                            </div>
                            <div className="bg-red-100 p-3 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    {/* Trial Potential */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Trial Potential</p>
                                <p className="text-2xl font-bold text-gray-900">${trialRevenuePotential.toLocaleString()}</p>
                                <div className="flex items-center mt-2">
                                    <Clock className="w-4 h-4 text-purple-500 mr-1" />
                                    <span className="text-sm text-purple-600">Conversion pending</span>
                                </div>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>



                {/* Results Summary */}
                <div className="mb-6">
                    <p className="text-gray-600">
                        Showing <span className="font-medium">{filteredRevenue.length}</span> revenue entries
                    </p>
                </div>

                {/* Revenue Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto max-w-full">
                        <table className="w-full table-auto">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                                        Customer
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                        Amount
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                                        Payment Date
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRevenue.map((revenue) => (
                                    <tr key={revenue.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap w-64">
                                            <div className="flex items-center">
                                                <div className="bg-green-100 p-2 rounded-lg mr-3">
                                                    <Building2 className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{revenue.customer}</div>
                                                    <div className="text-sm text-gray-500">{revenue.customerId}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap w-32">
                                            <div className="text-sm font-medium text-gray-900">
                                                ${revenue.amount.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {revenue.recurring ? 'Monthly' : 'One-time'}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap w-40">
                                            <div className="text-sm text-gray-900">{revenue.paymentDate}</div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap w-32">
                                            <div className="flex items-center">
                                                {getStatusIcon(revenue.status)}
                                                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(revenue.status)}`}>
                                                    {revenue.status}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap w-32">
                                            <div className="flex items-center space-x-2">
                                                <button className="text-gray-400 hover:text-green-600 p-1 rounded">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="text-gray-400 hover:text-blue-600 p-1 rounded">
                                                    <CreditCard className="w-4 h-4" />
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
                        Showing 1 to {filteredRevenue.length} of {revenueData.length} revenue entries
                    </div>
                    <div className="flex space-x-2">
                        <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
                            Previous
                        </button>
                        <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
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

export default RevenueDashboard;