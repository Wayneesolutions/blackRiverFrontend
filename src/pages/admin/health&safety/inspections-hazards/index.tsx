import React, { useState, useEffect } from 'react';
import { 
  FaShieldAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaClipboardCheck,
  FaTimes,
  FaInfoCircle
} from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import { 
  createInspection, 
  getInspections, 
  updateInspection, 
  deleteInspection,
  createHazard,
  getHazards,
  updateHazard,
  deleteHazard
} from '../../../../axios/api/healthSafety';

interface Inspection {
  _id: string;
  inspectionNumber: string;
  date: string;
  type: string;
  inspector: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  findings: number;
  hazards: number;
  location: string;
  notes?: string;
}

interface Hazard {
  _id: string;
  hazardNumber: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  location: string;
  identifiedDate: string;
  controlMeasures?: string;
  riskRating?: string;
  status: 'identified' | 'assessed' | 'controlled' | 'monitored' | 'resolved';
  assignedTo?: any;
  dueDate?: string;
  resolvedDate?: string;
  inspectionId?: string;
  notes?: string;
}

interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const ToastNotificationComponent = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationTriangle className="text-red-500" size={24} />,
    info: <FaInfoCircle className="text-blue-500" size={24} />,
    warning: <FaExclamationTriangle className="text-yellow-500" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`fixed top-4 right-4 flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg z-[10000] ${bgColors[notification.type]} min-w-[300px] max-w-[500px]`}>
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

const InspectionsHazards = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'inspections' | 'hazards'>('inspections');
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [notificationId, setNotificationId] = useState(0);

  // Modal states
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showHazardModal, setShowHazardModal] = useState(false);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [editingHazard, setEditingHazard] = useState<Hazard | null>(null);

  // Form states
  const [inspectionFormData, setInspectionFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: '',
    inspector: '',
    location: '',
    status: 'scheduled' as 'scheduled' | 'in-progress' | 'completed' | 'overdue',
    notes: ''
  });

  const [hazardFormData, setHazardFormData] = useState({
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    category: '',
    location: '',
    identifiedDate: new Date().toISOString().split('T')[0],
    controlMeasures: '',
    riskRating: '',
    status: 'identified' as 'identified' | 'assessed' | 'controlled' | 'monitored' | 'resolved',
    notes: ''
  });

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = notificationId + 1;
    setNotificationId(id);
    setNotifications([...notifications, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const response = await getInspections({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      });
      if (response?.success && Array.isArray(response.data)) {
        setInspections(response.data.map((item: any) => ({
          _id: item._id,
          inspectionNumber: item.inspectionNumber,
          date: item.date,
          type: item.type,
          inspector: item.inspector,
          status: item.status,
          findings: item.findings || 0,
          hazards: item.hazards || 0,
          location: item.location,
          notes: item.notes
        })));
      }
    } catch (error: any) {
      console.error('Error fetching inspections:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to fetch inspections');
    } finally {
      setLoading(false);
    }
  };

  const fetchHazards = async () => {
    try {
      setLoading(true);
      const response = await getHazards({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      });
      if (response?.success && Array.isArray(response.data)) {
        setHazards(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching hazards:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to fetch hazards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inspections') {
      fetchInspections();
    } else {
      fetchHazards();
    }
  }, [activeTab, filterStatus, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'controlled': return 'bg-blue-100 text-blue-800';
      case 'assessed': return 'bg-yellow-100 text-yellow-800';
      case 'identified': return 'bg-orange-100 text-orange-800';
      case 'monitored': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleCreateInspection = () => {
    setEditingInspection(null);
    setInspectionFormData({
      date: new Date().toISOString().split('T')[0],
      type: '',
      inspector: '',
      location: '',
      status: 'scheduled',
      notes: ''
    });
    setShowInspectionModal(true);
  };

  const handleEditInspection = (inspection: Inspection) => {
    setEditingInspection(inspection);
    setInspectionFormData({
      date: inspection.date ? new Date(inspection.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      type: inspection.type || '',
      inspector: inspection.inspector || '',
      location: inspection.location || '',
      status: inspection.status || 'scheduled',
      notes: inspection.notes || ''
    });
    setShowInspectionModal(true);
  };

  const handleDeleteInspection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this inspection?')) return;
    
    try {
      const response = await deleteInspection(id);
      if (response?.success) {
        showNotification('success', 'Inspection deleted successfully');
        fetchInspections();
      } else {
        showNotification('error', response?.message || 'Failed to delete inspection');
      }
    } catch (error: any) {
      console.error('Error deleting inspection:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete inspection');
    }
  };

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInspection) {
        const response = await updateInspection(editingInspection._id, inspectionFormData);
        if (response?.success) {
          showNotification('success', 'Inspection updated successfully');
          setShowInspectionModal(false);
          fetchInspections();
        } else {
          showNotification('error', response?.message || 'Failed to update inspection');
        }
      } else {
        const response = await createInspection(inspectionFormData);
        if (response?.success) {
          showNotification('success', 'Inspection created successfully');
          setShowInspectionModal(false);
          fetchInspections();
        } else {
          showNotification('error', response?.message || 'Failed to create inspection');
        }
      }
    } catch (error: any) {
      console.error('Error saving inspection:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to save inspection');
    }
  };

  const handleCreateHazard = () => {
    setEditingHazard(null);
    setHazardFormData({
      description: '',
      severity: 'medium',
      category: '',
      location: '',
      identifiedDate: new Date().toISOString().split('T')[0],
      controlMeasures: '',
      riskRating: '',
      status: 'identified',
      notes: ''
    });
    setShowHazardModal(true);
  };

  const handleEditHazard = (hazard: Hazard) => {
    setEditingHazard(hazard);
    setHazardFormData({
      description: hazard.description || '',
      severity: hazard.severity || 'medium',
      category: hazard.category || '',
      location: hazard.location || '',
      identifiedDate: hazard.identifiedDate ? new Date(hazard.identifiedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      controlMeasures: hazard.controlMeasures || '',
      riskRating: hazard.riskRating || '',
      status: hazard.status || 'identified',
      notes: hazard.notes || ''
    });
    setShowHazardModal(true);
  };

  const handleDeleteHazard = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this hazard?')) return;
    
    try {
      const response = await deleteHazard(id);
      if (response?.success) {
        showNotification('success', 'Hazard deleted successfully');
        fetchHazards();
      } else {
        showNotification('error', response?.message || 'Failed to delete hazard');
      }
    } catch (error: any) {
      console.error('Error deleting hazard:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete hazard');
    }
  };

  const handleSubmitHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHazard) {
        const response = await updateHazard(editingHazard._id, hazardFormData);
        if (response?.success) {
          showNotification('success', 'Hazard updated successfully');
          setShowHazardModal(false);
          fetchHazards();
        } else {
          showNotification('error', response?.message || 'Failed to update hazard');
        }
      } else {
        const response = await createHazard(hazardFormData);
        if (response?.success) {
          showNotification('success', 'Hazard created successfully');
          setShowHazardModal(false);
          fetchHazards();
        } else {
          showNotification('error', response?.message || 'Failed to create hazard');
        }
      }
    } catch (error: any) {
      console.error('Error saving hazard:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to save hazard');
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = 
      inspection.inspectionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.inspector.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || inspection.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const filteredHazards = hazards.filter(hazard => {
    const matchesSearch = 
      hazard.hazardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hazard.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hazard.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || hazard.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#eeeeee] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-[10001] space-y-2">
          {notifications.map(notification => (
            <ToastNotificationComponent
              key={notification.id}
              notification={notification}
              onClose={removeNotification}
            />
          ))}
        </div>

        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: FLEET_COLORS.dark }}>
              Inspections & Hazards
            </h1>
            <p className="text-gray-600">Manage safety inspections and hazard identification</p>
          </div>
          <button
            onClick={() => activeTab === 'inspections' ? handleCreateInspection() : handleCreateHazard()}
            className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2"
            style={{
              background: FLEET_COLORS.gradient,
              boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
            }}
          >
            <FaPlus /> {activeTab === 'inspections' ? 'New Inspection' : 'New Hazard'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('inspections')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'inspections'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'inspections' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaClipboardCheck className="inline mr-2" />
              Inspections
            </button>
            <button
              onClick={() => setActiveTab('hazards')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'hazards'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'hazards' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaExclamationTriangle className="inline mr-2" />
              Hazards
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'inspections' ? "Search inspections..." : "Search hazards..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                {activeTab === 'inspections' ? (
                  <>
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </>
                ) : (
                  <>
                    <option value="identified">Identified</option>
                    <option value="assessed">Assessed</option>
                    <option value="controlled">Controlled</option>
                    <option value="monitored">Monitored</option>
                    <option value="resolved">Resolved</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Inspections Table */}
        {activeTab === 'inspections' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: FLEET_COLORS.gradient }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Inspection #</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Inspector</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Location</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Findings</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Hazards</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredInspections.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        No inspections found
                      </td>
                    </tr>
                  ) : (
                    filteredInspections.map((inspection) => (
                      <tr key={inspection._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{inspection.inspectionNumber}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(inspection.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">{inspection.type}</td>
                        <td className="px-6 py-4">{inspection.inspector}</td>
                        <td className="px-6 py-4">{inspection.location}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {inspection.findings}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            {inspection.hazards}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(inspection.status)}`}>
                            {inspection.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditInspection(inspection)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteInspection(inspection._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hazards Table */}
        {activeTab === 'hazards' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: FLEET_COLORS.gradient }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Hazard #</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Description</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Severity</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Location</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredHazards.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No hazards found
                      </td>
                    </tr>
                  ) : (
                    filteredHazards.map((hazard) => (
                      <tr key={hazard._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{hazard.hazardNumber}</td>
                        <td className="px-6 py-4">{hazard.description}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(hazard.severity)}`}>
                            {hazard.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">{hazard.location}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(hazard.identifiedDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(hazard.status)}`}>
                            {hazard.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditHazard(hazard)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteHazard(hazard._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inspection Modal */}
        {showInspectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{editingInspection ? 'Edit Inspection' : 'New Inspection'}</h2>
                  <button
                    onClick={() => setShowInspectionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmitInspection} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={inspectionFormData.date}
                      onChange={(e) => setInspectionFormData({ ...inspectionFormData, date: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <input
                      type="text"
                      value={inspectionFormData.type}
                      onChange={(e) => setInspectionFormData({ ...inspectionFormData, type: e.target.value })}
                      required
                      placeholder="e.g., Safety Inspection"
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inspector *</label>
                    <input
                      type="text"
                      value={inspectionFormData.inspector}
                      onChange={(e) => setInspectionFormData({ ...inspectionFormData, inspector: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input
                      type="text"
                      value={inspectionFormData.location}
                      onChange={(e) => setInspectionFormData({ ...inspectionFormData, location: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={inspectionFormData.status}
                    onChange={(e) => setInspectionFormData({ ...inspectionFormData, status: e.target.value as any })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={inspectionFormData.notes}
                    onChange={(e) => setInspectionFormData({ ...inspectionFormData, notes: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowInspectionModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white"
                    style={{ background: FLEET_COLORS.gradient }}
                  >
                    {editingInspection ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hazard Modal */}
        {showHazardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{editingHazard ? 'Edit Hazard' : 'New Hazard'}</h2>
                  <button
                    onClick={() => setShowHazardModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmitHazard} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={hazardFormData.description}
                    onChange={(e) => setHazardFormData({ ...hazardFormData, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                    <select
                      value={hazardFormData.severity}
                      onChange={(e) => setHazardFormData({ ...hazardFormData, severity: e.target.value as any })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={hazardFormData.category}
                      onChange={(e) => setHazardFormData({ ...hazardFormData, category: e.target.value })}
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input
                      type="text"
                      value={hazardFormData.location}
                      onChange={(e) => setHazardFormData({ ...hazardFormData, location: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Identified Date *</label>
                    <input
                      type="date"
                      value={hazardFormData.identifiedDate}
                      onChange={(e) => setHazardFormData({ ...hazardFormData, identifiedDate: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Control Measures</label>
                  <textarea
                    value={hazardFormData.controlMeasures}
                    onChange={(e) => setHazardFormData({ ...hazardFormData, controlMeasures: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Rating</label>
                    <input
                      type="text"
                      value={hazardFormData.riskRating}
                      onChange={(e) => setHazardFormData({ ...hazardFormData, riskRating: e.target.value })}
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      value={hazardFormData.status}
                      onChange={(e) => setHazardFormData({ ...hazardFormData, status: e.target.value as any })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="identified">Identified</option>
                      <option value="assessed">Assessed</option>
                      <option value="controlled">Controlled</option>
                      <option value="monitored">Monitored</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={hazardFormData.notes}
                    onChange={(e) => setHazardFormData({ ...hazardFormData, notes: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowHazardModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white"
                    style={{ background: FLEET_COLORS.gradient }}
                  >
                    {editingHazard ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionsHazards;
