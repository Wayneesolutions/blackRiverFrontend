import React, { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Edit, Download, Filter, Calendar, DollarSign, Users, TrendingUp, Truck, Fuel, Wrench, MapPin, Trash2 } from 'lucide-react';
import { createInvoice, listInvoices, getInvoiceById, updateInvoice, deleteInvoice, listLoad } from "../../../../axios/api/account.invoices";

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
    updatedAt: string;
}

interface Load {
    _id: string;
    loadNumber?: string;
    pickupLocation?: string;
    deliveryLocation?: string;
    customer?: {
        name?: string;
        email?: string;
        company?: string;
    };
    [key: string]: any;
}

type TabType = 'list' | 'view' | 'edit' | 'create';
type StatusFilter = 'all' | 'paid' | 'pending';

const InvoiceManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('list');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loads, setLoads] = useState<Load[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInvoices();
        fetchLoads();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await listInvoices();
            if (response && response.data) {
                setInvoices(response.data);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLoads = async () => {
        try {
            const response = await listLoad();
            if (response && response.data) {
                setLoads(response.data);
            }
        } catch (error) {
            console.error('Error fetching loads:', error);
        }
    };

    const filteredInvoices = statusFilter === 'all'
        ? invoices
        : invoices.filter(invoice => invoice.status === statusFilter);

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

    const calculateStats = () => {
        const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0);
        const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + Number(inv.amount), 0);
        const paidCount = invoices.filter(inv => inv.status === 'paid').length;
        const pendingCount = invoices.filter(inv => inv.status === 'pending').length;

        return { totalAmount, paidAmount, pendingAmount, paidCount, pendingCount };
    };

    const stats = calculateStats();

    const DashboardOverview: React.FC = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(stats.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-400">{invoices.length} invoices</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Paid</p>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(stats.paidAmount)}
                        </p>
                        <p className="text-xs text-gray-400">{stats.paidCount} invoices</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {formatCurrency(stats.pendingAmount)}
                        </p>
                        <p className="text-xs text-gray-400">{stats.pendingCount} invoices</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                        <Calendar className="h-6 w-6 text-yellow-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Collection Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {stats.totalAmount > 0 ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-xs text-gray-400">Payment efficiency</p>
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
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading invoices...</div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No invoices found</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Invoice ID</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Client</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Company</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Amount</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Due Date</th>
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
                                        <div>
                                            <div className="font-medium text-gray-900">{invoice.clientName}</div>
                                            <div className="text-sm text-gray-500">{invoice.clientEmail}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-900">
                                        {invoice.clientCompany || '-'}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="font-medium text-gray-900">{formatCurrency(Number(invoice.amount))}</span>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-900">
                                        {formatDate(invoice.dueDate)}
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
                                                onClick={async () => {
                                                    if (window.confirm('Are you sure you want to delete this invoice?')) {
                                                        try {
                                                            await deleteInvoice(invoice._id);
                                                            alert('Invoice deleted successfully');
                                                            fetchInvoices();
                                                        } catch (error) {
                                                            alert('Failed to delete invoice');
                                                        }
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Delete Invoice"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
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
                                    <label className="text-sm font-medium text-gray-500">Company</label>
                                    <p className="font-medium">{selectedInvoice.clientCompany || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Amount</label>
                                    <p className="text-lg font-bold">{formatCurrency(Number(selectedInvoice.amount))}</p>
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
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                            <div className="space-y-3">
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
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Load ID</label>
                                    <p className="font-mono text-sm">{selectedInvoice.loadId || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {selectedInvoice.notes && (
                        <div className="mt-6">
                            <label className="text-sm font-medium text-gray-500">Notes</label>
                            <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedInvoice.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const InvoiceEdit: React.FC = () => {
        if (!selectedInvoice) return null;

        const [editForm, setEditForm] = useState<Invoice>({ ...selectedInvoice });

        const handleInputChange = (field: keyof Invoice, value: any) => {
            setEditForm(prev => ({
                ...prev,
                [field]: value
            }));
        };

        const handleSave = async () => {
            setLoading(true);
            try {
                const updateData = {
                    clientName: editForm.clientName,
                    clientEmail: editForm.clientEmail,
                    clientCompany: editForm.clientCompany,
                    loadId: editForm.loadId,
                    amount: editForm.amount.toString(),
                    currency: editForm.currency,
                    status: editForm.status,
                    dueDate: editForm.dueDate,
                    paymentDate: editForm.paymentDate,
                    notes: editForm.notes
                };

                const response = await updateInvoice(editForm._id, updateData);
                if (response && response.success) {
                    alert('Invoice updated successfully');
                    await fetchInvoices();
                    setSelectedInvoice(editForm);
                    setActiveTab('view');
                } else {
                    alert('Failed to update invoice');
                }
            } catch (error) {
                alert('Failed to update invoice');
            } finally {
                setLoading(false);
            }
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
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Company</label>
                                <input
                                    type="text"
                                    value={editForm.clientCompany}
                                    onChange={(e) => handleInputChange('clientCompany', e.target.value)}
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
                        </div>

                        <div className="space-y-4">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Load ID</label>
                                <input
                                    type="text"
                                    value={editForm.loadId}
                                    onChange={(e) => handleInputChange('loadId', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
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
        const [newInvoice, setNewInvoice] = useState({
            clientName: '',
            clientEmail: '',
            clientCompany: '',
            loadId: '',
            amount: '',
            currency: 'USD',
            dueDate: '',
            notes: ''
        });

        const handleInputChange = (field: string, value: string) => {
            setNewInvoice(prev => ({
                ...prev,
                [field]: value
            }));
        };

        const handleLoadSelect = (loadId: string) => {
            const selectedLoad = loads.find(load => load._id === loadId);
            if (selectedLoad && selectedLoad.customer) {
                setNewInvoice(prev => ({
                    ...prev,
                    loadId: loadId,
                    clientName: selectedLoad.customer?.name || prev.clientName,
                    clientEmail: selectedLoad.customer?.email || prev.clientEmail,
                    clientCompany: selectedLoad.customer?.company || prev.clientCompany,
                }));
            } else {
                setNewInvoice(prev => ({
                    ...prev,
                    loadId: loadId
                }));
            }
        };

        const handleCreate = async () => {
            if (!newInvoice.clientName || !newInvoice.amount || !newInvoice.dueDate) {
                alert('Please fill in all required fields: Client Name, Amount, and Due Date');
                return;
            }

            setLoading(true);
            try {
                const response = await createInvoice(newInvoice);
                if (response && response.success) {
                    alert('Invoice created successfully');
                    await fetchInvoices();
                    setActiveTab('list');
                    setNewInvoice({
                        clientName: '',
                        clientEmail: '',
                        clientCompany: '',
                        loadId: '',
                        amount: '',
                        currency: 'USD',
                        dueDate: '',
                        notes: ''
                    });
                } else {
                    alert(response?.message || 'Failed to create invoice');
                }
            } catch (error) {
                console.error('Create invoice error:', error);
                alert('Failed to create invoice');
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Create New Invoice</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActiveTab('list')}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                            >
                                <Plus className="h-4 w-4" />
                                {loading ? 'Creating...' : 'Create Invoice'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Load (Optional)
                                </label>
                                <select
                                    value={newInvoice.loadId}
                                    onChange={(e) => handleLoadSelect(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select a load...</option>
                                    {loads.map((load) => (
                                        <option key={load._id || load.id || Math.random()} value={load._id || load.id || ''}>
                                            {load.loadNumber
                                                ? load.loadNumber
                                                : (load._id || load.id)
                                                    ? (load._id || load.id).slice(-8)
                                                    : 'Unknown Load'}{" "}
                                            - {load.pickupLocation || "N/A"} → {load.deliveryLocation || "N/A"}
                                        </option>
                                    ))}
                                </select>

                                <p className="text-xs text-gray-500 mt-1">
                                    Selecting a load will auto-fill customer details if available
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                                <input
                                    type="text"
                                    value={newInvoice.clientName}
                                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter client name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                                <input
                                    type="email"
                                    value={newInvoice.clientEmail}
                                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="client@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Company</label>
                                <input
                                    type="text"
                                    value={newInvoice.clientCompany}
                                    onChange={(e) => handleInputChange('clientCompany', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Company name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newInvoice.amount}
                                    onChange={(e) => handleInputChange('amount', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                <select
                                    value={newInvoice.currency}
                                    onChange={(e) => handleInputChange('currency', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                    <option value="CAD">CAD - Canadian Dollar</option>
                                    <option value="AUD">AUD - Australian Dollar</option>
                                    <option value="INR">INR - Indian Rupee</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                                <input
                                    type="date"
                                    value={newInvoice.dueDate}
                                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={newInvoice.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    rows={8}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Add any additional notes or details about this invoice..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'view':
                return <InvoiceView />;
            case 'edit':
                return <InvoiceEdit />;
            case 'create':
                return <CreateInvoice />;
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
                            <p className="mt-2 text-gray-600">Manage invoices, track payments, and monitor revenue</p>
                        </div>
                        {activeTab === 'list' && (
                            <div className="mt-4 sm:mt-0">
                                <button
                                    onClick={() => setActiveTab('create')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
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