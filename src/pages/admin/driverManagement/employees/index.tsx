import React, { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Plus,
  X,
  User,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  FileText,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus
} from '../../../../axios/api/employee';
import {
  createEmployeeDocument,
  updateEmployeeDocument,
  getDocumentsByEmployee,
  getSignedEmployeeDocumentUrl,
  type EmployeeDocument
} from '../../../../axios/api/employeeDocument';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

const ACCENT_PRIMARY = FLEET_COLORS.primary;
const ACCENT_DARK = FLEET_COLORS.dark;
const ACCENT_GRADIENT = 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)';
const ACCENT_VARS = {
  '--accent-color': ACCENT_PRIMARY,
  '--accent-dark': ACCENT_DARK
} as CSSProperties & { '--accent-color': string; '--accent-dark': string };
const focusRingStyle = {
  '--tw-ring-color': ACCENT_PRIMARY
} as CSSProperties & { '--tw-ring-color': string };

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  role: string;
  status: 'active' | 'inactive';
  joinDate: string;
  internalId: string;
  location: {
    address: string;
    latitude: string;
    longitude: string;
  };
  state: string;
  city: string;
  policies: string;
  createdAt: string;
  updatedAt: string;
  documents?: EmployeeDocument[];
  details?: {
    incorporation?: string;
    employeeCode?: string;
    postalCode?: string;
    fleet?: string;
    citizenship?: string;
    paymentMethod?: string;
    account?: string;
    wsib?: boolean;
    wsibAccountNo?: string;
    expiryDate?: string | Date;
    remark?: string;
    gstNo?: string;
    profileImage?: string;
    companyFlag?: boolean;
    cell1?: string;
    cell2?: string;
    extension?: string;
    fax?: string;
    gender?: string;
    dateOfBirth?: string | Date;
    hireDate?: string | Date;
    termDate?: string | Date;
    csa?: boolean;
    fastCardNo?: string;
    fastCardExpiry?: string | Date;
    medicalRequired?: boolean;
    defaultChargeName?: string;
    defaultCurrency?: string;
    chargesAppliedOn?: string;
    defaultMode?: string;
    defaultAmount?: number;
    defaultRemarks?: string;
    defaultPayrollType?: string;
    paymentCurrency?: string;
    mileRate?: number;
    mileRateTeam?: number;
    emptyMileRate?: number;
    emptyMileRateTeam?: number;
    hourlyRate?: number;
    weightRate?: number;
    percentageRate?: number;
    localTaxNo?: string;
    federalTaxNo?: string;
    sinNo?: string;
    craAccountNo?: string;
    fedTaxExempt?: boolean;
    provTaxExempt?: boolean;
    cppQppExempt?: boolean;
    eiExempt?: boolean;
    qpipExempt?: boolean;
    payPeriod?: string;
    vacationPay?: string;
    ltl?: boolean;
    onSettlements?: boolean;
    settlementCurrencyByOrder?: boolean;
    isDefault?: boolean;
  };
}

interface EmployeeDocumentForm {
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  description: string;
  status: string;
  file: File | null;
  _id?: string; // For existing documents
}

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

// Notification Component
const Notification = ({ notification, onClose }: { notification: Notification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    info: <FaInfoCircle style={{ color: ACCENT_PRIMARY }} size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: ''
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const infoStyle =
    notification.type === 'info'
      ? {
        backgroundColor: 'rgba(1, 106, 178, 0.08)',
        borderColor: 'rgba(1, 106, 178, 0.3)'
      }
      : undefined;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in`}
      style={infoStyle}
    >
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

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; employeeId: string | null }>({
    show: false,
    employeeId: null
  });

  // Two-step flow state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocumentForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table and document display state
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<Employee | null>(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    role: '',
    state: '',
    city: '',
    address: '',
    joinDate: '',
    internalId: '',
    policies: '',
    password: ''
  });

  // Available roles (excluding driver - drivers should use Driver Documents)
  const roles = [
    'dispatcher', 'hr', 'contact', 'customer', 'reporter',
    'Fleet Maintenance Manager', 'Compliance Manager', 'Maintenance Crew (Mechanics)', 'safety officer'
  ];

  // Roles that require login access (ID, username, password)
  const rolesWithLoginAccess = ['dispatcher', 'hr', 'Fleet Maintenance Manager', 'Compliance Manager', 'safety officer'];

  // Role display mapping
  const getRoleDisplayName = (role: string) => {
    if (role === 'Compliance Manager') {
      return 'Compliance Manager/Safety Manager';
    }
    if (role === 'safety officer') {
      return 'Safety Officer';
    }
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Roles without login access (only basic information)
  const rolesWithoutLoginAccess = ['contact', 'customer', 'reporter', 'Maintenance Crew (Mechanics)'];

  // Employee document types
  const EMPLOYEE_DOCUMENT_TYPES = [
    'Employment Contract',
    'ID Document',
    'Passport',
    'Work Permit',
    'Background Check',
    'Drug Test',
    'Training Certificate',
    'Insurance Policy',
    'Company Policy',
    'Performance Review',
    'Payroll Document',
    'Tax Document',
    'Emergency Contact',
    'Medical Certificate',
    'Driving Licence',
    'Travel Document',
    'Other'
  ];

  // Fetch employees data
  useEffect(() => {
    fetchEmployees();
    if (editingEmployee) {
      fetchEmployeeDocuments();
    }
  }, []);

  useEffect(() => {
    if (editingEmployee) {
      fetchEmployeeDocuments();
    }
  }, [editingEmployee]);

  // Sync scroll between top and bottom scrollbars
  useEffect(() => {
    const topScroll = topScrollRef.current;
    const bottomScroll = bottomScrollRef.current;

    if (!topScroll || !bottomScroll) return;

    let isScrolling = false;

    const handleTopScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      bottomScroll.scrollLeft = topScroll.scrollLeft;
      requestAnimationFrame(() => {
        isScrolling = false;
      });
    };

    const handleBottomScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      topScroll.scrollLeft = bottomScroll.scrollLeft;
      requestAnimationFrame(() => {
        isScrolling = false;
      });
    };

    // Sync scroll widths
    const syncScrollWidths = () => {
      const bottomScrollWidth = bottomScroll.scrollWidth;
      const topInner = topScroll.querySelector('.top-scroll-content') as HTMLElement;
      if (topInner && bottomScrollWidth > 0) {
        topInner.style.width = `${bottomScrollWidth}px`;
        topScroll.scrollLeft = bottomScroll.scrollLeft;
      }
    };

    // Initial sync - wait for table to render
    const timeoutId = setTimeout(syncScrollWidths, 100);
    const timeoutId2 = setTimeout(syncScrollWidths, 300);
    const timeoutId3 = setTimeout(syncScrollWidths, 500);

    // Observe table changes
    const tableObserver = new MutationObserver(() => {
      syncScrollWidths();
    });

    const bottomTable = bottomScroll.querySelector('table');
    if (bottomTable) {
      tableObserver.observe(bottomTable, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    topScroll.addEventListener('scroll', handleTopScroll, { passive: true });
    bottomScroll.addEventListener('scroll', handleBottomScroll, { passive: true });
    window.addEventListener('resize', syncScrollWidths);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      tableObserver.disconnect();
      topScroll.removeEventListener('scroll', handleTopScroll);
      bottomScroll.removeEventListener('scroll', handleBottomScroll);
      window.removeEventListener('resize', syncScrollWidths);
    };
  }, [employees, loading]);

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await getAllEmployees(1, 100, searchQuery, selectedRole || undefined, selectedStatus || undefined);
      if (response.success) {
        const filteredEmployees = (response.data || []).filter((e: Employee) => e.role !== 'driver');
        
        // Fetch documents for each employee
        const employeesWithDocs = await Promise.all(
          filteredEmployees.map(async (employee: Employee) => {
            try {
              const docsResponse = await getDocumentsByEmployee(employee._id);
              if (docsResponse.success && Array.isArray(docsResponse.data)) {
                return { ...employee, documents: docsResponse.data };
              }
            } catch (err) {
              console.error(`Error fetching documents for employee ${employee._id}:`, err);
            }
            return { ...employee, documents: [] };
          })
        );
        
        setEmployees(employeesWithDocs);
      } else {
        addNotification('error', response?.message || 'Failed to fetch employees');
      }
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      addNotification('error', error?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDocuments = async () => {
    if (!editingEmployee) return;
    try {
      const docsResponse = await getDocumentsByEmployee(editingEmployee._id);
      if (docsResponse.success && Array.isArray(docsResponse.data)) {
        const docs = docsResponse.data.map((doc: EmployeeDocument) => ({
          documentType: doc.documentType,
          documentNumber: doc.documentNumber || '',
          issueDate: doc.issueDate ? doc.issueDate.split('T')[0] : '',
          expiryDate: doc.expiryDate ? doc.expiryDate.split('T')[0] : '',
          description: doc.description || '',
          status: doc.status,
          file: null,
          _id: doc._id
        }));
        setEmployeeDocuments(docs);
      }
    } catch (error) {
      console.error('Error fetching employee documents:', error);
    }
  };

  // Search employees and apply filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEmployees();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedRole, selectedStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'internalId' ? value.toUpperCase() : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      country: '',
      role: '',
      state: '',
      city: '',
      address: '',
      joinDate: '',
      internalId: '',
      policies: '',
      password: ''
    });
    setEmployeeDocuments([]);
    setCurrentStep(1);
    setEditingEmployee(null);
    setShowPassword(false);
    setIsSubmitting(false);
  };

  const addDocument = () => {
    setEmployeeDocuments([...employeeDocuments, {
      documentType: '',
      documentNumber: '',
      issueDate: '',
      expiryDate: '',
      description: '',
      status: 'valid',
      file: null
    }]);
  };

  const removeDocument = (index: number) => {
    setEmployeeDocuments(employeeDocuments.filter((_, i) => i !== index));
  };

  const updateDocument = (index: number, field: keyof EmployeeDocumentForm, value: any) => {
    const updated = [...employeeDocuments];
    updated[index] = { ...updated[index], [field]: value };
    setEmployeeDocuments(updated);
  };

  const handleDocumentFileChange = (index: number, file: File | null) => {
    updateDocument(index, 'file', file);
  };

  const handleCreate = async () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.name || !formData.email || !formData.phone) {
        addNotification('error', 'Please fill in all required fields (Name, Email, Phone)');
        return;
      }
      // Move to step 2
      setCurrentStep(2);
      return;
    }

    // Step 2 - Create employee
    if (!formData.password && rolesWithLoginAccess.includes(formData.role)) {
      addNotification('error', 'Password is required for this role');
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = { ...formData };

      // Remove empty password for updates
      if (editingEmployee && !submitData.password) {
        delete submitData.password;
      }

      const response = await createEmployee(submitData);

      if (response && response.success === true) {
        const employeeId = response.data?._id || response.data?.id;

        // Upload documents if any
        if (employeeId && employeeDocuments.length > 0) {
          try {
            for (const doc of employeeDocuments) {
              if (doc.file && doc.documentType) {
                const docFormData = new FormData();
                docFormData.append('employee', employeeId);
                docFormData.append('documentType', doc.documentType);
                docFormData.append('status', doc.status || 'valid');
                if (doc.documentNumber) docFormData.append('documentNumber', doc.documentNumber);
                if (doc.issueDate) docFormData.append('issueDate', doc.issueDate);
                if (doc.expiryDate) docFormData.append('expiryDate', doc.expiryDate);
                if (doc.description) docFormData.append('description', doc.description);
                docFormData.append('documentFile', doc.file);

                await createEmployeeDocument(docFormData);
              }
            }
          } catch (docError) {
            console.error('Error uploading documents:', docError);
            addNotification('error', 'Employee created but some documents failed to upload. Please add them manually.');
          }
        }

        addNotification('success', response.message || 'Employee created successfully');
        await fetchEmployees();
        setShowAddModal(false);
        resetForm();
      } else {
        let errorMessage = 'Failed to create employee';
        if (Array.isArray(response?.errors) && response.errors.length > 0) {
          const errorDetails = response.errors.map((e: any) => {
            const field = e.path || e.field || '';
            const msg = e.msg || e.message || '';
            return field ? `${field}: ${msg}` : msg;
          }).join('; ');
          errorMessage = errorDetails || response?.message || 'Validation failed';
        } else if (response?.message) {
          errorMessage = response.message;
        }
        addNotification('error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error creating employee:', error);
      let errorMessage = 'An unexpected error occurred';
      const errorData = error?.response?.data;
      if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
        const errorDetails = errorData.errors.map((e: any) => {
          const field = e.path || e.field || '';
          const msg = e.msg || e.message || '';
          return field ? `${field}: ${msg}` : msg;
        }).join('; ');
        errorMessage = errorDetails || errorData?.message || 'Validation failed';
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      addNotification('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingEmployee) return;

    if (currentStep === 1) {
      // Validate step 1
      if (!formData.name || !formData.email || !formData.phone) {
        addNotification('error', 'Please fill in all required fields (Name, Email, Phone)');
        return;
      }
      // Move to step 2
      setCurrentStep(2);
      return;
    }

    // Step 2 - Update employee and documents
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = { ...formData };

      // Remove empty password for updates
      if (!submitData.password) {
        delete submitData.password;
      }

      const response = await updateEmployee(editingEmployee._id, submitData);

      if (response && response.success === true) {
        // Update documents
        if (employeeDocuments.length > 0) {
          try {
            for (const doc of employeeDocuments) {
              if (doc._id) {
                // Update existing document
                if (doc.file || doc.documentType) {
                  const docFormData = new FormData();
                  docFormData.append('documentType', doc.documentType);
                  docFormData.append('status', doc.status || 'valid');
                  if (doc.documentNumber) docFormData.append('documentNumber', doc.documentNumber);
                  if (doc.issueDate) docFormData.append('issueDate', doc.issueDate);
                  if (doc.expiryDate) docFormData.append('expiryDate', doc.expiryDate);
                  if (doc.description) docFormData.append('description', doc.description);
                  if (doc.file) docFormData.append('documentFile', doc.file);

                  await updateEmployeeDocument(doc._id, docFormData);
                }
              } else if (doc.file && doc.documentType) {
                // Create new document
                const docFormData = new FormData();
                docFormData.append('employee', editingEmployee._id);
                docFormData.append('documentType', doc.documentType);
                docFormData.append('status', doc.status || 'valid');
                if (doc.documentNumber) docFormData.append('documentNumber', doc.documentNumber);
                if (doc.issueDate) docFormData.append('issueDate', doc.issueDate);
                if (doc.expiryDate) docFormData.append('expiryDate', doc.expiryDate);
                if (doc.description) docFormData.append('description', doc.description);
                docFormData.append('documentFile', doc.file);

                await createEmployeeDocument(docFormData);
              }
            }
          } catch (docError) {
            console.error('Error updating documents:', docError);
            addNotification('error', 'Employee updated but some documents failed to update. Please try again.');
          }
        }

        addNotification('success', response.message || 'Employee updated successfully');
        await fetchEmployees();
        setShowAddModal(false);
        resetForm();
      } else {
        let errorMessage = 'Failed to update employee';
        if (Array.isArray(response?.errors) && response.errors.length > 0) {
          const errorDetails = response.errors.map((e: any) => {
            const field = e.path || e.field || '';
            const msg = e.msg || e.message || '';
            return field ? `${field}: ${msg}` : msg;
          }).join('; ');
          errorMessage = errorDetails || response?.message || 'Validation failed';
        } else if (response?.message) {
          errorMessage = response.message;
        }
        addNotification('error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating employee:', error);
      let errorMessage = 'An unexpected error occurred';
      const errorData = error?.response?.data;
      if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
        const errorDetails = errorData.errors.map((e: any) => {
          const field = e.path || e.field || '';
          const msg = e.msg || e.message || '';
          return field ? `${field}: ${msg}` : msg;
        }).join('; ');
        errorMessage = errorDetails || errorData?.message || 'Validation failed';
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      addNotification('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      country: employee.country,
      role: employee.role,
      state: employee.state,
      city: employee.city,
      address: employee.location?.address || '',
      joinDate: employee.joinDate,
      internalId: employee.internalId,
      policies: employee.policies,
      password: ''
    });
    setCurrentStep(1);
    setShowAddModal(true);
    fetchEmployeeDocuments();
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ show: true, employeeId: id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.employeeId) return;

    try {
      const response = await deleteEmployee(deleteConfirm.employeeId);
      if (response.success) {
        addNotification('success', response.message || 'Employee deleted successfully');
        fetchEmployees();
      } else {
        const errorMessage = response?.message || response?.error?.message || 'Failed to delete employee';
        addNotification('error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      addNotification('error', error?.message || 'An unexpected error occurred while deleting employee');
    } finally {
      setDeleteConfirm({ show: false, employeeId: null });
    }
  };

  const handleStatusToggle = async (employee: Employee) => {
    try {
      const newStatus = employee.status === 'active' ? 'inactive' : 'active';
      const response = await updateEmployeeStatus(employee._id, newStatus);
      if (response.success) {
        addNotification('success', response.message || `Employee ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchEmployees();
      } else {
        const errorMessage = response?.message || response?.error?.message || 'Failed to update employee status';
        addNotification('error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating employee status:', error);
      addNotification('error', error?.message || 'An unexpected error occurred while updating employee status');
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    setFormData(prev => ({ ...prev, role }));
  };

  const handleRowClick = async (employee: Employee) => {
    try {
      // Fetch latest documents for the employee
      const docsResponse = await getDocumentsByEmployee(employee._id);
      if (docsResponse.success && Array.isArray(docsResponse.data)) {
        setSelectedEmployeeDetails({ ...employee, documents: docsResponse.data });
      } else {
        setSelectedEmployeeDetails({ ...employee, documents: [] });
      }
      setShowEmployeeDetails(true);
    } catch (error) {
      console.error('Error fetching employee documents:', error);
      setSelectedEmployeeDetails({ ...employee, documents: [] });
      setShowEmployeeDetails(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-3 h-3" />;
      case 'pending':
        return <AlertCircle className="w-3 h-3" />;
      case 'expired':
      case 'rejected':
        return <X className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex h-screen bg-[#EDF8FF] overflow-hidden">
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showAddModal ? 'mr-[800px]' : ''} overflow-hidden`}>
        <div className="flex-1  p-8" style={{ ...ACCENT_VARS, transform: 'scale(0.99)', transformOrigin: 'top left', width: '101.01%', height: '101.01%' }}>
          {/* Notifications Container */}
          <div className="fixed top-4 right-4 z-[10002] flex flex-col gap-3 max-w-md">
            {notifications.map(notification => (
              <Notification
                key={notification.id}
                notification={notification}
                onClose={removeNotification}
              />
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">All Employees ({employees.length})</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="px-4 py-2 !text-white rounded-lg transition-opacity flex items-center space-x-2 shadow-sm hover:opacity-90"
                style={{ backgroundImage: ACCENT_GRADIENT }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, ID, role, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                  style={focusRingStyle}
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                  style={
                    showFilterPanel
                      ? { backgroundColor: "rgba(1, 106, 178, 0.08)", borderColor: ACCENT_PRIMARY }
                      : undefined
                  }
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                  {(selectedRole || selectedStatus) && (
                    <span
                      className="ml-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      style={{ backgroundColor: ACCENT_PRIMARY }}
                    >
                      {(selectedRole ? 1 : 0) + (selectedStatus ? 1 : 0)}
                    </span>
                  )}
                </button>

                {showFilterPanel && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm"
                      onClick={() => setShowFilterPanel(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-800">Filter Employees</h3>
                        <button
                          onClick={() => setShowFilterPanel(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Role
                          </label>
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                            style={focusRingStyle}
                          >
                            <option value="">All Roles</option>
                            {roles.map(role => (
                              <option key={role} value={role}>
                                {getRoleDisplayName(role)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                            style={focusRingStyle}
                          >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setSelectedRole('');
                              setSelectedStatus('');
                              setShowFilterPanel(false);
                            }}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => setShowFilterPanel(false)}
                            className="flex-1 px-3 py-2 text-sm text-white rounded-lg hover:opacity-90"
                            style={{ backgroundImage: ACCENT_GRADIENT }}
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow">
            {/* Top Scrollbar - Only visible horizontal scrollbar */}
            <style>{`
              .top-scrollbar-container::-webkit-scrollbar {
                height: 8px;
              }
              .top-scrollbar-container::-webkit-scrollbar-track {
                background: #f7fafc;
              }
              .top-scrollbar-container::-webkit-scrollbar-thumb {
                background: #cbd5e0;
                border-radius: 4px;
              }
              .top-scrollbar-container::-webkit-scrollbar-thumb:hover {
                background: #a0aec0;
              }
              .table-container-hidden-scrollbar {
                scrollbar-width: none; /* Firefox */
                -ms-overflow-style: none; /* IE and Edge */
              }
              .table-container-hidden-scrollbar::-webkit-scrollbar {
                display: none; /* Chrome, Safari, Opera */
              }
            `}</style>
            <div
              ref={topScrollRef}
              className="overflow-x-auto overflow-y-hidden top-scrollbar-container"
              style={{
                maxHeight: '20px',
                marginBottom: '2px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e0 #f7fafc' /* Firefox */
              }}
            >
              <div className="top-scroll-content" style={{ height: '1px' }}></div>
            </div>
            {/* Main Table - Scrollbar hidden, controlled by top scrollbar */}
            <div
              ref={bottomScrollRef}
              className="overflow-x-auto overflow-y-visible table-container-hidden-scrollbar"
            >
              <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center text-gray-500">
                          <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                          Loading employees...
                        </div>
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee) => (
                      <tr
                        key={employee._id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(employee)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="font-mono text-sm px-2 py-1 rounded"
                            style={{
                              backgroundColor: `${ACCENT_PRIMARY}15`,
                              color: ACCENT_DARK
                            }}
                          >
                            {employee.internalId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                              style={{ background: ACCENT_GRADIENT }}
                            >
                              {employee.name?.charAt(0) || '?'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getRoleDisplayName(employee.role)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.country}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.city && employee.state ? `${employee.city}, ${employee.state}` : employee.location?.address || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusToggle(employee);
                            }}
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${employee.status === 'active'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                          >
                            {employee.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(employee.joinDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {employee.documents?.length || 0}
                            </span>
                            {employee.documents && employee.documents.length > 0 && (
                              <div className="text-xs text-gray-500">
                                ({employee.documents.filter(d => d.status === 'valid').length} valid)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(employee);
                              }}
                              style={{ color: ACCENT_PRIMARY }}
                              onMouseEnter={(e) => e.currentTarget.style.color = ACCENT_DARK}
                              onMouseLeave={(e) => e.currentTarget.style.color = ACCENT_PRIMARY}
                              className="transition-colors"
                              title="Edit Employee"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(employee._id);
                              }}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete Employee"
                            >
                              <Trash2 size={18} />
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
      </div>

      {/* Sidebar Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10001] flex justify-end">
          <div className="bg-white w-[800px] h-full shadow-2xl flex flex-col border-l border-gray-200">
            {/* Sidebar Header */}
            <div
              className="px-6 py-4 flex items-center justify-between shrink-0"
              style={{ backgroundImage: ACCENT_GRADIENT }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" style={{ color: ACCENT_PRIMARY }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                  </h2>
                  <p className="text-sm !text-white">
                    Fill in the employee details below
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicator */}
            {!editingEmployee ? (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white'
                        }`}>
                        {currentStep > 1 ? <CheckCircle size={16} className="text-blue-600" /> : '1'}
                      </div>
                      <span className="text-sm font-medium">Information</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                      <div
                        className={`h-full transition-all ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}
                        style={{ width: currentStep >= 2 ? '100%' : '0%' }}
                      />
                    </div>
                    <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 bg-white'
                        }`}>
                        2
                      </div>
                      <span className="text-sm font-medium">Documents</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    style={
                      currentStep === 1
                        ? {
                          background: ACCENT_GRADIENT,
                        }
                        : undefined
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentStep === 1
                      ? '!text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    Information
                  </button>

                  <button
                    onClick={() => setCurrentStep(2)}
                    style={
                      currentStep === 2
                        ? {
                          background: ACCENT_GRADIENT,
                        }
                        : undefined
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentStep === 2
                      ? '!text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    Documents ({employeeDocuments.length})
                  </button>
                </div>
              </div>
            )}

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {currentStep === 2 ? (
                /* Step 2: Employee Documents */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 font-semibold" style={{ color: ACCENT_PRIMARY }}>
                      <FileText size={18} />
                      <span>Employee Documents</span>
                    </div>
                    <button
                      onClick={addDocument}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Document
                    </button>
                  </div>

                  {employeeDocuments.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">No documents added yet</p>
                      <p className="text-sm text-gray-500 mb-4">Click "Add Document" to upload employee documents</p>
                      <button
                        onClick={addDocument}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        style={{ backgroundImage: ACCENT_GRADIENT }}
                      >
                        Add First Document
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employeeDocuments.map((doc, index) => (
                        <div key={doc._id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-700">Document {index + 1}</h4>
                              {doc._id && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Existing</span>
                              )}
                            </div>
                            <button
                              onClick={() => removeDocument(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Document Type <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={doc.documentType}
                                onChange={(e) => updateDocument(index, 'documentType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Document Type</option>
                                {EMPLOYEE_DOCUMENT_TYPES.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                                <input
                                  type="text"
                                  value={doc.documentNumber}
                                  onChange={(e) => updateDocument(index, 'documentNumber', e.target.value)}
                                  placeholder="e.g., DOC-123456"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                  value={doc.status}
                                  onChange={(e) => updateDocument(index, 'status', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="valid">Valid</option>
                                  <option value="pending">Pending</option>
                                  <option value="expired">Expired</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                                <input
                                  type="date"
                                  value={doc.issueDate}
                                  onChange={(e) => updateDocument(index, 'issueDate', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                <input
                                  type="date"
                                  value={doc.expiryDate}
                                  onChange={(e) => updateDocument(index, 'expiryDate', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                value={doc.description}
                                onChange={(e) => updateDocument(index, 'description', e.target.value)}
                                rows={2}
                                placeholder="Enter document description or notes..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Document File {!doc._id && <span className="text-red-500">*</span>}
                              </label>
                              <input
                                type="file"
                                onChange={(e) => handleDocumentFileChange(index, e.target.files?.[0] || null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                              />
                              {doc.file && (
                                <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                                  <CheckCircle size={12} />
                                  Selected: {doc.file.name}
                                </p>
                              )}
                              {doc._id && !doc.file && (
                                <p className="text-xs mt-1 text-gray-500">
                                  Leave empty to keep existing file
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Step 1: Employee Information */
                <>
                  {/* Basic Employee Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <User className="w-5 h-5" style={{ color: ACCENT_PRIMARY }} />
                      <span>Basic Information</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter full name"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleRoleChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select role</option>
                          {roles.map(role => (
                            <option key={role} value={role}>{getRoleDisplayName(role)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Internal ID {rolesWithLoginAccess.includes(formData.role) && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          name="internalId"
                          value={formData.internalId}
                          onChange={handleInputChange}
                          required={rolesWithLoginAccess.includes(formData.role)}
                          placeholder="EMP-001"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {!rolesWithLoginAccess.includes(formData.role) && (
                          <p className="text-xs text-gray-500 mt-1">Not required for this role</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          placeholder="United States"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Join Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="joinDate"
                          value={formData.joinDate}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {!rolesWithoutLoginAccess.includes(formData.role) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password {!editingEmployee && rolesWithLoginAccess.includes(formData.role) && <span className="text-red-500">*</span>}
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              required={!editingEmployee && rolesWithLoginAccess.includes(formData.role)}
                              placeholder={editingEmployee ? "Leave empty to keep current password" : rolesWithLoginAccess.includes(formData.role) ? "Leave empty for default password" : "Not required for this role"}
                              className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {editingEmployee && (
                            <p className="text-xs text-gray-500 mt-1">Leave empty to keep the current password unchanged</p>
                          )}
                          {!rolesWithLoginAccess.includes(formData.role) && (
                            <p className="text-xs text-gray-500 mt-1">Password not required for this role</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <span>Contact Information</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="employee@company.com"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 234-567-8900"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="California"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Los Angeles"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter complete address"
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-blue-500" />
                      <span>Additional Information</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Policies
                        </label>
                        <textarea
                          name="policies"
                          value={formData.policies}
                          onChange={handleInputChange}
                          placeholder="Enter company policies or additional notes"
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200 shrink-0">
              {!editingEmployee && currentStep === 2 ? (
                <>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isSubmitting}
                    style={{ backgroundColor: isSubmitting ? '#9CA3AF' : ACCENT_PRIMARY }}
                    className="flex-1 !text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {isSubmitting ? 'Creating...' : 'Create Employee'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2.5 border border-gray-300 !mr-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  {!editingEmployee ? (
                    <button
                      onClick={handleCreate}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 !text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-md hover:shadow-lg"
                      style={{ backgroundImage: ACCENT_GRADIENT }}
                    >
                      Next
                      <ChevronRight size={18} className="inline ml-2" />
                    </button>
                  ) : (
                    <>
                      {currentStep === 1 ? (
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="px-6 py-2.5 !text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                          style={{ backgroundImage: ACCENT_GRADIENT }}
                        >
                          Next
                          <ChevronRight size={18} />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setCurrentStep(1)}
                            className="px-6 py-2.5 border border-gray-300 !mr-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
                          >
                            <ChevronLeft size={18} />
                            Back
                          </button>
                          <button
                            onClick={handleUpdate}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 !text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                            style={{ backgroundImage: ACCENT_GRADIENT }}
                          >
                            <Save size={18} />
                            {isSubmitting ? 'Updating...' : 'Update Employee'}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {showEmployeeDetails && selectedEmployeeDetails && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: ACCENT_GRADIENT }}
                >
                  {selectedEmployeeDetails.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEmployeeDetails.name}</h2>
                  <p className="text-sm text-gray-500">{selectedEmployeeDetails.internalId}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEmployeeDetails(false);
                  setSelectedEmployeeDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Employee Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" style={{ color: ACCENT_PRIMARY }} />
                  <span>Employee Information</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Role</p>
                    <p className="text-sm font-medium text-gray-900">{getRoleDisplayName(selectedEmployeeDetails.role)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedEmployeeDetails.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {selectedEmployeeDetails.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">{selectedEmployeeDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{selectedEmployeeDetails.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Country</p>
                    <p className="text-sm font-medium text-gray-900">{selectedEmployeeDetails.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedEmployeeDetails.city && selectedEmployeeDetails.state
                        ? `${selectedEmployeeDetails.city}, ${selectedEmployeeDetails.state}`
                        : selectedEmployeeDetails.location?.address || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Join Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedEmployeeDetails.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedEmployeeDetails.location?.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Address</p>
                      <p className="text-sm font-medium text-gray-900">{selectedEmployeeDetails.location.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" style={{ color: ACCENT_PRIMARY }} />
                  <span>Documents ({selectedEmployeeDetails.documents?.length || 0})</span>
                </h3>
                {!selectedEmployeeDetails.documents || selectedEmployeeDetails.documents.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No documents uploaded for this employee</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Document Type</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Document Number</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Issue Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">File Size</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedEmployeeDetails.documents.map((doc: EmployeeDocument, index: number) => (
                          <tr key={doc._id || index} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-800">{doc.documentType}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                                {getStatusIcon(doc.status)}
                                <span className="capitalize">{doc.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">{doc.documentNumber || '-'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm ${!doc.expiryDate ? 'text-gray-400' : 'text-gray-600'}`}>
                                {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {doc.fileSize ? formatFileSize(doc.fileSize) : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {doc.fileUrl && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        const signedRes = await getSignedEmployeeDocumentUrl(doc._id, 'attachment');
                                        const url = signedRes?.success && signedRes?.url ? signedRes.url : doc.fileUrl;
                                        const link = window.document.createElement('a');
                                        link.href = url || '';
                                        link.download = doc.fileName || 'document';
                                        link.target = '_blank';
                                        window.document.body.appendChild(link);
                                        link.click();
                                        window.document.body.removeChild(link);
                                      } catch (error) {
                                        console.error('Download error:', error);
                                        addNotification('error', 'Download failed. Please try again.');
                                      }
                                    }}
                                    className="p-1.5 hover:bg-green-50 rounded text-green-600"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const signedRes = await getSignedEmployeeDocumentUrl(doc._id, 'inline');
                                      const url = signedRes?.success && signedRes?.url ? signedRes.url : doc.fileUrl;
                                      if (url) {
                                        window.open(url, '_blank', 'noopener,noreferrer');
                                      }
                                    } catch (error) {
                                      console.error('View error:', error);
                                      addNotification('error', 'Failed to open document. Please try again.');
                                    }
                                  }}
                                  className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEmployeeDetails(false);
                  setSelectedEmployeeDetails(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Delete</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this employee? This action cannot be undone.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteConfirm({ show: false, employeeId: null })}
                  className="px-6 py-3 !mr-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 !text-white rounded-lg transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EmployeesPage;
