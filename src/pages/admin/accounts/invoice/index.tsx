import React, { useState } from 'react';
import { FileText, Plus, Eye, Edit, Download, Filter, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';

// Define TypeScript interfaces
interface Invoice {
    _id: string;
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    loadId: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending';
    invoiceDate: string;
    dueDate: string;
    paymentDate: string | null;
    invoiceUrl: string;
    notes: string;
    createdAt: string;
}

interface StatusSummary {
    _id: string;
    totalAmount: number;
    count: number;
}

interface MonthlyRevenue {
    _id: string;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
}

interface ClientRevenue {
    _id: string;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
}

interface BillingReport {
    statusSummary: StatusSummary[];
    monthlyRevenue: MonthlyRevenue[];
    clientRevenue: ClientRevenue[];
}

type TabType = 'list' | 'view' | 'edit' | 'create';
type StatusFilter = 'all' | 'paid' | 'pending';

const InvoiceManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('list');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // Static data matching your backend schema
    const staticInvoices: Invoice[] = [
        {
            _id: '507f1f77bcf86cd799439011',
            clientName: 'ABC Logistics Corp',
            clientEmail: 'billing@abclogistics.com',
            clientCompany: 'ABC Logistics Corp',
            loadId: '507f1f77bcf86cd799439012',
            amount: 2500.00,
            currency: 'USD',
            status: 'paid',
            invoiceDate: '2024-01-15T00:00:00Z',
            dueDate: '2024-02-15T00:00:00Z',
            paymentDate: '2024-02-10T00:00:00Z',
            invoiceUrl: 'https://app.example.com/invoice/507f1f77bcf86cd799439011',
            notes: 'Cross-country freight delivery - Chicago to Los Angeles',
            createdAt: '2024-01-15T10:30:00Z'
        },
        {
            _id: '507f1f77bcf86cd799439013',
            clientName: 'XYZ Shipping Inc',
            clientEmail: 'accounts@xyzshipping.com',
            clientCompany: 'XYZ Shipping Inc',
            loadId: '507f1f77bcf86cd799439014',
            amount: 1850.00,
            currency: 'USD',
            status: 'pending',
            invoiceDate: '2024-01-20T00:00:00Z',
            dueDate: '2024-02-20T00:00:00Z',
            paymentDate: null,
            invoiceUrl: 'https://app.example.com/invoice/507f1f77bcf86cd799439013',
            notes: 'Regional delivery service - New York to Boston',
            createdAt: '2024-01-20T14:45:00Z'
        },
        {
            _id: '507f1f77bcf86cd799439015',
            clientName: 'Global Transport Ltd',
            clientEmail: 'finance@globaltransport.com',
            clientCompany: 'Global Transport Ltd',
            loadId: '507f1f77bcf86cd799439016',
            amount: 3200.00,
            currency: 'USD',
            status: 'pending',
            invoiceDate: '2024-01-25T00:00:00Z',
            dueDate: '2024-02-25T00:00:00Z',
            paymentDate: null,
            invoiceUrl: 'https://app.example.com/invoice/507f1f77bcf86cd799439015',
            notes: 'Heavy machinery transport - Detroit to Miami',
            createdAt: '2024-01-25T09:15:00Z'
        },
        {
            _id: '507f1f77bcf86cd799439017',
            clientName: 'FastTrack Delivery',
            clientEmail: 'billing@fasttrack.com',
            clientCompany: 'FastTrack Delivery Services',
            loadId: '507f1f77bcf86cd799439018',
            amount: 1200.00,
            currency: 'USD',
            status: 'paid',
            invoiceDate: '2024-01-10T00:00:00Z',
            dueDate: '2024-02-10T00:00:00Z',
            paymentDate: '2024-02-08T00:00:00Z',
            invoiceUrl: 'https://app.example.com/invoice/507f1f77bcf86cd799439017',
            notes: 'Express delivery - Same day service',
            createdAt: '2024-01-10T16:20:00Z'
        }
    ];

    // Static billing report data
    const billingReport: BillingReport = {
        statusSummary: [
            { _id: 'paid', totalAmount: 3700.00, count: 2 },
            { _id: 'pending', totalAmount: 5050.00, count: 2 }
        ],
        monthlyRevenue: [
            {
                _id: '2024-01',
                totalAmount: 8750.00,
                paidAmount: 3700.00,
                pendingAmount: 5050.00
            }
        ],
        clientRevenue: [
            { _id: 'Global Transport Ltd', totalAmount: 3200.00, paidAmount: 0, pendingAmount: 3200.00 },
            { _id: 'ABC Logistics Corp', totalAmount: 2500.00, paidAmount: 2500.00, pendingAmount: 0 },
            { _id: 'XYZ Shipping Inc', totalAmount: 1850.00, paidAmount: 0, pendingAmount: 1850.00 },
            { _id: 'FastTrack Delivery', totalAmount: 1200.00, paidAmount: 1200.00, pendingAmount: 0 }
        ]
    };

    const filteredInvoices = statusFilter === 'all'
        ? staticInvoices
        : staticInvoices.filter(invoice => invoice.status === statusFilter);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string): string => {
        return status === 'paid' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100';
    };

    const DashboardOverview: React.FC = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(billingReport.monthlyRevenue[0]?.totalAmount || 0)}
                        </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Paid Invoices</p>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(billingReport.statusSummary.find(s => s._id === 'paid')?.totalAmount || 0)}
                        </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending Invoices</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {formatCurrency(billingReport.statusSummary.find(s => s._id === 'pending')?.totalAmount || 0)}
                        </p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                        <Calendar className="h-6 w-6 text-yellow-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Clients</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {billingReport.clientRevenue.length}
                        </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                        <Users className="h-6 w-6 text-purple-600" />
                    </div>
                </div>
            </div>
        </div>
    );

    const InvoiceList: React.FC = () => (
        <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Invoice List</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                        {/* <button
                            onClick={() => setActiveTab('create')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Invoice
                        </button> */}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Invoice ID</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Client</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Amount</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Due Date</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredInvoices.map((invoice) => (
                            <tr key={invoice._id} className="hover:bg-gray-50">
                                <td className="py-4 px-6">
                                    <div className="flex items-center">
                                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="font-mono text-sm">{invoice._id.slice(-8)}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div>
                                        <div className="font-medium text-gray-900">{invoice.clientName}</div>
                                        <div className="text-sm text-gray-500">{invoice.clientEmail}</div>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</span>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-900">
                                    {formatDate(invoice.dueDate)}
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedInvoice(invoice);
                                                setActiveTab('view');
                                            }}
                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                            title="View Invoice"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedInvoice(invoice);
                                                setActiveTab('edit');
                                            }}
                                            className="text-gray-600 hover:text-gray-800 transition-colors"
                                            title="Edit Invoice"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            className="text-green-600 hover:text-green-800 transition-colors"
                                            title="Download Invoice"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const InvoiceView: React.FC = () => {
        if (!selectedInvoice) return null;

        return (
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
                        <button
                            onClick={() => setActiveTab('list')}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            ← Back to List
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Client Information</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="font-medium text-gray-900">{selectedInvoice.clientName}</p>
                                    <p className="text-sm text-gray-600">{selectedInvoice.clientCompany}</p>
                                    <p className="text-sm text-gray-600">{selectedInvoice.clientEmail}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Invoice Information</h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Invoice ID:</span>
                                        <span className="text-sm font-mono text-gray-900">{selectedInvoice._id.slice(-8)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Load ID:</span>
                                        <span className="text-sm font-mono text-gray-900">{selectedInvoice.loadId?.slice(-8)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Status:</span>
                                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                                            {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Invoice Date</h4>
                            <p className="text-sm text-gray-600">{formatDate(selectedInvoice.invoiceDate)}</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Due Date</h4>
                            <p className="text-sm text-gray-600">{formatDate(selectedInvoice.dueDate)}</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Payment Date</h4>
                            <p className="text-sm text-gray-600">
                                {selectedInvoice.paymentDate ? formatDate(selectedInvoice.paymentDate) : 'Not paid'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Amount</h4>
                        <p className="text-3xl font-bold text-gray-900">{formatCurrency(selectedInvoice.amount)}</p>
                    </div>

                    {selectedInvoice.notes && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-700">{selectedInvoice.notes}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Download PDF
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('edit');
                            }}
                            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <Edit className="h-4 w-4" />
                            Edit Invoice
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Main render logic based on activeTab
    const renderContent = () => {
        switch (activeTab) {
            case 'list':
                return (
                    <div>
                        <DashboardOverview />
                        <InvoiceList />
                    </div>
                );
            case 'view':
                return <InvoiceView />;
            case 'edit':
                return (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Invoice</h2>
                        <p className="text-gray-600">Invoice editing form will be implemented here.</p>
                        <button
                            onClick={() => setActiveTab('list')}
                            className="mt-4 text-blue-600 hover:text-blue-800"
                        >
                            ← Back to List
                        </button>
                    </div>
                );
            case 'create':
                return (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Invoice</h2>
                        <p className="text-gray-600">Invoice creation form will be implemented here.</p>
                        <button
                            onClick={() => setActiveTab('list')}
                            className="mt-4 text-blue-600 hover:text-blue-800"
                        >
                            ← Back to List
                        </button>
                    </div>
                );
            default:
                return <InvoiceList />;
        }
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
                    <p className="mt-2 text-gray-600">Manage your invoices, track payments, and generate reports</p>
                </div>
                
                {renderContent()}
            </div>
        </div>
    );
};

export default InvoiceManagement;