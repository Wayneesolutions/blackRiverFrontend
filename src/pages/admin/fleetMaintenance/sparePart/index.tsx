import { useState, useEffect, useRef } from 'react';
import { FaEllipsisH, FaPlus, FaEdit, FaTrash, FaEye, FaTimes, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaSearch, FaBox, FaHistory, FaExclamationTriangle } from 'react-icons/fa';
import { getAllSpareParts, createSparePart, useSparePart } from '../../../../axios/api/fleet.spareparts';
import { getAllWorkOrders } from '../../../../axios/api/fleet.workorder';

// Types matching backend schema
interface VehicleId {
    _id: string;
    licensePlate: string;
    make: string;
    model: string;
}

interface WorkOrderId {
    _id: string;
    issue: string;
    vehicleId?: VehicleId;
}

interface UsageHistory {
    workOrderId: WorkOrderId | string;
    usedOn: string;
    qtyUsed: number;
    _id?: string;
}

interface SparePart {
    _id: string;
    partName: string;
    stockQty: number;
    createdAt: string;
    updatedAt: string;
    usageHistory: UsageHistory[];
}

interface WorkOrder {
    _id: string;
    issue: string;
    vehicleId?: VehicleId;
    status?: string;
}

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
    id: number;
    type: NotificationType;
    message: string;
}

const Notification = ({ notification, onClose }: { notification: Notification; onClose: (id: number) => void }) => {
    const icons = {
        success: <FaCheckCircle className="text-green-500" size={24} />,
        error: <FaExclamationCircle className="text-red-500" size={24} />,
        info: <FaInfoCircle className="text-[#9793E4]" size={24} />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-[#9793E4]/10 border-[#9793E4]/30'
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(notification.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    return (
        <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in`}>
            <div className="flex-shrink-0 mt-0.5">
                {icons[notification.type]}
            </div>
            <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
            <button
                onClick={() => onClose(notification.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <FaTimes size={16} />
            </button>
        </div>
    );
};

const SparePartsInventory = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showUsageModal, setShowUsageModal] = useState<boolean>(false);
    const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
    const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
    const [spareParts, setSpareParts] = useState<SparePart[]>([]);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingWorkOrders, setLoadingWorkOrders] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const newPartRef = useRef({ partName: '', stockQty: '' });
    const usageDataRef = useRef({ workOrderId: '', qtyUsed: '' });

    const addNotification = (type: NotificationType, message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const fetchSpareParts = async () => {
        setLoading(true);
        try {
            const res = await getAllSpareParts();
            if (res?.success) {
                setSpareParts(res.data || []);
            } else {
                addNotification('error', res?.message || 'Failed to fetch spare parts');
                setSpareParts([]);
            }
        } catch (err: any) {
            console.error("Error fetching spare parts:", err);
            addNotification('error', err?.message || 'Failed to fetch spare parts');
            setSpareParts([]);
        }
        setLoading(false);
    };

    const fetchWorkOrders = async () => {
        setLoadingWorkOrders(true);
        try {
            const res = await getAllWorkOrders();
            if (res?.success) {
                setWorkOrders(res.data || []);
            } else {
                addNotification('error', res?.message || 'Failed to fetch work orders');
                setWorkOrders([]);
            }
        } catch (err: any) {
            console.error("Error fetching work orders:", err);
            addNotification('error', err?.message || 'Failed to fetch work orders');
            setWorkOrders([]);
        }
        setLoadingWorkOrders(false);
    };

    useEffect(() => {
        fetchSpareParts();
        fetchWorkOrders();
    }, []);

    const filteredParts = spareParts.filter(part =>
        part.partName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddPart = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = newPartRef.current;

        if (!formData.partName || !formData.stockQty) {
            addNotification('error', 'Please fill all required fields');
            return;
        }

        setSubmitting(true);

        const data = {
            partName: formData.partName,
            stockQty: parseInt(formData.stockQty)
        };

        try {
            const res = await createSparePart(data);
            if (res?.success) {
                addNotification('success', res.message || 'Spare part added successfully');
                setShowAddModal(false);
                newPartRef.current = { partName: '', stockQty: '' };
                fetchSpareParts();
            } else {
                addNotification('error', res?.message || 'Failed to add spare part');
            }
        } catch (err: any) {
            addNotification('error', err?.message || 'Error adding spare part');
        }

        setSubmitting(false);
    };

    const handleUsePart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPart) return;

        const formData = usageDataRef.current;

        if (!formData.workOrderId || !formData.qtyUsed) {
            addNotification('error', 'Please fill all required fields');
            return;
        }

        const qtyUsed = parseInt(formData.qtyUsed);
        if (qtyUsed <= 0) {
            addNotification('error', 'Quantity must be greater than 0');
            return;
        }

        if (selectedPart.stockQty < qtyUsed) {
            addNotification('error', `Not enough stock! Available: ${selectedPart.stockQty} units`);
            return;
        }

        setSubmitting(true);

        const data = {
            workOrderId: formData.workOrderId,
            qtyUsed: qtyUsed
        };

        try {
            const res = await useSparePart(selectedPart._id, data);
            if (res?.success) {
                addNotification('success', res.message || 'Part used successfully');
                setShowUsageModal(false);
                setSelectedPart(null);
                usageDataRef.current = { workOrderId: '', qtyUsed: '' };
                fetchSpareParts();
            } else {
                addNotification('error', res?.message || 'Failed to use part');
            }
        } catch (err: any) {
            addNotification('error', err?.message || 'Error using part');
        }

        setSubmitting(false);
    };

    const handleDeletePart = (partId: string): void => {
        if (window.confirm('Are you sure you want to delete this part?')) {
            addNotification('info', 'Delete functionality will be implemented with API');
        }
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "Invalid Date";
        }
    };

    const getStockStatus = (stockQty: number) => {
        if (stockQty <= 5) return { status: 'Low Stock', color: 'text-red-600 bg-red-50' };
        if (stockQty <= 15) return { status: 'Medium Stock', color: 'text-yellow-600 bg-yellow-50' };
        return { status: 'Good Stock', color: 'text-green-600 bg-green-50' };
    };

    const getWorkOrderDetails = (usage: UsageHistory) => {
        if (typeof usage.workOrderId === 'object' && usage.workOrderId !== null) {
            return {
                issue: usage.workOrderId.issue || 'N/A',
                vehicle: usage.workOrderId.vehicleId
                    ? `${usage.workOrderId.vehicleId.licensePlate} - ${usage.workOrderId.vehicleId.make} ${usage.workOrderId.vehicleId.model}`
                    : 'N/A'
            };
        }
        return { issue: 'N/A', vehicle: 'N/A' };
    };

    const ActionDropdown = ({ part }: { part: SparePart }) => {
        const [showDropdown, setShowDropdown] = useState(false);

        return (
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    title="More actions"
                >
                    <FaEllipsisH size={16} />
                </button>

                {showDropdown && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowDropdown(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                                onClick={() => {
                                    setSelectedPart(part);
                                    usageDataRef.current = { workOrderId: '', qtyUsed: '' };
                                    setShowUsageModal(true);
                                    setShowDropdown(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm !text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <FaEdit size={14} className="text-orange-600" />
                                Use Part
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedPart(part);
                                    setShowDetailsModal(true);
                                    setShowDropdown(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <FaEye size={14} className="text-green-600" />
                                View Details
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                                onClick={() => {
                                    handleDeletePart(part._id);
                                    setShowDropdown(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Delete Part
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            {/* Notifications Container */}
            <div className="fixed top-4 right-4 z-[200] space-y-3 max-w-md">
                {notifications.map(notification => (
                    <Notification
                        key={notification.id}
                        notification={notification}
                        onClose={removeNotification}
                    />
                ))}
            </div>

            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <FaBox className="text-[#9793E4]" />
                            Spare Parts Inventory
                        </h1>
                        <p className="text-gray-600 mt-2">Manage spare parts stock and track usage history</p>
                    </div>
                    <button
                        onClick={() => {
                            newPartRef.current = { partName: '', stockQty: '' };
                            setShowAddModal(true);
                        }}
                        className="flex items-center gap-2 px-5 py-3 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] shadow-lg hover:shadow-xl transition-all font-medium"
                    >
                        <FaPlus /> Add New Part
                    </button>
                </div>
            </div>

            {/* Search and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                <div className="lg:col-span-1">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search spare parts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="lg:col-span-3 grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">{spareParts.length}</div>
                        <div className="text-gray-600 text-sm">Total Parts</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-red-600">
                            {spareParts.filter(part => part.stockQty <= 5).length}
                        </div>
                        <div className="text-gray-600 text-sm">Low Stock Items</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-[#9793E4]">
                            {spareParts.reduce((total, part) => total + part.stockQty, 0)}
                        </div>
                        <div className="text-gray-600 text-sm">Total Stock</div>
                    </div>
                </div>
            </div>

            {/* Parts Table */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#9793E4] mx-auto mb-4"></div>
                    <p className="text-gray-500 text-lg">Loading spare parts...</p>
                </div>
            ) : filteredParts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <FaBox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Spare Parts Found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm
                            ? 'No parts match your search.'
                            : 'Get started by adding your first spare part.'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => {
                                newPartRef.current = { partName: '', stockQty: '' };
                                setShowAddModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-[#9793E4] text-white rounded-lg hover:bg-[#8783D4] transition-all font-medium shadow-md"
                        >
                            <FaPlus />
                            Add First Spare Part
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Part Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Stock Quantity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Stock Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Usage History
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Last Updated
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredParts.map((part) => {
                                    const stockStatus = getStockStatus(part.stockQty);
                                    return (
                                        <tr key={part._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">{part.partName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{part.stockQty} units</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                                                    {stockStatus.status}
                                                </span>
                                                {part.stockQty <= 5 && (
                                                    <FaExclamationTriangle className="inline ml-2 text-red-500" size={16} />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {part.usageHistory?.length || 0} work orders
                                                </div>
                                                {part.usageHistory && part.usageHistory.length > 0 && (
                                                    <div className="text-sm text-gray-500">
                                                        Total used: {part.usageHistory.reduce((total, usage) => total + usage.qtyUsed, 0)} units
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(part.updatedAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPart(part);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="p-2.5 text-[#9793E4] hover:bg-[#9793E4]/10 rounded-lg transition-all border border-[#9793E4]/30"
                                                        title="View Details"
                                                    >
                                                        <FaEye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPart(part);
                                                            usageDataRef.current = { workOrderId: '', qtyUsed: '' };
                                                            setShowUsageModal(true);
                                                        }}
                                                        className="p-2.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all border border-yellow-200"
                                                        title="Use Part"
                                                    >
                                                        <FaEdit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePart(part._id)}
                                                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-200"
                                                        title="Delete"
                                                    >
                                                        <FaTrash size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Usage History Section */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaHistory className="text-[#9793E4]" />
                    Recent Usage History
                </h2>
                <div className="space-y-4">
                    {spareParts
                        .flatMap(part =>
                            (part.usageHistory || []).map(usage => ({ ...usage, partName: part.partName }))
                        )
                        .sort((a, b) => new Date(b.usedOn).getTime() - new Date(a.usedOn).getTime())
                        .slice(0, 10)
                        .map((usage, index) => {
                            const details = getWorkOrderDetails(usage);
                            return (
                                <div key={index} className="border-l-4 border-[#9793E4] pl-4 py-2 bg-gray-50 rounded-r-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {usage.partName} - {usage.qtyUsed} units used
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Work Order: {details.issue}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Vehicle: {details.vehicle}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {formatDate(usage.usedOn)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    {spareParts.flatMap(part => part.usageHistory || []).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No usage history available yet
                        </div>
                    )}
                </div>
            </div>

            {/* Add Part Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Spare Part</h3>
                        <form onSubmit={handleAddPart} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Part Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    defaultValue={newPartRef.current.partName}
                                    onChange={(e) => newPartRef.current.partName = e.target.value}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter part name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stock Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    defaultValue={newPartRef.current.stockQty}
                                    onChange={(e) => newPartRef.current.stockQty = e.target.value}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter quantity"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2  bg-[#9793E4] !text-white !ml-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Adding...' : 'Add Part'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Use Part Modal */}
            {showUsageModal && selectedPart && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            Use Part: {selectedPart.partName}
                        </h3>
                        <div className="mb-4 p-3 bg-[#9793E4]/10 rounded-lg border border-[#9793E4]/30">
                            <div className="text-sm text-gray-600">
                                Current Stock: <span className="font-semibold text-gray-900">{selectedPart.stockQty} units</span>
                            </div>
                        </div>
                        <form onSubmit={handleUsePart} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Work Order <span className="text-red-500">*</span>
                                </label>
                                {loadingWorkOrders ? (
                                    <div className="text-sm text-gray-500 py-2">Loading work orders...</div>
                                ) : (
                                    <select
                                        defaultValue={usageDataRef.current.workOrderId}
                                        onChange={(e) => usageDataRef.current.workOrderId = e.target.value}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                                        required
                                    >
                                        <option value="">Select Work Order</option>
                                        {workOrders.map(wo => (
                                            <option key={wo._id} value={wo._id}>
                                                {wo.issue} {wo.vehicleId ? `- ${wo.vehicleId.licensePlate}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Quantity Used <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    defaultValue={usageDataRef.current.qtyUsed}
                                    onChange={(e) => usageDataRef.current.qtyUsed = e.target.value}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                                    placeholder="Enter quantity used"
                                    min="1"
                                    max={selectedPart.stockQty}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUsageModal(false);
                                        setSelectedPart(null);
                                    }}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#9793E4] !text-white !ml-3 rounded-lg hover:bg-[#8783D4] disabled:bg-[#9793E4]/50 disabled:cursor-not-allowed font-medium transition-colors shadow-md"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Processing...' : 'Use Part'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Part Details Modal */}
            {showDetailsModal && selectedPart && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">
                                    Part Details: {selectedPart.partName}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedPart(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <FaTimes className="text-gray-500" size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-gradient-to-r from-[#9793E4] via-[#8783D4] to-[#7773C4] rounded-xl p-6 text-white">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm opacity-80">Current Stock</label>
                                        <p className="text-2xl font-bold">{selectedPart.stockQty} units</p>
                                    </div>
                                    <div>
                                        <label className="text-sm opacity-80">Total Usage</label>
                                        <p className="text-2xl font-bold">
                                            {selectedPart.usageHistory?.reduce((total, usage) => total + usage.qtyUsed, 0) || 0} units
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <div className="text-sm text-gray-600">Work Orders</div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {selectedPart.usageHistory?.length || 0}
                                    </div>
                                </div>
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <div className="text-sm text-gray-600">Stock Status</div>
                                    <div className={`text-lg font-bold ${getStockStatus(selectedPart.stockQty).color.split(' ')[0]}`}>
                                        {getStockStatus(selectedPart.stockQty).status}
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-5">
                                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FaHistory className="text-[#9793E4]" size={20} />
                                    Usage History
                                </h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {selectedPart.usageHistory && selectedPart.usageHistory.length > 0 ? (
                                        selectedPart.usageHistory
                                            .sort((a, b) => new Date(b.usedOn).getTime() - new Date(a.usedOn).getTime())
                                            .map((usage, index) => {
                                                const details = getWorkOrderDetails(usage);
                                                return (
                                                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-sm font-semibold text-gray-700">Update #{index + 1}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(usage.usedOn)}
                                                            </span>
                                                        </div>
                                                        <div className="font-medium text-gray-900">
                                                            {usage.qtyUsed} units used
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            Work Order: {details.issue}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Vehicle: {details.vehicle}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                            <FaHistory className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                            <p>No usage history available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600 font-medium">Created:</span>
                                        <span className="ml-2 text-gray-900">{formatDate(selectedPart.createdAt)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 font-medium">Last Updated:</span>
                                        <span className="ml-2 text-gray-900">{formatDate(selectedPart.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedPart(null);
                                    }}
                                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default SparePartsInventory;