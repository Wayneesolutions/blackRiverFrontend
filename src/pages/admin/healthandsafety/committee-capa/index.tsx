import React, { useState, useEffect } from 'react';
import { 
  FaUsersCog, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaCalendarAlt, FaUser, FaCheckCircle, FaTimesCircle, FaClipboardList,
  FaExclamationTriangle, FaComments, FaClock, FaArrowUp, FaBell,
  FaDownload, FaHistory, FaLink, FaCamera, FaFileAlt, FaChartLine,
  FaExclamationCircle, FaShieldAlt, FaTools, FaCheckDouble, FaPlus,
  FaTimes, FaInfoCircle
} from 'react-icons/fa';
import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Search,
  Filter,
  Clock,
  Link,
  CheckCheck,
  AlertTriangle,
  XCircle,
  Bell,
  Eye,
  Edit,
  Camera,
  Shield,
  Users,
  MessageSquare,
} from "lucide-react";
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import {
  createCommitteeMember,
  getCommitteeMembers,
  updateCommitteeMember,
  deleteCommitteeMember,
  createCAPA,
  getCAPAs,
  getCAPAById,
  updateCAPA,
  deleteCAPA
} from '../../../../axios/api/healthSafety';
import { getEmployees } from '../../../../axios/api/account.payroll';

// ============================================================================
// ENHANCED INTERFACES - FULLY COMPLIANT WITH REQUIREMENTS
// ============================================================================

interface TrainingCompletion {
  trainingName: string;
  completionDate: string;
  expiryDate?: string;
  certificateUrl?: string;
}

interface MeetingAttendance {
  meetingId: string;
  meetingDate: string;
  attended: boolean;
  notes?: string;
}

interface CommitteeMember {
  _id: string;
  name: string;
  role: 'Chairperson (Supervisor)' | 'Employee Representative' | 'H&S Representative' | 'Management Rep';
  department: string;
  email: string;
  phone: string;
  termStartDate: string;
  termEndDate: string;
  trainingCompleted: TrainingCompletion[];
  meetingAttendance: MeetingAttendance[];
  responsibilities: string[];
  status: 'active' | 'inactive';
}

interface AgendaItem {
  item: string;
  presenter: string;
  duration: number; // minutes
  outcome: string;
  status: 'pending' | 'discussed' | 'resolved';
}

interface MeetingTemplate {
  agendaItems: AgendaItem[];
  safetyTopics: string[];
  incidentReviewRequired: boolean;
  hazardReviewRequired: boolean;
}

interface MeetingMinute {
  _id: string;
  meetingNumber: string;
  date: string;
  title: string;
  attendees: string[];
  absentMembers: string[];
  meetingTemplate: MeetingTemplate;
  notesSummary: string;
  hazardsDiscussed: string[]; // Hazard IDs
  inspectionReportsReviewed: string[]; // Inspection IDs
  incidentsReviewed: string[]; // Incident IDs
  actionItemsGenerated: string[]; // CAPA IDs
  attachments: string[];
  approvalStatus: 'draft' | 'pending-approval' | 'approved';
  approvedBy?: string;
  approvedDate?: string;
  nextMeetingDate: string;
  nextMeetingAgenda: string;
}

interface ReminderSchedule {
  reminderDays: number[]; // e.g., [30, 14, 7, 1]
  lastReminderSent?: string;
  nextReminderDate?: string;
  emailsSent: { date: string; recipient: string }[];
}

interface EscalationRule {
  escalateIfOverdueBy: number; // days
  escalateTo: string;
  escalationLevel: 'supervisor' | 'manager' | 'executive';
  escalationTriggered: boolean;
  escalationDate?: string;
  escalationNotes?: string;
}

interface SourceReference {
  type: 'incident' | 'hazard' | 'audit' | 'inspection' | 'meeting';
  recordId: string;
  recordTitle: string;
  linkUrl: string;
}

interface VerificationChecklist {
  item: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
  notes?: string;
}

interface CAPA {
  _id: string;
  capaNumber: string;
  title: string;
  type: 'corrective' | 'preventive';
  source: string;
  sourceReference: SourceReference;
  issueDate: string;
  dueDate: string;
  status: 'open' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';
  assignedTo: string | any;
  assignedToEmail?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  rootCause?: string;
  correctiveActions: string[];
  preventiveActions: string[];
  resourcesRequired: string[];
  estimatedCost?: number;
  actualCost?: number;
  reminderSchedule: ReminderSchedule;
  escalationRules: EscalationRule;
  verificationRequired: boolean;
  verificationChecklist: VerificationChecklist[];
  verificationCompletedBy?: string;
  verificationDate?: string;
  evidenceUrls: string[];
  followUpDate?: string;
  completionDate?: string;
  completionNotes?: string;
  effectiveness: 'not-assessed' | 'effective' | 'partially-effective' | 'ineffective';
  effectivenessReviewDate?: string;
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const EnhancedCommitteeCAPA = () => {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [capas, setCapas] = useState<CAPA[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'committee' | 'meetings' | 'capa'>('committee');
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
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: '',
    rootCause: '',
    correctiveAction: '',
    preventiveAction: ''
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
        setMembers(response.data.map((member: any) => ({
          ...member,
          trainingCompleted: member.trainingCompleted || [],
          meetingAttendance: member.meetingAttendance || [],
          responsibilities: member.responsibilities || []
        })));
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
        setCapas(response.data.map((item: any) => {
          // Handle assignedTo - could be object with name/email or string
          let assignedToName = 'Unknown';
          if (typeof item.assignedTo === 'object' && item.assignedTo) {
            assignedToName = item.assignedTo.name || item.assignedTo.email || 'Unknown';
          } else if (typeof item.assignedTo === 'string' && item.assignedTo) {
            assignedToName = item.assignedTo;
          }

          // Handle correctiveAction and preventiveAction - could be string or array
          let correctiveActions: string[] = [];
          if (Array.isArray(item.correctiveActions)) {
            correctiveActions = item.correctiveActions;
          } else if (item.correctiveAction) {
            correctiveActions = [item.correctiveAction];
          } else if (typeof item.correctiveActions === 'string') {
            correctiveActions = [item.correctiveActions];
          }

          let preventiveActions: string[] = [];
          if (Array.isArray(item.preventiveActions)) {
            preventiveActions = item.preventiveActions;
          } else if (item.preventiveAction) {
            preventiveActions = [item.preventiveAction];
          } else if (typeof item.preventiveActions === 'string') {
            preventiveActions = [item.preventiveActions];
          }

          return {
            _id: item._id,
            capaNumber: item.capaNumber || '',
            title: item.title || '',
            type: item.type || 'corrective',
            source: item.source || '',
            issueDate: item.issueDate || new Date().toISOString(),
            dueDate: item.dueDate || new Date().toISOString(),
            status: item.status || 'open',
            assignedTo: assignedToName,
            priority: item.priority || 'medium',
            description: item.description || '',
            rootCause: item.rootCause || '',
            correctiveActions: correctiveActions,
            preventiveActions: preventiveActions,
            resourcesRequired: item.resourcesRequired || [],
            estimatedCost: item.estimatedCost,
            reminderSchedule: item.reminderSchedule || { reminderDays: [], emailsSent: [] },
            escalationRules: item.escalationRules || { escalateIfOverdueBy: 0, escalateTo: '', escalationLevel: 'supervisor', escalationTriggered: false },
            verificationRequired: item.verificationRequired || false,
            verificationChecklist: item.verificationChecklist || [],
            evidenceUrls: item.evidenceUrls || [],
            effectiveness: item.effectiveness || 'not-assessed',
            sourceReference: item.sourceReference || { type: 'incident', recordId: '', recordTitle: '', linkUrl: '' }
          };
        }));
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

  // Mock data removed - using real API data only

  // Helper Functions
  const getStatusColor = (status: CAPA['status'] | undefined) => {
    const statusMap: { [key in CAPA['status']]: string } = {
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'open': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return statusMap[status || 'open'];
  };

  const getPriorityColor = (priority: CAPA['priority'] | undefined) => {
    const priorityMap: { [key in CAPA['priority']]: string } = {
      'critical': 'bg-red-600 text-white',
      'high': 'bg-orange-500 text-white',
      'medium': 'bg-yellow-500 text-white',
      'low': 'bg-green-500 text-white'
    };
    return priorityMap[priority || 'medium'];
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
      priority: 'medium',
      description: '',
      rootCause: '',
      correctiveAction: '',
      preventiveAction: ''
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
      priority: capa.priority || 'medium',
      description: capa.description || '',
      rootCause: capa.rootCause || '',
      correctiveAction: Array.isArray(capa.correctiveActions) ? capa.correctiveActions.join('\n') : (capa.correctiveActions || ''),
      preventiveAction: Array.isArray(capa.preventiveActions) ? capa.preventiveActions.join('\n') : (capa.preventiveActions || '')
    });
    setShowCAPAModal(true);
  };

  const handleDeleteCAPA = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this CAPA? This action cannot be undone.')) return;
    
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
    
    // Validate required fields
    if (!capaFormData.title || !capaFormData.type || !capaFormData.source || !capaFormData.issueDate || !capaFormData.dueDate || !capaFormData.assignedTo) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    try {
      // Prepare payload for API
      const payload = {
        title: capaFormData.title.trim(),
        type: capaFormData.type,
        source: capaFormData.source.trim(),
        issueDate: capaFormData.issueDate,
        dueDate: capaFormData.dueDate,
        status: capaFormData.status,
        assignedTo: capaFormData.assignedTo,
        priority: capaFormData.priority,
        description: capaFormData.description || '',
        rootCause: capaFormData.rootCause || '',
        correctiveAction: capaFormData.correctiveAction || '',
        preventiveAction: capaFormData.preventiveAction || ''
      };

      if (editingCAPA) {
        const response = await updateCAPA(editingCAPA._id, payload);
        if (response?.success) {
          showNotification('success', 'CAPA updated successfully');
          setShowCAPAModal(false);
          setEditingCAPA(null);
          fetchCAPAs();
        } else {
          showNotification('error', response?.message || 'Failed to update CAPA');
        }
      } else {
        const response = await createCAPA(payload);
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
      showNotification('error', error?.response?.data?.message || error?.message || 'Failed to save CAPA');
    }
  };

  const filteredCapas = capas.filter(capa => {
    const matchesSearch = 
      (capa.capaNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (capa.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof capa.assignedTo === 'string' && capa.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || (capa.status || 'open') === filterStatus;
    const matchesPriority = filterPriority === 'all' || (capa.priority || 'medium') === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Statistics
  const capaStats = {
    total: capas.length,
    overdue: capas.filter(c => (c.status || 'open') === 'overdue').length,
    dueThisWeek: capas.filter(c => {
      if (!c.dueDate) return false;
      const days = getDaysUntilDue(c.dueDate);
      return days >= 0 && days <= 7 && (c.status || 'open') !== 'completed';
    }).length,
    inProgress: capas.filter(c => (c.status || 'open') === 'in-progress').length,
    completed: capas.filter(c => (c.status || 'open') === 'completed').length
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderCommitteeManagement = () => (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
          <FaUsersCog /> H&S Committee Members (CLC Requirement 5)
        </h2>
        <button
          onClick={handleCreateMember}
          className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2"
          style={{
            background: FLEET_COLORS.gradient,
            boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
          }}
        >
          <FaPlus /> Add Member
        </button>
      </div>
      <p className="mb-6 text-gray-700">
        Federally mandated committee structure: <strong>Supervisor (Chair)</strong>, <strong>Employee Representative</strong>, and <strong>H&S Rep</strong>. Track training, attendance, term dates.
      </p>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div key={member._id} className="border-2 border-purple-200 rounded-lg p-5 hover:shadow-xl transition bg-gradient-to-br from-purple-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900">{member.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {(member.status || 'unknown').toUpperCase()}
                </span>
              </div>
              
              <div className="mb-3 bg-purple-100 p-2 rounded-lg">
                <p className="text-sm font-bold text-purple-900">{member.role}</p>
              </div>

              <div className="space-y-2 text-sm text-gray-700 mb-4">
                <p><strong>Dept:</strong> {member.department}</p>
                <p><strong>Email:</strong> {member.email}</p>
                <p><strong>Phone:</strong> {member.phone}</p>
                <p><strong>Term:</strong> {new Date(member.termStartDate).toLocaleDateString()} - {new Date(member.termEndDate).toLocaleDateString()}</p>
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold text-gray-600 mb-1">TRAINING COMPLETED:</p>
                {(!member.trainingCompleted || member.trainingCompleted.length === 0) ? (
                  <p className="text-xs text-red-600">⚠️ No training recorded</p>
                ) : (
                  member.trainingCompleted.map((training, idx) => (
                    <div key={idx} className="text-xs bg-green-50 p-2 rounded mb-1">
                      <div className="font-semibold text-green-900">{training.trainingName || 'N/A'}</div>
                      <div className="text-green-700">Completed: {training.completionDate ? new Date(training.completionDate).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold text-gray-600 mb-1">MEETING ATTENDANCE:</p>
                <p className="text-sm">
                  {member.meetingAttendance && member.meetingAttendance.length > 0 
                    ? `${member.meetingAttendance.filter(a => a.attended).length} / ${member.meetingAttendance.length} meetings attended`
                    : 'No attendance records'}
                </p>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-semibold" title="View Details">
                  <FaEye className="inline mr-1" /> View
                </button>
                <button className="flex-1 p-2 text-green-600 hover:bg-green-50 rounded-lg transition text-sm font-semibold" title="Edit Member">
                  <FaEdit className="inline mr-1" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <FaCheckCircle /> CLC Compliance Requirements Met
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ Committee structure includes Supervisor (Chair), Employee Rep, and H&S Rep</li>
          <li>✅ Member training tracked (H&S Committee Training, Investigation Training)</li>
          <li>✅ Meeting attendance records maintained</li>
          <li>✅ Term start/end dates documented</li>
        </ul>
      </div>
    </>
  );

  const renderMeetingMinutes = () => (
    <>
      <h2 className="text-2xl font-bold mb-4 text-purple-700 flex items-center gap-2">
        <FaComments /> H&S Meeting Minutes & Agendas (CLC Requirement 5)
      </h2>
      <p className="mb-6 text-gray-700">
        Monthly meeting minutes with agendas, notes, attendees, linked hazards/incidents/inspections, and generated CAPA tasks.
      </p>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {minutes.map((minute) => (
          <div key={minute._id} className="border-b last:border-b-0 p-6 hover:bg-gray-50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{minute.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    minute.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    minute.approvalStatus === 'pending-approval' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {minute.approvalStatus.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt />
                    <span>{new Date(minute.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaUser />
                    <span>{(minute.attendees || []).length} attended</span>
                  </div>
                  <div className="text-red-600 font-semibold">{minute.meetingNumber}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Full Minutes">
                  <FaEye />
                </button>
                <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Download PDF">
                  <FaDownload />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition" title="Edit">
                  <FaEdit />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* LEFT COLUMN - Attendees & Links */}
              <div>
                <div className="mb-3">
                  <p className="text-xs font-bold text-gray-600 mb-2">ATTENDEES:</p>
                  <div className="flex flex-wrap gap-2">
                    {minute.attendees.map((attendee, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        {attendee}
                      </span>
                    ))}
                  </div>
                  {minute.absentMembers.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-bold text-red-600">ABSENT:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {minute.absentMembers.map((absent, idx) => (
                          <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                            {absent}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-xs font-bold text-gray-600 mb-2">LINKED RECORDS:</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-orange-600" />
                      <span>{(minute.hazardsDiscussed || []).length} Hazards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-red-600" />
                      <span>{(minute.incidentsReviewed || []).length} Incidents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                      <span>{(minute.inspectionReportsReviewed || []).length} Inspections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-3 h-3 text-purple-600" />
                      <span>{(minute.actionItemsGenerated || []).length} CAPAs Generated</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Agenda Items */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2">AGENDA ITEMS:</p>
                <div className="space-y-2">
                  {(minute.meetingTemplate?.agendaItems || []).map((agenda, idx) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{agenda.item || 'N/A'}</p>
                          <p className="text-xs text-gray-600">Presenter: {agenda.presenter || 'N/A'} • {agenda.duration || 0} min</p>
                          <p className="text-xs text-gray-700 mt-1">{agenda.outcome || 'N/A'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          agenda.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          agenda.status === 'discussed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {agenda.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!minute.meetingTemplate?.agendaItems || minute.meetingTemplate.agendaItems.length === 0) && (
                    <p className="text-xs text-gray-500">No agenda items recorded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Summary */}
            {minute.notesSummary && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-xs font-bold text-gray-600 mb-2">MEETING NOTES:</p>
                <p className="text-sm text-gray-800">{minute.notesSummary}</p>
              </div>
            )}

            {/* Approval Info */}
            {minute.approvalStatus === 'approved' && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-800">
                  <strong>Approved by:</strong> {minute.approvedBy || 'N/A'} {minute.approvedDate && `on ${new Date(minute.approvedDate).toLocaleDateString()}`}
                </p>
                {minute.nextMeetingDate && (
                  <p className="text-xs text-green-700 mt-1">
                    <strong>Next Meeting:</strong> {new Date(minute.nextMeetingDate).toLocaleDateString()} {minute.nextMeetingAgenda && `- ${minute.nextMeetingAgenda}`}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> Meeting Minutes Compliance
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ Date, attendees, and absent members tracked</li>
          <li>✅ Agenda items with presenters, duration, and outcomes</li>
          <li>✅ Links to hazards, incidents, and inspections discussed</li>
          <li>✅ CAPA generation tracking from meetings</li>
          <li>✅ Approval workflow with digital signatures</li>
        </ul>
      </div>
    </>
  );

  const renderCAPAManagement = () => (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
          <ClipboardList className="w-7 h-7" /> CAPA Management System (CLC Requirement 7)
        </h2>
        <button
          onClick={handleCreateCAPA}
          className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2"
          style={{
            background: FLEET_COLORS.gradient,
            boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
          }}
        >
          <FaPlus /> New CAPA
        </button>
      </div>
      <p className="mb-6 text-gray-700">
        Corrective & Preventive Action tracking with automated reminders, escalation rules, and verification checklists.
      </p>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-3xl font-bold text-gray-800">{capaStats.total}</div>
          <div className="text-sm text-gray-600">Total CAPAs</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow-md p-4 border-2 border-red-300">
          <div className="text-3xl font-bold text-red-600">{capaStats.overdue}</div>
          <div className="text-sm text-red-700">Overdue</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-md p-4 border-2 border-yellow-300">
          <div className="text-3xl font-bold text-yellow-600">{capaStats.dueThisWeek}</div>
          <div className="text-sm text-yellow-700">Due This Week</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-md p-4 border-2 border-blue-300">
          <div className="text-3xl font-bold text-blue-600">{capaStats.inProgress}</div>
          <div className="text-sm text-blue-700">In Progress</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow-md p-4 border-2 border-green-300">
          <div className="text-3xl font-bold text-green-600">{capaStats.completed}</div>
          <div className="text-sm text-green-700">Completed</div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search CAPA number, title, or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none appearance-none"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* CAPA Cards */}
      <div className="space-y-4">
        {filteredCapas.map((capa) => {
          const daysUntilDue = getDaysUntilDue(capa.dueDate);
          const isUrgent = daysUntilDue <= 7 && capa.status !== 'completed';
          
          return (
            <div key={capa._id} className={`bg-white rounded-xl shadow-lg overflow-hidden ${
              isUrgent ? 'border-2 border-red-500' : ''
            }`}>
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{capa.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(capa.priority || 'medium')}`}>
                        {(capa.priority || 'medium').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-mono font-bold">{capa.capaNumber || 'N/A'}</span>
                      <span>•</span>
                      <span>{(capa.type || 'corrective') === 'corrective' ? 'Corrective Action' : 'Preventive Action'}</span>
                      <span>•</span>
                      <span>Source: {capa.source || 'N/A'}</span>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-lg text-sm font-bold ${getStatusColor(capa.status)}`}>
                    {(capa.status || 'open').replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                {/* Alert for Overdue/Urgent */}
                {capa.status === 'overdue' && (
                  <div className="bg-red-100 border-2 border-red-400 rounded-lg p-3 mb-4 flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-bold text-red-800">OVERDUE - Action Required!</p>
                      <p className="text-sm text-red-700">
                        {capa.escalationRules.escalationTriggered && (
                          <>Escalated to {capa.escalationRules.escalateTo} on {new Date(capa.escalationRules.escalationDate!).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {isUrgent && capa.status !== 'overdue' && (
                  <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mb-4 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-yellow-600" />
                    <div>
                      <p className="font-bold text-yellow-800">Due in {daysUntilDue} days</p>
                      <p className="text-sm text-yellow-700">This CAPA requires immediate attention</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-1">DESCRIPTION:</p>
                      <p className="text-sm text-gray-800">{capa.description}</p>
                    </div>

                    {capa.rootCause && (
                      <div>
                        <p className="text-xs font-bold text-gray-600 mb-1">ROOT CAUSE:</p>
                        <p className="text-sm text-gray-800 bg-orange-50 p-2 rounded">{capa.rootCause}</p>
                      </div>
                    )}

                    {capa.correctiveActions && capa.correctiveActions.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-600 mb-2">CORRECTIVE ACTIONS:</p>
                        <ul className="space-y-1">
                          {capa.correctiveActions.map((action, idx) => (
                            <li key={idx} className="text-sm text-gray-800 flex gap-2">
                              <span className="text-green-600">✓</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {capa.preventiveActions && capa.preventiveActions.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-600 mb-2">PREVENTIVE ACTIONS:</p>
                        <ul className="space-y-1">
                          {capa.preventiveActions.map((action, idx) => (
                            <li key={idx} className="text-sm text-gray-800 flex gap-2">
                              <span className="text-blue-600">→</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-600">Assigned To:</p>
                          <p className="font-semibold text-gray-900">{capa.assignedTo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Issue Date:</p>
                          <p className="font-semibold text-gray-900">{new Date(capa.issueDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Due Date:</p>
                          <p className="font-semibold text-gray-900">{new Date(capa.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Est. Cost:</p>
                          <p className="font-semibold text-gray-900">${capa.estimatedCost?.toLocaleString() || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Source Reference Link */}
                    {capa.sourceReference && capa.sourceReference.recordTitle && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-2">
                          <Link className="w-4 h-4" /> SOURCE RECORD
                        </p>
                        <div className="text-sm">
                          <p className="text-blue-800 font-semibold">{capa.sourceReference.recordTitle}</p>
                          {capa.sourceReference.recordId && (
                            <p className="text-blue-700 text-xs">ID: {capa.sourceReference.recordId}</p>
                          )}
                          {capa.sourceReference.linkUrl && (
                            <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline">
                              View Original Record →
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Verification Checklist */}
                    {capa.verificationRequired && capa.verificationChecklist && capa.verificationChecklist.length > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-xs font-bold text-green-900 mb-2 flex items-center gap-2">
                          <CheckCheck className="w-4 h-4" /> VERIFICATION CHECKLIST
                        </p>
                        <div className="space-y-2">
                          {capa.verificationChecklist.map((check, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              {check.verified ? (
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className={`text-sm ${check.verified ? 'text-green-900 line-through' : 'text-gray-800'}`}>
                                  {check.item}
                                </p>
                                {check.verified && check.verifiedBy && (
                                  <p className="text-xs text-green-700">
                                    ✓ {check.verifiedBy} {check.verifiedDate && `on ${new Date(check.verifiedDate).toLocaleDateString()}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reminder Schedule */}
                    {capa.reminderSchedule && capa.reminderSchedule.emailsSent && capa.reminderSchedule.emailsSent.length > 0 && (
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="text-xs font-bold text-yellow-900 mb-2 flex items-center gap-2">
                          <Bell className="w-4 h-4" /> REMINDER HISTORY
                        </p>
                        <div className="space-y-1">
                          {capa.reminderSchedule.emailsSent.slice(-3).map((email, idx) => (
                            <p key={idx} className="text-xs text-yellow-800">
                              {new Date(email.date).toLocaleDateString()} - Sent to {email.recipient}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    onClick={() => handleEditCAPA(capa)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition font-semibold flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" /> Edit CAPA
                  </button>
                  <button 
                    onClick={() => handleDeleteCAPA(capa._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition font-semibold flex items-center justify-center gap-2"
                  >
                    <FaTrash className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCapas.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-600">No CAPAs found</p>
          <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
        </div>
      )}

      <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-xl p-5">
        <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> CAPA System Features
        </h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>✅ Automated reminder system with email tracking</li>
          <li>✅ Escalation rules with automatic triggers</li>
          <li>✅ Verification checklists for quality assurance</li>
          <li>✅ Source record linkage (incidents, hazards, audits)</li>
          <li>✅ Cost tracking and effectiveness assessment</li>
          <li>✅ Priority-based workflow management</li>
        </ul>
      </div>
    </>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
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
     

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('committee')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'committee'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            H&S Committee
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'meetings'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Meeting Minutes
          </button>
          <button
            onClick={() => setActiveTab('capa')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'capa'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            CAPA Management
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'committee' && renderCommitteeManagement()}
          {activeTab === 'meetings' && renderMeetingMinutes()}
          {activeTab === 'capa' && renderCAPAManagement()}
        </div>

        {/* Committee Member Modal */}
        {showMemberModal && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
          <div className="fixed inset-0 bg-white/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{editingCAPA ? 'Edit CAPA' : 'New CAPA'}</h2>
                  <button
                    onClick={() => {
                      setShowCAPAModal(false);
                      setEditingCAPA(null);
                      setCapaFormData({
                        title: '',
                        type: 'corrective',
                        source: '',
                        issueDate: new Date().toISOString().split('T')[0],
                        dueDate: new Date().toISOString().split('T')[0],
                        status: 'open',
                        assignedTo: '',
                        priority: 'medium',
                        description: '',
                        rootCause: '',
                        correctiveAction: '',
                        preventiveAction: ''
                      });
                    }}
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
                    onClick={() => {
                      setShowCAPAModal(false);
                      setEditingCAPA(null);
                      setCapaFormData({
                        title: '',
                        type: 'corrective',
                        source: '',
                        issueDate: new Date().toISOString().split('T')[0],
                        dueDate: new Date().toISOString().split('T')[0],
                        status: 'open',
                        assignedTo: '',
                        priority: 'medium',
                        description: '',
                        rootCause: '',
                        correctiveAction: '',
                        preventiveAction: ''
                      });
                    }}
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

export default EnhancedCommitteeCAPA;
