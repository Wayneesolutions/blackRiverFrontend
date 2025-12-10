import React, { useState, useEffect } from 'react';
import { 
  FaClipboardList, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaCertificate,
  FaClock,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import {
  createTraining,
  getTrainings,
  updateTraining,
  deleteTraining,
  createCertificate,
  getCertificates,
  updateCertificate,
  deleteCertificate
} from '../../../../axios/api/healthSafety';

interface Training {
  _id: string;
  trainingNumber: string;
  title: string;
  type: string;
  date: string;
  expiryDate?: string;
  participants: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'expired';
  instructor: string;
}

interface Certificate {
  _id: string;
  certificateNumber: string;
  employee: string;
  type: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'expiring-soon';
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

const TrainingCertificates = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'training' | 'certificates'>('training');
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [notificationId, setNotificationId] = useState(0);

  // Modal states
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);

  // Form states
  const [trainingFormData, setTrainingFormData] = useState({
    title: '',
    type: '',
    date: new Date().toISOString().split('T')[0],
    expiryDate: '',
    status: 'scheduled' as 'scheduled' | 'in-progress' | 'completed' | 'expired',
    instructor: ''
  });

  const [certificateFormData, setCertificateFormData] = useState({
    employee: '',
    type: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = notificationId + 1;
    setNotificationId(id);
    setNotifications([...notifications, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const response = await getTrainings({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      });
      if (response?.success && Array.isArray(response.data)) {
        setTrainings(response.data.map((item: any) => ({
          _id: item._id,
          trainingNumber: item.trainingNumber,
          title: item.title,
          type: item.type,
          date: item.date,
          expiryDate: item.expiryDate,
          participants: item.participants || 0,
          status: item.status,
          instructor: item.instructor
        })));
      }
    } catch (error: any) {
      console.error('Error fetching trainings:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to fetch trainings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await getCertificates({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      });
      if (response?.success && Array.isArray(response.data)) {
        setCertificates(response.data.map((item: any) => ({
          _id: item._id,
          certificateNumber: item.certificateNumber,
          employee: item.employee,
          type: item.type,
          issueDate: item.issueDate,
          expiryDate: item.expiryDate,
          status: item.status
        })));
      }
    } catch (error: any) {
      console.error('Error fetching certificates:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'training') {
      fetchTrainings();
    } else {
      fetchCertificates();
    }
  }, [activeTab, filterStatus, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'expiring-soon': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateTraining = () => {
    setEditingTraining(null);
    setTrainingFormData({
      title: '',
      type: '',
      date: new Date().toISOString().split('T')[0],
      expiryDate: '',
      status: 'scheduled',
      instructor: ''
    });
    setShowTrainingModal(true);
  };

  const handleEditTraining = (training: Training) => {
    setEditingTraining(training);
    setTrainingFormData({
      title: training.title || '',
      type: training.type || '',
      date: training.date ? new Date(training.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: training.expiryDate ? new Date(training.expiryDate).toISOString().split('T')[0] : '',
      status: training.status || 'scheduled',
      instructor: training.instructor || ''
    });
    setShowTrainingModal(true);
  };

  const handleDeleteTraining = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this training?')) return;
    
    try {
      const response = await deleteTraining(id);
      if (response?.success) {
        showNotification('success', 'Training deleted successfully');
        fetchTrainings();
      } else {
        showNotification('error', response?.message || 'Failed to delete training');
      }
    } catch (error: any) {
      console.error('Error deleting training:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete training');
    }
  };

  const handleSubmitTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTraining) {
        const response = await updateTraining(editingTraining._id, trainingFormData);
        if (response?.success) {
          showNotification('success', 'Training updated successfully');
          setShowTrainingModal(false);
          fetchTrainings();
        } else {
          showNotification('error', response?.message || 'Failed to update training');
        }
      } else {
        const response = await createTraining(trainingFormData);
        if (response?.success) {
          showNotification('success', 'Training created successfully');
          setShowTrainingModal(false);
          fetchTrainings();
        } else {
          showNotification('error', response?.message || 'Failed to create training');
        }
      }
    } catch (error: any) {
      console.error('Error saving training:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to save training');
    }
  };

  const handleCreateCertificate = () => {
    setEditingCertificate(null);
    setCertificateFormData({
      employee: '',
      type: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: ''
    });
    setShowCertificateModal(true);
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setEditingCertificate(certificate);
    setCertificateFormData({
      employee: certificate.employee || '',
      type: certificate.type || '',
      issueDate: certificate.issueDate ? new Date(certificate.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: certificate.expiryDate ? new Date(certificate.expiryDate).toISOString().split('T')[0] : ''
    });
    setShowCertificateModal(true);
  };

  const handleDeleteCertificate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;
    
    try {
      const response = await deleteCertificate(id);
      if (response?.success) {
        showNotification('success', 'Certificate deleted successfully');
        fetchCertificates();
      } else {
        showNotification('error', response?.message || 'Failed to delete certificate');
      }
    } catch (error: any) {
      console.error('Error deleting certificate:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete certificate');
    }
  };

  const handleSubmitCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCertificate) {
        const response = await updateCertificate(editingCertificate._id, certificateFormData);
        if (response?.success) {
          showNotification('success', 'Certificate updated successfully');
          setShowCertificateModal(false);
          fetchCertificates();
        } else {
          showNotification('error', response?.message || 'Failed to update certificate');
        }
      } else {
        const response = await createCertificate(certificateFormData);
        if (response?.success) {
          showNotification('success', 'Certificate created successfully');
          setShowCertificateModal(false);
          fetchCertificates();
        } else {
          showNotification('error', response?.message || 'Failed to create certificate');
        }
      }
    } catch (error: any) {
      console.error('Error saving certificate:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to save certificate');
    }
  };

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = 
      training.trainingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || training.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const filteredCertificates = certificates.filter(certificate => {
    const matchesSearch = 
      certificate.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      certificate.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      certificate.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || certificate.status === filterStatus;
    
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
              Training & Certificates
            </h1>
            <p className="text-gray-600">Manage employee training programs and certifications</p>
          </div>
          <button
            onClick={() => activeTab === 'training' ? handleCreateTraining() : handleCreateCertificate()}
            className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2"
            style={{
              background: FLEET_COLORS.gradient,
              boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
            }}
          >
            <FaPlus /> {activeTab === 'training' ? 'New Training' : 'New Certificate'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('training')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'training'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'training' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaClipboardList className="inline mr-2" />
              Training Programs
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'certificates'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'certificates' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaCertificate className="inline mr-2" />
              Certificates
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
                placeholder={`Search ${activeTab}...`}
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
                {activeTab === 'training' ? (
                  <>
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </>
                ) : (
                  <>
                    <option value="active">Active</option>
                    <option value="expiring-soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Training Table */}
        {activeTab === 'training' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: FLEET_COLORS.gradient }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Training #</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Title</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Participants</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Instructor</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredTrainings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No training programs found
                      </td>
                    </tr>
                  ) : (
                    filteredTrainings.map((training) => (
                      <tr key={training._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{training.trainingNumber}</td>
                        <td className="px-6 py-4">{training.title}</td>
                        <td className="px-6 py-4">{training.type}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(training.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {training.participants}
                          </span>
                        </td>
                        <td className="px-6 py-4">{training.instructor}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(training.status)}`}>
                            {training.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditTraining(training)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteTraining(training._id)}
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

        {/* Certificates Table */}
        {activeTab === 'certificates' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: FLEET_COLORS.gradient }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Certificate #</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Employee</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Issue Date</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Expiry Date</th>
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
                  ) : filteredCertificates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No certificates found
                      </td>
                    </tr>
                  ) : (
                    filteredCertificates.map((certificate) => (
                      <tr key={certificate._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{certificate.certificateNumber}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-gray-400" />
                            {certificate.employee}
                          </div>
                        </td>
                        <td className="px-6 py-4">{certificate.type}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(certificate.issueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaClock className="text-gray-400" />
                            {new Date(certificate.expiryDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(certificate.status)}`}>
                            {certificate.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCertificate(certificate)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteCertificate(certificate._id)}
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

        {/* Training Modal */}
        {showTrainingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{editingTraining ? 'Edit Training' : 'New Training'}</h2>
                  <button
                    onClick={() => setShowTrainingModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmitTraining} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={trainingFormData.title}
                    onChange={(e) => setTrainingFormData({ ...trainingFormData, title: e.target.value })}
                    required
                    placeholder="e.g., Safety Training"
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <input
                      type="text"
                      value={trainingFormData.type}
                      onChange={(e) => setTrainingFormData({ ...trainingFormData, type: e.target.value })}
                      required
                      placeholder="e.g., General Safety"
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={trainingFormData.date}
                      onChange={(e) => setTrainingFormData({ ...trainingFormData, date: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={trainingFormData.expiryDate}
                      onChange={(e) => setTrainingFormData({ ...trainingFormData, expiryDate: e.target.value })}
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      value={trainingFormData.status}
                      onChange={(e) => setTrainingFormData({ ...trainingFormData, status: e.target.value as any })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor *</label>
                  <input
                    type="text"
                    value={trainingFormData.instructor}
                    onChange={(e) => setTrainingFormData({ ...trainingFormData, instructor: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowTrainingModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white"
                    style={{ background: FLEET_COLORS.gradient }}
                  >
                    {editingTraining ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Certificate Modal */}
        {showCertificateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{editingCertificate ? 'Edit Certificate' : 'New Certificate'}</h2>
                  <button
                    onClick={() => setShowCertificateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmitCertificate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                    <input
                      type="text"
                      value={certificateFormData.employee}
                      onChange={(e) => setCertificateFormData({ ...certificateFormData, employee: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <input
                      type="text"
                      value={certificateFormData.type}
                      onChange={(e) => setCertificateFormData({ ...certificateFormData, type: e.target.value })}
                      required
                      placeholder="e.g., Safety Certification"
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                    <input
                      type="date"
                      value={certificateFormData.issueDate}
                      onChange={(e) => setCertificateFormData({ ...certificateFormData, issueDate: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      value={certificateFormData.expiryDate}
                      onChange={(e) => setCertificateFormData({ ...certificateFormData, expiryDate: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white"
                    style={{ background: FLEET_COLORS.gradient }}
                  >
                    {editingCertificate ? 'Update' : 'Create'}
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

export default TrainingCertificates;
