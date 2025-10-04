import { useState, useEffect, useRef } from "react";
import { FaPlus, FaEdit, FaTrash, FaEye, FaTimes, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaSearch, FaFilter, FaClock, FaUser, FaDollarSign, FaCalendar, FaFileAlt, FaWrench } from "react-icons/fa";
import {
  getAllWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder
} from "../../../../axios/api/fleet.workorder";
import { useVehicles } from "../../../../customHooks/useVehicles";

// Types
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

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

interface DeleteConfirmation {
  show: boolean;
  orderId: string | null;
}

// Notification Component
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

function WorkOrdersPage() {
  const { vehicles, loading: vehiclesLoading } = useVehicles();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    show: false,
    orderId: null
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [mechanics] = useState<string[]>([
    'John Doe',
    'Jane Smith',
    'Mike Johnson',
    'Sarah Wilson',
    'Robert Brown'
  ]);

  // Use refs to store form data
  const createFormRef = useRef<CreateForm>({
    vehicleId: '',
    issue: '',
    description: '',
    assignedMechanic: '',
    estimatedCost: '',
    estimatedTime: ''
  });

  const updateFormRef = useRef<UpdateForm>({
    status: '',
    description: '',
    assignedMechanic: '',
    estimatedCost: '',
    estimatedTime: '',
    repairUpdate: ''
  });

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchAllWorkOrders = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  useEffect(() => {
    fetchAllWorkOrders();
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'inprogress':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const filteredWorkOrders = workOrders.filter(order => {
    const matchesSearch = order.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicleId?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicleId?.internalId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = createFormRef.current;

    if (!formData.vehicleId || !formData.issue) {
      addNotification('error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);

    const data = {
      vehicleId: formData.vehicleId,
      issue: formData.issue,
      description: formData.description,
      assignedMechanic: formData.assignedMechanic,
      estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
      estimatedTime: formData.estimatedTime
    };

    try {
      const res = await createWorkOrder(data);
      if (res?.success) {
        addNotification('success', res.message || 'Work order created successfully');
        setShowCreateModal(false);
        createFormRef.current = {
          vehicleId: '',
          issue: '',
          description: '',
          assignedMechanic: '',
          estimatedCost: '',
          estimatedTime: ''
        };
        fetchAllWorkOrders();
      } else {
        addNotification('error', res?.message || 'Failed to create work order');
      }
    } catch (err: any) {
      addNotification('error', err?.message || 'Error creating work order');
    }

    setSubmitting(false);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkOrder) return;

    setSubmitting(true);

    const formData = updateFormRef.current;
    const data: any = {};
    
    if (formData.status) data.status = formData.status;
    if (formData.description) data.description = formData.description;
    if (formData.assignedMechanic) data.assignedMechanic = formData.assignedMechanic;
    if (formData.estimatedCost) data.estimatedCost = parseFloat(formData.estimatedCost);
    if (formData.estimatedTime) data.estimatedTime = formData.estimatedTime;
    if (formData.repairUpdate) data.repairUpdate = formData.repairUpdate;

    try {
      const res = await updateWorkOrder(selectedWorkOrder._id, data);
      if (res?.success) {
        addNotification('success', res.message || 'Work order updated successfully');
        setShowUpdateModal(false);
        updateFormRef.current = {
          status: '',
          description: '',
          assignedMechanic: '',
          estimatedCost: '',
          estimatedTime: '',
          repairUpdate: ''
        };
        fetchAllWorkOrders();
      } else {
        addNotification('error', res?.message || 'Failed to update work order');
      }
    } catch (err: any) {
      addNotification('error', err?.message || 'Error updating work order');
    }

    setSubmitting(false);
  };

  const handleDeleteWorkOrder = async (orderId: string) => {
    setDeleteConfirmation({ show: true, orderId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.orderId) return;

    try {
      const res = await deleteWorkOrder(deleteConfirmation.orderId);
      if (res?.success) {
        addNotification('success', res.message || 'Work order deleted successfully');
        fetchAllWorkOrders();
      } else {
        addNotification('error', res?.message || 'Failed to delete work order');
      }
    } catch (err: any) {
      addNotification('error', err?.message || 'Error deleting work order');
    }

    setDeleteConfirmation({ show: false, orderId: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, orderId: null });
  };

  const openUpdateModal = (order: WorkOrder) => {
    setSelectedWorkOrder(order);
    updateFormRef.current = {
      status: order.status,
      description: order.description || '',
      assignedMechanic: order.assignedMechanic || '',
      estimatedCost: order.estimatedCost?.toString() || '',
      estimatedTime: order.estimatedTime || '',
      repairUpdate: ''
    };
    setShowUpdateModal(true);
  };

  const openDetailsModal = (order: WorkOrder) => {
    setSelectedWorkOrder(order);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 min-h-screen">
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Work Orders</h1>
          <p className="text-gray-600 mt-1">Manage vehicle maintenance and repair work orders</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] shadow-lg hover:shadow-xl transition-all font-medium"
        >
          <FaPlus /> Create Work Order
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by issue, vehicle, or plate number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
            />
          </div>
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent appearance-none bg-white transition-all"
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
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#9793E4] mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Loading work orders...</p>
        </div>
      ) : filteredWorkOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FaWrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Work Orders Found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'No work orders match your current filters.'
              : 'Get started by creating your first work order.'}
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] transition-all font-medium shadow-md"
            >
              <FaPlus />
              Create First Work Order
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Work Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mechanic</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Est. Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWorkOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      WO-{order._id.slice(-4).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{order.vehicleId?.internalId || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{order.vehicleId?.plateNumber || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.issue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(order.status)}`}>
                        {order.status === 'inprogress' ? 'In Progress' : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.assignedMechanic || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${order.estimatedCost || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetailsModal(order)}
                          className="p-2.5 text-[#9793E4] hover:bg-[#9793E4]/10 rounded-lg transition-all border border-[#9793E4]/30"
                          title="View Details"
                        >
                          <FaEye size={16} />
                        </button>
                        <button
                          onClick={() => openUpdateModal(order)}
                          className="p-2.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all border border-yellow-200"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkOrder(order._id)}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-200"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Create Work Order</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={submitting}
                >
                  <FaTimes className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleCreateSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vehicle <span className="text-red-500">*</span>
                  </label>
                  <select
                    defaultValue={createFormRef.current.vehicleId}
                    onChange={(e) => createFormRef.current.vehicleId = e.target.value}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle: Vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.internalId} - {vehicle.plateNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Issue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    defaultValue={createFormRef.current.issue}
                    onChange={(e) => createFormRef.current.issue = e.target.value}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                    placeholder="e.g., Oil Change, Brake Inspection"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    defaultValue={createFormRef.current.description}
                    onChange={(e) => createFormRef.current.description = e.target.value}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                    placeholder="Detailed description of the issue..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assigned Mechanic
                  </label>
                  <select
                    defaultValue={createFormRef.current.assignedMechanic}
                    onChange={(e) => createFormRef.current.assignedMechanic = e.target.value}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={createFormRef.current.estimatedCost}
                    onChange={(e) => createFormRef.current.estimatedCost = e.target.value}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimated Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2 hours, 1 day"
                    defaultValue={createFormRef.current.estimatedTime}
                    onChange={(e) => createFormRef.current.estimatedTime = e.target.value}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t -mx-6 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#9793E4] !text-white py-2.5 px-4 rounded-lg hover:bg-[#8783D4] disabled:bg-[#9793E4]/50 disabled:cursor-not-allowed font-medium transition-colors shadow-md"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Update Work Order</h2>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={submitting}
                >
                  <FaTimes className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleUpdateSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle</label>
                  <select
                    value={selectedWorkOrder?.vehicleId?._id || ''}
                    className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 cursor-not-allowed"
                    disabled
                  >
                    <option value={selectedWorkOrder?.vehicleId?._id}>
                      {selectedWorkOrder?.vehicleId?.internalId} - {selectedWorkOrder?.vehicleId?.plateNumber}
                    </option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Vehicle cannot be changed after creation</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Issue</label>
                  <input
                    type="text"
                    value={selectedWorkOrder?.issue || ''}
                    className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Issue cannot be changed after creation</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    defaultValue={updateFormRef.current.status}
                    onChange={(e) => updateFormRef.current.status = e.target.value}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                  >
                    <option value="">Keep current status</option>
                    <option value="open">Open</option>
                    <option value="inprogress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    defaultValue={updateFormRef.current.description}
                    onChange={(e) => updateFormRef.current.description = e.target.value}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned Mechanic</label>
                  <select
                    defaultValue={updateFormRef.current.assignedMechanic}
                    onChange={(e) => updateFormRef.current.assignedMechanic = e.target.value}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={updateFormRef.current.estimatedCost}
                    onChange={(e) => updateFormRef.current.estimatedCost = e.target.value}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Time</label>
                  <input
                    type="text"
                    defaultValue={updateFormRef.current.estimatedTime}
                    onChange={(e) => updateFormRef.current.estimatedTime = e.target.value}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Add Repair Update</label>
                  <textarea
                    defaultValue={updateFormRef.current.repairUpdate}
                    onChange={(e) => updateFormRef.current.repairUpdate = e.target.value}
                    placeholder="Add a note about the repair progress..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t -mx-6 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#9793E4] !text-white py-2.5 px-4 rounded-lg hover:bg-[#8783D4] disabled:bg-[#9793E4]/50 disabled:cursor-not-allowed font-medium transition-colors shadow-md"
                    disabled={submitting}
                  >
                    {submitting ? 'Updating...' : 'Update Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Work Order Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            {selectedWorkOrder && (
              <div className="p-6 space-y-6">
                <div className="bg-gradient-to-r from-[#9793E4] via-[#8783D4] to-[#7773C4] rounded-xl p-6 text-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm opacity-80">Work Order ID</label>
                      <p className="text-lg font-bold">WO-{selectedWorkOrder._id.slice(-4).toUpperCase()}</p>
                    </div>
                    <div>
                      <label className="text-sm opacity-80">Status</label>
                      <div className="mt-1">
                        <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-black text-sm font-semibold capitalize backdrop-blur-sm inline-block">
                          {selectedWorkOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                    <FaWrench className="text-[#9793E4]" />
                    Vehicle Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 font-medium">Internal ID:</span>
                      <p className="font-semibold text-gray-900">{selectedWorkOrder.vehicleId?.internalId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Plate Number:</span>
                      <p className="font-semibold text-gray-900">{selectedWorkOrder.vehicleId?.plateNumber || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 font-medium">Make & Model:</span>
                      <p className="font-semibold text-gray-900">
                        {selectedWorkOrder.vehicleId?.make} {selectedWorkOrder.vehicleId?.model}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                    <FaFileAlt className="text-[#9793E4]" />
                    Work Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500 font-medium">Issue:</span>
                      <p className="font-semibold text-gray-900">{selectedWorkOrder.issue}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Description:</span>
                      <p className="text-gray-700">{selectedWorkOrder.description || 'No description provided'}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm pt-2">
                      <div>
                        <span className="text-gray-500 font-medium flex items-center gap-1">
                          <FaUser className="text-[#9793E4]" size={14} />
                          Mechanic:
                        </span>
                        <p className="font-semibold text-gray-900">{selectedWorkOrder.assignedMechanic || 'Unassigned'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium flex items-center gap-1">
                          <FaDollarSign className="text-[#9793E4]" size={14} />
                          Cost:
                        </span>
                        <p className="font-semibold text-gray-900">${selectedWorkOrder.estimatedCost || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium flex items-center gap-1">
                          <FaClock className="text-[#9793E4]" size={14} />
                          Time:
                        </span>
                        <p className="font-semibold text-gray-900">{selectedWorkOrder.estimatedTime || 'Not specified'}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <FaCalendar className="text-[#9793E4]" size={14} />
                        Created:
                      </span>
                      <p className="font-semibold text-gray-900">{formatDateTime(selectedWorkOrder.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4 text-lg">Repair Updates</h3>
                  {selectedWorkOrder.repairUpdates && selectedWorkOrder.repairUpdates.length > 0 ? (
                    <div className="space-y-3">
                      {selectedWorkOrder.repairUpdates.map((update: RepairUpdate, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-semibold text-gray-700">Update #{index + 1}</span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(update.time)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{update.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-center py-4">No repair updates yet</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
            <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-3 rounded-t-2xl">
              <div className="p-2 bg-red-100 rounded-full">
                <FaTrash className="text-red-600" size={20} />
              </div>
              <h3 className="text-xl font-bold text-red-900">Delete Work Order</h3>
            </div>

            <div className="p-6">
              <p className="text-gray-700 text-base">
                Are you sure you want to delete this work order? This action cannot be undone.
              </p>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
              <button
                type="button"
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2.5 bg-red-600 !text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-md"
                onClick={confirmDelete}
              >
                Delete Order
              </button>
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
}

export default WorkOrdersPage;