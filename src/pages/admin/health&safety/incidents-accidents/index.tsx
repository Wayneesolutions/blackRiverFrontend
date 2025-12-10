
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Mock Incidents
      setIncidents([
        {
          _id: '1',
          incidentNumber: 'INC-2025-001',
          date: '2025-12-08',
          time: '14:30',
          location: 'Warehouse A',
          locationType: 'warehouse',
          type: 'Workplace Incident',
          severity: 'medium',
          status: 'investigating',
          reportedBy: 'John Doe',
          reportedById: 'EMP001',
          reportedByRole: 'Warehouse Supervisor',
          description: 'Employee slipped on wet floor near loading dock. Immediate first aid provided.',
          immediateActionTaken: 'Area cordoned off, wet floor signs placed, cleaning crew notified',
          hasInjury: true,
          photoEvidence: [
            {
              fileUrl: '/uploads/incident1.jpg',
              fileName: 'incident-scene.jpg',
              fileType: 'image',
              uploadedAt: '2025-12-08',
              uploadedBy: 'John Doe',
            },
          ],
          capa: {
            capaNumber: 'CAPA-2025-001',
            assignedTo: 'user123',
            assignedToName: 'Safety Manager',
            dueDate: '2025-12-20',
            status: 'in-progress',
            description: 'Install non-slip mats in warehouse loading area',
            title: 'Warehouse Floor Safety Improvements',
            type: 'corrective',
            source: 'Incident',
            priority: 'high',
            createdDate: '2025-12-08',
          },
          injuryRecord: {
            injuredWorker: 'Mike Johnson',
            injuryDate: '2025-12-08',
            injuryType: 'Strain/Sprain',
            bodyPart: 'Lower Back',
            severity: 'medium',
            progressNotes: [],
          },
        },
        {
          _id: '2',
          incidentNumber: 'INC-2025-002',
          date: '2025-12-05',
          time: '09:15',
          location: 'Highway 401, KM 125',
          locationType: 'highway',
          type: 'Vehicle Accident',
          severity: 'high',
          status: 'action-required',
          reportedBy: 'Jane Smith',
          reportedByRole: 'Driver',
          description: 'Rear-ended at traffic light. Minor damage to trailer bumper.',
          hasInjury: false,
          hasDamage: true,
          estimatedCost: 3500,
        },
        {
          _id: '3',
          incidentNumber: 'INC-2025-003',
          date: '2025-12-01',
          time: '16:45',
          location: 'Shop Floor',
          locationType: 'shop',
          type: 'Near Miss',
          severity: 'low',
          status: 'resolved',
          reportedBy: 'Bob Wilson',
          reportedByRole: 'Mechanic',
          description: 'Tool fell from elevated workbench, no one injured',
          hasInjury: false,
        },
      ]);

      // Mock Emergency Contacts
      setEmergencyContacts([
        {
          _id: '1',
          name: 'Emergency Services',
          role: 'Emergency Response',
          phone: '911',
          department: 'External',
          isPrimary: true,
          available24_7: true,
        },
        {
          _id: '2',
          name: 'Safety Manager - David Chen',
          role: 'Safety Manager',
          phone: '+1-555-0100',
          email: 'safety@company.com',
          department: 'Safety',
          isPrimary: false,
          available24_7: false,
          alternatePhone: '+1-555-0101',
        },
        {
          _id: '3',
          name: 'Operations Manager - Sarah Lee',
          role: 'Operations Manager',
          phone: '+1-555-0200',
          email: 'ops@company.com',
          department: 'Operations',
          isPrimary: false,
        },
      ]);

  

      setLoading(false);
    };

    fetchData();
  }, []);

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
    
    const incident: Incident = {
      _id: `${Date.now()}`,
      incidentNumber: `INC-2025-${String(incidents.length + 1).padStart(3, '0')}`,
      ...newIncident,
      status: 'open',
    };

    setIncidents([incident, ...incidents]);
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
  };

  const handleSubmitInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find and update the incident with investigation data
    setIncidents(incidents.map(inc => {
      if (inc._id === selectedIncidentId) {
        return {
          ...inc,
          investigation: {
            investigationLead,
            rootCauseType: rootCauseType as '5-why' | 'fishbone',
            rootCause,
            analysis,
            fiveWhys: rootCauseType === '5-why' ? fiveWhys : undefined,
            fishboneData: rootCauseType === 'fishbone' ? fishboneData : undefined,
            completedDate: new Date().toISOString().split('T')[0],
          },
          status: 'action-required', // Update status after investigation
        };
      }
      return inc;
    }));
    
    alert('Investigation submitted successfully! View details in the Incident List.');
    setCurrentTab(TABS.INCIDENT_LIST);
    
    // Reset form
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
  };

  const handleSubmitInjuryRTW = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update the incident with injury/RTW data
    setIncidents(incidents.map(inc => {
      if (inc._id === selectedInjuryIncidentId) {
        return {
          ...inc,
          injuryRecord: {
            ...inc.injuryRecord!,
            wcbClaimNumber,
            doctorRestrictions,
            modifiedDutyPlan,
            progressNotes: progressNotes.filter(note => note.date && note.note), // Only save filled notes
            lastUpdated: new Date().toISOString().split('T')[0],
          },
        };
      }
      return inc;
    }));
    
    alert('Injury & RTW record saved successfully! View in Incident Details.');
    setCurrentTab(TABS.INCIDENT_LIST);
    
    // Reset form
    setSelectedInjuryIncidentId('');
    setWcbClaimNumber('');
    setDoctorRestrictions('');
    setModifiedDutyPlan('');
    setProgressNotes([{ date: '', note: '', enteredBy: '' }]);
  };

  const handleSubmitFirstAidLog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const log: FirstAidLog = {
      _id: `${Date.now()}`,
      ...newFirstAidLog,
    };

    setFirstAidLogs([log, ...firstAidLogs]);
    
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
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingContact) {
      // Update existing contact
      setEmergencyContacts(emergencyContacts.map(contact => 
        contact._id === editingContact._id 
          ? { ...contact, ...newContact }
          : contact
      ));
    } else {
      // Add new contact
      const contact: EmergencyContact = {
        _id: `${Date.now()}`,
        ...newContact,
      };
      setEmergencyContacts([...emergencyContacts, contact]);
    }
    
    // Reset form
    setShowContactForm(false);
    setEditingContact(null);
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

  const handleDeleteContact = (id: string) => {
    if (confirm('Are you sure you want to delete this emergency contact?')) {
      setEmergencyContacts(emergencyContacts.filter(contact => contact._id !== id));
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
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <FaSave className="inline mr-2" />
            Submit Incident Report
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
                onChange={(e) => handleFileUpload(e, 'document')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              <p className="text-xs text-gray-500 mt-1">Upload claim forms, medical reports, doctor notes, etc.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medical Certificates & Fitness Forms
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => handleFileUpload(e, 'document')}
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
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all shadow-lg"
          >
            <FaSave className="inline mr-2" />
            Save RTW Plan
          </button>
        </div>
      </form>
    </div>
  );

  const renderEmergencyProcedures = () => (
    <div className="space-y-6">
      {/* Emergency Contacts */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FaPhone className="text-red-600" />
            Emergency Contacts
          </h2>
          <button
            onClick={() => {
              setEditingContact(null);
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
              setShowContactForm(true);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Add Contact
          </button>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              {editingContact ? 'Edit Emergency Contact' : 'Add New Emergency Contact'}
            </h3>
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