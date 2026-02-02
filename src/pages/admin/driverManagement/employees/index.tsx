import { useState, useEffect, useRef } from 'react';
import { Plus, Info, ChevronUp, ChevronDown, X, User, FileText, Upload, Edit, Trash2, Save } from 'lucide-react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import * as employeeApi from '../../../../axios/api/employee';
import { getDocumentsByEmployee, updateEmployeeDocument, deleteEmployeeDocument } from '../../../../axios/api/employeeDocument';
import AddressSearch from '../../../../components/common/AddressSearch';

interface Employee {
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  status: 'active' | 'inactive' | 'ACTIVE' | 'INACTIVE';
  profileImageUrl?: string;
  phone?: string;
  profileImage?: string; // Alternative field name
}

interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'warning';
  message: string;
}

const ToastNotificationComponent = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationTriangle className="text-red-500" size={24} />,
    warning: <FaExclamationTriangle className="text-yellow-500" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 6000); // 6 seconds for validation errors
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`fixed top-4 right-4 flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg z-[10003] ${bgColors[notification.type]} min-w-[320px] max-w-[520px] animate-slide-in`}>
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

// Current roles from the system
const roleBadges = [
  'DISPATCH',
  'HR',
  'FLEET MAINTENANCE MANAGER',
  'COMPLIANCE MANAGER',
  'SAFETY OFFICER',
  'REPORTER',
  'MAINTENANCE CREW (MECHANICS)',
  'OPERATOR'
];

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'nonSignin' | 'advanced'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('All');
  const [sortBy, setSortBy] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });

  // Modal state
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'personal' | 'documents' | 'notes'>('basic');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<{
    expiryDate: string;
    description: string;
    ignoreExpiration: boolean;
    file: File | null;
  } | null>(null);

  // Form state for Basic Information
  const [basicData, setBasicData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    status: '',
    role: ''
  });

  // Form state for Personal Information
  const [personalData, setPersonalData] = useState({
    title: '',
    payType: '',
    payRate: '',
    vacationPay: '',
    department: '',
    jobType: '',
    jobTime: 'FULL-TIME' as 'FULL-TIME' | 'PART-TIME',
    phone: '', // Store phone without country code prefix
    searchAddress: '',
    address: '',
    hireDate: '',
    terminationDate: ''
  });

  // Country selector state for phone
  interface Country {
    name: string;
    code: string;
    flag: string;
    dialCode: string;
  }

  const [countries, setCountries] = useState<Country[]>([]);
  const [phoneCountry, setPhoneCountry] = useState<string>('US');
  const [phoneCountryDropdownOpen, setPhoneCountryDropdownOpen] = useState(false);
  const [phoneCountrySearch, setPhoneCountrySearch] = useState('');
  const phoneCountryDropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to parse phone number and extract country code
  const parsePhoneNumber = (phone: string | undefined | null, countriesList: Country[] = countries): { countryCode: string; phoneNumber: string } => {
    if (!phone) return { countryCode: 'US', phoneNumber: '' };

    const cleanPhone = phone.trim();
    const sortedCountries = [...countriesList].sort((a, b) => b.dialCode.length - a.dialCode.length);

    for (const country of sortedCountries) {
      if (cleanPhone.startsWith(country.dialCode)) {
        return {
          countryCode: country.code,
          phoneNumber: cleanPhone.substring(country.dialCode.length).trim()
        };
      }
    }

    return { countryCode: 'US', phoneNumber: cleanPhone.replace(/^\+1/, '').trim() };
  };

  // Fetch countries data
  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,flag,idd,cca2')
      .then(res => res.json())
      .then(data => {
        const sortedCountries = data
          .filter((c: any) => c.idd && c.idd.root)
          .map((c: any) => ({
            name: c.name.common,
            code: c.cca2,
            flag: c.flag,
            dialCode: c.idd.root + (c.idd.suffixes ? c.idd.suffixes[0] : ''),
          }))
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

        setCountries(sortedCountries);
        const defaultCountry = sortedCountries.find((c: Country) => c.code === 'US');
        if (defaultCountry) {
          setPhoneCountry('US');
        }
      })
      .catch(() => {
        const fallback = [
          { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1' },
          { name: 'Canada', code: 'CA', flag: '🇨🇦', dialCode: '+1' },
          { name: 'India', code: 'IN', flag: '🇮🇳', dialCode: '+91' },
          { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dialCode: '+44' },
          { name: 'Australia', code: 'AU', flag: '🇦🇺', dialCode: '+61' },
        ];
        setCountries(fallback);
        setPhoneCountry('US');
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (phoneCountryDropdownRef.current && !phoneCountryDropdownRef.current.contains(event.target as Node)) {
        setPhoneCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Form state for Documents
  const [documents, setDocuments] = useState<Array<{
    id: string;
    _id?: string; // For existing documents from API
    expiryDate: string;
    description: string;
    file: File | null;
    fileUrl?: string; // For existing documents
    fileName?: string; // For existing documents
    ignoreExpiration: boolean;
    documentType?: string; // For existing documents
    isExisting?: boolean; // Flag to identify existing documents
  }>>([]);
  const [newDocument, setNewDocument] = useState({
    expiryDate: '',
    description: '',
    file: null as File | null,
    ignoreExpiration: false
  });

  // Form state for Notes / Benefits
  const [notesBenefits, setNotesBenefits] = useState('');

  // Toast notifications state
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const closeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Delete confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; employeeId: string | null; employeeName: string }>({
    show: false,
    employeeId: null,
    employeeName: ''
  });

  // Departments list
  const departments = [
    'Driver Management / Human Resources',
    'Safety & Compliance Department',
    'Fleet Maintenance & Repair',
    'Logistics & Load Planning',
    'Accounting & Finance',
    'Customer Service / Client Relations',
    'Information Technology (IT)',
    'Business Development / Sales',
    'Legal & Risk Management',
    'Training & Development',
    'Operations',
    'Claims & Insurance',
    'Fuel & IFTA Management'
  ];

  // Roles list
  const roles = [
    'dispatcher',
    'hr',
    'reporter',
    'Fleet Maintenance Manager',
    'Compliance Manager',
    'Maintenance Crew (Mechanics)',
    'safety officer',
    'operator'
  ];

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const hasRole = activeTab === 'advanced' ? 'true' : activeTab === 'nonSignin' ? 'false' : undefined;
      const status = filterBy === 'All' ? undefined : filterBy.toLowerCase();

      const response = await employeeApi.getAllEmployees(
        1,
        1000,
        searchTerm || undefined,
        undefined,
        status,
        sortBy || undefined,
        sortConfig.direction || undefined,
        hasRole
      );

      if (response?.success && response.data) {
        // Parse name into firstName and lastName
        const employeesWithNames = response.data.map((emp: any) => {
          const nameParts = (emp.name || '').split(' ');
          return {
            ...emp,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            status: emp.status?.toUpperCase() || 'ACTIVE',
            profileImageUrl: emp.profileImageUrl || emp.profileImage || null
          };
        });
        setEmployees(employeesWithNames);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [activeTab, filterBy, searchTerm, sortBy, sortConfig]);

  // Filter employees based on search
  const getFilteredEmployees = () => {
    let filtered = [...employees];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        (emp.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = (a as any)[sortConfig.key!] || '';
        const bValue = (b as any)[sortConfig.key!] || '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setSortBy(key);
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return (
        <div className="flex flex-col">
          <ChevronUp className="w-3 h-3 text-gray-400" />
          <ChevronDown className="w-3 h-3 text-gray-400 -mt-1" />
        </div>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-gray-700" />
    ) : (
      <ChevronDown className="w-3 h-3 text-gray-700" />
    );
  };

  const getRoleDisplayName = (role?: string) => {
    if (!role) return 'No Role';
    // Map current roles to display names
    const roleMap: { [key: string]: string } = {
      'dispatcher': 'Dispatch',
      'hr': 'HR',
      'Fleet Maintenance Manager': 'Fleet Maintenance Manager',
      'Compliance Manager': 'Compliance Manager',
      'safety officer': 'Safety Officer',
      'reporter': 'Reporter',
      'Maintenance Crew (Mechanics)': 'Maintenance Crew (Mechanics)'
    };
    return roleMap[role.toLowerCase()] || role;
  };

  // Handle save employee
  const handleSaveEmployee = async () => {
    // Client-side validation
    if (!basicData.firstName || !basicData.lastName || !basicData.email) {
      showNotification('error', 'Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    // Validate name format (only letters and spaces)
    const fullName = `${basicData.firstName} ${basicData.lastName}`.trim();
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(fullName)) {
      showNotification('error', 'Name can only contain letters and spaces (no numbers or special characters)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(basicData.email)) {
      showNotification('error', 'Please provide a valid email address');
      return;
    }

    // Validate phone number if provided (minimum 10 digits)
    if (personalData.phone && personalData.phone.trim()) {
      const phoneDigits = personalData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        showNotification('error', 'Please provide a valid phone number (minimum 10 digits)');
        return;
      }
    }

    // Check if password is required for this role
    const nonSigninRoles = ['reporter', 'Maintenance Crew (Mechanics)', 'operator'];
    const isNonSigninRole = nonSigninRoles.includes(basicData.role);
    
    if (!isNonSigninRole && !editingId && !basicData.password) {
      showNotification('error', 'Password is required for this role');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Basic data - always include required fields
      formData.append('name', `${basicData.firstName} ${basicData.lastName}`.trim());
      formData.append('email', basicData.email);
      
      // Only include password if it's provided or if it's a non-signin role
      if (basicData.password) {
        formData.append('password', basicData.password);
      } else if (isNonSigninRole) {
        // For non-signin roles, send a placeholder password if none provided
        formData.append('password', 'NonSignin123!');
      } else {
        // Default password if somehow we get here
        formData.append('password', 'TempPassword123!');
      }
      
      formData.append('status', basicData.status.toLowerCase());
      if (basicData.role) formData.append('role', basicData.role);

      // Personal data - include all fields (even if empty)
      // Phone - include country code prefix
      if (personalData.phone) {
        const phoneCountryObj = countries.find(c => c.code === phoneCountry);
        if (phoneCountryObj) {
          // Remove + from dial code for comparison
          const dialCodeWithoutPlus = phoneCountryObj.dialCode.replace('+', '');
          let phoneNumber = personalData.phone.trim();

          // Remove any existing + prefix
          if (phoneNumber.startsWith('+')) {
            phoneNumber = phoneNumber.substring(1);
          }

          // Check if phone number already starts with the dial code (without +)
          if (phoneNumber.startsWith(dialCodeWithoutPlus)) {
            // Phone already includes dial code, just add + prefix
            formData.append('phone', `+${phoneNumber}`);
          } else {
            // Phone doesn't start with dial code, prepend it
            formData.append('phone', `${phoneCountryObj.dialCode}${phoneNumber}`);
          }
        } else {
          // Fallback if country not found - add + if not present
          const phoneValue = personalData.phone.startsWith('+') ? personalData.phone : `+${personalData.phone}`;
          formData.append('phone', phoneValue);
        }
      }
      if (personalData.address) {
        formData.append('address', personalData.address);
      }
      if (personalData.hireDate) {
        formData.append('hireDate', personalData.hireDate);
      }
      if (personalData.terminationDate) {
        formData.append('termDate', personalData.terminationDate);
      }

      // Additional personal data fields
      if (personalData.title) {
        formData.append('title', personalData.title);
      }
      if (personalData.payType) {
        formData.append('payType', personalData.payType);
      }
      if (personalData.payRate) {
        formData.append('payRate', personalData.payRate);
      }
      if (personalData.vacationPay) {
        formData.append('vacationPay', personalData.vacationPay);
      }
      if (personalData.department) {
        formData.append('department', personalData.department);
      }
      if (personalData.jobType) {
        formData.append('jobType', personalData.jobType);
      }
      if (personalData.jobTime) {
        formData.append('jobTime', personalData.jobTime);
      }

      // Documents - send as JSON array and files
      if (documents && documents.length > 0) {
        const documentsData = documents.map(doc => ({
          id: doc.id,
          _id: doc._id || '',
          expiryDate: doc.expiryDate || '',
          description: doc.description || '',
          ignoreExpiration: doc.ignoreExpiration || false,
          documentType: doc.documentType || 'Other',
          hasFile: !!doc.file,
          isExisting: doc.isExisting || false
        }));
        formData.append('documents', JSON.stringify(documentsData));

        // Append document files (only new files, not existing ones)
        const newDocuments = documents.filter(doc => !doc.isExisting && doc.file);
        newDocuments.forEach((doc) => {
          if (doc.file) {
            formData.append('documentFiles', doc.file);
            console.log(`📎 Appending document file: ${doc.file.name} (${(doc.file.size / 1024).toFixed(2)} KB)`);
          }
        });
        console.log(`📄 Total documents: ${documents.length}, New files: ${newDocuments.length}`);
      }

      // Notes / Benefits - send as text
      if (notesBenefits && notesBenefits.trim()) {
        formData.append('notes', notesBenefits.trim());
      }

      // Profile image
      if (profileImage) {
        formData.append('file', profileImage);
      }

      let response;
      let employeeId = editingId; // Use editingId for updates

      console.log('🔄 Saving employee:', editingId ? `Update (ID: ${editingId})` : 'Create new');
      if (editingId) {
        response = await employeeApi.updateEmployee(editingId, formData);
        employeeId = editingId; // Ensure employeeId is set for updates
      } else {
        response = await employeeApi.createEmployee(formData);
        employeeId = response?.data?._id || response?.data?.id;
        console.log('✅ Employee created with ID:', employeeId);
      }

      if (response?.success) {
        console.log('✅ Employee saved successfully, employeeId:', employeeId);
        console.log('✅ Documents were included in the employee creation/update request');

        showNotification('success', `Employee ${editingId ? 'updated' : 'created'} successfully!`);
        setShowNewEmployeeModal(false);
        resetForm();
        fetchEmployees();
      } else {
        // Handle validation errors from backend
        if (response?.errors && Array.isArray(response.errors)) {
          // Show each validation error
          response.errors.forEach((error: any, index: number) => {
            setTimeout(() => {
              showNotification('error', error.msg || error.message || 'Validation error');
            }, index * 100); // Stagger notifications slightly
          });
        } else {
          showNotification('error', response?.message || `Failed to ${editingId ? 'update' : 'create'} employee`);
        }
      }
    } catch (error: any) {
      console.error(`Error ${editingId ? 'updating' : 'creating'} employee:`, error);
      
      // Handle validation errors from catch block
      const errorData = error.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Show each validation error
        errorData.errors.forEach((err: any, index: number) => {
          setTimeout(() => {
            showNotification('error', err.msg || err.message || 'Validation error');
          }, index * 100); // Stagger notifications slightly
        });
      } else {
        showNotification('error', errorData?.message || error.message || `Failed to ${editingId ? 'update' : 'create'} employee`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setBasicData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      status: '',
      role: ''
    });
    setPersonalData({
      title: '',
      payType: '',
      payRate: '',
      vacationPay: '',
      department: '',
      jobType: '',
      jobTime: 'FULL-TIME',
      phone: '',
      searchAddress: '',
      address: '',
      hireDate: '',
      terminationDate: ''
    });
    setDocuments([]);
    setNewDocument({
      expiryDate: '',
      description: '',
      file: null,
      ignoreExpiration: false
    });
    setNotesBenefits('');
    setProfileImage(null);
    setProfileImagePreview(null);
    setEditingId(null);
    setEditingDocumentId(null);
    setEditingDocument(null);
    setActiveFormTab('basic');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseModal = () => {
    setShowNewEmployeeModal(false);
    resetForm();
  };

  const loadEmployeeForEdit = async (id: string) => {
    try {
      const response = await employeeApi.getEmployeeById(id);
      if (response?.success && response.data) {
        const emp = response.data;
        console.log('📋 Loading employee for edit:', emp);
        console.log('📋 Employee details:', emp.details);

        const nameParts = (emp.name || '').split(' ');
        setBasicData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: emp.email || '',
          password: '', // Don't pre-fill password
          status: emp.status || 'active',
          role: emp.role || ''
        });
        // Parse phone number to extract country code and phone number
        const parsedPhone = parsePhoneNumber(emp.phone || '', countries);
        setPhoneCountry(parsedPhone.countryCode);

        // Load personal data - check both top-level and details object
        const personalDataToSet = {
          title: emp.details?.title || emp.title || '',
          payType: emp.details?.payType || emp.payType || '',
          payRate: emp.details?.payRate || emp.payRate || '',
          vacationPay: emp.details?.vacationPay || emp.vacationPay || '',
          department: emp.details?.department || emp.department || '',
          jobType: emp.details?.jobType || emp.jobType || '',
          jobTime: (emp.details?.jobTime || emp.jobTime || 'FULL-TIME') as 'FULL-TIME' | 'PART-TIME',
          phone: parsedPhone.phoneNumber || '',
          searchAddress: '',
          address: emp.location?.address || emp.address || '',
          hireDate: emp.joinDate ? new Date(emp.joinDate).toISOString().split('T')[0] : (emp.details?.hireDate ? new Date(emp.details.hireDate).toISOString().split('T')[0] : ''),
          terminationDate: emp.details?.termDate ? new Date(emp.details.termDate).toISOString().split('T')[0] : ''
        };

        console.log('📋 Personal data to set:', personalDataToSet);
        setPersonalData(personalDataToSet);
        if (emp.profileImageUrl) {
          setProfileImagePreview(emp.profileImageUrl);
        }

        // Load notes/benefits
        setNotesBenefits(emp.notes || emp.details?.notes || '');

        // Fetch existing documents - always fetch fresh data
        try {
          console.log('🔄 Fetching documents for employee:', id);
          const documentsResponse = await getDocumentsByEmployee(id);
          console.log('📄 Documents response:', documentsResponse);

          if (documentsResponse?.success && documentsResponse.data && Array.isArray(documentsResponse.data)) {
            const existingDocs = documentsResponse.data.map((doc: any) => ({
              id: doc._id || Date.now().toString(),
              _id: doc._id,
              expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : '',
              description: doc.description || doc.documentType || '',
              file: null,
              fileUrl: doc.fileUrl,
              fileName: doc.fileName,
              ignoreExpiration: doc.ignoreExpiration || false,
              documentType: doc.documentType,
              isExisting: true
            }));
            setDocuments(existingDocs);
            console.log('✅ Loaded', existingDocs.length, 'existing documents for employee');
          } else {
            setDocuments([]);
            console.log('ℹ️ No documents found for employee');
          }
        } catch (docError) {
          console.error('❌ Error loading employee documents:', docError);
          setDocuments([]); // Set empty array if documents fail to load
        }

        setShowNewEmployeeModal(true);
      }
    } catch (error) {
      console.error('Error loading employee for edit:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.employeeId) return;
    
    try {
      const response = await employeeApi.deleteEmployee(deleteConfirmation.employeeId);
      if (response?.success) {
        showNotification('success', 'Employee deleted successfully!');
        setDeleteConfirmation({ show: false, employeeId: null, employeeName: '' });
        fetchEmployees();
      } else {
        showNotification('error', response?.message || 'Failed to delete employee');
      }
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      showNotification('error', error.response?.data?.message || error.message || 'Failed to delete employee');
    }
  };

  return (
    <div className="min-h-screen bg-[#EDF8FF] p-6">
      {/* Toast Notifications */}
      {notifications.map(notification => (
        <ToastNotificationComponent
          key={notification.id}
          notification={notification}
          onClose={closeNotification}
        />
      ))}

      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-700">({filteredEmployees.length})</span>
              <button
                onClick={() => setShowNewEmployeeModal(true)}
                className="w-10 h-10 bg-[#42aeec] !text-white rounded-lg flex items-center justify-center hover:bg-[#1db5f5] transition-colors shadow-md"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'users'
                  ? 'text-[#42aeec] border-b-2 border-[#42aeec] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('nonSignin')}
              className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'nonSignin'
                  ? 'text-[#42aeec] border-b-2 border-[#42aeec] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Non Signin Employees
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'advanced'
                  ? 'text-[#42aeec] border-b-2 border-[#42aeec] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Advanced Permissions
            </button>
          </div>
        </div>

        {/* User Roles & Permissions Section */}
        {activeTab === 'users' && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">User Roles & Permissions</h2>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {roleBadges.map((role, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full"
                >
                  {role}
                </span>
              ))}
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Hover over role badges to see permissions. Salesperson users are automatically redirected to dispatch and see only their assigned loads.
            </p>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <input
              type="text"
              placeholder="Employees Name or Email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
            />

          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter By:</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  if (e.target.value) {
                    handleSort(e.target.value as keyof Employee);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="firstName">First Name</option>
                <option value="lastName">Last Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Image
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('firstName')}
                  >
                    <div className="flex items-center gap-2">
                      First Name
                      {getSortIcon('firstName')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastName')}
                  >
                    <div className="flex items-center gap-2">
                      Last Name
                      {getSortIcon('lastName')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      {getSortIcon('email')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-2">
                      Role
                      {getSortIcon('role')}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <tr
                      key={employee._id || index}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (employee._id) {
                          setEditingId(employee._id);
                          loadEmployeeForEdit(employee._id);
                          setShowNewEmployeeModal(true);
                        }
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          {employee.profileImageUrl || employee.profileImage ? (
                            <img
                              src={employee.profileImageUrl || employee.profileImage}
                              alt={`${employee.firstName || ''} ${employee.lastName || ''}`}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                // If image fails to load, show placeholder
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = target.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200 ${employee.profileImageUrl || employee.profileImage ? 'hidden' : ''}`}
                          >
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{employee.firstName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{employee.lastName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{employee.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{getRoleDisplayName(employee.role)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${(employee.status === 'ACTIVE' || employee.status === 'active')
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click from triggering
                              if (employee._id) {
                                setEditingId(employee._id);
                                // Load employee data for editing
                                loadEmployeeForEdit(employee._id);
                                setShowNewEmployeeModal(true);
                              }
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Employee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click from triggering
                              if (employee._id) {
                                setDeleteConfirmation({
                                  show: true,
                                  employeeId: employee._id,
                                  employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email
                                });
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Non Signin Employees and Advanced Permissions use the same table */}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Delete Employee</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this employee?
              </p>
              <p className="text-gray-900 font-semibold">
                {deleteConfirmation.employeeName}
              </p>
              <p className="text-sm text-red-600 mt-4">
                This action cannot be undone.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmation({ show: false, employeeId: null, employeeName: '' })}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-600 !text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Employee Modal */}
      {showNewEmployeeModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewEmployeeModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
              {/* Image Upload Area */}
              <div className="p-4 border-b border-gray-200">
                <div
                  className="border-2 border-dashed border-gray-300 p-8 text-center mb-3 cursor-pointer hover:border-[#42aeec] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile preview" className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Select Image</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (20MB max)
                      if (file.size > 20 * 1024 * 1024) {
                        alert('File size must be less than 20MB');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                        return;
                      }
                      setProfileImage(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProfileImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-black !text-white py-2 font-medium hover:bg-gray-800 transition-colors"
                >
                  {profileImage ? 'CHANGE IMAGE' : 'UPLOAD IMAGE'}
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex-1 overflow-y-auto p-4">
                <nav className="flex flex-col gap-2">
                  {[
                    { id: 'basic', label: 'Basic', icon: User },
                    { id: 'personal', label: 'Personal Information', icon: User },
                    { id: 'documents', label: 'Documents', icon: FileText },
                    { id: 'notes', label: 'Notes / Benefits', icon: FileText }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeFormTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveFormTab(tab.id as any)}
                        className={`w-full flex items-center gap-2 px-3 py-2 transition-colors text-left ${isActive
                            ? 'bg-[#0ea3d8] !text-white shadow-md'
                            : 'bg-gray-700 !text-white hover:bg-gray-600'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium text-center">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Employee' : 'New Employee'}</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveEmployee}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gray-600 !text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? 'SAVING...' : editingId ? 'UPDATE' : 'SAVE'}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-white">
                {activeFormTab === 'basic' && (
                  <div className="space-y-6 max-w-full">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>

                    {/* First Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="First Name"
                          value={basicData.firstName}
                          onChange={(e) => setBasicData({ ...basicData, firstName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={basicData.lastName}
                          onChange={(e) => setBasicData({ ...basicData, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="Email"
                          value={basicData.email}
                          onChange={(e) => setBasicData({ ...basicData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      {/* Only show password field for roles that require sign-in */}
                      {!['reporter', 'Maintenance Crew (Mechanics)', 'operator'].includes(basicData.role) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password{!editingId && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="password"
                            placeholder="Password"
                            value={basicData.password}
                            onChange={(e) => setBasicData({ ...basicData, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>

                    {/* Second Row */}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status<span className="text-red-500">*</span>
                        </label>
                        <select
                          value={basicData.status}
                          onChange={(e) => setBasicData({ ...basicData, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role<span className="text-red-500">*</span>
                        </label>
                        <select
                          value={basicData.role}
                          onChange={(e) => setBasicData({ ...basicData, role: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
                          {roles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div></div>
                      <button
                        onClick={() => setActiveFormTab('personal')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        Personal Information <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeFormTab === 'personal' && (
                  <div className="space-y-6 max-w-full">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>

                    {/* First Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          placeholder="Title"
                          value={personalData.title}
                          onChange={(e) => setPersonalData({ ...personalData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pay Type</label>
                        <select
                          value={personalData.payType}
                          onChange={(e) => setPersonalData({ ...personalData, payType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
                          <option value="Hourly">Hourly</option>
                          <option value="Salary">Weekly</option>
                          <option value="Commission">Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pay Rate <span className="text-gray-500 text-xs font-normal">(per hour)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={personalData.payRate}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow empty, numbers, and one decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setPersonalData({ ...personalData, payRate: value });
                              }
                            }}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vacation Pay %</label>
                        <input
                          type="text"
                          placeholder="Vacation Pay %"
                          value={personalData.vacationPay}
                          onChange={(e) => setPersonalData({ ...personalData, vacationPay: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Second Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                          value={personalData.department}
                          onChange={(e) => setPersonalData({ ...personalData, department: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                        <input
                          type="text"
                          placeholder="Job Type"
                          value={personalData.jobType}
                          onChange={(e) => setPersonalData({ ...personalData, jobType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Time</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPersonalData({ ...personalData, jobTime: 'FULL-TIME' })}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${personalData.jobTime === 'FULL-TIME'
                                ? 'bg-gray-700 !text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            FULL-TIME
                          </button>
                          <button
                            type="button"
                            onClick={() => setPersonalData({ ...personalData, jobTime: 'PART-TIME' })}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${personalData.jobTime === 'PART-TIME'
                                ? 'bg-gray-700 !text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            PART-TIME
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone #</label>
                        <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#42aeec] focus-within:border-transparent">
                          <div className="relative" ref={phoneCountryDropdownRef}>
                            <button
                              type="button"
                              onClick={() => {
                                setPhoneCountryDropdownOpen(!phoneCountryDropdownOpen);
                                if (!phoneCountryDropdownOpen) {
                                  setPhoneCountrySearch('');
                                }
                              }}
                              className="flex items-center gap-1.5 px-2 py-2 text-sm bg-white border-none outline-none cursor-pointer h-full"
                              style={{ minWidth: '85px' }}
                            >
                              {countries.find(c => c.code === phoneCountry) && (
                                <>
                                  <span className="text-sm" style={{ fontSize: '16px' }}>{countries.find(c => c.code === phoneCountry)?.flag}</span>
                                  <span className="text-xs text-gray-600 font-medium">{countries.find(c => c.code === phoneCountry)?.dialCode}</span>
                                </>
                              )}
                              <ChevronDown className="w-3 h-3 text-gray-400 ml-auto" />
                            </button>
                            {phoneCountryDropdownOpen && (
                              <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg mt-1" style={{ minWidth: '280px', maxWidth: '320px' }}>
                                {/* Search Input */}
                                <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                                  <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={phoneCountrySearch}
                                    onChange={(e) => setPhoneCountrySearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                                  />
                                </div>
                                {/* Countries List */}
                                <div className="max-h-60 overflow-y-auto">
                                  {countries
                                    .filter((country) => {
                                      const searchLower = phoneCountrySearch.toLowerCase();
                                      return (
                                        country.name.toLowerCase().includes(searchLower) ||
                                        country.code.toLowerCase().includes(searchLower) ||
                                        country.dialCode.includes(searchLower)
                                      );
                                    })
                                    .map((country) => (
                                      <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => {
                                          setPhoneCountry(country.code);
                                          setPhoneCountryDropdownOpen(false);
                                          setPhoneCountrySearch('');
                                          // Don't auto-fill dial code - let user type the number without country code
                                          // The dial code will be prepended when saving
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-100 transition-colors ${phoneCountry === country.code ? 'bg-blue-50' : ''
                                          }`}
                                      >
                                        <span className="text-base" style={{ fontSize: '18px' }}>{country.flag}</span>
                                        <span className="flex-1 truncate">{country.name}</span>
                                        <span className="text-gray-600 font-medium">{country.dialCode}</span>
                                      </button>
                                    ))}
                                  {countries.filter((country) => {
                                    const searchLower = phoneCountrySearch.toLowerCase();
                                    return (
                                      country.name.toLowerCase().includes(searchLower) ||
                                      country.code.toLowerCase().includes(searchLower) ||
                                      country.dialCode.includes(searchLower)
                                    );
                                  }).length === 0 && (
                                      <div className="px-3 py-4 text-xs text-gray-500 text-center">
                                        No countries found
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="h-6 w-px bg-gray-300"></div>
                          <input
                            type="tel"
                            placeholder=""
                            value={personalData.phone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setPersonalData({ ...personalData, phone: value });
                            }}
                            className="flex-1 px-3 py-2 text-sm border-none outline-none focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Third Row - Address Fields */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <AddressSearch
                          label="Search Address"
                          placeholder="Search For An Address..."
                          onAddressSelect={(addressData) => {
                            // Populate address fields
                            setPersonalData({
                              ...personalData,
                              address: addressData.fullAddress || addressData.address || '',
                              searchAddress: addressData.fullAddress || ''
                            });
                          }}
                          className=""
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          placeholder="Address"
                          value={personalData.address}
                          onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Fourth Row - Date Fields */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                        <input
                          type="date"
                          value={personalData.hireDate}
                          onChange={(e) => setPersonalData({ ...personalData, hireDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employment Termination Date</label>
                        <input
                          type="date"
                          value={personalData.terminationDate}
                          onChange={(e) => setPersonalData({ ...personalData, terminationDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setActiveFormTab('basic')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        <span>←</span> Basic
                      </button>
                      <button
                        onClick={() => setActiveFormTab('documents')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        Documents <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeFormTab === 'documents' && (
                  <div className="space-y-6 max-w-full">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Documents</h3>

                    {/* Document Input Row */}
                    <div className="border border-gray-200 rounded-lg overflow-x-auto">
                      <table className="w-full table-fixed">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="w-[200px] px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">EXPIRY DATE</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">DESCRIPTION</th>
                            <th className="w-[200px] px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">SELECT FILE</th>
                            <th className="w-[180px] px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">IGNORE EXPIRATION</th>
                            <th className="w-[80px] px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Input Row */}
                          <tr className="bg-white border-b border-gray-200">
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={newDocument.expiryDate}
                                onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                placeholder="Description"
                                value={newDocument.description}
                                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) setNewDocument({ ...newDocument, file });
                                    };
                                    input.click();
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                  <Upload className="w-4 h-4" />
                                  Select File
                                </button>

                                {/* Show selected file name */}
                                {newDocument?.file && (
                                  <span className="text-xs text-gray-600 truncate" title={newDocument.file.name}>
                                    {newDocument.file.name}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newDocument.ignoreExpiration}
                                  onChange={(e) => setNewDocument({ ...newDocument, ignoreExpiration: e.target.checked })}
                                  className="w-4 h-4 text-[#42aeec] border-gray-300 rounded focus:ring-[#42aeec]"
                                />
                                <span className="text-sm text-gray-700">Ignore Expiration</span>
                              </label>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (newDocument.expiryDate || newDocument.description || newDocument.file) {
                                    setDocuments([...documents, {
                                      id: Date.now().toString(),
                                      ...newDocument
                                    }]);
                                    setNewDocument({
                                      expiryDate: '',
                                      description: '',
                                      file: null,
                                      ignoreExpiration: false
                                    });
                                  }
                                }}
                                className="w-10 h-10 bg-black !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Documents Table */}
                    {documents.length > 0 && (
                      <div className="border border-gray-200 rounded-lg overflow-x-auto">
                        <table className="w-full table-fixed">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="w-[200px] px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">EXPIRY DATE</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">DESCRIPTION</th>
                              <th className="w-[200px] px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">FILE</th>
                              <th className="w-[180px] px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">IGNORE EXPIRATION</th>
                              <th className="w-[120px] px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {documents.map((doc) => (
                              <tr key={doc.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  {editingDocumentId === doc.id && editingDocument ? (
                                    <input
                                      type="date"
                                      value={editingDocument.expiryDate}
                                      onChange={(e) => setEditingDocument({ ...editingDocument, expiryDate: e.target.value })}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                                    />
                                  ) : (
                                    <span className="text-sm text-gray-900">{doc.expiryDate || '-'}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {editingDocumentId === doc.id && editingDocument ? (
                                    <input
                                      type="text"
                                      value={editingDocument.description}
                                      onChange={(e) => setEditingDocument({ ...editingDocument, description: e.target.value })}
                                      placeholder="Description"
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                                    />
                                  ) : (
                                    <span className="text-sm text-gray-900">{doc.description || doc.documentType || '-'}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {editingDocumentId === doc.id && editingDocument ? (
                                    <div className="flex flex-col gap-2">
                                      {doc.isExisting && doc.fileUrl && (
                                        <a
                                          href={doc.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-xs"
                                        >
                                          Current: {doc.fileName || 'View File'}
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const input = document.createElement('input');
                                          input.type = 'file';
                                          input.onchange = (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0];
                                            if (file) setEditingDocument({ ...editingDocument, file });
                                          };
                                          input.click();
                                        }}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1 w-fit"
                                      >
                                        <Upload className="w-3 h-3" />
                                        {editingDocument.file ? editingDocument.file.name : 'Change File'}
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      {doc.isExisting && doc.fileUrl ? (
                                        <a
                                          href={doc.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-sm"
                                        >
                                          {doc.fileName || 'View File'}
                                        </a>
                                      ) : doc.file ? (
                                        <span className="text-sm text-gray-600">{doc.file.name}</span>
                                      ) : (
                                        <span className="text-sm text-gray-500">-</span>
                                      )}
                                    </>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {editingDocumentId === doc.id && editingDocument ? (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={editingDocument.ignoreExpiration}
                                        onChange={(e) => setEditingDocument({ ...editingDocument, ignoreExpiration: e.target.checked })}
                                        className="w-4 h-4 text-[#42aeec] border-gray-300 rounded focus:ring-[#42aeec]"
                                      />
                                      <span className="text-xs text-gray-700">Ignore</span>
                                    </label>
                                  ) : (
                                    <span className="text-sm text-gray-900">{doc.ignoreExpiration ? 'Yes' : 'No'}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {editingDocumentId === doc.id ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (!doc._id || !editingDocument) return;
                                          try {
                                            const docFormData = new FormData();
                                            if (editingDocument.expiryDate) docFormData.append('expiryDate', editingDocument.expiryDate);
                                            if (editingDocument.description) docFormData.append('description', editingDocument.description);
                                            docFormData.append('ignoreExpiration', editingDocument.ignoreExpiration ? 'true' : 'false');
                                            if (editingDocument.file) docFormData.append('documentFile', editingDocument.file);

                                            const response = await updateEmployeeDocument(doc._id, docFormData);
                                            if (response?.success) {
                                              // Reload documents
                                              if (editingId) {
                                                const documentsResponse = await getDocumentsByEmployee(editingId);
                                                if (documentsResponse?.success && documentsResponse.data) {
                                                  const existingDocs = documentsResponse.data.map((d: any) => ({
                                                    id: d._id || Date.now().toString(),
                                                    _id: d._id,
                                                    expiryDate: d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : '',
                                                    description: d.description || d.documentType || '',
                                                    file: null,
                                                    fileUrl: d.fileUrl,
                                                    fileName: d.fileName,
                                                    ignoreExpiration: d.ignoreExpiration || false,
                                                    documentType: d.documentType,
                                                    isExisting: true
                                                  }));
                                                  setDocuments(existingDocs);
                                                }
                                              }
                                              setEditingDocumentId(null);
                                              setEditingDocument(null);
                                              alert('Document updated successfully!');
                                            }
                                          } catch (error: any) {
                                            console.error('Error updating document:', error);
                                            alert(error.response?.data?.message || 'Failed to update document');
                                          }
                                        }}
                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                        title="Save"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingDocumentId(null);
                                          setEditingDocument(null);
                                        }}
                                        className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                        title="Cancel"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      {doc.isExisting && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingDocumentId(doc.id);
                                            setEditingDocument({
                                              expiryDate: doc.expiryDate || '',
                                              description: doc.description || '',
                                              ignoreExpiration: doc.ignoreExpiration || false,
                                              file: null
                                            });
                                          }}
                                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                          title="Edit Document"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (!doc._id) {
                                            // New document, just remove from list
                                            setDocuments(documents.filter(d => d.id !== doc.id));
                                            return;
                                          }

                                          if (window.confirm('Are you sure you want to delete this document?')) {
                                            try {
                                              const response = await deleteEmployeeDocument(doc._id);
                                              if (response?.success) {
                                                // Remove from list
                                                setDocuments(documents.filter(d => d.id !== doc.id));
                                                alert('Document deleted successfully!');
                                              } else {
                                                alert(response?.message || 'Failed to delete document');
                                              }
                                            } catch (error: any) {
                                              console.error('Error deleting document:', error);
                                              alert(error.response?.data?.message || 'Failed to delete document');
                                            }
                                          }
                                        }}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Delete Document"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {documents.length === 0 && (
                      <div className="border border-gray-200 rounded-lg p-12 text-center bg-gray-50">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No Documents Added</p>
                        <p className="text-sm text-gray-400 mt-1">Add documents using the form above</p>
                      </div>
                    )}

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setActiveFormTab('personal')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        <span>←</span> Personal Information
                      </button>
                      <button
                        onClick={() => setActiveFormTab('notes')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        Notes / Benefits <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeFormTab === 'notes' && (
                  <div className="space-y-6 max-w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Notes / Benefits</h3>
                    </div>

                    <textarea
                      value={notesBenefits}
                      onChange={(e) => setNotesBenefits(e.target.value)}
                      placeholder="Enter notes and benefits information..."
                      rows={15}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent resize-none"
                    />

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setActiveFormTab('documents')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        <span>←</span> Documents
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
