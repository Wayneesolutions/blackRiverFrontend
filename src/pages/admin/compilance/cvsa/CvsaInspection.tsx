import React, { useState, useEffect, useRef } from 'react';
import {
  FaClipboardCheck,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaInfoCircle,
  FaBan,
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
  FaSearch,
  FaFlag,
  FaFlagUsa,
  FaTimes
} from 'react-icons/fa';
import {
  getCvsaInspections,
  getCvsaInspectionStats,
  createCvsaInspection,
  updateCvsaInspection,
  deleteCvsaInspection
} from '../../../../axios/api/admin';
import { listVehicle } from '../../../../axios/api/distapcher';
import { listDriver } from '../../../../axios/api/distapcher';

// Types
interface Inspection {
  _id: string;
  inspectionId: string;
  country: 'canada' | 'usa';
  date: string;
  location: string;
  status: 'pass' | 'fail' | 'warning' | 'out-of-service';
  vehicle: {
    _id: string;
    internalId?: string;
    plateNumber?: string;
    make?: string;
    model?: string;
    year?: number;
  } | string;
  driver: {
    _id: string;
    name?: string;
    email?: string;
  } | string;
  inspectorName: string;
  violations?: Violation[];
  notes?: string;
  createdAt: string;
}

interface Vehicle {
  _id: string;
  internalId: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
}

interface Driver {
  _id: string;
  name: string;
  email: string;
}

interface Violation {
  _id: string;
  code: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
}

interface InspectionStats {
  total: number;
  pass: number;
  fail: number;
  warning: number;
  outOfService: number;
}

// Toast Notification Types
type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
}

// Toast Notification Component
const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  const icons = {
    success: <FaCheckCircle className="text-green-600" size={20} />,
    error: <FaExclamationCircle className="text-red-600" size={20} />,
    info: <FaInfoCircle className="text-blue-600" size={20} />,
    warning: <FaExclamationTriangle className="text-yellow-600" size={20} />
  };

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

const CvsaInspection: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([]);
  const [activeTab, setActiveTab] = useState<'canada' | 'usa'>('canada');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [inspectionForm, setInspectionForm] = useState<Partial<Inspection>>({
    country: 'canada',
    date: '',
    location: '',
    status: 'pass',
    vehicle: '',
    driver: '',
    inspectorName: '',
    violations: [],
    notes: ''
  });
  const [stats, setStats] = useState<InspectionStats>({
    total: 0,
    pass: 0,
    fail: 0,
    warning: 0,
    outOfService: 0
  });
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const notificationIdRef = useRef(0);

  // Fetch vehicles and drivers
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await listVehicle();
        if (res?.success && res?.data?.vehicles) {
          setVehicles(res.data.vehicles);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    const fetchDrivers = async () => {
      try {
        const res = await listDriver();
        if (res?.success && res?.data) {
          // Filter for drivers only
          const driverList = Array.isArray(res.data) 
            ? res.data.filter((d: any) => d.role === 'driver')
            : (res.data?.drivers || []).filter((d: any) => d.role === 'driver');
          setDrivers(driverList);
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
      }
    };

    fetchVehicles();
    fetchDrivers();
  }, []);

  // Function to refresh inspections and stats
  const refreshData = async (useFilters = true) => {
    try {
      const [inspectionsRes, statsRes] = await Promise.all([
        getCvsaInspections({ 
          country: activeTab,
          status: useFilters && statusFilter !== 'all' ? statusFilter : undefined, 
          search: useFilters && searchQuery ? searchQuery : undefined 
        }),
        getCvsaInspectionStats(activeTab)
      ]);

      if (inspectionsRes?.success) {
        setInspections(inspectionsRes.data || []);
      }

      if (statsRes?.success) {
        setStats(statsRes.data || {
          total: 0,
          pass: 0,
          fail: 0,
          warning: 0,
          outOfService: 0
        });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Fetch inspections and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await refreshData(true);
      } catch (error) {
        console.error('Error fetching inspections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter, searchQuery]);

  // Filter inspections (already filtered by API, but keep for client-side if needed)
  useEffect(() => {
    setFilteredInspections(inspections);
  }, [inspections]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <FaCheckCircle className="text-green-600" size={20} />;
      case 'fail':
        return <FaTimesCircle className="text-red-600" size={20} />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-600" size={20} />;
      case 'out-of-service':
        return <FaBan className="text-red-800" size={20} />;
      default:
        return <FaClipboardCheck className="text-gray-600" size={20} />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out-of-service':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'text-yellow-600';
      case 'major':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setInspectionForm({
      country: 'canada',
      date: '',
      location: '',
      status: 'pass',
      vehicle: '',
      driver: '',
      inspectorName: '',
      violations: [],
      notes: ''
    });
  };

  const handleAddInspection = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setInspectionForm({
      country: inspection.country,
      date: inspection.date ? new Date(inspection.date).toISOString().split('T')[0] : '',
      location: inspection.location,
      status: inspection.status,
      vehicle: typeof inspection.vehicle === 'string' ? inspection.vehicle : inspection.vehicle?._id || '',
      driver: typeof inspection.driver === 'string' ? inspection.driver : inspection.driver?._id || '',
      inspectorName: inspection.inspectorName,
      violations: inspection.violations || [],
      notes: inspection.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteInspection = (inspection: Inspection) => {
    setInspectionToDelete(inspection);
    setShowDeleteModal(true);
  };

  const getVehicleInfo = (vehicle: Inspection['vehicle']): string => {
    if (typeof vehicle === 'string') {
      const v = vehicles.find(v => v._id === vehicle);
      return v ? `${v.make} ${v.model} - ${v.plateNumber}` : '';
    }
    if (vehicle?.make && vehicle?.model && vehicle?.plateNumber) {
      return `${vehicle.make} ${vehicle.model} - ${vehicle.plateNumber}`;
    }
    return '';
  };

  const getDriverName = (driver: Inspection['driver']): string => {
    if (typeof driver === 'string') {
      const d = drivers.find(d => d._id === driver);
      return d ? d.name : '';
    }
    return driver?.name || '';
  };

  const addNotification = (type: NotificationType, message: string) => {
    const id = ++notificationIdRef.current;
    setNotifications((prev) => [...prev, { id, type, message }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const validateForm = () => {
    return (
      !!inspectionForm.country &&
      !!inspectionForm.date &&
      !!inspectionForm.location &&
      !!inspectionForm.status &&
      !!inspectionForm.vehicle &&
      !!inspectionForm.driver &&
      !!inspectionForm.inspectorName
    );
  };

  const saveNewInspection = async () => {
    if (!validateForm()) {
      addNotification('error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        country: inspectionForm.country,
        date: inspectionForm.date,
        location: inspectionForm.location,
        status: inspectionForm.status,
        vehicle: inspectionForm.vehicle,
        driver: inspectionForm.driver,
        inspectorName: inspectionForm.inspectorName,
        violations: inspectionForm.violations || [],
        notes: inspectionForm.notes || ''
      };

      const res = await createCvsaInspection(payload);
      if (res?.success) {
        addNotification('success', res.message || 'Inspection created successfully');
        // Refresh both inspections and stats
        await refreshData(true);
        setShowAddModal(false);
        resetForm();
      } else {
        addNotification('error', res?.message || 'Failed to create inspection');
      }
    } catch (error: any) {
      console.error('Error creating inspection:', error);
      addNotification('error', error?.message || 'Failed to create inspection');
    } finally {
      setLoading(false);
    }
  };

  const updateInspection = async () => {
    if (!selectedInspection) return;
    if (!validateForm()) {
      addNotification('error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        country: inspectionForm.country,
        date: inspectionForm.date,
        location: inspectionForm.location,
        status: inspectionForm.status,
        vehicle: inspectionForm.vehicle,
        driver: inspectionForm.driver,
        inspectorName: inspectionForm.inspectorName,
        violations: inspectionForm.violations || [],
        notes: inspectionForm.notes || ''
      };

      const res = await updateCvsaInspection(selectedInspection._id, payload);
      if (res?.success) {
        addNotification('success', res.message || 'Inspection updated successfully');
        // Refresh both inspections and stats
        await refreshData(true);
        setShowEditModal(false);
        setSelectedInspection(null);
        resetForm();
      } else {
        addNotification('error', res?.message || 'Failed to update inspection');
      }
    } catch (error: any) {
      console.error('Error updating inspection:', error);
      addNotification('error', error?.message || 'Failed to update inspection');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!inspectionToDelete) return;

    setLoading(true);
    try {
      const res = await deleteCvsaInspection(inspectionToDelete._id);
      if (res?.success) {
        addNotification('success', res.message || 'Inspection deleted successfully');
        // Refresh both inspections and stats
        await refreshData(true);
        setShowDeleteModal(false);
        setInspectionToDelete(null);
      } else {
        addNotification('error', res?.message || 'Failed to delete inspection');
      }
    } catch (error: any) {
      console.error('Error deleting inspection:', error);
      addNotification('error', error?.message || 'Failed to delete inspection');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, color, icon }: { title: string; value: number; color: string; icon: React.ReactNode }) => (
    <div className={`${color} p-4 rounded-xl border-2`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Toast Notifications Container - High z-index to be above modal */}
      <div className="fixed top-4 right-4 z-[10002] flex flex-col gap-3 max-w-md">
        {notifications.map(notification => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">CVSA Inspection Management</h1>
          <p className="text-gray-600 mt-1">Commercial Vehicle Safety Alliance inspections</p>
        </div>
        <button
          onClick={handleAddInspection}
          className="flex items-center gap-2 px-5 py-3 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] shadow-lg hover:shadow-xl transition-all font-medium"
        >
          + Add Inspection
        </button>
      </div>

      {/* Country Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">Country Selection</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('canada')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'canada'
                ? 'bg-white text-[#9793E4] shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <FaFlag className="text-red-600" size={16} />
              Canada
            </button>
            <button
              onClick={() => setActiveTab('usa')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${activeTab === 'usa'
                ? 'bg-white text-[#9793E4] shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <FaFlagUsa className="text-blue-600" size={16} />
              USA
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Total Inspections"
            value={stats.total}
            color="bg-blue-50 border-blue-200"
            icon={<FaClipboardCheck className="text-blue-600" size={24} />}
          />
          <StatCard
            title="Passed"
            value={stats.pass}
            color="bg-green-50 border-green-200"
            icon={<FaCheckCircle className="text-green-600" size={24} />}
          />
          <StatCard
            title="Failed"
            value={stats.fail}
            color="bg-red-50 border-red-200"
            icon={<FaTimesCircle className="text-red-600" size={24} />}
          />
          <StatCard
            title="Warning"
            value={stats.warning}
            color="bg-yellow-50 border-yellow-200"
            icon={<FaExclamationTriangle className="text-yellow-600" size={24} />}
          />
          <StatCard
            title="Out of Service"
            value={stats.outOfService}
            color="bg-red-100 border-red-300"
            icon={<FaBan className="text-red-800" size={24} />}
          />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search inspections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="warning">Warning</option>
              <option value="out-of-service">Out of Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">
            {activeTab.toUpperCase()} Inspections ({filteredInspections.length})
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9793E4] mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-gray-500">Loading inspections...</p>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="text-center py-16">
            <FaClipboardCheck size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-semibold text-gray-500">No inspections found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspection ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle & Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInspections.map((inspection) => (
                  <tr key={inspection._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {inspection.inspectionId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" size={14} />
                          {formatDate(inspection.date)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <FaMapMarkerAlt className="text-gray-400" size={14} />
                          <span className="text-gray-600">{inspection.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{getVehicleInfo(inspection.vehicle)}</div>
                        <div className="text-gray-600">{getDriverName(inspection.driver)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(inspection.status)}
                        <span className={`text-sm px-2 py-1 rounded-full font-medium border ${getStatusBadgeColor(inspection.status)}`}>
                          {inspection.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inspection.inspectorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewInspection(inspection)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FaEye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditInspection(inspection)}
                          className="text-[#9793E4] hover:text-[#8783D4] p-2 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Inspection"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteInspection(inspection)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Inspection"
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
        )}
      </div>

      {/* View Inspection Modal */}
      {showViewModal && selectedInspection && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Inspection Details: {selectedInspection.inspectionId}
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimesCircle className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Inspection Overview */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Inspection Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Inspection ID</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedInspection.inspectionId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
                    <p className="text-lg font-semibold text-gray-800 uppercase">{selectedInspection.country}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                    <p className="text-lg font-semibold text-gray-800">{formatDate(selectedInspection.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedInspection.location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedInspection.status)}
                      <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${getStatusBadgeColor(selectedInspection.status)}`}>
                        {selectedInspection.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Inspector</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedInspection.inspectorName}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle & Driver Info */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Vehicle & Driver Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle</label>
                    <p className="text-lg font-semibold text-gray-800">{getVehicleInfo(selectedInspection.vehicle)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Driver</label>
                    <p className="text-lg font-semibold text-gray-800">{getDriverName(selectedInspection.driver)}</p>
                  </div>
                </div>
              </div>

              {/* Violations */}
              {selectedInspection.violations && selectedInspection.violations.length > 0 && (
                <div className="bg-red-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Violations Found</h4>
                  <div className="space-y-3">
                    {selectedInspection.violations.map((violation) => (
                      <div key={violation._id} className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {violation.code}
                              </span>
                              <span className={`text-sm font-semibold ${getSeverityColor(violation.severity)}`}>
                                {violation.severity.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-gray-800">{violation.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedInspection.notes && (
                <div className="bg-yellow-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Inspector Notes</h4>
                  <p className="text-gray-800">{selectedInspection.notes}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Inspection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Add Inspection</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <FaTimesCircle className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                  <select
                    value={inspectionForm.country}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, country: e.target.value as 'canada' | 'usa' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="canada">Canada</option>
                    <option value="usa">USA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={inspectionForm.date || ''}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter inspection location"
                    value={inspectionForm.location || ''}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                  <select
                    value={inspectionForm.status}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, status: e.target.value as Inspection['status'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="warning">Warning</option>
                    <option value="out-of-service">Out of Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspector <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Inspector name"
                    value={inspectionForm.inspectorName || ''}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, inspectorName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver <span className="text-red-500">*</span></label>
                  <select
                    value={typeof inspectionForm.driver === 'string' ? inspectionForm.driver : inspectionForm.driver?._id || ''}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, driver: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>{driver.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle <span className="text-red-500">*</span></label>
                  <select
                    value={typeof inspectionForm.vehicle === 'string' ? inspectionForm.vehicle : inspectionForm.vehicle?._id || ''}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, vehicle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    placeholder="Additional notes"
                    value={inspectionForm.notes || ''}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Cancel</button>
              <button onClick={saveNewInspection} className="px-6 py-2.5 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] font-medium transition-colors disabled:opacity-60" disabled={!validateForm() || loading}>
                {loading ? 'Saving...' : 'Save Inspection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Inspection Modal */}
      {showEditModal && selectedInspection && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Edit Inspection: {selectedInspection.inspectionId}</h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <FaTimesCircle className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                  <select
                    value={inspectionForm.country}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, country: e.target.value as 'canada' | 'usa' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="canada">Canada</option>
                    <option value="usa">USA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={inspectionForm.date || ''} onChange={(e) => setInspectionForm(prev => ({ ...prev, date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                  <input type="text" value={inspectionForm.location || ''} onChange={(e) => setInspectionForm(prev => ({ ...prev, location: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                  <select value={inspectionForm.status} onChange={(e) => setInspectionForm(prev => ({ ...prev, status: e.target.value as Inspection['status'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent">
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="warning">Warning</option>
                    <option value="out-of-service">Out of Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspector <span className="text-red-500">*</span></label>
                  <input type="text" value={inspectionForm.inspectorName || ''} onChange={(e) => setInspectionForm(prev => ({ ...prev, inspectorName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver <span className="text-red-500">*</span></label>
                  <select
                    value={typeof inspectionForm.driver === 'string' ? inspectionForm.driver : inspectionForm.driver?._id || ''}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, driver: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>{driver.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle <span className="text-red-500">*</span></label>
                  <select
                    value={typeof inspectionForm.vehicle === 'string' ? inspectionForm.vehicle : inspectionForm.vehicle?._id || ''}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, vehicle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={inspectionForm.notes || ''} onChange={(e) => setInspectionForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent" rows={3} />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
              <button onClick={() => setShowEditModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Cancel</button>
              <button onClick={updateInspection} className="px-6 py-2.5 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] font-medium transition-colors disabled:opacity-60" disabled={!validateForm() || loading}>
                {loading ? 'Updating...' : 'Update Inspection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && inspectionToDelete && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <FaTimesCircle className="text-red-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Delete Inspection</h3>
              </div>
              <p className="text-gray-600 mb-6">Are you sure you want to delete inspection <span className="font-semibold">{inspectionToDelete.inspectionId}</span>? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowDeleteModal(false); setInspectionToDelete(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors" disabled={loading}>Cancel</button>
                <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 !text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-60" disabled={loading}>
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CvsaInspection;
