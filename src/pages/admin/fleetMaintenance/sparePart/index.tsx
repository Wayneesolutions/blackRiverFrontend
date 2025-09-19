import { useState } from 'react';
import { Search, Plus, Package, History, AlertTriangle, Edit, Eye, Minus, MoreHorizontal } from 'lucide-react';

// Define types for better TypeScript support
interface VehicleId {
    _id: string;
    licensePlate: string;
    make: string;
    model: string;
}

interface WorkOrderId {
    _id: string;
    issue: string;
    vehicleId: VehicleId;
}

interface UsageHistory {
    workOrderId: WorkOrderId;
    usedOn: string;
    qtyUsed: number;
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
}

interface NewPart {
    partName: string;
    stockQty: string;
}

interface UsageData {
    workOrderId: string;
    qtyUsed: string;
}

const SparePartsInventory = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showUsageModal, setShowUsageModal] = useState<boolean>(false);
    const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
    const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
    const [newPart, setNewPart] = useState<NewPart>({ partName: '', stockQty: '' });
    const [usageData, setUsageData] = useState<UsageData>({ workOrderId: '', qtyUsed: '' });

    // Static data matching backend schema
    const [spareParts, setSpareParts] = useState<SparePart[]>([
        {
            _id: '1',
            partName: 'Brake Pads',
            stockQty: 25,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-20T14:22:00Z',
            usageHistory: [
                {
                    workOrderId: {
                        _id: 'wo1',
                        issue: 'Brake System Check',
                        vehicleId: {
                            _id: 'v1',
                            licensePlate: 'ABC-123',
                            make: 'Ford',
                            model: 'Transit'
                        }
                    },
                    usedOn: '2024-01-18T09:15:00Z',
                    qtyUsed: 2
                },
                {
                    workOrderId: {
                        _id: 'wo5',
                        issue: 'Front Brake Replacement',
                        vehicleId: {
                            _id: 'v3',
                            licensePlate: 'XYZ-789',
                            make: 'Mercedes',
                            model: 'Sprinter'
                        }
                    },
                    usedOn: '2024-01-10T11:30:00Z',
                    qtyUsed: 4
                }
            ]
        },
        {
            _id: '2',
            partName: 'Oil Filter',
            stockQty: 50,
            createdAt: '2024-01-10T08:00:00Z',
            updatedAt: '2024-01-25T16:45:00Z',
            usageHistory: [
                {
                    workOrderId: {
                        _id: 'wo2',
                        issue: 'Regular Oil Change',
                        vehicleId: {
                            _id: 'v2',
                            licensePlate: 'DEF-456',
                            make: 'Volvo',
                            model: 'FH16'
                        }
                    },
                    usedOn: '2024-01-22T14:00:00Z',
                    qtyUsed: 1
                }
            ]
        },
        {
            _id: '3',
            partName: 'Air Filter',
            stockQty: 8,
            createdAt: '2024-01-05T12:20:00Z',
            updatedAt: '2024-01-28T10:10:00Z',
            usageHistory: [
                {
                    workOrderId: {
                        _id: 'wo3',
                        issue: 'Engine Maintenance',
                        vehicleId: {
                            _id: 'v1',
                            licensePlate: 'ABC-123',
                            make: 'Ford',
                            model: 'Transit'
                        }
                    },
                    usedOn: '2024-01-25T08:30:00Z',
                    qtyUsed: 1
                },
                {
                    workOrderId: {
                        _id: 'wo6',
                        issue: 'Air System Service',
                        vehicleId: {
                            _id: 'v4',
                            licensePlate: 'LMN-321',
                            make: 'Scania',
                            model: 'R450'
                        }
                    },
                    usedOn: '2024-01-20T13:45:00Z',
                    qtyUsed: 2
                }
            ]
        },
        {
            _id: '4',
            partName: 'Tire 295/80R22.5',
            stockQty: 12,
            createdAt: '2024-01-08T15:30:00Z',
            updatedAt: '2024-01-26T09:20:00Z',
            usageHistory: [
                {
                    workOrderId: {
                        _id: 'wo4',
                        issue: 'Tire Replacement',
                        vehicleId: {
                            _id: 'v2',
                            licensePlate: 'DEF-456',
                            make: 'Volvo',
                            model: 'FH16'
                        }
                    },
                    usedOn: '2024-01-24T10:15:00Z',
                    qtyUsed: 2
                }
            ]
        },
        {
            _id: '5',
            partName: 'Spark Plugs',
            stockQty: 3,
            createdAt: '2024-01-12T11:00:00Z',
            updatedAt: '2024-01-29T12:30:00Z',
            usageHistory: [
                {
                    workOrderId: {
                        _id: 'wo7',
                        issue: 'Engine Tune-up',
                        vehicleId: {
                            _id: 'v5',
                            licensePlate: 'GHI-654',
                            make: 'Isuzu',
                            model: 'NPR'
                        }
                    },
                    usedOn: '2024-01-27T15:20:00Z',
                    qtyUsed: 4
                }
            ]
        },
        {
            _id: '6',
            partName: 'Windshield Wipers',
            stockQty: 18,
            createdAt: '2024-01-03T09:45:00Z',
            updatedAt: '2024-01-15T14:50:00Z',
            usageHistory: []
        }
    ]);

    const workOrders: WorkOrder[] = [
        { _id: 'wo1', issue: 'Brake System Check' },
        { _id: 'wo2', issue: 'Regular Oil Change' },
        { _id: 'wo3', issue: 'Engine Maintenance' },
        { _id: 'wo4', issue: 'Tire Replacement' },
        { _id: 'wo5', issue: 'Front Brake Replacement' },
        { _id: 'wo6', issue: 'Air System Service' },
        { _id: 'wo7', issue: 'Engine Tune-up' }
    ];

    const filteredParts = spareParts.filter(part =>
        part.partName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddPart = (): void => {
        if (newPart.partName && newPart.stockQty) {
            const part: SparePart = {
                _id: Date.now().toString(),
                partName: newPart.partName,
                stockQty: parseInt(newPart.stockQty),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                usageHistory: []
            };
            setSpareParts([...spareParts, part]);
            setNewPart({ partName: '', stockQty: '' });
            setShowAddModal(false);
        }
    };

    const handleUsePart = (): void => {
        if (selectedPart && usageData.workOrderId && usageData.qtyUsed) {
            const qtyUsed = parseInt(usageData.qtyUsed);
            if (selectedPart.stockQty >= qtyUsed) {
                const updatedParts = spareParts.map(part => {
                    if (part._id === selectedPart._id) {
                        const workOrder = workOrders.find(wo => wo._id === usageData.workOrderId);
                        return {
                            ...part,
                            stockQty: part.stockQty - qtyUsed,
                            updatedAt: new Date().toISOString(),
                            usageHistory: [
                                ...part.usageHistory,
                                {
                                    workOrderId: {
                                        _id: usageData.workOrderId,
                                        issue: workOrder?.issue || 'Unknown Work Order',
                                        vehicleId: {
                                            _id: 'v1',
                                            licensePlate: 'ABC-123',
                                            make: 'Ford',
                                            model: 'Transit'
                                        }
                                    },
                                    usedOn: new Date().toISOString(),
                                    qtyUsed: qtyUsed
                                }
                            ]
                        };
                    }
                    return part;
                });
                setSpareParts(updatedParts);
                setUsageData({ workOrderId: '', qtyUsed: '' });
                setShowUsageModal(false);
            } else {
                alert('Not enough stock available!');
            }
        }
    };

    const handleDeletePart = (partId: string): void => {
        if (window.confirm('Are you sure you want to delete this part?')) {
            setSpareParts(spareParts.filter(part => part._id !== partId));
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStockStatus = (stockQty: number) => {
        if (stockQty <= 5) return { status: 'Low Stock', color: 'text-red-600 bg-red-50' };
        if (stockQty <= 15) return { status: 'Medium Stock', color: 'text-yellow-600 bg-yellow-50' };
        return { status: 'Good Stock', color: 'text-green-600 bg-green-50' };
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
                    <MoreHorizontal size={16} />
                </button>

                {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                            onClick={() => {
                                setSelectedPart(part);
                                setShowUsageModal(true);
                                setShowDropdown(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Edit size={14} className="text-orange-600" />
                            Edit Part
                        </button>
                        <button
                            onClick={() => {
                                setSelectedPart(part);
                                setShowDetailsModal(true);
                                setShowDropdown(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Eye size={14} className="text-green-600" />
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
                )}
            </div>
        );
    };

    return (
        <div className="p-6  min-h-screen">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Package className="text-blue-600" />
                            Spare Parts Inventory
                        </h1>
                        <p className="text-gray-600 mt-2">Manage spare parts stock and track usage history</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 !text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Add New Part
                    </button>
                </div>
            </div>

            {/* Search and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                <div className="lg:col-span-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search spare parts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="lg:col-span-3 grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-gray-900">{spareParts.length}</div>
                        <div className="text-gray-600">Total Parts</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-red-600">
                            {spareParts.filter(part => part.stockQty <= 5).length}
                        </div>
                        <div className="text-gray-600">Low Stock Items</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">
                            {spareParts.reduce((total: number, part) => total + part.stockQty, 0)}
                        </div>
                        <div className="text-gray-600">Total Stock</div>
                    </div>
                </div>
            </div>

            {/* Parts Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Part Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usage History
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Updated
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredParts.map((part) => {
                                const stockStatus = getStockStatus(part.stockQty);
                                return (
                                    <tr key={part._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{part.partName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-gray-900">{part.stockQty} units</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                                                {stockStatus.status}
                                            </span>
                                            {part.stockQty <= 5 && (
                                                <AlertTriangle className="inline ml-2 text-red-500" size={16} />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-gray-900">
                                                {part.usageHistory.length} work orders
                                            </div>
                                            {part.usageHistory.length > 0 && (
                                                <div className="text-sm text-gray-500">
                                                    Total used: {part.usageHistory.reduce((total: number, usage) => total + usage.qtyUsed, 0)} units
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(part.updatedAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <ActionDropdown part={part} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Usage History Section */}
            <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <History className="text-blue-600" />
                    Recent Usage History
                </h2>
                <div className="space-y-4">
                    {spareParts
                        .flatMap(part =>
                            part.usageHistory.map(usage => ({ ...usage, partName: part.partName }))
                        )
                        .sort((a, b) => new Date(b.usedOn).getTime() - new Date(a.usedOn).getTime())
                        .slice(0, 10)
                        .map((usage, index) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {usage.partName} - {usage.qtyUsed} units used
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Work Order: {usage.workOrderId.issue}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Vehicle: {usage.workOrderId.vehicleId?.licensePlate} - {usage.workOrderId.vehicleId?.make} {usage.workOrderId.vehicleId?.model}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {formatDate(usage.usedOn)}
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Add Part Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Spare Part</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Part Name
                                </label>
                                <input
                                    type="text"
                                    value={newPart.partName}
                                    onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter part name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stock Quantity
                                </label>
                                <input
                                    type="number"
                                    value={newPart.stockQty}
                                    onChange={(e) => setNewPart({ ...newPart, stockQty: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter quantity"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 !mr-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddPart}
                                className="px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add Part
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Use Part Modal */}
            {showUsageModal && selectedPart && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Use Part: {selectedPart.partName}
                        </h3>
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">Current Stock: {selectedPart.stockQty} units</div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Work Order
                                </label>
                                <select
                                    value={usageData.workOrderId}
                                    onChange={(e) => setUsageData({ ...usageData, workOrderId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Work Order</option>
                                    {workOrders.map(wo => (
                                        <option key={wo._id} value={wo._id}>
                                            {wo._id} - {wo.issue}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity Used
                                </label>
                                <input
                                    type="number"
                                    value={usageData.qtyUsed}
                                    onChange={(e) => setUsageData({ ...usageData, qtyUsed: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter quantity used"
                                    min="1"
                                    max={selectedPart.stockQty}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowUsageModal(false)}
                                className="px-4 py-2 !mr-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUsePart}
                                className="px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Use Part
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Part Details Modal */}
            {showDetailsModal && selectedPart && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                Part Details: {selectedPart.partName}
                            </h3>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">Current Stock</div>
                                <div className="text-2xl font-bold text-gray-900">{selectedPart.stockQty} units</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">Total Usage</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {selectedPart.usageHistory.reduce((total, usage) => total + usage.qtyUsed, 0)} units
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Usage History</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {selectedPart.usageHistory.length > 0 ? (
                                    selectedPart.usageHistory.map((usage, index) => (
                                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {usage.qtyUsed} units used
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Work Order: {usage.workOrderId.issue}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Vehicle: {usage.workOrderId.vehicleId?.licensePlate} - {usage.workOrderId.vehicleId?.make} {usage.workOrderId.vehicleId?.model}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatDate(usage.usedOn)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        No usage history available
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Created:</span>
                                <span className="ml-2 text-gray-900">{formatDate(selectedPart.createdAt)}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Last Updated:</span>
                                <span className="ml-2 text-gray-900">{formatDate(selectedPart.updatedAt)}</span>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SparePartsInventory;