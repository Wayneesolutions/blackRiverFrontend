import React, { useState, useEffect } from 'react';
import { 
  FaUsersCog, 
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
  FaClipboardList,
  FaExclamationTriangle,
  FaTimes,
  FaInfoCircle
} from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import {
  createCommitteeMember,
  getCommitteeMembers,
  updateCommitteeMember,
  deleteCommitteeMember,
  createCAPA,
  getCAPAs,
  updateCAPA,
  deleteCAPA
} from '../../../../axios/api/healthSafety';
import { getEmployees } from '../../../../axios/api/account.payroll';

interface CommitteeMember {
  _id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
}

interface CAPA {
  _id: string;
  capaNumber: string;
  title: string;
  type: 'corrective' | 'preventive';
  source: string;
  issueDate: string;
  dueDate: string;
  status: 'open' | 'in-progress' | 'completed' | 'overdue';
  assignedTo: string | any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface Employee {
  _id: string;
  name: string;
  email: string;
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

const CommitteeCAPA = () => {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [capas, setCapas] = useState<CAPA[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'committee' | 'capa'>('committee');
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [notificationId, setNotificationId] = useState(0);

  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [showCAPAModal, setShowCAPAModal] = useState(false);
  const [editingCAPA, setEditingCAPA] = useState<CAPA | null>(null);

  // Form states
  const [memberFormData, setMemberFormData] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
    phone: ''
  });

  const [capaFormData, setCapaFormData] = useState({
    title: '',
    type: 'corrective' as 'corrective' | 'preventive',
    source: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    status: 'open' as 'open' | 'in-progress' | 'completed' | 'overdue',
    assignedTo: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical'
  });

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = notificationId + 1;
    setNotificationId(id);
    setNotifications([...notifications, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const fetchMembers = async () => {
    try {
      const response = await getCommitteeMembers();
      if (response?.success && Array.isArray(response.data)) {
        setMembers(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching committee members:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to fetch committee members');
    }
  };

  const fetchCAPAs = async () => {
    try {
      const response = await getCAPAs({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined
      });
      if (response?.success && Array.isArray(response.data)) {
        setCapas(response.data.map((item: any) => ({
          _id: item._id,
          capaNumber: item.capaNumber,
          title: item.title,
          type: item.type,
          source: item.source,
          issueDate: item.issueDate,
          dueDate: item.dueDate,
          status: item.status,
          assignedTo: typeof item.assignedTo === 'object' && item.assignedTo?.name 
            ? item.assignedTo.name 
            : item.assignedTo || 'Unknown',
          priority: item.priority
        })));
      }
    } catch (error: any) {
      console.error('Error fetching CAPAs:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to fetch CAPAs');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      if (response?.success && Array.isArray(response.data)) {
        setEmployees(response.data.map((emp: any) => ({
          _id: emp._id,
          name: emp.name,
          email: emp.email
        })));
      }
    } catch (error: any) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMembers(), fetchCAPAs(), fetchEmployees()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'capa') {
      fetchCAPAs();
    }
  }, [filterStatus, searchTerm, activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleCreateMember = () => {
    setEditingMember(null);
    setMemberFormData({
      name: '',
      role: '',
      department: '',
      email: '',
      phone: ''
    });
    setShowMemberModal(true);
  };

  const handleEditMember = (member: CommitteeMember) => {
    setEditingMember(member);
    setMemberFormData({
      name: member.name || '',
      role: member.role || '',
      department: member.department || '',
      email: member.email || '',
      phone: member.phone || ''
    });
    setShowMemberModal(true);
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this committee member?')) return;
    
    try {
      const response = await deleteCommitteeMember(id);
      if (response?.success) {
        showNotification('success', 'Committee member deleted successfully');
        fetchMembers();
      } else {
        showNotification('error', response?.message || 'Failed to delete committee member');
      }
    } catch (error: any) {
      console.error('Error deleting committee member:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete committee member');
    }
  };

  const handleSubmitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        const response = await updateCommitteeMember(editingMember._id, memberFormData);
        if (response?.success) {
          showNotification('success', 'Committee member updated successfully');
          setShowMemberModal(false);
          fetchMembers();
        } else {
          showNotification('error', response?.message || 'Failed to update committee member');
        }
      } else {
        const response = await createCommitteeMember(memberFormData);
        if (response?.success) {
          showNotification('success', 'Committee member created successfully');
          setShowMemberModal(false);
          fetchMembers();
        } else {
          showNotification('error', response?.message || 'Failed to create committee member');
        }
      }
    } catch (error: any) {
      console.error('Error saving committee member:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to save committee member');
    }
  };

  const handleCreateCAPA = () => {
    setEditingCAPA(null);
    setCapaFormData({
      title: '',
      type: 'corrective',
      source: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      status: 'open',
      assignedTo: '',
      priority: 'medium'
    });
    setShowCAPAModal(true);
  };

  const handleEditCAPA = (capa: CAPA) => {
    setEditingCAPA(capa);
    // Find the employee ID if assignedTo is a name
    const assignedToId = typeof capa.assignedTo === 'string' 
      ? employees.find(emp => emp.name === capa.assignedTo)?._id || ''
      : (capa.assignedTo?._id || '');
    
    setCapaFormData({
      title: capa.title || '',
      type: capa.type || 'corrective',
      source: capa.source || '',
      issueDate: capa.issueDate ? new Date(capa.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: capa.dueDate ? new Date(capa.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: capa.status || 'open',
      assignedTo: assignedToId,
      priority: capa.priority || 'medium'
    });
    setShowCAPAModal(true);
  };

  const handleDeleteCAPA = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this CAPA?')) return;
    
    try {
      const response = await deleteCAPA(id);
      if (response?.success) {
        showNotification('success', 'CAPA deleted successfully');
        fetchCAPAs();
      } else {
        showNotification('error', response?.message || 'Failed to delete CAPA');
      }
    } catch (error: any) {
      console.error('Error deleting CAPA:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete CAPA');
    }
  };

  const handleSubmitCAPA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCAPA) {
        const response = await updateCAPA(editingCAPA._id, capaFormData);
        if (response?.success) {
          showNotification('success', 'CAPA updated successfully');
          setShowCAPAModal(false);
          fetchCAPAs();
        } else {
          showNotification('error', response?.message || 'Failed to update CAPA');
        }
      } else {
        const response = await createCAPA(capaFormData);
        if (response?.success) {
          showNotification('success', 'CAPA created successfully');
          setShowCAPAModal(false);
          fetchCAPAs();
        } else {
          showNotification('error', response?.message || 'Failed to create CAPA');
        }
      }
    } catch (error: any) {
      console.error('Error saving CAPA:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to save CAPA');
    }
  };

  const filteredCapas = capas.filter(capa => {
    const matchesSearch = 
      capa.capaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capa.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof capa.assignedTo === 'string' && capa.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || capa.status === filterStatus;
    
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
              H&S Committee & CAPA
            </h1>
            <p className="text-gray-600">Manage Health & Safety Committee and Corrective/Preventive Actions</p>
          </div>
          <button
            onClick={activeTab === 'committee' ? handleCreateMember : handleCreateCAPA}
            className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2"
            style={{
              background: FLEET_COLORS.gradient,
              boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
            }}
          >
            <FaPlus /> {activeTab === 'committee' ? 'Add Member' : 'New CAPA'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('committee')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'committee'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'committee' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaUsersCog className="inline mr-2" />
              H&S Committee
            </button>
            <button
              onClick={() => setActiveTab('capa')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'capa'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'capa' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaClipboardList className="inline mr-2" />
              CAPA Management
            </button>
          </div>
        </div>

        {/* Committee Tab */}
        {activeTab === 'committee' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No committee members found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map((member) => (
                    <div key={member._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{member.name}</h3>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          {member.role}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Department:</strong> {member.department}</p>
                        <p><strong>Email:</strong> {member.email}</p>
                        <p><strong>Phone:</strong> {member.phone}</p>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleEditMember(member)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CAPA Tab */}
        {activeTab === 'capa' && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search CAPA..."
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
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CAPA Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: FLEET_COLORS.gradient }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-white font-semibold">CAPA #</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Title</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Source</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Issue Date</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Due Date</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Assigned To</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Priority</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredCapas.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                          No CAPA items found
                        </td>
                      </tr>
                    ) : (
                      filteredCapas.map((capa) => (
                        <tr key={capa._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{capa.capaNumber}</td>
                          <td className="px-6 py-4">{capa.title}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              capa.type === 'corrective' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {capa.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">{capa.source}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt className="text-gray-400" />
                              {new Date(capa.issueDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt className="text-gray-400" />
                              {new Date(capa.dueDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FaUser className="text-gray-400" />
                              {typeof capa.assignedTo === 'string' ? capa.assignedTo : (capa.assignedTo?.name || 'Unknown')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(capa.priority)}`}>
                              {capa.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(capa.status)}`}>
                              {capa.status.replace('-', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditCAPA(capa)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteCAPA(capa._id)}
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
          </>
        )}

        {/* Committee Member Modal */}
        {showMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{editingMember ? 'Edit Member' : 'Add Member'}</h2>
                  <button
                    onClick={() => setShowMemberModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmitMember} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={memberFormData.name}
                    onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <input
                    type="text"
                    value={memberFormData.role}
                    onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
                    required
                    placeholder="e.g., Chairperson, Member"
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <input
                    type="text"
                    value={memberFormData.department}
                    onChange={(e) => setMemberFormData({ ...memberFormData, department: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={memberFormData.email}
                    onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={memberFormData.phone}
                    onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowMemberModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white"
                    style={{ background: FLEET_COLORS.gradient }}
                  >
                    {editingMember ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CAPA Modal */}
        {showCAPAModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{editingCAPA ? 'Edit CAPA' : 'New CAPA'}</h2>
                  <button
                    onClick={() => setShowCAPAModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmitCAPA} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={capaFormData.title}
                    onChange={(e) => setCapaFormData({ ...capaFormData, title: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={capaFormData.type}
                      onChange={(e) => setCapaFormData({ ...capaFormData, type: e.target.value as any })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="corrective">Corrective</option>
                      <option value="preventive">Preventive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                    <select
                      value={capaFormData.priority}
                      onChange={(e) => setCapaFormData({ ...capaFormData, priority: e.target.value as any })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source *</label>
                  <input
                    type="text"
                    value={capaFormData.source}
                    onChange={(e) => setCapaFormData({ ...capaFormData, source: e.target.value })}
                    required
                    placeholder="e.g., Incident Report, Safety Audit"
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                    <input
                      type="date"
                      value={capaFormData.issueDate}
                      onChange={(e) => setCapaFormData({ ...capaFormData, issueDate: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                    <input
                      type="date"
                      value={capaFormData.dueDate}
                      onChange={(e) => setCapaFormData({ ...capaFormData, dueDate: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      value={capaFormData.status}
                      onChange={(e) => setCapaFormData({ ...capaFormData, status: e.target.value as any })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To *</label>
                    <select
                      value={capaFormData.assignedTo}
                      onChange={(e) => setCapaFormData({ ...capaFormData, assignedTo: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCAPAModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white"
                    style={{ background: FLEET_COLORS.gradient }}
                  >
                    {editingCAPA ? 'Update' : 'Create'}
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

export default CommitteeCAPA;
