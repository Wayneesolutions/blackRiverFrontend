import { useState, useEffect } from 'react';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaEye,
    FaSearch,
    FaFilter,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle,
    FaTimes,
    FaInfoCircle,
    FaChartLine,
    FaCogs,
    FaDownload,
    FaChevronDown,
    FaSave
} from 'react-icons/fa';
import {
    createHazard,
    getHazards,
    updateHazard,
    deleteHazard
} from '../../../../axios/api/healthSafety';

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

const CUSTOM_COLORS = {
    background: '#EDF8FF',
    primary: '#016ab2',
    dark: '#063f6f',
    light: '#398bc3',
    gradient: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
    gradientVertical: 'linear-gradient(to bottom right, #016ab2, #063f6f)',
};

// InspectionsHazards component removed - replaced by HazardControl component below

const HazardControl = () => {
    // const navigate = useNavigate(); // Unused

    const [hazards, setHazards] = useState<Hazard[]>([]);
    const [truckingHazards, setTruckingHazards] = useState<TruckingHazard[]>([]);
    const [observations, setObservations] = useState<DriverObservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
    const [hazardSubTab, setHazardSubTab] = useState<'reporting' | 'observations' | 'trucking-specific'>('reporting');
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);
    const [editingHazard, setEditingHazard] = useState<Hazard | TruckingHazard | null>(null);

    const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarType, setSidebarType] = useState<'hazard' | 'observation' | 'trucking-hazard' | null>(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<'hazard' | 'observation' | 'trucking-hazard' | null>(null);

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
        <div className="space-y-4">
            {/* Stats Grid - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Critical Risks</p>
                        <h3 className="text-xl font-bold text-gray-800">
                            {hazards.filter(h => {
                                const severity = (h.severity || '').toLowerCase();
                                const riskLevel = (h.riskLevel || '').toLowerCase();
                                return severity === 'critical' || severity === 'high' ||
                                    riskLevel === 'critical' || riskLevel === 'high';
                            }).length}
                        </h3>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg text-red-600">
                        <FaExclamationTriangle size={16} />
                    </div>
                </div>

                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Assessment Pending</p>
                        <h3 className="text-xl font-bold text-gray-800">
                            {hazards.filter(h => {
                                const status = (h.status || '').toLowerCase();
                                return status === 'identified' || status === 'assessed';
                            }).length}
                        </h3>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded-lg text-yellow-600">
                        <FaChartLine size={16} />
                    </div>
                </div>

                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">In Progress</p>
                        <h3 className="text-xl font-bold text-gray-800">
                            {hazards.filter(h => {
                                const status = (h.status || '').toLowerCase();
                                return status === 'controlled' || status === 'monitored';
                            }).length}
                        </h3>
                    </div>
                    <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                        <FaCogs size={16} />
                    </div>
                </div>

                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Resolved</p>
                        <h3 className="text-xl font-bold text-gray-800">
                            {hazards.filter(h => {
                                const status = (h.status || '').toLowerCase();
                                return status === 'resolved';
                            }).length}
                        </h3>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg text-green-600">
                        <FaCheckCircle size={16} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative w-full md:w-96">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
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
                            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-8 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="reported">Reported</option>
                                <option value="in-assessment">In Assessment</option>
                                <option value="action-assigned">Action Assigned</option>
                                <option value="action-in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="verified">Verified</option>
                            </select>
                            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={10} />
                        </div>
                        <div className="relative flex-1 md:flex-none">
                            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                            <select
                                value={filterRiskLevel}
                                onChange={(e) => setFilterRiskLevel(e.target.value)}
                                className="w-full pl-8 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                            >
                                <option value="all">All Risk Levels</option>
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={10} />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="flex justify-between items-center px-1 mb-2">
                <h3 className="text-sm font-bold text-gray-700">Hazard Registry</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setEditingHazard(null);
                            setNewHazard({ type: '', description: '', location: '', reporter: '', likelihood: 3, severity: 3 });
                            setSidebarType('hazard');
                            setShowSidebar(true);
                        }}
                        className="px-3 py-1.5 !text-white rounded-lg text-xs font-bold hover:opacity-90 transition shadow-sm flex items-center gap-2"
                        style={{ background: CUSTOM_COLORS.primary }}
                    >
                        <FaPlus size={10} /> Report Hazard
                    </button>
                    <button className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition flex items-center gap-2 text-xs font-bold">
                        <FaDownload size={10} /> Export
                    </button>
                </div>
            </div>


            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hazard ID</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type & Description</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Risk Matrix</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Corrective Action</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-xs text-gray-500">Loading...</td>
                                </tr>
                            ) : filteredHazards.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-xs text-gray-500">No hazards found matching your filters.</td>
                                </tr>
                            ) : (
                                filteredHazards.map((hazard) => (
                                    <tr key={hazard._id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{hazard.hazardId}</div>
                                            <div className="text-[10px] text-gray-500">{hazard.dateReported ? new Date(hazard.dateReported).toLocaleDateString() : 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-semibold text-gray-900">{hazard.category || hazard.type || 'General Hazard'}</div>
                                            <div className="text-[10px] text-gray-600 mt-0.5 truncate max-w-[200px]" title={hazard.description}>{hazard.description}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">
                                                Reporter: {hazard.reporter || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">{hazard.location}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 flex flex-col items-center min-w-[30px]">
                                                    <span className="text-[8px] text-gray-400 uppercase">Score</span>
                                                    <span className="text-xs font-bold text-gray-900 leading-none">{hazard.riskScore}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold border rounded ${hazard.riskLevel === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    hazard.riskLevel === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        hazard.riskLevel === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                            'bg-green-50 text-green-600 border-green-100'
                                                    }`}>
                                                    {(hazard.riskLevel || '').toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {hazard.correctiveAction ? (
                                                <div className="text-[10px]">
                                                    <div className="font-medium text-gray-900 truncate max-w-[150px]" title={hazard.correctiveAction.description}>{hazard.correctiveAction.description}</div>
                                                    <div className="text-gray-500 mt-0.5">
                                                        Due: {new Date(hazard.correctiveAction.dueDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-orange-600 font-medium italic">Pending Assignment</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${hazard.status === 'resolved' ? 'bg-green-50 text-green-600 border-green-100' :
                                                hazard.status.includes('progress') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                {hazard.status.replace('-', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    className="p-1.5 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-100"
                                                    style={{ color: CUSTOM_COLORS.primary }}
                                                    title="View Details"
                                                    onClick={() => setSelectedHazard(hazard)}
                                                >
                                                    <FaEye size={12} />
                                                </button>
                                                <button
                                                    className="p-1.5 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-100"
                                                    style={{ color: CUSTOM_COLORS.primary }}
                                                    title="Edit"
                                                    onClick={() => {
                                                        setEditingHazard(hazard);
                                                        setSidebarType('hazard');
                                                        setShowSidebar(true);
                                                    }}
                                                >
                                                    <FaEdit size={12} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-100"
                                                    title="Delete"
                                                    onClick={() => handleDeleteHazard(hazard._id)}
                                                >
                                                    <FaTrash size={12} />
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
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-sm font-bold text-gray-700">Driver Observations</h3>
                    <button
                        onClick={() => {
                            setSidebarType('observation');
                            setShowSidebar(true);
                        }}
                        style={{ background: CUSTOM_COLORS.primary }}
                        className="px-3 py-1.5 !text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 text-xs font-bold shadow-sm"
                    >
                        <FaPlus size={10} /> New Observation
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Observation ID</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Driver</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Observer</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Score</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && observations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-xs text-gray-500">Loading...</td>
                                </tr>
                            ) : observations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-xs text-gray-500">No observations found.</td>
                                </tr>
                            ) : (
                                observations.map((observation) => (
                                    <tr key={observation._id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{observation.observationId}</div>
                                            <div className="text-[10px] text-gray-500">{new Date(observation.date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">{observation.driver}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">{observation.observer}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 capitalize">{observation.observationType.replace('-', ' ')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded border ${observation.score >= 90 ? 'bg-green-50 text-green-700 border-green-100' :
                                                observation.score >= 70 ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                    'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {observation.score}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded border bg-gray-50 text-gray-600 border-gray-100`}>
                                                {observation.status.replace('-', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    className="p-1.5 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-100"
                                                    style={{ color: CUSTOM_COLORS.primary }}
                                                    title="View Details"
                                                    onClick={() => setSelectedHazard(observation as any)}
                                                >
                                                    <FaEye size={12} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-100"
                                                    title="Delete"
                                                    onClick={() => {
                                                        setItemToDelete(observation._id);
                                                        setDeleteType('observation');
                                                        setShowDeleteModal(true);
                                                    }}
                                                >
                                                    <FaTrash size={12} />
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
            <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="text-sm font-bold text-gray-700">Trucking-Specific Hazards</h3>
                        <button
                            onClick={() => {
                                setEditingHazard(null);
                                setNewTruckingHazard({ truckingType: '', description: '', location: '', reporter: '', severity: 'Medium' });
                                setSidebarType('trucking-hazard');
                                setShowSidebar(true);
                            }}
                            className="px-3 py-1.5 !text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 text-xs font-bold shadow-sm"
                            style={{ background: CUSTOM_COLORS.primary }}
                        >
                            <FaPlus size={10} /> Report Hazard
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hazard ID</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Severity</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Assigned To</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading && filteredTruckingHazards.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-xs text-gray-500">Loading...</td>
                                    </tr>
                                ) : filteredTruckingHazards.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-xs text-gray-500">No trucking hazards found.</td>
                                    </tr>
                                ) : (
                                    filteredTruckingHazards.map((hazard) => (
                                        <tr key={hazard._id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{hazard.hazardId}</div>
                                                <div className="text-[10px] text-gray-500">{new Date(hazard.dateReported).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-900">{hazard.truckingType}</td>
                                            <td className="px-4 py-3 text-xs text-gray-700 truncate max-w-[200px]" title={hazard.description}>{hazard.description}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">{hazard.location}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded border ${hazard.severity === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    hazard.severity === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        hazard.severity === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                            'bg-green-50 text-green-600 border-green-100'
                                                    }`}>
                                                    {hazard.severity.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">{hazard.assignedTo || 'Unassigned'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(hazard.status)}`}>
                                                    {hazard.status.replace('-', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-100"
                                                        title="Edit"
                                                        onClick={() => {
                                                            setEditingHazard(hazard);
                                                            setNewTruckingHazard({ truckingType: '', description: '', location: '', reporter: '', severity: 'Medium' });
                                                            setSidebarType('trucking-hazard');
                                                            setShowSidebar(true);
                                                        }}
                                                    >
                                                        <FaEdit size={12} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-100"
                                                        title="Delete"
                                                        onClick={() => {
                                                            setItemToDelete(hazard._id);
                                                            setDeleteType('trucking-hazard');
                                                            setShowDeleteModal(true);
                                                        }}
                                                    >
                                                        <FaTrash size={12} />
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

    const handleDeleteHazard = (hazardId: string) => {
        setItemToDelete(hazardId);
        setDeleteType('hazard');
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete || !deleteType) return;

        if (deleteType === 'hazard') {
            try {
                const response = await deleteHazard(itemToDelete);
                if (response?.success) {
                    addNotification('success', 'Hazard deleted successfully');
                    await fetchHazards(false);
                } else {
                    addNotification('error', response?.message || 'Failed to delete hazard');
                }
            } catch (error: any) {
                addNotification('error', error?.message || 'Error deleting hazard');
            }
        } else if (deleteType === 'observation') {
            const updated = observations.filter(o => o._id !== itemToDelete);
            setObservations(updated);
            localStorage.setItem('driverObservations', JSON.stringify(updated));
            addNotification('success', 'Observation deleted successfully');
        } else if (deleteType === 'trucking-hazard') {
            const updated = truckingHazards.filter(h => h._id !== itemToDelete);
            setTruckingHazards(updated);
            localStorage.setItem('truckingHazards', JSON.stringify(updated));
            addNotification('success', 'Trucking hazard deleted successfully');
        }

        setShowDeleteModal(false);
        setItemToDelete(null);
        setDeleteType(null);
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
                                        <p className="text-sm text-blue-800 font-medium">Editing: {(editingHazard as Hazard).hazardNumber || (editingHazard as Hazard).hazardId}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hazard Type *</label>
                                    <select
                                        value={editingHazard ? ((editingHazard as Hazard).category || (editingHazard as Hazard).type || '') : newHazard.type}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...(editingHazard as Hazard), category: e.target.value, type: e.target.value as any });
                                            } else {
                                                setNewHazard({ ...newHazard, type: e.target.value as any });
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
                                        value={editingHazard ? (editingHazard as Hazard).description : newHazard.description}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...(editingHazard as Hazard), description: e.target.value });
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
                                        value={editingHazard ? (editingHazard as Hazard).location : newHazard.location}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...(editingHazard as Hazard), location: e.target.value });
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
                                                    onChange={(e) => setNewHazard({ ...newHazard, likelihood: parseInt(e.target.value) as any || 1 })}
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
                                                    onChange={(e) => setNewHazard({ ...newHazard, severity: parseInt(e.target.value) as any || 1 })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                            <p className="text-sm text-blue-800">
                                                <strong>Risk Score:</strong> {(newHazard.likelihood || 1) * (newHazard.severity || 1)}
                                                <span className="ml-2">({calculateRiskLevel(newHazard.likelihood || 1, newHazard.severity || 1)} Risk)</span>
                                            </p>
                                        </div>
                                    </>
                                )}
                                {editingHazard && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            value={(editingHazard as Hazard).status}
                                            onChange={(e) => setEditingHazard({ ...(editingHazard as Hazard), status: e.target.value as any })}
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

                                            const hazard = editingHazard as Hazard;

                                            handleUpdateHazard(hazard._id, {
                                                description: hazard.description,
                                                location: hazard.location,
                                                category: hazard.category || hazard.type || '',
                                                status: hazard.status,
                                                severity: severityMap[hazard.severity] || hazard.severity.toLowerCase()
                                            });
                                            setEditingHazard(null);
                                            setShowSidebar(false);
                                            setSidebarType(null);
                                        } : handleSaveHazard}
                                        disabled={editingHazard ? !(editingHazard as Hazard).description || !(editingHazard as Hazard).location : (!newHazard.type || !newHazard.description || !newHazard.location || !newHazard.reporter)}
                                        style={{
                                            background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)'
                                        }}
                                        className="flex-1 px-4 py-3  !text-white rounded-lg  transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                            className="px-4 py-3 bg-gray-500 !text-white rounded-lg hover:bg-gray-600 transition"
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
                                    style={{
                                        background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)'
                                    }}
                                    className="w-full px-4 py-3  !text-white rounded-lg  transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaSave /> Save Observation
                                </button>
                            </div>
                        )}

                        {sidebarType === 'trucking-hazard' && (
                            <div className="space-y-4">
                                {editingHazard && (
                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                        <p className="text-sm text-blue-800 font-medium">Editing: {(editingHazard as TruckingHazard).hazardId}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trucking Hazard Type *</label>
                                    <select
                                        value={editingHazard ? ((editingHazard as TruckingHazard).truckingType || newTruckingHazard.truckingType) : newTruckingHazard.truckingType}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...(editingHazard as TruckingHazard), truckingType: e.target.value as any });
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
                                        value={editingHazard ? ((editingHazard as TruckingHazard).description || newTruckingHazard.description) : newTruckingHazard.description}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...(editingHazard as TruckingHazard), description: e.target.value });
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
                                        value={editingHazard ? ((editingHazard as TruckingHazard).location || newTruckingHazard.location) : newTruckingHazard.location}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...(editingHazard as TruckingHazard), location: e.target.value });
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
                                        value={editingHazard ? ((editingHazard as TruckingHazard).severity || newTruckingHazard.severity) : newTruckingHazard.severity}
                                        onChange={(e) => {
                                            if (editingHazard) {
                                                setEditingHazard({ ...(editingHazard as TruckingHazard), severity: e.target.value as any });
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
                                            if (!editingHazard) return;
                                            const updated = truckingHazards.map(h =>
                                                h._id === (editingHazard as TruckingHazard)._id
                                                    ? { ...h, ...(editingHazard as TruckingHazard) }
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
                                        disabled={editingHazard ? (!(editingHazard as TruckingHazard).truckingType || !(editingHazard as TruckingHazard).description || !(editingHazard as TruckingHazard).location) : (!newTruckingHazard.truckingType || !newTruckingHazard.description || !newTruckingHazard.location || !newTruckingHazard.reporter)}
                                        className="flex-1 px-4 py-3  !text-white rounded-lg  transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)'
                                        }}
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
                                            className="px-4 py-3 bg-gray-500 !text-white rounded-lg hover:bg-gray-600 transition"
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
                                <p className="text-lg text-gray-900">{selectedHazard.dateReported ? new Date(selectedHazard.dateReported).toLocaleDateString() : 'N/A'}</p>
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
                                <span className={`mt-2 px-2 py-1 inline-flex text-xs font-bold rounded-full ${getRiskLevelColor(selectedHazard.riskLevel || '')}`}>
                                    {(selectedHazard.riskLevel || '').toUpperCase()}
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
        <div className="min-h-screen pb-10 flex flex-col relative" style={{ backgroundColor: CUSTOM_COLORS.background }}>


            <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-6 relative z-10">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-black mb-1">
                            Inspections & Hazards
                        </h1>
                        <p className="text-black text-xs font-medium opacity-90">Manage safety inspections, hazard reporting, and driver observations</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 min-h-[600px] p-2">
                    {/* Inner Content with Dispatch Feel */}
                    <div className="bg-gray-50/50 rounded-lg p-4">
                        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-lg shadow-sm px-2 py-1 gap-2">
                            <button
                                onClick={() => setHazardSubTab('reporting')}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all text-center ${hazardSubTab === 'reporting'
                                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                Hazard Reporting
                            </button>
                            <button
                                onClick={() => setHazardSubTab('observations')}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all text-center ${hazardSubTab === 'observations'
                                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                Driver Observations
                            </button>
                            <button
                                onClick={() => setHazardSubTab('trucking-specific')}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all text-center ${hazardSubTab === 'trucking-specific'
                                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                Trucking-Specific Hazards
                            </button>
                        </div>

                        {hazardSubTab === 'reporting' && renderHazardReporting()}
                        {hazardSubTab === 'observations' && renderDriverObservations()}
                        {hazardSubTab === 'trucking-specific' && renderTruckingHazards()}
                    </div>
                </div>
            </div>

            {renderHazardDetailModal()}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100 opacity-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <FaTrash className="text-red-600 text-xl" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Confirmation</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to delete this {deleteType === 'hazard' ? 'Hazard' : deleteType === 'observation' ? 'Observation' : 'Trucking Hazard'}? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 !text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
