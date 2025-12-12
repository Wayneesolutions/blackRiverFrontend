import React, { useState, useEffect } from 'react';
import { 
  FaClipboardList, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaCertificate,
  FaClock,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaGraduationCap,
  FaUpload,
  FaCalendarCheck,
  FaCalendarTimes,
  FaSyncAlt,
  FaDownload,
  FaBell,
  FaFileAlt,
  FaHistory,
  FaCheck,
  FaUserCheck
} from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import {
  createTraining,
  getTrainings,
  updateTraining,
  deleteTraining,
  createCertificate,
  getCertificates,
  updateCertificate,
  deleteCertificate,
  getCertificateSignedUrl,
  getTrainingMaterialSignedUrl
} from '../../../../axios/api/healthSafety';
import { getAllEmployees } from '../../../../axios/api/employee';

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
  certificateId?: string; // Store the actual certificate ID for API calls
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


interface InternalModule {
  _id: string;
  moduleName: string;
  moduleCode: string;
  description: string;
  duration: number;
  contentType: string;
  currentVersion: TrainingVersion;
  versionHistory: TrainingVersion[];
  assignedRoles: string[];
  completionRate: number;
  status: 'active' | 'draft' | 'archived';
  createdBy: string;
  createdDate: string;
}

interface Training {
  _id: string;
  trainingNumber: string;
  title: string;
  type: string;
  date: string;
  expiryDate: string;
  participants: number;
  status: string;
  instructor: string;
}

interface Certificate {
  _id: string;
  certificateNumber: string;
  employee: string;
  type: string;
  issueDate: string;
  expiryDate: string;
  status: string;
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

const TrainingCertificates = () => {
  const [trainingData, setTrainingData] = useState<TrainingRecord[]>([]);
  const [internalModules, setInternalModules] = useState<InternalModule[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'management' | 'modules' | 'reports'>('matrix');
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Toast notification helpers
  const addNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

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

  // Fetch certificates from API
  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await getCertificates();
      if (response?.success && Array.isArray(response.data)) {
        // Map API certificates to TrainingRecord format
        const mappedData: TrainingRecord[] = response.data.map((cert: any) => ({
          _id: cert._id,
          certificateId: cert._id, // Store certificate ID for API calls
          employeeId: cert.employeeId?._id || cert.employeeId || '',
          employeeName: cert.employeeId?.name || cert.employee || '',
          employeeRole: cert.employeeId?.role || 'Employee',
          trainingName: cert.type,
          trainingType: 'Certificate' as TrainingRecord['trainingType'],
          issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : '',
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : '',
          status: cert.status === 'expired' ? 'expired' : 
                  cert.status === 'expiring-soon' ? 'expiring' : 
                  'valid',
          certificateUrl: cert.certificateUrl,
          remindersSent: 0
        })).map(record => ({
          ...record,
          status: getTrainingStatus(record.expiryDate)
        }));
        
        setTrainingData(mappedData);
      } else {
        addNotification('error', response?.message || 'Failed to fetch certificates');
      }
    } catch (error: any) {
      addNotification('error', error?.message || 'Error fetching certificates');
    } finally {
      setLoading(false);
    }
  };

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
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2"
            style={{
              background: FLEET_COLORS.gradient,
              boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
            }}
          >
            <FaPlus /> Upload Certificate
          </button>
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

  // Certificate Upload Modal
  const CertificateUploadModal = () => {
    const [employee, setEmployee] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [type, setType] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [issuingAuthority, setIssuingAuthority] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);

    useEffect(() => {
      // Fetch employees for dropdown (excluding admin and superadmin)
      const fetchEmployees = async () => {
        try {
          console.log('Fetching employees for certificate dropdown...');
          const response = await getAllEmployees(1, 1000);
          console.log('Employees API response:', response);
          
          if (response?.success) {
            const employeesData = Array.isArray(response.data) ? response.data : [];
            console.log(`Found ${employeesData.length} employees from API`);
            
            // Filter out admin and superadmin roles (case-insensitive)
            const filteredEmployees = employeesData.filter((emp: any) => {
              if (!emp || !emp.role) return false;
              const roleLower = emp.role.toLowerCase();
              return roleLower !== 'admin' && roleLower !== 'superadmin';
            });
            
            console.log(`After filtering: ${filteredEmployees.length} employees`);
            setEmployees(filteredEmployees);
            
            if (filteredEmployees.length === 0 && employeesData.length > 0) {
              console.warn('All employees were filtered out. Available roles:', 
                [...new Set(employeesData.map((e: any) => e.role))]);
            }
          } else {
            console.error('API response not successful:', response);
            addNotification('error', response?.message || 'Failed to fetch employees');
          }
        } catch (error: any) {
          console.error('Error fetching employees:', error);
          addNotification('error', error?.message || 'Failed to fetch employees');
        }
      };
      fetchEmployees();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setCertificateFile(e.target.files[0]);
      }
    };

    const handleSubmit = async () => {
      if (!employeeId || !employee || !type || !issueDate || !expiryDate) {
        addNotification('error', 'Please fill in all required fields: Employee, Training Type, Issue Date, and Expiry Date');
        return;
      }

      setSaving(true);
      try {
        const formData = new FormData();
        formData.append('employee', employee.trim());
        if (employeeId) formData.append('employeeId', employeeId);
        formData.append('type', type.trim());
        formData.append('issueDate', issueDate);
        formData.append('expiryDate', expiryDate);
        if (issuingAuthority) formData.append('issuingAuthority', issuingAuthority);
        if (notes) formData.append('notes', notes);
        
        if (certificateFile) {
          formData.append('certificateFile', certificateFile);
        }

        const response = await createCertificate(formData);
        
        if (response?.success) {
          addNotification('success', 'Certificate created successfully');
          setShowUploadModal(false);
          // Reset form
          setEmployee('');
          setEmployeeId('');
          setType('');
          setIssueDate('');
          setExpiryDate('');
          setCertificateFile(null);
          setIssuingAuthority('');
          setNotes('');
          await fetchCertificates();
        } else {
          addNotification('error', response?.message || 'Failed to create certificate');
        }
      } catch (error: any) {
        addNotification('error', error?.message || 'Error creating certificate');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
            <h2 className="text-2xl font-bold text-gray-900">Upload New Certificate</h2>
            <button 
              onClick={() => {
                setShowUploadModal(false);
                setEmployee('');
                setEmployeeId('');
                setType('');
                setIssueDate('');
                setExpiryDate('');
                setCertificateFile(null);
                setIssuingAuthority('');
                setNotes('');
              }} 
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={24} />
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Employee *</label>
                <select 
                  value={employeeId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selected = employees.find(emp => emp._id === selectedId);
                    if (selected) {
                      setEmployee(selected.name || '');
                      setEmployeeId(selected._id || '');
                    } else {
                      setEmployee('');
                      setEmployeeId('');
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Employee...</option>
                  {employees.length === 0 ? (
                    <option disabled>No employees available</option>
                  ) : (
                    employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name || 'Unknown'} {emp.role ? `(${emp.role})` : ''}
                      </option>
                    ))
                  )}
                </select>
                {employees.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">No employees found. Please check your company settings.</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Training Type *</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Training...</option>
                  {REQUIRED_TRAININGS.map(t => (
                    <option key={t.name} value={t.name}>{t.name} ({t.renewalMonths} months renewal)</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Issue Date *</label>
                <input 
                  type="date" 
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Expiry Date *</label>
                <input 
                  type="date" 
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Issuing Authority</label>
                <input 
                  type="text"
                  value={issuingAuthority}
                  onChange={(e) => setIssuingAuthority(e.target.value)}
                  placeholder="e.g., Red Cross, OSHA"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Certificate File (PDF/JPG)</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer"
                  onClick={() => document.getElementById('certificate-file-input')?.click()}
                >
                  <FaUpload size={32} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                  {certificateFile && (
                    <p className="text-sm text-indigo-600 mt-2 font-semibold">
                      Selected: {certificateFile.name} ({(certificateFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <input 
                    id="certificate-file-input"
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-4">
              <button 
                onClick={handleSubmit}
                disabled={saving || !employee || !type || !issueDate || !expiryDate}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheck /> Save Certificate
                  </>
                )}
              </button>
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                  setEmployee('');
                  setEmployeeId('');
                  setType('');
                  setIssueDate('');
                  setExpiryDate('');
                  setCertificateFile(null);
                  setIssuingAuthority('');
                  setNotes('');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Certificate Upload & Management
  const renderCertificateManagement = () => (
    <div className="space-y-6">

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
      <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                      <div className="font-semibold text-sm">
                        {selectedRecord.certificateUrl.split('/').pop() || 'Certificate_File.pdf'}
                      </div>
                      <div className="text-xs text-gray-600">Uploaded: {new Date(selectedRecord.issueDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          if (selectedRecord.certificateId) {
                            const response = await getCertificateSignedUrl(selectedRecord.certificateId, 'inline');
                            if (response?.success && response.url) {
                              window.open(response.url, '_blank');
                            } else {
                              addNotification('error', response?.message || 'Failed to get certificate URL');
                            }
                          } else {
                            addNotification('error', 'Certificate ID not found');
                          }
                        } catch (error: any) {
                          addNotification('error', error?.message || 'Error viewing certificate');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center gap-2"
                    >
                      <FaEye /> View
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          if (selectedRecord.certificateId) {
                            const response = await getCertificateSignedUrl(selectedRecord.certificateId, 'attachment');
                            if (response?.success && response.url) {
                              const link = document.createElement('a');
                              link.href = response.url;
                              link.download = selectedRecord.certificateUrl?.split('/').pop() || 'certificate.pdf';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              addNotification('error', response?.message || 'Failed to get certificate URL');
                            }
                          } else {
                            addNotification('error', 'Certificate ID not found');
                          }
                        } catch (error: any) {
                          addNotification('error', error?.message || 'Error downloading certificate');
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center gap-2"
                    >
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
  const CreateModuleModal = () => {
    const [moduleName, setModuleName] = useState('');
    const [moduleCode, setModuleCode] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [contentType, setContentType] = useState('Video');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [trainingFile, setTrainingFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // Check file size (100MB max)
        if (file.size > 100 * 1024 * 1024) {
          addNotification('error', 'File size exceeds 100MB limit');
          return;
        }
        setTrainingFile(file);
      }
    };

    const handleRoleToggle = (role: string) => {
      setSelectedRoles(prev => 
        prev.includes(role) 
          ? prev.filter(r => r !== role)
          : [...prev, role]
      );
    };

    const handleSubmit = async () => {
      if (!moduleName || !moduleCode || !description || !duration || !contentType) {
        addNotification('error', 'Please fill in all required fields');
        return;
      }

      setSaving(true);
      try {
        const formData = new FormData();
        formData.append('title', moduleName);
        formData.append('type', contentType);
        formData.append('date', new Date().toISOString());
        formData.append('instructor', 'System'); // Internal module
        formData.append('description', description);
        formData.append('duration', (parseInt(duration) / 60).toString()); // Convert minutes to hours
        formData.append('location', 'Internal Module');
        formData.append('status', 'scheduled');
        
        if (trainingFile) {
          formData.append('materialFile', trainingFile);
        }

        const response = await createTraining(formData);
        
        if (response?.success) {
          addNotification('success', 'Training module created successfully');
          setShowModuleModal(false);
          // Reset form
          setModuleName('');
          setModuleCode('');
          setDescription('');
          setDuration('');
          setContentType('Video');
          setSelectedRoles([]);
          setTrainingFile(null);
          // Refresh trainings if needed
        } else {
          addNotification('error', response?.message || 'Failed to create training module');
        }
      } catch (error: any) {
        addNotification('error', error?.message || 'Error creating training module');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
            <h2 className="text-2xl font-bold text-gray-900">Create New Training Module</h2>
            <button 
              onClick={() => {
                setShowModuleModal(false);
                setModuleName('');
                setModuleCode('');
                setDescription('');
                setDuration('');
                setContentType('Video');
                setSelectedRoles([]);
                setTrainingFile(null);
              }} 
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Module Name *</label>
                <input 
                  type="text"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder="e.g., Advanced Load Securement"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Module Code *</label>
                <input 
                  type="text"
                  value={moduleCode}
                  onChange={(e) => setModuleCode(e.target.value)}
                  placeholder="e.g., ALS-2024"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Description *</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the training content and objectives..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Duration (minutes) *</label>
                <input 
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="30"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Content Type *</label>
                <select 
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Video">Video</option>
                  <option value="Document">Document</option>
                  <option value="Interactive">Interactive</option>
                  <option value="Quiz">Quiz</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Assign to Roles</label>
                <div className="grid grid-cols-3 gap-3">
                  {EMPLOYEE_ROLES.map(role => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="rounded" 
                      />
                      <span className="text-sm">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Upload Training Content *</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer"
                  onClick={() => document.getElementById('training-file-input')?.click()}
                >
                  <FaUpload size={32} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">Click to upload training materials</p>
                  <p className="text-xs text-gray-500">PDF, Video, SCORM packages up to 100MB</p>
                  {trainingFile && (
                    <p className="text-sm text-indigo-600 mt-2 font-semibold">
                      Selected: {trainingFile.name} ({(trainingFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <input 
                    id="training-file-input"
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.mp4,.avi,.mov,.zip,.scorm"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button 
                onClick={handleSubmit}
                disabled={saving || !moduleName || !moduleCode || !description || !duration || !contentType}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FaCheck /> Create Module
                  </>
                )}
              </button>
              <button 
                onClick={() => {
                  setShowModuleModal(false);
                  setModuleName('');
                  setModuleCode('');
                  setDescription('');
                  setDuration('');
                  setContentType('Video');
                  setSelectedRoles([]);
                  setTrainingFile(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      {showUploadModal && <CertificateUploadModal />}
      {showDetailModal && <TrainingDetailModal />}
      {showModuleModal && <CreateModuleModal />}
      
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

export default TrainingCertificates;
