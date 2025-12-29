import { useState, useEffect, useRef } from 'react';
import { Edit, Trash2, Plus, X, RefreshCw, AlertCircle, User, Search, Eye, CheckCircle, FileText, Briefcase, Phone, Globe, MapPin, CreditCard, Heart, Building2, DollarSign, Snowflake, Thermometer, Upload, ChevronLeft, ChevronRight, Save, Filter, ArrowUpDown, Mail, Wrench, Users, ChevronUp, ChevronDown, Calendar, Award, AlertTriangle, FileText as FileTextIcon, PlusCircle, Check } from 'lucide-react';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import * as driverApi from '../../../../axios/api/driver';
import { getDocumentsByEmployee, createEmployeeDocument, getSignedEmployeeDocumentUrl } from '../../../../axios/api/employeeDocument';
import type { EmployeeDocument } from '../../../../axios/api/employeeDocument';

// Static driver data matching the image
interface Driver {
  driverId: string;
  firstName: string;
  lastName: string;
  driversLicence: string;
  passport: string;
  dateOfBirth: string;
  notes: string;
  ticketYTD: number;
  status: string;
  compliance: 'COMPLIANT' | 'EXPIRING SOON' | 'NON-COMPLIANT';
}

const staticDrivers: Driver[] = [
  {
    driverId: 'BRBS75',
    firstName: 'BALJINDER',
    lastName: 'SINGH',
    driversLicence: 'SI-NG-HB-*S23B8',
    passport: 'Y2051470',
    dateOfBirth: '01/28/1998',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'COMPLIANT'
  },
  {
    driverId: 'BRJS49',
    firstName: 'JASKIRAT',
    lastName: 'SINGH',
    driversLicence: 'SI-NG-HJ-*999R2',
    passport: 'V1705202',
    dateOfBirth: '12/22/2001',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'COMPLIANT'
  },
  {
    driverId: 'BRMC50',
    firstName: 'MANPREET',
    lastName: 'SINGH CHAUDHARY',
    driversLicence: 'SI-NG-HM-*020LW',
    passport: 'P9519579',
    dateOfBirth: '06/16/1998',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'COMPLIANT'
  },
  {
    driverId: 'BRGM52',
    firstName: 'GURMAN',
    lastName: 'MANGAT',
    driversLicence: 'MA-NG-AG-S988WB',
    passport: 'T0092005',
    dateOfBirth: '09/02/2002',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'EXPIRING SOON'
  },
  {
    driverId: 'BRKS53',
    firstName: 'KARAN',
    lastName: 'SINGH',
    driversLicence: 'SI-NG-HK-*123AB',
    passport: 'T1234567',
    dateOfBirth: '03/15/1995',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'COMPLIANT'
  },
  {
    driverId: 'BRHS54',
    firstName: 'HARJINDER',
    lastName: 'SINGH',
    driversLicence: 'SI-NG-HH-*456CD',
    passport: 'T2345678',
    dateOfBirth: '07/20/1999',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'COMPLIANT'
  },
  {
    driverId: 'BRPS55',
    firstName: 'PARAMJIT',
    lastName: 'SINGH',
    driversLicence: 'SI-NG-HP-*789EF',
    passport: 'T3456789',
    dateOfBirth: '11/10/1997',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'COMPLIANT'
  },
  {
    driverId: 'BRSS56',
    firstName: 'SUKHJINDER',
    lastName: 'SINGH',
    driversLicence: 'SI-NG-HS-*012GH',
    passport: 'T4567890',
    dateOfBirth: '05/25/2000',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'COMPLIANT'
  },
  {
    driverId: 'BRMS57',
    firstName: 'MANDEEP',
    lastName: 'SINGH',
    driversLicence: 'SI-NG-HM-*345IJ',
    passport: 'T5678901',
    dateOfBirth: '08/30/1996',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'COMPLIANT'
  },
  {
    driverId: 'BRGS58',
    firstName: 'GURPREET',
    lastName: 'SINGH',
    driversLicence: 'SI-NG-HG-*678KL',
    passport: 'T6789012',
    dateOfBirth: '02/14/1998',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'COMPLIANT'
  },
  {
    driverId: 'BRAS59',
    firstName: 'AMANDEEP',
    lastName: 'SINGH',
    driversLicence: 'SI-NG-HA-*901MN',
    passport: 'T7890123',
    dateOfBirth: '10/05/2001',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'COMPLIANT'
  },
  {
    driverId: 'BRRS60',
    firstName: 'RAVINDER',
    lastName: 'SINGH',
    driversLicence: 'SI-NG-HR-*234OP',
    passport: 'T8901234',
    dateOfBirth: '04/18/1999',
    notes: '',
    ticketYTD: 0,
    status: 'ACTIVE',
    compliance: 'COMPLIANT'
  }
];

const DriverManagement = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'external' | 'unassigned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; driverId: string | null }>({ show: false, driverId: null });
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [driverDocuments, setDriverDocuments] = useState<any[]>([]);

  const [showDocumentsModal, setShowDocumentsModal] = useState<{ show: boolean; driver: Driver | null }>({ show: false, driver: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  
  const [filterBy, setFilterBy] = useState('Active');
  const [category, setCategory] = useState('');
  const [complianceStatus, setComplianceStatus] = useState('All');
  const [sortBy, setSortBy] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Driver | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });
  const [showNewDriverModal, setShowNewDriverModal] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'personal' | 'travel' | 'documents' | 'certifications' | 'violations' | 'notes' | 'deductions' | 'additions'>('basic');
  
  // Form state for Basic Information
  const [formData, setFormData] = useState({
    driverId: '',
    firstName: '',
    middle: '',
    lastName: '',
    emailAddress: '',
    dateOfBirth: '',
    mobileApp: false,
    pin: '',
    primaryPhone: '+1',
    secondaryPhone: '+1',
    searchAddress: '',
    address: '',
    unit: '',
    city: '',
    postalCode: '',
    country: '',
    stateProvince: '',
    profileImage: null as File | null
  });

  // Form state for Personal Information
  const [personalData, setPersonalData] = useState({
    socialInsuranceNumber: '',
    hireDate: '',
    terminationDate: '',
    status: 'Active',
    vacationPercent: '',
    // Pay Information
    paySearchAddress: '',
    corporationName: '',
    driverName: '',
    paymentAddress: '',
    gstNo: '',
    // Pay Type
    driverType: 'COMPANY DRIVER' as 'COMPANY DRIVER' | 'OWNER OPERATOR',
    paymentMethod: 'PAID PER MILE' as 'PAID PER MILE' | 'PAID PERCENT' | 'PAID BY TRIP' | 'PAID PER HOUR' | 'PAID PER DAY',
    // $/Mile Details
    alone: '0',
    empty: '0',
    bonusDrop: '0',
    team: '0',
    emptyTeam: '0',
    bonusPick: '0',
    bonusLayover: '0',
    // Percent Rate (for PAID PERCENT)
    percentRate: '0',
    // Driver Type
    driverTypeSolo: true, // true = SOLO, false = TEAM
    // Exemptions
    cppExempt: false,
    payrollTaxExempt: false,
    // Custom HST
    customHst: ''
  });

  // Form state for Travel Information
  const [travelData, setTravelData] = useState({
    // Travel Information
    driversLicenseNumber: '',
    driversLicenseExpiry: '',
    licenseStateProvince: '',
    passportNumber: '',
    passportCountry: '',
    passportExpiry: '',
    fastCardNumber: '',
    fastCardExpiry: '',
    fastCardValid: false,
    // Canadian Worker Status
    canadianWorkerStatus: 'PERMANENT RESIDENT' as 'CANADIAN CITIZEN' | 'PERMANENT RESIDENT' | 'WORK PERMIT',
    // Permanent Residence Expiry
    permanentResidenceExpiry: '',
    // Work Permit Expiry
    workPermitExpiry: '',
    // WCB Number
    wcbNumber: ''
  });

  // Form state for Documents
  const [documentsTab, setDocumentsTab] = useState<'general' | 'driving-violations' | 'other-violations' | 'other' | 'warning-letters'>('general');
  const [documents, setDocuments] = useState<Array<{
    id: string;
    expiryDate: string;
    description: string;
    ignoreExpiration: boolean;
    file?: File | null;
  }>>([]);
  const [newDocument, setNewDocument] = useState({
    expiryDate: '',
    description: '',
    ignoreExpiration: false,
    file: null as File | null
  });

  // Form state for Safety Certifications
  const [certifications, setCertifications] = useState<Array<{
    id: string;
    expiryDate: string;
    title: string;
    subCategory: string;
    result: string;
    ignoreExpiration: boolean;
  }>>([]);
  const [newCertification, setNewCertification] = useState({
    expiryDate: '',
    title: '',
    subCategory: '',
    result: '',
    ignoreExpiration: false
  });
  const [selectedCertificate, setSelectedCertificate] = useState<{
    id: string;
    expiryDate: string;
    title: string;
    subCategory: string;
    result: string;
    ignoreExpiration: boolean;
  } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; size: number }>>({});
  const [documentFile, setDocumentFile] = useState<{ name: string; size: number } | null>(null);

  // Form state for Violations
  const [violations, setViolations] = useState<Array<{
    id: string;
    paymentDueDate: string;
    ticket: string;
    file?: { name: string; size: number } | null;
  }>>([]);
  const [newViolation, setNewViolation] = useState({
    paymentDueDate: '',
    ticket: '',
    file: null as { name: string; size: number } | null
  });
  const [violationFile, setViolationFile] = useState<{ name: string; size: number } | null>(null);

  // Form state for Notes
  const [notes, setNotes] = useState<Array<{
    id: string;
    note: string;
    category: string;
  }>>([]);
  const [newNote, setNewNote] = useState({
    note: '',
    category: ''
  });

  // Form state for Deductions
  const [deductions, setDeductions] = useState<Array<{
    id: string;
    startDate: string;
    description: string;
    amount: string;
    interval: string;
    currency: string;
  }>>([]);
  const [newDeduction, setNewDeduction] = useState({
    startDate: '',
    description: '',
    amount: '0',
    interval: '',
    currency: 'CAD'
  });

  // Form state for Additions
  const [additions, setAdditions] = useState<Array<{
    id: string;
    startDate: string;
    description: string;
    amount: string;
    interval: string;
    currency: string;
  }>>([]);
  const [newAddition, setNewAddition] = useState({
    startDate: '',
    description: '',
    amount: '0',
    interval: '',
    currency: 'CAD'
  });

  // Filter drivers based on active tab
  const getFilteredDrivers = () => {
    let filtered = staticDrivers;

    // Apply tab filter
    if (activeTab === 'external') {
      // For external, show all except unassigned (mock logic)
      filtered = staticDrivers.filter((_, index) => index < 46);
    } else if (activeTab === 'unassigned') {
      // For unassigned, show last 3 (mock logic)
      filtered = staticDrivers.slice(-3);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        driver =>
          driver.driverId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          driver.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          driver.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          driver.driversLicence.toLowerCase().includes(searchTerm.toLowerCase()) ||
          driver.passport.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply compliance status filter
    if (complianceStatus !== 'All') {
      const complianceMap: Record<string, Driver['compliance']> = {
        'Compliant': 'COMPLIANT',
        'Expiring Soon': 'EXPIRING SOON',
        'Non-Compliant': 'NON-COMPLIANT'
      };
      const mappedStatus = complianceMap[complianceStatus];
      if (mappedStatus) {
        filtered = filtered.filter(driver => driver.compliance === mappedStatus);
      }
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
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

  const filteredDrivers = getFilteredDrivers();

  const handleSort = (key: keyof Driver) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof Driver) => {
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

  const getComplianceButtonClass = (compliance: Driver['compliance']) => {
    switch (compliance) {
      case 'COMPLIANT':
        return 'bg-[#10b981] text-white';
      case 'EXPIRING SOON':
        return 'bg-[#f59e0b] text-white';
      case 'NON-COMPLIANT':
        return 'bg-[#ef4444] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTabCount = (tab: 'all' | 'external' | 'unassigned') => {
    switch (tab) {
      case 'all':
        return 49;
      case 'external':
        return 46;
      case 'unassigned':
        return 3;
      default:
        return 0;
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ show: true, driverId: id });
  };

  const confirmDeleteDriver = async () => {
    if (!deleteConfirm.driverId) return;

    try {
      const response = await driverApi.deleteDriver(deleteConfirm.driverId);
      if (response.success) {
        // TODO: Implement fetchDrivers function
        // await fetchDrivers();
        alert('Driver deleted successfully!');
      } else {
        alert(response.message || 'Failed to delete driver');
      }
    } catch (error: any) {
      console.error('Error deleting driver:', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete driver');
    } finally {
      setDeleteConfirm({ show: false, driverId: null });
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await driverApi.updateDriverStatus(id, newStatus);
      if (response.success) {
        // TODO: Implement fetchDrivers function
        // await fetchDrivers();
      } else {
        alert(response.message || 'Failed to update driver status');
      }
    } catch (error: any) {
      console.error('Error updating driver status:', error);
      alert(error.response?.data?.message || error.message || 'Failed to update driver status');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  return (
    <div className="min-h-screen bg-[#EDF8FF] p-6">
      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-700">({getTabCount(activeTab)})</span>
              <button 
                onClick={() => setShowNewDriverModal(true)}
                className="w-10 h-10 bg-[#42aeec] !text-white rounded-lg flex items-center justify-center hover:bg-[#1db5f5] transition-colors shadow-md"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-[#42aeec] border-b-2 border-[#42aeec] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({getTabCount('all')})
            </button>
            <button
              onClick={() => setActiveTab('external')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'external'
                  ? 'text-[#42aeec] border-b-2 border-[#42aeec] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              External ({getTabCount('external')})
            </button>
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'unassigned'
                  ? 'text-[#42aeec] border-b-2 border-[#42aeec] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unassigned ({getTabCount('unassigned')})
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Drivers Licence #, Passport #, Or Name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                />
              </div>
            </div>

       

            {/* Filter By */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Filter By</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent text-sm"
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>All</option>
              </select>
            </div>

            {/* Category */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm min-w-[120px]"
              >
                <option value="">Select...</option>
                <option>StandBy</option>

              </select>
            </div>

            {/* Compliance Status */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Compliance Status</label>
              <select
                value={complianceStatus}
                onChange={(e) => setComplianceStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm min-w-[120px]"
              >
                <option>All</option>
                <option>Compliant</option>
                <option>Expiring Soon</option>
                <option>Non-Compliant</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm min-w-[120px]"
              >
                <option value="">Select...</option>
                <option>Driver ID</option>
                <option>First Name</option>
                <option>Last Name</option>
                <option>Status</option>
              </select>
            </div>

         
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {/* Driver ID */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort('driverId')}
                        className="flex items-center gap-2 hover:text-gray-700 font-medium text-xs text-gray-700 uppercase"
                      >
                        Driver ID
                        {getSortIcon('driverId')}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                    />
                  </th>

                  {/* First Name */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort('firstName')}
                        className="flex items-center gap-2 hover:text-gray-700 font-medium text-xs text-gray-700 uppercase"
                      >
                        First Name
                        {getSortIcon('firstName')}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                    />
                  </th>

                  {/* Last Name */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort('lastName')}
                        className="flex items-center gap-2 hover:text-gray-700 font-medium text-xs text-gray-700 uppercase"
                      >
                        Last Name
                        {getSortIcon('lastName')}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                    />
                  </th>

                  {/* Drivers Licence */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort('driversLicence')}
                        className="flex items-center gap-2 hover:text-gray-700 font-medium text-xs text-gray-700 uppercase"
                      >
                        Drivers Licence
                        {getSortIcon('driversLicence')}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                    />
                  </th>

                  {/* Passport */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort('passport')}
                        className="flex items-center gap-2 hover:text-gray-700 font-medium text-xs text-gray-700 uppercase"
                      >
                        Passport
                        {getSortIcon('passport')}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                    />
                  </th>

                  {/* Date Of Birth */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort('dateOfBirth')}
                        className="flex items-center gap-2 hover:text-gray-700 font-medium text-xs text-gray-700 uppercase"
                      >
                        Date Of Birth
                        {getSortIcon('dateOfBirth')}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                    />
                  </th>

                  {/* Notes */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-gray-700 uppercase">Notes</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                    />
                  </th>

                  {/* Ticket (YTD) */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort('ticketYTD')}
                        className="flex items-center gap-2 hover:text-gray-700 font-medium text-xs text-gray-700 uppercase"
                      >
                        Ticket (YTD)
                        {getSortIcon('ticketYTD')}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                    />
                  </th>

                  {/* Status */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 hover:text-gray-700 font-medium text-xs text-gray-700 uppercase"
                      >
                        Status
                        {getSortIcon('status')}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Filter..."
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                    />
                  </th>

                  {/* Compliance */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-gray-700 uppercase">Compliance</span>
                    </div>
                    <select
                      value={complianceStatus}
                      onChange={(e) => setComplianceStatus(e.target.value)}
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                    >
                      <option>All</option>
                      <option>Compliant</option>
                      <option>Expiring Soon</option>
                      <option>Non-Compliant</option>
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrivers.map((driver, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.driverId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.firstName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.lastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.driversLicence}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.passport}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.dateOfBirth}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{driver.notes || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.ticketYTD}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.status}</td>
                    <td className="px-4 py-3">
                      <button
                        className={`px-3 py-1 rounded text-xs font-medium ${getComplianceButtonClass(driver.compliance)}`}
                      >
                        {driver.compliance}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Driver Modal */}
      {showNewDriverModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewDriverModal(false);
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
                <div className="border-2 border-dashed border-gray-300  p-8 text-center mb-3">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Select Image</p>
                </div>
                <button className="w-full bg-black !text-white py-2  font-medium hover:bg-gray-800 transition-colors">
                  UPLOAD
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex-1 overflow-y-auto p-4">
  <nav className="flex flex-col gap-2">
    {[
      { id: 'basic', label: 'Basic', icon: User },
      { id: 'personal', label: 'Personal', icon: User },
      { id: 'travel', label: 'Travel', icon: MapPin },
      { id: 'documents', label: 'Documents', icon: FileTextIcon },
      { id: 'certifications', label: 'Certifications', icon: Award },
      { id: 'violations', label: 'Violations', icon: AlertTriangle },
      { id: 'notes', label: 'Notes', icon: FileTextIcon },
      { id: 'deductions', label: 'Deductions', icon: DollarSign },
      { id: 'additions', label: 'Additions', icon: PlusCircle }
    ].map((tab) => {
      const Icon = tab.icon;
      const isActive = activeFormTab === tab.id;

      return (
        <button
          key={tab.id}
          onClick={() => setActiveFormTab(tab.id as any)}
          className={`w-full flex items-center gap-2 px-3 py-2 transition-colors text-left ${
            isActive
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
            <div className={`flex-1 flex flex-col overflow-hidden transition-all ${selectedCertificate ? 'mr-96' : ''}`}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <h2 className="text-2xl font-bold text-gray-900">New Driver</h2>
                <div className="flex items-center gap-3">
                  <button className="px-6 py-2 bg-gray-600 !text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                    SAVE
                  </button>
                  <button
                    onClick={() => setShowNewDriverModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {activeFormTab === 'basic' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
                    
                    {/* First Row */}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver ID</label>
                        <input
                          type="text"
                          placeholder="Driver ID"
                          value={formData.driverId}
                          onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Middle</label>
                        <input
                          type="text"
                          placeholder="Middle"
                          value={formData.middle}
                          onChange={(e) => setFormData({ ...formData, middle: e.target.value })}
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
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Second Row */}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={formData.emailAddress}
                          onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date Of Birth<span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile App</label>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, mobileApp: !formData.mobileApp })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              formData.mobileApp ? 'bg-[#42aeec]' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                formData.mobileApp ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
                        <input
                          type="text"
                          placeholder="Pin"
                          value={formData.pin}
                          onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Third Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Primary Phone #<span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                            <span className="text-sm">🇺🇸</span>
                            <span className="text-sm text-gray-600">+1</span>
                          </div>
                          <input
                            type="tel"
                            placeholder=""
                            value={formData.primaryPhone}
                            onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                            className="w-full pl-16 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Phone #</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                            <span className="text-sm">🇺🇸</span>
                            <span className="text-sm text-gray-600">+1</span>
                          </div>
                          <input
                            type="tel"
                            placeholder=""
                            value={formData.secondaryPhone}
                            onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                            className="w-full pl-16 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fourth Row */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search Address</label>
                      <input
                        type="text"
                        placeholder="Search For An Address..."
                        value={formData.searchAddress}
                        onChange={(e) => setFormData({ ...formData, searchAddress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>

                    {/* Fifth Row */}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          placeholder="Address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <input
                          type="text"
                          placeholder="Unit"
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Sixth Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <select
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Country</option>
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                        <select
                          value={formData.stateProvince}
                          onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select State/</option>
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
                        Personal <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeFormTab === 'personal' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                    
                    {/* Personal Information Section */}
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Social Insurance Number</label>
                        <input
                          type="text"
                          placeholder="Social Insurance Nu"
                          value={personalData.socialInsuranceNumber}
                          onChange={(e) => setPersonalData({ ...personalData, socialInsuranceNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                        <input
                          type="text"
                          placeholder="Select"
                          value={personalData.hireDate}
                          onChange={(e) => setPersonalData({ ...personalData, hireDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Termination Date</label>
                        <input
                          type="text"
                          placeholder="Select"
                          value={personalData.terminationDate}
                          onChange={(e) => setPersonalData({ ...personalData, terminationDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status<span className="text-red-500">*</span>
                        </label>
                        <select
                          value={personalData.status}
                          onChange={(e) => setPersonalData({ ...personalData, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Terminated">Terminated</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vacation %</label>
                        <input
                          type="text"
                          placeholder="0"
                          value={personalData.vacationPercent}
                          onChange={(e) => setPersonalData({ ...personalData, vacationPercent: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Pay Information Section */}
                    <div className="mt-6">
                      <h4 className="text-md font-bold text-gray-900 mb-4">Pay Information</h4>
                      <div className="grid grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Search Address</label>
                          <input
                            type="text"
                            placeholder="Search For An Address..."
                            value={personalData.paySearchAddress}
                            onChange={(e) => setPersonalData({ ...personalData, paySearchAddress: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Corporation Name</label>
                          <input
                            type="text"
                            placeholder="Corporation Name"
                            value={personalData.corporationName}
                            onChange={(e) => setPersonalData({ ...personalData, corporationName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                          <input
                            type="text"
                            placeholder="Driver Name"
                            value={personalData.driverName}
                            onChange={(e) => setPersonalData({ ...personalData, driverName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Address</label>
                          <input
                            type="text"
                            placeholder="Payment Address"
                            value={personalData.paymentAddress}
                            onChange={(e) => setPersonalData({ ...personalData, paymentAddress: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">GST No.</label>
                          <input
                            type="text"
                            placeholder="GST No."
                            value={personalData.gstNo}
                            onChange={(e) => setPersonalData({ ...personalData, gstNo: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pay Type Section */}
                    <div className="mt-6">
                      <h4 className="text-md font-bold text-gray-900 mb-4">Pay Type</h4>
                      
                      {/* Driver Type Toggle */}
                      <div className="mb-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPersonalData({ ...personalData, driverType: 'COMPANY DRIVER' })}
                            className={`px-6 py-2 rounded-sm font-medium transition-colors ${
                              personalData.driverType === 'COMPANY DRIVER'
                                ? 'bg-gray-700 !text-white'
                                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            }`}
                          >
                            COMPANY DRIVER
                          </button>
                          <button
                            type="button"
                            onClick={() => setPersonalData({ ...personalData, driverType: 'OWNER OPERATOR' })}
                            className={`px-6 py-2 rounded-sm font-medium transition-colors ${
                              personalData.driverType === 'OWNER OPERATOR'
                                ? 'bg-gray-700 !text-white'
                                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            }`}
                          >
                            OWNER OPERATOR
                          </button>
                        </div>
                      </div>

                      {/* Payment Method Tabs */}
                      <div className="mb-4">
                        <div className="flex gap-2 flex-wrap">
                          {[
                            'PAID PER MILE',
                            'PAID PERCENT',
                            'PAID BY TRIP',
                            'PAID PER HOUR',
                            'PAID PER DAY'
                          ].map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPersonalData({ ...personalData, paymentMethod: method as any })}
                              className={`px-4 py-2 rounded-sm font-medium text-sm transition-colors ${
                                personalData.paymentMethod === method
                                  ? 'bg-gray-700 !text-white'
                                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* $/Mile Details (shown when PAID PER MILE is selected) */}
                      {personalData.paymentMethod === 'PAID PER MILE' && (
                        <div className="grid grid-cols-4 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ALONE<span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={personalData.alone}
                              onChange={(e) => setPersonalData({ ...personalData, alone: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              EMPTY<span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={personalData.empty}
                              onChange={(e) => setPersonalData({ ...personalData, empty: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">BONUS/DROP</label>
                            <input
                              type="text"
                              value={personalData.bonusDrop}
                              onChange={(e) => setPersonalData({ ...personalData, bonusDrop: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              TEAM<span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={personalData.team}
                              onChange={(e) => setPersonalData({ ...personalData, team: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              EMPTY-TEAM<span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={personalData.emptyTeam}
                              onChange={(e) => setPersonalData({ ...personalData, emptyTeam: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">BONUS/PICK</label>
                            <input
                              type="text"
                              value={personalData.bonusPick}
                              onChange={(e) => setPersonalData({ ...personalData, bonusPick: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">BONUS/LAYOVER</label>
                            <input
                              type="text"
                              value={personalData.bonusLayover}
                              onChange={(e) => setPersonalData({ ...personalData, bonusLayover: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}

                      {/* Percent Rate (shown when PAID PERCENT is selected) */}
                      {personalData.paymentMethod === 'PAID PERCENT' && (
                        <div className="mt-4">
                          <h4 className="text-md font-bold text-gray-900 mb-4">Percent Rate</h4>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              %<span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={personalData.percentRate}
                              onChange={(e) => setPersonalData({ ...personalData, percentRate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Driver Type Section */}
                    <div className="mt-6">
                      <h4 className="text-md font-bold text-gray-900 mb-4">Driver Type</h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPersonalData({ ...personalData, driverTypeSolo: true })}
                          className={`px-6 py-2 rounded-sm font-medium transition-colors ${
                            personalData.driverTypeSolo
                              ? 'bg-gray-700 !text-white'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                          }`}
                        >
                          SOLO
                        </button>
                        <button
                          type="button"
                          onClick={() => setPersonalData({ ...personalData, driverTypeSolo: false })}
                          className={`px-6 py-2 rounded-sm font-medium transition-colors ${
                            !personalData.driverTypeSolo
                              ? 'bg-gray-700 text-white'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                          }`}
                        >
                          TEAM
                        </button>
                      </div>
                    </div>

                    {/* Exemption Checkboxes */}
                    <div className="mt-6">
                      <h4 className="text-md font-bold text-gray-900 mb-4">Exemptions</h4>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={personalData.cppExempt}
                            onChange={(e) => setPersonalData({ ...personalData, cppExempt: e.target.checked })}
                            className="w-4 h-4 text-[#42aeec] border-gray-300 rounded focus:ring-[#42aeec]"
                          />
                          <span className="text-sm font-medium text-gray-700">CPP Exempt</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={personalData.payrollTaxExempt}
                            onChange={(e) => setPersonalData({ ...personalData, payrollTaxExempt: e.target.checked })}
                            className="w-4 h-4 text-[#42aeec] border-gray-300 rounded focus:ring-[#42aeec]"
                          />
                          <span className="text-sm font-medium text-gray-700">Payroll Tax Exempt</span>
                        </label>
                      </div>
                    </div>

                    {/* Custom HST % */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custom HST %</label>
                      <input
                        type="text"
                        placeholder="Leave Empty To Use Compar"
                        value={personalData.customHst}
                        onChange={(e) => setPersonalData({ ...personalData, customHst: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
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
                        onClick={() => setActiveFormTab('travel')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        Travel <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeFormTab === 'travel' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Travel Information</h3>
                    
                    {/* Travel Information Section */}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Drivers License #<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Drivers License #"
                          value={travelData.driversLicenseNumber}
                          onChange={(e) => setTravelData({ ...travelData, driversLicenseNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date Of Expiry<span className="text-red-500">*</span>
                        </label>
                        <select
                          value={travelData.driversLicenseExpiry}
                          onChange={(e) => setTravelData({ ...travelData, driversLicenseExpiry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License State/Province</label>
                        <select
                          value={travelData.licenseStateProvince}
                          onChange={(e) => setTravelData({ ...travelData, licenseStateProvince: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passport #<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Passport #"
                          value={travelData.passportNumber}
                          onChange={(e) => setTravelData({ ...travelData, passportNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Passport Country</label>
                        <select
                          value={travelData.passportCountry}
                          onChange={(e) => setTravelData({ ...travelData, passportCountry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="IN">India</option>
                          <option value="UK">United Kingdom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date Of Expiry<span className="text-red-500">*</span>
                        </label>
                        <select
                          value={travelData.passportExpiry}
                          onChange={(e) => setTravelData({ ...travelData, passportExpiry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fast Card #</label>
                        <input
                          type="text"
                          placeholder="Fast Card #"
                          value={travelData.fastCardNumber}
                          onChange={(e) => setTravelData({ ...travelData, fastCardNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Of Expiry</label>
                        <select
                          value={travelData.fastCardExpiry}
                          onChange={(e) => setTravelData({ ...travelData, fastCardExpiry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
                        </select>
                      </div>
                    </div>

                    {/* Fast Card Valid Checkbox */}
                    <div className="mt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={travelData.fastCardValid}
                          onChange={(e) => setTravelData({ ...travelData, fastCardValid: e.target.checked })}
                          className="w-4 h-4 text-[#42aeec] border-gray-300 rounded focus:ring-[#42aeec]"
                        />
                        <span className="text-sm font-medium text-gray-700">Fast Card Valid</span>
                      </label>
                    </div>

                    {/* Canadian Worker Status Section */}
                    <div className="mt-6">
                      <h4 className="text-md font-bold text-gray-900 mb-4">Canadian Worker Status</h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTravelData({ ...travelData, canadianWorkerStatus: 'CANADIAN CITIZEN' })}
                          className={`px-6 py-2 rounded-sm font-medium transition-colors ${
                            travelData.canadianWorkerStatus === 'CANADIAN CITIZEN'
                              ? 'bg-gray-700 !text-white'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                          }`}
                        >
                          CANADIAN CITIZEN
                        </button>
                        <button
                          type="button"
                          onClick={() => setTravelData({ ...travelData, canadianWorkerStatus: 'PERMANENT RESIDENT' })}
                          className={`px-6 py-2 rounded-sm font-medium transition-colors ${
                            travelData.canadianWorkerStatus === 'PERMANENT RESIDENT'
                              ? 'bg-gray-700 !text-white'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                          }`}
                        >
                          PERMANENT RESIDENT
                        </button>
                        <button
                          type="button"
                          onClick={() => setTravelData({ ...travelData, canadianWorkerStatus: 'WORK PERMIT' })}
                          className={`px-6 py-2 rounded-sm font-medium transition-colors ${
                            travelData.canadianWorkerStatus === 'WORK PERMIT'
                              ? 'bg-gray-700 !text-white'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                          }`}
                        >
                          WORK PERMIT
                        </button>
                      </div>
                    </div>

                    {/* Permanent Residence Expiry */}
                    {travelData.canadianWorkerStatus === 'PERMANENT RESIDENT' && (
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Residence Expiry</label>
                        <select
                          value={travelData.permanentResidenceExpiry}
                          onChange={(e) => setTravelData({ ...travelData, permanentResidenceExpiry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent max-w-md"
                        >
                          <option value="">Select</option>
                        </select>
                      </div>
                    )}

                    {/* Work Permit Expiry */}
                    {travelData.canadianWorkerStatus === 'WORK PERMIT' && (
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Work Permit Expiry</label>
                        <input
                          type="date"
                          value={travelData.workPermitExpiry}
                          onChange={(e) => setTravelData({ ...travelData, workPermitExpiry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent max-w-md"
                        />
                      </div>
                    )}

                    {/* WCB Number */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">WCB (Workers' Compensation Board) Number</label>
                      <input
                        type="text"
                        placeholder="WCB (Workers' Compensation Board) Number"
                        value={travelData.wcbNumber}
                        onChange={(e) => setTravelData({ ...travelData, wcbNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent max-w-md"
                      />
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setActiveFormTab('personal')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        <span>←</span> Personal
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
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Documents</h3>
                    
                    {/* Documents Sub-tabs */}
                    <div className="flex gap-2 border-b border-gray-200">
                      {[
                        { id: 'general', label: 'General' },
                        { id: 'driving-violations', label: 'Driving Violations' },
                        { id: 'other-violations', label: 'Other Violations' },
                        { id: 'other', label: 'Other' },
                        { id: 'warning-letters', label: 'Warning Letters' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setDocumentsTab(tab.id as any)}
                          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-[1px] ${
                            documentsTab === tab.id
                              ? 'border-gray-900 text-gray-900 bg-white'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Documents Table with Headers */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">EXPIRY DATE</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">DESCRIPTION</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">IGNORE EXPIRATION</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {/* Input Row */}
                          <tr className="bg-gray-50">
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={newDocument.expiryDate}
                                onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Description"
                                  value={newDocument.description}
                                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                                />
                                {documentFile ? (
                                  <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
                                    <FileText className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-700 truncate max-w-[100px]">{documentFile.name}</span>
                                    <button
                                      onClick={() => {
                                        setDocumentFile(null);
                                        setNewDocument({ ...newDocument, file: null });
                                      }}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                                    <Upload className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-700">Select File</span>
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setDocumentFile({ name: file.name, size: file.size });
                                          setNewDocument({ ...newDocument, file });
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newDocument.ignoreExpiration}
                                    onChange={(e) => setNewDocument({ ...newDocument, ignoreExpiration: e.target.checked })}
                                    className="w-4 h-4 text-[#42aeec] border-gray-300 rounded focus:ring-[#42aeec]"
                                  />
                                  <span className="text-sm text-gray-700">Ignore Expiration</span>
                                </label>
                                <button
                                  onClick={() => {
                                    if (newDocument.expiryDate || newDocument.description) {
                                      const docId = Date.now().toString();
                                      setDocuments([...documents, {
                                        id: docId,
                                        expiryDate: newDocument.expiryDate,
                                        description: newDocument.description,
                                        ignoreExpiration: newDocument.ignoreExpiration,
                                        file: newDocument.file
                                      }]);
                                      if (newDocument.file && documentFile) {
                                        setUploadedFiles({ ...uploadedFiles, [docId]: documentFile });
                                      }
                                      setNewDocument({
                                        expiryDate: '',
                                        description: '',
                                        ignoreExpiration: false,
                                        file: null
                                      });
                                      setDocumentFile(null);
                                    }
                                  }}
                                  className="w-10 h-10 bg-black !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Documents Data Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden mt-4">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">EXPIRY DATE</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">DESCRIPTION</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">IGNORE EXPIRATION</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {documents.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                No Data
                              </td>
                            </tr>
                          ) : (
                            documents.map((doc) => (
                              <tr key={doc.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                                // Could add document details view here if needed
                              }}>
                                <td className="px-4 py-3 text-sm text-gray-900">{doc.expiryDate || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    {doc.description || '-'}
                                    {uploadedFiles[doc.id] && (
                                      <span title={uploadedFiles[doc.id].name}>
                                        <FileText className="w-4 h-4 text-blue-500" />
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {doc.ignoreExpiration ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setActiveFormTab('travel')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        <span>←</span> Travel
                      </button>
                      <button
                        onClick={() => setActiveFormTab('certifications')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        Certifications <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeFormTab === 'certifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Safety Certifications</h3>
                    
                    {/* Certifications Table with Input Row */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">EXPIRY DATE</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">TITLE</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">SUBCATEGORY</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">RESULT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">IGNORE EXPIRATION</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {/* Input Row */}
                          <tr className="bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="relative">
                                <input
                                  type="date"
                                  value={newCertification.expiryDate}
                                  onChange={(e) => setNewCertification({ ...newCertification, expiryDate: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                                  placeholder="mm/dd/yyyy"
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                placeholder="Title"
                                value={newCertification.title}
                                onChange={(e) => setNewCertification({ ...newCertification, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={newCertification.subCategory}
                                onChange={(e) => setNewCertification({ ...newCertification, subCategory: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                              >
                                <option value="">Sub Category</option>
                                <option value="category1">Category 1</option>
                                <option value="category2">Category 2</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={newCertification.result}
                                onChange={(e) => setNewCertification({ ...newCertification, result: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                              >
                                <option value="">Result</option>
                                <option value="pass">Pass</option>
                                <option value="fail">Fail</option>
                                <option value="pending">Pending</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newCertification.ignoreExpiration}
                                    onChange={(e) => setNewCertification({ ...newCertification, ignoreExpiration: e.target.checked })}
                                    className="w-4 h-4 text-[#42aeec] border-gray-300 rounded focus:ring-[#42aeec]"
                                  />
                                  <span className="text-sm text-gray-700">Ignore Expiration</span>
                                </label>
                                <button
                                  onClick={() => {
                                    if (newCertification.expiryDate || newCertification.title) {
                                      setCertifications([...certifications, {
                                        id: Date.now().toString(),
                                        expiryDate: newCertification.expiryDate,
                                        title: newCertification.title,
                                        subCategory: newCertification.subCategory,
                                        result: newCertification.result,
                                        ignoreExpiration: newCertification.ignoreExpiration
                                      }]);
                                      setNewCertification({
                                        expiryDate: '',
                                        title: '',
                                        subCategory: '',
                                        result: '',
                                        ignoreExpiration: false
                                      });
                                    }
                                  }}
                                  className="w-10 h-10 bg-black !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Certifications Data Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden mt-4">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">EXPIRY DATE</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">TITLE</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">SUBCATEGORY</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">RESULT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">IGNORE EXPIRATION</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {certifications.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                No Data
                              </td>
                            </tr>
                          ) : (
                            certifications.map((cert) => (
                              <tr 
                                key={cert.id} 
                                className={`hover:bg-gray-50 cursor-pointer ${selectedCertificate?.id === cert.id ? 'bg-blue-50' : ''}`}
                                onClick={() => setSelectedCertificate(cert)}
                              >
                                <td className="px-4 py-3 text-sm text-gray-900">{cert.expiryDate || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{cert.title || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{cert.subCategory || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{cert.result || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {cert.ignoreExpiration ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Safety Certificate Details Side Panel */}
                    {selectedCertificate && (
                      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 border-l border-gray-200 overflow-y-auto" style={{ top: 0, right: 0 }}>
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Safety Certificate Details</h3>
                            <button
                              onClick={() => setSelectedCertificate(null)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                {selectedCertificate.title || '-'}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                {selectedCertificate.expiryDate || '-'}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                {selectedCertificate.subCategory || '-'}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                {selectedCertificate.result || '-'}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Ignore Expiration</label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                {selectedCertificate.ignoreExpiration ? (
                                  <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-900">Yes</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">No</span>
                                )}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                              <button
                                onClick={() => {
                                  setCertifications(certifications.filter(c => c.id !== selectedCertificate.id));
                                  setSelectedCertificate(null);
                                }}
                                className="w-full px-4 py-2 bg-red-500 !text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                              >
                                Delete Certificate
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setActiveFormTab('documents')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        <span>←</span> Documents
                      </button>
                      <button
                        onClick={() => setActiveFormTab('violations')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        Violations <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeFormTab === 'violations' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Tickets / Violations</h3>
                    
                    {/* Violations Input Row */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Due Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="date"
                            value={newViolation.paymentDueDate}
                            onChange={(e) => setNewViolation({ ...newViolation, paymentDueDate: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ticket</label>
                        <input
                          type="text"
                          placeholder="Ticket"
                          value={newViolation.ticket}
                          onChange={(e) => setNewViolation({ ...newViolation, ticket: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-end">
                        {violationFile ? (
                          <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
                            <FileText className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700 truncate max-w-[100px]">{violationFile.name}</span>
                            <button
                              onClick={() => {
                                setViolationFile(null);
                                setNewViolation({ ...newViolation, file: null });
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
                            <Upload className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">Select File</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setViolationFile({ name: file.name, size: file.size });
                                  setNewViolation({ ...newViolation, file: { name: file.name, size: file.size } });
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            if (newViolation.paymentDueDate || newViolation.ticket) {
                              const violationId = Date.now().toString();
                              setViolations([...violations, {
                                id: violationId,
                                paymentDueDate: newViolation.paymentDueDate,
                                ticket: newViolation.ticket,
                                file: newViolation.file
                              }]);
                              setNewViolation({
                                paymentDueDate: '',
                                ticket: '',
                                file: null
                              });
                              setViolationFile(null);
                            }
                          }}
                          className="w-10 h-10 bg-black !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Violations Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment Due Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ticket</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {violations.length === 0 ? (
                            <tr>
                              <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                                No Data
                              </td>
                            </tr>
                          ) : (
                            violations.map((violation) => (
                              <tr key={violation.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{violation.paymentDueDate || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    {violation.ticket || '-'}
                                    {violation.file && (
                                      <span title={violation.file.name}>
                                        <FileText className="w-4 h-4 text-blue-500" />
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setActiveFormTab('certifications')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        <span>←</span> Certifications
                      </button>
                      <button
                        onClick={() => setActiveFormTab('notes')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        Notes <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeFormTab === 'notes' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Notes</h3>
                    
                    {/* Notes Input Row */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Note"
                          value={newNote.note}
                          onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1">
                        <select
                          value={newNote.category}
                          onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Category</option>
                          <option value="Standby">Standby</option>
                        </select>
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            if (newNote.note) {
                              setNotes([...notes, {
                                id: Date.now().toString(),
                                note: newNote.note,
                                category: newNote.category
                              }]);
                              setNewNote({
                                note: '',
                                category: ''
                              });
                            }
                          }}
                          className="w-10 h-10 bg-black !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Notes Display */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {notes.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          No Data
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {notes.map((note) => (
                            <div key={note.id} className="px-4 py-3 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-900">{note.note}</p>
                                  {note.category && (
                                    <p className="text-xs text-gray-500 mt-1">Category: {note.category}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => setNotes(notes.filter(n => n.id !== note.id))}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setActiveFormTab('violations')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        <span>←</span> Violations
                      </button>
                      <button
                        onClick={() => setActiveFormTab('deductions')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        Deductions <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeFormTab === 'deductions' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Payroll Deductions</h3>
                    
                    {/* Deductions Input Row */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="date"
                            value={newDeduction.startDate}
                            onChange={(e) => setNewDeduction({ ...newDeduction, startDate: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          placeholder="Description"
                          value={newDeduction.description}
                          onChange={(e) => setNewDeduction({ ...newDeduction, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input
                          type="text"
                          placeholder="0"
                          value={newDeduction.amount}
                          onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                        <select
                          value={newDeduction.interval}
                          onChange={(e) => setNewDeduction({ ...newDeduction, interval: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Interval</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Bi-Weekly">Bi-Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select
                          value={newDeduction.currency}
                          onChange={(e) => setNewDeduction({ ...newDeduction, currency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="CAD">CAD</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            if (newDeduction.startDate || newDeduction.description) {
                              setDeductions([...deductions, {
                                id: Date.now().toString(),
                                startDate: newDeduction.startDate,
                                description: newDeduction.description,
                                amount: newDeduction.amount,
                                interval: newDeduction.interval,
                                currency: newDeduction.currency
                              }]);
                              setNewDeduction({
                                startDate: '',
                                description: '',
                                amount: '0',
                                interval: '',
                                currency: 'CAD'
                              });
                            }
                          }}
                          className="w-10 h-10 bg-black !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Deductions Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Start Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Interval</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {deductions.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                No Data
                              </td>
                            </tr>
                          ) : (
                            deductions.map((deduction) => (
                              <tr key={deduction.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{deduction.startDate || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{deduction.description || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{deduction.amount || '0'} {deduction.currency}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{deduction.interval || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setActiveFormTab('notes')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        <span>←</span> Notes
                      </button>
                      <button
                        onClick={() => setActiveFormTab('additions')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        Additions <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeFormTab === 'additions' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Payroll Additions</h3>
                    
                    {/* Additions Input Row */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="date"
                            value={newAddition.startDate}
                            onChange={(e) => setNewAddition({ ...newAddition, startDate: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          placeholder="Description"
                          value={newAddition.description}
                          onChange={(e) => setNewAddition({ ...newAddition, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input
                          type="text"
                          placeholder="0"
                          value={newAddition.amount}
                          onChange={(e) => setNewAddition({ ...newAddition, amount: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                        <select
                          value={newAddition.interval}
                          onChange={(e) => setNewAddition({ ...newAddition, interval: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Interval</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Bi-Weekly">Bi-Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select
                          value={newAddition.currency}
                          onChange={(e) => setNewAddition({ ...newAddition, currency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="CAD">CAD</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            if (newAddition.startDate || newAddition.description) {
                              setAdditions([...additions, {
                                id: Date.now().toString(),
                                startDate: newAddition.startDate,
                                description: newAddition.description,
                                amount: newAddition.amount,
                                interval: newAddition.interval,
                                currency: newAddition.currency
                              }]);
                              setNewAddition({
                                startDate: '',
                                description: '',
                                amount: '0',
                                interval: '',
                                currency: 'CAD'
                              });
                            }
                          }}
                          className="w-10 h-10 bg-black !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Additions Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Start Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Interval</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {additions.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                No Data
                              </td>
                            </tr>
                          ) : (
                            additions.map((addition) => (
                              <tr key={addition.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{addition.startDate || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{addition.description || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{addition.amount || '0'} {addition.currency}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{addition.interval || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Navigation Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setActiveFormTab('deductions')}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                      >
                        <span>←</span> Deductions
                      </button>
                    </div>
                  </div>
                )}

                {activeFormTab !== 'basic' && activeFormTab !== 'personal' && activeFormTab !== 'travel' && activeFormTab !== 'documents' && activeFormTab !== 'certifications' && activeFormTab !== 'violations' && activeFormTab !== 'notes' && activeFormTab !== 'deductions' && activeFormTab !== 'additions' && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      Section coming soon
                    </p>
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

export default DriverManagement;
