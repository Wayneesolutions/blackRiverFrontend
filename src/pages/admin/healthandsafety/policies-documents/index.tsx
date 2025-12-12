import { useState, useEffect } from 'react';
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
  FaCheckCircle,
  FaClipboardCheck,
  FaSyncAlt,
  FaChartPie,
  FaUserTimes,
  FaUpload
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
  // Categories covering Req 12.1 A-E
  category: 'Safety' | 'HR/Conduct' | 'Driver-Specific' | 'Wellness' | 'Shop/Yard' | string;
  version: string; // Req 4: Version Control
  effectiveDate: string; 
  reviewDate: string; // Req 12.2: Renewal Date
  renewalCycle?: number; // Req 12.2: Cycle (12, 24, 36 months)
  status: 'active' | 'draft' | 'archived' | 'under-review' | 'expired';
  documentType: 'Policy' | 'Procedure' | 'SOP' | 'Form' | 'policy' | 'procedure' | 'guideline' | 'form'; // Req 4: SOPs
  fileType?: 'PDF' | 'DOCX' | 'TXT'; // Req 12: File format support
  fileUrl?: string;
  owner?: string; // Req 12.3: Policy Owner
  assignedRoles?: string; // Req 12: Assign policies to roles
  acknowledged?: number; // Req 4, 12: Acknowledgment tracking
  totalEmployees?: number; // Req 4, 12: Total employees assigned
  linkedTrainingId?: string; // Req 12: Link policies to related training
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

  const handleDownloadPolicy = async (policy: Policy, disposition: 'inline' | 'attachment' = 'inline') => {
    try {
      if (!policy.fileUrl) {
        showNotification('error', 'No file attached to this policy document');
        return;
      }

      // Always use signed URL for S3 files
      const response = await getPolicyDocumentSignedUrl(policy._id, disposition);
      if (response?.success && response.signedUrl) {
        if (disposition === 'attachment') {
          // Download file
          const link = document.createElement('a');
          link.href = response.signedUrl;
          link.download = policy.fileUrl.split('/').pop() || 'policy-document.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // View file in new tab
          window.open(response.signedUrl, '_blank');
        }
      } else {
        showNotification('error', response?.message || 'Failed to get document URL');
      }
    } catch (error: any) {
      console.error('Error accessing policy document:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to access policy document');
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
                  <th className="px-6 py-4 text-left text-white font-semibold">Assigned Roles</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Document</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Effective Date</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Review Date</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredPolicies.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                      No policies found
                    </td>
                  </tr>
                ) : (
                  filteredPolicies.map((policy) => (
                    <tr key={policy._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{policy.policyNumber || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getFileIcon(policy.documentType)}
                          <span className="font-medium">{policy.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{policy.category || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          {policy.documentType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{policy.version || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 max-w-xs">
                          {policy.assignedRoles ? (
                            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                              {policy.assignedRoles}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Not assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {policy.fileUrl ? (
                          <div className="flex items-center gap-2">
                            {policy.fileType && (
                              <span className="text-xs text-gray-500">
                                {policy.fileType}
                              </span>
                            )}
                            {policy.fileName && (
                              <span className="text-xs text-gray-600 truncate max-w-xs" title={policy.fileName}>
                                {policy.fileName}
                              </span>
                            )}
                            {!policy.fileName && (
                              <span className="text-xs text-green-600">✓ Document attached</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No document</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          <span className="text-sm">
                            {policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          <span className="text-sm">
                            {policy.reviewDate ? new Date(policy.reviewDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(policy.status)}`}>
                          {policy.status ? policy.status.replace('-', ' ').toUpperCase() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadPolicy(policy, 'inline')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View"
                            disabled={!policy.fileUrl}
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleDownloadPolicy(policy, 'attachment')}
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
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

const ALL_CATEGORIES = [
    'Safety', 'HR/Conduct', 'Driver-Specific', 'Wellness', 'Shop/Yard'
];

const PolicyManagementModule = () => {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'library'>('dashboard');
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);
    const [notificationId, setNotificationId] = useState(0);
    
    // Modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showAcknowledgmentModal, setShowAcknowledgmentModal] = useState(false);
    const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

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
                setPolicies(response.data.map((item: any) => {
                    // Determine file type from fileUrl or fileName if fileType is not available
                    let fileType = item.fileType;
                    if (!fileType && item.fileName) {
                        const ext = item.fileName.split('.').pop()?.toUpperCase();
                        if (ext === 'PDF' || ext === 'DOCX' || ext === 'DOC' || ext === 'TXT' || ext === 'XLS' || ext === 'XLSX') {
                            fileType = ext;
                        }
                    } else if (!fileType && item.fileUrl) {
                        const ext = item.fileUrl.split('.').pop()?.split('?')[0]?.toUpperCase();
                        if (ext === 'PDF' || ext === 'DOCX' || ext === 'DOC' || ext === 'TXT' || ext === 'XLS' || ext === 'XLSX') {
                            fileType = ext;
                        }
                    }
                    
                    return {
                        _id: item._id,
                        policyNumber: item.policyNumber || '',
                        title: item.title || '',
                        category: item.category || '',
                        version: item.version || '',
                        effectiveDate: item.effectiveDate || new Date().toISOString(),
                        reviewDate: item.reviewDate || new Date().toISOString(),
                        status: item.status || 'draft',
                        documentType: item.documentType || 'policy',
                        fileUrl: item.fileUrl || '',
                        fileName: item.fileName || '',
                        fileType: fileType || 'PDF',
                        owner: item.owner || item.createdBy?.name || '',
                        assignedRoles: item.assignedRoles || 'All Staff',
                        acknowledged: item.acknowledged || 0,
                        totalEmployees: item.totalEmployees || 0,
                        renewalCycle: item.renewalCycle || 12
                    };
                }));
            } else {
                showNotification('error', response?.message || 'Failed to fetch policies');
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
            case 'expired': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getFileIcon = (fileType: string) => {
        switch (fileType) {
            case 'PDF': return <FaFilePdf className="text-red-500" />;
            case 'DOCX': return <FaFileWord className="text-blue-500" />;
            case 'TXT': return <FaFileAlt className="text-gray-500" />;
            default: return <FaFile className="text-gray-500" />;
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

    // --- VIEW 1: COMPLIANCE DASHBOARD (REQ 12.3) ---
    const renderPolicyDashboard = () => {
        const activePolicies = policies.filter(p => p.status === 'active');
        const upcomingReviewPolicies = policies.filter(p => {
            const reviewDate = new Date(p.reviewDate).getTime();
            const today = new Date().getTime();
            const daysUntilReview = (reviewDate - today) / (1000 * 3600 * 24);
            // Req 12.2: Automatic reminders 30/60/90 days before renewal
            return daysUntilReview > 0 && daysUntilReview <= 90; 
        });

        // Req 12.3: Employees who have NOT acknowledged policies
        // We define non-compliant as having less than 95% acknowledgment for audit focus
        const nonCompliantAcknowledgment = activePolicies.filter(p => {
            if (!p.totalEmployees || p.totalEmployees === 0) return false;
            return (p.acknowledged / p.totalEmployees) < 0.95;
        });

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Card 1: Active Policies (Req 12.3) */}
                    <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-purple-500">
                        <p className="text-sm font-medium text-gray-500">Total Active Policies</p>
                        <p className="text-3xl font-bold text-purple-700">{activePolicies.length}</p>
                        <span className='text-xs text-gray-500'>Ensures all mandatory policies are covered.</span>
                    </div>

                    {/* Card 2: Upcoming Renewals (Req 12.2, 12.3) */}
                    <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-yellow-500">
                        <p className="text-sm font-medium text-gray-500">Upcoming Reviews (90 days)</p>
                        <p className="text-3xl font-bold text-yellow-700">{upcomingReviewPolicies.length}</p>
                        <span className='text-xs text-gray-500'>Notifications sent to H&S Manager.</span>
                    </div>
                    
                    {/* Card 3: Acknowledgment Risk (Req 4, 12.3) */}
                    <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-red-500">
                        <p className="text-sm font-medium text-gray-500">Acknowledgment Risk</p>
                        <p className="text-3xl font-bold text-red-700">
                            {nonCompliantAcknowledgment.length}
                        </p>
                        <span className='text-xs text-gray-500'>Policies &lt; 95% **Read Receipts** tracked.</span>
                    </div>

                    {/* Card 4: Policy Owner Breakdown (Req 12.3) */}
                    <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-blue-500">
                        <p className="text-sm font-medium text-gray-500">Policy Categories Tracked</p>
                        <p className="text-3xl font-bold text-blue-700">
                            {ALL_CATEGORIES.length}
                        </p>
                        <span className='text-xs text-gray-500'>Includes Safety, HR, Driver, Wellness, Shop/Yard.</span>
                    </div>
                </div>

                {/* Compliance Report Snippet: Unacknowledged Policies (Req 12: Generate compliance reports) */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
                    <h3 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2"><FaUserTimes /> Acknowledgment Audit Report</h3>
                    <p className='text-sm text-gray-600 mb-4'>Audit-ready list showing policies where mandatory acknowledgment (Read Receipts) is missing for the **current version**.</p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy Title (Version)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Roles</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unacknowledged</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance %</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {nonCompliantAcknowledgment.map(p => (
                                    <tr key={p._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.title} <span className='text-gray-500 font-normal'>v.**{p.version}**</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.assignedRoles}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{p.totalEmployees - p.acknowledged} employees</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {p.totalEmployees && p.totalEmployees > 0 
                                                ? ((p.acknowledged / p.totalEmployees) * 100).toFixed(1) 
                                                : '0'}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button 
                                                onClick={() => {
                                                    setSelectedPolicy(p);
                                                    setShowAcknowledgmentModal(true);
                                                }}
                                                className='text-xs text-purple-600 hover:underline mr-2'
                                            >
                                                View Acknowledgment Details
                                            </button>
                                            <button className='text-xs text-blue-600 hover:underline'>
                                                Send Mandatory Reminder
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {nonCompliantAcknowledgment.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-green-600 font-semibold">All policies meet the 95% acknowledgment threshold. <FaCheckCircle className='inline ml-2'/></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };
    const PolicyUploadModal = ({ onClose, onUpload }: { onClose: () => void; onUpload: (data: any) => void }) => {
      const [formData, setFormData] = useState<{
        title: string;
        policyNumber: string;
        category: string;
        documentType: string;
        effectiveDate: string;
        reviewDate: string;
        renewalCycle: number;
        assignedRoles: string[];
        owner: string;
        version: string;
        linkedTraining: string;
        file: File | null;
      }>({
        title: '',
        policyNumber: '',
        category: 'Safety',
        documentType: 'Policy',
        effectiveDate: '',
        reviewDate: '',
        renewalCycle: 12,
        assignedRoles: [],
        owner: '',
        version: '1.0',
        linkedTraining: '',
        file: null
      });
    
      return (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">Upload New Policy/SOP</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={24} />
              </button>
            </div>
    
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Policy Title *</label>
                  <input 
                    type="text"
                    placeholder="e.g., Fueling Operations SOP"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
    
                <div>
                  <label className="block text-sm font-semibold mb-2">Policy Number *</label>
                  <input 
                    type="text"
                    placeholder="e.g., SOP-D-001"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({...formData, policyNumber: e.target.value})}
                  />
                </div>
    
                <div>
                  <label className="block text-sm font-semibold mb-2">Category *</label>
                  <select 
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {ALL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
    
                <div>
                  <label className="block text-sm font-semibold mb-2">Document Type *</label>
                  <select 
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.documentType}
                    onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                  >
                    <option value="Policy">Policy</option>
                    <option value="SOP">SOP</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Form">Form</option>
                  </select>
                </div>
    
                <div>
                  <label className="block text-sm font-semibold mb-2">Effective Date *</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
                  />
                </div>
    
                <div>
                  <label className="block text-sm font-semibold mb-2">Review Date *</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.reviewDate}
                    onChange={(e) => setFormData({...formData, reviewDate: e.target.value})}
                  />
                </div>
    
                <div>
                  <label className="block text-sm font-semibold mb-2">Renewal Cycle (months) *</label>
                  <select 
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.renewalCycle}
                    onChange={(e) => setFormData({...formData, renewalCycle: Number(e.target.value)})}
                  >
                    <option value={12}>12 months</option>
                    <option value={24}>24 months</option>
                    <option value={36}>36 months</option>
                  </select>
                </div>
    
                <div>
                  <label className="block text-sm font-semibold mb-2">Policy Owner *</label>
                  <select 
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.owner}
                    onChange={(e) => setFormData({...formData, owner: e.target.value})}
                  >
                    <option value="">Select Owner</option>
                    <option>Safety Manager</option>
                    <option>HR Manager</option>
                    <option>Operations Manager</option>
                    <option>Fleet Manager</option>
                    <option>Yard Supervisor</option>
                  </select>
                </div>
    
                <div>
                  <label className="block text-sm font-semibold mb-2">Version Number</label>
                  <input 
                    type="text"
                    placeholder="1.0"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.version}
                    onChange={(e) => setFormData({...formData, version: e.target.value})}
                  />
                </div>
    
                <div>
                  <label className="block text-sm font-semibold mb-2">Link to Training (Optional)</label>
                  <input 
                    type="text"
                    placeholder="Training ID"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    value={formData.linkedTraining}
                    onChange={(e) => setFormData({...formData, linkedTraining: e.target.value})}
                  />
                </div>
    
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Assign to Roles *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['All Staff', 'Drivers', 'Mechanics', 'Warehouse Staff', 'Office Staff', 'Managers'].map(role => (
                      <label key={role} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          className="rounded"
                          checked={formData.assignedRoles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, assignedRoles: [...formData.assignedRoles, role]});
                            } else {
                              setFormData({...formData, assignedRoles: formData.assignedRoles.filter(r => r !== role)});
                            }
                          }}
                        />
                        <span className="text-sm">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
    
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Upload Policy Document *</label>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition cursor-pointer"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <FaUpload size={32} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, DOCX, TXT up to 50MB</p>
                    {formData.file && (
                      <p className="text-sm text-green-600 mt-2">✓ {formData.file.name}</p>
                    )}
                    <input 
                      id="file-upload"
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.docx,.txt" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({...formData, file: file});
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
    
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    if (formData.title && formData.policyNumber && formData.effectiveDate && formData.reviewDate) {
                      onUpload(formData);
                    } else {
                      alert('Please fill in all required fields');
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Upload Policy & Assign to Employees
                </button>
                <button onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };
    const EmployeeAcknowledgmentModal = ({ policy, onClose, onAcknowledge }: { 
        policy: Policy; 
        onClose: () => void; 
        onAcknowledge: (data: any) => void 
    }) => {
      const [signature, setSignature] = useState('');
      const [agreed, setAgreed] = useState(false);
    
      const handleAcknowledge = () => {
        const acknowledgment = {
          policyId: policy._id,
          policyVersion: policy.version,
          employeeName: 'Current User', // Would come from auth
          signature: signature,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.100', // Would be captured server-side
          deviceUsed: navigator.userAgent
        };
        onAcknowledge(acknowledgment);
      };
    
      return (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-red-700">Policy Acknowledgment Required</h2>
              <p className="text-gray-600">{policy.title} (Version {policy.version})</p>
            </div>
    
            <div className="p-6 space-y-6">
              {/* Policy Document Display */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                <h3 className="font-bold mb-4">Policy Document</h3>
                <div className="aspect-[8.5/11] bg-white rounded shadow-inner flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FaFilePdf size={64} className="mx-auto mb-4" />
                    <p>Policy PDF would display here</p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      View Full Document
                    </button>
                  </div>
                </div>
              </div>
    
              {/* Acknowledgment Agreement */}
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    <strong>I acknowledge that:</strong> I have read, understood, and agree to comply with 
                    the {policy.title} (Version {policy.version}). I understand that failure to comply may 
                    result in disciplinary action up to and including termination.
                  </span>
                </label>
              </div>
    
              {/* Digital Signature */}
              <div>
                <label className="block text-sm font-semibold mb-2">Digital Signature *</label>
                <input 
                  type="text"
                  placeholder="Type your full name to sign"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  By typing your name, you are providing a legally binding electronic signature
                </p>
              </div>
    
              {/* Timestamp Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p><strong>Acknowledgment Details (for audit trail):</strong></p>
                <p>Date/Time: {new Date().toLocaleString()}</p>
                <p>IP Address: Will be recorded</p>
                <p>Policy Version: {policy.version}</p>
              </div>
    
              <div className="flex gap-4">
                <button 
                  onClick={handleAcknowledge}
                  disabled={!agreed || !signature}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <FaCheckCircle className="inline mr-2" /> Submit Acknowledgment
                </button>
                <button onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    // 4. VERSION HISTORY MODAL
    const VersionHistoryModal = ({ policy, onClose }: { policy: Policy; onClose: () => void }) => {
      const versions = [
        { version: policy.version, date: policy.effectiveDate, changes: 'Current version', publishedBy: policy.owner, status: 'Current' },
        { version: '2.0', date: '2023-01-01', changes: 'Updated safety protocols', publishedBy: 'Safety Manager', status: 'Archived' },
        { version: '1.0', date: '2022-01-01', changes: 'Initial release', publishedBy: 'Safety Manager', status: 'Archived' }
      ];
    
      return (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Version History</h2>
                <p className="text-gray-600">{policy.title}</p>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={24} />
              </button>
            </div>
    
            <div className="p-6">
              <div className="space-y-4">
                {versions.map((v, idx) => (
                  <div key={idx} className={`border-2 rounded-lg p-4 ${v.status === 'Current' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold">Version {v.version}</h3>
                        <p className="text-sm text-gray-600">Published: {new Date(v.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">By: {v.publishedBy}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        v.status === 'Current' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                    <p className="text-sm mb-3">{v.changes}</p>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                        <FaEye className="inline mr-1" /> View
                      </button>
                      <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                        <FaDownload className="inline mr-1" /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    // 5. AUDIT TRAIL EXPORT COMPONENT
    const AuditTrailReport = ({ policies }: { policies: Policy[] }) => {
      const generateAuditReport = () => {
        // Generate detailed audit trail showing all acknowledgments
        const reportData = policies.map((policy: Policy) => ({
          policyNumber: policy.policyNumber,
          title: policy.title,
          version: policy.version,
          acknowledgedCount: policy.acknowledged,
          totalEmployees: policy.totalEmployees,
          complianceRate: ((policy.acknowledged / policy.totalEmployees) * 100).toFixed(1),
          status: policy.status
        }));
    
        console.log('Generating audit report:', reportData);
        alert('Audit report would be exported to PDF with full acknowledgment details');
      };
    
      return (
        <button 
          onClick={generateAuditReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <FaDownload /> Export Full Audit Trail (PDF)
        </button>
      );
    };    
    // --- VIEW 2: POLICY LIBRARY (REQ 4 & 12 Management) ---
    const renderPolicyLibrary = () => (
        <>
            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search policies by title, number, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-gray-400" />
                        {/* Filter by Status */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="under-review">Under Review</option>
                            <option value="draft">Draft</option>
                            <option value="expired">Expired</option>
                        </select>
                        {/* Filter by Category */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Categories</option>
                            {ALL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Policies Table - Version Control & Renewal Tracking */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ background: FLEET_COLORS.gradient }}>
                            <tr>
                                <th className="px-6 py-4 text-left text-white font-semibold">Policy #</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Title / Document Type</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Category</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Assigned Roles</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Document</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Version / Effective Date</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Next Review (Renewal Cycle)</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Acknowledgment</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                                <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading || filteredPolicies.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                                        {loading ? 'Loading policy data...' : 'No policies match your filters.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPolicies.map((policy) => (
                                    <tr key={policy._id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{policy.policyNumber || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-medium">
                                                {getFileIcon(policy.fileType || 'PDF')} {policy.title || 'N/A'}
                                            </div>
                                            {/* Req 4: SOPs, Req 12: File types (PDF, Word, Text) */}
                                            <div className="mt-1">
                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                                    {policy.documentType || 'N/A'}
                                                </span>
                                                {policy.fileType && (
                                                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                                        {policy.fileType}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{policy.category || 'N/A'}</td>
                                        {/* Req 12: Assign policies to specific roles */}
                                        <td className="px-6 py-4 text-sm">
                                            {policy.assignedRoles ? (
                                                <div className="max-w-xs">
                                                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs break-words">
                                                        {policy.assignedRoles}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Not assigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {policy.fileUrl ? (
                                                <div className="flex flex-col gap-1">
                                                    {policy.fileType && (
                                                        <span className="text-xs text-gray-600">
                                                            {policy.fileType}
                                                        </span>
                                                    )}
                                                    {policy.fileName ? (
                                                        <span className="text-xs text-gray-700 truncate max-w-xs" title={policy.fileName}>
                                                            {policy.fileName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-green-600">✓ Document attached</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">No document</span>
                                            )}
                                        </td> 
                                        <td className="px-6 py-4 text-sm">
                                            {/* Req 4, 12.3: Version History/Control */}
                                            <FaSyncAlt className='inline mr-1 text-gray-400 text-xs'/> v.**{policy.version}**
                                            <p className='text-xs text-gray-500'>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold">
                                            {/* Req 12.2: Renewal & Expiration Management */}
                                            <FaCalendarAlt className="inline mr-1 text-yellow-500" />
                                            {new Date(policy.reviewDate).toLocaleDateString()}
                                            <p className='text-xs text-gray-500'>Cycle: **{policy.renewalCycle} months**</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {/* Req 4, 12: Acknowledgment signature/date (Read Receipts) */}
                                            <div className='flex items-center'>
                                                <FaClipboardCheck className='text-green-500 mr-2'/>
                                                <span className='font-bold text-gray-800'>
                                                    {policy.acknowledged}/{policy.totalEmployees} Signed
                                                </span>
                                            </div>
                                            <span className='text-xs text-gray-500'>Read Receipts for Audit</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(policy.status)}`}>
                                                {policy.status.replace('-', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedPolicy(policy);
                                                        setShowVersionHistoryModal(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                                                    title="View Version History"
                                                >
                                                    <FaSyncAlt />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setSelectedPolicy(policy);
                                                        setShowAcknowledgmentModal(true);
                                                    }}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" 
                                                    title="View Acknowledgment Status"
                                                >
                                                    <FaClipboardCheck />
                                                </button>
                                                <button 
                                                    onClick={() => handleDownloadPolicy(policy, 'inline')}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                                                    title="View Policy"
                                                    disabled={!policy.fileUrl}
                                                >
                                                    <FaEye />
                                                </button>
                                                <button 
                                                    onClick={() => handleDownloadPolicy(policy, 'attachment')}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" 
                                                    title="Download Policy"
                                                    disabled={!policy.fileUrl}
                                                >
                                                    <FaDownload />
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
        </>
    );

    return (
        <div className="min-h-screen bg-[#eeeeee] p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2" style={{ color: FLEET_COLORS.dark }}>
                            Company Policy Management & Renewal Tracking 📑
                        </h1>
                        <p className="text-gray-600">Centralized policy library, version control, and **mandatory acknowledgment tracking** for CLC compliance (Req 4 & 12).</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Req 4, 12: Upload policy */}
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2 font-semibold"
                            style={{
                                background: FLEET_COLORS.gradient,
                                boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
                            }}
                        >
                            <FaPlus /> Upload New Policy
                        </button>
                        {/* Audit Trail Export */}
                        <AuditTrailReport policies={policies} />
                    </div>
                </div>

                {/* Tabs for Dashboard and Library (Serving as Sub-Menus) */}
                <div className="bg-white rounded-xl shadow-lg mb-6">
                    <div className="flex border-b border-gray-200">
                        {/* Sub-Menu 1: Compliance Dashboard (Audit View) */}
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex-1 px-6 py-4 font-semibold transition ${
                                activeTab === 'dashboard' ? 'border-b-2 text-purple-600' : 'text-gray-600 hover:text-gray-900'
                            }`}
                            style={activeTab === 'dashboard' ? { borderColor: FLEET_COLORS.primary } : {}}
                        >
                            <FaChartPie className="inline mr-2" /> Compliance Dashboard (Audit View)
                        </button>
                        {/* Sub-Menu 2: Policy Library (Management View) */}
                        <button
                            onClick={() => setActiveTab('library')}
                            className={`flex-1 px-6 py-4 font-semibold transition ${
                                activeTab === 'library' ? 'border-b-2 text-purple-600' : 'text-gray-600 hover:text-gray-900'
                            }`}
                            style={activeTab === 'library' ? { borderColor: FLEET_COLORS.primary } : {}}
                        >
                            <FaFileAlt className="inline mr-2" /> Policy Library (Version & Renewal Control)
                        </button>
                    </div>
                </div>

                {/* Content Render */}
                {activeTab === 'dashboard' ? renderPolicyDashboard() : renderPolicyLibrary()}
            </div>

            {/* Modals */}
            {showUploadModal && (
                <PolicyUploadModal 
                    onClose={() => setShowUploadModal(false)}
                    onUpload={async (data) => {
                        try {
                            const formData = new FormData();
                            formData.append('title', data.title);
                            formData.append('category', data.category);
                            formData.append('version', data.version);
                            formData.append('effectiveDate', data.effectiveDate);
                            formData.append('reviewDate', data.reviewDate);
                            formData.append('status', 'draft');
                            formData.append('documentType', data.documentType.toLowerCase());
                            
                            if (data.file) {
                                formData.append('file', data.file);
                            }

                            const response = await createPolicyDocument(formData);
                            if (response?.success) {
                                showNotification('success', 'Policy document created successfully');
                                setShowUploadModal(false);
                                fetchPolicies();
                            } else {
                                showNotification('error', response?.message || 'Failed to create policy document');
                            }
                        } catch (error: any) {
                            console.error('Error creating policy document:', error);
                            showNotification('error', error?.response?.data?.message || 'Failed to create policy document');
                        }
                    }}
                />
            )}

            {showAcknowledgmentModal && selectedPolicy && (
                <EmployeeAcknowledgmentModal 
                    policy={selectedPolicy}
                    onClose={() => {
                        setShowAcknowledgmentModal(false);
                        setSelectedPolicy(null);
                    }}
                    onAcknowledge={(data) => {
                        console.log('Acknowledgment submitted:', data);
                        // Update policy acknowledgment count
                        setPolicies(prev => prev.map(p => 
                            p._id === selectedPolicy._id 
                                ? { ...p, acknowledged: p.acknowledged + 1 }
                                : p
                        ));
                        setShowAcknowledgmentModal(false);
                        setSelectedPolicy(null);
                    }}
                />
            )}

            {showVersionHistoryModal && selectedPolicy && (
                <VersionHistoryModal 
                    policy={selectedPolicy}
                    onClose={() => {
                        setShowVersionHistoryModal(false);
                        setSelectedPolicy(null);
                    }}
                />
            )}
        </div>
    );
};

export default PolicyManagementModule;
