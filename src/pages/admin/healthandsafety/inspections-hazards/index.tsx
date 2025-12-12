import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaShieldAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaClipboardCheck,
  FaTimes,
  FaInfoCircle,
  FaChartLine,
  FaCogs,
  FaDownload,
  FaSave,
  FaArrowRight
} from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import { 
  createInspection, 
  getInspections, 
  updateInspection, 
  deleteInspection,
  createHazard,
  getHazards,
  updateHazard,
  deleteHazard
} from '../../../../axios/api/healthSafety';

interface Inspection {
  _id: string;
  inspectionNumber: string;
  date: string;
  type: string;
  inspector: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  findings: number;
  hazards: number;
  location: string;
  notes?: string;
}

interface Hazard {
  _id: string;
  hazardNumber?: string;
  hazardId?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'Low' | 'Medium' | 'High' | 'Critical';
  category?: string;
  location: string;
  identifiedDate?: string;
  dateReported?: string;
  reporter?: string;
  type?: 'Unsafe Equipment' | 'Weather Hazards' | 'Fatigue Indicators' | 'Load Securement Issues' | 'Yard Hazards' | 'Ergonomic Risks';
  likelihood?: 1 | 2 | 3 | 4 | 5;
  riskScore?: number;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  controlMeasures?: string;
  riskRating?: string;
  status: 'identified' | 'assessed' | 'controlled' | 'monitored' | 'resolved' | 'reported' | 'in-assessment' | 'action-assigned' | 'action-in-progress' | 'verified';
  assignedTo?: any;
  dueDate?: string;
  resolvedDate?: string;
  inspectionId?: string;
  notes?: string;
  correctiveAction?: {
    assignedTo: string;
    description: string;
    dueDate: string;
    completionDate?: string;
  };
  photoEvidence?: string[];
  rootCauseAnalysis?: string;
}

interface DriverObservation {
  _id: string;
  observationId: string;
  date: string;
  driver: string;
  observer: string;
  observationType: 'on-road' | 'yard-driving';
  checklist: {
    seatbeltUse: boolean;
    distraction: boolean;
    speedCompliance: boolean;
    ppeUse: boolean;
    signalUse: boolean;
    blindSpotCheck: boolean;
  };
  score: number;
  coachingNotes: string;
  status: 'pending' | 'coached' | 'follow-up-required' | 'completed';
  followUpDate?: string;
}

interface TruckingHazard {
  _id: string;
  hazardId: string;
  dateReported: string;
  reporter: string;
  truckingType: 'Load Securement' | 'Reefer Food Safety' | 'Snow/Ice Removal' | 'Tire Chain Safety' | 'Fueling/DEF Spill' | 'DG Spill' | 'Winter Hazard' | 'Ergonomics (Tarping/Dolly)';
  description: string;
  location: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'reported' | 'action-assigned' | 'in-progress' | 'resolved' | 'verified';
  assignedTo?: string;
  dueDate?: string;
  completionDate?: string;
  correctiveActions?: string;
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

// InspectionsHazards component removed - replaced by HazardControl component below

const HazardControl = () => {
    const navigate = useNavigate();
    const [hazards, setHazards] = useState<Hazard[]>([]);
    const [truckingHazards, setTruckingHazards] = useState<TruckingHazard[]>([]);
    const [observations, setObservations] = useState<DriverObservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
    const [hazardSubTab, setHazardSubTab] = useState<'reporting' | 'observations' | 'trucking-specific'>('reporting');
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);
    const [editingHazard, setEditingHazard] = useState<Hazard | null>(null);

    const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarType, setSidebarType] = useState<'hazard' | 'observation' | 'trucking-hazard' | null>(null);
    
    // Form states
    const [newHazard, setNewHazard] = useState({
        type: '',
        description: '',
        location: '',
        reporter: '',
        likelihood: 3,
        severity: 3,
    });
    
    const [newObservation, setNewObservation] = useState({
        driver: '',
        observer: '',
        observationType: 'on-road' as 'on-road' | 'yard-driving',
        date: new Date().toISOString().split('T')[0],
        checklist: {
            seatbeltUse: true,
            distraction: false,
            speedCompliance: true,
            ppeUse: true,
            signalUse: true,
            blindSpotCheck: true,
        },
        coachingNotes: '',
    });
    
    const [newTruckingHazard, setNewTruckingHazard] = useState({
        truckingType: '',
        description: '',
        location: '',
        reporter: '',
        severity: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    });

    // Toast notification helpers
    const addNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Load observations and trucking hazards from localStorage on mount
    useEffect(() => {
        const savedObservations = localStorage.getItem('driverObservations');
        const savedTruckingHazards = localStorage.getItem('truckingHazards');
        
        if (savedObservations) {
            try {
                setObservations(JSON.parse(savedObservations));
            } catch (e) {
                console.error('Error loading observations:', e);
            }
        }
        
        if (savedTruckingHazards) {
            try {
                setTruckingHazards(JSON.parse(savedTruckingHazards));
            } catch (e) {
                console.error('Error loading trucking hazards:', e);
            }
        }
    }, []);

    // Save observations to localStorage whenever they change
    useEffect(() => {
        if (observations.length > 0) {
            localStorage.setItem('driverObservations', JSON.stringify(observations));
        }
    }, [observations]);

    // Save trucking hazards to localStorage whenever they change
    useEffect(() => {
        if (truckingHazards.length > 0) {
            localStorage.setItem('truckingHazards', JSON.stringify(truckingHazards));
        }
    }, [truckingHazards]);

    // Fetch all hazards on initial render (without filters)
    useEffect(() => {
        fetchHazards(false); // false = don't apply filters, fetch all
    }, []);

    // Fetch hazards when filters change
    useEffect(() => {
        // Skip initial render (when filters are still 'all')
        const isInitial = filterStatus === 'all' && filterRiskLevel === 'all';
        if (!isInitial) {
            fetchHazards(true); // true = apply filters
        }
    }, [filterStatus, filterRiskLevel]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchHazards();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const fetchHazards = async (applyFilters = true) => {
        setLoading(true);
        try {
            const params: any = {};
            
            // Only apply filters if explicitly requested (for initial load, fetch all)
            if (applyFilters) {
                if (filterStatus !== 'all') {
                    params.status = filterStatus;
                }
                if (filterRiskLevel !== 'all') {
                    params.severity = filterRiskLevel.toLowerCase();
                }
                if (searchTerm) {
                    params.search = searchTerm;
                }
            }

            // Always call API, even if no params (to get all hazards)
            const apiParams = Object.keys(params).length > 0 ? params : undefined;
            console.log('Fetching hazards with params:', apiParams);
            const response = await getHazards(apiParams);
            console.log('Hazards API response:', response);
            
            if (response?.success && Array.isArray(response.data)) {
                console.log(`Fetched ${response.data.length} hazards`);
                // Map API response to frontend format
                const mappedHazards = response.data.map((h: any) => ({
                    _id: h._id,
                    hazardNumber: h.hazardNumber,
                    hazardId: h.hazardNumber || h._id,
                    description: h.description,
                    severity: h.severity,
                    category: h.category,
                    location: h.location,
                    identifiedDate: h.identifiedDate,
                    dateReported: h.identifiedDate,
                    controlMeasures: h.controlMeasures,
                    riskRating: h.riskRating,
                    status: h.status,
                    assignedTo: h.assignedTo,
                    dueDate: h.dueDate,
                    resolvedDate: h.resolvedDate,
                    inspectionId: h.inspectionId,
                    notes: h.notes,
                    // Calculate risk level from severity if not provided
                    riskLevel: h.severity === 'critical' ? 'Critical' : 
                               h.severity === 'high' ? 'High' : 
                               h.severity === 'medium' ? 'Medium' : 'Low',
                    riskScore: h.severity === 'critical' ? 20 : 
                               h.severity === 'high' ? 15 : 
                               h.severity === 'medium' ? 10 : 5,
                    likelihood: h.severity === 'critical' ? 5 : 
                                 h.severity === 'high' ? 4 : 
                                 h.severity === 'medium' ? 3 : 2,
                    reporter: h.createdBy?.name || 'Unknown',
                    type: h.category || 'General Hazard'
                }));
                setHazards(mappedHazards);
            } else {
                if (response?.success && !Array.isArray(response.data)) {
                    console.error('Invalid response format:', response);
                    addNotification('error', 'Invalid data format received from server');
                } else {
                    addNotification('error', response?.message || 'Failed to fetch hazards');
                }
            }
        } catch (error: any) {
            addNotification('error', error?.message || 'Error fetching hazards');
        } finally {
            setLoading(false);
        }
    };

    const getRiskLevelColor = (level: string) => {
        switch (level) {
            case 'Critical': return 'bg-red-600 text-white';
            case 'High': return 'bg-red-500 text-white';
            case 'Medium': return 'bg-yellow-500 text-white';
            case 'Low': return 'bg-green-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': case 'resolved': case 'verified': return 'bg-green-100 text-green-800';
            case 'in-progress': case 'action-in-progress': return 'bg-blue-100 text-blue-800';
            case 'scheduled': case 'reported': case 'in-assessment': return 'bg-yellow-100 text-yellow-800';
            case 'overdue': case 'action-assigned': return 'bg-orange-100 text-orange-800';
            case 'follow-up-required': case 'pending': return 'bg-purple-100 text-purple-800';
            case 'coached': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredHazards = hazards.filter(hazard => {
        const matchesSearch = 
            (hazard.hazardId || hazard.hazardNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (hazard.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            hazard.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || hazard.status === filterStatus;
        const matchesRisk = filterRiskLevel === 'all' || hazard.riskLevel === filterRiskLevel;
        
        return matchesSearch && matchesStatus && matchesRisk;
    });

    const renderHazardReporting = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-start">
                    <FaShieldAlt className="text-blue-500 text-xl mt-1 mr-3" />
                    <div>
                        <h3 className="font-bold text-blue-900">Federal Requirement - COHSR Part XIX</h3>
                        <p className="text-sm text-blue-800 mt-1">Employers must identify and control workplace hazards through documented risk assessments and corrective actions. All hazards must be tracked until verified as resolved.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg">
                        <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Hazard ID, Type, or Description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    fetchHazards();
                                }
                            }}
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
                            <option value="reported">Reported</option>
                            <option value="in-assessment">In Assessment</option>
                            <option value="action-assigned">Action Assigned</option>
                            <option value="action-in-progress">Action In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="verified">Verified</option>
                        </select>
                        <select
                            value={filterRiskLevel}
                            onChange={(e) => setFilterRiskLevel(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Risk Levels</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-md border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600 uppercase">Critical/High Risk</p>
                            <p className="text-3xl font-bold text-red-800 mt-2">
                                {hazards.filter(h => {
                                    const severity = (h.severity || '').toLowerCase();
                                    const riskLevel = (h.riskLevel || '').toLowerCase();
                                    return severity === 'critical' || severity === 'high' || 
                                           riskLevel === 'critical' || riskLevel === 'high';
                                }).length}
                            </p>
                        </div>
                        <FaExclamationTriangle className="text-4xl text-red-500 opacity-30" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-yellow-600 uppercase">Awaiting Assessment</p>
                            <p className="text-3xl font-bold text-yellow-800 mt-2">
                                {hazards.filter(h => {
                                    const status = (h.status || '').toLowerCase();
                                    return status === 'identified' || status === 'assessed';
                                }).length}
                            </p>
                        </div>
                        <FaChartLine className="text-4xl text-yellow-500 opacity-30" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-md border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-600 uppercase">In Progress</p>
                            <p className="text-3xl font-bold text-orange-800 mt-2">
                                {hazards.filter(h => {
                                    const status = (h.status || '').toLowerCase();
                                    return status === 'controlled' || status === 'monitored';
                                }).length}
                            </p>
                        </div>
                        <FaCogs className="text-4xl text-orange-500 opacity-30" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600 uppercase">Resolved</p>
                            <p className="text-3xl font-bold text-green-800 mt-2">
                                {hazards.filter(h => {
                                    const status = (h.status || '').toLowerCase();
                                    return status === 'resolved';
                                }).length}
                            </p>
                        </div>
                        <FaCheckCircle className="text-4xl text-green-500 opacity-30" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Hazard Registry & Risk Assessments</h3>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
                                setEditingHazard(null);
                                setNewHazard({ type: '', description: '', location: '', reporter: '', likelihood: 3, severity: 3 });
                                setSidebarType('hazard');
                                setShowSidebar(true);
                            }}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                        >
                            <FaPlus /> Report New Hazard
                        </button>
                        <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center gap-2">
                            <FaDownload /> Export Report
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hazard ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type & Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Matrix</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Corrective Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : filteredHazards.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No hazards found matching your filters.</td>
                                </tr>
                            ) : (
                                filteredHazards.map((hazard) => (
                                    <tr key={hazard._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{hazard.hazardId}</div>
                                            <div className="text-xs text-gray-500">{new Date(hazard.dateReported).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">{hazard.category || hazard.type || 'General Hazard'}</div>
                                            <div className="text-xs text-gray-600 mt-1">{hazard.description}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Reporter: {hazard.reporter || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{hazard.location}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col items-start gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-center bg-gray-50 px-3 py-2 rounded-lg">
                                                        <div className="text-xs text-gray-500 mb-1">Risk Score</div>
                                                        <div className="text-2xl font-bold text-gray-900">{hazard.riskScore}</div>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <div>Likelihood: <span className="font-semibold">{hazard.likelihood}/5</span></div>
                                                        <div>Severity: <span className="font-semibold">{hazard.severity}/5</span></div>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getRiskLevelColor(hazard.riskLevel)}`}>
                                                    {hazard.riskLevel.toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {hazard.correctiveAction ? (
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900">{hazard.correctiveAction.description}</div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        Assigned: {hazard.correctiveAction.assignedTo}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Due: {new Date(hazard.correctiveAction.dueDate).toLocaleDateString()}
                                                    </div>
                                                    {hazard.correctiveAction.completionDate && (
                                                        <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                            <FaCheckCircle /> Completed: {new Date(hazard.correctiveAction.completionDate).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-orange-600 font-medium">⚠ Pending Assignment</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(hazard.status)}`}>
                                                {hazard.status.replace('-', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                                                    title="View Details"
                                                    onClick={() => setSelectedHazard(hazard)}
                                                >
                                                    <FaEye />
                                                </button>
                                                <button 
                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition" 
                                                    title="Edit"
                                                    onClick={() => {
                                                        setEditingHazard(hazard);
                                                        setSidebarType('hazard');
                                                        setShowSidebar(true);
                                                    }}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button 
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" 
                                                    title="Delete"
                                                    onClick={() => handleDeleteHazard(hazard._id)}
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
        </div>
    );

    const renderDriverObservations = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Driver Observations</h3>
                    <button 
                        onClick={() => {
                            setSidebarType('observation');
                            setShowSidebar(true);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                    >
                        <FaPlus /> New Observation
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observation ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && observations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : observations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No observations found.</td>
                                </tr>
                            ) : (
                                observations.map((observation) => (
                                    <tr key={observation._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{observation.observationId}</div>
                                            <div className="text-xs text-gray-500">{new Date(observation.date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{observation.driver}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{observation.observer}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{observation.observationType.replace('-', ' ')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                                                observation.score >= 90 ? 'bg-green-100 text-green-800' :
                                                observation.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {observation.score}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(observation.status)}`}>
                                                {observation.status.replace('-', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                                                    title="View Details"
                                                    onClick={() => setSelectedHazard(observation as any)}
                                                >
                                                    <FaEye />
                                                </button>
                                                <button 
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" 
                                                    title="Delete"
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this observation?')) {
                                                            const updated = observations.filter(o => o._id !== observation._id);
                                                            setObservations(updated);
                                                            localStorage.setItem('driverObservations', JSON.stringify(updated));
                                                            addNotification('success', 'Observation deleted successfully');
                                                        }
                                                    }}
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
        </div>
    );

    const renderTruckingHazards = () => {
        const filteredTruckingHazards = truckingHazards.filter(hazard => {
            const matchesSearch = 
                hazard.hazardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hazard.truckingType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hazard.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === 'all' || hazard.status === filterStatus;
            
            return matchesSearch && matchesStatus;
        });

        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">Trucking-Specific Hazards</h3>
                        <button 
                            onClick={() => {
                                setEditingHazard(null);
                                setNewTruckingHazard({ truckingType: '', description: '', location: '', reporter: '', severity: 'Medium' });
                                setSidebarType('trucking-hazard');
                                setShowSidebar(true);
                            }}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                        >
                            <FaPlus /> Report Hazard
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hazard ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading && filteredTruckingHazards.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                    </tr>
                                ) : filteredTruckingHazards.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No trucking hazards found.</td>
                                    </tr>
                                ) : (
                                    filteredTruckingHazards.map((hazard) => (
                                    <tr key={hazard._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{hazard.hazardId}</div>
                                            <div className="text-xs text-gray-500">{new Date(hazard.dateReported).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{hazard.truckingType}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{hazard.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{hazard.location}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getRiskLevelColor(hazard.severity)}`}>
                                                {hazard.severity.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{hazard.assignedTo || 'Unassigned'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(hazard.status)}`}>
                                                {hazard.status.replace('-', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                                                    title="View Details"
                                                    onClick={() => setSelectedHazard(hazard as any)}
                                                >
                                                    <FaEye />
                                                </button>
                                                <button 
                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition" 
                                                    title="Edit"
                                                    onClick={() => {
                                                        setNewTruckingHazard({
                                                            truckingType: hazard.truckingType,
                                                            description: hazard.description,
                                                            location: hazard.location,
                                                            reporter: hazard.reporter,
                                                            severity: hazard.severity
                                                        });
                                                        setEditingHazard(hazard as any);
                                                        setSidebarType('trucking-hazard');
                                                        setShowSidebar(true);
                                                    }}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button 
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" 
                                                    title="Delete"
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this trucking hazard?')) {
                                                            const updated = truckingHazards.filter(h => h._id !== hazard._id);
                                                            setTruckingHazards(updated);
                                                            localStorage.setItem('truckingHazards', JSON.stringify(updated));
                                                            addNotification('success', 'Trucking hazard deleted successfully');
                                                        }
                                                    }}
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
            </div>
        );
    };

    // Inspections are now managed in the dedicated SafetyInspections module

    const handleSaveHazard = async () => {
        if (!newHazard.description || !newHazard.location || !newHazard.reporter) {
            addNotification('error', 'Please fill in all required fields');
            return;
        }

        try {
            // Map frontend fields to backend API format
            const severityMap: { [key: number]: string } = {
                1: 'low',
                2: 'low',
                3: 'medium',
                4: 'high',
                5: 'critical'
            };

            const payload = {
                description: newHazard.description,
                severity: severityMap[newHazard.severity] || 'medium',
                category: newHazard.type || '',
                location: newHazard.location,
                identifiedDate: new Date().toISOString(),
                status: 'identified',
                notes: `Reported by: ${newHazard.reporter}`
            };

            const response = await createHazard(payload);
            
            if (response?.success) {
                addNotification('success', 'Hazard created successfully');
                setNewHazard({ type: '', description: '', location: '', reporter: '', likelihood: 3, severity: 3 });
                setShowSidebar(false);
                setSidebarType(null);
                // Fetch all hazards after creation (don't apply filters)
                await fetchHazards(false);
            } else {
                addNotification('error', response?.message || 'Failed to create hazard');
            }
        } catch (error: any) {
            addNotification('error', error?.message || 'Error creating hazard');
        }
    };

    const handleUpdateHazard = async (hazardId: string, updateData: any) => {
        try {
            const response = await updateHazard(hazardId, updateData);
            if (response?.success) {
                addNotification('success', 'Hazard updated successfully');
                setEditingHazard(null);
                // Fetch all hazards after update (don't apply filters)
                await fetchHazards(false);
            } else {
                addNotification('error', response?.message || 'Failed to update hazard');
            }
        } catch (error: any) {
            addNotification('error', error?.message || 'Error updating hazard');
        }
    };

    const handleDeleteHazard = async (hazardId: string) => {
        if (!window.confirm('Are you sure you want to delete this hazard?')) {
            return;
        }

        try {
            const response = await deleteHazard(hazardId);
            if (response?.success) {
                addNotification('success', 'Hazard deleted successfully');
                // Fetch all hazards after delete (don't apply filters)
                await fetchHazards(false);
            } else {
                addNotification('error', response?.message || 'Failed to delete hazard');
            }
        } catch (error: any) {
            addNotification('error', error?.message || 'Error deleting hazard');
        }
    };

    // Inspection handling removed - redirects to SafetyInspections module

    const handleSaveObservation = () => {
        if (!newObservation.driver || !newObservation.observer) {
            addNotification('error', 'Please fill in all required fields');
            return;
        }

        const passedChecks = Object.values(newObservation.checklist).filter(Boolean).length;
        const score = Math.round((passedChecks / 6) * 100);
        const year = new Date().getFullYear();
        
        const observation: DriverObservation = {
            _id: `OBS-${Date.now()}`,
            observationId: `OBS-${year}-${String(observations.length + 1).padStart(3, '0')}`,
            date: newObservation.date,
            driver: newObservation.driver,
            observer: newObservation.observer,
            observationType: newObservation.observationType,
            checklist: newObservation.checklist,
            score,
            coachingNotes: newObservation.coachingNotes,
            status: score === 100 ? 'completed' : 'coached',
        };
        
        const updatedObservations = [...observations, observation];
        setObservations(updatedObservations);
        localStorage.setItem('driverObservations', JSON.stringify(updatedObservations));
        
        addNotification('success', 'Driver observation saved successfully');
        
        setNewObservation({
            driver: '',
            observer: '',
            observationType: 'on-road',
            date: new Date().toISOString().split('T')[0],
            checklist: {
                seatbeltUse: true,
                distraction: false,
                speedCompliance: true,
                ppeUse: true,
                signalUse: true,
                blindSpotCheck: true,
            },
            coachingNotes: '',
        });
        setShowSidebar(false);
        setSidebarType(null);
    };

    const handleSaveTruckingHazard = () => {
        if (!newTruckingHazard.truckingType || !newTruckingHazard.description || !newTruckingHazard.location || !newTruckingHazard.reporter) {
            addNotification('error', 'Please fill in all required fields');
            return;
        }

        const year = new Date().getFullYear();
        const hazard: TruckingHazard = {
            _id: `TH-${Date.now()}`,
            hazardId: `TH-${year}-${String(truckingHazards.length + 1).padStart(3, '0')}`,
            dateReported: new Date().toISOString().split('T')[0],
            reporter: newTruckingHazard.reporter,
            truckingType: newTruckingHazard.truckingType as TruckingHazard['truckingType'],
            description: newTruckingHazard.description,
            location: newTruckingHazard.location,
            severity: newTruckingHazard.severity,
            status: 'reported',
        };
        
        const updatedTruckingHazards = [...truckingHazards, hazard];
        setTruckingHazards(updatedTruckingHazards);
        localStorage.setItem('truckingHazards', JSON.stringify(updatedTruckingHazards));
        
        addNotification('success', 'Trucking hazard saved successfully');
        
        setNewTruckingHazard({ truckingType: '', description: '', location: '', reporter: '', severity: 'Medium' });
        setShowSidebar(false);
        setSidebarType(null);
    };

    const calculateRiskLevel = (likelihood: number, severity: number): string => {
        const score = likelihood * severity;
        if (score >= 15) return 'Critical';
        if (score >= 10) return 'High';
        if (score >= 5) return 'Medium';
        return 'Low';
    };

    const renderSidebar = () => {
        if (!showSidebar || !sidebarType) return null;

        return (
            <>
                <div 
                    className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40"
                    onClick={() => {
                        setShowSidebar(false);
                        setSidebarType(null);
                        setEditingHazard(null);
                        setNewHazard({ type: '', description: '', location: '', reporter: '', likelihood: 3, severity: 3 });
                    }}
                />
                <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {sidebarType === 'hazard' && 'Report New Hazard'}
                            {sidebarType === 'observation' && 'New Driver Observation'}
                            {sidebarType === 'trucking-hazard' && 'Report Trucking Hazard'}
                        </h2>
                        <button 
                            onClick={() => {
                                setShowSidebar(false);
                                setSidebarType(null);
                                setEditingHazard(null);
                                setNewHazard({ type: '', description: '', location: '', reporter: '', likelihood: 3, severity: 3 });
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
                        >
                            <FaTimes className="text-xl" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {sidebarType === 'hazard' && (
                            <div className="space-y-4">
                                {editingHazard && (
                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                        <p className="text-sm text-blue-800 font-medium">Editing: {editingHazard.hazardNumber || editingHazard.hazardId}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hazard Type *</label>
                                    <select
                                        value={editingHazard ? (editingHazard.category || editingHazard.type || '') : newHazard.type}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...editingHazard, category: e.target.value, type: e.target.value });
                                            } else {
                                                setNewHazard({ ...newHazard, type: e.target.value });
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Unsafe Equipment">Unsafe Equipment</option>
                                        <option value="Weather Hazards">Weather Hazards</option>
                                        <option value="Fatigue Indicators">Fatigue Indicators</option>
                                        <option value="Load Securement Issues">Load Securement Issues</option>
                                        <option value="Yard Hazards">Yard Hazards</option>
                                        <option value="Ergonomic Risks">Ergonomic Risks</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                    <textarea
                                        value={editingHazard ? editingHazard.description : newHazard.description}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...editingHazard, description: e.target.value });
                                            } else {
                                                setNewHazard({ ...newHazard, description: e.target.value });
                                            }
                                        }}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Describe the hazard..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                                    <input
                                        type="text"
                                        value={editingHazard ? editingHazard.location : newHazard.location}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...editingHazard, location: e.target.value });
                                            } else {
                                                setNewHazard({ ...newHazard, location: e.target.value });
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Enter location"
                                    />
                                </div>
                                {!editingHazard && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reporter *</label>
                                        <input
                                            type="text"
                                            value={newHazard.reporter}
                                            onChange={(e) => setNewHazard({ ...newHazard, reporter: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="Your name"
                                        />
                                    </div>
                                )}
                                {!editingHazard && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Likelihood (1-5) *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={newHazard.likelihood}
                                                    onChange={(e) => setNewHazard({ ...newHazard, likelihood: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Severity (1-5) *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={newHazard.severity}
                                                    onChange={(e) => setNewHazard({ ...newHazard, severity: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                            <p className="text-sm text-blue-800">
                                                <strong>Risk Score:</strong> {newHazard.likelihood * newHazard.severity} 
                                                <span className="ml-2">({calculateRiskLevel(newHazard.likelihood, newHazard.severity)} Risk)</span>
                                            </p>
                                        </div>
                                    </>
                                )}
                                {editingHazard && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            value={editingHazard.status}
                                            onChange={(e) => setEditingHazard({ ...editingHazard, status: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="identified">Identified</option>
                                            <option value="assessed">Assessed</option>
                                            <option value="controlled">Controlled</option>
                                            <option value="monitored">Monitored</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={editingHazard ? () => {
                                            // Map severity to backend format
                                            const severityMap: { [key: string]: string } = {
                                                'Low': 'low',
                                                'low': 'low',
                                                'Medium': 'medium',
                                                'medium': 'medium',
                                                'High': 'high',
                                                'high': 'high',
                                                'Critical': 'critical',
                                                'critical': 'critical'
                                            };
                                            
                                            handleUpdateHazard(editingHazard._id, {
                                                description: editingHazard.description,
                                                location: editingHazard.location,
                                                category: editingHazard.category || editingHazard.type || '',
                                                status: editingHazard.status,
                                                severity: severityMap[editingHazard.severity] || editingHazard.severity.toLowerCase()
                                            });
                                            setEditingHazard(null);
                                            setShowSidebar(false);
                                            setSidebarType(null);
                                        } : handleSaveHazard}
                                        disabled={editingHazard ? !editingHazard.description || !editingHazard.location : (!newHazard.type || !newHazard.description || !newHazard.location || !newHazard.reporter)}
                                        className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FaSave /> {editingHazard ? 'Update Hazard' : 'Save Hazard Report'}
                                    </button>
                                    {editingHazard && (
                                        <button
                                            onClick={() => {
                                                setEditingHazard(null);
                                                setShowSidebar(false);
                                                setSidebarType(null);
                                            }}
                                            className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Inspection form removed - redirects to SafetyInspections module */}

                        {sidebarType === 'observation' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Driver *</label>
                                        <input
                                            type="text"
                                            value={newObservation.driver}
                                            onChange={(e) => setNewObservation({ ...newObservation, driver: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Driver name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Observer *</label>
                                        <input
                                            type="text"
                                            value={newObservation.observer}
                                            onChange={(e) => setNewObservation({ ...newObservation, observer: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Observer name"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Observation Type *</label>
                                        <select
                                            value={newObservation.observationType}
                                            onChange={(e) => setNewObservation({ ...newObservation, observationType: e.target.value as 'on-road' | 'yard-driving' })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="on-road">On-Road</option>
                                            <option value="yard-driving">Yard Driving</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                                        <input
                                            type="date"
                                            value={newObservation.date}
                                            onChange={(e) => setNewObservation({ ...newObservation, date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 mb-3">Safety Checklist</label>
                                    <div className="space-y-2">
                                        {Object.entries(newObservation.checklist).map(([key, value]) => (
                                            <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => setNewObservation({
                                                        ...newObservation,
                                                        checklist: { ...newObservation.checklist, [key]: e.target.checked }
                                                    })}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Coaching Notes</label>
                                    <textarea
                                        value={newObservation.coachingNotes}
                                        onChange={(e) => setNewObservation({ ...newObservation, coachingNotes: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Add coaching notes or feedback..."
                                    />
                                </div>
                                <button
                                    onClick={handleSaveObservation}
                                    disabled={!newObservation.driver || !newObservation.observer}
                                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaSave /> Save Observation
                                </button>
                            </div>
                        )}

                        {sidebarType === 'trucking-hazard' && (
                            <div className="space-y-4">
                                {editingHazard && (
                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                        <p className="text-sm text-blue-800 font-medium">Editing: {(editingHazard as any).hazardId}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trucking Hazard Type *</label>
                                    <select
                                        value={editingHazard ? ((editingHazard as any).truckingType || newTruckingHazard.truckingType) : newTruckingHazard.truckingType}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...editingHazard, truckingType: e.target.value } as any);
                                            } else {
                                                setNewTruckingHazard({ ...newTruckingHazard, truckingType: e.target.value });
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Load Securement">Load Securement</option>
                                        <option value="Reefer Food Safety">Reefer Food Safety</option>
                                        <option value="Snow/Ice Removal">Snow/Ice Removal</option>
                                        <option value="Tire Chain Safety">Tire Chain Safety</option>
                                        <option value="Fueling/DEF Spill">Fueling/DEF Spill</option>
                                        <option value="DG Spill">DG Spill</option>
                                        <option value="Winter Hazard">Winter Hazard</option>
                                        <option value="Ergonomics (Tarping/Dolly)">Ergonomics (Tarping/Dolly)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                    <textarea
                                        value={editingHazard ? ((editingHazard as any).description || newTruckingHazard.description) : newTruckingHazard.description}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...editingHazard, description: e.target.value } as any);
                                            } else {
                                                setNewTruckingHazard({ ...newTruckingHazard, description: e.target.value });
                                            }
                                        }}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Describe the hazard..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                                    <input
                                        type="text"
                                        value={editingHazard ? ((editingHazard as any).location || newTruckingHazard.location) : newTruckingHazard.location}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...editingHazard, location: e.target.value } as any);
                                            } else {
                                                setNewTruckingHazard({ ...newTruckingHazard, location: e.target.value });
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Enter location"
                                    />
                                </div>
                                {!editingHazard && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reporter *</label>
                                        <input
                                            type="text"
                                            value={newTruckingHazard.reporter}
                                            onChange={(e) => setNewTruckingHazard({ ...newTruckingHazard, reporter: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="Your name"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Severity *</label>
                                    <select
                                        value={editingHazard ? ((editingHazard as any).severity || newTruckingHazard.severity) : newTruckingHazard.severity}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...editingHazard, severity: e.target.value } as any);
                                            } else {
                                                setNewTruckingHazard({ ...newTruckingHazard, severity: e.target.value as 'Low' | 'Medium' | 'High' | 'Critical' });
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={editingHazard ? () => {
                                            const updated = truckingHazards.map(h => 
                                                h._id === (editingHazard as any)._id 
                                                    ? { ...h, ...editingHazard } as TruckingHazard
                                                    : h
                                            );
                                            setTruckingHazards(updated);
                                            localStorage.setItem('truckingHazards', JSON.stringify(updated));
                                            addNotification('success', 'Trucking hazard updated successfully');
                                            setEditingHazard(null);
                                            setNewTruckingHazard({ truckingType: '', description: '', location: '', reporter: '', severity: 'Medium' });
                                            setShowSidebar(false);
                                            setSidebarType(null);
                                        } : handleSaveTruckingHazard}
                                        disabled={editingHazard ? (!(editingHazard as any).truckingType || !(editingHazard as any).description || !(editingHazard as any).location) : (!newTruckingHazard.truckingType || !newTruckingHazard.description || !newTruckingHazard.location || !newTruckingHazard.reporter)}
                                        className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FaSave /> {editingHazard ? 'Update Trucking Hazard' : 'Save Trucking Hazard'}
                                    </button>
                                    {editingHazard && (
                                        <button
                                            onClick={() => {
                                                setEditingHazard(null);
                                                setNewTruckingHazard({ truckingType: '', description: '', location: '', reporter: '', severity: 'Medium' });
                                                setShowSidebar(false);
                                                setSidebarType(null);
                                            }}
                                            className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    };

    const renderHazardDetailModal = () => {
        if (!selectedHazard) return null;

        return (
            <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">Hazard Details: {selectedHazard.hazardId}</h2>
                        <button 
                            onClick={() => setSelectedHazard(null)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
                        >
                            <FaTimesCircle className="text-xl" />
                        </button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Hazard ID</label>
                                <p className="text-lg font-bold text-gray-900">{selectedHazard.hazardId}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Date Reported</label>
                                <p className="text-lg text-gray-900">{new Date(selectedHazard.dateReported).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Type</label>
                                <p className="text-lg text-gray-900">{selectedHazard.type}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Reporter</label>
                                <p className="text-lg text-gray-900">{selectedHazard.reporter}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Location</label>
                                <p className="text-lg text-gray-900">{selectedHazard.location}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Status</label>
                                <span className={`mt-1 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(selectedHazard.status)}`}>
                                    {selectedHazard.status.replace('-', ' ').toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Description</label>
                            <p className="mt-1 text-gray-900">{selectedHazard.description}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="text-sm font-medium text-gray-500">Likelihood</label>
                                <p className="text-2xl font-bold text-gray-900">{selectedHazard.likelihood}/5</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="text-sm font-medium text-gray-500">Severity</label>
                                <p className="text-2xl font-bold text-gray-900">{selectedHazard.severity}/5</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="text-sm font-medium text-gray-500">Risk Score</label>
                                <p className="text-2xl font-bold text-gray-900">{selectedHazard.riskScore}</p>
                                <span className={`mt-2 px-2 py-1 inline-flex text-xs font-bold rounded-full ${getRiskLevelColor(selectedHazard.riskLevel)}`}>
                                    {selectedHazard.riskLevel.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        {selectedHazard.correctiveAction && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                                <h3 className="font-bold text-blue-900 mb-2">Corrective Action</h3>
                                <p className="text-sm text-blue-800">{selectedHazard.correctiveAction.description}</p>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p><strong>Assigned To:</strong> {selectedHazard.correctiveAction.assignedTo}</p>
                                    <p><strong>Due Date:</strong> {new Date(selectedHazard.correctiveAction.dueDate).toLocaleDateString()}</p>
                                    {selectedHazard.correctiveAction.completionDate && (
                                        <p className="text-green-700"><strong>Completed:</strong> {new Date(selectedHazard.correctiveAction.completionDate).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        {selectedHazard.rootCauseAnalysis && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Root Cause Analysis</label>
                                <p className="mt-1 text-gray-900">{selectedHazard.rootCauseAnalysis}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Inspections & Hazards</h1>
                <p className="text-gray-600">Manage safety inspections, hazard reporting, and driver observations</p>
            </div>

        

            {(
                <div>
                    <div className="bg-white rounded-xl shadow-lg mb-6">
                        <div className="border-b border-gray-200">
                            <div className="flex">
                                <button
                                    onClick={() => setHazardSubTab('reporting')}
                                    className={`px-6 py-3 font-semibold transition ${
                                        hazardSubTab === 'reporting'
                                            ? 'text-orange-600 border-b-2 border-orange-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Hazard Reporting
                                </button>
                                <button
                                    onClick={() => setHazardSubTab('observations')}
                                    className={`px-6 py-3 font-semibold transition ${
                                        hazardSubTab === 'observations'
                                            ? 'text-orange-600 border-b-2 border-orange-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Driver Observations
                                </button>
                                <button
                                    onClick={() => setHazardSubTab('trucking-specific')}
                                    className={`px-6 py-3 font-semibold transition ${
                                        hazardSubTab === 'trucking-specific'
                                            ? 'text-orange-600 border-b-2 border-orange-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Trucking-Specific Hazards
                                </button>
                            </div>
                        </div>
                    </div>

                    {hazardSubTab === 'reporting' && renderHazardReporting()}
                    {hazardSubTab === 'observations' && renderDriverObservations()}
                    {hazardSubTab === 'trucking-specific' && renderTruckingHazards()}
                </div>
            )}

            {renderHazardDetailModal()}
            {renderSidebar()}
            
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
        </div>
    );
};

export default HazardControl;
