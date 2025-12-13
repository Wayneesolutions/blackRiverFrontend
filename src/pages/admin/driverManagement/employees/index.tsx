import React, { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Truck,
  FileText,
  CreditCard,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus
} from '../../../../axios/api/employee';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

const ACCENT_PRIMARY = FLEET_COLORS.primary;
const ACCENT_DARK = FLEET_COLORS.dark;
const ACCENT_LIGHT = FLEET_COLORS.light;
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

// Driver-specific interfaces
interface DriverFormData {
  // Basic Information
  incorporation: string;
  employeeCode: string;
  postalCode: string;

  // Employment & Contact
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


  // Payment Profile - Default Charges
  defaultChargeName: string;
  defaultCurrency: string;
  chargesAppliedOn: string;
  defaultMode: string;
  defaultAmount: number;
  defaultRemarks: string;

  // Payment Profile - Payment Profile
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
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [activeTab, setActiveTab] = useState('basic');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; employeeId: string | null }>({
    show: false,
    employeeId: null
  });

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

  const [driverFormData, setDriverFormData] = useState<DriverFormData>({
    // Basic Information
    incorporation: '',
    employeeCode: '',
    postalCode: '',

    // Employment & Contact
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

    // Payment Profile - Default Charges
    defaultChargeName: '',
    defaultCurrency: '',
    chargesAppliedOn: '',
    defaultMode: '',
    defaultAmount: 0,
    defaultRemarks: '',

    // Payment Profile - Payment Profile
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

  // Available roles
  const roles = [
    'dispatcher', 'hr', 'contact', 'customer', 'reporter',
    'Fleet Maintenance Manager', 'Compliance Manager', 'Maintenance Crew (Mechanics)', 'safety officer'
  ];

  // Roles that require login access (ID, username, password)
  const rolesWithLoginAccess = ['dispatcher', 'hr', 'Fleet Maintenance Manager', 'Compliance Manager', 'safety officer'];

  // Role display mapping - show different text in UI but pass correct value to backend
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

  // Fetch employees data
  useEffect(() => {
    fetchEmployees();
  }, []);

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
        setEmployees((response.data || []).filter((e: Employee) => e.role !== 'driver'));
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

  // Search employees and apply filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEmployees();
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
      setFormData(prev => ({
        ...prev,
        [name]: name === 'internalId' ? value.toUpperCase() : value
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
    setEditingEmployee(null);
    setActiveTab('basic');
    setActiveTab('basic');
    setShowPassword(false);
  };

  const handleSubmit = async () => {
    try {
      // Prepare data for submission
      const submitData: any = { ...formData };

      // If driver role is selected, include all driver-specific data
      if (formData.role === 'driver' || editingEmployee?.role === 'driver') {
        // Preserve the company ObjectId from basic form if it exists
        const companyObjectId = submitData.company;

        // Extract company checkbox value before assigning (it's a boolean, not ObjectId)
        const companyFlagValue = driverFormData.company;

        // Add all driver form data - ensure ALL fields are included even if empty
        const driverData: any = {
          incorporation: driverFormData.incorporation || '',
          employeeCode: driverFormData.employeeCode || submitData.internalId || '',
          postalCode: driverFormData.postalCode || '',
          fleet: driverFormData.fleet || '',
          citizenship: driverFormData.citizenship || '',
          paymentMethod: driverFormData.paymentMethod || '',
          account: driverFormData.account || '',
          wsib: driverFormData.wsib !== undefined ? driverFormData.wsib : false,
          wsibAccountNo: driverFormData.wsibAccountNo || '',
          expiryDate: driverFormData.expiryDate || '',
          remark: driverFormData.remark || '',
          gstNo: driverFormData.gstNo || '',
          profileImage: driverFormData.profileImage || '',
          companyFlag: companyFlagValue !== undefined ? companyFlagValue : false,
          cell1: driverFormData.cell1 || '',
          cell2: driverFormData.cell2 || '',
          extension: driverFormData.extension || '',
          fax: driverFormData.fax || '',
          gender: driverFormData.gender || '',
          dateOfBirth: driverFormData.dateOfBirth || '',
          termDate: driverFormData.termDate || '',
          csa: driverFormData.csa !== undefined ? driverFormData.csa : false,
          fastCardNo: driverFormData.fastCardNo || '',
          fastCardExpiry: driverFormData.fastCardExpiry || '',
          medicalRequired: driverFormData.medicalRequired !== undefined ? driverFormData.medicalRequired : false,
          defaultChargeName: driverFormData.defaultChargeName || '',
          defaultCurrency: driverFormData.defaultCurrency || '',
          chargesAppliedOn: driverFormData.chargesAppliedOn || '',
          defaultMode: driverFormData.defaultMode || '',
          defaultAmount: driverFormData.defaultAmount !== undefined ? driverFormData.defaultAmount : 0,
          defaultRemarks: driverFormData.defaultRemarks || '',
          defaultPayrollType: driverFormData.defaultPayrollType || '',
          paymentCurrency: driverFormData.paymentCurrency || '',
          mileRate: driverFormData.mileRate !== undefined ? driverFormData.mileRate : 0,
          mileRateTeam: driverFormData.mileRateTeam !== undefined ? driverFormData.mileRateTeam : 0,
          emptyMileRate: driverFormData.emptyMileRate !== undefined ? driverFormData.emptyMileRate : 0,
          emptyMileRateTeam: driverFormData.emptyMileRateTeam !== undefined ? driverFormData.emptyMileRateTeam : 0,
          hourlyRate: driverFormData.hourlyRate !== undefined ? driverFormData.hourlyRate : 0,
          weightRate: driverFormData.weightRate !== undefined ? driverFormData.weightRate : 0,
          percentageRate: driverFormData.percentageRate !== undefined ? driverFormData.percentageRate : 0,
          localTaxNo: driverFormData.localTaxNo || '',
          federalTaxNo: driverFormData.federalTaxNo || '',
          sinNo: driverFormData.sinNo || '',
          craAccountNo: driverFormData.craAccountNo || '',
          fedTaxExempt: driverFormData.fedTaxExempt !== undefined ? driverFormData.fedTaxExempt : false,
          provTaxExempt: driverFormData.provTaxExempt !== undefined ? driverFormData.provTaxExempt : false,
          cppQppExempt: driverFormData.cppQppExempt !== undefined ? driverFormData.cppQppExempt : false,
          eiExempt: driverFormData.eiExempt !== undefined ? driverFormData.eiExempt : false,
          qpipExempt: driverFormData.qpipExempt !== undefined ? driverFormData.qpipExempt : false,
          payPeriod: driverFormData.payPeriod || '',
          vacationPay: driverFormData.vacationPay || '',
          ltl: driverFormData.ltl !== undefined ? driverFormData.ltl : false,
          onSettlements: driverFormData.onSettlements !== undefined ? driverFormData.onSettlements : false,
          settlementCurrencyByOrder: driverFormData.settlementCurrencyByOrder !== undefined ? driverFormData.settlementCurrencyByOrder : false,
          isDefault: driverFormData.isDefault !== undefined ? driverFormData.isDefault : false
        };

        // Merge driver data into submitData
        Object.assign(submitData, driverData);

        // Restore the company ObjectId if it was set in basic form
        if (companyObjectId && typeof companyObjectId === 'string') {
          submitData.company = companyObjectId;
        } else {
          // Remove the boolean 'company' field to avoid conflict
          delete submitData.company;
        }

        // Use joinDate for hireDate (joinDate from basic form is used as hireDate for drivers)
        if (submitData.joinDate) {
          submitData.hireDate = submitData.joinDate;
        }
      }

      // Remove empty password for updates
      if (editingEmployee && !submitData.password) {
        delete submitData.password;
      }

      // Log the data being sent for debugging
      console.log('📤 Submitting employee data:', {
        isUpdate: !!editingEmployee,
        employeeId: editingEmployee?._id,
        role: submitData.role,
        hasDriverData: formData.role === 'driver' || editingEmployee?.role === 'driver',
        dataKeys: Object.keys(submitData)
      });

      if (editingEmployee) {
        // Update existing employee
        const response = await updateEmployee(editingEmployee._id, submitData);
        console.log('📥 Update employee response:', response);

        // Check if response exists and has success property
        if (response && response.success === true) {
          addNotification('success', response.message || 'Employee updated successfully');

          // Close modal and reset state
          setShowAddModal(false);
          resetForm();

          // Refresh the employee list to show updated data
          await fetchEmployees();
        } else {
          // Handle both success: false and error responses
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
          } else if (response?.error?.message) {
            errorMessage = response.error.message;
          } else if (typeof response?.error === 'string') {
            errorMessage = response.error;
          }

          console.log('❌ Update employee error - Response:', JSON.stringify(response, null, 2));
          console.log('❌ Error message to show:', errorMessage);
          addNotification('error', errorMessage);
        }
      } else {
        // Create new employee
        const response = await createEmployee(submitData);
        console.log('Create employee response:', response);

        // Check if response exists and has success property
        if (response && response.success === true) {
          addNotification('success', response.message || 'Employee created successfully');
          fetchEmployees();
          setShowAddModal(false);
          resetForm();
        } else {
          // Handle both success: false and error responses
          // Prioritize detailed errors from errors array over generic message
          let errorMessage = 'Failed to create employee';

          if (Array.isArray(response?.errors) && response.errors.length > 0) {
            // Extract detailed validation errors
            const errorDetails = response.errors.map((e: any) => {
              const field = e.path || e.field || '';
              const msg = e.msg || e.message || '';
              return field ? `${field}: ${msg}` : msg;
            }).join('; ');
            errorMessage = errorDetails || response?.message || 'Validation failed';
          } else if (response?.message) {
            errorMessage = response.message;
          } else if (response?.error?.message) {
            errorMessage = response.error.message;
          } else if (typeof response?.error === 'string') {
            errorMessage = response.error;
          }

          console.log('❌ Create employee error - Response:', JSON.stringify(response, null, 2));
          console.log('❌ Error message to show:', errorMessage);
          addNotification('error', errorMessage);
        }
      }
    } catch (error: any) {
      console.error('❌ Error saving employee (catch block):', error);

      // Extract error message from various possible locations
      // Prioritize detailed errors from errors array over generic message
      let errorMessage = 'An unexpected error occurred';
      const errorData = error?.response?.data;

      if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
        // Extract detailed validation errors
        const errorDetails = errorData.errors.map((e: any) => {
          const field = e.path || e.field || '';
          const msg = e.msg || e.message || '';
          return field ? `${field}: ${msg}` : msg;
        }).join('; ');
        errorMessage = errorDetails || errorData?.message || 'Validation failed';
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      } else if (typeof errorData?.error === 'string') {
        errorMessage = errorData.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      console.log('❌ Catch error message to show:', errorMessage);
      console.log('❌ Full error object:', JSON.stringify(errorData || error, null, 2));
      addNotification('error', errorMessage);
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

    // Show driver panel and populate driver fields if role is driver
    if (employee.role === 'driver') {
      // setShowDriverPanel(true);

      // Populate driver form data from employee details
      const details = (employee as any).details || {};
      setDriverFormData({
        incorporation: details.incorporation || '',
        employeeCode: details.employeeCode || employee.internalId || '',
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
    }

    setShowAddModal(true);
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
    // setShowDriverPanel(role === 'driver');
    setActiveTab('basic');
  };

  const renderBasicInformationTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incorporation
          </label>
          <div className="flex">
            <select
              name="incorporation"
              value={driverFormData.incorporation}
              onChange={handleDriverInputChange}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Incorporation</option>
              <option value="Corporation">Corporation</option>
              <option value="Partnership">Partnership</option>
              <option value="Sole Proprietorship">Sole Proprietorship</option>
            </select>
            <button
              type="button"
              className="px-3 py-2.5 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee Code
          </label>
          <input
            type="text"
            name="employeeCode"
            value={driverFormData.employeeCode}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Postal / Zip Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="postalCode"
          value={driverFormData.postalCode}
          onChange={handleDriverInputChange}
          placeholder="00000"
          pattern="[0-9]{5}"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderEmploymentContactTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fleet
          </label>
          <div className="flex">
            <select
              name="fleet"
              value={driverFormData.fleet}
              onChange={handleDriverInputChange}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Fleet</option>
              <option value="Fleet A">Fleet A</option>
              <option value="Fleet B">Fleet B</option>
              <option value="Fleet C">Fleet C</option>
            </select>
            <button
              type="button"
              className="px-3 py-2.5 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Citizenship
          </label>
          <select
            name="citizenship"
            value={driverFormData.citizenship}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            name="paymentMethod"
            value={driverFormData.paymentMethod}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Payment Method</option>
            <option value="Direct Deposit">Direct Deposit</option>
            <option value="Check">Check</option>
            <option value="Wire Transfer">Wire Transfer</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account
          </label>
          <div className="flex">
            <select
              name="account"
              value={driverFormData.account}
              onChange={handleDriverInputChange}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Account</option>
              <option value="Account A">Account A</option>
              <option value="Account B">Account B</option>
            </select>
            <button
              type="button"
              className="px-3 py-2.5 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
            >
              +
            </button>
          </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WSIB Account No
          </label>
          <input
            type="text"
            name="wsibAccountNo"
            value={driverFormData.wsibAccountNo}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date
          </label>
          <input
            type="date"
            name="expiryDate"
            value={driverFormData.expiryDate}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GST No
          </label>
          <input
            type="text"
            name="gstNo"
            value={driverFormData.gstNo}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Remark
        </label>
        <textarea
          name="remark"
          value={driverFormData.remark}
          onChange={handleDriverInputChange}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="company"
            checked={driverFormData.company}
            onChange={handleDriverInputChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">Company (Black River Logistics Ltd)</label>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="medicalRequired"
            checked={driverFormData.medicalRequired}
            onChange={handleDriverInputChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">Medical Required</label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cell 1 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="cell1"
            value={driverFormData.cell1}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cell 2
          </label>
          <input
            type="tel"
            name="cell2"
            value={driverFormData.cell2}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Extn. #
          </label>
          <input
            type="text"
            name="extension"
            value={driverFormData.extension}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fax #
          </label>
          <input
            type="tel"
            name="fax"
            value={driverFormData.fax}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            name="gender"
            value={driverFormData.gender}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={driverFormData.dateOfBirth}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Term. Date
          </label>
          <input
            type="date"
            name="termDate"
            value={driverFormData.termDate}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="csa"
            checked={driverFormData.csa}
            onChange={handleDriverInputChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">CSA</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fast Card #
          </label>
          <input
            type="text"
            name="fastCardNo"
            value={driverFormData.fastCardNo}
            onChange={handleDriverInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fast Card Expiry
        </label>
        <input
          type="date"
          name="fastCardExpiry"
          value={driverFormData.fastCardExpiry}
          onChange={handleDriverInputChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Image Upload
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="profileImage"
            />
            <label
              htmlFor="profileImage"
              className="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
            >
              Choose File
            </label>
            <button
              type="button"
              className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="profileImage"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">Delete Profile Image</label>
        </div>
      </div>
    </div>
  );


  const renderPaymentProfileTab = () => (
    <div className="space-y-8">
      {/* Default Charges Tab */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <span>Default Charges</span>
        </h4>
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <select
                name="defaultChargeName"
                value={driverFormData.defaultChargeName}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Name</option>
                <option value="Advance Payment">Advance Payment</option>
                <option value="Personal Expense">Personal Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                name="defaultCurrency"
                value={driverFormData.defaultCurrency}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Currency</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="USD">USD - United States Dollar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Charges Applied On <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="chargesAppliedOn"
                  value="Settlements"
                  checked={driverFormData.chargesAppliedOn === 'Settlements'}
                  onChange={handleDriverInputChange}
                  className="mr-2"
                />
                Settlements
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="chargesAppliedOn"
                  value="Payment"
                  checked={driverFormData.chargesAppliedOn === 'Payment'}
                  onChange={handleDriverInputChange}
                  className="mr-2"
                />
                Payment
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode <span className="text-red-500">*</span>
              </label>
              <select
                name="defaultMode"
                value={driverFormData.defaultMode}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Mode</option>
                <option value="Flat">Flat</option>
                <option value="Percentage">Percentage(%)</option>
                <option value="Miles Rate">Miles Rate</option>
                <option value="Hours Rate">Hours Rate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="defaultAmount"
                value={driverFormData.defaultAmount}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              name="defaultRemarks"
              value={driverFormData.defaultRemarks}
              onChange={handleDriverInputChange}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>


        </div>
      </div>

      {/* Payment Profile Tab */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <span>Payment Profile</span>
        </h4>
        <div className="bg-gray-50 p-6 rounded-lg space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Payroll Type <span className="text-red-500">*</span>
              </label>
              <select
                name="defaultPayrollType"
                value={driverFormData.defaultPayrollType}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Payroll Type</option>
                <option value="Owner Operator">Owner Operator</option>
                <option value="Company Driver">Company Driver</option>
                <option value="Team Driver">Team Driver</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentCurrency"
                value={driverFormData.paymentCurrency}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Currency</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="USD">USD - United States Dollar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mile Rate (Solo)
              </label>
              <input
                type="number"
                step="0.01"
                name="mileRate"
                value={driverFormData.mileRate}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mile Rate (Team)
              </label>
              <input
                type="number"
                step="0.01"
                name="mileRateTeam"
                value={driverFormData.mileRateTeam}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empty Mile Rate
              </label>
              <input
                type="number"
                step="0.01"
                name="emptyMileRate"
                value={driverFormData.emptyMileRate}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empty Mile Rate (Team)
              </label>
              <input
                type="number"
                step="0.01"
                name="emptyMileRateTeam"
                value={driverFormData.emptyMileRateTeam}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate
              </label>
              <input
                type="number"
                step="0.01"
                name="hourlyRate"
                value={driverFormData.hourlyRate}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight Rate
              </label>
              <input
                type="number"
                step="0.01"
                name="weightRate"
                value={driverFormData.weightRate}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentage Rate
              </label>
              <input
                type="number"
                step="0.01"
                name="percentageRate"
                value={driverFormData.percentageRate}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local Tax #
              </label>
              <input
                type="text"
                name="localTaxNo"
                value={driverFormData.localTaxNo}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Federal Tax #
              </label>
              <input
                type="text"
                name="federalTaxNo"
                value={driverFormData.federalTaxNo}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SIN No.
              </label>
              <input
                type="text"
                name="sinNo"
                value={driverFormData.sinNo}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CRA (Payroll Account Number)
              </label>
              <input
                type="text"
                name="craAccountNo"
                value={driverFormData.craAccountNo}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exemptions</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="fedTaxExempt"
                    checked={driverFormData.fedTaxExempt}
                    onChange={handleDriverInputChange}
                    className="mr-2"
                  />
                  Fed Tax
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="provTaxExempt"
                    checked={driverFormData.provTaxExempt}
                    onChange={handleDriverInputChange}
                    className="mr-2"
                  />
                  Prov Tax
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="cppQppExempt"
                    checked={driverFormData.cppQppExempt}
                    onChange={handleDriverInputChange}
                    className="mr-2"
                  />
                  CPP/QPP
                </label>
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="eiExempt"
                    checked={driverFormData.eiExempt}
                    onChange={handleDriverInputChange}
                    className="mr-2"
                  />
                  EI
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="qpipExempt"
                    checked={driverFormData.qpipExempt}
                    onChange={handleDriverInputChange}
                    className="mr-2"
                  />
                  QPIP
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pay Period
              </label>
              <select
                name="payPeriod"
                value={driverFormData.payPeriod}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Pay Period</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vacation Pay
              </label>
              <select
                name="vacationPay"
                value={driverFormData.vacationPay}
                onChange={handleDriverInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Vacation Pay</option>
                <option value="4%">4%</option>
                <option value="6%">6%</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="ltl"
                  checked={driverFormData.ltl}
                  onChange={handleDriverInputChange}
                  className="mr-2"
                />
                LTL
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="onSettlements"
                  checked={driverFormData.onSettlements}
                  onChange={handleDriverInputChange}
                  className="mr-2"
                />
                On Settlements
              </label>
            </div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="settlementCurrencyByOrder"
                  checked={driverFormData.settlementCurrencyByOrder}
                  onChange={handleDriverInputChange}
                  className="mr-2"
                />
                Settlement Currency By Order
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={driverFormData.isDefault}
                  onChange={handleDriverInputChange}
                  className="mr-2"
                />
                Is Default
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#EDF8FF] overflow-hidden">
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showAddModal ? 'mr-[800px]' : ''} overflow-hidden`}>
        <div className="flex-1 overflow-y-auto p-8" style={{ ...ACCENT_VARS, transform: 'scale(0.99)', transformOrigin: 'top left', width: '101.01%', height: '101.01%' }}>
          {/* Notifications Container - Updated z-index to be above modal */}
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

          {loading ? (
            <div className="grid grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                  <div className="bg-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {employees.map((employee) => (
                <div key={employee._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div
                    className="p-4 text-white rounded-t-xl"
                    style={{ backgroundImage: ACCENT_GRADIENT }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-lg"
                          style={{ color: ACCENT_PRIMARY }}
                        >
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{employee.name}</h3>
                          <p className="text-sm text-white">
                            {employee.internalId}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${employee.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {employee.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Role</p>
                        <p className="text-sm font-medium text-gray-800">{getRoleDisplayName(employee.role)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Country</p>
                        <p className="text-sm font-medium text-gray-800">{employee.country}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="text-sm font-medium" style={{ color: ACCENT_DARK }}>
                          {employee.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <p className="text-sm font-medium text-gray-800">{employee.phone}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Address</p>
                      <p className="text-sm text-gray-700">{employee.location?.address || 'No address provided'}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm text-gray-700">{employee.city}, {employee.state}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Join Date</p>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(employee.joinDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Employee ID</p>
                        <p className="text-sm font-medium text-gray-800">{employee.internalId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusToggle(employee)}
                      className={`flex-1 px-4 py-2 !mr-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-1 ${employee.status === 'active'
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                    >
                      <span>{employee.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                    </button>
                    <button
                      onClick={() => handleEdit(employee)}
                      className="flex-1 px-4 py-2 !mr-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1">
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(employee._id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10001] flex justify-end">
          <div className="bg-white w-[800px] h-full shadow-2xl overflow-y-auto border-l border-gray-200">
            <div
              className="px-6 py-4 flex items-center justify-between"
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
                onClick={() => setShowAddModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
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
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-6 py-2.5 border border-gray-300 !mr-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 !text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium shadow-md hover:shadow-lg"
              >
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div >
      )}

      {/* Delete Confirmation Modal */}
      {
        deleteConfirm.show && (
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
        )
      }

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
    </div >
  );
};

export default EmployeesPage;