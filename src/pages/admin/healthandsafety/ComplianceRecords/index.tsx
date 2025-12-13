import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, hexToRgba, getStatusColor } from '../../../../theme/colors';
import {
  FaFileContract, FaCheckCircle, FaExclamationTriangle,
  FaClock, FaFileAlt, FaSearch, FaFilter, FaEye, FaDownload,
  FaUserCheck, FaBookOpen, FaClipboardCheck,
  FaExclamationCircle, FaChartLine,
  FaArrowRight, FaTimes
} from 'react-icons/fa';
import { getComplianceRecords } from '../../../../axios/api/healthSafety';

const CUSTOM_COLORS = {
  background: '#EDF8FF',
  primary: '#016ab2',
  dark: '#063f6f',
  light: '#398bc3',
  gradient: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
  gradientVertical: 'linear-gradient(to bottom right, #016ab2, #063f6f)',
};


// ============================================================================
// ENHANCED INTERFACES - NOW WITH ALL REQUIRED FIELDS
// ============================================================================

interface PolicyAcknowledgment {
  employeeId: string;
  employeeName: string;
  role: string;
  signedDate: string;
  version: string;
  ipAddress?: string;
}

interface PolicyVersion {
  version: string;
  publishedDate: string;
  changes: string;
  documentUrl: string;
  publishedBy: string;
}

interface PolicyRecord {
  _id: string;
  recordId: string;
  title: string;
  policyType: 'safety' | 'hr' | 'driver' | 'shop' | 'wellness';
  specificPolicyName: string;
  category: 'Federal Compliance' | 'Provincial Compliance' | 'Industry Standard' | 'Internal Policy';
  status: 'active' | 'expiring' | 'expired' | 'pending-review' | 'archived';
  issueDate: string;
  expiryDate: string;
  renewalCycle: 12 | 24 | 36; // months
  lastReviewed?: string;
  nextReviewDate: string;
  responsiblePerson: string;
  department: string;
  complianceLevel: 'compliant' | 'non-compliant' | 'at-risk' | 'pending';
  assignedRoles: string[];
  acknowledgments: PolicyAcknowledgment[];
  versionHistory: PolicyVersion[];
  currentVersion: string;
  documentUrl: string;
  autoAssignOnHire: boolean;
  remindersSent: { date: string; type: '90day' | '60day' | '30day' }[];
  linkedTraining?: string[];
}

interface TrainingRecord {
  _id: string;
  recordId: string;
  title: string;
  trainingType: string;
  category: string;
  status: 'active' | 'expiring' | 'expired';
  issueDate: string;
  expiryDate?: string;
  certificateNumber?: string;
  certificateUrl: string;
  instructor: string;
  employeeName: string;
  employeeId: string;
  department: string;
  validityPeriod?: number; // months
  automaticRenewalReminder: boolean;
  reminderDaysBefore: number;
  complianceLevel: 'compliant' | 'non-compliant' | 'at-risk';
}

interface IncidentRecord {
  _id: string;
  recordId: string;
  title: string;
  incidentType: 'driver-injury' | 'vehicle-accident' | 'workplace-incident' | 'near-miss';
  category: string;
  status: 'reported' | 'investigating' | 'closed';
  incidentDate: string;
  reportedDate: string;
  location: string;
  reportedBy: string;
  involvedPersons: string[];
  witnesses: { name: string; statement: string }[];
  description: string;
  photosVideos: string[];
  investigationMethod?: '5-why' | 'fishbone' | 'root-cause';
  investigationNotes?: string;
  correctiveActions: string[];
  wcbClaimNumber?: string;
  wcbDocuments?: string[];
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  complianceLevel: 'compliant' | 'non-compliant' | 'at-risk';
}

interface HazardRecord {
  _id: string;
  recordId: string;
  title: string;
  hazardType: string;
  category: string;
  status: 'reported' | 'assessed' | 'mitigated' | 'closed';
  reportedDate: string;
  reportedBy: string;
  location: string;
  description: string;
  riskRating: {
    likelihood: 1 | 2 | 3 | 4 | 5;
    severity: 1 | 2 | 3 | 4 | 5;
    total: number; // likelihood × severity
  };
  correctiveActions: string[];
  assignedTo: string;
  deadline: string;
  resolutionVerified: boolean;
  verificationDate?: string;
  photos: string[];
  complianceLevel: 'compliant' | 'non-compliant' | 'at-risk';
}

interface InspectionRecord {
  _id: string;
  recordId: string;
  title: string;
  inspectionType: string;
  category: string;
  status: 'scheduled' | 'completed' | 'overdue';
  inspectionDate: string;
  inspector: string;
  location: string;
  checklist: { item: string; status: 'pass' | 'fail' | 'na'; notes?: string; photo?: string }[];
  findingsCount: number;
  correctiveActions: string[];
  photos: string[];
  nextInspectionDate: string;
  complianceLevel: 'compliant' | 'non-compliant' | 'at-risk';
}

type ComplianceRecord = PolicyRecord | TrainingRecord | IncidentRecord | HazardRecord | InspectionRecord;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const ToastNotificationComponent = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationTriangle className="text-red-500" size={24} />,
    info: <FaExclamationCircle className="text-blue-500" size={24} />,
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

const EnhancedComplianceRecords: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCompliance, setFilterCompliance] = useState<string>('all');
  const [activeView, setActiveView] = useState<'all' | 'policies' | 'training' | 'incidents' | 'hazards' | 'inspections'>('all');
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [notificationId, setNotificationId] = useState(0);

  // Dashboard-style statistics aggregated from all modules
  const [stats, setStats] = useState({
    totalRecords: 0,
    compliantRecords: 0,
    atRiskRecords: 0,
    expiredRecords: 0,
    expiringRecords: 0,
    policies: 0,
    training: 0,
    incidents: 0,
    hazards: 0,
    inspections: 0,
  });

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = notificationId + 1;
    setNotificationId(id);
    setNotifications([...notifications, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  useEffect(() => {
    // Fetch compliance records data - aggregated from all Health & Safety modules
    const fetchComplianceRecords = async () => {
      setLoading(true);
      try {
        const response = await getComplianceRecords();

        if (response?.success && Array.isArray(response.data)) {
          setRecords(response.data as ComplianceRecord[]);

          // Update stats from API response
          if (response.stats) {
            setStats(response.stats);
          } else {
            // Calculate stats from data if not provided
            const calculatedStats = {
              totalRecords: response.data.length,
              policies: response.data.filter((r: any) => 'policyType' in r).length,
              training: response.data.filter((r: any) => 'trainingType' in r).length,
              incidents: response.data.filter((r: any) => 'incidentType' in r).length,
              hazards: response.data.filter((r: any) => 'hazardType' in r).length,
              inspections: response.data.filter((r: any) => 'inspectionType' in r).length,
              expiringRecords: response.data.filter((r: any) => r.status === 'expiring').length,
              expiredRecords: response.data.filter((r: any) => r.status === 'expired').length,
              compliantRecords: response.data.filter((r: any) => r.complianceLevel === 'compliant').length,
              atRiskRecords: response.data.filter((r: any) => r.complianceLevel === 'at-risk').length,
            };
            setStats(calculatedStats);
          }

          showNotification('success', `Loaded ${response.data.length} compliance records`);
        } else {
          showNotification('error', response?.message || 'Failed to fetch compliance records');
        }
      } catch (error: any) {
        console.error('Error fetching compliance records:', error);
        showNotification('error', error?.response?.data?.message || 'Error fetching compliance records');
      } finally {
        setLoading(false);
      }
    };

    fetchComplianceRecords();
  }, []);

  const getRecordType = (record: ComplianceRecord): string => {
    if ('policyType' in record) return 'Policy';
    if ('trainingType' in record) return 'Training';
    if ('incidentType' in record) return 'Incident';
    if ('hazardType' in record) return 'Hazard';
    if ('inspectionType' in record) return 'Inspection';
    return 'Unknown';
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const getComplianceColor = (level: string) => {
    const levelMap: Record<string, string> = {
      'compliant': 'bg-green-100 text-green-800',
      'non-compliant': 'bg-red-100 text-red-800',
      'at-risk': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-blue-100 text-blue-800'
    };
    return levelMap[level] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'Policy': <FaBookOpen className="text-purple-600" />,
      'Training': <FaUserCheck className="text-green-600" />,
      'Incident': <FaExclamationTriangle className="text-red-600" />,
      'Hazard': <FaExclamationCircle className="text-orange-600" />,
      'Inspection': <FaClipboardCheck className="text-blue-600" />
    };
    return iconMap[type] || <FaFileAlt className="text-gray-600" />;
  };

  const filteredRecords = records.filter(record => {
    const recordTitle = record.title.toLowerCase();
    const recordId = record.recordId.toLowerCase();

    const matchesSearch =
      recordId.includes(searchTerm.toLowerCase()) ||
      recordTitle.includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesCompliance = filterCompliance === 'all' || record.complianceLevel === filterCompliance;
    const matchesView = activeView === 'all' ||
      (activeView === 'policies' && 'policyType' in record) ||
      (activeView === 'training' && 'trainingType' in record) ||
      (activeView === 'incidents' && 'incidentType' in record) ||
      (activeView === 'hazards' && 'hazardType' in record) ||
      (activeView === 'inspections' && 'inspectionType' in record);

    return matchesSearch && matchesStatus && matchesCompliance && matchesView;
  });

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: CUSTOM_COLORS.background }}>
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
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold" style={{ color: CUSTOM_COLORS.dark }}>
                Compliance Records Management
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Comprehensive view of all compliance records aggregated from Health & Safety modules.
              </p>
            </div>
            <button
              onClick={() => handleNavigation('../Dashboard')}
              className="px-6 py-3 rounded-xl !text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center space-x-2"
              style={{ background: CUSTOM_COLORS.gradient }}
            >
              <FaChartLine size={18} />
              <span>View Dashboard</span>
            </button>
          </div>
        </div>

        {/* Module Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-4">
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'all', label: 'All Records', icon: <FaFileContract />, count: stats.totalRecords },
              { id: 'policies', label: 'Policies', icon: <FaBookOpen />, count: stats.policies },
              { id: 'training', label: 'Training', icon: <FaUserCheck />, count: stats.training },
              { id: 'incidents', label: 'Incidents', icon: <FaExclamationTriangle />, count: stats.incidents },
              { id: 'hazards', label: 'Hazards', icon: <FaExclamationCircle />, count: stats.hazards },
              { id: 'inspections', label: 'Inspections', icon: <FaClipboardCheck />, count: stats.inspections }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${activeView === view.id
                  ? '!text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                style={activeView === view.id ? { background: CUSTOM_COLORS.gradient } : {}}
              >
                {view.icon}
                <span>{view.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeView === view.id ? 'bg-white text-purple-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                  {view.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Cards - Dashboard Style */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: CUSTOM_COLORS.dark }}>
            📊 Compliance Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => setFilterCompliance('compliant')}
              className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(COLORS.status.success, 0.1)} 0%, ${hexToRgba(COLORS.status.success, 0.05)} 100%)`,
                border: `2px solid ${hexToRgba(COLORS.status.success, 0.2)}`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                style={{ backgroundColor: hexToRgba(COLORS.status.success, 0.15) }}
              >
                <FaCheckCircle size={28} style={{ color: COLORS.status.success }} />
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: CUSTOM_COLORS.dark }}>
                {stats.compliantRecords}
              </div>
              <div className="text-sm font-medium text-gray-600 mb-3">Compliant Records</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight style={{ color: COLORS.status.success }} />
              </div>
            </div>

            <div
              onClick={() => setFilterCompliance('at-risk')}
              className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(COLORS.status.warning, 0.1)} 0%, ${hexToRgba(COLORS.status.warning, 0.05)} 100%)`,
                border: `2px solid ${hexToRgba(COLORS.status.warning, 0.2)}`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                style={{ backgroundColor: hexToRgba(COLORS.status.warning, 0.15) }}
              >
                <FaClock size={28} style={{ color: COLORS.status.warning }} />
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: CUSTOM_COLORS.dark }}>
                {stats.expiringRecords}
              </div>
              <div className="text-sm font-medium text-gray-600 mb-3">Expiring Soon</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight style={{ color: COLORS.status.warning }} />
              </div>
            </div>

            <div
              onClick={() => setFilterCompliance('at-risk')}
              className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba('#f97316', 0.1)} 0%, ${hexToRgba('#f97316', 0.05)} 100%)`,
                border: `2px solid ${hexToRgba('#f97316', 0.2)}`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                style={{ backgroundColor: hexToRgba('#f97316', 0.15) }}
              >
                <FaExclamationTriangle size={28} style={{ color: '#f97316' }} />
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: CUSTOM_COLORS.dark }}>
                {stats.atRiskRecords}
              </div>
              <div className="text-sm font-medium text-gray-600 mb-3">At Risk Records</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight style={{ color: '#f97316' }} />
              </div>
            </div>

            <div
              onClick={() => setFilterCompliance('non-compliant')}
              className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(COLORS.status.danger, 0.1)} 0%, ${hexToRgba(COLORS.status.danger, 0.05)} 100%)`,
                border: `2px solid ${hexToRgba(COLORS.status.danger, 0.2)}`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                style={{ backgroundColor: hexToRgba(COLORS.status.danger, 0.15) }}
              >
                <FaExclamationCircle size={28} style={{ color: COLORS.status.danger }} />
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: CUSTOM_COLORS.dark }}>
                {stats.expiredRecords}
              </div>
              <div className="text-sm font-medium text-gray-600 mb-3">Expired / Non-Compliant</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight style={{ color: COLORS.status.danger }} />
              </div>
            </div>
          </div>
        </div>



        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Record ID or Title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <FaFilter className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
                <option value="completed">Completed</option>
                <option value="investigating">Investigating</option>
              </select>
              <select
                value={filterCompliance}
                onChange={(e) => setFilterCompliance(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Compliance</option>
                <option value="compliant">Compliant</option>
                <option value="non-compliant">Non-Compliant</option>
                <option value="at-risk">At Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold" style={{ color: CUSTOM_COLORS.dark }}>
                  {activeView === 'all' ? 'All Compliance Records' :
                    activeView === 'policies' ? '📋 Policy Records' :
                      activeView === 'training' ? '🎓 Training Records' :
                        activeView === 'incidents' ? '🚨 Incident Reports' :
                          activeView === 'hazards' ? '⚠️ Hazard Reports' :
                            '🔍 Inspection Records'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {activeView === 'policies' && 'Track 20+ mandatory policies, acknowledgments, version control, renewal cycles'}
                  {activeView === 'training' && 'WHMIS, TDG, Cargo Securement, First Aid certificates with auto-renewal reminders'}
                  {activeView === 'incidents' && 'Driver injuries, vehicle accidents, workplace incidents with investigation tools (5-Why, Fishbone)'}
                  {activeView === 'hazards' && 'Risk assessments (Likelihood × Severity), corrective actions, resolution verification'}
                  {activeView === 'inspections' && 'Yard, shop, fire safety, PPE inspections with custom checklists and photo evidence'}
                  {activeView === 'all' && 'Comprehensive view of all compliance modules from Compliance Dashboard'}
                </p>
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                <FaFileContract className="inline mr-1" />
                Total: {filteredRecords.length} records
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: CUSTOM_COLORS.gradient, color: '#ffffff' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">Record ID</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Title</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Compliance</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Key Info</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading compliance records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const type = getRecordType(record);
                    const complianceColor = getComplianceColor(record.complianceLevel);

                    return (
                      <tr key={record._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{record.recordId}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(type)}
                            <span className="font-medium">{record.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                            {type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: getStatusColor(record.status).bg,
                              color: getStatusColor(record.status).text
                            }}
                          >
                            {record.status.toUpperCase().replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${complianceColor}`}>
                            {record.complianceLevel.toUpperCase().replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {'policyType' in record && (
                            <div>
                              <div className="font-semibold text-purple-700">Renewal: {record.renewalCycle} mo</div>
                              <div className="text-xs text-gray-600">{record.acknowledgments.length} signatures</div>
                            </div>
                          )}
                          {'trainingType' in record && (
                            <div>
                              <div className="font-semibold text-green-700">{record.trainingType}</div>
                              <div className="text-xs text-gray-600">Expires: {record.expiryDate ? new Date(record.expiryDate).toLocaleDateString() : 'N/A'}</div>
                            </div>
                          )}
                          {'incidentType' in record && (
                            <div>
                              <div className="font-semibold text-red-700 capitalize">{record.incidentType.replace('-', ' ')}</div>
                              <div className="text-xs text-gray-600">Severity: {record.severity}</div>
                            </div>
                          )}
                          {'hazardType' in record && (
                            <div>
                              <div className="font-semibold text-orange-700">Risk: {record.riskRating.total}</div>
                              <div className="text-xs text-gray-600">L{record.riskRating.likelihood} × S{record.riskRating.severity}</div>
                            </div>
                          )}
                          {'inspectionType' in record && (
                            <div>
                              <div className="font-semibold text-blue-700">{record.inspectionType}</div>
                              <div className="text-xs text-gray-600">{record.findingsCount} findings</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Details"
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowSidebar(true);
                              }}
                            >
                              <FaEye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Sidebar */}
        {showSidebar && selectedRecord && (
          <div className="fixed inset-0 z-[10002] flex justify-end">
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
              onClick={() => setShowSidebar(false)}
            />
            <div className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out">
              <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: CUSTOM_COLORS.dark }}>
                    {selectedRecord.recordId}
                  </h2>
                  <p className="text-gray-600">{selectedRecord.title}</p>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <FaTimes size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-xl flex items-center justify-between ${selectedRecord.complianceLevel === 'compliant' ? 'bg-green-50 border border-green-200' :
                  selectedRecord.complianceLevel === 'at-risk' ? 'bg-orange-50 border border-orange-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                  <div className="flex items-center gap-3">
                    {selectedRecord.complianceLevel === 'compliant' ? <FaCheckCircle className="text-green-600" size={24} /> :
                      selectedRecord.complianceLevel === 'at-risk' ? <FaExclamationTriangle className="text-orange-600" size={24} /> :
                        <FaExclamationCircle className="text-red-600" size={24} />}
                    <div>
                      <div className="font-bold text-gray-900 capitalize">{selectedRecord.complianceLevel.replace('-', ' ')}</div>
                      <div className="text-sm text-gray-600 capitalize">Status: {selectedRecord.status.replace('-', ' ')}</div>
                    </div>
                  </div>
                </div>

                {/* Common Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Category</span>
                    <div className="font-medium text-gray-900 mt-1">{selectedRecord.category}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Type</span>
                    <div className="font-medium text-gray-900 mt-1">
                      {'policyType' in selectedRecord ? selectedRecord.policyType :
                        'trainingType' in selectedRecord ? selectedRecord.trainingType :
                          'incidentType' in selectedRecord ? selectedRecord.incidentType.replace('-', ' ') :
                            'hazardType' in selectedRecord ? selectedRecord.hazardType :
                              'inspectionType' in selectedRecord ? selectedRecord.inspectionType : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Type Specific Details */}
                {'policyType' in selectedRecord && (
                  <div className="space-y-4">
                    <h3 className="font-bold border-b pb-2 flex items-center gap-2 text-gray-700">
                      <FaBookOpen className="text-purple-600" /> Policy Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Department:</span> <div className="font-medium">{selectedRecord.department}</div></div>
                      <div><span className="text-gray-500">Responsible:</span> <div className="font-medium">{selectedRecord.responsiblePerson}</div></div>
                      <div><span className="text-gray-500">Issue Date:</span> <div className="font-medium">{selectedRecord.issueDate}</div></div>
                      <div><span className="text-gray-500">Next Review:</span> <div className="font-medium">{selectedRecord.nextReviewDate}</div></div>
                      <div><span className="text-gray-500">Renewal Cycle:</span> <div className="font-medium">{selectedRecord.renewalCycle} Months</div></div>
                      <div><span className="text-gray-500">Version:</span> <div className="font-medium">{selectedRecord.currentVersion}</div></div>
                    </div>
                    {selectedRecord.documentUrl && (
                      <div className="mt-4 pt-4 border-t">
                        <a href={selectedRecord.documentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                          <FaDownload /> Download Policy Document
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {'trainingType' in selectedRecord && (
                  <div className="space-y-4">
                    <h3 className="font-bold border-b pb-2 flex items-center gap-2 text-gray-700">
                      <FaUserCheck className="text-green-600" /> Training Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Employee:</span> <div className="font-medium">{selectedRecord.employeeName}</div></div>
                      <div><span className="text-gray-500">Instructor:</span> <div className="font-medium">{selectedRecord.instructor}</div></div>
                      <div><span className="text-gray-500">Issue Date:</span> <div className="font-medium">{selectedRecord.issueDate}</div></div>
                      <div><span className="text-gray-500">Expiry Date:</span> <div className="font-medium text-orange-600">{selectedRecord.expiryDate || 'N/A'}</div></div>
                      <div><span className="text-gray-500">Certificate No:</span> <div className="font-medium">{selectedRecord.certificateNumber}</div></div>
                    </div>
                    {selectedRecord.certificateUrl && (
                      <div className="mt-4 pt-4 border-t">
                        <a href={selectedRecord.certificateUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                          <FaCheckCircle /> View Certificate
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {'incidentType' in selectedRecord && (
                  <div className="space-y-4">
                    <h3 className="font-bold border-b pb-2 flex items-center gap-2 text-gray-700">
                      <FaExclamationTriangle className="text-red-600" /> Incident Report
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Date:</span> <div className="font-medium">{selectedRecord.incidentDate}</div></div>
                      <div><span className="text-gray-500">Reported By:</span> <div className="font-medium">{selectedRecord.reportedBy}</div></div>
                      <div><span className="text-gray-500">Location:</span> <div className="font-medium">{selectedRecord.location}</div></div>
                      <div><span className="text-gray-500">Severity:</span> <div className="font-medium capitalize text-red-600">{selectedRecord.severity}</div></div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <span className="text-gray-500 block mb-1">Description:</span>
                      <p>{selectedRecord.description}</p>
                    </div>
                    {selectedRecord.photosVideos && selectedRecord.photosVideos.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm mb-2">Media Evidence</h4>
                        <div className="flex gap-2 overflow-x-auto">
                          {selectedRecord.photosVideos.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noreferrer" className="shrink-0 w-20 h-20 bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                              {url.endsWith('.mp4') ? (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-xs">Video</div>
                              ) : (
                                <img src={url} alt="evidence" className="w-full h-full object-cover" />
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {'hazardType' in selectedRecord && (
                  <div className="space-y-4">
                    <h3 className="font-bold border-b pb-2 flex items-center gap-2 text-gray-700">
                      <FaExclamationCircle className="text-orange-600" /> Hazard Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Reported Date:</span> <div className="font-medium">{selectedRecord.reportedDate}</div></div>
                      <div><span className="text-gray-500">Reported By:</span> <div className="font-medium">{selectedRecord.reportedBy}</div></div>
                      <div><span className="text-gray-500">Location:</span> <div className="font-medium">{selectedRecord.location}</div></div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg flex items-center gap-4">
                      <div>
                        <div className="text-xs text-orange-800 uppercase font-bold">Risk Rating</div>
                        <div className="text-2xl font-bold text-orange-700">{selectedRecord.riskRating.total}</div>
                      </div>
                      <div className="text-sm text-orange-900">
                        Likelihood ({selectedRecord.riskRating.likelihood}) × Severity ({selectedRecord.riskRating.severity})
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <span className="text-gray-500 block mb-1">Description:</span>
                      <p>{selectedRecord.description}</p>
                    </div>
                  </div>
                )}

                {'inspectionType' in selectedRecord && (
                  <div className="space-y-4">
                    <h3 className="font-bold border-b pb-2 flex items-center gap-2 text-gray-700">
                      <FaClipboardCheck className="text-blue-600" /> Inspection Results
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Date:</span> <div className="font-medium">{selectedRecord.inspectionDate}</div></div>
                      <div><span className="text-gray-500">Inspector:</span> <div className="font-medium">{selectedRecord.inspector}</div></div>
                      <div><span className="text-gray-500">Location:</span> <div className="font-medium">{selectedRecord.location}</div></div>
                      <div>
                        <span className="text-gray-500">Next Due:</span>
                        <div className="font-medium">{selectedRecord.nextInspectionDate}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 border-t pt-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">{selectedRecord.findingsCount}</div>
                        <div className="text-xs text-gray-500">Findings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{selectedRecord.checklist ? selectedRecord.checklist.length : 0}</div>
                        <div className="text-xs text-gray-500">Checks</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className="p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowSidebar(false)}
                  className="w-full py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Info Panel for Active View */}
        {activeView === 'policies' && (
          <div className="mt-6 bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
              <FaBookOpen /> Policy Management Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <FaCheckCircle className="text-green-600 mt-1" />
                <div>
                  <strong>20+ Mandatory Policies Tracked:</strong> OHS, Harassment, TDG, Load Securement, Fatigue, PPE, LOTO, etc.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaCheckCircle className="text-green-600 mt-1" />
                <div>
                  <strong>Renewal Cycles:</strong> 12/24/36 months with automatic 30/60/90 day reminders
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaCheckCircle className="text-green-600 mt-1" />
                <div>
                  <strong>Employee Acknowledgments:</strong> Digital signatures, read receipts, version tracking
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaCheckCircle className="text-green-600 mt-1" />
                <div>
                  <strong>Version Control:</strong> Complete history of all policy versions for federal audits
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaCheckCircle className="text-green-600 mt-1" />
                <div>
                  <strong>Role-Based Assignment:</strong> Auto-assign policies to drivers, mechanics, office staff on hire
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaCheckCircle className="text-green-600 mt-1" />
                <div>
                  <strong>Linked Training:</strong> Connect policies to required training modules (e.g., TDG Policy → TDG Training)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedComplianceRecords;