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
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

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

  useEffect(() => {
    // TODO: Fetch from API
    setIncidents([
      {
        _id: '1',
        incidentNumber: 'INC-2024-001',
        date: '2024-01-15',
        time: '14:30',
        location: 'Warehouse A',
        locationType: 'warehouse',
        type: 'Workplace Incident',
        severity: 'medium',
        status: 'investigating',
        reportedBy: 'John Doe',
        reportedByRole: 'Warehouse Supervisor',
        description: 'Employee slipped on wet floor',
        hasInjury: true,
        photoEvidence: [
          { fileUrl: '/uploads/incident1.jpg', fileName: 'incident1.jpg', fileType: 'image', uploadedAt: '2024-01-15', uploadedBy: 'John Doe' }
        ],
        capa: {
          capaNumber: 'CAPA-2024-001',
          assignedTo: 'user123',
          assignedToName: 'Safety Manager',
          dueDate: '2024-02-15',
          status: 'open',
          description: 'Install non-slip mats in warehouse',
          reminderSent: false,
          escalationLevel: 0
        }
      }
    ]);
    
    setEmergencyContacts([
      { _id: '1', name: 'Emergency Services', role: 'Primary', phone: '911', department: 'External', isPrimary: true },
      { _id: '2', name: 'Safety Manager', role: 'Safety', phone: '+1-555-0100', email: 'safety@company.com', department: 'Safety', isPrimary: false }
    ]);
    
    setEmergencyProcedures([
      { _id: '1', title: 'Medical Emergency Steps', type: 'medical', procedure: '1. Assess situation\n2. Call 911\n3. Provide first aid...', lastUpdated: '2024-01-01' },
      { _id: '2', title: 'Fire Response & Evacuation', type: 'fire', procedure: '1. Sound alarm\n2. Evacuate building...', lastUpdated: '2024-01-01' }
    ]);
    
    setFirstAidLogs([
      { _id: '1', date: '2024-01-15', time: '14:30', location: 'Warehouse A', injuredPerson: 'John Doe', injuryDescription: 'Cut on hand', firstAidProvided: 'Cleaned and bandaged', treatedBy: 'Jane Smith', followUpRequired: false }
    ]);
    
    setLoading(false);
  }, []);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video' | 'document') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    // TODO: Implement actual file upload to backend
    setTimeout(() => {
      setUploadingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1000);
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

  const renderInvestigations = () => {
    const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
    const [investigationLead, setInvestigationLead] = useState('');
    const [rootCauseType, setRootCauseType] = useState<'5-why' | 'fishbone' | ''>('');
    const [rootCause, setRootCause] = useState('');
    const [findings, setFindings] = useState<string[]>(['']);
    const [analysis, setAnalysis] = useState('');

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Investigation & Root Cause Analysis</h2>
        <p className="mb-6 text-gray-700 text-sm bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
          <strong>Federal Requirement:</strong> Canada Labour Code requires employers to investigate and document all hazardous occurrences.
        </p>
        
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Reference *</label>
              <select 
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
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
                value={investigationLead}
                onChange={(e) => setInvestigationLead(e.target.value)}
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
                    checked={rootCauseType === '5-why'}
                    onChange={(e) => setRootCauseType(e.target.value as '5-why')}
                    className="mr-2"
                  />
                  5-Why Analysis
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    value="fishbone" 
                    checked={rootCauseType === 'fishbone'}
                    onChange={(e) => setRootCauseType(e.target.value as 'fishbone')}
                    className="mr-2"
                  />
                  Fishbone (Ishikawa) Diagram
                </label>
              </div>
            </div>

            {rootCauseType === '5-why' && (
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
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="Final root cause"
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
              </div>
            )}

            {rootCauseType === 'fishbone' && (
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
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
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
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
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
            <button type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
              Save Draft
            </button>
            <button type="button" className="px-4 py-2 bg-yellow-600 text-white rounded-lg shadow-md hover:bg-yellow-700 transition flex items-center gap-2">
              <FaTools /> Generate CAPA from Investigation
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderInjuryRTW = () => {
    const [selectedIncidentId, setSelectedIncidentId] = useState('');
    const [wcbClaimNumber, setWcbClaimNumber] = useState('');
    const [doctorRestrictions, setDoctorRestrictions] = useState('');
    const [modifiedDutyPlan, setModifiedDutyPlan] = useState('');
    const [progressNotes, setProgressNotes] = useState<Array<{date: string; note: string}>>([{date: '', note: ''}]);

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Injury Management & Return-to-Work (RTW)</h2>
        <p className="mb-6 text-gray-700 text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
          <strong>CLC Requirement:</strong> Supports Canada Labour Code requirements for injury documentation and managing modified duty plans.
        </p>
        
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Related Incident *</label>
              <select 
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-purple-500"
              >
                <option value="">Select Incident with Injury...</option>
                {incidents.filter(i => i.hasInjury).map(i => (
                  <option key={i._id} value={i._id}>{i.incidentNumber} - {i.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Injury *</label>
              <input type="date" className="w-full border border-gray-300 p-2 rounded-lg" />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Injury Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Injury Type</label>
                <select className="w-full border border-gray-300 p-2 rounded-lg">
                  <option>Cut/Laceration</option>
                  <option>Strain/Sprain</option>
                  <option>Fracture</option>
                  <option>Burn</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Part Affected</label>
                <input type="text" placeholder="e.g., Right Hand" className="w-full border border-gray-300 p-2 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Modified Duty & Restrictions</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Restrictions / Limitations *</label>
              <textarea 
                rows={3} 
                value={doctorRestrictions}
                onChange={(e) => setDoctorRestrictions(e.target.value)}
                placeholder="Enter all physician-mandated restrictions (e.g., No lifting over 10kg, No driving, Limited standing time 2 hours/day)..." 
                className="w-full border border-gray-300 p-2 rounded-lg mb-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modified Duty Work Assignment *</label>
              <textarea 
                rows={3} 
                value={modifiedDutyPlan}
                onChange={(e) => setModifiedDutyPlan(e.target.value)}
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
                  value={wcbClaimNumber}
                  onChange={(e) => setWcbClaimNumber(e.target.value)}
                  placeholder="Claim Number" 
                  className="w-full border border-gray-300 p-2 rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return-to-Work Date</label>
                <input type="date" className="w-full border border-gray-300 p-2 rounded-lg" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">WCB/WSIB Documents Upload</label>
              <input 
                type="file" 
                multiple 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e, 'document')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              <p className="text-xs text-gray-500 mt-1">Upload claim forms, medical reports, doctor notes, etc.</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Return-to-Work Progress Tracking</h3>
            <div className="space-y-3">
              {progressNotes.map((note, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <input 
                      type="date" 
                      value={note.date}
                      onChange={(e) => {
                        const updated = [...progressNotes];
                        updated[idx].date = e.target.value;
                        setProgressNotes(updated);
                      }}
                      className="border border-gray-300 p-2 rounded-lg text-sm" 
                    />
                    <input type="text" placeholder="Entered By" className="border border-gray-300 p-2 rounded-lg text-sm" />
                  </div>
                  <textarea 
                    rows={2} 
                    value={note.note}
                    onChange={(e) => {
                      const updated = [...progressNotes];
                      updated[idx].note = e.target.value;
                      setProgressNotes(updated);
                    }}
                    placeholder="Log weekly follow-ups and progress toward full duty..." 
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                  />
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => setProgressNotes([...progressNotes, {date: '', note: ''}])}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                + Add Progress Note
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition flex items-center gap-2">
              Save Injury Management Plan
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
          <button className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
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
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <FaEdit />
                      </button>
                      <button className="p-1 text-red-600 hover:bg-red-50 rounded">
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
        <h2 className="text-2xl font-bold mb-4">Emergency Response Procedures</h2>
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
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
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
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <FaEye />
                    </button>
                    <button className="p-1 text-yellow-600 hover:bg-yellow-50 rounded">
                      <FaEdit />
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

        {/* Modal for Detailed Incident View */}
        {selectedIncidentForDetail && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
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
