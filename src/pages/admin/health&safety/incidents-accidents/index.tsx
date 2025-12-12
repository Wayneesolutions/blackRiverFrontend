
import React, { useState, useEffect, useRef } from 'react';
import {
  FaExclamationTriangle,
  FaPlus,
  FaEye,
  FaSearch,
  FaFilter,
  FaCheckCircle,
  FaMapMarkerAlt,
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
  FaPrint,
  FaDownload,
  FaVideo,
  FaFileAlt,
  FaSave,
  FaAmbulance,
  FaFire,
  FaFlask,
  FaCar,
  FaBriefcaseMedical,
  FaChevronDown,
  FaChevronRight,
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

// Color utilities
const COLORS = {
  gradients: {
    incident: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    emergency: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  status: {
    warning: '#f59e0b',
  },
};

const getStatusColor = (status: string) => {
  const colors: Record<string, { bg: string; text: string }> = {
    open: { bg: '#dbeafe', text: '#1e40af' },
    investigating: { bg: '#fef3c7', text: '#92400e' },
    'action-required': { bg: '#fed7aa', text: '#9a3412' },
    resolved: { bg: '#d1fae5', text: '#065f46' },
    closed: { bg: '#e5e7eb', text: '#374151' },
  };
  return colors[status] || colors.open;
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, { bg: string; text: string }> = {
    low: { bg: '#d1fae5', text: '#065f46' },
    medium: { bg: '#fef3c7', text: '#92400e' },
    high: { bg: '#fee2e2', text: '#991b1b' },
    critical: { bg: '#fce7f3', text: '#831843' },
  };
  return colors[priority] || colors.medium;
};

// Types
interface MediaFile {
  fileUrl: string;
  fileName: string;
  fileType: 'image' | 'video' | 'document';
  uploadedAt: string;
  uploadedBy: string;
}

interface WitnessStatement {
  witnessName: string;
  witnessRole: string;
  statement: string;
  dateProvided: string;
}

interface CAPA {
  capaNumber: string;
  assignedTo: string;
  assignedToName: string;
  dueDate: string;
  status: string;
  description: string;
  title: string;
  type: string;
  source: string;
  priority: string;
  createdDate: string;
}

interface InjuryRecord {
  injuredWorker: string;
  injuryDate: string;
  injuryType: string;
  bodyPart: string;
  severity: string;
  progressNotes: ProgressNote[];
  wcbClaimNumber?: string;
  doctorRestrictions?: string;
  modifiedDutyPlan?: string;
  lastUpdated?: string;
}

interface ProgressNote {
  date: string;
  note: string;
  enteredBy: string;
}

interface Incident {
  _id: string;
  incidentNumber: string;
  date: string;
  time: string;
  location: string;
  locationType: string;
  type: string;
  severity: string;
  status: string;
  reportedBy: string;
  reportedById?: string;
  reportedByRole: string;
  description: string;
  immediateActionTaken?: string;
  hasInjury: boolean;
  hasDamage?: boolean;
  estimatedCost?: number;
  photoEvidence?: MediaFile[];
  videoEvidence?: MediaFile[];
  witnessStatements?: WitnessStatement[];
  capa?: CAPA;
  injuryRecord?: InjuryRecord;
  investigation?: {
    investigationLead: string;
    rootCauseType: '5-why' | 'fishbone';
    rootCause: string;
    analysis: string;
    fiveWhys?: string[];
    fishboneData?: {
      people: string;
      process: string;
      equipment: string;
      environment: string;
      materials: string;
      management: string;
    };
    completedDate: string;
  };
}

interface EmergencyContact {
  _id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  department: string;
  isPrimary: boolean;
  available24_7?: boolean;
  alternatePhone?: string;
}

interface EmergencyProcedure {
  _id: string;
  title: string;
  type: string;
  procedure: string;
  lastUpdated: string;
  quickReferenceSteps?: string[];
  documentUrl?: string;
  documents?: MediaFile[];
}

interface FirstAidLog {
  _id: string;
  date: string;
  time: string;
  location: string;
  injuredPerson: string;
  injuryDescription: string;
  firstAidProvided: string;
  treatedBy: string;
  followUpRequired: boolean;
  relatedIncident?: string;
}

const TABS = {
  INCIDENT_LIST: 'list',
  NEW_REPORT: 'new',
  INVESTIGATIONS: 'investigations',
  INJURY_RTW: 'injury',
  EMERGENCY_PROCS: 'procedures',
  FIRST_AID_LOGS: 'firstaid',
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

const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState(TABS.INCIDENT_LIST);
  const [selectedIncidentForDetail, setSelectedIncidentForDetail] = useState<Incident | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyProcedures, setEmergencyProcedures] = useState<EmergencyProcedure[]>([]);
  const [firstAidLogs, setFirstAidLogs] = useState<FirstAidLog[]>([]);
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null);
  
  // Emergency Contact form states
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [newContact, setNewContact] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    department: '',
    isPrimary: false,
    available24_7: false,
    alternatePhone: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [notificationId, setNotificationId] = useState(0);

  // New Incident Form States
  const [newIncident, setNewIncident] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    locationType: 'warehouse',
    type: 'Workplace Incident',
    severity: 'medium',
    reportedBy: '',
    reportedByRole: '',
    description: '',
    immediateActionTaken: '',
    hasInjury: false,
    hasDamage: false,
    estimatedCost: 0,
  });

  // Investigation form states
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [investigationLead, setInvestigationLead] = useState('');
  const [rootCauseType, setRootCauseType] = useState<'5-why' | 'fishbone' | ''>('');
  const [rootCause, setRootCause] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [fiveWhys, setFiveWhys] = useState(['', '', '', '', '']);
  const [fishboneData, setFishboneData] = useState({
    people: '',
    process: '',
    equipment: '',
    environment: '',
    materials: '',
    management: '',
  });
  // Witness statements are stored within the incident's investigation data

  // Injury RTW form states
  const [selectedInjuryIncidentId, setSelectedInjuryIncidentId] = useState('');
  const [wcbClaimNumber, setWcbClaimNumber] = useState('');
  const [doctorRestrictions, setDoctorRestrictions] = useState('');
  const [modifiedDutyPlan, setModifiedDutyPlan] = useState('');
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([
    { date: '', note: '', enteredBy: '' },
  ]);

  // First Aid Log Form
  const [newFirstAidLog, setNewFirstAidLog] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    injuredPerson: '',
    injuryDescription: '',
    firstAidProvided: '',
    treatedBy: '',
    followUpRequired: false,
    relatedIncident: '',
  });

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
  const [showNewReportMenu, setShowNewReportMenu] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentFormType, setIncidentFormType] = useState<'Driver Injury' | 'Vehicle Accident' | 'Workplace Incident' | 'Near Miss' | null>(null);

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
        const errorMsg = response?.message || 'Failed to create incident';
        const validationErrors = response?.errors;
        let fullErrorMsg = errorMsg;
        if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
          fullErrorMsg += ': ' + validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        }
        showNotification('error', fullErrorMsg);
      }
    } catch (error: any) {
      console.error('Error creating incident:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to create incident';
      const validationErrors = error?.response?.data?.errors;
      let fullErrorMsg = errorMsg;
      if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
        fullErrorMsg += ': ' + validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
      }
      showNotification('error', fullErrorMsg);
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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    _type: 'photo' | 'video' | 'document'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // TODO: Implement actual file upload to backend
    // Files will be uploaded and stored with the incident/investigation/injury record
    // After upload, file URLs will be added to the respective record's document arrays
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitNewIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userInfo = getLocalUserInfo();
    const userName = userInfo?.userData?.name || userInfo?.name || 'Unknown User';
    const userRole = userInfo?.userData?.role || userInfo?.role || 'Unknown Role';

    const formData = new FormData();
    formData.append('date', newIncident.date);
    formData.append('time', newIncident.time);
    formData.append('location', newIncident.location);
    formData.append('locationType', newIncident.locationType);
    formData.append('type', newIncident.type);
    formData.append('severity', newIncident.severity);
    formData.append('reportedBy', newIncident.reportedBy || userName);
    formData.append('reportedByRole', newIncident.reportedByRole || userRole);
    formData.append('description', newIncident.description);
    formData.append('immediateActionTaken', newIncident.immediateActionTaken || '');
    formData.append('hasInjury', String(newIncident.hasInjury));
    formData.append('hasDamage', String(newIncident.hasDamage));
    formData.append('estimatedCost', String(newIncident.estimatedCost || 0));

    try {
      setUploadingFiles(true);
      const response = await createIncident(formData);
      if (response?.success) {
        showNotification('success', 'Incident created successfully');
        setCurrentTab(TABS.INCIDENT_LIST);
        // Reset form
        setNewIncident({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          location: '',
          locationType: 'warehouse',
          type: 'Workplace Incident',
          severity: 'medium',
          reportedBy: '',
          reportedByRole: '',
          description: '',
          immediateActionTaken: '',
          hasInjury: false,
          hasDamage: false,
          estimatedCost: 0,
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

  const handleSubmitInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentId || !investigationLead || !analysis) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    try {
      const investigationData: any = {
        investigationLead,
        startDate: new Date().toISOString().split('T')[0],
        analysis,
        rootCause,
        rootCauseAnalysisMethod: rootCauseType as '5-why' | 'fishbone' | 'other',
      };

      if (rootCauseType === '5-why') {
        investigationData.fiveWhys = fiveWhys.filter(w => w.trim());
      } else if (rootCauseType === 'fishbone') {
        investigationData.fishboneData = fishboneData;
      }

      const response = await updateInvestigation(selectedIncidentId, investigationData);
      if (response?.success) {
        showNotification('success', 'Investigation updated successfully');
        setSelectedIncidentId('');
        setInvestigationLead('');
        setRootCauseType('');
        setRootCause('');
        setAnalysis('');
        setFiveWhys(['', '', '', '', '']);
        setFishboneData({
          people: '',
          process: '',
          equipment: '',
          environment: '',
          materials: '',
          management: '',
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

  const handleSubmitInjuryRTW = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInjuryIncidentId) {
      showNotification('error', 'Please select an incident');
      return;
    }

    const formData = new FormData();
    formData.append('wcbClaimNumber', wcbClaimNumber || '');
    formData.append('doctorRestrictions', doctorRestrictions);
    formData.append('modifiedDutyPlan', modifiedDutyPlan);
    if (progressNotes && progressNotes.length > 0) {
      formData.append('progressNotes', JSON.stringify(progressNotes.filter(note => note.date && note.note)));
    }

    try {
      setUploadingFiles(true);
      const response = await updateInjuryRecord(selectedInjuryIncidentId, formData);
      if (response?.success) {
        showNotification('success', 'Injury record updated successfully');
        setSelectedInjuryIncidentId('');
        setWcbClaimNumber('');
        setDoctorRestrictions('');
        setModifiedDutyPlan('');
        setProgressNotes([{ date: '', note: '', enteredBy: '' }]);
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

  const handleSubmitFirstAidLog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await createFirstAidLog(newFirstAidLog);
      if (response?.success) {
        showNotification('success', 'First aid log created successfully');
        // Reset form
        setNewFirstAidLog({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          location: '',
          injuredPerson: '',
          injuryDescription: '',
          firstAidProvided: '',
          treatedBy: '',
          followUpRequired: false,
          relatedIncident: '',
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

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContact) {
        const response = await updateEmergencyContact(editingContact._id, newContact);
        if (response?.success) {
          showNotification('success', 'Emergency contact updated successfully');
          setShowContactForm(false);
          setEditingContact(null);
          await fetchEmergencyContacts();
        } else {
          showNotification('error', response?.message || 'Failed to update emergency contact');
        }
      } else {
        const response = await createEmergencyContact(newContact);
        if (response?.success) {
          showNotification('success', 'Emergency contact created successfully');
          setShowContactForm(false);
          await fetchEmergencyContacts();
        } else {
          showNotification('error', response?.message || 'Failed to create emergency contact');
        }
      }
      
      // Reset form
      setNewContact({
        name: '',
        role: '',
        phone: '',
        email: '',
        department: '',
        isPrimary: false,
        available24_7: false,
        alternatePhone: '',
      });
    } catch (error: any) {
      console.error('Error saving emergency contact:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to save emergency contact');
    }
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setNewContact({
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      email: contact.email || '',
      department: contact.department,
      isPrimary: contact.isPrimary,
      available24_7: contact.available24_7 || false,
      alternatePhone: contact.alternatePhone || '',
    });
    setShowContactForm(true);
  };

  const handleDeleteContact = async (id: string) => {
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

  const filteredIncidents = incidents.filter((incident) => {
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
      {/* Search & Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by incident #, location, type, or reporter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
              <FaFilter className="text-gray-500" size={16} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none focus:outline-none font-medium text-gray-700 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="action-required">Action Required</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-purple-500 font-medium text-gray-700"
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

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: COLORS.gradients.incident }}>
                <th className="px-6 py-4 text-left text-white font-semibold text-sm">
                  Incident #
                </th>
                <th className="px-6 py-4 text-left text-white font-semibold text-sm">
                  Date/Time
                </th>
                <th className="px-6 py-4 text-left text-white font-semibold text-sm">Type</th>
                <th className="px-6 py-4 text-left text-white font-semibold text-sm">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-white font-semibold text-sm">
                  Severity
                </th>
                <th className="px-6 py-4 text-left text-white font-semibold text-sm">Status</th>
                <th className="px-6 py-4 text-left text-white font-semibold text-sm">CAPA</th>
                <th className="px-6 py-4 text-left text-white font-semibold text-sm">Injury?</th>
                <th className="px-6 py-4 text-left text-white font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                        <p className="text-gray-500 font-medium">Loading incidents...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <FaExclamationTriangle size={48} className="text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          No incidents found matching your filters
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => {
                  const statusColors = getStatusColor(incident.status);
                  const severityColors = getPriorityColor(incident.severity);

                  return (
                    <tr
                      key={incident._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {incident.incidentNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FaCalendarAlt className="text-gray-400" size={14} />
                          <div>
                            <div className="font-medium text-gray-900">
                              {new Date(incident.date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">{incident.time}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {incident.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" size={14} />
                          <span className="text-sm text-gray-700">{incident.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: severityColors.bg,
                            color: severityColors.text,
                          }}
                        >
                          {incident.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                          }}
                        >
                          {incident.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {incident.capa ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-gray-700">
                              {incident.capa.capaNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No CAPA</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {incident.hasInjury ? (
                          <FaUserInjured
                            className="text-red-500 inline-block"
                            size={20}
                            title="Injury Reported"
                          />
                        ) : (
                          <FaCheckCircle
                            className="text-green-500 inline-block"
                            size={20}
                            title="No Injury"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedIncidentForDetail(incident)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FaEye size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteIncident(incident._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" 
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

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

  const renderNewReportForm = () => (
    <div className="bg-white rounded-2xl p-8 shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Report New Incident</h2>
      
      <form onSubmit={handleSubmitNewIncident} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
            <input
              type="date"
              required
              value={newIncident.date}
              onChange={(e) => setNewIncident({ ...newIncident, date: e.target.value })}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Time *</label>
            <input
              type="time"
              required
              value={newIncident.time}
              onChange={(e) => setNewIncident({ ...newIncident, time: e.target.value })}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Incident Type *</label>
            <select
              required
              value={newIncident.type}
              onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Driver Injury">Driver Injury</option>
              <option value="Vehicle Accident">Vehicle Accident</option>
              <option value="Workplace Incident">Workplace Incident</option>
              <option value="Near Miss">Near Miss</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Severity *</label>
            <select
              required
              value={newIncident.severity}
              onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
            <input
              type="text"
              required
              placeholder="Warehouse A, Highway 401 KM 125, etc."
              value={newIncident.location}
              onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Location Type *</label>
            <select
              required
              value={newIncident.locationType}
              onChange={(e) => setNewIncident({ ...newIncident, locationType: e.target.value })}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="warehouse">Warehouse</option>
              <option value="yard">Yard</option>
              <option value="shop">Shop</option>
              <option value="office">Office</option>
              <option value="highway">Highway</option>
              <option value="customer-site">Customer Site</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reported By *</label>
            <input
              type="text"
              required
              placeholder="Your name"
              value={newIncident.reportedBy}
              onChange={(e) => setNewIncident({ ...newIncident, reportedBy: e.target.value })}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Role *</label>
            <input
              type="text"
              required
              placeholder="Driver, Supervisor, Mechanic, etc."
              value={newIncident.reportedByRole}
              onChange={(e) => setNewIncident({ ...newIncident, reportedByRole: e.target.value })}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
          <textarea
            required
            rows={4}
            placeholder="Describe what happened in detail..."
            value={newIncident.description}
            onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Immediate Action Taken</label>
          <textarea
            rows={3}
            placeholder="What actions were taken immediately after the incident?"
            value={newIncident.immediateActionTaken}
            onChange={(e) => setNewIncident({ ...newIncident, immediateActionTaken: e.target.value })}
            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newIncident.hasInjury}
              onChange={(e) => setNewIncident({ ...newIncident, hasInjury: e.target.checked })}
              className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
            />
            <span className="font-medium text-gray-700">Injury Involved</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newIncident.hasDamage}
              onChange={(e) => setNewIncident({ ...newIncident, hasDamage: e.target.checked })}
              className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
            />
            <span className="font-medium text-gray-700">Property Damage</span>
          </label>
        </div>

        {newIncident.hasDamage && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Cost ($)</label>
            <input
              type="number"
              min="0"
              value={newIncident.estimatedCost}
              onChange={(e) => setNewIncident({ ...newIncident, estimatedCost: parseFloat(e.target.value) })}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-100">
          <button
            type="button"
            onClick={() => setCurrentTab(TABS.INCIDENT_LIST)}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploadingFiles}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
          >
            <FaSave className="inline mr-2" />
            {uploadingFiles ? 'Submitting...' : 'Submit Incident Report'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderInvestigations = () => (
    <div className="bg-white rounded-2xl p-8 shadow-lg">
      <h2 className="text-3xl font-bold mb-3 text-gray-900">
        Investigation & Root Cause Analysis
      </h2>
      <div
        className="mb-8 p-4 rounded-xl border-l-4"
        style={{
          backgroundColor: COLORS.status.warning + '20',
          borderColor: COLORS.status.warning,
        }}
      >
        <p className="text-sm text-gray-700">
          <strong className="text-amber-800">Federal Requirement:</strong> Canada Labour
          Code requires employers to investigate and document all hazardous occurrences.
        </p>
      </div>

      <form onSubmit={handleSubmitInvestigation} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Incident Reference *
            </label>
            <select
              required
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select Incident to Investigate...</option>
              {incidents
                .filter((i) => i.status !== 'resolved' && i.status !== 'closed')
                .map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.incidentNumber} - {i.type}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Investigation Lead *
            </label>
            <input
              type="text"
              required
              value={investigationLead}
              onChange={(e) => setInvestigationLead(e.target.value)}
              placeholder="Safety Manager Name"
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Root Cause Analysis Tools */}
        <div className="border-t-2 border-gray-100 pt-8">
          <h3 className="text-xl font-bold mb-6 text-gray-900">
            Root Cause Analysis Tool
          </h3>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Analysis Method *
            </label>
            <div className="flex gap-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="5-why"
                  checked={rootCauseType === '5-why'}
                  onChange={(e) => setRootCauseType(e.target.value as '5-why')}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className="font-medium text-gray-700">5-Why Analysis</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="fishbone"
                  checked={rootCauseType === 'fishbone'}
                  onChange={(e) => setRootCauseType(e.target.value as 'fishbone')}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className="font-medium text-gray-700">
                  Fishbone (Ishikawa) Diagram
                </span>
              </label>
            </div>
          </div>

          {rootCauseType === '5-why' && (
            <div className="space-y-4 mb-6 p-6 bg-purple-50 rounded-xl">
              <label className="block text-sm font-bold text-purple-900">
                5-Why Analysis
              </label>
              {[1, 2, 3, 4, 5].map((num, idx) => (
                <div key={num}>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Why {num}?
                  </label>
                  <input
                    type="text"
                    value={fiveWhys[idx]}
                    onChange={(e) => {
                      const newWhys = [...fiveWhys];
                      newWhys[idx] = e.target.value;
                      setFiveWhys(newWhys);
                    }}
                    placeholder={`Enter reason ${num}...`}
                    className="w-full border-2 border-purple-200 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-purple-900 mb-2">
                  Root Cause Identified
                </label>
                <input
                  type="text"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Final root cause..."
                  className="w-full border-2 border-purple-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>
            </div>
          )}

          {rootCauseType === 'fishbone' && (
            <div className="mb-6 p-6 bg-blue-50 rounded-xl">
              <label className="block text-sm font-bold text-blue-900 mb-4">
                Fishbone Categories
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['people', 'process', 'equipment', 'environment', 'materials', 'management'].map(
                  (category) => (
                    <div key={category}>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 capitalize">
                        {category}
                      </label>
                      <input
                        type="text"
                        value={fishboneData[category as keyof typeof fishboneData]}
                        onChange={(e) =>
                          setFishboneData({ ...fishboneData, [category]: e.target.value })
                        }
                        placeholder={`${category} factors...`}
                        className="w-full border-2 border-blue-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  )
                )}
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-blue-900 mb-2">
                  Root Cause Identified
                </label>
                <input
                  type="text"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Final root cause..."
                  className="w-full border-2 border-blue-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Detailed Findings & Analysis *
            </label>
            <textarea
              required
              rows={5}
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              placeholder="Document the step-by-step root cause analysis process..."
              className="w-full border-2 border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Evidence & Document Upload */}
        <div className="border-t-2 border-gray-100 pt-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Evidence & Documentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Photo Evidence
              </label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Video Evidence
              </label>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => handleFileUpload(e, 'video')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              <p className="text-xs text-gray-500 mt-1">Upload video recordings of incident.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Investigation Documents (PDF, Word, etc.)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                onChange={(e) => handleFileUpload(e, 'document')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              <p className="text-xs text-gray-500 mt-1">Upload witness statements, reports, analysis documents, etc.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-100">
          <button
            type="button"
            onClick={() => setCurrentTab(TABS.INCIDENT_LIST)}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <FaSave className="inline mr-2" />
            Save Investigation
          </button>
        </div>
      </form>
    </div>
  );

  const renderInjuryRTW = () => (
    <div className="bg-white rounded-2xl p-8 shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">
        Injury Management & Return-to-Work
      </h2>

      <form onSubmit={handleSubmitInjuryRTW} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Incident with Injury *
          </label>
          <select
            required
            value={selectedInjuryIncidentId}
            onChange={(e) => setSelectedInjuryIncidentId(e.target.value)}
            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Select incident...</option>
            {incidents
              .filter((i) => i.hasInjury)
              .map((i) => (
                <option key={i._id} value={i._id}>
                  {i.incidentNumber} - {i.injuryRecord?.injuredWorker || 'Unknown Worker'}
                </option>
              ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              WCB/WSIB Claim Number
            </label>
            <input
              type="text"
              value={wcbClaimNumber}
              onChange={(e) => setWcbClaimNumber(e.target.value)}
              placeholder="WCB-2025-XXXXX"
              className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Doctor Restrictions *
          </label>
          <textarea
            required
            rows={3}
            value={doctorRestrictions}
            onChange={(e) => setDoctorRestrictions(e.target.value)}
            placeholder="No lifting over 10 lbs, restricted bending, etc."
            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Modified Duty Plan *
          </label>
          <textarea
            required
            rows={4}
            value={modifiedDutyPlan}
            onChange={(e) => setModifiedDutyPlan(e.target.value)}
            placeholder="Detailed plan for modified work duties..."
            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="border-t-2 border-gray-100 pt-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Progress Notes</h3>
          {progressNotes.map((note, idx) => (
            <div key={idx} className="mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="date"
                  value={note.date}
                  onChange={(e) => {
                    const newNotes = [...progressNotes];
                    newNotes[idx].date = e.target.value;
                    setProgressNotes(newNotes);
                  }}
                  className="border-2 border-gray-200 p-2 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Entered by"
                  value={note.enteredBy}
                  onChange={(e) => {
                    const newNotes = [...progressNotes];
                    newNotes[idx].enteredBy = e.target.value;
                    setProgressNotes(newNotes);
                  }}
                  className="border-2 border-gray-200 p-2 rounded-lg"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Progress note..."
                value={note.note}
                onChange={(e) => {
                  const newNotes = [...progressNotes];
                  newNotes[idx].note = e.target.value;
                  setProgressNotes(newNotes);
                }}
                className="w-full mt-2 border-2 border-gray-200 p-2 rounded-lg resize-none"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setProgressNotes([...progressNotes, { date: '', note: '', enteredBy: '' }])
            }
            className="text-red-600 font-semibold hover:text-red-700"
          >
            + Add Progress Note
          </button>
        </div>

        {/* WCB/WSIB Documents Upload */}
        <div className="border-t-2 border-gray-100 pt-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">WCB/WSIB Documentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                WCB/WSIB Claim Documents
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medical Certificates & Fitness Forms
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    setSelectedWcbFiles([...selectedWcbFiles, ...Array.from(files)]);
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              <p className="text-xs text-gray-500 mt-1">Upload fitness certificates, return-to-work forms, etc.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-100">
          <button
            type="button"
            onClick={() => setCurrentTab(TABS.INCIDENT_LIST)}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploadingFiles}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
          >
            <FaSave className="inline mr-2" />
            {uploadingFiles ? 'Saving...' : 'Save RTW Plan'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderEmergencyProcedures = () => (
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
        return renderEmergencyProcedures();
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
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === TABS.INCIDENT_LIST
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaClipboardList className="inline mr-2" />
            Incident List
          </button>
          <button
            onClick={() => setCurrentTab(TABS.NEW_REPORT)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === TABS.NEW_REPORT
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaPlus className="inline mr-2" />
            New Report
          </button>
          <button
            onClick={() => setCurrentTab(TABS.INVESTIGATIONS)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === TABS.INVESTIGATIONS
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaSearch className="inline mr-2" />
            Investigations
          </button>
          <button
            onClick={() => setCurrentTab(TABS.INJURY_RTW)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === TABS.INJURY_RTW
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaHeartbeat className="inline mr-2" />
            Injury & RTW
          </button>
          <button
            onClick={() => setCurrentTab(TABS.EMERGENCY_PROCS)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === TABS.EMERGENCY_PROCS
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaPhone className="inline mr-2" />
            Emergency Procedures
          </button>
          <button
            onClick={() => setCurrentTab(TABS.FIRST_AID_LOGS)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === TABS.FIRST_AID_LOGS
                ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaBriefcaseMedical className="inline mr-2" />
            First Aid Logs
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
                  <p className="mt-2 text-gray-700">{selectedIncidentForDetail.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingContact ? 'Edit Emergency Contact' : 'Add New Emergency Contact'}
                </h3>
                <button
                  onClick={() => {
                    setShowContactForm(false);
                    setEditingContact(null);
                  }}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmitContact} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                      placeholder="Contact Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                    <input
                      type="text"
                      required
                      value={newContact.role}
                      onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                      placeholder="Safety Manager, Operations Manager, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                      placeholder="+1-555-0100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Alternate Phone</label>
                    <input
                      type="tel"
                      value={newContact.alternatePhone}
                      onChange={(e) => setNewContact({ ...newContact, alternatePhone: e.target.value })}
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                      placeholder="+1-555-0101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                    <input
                      type="text"
                      required
                      value={newContact.department}
                      onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                      placeholder="Safety, Operations, External, etc."
                    />
                  </div>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newContact.isPrimary}
                      onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                      className="w-5 h-5 text-red-600 focus:ring-red-500 rounded"
                    />
                    <span className="font-medium text-gray-700">Primary Contact</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newContact.available24_7}
                      onChange={(e) => setNewContact({ ...newContact, available24_7: e.target.checked })}
                      className="w-5 h-5 text-red-600 focus:ring-red-500 rounded"
                    />
                    <span className="font-medium text-gray-700">Available 24/7</span>
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowContactForm(false);
                      setEditingContact(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
                  >
                    <FaSave className="inline mr-2" />
                    {editingContact ? 'Update Contact' : 'Save Contact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyContacts.map((contact) => (
            <div
              key={contact._id}
              className={`p-5 rounded-xl border-2 ${
                contact.isPrimary
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{contact.name}</h3>
                  {contact.isPrimary && (
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full mt-1 inline-block">
                      PRIMARY
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditContact(contact)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Contact"
                  >
                    <FaEdit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Contact"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{contact.role}</p>
              <p className="text-sm text-gray-500 mb-2">{contact.department}</p>
              <div className="flex items-center gap-2 mb-1">
                <FaPhone className="text-blue-600" size={14} />
                <a href={`tel:${contact.phone}`} className="text-lg font-semibold text-blue-600 hover:underline">
                  {contact.phone}
                </a>
              </div>
              {contact.alternatePhone && (
                <div className="flex items-center gap-2 mb-1">
                  <FaPhone className="text-gray-400" size={12} />
                  <span className="text-sm text-gray-500">Alt: {contact.alternatePhone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-gray-400" size={12} />
                  <a href={`mailto:${contact.email}`} className="text-sm text-gray-600 hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.available24_7 && (
                <span className="mt-2 inline-block text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  24/7 Available
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
            <FaPrint /> Print Emergency Contact List
          </button>
        </div>
      </div>

  
    </div>
  );



  const renderIncidentDetail = () => {
    if (!selectedIncidentForDetail) return null;

    const incident = selectedIncidentForDetail;
    const statusColors = getStatusColor(incident.status);
    const severityColors = getPriorityColor(incident.severity);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">{incident.incidentNumber}</h2>
              <p className="text-purple-100">{incident.type}</p>
            </div>
            <button
              onClick={() => setSelectedIncidentForDetail(null)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {/* Status and Severity */}
            <div className="flex gap-4">
              <span
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  backgroundColor: statusColors.bg,
                  color: statusColors.text,
                }}
              >
                {incident.status.replace('-', ' ').toUpperCase()}
              </span>
              <span
                className="px-4 py-2 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: severityColors.bg,
                  color: severityColors.text,
                }}
              >
                {incident.severity.toUpperCase()} SEVERITY
              </span>
              {incident.hasInjury && (
                <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold flex items-center gap-2">
                  <FaUserInjured /> Injury Reported
                </span>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-500">Date & Time</label>
                <p className="text-lg font-medium text-gray-900">
                  {new Date(incident.date).toLocaleDateString()} at {incident.time}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Location</label>
                <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-red-500" />
                  {incident.location}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">Reported By</label>
                <p className="text-lg font-medium text-gray-900">
                  {incident.reportedBy} ({incident.reportedByRole})
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold text-gray-500">Description</label>
              <p className="text-gray-700 mt-2 leading-relaxed">{incident.description}</p>
            </div>

            {incident.immediateActionTaken && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Immediate Action Taken</label>
                <p className="text-gray-700 mt-2 leading-relaxed">{incident.immediateActionTaken}</p>
              </div>
            )}

            {/* CAPA Info */}
            {incident.capa && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Corrective Action</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">CAPA Number</label>
                    <p className="font-semibold text-gray-900">{incident.capa.capaNumber}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Assigned To</label>
                    <p className="font-semibold text-gray-900">{incident.capa.assignedToName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Due Date</label>
                    <p className="font-semibold text-gray-900">
                      {new Date(incident.capa.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Status</label>
                    <p className="font-semibold text-gray-900 capitalize">{incident.capa.status}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">Description</label>
                    <p className="text-gray-700 mt-1">{incident.capa.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Investigation Data */}
            {incident.investigation && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <FaTools className="text-blue-600" />
                  Investigation & Root Cause Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Investigation Lead</label>
                    <p className="font-semibold text-gray-900">{incident.investigation.investigationLead}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Completed Date</label>
                    <p className="font-semibold text-gray-900">
                      {new Date(incident.investigation.completedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Analysis Method</label>
                    <p className="font-semibold text-gray-900 capitalize">
                      {incident.investigation.rootCauseType === '5-why' ? '5-Why Analysis' : 'Fishbone Diagram'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Root Cause</label>
                    <p className="font-semibold text-gray-900">{incident.investigation.rootCause}</p>
                  </div>
                </div>
                
                {incident.investigation.rootCauseType === '5-why' && incident.investigation.fiveWhys && (
                  <div className="mb-4 p-4 bg-white rounded-lg">
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">5-Why Analysis</label>
                    <div className="space-y-2">
                      {incident.investigation.fiveWhys.map((why, idx) => (
                        why && (
                          <div key={idx} className="text-sm text-gray-700">
                            <span className="font-semibold">Why {idx + 1}:</span> {why}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {incident.investigation.rootCauseType === 'fishbone' && incident.investigation.fishboneData && (
                  <div className="mb-4 p-4 bg-white rounded-lg">
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">Fishbone Categories</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {Object.entries(incident.investigation.fishboneData).map(([key, value]) => (
                        value && (
                          <div key={key}>
                            <span className="font-semibold capitalize">{key}:</span> {value}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">Detailed Findings & Analysis</label>
                  <p className="text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg">
                    {incident.investigation.analysis}
                  </p>
                </div>
              </div>
            )}

            {/* Injury Record & RTW */}
            {incident.injuryRecord && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <FaUserInjured className="text-red-600" />
                  Injury Management & Return-to-Work
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Injured Worker</label>
                    <p className="font-semibold text-gray-900">{incident.injuryRecord.injuredWorker}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Injury Date</label>
                    <p className="font-semibold text-gray-900">
                      {new Date(incident.injuryRecord.injuryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Injury Type</label>
                    <p className="font-semibold text-gray-900">{incident.injuryRecord.injuryType}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Body Part</label>
                    <p className="font-semibold text-gray-900">{incident.injuryRecord.bodyPart}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Severity</label>
                    <p className="font-semibold text-gray-900 capitalize">{incident.injuryRecord.severity}</p>
                  </div>
                  {incident.injuryRecord.wcbClaimNumber && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600">WCB/WSIB Claim Number</label>
                      <p className="font-semibold text-gray-900">{incident.injuryRecord.wcbClaimNumber}</p>
                    </div>
                  )}
                </div>

                {incident.injuryRecord.doctorRestrictions && (
                  <div className="mb-4 p-4 bg-white rounded-lg">
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">Doctor Restrictions</label>
                    <p className="text-gray-700 whitespace-pre-wrap">{incident.injuryRecord.doctorRestrictions}</p>
                  </div>
                )}

                {incident.injuryRecord.modifiedDutyPlan && (
                  <div className="mb-4 p-4 bg-white rounded-lg">
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">Modified Duty Plan</label>
                    <p className="text-gray-700 whitespace-pre-wrap">{incident.injuryRecord.modifiedDutyPlan}</p>
                  </div>
                )}

                {incident.injuryRecord.progressNotes && incident.injuryRecord.progressNotes.length > 0 && (
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">Progress Notes</label>
                    <div className="space-y-3">
                      {incident.injuryRecord.progressNotes.map((note, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border-l-4 border-red-400">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {new Date(note.date).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500">By: {note.enteredBy}</span>
                          </div>
                          <p className="text-sm text-gray-700">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {incident.injuryRecord.lastUpdated && (
                  <div className="text-xs text-gray-500 mt-4">
                    Last Updated: {new Date(incident.injuryRecord.lastUpdated).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Photo Evidence */}
            {incident.photoEvidence && incident.photoEvidence.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-3 block">Photo Evidence</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {incident.photoEvidence.map((photo, idx) => (
                    <div key={idx} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 h-32 flex items-center justify-center">
                        <FaImage className="text-gray-400" size={32} />
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-gray-600 truncate">{photo.fileName}</p>
                        <a
                          href={photo.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          View/Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Evidence */}
            {incident.videoEvidence && incident.videoEvidence.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-3 block">Video Evidence</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incident.videoEvidence.map((video, idx) => (
                    <div key={idx} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 h-32 flex items-center justify-center">
                        <FaVideo className="text-gray-400" size={32} />
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-gray-600 truncate">{video.fileName}</p>
                        <a
                          href={video.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          View/Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related First Aid Logs */}
            {firstAidLogs.filter(log => log.relatedIncident === incident._id).length > 0 && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <FaBriefcaseMedical className="text-green-600" />
                  Related First Aid Treatment
                </h3>
                <div className="space-y-3">
                  {firstAidLogs
                    .filter(log => log.relatedIncident === incident._id)
                    .map((log) => (
                      <div key={log._id} className="bg-white p-4 rounded-lg border-l-4 border-green-400">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          <div>
                            <span className="text-xs font-semibold text-gray-600">Date/Time:</span>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(log.date).toLocaleDateString()} at {log.time}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-600">Location:</span>
                            <p className="text-sm font-medium text-gray-900">{log.location}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-600">Injured Person:</span>
                            <p className="text-sm font-medium text-gray-900">{log.injuredPerson}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-600">Treated By:</span>
                            <p className="text-sm font-medium text-gray-900">{log.treatedBy}</p>
                          </div>
                        </div>
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-gray-600">Injury Description:</span>
                          <p className="text-sm text-gray-700">{log.injuryDescription}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-600">First Aid Provided:</span>
                          <p className="text-sm text-gray-700">{log.firstAidProvided}</p>
                        </div>
                        {log.followUpRequired && (
                          <div className="mt-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                              Follow-up Required
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-100">
              <button
                onClick={() => setSelectedIncidentForDetail(null)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                <FaPrint />
                Print Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Incident Management</h1>
          <p className="text-gray-600">
            Report, investigate, and manage workplace incidents, accidents, and near-misses
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentTab(TABS.INCIDENT_LIST)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === TABS.INCIDENT_LIST
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaClipboardList className="inline mr-2" />
            Incident List
          </button>
          <button
            onClick={() => setCurrentTab(TABS.NEW_REPORT)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === TABS.NEW_REPORT
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaPlus className="inline mr-2" />
            New Report
          </button>
          <button
            onClick={() => setCurrentTab(TABS.INVESTIGATIONS)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === TABS.INVESTIGATIONS
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaSearch className="inline mr-2" />
            Investigations
          </button>
          <button
            onClick={() => setCurrentTab(TABS.INJURY_RTW)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === TABS.INJURY_RTW
                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FaHeartbeat className="inline mr-2" />
            Injury & RTW
          </button>
     
        </div>

        {/* Content Area */}
        {currentTab === TABS.INCIDENT_LIST && renderIncidentList()}
        {currentTab === TABS.NEW_REPORT && renderNewReportForm()}
        {currentTab === TABS.INVESTIGATIONS && renderInvestigations()}
        {currentTab === TABS.INJURY_RTW && renderInjuryRTW()}
        {currentTab === TABS.EMERGENCY_PROCS && renderEmergencyProcedures()}
        {currentTab === TABS.FIRST_AID_LOGS && renderFirstAidLogs()}

        {/* Detail Modal */}
        {selectedIncidentForDetail && renderIncidentDetail()}
      </div>
    </div>
  );
};

export default IncidentManagement;
