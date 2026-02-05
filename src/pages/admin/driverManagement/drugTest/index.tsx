import React, { useState, useEffect } from 'react';
import { FlaskConical, Search, Plus, Edit, Trash2, Calendar, MapPin, FileText, Eye, Clock } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { getAllDrivers, getAllUsersForDrugTest, getDrugTests, createDrugTest, updateDrugTest, deleteDrugTest, getDrugTestById, type DrugTestRequest } from '../../../../axios/api/driver';

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
        info: <FaCheckCircle className="text-blue-500" size={24} />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200'
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
            <p className="flex-1 text-sm font-medium text-gray-900">{notification.message}</p>
            <button
                onClick={() => onClose(notification.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <FaTimes size={16} />
            </button>
        </div>
    );
};

const DrugTest = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDriver, setSelectedDriver] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedTestType, setSelectedTestType] = useState<string>('');
    const [drugTestRequests, setDrugTestRequests] = useState<DrugTestRequest[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<DrugTestRequest | null>(null);
    const [editingRequest, setEditingRequest] = useState<DrugTestRequest | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null; name: string | null }>({ open: false, id: null, name: null });

    const testTypes = [
        'Pre-Employment',
        'Random',
        'Post-Accident',
        'Reasonable Suspicion',
        'Return-to-Duty',
        'Follow-Up',
        'Annual Physical'
    ];

    const reasons = [
        'Routine Testing',
        'New Hire',
        'Accident Investigation',
        'Suspicious Behavior',
        'Return to Work',
        'Follow-Up Testing',
        'Annual Requirement',
        'Other'
    ];

    const requestForm = {
        driverId: '',
        testType: '',
        reason: '',
        scheduledDate: '',
        scheduledTime: '',
        labName: '',
        collectionSiteName: '',
        collectionSiteAddress: '',
        collectionSitePhone: '',
        importantDetails: ''
    };

    const [formData, setFormData] = useState(requestForm);

    useEffect(() => {
        fetchDrivers();
        fetchDrugTestRequests();
    }, []);

    // Refetch when filters change
    useEffect(() => {
        fetchDrugTestRequests();
    }, [selectedDriver, selectedStatus, selectedTestType]);

    const fetchDrivers = async () => {
        try {
            // Fetch all users for drug test (excluding admin and superadmin)
            const response = await getAllUsersForDrugTest();
            if (response?.success && response?.data) {
                const userList = Array.isArray(response.data) ? response.data : [];
                setDrivers(userList.map((user: any) => ({
                    _id: user._id,
                    name: user.name || 'Unknown User'
                })));
            } else {
                // Fallback to getAllDrivers if the new endpoint fails
                const fallbackResponse = await getAllDrivers(1, 1000);
                if (fallbackResponse?.success && fallbackResponse?.data) {
                    const driverList = Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [];
                    // Filter out admin, superadmin, customer, and reporter
                    const filteredDrivers = driverList.filter((d: any) => {
                        const role = d.role?.toLowerCase() || '';
                        return role !== 'admin' && role !== 'superadmin' && role !== 'customer' && role !== 'reporter';
                    });
                    setDrivers(filteredDrivers.map((d: any) => ({
                        _id: d._id,
                        name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown Driver'
                    })));
                } else {
                    // If no drivers returned (likely no company), set empty array
                    setDrivers([]);
                }
            }
        } catch (error) {
            console.error('Error fetching users for drug test:', error);
            // On error, set empty array to prevent issues
            setDrivers([]);
        }
    };

    const fetchDrugTestRequests = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (searchQuery) params.search = searchQuery;
            if (selectedDriver) params.driverId = selectedDriver;
            if (selectedStatus) params.status = selectedStatus;
            if (selectedTestType) params.testType = selectedTestType;

            const response = await getDrugTests(params);
            if (response?.success && Array.isArray(response.data)) {
                setDrugTestRequests(response.data);
                
                // If no drug tests and message indicates no company, show info notification
                if (response.data.length === 0 && response.message && response.message.includes('company')) {
                    // Don't show error, just set empty array - the empty state will show the message
                }
            } else {
                // Only show error if it's not a "no company" message
                if (response?.message && !response.message.includes('company')) {
                    showNotification('error', response.message || 'Failed to load drug test requests');
                }
                setDrugTestRequests([]);
            }
        } catch (error: any) {
            console.error('Error fetching drug test requests:', error);
            // Only show error if it's not a "no company" related error
            if (error?.message && !error.message.includes('company')) {
                showNotification('error', error.message || 'Failed to load drug test requests');
            }
            setDrugTestRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (type: NotificationType, message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleCreateRequestClick = () => {
        setEditingRequest(null);
        setFormData(requestForm);
        setShowRequestModal(true);
    };

    const handleEditClick = (request: DrugTestRequest) => {
        setEditingRequest(request);
        setFormData({
            driverId: request.driverId,
            testType: request.testType,
            reason: request.reason,
            scheduledDate: request.scheduledDate,
            scheduledTime: request.scheduledTime || '',
            labName: request.labName,
            collectionSiteName: request.collectionSiteName || '',
            collectionSiteAddress: request.collectionSiteAddress || '',
            collectionSitePhone: request.collectionSitePhone || '',
            importantDetails: request.importantDetails || ''
        });
        setShowRequestModal(true);
    };

    const handleViewDetails = async (request: DrugTestRequest) => {
        if (request._id) {
            try {
                const response = await getDrugTestById(request._id);
                if (response?.success && response.data) {
                    setSelectedRequest(response.data);
                    setShowDetailsModal(true);
                } else {
                    // Fallback to using the request directly if API fails
                    setSelectedRequest(request);
                    setShowDetailsModal(true);
                }
            } catch (error: any) {
                console.error('Error fetching drug test details:', error);
                // Fallback to using the request directly
                setSelectedRequest(request);
                setShowDetailsModal(true);
            }
        } else {
            setSelectedRequest(request);
            setShowDetailsModal(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.driverId || !formData.testType || !formData.reason || !formData.scheduledDate || !formData.labName) {
            showNotification('error', 'Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            let response;
            if (editingRequest?._id) {
                response = await updateDrugTest(editingRequest._id, formData);
            } else {
                response = await createDrugTest(formData as DrugTestRequest);
            }

            if (response?.success) {
                showNotification('success', editingRequest ? 'Drug test request updated successfully' : 'Drug test request created successfully');
                setShowRequestModal(false);
                setFormData(requestForm);
                setEditingRequest(null);
                fetchDrugTestRequests();
            } else {
                showNotification('error', response?.message || 'Failed to save drug test request');
            }
        } catch (error: any) {
            console.error('Error saving drug test request:', error);
            showNotification('error', error?.message || 'Failed to save drug test request');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        setConfirmDelete({ open: true, id, name });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete.id) return;

        try {
            const response = await deleteDrugTest(confirmDelete.id);
            if (response?.success) {
                showNotification('success', 'Drug test request deleted successfully');
                fetchDrugTestRequests();
            } else {
                showNotification('error', response?.message || 'Failed to delete drug test request');
            }
        } catch (error: any) {
            console.error('Error deleting drug test request:', error);
            showNotification('error', error?.message || 'Failed to delete drug test request');
        } finally {
            setConfirmDelete({ open: false, id: null, name: null });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'scheduled':
                return 'bg-blue-100 text-blue-700';
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredRequests = drugTestRequests.filter(request => {
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = 
                request.driverName?.toLowerCase().includes(searchLower) ||
                request.testType.toLowerCase().includes(searchLower) ||
                request.reason.toLowerCase().includes(searchLower) ||
                request.labName.toLowerCase().includes(searchLower) ||
                request.collectionSiteName?.toLowerCase().includes(searchLower);
            
            if (!matchesSearch) return false;
        }
        return true;
    });

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-[#EDF8FF] p-6">
            {/* Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map(notification => (
                    <Notification
                        key={notification.id}
                        notification={notification}
                        onClose={removeNotification}
                    />
                ))}
            </div>

            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <FlaskConical className="text-blue-600" size={32} />
                            Drug Test Management
                        </h1>
                        <p className="text-gray-600 mt-2">Manage driver drug test requests and tracking</p>
                    </div>
                    <button
                        onClick={handleCreateRequestClick}
                        style={{
                            background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                        }}
                        className="flex items-center gap-2 px-6 py-3 !text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus size={20} />
                        Create Drug Test Request
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        fetchDrugTestRequests();
                                    }
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">  Employees</label>
                        <select
                            value={selectedDriver}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Employees</option>
                            {drivers.map(driver => (
                                <option key={driver._id} value={driver._id}>
                                    {driver.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Test Type</label>
                        <select
                            value={selectedTestType}
                            onChange={(e) => setSelectedTestType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            {testTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="text-sm text-gray-600">
                            Showing {filteredRequests.length} request(s)
                        </div>
                        <button
                            onClick={fetchDrugTestRequests}
                            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Loading drug test requests...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-12 text-center">
                        <FlaskConical className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600 text-lg mb-2">No drug test requests found</p>
                        <p className="text-gray-500 text-sm mb-4">
                            {drugTestRequests.length === 0 
                                ? "No drug test requests are available. This may be because no company is assigned to your account."
                                : "No drug test requests match your current filters."}
                        </p>
                        {drugTestRequests.length === 0 && (
                            <p className="text-gray-400 text-xs">
                                Please contact your administrator to assign a company.
                            </p>
                        )}
                        {drugTestRequests.length > 0 && (
                            <p className="text-gray-500 text-sm">Click "Create Drug Test Request" to get started</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Driver</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Test Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Scheduled Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Lab/Collection Site</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRequests.map((request) => (
                                    <tr key={request._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{request.driverName || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{request.testType}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{request.reason}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(request.scheduledDate).toLocaleDateString()}
                                                {request.scheduledTime && (
                                                    <div className="text-xs text-gray-500">{request.scheduledTime}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{request.labName}</div>
                                            {request.collectionSiteName && (
                                                <div className="text-xs text-gray-500">{request.collectionSiteName}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                                {request.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleViewDetails(request)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(request)}
                                                    className="text-indigo-600 hover:text-indigo-800"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => request._id && handleDelete(request._id, `${request.driverName}'s ${request.testType} test`)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Request Modal */}
            {showRequestModal && (
                <div 
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowRequestModal(false);
                        }
                    }}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingRequest ? 'Edit Drug Test Request' : 'Create Drug Test Request'}
                            </h2>
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Driver Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Employee <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.driverId}
                                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select a employee</option>
                                    {drivers.map(driver => (
                                        <option key={driver._id} value={driver._id}>
                                            {driver.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Test Type and Reason */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Test Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.testType}
                                        onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select test type</option>
                                        {testTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select reason</option>
                                        {reasons.map(reason => (
                                            <option key={reason} value={reason}>{reason}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Scheduled Date and Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scheduled Date <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="date"
                                            value={formData.scheduledDate}
                                            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Scheduled Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.scheduledTime}
                                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Lab/Collection Site Section */}
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="text-blue-600" size={20} />
                                    Lab or Collection Site Details
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Lab Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.labName}
                                            onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Quest Diagnostics, LabCorp"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Collection Site Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.collectionSiteName}
                                            onChange={(e) => setFormData({ ...formData, collectionSiteName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Collection site or facility name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Collection Site Address
                                        </label>
                                        <textarea
                                            value={formData.collectionSiteAddress}
                                            onChange={(e) => setFormData({ ...formData, collectionSiteAddress: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Street address, city, state, ZIP"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Collection Site Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.collectionSitePhone}
                                            onChange={(e) => setFormData({ ...formData, collectionSitePhone: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Important Details */}
                            <div className="border-t border-gray-200 pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FileText className="text-blue-600" size={18} />
                                    Important Details
                                </label>
                                <textarea
                                    value={formData.importantDetails}
                                    onChange={(e) => setFormData({ ...formData, importantDetails: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter any important details, special instructions, or notes about this drug test request..."
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                                    }}
                                    className="px-6 py-2 !text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : editingRequest ? 'Update' : 'Create'} Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedRequest && (
                <div 
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDetailsModal(false);
                        }
                    }}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                            <h2 className="text-2xl font-bold text-gray-900">Drug Test Request Details</h2>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Driver</label>
                                    <p className="text-base font-semibold text-gray-900">{selectedRequest.driverName || 'Unknown'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Test Type</label>
                                    <p className="text-base text-gray-900">{selectedRequest.testType}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Reason</label>
                                    <p className="text-base text-gray-900">{selectedRequest.reason}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                                        {selectedRequest.status.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Scheduled Date</label>
                                    <p className="text-base text-gray-900">
                                        {new Date(selectedRequest.scheduledDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                {selectedRequest.scheduledTime && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Scheduled Time</label>
                                        <p className="text-base text-gray-900">{selectedRequest.scheduledTime}</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="text-blue-600" size={20} />
                                    Lab or Collection Site Details
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Lab Name</label>
                                        <p className="text-base text-gray-900">{selectedRequest.labName}</p>
                                    </div>
                                    {selectedRequest.collectionSiteName && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Collection Site Name</label>
                                            <p className="text-base text-gray-900">{selectedRequest.collectionSiteName}</p>
                                        </div>
                                    )}
                                    {selectedRequest.collectionSiteAddress && (
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Collection Site Address</label>
                                            <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedRequest.collectionSiteAddress}</p>
                                        </div>
                                    )}
                                    {selectedRequest.collectionSitePhone && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Collection Site Phone</label>
                                            <p className="text-base text-gray-900">{selectedRequest.collectionSitePhone}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedRequest.importantDetails && (
                                <div className="border-t border-gray-200 pt-4">
                                    <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                        <FileText className="text-blue-600" size={18} />
                                        Important Details
                                    </label>
                                    <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedRequest.importantDetails}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                            <Clock size={16} />
                                            Created At
                                        </label>
                                        <p className="text-sm text-gray-600">{formatDateTime(selectedRequest.createdAt)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                            <Clock size={16} />
                                            Last Updated
                                        </label>
                                        <p className="text-sm text-gray-600">{formatDateTime(selectedRequest.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        handleEditClick(selectedRequest);
                                    }}
                                    style={{
                                        background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                                    }}
                                    className="px-6 py-2 !text-white font-semibold rounded-lg hover:opacity-90"
                                >
                                    Edit Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Drug Test</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete <span className="font-medium text-gray-900">{confirmDelete.name}</span>? This will permanently remove the drug test request and all associated data.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setConfirmDelete({ open: false, id: null, name: null })}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 bg-red-600 !text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DrugTest;
