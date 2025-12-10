import React, { useState, useEffect } from 'react';
import { 
  FaFileAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaDownload,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFile,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle
} from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import {
  createPolicyDocument,
  getPolicyDocuments,
  updatePolicyDocument,
  deletePolicyDocument,
  getPolicyDocumentSignedUrl
} from '../../../../axios/api/healthSafety';

interface Policy {
  _id: string;
  policyNumber: string;
  title: string;
  category: string;
  version: string;
  effectiveDate: string;
  reviewDate: string;
  status: 'active' | 'draft' | 'archived' | 'under-review';
  documentType: 'policy' | 'procedure' | 'guideline' | 'form';
  fileUrl?: string;
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

const PoliciesDocuments = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [notificationId, setNotificationId] = useState(0);

  // Modal states
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  // Form states
  const [policyFormData, setPolicyFormData] = useState({
    title: '',
    category: '',
    version: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    reviewDate: new Date().toISOString().split('T')[0],
    status: 'draft' as 'active' | 'draft' | 'archived' | 'under-review',
    documentType: 'policy' as 'policy' | 'procedure' | 'guideline' | 'form'
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = notificationId + 1;
    setNotificationId(id);
    setNotifications([...notifications, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await getPolicyDocuments({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        search: searchTerm || undefined
      });
      if (response?.success && Array.isArray(response.data)) {
        setPolicies(response.data.map((item: any) => ({
          _id: item._id,
          policyNumber: item.policyNumber,
          title: item.title,
          category: item.category,
          version: item.version,
          effectiveDate: item.effectiveDate,
          reviewDate: item.reviewDate,
          status: item.status,
          documentType: item.documentType,
          fileUrl: item.fileUrl
        })));
      }
    } catch (error: any) {
      console.error('Error fetching policies:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [filterStatus, filterCategory, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'under-review': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'policy': return <FaFilePdf className="text-red-500" />;
      case 'procedure': return <FaFileWord className="text-blue-500" />;
      case 'guideline': return <FaFileExcel className="text-green-500" />;
      default: return <FaFile className="text-gray-500" />;
    }
  };

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setPolicyFormData({
      title: '',
      category: '',
      version: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      reviewDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      documentType: 'policy'
    });
    setSelectedFile(null);
    setShowPolicyModal(true);
  };

  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setPolicyFormData({
      title: policy.title || '',
      category: policy.category || '',
      version: policy.version || '',
      effectiveDate: policy.effectiveDate ? new Date(policy.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      reviewDate: policy.reviewDate ? new Date(policy.reviewDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: policy.status || 'draft',
      documentType: policy.documentType || 'policy'
    });
    setSelectedFile(null);
    setShowPolicyModal(true);
  };

  const handleDeletePolicy = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this policy document?')) return;
    
    try {
      const response = await deletePolicyDocument(id);
      if (response?.success) {
        showNotification('success', 'Policy document deleted successfully');
        fetchPolicies();
      } else {
        showNotification('error', response?.message || 'Failed to delete policy document');
      }
    } catch (error: any) {
      console.error('Error deleting policy document:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete policy document');
    }
  };

  const handleDownloadPolicy = async (policy: Policy) => {
    try {
      if (!policy.fileUrl) {
        showNotification('error', 'No file attached to this policy document');
        return;
      }

      // If fileUrl is already a public URL, open it directly
      if (policy.fileUrl.startsWith('http://') || policy.fileUrl.startsWith('https://')) {
        window.open(policy.fileUrl, '_blank');
        return;
      }

      // Otherwise, get signed URL
      const response = await getPolicyDocumentSignedUrl(policy._id);
      if (response?.success && response.signedUrl) {
        window.open(response.signedUrl, '_blank');
      } else {
        showNotification('error', 'Failed to get download URL');
      }
    } catch (error: any) {
      console.error('Error downloading policy document:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to download policy document');
    }
  };

  const handleSubmitPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', policyFormData.title);
      formData.append('category', policyFormData.category);
      formData.append('version', policyFormData.version);
      formData.append('effectiveDate', policyFormData.effectiveDate);
      formData.append('reviewDate', policyFormData.reviewDate);
      formData.append('status', policyFormData.status);
      formData.append('documentType', policyFormData.documentType);

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      if (editingPolicy) {
        const response = await updatePolicyDocument(editingPolicy._id, formData);
        if (response?.success) {
          showNotification('success', 'Policy document updated successfully');
          setShowPolicyModal(false);
          fetchPolicies();
        } else {
          showNotification('error', response?.message || 'Failed to update policy document');
        }
      } else {
        const response = await createPolicyDocument(formData);
        if (response?.success) {
          showNotification('success', 'Policy document created successfully');
          setShowPolicyModal(false);
          fetchPolicies();
        } else {
          showNotification('error', response?.message || 'Failed to create policy document');
        }
      }
    } catch (error: any) {
      console.error('Error saving policy document:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to save policy document');
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = 
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || policy.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || policy.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
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
              Policy & Documents
            </h1>
            <p className="text-gray-600">Manage health & safety policies, procedures, and documents</p>
          </div>
          <button
            onClick={handleCreatePolicy}
            className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2"
            style={{
              background: FLEET_COLORS.gradient,
              boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
            }}
          >
            <FaPlus /> New Policy
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search policies..."
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
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="under-review">Under Review</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Categories</option>
                <option value="Safety">Safety</option>
                <option value="Emergency">Emergency</option>
                <option value="Health">Health</option>
                <option value="Training">Training</option>
              </select>
            </div>
          </div>
        </div>

        {/* Policies Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: FLEET_COLORS.gradient }}>
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">Policy #</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Title</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Category</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Version</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Effective Date</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Review Date</th>
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
                ) : filteredPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No policies found
                    </td>
                  </tr>
                ) : (
                  filteredPolicies.map((policy) => (
                    <tr key={policy._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{policy.policyNumber}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getFileIcon(policy.documentType)}
                          {policy.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">{policy.category}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          {policy.documentType}
                        </span>
                      </td>
                      <td className="px-6 py-4">{policy.version}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          {new Date(policy.effectiveDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          {new Date(policy.reviewDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(policy.status)}`}>
                          {policy.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadPolicy(policy)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Download"
                            disabled={!policy.fileUrl}
                          >
                            <FaDownload />
                          </button>
                          <button
                            onClick={() => handleEditPolicy(policy)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(policy._id)}
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

        {/* Policy Modal */}
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{editingPolicy ? 'Edit Policy' : 'New Policy'}</h2>
                  <button
                    onClick={() => setShowPolicyModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmitPolicy} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={policyFormData.title}
                    onChange={(e) => setPolicyFormData({ ...policyFormData, title: e.target.value })}
                    required
                    placeholder="e.g., Workplace Safety Policy"
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={policyFormData.category}
                      onChange={(e) => setPolicyFormData({ ...policyFormData, category: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="">Select Category</option>
                      <option value="Safety">Safety</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Health">Health</option>
                      <option value="Training">Training</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                    <select
                      value={policyFormData.documentType}
                      onChange={(e) => setPolicyFormData({ ...policyFormData, documentType: e.target.value as any })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="policy">Policy</option>
                      <option value="procedure">Procedure</option>
                      <option value="guideline">Guideline</option>
                      <option value="form">Form</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Version *</label>
                    <input
                      type="text"
                      value={policyFormData.version}
                      onChange={(e) => setPolicyFormData({ ...policyFormData, version: e.target.value })}
                      required
                      placeholder="e.g., 1.0"
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      value={policyFormData.status}
                      onChange={(e) => setPolicyFormData({ ...policyFormData, status: e.target.value as any })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="under-review">Under Review</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
                    <input
                      type="date"
                      value={policyFormData.effectiveDate}
                      onChange={(e) => setPolicyFormData({ ...policyFormData, effectiveDate: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review Date *</label>
                    <input
                      type="date"
                      value={policyFormData.reviewDate}
                      onChange={(e) => setPolicyFormData({ ...policyFormData, reviewDate: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document File</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {selectedFile && (
                    <p className="text-xs text-blue-600 mt-1">{selectedFile.name} selected</p>
                  )}
                  {editingPolicy && editingPolicy.fileUrl && !selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">Current file attached</p>
                  )}
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowPolicyModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white"
                    style={{ background: FLEET_COLORS.gradient }}
                  >
                    {editingPolicy ? 'Update' : 'Create'}
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

export default PoliciesDocuments;
