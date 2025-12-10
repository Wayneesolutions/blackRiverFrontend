import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, hexToRgba, getStatusColor } from '../../../../theme/colors';
import { 
  FaFileContract, FaCheckCircle, FaExclamationTriangle, 
  FaClock, FaFileAlt, FaSearch, FaFilter, FaEye, FaDownload, 
  FaEdit, FaUserCheck, FaBookOpen, FaClipboardCheck,
  FaBell, FaExclamationCircle, FaChartLine, FaShieldAlt,
  FaArrowRight
} from 'react-icons/fa';


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

const EnhancedComplianceRecords: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCompliance, setFilterCompliance] = useState<string>('all');
  const [activeView, setActiveView] = useState<'all' | 'policies' | 'training' | 'incidents' | 'hazards' | 'inspections'>('all');
  
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

  useEffect(() => {
    // Fetch compliance records data - aggregated from all Health & Safety modules
    // This mirrors the Dashboard's data aggregation approach
    const fetchComplianceRecords = async () => {
      setLoading(true);
      try {
        // In production, this would fetch from APIs:
        // - Policies API: /api/health-safety/policies
        // - Training API: /api/health-safety/training
        // - Incidents API: /api/health-safety/incidents
        // - Hazards API: /api/health-safety/hazards
        // - Inspections API: /api/health-safety/inspections
        
        // For now, using mock data that simulates aggregated data from all modules
        // This data structure matches what would come from the Health & Safety Dashboard
    const mockPolicies: PolicyRecord[] = [
      {
        _id: 'P1',
        recordId: 'POL-2024-001',
        title: 'Occupational Health & Safety Policy',
        policyType: 'safety',
        specificPolicyName: 'Occupational Health & Safety Policy',
        category: 'Federal Compliance',
        status: 'active',
        issueDate: '2024-01-15',
        expiryDate: '2025-01-15',
        renewalCycle: 12,
        lastReviewed: '2024-11-01',
        nextReviewDate: '2025-01-01',
        responsiblePerson: 'Safety Manager',
        department: 'Safety',
        complianceLevel: 'compliant',
        assignedRoles: ['all'],
        acknowledgments: [
          { employeeId: 'E001', employeeName: 'John Driver', role: 'Driver', signedDate: '2024-01-20', version: '2.0' },
          { employeeId: 'E002', employeeName: 'Jane Mechanic', role: 'Mechanic', signedDate: '2024-01-18', version: '2.0' }
        ],
        versionHistory: [
          { version: '2.0', publishedDate: '2024-01-15', changes: 'Updated CLC 2021 requirements', documentUrl: '/docs/ohs-v2.pdf', publishedBy: 'Safety Manager' },
          { version: '1.0', publishedDate: '2023-01-15', changes: 'Initial version', documentUrl: '/docs/ohs-v1.pdf', publishedBy: 'Safety Manager' }
        ],
        currentVersion: '2.0',
        documentUrl: '/docs/ohs-v2.pdf',
        autoAssignOnHire: true,
        remindersSent: [{ date: '2024-10-15', type: '90day' }],
        linkedTraining: ['TRN-2024-001']
      },
      {
        _id: 'P2',
        recordId: 'POL-2024-015',
        title: 'Workplace Harassment & Violence Prevention Policy',
        policyType: 'hr',
        specificPolicyName: 'Workplace Harassment & Violence Prevention Policy',
        category: 'Federal Compliance',
        status: 'expiring',
        issueDate: '2022-03-01',
        expiryDate: '2025-03-01',
        renewalCycle: 36,
        lastReviewed: '2024-02-15',
        nextReviewDate: '2025-02-01',
        responsiblePerson: 'HR Manager',
        department: 'Human Resources',
        complianceLevel: 'at-risk',
        assignedRoles: ['all'],
        acknowledgments: [],
        versionHistory: [
          { version: '1.0', publishedDate: '2022-03-01', changes: 'CLC 2021 compliance', documentUrl: '/docs/harassment-v1.pdf', publishedBy: 'HR Manager' }
        ],
        currentVersion: '1.0',
        documentUrl: '/docs/harassment-v1.pdf',
        autoAssignOnHire: true,
        remindersSent: [{ date: '2024-12-01', type: '90day' }, { date: '2024-12-31', type: '60day' }]
      }
    ];

    const mockTraining: TrainingRecord[] = [
      {
        _id: 'T1',
        recordId: 'TRN-2024-128',
        title: 'WHMIS 2015 Certification',
        trainingType: 'WHMIS 2015',
        category: 'Federal Compliance',
        status: 'active',
        issueDate: '2024-03-15',
        expiryDate: '2026-03-15',
        certificateNumber: 'WHMIS-2024-128',
        certificateUrl: '/certs/whmis-128.pdf',
        instructor: 'Safety Training Inc.',
        employeeName: 'John Driver',
        employeeId: 'E001',
        department: 'Operations',
        validityPeriod: 24,
        automaticRenewalReminder: true,
        reminderDaysBefore: 60,
        complianceLevel: 'compliant'
      },
      {
        _id: 'T2',
        recordId: 'TRN-2023-045',
        title: 'TDG Transportation Certificate',
        trainingType: 'TDG (Transportation of Dangerous Goods)',
        category: 'Federal Compliance',
        status: 'expired',
        issueDate: '2022-12-01',
        expiryDate: '2024-12-01',
        certificateNumber: 'TDG-2022-045',
        certificateUrl: '/certs/tdg-045.pdf',
        instructor: 'TDG Training Corp',
        employeeName: 'Jane Driver',
        employeeId: 'E002',
        department: 'Operations',
        validityPeriod: 24,
        automaticRenewalReminder: true,
        reminderDaysBefore: 90,
        complianceLevel: 'non-compliant'
      }
    ];

    const mockIncidents: IncidentRecord[] = [
      {
        _id: 'I1',
        recordId: 'INC-2024-089',
        title: 'Slip and Fall - Warehouse',
        incidentType: 'workplace-incident',
        category: 'Internal Policy',
        status: 'investigating',
        incidentDate: '2024-12-05',
        reportedDate: '2024-12-05',
        location: 'Warehouse Bay 3',
        reportedBy: 'Supervisor Adams',
        involvedPersons: ['Employee John Doe'],
        witnesses: [
          { name: 'Jane Smith', statement: 'Saw employee slip on wet floor near loading dock.' }
        ],
        description: 'Employee slipped on wet floor, minor ankle sprain.',
        photosVideos: ['/evidence/inc-089-photo1.jpg', '/evidence/inc-089-photo2.jpg'],
        investigationMethod: '5-why',
        investigationNotes: 'Root cause: No wet floor signage after cleaning.',
        correctiveActions: ['Install permanent wet floor signs', 'Retrain cleaning staff'],
        wcbClaimNumber: 'WCB-2024-1234',
        wcbDocuments: ['/wcb/claim-1234.pdf'],
        severity: 'moderate',
        complianceLevel: 'at-risk'
      }
    ];

    const mockHazards: HazardRecord[] = [
      {
        _id: 'H1',
        recordId: 'HAZ-2024-034',
        title: 'Unsecured Load - Trailer 456',
        hazardType: 'Load Securement',
        category: 'Federal Compliance',
        status: 'mitigated',
        reportedDate: '2024-11-28',
        reportedBy: 'Driver Mike',
        location: 'Yard - Loading Dock 2',
        description: 'Load straps loose, risk of shifting cargo.',
        riskRating: { likelihood: 4, severity: 4, total: 16 },
        correctiveActions: ['Re-secured load', 'Driver retrained on securement'],
        assignedTo: 'Safety Manager',
        deadline: '2024-11-29',
        resolutionVerified: true,
        verificationDate: '2024-11-29',
        photos: ['/hazards/haz-034-before.jpg', '/hazards/haz-034-after.jpg'],
        complianceLevel: 'compliant'
      }
    ];

    const mockInspections: InspectionRecord[] = [
      {
        _id: 'INS1',
        recordId: 'INS-2024-089',
        title: 'Monthly Yard Safety Inspection',
        inspectionType: 'Yard Inspection',
        category: 'Internal Policy',
        status: 'completed',
        inspectionDate: '2024-12-01',
        inspector: 'Safety Inspector',
        location: 'Main Yard',
        checklist: [
          { item: 'Fire extinguishers accessible', status: 'pass' },
          { item: 'Emergency exits clear', status: 'pass' },
          { item: 'PPE available', status: 'fail', notes: 'Glove stock low', photo: '/inspect/gloves.jpg' }
        ],
        findingsCount: 1,
        correctiveActions: ['Restock PPE - gloves ordered'],
        photos: ['/inspections/yard-dec-2024.jpg'],
        nextInspectionDate: '2025-01-01',
        complianceLevel: 'at-risk'
      }
    ];

        const allRecords = [...mockPolicies, ...mockTraining, ...mockIncidents, ...mockHazards, ...mockInspections] as ComplianceRecord[];
        setRecords(allRecords);
        
        // Calculate statistics (similar to Dashboard stats calculation)
        const calculatedStats = {
          totalRecords: allRecords.length,
          policies: allRecords.filter(r => 'policyType' in r).length,
          training: allRecords.filter(r => 'trainingType' in r).length,
          incidents: allRecords.filter(r => 'incidentType' in r).length,
          hazards: allRecords.filter(r => 'hazardType' in r).length,
          inspections: allRecords.filter(r => 'inspectionType' in r).length,
          expiringRecords: allRecords.filter(r => r.status === 'expiring').length,
          expiredRecords: allRecords.filter(r => r.status === 'expired').length,
          compliantRecords: allRecords.filter(r => r.complianceLevel === 'compliant').length,
          atRiskRecords: allRecords.filter(r => r.complianceLevel === 'at-risk').length,
        };
        setStats(calculatedStats);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching compliance records:', error);
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
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.background.secondary }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold" style={{ color: COLORS.text.primary }}>
                Compliance Records Management
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Comprehensive view of all compliance records aggregated from Health & Safety modules.
              </p>
            </div>
            <button
              onClick={() => handleNavigation('../Dashboard')}
              className="px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center space-x-2"
              style={{ background: COLORS.gradients.primary }}
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                  activeView === view.id
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={activeView === view.id ? { background: COLORS.gradients.primary } : {}}
              >
                {view.icon}
                <span>{view.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeView === view.id ? 'bg-white text-purple-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  {view.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Cards - Dashboard Style */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.text.primary }}>
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
              <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
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
              <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
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
              <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
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
              <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
                {stats.expiredRecords}
              </div>
              <div className="text-sm font-medium text-gray-600 mb-3">Expired / Non-Compliant</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight style={{ color: COLORS.status.danger }} />
              </div>
            </div>
          </div>
        </div>

        {/* Module Breakdown - Dashboard Style */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.text.primary }}>
            📋 Records by Module
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div
              onClick={() => { setActiveView('policies'); handleNavigation('policies-documents'); }}
              className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(COLORS.modules.policy, 0.1)} 0%, ${hexToRgba(COLORS.modules.policy, 0.05)} 100%)`,
                border: `2px solid ${hexToRgba(COLORS.modules.policy, 0.2)}`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                style={{ backgroundColor: hexToRgba(COLORS.modules.policy, 0.15) }}
              >
                <FaBookOpen size={28} style={{ color: COLORS.modules.policy }} />
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
                {stats.policies}
              </div>
              <div className="text-sm font-medium text-gray-600">Policies</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight style={{ color: COLORS.modules.policy }} />
              </div>
            </div>

            <div
              onClick={() => { setActiveView('training'); handleNavigation('training-certificates'); }}
              className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(COLORS.modules.training, 0.1)} 0%, ${hexToRgba(COLORS.modules.training, 0.05)} 100%)`,
                border: `2px solid ${hexToRgba(COLORS.modules.training, 0.2)}`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                style={{ backgroundColor: hexToRgba(COLORS.modules.training, 0.15) }}
              >
                <FaUserCheck size={28} style={{ color: COLORS.modules.training }} />
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
                {stats.training}
              </div>
              <div className="text-sm font-medium text-gray-600">Training</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight style={{ color: COLORS.modules.training }} />
              </div>
            </div>

            <div
              onClick={() => { setActiveView('incidents'); handleNavigation('incidents-accidents'); }}
              className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(COLORS.modules.incident, 0.1)} 0%, ${hexToRgba(COLORS.modules.incident, 0.05)} 100%)`,
                border: `2px solid ${hexToRgba(COLORS.modules.incident, 0.2)}`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                style={{ backgroundColor: hexToRgba(COLORS.modules.incident, 0.15) }}
              >
                <FaExclamationTriangle size={28} style={{ color: COLORS.modules.incident }} />
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
                {stats.incidents}
              </div>
              <div className="text-sm font-medium text-gray-600">Incidents</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight style={{ color: COLORS.modules.incident }} />
              </div>
            </div>

            <div
              onClick={() => { setActiveView('hazards'); handleNavigation('inspections-hazards'); }}
              className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(COLORS.modules.hazard, 0.1)} 0%, ${hexToRgba(COLORS.modules.hazard, 0.05)} 100%)`,
                border: `2px solid ${hexToRgba(COLORS.modules.hazard, 0.2)}`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                style={{ backgroundColor: hexToRgba(COLORS.modules.hazard, 0.15) }}
              >
                <FaShieldAlt size={28} style={{ color: COLORS.modules.hazard }} />
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
                {stats.hazards}
              </div>
              <div className="text-sm font-medium text-gray-600">Hazards</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight style={{ color: COLORS.modules.hazard }} />
              </div>
            </div>

            <div
              onClick={() => { setActiveView('inspections'); handleNavigation('SafetyInspections'); }}
              className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(COLORS.modules.inspection, 0.1)} 0%, ${hexToRgba(COLORS.modules.inspection, 0.05)} 100%)`,
                border: `2px solid ${hexToRgba(COLORS.modules.inspection, 0.2)}`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                style={{ backgroundColor: hexToRgba(COLORS.modules.inspection, 0.15) }}
              >
                <FaClipboardCheck size={28} style={{ color: COLORS.modules.inspection }} />
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
                {stats.inspections}
              </div>
              <div className="text-sm font-medium text-gray-600">Inspections</div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <FaArrowRight style={{ color: COLORS.modules.inspection }} />
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
                <h3 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>
                  {activeView === 'all' ? 'All Compliance Records' : 
                   activeView === 'policies' ? '📋 Policy Records (Req 12)' :
                   activeView === 'training' ? '🎓 Training Records (Req 3)' :
                   activeView === 'incidents' ? '🚨 Incident Reports (Req 1)' :
                   activeView === 'hazards' ? '⚠️ Hazard Reports (Req 2)' :
                   '🔍 Inspection Records (Req 6)'}
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
              <thead style={{ background: COLORS.gradients.primary, color: '#ffffff' }}>
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
                          <div className="flex items-center gap-2">
                            <button 
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                              title="View Details"
                              onClick={() => {
                                // In production, this would navigate to compliance dashboard detail view
                                alert(`Viewing ${record.recordId} details. In production, this would open the Compliance Dashboard detail view.`);
                              }}
                            >
                              <FaEye />
                            </button>
                            <button 
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" 
                              title="Download"
                              onClick={() => {
                                // In production, this would download from compliance dashboard
                                alert(`Downloading ${record.recordId}. In production, this would download from Compliance Dashboard.`);
                              }}
                            >
                              <FaDownload />
                            </button>
                            {('policyType' in record) && (
                              <button 
                                onClick={() => handleNavigation('policies-documents')}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" 
                                title="Edit Policy"
                              >
                                <FaEdit />
                              </button>
                            )}
                            {('trainingType' in record) && (
                              <button 
                                onClick={() => handleNavigation('training-certificates')}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" 
                                title="Edit Training"
                              >
                                <FaEdit />
                              </button>
                            )}
                            {('incidentType' in record) && (
                              <button 
                                onClick={() => handleNavigation('incidents-accidents')}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" 
                                title="Edit Incident"
                              >
                                <FaEdit />
                              </button>
                            )}
                            {('hazardType' in record) && (
                              <button 
                                onClick={() => handleNavigation('inspections-hazards')}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" 
                                title="Edit Hazard"
                              >
                                <FaEdit />
                              </button>
                            )}
                            {('inspectionType' in record) && (
                              <button 
                                onClick={() => handleNavigation('SafetyInspections')}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" 
                                title="Edit Inspection"
                              >
                                <FaEdit />
                              </button>
                            )}
                            {record.status === 'expiring' && (
                              <button 
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition" 
                                title="Set Reminder"
                                onClick={() => {
                                  // In production, this would trigger a reminder
                                  alert(`Reminder set for ${record.recordId}`);
                                }}
                              >
                                <FaBell />
                              </button>
                            )}
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

        {/* Enhanced Info Panel for Active View */}
        {activeView === 'policies' && (
          <div className="mt-6 bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
              <FaBookOpen /> Policy Management Features (Requirement 12)
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