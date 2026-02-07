import { useState, useEffect, useRef } from 'react';
import { Edit, Trash2, Plus, X, RefreshCw, User, Search, FileText,  MapPin, DollarSign, Upload, Save, ChevronUp, ChevronDown, Calendar, Award, AlertTriangle, FileText as FileTextIcon, PlusCircle, Check } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import * as driverApi from '../../../../axios/api/driver';
import { listDriver } from '../../../../axios/api/distapcher';
import { getSignedEmployeeDocumentUrl, deleteEmployeeDocument } from '../../../../axios/api/employeeDocument';
import type { EmployeeDocument } from '../../../../axios/api/employeeDocument';
import { deleteViolation } from '../../../../axios/api/violations';
import { deleteDeductionAddition } from '../../../../axios/api/account.settlement';
import AddressSearch from '../../../../components/common/AddressSearch';

// US States
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
];

// Canadian Provinces
const CANADIAN_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' }
];

// Notification types and component
type NotificationType = 'success' | 'error' | 'info';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
}

const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    info: <FaCheckCircle className="text-blue-500" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in min-w-[300px] max-w-[500px]`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-900">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

// Driver interface matching backend response
interface Driver {
  _id?: string;
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
  complianceDetails?: any;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  profileImageUrl?: string | null;
  [key: string]: any; // Allow additional fields from backend
}


const DriverManagement = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'external' | 'unassigned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; driverId: string | null }>({ show: false, driverId: null });
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [driverCounts, setDriverCounts] = useState<{ total: number; assigned: number; unassigned: number }>({ total: 0, assigned: 0, unassigned: 0 });
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setIsSubmitting] = useState(false);
 

  const [filterBy, setFilterBy] = useState('Active');
  const [category, setCategory] = useState('');
  const [complianceStatus, setComplianceStatus] = useState('All');
  const [sortBy, setSortBy] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Driver | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });
  const [showNewDriverModal, setShowNewDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'personal' | 'travel' | 'documents' | 'certifications' | 'violations' | 'notes' | 'deductions' | 'additions'>('basic');
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const topScrollContentRef = useRef<HTMLDivElement>(null);
  
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Store original driver data for comparison (to detect changes)
  const [originalDriverData, setOriginalDriverData] = useState<{
    formData: typeof formData;
    personalData: typeof personalData;
    travelData: typeof travelData;
    notes?: typeof notes;
    documents?: typeof documents;
    certifications?: typeof certifications;
    violations?: typeof violations;
    deductions?: typeof deductions;
    additions?: typeof additions;
  } | null>(null);

  // Country data for phone inputs
  interface Country {
    name: string;
    code: string;
    flag: string;
    dialCode: string;
  }

  const [countries, setCountries] = useState<Country[]>([]);
  const [primaryPhoneCountry, setPrimaryPhoneCountry] = useState<string>('US');
  const [secondaryPhoneCountry, setSecondaryPhoneCountry] = useState<string>('US');
  const [primaryCountryDropdownOpen, setPrimaryCountryDropdownOpen] = useState(false);
  const [secondaryCountryDropdownOpen, setSecondaryCountryDropdownOpen] = useState(false);
  const [primaryCountrySearch, setPrimaryCountrySearch] = useState('');
  const [secondaryCountrySearch, setSecondaryCountrySearch] = useState('');
  const primaryCountryDropdownRef = useRef<HTMLDivElement>(null);
  const secondaryCountryDropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to parse phone number and extract country code
  const parsePhoneNumber = (phone: string | undefined | null, countriesList: Country[] = countries): { countryCode: string; phoneNumber: string } => {
    if (!phone) return { countryCode: 'US', phoneNumber: '' };
    
    // Remove any whitespace
    const cleanPhone = phone.trim();
    
    // Try to match country code (try longer codes first to avoid partial matches)
    const sortedCountries = [...countriesList].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const country of sortedCountries) {
      if (cleanPhone.startsWith(country.dialCode)) {
        return {
          countryCode: country.code,
          phoneNumber: cleanPhone.substring(country.dialCode.length).trim()
        };
      }
    }
    
    // Default to US if no match found
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
          setPrimaryPhoneCountry('US');
          setSecondaryPhoneCountry('US');
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
        setPrimaryPhoneCountry('US');
        setSecondaryPhoneCountry('US');
      });
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (primaryCountryDropdownRef.current && !primaryCountryDropdownRef.current.contains(event.target as Node)) {
        setPrimaryCountryDropdownOpen(false);
      }
      if (secondaryCountryDropdownRef.current && !secondaryCountryDropdownRef.current.contains(event.target as Node)) {
        setSecondaryCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    primaryPhone: '',
    secondaryPhone: '',
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
    // Per Trip Amount (for PAID BY TRIP)
    perTripAmount: '0',
    // Hourly Rate (for PAID PER HOUR)
    hourlyRate: '0',
    // Daily Rate (for PAID PER DAY)
    dailyRate: '0',
    // Driver Type
    driverTypeSolo: true, // true = SOLO, false = TEAM
    // Exemptions
    cppExempt: false,
    payrollTaxExempt: false,
    // Custom HST
    customHst: '',
    // Additional fields
    gender: '',
    citizenship: ''
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
  const [documents, setDocuments] = useState<Array<{
    id: string;
    expiryDate: string;
    description: string;
    ignoreExpiration: boolean;
    file?: File | null;
    isExisting?: boolean;
    documentId?: string;
    fileUrl?: string;
    fileName?: string;
    documentType?: string;
  }>>([]);
  const [newDocument, setNewDocument] = useState({
    expiryDate: '',
    description: '',
    ignoreExpiration: false,
    file: null as File | null,
    documentType: 'Other' // Default document type
  });

  // Form state for Safety Certifications
  const [certifications, setCertifications] = useState<Array<{
    id: string;
    expiryDate: string;
    title: string;
    description: string;
    result: string;
    ignoreExpiration: boolean;
    file?: File | null;
    fileUrl?: string | null;
    fileName?: string | null;
  }>>([]);
  const [newCertification, setNewCertification] = useState({
    expiryDate: '',
    title: '',
    description: '',
    result: '',
    ignoreExpiration: false,
    file: null as File | null
  });
  const [certificationFile, setCertificationFile] = useState<File | null>(null);
  const [confirmDeleteCertification, setConfirmDeleteCertification] = useState<{ open: boolean; cert: any | null }>({ open: false, cert: null });
  const [selectedCertificate, setSelectedCertificate] = useState<{
    id: string;
    expiryDate: string;
    title: string;
    description: string;
    result: string;
    ignoreExpiration: boolean;
  } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; size: number }>>({});
  const [documentFile, setDocumentFile] = useState<{ name: string; size: number } | null>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingCertificationId, setEditingCertificationId] = useState<string | null>(null);

  // Form state for Violations
  const [violations, setViolations] = useState<Array<{
    id: string;
    paymentDueDate: string;
    ticket: string;
    description: string;
    currency: string;
    amount?: string;
    violationType?: string;
    file?: File | null;
    fileUrl?: string | null;
    fileName?: string | null;
  }>>([]);
  const [newViolation, setNewViolation] = useState({
    paymentDueDate: '',
    ticket: '',
    description: '',
    currency: 'CAD',
    amount: '',
    violationType: '',
    file: null as File | null
  });
  const [violationFile, setViolationFile] = useState<File | null>(null);
  const [editingViolationId, setEditingViolationId] = useState<string | null>(null);

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
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

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
  const [editingDeductionId, setEditingDeductionId] = useState<string | null>(null);

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
  const [editingAdditionId, setEditingAdditionId] = useState<string | null>(null);

  // Fetch drivers from API
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      // Determine assignment parameter based on activeTab
      let assignmentParam: 'all' | 'assigned' | 'unassigned' = 'all';
      if (activeTab === 'unassigned') {
        assignmentParam = 'unassigned';
      } else if (activeTab === 'external') {
        // External drivers are those assigned to orders (we'll use 'assigned' for now)
        assignmentParam = 'assigned';
      }
      
      // Use dispatcher endpoint which supports assignment filtering and returns counts
      const response = await listDriver({ 
        page: 1, 
        limit: 1000,
        assignment: assignmentParam
      });
      
      if (response?.success && response.data) {
        // Store counts from API response
        if (response.count !== undefined && response.assignedDrivers !== undefined && response.unassignedDrivers !== undefined) {
          setDriverCounts({
            total: response.count || 0,
            assigned: response.assignedDrivers || 0,
            unassigned: response.unassignedDrivers || 0
          });
        }
        
        // Transform backend data to match Driver interface
        const transformedDrivers: Driver[] = response.data.map((driver: any) => {
          // Handle name field (could be name string or firstName/lastName)
          const nameParts = driver.name ? driver.name.split(' ') : [];
          const firstName = driver.firstName || nameParts[0] || '';
          const lastName = driver.lastName || nameParts.slice(1).join(' ') || '';
          
          return {
            _id: driver._id,
            driverId: driver.driverId || driver.internalId || driver._id?.slice(-6).toUpperCase() || 'N/A',
            firstName: firstName,
            lastName: lastName,
            driversLicence: driver.driversLicence || driver.details?.licenceNumber || driver.details?.driversLicence || '',
            passport: driver.passport || driver.details?.passport || driver.details?.passportNumber || '',
            dateOfBirth: driver.dateOfBirth || (driver.details?.dateOfBirth ? new Date(driver.details.dateOfBirth).toISOString().split('T')[0] : '') || (driver.dob ? new Date(driver.dob).toISOString().split('T')[0] : ''),
            notes: driver.notes || driver.details?.notes || '',
            ticketYTD: driver.ticketYTD || driver.details?.ticketYTD || 0,
            status: driver.status || 'ACTIVE',
            compliance: driver.compliance || 'NON-COMPLIANT',
            complianceDetails: driver.complianceDetails,
            email: driver.email,
            phone: driver.phone,
            mobile: driver.mobile || driver.details?.cell1,
            company: driver.company,
            profileImageUrl: driver.profileImageUrl || null
          };
        });
        
        setDrivers(transformedDrivers);
      } else {
        console.error('Failed to fetch drivers:', response);
        setDrivers([]);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch drivers on component mount and when activeTab changes
  useEffect(() => {
    fetchDrivers();
  }, [activeTab]);

  // Load driver data when editing
  useEffect(() => {
    const loadDriverForEdit = async () => {
      if (editingId) {
        try {
          console.log('🔄 Loading driver for edit, ID:', editingId);
          const response = await driverApi.getDriverById(editingId);
          console.log('📥 Driver API response:', response);
          console.log('📥 Response success:', response?.success);
          console.log('📥 Response data:', response?.data);
          console.log('📥 Full response keys:', Object.keys(response || {}));
          
          // Handle different response structures
          // The API might return { success: true, data: {...} } or just the driver object directly
          let driver = null;
          
          // Check if response has success: false
          if (response?.success === false) {
            console.error('❌ API returned success: false', response);
            throw new Error(response?.message || 'Failed to load driver data');
          }
          
          // Try to extract driver data from different possible structures
          if (response?.success === true && response?.data) {
            // Standard structure: { success: true, data: {...} }
            driver = response.data;
            console.log('📦 Driver documents from API:', driver.documents?.length || 0, driver.documents);
          } else if (response?.data) {
            // Has data property but success might be undefined
            driver = response.data;
            console.log('📦 Driver documents from API (alt):', driver.documents?.length || 0, driver.documents);
          } else if (response && typeof response === 'object' && (response._id || response.name || response.email || response.internalId)) {
            // Response is the driver object directly (no wrapper)
            driver = response;
          }
          
          console.log('🔍 Extracted driver:', driver);
          console.log('🔍 Driver has _id:', driver?._id);
          console.log('🔍 Driver has name:', driver?.name);
          console.log('🔍 Driver has email:', driver?.email);
          
          if (driver && (driver._id || driver.name || driver.email || driver.internalId)) {
            console.log('✅ Driver data loaded:', driver);
            // Parse name into parts
            const nameParts = (driver.name || '').split(' ');
            const firstName = nameParts[0] || '';
            const middle = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

            // Format date of birth
            let dateOfBirthFormatted = '';
            if (driver.details?.dateOfBirth) {
              try {
                const dob = new Date(driver.details.dateOfBirth);
                if (!isNaN(dob.getTime())) {
                  dateOfBirthFormatted = dob.toISOString().split('T')[0];
                }
              } catch (e) {
                console.error('Error parsing dateOfBirth:', e);
              }
            } else if (driver.dob) {
              try {
                const dob = new Date(driver.dob);
                if (!isNaN(dob.getTime())) {
                  dateOfBirthFormatted = dob.toISOString().split('T')[0];
                }
              } catch (e) {
                console.error('Error parsing dob:', e);
              }
            }

            console.log('📝 Setting form data with:', {
              driverId: driver.internalId,
              firstName,
              lastName,
              email: driver.email,
              phone: driver.phone,
              address: driver.location?.address || driver.address
            });

            setFormData({
              driverId: driver.internalId || '',
              firstName: firstName,
              middle: middle,
              lastName: lastName,
              emailAddress: driver.email || '',
              dateOfBirth: dateOfBirthFormatted,
              mobileApp: driver.mobileApp || false,
              pin: '',
              primaryPhone: (() => {
                const parsed = parsePhoneNumber(driver.phone, countries);
                setPrimaryPhoneCountry(parsed.countryCode);
                return parsed.phoneNumber;
              })(),
              secondaryPhone: (() => {
                const secondary = driver.details?.cell1 || driver.details?.cell2 || driver.mobile;
                const parsed = parsePhoneNumber(secondary, countries);
                setSecondaryPhoneCountry(parsed.countryCode);
                return parsed.phoneNumber;
              })(),
              searchAddress: '',
              address: driver.location?.address || driver.address || '',
              unit: driver.location?.unit || driver.unit || '',
              city: driver.city || driver.location?.city || '',
              postalCode: driver.postalCode || driver.location?.postalCode || driver.details?.postalCode || '',
              country: driver.country || '',
              stateProvince: driver.state || driver.location?.state || '',
              profileImage: null
            });

            // Set profile image preview if exists
            if (driver.profileImageUrl) {
              setProfileImagePreview(driver.profileImageUrl);
            } else {
              setProfileImagePreview(null);
            }

             // Set personal data
             setPersonalData({
               socialInsuranceNumber: driver.details?.sinNo || driver.sinNo || '',
               hireDate: (() => {
                 // Prefer details.hireDate, fallback to joinDate, then hireDate
                 const hireDateValue = driver.details?.hireDate || driver.hireDate || driver.joinDate;
                 return hireDateValue ? new Date(hireDateValue).toISOString().split('T')[0] : '';
               })(),
               terminationDate: (() => {
                 const termDateValue = driver.details?.termDate || driver.termDate;
                 return termDateValue ? new Date(termDateValue).toISOString().split('T')[0] : '';
               })(),
               status: driver.status === 'active' || driver.status === 'ACTIVE' ? 'Active' : 'Inactive',
               vacationPercent: driver.details?.vacationPay || driver.vacationPay || '',
               paySearchAddress: '',
               corporationName: driver.details?.incorporation || driver.incorporation || '',
               driverName: driver.details?.driverName || driver.driverName || '',
               paymentAddress: driver.details?.paymentAddress || driver.paymentAddress || '',
               gstNo: driver.details?.gstNo || driver.gstNo || '',
               driverType: (driver.details?.companyFlag || driver.companyFlag) ? 'OWNER OPERATOR' : 'COMPANY DRIVER',
               paymentMethod: driver.details?.paymentMethod || driver.paymentMethod || 'PAID PER MILE',
               alone: String(driver.alone || driver.details?.mileRate || 0),
               empty: String(driver.empty || driver.details?.emptyMileRate || 0),
               bonusDrop: String(driver.bonusDrop || driver.details?.bonusDrop || 0),
               team: String(driver.team || driver.details?.mileRateTeam || 0),
               emptyTeam: String(driver.emptyTeam || driver.details?.emptyMileRateTeam || 0),
               bonusPick: String(driver.bonusPick || driver.details?.bonusPick || 0),
               bonusLayover: String(driver.bonusLayover || driver.details?.bonusLayover || 0),
               percentRate: String(driver.percentageRate || driver.details?.percentageRate || 0),
               perTripAmount: '0',
               hourlyRate: String(driver.hourlyRate || driver.details?.hourlyRate || 0),
               dailyRate: '0',
               driverTypeSolo: true,
               cppExempt: driver.details?.cppQppExempt || driver.cppQppExempt || false,
               payrollTaxExempt: driver.details?.provTaxExempt || driver.provTaxExempt || false,
               customHst: driver.details?.customHst || driver.customHst || '',
               gender: driver.details?.gender || driver.gender || '',
               citizenship: driver.details?.citizenship || driver.citizenship || ''
             });

            // Set travel data with all fields (check top-level first, then details for backward compatibility)
            setTravelData({
              driversLicenseNumber: driver.licenceNumber || driver.details?.licenceNumber || driver.details?.driversLicence || '',
              driversLicenseExpiry: (() => {
                const expiryValue = driver.licenceExpiry || driver.details?.licenceExpiry;
                return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
              })(),
              licenseStateProvince: driver.licenceState || driver.details?.licenceState || '',
              passportNumber: driver.passport || driver.details?.passport || driver.details?.passportNumber || '',
              passportCountry: driver.passportCountry || driver.details?.passportCountry || '',
              passportExpiry: (() => {
                const expiryValue = driver.passportExpiry || driver.details?.passportExpiry;
                return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
              })(),
              fastCardNumber: driver.fastCard || driver.details?.fastCardNo || '',
              fastCardExpiry: (() => {
                const expiryValue = driver.fastCardExpiry || driver.details?.fastCardExpiry;
                return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
              })(),
              fastCardValid: driver.fastCardValid !== undefined ? driver.fastCardValid : (driver.details?.fastCardValid || false),
              canadianWorkerStatus: (driver.canadianWorkerStatus || driver.details?.canadianWorkerStatus || 'PERMANENT RESIDENT') as 'CANADIAN CITIZEN' | 'PERMANENT RESIDENT' | 'WORK PERMIT',
              permanentResidenceExpiry: (() => {
                const expiryValue = driver.permanentResidenceExpiry || driver.details?.permanentResidenceExpiry;
                return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
              })(),
              workPermitExpiry: (() => {
                const expiryValue = driver.workPermitExpiry || driver.details?.workPermitExpiry;
                return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
              })(),
              wcbNumber: driver.wsibAccountNo || driver.details?.wsibAccountNo || ''
            });

          
            
            try {
              let documentsToUse: EmployeeDocument[] = [];
              if (driver.documents && Array.isArray(driver.documents) && driver.documents.length > 0) {
                documentsToUse = driver.documents;
                console.log(`✅ Using ${documentsToUse.length} documents from getDriverById response`);
              } else {
                console.log('⚠️ No documents found in getDriverById response');
                documentsToUse = [];
              }
              
              if (documentsToUse.length > 0) {
                // Show all documents without filtering by tab
                const existingDocuments = documentsToUse.map((doc: EmployeeDocument) => ({
                  id: `existing-${doc._id}`,
                  expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : '',
                  description: doc.description || doc.documentType || '',
                  ignoreExpiration: doc.ignoreExpiration || false,
                  file: null,
                  isExisting: true,
                  documentId: doc._id,
                  fileUrl: doc.fileUrl || '',
                  fileName: doc.fileName || '',
                  documentType: doc.documentType || 'Other'
                }));
                setDocuments(existingDocuments);
                console.log(`✅ Documents loaded (${existingDocuments.length} documents)`);
              } else {
                console.log('⚠️ No documents found for this driver');
                setDocuments([]);
              }
            } catch (docError) {
              console.error('Error loading documents:', docError);
              setDocuments([]);
            }

            // Load certifications (Safety Certifications) from getDriverById response
            try {
              if (driver.certifications && Array.isArray(driver.certifications) && driver.certifications.length > 0) {
                const existingCertifications = driver.certifications.map((cert: any) => ({
                  id: `existing-${cert._id}`,
                  expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : '',
                  title: cert.certificateName || cert.title || '',
                  description: cert.description || '',
                  result: cert.notes || cert.result || 'pass', // Use notes field, not status (status is auto-calculated)
                  ignoreExpiration: cert.ignoreExpiration || false,
                  file: cert.fileName ? { name: cert.fileName, size: cert.fileSize || 0 } : null,
                  fileUrl: cert.fileUrl || null,
                  fileName: cert.fileName || null
                }));
                setCertifications(existingCertifications);
                console.log(`✅ Certifications loaded (${existingCertifications.length} certifications)`);
              } else {
                console.log('⚠️ No certifications found for this driver');
                setCertifications([]);
              }
            } catch (certError) {
              console.error('Error loading certifications:', certError);
              setCertifications([]);
            }

            // Load violations (Tickets / Violations) from getDriverById response
            try {
              if (driver.violations && Array.isArray(driver.violations) && driver.violations.length > 0) {
                const existingViolations = driver.violations.map((vio: any) => ({
                  id: `existing-${vio._id}`,
                  paymentDueDate: vio.date ? new Date(vio.date).toISOString().split('T')[0] : '',
                  ticket: vio.ticketInfo?.ticketNumber || vio.ticket || '',
                  description: vio.description || '',
                  currency: vio.currency || 'CAD',
                  amount: vio.amount?.toString() || '',
                  violationType: vio.violationType || vio.type || '',
                  file: null, // Don't set file for existing violations (it's a File object, not needed for display)
                  fileUrl: vio.fileUrl || null, // Include fileUrl for displaying existing files
                  fileName: vio.fileName || null // Include fileName for displaying existing files
                }));
                setViolations(existingViolations);
                console.log(`✅ Violations loaded (${existingViolations.length} violations)`, existingViolations.map((v: any) => ({ id: v.id, hasFile: !!v.fileUrl, fileName: v.fileName })));
              } else {
                console.log('⚠️ No violations found for this driver');
                setViolations([]);
              }
            } catch (vioError) {
              console.error('Error loading violations:', vioError);
              setViolations([]);
            }

            // Load deductions (Payroll Deductions) from getDriverById response
            try {
              if (driver.deductions && Array.isArray(driver.deductions) && driver.deductions.length > 0) {
                const existingDeductions = driver.deductions.map((ded: any) => ({
                  id: `existing-${ded._id}`,
                  startDate: ded.startDate ? new Date(ded.startDate).toISOString().split('T')[0] : '',
                  description: ded.name || ded.description || '',
                  amount: ded.amount?.toString() || '0',
                  interval: ded.recurrence || ded.interval || '',
                  currency: 'CAD' // Default currency
                }));
                setDeductions(existingDeductions);
                console.log(`✅ Deductions loaded (${existingDeductions.length} deductions)`);
              } else {
                console.log('⚠️ No deductions found for this driver');
                setDeductions([]);
              }
            } catch (dedError) {
              console.error('Error loading deductions:', dedError);
              setDeductions([]);
            }

            // Load additions (Payroll Additions) from getDriverById response
            try {
              if (driver.additions && Array.isArray(driver.additions) && driver.additions.length > 0) {
                const existingAdditions = driver.additions.map((add: any) => ({
                  id: `existing-${add._id}`,
                  startDate: add.startDate ? new Date(add.startDate).toISOString().split('T')[0] : '',
                  description: add.name || add.description || '',
                  amount: add.amount?.toString() || '0',
                  interval: add.recurrence || add.interval || '',
                  currency: 'CAD' // Default currency
                }));
                setAdditions(existingAdditions);
                console.log(`✅ Additions loaded (${existingAdditions.length} additions)`);
              } else {
                console.log('⚠️ No additions found for this driver');
                setAdditions([]);
              }
            } catch (addError) {
              console.error('Error loading additions:', addError);
              setAdditions([]);
            }

            // Load notes
            let notesArray: Array<{ id: string; note: string; category: string }> = [];
            if (driver.details?.notes || driver.notes) {
              if (Array.isArray(driver.details?.notes)) {
                notesArray = driver.details.notes.map((note: any, index: number) => ({
                  id: note.id || `note-${index}`,
                  note: typeof note === 'string' ? note : (note.note || note.text || ''),
                  category: note.category || ''
                }));
              } else if (driver.details?.notes || driver.notes) {
                const noteText = driver.details?.notes || driver.notes || '';
                notesArray = [{ id: '1', note: noteText, category: '' }];
              }
              setNotes(notesArray);
            } else {
              setNotes([]);
            }

            // Store original data for comparison (after state updates)
            // Capture current state values for original data snapshot
            const currentNotes = notesArray;
            const currentDocuments = documents;
            const currentCertifications = certifications;
            const currentViolations = violations;
            const currentDeductions = deductions;
            const currentAdditions = additions;
            
            setTimeout(() => {
              // Parse phone numbers for original data (same as formData)
              const originalPrimaryParsed = parsePhoneNumber(driver.phone, countries);
              const originalSecondary = driver.details?.cell1 || driver.details?.cell2 || driver.mobile;
              const originalSecondaryParsed = parsePhoneNumber(originalSecondary, countries);
              
              // Store original data snapshot
              setOriginalDriverData({
                formData: {
                  driverId: driver.internalId || '',
                  firstName: firstName,
                  middle: middle,
                  lastName: lastName,
                  emailAddress: driver.email || '',
                  dateOfBirth: dateOfBirthFormatted,
                  mobileApp: driver.mobileApp || false,
                  pin: '',
                  primaryPhone: originalPrimaryParsed.phoneNumber,
                  secondaryPhone: originalSecondaryParsed.phoneNumber,
                  searchAddress: '',
                  address: driver.location?.address || driver.address || '',
                  unit: driver.location?.unit || driver.unit || '',
                  city: driver.city || driver.location?.city || '',
                  postalCode: driver.postalCode || driver.location?.postalCode || driver.details?.postalCode || '',
                  country: driver.country || '',
                  stateProvince: driver.state || driver.location?.state || '',
                  profileImage: null
                },
                personalData: {
                  socialInsuranceNumber: driver.details?.sinNo || driver.sinNo || '',
                  hireDate: (() => {
                    const hireDateValue = driver.details?.hireDate || driver.hireDate || driver.joinDate;
                    return hireDateValue ? new Date(hireDateValue).toISOString().split('T')[0] : '';
                  })(),
                  terminationDate: (() => {
                    const termDateValue = driver.details?.termDate || driver.termDate;
                    return termDateValue ? new Date(termDateValue).toISOString().split('T')[0] : '';
                  })(),
                  status: driver.status === 'active' || driver.status === 'ACTIVE' ? 'Active' : 'Inactive',
                  vacationPercent: driver.details?.vacationPay || driver.vacationPay || '',
                  paySearchAddress: '',
                  corporationName: driver.details?.incorporation || driver.incorporation || '',
                  driverName: driver.details?.driverName || driver.driverName || '',
                  paymentAddress: driver.details?.paymentAddress || driver.paymentAddress || '',
                  gstNo: driver.details?.gstNo || driver.gstNo || '',
                  driverType: (driver.details?.companyFlag || driver.companyFlag) ? 'OWNER OPERATOR' : 'COMPANY DRIVER',
                  paymentMethod: driver.details?.paymentMethod || driver.paymentMethod || 'PAID PER MILE',
                  alone: String(driver.alone || driver.details?.mileRate || 0),
                  empty: String(driver.empty || driver.details?.emptyMileRate || 0),
                  bonusDrop: String(driver.bonusDrop || driver.details?.bonusDrop || 0),
                  team: String(driver.team || driver.details?.mileRateTeam || 0),
                  emptyTeam: String(driver.emptyTeam || driver.details?.emptyMileRateTeam || 0),
                  bonusPick: String(driver.bonusPick || driver.details?.bonusPick || 0),
                  bonusLayover: String(driver.bonusLayover || driver.details?.bonusLayover || 0),
                  percentRate: String(driver.percentageRate || driver.details?.percentageRate || 0),
                  perTripAmount: '0',
                  hourlyRate: String(driver.hourlyRate || driver.details?.hourlyRate || 0),
                  dailyRate: '0',
                  driverTypeSolo: true,
                  cppExempt: driver.details?.cppQppExempt || driver.cppQppExempt || false,
                  payrollTaxExempt: driver.details?.provTaxExempt || driver.provTaxExempt || false,
                  customHst: driver.details?.customHst || driver.customHst || '',
                  gender: driver.details?.gender || driver.gender || '',
                  citizenship: driver.details?.citizenship || driver.citizenship || ''
                },
                travelData: {
                  driversLicenseNumber: driver.licenceNumber || driver.details?.licenceNumber || driver.details?.driversLicence || '',
                  driversLicenseExpiry: (() => {
                    const expiryValue = driver.licenceExpiry || driver.details?.licenceExpiry;
                    return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
                  })(),
                  licenseStateProvince: driver.licenceState || driver.details?.licenceState || '',
                  passportNumber: driver.passport || driver.details?.passport || driver.details?.passportNumber || '',
                  passportCountry: driver.passportCountry || driver.details?.passportCountry || '',
                  passportExpiry: (() => {
                    const expiryValue = driver.passportExpiry || driver.details?.passportExpiry;
                    return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
                  })(),
                  fastCardNumber: driver.fastCard || driver.details?.fastCardNo || '',
                  fastCardExpiry: (() => {
                    const expiryValue = driver.fastCardExpiry || driver.details?.fastCardExpiry;
                    return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
                  })(),
                  fastCardValid: driver.fastCardValid !== undefined ? driver.fastCardValid : (driver.details?.fastCardValid || false),
                  canadianWorkerStatus: (driver.canadianWorkerStatus || driver.details?.canadianWorkerStatus || 'PERMANENT RESIDENT') as 'CANADIAN CITIZEN' | 'PERMANENT RESIDENT' | 'WORK PERMIT',
                  permanentResidenceExpiry: (() => {
                    const expiryValue = driver.permanentResidenceExpiry || driver.details?.permanentResidenceExpiry;
                    return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
                  })(),
                  workPermitExpiry: (() => {
                    const expiryValue = driver.workPermitExpiry || driver.details?.workPermitExpiry;
                    return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
                  })(),
                  wcbNumber: driver.wsibAccountNo || driver.details?.wsibAccountNo || ''
                },
                notes: currentNotes || [],
                documents: currentDocuments || [],
                certifications: currentCertifications || [],
                violations: currentViolations || [],
                deductions: currentDeductions || [],
                additions: currentAdditions || []
              });
              console.log('✅ Form data populated, opening modal');
              setShowNewDriverModal(true);
              setActiveFormTab('basic');
            }, 100);
          } else {
            console.error('❌ Failed to load driver - invalid driver data');
            console.error('Response:', JSON.stringify(response, null, 2));
            console.error('Driver object:', driver);
            console.error('Response type:', typeof response);
            console.error('Has success:', 'success' in (response || {}));
            console.error('Has data:', 'data' in (response || {}));
            alert('Failed to load driver data. The response structure may be incorrect. Please check console for details.');
            setEditingId(null);
          }
        } catch (error: any) {
          console.error('❌ Error loading driver for edit:', error);
          console.error('Error details:', {
            message: error?.message,
            response: error?.response,
            data: error?.response?.data
          });
          alert('Error loading driver data: ' + (error?.message || error?.response?.data?.message || 'Unknown error'));
          setEditingId(null);
        }
      } else {
        // Reset form when not editing
        setFormData({
          driverId: '',
          firstName: '',
          middle: '',
          lastName: '',
          emailAddress: '',
          dateOfBirth: '',
          mobileApp: false,
          pin: '',
          primaryPhone: '',
          secondaryPhone: '',
          searchAddress: '',
          address: '',
          unit: '',
          city: '',
          postalCode: '',
          country: '',
          stateProvince: '',
          profileImage: null
        });
        setPersonalData({
          socialInsuranceNumber: '',
          hireDate: '',
          terminationDate: '',
          status: 'Active',
          vacationPercent: '',
          paySearchAddress: '',
          corporationName: '',
          driverName: '',
          paymentAddress: '',
          gstNo: '',
          driverType: 'COMPANY DRIVER',
          paymentMethod: 'PAID PER MILE',
          alone: '0',
          empty: '0',
          bonusDrop: '0',
          team: '0',
          emptyTeam: '0',
          bonusPick: '0',
          bonusLayover: '0',
          percentRate: '0',
          perTripAmount: '0',
          hourlyRate: '0',
          dailyRate: '0',
          driverTypeSolo: true,
          cppExempt: false,
          payrollTaxExempt: false,
          customHst: '',
          gender: '',
          citizenship: ''
        });
        setTravelData({
          driversLicenseNumber: '',
          driversLicenseExpiry: '',
          licenseStateProvince: '',
          passportNumber: '',
          passportCountry: '',
          passportExpiry: '',
          fastCardNumber: '',
          fastCardExpiry: '',
          fastCardValid: false,
          canadianWorkerStatus: 'PERMANENT RESIDENT',
          permanentResidenceExpiry: '',
          workPermitExpiry: '',
          wcbNumber: ''
        });
        setDocuments([]);
        setNotes([]);
        setProfileImagePreview(null);
      }
    };

    loadDriverForEdit();
  }, [editingId]);

  // Note: Removed documentsTab reload effect since we're showing all documents together

  // Filter drivers based on active tab
  const getFilteredDrivers = () => {
    // Only use drivers from backend - no static/hardcoded data
    let filtered = drivers;

    // Tab filtering is now handled by the API (assignment parameter)
    // The drivers array already contains only the drivers for the current activeTab

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

  // Sync scrollbar widths
  useEffect(() => {
    const syncScrollbarWidth = () => {
      if (tableScrollRef.current && topScrollContentRef.current) {
        const scrollWidth = tableScrollRef.current.scrollWidth;
        topScrollContentRef.current.style.width = `${scrollWidth}px`;
      }
    };

    // Use setTimeout to ensure table is rendered
    const timeoutId = setTimeout(syncScrollbarWidth, 0);
    window.addEventListener('resize', syncScrollbarWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', syncScrollbarWidth);
    };
  }, [filteredDrivers]);

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
    // Use counts from backend API response
    switch (tab) {
      case 'all':
        return driverCounts.total || drivers.length || 0;
      case 'external':
        // External drivers are those assigned to orders
        return driverCounts.assigned || 0;
      case 'unassigned':
        // Unassigned drivers are those not assigned to any active order (as driver or coDriver)
        return driverCounts.unassigned || 0;
      default:
        return 0;
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ show: true, driverId: id });
  };

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const confirmDeleteDriver = async () => {
    if (!deleteConfirm.driverId) return;

    try {
      const response = await driverApi.deleteDriver(deleteConfirm.driverId);
      if (response.success) {
        await fetchDrivers();
        addNotification('success', 'Driver deleted successfully!');
      } else {
        addNotification('error', response.message || 'Failed to delete driver');
      }
    } catch (error: any) {
      console.error('Error deleting driver:', error);
      addNotification('error', error.response?.data?.message || error.message || 'Failed to delete driver');
    } finally {
      setDeleteConfirm({ show: false, driverId: null });
    }
  };

 

  // Note: Removed getDocumentTypeFromTab function since we're not using tabs anymore

 


  // Validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Basic Information Tab Validation
    if (!formData.firstName || !formData.firstName.trim()) {
      errors.firstName = 'First Name is required';
    }

    if (!formData.lastName || !formData.lastName.trim()) {
      errors.lastName = 'Last Name is required';
    }

    if (!formData.emailAddress || !formData.emailAddress.trim()) {
      errors.emailAddress = 'Email Address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.emailAddress)) {
        errors.emailAddress = 'Please provide a valid email address';
      }
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of Birth is required';
    }

    if (!formData.primaryPhone || !formData.primaryPhone.trim()) {
      errors.primaryPhone = 'Primary Phone Number is required';
    } else {
      const phoneDigits = formData.primaryPhone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        errors.primaryPhone = 'Primary phone number must be at least 10 digits';
      }
    }

    if (!formData.country) {
      errors.country = 'Country is required';
    }

    if (!formData.stateProvince) {
      errors.stateProvince = 'Province/State is required';
    }

    // Personal Information Tab Validation
    if (!personalData.status) {
      errors.status = 'Status is required';
    }

    // Travel Information Tab Validation
    if (!travelData.driversLicenseNumber || !travelData.driversLicenseNumber.trim()) {
      errors.driversLicenseNumber = 'Drivers License Number is required';
    }

    if (!travelData.driversLicenseExpiry) {
      errors.driversLicenseExpiry = 'Drivers License Expiry Date is required';
    }

    if (!travelData.passportNumber || !travelData.passportNumber.trim()) {
      errors.passportNumber = 'Passport Number is required';
    }

    if (!travelData.passportExpiry) {
      errors.passportExpiry = 'Passport Expiry Date is required';
    }

    // Violations Tab Validation
    violations.forEach((violation, index) => {
      if (!violation.violationType || !violation.violationType.trim()) {
        errors[`violationType_${index}`] = 'Type of Violation is required';
      }
    });

    // Set validation errors
    setValidationErrors(errors);

    // If there are errors, show detailed notification and switch to the first tab with errors
    if (Object.keys(errors).length > 0) {
      const errorCount = Object.keys(errors).length;
      
      // Create a detailed error message listing all missing fields
      const errorFields: string[] = [];
      
      if (errors.firstName) errorFields.push('First Name');
      if (errors.lastName) errorFields.push('Last Name');
      if (errors.emailAddress) errorFields.push('Email Address');
      if (errors.dateOfBirth) errorFields.push('Date of Birth');
      if (errors.primaryPhone) errorFields.push('Primary Phone');
      if (errors.country) errorFields.push('Country');
      if (errors.stateProvince) errorFields.push('Province/State');
      if (errors.status) errorFields.push('Status');
      if (errors.driversLicenseNumber) errorFields.push('Drivers License Number');
      if (errors.driversLicenseExpiry) errorFields.push('Drivers License Expiry Date');
      if (errors.passportNumber) errorFields.push('Passport Number');
      if (errors.passportExpiry) errorFields.push('Passport Expiry Date');
      
      // Create detailed error message
      let errorMessage = `Please complete the following required field${errorCount > 1 ? 's' : ''}: ${errorFields.join(', ')}`;
      
      // If message is too long, show summary
      if (errorMessage.length > 100) {
        errorMessage = `Please fix ${errorCount} required field${errorCount > 1 ? 's' : ''} before submitting. Missing: ${errorFields.slice(0, 3).join(', ')}${errorFields.length > 3 ? ` and ${errorFields.length - 3} more` : ''}`;
      }
      
      addNotification('error', errorMessage);
      
      // Switch to the tab with the first error
      if (errors.firstName || errors.lastName || errors.emailAddress || errors.dateOfBirth || errors.primaryPhone || errors.country || errors.stateProvince) {
        setActiveFormTab('basic');
      } else if (errors.status) {
        setActiveFormTab('personal');
      } else if (errors.driversLicenseNumber || errors.driversLicenseExpiry || errors.passportNumber || errors.passportExpiry) {
        setActiveFormTab('travel');
      }
      
      return false;
    }

    return true;
  };

  const handleSaveDriver = async () => {
    try {
      setIsSubmitting(true);
      
      // Clear previous validation errors
      setValidationErrors({});
      
      // Validate form
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Create FormData
      const driverFormData = new FormData();
      
      // Basic Information - always include these fields
      driverFormData.append('name', `${formData.firstName} ${formData.middle ? formData.middle + ' ' : ''}${formData.lastName}`.trim());
      if (formData.emailAddress) driverFormData.append('email', formData.emailAddress);
      
      // Primary Phone - include country code prefix
      if (formData.primaryPhone) {
        const primaryCountry = countries.find(c => c.code === primaryPhoneCountry);
        if (primaryCountry) {
          // Remove + from dial code for comparison
          const dialCodeWithoutPlus = primaryCountry.dialCode.replace('+', '');
          // Check if phone already starts with the dial code
          let phoneNumber = formData.primaryPhone;
          if (phoneNumber.startsWith(dialCodeWithoutPlus)) {
            // Phone already includes dial code, just add + prefix
            driverFormData.append('phone', `+${phoneNumber}`);
          } else {
            // Phone doesn't include dial code, add it
            driverFormData.append('phone', `${primaryCountry.dialCode}${phoneNumber}`);
          }
        } else {
          // Fallback if country not found
          driverFormData.append('phone', formData.primaryPhone.startsWith('+') ? formData.primaryPhone : `+${formData.primaryPhone}`);
        }
      }
      
      if (formData.country) driverFormData.append('country', formData.country);
      if (formData.driverId) driverFormData.append('internalId', formData.driverId);
      driverFormData.append('password', formData.pin || 'TempPassword123!'); // Default password if not provided
      driverFormData.append('role', 'driver');
      // Use status from personalData if available, otherwise default to 'active'
      const statusValue = personalData.status ? personalData.status.toLowerCase() : 'active';
      driverFormData.append('status', statusValue);
      
      // Mobile App Access - always send (true/false)
      driverFormData.append('mobileApp', String(formData.mobileApp));
      
      // Date of Birth
      if (formData.dateOfBirth) {
        driverFormData.append('dob', formData.dateOfBirth);
      }
      
      // Address Information
      if (formData.address) driverFormData.append('address', formData.address);
      if (formData.unit) driverFormData.append('unit', formData.unit);
      if (formData.city) driverFormData.append('city', formData.city);
      if (formData.stateProvince) driverFormData.append('state', formData.stateProvince);
      if (formData.postalCode) driverFormData.append('postalCode', formData.postalCode);
      
      // Personal Information
      if (personalData.socialInsuranceNumber) driverFormData.append('sinNo', personalData.socialInsuranceNumber);
      if (personalData.hireDate) driverFormData.append('joinDate', personalData.hireDate);
      if (personalData.gender) driverFormData.append('gender', personalData.gender);
      if (personalData.citizenship) driverFormData.append('citizenship', personalData.citizenship);
      
      // Employment Details - combine multiple fields into remark/employmentDetails
      // The backend stores this in details.remark field
      const employmentDetailsParts = [];
      if (personalData.corporationName) employmentDetailsParts.push(`Corporation: ${personalData.corporationName}`);
      if (personalData.driverName) employmentDetailsParts.push(`Driver Name: ${personalData.driverName}`);
      if (personalData.paymentAddress) employmentDetailsParts.push(`Payment Address: ${personalData.paymentAddress}`);
      if (personalData.gstNo) employmentDetailsParts.push(`GST No: ${personalData.gstNo}`);
      if (personalData.vacationPercent) employmentDetailsParts.push(`Vacation Percent: ${personalData.vacationPercent}`);
      if (employmentDetailsParts.length > 0) {
        driverFormData.append('employmentDetails', employmentDetailsParts.join('; '));
      }
      
      // Payment/Salary Information - Payment Rate Fields
      // Send payment method
      if (personalData.paymentMethod) {
        driverFormData.append('paymentMethod', personalData.paymentMethod);
      }
      
      // Payment rate fields (ALONE, EMPTY, TEAM, etc.)
      if (personalData.alone && personalData.alone !== '0') {
        driverFormData.append('mileRate', personalData.alone); // ALONE* = mileRate
      }
      if (personalData.empty && personalData.empty !== '0') {
        driverFormData.append('emptyMileRate', personalData.empty); // EMPTY* = emptyMileRate
      }
      if (personalData.team && personalData.team !== '0') {
        driverFormData.append('mileRateTeam', personalData.team); // TEAM* = mileRateTeam
      }
      if (personalData.emptyTeam && personalData.emptyTeam !== '0') {
        driverFormData.append('emptyMileRateTeam', personalData.emptyTeam); // EMPTY-TEAM* = emptyMileRateTeam
      }
      if (personalData.bonusDrop && personalData.bonusDrop !== '0') {
        driverFormData.append('bonusDrop', personalData.bonusDrop); // BONUS/DROP = bonusDrop
      }
      if (personalData.bonusPick && personalData.bonusPick !== '0') {
        driverFormData.append('bonusPick', personalData.bonusPick); // BONUS/PICK = bonusPick
      }
      if (personalData.bonusLayover && personalData.bonusLayover !== '0') {
        driverFormData.append('bonusLayover', personalData.bonusLayover); // BONUS/LAYOVER = bonusLayover
      }
      
      // Other payment fields
      if (personalData.percentRate && personalData.percentRate !== '0') {
        driverFormData.append('percentageRate', personalData.percentRate);
      }
      if (personalData.perTripAmount && personalData.perTripAmount !== '0') {
        driverFormData.append('perTripAmount', personalData.perTripAmount);
      }
      if (personalData.hourlyRate && personalData.hourlyRate !== '0') {
        driverFormData.append('hourlyRate', personalData.hourlyRate);
      }
      if (personalData.dailyRate && personalData.dailyRate !== '0') {
        driverFormData.append('dailyRate', personalData.dailyRate);
      }
      
      // For backward compatibility, also send salaryPerMile if alone is set
      if (personalData.paymentMethod === 'PAID PER MILE' && personalData.alone && personalData.alone !== '0') {
        driverFormData.append('salaryPerMile', personalData.alone);
      }

      // Personal Information - Additional fields
      // Removed incorporation: property does not exist on type
      if (personalData.driverName) driverFormData.append('driverName', personalData.driverName);
      if (personalData.paymentAddress) driverFormData.append('paymentAddress', personalData.paymentAddress);
      if (personalData.gstNo) driverFormData.append('gstNo', personalData.gstNo);
      if (personalData.vacationPercent) driverFormData.append('vacationPay', personalData.vacationPercent);

      
      // Driver Type - Send companyFlag: true for OWNER OPERATOR, false for COMPANY DRIVER
      if (personalData.driverType) {
        const companyFlagValue = personalData.driverType === 'OWNER OPERATOR';
        driverFormData.append('companyFlag', String(companyFlagValue));
      }
      
      // Exemption and additional fields
      driverFormData.append('cppExempt', String(personalData.cppExempt || false));
      driverFormData.append('payrollTaxExempt', String(personalData.payrollTaxExempt || false));
      if (personalData.customHst) driverFormData.append('customHst', personalData.customHst);
      
      // Mobile/Secondary Phone - include country code prefix
      if (formData.secondaryPhone) {
        const secondaryCountry = countries.find(c => c.code === secondaryPhoneCountry);
        if (secondaryCountry) {
          // Remove + from dial code for comparison
          const dialCodeWithoutPlus = secondaryCountry.dialCode.replace('+', '');
          let phoneNumber = formData.secondaryPhone;
          
          // If phone starts with the dial code, use it as is (just add + prefix)
          // Otherwise, prepend the dial code
          if (phoneNumber.startsWith(dialCodeWithoutPlus)) {
            driverFormData.append('mobile', `+${phoneNumber}`);
          } else {
            // Phone doesn't start with dial code, prepend it
            driverFormData.append('mobile', `${secondaryCountry.dialCode}${phoneNumber}`);
          }
        } else {
          // Fallback if country not found - add + if not present
          const phoneValue = formData.secondaryPhone.startsWith('+') ? formData.secondaryPhone : `+${formData.secondaryPhone}`;
          driverFormData.append('mobile', phoneValue);
        }
      }
      
      // Travel Information - Drivers License
      if (travelData.driversLicenseNumber) driverFormData.append('licenceNumber', travelData.driversLicenseNumber);
      // Note: createDriver doesn't accept licenceExpiry, licenceState, but we'll send them for consistency
      if (travelData.driversLicenseExpiry) driverFormData.append('licenceExpiry', travelData.driversLicenseExpiry);
      if (travelData.licenseStateProvince) driverFormData.append('licenceState', travelData.licenseStateProvince);
      
      // Travel Information - Passport
      if (travelData.passportNumber) driverFormData.append('passport', travelData.passportNumber);
      if (travelData.passportCountry) driverFormData.append('passportCountry', travelData.passportCountry);
      // Note: createDriver doesn't accept passportExpiry, but we'll send it for consistency
      if (travelData.passportExpiry) driverFormData.append('passportExpiry', travelData.passportExpiry);
      
      // Travel Information - Fast Card
      if (travelData.fastCardNumber) driverFormData.append('fastCard', travelData.fastCardNumber);
      // Note: createDriver doesn't accept fastCardExpiry, fastCardValid, but we'll send them for consistency
      if (travelData.fastCardExpiry) driverFormData.append('fastCardExpiry', travelData.fastCardExpiry);
      if (travelData.fastCardValid !== undefined && travelData.fastCardValid !== null) {
        driverFormData.append('fastCardValid', String(travelData.fastCardValid));
      }
      
      // Travel Information - Canadian Worker Status
      // Note: createDriver doesn't accept these fields, but we'll send them for consistency
      if (travelData.canadianWorkerStatus) driverFormData.append('canadianWorkerStatus', travelData.canadianWorkerStatus);
      if (travelData.permanentResidenceExpiry) driverFormData.append('permanentResidenceExpiry', travelData.permanentResidenceExpiry);
      if (travelData.workPermitExpiry) driverFormData.append('workPermitExpiry', travelData.workPermitExpiry);
      if (travelData.wcbNumber) driverFormData.append('wsibAccountNo', travelData.wcbNumber);
      
      // Notes - send as JSON array for table data
      if (notes && notes.length > 0) {
        const notesData = notes.map(n => ({
          id: n.id,
          note: n.note,
          category: n.category
        }));
        driverFormData.append('notes', JSON.stringify(notesData));
        // Also keep the combined text version for backward compatibility
        const notesText = notes.map(n => `[${n.category}] ${n.note}`).join('\n');
        driverFormData.append('notesText', notesText);
      }
      
      // Documents - send as JSON array and append files
      if (documents && documents.length > 0) {
        const documentsData = documents.map((doc, index) => ({
          id: doc.id,
          expiryDate: doc.expiryDate || '',
          description: doc.description || '',
          ignoreExpiration: doc.ignoreExpiration || false,
          documentType: doc.documentType || 'Other',
          hasFile: !!doc.file,
          documentId: doc.documentId || '',
          index: index // Track index for file matching
        }));
        driverFormData.append('documents', JSON.stringify(documentsData));
        
        // Append document files directly (multer expects array, not indexed)
        documents.forEach((doc) => {
          if (doc.file) {
            driverFormData.append('documentFiles', doc.file);
            driverFormData.append('documentTypes', doc.documentType || 'Other');
          }
        });
      }
      
      // Certifications - send as JSON array
      if (certifications && certifications.length > 0) {
        const certificationsData = certifications.map(cert => ({
          id: cert.id,
          expiryDate: cert.expiryDate || '',
          title: cert.title || '',
          description: cert.description || '',
          result: cert.result || '',
          ignoreExpiration: cert.ignoreExpiration || false,
          hasFile: !!(cert.file instanceof File) // Only true if it's a new File object
        }));
        driverFormData.append('certifications', JSON.stringify(certificationsData));
        
        // Append certification files directly (only new File objects)
        certifications.forEach((cert) => {
          if (cert.file instanceof File) {
            driverFormData.append('certificationFiles', cert.file);
            console.log('📎 Appending certification file:', cert.file.name, cert.file.size, 'bytes');
          }
        });
      }
      
      // Violations - send as JSON array
      if (violations && violations.length > 0) {
        const violationsData = violations.map(viol => ({
          id: viol.id,
          paymentDueDate: viol.paymentDueDate || '',
          ticket: viol.ticket || '',
          description: viol.description || '',
          currency: viol.currency || 'CAD',
          amount: viol.amount || '',
          violationType: viol.violationType || '',
          hasFile: !!(viol.file instanceof File) // Only true if it's a new File object
        }));
        driverFormData.append('violations', JSON.stringify(violationsData));
        
        // Append violation files directly (multer expects array, not indexed)
        // Only append actual File objects (new files), not metadata from existing violations
        violations.forEach((vio) => {
          if (vio.file instanceof File) {
            driverFormData.append('violationFiles', vio.file);
            console.log('📎 Appending violation file:', vio.file.name, vio.file.size, 'bytes');
          }
        });
      }
      
      // Deductions - send as JSON array
      if (deductions && deductions.length > 0) {
        const deductionsData = deductions.map(ded => ({
          id: ded.id,
          startDate: ded.startDate || '',
          description: ded.description || '',
          amount: ded.amount || '0',
          interval: ded.interval || '',
          currency: ded.currency || 'CAD'
        }));
        driverFormData.append('deductions', JSON.stringify(deductionsData));
      }
      
      // Additions - send as JSON array
      if (additions && additions.length > 0) {
        const additionsData = additions.map(add => ({
          id: add.id,
          startDate: add.startDate || '',
          description: add.description || '',
          amount: add.amount || '0',
          interval: add.interval || '',
          currency: add.currency || 'CAD'
        }));
        driverFormData.append('additions', JSON.stringify(additionsData));
      }
      
      // Profile Image - backend expects 'file' field name
      if (formData.profileImage) {
        driverFormData.append('file', formData.profileImage);
      }

      // Debug: Log all FormData entries
      console.log('📤 Creating driver with data...');
      console.log('📋 FormData entries:');
      for (const [key, value] of driverFormData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      const response = await driverApi.createDriver(driverFormData);
      
      if (response?.success && response?.data?._id) {
        const driverId = response.data._id;
        console.log('✅ Driver created successfully with ID:', driverId);
        
        // All documents, deductions, and additions are now handled by the backend in a single API call
        // No need for separate API calls
        
        addNotification('success', 'Driver created successfully!');
        
        // Reset form
        setFormData({
          driverId: '',
          firstName: '',
          middle: '',
          lastName: '',
          emailAddress: '',
          dateOfBirth: '',
          mobileApp: false,
          pin: '',
          primaryPhone: '',
          secondaryPhone: '',
          searchAddress: '',
          address: '',
          unit: '',
          city: '',
          postalCode: '',
          country: '',
          stateProvince: '',
          profileImage: null
        });
        setPersonalData({
          socialInsuranceNumber: '',
          hireDate: '',
          terminationDate: '',
          status: 'Active',
          vacationPercent: '',
          paySearchAddress: '',
          corporationName: '',
          driverName: '',
          paymentAddress: '',
          gstNo: '',
          driverType: 'COMPANY DRIVER',
          paymentMethod: 'PAID PER MILE',
          alone: '0',
          empty: '0',
          bonusDrop: '0',
          team: '0',
          emptyTeam: '0',
          bonusPick: '0',
          bonusLayover: '0',
          percentRate: '0',
          perTripAmount: '0',
          hourlyRate: '0',
          dailyRate: '0',
          driverTypeSolo: true,
          cppExempt: false,
          payrollTaxExempt: false,
          customHst: '',
          gender: '',
          citizenship: ''
        });
        setTravelData({
          driversLicenseNumber: '',
          driversLicenseExpiry: '',
          licenseStateProvince: '',
          passportNumber: '',
          passportCountry: '',
          passportExpiry: '',
          fastCardNumber: '',
          fastCardExpiry: '',
          fastCardValid: false,
          canadianWorkerStatus: 'PERMANENT RESIDENT',
          permanentResidenceExpiry: '',
          workPermitExpiry: '',
          wcbNumber: ''
        });
        // Reset all form state after successful creation
        setEditingId(null);
        setEditingDriver(null);
        setOriginalDriverData(null);
        resetAllFormState();
        setShowNewDriverModal(false);
        
        // Refresh drivers list
        await fetchDrivers();
      } else {
        addNotification('error', response?.message || 'Failed to create driver');
      }
    } catch (error: any) {
      console.error('Error creating driver:', error);
      addNotification('error', error.response?.data?.message || error.message || 'Failed to create driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to reset all form state
  const resetAllFormState = () => {
    // Clear validation errors
    setValidationErrors({});
    
    // Reset all form data
    setFormData({
      driverId: '',
      firstName: '',
      middle: '',
      lastName: '',
      emailAddress: '',
      dateOfBirth: '',
      mobileApp: false,
      pin: '',
      primaryPhone: '',
      secondaryPhone: '',
      searchAddress: '',
      address: '',
      unit: '',
      city: '',
      postalCode: '',
      country: '',
      stateProvince: '',
      profileImage: null
    });
    
    // Reset personal data
    setPersonalData({
      socialInsuranceNumber: '',
      hireDate: '',
      terminationDate: '',
      status: 'Active',
      vacationPercent: '',
      paySearchAddress: '',
      corporationName: '',
      driverName: '',
      paymentAddress: '',
      gstNo: '',
      driverType: 'COMPANY DRIVER',
      paymentMethod: 'PAID PER MILE',
      alone: '0',
      empty: '0',
      bonusDrop: '0',
      team: '0',
      emptyTeam: '0',
      bonusPick: '0',
      bonusLayover: '0',
      percentRate: '0',
      perTripAmount: '0',
      hourlyRate: '0',
      dailyRate: '0',
      driverTypeSolo: true,
      cppExempt: false,
      payrollTaxExempt: false,
      customHst: '',
      gender: '',
      citizenship: ''
    });
    
    // Reset travel data
    setTravelData({
      driversLicenseNumber: '',
      driversLicenseExpiry: '',
      licenseStateProvince: '',
      passportNumber: '',
      passportCountry: '',
      passportExpiry: '',
      fastCardNumber: '',
      fastCardExpiry: '',
      fastCardValid: false,
      canadianWorkerStatus: 'PERMANENT RESIDENT',
      permanentResidenceExpiry: '',
      workPermitExpiry: '',
      wcbNumber: ''
    });
    
    // Reset documents
    setDocuments([]);
    
    // Reset certifications
    setCertifications([]);
    setNewCertification({
      expiryDate: '',
      title: '',
      description: '',
      result: '',
      ignoreExpiration: false,
      file: null
    });
    setCertificationFile(null);
    setSelectedCertificate(null);
    setEditingCertificationId(null);
    setUploadedFiles({});
    setDocumentFile(null);
    
    // Reset violations
    setViolations([]);
    setNewViolation({
      paymentDueDate: '',
      ticket: '',
      description: '',
      currency: 'CAD',
      amount: '',
      violationType: '',
      file: null
    });
    setViolationFile(null);
    setEditingViolationId(null);
    
    // Reset notes
    setNotes([]);
    setNewNote({
      note: '',
      category: ''
    });
    setEditingNoteId(null);
    setNewNote({
      note: '',
      category: ''
    });
    
    // Reset deductions
    setDeductions([]);
    setNewDeduction({
      startDate: '',
      description: '',
      amount: '0',
      interval: '',
      currency: 'CAD'
    });
    setEditingDeductionId(null);
    
    // Reset additions
    setAdditions([]);
    setNewAddition({
      startDate: '',
      description: '',
      amount: '0',
      interval: '',
      currency: 'CAD'
    });
    setEditingAdditionId(null);
    
    // Reset other states
    setProfileImagePreview(null);
    setActiveFormTab('basic');
    setPrimaryPhoneCountry('US');
    setSecondaryPhoneCountry('US');
    setPrimaryCountryDropdownOpen(false);
    setSecondaryCountryDropdownOpen(false);
    setPrimaryCountrySearch('');
    setSecondaryCountrySearch('');
  };

  const handleCloseModal = () => {
    setShowNewDriverModal(false);
    setValidationErrors({});
    setEditingId(null);
    setEditingDriver(null);
    setOriginalDriverData(null); // Clear original data when closing
    resetAllFormState();
  };

  // Handle certification deletion confirmation
  const handleConfirmDeleteCertification = async () => {
    if (!confirmDeleteCertification.cert) return;
    
    const cert = confirmDeleteCertification.cert;
    try {
      // Check if it's an existing certification (ID starts with "existing-")
      if (cert.id && cert.id.toString().startsWith('existing-')) {
        const actualId = cert.id.toString().replace('existing-', '');
        const response = await driverApi.deleteTrainingCertificate(actualId);
        if (response?.success) {
          addNotification('success', 'Certification deleted successfully!');
        } else {
          addNotification('error', response?.message || 'Failed to delete certification');
        }
      }
      // Remove from local state
      setCertifications(certifications.filter(c => c.id !== cert.id));
      // Clear editing state if this was the certification being edited
      if (editingCertificationId === cert.id) {
        setEditingCertificationId(null);
        setNewCertification({
          expiryDate: '',
          title: '',
          description: '',
          result: '',
          ignoreExpiration: false,
          file: null
        });
        setCertificationFile(null);
      }
      // Clear selected certificate if it was this one
      if (selectedCertificate?.id === cert.id) {
        setSelectedCertificate(null);
      }
    } catch (error: any) {
      console.error('Error deleting certification:', error);
      addNotification('error', error.response?.data?.message || error.message || 'Failed to delete certification');
    } finally {
      setConfirmDeleteCertification({ open: false, cert: null });
    }
  };

  // Helper function to check if a value has changed
  const hasValueChanged = (current: any, original: any): boolean => {
    // Handle null/undefined
    if (current === null || current === undefined) {
      return original !== null && original !== undefined && original !== '';
    }
    if (original === null || original === undefined) {
      return current !== null && current !== undefined && current !== '';
    }
    
    // Convert to string for comparison (handles dates, numbers, etc.)
    const currentStr = String(current).trim();
    const originalStr = String(original).trim();
    
    return currentStr !== originalStr;
  };

  const handleUpdateDriver = async () => {
    if (!editingId || !originalDriverData) return;
    
    try {
      setIsSubmitting(true);
      
      // Clear previous validation errors
      setValidationErrors({});
      
      // Validate form
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Create FormData - only include changed fields
      const driverFormData = new FormData();
      
      const original = originalDriverData;
      
      // Basic Information - only append if changed
      const fullName = `${formData.firstName} ${formData.middle ? formData.middle + ' ' : ''}${formData.lastName}`.trim();
      const originalName = `${original.formData.firstName} ${original.formData.middle ? original.formData.middle + ' ' : ''}${original.formData.lastName}`.trim();
      if (hasValueChanged(fullName, originalName)) {
        driverFormData.append('name', fullName);
      }
      
      if (hasValueChanged(formData.emailAddress, original.formData.emailAddress)) {
        driverFormData.append('email', formData.emailAddress);
      }
      
      if (hasValueChanged(formData.primaryPhone, original.formData.primaryPhone)) {
        const primaryCountry = countries.find(c => c.code === primaryPhoneCountry);
        if (primaryCountry) {
          // Remove + from dial code for comparison
          const dialCodeWithoutPlus = primaryCountry.dialCode.replace('+', '');
          let phoneNumber = formData.primaryPhone;
          
          // If phone starts with the dial code, use it as is (just add + prefix)
          // Otherwise, prepend the dial code
          if (phoneNumber.startsWith(dialCodeWithoutPlus)) {
            driverFormData.append('phone', `+${phoneNumber}`);
          } else {
            // Phone doesn't start with dial code, prepend it
            driverFormData.append('phone', `${primaryCountry.dialCode}${phoneNumber}`);
          }
        } else {
          // Fallback if country not found - add + if not present
          const phoneValue = formData.primaryPhone.startsWith('+') ? formData.primaryPhone : `+${formData.primaryPhone}`;
          driverFormData.append('phone', phoneValue);
        }
      }
      
      if (hasValueChanged(formData.country, original.formData.country)) {
        driverFormData.append('country', formData.country);
      }
      
      if (hasValueChanged(formData.driverId, original.formData.driverId)) {
        driverFormData.append('internalId', formData.driverId);
      }
      
      // PIN - only send if changed and not empty
      if (formData.pin && hasValueChanged(formData.pin, original.formData.pin)) {
        driverFormData.append('password', formData.pin);
      }
      
      // Mobile App Access
      if (hasValueChanged(formData.mobileApp, original.formData.mobileApp)) {
        driverFormData.append('mobileApp', String(formData.mobileApp));
      }
      
      // Date of Birth
      if (hasValueChanged(formData.dateOfBirth, original.formData.dateOfBirth)) {
        driverFormData.append('dob', formData.dateOfBirth);
      }
      
      // Address Information
      if (hasValueChanged(formData.address, original.formData.address)) {
        driverFormData.append('address', formData.address);
      }
      if (hasValueChanged(formData.unit, original.formData.unit)) {
        driverFormData.append('unit', formData.unit);
      }
      if (hasValueChanged(formData.city, original.formData.city)) {
        driverFormData.append('city', formData.city);
      }
      if (hasValueChanged(formData.stateProvince, original.formData.stateProvince)) {
        driverFormData.append('state', formData.stateProvince);
      }
      if (hasValueChanged(formData.postalCode, original.formData.postalCode)) {
        driverFormData.append('postalCode', formData.postalCode);
      }
      
      // Personal Information
      if (hasValueChanged(personalData.socialInsuranceNumber, original.personalData.socialInsuranceNumber)) {
        driverFormData.append('sinNo', personalData.socialInsuranceNumber);
      }
      if (hasValueChanged(personalData.hireDate, original.personalData.hireDate)) {
        driverFormData.append('hireDate', personalData.hireDate);
        // Also send as joinDate for backward compatibility
        driverFormData.append('joinDate', personalData.hireDate);
      }
      if (hasValueChanged(personalData.terminationDate, original.personalData.terminationDate)) {
        driverFormData.append('termDate', personalData.terminationDate);
      }
      if (hasValueChanged(personalData.vacationPercent, original.personalData.vacationPercent)) {
        driverFormData.append('vacationPay', personalData.vacationPercent);
      }
      if (hasValueChanged(personalData.corporationName, original.personalData.corporationName)) {
        driverFormData.append('incorporation', personalData.corporationName);
      }
      if (hasValueChanged(personalData.gstNo, original.personalData.gstNo)) {
        driverFormData.append('gstNo', personalData.gstNo);
      }
      if (hasValueChanged(personalData.driverType, original.personalData.driverType)) {
        // Send companyFlag: true for OWNER OPERATOR, false for COMPANY DRIVER
        const companyFlagValue = personalData.driverType === 'OWNER OPERATOR';
        driverFormData.append('companyFlag', String(companyFlagValue));
      }
      if (hasValueChanged(personalData.paymentMethod, original.personalData.paymentMethod)) {
        driverFormData.append('paymentMethod', personalData.paymentMethod);
      }
      // Exemption and additional fields
      if (hasValueChanged(personalData.cppExempt, original.personalData.cppExempt)) {
        driverFormData.append('cppExempt', String(personalData.cppExempt));
      }
      if (hasValueChanged(personalData.payrollTaxExempt, original.personalData.payrollTaxExempt)) {
        driverFormData.append('payrollTaxExempt', String(personalData.payrollTaxExempt));
      }
      if (hasValueChanged(personalData.customHst, original.personalData.customHst)) {
        driverFormData.append('customHst', personalData.customHst);
      }
      if (hasValueChanged(personalData.driverName, original.personalData.driverName)) {
        driverFormData.append('driverName', personalData.driverName);
      }
      if (hasValueChanged(personalData.paymentAddress, original.personalData.paymentAddress)) {
        driverFormData.append('paymentAddress', personalData.paymentAddress);
      }
      if (hasValueChanged(personalData.gender, original.personalData.gender)) {
        driverFormData.append('gender', personalData.gender);
      }
      if (hasValueChanged(personalData.citizenship, original.personalData.citizenship)) {
        driverFormData.append('citizenship', personalData.citizenship);
      }
      
      // Mobile/Secondary Phone
      if (hasValueChanged(formData.secondaryPhone, original.formData.secondaryPhone)) {
        const secondaryCountry = countries.find(c => c.code === secondaryPhoneCountry);
        if (secondaryCountry) {
          // Remove + from dial code for comparison
          const dialCodeWithoutPlus = secondaryCountry.dialCode.replace('+', '');
          let phoneNumber = formData.secondaryPhone;
          
          // If phone starts with the dial code, use it as is (just add + prefix)
          // Otherwise, prepend the dial code
          if (phoneNumber.startsWith(dialCodeWithoutPlus)) {
            driverFormData.append('mobile', `+${phoneNumber}`);
          } else {
            // Phone doesn't start with dial code, prepend it
            driverFormData.append('mobile', `${secondaryCountry.dialCode}${phoneNumber}`);
          }
        } else {
          // Fallback if country not found - add + if not present
          const phoneValue = formData.secondaryPhone.startsWith('+') ? formData.secondaryPhone : `+${formData.secondaryPhone}`;
          driverFormData.append('mobile', phoneValue);
        }
      }
      
      // Travel Information - Drivers License (always send if changed)
      if (hasValueChanged(travelData.driversLicenseNumber, original.travelData.driversLicenseNumber)) {
        driverFormData.append('licenceNumber', travelData.driversLicenseNumber || '');
        console.log('📤 Sending licenceNumber:', travelData.driversLicenseNumber, '(original:', original.travelData.driversLicenseNumber, ')');
      }
      if (hasValueChanged(travelData.driversLicenseExpiry, original.travelData.driversLicenseExpiry)) {
        driverFormData.append('licenceExpiry', travelData.driversLicenseExpiry || '');
        console.log('📤 Sending licenceExpiry:', travelData.driversLicenseExpiry, '(original:', original.travelData.driversLicenseExpiry, ')');
      }
      if (hasValueChanged(travelData.licenseStateProvince, original.travelData.licenseStateProvince)) {
        driverFormData.append('licenceState', travelData.licenseStateProvince || '');
        console.log('📤 Sending licenceState:', travelData.licenseStateProvince, '(original:', original.travelData.licenseStateProvince, ')');
      }
      
      // Travel Information - Passport
      if (hasValueChanged(travelData.passportNumber, original.travelData.passportNumber)) {
        driverFormData.append('passport', travelData.passportNumber);
      }
      if (hasValueChanged(travelData.passportCountry, original.travelData.passportCountry)) {
        driverFormData.append('passportCountry', travelData.passportCountry);
      }
      if (hasValueChanged(travelData.passportExpiry, original.travelData.passportExpiry)) {
        driverFormData.append('passportExpiry', travelData.passportExpiry);
      }
      
      // Travel Information - Fast Card
      if (hasValueChanged(travelData.fastCardNumber, original.travelData.fastCardNumber)) {
        driverFormData.append('fastCard', travelData.fastCardNumber);
      }
      if (hasValueChanged(travelData.fastCardExpiry, original.travelData.fastCardExpiry)) {
        driverFormData.append('fastCardExpiry', travelData.fastCardExpiry);
      }
      if (hasValueChanged(travelData.fastCardValid, original.travelData.fastCardValid)) {
        driverFormData.append('fastCardValid', String(travelData.fastCardValid));
      }
      
      // Travel Information - Canadian Worker Status (always send if changed)
      if (hasValueChanged(travelData.canadianWorkerStatus, original.travelData.canadianWorkerStatus)) {
        driverFormData.append('canadianWorkerStatus', travelData.canadianWorkerStatus || '');
        console.log('📤 Sending canadianWorkerStatus:', travelData.canadianWorkerStatus, '(original:', original.travelData.canadianWorkerStatus, ')');
      }
      if (hasValueChanged(travelData.permanentResidenceExpiry, original.travelData.permanentResidenceExpiry)) {
        driverFormData.append('permanentResidenceExpiry', travelData.permanentResidenceExpiry);
      }
      if (hasValueChanged(travelData.workPermitExpiry, original.travelData.workPermitExpiry)) {
        driverFormData.append('workPermitExpiry', travelData.workPermitExpiry);
      }
      if (hasValueChanged(travelData.wcbNumber, original.travelData.wcbNumber)) {
        driverFormData.append('wsibAccountNo', travelData.wcbNumber);
      }
      
      // Profile Image - always send if a new file is selected
      if (formData.profileImage) {
        driverFormData.append('file', formData.profileImage);
      }

      // Certifications - send as JSON array if changed
      const originalCertifications = original.certifications || [];
      
      // Normalize certifications for comparison (only compare relevant fields)
      const normalizeCert = (cert: any) => ({
        id: cert.id || '',
        expiryDate: cert.expiryDate || '',
        title: cert.title || '',
        description: cert.description || '',
        result: cert.result || '',
        ignoreExpiration: cert.ignoreExpiration || false
      });
      
      const normalizedCurrent = certifications.map(normalizeCert).sort((a, b) => (a.id || '').localeCompare(b.id || ''));
      const normalizedOriginal = originalCertifications.map(normalizeCert).sort((a, b) => (a.id || '').localeCompare(b.id || ''));
      
      const certificationsChanged = JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedOriginal);
      
      console.log('📜 Certifications comparison:', {
        currentCount: certifications.length,
        originalCount: originalCertifications.length,
        changed: certificationsChanged,
        current: normalizedCurrent,
        original: normalizedOriginal
      });
      
      // Always send certifications if they exist (even if unchanged, to ensure backend has latest data)
      if (certifications && certifications.length > 0) {
        const certificationsData = certifications.map(cert => ({
          id: cert.id,
          expiryDate: cert.expiryDate || '',
          title: cert.title || '',
          description: cert.description || '',
          result: cert.result || '',
          ignoreExpiration: cert.ignoreExpiration || false,
          hasFile: !!(cert.file instanceof File) // Only true if it's a new File object
        }));
        driverFormData.append('certifications', JSON.stringify(certificationsData));
        console.log('📜 Sending certifications:', certificationsData.length, 'certifications');
        
        // Append certification files directly (only new File objects)
        certifications.forEach((cert) => {
          if (cert.file instanceof File) {
            driverFormData.append('certificationFiles', cert.file);
            console.log('📎 Appending certification file:', cert.file.name, cert.file.size, 'bytes');
          }
        });
      }
      
      // Documents - send as JSON array and append files
      if (documents && documents.length > 0) {
        const documentsData = documents.map((doc, index) => ({
          id: doc.id,
          expiryDate: doc.expiryDate || '',
          description: doc.description || '',
          ignoreExpiration: doc.ignoreExpiration || false,
          documentType: doc.documentType || 'Other',
          hasFile: !!doc.file,
          documentId: doc.documentId || '',
          index: index // Track index for file matching
        }));
        driverFormData.append('documents', JSON.stringify(documentsData));
        
        // Append document files directly (multer expects array, not indexed)
        documents.forEach((doc) => {
          if (doc.file) {
            driverFormData.append('documentFiles', doc.file);
            driverFormData.append('documentTypes', doc.documentType || 'Other');
          }
        });
        console.log('📄 Sending documents:', documentsData.length, 'documents');
      }
      
      // Violations - send as JSON array (always send if exists, backend handles updates)
      if (violations && violations.length > 0) {
        const violationsData = violations.map(vio => ({
          id: vio.id,
          paymentDueDate: vio.paymentDueDate || '',
          ticket: vio.ticket || '',
          description: vio.description || '',
          currency: vio.currency || 'CAD',
          amount: vio.amount || '',
          violationType: vio.violationType || '',
          hasFile: !!(vio.file instanceof File) // Only true if it's a new File object
        }));
        driverFormData.append('violations', JSON.stringify(violationsData));
        console.log('🚨 Sending violations:', violationsData.length, 'violations');
        
        // Append violation files directly (multer expects array, not indexed)
        // Only append actual File objects (new files), not metadata from existing violations
        violations.forEach((vio) => {
          if (vio.file instanceof File) {
            driverFormData.append('violationFiles', vio.file);
            console.log('📎 Appending violation file:', vio.file.name, vio.file.size, 'bytes');
          }
        });
      }
      
      // Deductions - send as JSON array (always send if exists, backend handles updates)
      if (deductions && deductions.length > 0) {
        const deductionsData = deductions.map(ded => ({
          id: ded.id,
          startDate: ded.startDate || '',
          description: ded.description || '',
          amount: ded.amount || '0',
          interval: ded.interval || '',
          currency: ded.currency || 'CAD'
        }));
        driverFormData.append('deductions', JSON.stringify(deductionsData));
        console.log('💰 Sending deductions:', deductionsData.length, 'deductions');
      }
      
      // Additions - send as JSON array (always send if exists, backend handles updates)
      if (additions && additions.length > 0) {
        const additionsData = additions.map(add => ({
          id: add.id,
          startDate: add.startDate || '',
          description: add.description || '',
          amount: add.amount || '0',
          interval: add.interval || '',
          currency: add.currency || 'CAD'
        }));
        driverFormData.append('additions', JSON.stringify(additionsData));
        console.log('➕ Sending additions:', additionsData.length, 'additions');
      }
      
      // Log what's being sent
      console.log('📤 Updating driver with ID:', editingId);
      const changedFields = Array.from(driverFormData.keys());
      console.log('📋 Changed fields:', changedFields);
      
      // Check if there are documents, certifications, violations, deductions, or additions to send
      const hasDocuments = documents && documents.length > 0;
      const hasCertifications = certifications && certifications.length > 0;
      const hasViolations = violations && violations.length > 0;
      const hasDeductions = deductions && deductions.length > 0;
      const hasAdditions = additions && additions.length > 0;
      
      console.log('🔍 Update summary:', {
        changedFieldsCount: changedFields.length,
        hasProfileImage: !!formData.profileImage,
        hasDocuments,
        hasCertifications,
        hasViolations,
        hasDeductions,
        hasAdditions
      });
      
      // Only proceed if there are changes or related data to update
      if (changedFields.length === 0 && !formData.profileImage && !hasDocuments && !hasCertifications && !hasViolations && !hasDeductions && !hasAdditions) {
        addNotification('info', 'No changes detected. Please modify at least one field before updating.');
        setIsSubmitting(false);
        return;
      }

      const response = await driverApi.updateDriver(editingId, driverFormData);
      
      if (response?.success) {
        console.log('✅ Driver updated successfully');
        
        // All documents, violations, deductions, and additions are now handled by the backend in a single API call
        // No need for separate API calls
        
        // Reload driver data to refresh the form with updated data
        if (editingId) {
          try {
            const driverResponse = await driverApi.getDriverById(editingId);
            if (driverResponse?.success && driverResponse.data) {
              const driver = driverResponse.data;
              
              // Update documents from response
              if (driver.documents && Array.isArray(driver.documents)) {
                // Show all documents without filtering
                const filteredDocuments = driver.documents;
                const existingDocuments = filteredDocuments.map((doc: EmployeeDocument) => ({
                  id: `existing-${doc._id}`,
                  expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : '',
                  description: doc.description || doc.documentType || '',
                  ignoreExpiration: doc.ignoreExpiration || false,
                  file: null,
                  isExisting: true,
                  documentId: doc._id,
                  fileUrl: doc.fileUrl || '',
                  fileName: doc.fileName || '',
                  documentType: doc.documentType || 'Other'
                }));
                setDocuments(existingDocuments);
              }
              
              // Update certifications from response
              if (driver.certifications && Array.isArray(driver.certifications)) {
                const existingCertifications = driver.certifications.map((cert: any) => ({
                  id: `existing-${cert._id}`,
                  expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : '',
                  title: cert.certificateName || cert.title || '',
                  description: cert.description || '',
                  result: cert.status || cert.result || 'pass',
                  ignoreExpiration: false
                }));
                setCertifications(existingCertifications);
              }
              
              // Update violations from response
              if (driver.violations && Array.isArray(driver.violations)) {
                const existingViolations = driver.violations.map((vio: any) => ({
                  id: `existing-${vio._id}`,
                  paymentDueDate: vio.date ? new Date(vio.date).toISOString().split('T')[0] : '',
                  ticket: vio.ticketInfo?.ticketNumber || vio.ticket || '',
                  description: vio.description || '',
                  currency: vio.currency || 'CAD',
                  amount: vio.amount?.toString() || '',
                  violationType: vio.violationType || vio.type || '',
                  file: null, // Don't set file for existing violations (it's a File object, not needed for display)
                  fileUrl: vio.fileUrl || null, // Include fileUrl for displaying existing files
                  fileName: vio.fileName || null // Include fileName for displaying existing files
                }));
                setViolations(existingViolations);
                console.log('✅ Violations reloaded after update:', existingViolations.map((v: any) => ({ id: v.id, hasFile: !!v.fileUrl, fileName: v.fileName })));
              }
              
              // Update deductions from response
              if (driver.deductions && Array.isArray(driver.deductions)) {
                const existingDeductions = driver.deductions.map((ded: any) => ({
                  id: `existing-${ded._id}`,
                  startDate: ded.startDate ? new Date(ded.startDate).toISOString().split('T')[0] : '',
                  description: ded.name || ded.description || '',
                  amount: ded.amount?.toString() || '0',
                  interval: ded.recurrence || ded.interval || '',
                  currency: 'CAD'
                }));
                setDeductions(existingDeductions);
              }
              
              // Update additions from response
              if (driver.additions && Array.isArray(driver.additions)) {
                const existingAdditions = driver.additions.map((add: any) => ({
                  id: `existing-${add._id}`,
                  startDate: add.startDate ? new Date(add.startDate).toISOString().split('T')[0] : '',
                  description: add.name || add.description || '',
                  amount: add.amount?.toString() || '0',
                  interval: add.recurrence || add.interval || '',
                  currency: 'CAD'
                }));
                setAdditions(existingAdditions);
              }
              
              // Update travel data with fresh data from server
              setTravelData({
                driversLicenseNumber: driver.licenceNumber || driver.details?.licenceNumber || driver.details?.driversLicence || '',
                driversLicenseExpiry: (() => {
                  const expiryValue = driver.licenceExpiry || driver.details?.licenceExpiry;
                  return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
                })(),
                licenseStateProvince: driver.licenceState || driver.details?.licenceState || '',
                passportNumber: driver.passport || driver.details?.passport || driver.details?.passportNumber || '',
                passportCountry: driver.passportCountry || driver.details?.passportCountry || '',
                passportExpiry: (() => {
                  const expiryValue = driver.passportExpiry || driver.details?.passportExpiry;
                  return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
                })(),
                fastCardNumber: driver.fastCard || driver.details?.fastCardNo || '',
                fastCardExpiry: (() => {
                  const expiryValue = driver.fastCardExpiry || driver.details?.fastCardExpiry;
                  return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
                })(),
                fastCardValid: driver.fastCardValid !== undefined ? driver.fastCardValid : (driver.details?.fastCardValid || false),
                canadianWorkerStatus: (driver.canadianWorkerStatus || driver.details?.canadianWorkerStatus || 'PERMANENT RESIDENT') as 'CANADIAN CITIZEN' | 'PERMANENT RESIDENT' | 'WORK PERMIT',
                permanentResidenceExpiry: (() => {
                  const expiryValue = driver.permanentResidenceExpiry || driver.details?.permanentResidenceExpiry;
                  return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
                })(),
                workPermitExpiry: (() => {
                  const expiryValue = driver.workPermitExpiry || driver.details?.workPermitExpiry;
                  return expiryValue ? new Date(expiryValue).toISOString().split('T')[0] : '';
                })(),
                wcbNumber: driver.wsibAccountNo || driver.details?.wsibAccountNo || ''
              });
              console.log('✅ All data refreshed after update');
            }
          } catch (error) {
            console.error('Error reloading driver data:', error);
          }
        }
        
        addNotification('success', 'Driver updated successfully!');
        handleCloseModal();
        // Refresh drivers list
        await fetchDrivers();
      } else {
        addNotification('error', response?.message || 'Failed to update driver');
      }
    } catch (error: any) {
      console.error('Error updating driver:', error);
      addNotification('error', error.response?.data?.message || error.message || 'Failed to update driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDF8FF] p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading drivers...</p>
        </div>
      </div>
    );
  }

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
                onClick={() => {
                  setEditingId(null);
                  setEditingDriver(null);
                  setOriginalDriverData(null);
                  resetAllFormState();
                  setShowNewDriverModal(true);
                }}
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
              className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'all'
                  ? 'text-[#42aeec] border-b-2 border-[#42aeec] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              All ({getTabCount('all')})
            </button>
            <button
              onClick={() => setActiveTab('external')}
              className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'external'
                  ? 'text-[#42aeec] border-b-2 border-[#42aeec] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              External ({getTabCount('external')})
            </button>
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'unassigned'
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
          {/* Top Horizontal Scrollbar */}
          <div 
            ref={topScrollRef}
            className="overflow-x-auto overflow-y-hidden border-b border-gray-200"
            style={{ 
              height: '17px'
            }}
            onScroll={(e) => {
              if (tableScrollRef.current) {
                const target = e.target as HTMLDivElement;
                tableScrollRef.current.scrollLeft = target.scrollLeft;
              }
            }}
          >
            <div ref={topScrollContentRef} style={{ height: '1px' }}></div>
          </div>
          <div 
            ref={tableScrollRef}
            className="overflow-x-auto"
            onScroll={(e) => {
              if (topScrollRef.current) {
                const target = e.target as HTMLDivElement;
                topScrollRef.current.scrollLeft = target.scrollLeft;
              }
            }}
          >
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {/* Photo */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-gray-700 uppercase">Photo</span>
                    </div>
                  </th>

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
                
                  </th>

                  {/* Notes */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-gray-700 uppercase">Notes</span>
                    </div>
                  
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
                  {/* Actions */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-gray-700 uppercase">Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDrivers.map((driver, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      // Prevent triggering if clicking on interactive elements (buttons, links, inputs, selects)
                      const target = e.target as HTMLElement;
                      if (target.tagName === 'BUTTON' || target.tagName === 'A' || 
                          target.tagName === 'INPUT' || target.tagName === 'SELECT' ||
                          target.closest('button') || target.closest('a') || 
                          target.closest('input') || target.closest('select')) {
                        return;
                      }
                      
                      // Set editingId to trigger API call (same as edit button)
                      if (driver._id) {
                        console.log('🔄 Row clicked for driver:', driver._id);
                        setEditingId(driver._id);
                        setShowNewDriverModal(true);
                      } else {
                        // Fallback for drivers without _id
                        setEditingDriver(driver);
                        setEditingId(null);
                        setOriginalDriverData(null);
                        resetAllFormState();
                        
                        // Parse phone number to extract country code and number
                        const parsedPhone = parsePhoneNumber(driver.phone || driver.mobile);
                        setPrimaryPhoneCountry(parsedPhone.countryCode);
                        
                        // Populate form data with driver data
                        setFormData({
                          driverId: driver.driverId,
                          firstName: driver.firstName,
                          middle: '',
                          lastName: driver.lastName,
                          emailAddress: driver.email || '',
                          dateOfBirth: driver.dateOfBirth,
                          mobileApp: false,
                          pin: '',
                          primaryPhone: parsedPhone.phoneNumber,
                          secondaryPhone: '',
                          searchAddress: '',
                          address: '',
                          unit: '',
                          city: '',
                          postalCode: '',
                          country: driver.country || '',
                          stateProvince: '',
                          profileImage: null
                        });
                        setActiveFormTab('basic');
                        setShowNewDriverModal(true);
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {driver.profileImageUrl ? (
                          <img
                            src={driver.profileImageUrl}
                            alt={`${driver.firstName || ''} ${driver.lastName || ''}`}
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
                          className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200 ${driver.profileImageUrl ? 'hidden' : ''}`}
                        >
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.driverId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.firstName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.lastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.driversLicence}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.passport}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {driver.dateOfBirth ? (() => {
                        try {
                          // Handle ISO string format (e.g., "2026-02-02T00:00:00.000Z")
                          if (driver.dateOfBirth.includes('T')) {
                            const date = new Date(driver.dateOfBirth);
                            return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
                          }
                          // Handle date string format (e.g., "2026-02-02")
                          if (driver.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const [year, month, day] = driver.dateOfBirth.split('-');
                            return `${month}/${day}/${year}`;
                          }
                          // Return as is if already formatted
                          return driver.dateOfBirth;
                        } catch (e) {
                          return driver.dateOfBirth;
                        }
                      })() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{driver.notes || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.ticketYTD}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{driver.status}</td>
                    <td className="px-4 py-3">
                      <button
                        className={`px-3 py-1 rounded text-xs !text-white font-medium ${getComplianceButtonClass(driver.compliance)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {driver.compliance}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (driver._id) {
                              console.log('✏️ Edit button clicked for driver:', driver._id);
                              setEditingId(driver._id);
                            } else {
                              // Reset all state first, then populate with driver data
                              setEditingId(null);
                              setEditingDriver(driver);
                              setOriginalDriverData(null);
                              resetAllFormState();
                              
                              // Parse phone number to extract country code and number
                              const parsedPhone = parsePhoneNumber(driver.phone || driver.mobile);
                              setPrimaryPhoneCountry(parsedPhone.countryCode);
                              
                              setFormData({
                                driverId: driver.driverId,
                                firstName: driver.firstName,
                                middle: '',
                                lastName: driver.lastName,
                                emailAddress: driver.email || '',
                                dateOfBirth: driver.dateOfBirth,
                                mobileApp: false,
                                pin: '',
                                primaryPhone: parsedPhone.phoneNumber,
                                secondaryPhone: '',
                                searchAddress: '',
                                address: '',
                                unit: '',
                                city: '',
                                postalCode: '',
                                country: driver.country || '',
                                stateProvince: '',
                                profileImage: null
                              });
                              setActiveFormTab('basic');
                              setShowNewDriverModal(true);
                            }
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Driver"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (driver._id) {
                              handleDelete(driver._id);
                            } else {
                              handleDelete(driver.driverId);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Driver"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* New Driver Modal */}
      {showNewDriverModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Sidebar */}
            <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col">
              {/* Image Upload Area */}
              <div className="p-3 border-b border-gray-200">
                <div 
                  className="border-2 border-dashed border-gray-300 p-4 text-center mb-2 cursor-pointer hover:border-[#42aeec] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">Select Image</p>
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
                      if (file.size > 20 * 1024 * 1024) {
                        addNotification('error', 'File size must be less than 20MB');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                        return;
                      }
                      if (!file.type.startsWith('image/')) {
                        addNotification('error', 'Please select an image file');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                        return;
                      }
                      setFormData({ ...formData, profileImage: file });
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
                  className="w-full bg-black !text-white py-1.5 text-xs font-medium hover:bg-gray-800 transition-colors"
                >
                  {formData.profileImage ? 'CHANGE IMAGE' : 'UPLOAD'}
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex-1 overflow-y-auto p-3">
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
                        className={`w-full flex items-center gap-1.5 px-2 py-1.5 transition-colors text-left ${isActive
                            ? 'bg-[#0ea3d8] !text-white shadow-md'
                            : 'bg-gray-700 !text-white hover:bg-gray-600'
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium text-center">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

            </div>

            {/* Right Content Area */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-all ${selectedCertificate ? 'mr-96' : ''}`}>
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-bold text-gray-900">{(editingId || editingDriver) ? 'Edit Driver' : 'New Driver'}</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={editingId ? handleUpdateDriver : handleSaveDriver}
                    className="px-3 py-1 text-xs bg-gray-600 !text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    {editingId ? 'UPDATE' : 'SAVE'}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-3 bg-white">
                {activeFormTab === 'basic' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Basic Information</h3>

                    {/* First Row */}
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Driver ID</label>
                        <input
                          type="text"
                          placeholder="Driver ID"
                          value={formData.driverId}
                          onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          First Name<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={(e) => {
                            setFormData({ ...formData, firstName: e.target.value });
                            if (validationErrors.firstName) {
                              setValidationErrors({ ...validationErrors, firstName: '' });
                            }
                          }}
                          className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent ${
                            validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.firstName && (
                          <p className="text-xs text-red-500 mt-0.5">{validationErrors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Middle</label>
                        <input
                          type="text"
                          placeholder="Middle"
                          value={formData.middle}
                          onChange={(e) => setFormData({ ...formData, middle: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          Last Name<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={(e) => {
                            setFormData({ ...formData, lastName: e.target.value });
                            if (validationErrors.lastName) {
                              setValidationErrors({ ...validationErrors, lastName: '' });
                            }
                          }}
                          className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent ${
                            validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.lastName && (
                          <p className="text-xs text-red-500 mt-0.5">{validationErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Second Row */}
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          Email Address<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={formData.emailAddress}
                          onChange={(e) => {
                            setFormData({ ...formData, emailAddress: e.target.value });
                            if (validationErrors.emailAddress) {
                              setValidationErrors({ ...validationErrors, emailAddress: '' });
                            }
                          }}
                          className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent ${
                            validationErrors.emailAddress ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.emailAddress && (
                          <p className="text-xs text-red-500 mt-0.5">{validationErrors.emailAddress}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          Date Of Birth<span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => {
                              setFormData({ ...formData, dateOfBirth: e.target.value });
                              if (validationErrors.dateOfBirth) {
                                setValidationErrors({ ...validationErrors, dateOfBirth: '' });
                              }
                            }}
                            className={`w-full pl-7 pr-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent ${
                              validationErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Select"
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        {validationErrors.dateOfBirth && (
                          <p className="text-xs text-red-500 mt-0.5">{validationErrors.dateOfBirth}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Mobile App</label>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, mobileApp: !formData.mobileApp })}
                            className={`relative w-9 h-5 rounded-full transition-colors ${formData.mobileApp ? 'bg-[#42aeec]' : 'bg-gray-300'
                              }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${formData.mobileApp ? 'translate-x-4' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">PIN</label>
                        <input
                          type="text"
                          placeholder="Pin"
                          value={formData.pin}
                          onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Third Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          Primary Phone #<span className="text-red-500">*</span>
                        </label>
                        <div className={`flex items-center border rounded focus-within:ring-2 focus-within:ring-[#42aeec] focus-within:border-transparent ${
                          validationErrors.primaryPhone ? 'border-red-500' : 'border-gray-300'
                        }`}>
                          <div className="relative" ref={primaryCountryDropdownRef}>
                            <button
                              type="button"
                              onClick={() => {
                                setPrimaryCountryDropdownOpen(!primaryCountryDropdownOpen);
                                if (!primaryCountryDropdownOpen) {
                                  setPrimaryCountrySearch('');
                                }
                              }}
                              className="flex items-center gap-1.5 px-2 py-1 text-xs bg-white border-none outline-none cursor-pointer h-full"
                              style={{ minWidth: '85px' }}
                            >
                              {countries.find(c => c.code === primaryPhoneCountry) && (
                                <>
                                  <span className="text-sm" style={{ fontSize: '16px' }}>{countries.find(c => c.code === primaryPhoneCountry)?.flag}</span>
                                  <span className="text-xs text-gray-600 font-medium">{countries.find(c => c.code === primaryPhoneCountry)?.dialCode}</span>
                                </>
                              )}
                              <ChevronDown className="w-3 h-3 text-gray-400 ml-auto" />
                            </button>
                            {primaryCountryDropdownOpen && (
                              <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg mt-1" style={{ minWidth: '280px', maxWidth: '320px' }}>
                                {/* Search Input */}
                                <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                                  <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={primaryCountrySearch}
                                    onChange={(e) => setPrimaryCountrySearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                                  />
                                </div>
                                {/* Countries List */}
                                <div className="max-h-60 overflow-y-auto">
                                  {countries
                                    .filter((country) => {
                                      const searchLower = primaryCountrySearch.toLowerCase();
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
                                          setPrimaryPhoneCountry(country.code);
                                          setPrimaryCountryDropdownOpen(false);
                                          setPrimaryCountrySearch('');
                                          // Don't auto-fill dial code - keep the input field clean
                                          // User will enter only their phone number
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-100 transition-colors ${
                                          primaryPhoneCountry === country.code ? 'bg-blue-50' : ''
                                        }`}
                                      >
                                        <span className="text-base" style={{ fontSize: '18px' }}>{country.flag}</span>
                                        <span className="flex-1 truncate">{country.name}</span>
                                        <span className="text-gray-600 font-medium">{country.dialCode}</span>
                                      </button>
                                    ))}
                                  {countries.filter((country) => {
                                    const searchLower = primaryCountrySearch.toLowerCase();
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
                          <div className="h-5 w-px bg-gray-300"></div>
                          <input
                            type="tel"
                            placeholder=""
                            value={formData.primaryPhone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setFormData({ ...formData, primaryPhone: value });
                            }}
                            className="flex-1 px-2 py-1 text-xs border-none outline-none focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Secondary Phone #</label>
                        <div className="flex items-center border border-gray-300 rounded focus-within:ring-2 focus-within:ring-[#42aeec] focus-within:border-transparent">
                          <div className="relative" ref={secondaryCountryDropdownRef}>
                            <button
                              type="button"
                              onClick={() => {
                                setSecondaryCountryDropdownOpen(!secondaryCountryDropdownOpen);
                                if (!secondaryCountryDropdownOpen) {
                                  setSecondaryCountrySearch('');
                                }
                              }}
                              className="flex items-center gap-1.5 px-2 py-1 text-xs bg-white border-none outline-none cursor-pointer h-full"
                              style={{ minWidth: '85px' }}
                            >
                              {countries.find(c => c.code === secondaryPhoneCountry) && (
                                <>
                                  <span className="text-sm" style={{ fontSize: '16px' }}>{countries.find(c => c.code === secondaryPhoneCountry)?.flag}</span>
                                  <span className="text-xs text-gray-600 font-medium">{countries.find(c => c.code === secondaryPhoneCountry)?.dialCode}</span>
                                </>
                              )}
                              <ChevronDown className="w-3 h-3 text-gray-400 ml-auto" />
                            </button>
                            {secondaryCountryDropdownOpen && (
                              <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg mt-1" style={{ minWidth: '280px', maxWidth: '320px' }}>
                                {/* Search Input */}
                                <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                                  <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={secondaryCountrySearch}
                                    onChange={(e) => setSecondaryCountrySearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                                  />
                                </div>
                                {/* Countries List */}
                                <div className="max-h-60 overflow-y-auto">
                                  {countries
                                    .filter((country) => {
                                      const searchLower = secondaryCountrySearch.toLowerCase();
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
                                          setSecondaryPhoneCountry(country.code);
                                          setSecondaryCountryDropdownOpen(false);
                                          setSecondaryCountrySearch('');
                                          // Don't auto-fill dial code - keep the input field clean
                                          // User will enter only their phone number
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-100 transition-colors ${
                                          secondaryPhoneCountry === country.code ? 'bg-blue-50' : ''
                                        }`}
                                      >
                                        <span className="text-base" style={{ fontSize: '18px' }}>{country.flag}</span>
                                        <span className="flex-1 truncate">{country.name}</span>
                                        <span className="text-gray-600 font-medium">{country.dialCode}</span>
                                      </button>
                                    ))}
                                  {countries.filter((country) => {
                                    const searchLower = secondaryCountrySearch.toLowerCase();
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
                          <div className="h-5 w-px bg-gray-300"></div>
                          <input
                            type="tel"
                            placeholder=""
                            value={formData.secondaryPhone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setFormData({ ...formData, secondaryPhone: value });
                            }}
                            className="flex-1 px-2 py-1 text-xs border-none outline-none focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fourth Row */}
                    <div>
                      <AddressSearch
                        label="Search Address"
                        placeholder="Search For An Address..."
                        onAddressSelect={(addressData) => {
                          // Map country name to country code
                          let countryCode = '';
                          const countryName = addressData.country?.toLowerCase() || '';
                          if (countryName.includes('united states') || countryName.includes('usa') || countryName === 'us') {
                            countryCode = 'US';
                          } else if (countryName.includes('canada') || countryName === 'ca') {
                            countryCode = 'CA';
                          }

                          // Map state/province name to code if needed
                          let stateProvinceCode = addressData.state || '';
                          if (countryCode === 'US' && addressData.state) {
                            // Try to find matching state code
                            const matchedState = US_STATES.find(
                              s => s.label.toLowerCase() === addressData.state.toLowerCase() || 
                                   s.value.toLowerCase() === addressData.state.toLowerCase()
                            );
                            if (matchedState) {
                              stateProvinceCode = matchedState.value;
                            }
                          } else if (countryCode === 'CA' && addressData.state) {
                            // Try to find matching province code
                            const matchedProvince = CANADIAN_PROVINCES.find(
                              p => p.label.toLowerCase() === addressData.state.toLowerCase() || 
                                   p.value.toLowerCase() === addressData.state.toLowerCase()
                            );
                            if (matchedProvince) {
                              stateProvinceCode = matchedProvince.value;
                            }
                          }

                          // Populate all address fields
                          setFormData({
                            ...formData,
                            address: addressData.address || '',
                            city: addressData.city || '',
                            postalCode: addressData.postalCode || '',
                            stateProvince: stateProvinceCode,
                            country: countryCode,
                            searchAddress: addressData.fullAddress || ''
                          });
                        }}
                        className=""
                      />
                    </div>

                    {/* Fifth Row */}
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Address</label>
                        <input
                          type="text"
                          placeholder="Address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Unit</label>
                        <input
                          type="text"
                          placeholder="Unit"
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">City</label>
                        <input
                          type="text"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Postal Code</label>
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Profile Image Row */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {profileImagePreview ? (
                            <img
                              src={profileImagePreview}
                              alt="Profile preview"
                              className="w-24 h-24 rounded-lg object-cover border-2 border-gray-300"
                              onError={() => {
                                // If image fails to load, show placeholder
                                setProfileImagePreview(null);
                              }}
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                              <User className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
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
                                // Validate file type
                                if (!file.type.startsWith('image/')) {
                                  alert('Please select an image file');
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                  return;
                                }
                                setFormData({ ...formData, profileImage: file });
                                // Create preview
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
                            onClick={() => {
                              fileInputRef.current?.click();
                            }}
                            className="inline-block !mr-3 px-4 py-2 bg-[#42aeec] !text-white rounded-lg cursor-pointer hover:bg-[#0ea3d8] transition-colors"
                          >
                            {formData.profileImage ? 'Change Image' : 'Select Image'}
                          </button>
                          {formData.profileImage && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, profileImage: null });
                                setProfileImagePreview(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                              className="ml-2 px-4 py-2 bg-red-500 !text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                          <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF (Max 20MB)</p>
                        </div>
                      </div>
                    </div>

                    {/* Sixth Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          Country<span className="text-red-500">*</span>
                        </label>
                        <select
                          value={(() => {
                            // Find country by name (formData.country stores the name)
                            const foundCountry = countries.find(c => c.name === formData.country);
                            return foundCountry ? foundCountry.code : '';
                          })()}
                          onChange={(e) => {
                            const selectedCountry = countries.find(c => c.code === e.target.value);
                            setFormData({ 
                              ...formData, 
                              country: selectedCountry ? selectedCountry.name : '', 
                              stateProvince: '' 
                            });
                            if (validationErrors.country) {
                              setValidationErrors({ ...validationErrors, country: '' });
                            }
                            if (validationErrors.stateProvince) {
                              setValidationErrors({ ...validationErrors, stateProvince: '' });
                            }
                          }}
                          className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent ${
                            validationErrors.country ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Country</option>
                          {countries.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.flag} {country.name}
                            </option>
                          ))}
                        </select>
                        {validationErrors.country && (
                          <p className="text-xs text-red-500 mt-0.5">{validationErrors.country}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          Province/State<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.stateProvince}
                          onChange={(e) => {
                            setFormData({ ...formData, stateProvince: e.target.value });
                            if (validationErrors.stateProvince) {
                              setValidationErrors({ ...validationErrors, stateProvince: '' });
                            }
                          }}
                          disabled={!formData.country}
                          placeholder={formData.country ? "Enter Province/State" : "Select country first"}
                          className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            validationErrors.stateProvince ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.stateProvince && (
                          <p className="text-xs text-red-500 mt-0.5">{validationErrors.stateProvince}</p>
                        )}
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
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type="date"
                            value={personalData.hireDate}
                            onChange={(e) => setPersonalData({ ...personalData, hireDate: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Termination Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type="date"
                            value={personalData.terminationDate}
                            onChange={(e) => setPersonalData({ ...personalData, terminationDate: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status<span className="text-red-500">*</span>
                        </label>
                        <select
                          value={personalData.status}
                          onChange={(e) => {
                            setPersonalData({ ...personalData, status: e.target.value });
                            if (validationErrors.status) {
                              setValidationErrors({ ...validationErrors, status: '' });
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent ${
                            validationErrors.status ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Terminated">Terminated</option>
                        </select>
                        {validationErrors.status && (
                          <p className="text-xs text-red-500 mt-0.5">{validationErrors.status}</p>
                        )}
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
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-900 mb-1.5">Pay Type</label>

                      {/* Driver Type Toggle */}
                      <div className="mb-1.5">
                        <div className="flex gap-0">
                          <button
                            type="button"
                            onClick={() => setPersonalData({ ...personalData, driverType: 'COMPANY DRIVER' })}
                            className={`px-4 py-1.5 text-xs font-medium transition-colors rounded-l ${personalData.driverType === 'COMPANY DRIVER'
                                ? 'bg-gray-700 !text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            COMPANY DRIVER
                          </button>
                          <button
                            type="button"
                            onClick={() => setPersonalData({ ...personalData, driverType: 'OWNER OPERATOR' })}
                            className={`px-4 py-1.5 text-xs font-medium transition-colors rounded-r ${personalData.driverType === 'OWNER OPERATOR'
                                ? 'bg-gray-700 !text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                          >
                            OWNER OPERATOR
                          </button>
                        </div>
                      </div>


                      {/* Configure Payroll Text - shown when OWNER OPERATOR is selected */}
                      {personalData.driverType === 'OWNER OPERATOR' && (
                        <p className="text-xs font-medium text-gray-900 mt-1.5">
                          CONFIGURE PAYROLL IN TRUCK
                        </p>
                      )}

                      {/* Payment Method Tabs - Only show when COMPANY DRIVER is selected */}
                      {personalData.driverType === 'COMPANY DRIVER' && (
                        <div className="mb-3">
                          <div className="flex gap-1.5 flex-wrap">
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
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${personalData.paymentMethod === method
                                    ? 'bg-gray-700 !text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                              >
                                {method}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* $/Mile Details (shown when PAID PER MILE is selected and COMPANY DRIVER) */}
                      {personalData.driverType === 'COMPANY DRIVER' && personalData.paymentMethod === 'PAID PER MILE' && (
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

                      {/* Percent Rate (shown when PAID PERCENT is selected and COMPANY DRIVER) */}
                      {personalData.driverType === 'COMPANY DRIVER' && personalData.paymentMethod === 'PAID PERCENT' && (
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

                      {/* Per Trip Amount (shown when PAID BY TRIP is selected and COMPANY DRIVER) */}
                      {personalData.driverType === 'COMPANY DRIVER' && personalData.paymentMethod === 'PAID BY TRIP' && (
                        <div className="mt-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              Per Trip Amount<span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={personalData.perTripAmount}
                              onChange={(e) => setPersonalData({ ...personalData, perTripAmount: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )}

                      {/* Hourly Rate (shown when PAID PER HOUR is selected and COMPANY DRIVER) */}
                      {personalData.driverType === 'COMPANY DRIVER' && personalData.paymentMethod === 'PAID PER HOUR' && (
                        <div className="mt-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              PER HOUR<span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={personalData.hourlyRate}
                              onChange={(e) => setPersonalData({ ...personalData, hourlyRate: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )}

                      {/* Daily Rate (shown when PAID PER DAY is selected and COMPANY DRIVER) */}
                      {personalData.driverType === 'COMPANY DRIVER' && personalData.paymentMethod === 'PAID PER DAY' && (
                        <div className="mt-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              PER DAY<span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={personalData.dailyRate}
                              onChange={(e) => setPersonalData({ ...personalData, dailyRate: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                              placeholder="0"
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
                          className={`px-6 py-2 rounded-sm font-medium transition-colors ${personalData.driverTypeSolo
                              ? 'bg-gray-700 !text-white'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            }`}
                        >
                          SOLO
                        </button>
                        <button
                          type="button"
                          onClick={() => setPersonalData({ ...personalData, driverTypeSolo: false })}
                          className={`px-6 py-2 rounded-sm font-medium transition-colors ${!personalData.driverTypeSolo
                              ? 'bg-gray-700 !text-white'
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

                    {/* Gender and Citizenship */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                          value={personalData.gender}
                          onChange={(e) => setPersonalData({ ...personalData, gender: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Citizenship</label>
                        <select
                          value={personalData.citizenship}
                          onChange={(e) => setPersonalData({ ...personalData, citizenship: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select Citizenship</option>
                          <option value="Canadian">Canadian</option>
                          <option value="US">United States</option>
                          <option value="Indian">Indian</option>
                          <option value="Other">Other</option>
                        </select>
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

                    {/* Driver's License Row */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4">Driver's License</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Drivers License #<span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Drivers License #"
                            value={travelData.driversLicenseNumber}
                            onChange={(e) => {
                              setTravelData({ ...travelData, driversLicenseNumber: e.target.value });
                              if (validationErrors.driversLicenseNumber) {
                                setValidationErrors({ ...validationErrors, driversLicenseNumber: '' });
                              }
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent ${
                              validationErrors.driversLicenseNumber ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {validationErrors.driversLicenseNumber && (
                            <p className="text-xs text-red-500 mt-0.5">{validationErrors.driversLicenseNumber}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Of Expiry<span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type="date"
                              value={travelData.driversLicenseExpiry}
                              onChange={(e) => {
                                setTravelData({ ...travelData, driversLicenseExpiry: e.target.value });
                                if (validationErrors.driversLicenseExpiry) {
                                  setValidationErrors({ ...validationErrors, driversLicenseExpiry: '' });
                                }
                              }}
                              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent ${
                                validationErrors.driversLicenseExpiry ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Select"
                            />
                          </div>
                          {validationErrors.driversLicenseExpiry && (
                            <p className="text-xs text-red-500 mt-0.5">{validationErrors.driversLicenseExpiry}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">License State/Province</label>
                          <input
                            type="text"
                            value={travelData.licenseStateProvince}
                            onChange={(e) => setTravelData({ ...travelData, licenseStateProvince: e.target.value })}
                            placeholder="Enter State/Province"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Passport Row */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4">Passport</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Passport #<span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Passport #"
                            value={travelData.passportNumber}
                            onChange={(e) => {
                              setTravelData({ ...travelData, passportNumber: e.target.value });
                              if (validationErrors.passportNumber) {
                                setValidationErrors({ ...validationErrors, passportNumber: '' });
                              }
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent ${
                              validationErrors.passportNumber ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {validationErrors.passportNumber && (
                            <p className="text-xs text-red-500 mt-0.5">{validationErrors.passportNumber}</p>
                          )}
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
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type="date"
                              value={travelData.passportExpiry}
                              onChange={(e) => {
                                setTravelData({ ...travelData, passportExpiry: e.target.value });
                                if (validationErrors.passportExpiry) {
                                  setValidationErrors({ ...validationErrors, passportExpiry: '' });
                                }
                              }}
                              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent ${
                                validationErrors.passportExpiry ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Select"
                            />
                          </div>
                          {validationErrors.passportExpiry && (
                            <p className="text-xs text-red-500 mt-0.5">{validationErrors.passportExpiry}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fast Card Row */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4">Fast Card</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                              type="date"
                              value={travelData.fastCardExpiry}
                              onChange={(e) => setTravelData({ ...travelData, fastCardExpiry: e.target.value })}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                              placeholder="Select"
                            />
                          </div>
                        </div>
                        <div className="flex items-end">
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
                      </div>
                    </div>

                    {/* Canadian Worker Status Section */}
                    <div className="mt-6">
                      <h4 className="text-md font-bold text-gray-900 mb-4">Canadian Worker Status</h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTravelData({ ...travelData, canadianWorkerStatus: 'CANADIAN CITIZEN' })}
                          className={`px-6 py-2 rounded-sm font-medium transition-colors ${travelData.canadianWorkerStatus === 'CANADIAN CITIZEN'
                              ? 'bg-gray-700 !text-white'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            }`}
                        >
                          CANADIAN CITIZEN
                        </button>
                        <button
                          type="button"
                          onClick={() => setTravelData({ ...travelData, canadianWorkerStatus: 'PERMANENT RESIDENT' })}
                          className={`px-6 py-2 rounded-sm font-medium transition-colors ${travelData.canadianWorkerStatus === 'PERMANENT RESIDENT'
                              ? 'bg-gray-700 !text-white'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            }`}
                        >
                          PERMANENT RESIDENT
                        </button>
                        <button
                          type="button"
                          onClick={() => setTravelData({ ...travelData, canadianWorkerStatus: 'WORK PERMIT' })}
                          className={`px-6 py-2 rounded-sm font-medium transition-colors ${travelData.canadianWorkerStatus === 'WORK PERMIT'
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
                        <div className="relative max-w-md">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type="date"
                            value={travelData.permanentResidenceExpiry}
                            onChange={(e) => setTravelData({ ...travelData, permanentResidenceExpiry: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                    )}

                    {/* Work Permit Expiry */}
                    {travelData.canadianWorkerStatus === 'WORK PERMIT' && (
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Work Permit Expiry</label>
                        <div className="relative max-w-md">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type="date"
                            value={travelData.workPermitExpiry}
                            onChange={(e) => setTravelData({ ...travelData, workPermitExpiry: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            placeholder="Select"
                          />
                        </div>
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
                                      if (editingDocumentId) {
                                        // Update existing document in the list - preserve all existing fields
                                        setDocuments(documents.map(d => 
                                          d.id === editingDocumentId 
                                            ? {
                                                ...d,
                                                expiryDate: newDocument.expiryDate,
                                                description: newDocument.description,
                                                ignoreExpiration: newDocument.ignoreExpiration,
                                                documentType: newDocument.documentType || d.documentType || 'Other',
                                                file: newDocument.file || null, // Only set if new file is uploaded
                                                // Preserve existing file info if no new file
                                                fileUrl: newDocument.file ? undefined : (d.fileUrl || undefined),
                                                fileName: newDocument.file ? undefined : (d.fileName || undefined)
                                              }
                                            : d
                                        ));
                                        if (newDocument.file && documentFile) {
                                          setUploadedFiles({ ...uploadedFiles, [editingDocumentId]: documentFile });
                                        }
                                        setEditingDocumentId(null);
                                        console.log('✅ Document updated in list:', editingDocumentId);
                                      } else {
                                        // Add new document
                                        const docId = Date.now().toString();
                                        setDocuments([...documents, {
                                          id: docId,
                                          expiryDate: newDocument.expiryDate,
                                          description: newDocument.description,
                                          ignoreExpiration: newDocument.ignoreExpiration,
                                          documentType: newDocument.documentType || 'Other',
                                          file: newDocument.file || null,
                                          isExisting: false
                                        }]);
                                        if (newDocument.file && documentFile) {
                                          setUploadedFiles({ ...uploadedFiles, [docId]: documentFile });
                                        }
                                      }
                                      setNewDocument({
                                        expiryDate: '',
                                        description: '',
                                        ignoreExpiration: false,
                                        file: null,
                                        documentType: 'Other'
                                      });
                                      setDocumentFile(null);
                                    }
                                  }}
                                  className="w-10 h-10 bg-black !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                                >
                                  {editingDocumentId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">FILE</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">IGNORE EXPIRATION</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {documents.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                No Data
                              </td>
                            </tr>
                          ) : (
                            documents.map((doc) => (
                              <tr key={doc.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {doc.expiryDate ? (() => {
                                    try {
                                      // Format date for display (YYYY-MM-DD to readable format)
                                      const date = new Date(doc.expiryDate);
                                      if (!isNaN(date.getTime())) {
                                        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                                      }
                                      return doc.expiryDate;
                                    } catch (e) {
                                      return doc.expiryDate;
                                    }
                                  })() : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {doc.description || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    {doc.isExisting && doc.documentId && (doc.fileUrl || doc.fileName) ? (
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            if (doc.documentId) {
                                              const signedUrlResponse = await getSignedEmployeeDocumentUrl(doc.documentId, 'inline');
                                              if (signedUrlResponse?.success && signedUrlResponse.url) {
                                                window.open(signedUrlResponse.url, '_blank');
                                              } else {
                                                // Fallback to direct fileUrl if signed URL fails
                                                if (doc.fileUrl) {
                                                  window.open(doc.fileUrl, '_blank');
                                                }
                                              }
                                            }
                                          } catch (error) {
                                            console.error('Error opening document:', error);
                                            // Fallback to direct fileUrl
                                            if (doc.fileUrl) {
                                              window.open(doc.fileUrl, '_blank');
                                            }
                                          }
                                        }}
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                                        title={doc.fileName || 'View document'}
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span className="text-xs">{doc.fileName || 'View'}</span>
                                      </button>
                                    ) : uploadedFiles[doc.id] ? (
                                      <span title={uploadedFiles[doc.id].name} className="flex items-center gap-1 text-gray-600">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs">{uploadedFiles[doc.id].name}</span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
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
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Load document data into form for editing
                                        console.log('✏️ Editing document:', doc);
                                        setNewDocument({
                                          expiryDate: doc.expiryDate || '',
                                          description: doc.description || '',
                                          ignoreExpiration: doc.ignoreExpiration || false,
                                          file: null, // Don't set file for existing documents (it's a File object, not needed for display)
                                          documentType: doc.documentType || 'Other'
                                        });
                                        setEditingDocumentId(doc.id);
                                        // Show existing file info if available
                                        if (doc.fileName) {
                                          setDocumentFile({ name: doc.fileName, size: 0 });
                                        } else {
                                          setDocumentFile(null);
                                        }
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Edit document"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this document?')) {
                                          try {
                                            // If it's an existing document, delete it from backend
                                            if (doc.isExisting && doc.documentId) {
                                              const response = await deleteEmployeeDocument(doc.documentId);
                                              if (response?.success) {
                                                addNotification('success', 'Document deleted successfully!');
                                              } else {
                                                addNotification('error', response?.message || 'Failed to delete document');
                                              }
                                            }
                                            // Remove from local state
                                            setDocuments(documents.filter(d => d.id !== doc.id));
                                            // Clear editing state if this was the document being edited
                                            if (editingDocumentId === doc.id) {
                                              setEditingDocumentId(null);
                                              setNewDocument({
                                                expiryDate: '',
                                                description: '',
                                                ignoreExpiration: false,
                                                file: null,
                                                documentType: 'Other'
                                              });
                                              setDocumentFile(null);
                                            }
                                            // Remove from uploadedFiles if it exists
                                            if (uploadedFiles[doc.id]) {
                                              const newUploadedFiles = { ...uploadedFiles };
                                              delete newUploadedFiles[doc.id];
                                              setUploadedFiles(newUploadedFiles);
                                            }
                                          } catch (error: any) {
                                            console.error('Error deleting document:', error);
                                            addNotification('error', error.response?.data?.message || error.message || 'Failed to delete document');
                                          }
                                        }
                                      }}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Delete document"
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
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">EXPIRY DATE</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">TITLE</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">DESCRIPTION</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">RESULT</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">IGNORE EXPIRATION</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">DOCUMENT</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {/* Input Row */}
                          <tr className="bg-gray-50">
                            <td className="px-3 py-2">
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
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                placeholder="Title"
                                value={newCertification.title}
                                onChange={(e) => setNewCertification({ ...newCertification, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                placeholder="Description"
                                value={newCertification.description}
                                onChange={(e) => setNewCertification({ ...newCertification, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                              />
                            </td>
                            <td className="px-3 py-2">
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
                            <td className="px-3 py-2">
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
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {certificationFile ? (
                                  <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
                                    <FileText className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-700 truncate max-w-[120px]">{certificationFile.name}</span>
                                    <button
                                      onClick={() => {
                                        setCertificationFile(null);
                                        setNewCertification({ ...newCertification, file: null });
                                      }}
                                      className="text-gray-400 hover:text-red-600 transition-colors"
                                      title="Remove file"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                                    <Upload className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-700">Select File</span>
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setCertificationFile(file);
                                          setNewCertification({ ...newCertification, file: file });
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                                <button
                                  onClick={() => {
                                    if (newCertification.expiryDate || newCertification.title) {
                                      if (editingCertificationId) {
                                        // Update existing certification in the list
                                        setCertifications(certifications.map(c => 
                                          c.id === editingCertificationId 
                                            ? {
                                                ...c,
                                                expiryDate: newCertification.expiryDate,
                                                title: newCertification.title,
                                                description: newCertification.description,
                                                result: newCertification.result,
                                                ignoreExpiration: newCertification.ignoreExpiration,
                                                file: newCertification.file
                                              }
                                            : c
                                        ));
                                        setEditingCertificationId(null);
                                      } else {
                                        // Add new certification
                                        setCertifications([...certifications, {
                                          id: Date.now().toString(),
                                          expiryDate: newCertification.expiryDate,
                                          title: newCertification.title,
                                          description: newCertification.description,
                                          result: newCertification.result,
                                          ignoreExpiration: newCertification.ignoreExpiration,
                                          file: newCertification.file
                                        }]);
                                      }
                                      setNewCertification({
                                        expiryDate: '',
                                        title: '',
                                        description: '',
                                        result: '',
                                        ignoreExpiration: false,
                                        file: null
                                      });
                                      setCertificationFile(null);
                                    }
                                  }}
                                  className="w-10 h-10 bg-black !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                                >
                                  {editingCertificationId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">DESCRIPTION</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">RESULT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">IGNORE EXPIRATION</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">DOCUMENT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {certifications.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                No Data
                              </td>
                            </tr>
                          ) : (
                            certifications.map((cert) => (
                              <tr
                                key={cert.id}
                                className={`hover:bg-gray-50 ${selectedCertificate?.id === cert.id ? 'bg-blue-50' : ''}`}
                              >
                                <td className="px-4 py-3 text-sm text-gray-900">{cert.expiryDate || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{cert.title || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{cert.description || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{cert.result || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {cert.ignoreExpiration ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {(cert.file instanceof File || cert.fileUrl || cert.fileName) ? (
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-blue-500" />
                                      <span className="text-sm text-gray-700 truncate max-w-[150px]" title={cert.file instanceof File ? cert.file.name : (cert.fileName || 'File attached')}>
                                        {cert.file instanceof File ? cert.file.name : (cert.fileName || 'File attached')}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Load certification data into form for editing
                                        setNewCertification({
                                          expiryDate: cert.expiryDate || '',
                                          title: cert.title || '',
                                          description: cert.description || '',
                                          result: cert.result || '',
                                          ignoreExpiration: cert.ignoreExpiration || false,
                                          file: cert.file || null
                                        });
                                        setEditingCertificationId(cert.id);
                                        setSelectedCertificate(null); // Close side panel if open
                                        if (cert.file instanceof File) {
                                          setCertificationFile(cert.file);
                                        } else {
                                          setCertificationFile(null);
                                        }
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Edit certification"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteCertification({ open: true, cert });
                                      }}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Delete certification"
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
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                {selectedCertificate.description || '-'}
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
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type of Violation <span className="text-red-500">*</span></label>
                          <select
                            value={newViolation.violationType}
                            onChange={(e) => {
                              setNewViolation({ ...newViolation, violationType: e.target.value });
                              if (validationErrors.violationType) {
                                setValidationErrors({ ...validationErrors, violationType: '' });
                              }
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent ${
                              validationErrors.violationType ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select Type</option>
                            <option value="HOs">HOs</option>
                            <option value="speeding">Speeding</option>
                            <option value="accident">Accident</option>
                            <option value="ticket">Ticket</option>
                            <option value="behaviour issue">Behaviour Issue</option>
                            <option value="general">General</option>
                            <option value="warning letters">Warning Letters</option>
                            <option value="other violation">Other Violation</option>
                          </select>
                          {validationErrors.violationType && (
                            <p className="text-xs text-red-500 mt-0.5">{validationErrors.violationType}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            placeholder="title"
                            value={newViolation.ticket}
                            onChange={(e) => setNewViolation({ ...newViolation, ticket: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            placeholder="Description"
                            value={newViolation.description}
                            onChange={(e) => setNewViolation({ ...newViolation, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                          <select
                            value={newViolation.currency}
                            onChange={(e) => setNewViolation({ ...newViolation, currency: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          >
                            <option value="CAD">Canadian Dollar (CAD)</option>
                            <option value="USD">American Dollar (USD)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newViolation.amount}
                            onChange={(e) => setNewViolation({ ...newViolation, amount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
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
                                    setViolationFile(file);
                                    setNewViolation({ ...newViolation, file: file });
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => {
                              if (editingViolationId) {
                                // Update existing violation
                                if (!newViolation.violationType || !newViolation.violationType.trim()) {
                                  setValidationErrors({ ...validationErrors, violationType: 'Type of Violation is required' });
                                  addNotification('error', 'Please select a Type of Violation');
                                  return;
                                }
                                setViolations(violations.map(v => 
                                  v.id === editingViolationId 
                                    ? { 
                                        ...v, 
                                        paymentDueDate: newViolation.paymentDueDate,
                                        ticket: newViolation.ticket,
                                        description: newViolation.description,
                                        currency: newViolation.currency,
                                        amount: newViolation.amount,
                                        violationType: newViolation.violationType,
                                        file: newViolation.file
                                      }
                                    : v
                                ));
                                setEditingViolationId(null);
                                if (validationErrors.violationType) {
                                  setValidationErrors({ ...validationErrors, violationType: '' });
                                }
                              } else {
                                // Add new violation - validate violation type is required
                                if (!newViolation.violationType || !newViolation.violationType.trim()) {
                                  setValidationErrors({ ...validationErrors, violationType: 'Type of Violation is required' });
                                  addNotification('error', 'Please select a Type of Violation');
                                  return;
                                }
                                
                                // Add new violation
                                const violationId = Date.now().toString();
                                setViolations([...violations, {
                                  id: violationId,
                                  paymentDueDate: newViolation.paymentDueDate,
                                  ticket: newViolation.ticket,
                                  description: newViolation.description,
                                  currency: newViolation.currency,
                                  amount: newViolation.amount,
                                  violationType: newViolation.violationType,
                                  file: newViolation.file
                                }]);
                                
                                // Clear validation error if it exists
                                if (validationErrors.violationType) {
                                  setValidationErrors({ ...validationErrors, violationType: '' });
                                }
                              }
                              setNewViolation({
                                paymentDueDate: '',
                                ticket: '',
                                description: '',
                                currency: 'CAD',
                                amount: '',
                                violationType: '',
                                file: null
                              });
                              setViolationFile(null);
                            }}
                            className="px-4 py-2 bg-black !text-white rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            {editingViolationId ? 'Update' : 'Add'} Violation
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Violations Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type of Violation</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ticket</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Currency</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">File</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {violations.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                No Data
                              </td>
                            </tr>
                          ) : (
                            violations.map((violation) => (
                              <tr key={violation.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                                    {violation.violationType || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {violation.ticket || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {violation.description || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {violation.currency || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {violation.amount ? new Intl.NumberFormat('en-CA', {
                                    style: 'currency',
                                    currency: violation.currency || 'CAD',
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }).format(parseFloat(violation.amount)) : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {(violation.file instanceof File || violation.fileUrl || violation.fileName) ? (
                                    violation.fileUrl ? (
                                      <a
                                        href={violation.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                                        title={violation.file instanceof File ? violation.file.name : (violation.fileName || 'View File')}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span className="text-xs">{violation.fileName || 'View File'}</span>
                                      </a>
                                    ) : (
                                      <span className="flex items-center gap-1 text-gray-600" title={violation.file instanceof File ? violation.file.name : (violation.fileName || 'File attached')}>
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs">{violation.file instanceof File ? violation.file.name : (violation.fileName || 'File attached')}</span>
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Load violation data into form for editing
                                        setNewViolation({
                                          paymentDueDate: violation.paymentDueDate || '',
                                          ticket: violation.ticket || '',
                                          description: violation.description || '',
                                          currency: violation.currency || 'CAD',
                                          amount: violation.amount || '',
                                          violationType: violation.violationType || '',
                                          file: violation.file || null
                                        });
                                        setEditingViolationId(violation.id);
                                        if (violation.file instanceof File) {
                                          setViolationFile(violation.file);
                                        } else {
                                          setViolationFile(null);
                                        }
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Edit violation"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this violation?')) {
                                          try {
                                            // Check if it's an existing violation (ID starts with "existing-")
                                            if (violation.id && violation.id.toString().startsWith('existing-')) {
                                              const actualId = violation.id.toString().replace('existing-', '');
                                              const response = await deleteViolation(actualId);
                                              if (response?.success) {
                                                addNotification('success', 'Violation deleted successfully!');
                                              } else {
                                                addNotification('error', response?.message || 'Failed to delete violation');
                                              }
                                            }
                                            // Remove from local state
                                            setViolations(violations.filter(v => v.id !== violation.id));
                                            // Clear editing state if this was the violation being edited
                                            if (editingViolationId === violation.id) {
                                              setEditingViolationId(null);
                                              setNewViolation({
                                                paymentDueDate: '',
                                                ticket: '',
                                                description: '',
                                                currency: 'CAD',
                                                violationType: '',
                                                file: null
                                              });
                                              setViolationFile(null);
                                            }
                                          } catch (error: any) {
                                            console.error('Error deleting violation:', error);
                                            addNotification('error', error.response?.data?.message || error.message || 'Failed to delete violation');
                                          }
                                        }
                                      }}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Delete violation"
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
                          <option value="Safety">Safety</option>
                          <option value="Attitude">Attitude</option>
                          <option value="Ops">Ops</option>
                          <option value="General">General</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            if (newNote.note) {
                              if (editingNoteId) {
                                // Update existing note in the list
                                setNotes(notes.map(n => 
                                  n.id === editingNoteId 
                                    ? {
                                        ...n,
                                        note: newNote.note,
                                        category: newNote.category
                                      }
                                    : n
                                ));
                                setEditingNoteId(null);
                              } else {
                                // Add new note
                                setNotes([...notes, {
                                  id: Date.now().toString(),
                                  note: newNote.note,
                                  category: newNote.category
                                }]);
                              }
                              setNewNote({
                                note: '',
                                category: ''
                              });
                            }
                          }}
                          className="w-10 h-10 bg-black !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                        >
                          {editingNoteId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
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
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setNewNote({
                                        note: note.note,
                                        category: note.category
                                      });
                                      setEditingNoteId(note.id);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit note"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to delete this note?')) {
                                        setNotes(notes.filter(n => n.id !== note.id));
                                        if (editingNoteId === note.id) {
                                          setEditingNoteId(null);
                                          setNewNote({
                                            note: '',
                                            category: ''
                                          });
                                        }
                                      }
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete note"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
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
                              if (editingDeductionId) {
                                // Update existing deduction in the list
                                setDeductions(deductions.map(d => 
                                  d.id === editingDeductionId 
                                    ? {
                                        ...d,
                                        startDate: newDeduction.startDate,
                                        description: newDeduction.description,
                                        amount: newDeduction.amount,
                                        interval: newDeduction.interval,
                                        currency: newDeduction.currency
                                      }
                                    : d
                                ));
                                setEditingDeductionId(null);
                              } else {
                                // Add new deduction
                                setDeductions([...deductions, {
                                  id: Date.now().toString(),
                                  startDate: newDeduction.startDate,
                                  description: newDeduction.description,
                                  amount: newDeduction.amount,
                                  interval: newDeduction.interval,
                                  currency: newDeduction.currency
                                }]);
                              }
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
                          {editingDeductionId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {deductions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNewDeduction({
                                          startDate: deduction.startDate || '',
                                          description: deduction.description || '',
                                          amount: deduction.amount || '0',
                                          interval: deduction.interval || '',
                                          currency: deduction.currency || 'CAD'
                                        });
                                        setEditingDeductionId(deduction.id);
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Edit deduction"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this deduction?')) {
                                          try {
                                            // Check if it's an existing deduction (ID starts with "existing-")
                                            if (deduction.id && deduction.id.toString().startsWith('existing-')) {
                                              const actualId = deduction.id.toString().replace('existing-', '');
                                              const response = await deleteDeductionAddition(actualId);
                                              if (response?.success) {
                                                addNotification('success', 'Deduction deleted successfully!');
                                              } else {
                                                addNotification('error', response?.message || 'Failed to delete deduction');
                                              }
                                            }
                                            // Remove from local state
                                            setDeductions(deductions.filter(d => d.id !== deduction.id));
                                            // Clear editing state if this was the deduction being edited
                                            if (editingDeductionId === deduction.id) {
                                              setEditingDeductionId(null);
                                              setNewDeduction({
                                                startDate: '',
                                                description: '',
                                                amount: '0',
                                                interval: '',
                                                currency: 'CAD'
                                              });
                                            }
                                          } catch (error: any) {
                                            console.error('Error deleting deduction:', error);
                                            addNotification('error', error.response?.data?.message || error.message || 'Failed to delete deduction');
                                          }
                                        }
                                      }}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Delete deduction"
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
                              if (editingAdditionId) {
                                // Update existing addition in the list
                                setAdditions(additions.map(a => 
                                  a.id === editingAdditionId 
                                    ? {
                                        ...a,
                                        startDate: newAddition.startDate,
                                        description: newAddition.description,
                                        amount: newAddition.amount,
                                        interval: newAddition.interval,
                                        currency: newAddition.currency
                                      }
                                    : a
                                ));
                                setEditingAdditionId(null);
                              } else {
                                // Add new addition
                                setAdditions([...additions, {
                                  id: Date.now().toString(),
                                  startDate: newAddition.startDate,
                                  description: newAddition.description,
                                  amount: newAddition.amount,
                                  interval: newAddition.interval,
                                  currency: newAddition.currency
                                }]);
                              }
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
                          {editingAdditionId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {additions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNewAddition({
                                          startDate: addition.startDate || '',
                                          description: addition.description || '',
                                          amount: addition.amount || '0',
                                          interval: addition.interval || '',
                                          currency: addition.currency || 'CAD'
                                        });
                                        setEditingAdditionId(addition.id);
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Edit addition"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this addition?')) {
                                          try {
                                            // Check if it's an existing addition (ID starts with "existing-")
                                            if (addition.id && addition.id.toString().startsWith('existing-')) {
                                              const actualId = addition.id.toString().replace('existing-', '');
                                              const response = await deleteDeductionAddition(actualId);
                                              if (response?.success) {
                                                addNotification('success', 'Addition deleted successfully!');
                                              } else {
                                                addNotification('error', response?.message || 'Failed to delete addition');
                                              }
                                            }
                                            // Remove from local state
                                            setAdditions(additions.filter(a => a.id !== addition.id));
                                            // Clear editing state if this was the addition being edited
                                            if (editingAdditionId === addition.id) {
                                              setEditingAdditionId(null);
                                              setNewAddition({
                                                startDate: '',
                                                description: '',
                                                amount: '0',
                                                interval: '',
                                                currency: 'CAD'
                                              });
                                            }
                                          } catch (error: any) {
                                            console.error('Error deleting addition:', error);
                                            addNotification('error', error.response?.data?.message || error.message || 'Failed to delete addition');
                                          }
                                        }
                                      }}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Delete addition"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Driver</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this driver? This will permanently remove the driver and all associated data.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm({ show: false, driverId: null })}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteDriver}
                  className="px-4 py-2 bg-red-600 !text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Certification Confirmation Modal */}
      {confirmDeleteCertification.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Certification</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the certification <span className="font-medium text-gray-900">{confirmDeleteCertification.cert?.title || 'this item'}</span>? This will permanently remove the certification and all associated data.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmDeleteCertification({ open: false, cert: null })}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteCertification}
                  className="px-4 py-2 bg-red-600 !text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[10002] flex flex-col gap-2">
        {notifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </div>
  );
};

export default DriverManagement;
