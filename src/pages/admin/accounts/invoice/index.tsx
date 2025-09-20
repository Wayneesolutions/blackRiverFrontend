import React, { useState } from 'react';
import { FileText, Plus, Eye, Edit, Download, Filter, Calendar, DollarSign, Users, TrendingUp, Truck, Fuel, Wrench, MapPin } from 'lucide-react';

// Enhanced TypeScript interfaces
interface Invoice {
    _id: string;
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    loadId: string;
    truckId: string; // Added truck identifier
    unitNumber: string; // Truck unit number for matching
    amount: number;
    currency: string;
    status: 'paid' | 'pending';
    invoiceDate: string;
    dueDate: string;
    paymentDate: string | null;
    invoiceUrl: string;
    notes: string;
    createdAt: string;
    // Truck-specific data
    milesCovered: number;
    fuelExpenses: number;
    servicesPerformed: string[];
    spareParts: SparePartExpense[];
}

interface SparePartExpense {
    partName: string;
    cost: number;
    quantity: number;
    supplier: string;
}

interface TruckData {
    unitNumber: string;
    totalMiles: number;
    totalFuelExpenses: number;
    totalServices: number;
    totalSparePartsCost: number;
    lastServiceDate: string;
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
    fuelExpenses: number;
    netRevenue: number;
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
    truckPerformance: TruckData[];
}

type TabType = 'list' | 'view' | 'edit' | 'create' | 'trucks';
type StatusFilter = 'all' | 'paid' | 'pending';

const InvoiceManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('list');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // Enhanced static data with truck information
    const staticInvoices: Invoice[] = [
        {
            _id: '507f1f77bcf86cd799439011',
            clientName: 'ABC Logistics Corp',
            clientEmail: 'billing@abclogistics.com',
            clientCompany: 'ABC Logistics Corp',
            loadId: '507f1f77bcf86cd799439012',
            truckId: 'truck_001',
            unitNumber: 'T-001',
            amount: 2500.00,
            currency: 'USD',
            status: 'paid',
            invoiceDate: '2024-01-15T00:00:00Z',
            dueDate: '2024-02-15T00:00:00Z',
            paymentDate: '2024-02-10T00:00:00Z',
            invoiceUrl: 'https://app.example.com/invoice/507f1f77bcf86cd799439011',
            notes: 'Cross-country freight delivery - Chicago to Los Angeles',
            createdAt: '2024-01-15T10:30:00Z',
            milesCovered: 2140,
            fuelExpenses: 480.50,
            servicesPerformed: ['Oil Change', 'Tire Inspection'],
            spareParts: [
                { partName: 'Air Filter', cost: 45.00, quantity: 1, supplier: 'TruckParts Inc' },
                { partName: 'Brake Pads', cost: 120.00, quantity: 2, supplier: 'AutoSupply Co' }
            ]
        },
        {
            _id: '507f1f77bcf86cd799439013',
            clientName: 'XYZ Shipping Inc',
            clientEmail: 'accounts@xyzshipping.com',
            clientCompany: 'XYZ Shipping Inc',
            loadId: '507f1f77bcf86cd799439014',
            truckId: 'truck_002',
            unitNumber: 'T-002',
            amount: 1850.00,
            currency: 'USD',
            status: 'pending',
            invoiceDate: '2024-01-20T00:00:00Z',
            dueDate: '2024-02-20T00:00:00Z',
            paymentDate: null,
            invoiceUrl: 'https://app.example.com/invoice/507f1f77bcf86cd799439013',
            notes: 'Regional delivery service - New York to Boston',
            createdAt: '2024-01-20T14:45:00Z',
            milesCovered: 850,
            fuelExpenses: 195.75,
            servicesPerformed: ['Pre-trip Inspection'],
            spareParts: []
        },
        {
            _id: '507f1f77bcf86cd799439015',
            clientName: 'Global Transport Ltd',
            clientEmail: 'finance@globaltransport.com',
            clientCompany: 'Global Transport Ltd',
            loadId: '507f1f77bcf86cd799439016',
            truckId: 'truck_003',
            unitNumber: 'T-003',
            amount: 3200.00,
            currency: 'USD',
            status: 'pending',
            invoiceDate: '2024-01-25T00:00:00Z',
            dueDate: '2024-02-25T00:00:00Z',
            paymentDate: null,
            invoiceUrl: 'https://app.example.com/invoice/507f1f77bcf86cd799439015',
            notes: 'Heavy machinery transport - Detroit to Miami',
            createdAt: '2024-01-25T09:15:00Z',
            milesCovered: 1340,
            fuelExpenses: 320.40,
            servicesPerformed: ['Engine Check', 'Hydraulic System Inspection'],
            spareParts: [
                { partName: 'Hydraulic Fluid', cost: 85.00, quantity: 2, supplier: 'Heavy Duty Parts' }
            ]
        },
        {
            _id: '507f1f77bcf86cd799439017',
            clientName: 'FastTrack Delivery',
            clientEmail: 'billing@fasttrack.com',
            clientCompany: 'FastTrack Delivery Services',
            loadId: '507f1f77bcf86cd799439018',
            truckId: 'truck_001',
            unitNumber: 'T-001',
            amount: 1200.00,
            currency: 'USD',
            status: 'paid',
            invoiceDate: '2024-01-10T00:00:00Z',
            dueDate: '2024-02-10T00:00:00Z',
            paymentDate: '2024-02-08T00:00:00Z',
            invoiceUrl: 'https://app.example.com/invoice/507f1f77bcf86cd799439017',
            notes: 'Express delivery - Same day service',
            createdAt: '2024-01-10T16:20:00Z',
            milesCovered: 320,
            fuelExpenses: 78.25,
            servicesPerformed: ['Post-trip Inspection'],
            spareParts: []
        }
    ];

    // Calculate truck performance data
    const calculateTruckData = (): TruckData[] => {
        const truckMap = new Map<string, TruckData>();
        
        staticInvoices.forEach(invoice => {
            const existing = truckMap.get(invoice.unitNumber) || {
                unitNumber: invoice.unitNumber,
                totalMiles: 0,
                totalFuelExpenses: 0,
                totalServices: 0,
                totalSparePartsCost: 0,
                lastServiceDate: invoice.createdAt
            };
            
            existing.totalMiles += invoice.milesCovered;
            existing.totalFuelExpenses += invoice.fuelExpenses;
            existing.totalServices += invoice.servicesPerformed.length;
            existing.totalSparePartsCost += invoice.spareParts.reduce((sum, part) => sum + (part.cost * part.quantity), 0);
            
            if (new Date(invoice.createdAt) > new Date(existing.lastServiceDate)) {
                existing.lastServiceDate = invoice.createdAt;
            }
            
            truckMap.set(invoice.unitNumber, existing);
        });
        
        return Array.from(truckMap.values());
    };

    // Enhanced billing report data
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
                pendingAmount: 5050.00,
                fuelExpenses: 1074.90,
                netRevenue: 7675.10
            }
        ],
        clientRevenue: [
            { _id: 'Global Transport Ltd', totalAmount: 3200.00, paidAmount: 0, pendingAmount: 3200.00 },
            { _id: 'ABC Logistics Corp', totalAmount: 2500.00, paidAmount: 2500.00, pendingAmount: 0 },
            { _id: 'XYZ Shipping Inc', totalAmount: 1850.00, paidAmount: 0, pendingAmount: 1850.00 },
            { _id: 'FastTrack Delivery', totalAmount: 1200.00, paidAmount: 1200.00, pendingAmount: 0 }
        ],
        truckPerformance: calculateTruckData()
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

    const DashboardOverview: React.FC = () => {
        const totalFuelExpenses = staticInvoices.reduce((sum, inv) => sum + inv.fuelExpenses, 0);
        const totalMiles = staticInvoices.reduce((sum, inv) => sum + inv.milesCovered, 0);
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Net Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(billingReport.monthlyRevenue[0]?.netRevenue || 0)}
                            </p>
                            <p className="text-xs text-gray-400">After fuel expenses</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Fuel Expenses</p>
                            <p className="text-2xl font-bold text-red-600">
                                {formatCurrency(totalFuelExpenses)}
                            </p>
                            <p className="text-xs text-gray-400">${(totalFuelExpenses/totalMiles).toFixed(2)}/mile</p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-full">
                            <Fuel className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Miles</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {totalMiles.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400">This month</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <MapPin className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Trucks</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {billingReport.truckPerformance.length}
                            </p>
                            <p className="text-xs text-gray-400">In fleet</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-full">
                            <Truck className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const TrucksOverview: React.FC = () => (
        <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Truck Performance</h2>
                    <button
                        onClick={() => setActiveTab('list')}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Unit Number</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Total Miles</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Fuel Expenses</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Services</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Spare Parts Cost</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Last Service</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {billingReport.truckPerformance.map((truck) => (
                            <tr key={truck.unitNumber} className="hover:bg-gray-50">
                                <td className="py-4 px-6">
                                    <div className="flex items-center">
                                        <Truck className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="font-mono text-sm font-medium">{truck.unitNumber}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-900">
                                    {truck.totalMiles.toLocaleString()} mi
                                </td>
                                <td className="py-4 px-6">
                                    <span className="font-medium text-red-600">{formatCurrency(truck.totalFuelExpenses)}</span>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-900">
                                    {truck.totalServices} performed
                                </td>
                                <td className="py-4 px-6">
                                    <span className="font-medium text-gray-900">{formatCurrency(truck.totalSparePartsCost)}</span>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-900">
                                    {formatDate(truck.lastServiceDate)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                        <button
                            onClick={() => setActiveTab('trucks')}
                            className="bg-orange-600 !text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2"
                        >
                            <Truck className="h-4 w-4" />
                            View Trucks
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Invoice ID</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Truck Unit</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Client</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Amount</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Fuel Cost</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Miles</th>
                            <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
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
                                    <div className="flex items-center">
                                        <Truck className="h-4 w-4 text-orange-500 mr-2" />
                                        <span className="font-mono text-sm font-medium">{invoice.unitNumber}</span>
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
                                    <span className="font-medium text-red-600">{formatCurrency(invoice.fuelExpenses)}</span>
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-900">
                                    {invoice.milesCovered.toLocaleString()}
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                    </span>
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

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Invoice ID</label>
                                    <p className="font-mono text-sm">{selectedInvoice._id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Client</label>
                                    <p className="font-medium">{selectedInvoice.clientName}</p>
                                    <p className="text-sm text-gray-600">{selectedInvoice.clientEmail}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Amount</label>
                                    <p className="text-lg font-bold">{formatCurrency(selectedInvoice.amount)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                                        {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Truck & Performance Data</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Truck Unit</label>
                                    <p className="font-mono font-medium">{selectedInvoice.unitNumber}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Miles Covered</label>
                                    <p className="font-medium">{selectedInvoice.milesCovered.toLocaleString()} miles</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Fuel Expenses</label>
                                    <p className="font-medium text-red-600">{formatCurrency(selectedInvoice.fuelExpenses)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Services Performed</label>
                                    <div className="mt-1">
                                        {selectedInvoice.servicesPerformed.length > 0 ? (
                                            selectedInvoice.servicesPerformed.map((service, index) => (
                                                <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-1">
                                                    {service}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500">No services performed</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {selectedInvoice.spareParts.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Spare Parts Used</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border border-gray-200 rounded-md">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Part Name</th>
                                            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Quantity</th>
                                            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Unit Cost</th>
                                            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Total Cost</th>
                                            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Supplier</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {selectedInvoice.spareParts.map((part, index) => (
                                            <tr key={index}>
                                                <td className="py-2 px-4 text-sm">{part.partName}</td>
                                                <td className="py-2 px-4 text-sm">{part.quantity}</td>
                                                <td className="py-2 px-4 text-sm">{formatCurrency(part.cost)}</td>
                                                <td className="py-2 px-4 text-sm font-medium">{formatCurrency(part.cost * part.quantity)}</td>
                                                <td className="py-2 px-4 text-sm">{part.supplier}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Invoice Date</label>
                                <p className="text-sm">{formatDate(selectedInvoice.invoiceDate)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Due Date</label>
                                <p className="text-sm">{formatDate(selectedInvoice.dueDate)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Payment Date</label>
                                <p className="text-sm">
                                    {selectedInvoice.paymentDate ? formatDate(selectedInvoice.paymentDate) : 'Not paid'}
                                </p>
                            </div>
                        </div>
                        
                        {selectedInvoice.notes && (
                            <div className="mt-4">
                                <label className="text-sm font-medium text-gray-500">Notes</label>
                                <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedInvoice.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const InvoiceEdit: React.FC = () => {
        if (!selectedInvoice) return null;

        const [editForm, setEditForm] = useState<Invoice>({ ...selectedInvoice });

        const handleInputChange = (field: keyof Invoice, value: string | number) => {
            setEditForm(prev => ({
                ...prev,
                [field]: value
            }));
        };

        const handleSave = () => {
            // Here you would typically make an API call to update the invoice
            console.log('Saving invoice:', editForm);
            setActiveTab('view');
        };

        return (
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Edit Invoice</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActiveTab('view')}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 !text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                                <input
                                    type="text"
                                    value={editForm.clientName}
                                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                                <input
                                    type="email"
                                    value={editForm.clientEmail}
                                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.amount}
                                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Miles Covered</label>
                                <input
                                    type="number"
                                    value={editForm.milesCovered}
                                    onChange={(e) => handleInputChange('milesCovered', parseInt(e.target.value) || 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Expenses</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.fuelExpenses}
                                    onChange={(e) => handleInputChange('fuelExpenses', parseFloat(e.target.value) || 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={editForm.dueDate.split('T')[0]}
                                    onChange={(e) => handleInputChange('dueDate', e.target.value + 'T00:00:00Z')}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {editForm.status === 'paid' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                                    <input
                                        type="date"
                                        value={editForm.paymentDate ? editForm.paymentDate.split('T')[0] : ''}
                                        onChange={(e) => handleInputChange('paymentDate', e.target.value ? e.target.value + 'T00:00:00Z' : null)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={editForm.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            rows={4}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>
        );
    };

    const CreateInvoice: React.FC = () => {
        const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
            clientName: '',
            clientEmail: '',
            clientCompany: '',
            loadId: '',
            truckId: '',
            unitNumber: '',
            amount: 0,
            currency: 'USD',
            status: 'pending',
            invoiceDate: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
            dueDate: '',
            notes: '',
            milesCovered: 0,
            fuelExpenses: 0,
            servicesPerformed: [],
            spareParts: []
        });

        const handleInputChange = (field: keyof Invoice, value: string | number) => {
            setNewInvoice(prev => ({
                ...prev,
                [field]: value
            }));
        };

        const handleCreate = () => {
            // Here you would typically make an API call to create the invoice
            console.log('Creating invoice:', newInvoice);
            setActiveTab('list');
        };

        return (
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold !text-gray-900">Create New Invoice</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActiveTab('list')}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="bg-green-600 !text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Create Invoice
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                                <input
                                    type="text"
                                    value={newInvoice.clientName || ''}
                                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Email *</label>
                                <input
                                    type="email"
                                    value={newInvoice.clientEmail || ''}
                                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Company</label>
                                <input
                                    type="text"
                                    value={newInvoice.clientCompany || ''}
                                    onChange={(e) => handleInputChange('clientCompany', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newInvoice.amount || 0}
                                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Truck Unit Number *</label>
                                <input
                                    type="text"
                                    value={newInvoice.unitNumber || ''}
                                    onChange={(e) => handleInputChange('unitNumber', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., T-001"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Miles Covered</label>
                                <input
                                    type="number"
                                    value={newInvoice.milesCovered || 0}
                                    onChange={(e) => handleInputChange('milesCovered', parseInt(e.target.value) || 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Expenses</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newInvoice.fuelExpenses || 0}
                                    onChange={(e) => handleInputChange('fuelExpenses', parseFloat(e.target.value) || 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                                <input
                                    type="date"
                                    value={newInvoice.dueDate ? newInvoice.dueDate.split('T')[0] : ''}
                                    onChange={(e) => handleInputChange('dueDate', e.target.value + 'T00:00:00Z')}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={newInvoice.notes || ''}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            rows={4}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add any additional notes about this delivery..."
                        />
                    </div>
                </div>
            </div>
        );
    };

    // Main render function
    const renderContent = () => {
        switch (activeTab) {
            case 'view':
                return <InvoiceView />;
            case 'edit':
                return <InvoiceEdit />;
            case 'create':
                return <CreateInvoice />;
            case 'trucks':
                return <TrucksOverview />;
            default:
                return (
                    <>
                        <DashboardOverview />
                        <InvoiceList />
                    </>
                );
        }
    };

    return (
        <div className="min-h-screen  p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
                            <p className="mt-2 text-gray-600">Manage invoices, track payments, and monitor truck performance</p>
                        </div>
                        {activeTab === 'list' && (
                            <div className="mt-4 sm:mt-0">
                                <button
                                    onClick={() => setActiveTab('create')}
                                    className="bg-blue-600 !text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Invoice
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {renderContent()}
            </div>
        </div>
    );
};

export default InvoiceManagement;