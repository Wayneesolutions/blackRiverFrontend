import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, X, Users as UsersIcon, Filter, Search, Truck, Mail, CreditCard, FileText, AlertCircle } from 'lucide-react';
import { Select, Tag, message, notification } from "antd";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { 
  getAllEmployees, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee, 
  updateEmployeeStatus
} from '../../../../axios/api/employee';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: Role;
  country: string;
  state: string;
  city: string;
  address?: string;
  location?: {
    address: string;
    latitude: string;
    longitude: string;
  };
  policies?: string;
  status: 'active' | 'inactive';
  joinDate?: string;
  internalId: string;
  createdAt: string;
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

type Role = "driver" | "dispatcher" | "hr" | "contact" | "customer" | "reporter" | "Maintenance Crew (Mechanics)" | "Fleet Maintenance Manager" | "Safety Manager";

// Driver-specific form data interface
interface DriverFormData {
  incorporation: string;
  employeeCode: string;
  postalCode: string;
  fleet: string;
  citizenship: string;
  paymentMethod: string;
  account: string;
  wsib: boolean;
  wsibAccountNo: string;
  expiryDate: string;
  remark: string;
  gstNo: string;
  profileImage: string;
  company: boolean;
  cell1: string;
  cell2: string;
  extension: string;
  fax: string;
  gender: string;
  dateOfBirth: string;
  termDate: string;
  csa: boolean;
  fastCardNo: string;
  fastCardExpiry: string;
  medicalRequired: boolean;
  defaultChargeName: string;
  defaultCurrency: string;
  chargesAppliedOn: string;
  defaultMode: string;
  defaultAmount: number;
  defaultRemarks: string;
  defaultPayrollType: string;
  paymentCurrency: string;
  mileRate: number;
  mileRateTeam: number;
  emptyMileRate: number;
  emptyMileRateTeam: number;
  hourlyRate: number;
  weightRate: number;
  percentageRate: number;
  localTaxNo: string;
  federalTaxNo: string;
  sinNo: string;
  craAccountNo: string;
  fedTaxExempt: boolean;
  provTaxExempt: boolean;
  cppQppExempt: boolean;
  eiExempt: boolean;
  qpipExempt: boolean;
  payPeriod: string;
  vacationPay: string;
  ltl: boolean;
  onSettlements: boolean;
  settlementCurrencyByOrder: boolean;
  isDefault: boolean;
}

// Add Notification types and component
type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
}

// Notification Component
const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    info: <FaInfoCircle className="text-blue-500" size={24} />,
    warning: <FaExclamationCircle className="text-yellow-500" size={24} />
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
    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in`}>
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

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDriverPanel, setShowDriverPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [toastError, setToastError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; userId: string | null }>({ show: false, userId: null });

  // Available roles including drive
  const rolesWithLoginAccess: Role[] = ['driver', 'dispatcher', 'hr', 'Fleet Maintenance Manager', 'Safety Manager'];
  
  // Roles without login access (only basic information)
  const rolesWithoutLoginAccess: Role[] = ['contact', 'customer', 'reporter', 'Maintenance Crew (Mechanics)'];

  const roleOptions: Role[] = ['driver', 'dispatcher', 'hr', 'contact', 'customer', 'reporter', "Maintenance Crew (Mechanics)", "Fleet Maintenance Manager", "Safety Manager"];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'hr' as Role,
    country: '',
    state: '',
    city: '',
    address: '',
    joinDate: '',
    internalId: '',
    policies: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [driverFormData, setDriverFormData] = useState<DriverFormData>({
    incorporation: '',
    employeeCode: '',
    postalCode: '',
    fleet: '',
    citizenship: '',
    paymentMethod: '',
    account: '',
    wsib: false,
    wsibAccountNo: '',
    expiryDate: '',
    remark: '',
    gstNo: '',
    profileImage: '',
    company: false,
    cell1: '',
    cell2: '',
    extension: '',
    fax: '',
    gender: '',
    dateOfBirth: '',
    termDate: '',
    csa: false,
    fastCardNo: '',
    fastCardExpiry: '',
    medicalRequired: false,
    defaultChargeName: '',
    defaultCurrency: '',
    chargesAppliedOn: '',
    defaultMode: '',
    defaultAmount: 0,
    defaultRemarks: '',
    defaultPayrollType: '',
    paymentCurrency: '',
    mileRate: 0,
    mileRateTeam: 0,
    emptyMileRate: 0,
    emptyMileRateTeam: 0,
    hourlyRate: 0,
    weightRate: 0,
    percentageRate: 0,
    localTaxNo: '',
    federalTaxNo: '',
    sinNo: '',
    craAccountNo: '',
    fedTaxExempt: false,
    provTaxExempt: false,
    cppQppExempt: false,
    eiExempt: false,
    qpipExempt: false,
    payPeriod: '',
    vacationPay: '',
    ltl: false,
    onSettlements: false,
    settlementCurrencyByOrder: false,
    isDefault: false
  });

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllEmployees(1, 1000, searchQuery, selectedRole !== 'all' ? selectedRole : undefined, selectedStatus !== 'all' ? selectedStatus : undefined);
      if (response && response.success) {
        setUsers(response.data || []);
        
        // Show message if company setup is required
        if (response.requiresCompanySetup && response.message) {
          addNotification('warning', response.message);
        }
      } else {
        console.error(response?.message || 'Error fetching users');
        addNotification('error', response?.message || 'Error fetching users');
      }
    } catch (error) {
      console.error(error);
      addNotification('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedRole, selectedStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setDriverFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      // Auto-uppercase internalId and filter out invalid characters
      let processedValue = value;
      if (name === 'internalId') {
        processedValue = value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      }
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
  };

  const handleDriverInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setDriverFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setDriverFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setDriverFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as Role;
    setFormData(prev => ({ ...prev, role }));
    setShowDriverPanel(role === 'driver');
    setActiveTab('basic');
  };

  // Frontend validation function - matches backend validation
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Name validation (required, 2-50 chars, letters and spaces only)
    if (!formData.name?.trim()) {
      errors.push('Name is required');
    } else {
      const nameTrimmed = formData.name.trim();
      if (nameTrimmed.length < 2 || nameTrimmed.length > 50) {
        errors.push('Name must be between 2 and 50 characters');
      } else if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {
        errors.push('Name can only contain letters and spaces');
      }
    }

    // Email validation (required, valid email format)
    if (!formData.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.push('Please provide a valid email address');
    }

    // Phone validation (required, valid mobile phone format)
    if (!formData.phone?.trim()) {
      errors.push('Phone is required');
    } else {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        errors.push('Please provide a valid phone number');
      }
    }

    // Country validation (required, 2-50 chars)
    if (!formData.country?.trim()) {
      errors.push('Country is required');
    } else {
      const countryTrimmed = formData.country.trim();
      if (countryTrimmed.length < 2 || countryTrimmed.length > 50) {
        errors.push('Country must be between 2 and 50 characters');
      }
    }

    // State validation (required, 2-50 chars)
    if (!formData.state?.trim()) {
      errors.push('State is required');
    } else {
      const stateTrimmed = formData.state.trim();
      if (stateTrimmed.length < 2 || stateTrimmed.length > 50) {
        errors.push('State must be between 2 and 50 characters');
      }
    }

    // City validation (required, 2-50 chars)
    if (!formData.city?.trim()) {
      errors.push('City is required');
    } else {
      const cityTrimmed = formData.city.trim();
      if (cityTrimmed.length < 2 || cityTrimmed.length > 50) {
        errors.push('City must be between 2 and 50 characters');
      }
    }

    // Join Date validation (required, valid date)
    if (!formData.joinDate) {
      errors.push('Join date is required');
    } else {
      const joinDate = new Date(formData.joinDate);
      if (isNaN(joinDate.getTime())) {
        errors.push('Please provide a valid join date');
      }
    }

    // Internal ID validation - required for all roles
    if (!formData.internalId?.trim()) {
      errors.push('Internal ID is required');
    } else {
      const internalIdTrimmed = formData.internalId.trim().toUpperCase();
      if (internalIdTrimmed.length < 3 || internalIdTrimmed.length > 20) {
        errors.push('Internal ID must be between 3 and 20 characters');
      } else if (!/^[A-Z0-9_-]+$/.test(internalIdTrimmed)) {
        errors.push('Internal ID can only contain uppercase letters, numbers, hyphens, and underscores');
      }
    }

    // Address validation (optional, but if provided must be 5-200 chars)
    if (formData.address?.trim()) {
      const addressTrimmed = formData.address.trim();
      if (addressTrimmed.length < 5 || addressTrimmed.length > 200) {
        errors.push('Address must be between 5 and 200 characters');
      }
    }

    // Password validation - only required for roles with login access
    const requiresLoginAccess = rolesWithLoginAccess.includes(formData.role);
    if (requiresLoginAccess) {
      if (!isEditing && !formData.password?.trim()) {
        // For new users with login access, password is optional (backend provides default)
        // But if provided, must be at least 6 chars
        if (formData.password && formData.password.length < 6) {
          errors.push('Password must be at least 6 characters long');
        }
      }
      // For updates, password is optional
      if (isEditing && formData.password?.trim() && formData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }
    }

    // Role validation (required, must be in allowed list)
    if (!formData.role) {
      errors.push('Role is required');
    } else {
      if (!roleOptions.includes(formData.role)) {
        errors.push('Invalid role selected');
      }
    }

    // Policies validation (optional, but if provided must be 5-500 chars)
    if (formData.policies?.trim()) {
      const policiesTrimmed = formData.policies.trim();
      if (policiesTrimmed.length < 5 || policiesTrimmed.length > 500) {
        errors.push('Policies must be between 5 and 500 characters');
      }
    }

    // Status validation (optional, but must be 'active' or 'inactive' if provided)
    if (formData.status && !['active', 'inactive'].includes(formData.status)) {
      errors.push('Status must be either active or inactive');
    }

    // Driver-specific validations
    if (formData.role === 'driver') {
      // Employee code is optional but recommended
      // No strict validation needed as backend handles it
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validation
    const validation = validateForm();
    if (!validation.isValid) {
      const errorMsg = validation.errors.join(', ');
      console.log('Validation errors:', errorMsg);
      setModalError(errorMsg);
      addNotification('error', errorMsg);
      return;
    }

    setLoading(true);

    try {
      // Prepare data for submission
      const submitData: any = { ...formData };
      
      // Ensure internalId is uppercase and valid format
      if (submitData.internalId) {
        submitData.internalId = submitData.internalId.trim().toUpperCase();
      }
      
      // If driver role is selected, include all driver-specific data
      if (formData.role === 'driver') {
        const companyFlagValue = driverFormData.company;
        
        // Add all driver form data
        Object.assign(submitData, driverFormData);
        
        // Map company checkbox to companyFlag (avoid conflict with company ObjectId)
        submitData.companyFlag = companyFlagValue;
        delete submitData.company; // Remove boolean company field
        
        // Handle date conversions
        if (driverFormData.expiryDate) submitData.expiryDate = driverFormData.expiryDate;
        if (driverFormData.dateOfBirth) submitData.dateOfBirth = driverFormData.dateOfBirth;
        if (driverFormData.termDate) submitData.termDate = driverFormData.termDate;
        if (driverFormData.fastCardExpiry) submitData.fastCardExpiry = driverFormData.fastCardExpiry;
        
        // Use joinDate for hireDate
        if (submitData.joinDate) {
          submitData.hireDate = submitData.joinDate;
        }
      }
      
      // Remove empty password for updates
      if (isEditing && selectedUser && !submitData.password) {
        delete submitData.password;
      }
      
      let response;
      if (isEditing && selectedUser) {
        response = await updateEmployee(selectedUser._id, submitData);
        
        // Check if response exists and has success property
        if (response && response.success === true) {
          setModalError(null); // Clear any error messages
          addNotification('success', response.message || 'User updated successfully');
          await fetchUsers();
          resetForm();
          setShowCreateModal(false);
        } else {
          // Handle both success: false and error responses
          // Prioritize detailed errors from errors array over generic message
          let errorMessage = 'Failed to update user. Please try again.';
          
          // Check for validation errors array
          if (Array.isArray(response?.errors) && response.errors.length > 0) {
            // Extract detailed validation errors
            const errorDetails = response.errors.map((e: any) => {
              const field = e.path || e.field || '';
              const msg = e.msg || e.message || '';
              return field ? `${field}: ${msg}` : msg;
            }).join('; ');
            errorMessage = errorDetails || response?.message || 'Validation failed';
          } 
          // Check for error message in various locations
          else if (response?.message) {
            errorMessage = response.message;
          } 
          else if (response?.error?.message) {
            errorMessage = response.error.message;
          } 
          else if (typeof response?.error === 'string') {
            errorMessage = response.error;
          }
          // Check for error in data property
          else if (response?.data?.message) {
            errorMessage = response.data.message;
          }
          // Check for error in response.data.error
          else if (response?.data?.error) {
            errorMessage = typeof response.data.error === 'string' 
              ? response.data.error 
              : response.data.error.message || 'An error occurred';
          }
          
          console.log('❌ Update user error - Response:', JSON.stringify(response, null, 2));
          setModalError(errorMessage);
          addNotification('error', errorMessage);
        }
      } else {
        response = await createEmployee(submitData);
        console.log('Create employee response:', response);
        
        // Check if response exists and has success property
        if (response && response.success === true) {
          setModalError(null); // Clear any error messages
          addNotification('success', response.message || 'User created successfully');
          await fetchUsers();
          resetForm();
          setShowCreateModal(false);
        } else {
          // Handle both success: false and error responses
          // Prioritize detailed errors from errors array over generic message
          let errorMessage = 'Failed to create user. Please try again.';
          
          // Check for validation errors array
          if (Array.isArray(response?.errors) && response.errors.length > 0) {
            // Extract detailed validation errors
            const errorDetails = response.errors.map((e: any) => {
              const field = e.path || e.field || '';
              const msg = e.msg || e.message || '';
              return field ? `${field}: ${msg}` : msg;
            }).join('; ');
            errorMessage = errorDetails || response?.message || 'Validation failed';
          } 
          // Check for error message in various locations
          else if (response?.message) {
            errorMessage = response.message;
          } 
          else if (response?.error?.message) {
            errorMessage = response.error.message;
          } 
          else if (typeof response?.error === 'string') {
            errorMessage = response.error;
          }
          // Check for error in data property
          else if (response?.data?.message) {
            errorMessage = response.data.message;
          }
          // Check for error in response.data.error
          else if (response?.data?.error) {
            errorMessage = typeof response.data.error === 'string' 
              ? response.data.error 
              : response.data.error.message || 'An error occurred';
          }
          
          console.log('❌ Create user error - Response:', JSON.stringify(response, null, 2));
          setModalError(errorMessage);
          addNotification('error', errorMessage);
        }
      }
    } catch (error: any) {
      console.error('❌ Error saving user (catch block):', error);
      
      // Extract error message from various possible locations
      // Prioritize detailed errors from errors array over generic message
      let errorMessage = 'Failed to save user. Please check your connection and try again.';
      const errorData = error?.response?.data;
      
      // Check for network errors
      if (!error?.response) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      // Check for validation errors array
      else if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
        // Extract detailed validation errors
        const errorDetails = errorData.errors.map((e: any) => {
          const field = e.path || e.field || '';
          const msg = e.msg || e.message || '';
          return field ? `${field}: ${msg}` : msg;
        }).join('; ');
        errorMessage = errorDetails || errorData?.message || 'Validation failed';
      } 
      // Check for error message in various locations
      else if (errorData?.message) {
        errorMessage = errorData.message;
      } 
      else if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      } 
      else if (typeof errorData?.error === 'string') {
        errorMessage = errorData.error;
      } 
      else if (error?.message) {
        errorMessage = error.message;
      }
      // Check for HTTP status code specific messages
      else if (error?.response?.status === 400) {
        errorMessage = 'Invalid request. Please check your input and try again.';
      } else if (error?.response?.status === 401) {
        errorMessage = 'Unauthorized. Please login again.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Resource not found. Please refresh and try again.';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      console.log('❌ Catch error message to show:', errorMessage);
      setModalError(errorMessage);
      addNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'hr',
      country: '',
      state: '',
      city: '',
      address: '',
      joinDate: '',
      internalId: '',
      policies: '',
      status: 'active'
    });
    setDriverFormData({
      incorporation: '',
      employeeCode: '',
      postalCode: '',
      fleet: '',
      citizenship: '',
      paymentMethod: '',
      account: '',
      wsib: false,
      wsibAccountNo: '',
      expiryDate: '',
      remark: '',
      gstNo: '',
      profileImage: '',
      company: false,
      cell1: '',
      cell2: '',
      extension: '',
      fax: '',
      gender: '',
      dateOfBirth: '',
      termDate: '',
      csa: false,
      fastCardNo: '',
      fastCardExpiry: '',
      medicalRequired: false,
      defaultChargeName: '',
      defaultCurrency: '',
      chargesAppliedOn: '',
      defaultMode: '',
      defaultAmount: 0,
      defaultRemarks: '',
      defaultPayrollType: '',
      paymentCurrency: '',
      mileRate: 0,
      mileRateTeam: 0,
      emptyMileRate: 0,
      emptyMileRateTeam: 0,
      hourlyRate: 0,
      weightRate: 0,
      percentageRate: 0,
      localTaxNo: '',
      federalTaxNo: '',
      sinNo: '',
      craAccountNo: '',
      fedTaxExempt: false,
      provTaxExempt: false,
      cppQppExempt: false,
      eiExempt: false,
      qpipExempt: false,
      payPeriod: '',
      vacationPay: '',
      ltl: false,
      onSettlements: false,
      settlementCurrencyByOrder: false,
      isDefault: false
    });
    setIsEditing(false);
    setSelectedUser(null);
    setShowDriverPanel(false);
    setActiveTab('basic');
    setShowPassword(false);
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: '',
      role: user.role,
      country: user.country,
      state: user.state,
      city: user.city,
      address: user.location?.address || user.address || '',
      joinDate: user.joinDate || '',
      internalId: user.internalId || '',
      policies: user.policies || '',
      status: user.status
    });
    
    // Show driver panel and populate driver fields if role is driver
    if (user.role === 'driver') {
      setShowDriverPanel(true);
      
      // Populate driver form data from user details
      const details = user.details || {};
      setDriverFormData({
        incorporation: details.incorporation || '',
        employeeCode: details.employeeCode || user.internalId || '',
        postalCode: details.postalCode || '',
        fleet: details.fleet || '',
        citizenship: details.citizenship || '',
        paymentMethod: details.paymentMethod || '',
        account: details.account || '',
        wsib: details.wsib || false,
        wsibAccountNo: details.wsibAccountNo || '',
        expiryDate: details.expiryDate ? new Date(details.expiryDate).toISOString().split('T')[0] : '',
        remark: details.remark || '',
        gstNo: details.gstNo || '',
        profileImage: details.profileImage || '',
        company: details.companyFlag || false,
        cell1: details.cell1 || '',
        cell2: details.cell2 || '',
        extension: details.extension || '',
        fax: details.fax || '',
        gender: details.gender || '',
        dateOfBirth: details.dateOfBirth ? new Date(details.dateOfBirth).toISOString().split('T')[0] : '',
        termDate: details.termDate ? new Date(details.termDate).toISOString().split('T')[0] : '',
        csa: details.csa || false,
        fastCardNo: details.fastCardNo || '',
        fastCardExpiry: details.fastCardExpiry ? new Date(details.fastCardExpiry).toISOString().split('T')[0] : '',
        medicalRequired: details.medicalRequired || false,
        defaultChargeName: details.defaultChargeName || '',
        defaultCurrency: details.defaultCurrency || '',
        chargesAppliedOn: details.chargesAppliedOn || '',
        defaultMode: details.defaultMode || '',
        defaultAmount: details.defaultAmount || 0,
        defaultRemarks: details.defaultRemarks || '',
        defaultPayrollType: details.defaultPayrollType || '',
        paymentCurrency: details.paymentCurrency || '',
        mileRate: details.mileRate || 0,
        mileRateTeam: details.mileRateTeam || 0,
        emptyMileRate: details.emptyMileRate || 0,
        emptyMileRateTeam: details.emptyMileRateTeam || 0,
        hourlyRate: details.hourlyRate || 0,
        weightRate: details.weightRate || 0,
        percentageRate: details.percentageRate || 0,
        localTaxNo: details.localTaxNo || '',
        federalTaxNo: details.federalTaxNo || '',
        sinNo: details.sinNo || '',
        craAccountNo: details.craAccountNo || '',
        fedTaxExempt: details.fedTaxExempt || false,
        provTaxExempt: details.provTaxExempt || false,
        cppQppExempt: details.cppQppExempt || false,
        eiExempt: details.eiExempt || false,
        qpipExempt: details.qpipExempt || false,
        payPeriod: details.payPeriod || '',
        vacationPay: details.vacationPay || '',
        ltl: details.ltl || false,
        onSettlements: details.onSettlements || false,
        settlementCurrencyByOrder: details.settlementCurrencyByOrder || false,
        isDefault: details.isDefault || false
      });
    } else {
      setShowDriverPanel(false);
    }
    
    setSelectedUser(user);
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleDelete = async (userId: string) => {
    setDeleteConfirm({ show: true, userId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.userId) return;
    
    setLoading(true);
    try {
      const response = await deleteEmployee(deleteConfirm.userId);
      if (response && response.success) {
        addNotification('success', response.message || 'User deleted successfully');
        await fetchUsers();
      } else {
        const errorMessage = response?.message || response?.error?.message || 'Failed to delete user';
        addNotification('error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      addNotification('error', error?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
      setDeleteConfirm({ show: false, userId: null });
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setLoading(true);
    try {
      const response = await updateEmployeeStatus(userId, newStatus);
      if (response && response.success) {
        setUsers(prev => prev.map(user =>
          user._id === userId
            ? { ...user, status: newStatus }
            : user
        ));
        addNotification('success', response.message || `User status updated to ${newStatus}`);
      } else {
        const errorMessage = response?.message || response?.error?.message || 'Failed to update user status';
        addNotification('error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating user status:', error);
      addNotification('error', error?.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
    };

  const getRoleColor = (role: Role) => {
    const colors: Partial<Record<Role, string>> = {
      driver: "bg-green-50 text-green-700 border-green-200",
      dispatcher: "bg-orange-50 text-orange-700 border-orange-200",
      hr: "bg-pink-50 text-pink-700 border-pink-200",
      contact: "bg-teal-50 text-teal-700 border-teal-200",
      customer: "bg-cyan-50 text-cyan-700 border-cyan-200",
      reporter: "bg-yellow-50 text-yellow-700 border-yellow-200",
      "Fleet Maintenance Manager": "bg-violet-50 text-violet-700 border-violet-200",
      "Safety Manager": "bg-red-50 text-red-700 border-red-200",
      "Maintenance Crew (Mechanics)": "bg-lime-50 text-lime-700 border-lime-200",
    };
    return colors[role] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusColor = (status: 'active' | 'inactive') => {
    return status === 'active'
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-red-50 text-red-700 border-red-200";
  };

  const getUserCountByRole = (role: Role) => {
    return users.filter(user => user.role === role).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6">
      {/* Toast Notifications Container - High z-index to be above modal */}
      <div className="fixed top-4 right-4 z-[10002] flex flex-col gap-3 max-w-md">
        {notifications.map(notification => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>

      <div className="py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Manage your team members and their roles</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 !text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Add New User
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Select
                  value={selectedRole}
                  onChange={(value) => setSelectedRole(value as Role | "all")}
                  className="w-full"
                >
                  <Select.Option value="all">All Roles</Select.Option>
                  {roleOptions.map((role) => (
                    <Select.Option key={role} value={role}>
                      <span className="capitalize">{role}</span> ({getUserCountByRole(role)})
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <div className="relative">
                <Select
                  value={selectedStatus}
                  onChange={(value) =>
                    setSelectedStatus(value as "all" | "active" | "inactive")
                  }
                  className="w-full"
                >
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="active">
                    <Tag color="green" className="mr-1">
                      Active
                    </Tag>
                    ({users.filter((u) => u.status === "active").length})
                  </Select.Option>
                  <Select.Option value="inactive">
                    <Tag color="red" className="mr-1">
                      Inactive
                    </Tag>
                    ({users.filter((u) => u.status === "inactive").length})
                  </Select.Option>
                </Select>
              </div>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <div className="font-medium">Total Users: {users.length}</div>
                <div className="text-gray-500">Showing: {users.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="min-w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-60 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="w-36 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="w-44 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="w-32 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-500">Loading users...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <UsersIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                      <p className="text-gray-500">
                        {searchQuery || selectedRole !== 'all' || selectedStatus !== 'all'
                          ? "No users match your current filters."
                          : "No users have been created yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="w-full overflow-hidden">
                          <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                          <div className="text-sm text-gray-500 truncate">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border capitalize ${getRoleColor(user.role)}`}>
                          {user.role === 'hr' ? 'hr' : user.role}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="truncate">{user.phone}</div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="truncate">{user.city || 'N/A'}, {user.state || 'N/A'}</div>
                      </td>
                      <td className="px-3 py-4">
                        <button
                          onClick={() => handleStatusToggle(user._id, user.status)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border capitalize cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(user.status)}`}
                        >
                          {user.status}
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="truncate">
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="flex justify-center space-x-1">
                          <button
                            onClick={() => handleView(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Edit User"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
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

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
          <div className={`bg-white rounded-xl ${showDriverPanel ? 'max-w-6xl' : 'max-w-2xl'} w-full max-h-[90vh] overflow-y-auto shadow-2xl`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit User' : 'Create New User'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter full name (letters and spaces only)"
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter phone number (e.g., +1234567890)"
                      />
                    </div>

                    {!isEditing && rolesWithLoginAccess.includes(formData.role) && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password <span className="text-gray-500 text-xs">(optional - default will be set if not provided)</span></label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter password (min 6 characters)"
                            minLength={6}
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
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Internal ID <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="internalId"
                        value={formData.internalId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
                        placeholder="EMP-001 (uppercase letters, numbers, hyphens, underscores only)"
                        minLength={3}
                        maxLength={20}
                        pattern="[A-Z0-9_-]+"
                      />
                      <p className="text-xs text-gray-500 mt-1">3-20 characters, uppercase letters, numbers, hyphens, and underscores only</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Join Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        name="joinDate"
                        value={formData.joinDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                     <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleRoleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {/* Not selected by default, just visible in dropdown */}
                        <option value="" disabled>
                          Select role
                        </option>

                        {roleOptions.map((role) => (
                          <option key={role} value={role} className="capitalize">
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter country"
                        minLength={2}
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter state"
                        minLength={2}
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter city"
                        minLength={2}
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder="Enter full address (5-200 characters)"
                        minLength={5}
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Policies</label>
                      <textarea
                        name="policies"
                        value={formData.policies}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder="Enter user policies (5-500 characters)"
                        minLength={5}
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>

                {/* Driver-specific panel */}
                {showDriverPanel && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-lg mb-6">
                      <div className="flex items-center space-x-3">
                        <Truck className="w-6 h-6 text-white" />
                        <h3 className="text-lg font-semibold text-white">Driver Information</h3>
                      </div>
                    </div>

                    {/* Driver Tabs */}
                    <div className="mb-6">
                      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                        {[
                          { id: 'basic', label: 'Basic Information', icon: UsersIcon },
                          { id: 'employment', label: 'Employment & Contact', icon: Mail },
                          { id: 'payment', label: 'Payment Profile', icon: CreditCard }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                              activeTab === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tab Content - This will be simplified version, full implementation can be copied from employee list */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      {activeTab === 'basic' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Incorporation</label>
                              <select
                                name="incorporation"
                                value={driverFormData.incorporation}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Incorporation</option>
                                <option value="Corporation">Corporation</option>
                                <option value="Partnership">Partnership</option>
                                <option value="Sole Proprietorship">Sole Proprietorship</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Employee Code</label>
                              <input
                                type="text"
                                name="employeeCode"
                                value={driverFormData.employeeCode}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                            <input
                              type="text"
                              name="postalCode"
                              value={driverFormData.postalCode}
                              onChange={handleDriverInputChange}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      {activeTab === 'employment' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Fleet</label>
                              <input
                                type="text"
                                name="fleet"
                                value={driverFormData.fleet}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Citizenship</label>
                              <select
                                name="citizenship"
                                value={driverFormData.citizenship}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Citizenship</option>
                                <option value="Canadian">Canadian</option>
                                <option value="US Citizen">US Citizen</option>
                                <option value="Permanent Resident">Permanent Resident</option>
                                <option value="Work Permit">Work Permit</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                              <select
                                name="paymentMethod"
                                value={driverFormData.paymentMethod}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Payment Method</option>
                                <option value="Direct Deposit">Direct Deposit</option>
                                <option value="Check">Check</option>
                                <option value="Wire Transfer">Wire Transfer</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
                              <input
                                type="text"
                                name="account"
                                value={driverFormData.account}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                name="wsib"
                                checked={driverFormData.wsib}
                                onChange={handleDriverInputChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label className="text-sm font-medium text-gray-700">WSIB</label>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">WSIB Account No</label>
                              <input
                                type="text"
                                name="wsibAccountNo"
                                value={driverFormData.wsibAccountNo}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Cell 1</label>
                              <input
                                type="tel"
                                name="cell1"
                                value={driverFormData.cell1}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Cell 2</label>
                              <input
                                type="tel"
                                name="cell2"
                                value={driverFormData.cell2}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'payment' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Default Payroll Type</label>
                              <select
                                name="defaultPayrollType"
                                value={driverFormData.defaultPayrollType}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Payroll Type</option>
                                <option value="Owner Operator">Owner Operator</option>
                                <option value="Company Driver">Company Driver</option>
                                <option value="Team Driver">Team Driver</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                              <select
                                name="paymentCurrency"
                                value={driverFormData.paymentCurrency}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Currency</option>
                                <option value="CAD">CAD - Canadian Dollar</option>
                                <option value="USD">USD - United States Dollar</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Mile Rate (Solo)</label>
                              <input
                                type="number"
                                step="0.01"
                                name="mileRate"
                                value={driverFormData.mileRate}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Mile Rate (Team)</label>
                              <input
                                type="number"
                                step="0.01"
                                name="mileRateTeam"
                                value={driverFormData.mileRateTeam}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Empty Mile Rate</label>
                              <input
                                type="number"
                                step="0.01"
                                name="emptyMileRate"
                                value={driverFormData.emptyMileRate}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate</label>
                              <input
                                type="number"
                                step="0.01"
                                name="hourlyRate"
                                value={driverFormData.hourlyRate}
                                onChange={handleDriverInputChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Note about documents */}
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            Document Management
                          </p>
                          <p className="text-sm text-blue-700">
                            License documents and travel documents can be managed in the Employee Documents section.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 text-gray-700 bg-gray-100 !mr-4 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 !text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{selectedUser.name}</h3>
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border capitalize ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border capitalize ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <span className="font-semibold text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-900">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-900">{selectedUser.phone}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-900">{selectedUser.city || 'N/A'}, {selectedUser.state || 'N/A'}, {selectedUser.country || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Address:</span>
                    <p className="mt-1 text-gray-900">{selectedUser.location?.address || selectedUser.address || 'N/A'}</p>
                  </div>
                  {selectedUser.internalId && (
                    <div>
                      <span className="font-semibold text-gray-700">Internal ID:</span>
                      <span className="ml-2 text-gray-900">{selectedUser.internalId}</span>
                    </div>
                  )}
                  {selectedUser.joinDate && (
                    <div>
                      <span className="font-semibold text-gray-700">Join Date:</span>
                      <span className="ml-2 text-gray-900">{new Date(selectedUser.joinDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedUser.policies && (
                    <div>
                      <span className="font-semibold text-gray-700">Policies:</span>
                      <p className="mt-1 text-gray-900">{selectedUser.policies}</p>
                    </div>
                  )}
                  {selectedUser.role === 'driver' && selectedUser.details && (
                    <>
                      {(selectedUser.details as any).licenceNumber && (
                        <div>
                          <span className="font-semibold text-gray-700">License Number:</span>
                          <span className="ml-2 text-gray-900">{(selectedUser.details as any).licenceNumber}</span>
                        </div>
                      )}
                      {selectedUser.details.fleet && (
                        <div>
                          <span className="font-semibold text-gray-700">Fleet:</span>
                          <span className="ml-2 text-gray-900">{selectedUser.details.fleet}</span>
                        </div>
                      )}
                      {selectedUser.details.mileRate !== undefined && (
                        <div>
                          <span className="font-semibold text-gray-700">Mile Rate:</span>
                          <span className="ml-2 text-gray-900">${selectedUser.details.mileRate}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
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
              <p className="text-gray-600 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteConfirm({ show: false, userId: null })}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
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

export default Users;