import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaShieldAlt, 
    FaPlus, 
    FaEdit, 
    FaEye, 
    FaSearch,
    FaFilter,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle,
    FaClipboardCheck,
    FaChartLine,
    FaCogs,
    FaDownload,
    FaTimes,
    FaSave,
    FaArrowRight,
} from 'react-icons/fa';

// Inspection interface removed - inspections are now managed in SafetyInspections module

interface Hazard {
    _id: string;
    hazardId: string;
    dateReported: string;
    reporter: string;
    type: 'Unsafe Equipment' | 'Weather Hazards' | 'Fatigue Indicators' | 'Load Securement Issues' | 'Yard Hazards' | 'Ergonomic Risks';
    description: string;
    location: string;
    likelihood: 1 | 2 | 3 | 4 | 5;
    severity: 1 | 2 | 3 | 4 | 5;
    riskScore: number;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'reported' | 'in-assessment' | 'action-assigned' | 'action-in-progress' | 'resolved' | 'verified';
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

    useEffect(() => {
        setHazards([
            { 
                _id: 'H1', 
                hazardId: 'HAZ-2024-001', 
                dateReported: '2024-02-01', 
                reporter: 'Driver John Smith', 
                type: 'Unsafe Equipment',
                description: 'Forklift brakes showing reduced effectiveness',
                location: 'Warehouse Bay 3',
                likelihood: 4,
                severity: 4,
                riskScore: 16,
                riskLevel: 'High',
                status: 'action-assigned',
                correctiveAction: {
                    assignedTo: 'Maintenance Team',
                    description: 'Replace brake pads and inspect hydraulic system',
                    dueDate: '2024-02-15'
                },
                rootCauseAnalysis: 'Lack of preventive maintenance schedule'
            },
            { 
                _id: 'H2', 
                hazardId: 'HAZ-2024-002', 
                dateReported: '2024-02-10', 
                reporter: 'Safety Officer Jane Doe', 
                type: 'Yard Hazards',
                description: 'Ice buildup near loading dock entrance',
                location: 'Loading Dock A',
                likelihood: 3,
                severity: 3,
                riskScore: 9,
                riskLevel: 'Medium',
                status: 'resolved',
                correctiveAction: {
                    assignedTo: 'Yard Crew',
                    description: 'Apply salt and sand, install warning signs',
                    dueDate: '2024-02-11',
                    completionDate: '2024-02-11'
                }
            },
            {
                _id: 'H3',
                hazardId: 'HAZ-2024-003',
                dateReported: '2024-02-12',
                reporter: 'Driver Mike Wilson',
                type: 'Fatigue Indicators',
                description: 'Driver reported feeling drowsy after extended shift',
                location: 'Highway Route 401',
                likelihood: 3,
                severity: 5,
                riskScore: 15,
                riskLevel: 'High',
                status: 'in-assessment',
                rootCauseAnalysis: 'Pending investigation - possible inadequate rest breaks'
            }
        ]);

        setTruckingHazards([
            { 
                _id: 'TH1', 
                hazardId: 'TH-2024-001', 
                dateReported: '2024-02-05', 
                reporter: 'Driver Tom Anderson',
                truckingType: 'Load Securement', 
                description: 'Worn straps on Unit 42 - tension below spec',
                location: 'Unit 42',
                severity: 'High',
                status: 'action-assigned',
                assignedTo: 'Maintenance Supervisor',
                dueDate: '2024-02-07',
                correctiveActions: 'Replace all straps and inspect hardware'
            },
            { 
                _id: 'TH2', 
                hazardId: 'TH-2024-002', 
                dateReported: '2024-02-08', 
                reporter: 'Driver Lisa Chen',
                truckingType: 'Reefer Food Safety', 
                description: 'Temperature sensor malfunction on Trailer R-15',
                location: 'Trailer R-15',
                severity: 'Critical',
                status: 'resolved',
                assignedTo: 'Reefer Tech',
                dueDate: '2024-02-09',
                completionDate: '2024-02-09',
                correctiveActions: 'Sensor replaced and calibrated. Full temp log verified.'
            },
            {
                _id: 'TH3',
                hazardId: 'TH-2024-003',
                dateReported: '2024-02-10',
                reporter: 'Yard Supervisor Mark Davis',
                truckingType: 'Snow/Ice Removal',
                description: 'Inadequate salt supply during storm - yard unsafe',
                location: 'Main Yard',
                severity: 'High',
                status: 'in-progress',
                assignedTo: 'Yard Operations',
                dueDate: '2024-02-11',
                correctiveActions: 'Emergency salt delivery ordered. Backup supplier identified.'
            },
            {
                _id: 'TH4',
                hazardId: 'TH-2024-004',
                dateReported: '2024-02-12',
                reporter: 'Driver Robert Johnson',
                truckingType: 'Tire Chain Safety',
                description: 'Missing chain tensioners on Unit 28',
                location: 'Unit 28',
                severity: 'Medium',
                status: 'action-assigned',
                assignedTo: 'Fleet Maintenance',
                dueDate: '2024-02-14'
            },
            {
                _id: 'TH5',
                hazardId: 'TH-2024-005',
                dateReported: '2024-02-15',
                reporter: 'Fueling Attendant Sarah Miller',
                truckingType: 'Fueling/DEF Spill',
                description: 'DEF nozzle drip causing slip hazard at Pump 3',
                location: 'Fuel Island - Pump 3',
                severity: 'Medium',
                status: 'resolved',
                assignedTo: 'Facility Maintenance',
                dueDate: '2024-02-16',
                completionDate: '2024-02-15',
                correctiveActions: 'Nozzle replaced. Drip pan installed. Warning signs posted.'
            },
            {
                _id: 'TH6',
                hazardId: 'TH-2024-006',
                dateReported: '2024-02-18',
                reporter: 'Safety Officer Jane Doe',
                truckingType: 'DG Spill',
                description: 'Minor hydraulic fluid leak during DG loading',
                location: 'DG Loading Bay 2',
                severity: 'High',
                status: 'verified',
                assignedTo: 'DG Response Team',
                dueDate: '2024-02-18',
                completionDate: '2024-02-18',
                correctiveActions: 'Spill contained and cleaned per HAZMAT protocol. Equipment inspected.'
            },
            {
                _id: 'TH7',
                hazardId: 'TH-2024-007',
                dateReported: '2024-02-20',
                reporter: 'Driver Carlos Martinez',
                truckingType: 'Winter Hazard',
                description: 'Black ice on Route 17 exit ramp - multiple near-misses',
                location: 'Highway 17 Exit 42',
                severity: 'Critical',
                status: 'reported',
                correctiveActions: 'DOT notified. Drivers alerted via dispatch.'
            },
            {
                _id: 'TH8',
                hazardId: 'TH-2024-008',
                dateReported: '2024-02-22',
                reporter: 'Driver Amy Chen',
                truckingType: 'Ergonomics (Tarping/Dolly)',
                description: 'Tarp hooks causing hand strain - multiple driver complaints',
                location: 'Flatbed Operations',
                severity: 'Medium',
                status: 'action-assigned',
                assignedTo: 'Operations Manager',
                dueDate: '2024-03-01',
                correctiveActions: 'Evaluating ergonomic hook alternatives'
            }
        ]);

        setObservations([
            { 
                _id: 'O1', 
                observationId: 'OBS-2024-001', 
                date: '2024-02-15', 
                driver: 'Driver Carlos Martinez', 
                observer: 'Safety Manager Sarah Johnson', 
                observationType: 'on-road',
                checklist: {
                    seatbeltUse: true,
                    distraction: false,
                    speedCompliance: true,
                    ppeUse: true,
                    signalUse: true,
                    blindSpotCheck: true
                },
                score: 100,
                coachingNotes: 'Excellent adherence to all safety protocols',
                status: 'completed'
            },
            { 
                _id: 'O2', 
                observationId: 'OBS-2024-002', 
                date: '2024-02-20', 
                driver: 'Driver Amy Chen', 
                observer: 'Supervisor Tom Brown', 
                observationType: 'yard-driving',
                checklist: {
                    seatbeltUse: true,
                    distraction: true,
                    speedCompliance: true,
                    ppeUse: false,
                    signalUse: true,
                    blindSpotCheck: false
                },
                score: 50,
                coachingNotes: 'Discussed phone policy and PPE requirements. Schedule follow-up in 2 weeks.',
                status: 'follow-up-required',
                followUpDate: '2024-03-06'
            },
            {
                _id: 'O3',
                observationId: 'OBS-2024-003',
                date: '2024-02-22',
                driver: 'Driver Robert Johnson',
                observer: 'Safety Manager Sarah Johnson',
                observationType: 'on-road',
                checklist: {
                    seatbeltUse: true,
                    distraction: false,
                    speedCompliance: false,
                    ppeUse: true,
                    signalUse: true,
                    blindSpotCheck: true
                },
                score: 83,
                coachingNotes: 'Minor speed violation (5 over). Coaching provided on maintaining posted speeds.',
                status: 'coached'
            }
        ]);

        setLoading(false);
    }, []);


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
            hazard.hazardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hazard.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                                {hazards.filter(h => h.riskLevel === 'Critical' || h.riskLevel === 'High').length}
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
                                {hazards.filter(h => h.status === 'reported' || h.status === 'in-assessment').length}
                            </p>
                        </div>
                        <FaChartLine className="text-4xl text-yellow-500 opacity-30" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-md border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-600 uppercase">Corrective Actions</p>
                            <p className="text-3xl font-bold text-orange-800 mt-2">
                                {hazards.filter(h => h.status === 'action-assigned' || h.status === 'action-in-progress').length}
                            </p>
                        </div>
                        <FaCogs className="text-4xl text-orange-500 opacity-30" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600 uppercase">Resolved & Verified</p>
                            <p className="text-3xl font-bold text-green-800 mt-2">
                                {hazards.filter(h => h.status === 'resolved' || h.status === 'verified').length}
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
                                            <div className="text-sm font-semibold text-gray-900">{hazard.type}</div>
                                            <div className="text-xs text-gray-600 mt-1">{hazard.description}</div>
                                            <div className="text-xs text-gray-500 mt-1">Reporter: {hazard.reporter}</div>
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
                                                <button className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Assign CAPA">
                                                    <FaCogs />
                                                </button>
                                                {hazard.status === 'resolved' && (
                                                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Verify Resolution">
                                                        <FaCheckCircle />
                                                    </button>
                                                )}
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
                    <h3 className="text-lg font-bold text-gray-800">Driver Safety Observations</h3>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {observations.map((obs) => (
                                <tr key={obs._id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{obs.observationId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(obs.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{obs.driver}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{obs.observer}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {obs.observationType.replace('-', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-2xl font-bold text-gray-900">{obs.score}%</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(obs.status)}`}>
                                            {obs.status.replace('-', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
                                            <FaEye />
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
                                {filteredTruckingHazards.map((hazard) => (
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
                                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
                                                    <FaEye />
                                                </button>
                                                <button className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Edit">
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
            </div>
        );
    };

    // Inspections are now managed in the dedicated SafetyInspections module

    const handleSaveHazard = () => {
        const riskScore = newHazard.likelihood * newHazard.severity;
        const riskLevel = calculateRiskLevel(newHazard.likelihood, newHazard.severity);
        
        const hazard: Hazard = {
            _id: `H${hazards.length + 1}`,
            hazardId: `HAZ-2024-${String(hazards.length + 1).padStart(3, '0')}`,
            dateReported: new Date().toISOString().split('T')[0],
            reporter: newHazard.reporter,
            type: newHazard.type as Hazard['type'],
            description: newHazard.description,
            location: newHazard.location,
            likelihood: newHazard.likelihood as Hazard['likelihood'],
            severity: newHazard.severity as Hazard['severity'],
            riskScore,
            riskLevel: riskLevel as Hazard['riskLevel'],
            status: 'reported',
        };
        
        setHazards([...hazards, hazard]);
        setNewHazard({ type: '', description: '', location: '', reporter: '', likelihood: 3, severity: 3 });
        setShowSidebar(false);
        setSidebarType(null);
    };

    // Inspection handling removed - redirects to SafetyInspections module

    const handleSaveObservation = () => {
        const passedChecks = Object.values(newObservation.checklist).filter(Boolean).length;
        const score = Math.round((passedChecks / 6) * 100);
        
        const observation: DriverObservation = {
            _id: `O${observations.length + 1}`,
            observationId: `OBS-2024-${String(observations.length + 1).padStart(3, '0')}`,
            date: newObservation.date,
            driver: newObservation.driver,
            observer: newObservation.observer,
            observationType: newObservation.observationType,
            checklist: newObservation.checklist,
            score,
            coachingNotes: newObservation.coachingNotes,
            status: score === 100 ? 'completed' : 'coached',
        };
        
        setObservations([...observations, observation]);
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
        const hazard: TruckingHazard = {
            _id: `TH${truckingHazards.length + 1}`,
            hazardId: `TH-2024-${String(truckingHazards.length + 1).padStart(3, '0')}`,
            dateReported: new Date().toISOString().split('T')[0],
            reporter: newTruckingHazard.reporter,
            truckingType: newTruckingHazard.truckingType as TruckingHazard['truckingType'],
            description: newTruckingHazard.description,
            location: newTruckingHazard.location,
            severity: newTruckingHazard.severity,
            status: 'reported',
        };
        
        setTruckingHazards([...truckingHazards, hazard]);
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
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => {
                        setShowSidebar(false);
                        setSidebarType(null);
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
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
                        >
                            <FaTimes className="text-xl" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {sidebarType === 'hazard' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hazard Type *</label>
                                    <select
                                        value={newHazard.type}
                                        onChange={(e) => setNewHazard({ ...newHazard, type: e.target.value })}
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
                                        value={newHazard.description}
                                        onChange={(e) => setNewHazard({ ...newHazard, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Describe the hazard..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                                    <input
                                        type="text"
                                        value={newHazard.location}
                                        onChange={(e) => setNewHazard({ ...newHazard, location: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Enter location"
                                    />
                                </div>
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
                                <button
                                    onClick={handleSaveHazard}
                                    disabled={!newHazard.type || !newHazard.description || !newHazard.location || !newHazard.reporter}
                                    className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaSave /> Save Hazard Report
                                </button>
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trucking Hazard Type *</label>
                                    <select
                                        value={newTruckingHazard.truckingType}
                                        onChange={(e) => setNewTruckingHazard({ ...newTruckingHazard, truckingType: e.target.value })}
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
                                        value={newTruckingHazard.description}
                                        onChange={(e) => setNewTruckingHazard({ ...newTruckingHazard, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Describe the hazard..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                                    <input
                                        type="text"
                                        value={newTruckingHazard.location}
                                        onChange={(e) => setNewTruckingHazard({ ...newTruckingHazard, location: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Enter location"
                                    />
                                </div>
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Severity *</label>
                                    <select
                                        value={newTruckingHazard.severity}
                                        onChange={(e) => setNewTruckingHazard({ ...newTruckingHazard, severity: e.target.value as 'Low' | 'Medium' | 'High' | 'Critical' })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleSaveTruckingHazard}
                                    disabled={!newTruckingHazard.truckingType || !newTruckingHazard.description || !newTruckingHazard.location || !newTruckingHazard.reporter}
                                    className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaSave /> Save Trucking Hazard
                                </button>
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
        </div>
    );
};

export default HazardControl;