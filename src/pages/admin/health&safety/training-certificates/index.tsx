import React, { useState, useEffect } from 'react';
import { 
  FaGraduationCap, FaPlus, FaUpload, FaCalendarCheck, FaCalendarTimes, 
  FaTimesCircle, FaClipboardList, FaSyncAlt, FaCheckCircle, FaDownload,
  FaEye, FaEdit, FaBell, FaFileAlt, FaHistory, FaTimes, FaCheck,
  FaUserCheck, FaClock, FaExclamationTriangle
} from 'react-icons/fa';

const COLORS = {
  primary: '#6366f1',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
};

interface TrainingAcknowledgment {
  acknowledgedDate: string;
  signature: string;
  ipAddress: string;
  acknowledgedBy: string;
}

interface TrainingVersion {
  versionNumber: string;
  publishedDate: string;
  publishedBy: string;
  changes: string;
  documentUrl: string;
}

interface TrainingRecord {
  _id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  trainingName: string;
  trainingType: 'Certificate' | 'Internal Module' | 'External Course';
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired' | 'in-progress';
  certificateUrl?: string;
  currentVersion?: string;
  acknowledgment?: TrainingAcknowledgment;
  completionDate?: string;
  score?: number;
  remindersSent: number;
  lastReminderDate?: string;
}

interface InternalModule {
  _id: string;
  moduleName: string;
  moduleCode: string;
  description: string;
  duration: number; // minutes
  contentType: 'Video' | 'Document' | 'Interactive' | 'Quiz';
  currentVersion: TrainingVersion;
  versionHistory: TrainingVersion[];
  assignedRoles: string[];
  completionRate: number;
  status: 'active' | 'draft' | 'archived';
  createdBy: string;
  createdDate: string;
}

const REQUIRED_TRAININGS = [
  { name: 'WHMIS 2015', category: 'Safety', renewalMonths: 36, mandatory: true },
  { name: 'TDG (Dangerous Goods)', category: 'Safety', renewalMonths: 36, mandatory: true },
  { name: 'Cargo Securement (FMCSA/CVSA)', category: 'Operations', renewalMonths: 24, mandatory: true },
  { name: 'Company Safety Orientation', category: 'Onboarding', renewalMonths: 12, mandatory: true },
  { name: 'Pre-trip Inspection Training', category: 'Operations', renewalMonths: 12, mandatory: true },
  { name: 'Workplace Harassment & Violence', category: 'HR', renewalMonths: 12, mandatory: true },
  { name: 'First Aid', category: 'Safety', renewalMonths: 36, mandatory: true },
  { name: 'Defensive / Winter Driving', category: 'Operations', renewalMonths: 12, mandatory: true },
  { name: 'Fire Extinguisher Training', category: 'Safety', renewalMonths: 12, mandatory: true },
  { name: 'Workplace Ergonomics', category: 'Health', renewalMonths: 24, mandatory: false },
];

const EMPLOYEE_ROLES = ['Driver', 'Mechanic', 'Warehouse Staff', 'Office Staff', 'Manager', 'Safety Officer'];

const TrainingCompliance = () => {
  const [trainingData, setTrainingData] = useState<TrainingRecord[]>([]);
  const [internalModules, setInternalModules] = useState<InternalModule[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'management' | 'modules' | 'reports'>('matrix');
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null);

  const getTrainingStatus = (expiryDate: string): TrainingRecord['status'] => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 60) return 'expiring';
    return 'valid';
  };

  const getStatusColor = (status: TrainingRecord['status']) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    // Enhanced mock data with all required features
    const mockData: Omit<TrainingRecord, 'status'>[] = [
      { 
        _id: 'TR001',
        employeeId: 'E101', 
        employeeName: 'Alice Johnson', 
        employeeRole: 'Driver',
        trainingName: 'WHMIS 2015', 
        trainingType: 'Certificate',
        issueDate: '2024-01-01', 
        expiryDate: '2027-01-01', 
        certificateUrl: '/certs/alice_whmis.pdf',
        currentVersion: 'v2.1',
        acknowledgment: {
          acknowledgedDate: '2024-01-01T10:30:00',
          signature: 'Alice Johnson',
          ipAddress: '192.168.1.100',
          acknowledgedBy: 'Alice Johnson'
        },
        completionDate: '2024-01-01',
        score: 95,
        remindersSent: 0
      },
      { 
        _id: 'TR002',
        employeeId: 'E101', 
        employeeName: 'Alice Johnson', 
        employeeRole: 'Driver',
        trainingName: 'TDG (Dangerous Goods)', 
        trainingType: 'Certificate',
        issueDate: '2023-05-10', 
        expiryDate: '2025-01-15', 
        certificateUrl: '/certs/alice_tdg.pdf',
        acknowledgment: {
          acknowledgedDate: '2023-05-10T14:20:00',
          signature: 'Alice Johnson',
          ipAddress: '192.168.1.100',
          acknowledgedBy: 'Alice Johnson'
        },
        completionDate: '2023-05-10',
        remindersSent: 1,
        lastReminderDate: '2024-11-15'
      },
      { 
        _id: 'TR003',
        employeeId: 'E102', 
        employeeName: 'Bob Smith', 
        employeeRole: 'Mechanic',
        trainingName: 'First Aid', 
        trainingType: 'Certificate',
        issueDate: '2024-03-15', 
        expiryDate: '2027-03-15', 
        certificateUrl: '/certs/bob_firstaid.pdf',
        acknowledgment: {
          acknowledgedDate: '2024-03-15T09:00:00',
          signature: 'Bob Smith',
          ipAddress: '192.168.1.105',
          acknowledgedBy: 'Bob Smith'
        },
        completionDate: '2024-03-15',
        remindersSent: 0
      },
      { 
        _id: 'TR004',
        employeeId: 'E103', 
        employeeName: 'Charlie Brown', 
        employeeRole: 'Driver',
        trainingName: 'Cargo Securement (FMCSA/CVSA)', 
        trainingType: 'Certificate',
        issueDate: '2023-11-01', 
        expiryDate: '2025-01-05',
        certificateUrl: '/certs/charlie_cargo.pdf',
        acknowledgment: {
          acknowledgedDate: '2023-11-01T11:30:00',
          signature: 'Charlie Brown',
          ipAddress: '192.168.1.110',
          acknowledgedBy: 'Charlie Brown'
        },
        completionDate: '2023-11-01',
        remindersSent: 2,
        lastReminderDate: '2024-12-01'
      },
      { 
        _id: 'TR005',
        employeeId: 'E104', 
        employeeName: 'Dana Scully', 
        employeeRole: 'Driver',
        trainingName: 'Defensive / Winter Driving', 
        trainingType: 'Internal Module',
        issueDate: '2023-01-01', 
        expiryDate: '2024-01-01',
        currentVersion: 'v1.3',
        acknowledgment: {
          acknowledgedDate: '2023-01-01T08:00:00',
          signature: 'Dana Scully',
          ipAddress: '192.168.1.115',
          acknowledgedBy: 'Dana Scully'
        },
        completionDate: '2023-01-01',
        score: 88,
        remindersSent: 4,
        lastReminderDate: '2024-11-01'
      },
      {
        _id: 'TR006',
        employeeId: 'E105',
        employeeName: 'Eve Martinez',
        employeeRole: 'Driver',
        trainingName: 'Company Safety Orientation',
        trainingType: 'Internal Module',
        issueDate: '2024-12-01',
        expiryDate: '2025-12-01',
        currentVersion: 'v3.0',
        completionDate: '2024-12-01',
        score: 100,
        remindersSent: 0
      }
    ];

    const updatedData = mockData.map(record => ({
      ...record,
      status: getTrainingStatus(record.expiryDate)
    }));

    setTrainingData(updatedData);

    // Mock Internal Modules
    setInternalModules([
      {
        _id: 'MOD001',
        moduleName: 'Company Safety Orientation',
        moduleCode: 'CSO-2024',
        description: 'Comprehensive overview of company safety policies, procedures, and culture',
        duration: 45,
        contentType: 'Interactive',
        currentVersion: {
          versionNumber: 'v3.0',
          publishedDate: '2024-11-01',
          publishedBy: 'Safety Manager',
          changes: 'Updated harassment policy section, added new emergency procedures',
          documentUrl: '/modules/cso_v3.pdf'
        },
        versionHistory: [
          {
            versionNumber: 'v2.1',
            publishedDate: '2023-06-15',
            publishedBy: 'Safety Manager',
            changes: 'Minor updates to PPE requirements',
            documentUrl: '/modules/cso_v2.1.pdf'
          },
          {
            versionNumber: 'v2.0',
            publishedDate: '2023-01-01',
            publishedBy: 'Safety Manager',
            changes: 'Major revision - new CLC 2021 compliance',
            documentUrl: '/modules/cso_v2.pdf'
          }
        ],
        assignedRoles: ['Driver', 'Mechanic', 'Warehouse Staff', 'Office Staff'],
        completionRate: 92,
        status: 'active',
        createdBy: 'Safety Manager',
        createdDate: '2022-01-15'
      },
      {
        _id: 'MOD002',
        moduleName: 'Pre-trip Inspection Training',
        moduleCode: 'PTI-2024',
        description: 'Step-by-step guide to conducting thorough pre-trip vehicle inspections',
        duration: 30,
        contentType: 'Video',
        currentVersion: {
          versionNumber: 'v1.5',
          publishedDate: '2024-09-01',
          publishedBy: 'Fleet Manager',
          changes: 'Added winter inspection checklist segment',
          documentUrl: '/modules/pti_v1.5.pdf'
        },
        versionHistory: [],
        assignedRoles: ['Driver'],
        completionRate: 100,
        status: 'active',
        createdBy: 'Fleet Manager',
        createdDate: '2023-03-01'
      },
      {
        _id: 'MOD003',
        moduleName: 'Load Securement Best Practices',
        moduleCode: 'LS-2024',
        description: 'CVSA compliance training for proper load securement techniques',
        duration: 60,
        contentType: 'Interactive',
        currentVersion: {
          versionNumber: 'v2.0',
          publishedDate: '2024-10-15',
          publishedBy: 'Operations Manager',
          changes: 'Complete overhaul with new CVSA 2024 standards',
          documentUrl: '/modules/ls_v2.pdf'
        },
        versionHistory: [],
        assignedRoles: ['Driver', 'Warehouse Staff'],
        completionRate: 78,
        status: 'active',
        createdBy: 'Operations Manager',
        createdDate: '2023-05-10'
      }
    ]);
  }, []);

  const stats = {
    totalRecords: trainingData.length,
    valid: trainingData.filter(t => t.status === 'valid').length,
    expiring: trainingData.filter(t => t.status === 'expiring').length,
    expired: trainingData.filter(t => t.status === 'expired').length,
    inProgress: trainingData.filter(t => t.status === 'in-progress').length,
    activeModules: internalModules.filter(m => m.status === 'active').length
  };

  // Training Matrix View
  const renderTrainingMatrix = () => {
    const employees = Array.from(new Set(trainingData.map(t => t.employeeName)));
    
    const getEmployeeTrainingStatus = (employeeName: string, trainingName: string): TrainingRecord | null => {
      const records = trainingData.filter(t => t.employeeName === employeeName && t.trainingName === trainingName);
      return records.length > 0 ? records[0] : null;
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Compliance Training Matrix 📊</h2>
            <p className="text-gray-600 mt-1">Real-time compliance status for all employees and required certifications</p>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
            <FaDownload /> Export Report
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase z-10">
                  Employee
                </th>
                {REQUIRED_TRAININGS.map(train => (
                  <th key={train.name} className="px-3 py-3 text-center" style={{ minWidth: '120px' }}>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium text-gray-700 text-center">{train.name}</span>
                      <span className="text-xs text-gray-500">({train.renewalMonths}mo)</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map(employee => {
                const employeeData = trainingData.find(t => t.employeeName === employee);
                return (
                  <tr key={employee} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white px-4 py-4 whitespace-nowrap border-r border-gray-200">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{employee}</div>
                        <div className="text-xs text-gray-500">{employeeData?.employeeRole}</div>
                      </div>
                    </td>
                    {REQUIRED_TRAININGS.map(train => {
                      const record = getEmployeeTrainingStatus(employee, train.name);
                      if (record) {
                        const statusClass = getStatusColor(record.status);
                        const tooltipText = `${record.status.toUpperCase()} - Expires: ${record.expiryDate}`;
                        return (
                          <td 
                            key={train.name} 
                            className="px-3 py-4 text-center whitespace-nowrap cursor-pointer hover:bg-blue-50 transition"
                            title={tooltipText}
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowDetailModal(true);
                            }}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className={`h-8 w-8 inline-flex items-center justify-center rounded-full ${statusClass}`}>
                                {record.status === 'valid' && <FaCheckCircle />}
                                {record.status === 'expiring' && <FaClock />}
                                {record.status === 'expired' && <FaTimesCircle />}
                                {record.status === 'in-progress' && <FaSyncAlt className="animate-spin" />}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(record.expiryDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                              </span>
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td key={train.name} className="px-3 py-4 text-center whitespace-nowrap">
                          <span className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xs" title="Missing">
                            <FaTimesCircle />
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-green-100 border-2 border-green-600"></span>
            <span>Valid</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-yellow-100 border-2 border-yellow-600"></span>
            <span>Expiring (≤60 days)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-red-100 border-2 border-red-600"></span>
            <span>Expired</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-gray-200 border-2 border-gray-400"></span>
            <span>Missing</span>
          </div>
        </div>
      </div>
    );
  };

  // Certificate Upload & Management
  const renderCertificateManagement = () => (
    <div className="space-y-6">
      {/* Upload Certificate Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          <FaUpload className="text-indigo-600" /> Upload New Certificate
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Employee *</label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option>Select Employee...</option>
              {Array.from(new Set(trainingData.map(t => t.employeeName))).map(name => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Training Type *</label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option>Select Training...</option>
              {REQUIRED_TRAININGS.map(t => (
                <option key={t.name}>{t.name} ({t.renewalMonths} months renewal)</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Issue Date *</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Expiry Date *</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Certificate File (PDF/JPG) *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer">
              <FaUpload size={32} className="mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-4">
          <button className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
            <FaCheck /> Save Certificate
          </button>
          <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">
            Cancel
          </button>
        </div>
      </div>

      {/* Renewal Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-900">
            <FaBell className="text-yellow-600" /> Expiring Soon (60 days)
          </h3>
          <div className="text-4xl font-bold text-yellow-700 mb-2">{stats.expiring}</div>
          <p className="text-sm text-gray-700 mb-4">Certificates expiring in next 60 days</p>
          <div className="space-y-2">
            {trainingData.filter(t => t.status === 'expiring').slice(0, 3).map(record => (
              <div key={record._id} className="bg-white p-3 rounded-lg text-sm">
                <div className="font-semibold">{record.employeeName}</div>
                <div className="text-gray-600">{record.trainingName} - Expires {new Date(record.expiryDate).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-semibold">
            Send Reminders to All
          </button>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-900">
            <FaExclamationTriangle className="text-red-600" /> Expired Certificates
          </h3>
          <div className="text-4xl font-bold text-red-700 mb-2">{stats.expired}</div>
          <p className="text-sm text-gray-700 mb-4">IMMEDIATE ACTION REQUIRED</p>
          <div className="space-y-2">
            {trainingData.filter(t => t.status === 'expired').map(record => (
              <div key={record._id} className="bg-white p-3 rounded-lg text-sm border-l-4 border-red-500">
                <div className="font-semibold">{record.employeeName}</div>
                <div className="text-gray-600">{record.trainingName} - Expired {new Date(record.expiryDate).toLocaleDateString()}</div>
                <div className="text-xs text-red-600 mt-1">Reminders sent: {record.remindersSent}</div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold">
            View All Expired
          </button>
        </div>
      </div>

      {/* Reminder Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900">⚙️ Automated Reminder Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <input type="checkbox" checked readOnly className="rounded" />
              60-Day Reminder
            </label>
            <p className="text-xs text-gray-600">Send email 60 days before expiry</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <input type="checkbox" checked readOnly className="rounded" />
              30-Day Reminder
            </label>
            <p className="text-xs text-gray-600">Send email 30 days before expiry</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <input type="checkbox" checked readOnly className="rounded" />
              7-Day Final Notice
            </label>
            <p className="text-xs text-gray-600">Final reminder 7 days before expiry</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Internal Training Modules
  const renderInternalModules = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Internal Training Modules</h2>
          <p className="text-gray-600">Create and manage company-specific training content</p>
        </div>
        <button 
          onClick={() => setShowModuleModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-semibold"
        >
          <FaPlus /> Create New Module
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {internalModules.map(module => (
          <div key={module._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{module.moduleName}</h3>
                  <p className="text-xs text-gray-500 mb-2">{module.moduleCode}
                    </p>
                  </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  module.status === 'active' ? 'bg-green-100 text-green-800' :
                  module.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {module.status.toUpperCase()}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{module.description}</p>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{module.duration} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold">{module.contentType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Version:</span>
                  <span className="font-semibold text-indigo-600">{module.currentVersion.versionNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completion Rate:</span>
                  <span className="font-semibold text-green-600">{module.completionRate}%</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Assigned Roles:</div>
                <div className="flex flex-wrap gap-1">
                  {module.assignedRoles.map(role => (
                    <span key={role} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Version History */}
              {module.versionHistory.length > 0 && (
                <div className="mb-4 border-t pt-4">
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                    <FaHistory /> Version History ({module.versionHistory.length + 1} versions)
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    <div className="text-xs bg-indigo-50 p-2 rounded">
                      <div className="font-semibold text-indigo-900">
                        {module.currentVersion.versionNumber} (Current)
                      </div>
                      <div className="text-gray-600">
                        {new Date(module.currentVersion.publishedDate).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500 mt-1">{module.currentVersion.changes}</div>
                    </div>
                    {module.versionHistory.slice(0, 2).map(version => (
                      <div key={version.versionNumber} className="text-xs bg-gray-50 p-2 rounded">
                        <div className="font-semibold">{version.versionNumber}</div>
                        <div className="text-gray-600">
                          {new Date(version.publishedDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold">
                  Assign to Employees
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                  <FaEdit />
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                  <FaDownload />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Training Detail Modal
  const TrainingDetailModal = () => {
    if (!selectedRecord) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedRecord.trainingName}</h2>
              <p className="text-gray-600">{selectedRecord.employeeName} - {selectedRecord.employeeRole}</p>
            </div>
            <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
              <FaTimes size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Status</div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedRecord.status)}`}>
                  {selectedRecord.status.toUpperCase()}
                </span>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Issue Date</div>
                <div className="font-semibold">{new Date(selectedRecord.issueDate).toLocaleDateString()}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Expiry Date</div>
                <div className="font-semibold">{new Date(selectedRecord.expiryDate).toLocaleDateString()}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Type</div>
                <div className="font-semibold text-sm">{selectedRecord.trainingType}</div>
              </div>
            </div>

            {/* Acknowledgment Info */}
            {selectedRecord.acknowledgment && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <FaUserCheck /> Training Acknowledgment
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Acknowledged By:</span>
                    <div className="font-semibold">{selectedRecord.acknowledgment.acknowledgedBy}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Date & Time:</span>
                    <div className="font-semibold">
                      {new Date(selectedRecord.acknowledgment.acknowledgedDate).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Digital Signature:</span>
                    <div className="font-semibold italic">{selectedRecord.acknowledgment.signature}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">IP Address:</span>
                    <div className="font-mono text-xs">{selectedRecord.acknowledgment.ipAddress}</div>
                  </div>
                </div>
              </div>
            )}

            {/* No Acknowledgment Warning */}
            {!selectedRecord.acknowledgment && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FaExclamationTriangle className="text-yellow-600" size={24} />
                  <div>
                    <h4 className="font-semibold text-yellow-900">No Acknowledgment on Record</h4>
                    <p className="text-sm text-gray-700">Employee has not digitally acknowledged this training</p>
                  </div>
                </div>
                <button className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-semibold">
                  Request Acknowledgment
                </button>
              </div>
            )}

            {/* Version Info */}
            {selectedRecord.currentVersion && (
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <FaFileAlt /> Version Information
                </h3>
                <div className="text-sm">
                  <span className="text-gray-600">Completed Version:</span>
                  <span className="font-semibold ml-2">{selectedRecord.currentVersion}</span>
                </div>
              </div>
            )}

            {/* Completion Details */}
            {selectedRecord.completionDate && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-3">Completion Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Completion Date:</span>
                    <div className="font-semibold">
                      {new Date(selectedRecord.completionDate).toLocaleDateString()}
                    </div>
                  </div>
                  {selectedRecord.score !== undefined && (
                    <div>
                      <span className="text-gray-600">Score:</span>
                      <div className="font-semibold text-green-600">{selectedRecord.score}%</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reminder History */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FaBell /> Reminder History
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Reminders Sent:</span>
                  <span className="font-semibold">{selectedRecord.remindersSent}</span>
                </div>
                {selectedRecord.lastReminderDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Reminder:</span>
                    <span className="font-semibold">
                      {new Date(selectedRecord.lastReminderDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Certificate Download */}
            {selectedRecord.certificateUrl && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-3">Certificate Document</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaFileAlt className="text-blue-600" size={24} />
                    <div>
                      <div className="font-semibold text-sm">Certificate_File.pdf</div>
                      <div className="text-xs text-gray-600">Uploaded: {new Date(selectedRecord.issueDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center gap-2">
                      <FaEye /> View
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center gap-2">
                      <FaDownload /> Download
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50 flex gap-3">
            <button className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
              Send Reminder
            </button>
            <button className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">
              Edit Record
            </button>
            <button 
              onClick={() => setShowDetailModal(false)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Create Module Modal
  const CreateModuleModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Create New Training Module</h2>
          <button onClick={() => setShowModuleModal(false)} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Module Name *</label>
              <input 
                type="text"
                placeholder="e.g., Advanced Load Securement"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Module Code *</label>
              <input 
                type="text"
                placeholder="e.g., ALS-2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Description *</label>
              <textarea 
                placeholder="Describe the training content and objectives..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Duration (minutes) *</label>
              <input 
                type="number"
                placeholder="30"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Content Type *</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option>Video</option>
                <option>Document</option>
                <option>Interactive</option>
                <option>Quiz</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Assign to Roles</label>
              <div className="grid grid-cols-3 gap-3">
                {EMPLOYEE_ROLES.map(role => (
                  <label key={role} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Upload Training Content *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer">
                <FaUpload size={32} className="mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">Click to upload training materials</p>
                <p className="text-xs text-gray-500">PDF, Video, SCORM packages up to 100MB</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
              <FaCheck /> Create Module
            </button>
            <button 
              onClick={() => setShowModuleModal(false)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <FaGraduationCap className="text-indigo-600" />
          Safety Training & Compliance
        </h1>
        <p className="text-gray-600">Manage employee certifications, training modules, and compliance tracking</p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Records</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalRecords}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-200">
          <div className="text-sm text-green-600 mb-1">Valid</div>
          <div className="text-2xl font-bold text-green-900">{stats.valid}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-200">
          <div className="text-sm text-yellow-600 mb-1">Expiring Soon</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.expiring}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-200">
          <div className="text-sm text-red-600 mb-1">Expired</div>
          <div className="text-2xl font-bold text-red-900">{stats.expired}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">In Progress</div>
          <div className="text-2xl font-bold text-blue-900">{stats.inProgress}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-200">
          <div className="text-sm text-purple-600 mb-1">Active Modules</div>
          <div className="text-2xl font-bold text-purple-900">{stats.activeModules}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition ${
            activeTab === 'matrix' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FaClipboardList className="inline mr-2" /> Compliance Matrix
        </button>
        <button
          onClick={() => setActiveTab('management')}
          className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition ${
            activeTab === 'management' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FaUpload className="inline mr-2" /> Certificate Management
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition ${
            activeTab === 'modules' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <FaFileAlt className="inline mr-2" /> Internal Modules
        </button>
      </div>

      {/* Content */}
      {activeTab === 'matrix' && renderTrainingMatrix()}
      {activeTab === 'management' && renderCertificateManagement()}
      {activeTab === 'modules' && renderInternalModules()}

      {/* Modals */}
      {showDetailModal && <TrainingDetailModal />}
      {showModuleModal && <CreateModuleModal />}
    </div>
  );
};

export default TrainingCompliance;