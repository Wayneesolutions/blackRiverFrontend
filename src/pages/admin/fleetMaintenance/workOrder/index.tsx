import { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Eye,
    Trash2,
    Clock,
    User,
    DollarSign,
    X,
    Calendar,
    FileText,
    Wrench
} from 'lucide-react';

// TypeScript interfaces
interface Vehicle {
    _id: string;
    internalId: string;
    plateNumber: string;
    make: string;
    model: string;
}

interface RepairUpdate {
    time: string;
    note: string;
}

interface WorkOrder {
    _id: string;
    vehicleId: Vehicle;
    issue: string;
    status: 'open' | 'inprogress' | 'completed';
    description: string;
    assignedMechanic: string;
    estimatedCost: number;
    estimatedTime: string;
    repairUpdates: RepairUpdate[];
    createdAt: string;
}

interface CreateForm {
    vehicleId: string;
    issue: string;
    description: string;
    assignedMechanic: string;
    estimatedCost: string;
    estimatedTime: string;
}

interface UpdateForm {
    status: string;
    description: string;
    assignedMechanic: string;
    estimatedCost: string;
    estimatedTime: string;
    repairUpdate: string;
}

const WorkOrdersPage = () => {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
        {
            _id: '1',
            vehicleId: {
                _id: 'v1',
                internalId: 'TRK-001',
                plateNumber: 'ABC-123',
                make: 'Ford',
                model: 'F-150'
            },
            issue: 'Oil Change',
            status: 'open',
            description: 'Regular maintenance oil change required',
            assignedMechanic: 'John Doe',
            estimatedCost: 150,
            estimatedTime: '2 hours',
            repairUpdates: [],
            createdAt: '2024-09-18T10:00:00Z'
        },
        {
            _id: '2',
            vehicleId: {
                _id: 'v2',
                internalId: 'TRK-002',
                plateNumber: 'DEF-456',
                make: 'Chevrolet',
                model: 'Silverado'
            },
            issue: 'Brake Inspection',
            status: 'inprogress',
            description: 'Brake pads need inspection and possible replacement',
            assignedMechanic: 'Jane Smith',
            estimatedCost: 300,
            estimatedTime: '4 hours',
            repairUpdates: [
                { time: '2024-09-18T11:00:00Z', note: 'Started brake inspection' }
            ],
            createdAt: '2024-09-17T14:30:00Z'
        },
        {
            _id: '3',
            vehicleId: {
                _id: 'v3',
                internalId: 'TRL-001',
                plateNumber: 'GHI-789',
                make: 'Freightliner',
                model: 'Cascadia'
            },
            issue: 'Tire Replacement',
            status: 'completed',
            description: 'Replace worn out tires',
            assignedMechanic: 'Mike Johnson',
            estimatedCost: 800,
            estimatedTime: '3 hours',
            repairUpdates: [
                { time: '2024-09-16T09:00:00Z', note: 'Started tire replacement' },
                { time: '2024-09-16T12:00:00Z', note: 'Completed tire replacement' }
            ],
            createdAt: '2024-09-16T08:00:00Z'
        }
    ]);

    const [vehicles] = useState<Vehicle[]>([
        { _id: 'v1', internalId: 'TRK-001', plateNumber: 'ABC-123', make: 'Ford', model: 'F-150' },
        { _id: 'v2', internalId: 'TRK-002', plateNumber: 'DEF-456', make: 'Chevrolet', model: 'Silverado' },
        { _id: 'v3', internalId: 'TRL-001', plateNumber: 'GHI-789', make: 'Freightliner', model: 'Cascadia' },
        { _id: 'v4', internalId: 'TRK-003', plateNumber: 'JKL-012', make: 'Ram', model: '2500' }
    ]);

    const [mechanics] = useState<string[]>([
        'John Doe',
        'Jane Smith',
        'Mike Johnson',
        'Sarah Wilson',
        'Robert Brown'
    ]);

    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
    const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const [createForm, setCreateForm] = useState<CreateForm>({
        vehicleId: '',
        issue: '',
        description: '',
        assignedMechanic: '',
        estimatedCost: '',
        estimatedTime: ''
    });

    const [updateForm, setUpdateForm] = useState<UpdateForm>({
        status: '',
        description: '',
        assignedMechanic: '',
        estimatedCost: '',
        estimatedTime: '',
        repairUpdate: ''
    });

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'open': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
            case 'inprogress': return 'text-blue-700 bg-blue-100 border-blue-200';
            case 'completed': return 'text-green-700 bg-green-100 border-green-200';
            default: return 'text-gray-700 bg-gray-100 border-gray-200';
        }
    };

    const filteredWorkOrders = workOrders.filter(order => {
        const matchesSearch = order.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.vehicleId.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.vehicleId.internalId.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleCreateSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        const selectedVehicle = vehicles.find(v => v._id === createForm.vehicleId);

        if (!selectedVehicle) {
            alert('Please select a valid vehicle');
            return;
        }

        const newWorkOrder: WorkOrder = {
            _id: Date.now().toString(),
            vehicleId: selectedVehicle,
            issue: createForm.issue,
            description: createForm.description,
            assignedMechanic: createForm.assignedMechanic,
            estimatedCost: parseFloat(createForm.estimatedCost) || 0,
            estimatedTime: createForm.estimatedTime,
            status: 'open',
            repairUpdates: [],
            createdAt: new Date().toISOString()
        };

        setWorkOrders([...workOrders, newWorkOrder]);
        setShowCreateModal(false);
        setCreateForm({
            vehicleId: '',
            issue: '',
            description: '',
            assignedMechanic: '',
            estimatedCost: '',
            estimatedTime: ''
        });
    };

    const handleUpdateSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (!selectedWorkOrder) return;

        const updatedOrders = workOrders.map(order => {
            if (order._id === selectedWorkOrder._id) {
                const updated = { ...order };
                if (updateForm.status) updated.status = updateForm.status as 'open' | 'inprogress' | 'completed';
                if (updateForm.description) updated.description = updateForm.description;
                if (updateForm.assignedMechanic) updated.assignedMechanic = updateForm.assignedMechanic;
                if (updateForm.estimatedCost) updated.estimatedCost = parseFloat(updateForm.estimatedCost);
                if (updateForm.estimatedTime) updated.estimatedTime = updateForm.estimatedTime;

                if (updateForm.repairUpdate) {
                    updated.repairUpdates.push({
                        time: new Date().toISOString(),
                        note: updateForm.repairUpdate
                    });
                }

                return updated;
            }
            return order;
        });

        setWorkOrders(updatedOrders);
        setShowUpdateModal(false);
        setUpdateForm({
            status: '',
            description: '',
            assignedMechanic: '',
            estimatedCost: '',
            estimatedTime: '',
            repairUpdate: ''
        });
    };

    const handleDelete = (id: string): void => {
        if (window.confirm('Are you sure you want to delete this work order?')) {
            setWorkOrders(workOrders.filter(order => order._id !== id));
        }
    };

    const openUpdateModal = (order: WorkOrder): void => {
        setSelectedWorkOrder(order);
        setUpdateForm({
            status: order.status,
            description: order.description,
            assignedMechanic: order.assignedMechanic,
            estimatedCost: order.estimatedCost.toString(),
            estimatedTime: order.estimatedTime,
            repairUpdate: ''
        });
        setShowUpdateModal(true);
    };

    const openDetailsModal = (order: WorkOrder): void => {
        setSelectedWorkOrder(order);
        setShowDetailsModal(true);
    };

    return (
        <div className="p-6  min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
                    <p className="text-gray-600 mt-1">Manage vehicle maintenance and repair work orders</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Work Order
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search by issue, vehicle, or plate number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="inprogress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Work Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mechanic</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredWorkOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        WO-{order._id.slice(-4).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{order.vehicleId.internalId}</div>
                                            <div className="text-sm text-gray-500">{order.vehicleId.plateNumber}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.issue}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.assignedMechanic || 'Unassigned'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${order.estimatedCost || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openDetailsModal(order)}
                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openUpdateModal(order)}
                                                className="text-yellow-600 hover:text-yellow-900 p-1"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(order._id)}
                                                className="text-red-600 hover:text-red-900 p-1"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="bg-white w-126 h-full shadow-xl overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Create Work Order</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                                    <select
                                        value={createForm.vehicleId}
                                        onChange={(e) => setCreateForm({ ...createForm, vehicleId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select Vehicle</option>
                                        {vehicles.map(vehicle => (
                                            <option key={vehicle._id} value={vehicle._id}>
                                                {vehicle.internalId} - {vehicle.plateNumber}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
                                    <input
                                        type="text"
                                        value={createForm.issue}
                                        onChange={(e) => setCreateForm({ ...createForm, issue: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Mechanic</label>
                                    <select
                                        value={createForm.assignedMechanic}
                                        onChange={(e) => setCreateForm({ ...createForm, assignedMechanic: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select Mechanic</option>
                                        {mechanics.map(mechanic => (
                                            <option key={mechanic} value={mechanic}>
                                                {mechanic}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={createForm.estimatedCost}
                                        onChange={(e) => setCreateForm({ ...createForm, estimatedCost: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 2 hours, 1 day"
                                        value={createForm.estimatedTime}
                                        onChange={(e) => setCreateForm({ ...createForm, estimatedTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 !mr-6 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 !text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Create Work Order
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Modal */}
            {showUpdateModal && selectedWorkOrder && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="bg-white w-126 h-full shadow-xl overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Update Work Order</h2>
                                <button
                                    onClick={() => setShowUpdateModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleUpdateSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={updateForm.status}
                                        onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Keep current status</option>
                                        <option value="open">Open</option>
                                        <option value="inprogress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={updateForm.description}
                                        onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Mechanic</label>
                                    <select
                                        value={updateForm.assignedMechanic}
                                        onChange={(e) => setUpdateForm({ ...updateForm, assignedMechanic: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Keep current mechanic</option>
                                        {mechanics.map(mechanic => (
                                            <option key={mechanic} value={mechanic}>
                                                {mechanic}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={updateForm.estimatedCost}
                                        onChange={(e) => setUpdateForm({ ...updateForm, estimatedCost: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
                                    <input
                                        type="text"
                                        value={updateForm.estimatedTime}
                                        onChange={(e) => setUpdateForm({ ...updateForm, estimatedTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Repair Update</label>
                                    <textarea
                                        value={updateForm.repairUpdate}
                                        onChange={(e) => setUpdateForm({ ...updateForm, repairUpdate: e.target.value })}
                                        placeholder="Add a note about the repair progress..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowUpdateModal(false)}
                                        className="flex-1 !mr-6 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 !text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Update Work Order
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedWorkOrder && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]  flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Work Order Details</h2>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Work Order ID</label>
                                        <p className="text-lg font-semibold">WO-{selectedWorkOrder._id.slice(-4).toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Status</label>
                                        <div className="mt-1">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedWorkOrder.status)}`}>
                                                {selectedWorkOrder.status.charAt(0).toUpperCase() + selectedWorkOrder.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Info */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Wrench className="h-5 w-5 mr-2" />
                                    Vehicle Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Internal ID:</span>
                                        <p className="font-medium">{selectedWorkOrder.vehicleId.internalId}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Plate Number:</span>
                                        <p className="font-medium">{selectedWorkOrder.vehicleId.plateNumber}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Make & Model:</span>
                                        <p className="font-medium">{selectedWorkOrder.vehicleId.make} {selectedWorkOrder.vehicleId.model}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Work Order Details */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <FileText className="h-5 w-5 mr-2" />
                                    Work Details
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-gray-500">Issue:</span>
                                        <p className="font-medium">{selectedWorkOrder.issue}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Description:</span>
                                        <p className="text-gray-700">{selectedWorkOrder.description || 'No description provided'}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 flex items-center">
                                                <User className="h-4 w-4 mr-1" />
                                                Mechanic:
                                            </span>
                                            <p className="font-medium">{selectedWorkOrder.assignedMechanic || 'Unassigned'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 flex items-center">
                                                <DollarSign className="h-4 w-4 mr-1" />
                                                Cost:
                                            </span>
                                            <p className="font-medium">${selectedWorkOrder.estimatedCost || 0}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 flex items-center">
                                                <Clock className="h-4 w-4 mr-1" />
                                                Time:
                                            </span>
                                            <p className="font-medium">{selectedWorkOrder.estimatedTime || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            Created:
                                        </span>
                                        <p className="font-medium">{new Date(selectedWorkOrder.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Repair Updates */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Repair Updates</h3>
                                {selectedWorkOrder.repairUpdates && selectedWorkOrder.repairUpdates.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedWorkOrder.repairUpdates.map((update: RepairUpdate, index: number) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-sm font-medium text-gray-700">Update #{index + 1}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(update.time).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">{update.note}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No repair updates yet</p>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredWorkOrders.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Work Orders Found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm || statusFilter !== 'all'
                            ? 'No work orders match your current filters.'
                            : 'Get started by creating your first work order.'
                        }
                    </p>
                    {(!searchTerm && statusFilter === 'all') && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Create First Work Order
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkOrdersPage;