import { useState, useEffect, useRef } from 'react';
import { Edit, Trash2, Plus, X, RefreshCw, AlertCircle, User, Search, Eye, CheckCircle, FileText, Briefcase, Phone, Globe, MapPin, CreditCard, Heart, Building2, DollarSign, Snowflake, Thermometer, Upload, ChevronLeft, ChevronRight, Save, Filter, ArrowUpDown } from 'lucide-react';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import * as driverApi from '../../../../axios/api/driver';
import { getDocumentsByEmployee, createEmployeeDocument, getSignedEmployeeDocumentUrl } from '../../../../axios/api/employeeDocument';
import type { EmployeeDocument } from '../../../../axios/api/employeeDocument';

// Type definitions
interface Driver {
  _id: string;
  internalId: string;
  name: string;
  email: string;
  phone: string;
  mobile?: string;
  licenseNumber?: string;
  company?: string;
  gender?: string;
  csa?: string;
  status: string;
  address?: string;
  citizenship?: string;
  country?: string;
  employmentDetails?: string;
  wsib?: string;
  fastCard?: string;
  medicalTracking?: string;
  profileImageUrl?: string | null;
  lastModified?: string;
  role?: string;
  joinDate?: string;
  dob?: string | Date;
  documents?: EmployeeDocument[];
}

interface DriverFormData {
  name: string;
  email: string;
  gender: string;
  company: string;
  employmentDetails: string;
  internalId: string;
  joinDate: string;
  dob: string;
  phone: string;
  mobile: string;
  licenseNumber: string;
  citizenship: string;
  country: string;
  address: string;
  wsib: string;
  fastCard: string;
  medicalTracking: string;
  csa: string;
  file: File | null;
  password: string;
  role: string;
  status: string;
  policies?: string;
  // Salary per mile fields
  salaryPerMile?: string;
  salaryPerMileSnow?: string;
  salaryPerMileHighTemp?: string;
  highTempThreshold?: string;
}

interface DriverDocumentForm {
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  description: string;
  status: string;
  file: File | null;
  _id?: string; // For existing documents
}


const DriverManagement = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; driverId: string | null }>({ show: false, driverId: null });
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [driverDocuments, setDriverDocuments] = useState<DriverDocumentForm[]>([]);

  const [showDocumentsModal, setShowDocumentsModal] = useState<{ show: boolean; driver: Driver | null }>({ show: false, driver: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  
  // Refs for scrollbar synchronization
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    email: '',
    gender: '',
    company: '', // Keep in interface but not used in form
    employmentDetails: '',
    internalId: '',
    joinDate: '',
    dob: '',
    phone: '',
    mobile: '',
    licenseNumber: '',
    citizenship: '',
    country: '',
    address: '',
    wsib: '',
    fastCard: '',
    medicalTracking: '',
    csa: '',
    file: null,
    password: '',
    role: 'driver',
    status: 'active',
    policies: '', // Added missing policies field
    // Salary per mile fields
    salaryPerMile: '',
    salaryPerMileSnow: '',
    salaryPerMileHighTemp: '',
    highTempThreshold: '35'
  });

  // Citizenship options for dropdown
  const citizenshipOptions = [
    'United States',
    'Canada',
    'Mexico',
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'India',
    'China',
    'Brazil',
    'Other'
  ];

  useEffect(() => {
    fetchDrivers();
  }, []);

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
  }, [drivers, loading]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverApi.getAllDrivers(1, 100, searchTerm);
      if (response.success && Array.isArray(response.data)) {
        // Transform backend response to match frontend Driver interface
        const transformedDrivers = await Promise.all(
          response.data.map(async (driver: any) => {
            // Ensure profileImageUrl is properly preserved and decoded if needed
            const profileImageUrl = driver.profileImageUrl
              ? (typeof driver.profileImageUrl === 'string' ? driver.profileImageUrl.trim() : null)
              : null;

            // Fetch documents for each driver
            let documents: EmployeeDocument[] = [];
            try {
              const docsResponse = await getDocumentsByEmployee(driver._id);
              if (docsResponse.success && Array.isArray(docsResponse.data)) {
                documents = docsResponse.data;
              }
            } catch (err) {
              console.error(`Error fetching documents for driver ${driver._id}:`, err);
            }

            // Transform driver data to ensure all fields are properly mapped
            // Backend should already provide transformed data, but we ensure all fields exist
            return {
              _id: driver._id,
              internalId: driver.internalId || '',
              name: driver.name || '',
              email: driver.email || '',
              phone: driver.phone || '',
              mobile: driver.mobile || driver.details?.cell1 || '',
              licenseNumber: driver.licenseNumber || driver.details?.licenseNumber || '',
              company: driver.company || (typeof driver.company === 'object' ? driver.company?.companyName : '') || '-',
              gender: driver.gender || driver.details?.gender || '',
              csa: driver.csa || (driver.details?.csa ? 'Yes' : (driver.details?.csa === false ? 'No' : '')) || 'N/A',
              status: driver.status || 'active',
              address: driver.address || driver.location?.address || '',
              citizenship: driver.citizenship || driver.details?.citizenship || '',
              country: driver.country || '',
              employmentDetails: driver.employmentDetails || driver.details?.remark || '',
              wsib: driver.wsib || (driver.details?.wsib ? 'Yes' : (driver.details?.wsib === false ? 'No' : '')),
              fastCard: driver.fastCard || driver.details?.fastCardNo || '',
              medicalTracking: driver.medicalTracking || (driver.details?.medicalRequired ? 'Yes' : (driver.details?.medicalRequired === false ? 'No' : '')),
              profileImageUrl: profileImageUrl || null,
              role: driver.role || 'driver',
              joinDate: driver.joinDate || '',
              policies: driver.policies || '',
              lastModified: driver.updatedAt ? new Date(driver.updatedAt).toLocaleDateString() : undefined,
              createdAt: driver.createdAt,
              updatedAt: driver.updatedAt,
              documents
            };
          })
        );
        setDrivers(transformedDrivers);
      } else {
        setError(response.message || 'Failed to fetch drivers');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      gender: '',
      company: '', // Keep in interface but not used in form
      employmentDetails: '',
      internalId: '',
      joinDate: '',
      phone: '',
      mobile: '',
      licenseNumber: '',
      citizenship: '',
      country: '',
      address: '',
      wsib: '',
      fastCard: '',
      medicalTracking: '',
      csa: '',
      file: null,
      password: '',
      role: 'driver',
      status: 'active',
      policies: '',
      // Salary per mile fields
      salaryPerMile: '',
      salaryPerMileSnow: '',
      salaryPerMileHighTemp: '',
      highTempThreshold: '35'
    });
    setDriverDocuments([]);
    setCurrentStep(1);
    setIsSubmitting(false);
  };

  // Static driver document types
  const DRIVER_DOCUMENT_TYPES = [
    'Commercial Driver\'s License (CDL)',
    'Medical Certificate (DOT Physical)',
    'Drug Test Results',
    'Alcohol Test Results',
    'Background Check',
    'Driving Record (MVR)',
    'Insurance Certificate',
    'DOT Physical Card',
    'CDL Training Certificate',
    'Defensive Driving Certificate',
    'Hazmat Endorsement',
    'Tanker Endorsement',
    'Doubles/Triples Endorsement',
    'Passenger Endorsement',
    'School Bus Endorsement',
    'Vehicle Inspection Certification',
    'Safety Training Certificate',
    'Hours of Service (HOS) Records',
    'Employment Contract',
    'Emergency Contact Form',
    'Road Test Certificate',
    'TSA Security Clearance',
    'Other'
  ];

  const addDocument = () => {
    setDriverDocuments([...driverDocuments, {
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
    setDriverDocuments(driverDocuments.filter((_, i) => i !== index));
  };

  const updateDocument = (index: number, field: keyof DriverDocumentForm, value: any) => {
    const updated = [...driverDocuments];
    updated[index] = { ...updated[index], [field]: value };
    setDriverDocuments(updated);
  };

  const handleDocumentFileChange = (index: number, file: File | null) => {
    updateDocument(index, 'file', file);
  };

  const handleCreate = async () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.name || !formData.email || !formData.phone) {
        alert('Please fill in all required fields (Name, Email, Phone)');
        return;
      }
      // Move to step 2
      setCurrentStep(2);
      return;
    }

    // Step 2 - Create driver
    if (!formData.password) {
      alert('Password is required for new drivers');
      return;
    }

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();

      // Append all form fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('role', formData.role || 'driver');
      formDataToSend.append('status', formData.status || 'active');

      if (formData.country) formDataToSend.append('country', formData.country);
      // Always send policies (required field, can be empty string)
      formDataToSend.append('policies', formData.policies || '');
      if (formData.internalId) formDataToSend.append('internalId', formData.internalId);
      if (formData.joinDate) formDataToSend.append('joinDate', formData.joinDate);
      if (formData.dob) formDataToSend.append('dob', formData.dob);
      if (formData.gender) formDataToSend.append('gender', formData.gender);
      if (formData.employmentDetails) formDataToSend.append('employmentDetails', formData.employmentDetails);
      if (formData.mobile) formDataToSend.append('mobile', formData.mobile);
      if (formData.licenseNumber) formDataToSend.append('licenseNumber', formData.licenseNumber);
      if (formData.citizenship) formDataToSend.append('citizenship', formData.citizenship);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.wsib) formDataToSend.append('wsib', formData.wsib);
      if (formData.fastCard) formDataToSend.append('fastCard', formData.fastCard);
      if (formData.medicalTracking) formDataToSend.append('medicalTracking', formData.medicalTracking);
      if (formData.csa) formDataToSend.append('csa', formData.csa);

      // Append salary per mile fields
      if (formData.salaryPerMile) formDataToSend.append('salaryPerMile', formData.salaryPerMile);
      if (formData.salaryPerMileSnow) formDataToSend.append('salaryPerMileSnow', formData.salaryPerMileSnow);
      if (formData.salaryPerMileHighTemp) formDataToSend.append('salaryPerMileHighTemp', formData.salaryPerMileHighTemp);
      if (formData.highTempThreshold) formDataToSend.append('highTempThreshold', formData.highTempThreshold);

      // Append file if exists
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      console.log('📤 Sending driver data:', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        hasPassword: !!formData.password,
        policies: formData.policies || '(empty)'
      });

      const response = await driverApi.createDriver(formDataToSend);
      console.log('📥 Driver creation response:', response);
      
      if (response.success) {
        const driverId = response.data?._id || response.data?.id;

        // Upload documents if any
        if (driverId && driverDocuments.length > 0) {
          try {
            for (const doc of driverDocuments) {
              if (doc.file && doc.documentType) {
                const docFormData = new FormData();
                docFormData.append('employee', driverId);
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
            alert('Driver created but some documents failed to upload. Please add them manually.');
          }
        }

        await fetchDrivers();
        resetForm();
        setShowSidebar(false);
        alert('Driver created successfully!');
      } else {
        alert(response.message || 'Failed to create driver');
      }
    } catch (error: any) {
      console.error('Error creating driver:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create driver';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (driver: Driver) => {
    try {
      setLoading(true);
      // Fetch full driver details from API
      const response = await driverApi.getDriverById(driver._id);
      if (response.success && response.data) {
        const driverData = response.data;
        setEditingId(driver._id);

        // Properly map fields from backend response (which may have details/location nested objects)
        setFormData({
          name: driverData.name || '',
          email: driverData.email || '',
          gender: driverData.gender || driverData.details?.gender || '',
          company: '', // Not used in form, auto-assigned by backend
          employmentDetails: driverData.employmentDetails || driverData.details?.remark || '',
          internalId: driverData.internalId || '',
          joinDate: driverData.joinDate ? new Date(driverData.joinDate).toISOString().split('T')[0] : '',
          dob: driverData.dob ? new Date(driverData.dob).toISOString().split('T')[0] : (driverData.details?.dateOfBirth ? new Date(driverData.details.dateOfBirth).toISOString().split('T')[0] : ''),
          phone: driverData.phone || '',
          mobile: driverData.mobile || driverData.details?.cell1 || '',
          licenseNumber: driverData.licenseNumber || driverData.details?.licenseNumber || '',
          citizenship: driverData.citizenship || driverData.details?.citizenship || '',
          country: driverData.country || '',
          address: driverData.address || driverData.location?.address || '',
          wsib: driverData.wsib || (driverData.details?.wsib === true ? 'Yes' : (driverData.details?.wsib === false ? 'No' : '')),
          fastCard: driverData.fastCard || driverData.details?.fastCardNo || '',
          medicalTracking: driverData.medicalTracking || (driverData.details?.medicalRequired === true ? 'Yes' : (driverData.details?.medicalRequired === false ? 'No' : '')),
          csa: driverData.csa || (driverData.details?.csa === true ? 'Yes' : (driverData.details?.csa === false ? 'No' : '')),
          file: null,
          password: '', // Don't pre-fill password
          role: driverData.role || 'driver',
          status: driverData.status || 'active',
          policies: driverData.policies || '',
          // Salary per mile fields
          salaryPerMile: driverData.details?.salaryPerMile?.toString() || driverData.salaryPerMile?.toString() || '',
          salaryPerMileSnow: driverData.details?.salaryPerMileSnow?.toString() || driverData.salaryPerMileSnow?.toString() || '',
          salaryPerMileHighTemp: driverData.details?.salaryPerMileHighTemp?.toString() || driverData.salaryPerMileHighTemp?.toString() || '',
          highTempThreshold: driverData.details?.highTempThreshold?.toString() || driverData.highTempThreshold?.toString() || '35'
        });

        // Fetch existing documents
        try {
          const docsResponse = await getDocumentsByEmployee(driver._id);
          if (docsResponse.success && Array.isArray(docsResponse.data)) {

            // Convert existing documents to form format for editing
            const formDocs = docsResponse.data.map((doc: EmployeeDocument) => ({
              documentType: doc.documentType,
              documentNumber: doc.documentNumber || '',
              issueDate: doc.issueDate ? new Date(doc.issueDate).toISOString().split('T')[0] : '',
              expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : '',
              description: doc.description || '',
              status: doc.status,
              file: null,
              _id: doc._id // Keep track of existing document ID
            }));
            setDriverDocuments(formDocs);
          }
        } catch (docError) {
          console.error('Error fetching documents:', docError);

          setDriverDocuments([]);
        }

        setCurrentStep(1);
        setShowSidebar(true);
      } else {
        // Fallback to using driver object directly if API fails
        setEditingId(driver._id);
        setFormData({
          name: driver.name || '',
          email: driver.email || '',
          gender: driver.gender || '',
          company: '',
          employmentDetails: driver.employmentDetails || '',
          internalId: driver.internalId || '',
          joinDate: driver.joinDate ? new Date(driver.joinDate).toISOString().split('T')[0] : '',
        dob: driver.dob ? new Date(driver.dob).toISOString().split('T')[0] : (driver.details?.dateOfBirth ? new Date(driver.details.dateOfBirth).toISOString().split('T')[0] : ''),
          dob: driver.dob ? new Date(driver.dob).toISOString().split('T')[0] : (driver.details?.dateOfBirth ? new Date(driver.details.dateOfBirth).toISOString().split('T')[0] : ''),
          phone: driver.phone || '',
          mobile: driver.mobile || '',
          licenseNumber: driver.licenseNumber || '',
          citizenship: driver.citizenship || '',
          country: driver.country || '',
          address: driver.address || '',
          wsib: driver.wsib || '',
          fastCard: driver.fastCard || '',
          medicalTracking: driver.medicalTracking || '',
          csa: driver.csa || '',
          file: null,
          password: '',
          role: driver.role || 'driver',
          status: driver.status || 'active',
          policies: ''
        });

        // Use documents from driver object if available
        if (driver.documents && Array.isArray(driver.documents)) {

          const formDocs = driver.documents.map((doc: EmployeeDocument) => ({
            documentType: doc.documentType,
            documentNumber: doc.documentNumber || '',
            issueDate: doc.issueDate ? new Date(doc.issueDate).toISOString().split('T')[0] : '',
            expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : '',
            description: doc.description || '',
            status: doc.status,
            file: null,
            _id: doc._id
          }));
          setDriverDocuments(formDocs);
        }

        setCurrentStep(1);
        setShowSidebar(true);
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
      // Fallback to using driver object directly
      setEditingId(driver._id);
      setFormData({
        name: driver.name || '',
        email: driver.email || '',
        gender: driver.gender || '',
        company: '',
        employmentDetails: driver.employmentDetails || '',
        internalId: driver.internalId || '',
        joinDate: driver.joinDate ? new Date(driver.joinDate).toISOString().split('T')[0] : '',
        dob: driver.dob ? new Date(driver.dob).toISOString().split('T')[0] : (driver.details?.dateOfBirth ? new Date(driver.details.dateOfBirth).toISOString().split('T')[0] : ''),
        phone: driver.phone || '',
        mobile: driver.mobile || '',
        licenseNumber: driver.licenseNumber || '',
        citizenship: driver.citizenship || '',
        country: driver.country || '',
        address: driver.address || '',
        wsib: driver.wsib || '',
        fastCard: driver.fastCard || '',
        medicalTracking: driver.medicalTracking || '',
        csa: driver.csa || '',
        file: null,
        password: '',
        role: driver.role || 'driver',
        status: driver.status || 'active',
        policies: ''
      });

      if (driver.documents && Array.isArray(driver.documents)) {

        const formDocs = driver.documents.map((doc: EmployeeDocument) => ({
          documentType: doc.documentType,
          documentNumber: doc.documentNumber || '',
          issueDate: doc.issueDate ? new Date(doc.issueDate).toISOString().split('T')[0] : '',
          expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : '',
          description: doc.description || '',
          status: doc.status,
          file: null,
          _id: doc._id
        }));
        setDriverDocuments(formDocs);
      }

      setCurrentStep(1);
      setShowSidebar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    if (currentStep === 1) {
      // Move to step 2
      setCurrentStep(2);
      return;
    }

    try {
      const formDataToSend = new FormData();

      // Append all form fields (password is optional for update)
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('role', formData.role || 'driver');
      formDataToSend.append('status', formData.status || 'active');

      if (formData.password) formDataToSend.append('password', formData.password);
      if (formData.country) formDataToSend.append('country', formData.country);
      // Always send policies (required field, can be empty string)
      formDataToSend.append('policies', formData.policies || '');
      if (formData.internalId) formDataToSend.append('internalId', formData.internalId);
      if (formData.joinDate) formDataToSend.append('joinDate', formData.joinDate);
      if (formData.dob) formDataToSend.append('dob', formData.dob);
      if (formData.gender) formDataToSend.append('gender', formData.gender);
      if (formData.employmentDetails) formDataToSend.append('employmentDetails', formData.employmentDetails);
      if (formData.mobile) formDataToSend.append('mobile', formData.mobile);
      if (formData.licenseNumber) formDataToSend.append('licenseNumber', formData.licenseNumber);
      if (formData.citizenship) formDataToSend.append('citizenship', formData.citizenship);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.wsib) formDataToSend.append('wsib', formData.wsib);
      if (formData.fastCard) formDataToSend.append('fastCard', formData.fastCard);
      if (formData.medicalTracking) formDataToSend.append('medicalTracking', formData.medicalTracking);
      if (formData.csa) formDataToSend.append('csa', formData.csa);

      // Append salary per mile fields
      if (formData.salaryPerMile !== undefined) formDataToSend.append('salaryPerMile', formData.salaryPerMile);
      if (formData.salaryPerMileSnow !== undefined) formDataToSend.append('salaryPerMileSnow', formData.salaryPerMileSnow);
      if (formData.salaryPerMileHighTemp !== undefined) formDataToSend.append('salaryPerMileHighTemp', formData.salaryPerMileHighTemp);
      if (formData.highTempThreshold !== undefined) formDataToSend.append('highTempThreshold', formData.highTempThreshold);

      // Append file if exists
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      const response = await driverApi.updateDriver(editingId, formDataToSend);
      if (response.success) {
        // Handle documents - update existing or create new
        if (driverDocuments.length > 0) {
          try {
            for (const doc of driverDocuments) {
              if (doc.file && doc.documentType) {
                const docFormData = new FormData();
                docFormData.append('employee', editingId);
                docFormData.append('documentType', doc.documentType);
                docFormData.append('status', doc.status || 'valid');
                if (doc.documentNumber) docFormData.append('documentNumber', doc.documentNumber);
                if (doc.issueDate) docFormData.append('issueDate', doc.issueDate);
                if (doc.expiryDate) docFormData.append('expiryDate', doc.expiryDate);
                if (doc.description) docFormData.append('description', doc.description);
                docFormData.append('documentFile', doc.file);

                // If it's an existing document, update it; otherwise create new
                if (doc._id) {
                  // Update existing document
                  const { updateEmployeeDocument } = await import('../../../../axios/api/employeeDocument');
                  await updateEmployeeDocument(doc._id, docFormData);
                } else {
                  // Create new document
                  await createEmployeeDocument(docFormData);
                }
              } else if (doc._id && doc.documentType) {
                // Update existing document without file change
                const { updateEmployeeDocument } = await import('../../../../axios/api/employeeDocument');
                const docFormData = new FormData();
                docFormData.append('employee', editingId);
                docFormData.append('documentType', doc.documentType);
                docFormData.append('status', doc.status || 'valid');
                if (doc.documentNumber) docFormData.append('documentNumber', doc.documentNumber);
                if (doc.issueDate) docFormData.append('issueDate', doc.issueDate);
                if (doc.expiryDate) docFormData.append('expiryDate', doc.expiryDate);
                if (doc.description) docFormData.append('description', doc.description);
                await updateEmployeeDocument(doc._id, docFormData);
              }
            }
          } catch (docError) {
            console.error('Error updating documents:', docError);
            alert('Driver updated but some documents failed to update. Please check them manually.');
          }
        }

        await fetchDrivers();
        setEditingId(null);
        resetForm();
        setShowSidebar(false);
        alert('Driver updated successfully!');
      } else {
        alert(response.message || 'Failed to update driver');
      }
    } catch (error: any) {
      console.error('Error updating driver:', error);
      alert(error.response?.data?.message || error.message || 'Failed to update driver');
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
        await fetchDrivers();
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
        await fetchDrivers();
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
      // Ensure policies is always a string, not undefined
      if (name === 'policies' && !updated.policies) {
        updated.policies = '';
      }
      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  // Filter and sort drivers locally
  const getFilteredAndSortedDrivers = () => {
    let filtered = [...drivers];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(driver =>
        driver.name?.toLowerCase().includes(query) ||
        driver.internalId?.toLowerCase().includes(query) ||
        driver.email?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(driver => driver.status === selectedStatus);
    }
    
    // Apply sorting
    if (sortBy && sortOrder) {
      filtered.sort((a, b) => {
        let aVal: any = '';
        let bVal: any = '';
        
        if (sortBy === 'name') {
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
        }
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
      });
    }
    
    return filtered;
  };
  
  const filteredDrivers = getFilteredAndSortedDrivers();

  return (
    <div className="flex h-screen bg-[#EDF8FF] overflow-hidden">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'mr-96' : ''} overflow-hidden`}>
        {/* Header */}
        <div className="px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your drivers and their information</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchDrivers}
                disabled={loading}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingId(null);
                  setCurrentStep(1);
                  setShowSidebar(true);
                }}
                style={{ backgroundColor: FLEET_COLORS.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = FLEET_COLORS.dark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = FLEET_COLORS.primary}
                className="!text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={20} />
                Add Driver
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    borderColor: '#d1d5db'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = FLEET_COLORS.primary;
                    e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '';
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none"
                />
              </div>
              
              {/* Status Dropdown */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    borderColor: '#d1d5db'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = FLEET_COLORS.primary;
                    e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '';
                  }}
                  className="px-4 py-2 border rounded-lg focus:outline-none appearance-none pr-10 cursor-pointer bg-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
              
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy && sortOrder ? `${sortBy}-${sortOrder}` : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setSortBy('');
                      setSortOrder('');
                    } else {
                      const [field, order] = value.split('-');
                      setSortBy(field);
                      setSortOrder(order);
                    }
                  }}
                  style={{
                    borderColor: '#d1d5db'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = FLEET_COLORS.primary;
                    e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = '';
                  }}
                  className="px-4 py-2 border rounded-lg focus:outline-none appearance-none pr-10 cursor-pointer bg-white"
                >
                  <option value="">Sort by Name</option>
                  <option value="name-asc">Name: A-Z</option>
                  <option value="name-desc">Name: Z-A</option>
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 p-6">
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
              <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1000px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CSA</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile/Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center text-gray-500">
                          <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                          Loading drivers...
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-red-500">
                        <div className="flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          {error}
                        </div>
                      </td>
                    </tr>
                  ) : filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                        No drivers found
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <tr 
                        key={driver._id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowDriverDetails(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="font-mono text-sm px-2 py-1 rounded"
                            style={{
                              backgroundColor: `${FLEET_COLORS.primary}15`,
                              color: FLEET_COLORS.dark
                            }}
                          >
                            {driver.internalId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {driver.profileImageUrl && !imageErrors.has(driver._id) ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={driver.profileImageUrl}
                                  alt={driver.name || 'Driver'}
                                  onError={() => {
                                    // Mark this image as failed to load
                                    setImageErrors(prev => new Set(prev).add(driver._id));
                                  }}
                                />
                              ) : (
                                <div
                                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                                  style={{ background: FLEET_COLORS.gradientVertical }}
                                >
                                  {driver.name?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                              <div className="text-sm text-gray-500">{driver.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.company || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.gender || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${driver.csa === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {driver.csa || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatus(driver._id, driver.status);
                            }}
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${driver.status === 'active'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                          >
                            {driver.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{driver.address || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.licenseNumber || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{driver.mobile || '-'}</div>
                          <div className="text-xs text-gray-500">{driver.phone || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {driver.documents?.length || 0}
                            </span>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Refresh documents when opening modal to ensure we have latest data
                                try {
                                  const docsResponse = await getDocumentsByEmployee(driver._id);
                                  if (docsResponse.success && Array.isArray(docsResponse.data)) {
                                    const driverWithUpdatedDocs = {
                                      ...driver,
                                      documents: docsResponse.data
                                    };
                                    setShowDocumentsModal({ show: true, driver: driverWithUpdatedDocs });
                                  } else {
                                    setShowDocumentsModal({ show: true, driver });
                                  }
                                } catch (err) {
                                  console.error(`Error fetching documents for driver ${driver._id}:`, err);
                                  setShowDocumentsModal({ show: true, driver });
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                              title="View Documents"
                              disabled={!driver.documents || driver.documents.length === 0}
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                          {driver.documents && driver.documents.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {driver.documents.filter(d => d.status === 'valid').length} valid
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.lastModified || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(driver);
                              }}
                              style={{ color: FLEET_COLORS.primary }}
                              onMouseEnter={(e) => e.currentTarget.style.color = FLEET_COLORS.dark}
                              onMouseLeave={(e) => e.currentTarget.style.color = FLEET_COLORS.primary}
                              className="transition-colors"
                              title="Edit Driver"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(driver._id);
                              }}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete Driver"
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

      {/* Sidebar Form */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={(e) => {
            // Only close if clicking directly on the backdrop, not on sidebar content
            if (e.target === e.currentTarget) {
              setShowSidebar(false);
              setEditingId(null);
              resetForm();
            }
          }}
        >
          <div
            className="fixed right-0 top-0 h-full  w-156 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div
              className="px-6 py-4 flex justify-between items-center"
              style={{ background: FLEET_COLORS.gradient }}
            >
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit Driver' : 'Create New Driver'}
              </h2>
              <button
                onClick={() => {
                  setShowSidebar(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="!text-white hover:opacity-80 p-1 rounded transition-opacity"
              >
                <X size={24} />
              </button>
            </div>

            {/* Step Indicator */}
            {!editingId ? (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-600' : '!text-white'}`}>
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
                          background:
                            'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
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
                          background:
                            'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                        }
                        : undefined
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentStep === 2
                      ? '!text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    Documents ({driverDocuments.length})
                  </button>
                </div>

              </div>
            )}

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {(currentStep === 2) ? (
                /* Step 2: Documents Upload */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 font-semibold" style={{ color: FLEET_COLORS.primary }}>
                      <FileText size={18} />
                      <span>Driver Documents</span>
                    </div>
                    <button
                      onClick={addDocument}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Document
                    </button>
                  </div>

                  {driverDocuments.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">No documents added yet</p>
                      <p className="text-sm text-gray-500 mb-4">Click "Add Document" to upload driver documents</p>
                      <button
                        onClick={addDocument}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Add First Document
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {driverDocuments.map((doc, index) => (
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
                                style={{ borderColor: '#d1d5db' }}
                              >
                                <option value="">Select Document Type</option>
                                {DRIVER_DOCUMENT_TYPES.map((type) => (
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
                                  placeholder="e.g., CDL-123456"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  style={{ borderColor: '#d1d5db' }}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                  value={doc.status}
                                  onChange={(e) => updateDocument(index, 'status', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  style={{ borderColor: '#d1d5db' }}
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
                                  style={{ borderColor: '#d1d5db' }}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                <input
                                  type="date"
                                  value={doc.expiryDate}
                                  onChange={(e) => updateDocument(index, 'expiryDate', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  style={{ borderColor: '#d1d5db' }}
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
                                style={{ borderColor: '#d1d5db' }}
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
                                style={{ borderColor: '#d1d5db' }}
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
                /* Step 1: Driver Information */
                <>
                  {/* Personal Info Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold pb-2 border-b border-gray-200" style={{ color: FLEET_COLORS.primary }}>
                      <User size={18} />
                      <span>Personal Info</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter driver name"
                        required
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        placeholder="Enter license number"
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Employment Details Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold pb-2 border-b border-gray-200" style={{ color: FLEET_COLORS.primary }}>
                      <Briefcase size={18} />
                      <span>Employment Details</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Internal ID</label>
                      <input
                        type="text"
                        name="internalId"
                        value={formData.internalId}
                        onChange={handleInputChange}
                        placeholder="e.g., DRV-001 (auto-generated if empty)"
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                      <input
                        type="date"
                        name="joinDate"
                        value={formData.joinDate}
                        onChange={handleInputChange}
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Details</label>
                      <textarea
                        name="employmentDetails"
                        value={formData.employmentDetails}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Employment history, position, etc."
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Policies</label>
                      <textarea
                        name="policies"
                        value={formData.policies || ''}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Company policies, terms, etc."
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold pb-2 border-b border-gray-200" style={{ color: FLEET_COLORS.primary }}>
                      <Phone size={18} />
                      <span>Contact Information</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="driver@example.com"
                        required
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1-555-0123"
                        required
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        placeholder="+1-555-0124"
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>

                    {!editingId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Enter password"
                          required={!editingId}
                          style={{ borderColor: '#d1d5db' }}
                          onFocus={(e) => {
                            e.target.style.borderColor = FLEET_COLORS.primary;
                            e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.boxShadow = '';
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                        />
                      </div>
                    )}

                    {editingId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password <span className="text-gray-400 text-xs">(leave blank to keep current)</span>
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Enter new password (optional)"
                          style={{ borderColor: '#d1d5db' }}
                          onFocus={(e) => {
                            e.target.style.borderColor = FLEET_COLORS.primary;
                            e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.boxShadow = '';
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Citizenship Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold pb-2 border-b border-gray-200" style={{ color: FLEET_COLORS.primary }}>
                      <Globe size={18} />
                      <span>Citizenship</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Citizenship</label>
                      <select
                        name="citizenship"
                        value={formData.citizenship}
                        onChange={handleInputChange}
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      >
                        <option value="">Select Citizenship</option>
                        {citizenshipOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="e.g., Canada"
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold pb-2 border-b border-gray-200" style={{ color: FLEET_COLORS.primary }}>
                      <MapPin size={18} />
                      <span>Address</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Street address, city, province, postal code"
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* WSIB Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold pb-2 border-b border-gray-200" style={{ color: FLEET_COLORS.primary }}>
                      <FileText size={18} />
                      <span>WSIB</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WSIB Number</label>
                      <input
                        type="text"
                        name="wsib"
                        value={formData.wsib}
                        onChange={handleInputChange}
                        placeholder="WSIB-12345"
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* FAST Card Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold pb-2 border-b border-gray-200" style={{ color: FLEET_COLORS.primary }}>
                      <CreditCard size={18} />
                      <span>FAST Card</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">FAST Card Number</label>
                      <input
                        type="text"
                        name="fastCard"
                        value={formData.fastCard}
                        onChange={handleInputChange}
                        placeholder="FAST-67890"
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Medical Tracking Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold pb-2 border-b border-gray-200" style={{ color: FLEET_COLORS.primary }}>
                      <Heart size={18} />
                      <span>Medical Tracking</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medical Information</label>
                      <textarea
                        name="medicalTracking"
                        value={formData.medicalTracking}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Medical certification dates, expiry, restrictions, etc."
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* CSA Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold pb-2 border-b border-gray-200" style={{ color: FLEET_COLORS.primary }}>
                      <Building2 size={18} />
                      <span>CSA</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CSA Status</label>
                      <select
                        name="csa"
                        value={formData.csa}
                        onChange={handleInputChange}
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      >
                        <option value="">Select CSA Status</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  {/* Salary Per Mile Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold pb-2 border-b border-gray-200" style={{ color: FLEET_COLORS.primary }}>
                      <DollarSign size={18} />
                      <span>Salary Per Mile</span>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-700">
                        <strong>Note:</strong> These rates are used to calculate driver salary based on miles driven and weather conditions during trips.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Salary Per Mile ($)
                      </label>
                      <input
                        type="number"
                        name="salaryPerMile"
                        value={formData.salaryPerMile}
                        onChange={handleInputChange}
                        placeholder="e.g., 0.50"
                        step="0.01"
                        min="0"
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Base rate per mile for all trips</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Snowflake size={16} className="text-blue-500" />
                        Snow Condition Premium Per Mile ($)
                      </label>
                      <input
                        type="number"
                        name="salaryPerMileSnow"
                        value={formData.salaryPerMileSnow}
                        onChange={handleInputChange}
                        placeholder="e.g., 0.25"
                        step="0.01"
                        min="0"
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Additional premium per mile for trips in snow conditions</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Thermometer size={16} className="text-red-500" />
                        High Temperature Premium Per Mile ($)
                      </label>
                      <input
                        type="number"
                        name="salaryPerMileHighTemp"
                        value={formData.salaryPerMileHighTemp}
                        onChange={handleInputChange}
                        placeholder="e.g., 0.30"
                        step="0.01"
                        min="0"
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Additional premium per mile for trips in high temperature conditions</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        High Temperature Threshold (°C)
                      </label>
                      <input
                        type="number"
                        name="highTempThreshold"
                        value={formData.highTempThreshold}
                        onChange={handleInputChange}
                        placeholder="35"
                        step="1"
                        min="0"
                        style={{ borderColor: '#d1d5db' }}
                        onFocus={(e) => {
                          e.target.style.borderColor = FLEET_COLORS.primary;
                          e.target.style.boxShadow = `0 0 0 2px ${FLEET_COLORS.focusRing}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = '';
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Temperature threshold in Celsius (default: 35°C) above which high temperature premium applies</p>
                    </div>
                  </div>

                  {/* Driver Profile Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-semibold pb-2 border-b border-gray-200" style={{ color: FLEET_COLORS.primary }}>
                      <Upload size={18} />
                      <span>Driver Profile Upload</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                      <div className="mt-1">
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                            id="profile-upload"
                          />
                          <div
                            className="px-4 py-2 border rounded-lg text-sm font-semibold text-center transition-colors"
                            style={{
                              borderColor: FLEET_COLORS.primary,
                              color: FLEET_COLORS.primary,
                              backgroundColor: `${FLEET_COLORS.primary}08`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}15`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}08`;
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById('profile-upload')?.click();
                            }}
                          >
                            {formData.file ? formData.file.name : 'Choose File'}
                          </div>
                        </label>
                      </div>
                      {formData.file && (
                        <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#10b981' }}>
                          <span>✓</span> File selected: {formData.file.name}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex gap-3">
                {!editingId && currentStep === 2 ? (
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
                      style={{ backgroundColor: isSubmitting ? '#9CA3AF' : FLEET_COLORS.primary }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.backgroundColor = FLEET_COLORS.dark;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.backgroundColor = FLEET_COLORS.primary;
                        }
                      }}
                      className="flex-1 !text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Save size={18} />
                      {isSubmitting ? 'Creating...' : 'Create Driver'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowSidebar(false);
                        setEditingId(null);
                        resetForm();
                      }}
                      className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    {!editingId ? (
                      <button
                        onClick={handleCreate}
                        disabled={isSubmitting}
                        style={{ backgroundColor: isSubmitting ? '#9CA3AF' : FLEET_COLORS.primary }}
                        onMouseEnter={(e) => {
                          if (!isSubmitting) {
                            e.currentTarget.style.backgroundColor = FLEET_COLORS.dark;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSubmitting) {
                            e.currentTarget.style.backgroundColor = FLEET_COLORS.primary;
                          }
                        }}
                        className="flex-1 !text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight size={18} />
                      </button>
                    ) : (
                      <>
                        {currentStep === 1 ? (
                          <button
                            onClick={() => setCurrentStep(2)}
                            style={{ backgroundColor: FLEET_COLORS.primary }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = FLEET_COLORS.dark}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = FLEET_COLORS.primary}
                            className="flex-1 !text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm"
                          >
                            Next
                            <ChevronRight size={18} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setCurrentStep(1)}
                              className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                            >
                              <ChevronLeft size={18} />
                              Back
                            </button>
                            <button
                              onClick={handleUpdate}
                              style={{ backgroundColor: FLEET_COLORS.primary }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = FLEET_COLORS.dark}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = FLEET_COLORS.primary}
                              className="flex-1 !text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm"
                            >
                              <Save size={18} />
                              Update Driver
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
        </div>
      )}

      {/* Documents View Modal */}
      {showDocumentsModal.show && showDocumentsModal.driver && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Driver Documents</h2>
                <p className="text-sm text-gray-500 mt-1">{showDocumentsModal.driver.name} - {showDocumentsModal.driver.internalId}</p>
              </div>
              <button
                onClick={() => setShowDocumentsModal({ show: false, driver: null })}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {showDocumentsModal.driver.documents && showDocumentsModal.driver.documents.length > 0 ? (
                <div className="space-y-4">
                  {showDocumentsModal.driver.documents.map((doc: EmployeeDocument) => {
                    // Ensure document has required fields
                    if (!doc || !doc._id) return null;
                    return (
                      <div key={doc._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <FileText className="w-5 h-5 text-blue-500" />
                              <h3 className="font-semibold text-gray-900">{doc.documentType}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${doc.status === 'valid' ? 'bg-green-100 text-green-700' :
                                doc.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  doc.status === 'expired' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {doc.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                              {doc.documentNumber && (
                                <div>
                                  <span className="text-gray-500">Number:</span>
                                  <span className="ml-2 font-medium text-gray-900">{doc.documentNumber}</span>
                                </div>
                              )}
                              {doc.issueDate && (
                                <div>
                                  <span className="text-gray-500">Issue Date:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {new Date(doc.issueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {doc.expiryDate && (
                                <div>
                                  <span className="text-gray-500">Expiry Date:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {new Date(doc.expiryDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {doc.fileSize && (
                                <div>
                                  <span className="text-gray-500">File Size:</span>
                                  <span className="ml-2 font-medium text-gray-900">
                                    {(doc.fileSize / 1024).toFixed(2)} KB
                                  </span>
                                </div>
                              )}
                            </div>
                            {doc.description && (
                              <div className="mt-3 text-sm">
                                <span className="text-gray-500">Description:</span>
                                <p className="mt-1 text-gray-900">{doc.description}</p>
                              </div>
                            )}
                          </div>
                          {doc.fileUrl && (
                            <button
                              onClick={async () => {
                                try {
                                  // Get signed URL for S3 files
                                  const signedUrlResponse = await getSignedEmployeeDocumentUrl(doc._id, 'inline');
                                  if (signedUrlResponse.success && signedUrlResponse.url) {
                                    window.open(signedUrlResponse.url, '_blank');
                                  } else {
                                    // Fallback to direct URL if signed URL fails
                                    window.open(doc.fileUrl, '_blank');
                                  }
                                } catch (error) {
                                  console.error('Error getting signed URL:', error);
                                  // Fallback to direct URL on error
                                  window.open(doc.fileUrl, '_blank');
                                }
                              }}
                              className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Document"
                            >
                              <Eye size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No documents found</p>
                  <p className="text-sm text-gray-500 mt-2">This driver has no documents uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this driver? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, driverId: null })}
                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDriver}
                className="flex-1 bg-red-600 hover:bg-red-700 !text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Details Sidebar */}
      {showDriverDetails && selectedDriver && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => {
              setShowDriverDetails(false);
              setTimeout(() => setSelectedDriver(null), 300);
            }}
          ></div>

          {/* Sidebar Panel */}
          <div
            className={`fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 translate-x-0 ${showDocumentsModal.show ? 'backdrop-blur-sm opacity-50' : ''}`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Driver Details</h2>
                <button
                  onClick={() => {
                    setShowDriverDetails(false);
                    setTimeout(() => setSelectedDriver(null), 300);
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Driver Header */}
                <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] text-white p-6 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 flex-shrink-0">
                      {selectedDriver.profileImageUrl && !imageErrors.has(selectedDriver._id) ? (
                        <img
                          className="h-20 w-20 rounded-full object-cover border-4 border-white"
                          src={selectedDriver.profileImageUrl}
                          alt={selectedDriver.name || 'Driver'}
                          onError={() => {
                            setImageErrors(prev => new Set(prev).add(selectedDriver._id));
                          }}
                        />
                      ) : (
                        <div
                          className="h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white"
                          style={{ background: FLEET_COLORS.gradientVertical }}
                        >
                          {selectedDriver.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">{selectedDriver.name}</h3>
                      <p className="text-blue-100 text-sm flex items-center gap-2">
                        <User size={16} />
                        Driver ID: <span className="font-semibold">{selectedDriver.internalId}</span>
                      </p>
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mt-2 ${selectedDriver.status === "active"
                          ? "bg-emerald-500 text-white"
                          : "bg-red-500 text-white"
                          }`}
                      >
                        {selectedDriver.status === "active" ? (
                          <>
                            <CheckCircle size={16} />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Full Name</p>
                      <p className="font-medium text-gray-900">{selectedDriver.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-medium text-gray-900">{selectedDriver.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Gender</p>
                      <p className="font-medium text-gray-900">{selectedDriver.gender || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="font-medium text-gray-900">{selectedDriver.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Mobile</p>
                      <p className="font-medium text-gray-900">{selectedDriver.mobile || "—"}</p>
                    </div>
                    {selectedDriver.address && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                          <MapPin size={14} className="text-blue-600" />
                          Address
                        </p>
                        <p className="font-medium text-gray-900">{selectedDriver.address}</p>
                      </div>
                    )}
                    {selectedDriver.citizenship && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Citizenship</p>
                        <p className="font-medium text-gray-900">{selectedDriver.citizenship}</p>
                      </div>
                    )}
                    {selectedDriver.country && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Country</p>
                        <p className="font-medium text-gray-900">{selectedDriver.country}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                    <Briefcase size={20} className="text-blue-600" />
                    Professional Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDriver.company && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Company</p>
                        <p className="font-medium text-gray-900">{selectedDriver.company}</p>
                      </div>
                    )}
                    {selectedDriver.licenseNumber && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">License Number</p>
                        <p className="font-medium text-gray-900">{selectedDriver.licenseNumber}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">CSA Status</p>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${selectedDriver.csa === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {selectedDriver.csa || 'N/A'}
                      </span>
                    </div>
                    {selectedDriver.joinDate && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Join Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedDriver.joinDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {selectedDriver.employmentDetails && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Employment Details</p>
                        <p className="font-medium text-gray-900">{selectedDriver.employmentDetails}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                {(selectedDriver.wsib || selectedDriver.fastCard || selectedDriver.medicalTracking) && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDriver.wsib && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">WSIB</p>
                          <p className="font-medium text-gray-900">{selectedDriver.wsib}</p>
                        </div>
                      )}
                      {selectedDriver.fastCard && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Fast Card</p>
                          <p className="font-medium text-gray-900">{selectedDriver.fastCard}</p>
                        </div>
                      )}
                      {selectedDriver.medicalTracking && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Medical Tracking</p>
                          <p className="font-medium text-gray-900">{selectedDriver.medicalTracking}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documents Summary */}
                {selectedDriver.documents && selectedDriver.documents.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                      <FileText size={20} className="text-blue-600" />
                      Documents ({selectedDriver.documents.length})
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Valid Documents</span>
                        <span className="font-semibold text-green-700">
                          {selectedDriver.documents.filter(d => d.status === 'valid').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pending Documents</span>
                        <span className="font-semibold text-yellow-700">
                          {selectedDriver.documents.filter(d => d.status === 'pending').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Expired Documents</span>
                        <span className="font-semibold text-red-700">
                          {selectedDriver.documents.filter(d => d.status === 'expired').length}
                        </span>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const docsResponse = await getDocumentsByEmployee(selectedDriver._id);
                            if (docsResponse.success && Array.isArray(docsResponse.data)) {
                              const driverWithUpdatedDocs = {
                                ...selectedDriver,
                                documents: docsResponse.data
                              };
                              setShowDocumentsModal({ show: true, driver: driverWithUpdatedDocs });
                            } else {
                              setShowDocumentsModal({ show: true, driver: selectedDriver });
                            }
                          } catch (err) {
                            console.error(`Error fetching documents:`, err);
                            setShowDocumentsModal({ show: true, driver: selectedDriver });
                          }
                        }}
                        className="mt-4 w-full px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={18} />
                        View All Documents
                      </button>
                    </div>
                  </div>
                )}

                {/* Last Modified */}
                {selectedDriver.lastModified && (
                  <div className="text-sm text-gray-500 text-center pt-4 border-t border-gray-200">
                    Last Modified: {selectedDriver.lastModified}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                  <button
                    onClick={() => {
                      setShowDriverDetails(false);
                      setTimeout(() => setSelectedDriver(null), 300);
                    }}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(selectedDriver);
                      setShowDriverDetails(false);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#4A90E2] to-[#357ABD] !text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <Edit size={18} />
                    Edit Driver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DriverManagement;