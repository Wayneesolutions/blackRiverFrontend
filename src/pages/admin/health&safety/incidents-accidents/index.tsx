import { useState, useEffect, useRef } from 'react';
import { 
  FaExclamationTriangle, 
  FaPlus, 
  FaEye, 
  FaSearch,
  FaFilter,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaUser,
  FaClipboardList,
  FaUserInjured,
  FaHeartbeat,
  FaTools,
  FaTimes,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaImage,
  FaPhone,
  FaEnvelope,
  FaPrint
} from 'react-icons/fa';
import { FaCheckCircle as FaCheckCircleIcon, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  updateInvestigation,
  updateInjuryRecord,
  createEmergencyContact,
  getEmergencyContacts,
  updateEmergencyContact,
  deleteEmergencyContact,
  createEmergencyProcedure,
  getEmergencyProcedures,
  updateEmergencyProcedure,
  deleteEmergencyProcedure,
  createFirstAidLog,
  getFirstAidLogs,
  getFirstAidLogById,
  updateFirstAidLog,
  deleteFirstAidLog
} from '../../../../axios/api/healthSafety';
import { getUserInfo } from '../../../../utils/auth';

// ==================== DATA INTERFACES ====================
interface MediaFile {
  _id?: string;
  fileUrl: string;
  fileName: string;
  fileType: 'image' | 'video' | 'document';
  uploadedAt: string;
  uploadedBy: string;
}

interface WitnessStatement {
  _id?: string;
  witnessName: string;
  witnessRole: string;
  statement: string;
  signedDate: string;
  documentUrl?: string;
}

interface InvestigationTool {
  type: '5-why' | 'fishbone';
  rootCause: string;
  findings: string[];
  analysis: string;
}

interface CAPA {
  _id?: string;
  capaNumber: string;
  assignedTo: string;
  assignedToName?: string;
  dueDate: string;
  status: 'open' | 'in-progress' | 'completed' | 'overdue';
  description: string;
  reminderSent: boolean;
  escalationLevel: number;
  followUpVerification?: string;
  verifiedDate?: string;
  verifiedBy?: string;
}

interface InjuryRecord {
  _id?: string;
  injuredWorker: string;
  injuryDate: string;
  injuryType: string;
  bodyPart: string;
  severity: string;
  modifiedDutyPlan?: string;
  doctorRestrictions?: string;
  returnToWorkDate?: string;
  progressNotes: Array<{
    date: string;
    note: string;
    enteredBy: string;
  }>;
  wcbClaimNumber?: string;
  wcbDocuments?: MediaFile[];
}

interface EmergencyContact {
  _id?: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  department: string;
  isPrimary: boolean;
}

interface EmergencyProcedure {
  _id?: string;
  title: string;
  type: 'medical' | 'fire' | 'spill' | 'collision' | 'breakdown' | 'violence' | 'other';
  procedure: string;
  lastUpdated: string;
  documentUrl?: string;
}

interface FirstAidLog {
  _id?: string;
  date: string;
  time: string;
  location: string;
  injuredPerson: string;
  injuryDescription: string;
  firstAidProvided: string;
  treatedBy: string;
  followUpRequired: boolean;
  followUpNotes?: string;
}

interface Incident {
  _id: string;
  incidentNumber: string;
  date: string;
  time: string;
  location: string;
  locationType: 'warehouse' | 'yard' | 'shop' | 'highway' | 'other';
  type: 'Driver Injury' | 'Vehicle Accident' | 'Workplace Incident' | 'Near Miss';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'action-required' | 'resolved' | 'closed';
  reportedBy: string;
  reportedByRole: string;
  description: string;
  hasInjury: boolean;
  
  // Evidence & Documentation
  photoEvidence?: MediaFile[];
  videoEvidence?: MediaFile[];
  workerStatements?: WitnessStatement[];
  witnessReports?: WitnessStatement[];
  
  // Investigation
  investigation?: {
    lead: string;
    startDate: string;
    completedDate?: string;
    rootCauseAnalysis?: InvestigationTool;
    findings: string;
  };
  
  // CAPA Link
  capa?: CAPA;
  
  // Injury Management
  injuryRecord?: InjuryRecord;
  
  // WCB/WSIB
  wcbClaimNumber?: string;
  wcbDocuments?: MediaFile[];
}

const TABS = {
  INCIDENT_LIST: 'list',
  INVESTIGATIONS: 'investigations',
  INJURY_RTW: 'injury',
  EMERGENCY_PROCS: 'procedures',
  FIRST_AID_LOGS: 'firstaid'
};

// Toast notification interface
interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const ToastNotificationComponent = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircleIcon className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    info: <FaInfoCircle className="text-blue-500" size={24} />,
    warning: <FaExclamationCircle className="text-yellow-500" size={24} />
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

const IncidentsAccidents = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState(TABS.INCIDENT_LIST);
  const [showNewReportMenu, setShowNewReportMenu] = useState(false);
  const [selectedIncidentForDetail, setSelectedIncidentForDetail] = useState<Incident | null>(null);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentFormType, setIncidentFormType] = useState<'Driver Injury' | 'Vehicle Accident' | 'Workplace Incident' | 'Near Miss' | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyProcedures, setEmergencyProcedures] = useState<EmergencyProcedure[]>([]);
  const [firstAidLogs, setFirstAidLogs] = useState<FirstAidLog[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [notificationId, setNotificationId] = useState(0);

  // Incident form state
  const [incidentFormData, setIncidentFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    locationType: 'warehouse' as 'warehouse' | 'yard' | 'shop' | 'highway' | 'other',
    type: 'Workplace Incident' as 'Driver Injury' | 'Vehicle Accident' | 'Workplace Incident' | 'Near Miss',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    reportedBy: '',
    reportedByRole: '',
    description: '',
    hasInjury: false
  });
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([]);
  const [selectedVideoFiles, setSelectedVideoFiles] = useState<File[]>([]);

  // Emergency Contact form state
  const [showEmergencyContactModal, setShowEmergencyContactModal] = useState(false);
  const [editingEmergencyContact, setEditingEmergencyContact] = useState<EmergencyContact | null>(null);
  const [emergencyContactFormData, setEmergencyContactFormData] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    department: '',
    isPrimary: false
  });

  // Emergency Procedure form state
  const [showEmergencyProcedureModal, setShowEmergencyProcedureModal] = useState(false);
  const [editingEmergencyProcedure, setEditingEmergencyProcedure] = useState<EmergencyProcedure | null>(null);
  const [emergencyProcedureFormData, setEmergencyProcedureFormData] = useState({
    title: '',
    type: 'medical' as 'medical' | 'fire' | 'spill' | 'collision' | 'breakdown' | 'violence' | 'other',
    procedure: ''
  });
  const [emergencyProcedureFile, setEmergencyProcedureFile] = useState<File | null>(null);

  // First Aid Log form state
  const [showFirstAidLogModal, setShowFirstAidLogModal] = useState(false);
  const [editingFirstAidLog, setEditingFirstAidLog] = useState<FirstAidLog | null>(null);
  const [firstAidLogFormData, setFirstAidLogFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    injuredPerson: '',
    injuryDescription: '',
    firstAidProvided: '',
    treatedBy: '',
    followUpRequired: false,
    followUpNotes: ''
  });

  // Investigation form state
  const [investigationFormData, setInvestigationFormData] = useState({
    selectedIncidentId: '',
    lead: '',
    startDate: new Date().toISOString().split('T')[0],
    rootCauseType: '' as '5-why' | 'fishbone' | '',
    rootCause: '',
    findings: [''],
    analysis: ''
  });

  // Injury Record form state
  const [injuryRecordFormData, setInjuryRecordFormData] = useState({
    selectedIncidentId: '',
    injuredWorker: '',
    injuryDate: new Date().toISOString().split('T')[0],
    injuryType: '',
    bodyPart: '',
    severity: '',
    modifiedDutyPlan: '',
    doctorRestrictions: '',
    returnToWorkDate: '',
    wcbClaimNumber: '',
    progressNotes: [{ date: '', note: '', enteredBy: '' }]
  });
  const [selectedWcbFiles, setSelectedWcbFiles] = useState<File[]>([]);

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = notificationId + 1;
    setNotificationId(id);
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getLocalUserInfo = () => {
    const userInfoString = localStorage.getItem('userInfo');
    if (!userInfoString) return null;
    try {
      return JSON.parse(userInfoString);
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
      return null;
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    if (currentTab === TABS.INCIDENT_LIST) {
      fetchIncidents();
    } else if (currentTab === TABS.EMERGENCY_PROCS) {
      fetchEmergencyContacts();
      fetchEmergencyProcedures();
    } else if (currentTab === TABS.FIRST_AID_LOGS) {
      fetchFirstAidLogs();
    }
  }, [currentTab, searchTerm, filterStatus, filterType]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchIncidents(),
        fetchEmergencyContacts(),
        fetchEmergencyProcedures(),
        fetchFirstAidLogs()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await getIncidents({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        type: filterType !== 'all' ? filterType : undefined,
        search: searchTerm || undefined
      });
      if (response?.success && Array.isArray(response.data)) {
        setIncidents(response.data.map((inc: any) => ({
          _id: inc._id,
          incidentNumber: inc.incidentNumber,
          date: inc.date,
          time: inc.time,
          location: inc.location,
          locationType: inc.locationType,
          type: inc.type,
          severity: inc.severity,
          status: inc.status,
          reportedBy: inc.reportedBy,
          reportedByRole: inc.reportedByRole,
          description: inc.description,
          hasInjury: inc.hasInjury || false,
          photoEvidence: inc.photoEvidence || [],
          videoEvidence: inc.videoEvidence || [],
          workerStatements: inc.workerStatements || [],
          witnessReports: inc.witnessReports || [],
          investigation: inc.investigation,
          capa: inc.capa,
          injuryRecord: inc.injuryRecord,
          wcbClaimNumber: inc.wcbClaimNumber,
          wcbDocuments: inc.wcbDocuments || []
        })));
      }
    } catch (error: any) {
      console.error('Error fetching incidents:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to fetch incidents');
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const response = await getEmergencyContacts();
      if (response?.success && Array.isArray(response.data)) {
        setEmergencyContacts(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching emergency contacts:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to fetch emergency contacts');
    }
  };

  const fetchEmergencyProcedures = async () => {
    try {
      const response = await getEmergencyProcedures();
      if (response?.success && Array.isArray(response.data)) {
        setEmergencyProcedures(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching emergency procedures:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to fetch emergency procedures');
    }
  };

  const fetchFirstAidLogs = async () => {
    try {
      const response = await getFirstAidLogs({
        search: searchTerm || undefined
      });
      if (response?.success && Array.isArray(response.data)) {
        setFirstAidLogs(response.data.map((log: any) => ({
          _id: log._id,
          date: log.date,
          time: log.time,
          location: log.location,
          injuredPerson: log.injuredPerson,
          injuryDescription: log.injuryDescription,
          firstAidProvided: log.firstAidProvided,
          treatedBy: log.treatedBy,
          followUpRequired: log.followUpRequired || false,
          followUpNotes: log.followUpNotes
        })));
      }
    } catch (error: any) {
      console.error('Error fetching first aid logs:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to fetch first aid logs');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'action-required': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle incident creation
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentFormType) return;

    const userInfo = getLocalUserInfo();
    const userName = userInfo?.userData?.name || userInfo?.name || 'Unknown User';
    const userRole = userInfo?.userData?.role || userInfo?.role || 'Unknown Role';

    const formData = new FormData();
    formData.append('date', incidentFormData.date);
    formData.append('time', incidentFormData.time);
    formData.append('location', incidentFormData.location);
    formData.append('locationType', incidentFormData.locationType);
    formData.append('type', incidentFormType);
    formData.append('severity', incidentFormData.severity);
    formData.append('reportedBy', incidentFormData.reportedBy || userName);
    formData.append('reportedByRole', incidentFormData.reportedByRole || userRole);
    formData.append('description', incidentFormData.description);
    formData.append('hasInjury', String(incidentFormData.hasInjury));

    selectedPhotoFiles.forEach(file => {
      formData.append('photoEvidence', file);
    });

    selectedVideoFiles.forEach(file => {
      formData.append('videoEvidence', file);
    });

    try {
      setUploadingFiles(true);
      const response = await createIncident(formData);
      if (response?.success) {
        showNotification('success', 'Incident created successfully');
        setShowIncidentForm(false);
        setIncidentFormType(null);
        setSelectedPhotoFiles([]);
        setSelectedVideoFiles([]);
        setIncidentFormData({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          location: '',
          locationType: 'warehouse',
          type: 'Workplace Incident',
          severity: 'medium',
          reportedBy: '',
          reportedByRole: '',
          description: '',
          hasInjury: false
        });
        await fetchIncidents();
      } else {
        showNotification('error', response?.message || 'Failed to create incident');
      }
    } catch (error: any) {
      console.error('Error creating incident:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to create incident');
    } finally {
      setUploadingFiles(false);
    }
  };

  // Handle incident deletion
  const handleDeleteIncident = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this incident?')) return;
    
    try {
      const response = await deleteIncident(id);
      if (response?.success) {
        showNotification('success', 'Incident deleted successfully');
        await fetchIncidents();
      } else {
        showNotification('error', response?.message || 'Failed to delete incident');
      }
    } catch (error: any) {
      console.error('Error deleting incident:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete incident');
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = 
      incident.incidentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    const matchesType = filterType === 'all' || incident.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // ==================== RENDER FUNCTIONS ====================

  const renderIncidentList = () => (
    <>
      <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, location, type, or reporter..."
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
              <option value="investigating">Investigating</option>
              <option value="action-required">CAPA Required</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="Driver Injury">Driver Injury</option>
              <option value="Vehicle Accident">Vehicle Accident</option>
              <option value="Workplace Incident">Workplace Incident</option>
              <option value="Near Miss">Near Miss</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: FLEET_COLORS.gradient }}>
              <tr>
                <th className="px-6 py-4 text-left text-white font-semibold">Incident #</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Date/Time</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Location</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Severity</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-white font-semibold">CAPA</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Injury?</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Loading...' : 'No incidents found matching criteria.'}
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{incident.incidentNumber}</td>
                    <td className="px-6 py-4">
                      <div>{new Date(incident.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{incident.time}</div>
                    </td>
                    <td className="px-6 py-4">{incident.type}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-400" />
                        {incident.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(incident.status)}`}>
                        {incident.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {incident.capa ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{incident.capa.capaNumber}</span>
                          {incident.capa.status === 'overdue' && (
                            <FaExclamationTriangle className="text-red-500" title="Overdue" />
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No CAPA</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {incident.hasInjury ? (
                        <FaUserInjured className="text-red-500" title="Injury Reported" />
                      ) : (
                        <FaCheckCircle className="text-green-500" title="No Injury" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedIncidentForDetail(incident)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                          title="View/Investigate"
                        >
                          <FaEye />
                        </button>
                        <button 
                          onClick={() => handleDeleteIncident(incident._id)}
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
  );

  // Handle investigation submission
  const handleSubmitInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigationFormData.selectedIncidentId || !investigationFormData.lead || !investigationFormData.analysis) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    try {
      const investigationData: any = {
        lead: investigationFormData.lead,
        startDate: investigationFormData.startDate,
        findings: investigationFormData.analysis
      };

      if (investigationFormData.rootCauseType && investigationFormData.rootCause) {
        investigationData.rootCauseAnalysis = {
          type: investigationFormData.rootCauseType,
          rootCause: investigationFormData.rootCause,
          findings: investigationFormData.findings.filter(f => f.trim()),
          analysis: investigationFormData.analysis
        };
      }

      const response = await updateInvestigation(investigationFormData.selectedIncidentId, investigationData);
      if (response?.success) {
        showNotification('success', 'Investigation updated successfully');
        setInvestigationFormData({
          selectedIncidentId: '',
          lead: '',
          startDate: new Date().toISOString().split('T')[0],
          rootCauseType: '',
          rootCause: '',
          findings: [''],
          analysis: ''
        });
        await fetchIncidents();
      } else {
        showNotification('error', response?.message || 'Failed to update investigation');
      }
    } catch (error: any) {
      console.error('Error updating investigation:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to update investigation');
    }
  };

  // Handle injury record submission
  const handleSubmitInjuryRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!injuryRecordFormData.selectedIncidentId) {
      showNotification('error', 'Please select an incident');
      return;
    }

    const formData = new FormData();
    formData.append('injuredWorker', injuryRecordFormData.injuredWorker);
    formData.append('injuryDate', injuryRecordFormData.injuryDate);
    formData.append('injuryType', injuryRecordFormData.injuryType);
    formData.append('bodyPart', injuryRecordFormData.bodyPart);
    formData.append('severity', injuryRecordFormData.severity);
    formData.append('modifiedDutyPlan', injuryRecordFormData.modifiedDutyPlan);
    formData.append('doctorRestrictions', injuryRecordFormData.doctorRestrictions);
    if (injuryRecordFormData.returnToWorkDate) {
      formData.append('returnToWorkDate', injuryRecordFormData.returnToWorkDate);
    }
    if (injuryRecordFormData.wcbClaimNumber) {
      formData.append('wcbClaimNumber', injuryRecordFormData.wcbClaimNumber);
    }
    if (injuryRecordFormData.progressNotes && injuryRecordFormData.progressNotes.length > 0) {
      formData.append('progressNotes', JSON.stringify(injuryRecordFormData.progressNotes));
    }

    selectedWcbFiles.forEach(file => {
      formData.append('wcbDocuments', file);
    });

    try {
      setUploadingFiles(true);
      const response = await updateInjuryRecord(injuryRecordFormData.selectedIncidentId, formData);
      if (response?.success) {
        showNotification('success', 'Injury record updated successfully');
        setInjuryRecordFormData({
          selectedIncidentId: '',
          injuredWorker: '',
          injuryDate: new Date().toISOString().split('T')[0],
          injuryType: '',
          bodyPart: '',
          severity: '',
          modifiedDutyPlan: '',
          doctorRestrictions: '',
          returnToWorkDate: '',
          wcbClaimNumber: '',
          progressNotes: [{ date: '', note: '', enteredBy: '' }]
        });
        setSelectedWcbFiles([]);
        await fetchIncidents();
      } else {
        showNotification('error', response?.message || 'Failed to update injury record');
      }
    } catch (error: any) {
      console.error('Error updating injury record:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to update injury record');
    } finally {
      setUploadingFiles(false);
    }
  };

  // Handle emergency contact CRUD
  const handleCreateEmergencyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await createEmergencyContact(emergencyContactFormData);
      if (response?.success) {
        showNotification('success', 'Emergency contact created successfully');
        setShowEmergencyContactModal(false);
        setEmergencyContactFormData({
          name: '',
          role: '',
          phone: '',
          email: '',
          department: '',
          isPrimary: false
        });
        await fetchEmergencyContacts();
      } else {
        showNotification('error', response?.message || 'Failed to create emergency contact');
      }
    } catch (error: any) {
      console.error('Error creating emergency contact:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to create emergency contact');
    }
  };

  const handleUpdateEmergencyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmergencyContact) return;
    try {
      const response = await updateEmergencyContact(editingEmergencyContact._id!, emergencyContactFormData);
      if (response?.success) {
        showNotification('success', 'Emergency contact updated successfully');
        setShowEmergencyContactModal(false);
        setEditingEmergencyContact(null);
        await fetchEmergencyContacts();
      } else {
        showNotification('error', response?.message || 'Failed to update emergency contact');
      }
    } catch (error: any) {
      console.error('Error updating emergency contact:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to update emergency contact');
    }
  };

  const handleDeleteEmergencyContact = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this emergency contact?')) return;
    try {
      const response = await deleteEmergencyContact(id);
      if (response?.success) {
        showNotification('success', 'Emergency contact deleted successfully');
        await fetchEmergencyContacts();
      } else {
        showNotification('error', response?.message || 'Failed to delete emergency contact');
      }
    } catch (error: any) {
      console.error('Error deleting emergency contact:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete emergency contact');
    }
  };

  // Handle emergency procedure CRUD
  const handleCreateEmergencyProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', emergencyProcedureFormData.title);
    formData.append('type', emergencyProcedureFormData.type);
    formData.append('procedure', emergencyProcedureFormData.procedure);
    if (emergencyProcedureFile) {
      formData.append('document', emergencyProcedureFile);
    }

    try {
      setUploadingFiles(true);
      const response = await createEmergencyProcedure(formData);
      if (response?.success) {
        showNotification('success', 'Emergency procedure created successfully');
        setShowEmergencyProcedureModal(false);
        setEmergencyProcedureFormData({
          title: '',
          type: 'medical',
          procedure: ''
        });
        setEmergencyProcedureFile(null);
        await fetchEmergencyProcedures();
      } else {
        showNotification('error', response?.message || 'Failed to create emergency procedure');
      }
    } catch (error: any) {
      console.error('Error creating emergency procedure:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to create emergency procedure');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleUpdateEmergencyProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmergencyProcedure) return;
    const formData = new FormData();
    formData.append('title', emergencyProcedureFormData.title);
    formData.append('type', emergencyProcedureFormData.type);
    formData.append('procedure', emergencyProcedureFormData.procedure);
    if (emergencyProcedureFile) {
      formData.append('document', emergencyProcedureFile);
    }

    try {
      setUploadingFiles(true);
      const response = await updateEmergencyProcedure(editingEmergencyProcedure._id!, formData);
      if (response?.success) {
        showNotification('success', 'Emergency procedure updated successfully');
        setShowEmergencyProcedureModal(false);
        setEditingEmergencyProcedure(null);
        setEmergencyProcedureFile(null);
        await fetchEmergencyProcedures();
      } else {
        showNotification('error', response?.message || 'Failed to update emergency procedure');
      }
    } catch (error: any) {
      console.error('Error updating emergency procedure:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to update emergency procedure');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteEmergencyProcedure = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this emergency procedure?')) return;
    try {
      const response = await deleteEmergencyProcedure(id);
      if (response?.success) {
        showNotification('success', 'Emergency procedure deleted successfully');
        await fetchEmergencyProcedures();
      } else {
        showNotification('error', response?.message || 'Failed to delete emergency procedure');
      }
    } catch (error: any) {
      console.error('Error deleting emergency procedure:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete emergency procedure');
    }
  };

  // Handle first aid log CRUD
  const handleCreateFirstAidLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await createFirstAidLog(firstAidLogFormData);
      if (response?.success) {
        showNotification('success', 'First aid log created successfully');
        setShowFirstAidLogModal(false);
        setFirstAidLogFormData({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          location: '',
          injuredPerson: '',
          injuryDescription: '',
          firstAidProvided: '',
          treatedBy: '',
          followUpRequired: false,
          followUpNotes: ''
        });
        await fetchFirstAidLogs();
      } else {
        showNotification('error', response?.message || 'Failed to create first aid log');
      }
    } catch (error: any) {
      console.error('Error creating first aid log:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to create first aid log');
    }
  };

  const handleUpdateFirstAidLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirstAidLog) return;
    try {
      const response = await updateFirstAidLog(editingFirstAidLog._id!, firstAidLogFormData);
      if (response?.success) {
        showNotification('success', 'First aid log updated successfully');
        setShowFirstAidLogModal(false);
        setEditingFirstAidLog(null);
        await fetchFirstAidLogs();
      } else {
        showNotification('error', response?.message || 'Failed to update first aid log');
      }
    } catch (error: any) {
      console.error('Error updating first aid log:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to update first aid log');
    }
  };

  const handleDeleteFirstAidLog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this first aid log?')) return;
    try {
      const response = await deleteFirstAidLog(id);
      if (response?.success) {
        showNotification('success', 'First aid log deleted successfully');
        await fetchFirstAidLogs();
      } else {
        showNotification('error', response?.message || 'Failed to delete first aid log');
      }
    } catch (error: any) {
      console.error('Error deleting first aid log:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete first aid log');
    }
  };

  const renderInvestigations = () => {

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Investigation & Root Cause Analysis</h2>
        <p className="mb-6 text-gray-700 text-sm bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
          <strong>Federal Requirement:</strong> Canada Labour Code requires employers to investigate and document all hazardous occurrences.
        </p>
        
        <form className="space-y-6" onSubmit={handleSubmitInvestigation}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Reference *</label>
              <select 
                value={investigationFormData.selectedIncidentId}
                onChange={(e) => setInvestigationFormData({ ...investigationFormData, selectedIncidentId: e.target.value })}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-purple-500"
              >
                <option value="">Select Incident to Investigate...</option>
                {incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').map(i => (
                  <option key={i._id} value={i._id}>{i.incidentNumber} - {i.type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investigation Lead *</label>
              <input 
                type="text" 
                value={investigationFormData.lead}
                onChange={(e) => setInvestigationFormData({ ...investigationFormData, lead: e.target.value })}
                placeholder="Safety Manager Name" 
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-purple-500" 
              />
            </div>
          </div>

          {/* Root Cause Analysis Tools */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Root Cause Analysis Tool</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Method *</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    value="5-why" 
                    checked={investigationFormData.rootCauseType === '5-why'}
                    onChange={(e) => setInvestigationFormData({ ...investigationFormData, rootCauseType: e.target.value as '5-why' | 'fishbone' })}
                    className="mr-2"
                  />
                  5-Why Analysis
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    value="fishbone" 
                    checked={investigationFormData.rootCauseType === 'fishbone'}
                    onChange={(e) => setInvestigationFormData({ ...investigationFormData, rootCauseType: e.target.value as '5-why' | 'fishbone' })}
                    className="mr-2"
                  />
                  Fishbone (Ishikawa) Diagram
                </label>
              </div>
            </div>

            {investigationFormData.rootCauseType === '5-why' && (
              <div className="space-y-3 mb-4">
                <label className="block text-sm font-medium text-gray-700">5-Why Analysis</label>
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num}>
                    <label className="block text-xs text-gray-600 mb-1">Why {num}?</label>
                    <input 
                      type="text" 
                      placeholder={`Why ${num}?`}
                      className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                    />
                  </div>
                ))}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Root Cause Identified</label>
                    <input 
                      type="text" 
                      value={investigationFormData.rootCause}
                      onChange={(e) => setInvestigationFormData({ ...investigationFormData, rootCause: e.target.value })}
                      placeholder="Final root cause"
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
              </div>
            )}

            {investigationFormData.rootCauseType === 'fishbone' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Fishbone Categories</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['People', 'Process', 'Equipment', 'Environment', 'Materials', 'Management'].map((category) => (
                    <div key={category}>
                      <label className="block text-xs text-gray-600 mb-1">{category}</label>
                      <input 
                        type="text" 
                        placeholder={`${category} factors...`}
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-gray-600 mb-1">Root Cause Identified</label>
                  <input 
                    type="text" 
                    value={investigationFormData.rootCause}
                    onChange={(e) => setInvestigationFormData({ ...investigationFormData, rootCause: e.target.value })}
                    placeholder="Final root cause"
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Findings & Analysis *</label>
              <textarea 
                rows={4} 
                value={investigationFormData.analysis}
                onChange={(e) => setInvestigationFormData({ ...investigationFormData, analysis: e.target.value })}
                placeholder="Document the step-by-step root cause analysis process..." 
                className="w-full border border-gray-300 p-2 rounded-lg"
              />
            </div>
          </div>

          {/* Evidence and Statements */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Evidence and Witness Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo Evidence Upload</label>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple 
                  onChange={(e) => handleFileUpload(e, 'photo')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload scene photos, damage images, etc.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Evidence Upload</label>
                <input 
                  type="file" 
                  accept="video/*"
                  multiple 
                  onChange={(e) => handleFileUpload(e, 'video')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload video recordings of incident.</p>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Worker & Witness Statements</label>
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <input type="text" placeholder="Witness Name" className="border border-gray-300 p-2 rounded-lg text-sm" />
                    <input type="text" placeholder="Witness Role" className="border border-gray-300 p-2 rounded-lg text-sm" />
                  </div>
                  <textarea rows={3} placeholder="Witness statement..." className="w-full border border-gray-300 p-2 rounded-lg text-sm mb-2" />
                  <div className="flex items-center justify-between">
                    <input type="date" className="border border-gray-300 p-1 rounded-lg text-xs" />
                    <input type="file" accept=".pdf,.doc,.docx" className="text-xs" />
                  </div>
                </div>
                <button type="button" className="text-sm text-purple-600 hover:text-purple-800">+ Add Another Witness</button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setInvestigationFormData({
              selectedIncidentId: '',
              lead: '',
              startDate: new Date().toISOString().split('T')[0],
              rootCauseType: '',
              rootCause: '',
              findings: [''],
              analysis: ''
            })} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
              Clear
            </button>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition flex items-center gap-2">
              <FaTools /> Save Investigation
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderInjuryRTW = () => {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Injury Management & Return-to-Work (RTW)</h2>
        <p className="mb-6 text-gray-700 text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
          <strong>CLC Requirement:</strong> Supports Canada Labour Code requirements for injury documentation and managing modified duty plans.
        </p>
        
        <form className="space-y-6" onSubmit={handleSubmitInjuryRecord}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Related Incident *</label>
              <select 
                value={injuryRecordFormData.selectedIncidentId}
                onChange={(e) => setInjuryRecordFormData({ ...injuryRecordFormData, selectedIncidentId: e.target.value })}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-purple-500"
              >
                <option value="">Select Incident with Injury...</option>
                {incidents.map(i => (
                  <option key={i._id} value={i._id}>{i.incidentNumber} - {i.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Injury *</label>
              <input 
                type="date" 
                value={injuryRecordFormData.injuryDate}
                onChange={(e) => setInjuryRecordFormData({ ...injuryRecordFormData, injuryDate: e.target.value })}
                className="w-full border border-gray-300 p-2 rounded-lg" 
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Injury Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Injured Worker *</label>
                <input 
                  type="text" 
                  value={injuryRecordFormData.injuredWorker}
                  onChange={(e) => setInjuryRecordFormData({ ...injuryRecordFormData, injuredWorker: e.target.value })}
                  placeholder="Worker Name" 
                  className="w-full border border-gray-300 p-2 rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Injury Type *</label>
                <select 
                  value={injuryRecordFormData.injuryType}
                  onChange={(e) => setInjuryRecordFormData({ ...injuryRecordFormData, injuryType: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                >
                  <option value="">Select Injury Type</option>
                  <option>Cut/Laceration</option>
                  <option>Strain/Sprain</option>
                  <option>Fracture</option>
                  <option>Burn</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Part Affected *</label>
                <input 
                  type="text" 
                  value={injuryRecordFormData.bodyPart}
                  onChange={(e) => setInjuryRecordFormData({ ...injuryRecordFormData, bodyPart: e.target.value })}
                  placeholder="e.g., Right Hand" 
                  className="w-full border border-gray-300 p-2 rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                <select 
                  value={injuryRecordFormData.severity}
                  onChange={(e) => setInjuryRecordFormData({ ...injuryRecordFormData, severity: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                >
                  <option value="">Select Severity</option>
                  <option>Minor</option>
                  <option>Moderate</option>
                  <option>Serious</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Modified Duty & Restrictions</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Restrictions / Limitations *</label>
              <textarea 
                rows={3} 
                value={injuryRecordFormData.doctorRestrictions}
                onChange={(e) => setInjuryRecordFormData({ ...injuryRecordFormData, doctorRestrictions: e.target.value })}
                placeholder="Enter all physician-mandated restrictions (e.g., No lifting over 10kg, No driving, Limited standing time 2 hours/day)..." 
                className="w-full border border-gray-300 p-2 rounded-lg mb-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modified Duty Work Assignment *</label>
              <textarea 
                rows={3} 
                value={injuryRecordFormData.modifiedDutyPlan}
                onChange={(e) => setInjuryRecordFormData({ ...injuryRecordFormData, modifiedDutyPlan: e.target.value })}
                placeholder="Describe the assigned modified work (e.g., Office filing, light dispatch duties, administrative tasks)..." 
                className="w-full border border-gray-300 p-2 rounded-lg"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">WCB/WSIB Claim & Documentation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WCB/WSIB Claim Number</label>
                <input 
                  type="text" 
                  value={injuryRecordFormData.wcbClaimNumber}
                  onChange={(e) => setInjuryRecordFormData({ ...injuryRecordFormData, wcbClaimNumber: e.target.value })}
                  placeholder="Claim Number" 
                  className="w-full border border-gray-300 p-2 rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return-to-Work Date</label>
                <input 
                  type="date" 
                  value={injuryRecordFormData.returnToWorkDate}
                  onChange={(e) => setInjuryRecordFormData({ ...injuryRecordFormData, returnToWorkDate: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg" 
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">WCB/WSIB Documents Upload</label>
              <input 
                type="file" 
                multiple 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    setSelectedWcbFiles(Array.from(files));
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              <p className="text-xs text-gray-500 mt-1">Upload claim forms, medical reports, doctor notes, etc.</p>
              {selectedWcbFiles.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">{selectedWcbFiles.length} file(s) selected</p>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Return-to-Work Progress Tracking</h3>
            <div className="space-y-3">
              {injuryRecordFormData.progressNotes.map((note, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <input 
                      type="date" 
                      value={note.date}
                      onChange={(e) => {
                        const updated = [...injuryRecordFormData.progressNotes];
                        updated[idx].date = e.target.value;
                        setInjuryRecordFormData({ ...injuryRecordFormData, progressNotes: updated });
                      }}
                      className="border border-gray-300 p-2 rounded-lg text-sm" 
                    />
                    <input 
                      type="text" 
                      value={note.enteredBy}
                      onChange={(e) => {
                        const updated = [...injuryRecordFormData.progressNotes];
                        updated[idx].enteredBy = e.target.value;
                        setInjuryRecordFormData({ ...injuryRecordFormData, progressNotes: updated });
                      }}
                      placeholder="Entered By" 
                      className="border border-gray-300 p-2 rounded-lg text-sm" 
                    />
                  </div>
                  <textarea 
                    rows={2} 
                    value={note.note}
                    onChange={(e) => {
                      const updated = [...injuryRecordFormData.progressNotes];
                      updated[idx].note = e.target.value;
                      setInjuryRecordFormData({ ...injuryRecordFormData, progressNotes: updated });
                    }}
                    placeholder="Log weekly follow-ups and progress toward full duty..." 
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                  />
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => setInjuryRecordFormData({ 
                  ...injuryRecordFormData, 
                  progressNotes: [...injuryRecordFormData.progressNotes, { date: '', note: '', enteredBy: '' }] 
                })}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                + Add Progress Note
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={uploadingFiles} className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50">
              {uploadingFiles ? 'Uploading...' : 'Save Injury Management Plan'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderEmergencyProcs = () => (
    <div className="space-y-6">
      {/* Emergency Contacts */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Emergency Contacts</h2>
          <button 
            onClick={() => {
              setEditingEmergencyContact(null);
              setEmergencyContactFormData({
                name: '',
                role: '',
                phone: '',
                email: '',
                department: '',
                isPrimary: false
              });
              setShowEmergencyContactModal(true);
            }}
            className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            <FaPlus className="inline mr-1" /> Add Contact
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Name</th>
                <th className="px-4 py-2 text-left font-semibold">Role</th>
                <th className="px-4 py-2 text-left font-semibold">Phone</th>
                <th className="px-4 py-2 text-left font-semibold">Email</th>
                <th className="px-4 py-2 text-left font-semibold">Department</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {emergencyContacts.map((contact) => (
                <tr key={contact._id} className="border-b">
                  <td className="px-4 py-2">
                    {contact.isPrimary && <span className="text-red-600 font-bold mr-1">*</span>}
                    {contact.name}
                  </td>
                  <td className="px-4 py-2">{contact.role}</td>
                  <td className="px-4 py-2">
                    <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                      <FaPhone className="text-xs" /> {contact.phone}
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                        <FaEnvelope className="text-xs" /> {contact.email}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-2">{contact.department}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingEmergencyContact(contact);
                          setEmergencyContactFormData({
                            name: contact.name,
                            role: contact.role,
                            phone: contact.phone,
                            email: contact.email || '',
                            department: contact.department,
                            isPrimary: contact.isPrimary
                          });
                          setShowEmergencyContactModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmergencyContact(contact._id!)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center gap-2">
          <FaPrint /> Print Emergency Contact List
        </button>
      </div>

      {/* Emergency Procedures */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Emergency Response Procedures</h2>
          <button 
            onClick={() => {
              setEditingEmergencyProcedure(null);
              setEmergencyProcedureFormData({
                title: '',
                type: 'medical',
                procedure: ''
              });
              setEmergencyProcedureFile(null);
              setShowEmergencyProcedureModal(true);
            }}
            className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            <FaPlus className="inline mr-1" /> Add Procedure
          </button>
        </div>
        <p className="mb-4 text-gray-700 text-sm">Centralized, accessible documents required for audits and immediate worker reference.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 p-4 border rounded-lg bg-red-50">
            <h3 className="font-bold text-lg text-red-700">Immediate Response</h3>
            {emergencyProcedures.filter(p => p.type === 'medical' || p.type === 'fire' || p.type === 'collision').map((proc) => (
              <button key={proc._id} className="flex items-center w-full p-3 rounded-lg hover:bg-red-100 transition text-red-700 font-medium border border-red-200">
                {proc.type === 'medical' && <FaHeartbeat className="mr-3"/>}
                {proc.type === 'fire' && <FaExclamationTriangle className="mr-3"/>}
                {proc.type === 'collision' && <FaExclamationTriangle className="mr-3"/>}
                {proc.title}
              </button>
            ))}
          </div>

          <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
            <h3 className="font-bold text-lg text-blue-700">Trucking & Site Specific</h3>
            {emergencyProcedures.filter(p => p.type === 'spill' || p.type === 'breakdown' || p.type === 'violence').map((proc) => (
              <button key={proc._id} className="flex items-center w-full p-3 rounded-lg hover:bg-blue-100 transition text-blue-700 font-medium border border-blue-200">
                {proc.type === 'spill' && <FaExclamationTriangle className="mr-3"/>}
                {proc.type === 'breakdown' && <FaMapMarkerAlt className="mr-3"/>}
                {proc.type === 'violence' && <FaUser className="mr-3"/>}
                {proc.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFirstAidLogs = () => (
      <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">First Aid Logs</h2>
        <button 
          onClick={() => {
            setEditingFirstAidLog(null);
            setFirstAidLogFormData({
              date: new Date().toISOString().split('T')[0],
              time: new Date().toTimeString().slice(0, 5),
              location: '',
              injuredPerson: '',
              injuryDescription: '',
              firstAidProvided: '',
              treatedBy: '',
              followUpRequired: false,
              followUpNotes: ''
            });
            setShowFirstAidLogModal(true);
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
        >
          <FaPlus /> New First Aid Entry
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Date/Time</th>
              <th className="px-4 py-2 text-left font-semibold">Location</th>
              <th className="px-4 py-2 text-left font-semibold">Injured Person</th>
              <th className="px-4 py-2 text-left font-semibold">Injury Description</th>
              <th className="px-4 py-2 text-left font-semibold">First Aid Provided</th>
              <th className="px-4 py-2 text-left font-semibold">Treated By</th>
              <th className="px-4 py-2 text-left font-semibold">Follow-up</th>
              <th className="px-4 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {firstAidLogs.map((log) => (
              <tr key={log._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  <div>{new Date(log.date).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">{log.time}</div>
                </td>
                <td className="px-4 py-2">{log.location}</td>
                <td className="px-4 py-2">{log.injuredPerson}</td>
                <td className="px-4 py-2">{log.injuryDescription}</td>
                <td className="px-4 py-2">{log.firstAidProvided}</td>
                <td className="px-4 py-2">{log.treatedBy}</td>
                <td className="px-4 py-2">
                  {log.followUpRequired ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Required</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">None</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingFirstAidLog(log);
                        setFirstAidLogFormData({
                          date: new Date(log.date).toISOString().split('T')[0],
                          time: log.time,
                          location: log.location,
                          injuredPerson: log.injuredPerson,
                          injuryDescription: log.injuryDescription,
                          firstAidProvided: log.firstAidProvided,
                          treatedBy: log.treatedBy,
                          followUpRequired: log.followUpRequired,
                          followUpNotes: log.followUpNotes || ''
                        });
                        setShowFirstAidLogModal(true);
                      }}
                      className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => handleDeleteFirstAidLog(log._id!)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentTab) {
      case TABS.INCIDENT_LIST:
        return renderIncidentList();
      case TABS.INVESTIGATIONS:
        return renderInvestigations();
      case TABS.INJURY_RTW:
        return renderInjuryRTW();
      case TABS.EMERGENCY_PROCS:
        return renderEmergencyProcs();
      case TABS.FIRST_AID_LOGS:
        return renderFirstAidLogs();
      default:
        return renderIncidentList();
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: FLEET_COLORS.dark }}>
              Incident, Accident & Near-Miss Management
            </h1>
            <p className="text-gray-600">Comprehensive tool for reporting, investigation, injury management, and compliance tracking.</p>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowNewReportMenu(!showNewReportMenu)}
              className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2 font-semibold"
              style={{
                background: FLEET_COLORS.gradient,
                boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
              }}
            >
              <FaPlus /> Report New Incident
            </button>

            {showNewReportMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-10 border border-gray-100">
                <p className="px-4 py-2 text-sm font-semibold text-gray-500 border-b">Select Report Type:</p>
                <button 
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition" 
                  onClick={() => { 
                    setShowNewReportMenu(false); 
                    setIncidentFormType('Driver Injury');
                    setShowIncidentForm(true);
                  }}
                >
                  Driver Injury Report
                </button>
                <button 
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition" 
                  onClick={() => { 
                    setShowNewReportMenu(false); 
                    setIncidentFormType('Vehicle Accident');
                    setShowIncidentForm(true);
                  }}
                >
                  Vehicle Accident Report
                </button>
                <button 
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition" 
                  onClick={() => { 
                    setShowNewReportMenu(false); 
                    setIncidentFormType('Workplace Incident');
                    setShowIncidentForm(true);
                  }}
                >
                  Workplace Incident (Shop/Yard/Warehouse)
                </button>
                <button 
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition" 
                  onClick={() => { 
                    setShowNewReportMenu(false); 
                    setIncidentFormType('Near Miss');
                    setShowIncidentForm(true);
                  }}
                >
                  Near Miss Reporting
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl shadow-md p-2 overflow-x-auto">
          <button
            onClick={() => setCurrentTab(TABS.INCIDENT_LIST)}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-1 whitespace-nowrap ${
              currentTab === TABS.INCIDENT_LIST
              ? 'bg-white shadow-inner text-gray-900 border-b-2 border-purple-600'
              : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FaClipboardList className="inline mr-2" /> Incident List & CAPA Status
          </button>
          <button
            onClick={() => setCurrentTab(TABS.INVESTIGATIONS)}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-1 whitespace-nowrap ${
              currentTab === TABS.INVESTIGATIONS
              ? 'bg-white shadow-inner text-gray-900 border-b-2 border-purple-600'
              : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FaTools className="inline mr-2" /> Investigation & Root Cause
          </button>
          <button
            onClick={() => setCurrentTab(TABS.INJURY_RTW)}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-1 whitespace-nowrap ${
              currentTab === TABS.INJURY_RTW
              ? 'bg-white shadow-inner text-gray-900 border-b-2 border-purple-600'
              : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FaUserInjured className="inline mr-2" /> Injury Management & RTW
          </button>
          <button
            onClick={() => setCurrentTab(TABS.EMERGENCY_PROCS)}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-1 whitespace-nowrap ${
              currentTab === TABS.EMERGENCY_PROCS
              ? 'bg-white shadow-inner text-gray-900 border-b-2 border-purple-600'
              : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FaHeartbeat className="inline mr-2" /> Emergency Procedures
          </button>
          <button
            onClick={() => setCurrentTab(TABS.FIRST_AID_LOGS)}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-1 whitespace-nowrap ${
              currentTab === TABS.FIRST_AID_LOGS
              ? 'bg-white shadow-inner text-gray-900 border-b-2 border-purple-600'
              : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FaHeartbeat className="inline mr-2" /> First Aid Logs
          </button>
        </div>

        {/* Tab Content */}
        {renderContent()}

        {/* Toast Notifications */}
        {notifications.map(notification => (
          <ToastNotificationComponent
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}

        {/* Incident Form Modal */}
        {showIncidentForm && incidentFormType && (
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xl font-bold">Report New {incidentFormType}</h3>
                <button onClick={() => {
                  setShowIncidentForm(false);
                  setIncidentFormType(null);
                  setSelectedPhotoFiles([]);
                  setSelectedVideoFiles([]);
                }} className="text-gray-500 hover:text-gray-800">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleCreateIncident} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input 
                      type="date" 
                      value={incidentFormData.date}
                      onChange={(e) => setIncidentFormData({ ...incidentFormData, date: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <input 
                      type="time" 
                      value={incidentFormData.time}
                      onChange={(e) => setIncidentFormData({ ...incidentFormData, time: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input 
                      type="text" 
                      value={incidentFormData.location}
                      onChange={(e) => setIncidentFormData({ ...incidentFormData, location: e.target.value })}
                      required
                      placeholder="Location"
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Type *</label>
                    <select 
                      value={incidentFormData.locationType}
                      onChange={(e) => setIncidentFormData({ ...incidentFormData, locationType: e.target.value as any })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="warehouse">Warehouse</option>
                      <option value="yard">Yard</option>
                      <option value="shop">Shop</option>
                      <option value="highway">Highway</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                    <select 
                      value={incidentFormData.severity}
                      onChange={(e) => setIncidentFormData({ ...incidentFormData, severity: e.target.value as any })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reported By *</label>
                    <input 
                      type="text" 
                      value={incidentFormData.reportedBy}
                      onChange={(e) => setIncidentFormData({ ...incidentFormData, reportedBy: e.target.value })}
                      required
                      placeholder="Reporter Name"
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reported By Role</label>
                  <input 
                    type="text" 
                    value={incidentFormData.reportedByRole}
                    onChange={(e) => setIncidentFormData({ ...incidentFormData, reportedByRole: e.target.value })}
                    placeholder="Role"
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea 
                    rows={4}
                    value={incidentFormData.description}
                    onChange={(e) => setIncidentFormData({ ...incidentFormData, description: e.target.value })}
                    required
                    placeholder="Describe the incident..."
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={incidentFormData.hasInjury}
                      onChange={(e) => setIncidentFormData({ ...incidentFormData, hasInjury: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Injury Reported</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo Evidence</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          setSelectedPhotoFiles(Array.from(files));
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Video Evidence</label>
                    <input 
                      type="file" 
                      accept="video/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          setSelectedVideoFiles(Array.from(files));
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowIncidentForm(false);
                      setIncidentFormType(null);
                      setSelectedPhotoFiles([]);
                      setSelectedVideoFiles([]);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={uploadingFiles}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {uploadingFiles ? 'Creating...' : 'Create Incident'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Emergency Contact Modal */}
        {showEmergencyContactModal && (
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xl font-bold">
                  {editingEmergencyContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </h3>
                <button onClick={() => {
                  setShowEmergencyContactModal(false);
                  setEditingEmergencyContact(null);
                }} className="text-gray-500 hover:text-gray-800">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={editingEmergencyContact ? handleUpdateEmergencyContact : handleCreateEmergencyContact} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input 
                      type="text" 
                      value={emergencyContactFormData.name}
                      onChange={(e) => setEmergencyContactFormData({ ...emergencyContactFormData, name: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <input 
                      type="text" 
                      value={emergencyContactFormData.role}
                      onChange={(e) => setEmergencyContactFormData({ ...emergencyContactFormData, role: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input 
                      type="tel" 
                      value={emergencyContactFormData.phone}
                      onChange={(e) => setEmergencyContactFormData({ ...emergencyContactFormData, phone: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={emergencyContactFormData.email}
                      onChange={(e) => setEmergencyContactFormData({ ...emergencyContactFormData, email: e.target.value })}
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <input 
                    type="text" 
                    value={emergencyContactFormData.department}
                    onChange={(e) => setEmergencyContactFormData({ ...emergencyContactFormData, department: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={emergencyContactFormData.isPrimary}
                      onChange={(e) => setEmergencyContactFormData({ ...emergencyContactFormData, isPrimary: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Primary Contact</span>
                  </label>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowEmergencyContactModal(false);
                      setEditingEmergencyContact(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {editingEmergencyContact ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Emergency Procedure Modal */}
        {showEmergencyProcedureModal && (
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xl font-bold">
                  {editingEmergencyProcedure ? 'Edit Emergency Procedure' : 'Add Emergency Procedure'}
                </h3>
                <button onClick={() => {
                  setShowEmergencyProcedureModal(false);
                  setEditingEmergencyProcedure(null);
                }} className="text-gray-500 hover:text-gray-800">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={editingEmergencyProcedure ? handleUpdateEmergencyProcedure : handleCreateEmergencyProcedure} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input 
                      type="text" 
                      value={emergencyProcedureFormData.title}
                      onChange={(e) => setEmergencyProcedureFormData({ ...emergencyProcedureFormData, title: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select 
                      value={emergencyProcedureFormData.type}
                      onChange={(e) => setEmergencyProcedureFormData({ ...emergencyProcedureFormData, type: e.target.value as any })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    >
                      <option value="medical">Medical</option>
                      <option value="fire">Fire</option>
                      <option value="spill">Spill</option>
                      <option value="collision">Collision</option>
                      <option value="breakdown">Breakdown</option>
                      <option value="violence">Violence</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procedure *</label>
                  <textarea 
                    rows={8}
                    value={emergencyProcedureFormData.procedure}
                    onChange={(e) => setEmergencyProcedureFormData({ ...emergencyProcedureFormData, procedure: e.target.value })}
                    required
                    placeholder="Enter the emergency procedure steps..."
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Upload (Optional)</label>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEmergencyProcedureFile(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowEmergencyProcedureModal(false);
                      setEditingEmergencyProcedure(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={uploadingFiles}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {uploadingFiles ? 'Saving...' : (editingEmergencyProcedure ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* First Aid Log Modal */}
        {showFirstAidLogModal && (
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xl font-bold">
                  {editingFirstAidLog ? 'Edit First Aid Log' : 'New First Aid Entry'}
                </h3>
                <button onClick={() => {
                  setShowFirstAidLogModal(false);
                  setEditingFirstAidLog(null);
                }} className="text-gray-500 hover:text-gray-800">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={editingFirstAidLog ? handleUpdateFirstAidLog : handleCreateFirstAidLog} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input 
                      type="date" 
                      value={firstAidLogFormData.date}
                      onChange={(e) => setFirstAidLogFormData({ ...firstAidLogFormData, date: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <input 
                      type="time" 
                      value={firstAidLogFormData.time}
                      onChange={(e) => setFirstAidLogFormData({ ...firstAidLogFormData, time: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input 
                    type="text" 
                    value={firstAidLogFormData.location}
                    onChange={(e) => setFirstAidLogFormData({ ...firstAidLogFormData, location: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Injured Person *</label>
                    <input 
                      type="text" 
                      value={firstAidLogFormData.injuredPerson}
                      onChange={(e) => setFirstAidLogFormData({ ...firstAidLogFormData, injuredPerson: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treated By *</label>
                    <input 
                      type="text" 
                      value={firstAidLogFormData.treatedBy}
                      onChange={(e) => setFirstAidLogFormData({ ...firstAidLogFormData, treatedBy: e.target.value })}
                      required
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Injury Description *</label>
                  <textarea 
                    rows={3}
                    value={firstAidLogFormData.injuryDescription}
                    onChange={(e) => setFirstAidLogFormData({ ...firstAidLogFormData, injuryDescription: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Aid Provided *</label>
                  <textarea 
                    rows={3}
                    value={firstAidLogFormData.firstAidProvided}
                    onChange={(e) => setFirstAidLogFormData({ ...firstAidLogFormData, firstAidProvided: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={firstAidLogFormData.followUpRequired}
                      onChange={(e) => setFirstAidLogFormData({ ...firstAidLogFormData, followUpRequired: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Follow-up Required</span>
                  </label>
                </div>
                {firstAidLogFormData.followUpRequired && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Notes</label>
                    <textarea 
                      rows={2}
                      value={firstAidLogFormData.followUpNotes}
                      onChange={(e) => setFirstAidLogFormData({ ...firstAidLogFormData, followUpNotes: e.target.value })}
                      className="w-full border border-gray-300 p-2 rounded-lg"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowFirstAidLogModal(false);
                      setEditingFirstAidLog(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {editingFirstAidLog ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Detailed Incident View */}
        {selectedIncidentForDetail && (
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xl font-bold">Incident Detail: {selectedIncidentForDetail.incidentNumber}</h3>
                <button onClick={() => setSelectedIncidentForDetail(null)} className="text-gray-500 hover:text-gray-800">
                  <FaTimes/>
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Type:</strong> {selectedIncidentForDetail.type}
                  </div>
                  <div>
                    <strong>Date/Time:</strong> {new Date(selectedIncidentForDetail.date).toLocaleDateString()} {selectedIncidentForDetail.time}
                  </div>
                  <div>
                    <strong>Location:</strong> {selectedIncidentForDetail.location}
                  </div>
                  <div>
                    <strong>Severity:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(selectedIncidentForDetail.severity)}`}>
                      {selectedIncidentForDetail.severity.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedIncidentForDetail.status)}`}>
                      {selectedIncidentForDetail.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <strong>Reported By:</strong> {selectedIncidentForDetail.reportedBy} ({selectedIncidentForDetail.reportedByRole})
                  </div>
                </div>
                <div>
                  <strong>Description:</strong>
                  <p className="mt-1 text-gray-700">{selectedIncidentForDetail.description}</p>
                </div>
                {selectedIncidentForDetail.capa && (
                  <div className="border-t pt-4">
                    <strong>CAPA Information:</strong>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>CAPA #: {selectedIncidentForDetail.capa.capaNumber}</div>
                      <div>Assigned To: {selectedIncidentForDetail.capa.assignedToName}</div>
                      <div>Due Date: {new Date(selectedIncidentForDetail.capa.dueDate).toLocaleDateString()}</div>
                      <div>Status: 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedIncidentForDetail.capa.status)}`}>
                          {selectedIncidentForDetail.capa.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {selectedIncidentForDetail.photoEvidence && selectedIncidentForDetail.photoEvidence.length > 0 && (
                  <div className="border-t pt-4">
                    <strong>Photo Evidence:</strong>
                    <div className="mt-2 flex gap-2">
                      {selectedIncidentForDetail.photoEvidence.map((photo, idx) => (
                        <div key={idx} className="border rounded p-2">
                          <FaImage className="text-2xl text-gray-400" />
                          <p className="text-xs mt-1">{photo.fileName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => { setSelectedIncidentForDetail(null); setCurrentTab(TABS.INVESTIGATIONS); }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Proceed to Investigation
                </button>
                <button 
                  onClick={() => setSelectedIncidentForDetail(null)} 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentsAccidents;

