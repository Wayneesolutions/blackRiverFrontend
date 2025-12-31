import { useState, useEffect, useRef } from 'react';
import { Plus, Info, ChevronUp, ChevronDown, X, User, FileText, Calendar, Upload, Edit, Trash2, Save } from 'lucide-react';
import * as employeeApi from '../../../../axios/api/employee';
import { getDocumentsByEmployee, createEmployeeDocument, updateEmployeeDocument, deleteEmployeeDocument } from '../../../../axios/api/employeeDocument';

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
    vacationPay: '',
    department: '',
    jobType: '',
    jobTime: 'FULL-TIME' as 'FULL-TIME' | 'PART-TIME',
    phone: '+1',
    searchAddress: '',
    address: '',
    hireDate: '',
    terminationDate: ''
  });

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
    if (!basicData.firstName || !basicData.lastName || !basicData.email) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Basic data
      formData.append('name', `${basicData.firstName} ${basicData.lastName}`);
      formData.append('email', basicData.email);
      if (basicData.password) formData.append('password', basicData.password);
      formData.append('status', basicData.status.toLowerCase());
      if (basicData.role) formData.append('role', basicData.role);
      
      // Personal data
      if (personalData.phone) formData.append('phone', personalData.phone);
      if (personalData.address) formData.append('address', personalData.address);
      if (personalData.hireDate) formData.append('hireDate', personalData.hireDate);
      if (personalData.terminationDate) formData.append('termDate', personalData.terminationDate);
      
      // Profile image
      if (profileImage) {
        formData.append('file', profileImage);
      }

      // Log documents before sending
      const newDocuments = documents.filter(doc => !doc.isExisting && doc.file);
      console.log('📄 Total documents in form:', documents.length);
      console.log('📄 New documents to upload:', newDocuments.length);
      console.log('📄 Existing documents (not uploading):', documents.filter(doc => doc.isExisting).length);
      
      if (newDocuments.length > 0) {
        newDocuments.forEach((doc, index) => {
          console.log(`  📎 Document ${index + 1}:`, {
            description: doc.description || doc.documentType || 'No description',
            expiryDate: doc.expiryDate || 'No expiry date',
            fileName: doc.file?.name || 'No file',
            fileSize: doc.file?.size || 0,
            ignoreExpiration: doc.ignoreExpiration
          });
        });
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
        
        // Save new documents (only those that are not existing)
        if (employeeId && newDocuments.length > 0) {
          console.log(`📤 Starting upload of ${newDocuments.length} document(s) for employee ${employeeId}`);
          
          try {
            const documentPromises = newDocuments.map(async (doc, index) => {
              try {
                console.log(`  📤 Preparing document ${index + 1}/${newDocuments.length}: ${doc.description || doc.file?.name || 'Untitled'}`);
                
                const docFormData = new FormData();
                docFormData.append('employee', employeeId);
                docFormData.append('documentType', doc.documentType || 'Other');
                docFormData.append('status', 'valid');
                if (doc.expiryDate) docFormData.append('expiryDate', doc.expiryDate);
                if (doc.description) docFormData.append('description', doc.description);
                if (doc.ignoreExpiration) docFormData.append('ignoreExpiration', 'true');
                if (doc.file) {
                  docFormData.append('documentFile', doc.file);
                  console.log(`    📎 File: ${doc.file.name} (${(doc.file.size / 1024).toFixed(2)} KB)`);
                }

                console.log(`  🚀 Uploading document ${index + 1}/${newDocuments.length}...`);
                const docResponse = await createEmployeeDocument(docFormData);
                console.log(`  ✅ Document ${index + 1} uploaded successfully:`, docResponse?.data?._id || 'ID received');
                return docResponse;
              } catch (docError: any) {
                console.error(`  ❌ Error uploading document ${index + 1}:`, docError?.response?.data || docError?.message || docError);
                throw docError;
              }
            });

            const results = await Promise.all(documentPromises);
            console.log(`✅ All ${newDocuments.length} document(s) uploaded successfully for employee ${employeeId}`);
            console.log('📊 Document upload results:', results.map((r, i) => ({ index: i + 1, success: r?.success, id: r?.data?._id })));
          } catch (docError: any) {
            console.error('❌ Error uploading documents:', docError);
            console.error('❌ Error details:', docError?.response?.data || docError?.message);
            alert('Employee saved but some documents failed to upload. Please add them manually.');
          }
        } else if (employeeId && documents.length > 0 && newDocuments.length === 0) {
          console.log('ℹ️ No new documents to upload (all documents are existing)');
        } else if (!employeeId) {
          console.warn('⚠️ No employeeId available, cannot upload documents');
        } else {
          console.log('ℹ️ No documents to upload');
        }

        alert(`Employee ${editingId ? 'updated' : 'created'} successfully!`);
        setShowNewEmployeeModal(false);
        resetForm();
        fetchEmployees();
      } else {
        alert(response?.message || `Failed to ${editingId ? 'update' : 'create'} employee`);
      }
    } catch (error: any) {
      console.error(`Error ${editingId ? 'updating' : 'creating'} employee:`, error);
      alert(error.response?.data?.message || error.message || `Failed to ${editingId ? 'update' : 'create'} employee`);
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
      vacationPay: '',
      department: '',
      jobType: '',
      jobTime: 'FULL-TIME',
      phone: '+1',
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
        const nameParts = (emp.name || '').split(' ');
        setBasicData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: emp.email || '',
          password: '', // Don't pre-fill password
          status: emp.status || 'active',
          role: emp.role || ''
        });
        setPersonalData({
          title: '',
          payType: '',
          vacationPay: '',
          department: '',
          jobType: '',
          jobTime: 'FULL-TIME',
          phone: emp.phone || '+1',
          searchAddress: '',
          address: emp.location?.address || '',
          hireDate: emp.joinDate ? new Date(emp.joinDate).toISOString().split('T')[0] : '',
          terminationDate: emp.details?.termDate ? new Date(emp.details.termDate).toISOString().split('T')[0] : ''
        });
        if (emp.profileImageUrl) {
          setProfileImagePreview(emp.profileImageUrl);
        }

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

  const handleDelete = async (id: string) => {
    try {
      const response = await employeeApi.deleteEmployee(id);
      if (response?.success) {
        alert('Employee deleted successfully!');
        fetchEmployees();
      } else {
        alert(response?.message || 'Failed to delete employee');
      }
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      alert(error.response?.data?.message || error.message || 'Failed to delete employee');
    }
  };

  return (
    <div className="min-h-screen bg-[#EDF8FF] p-6">
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
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-[#42aeec] border-b-2 border-[#42aeec] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('nonSignin')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'nonSignin'
                  ? 'text-[#42aeec] border-b-2 border-[#42aeec] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Non Signin Employees
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'advanced'
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
                    <tr key={employee._id || index} className="hover:bg-gray-50 transition-colors">
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
                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                          (employee.status === 'ACTIVE' || employee.status === 'active')
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (employee._id) {
                                setEditingId(employee._id);
                                // Load employee data for editing
                                loadEmployeeForEdit(employee._id);
                              }
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Employee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (employee._id && window.confirm('Are you sure you want to delete this employee?')) {
                                handleDelete(employee._id);
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
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {activeFormTab === 'basic' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
                    
                    {/* First Row */}
                    <div className="grid grid-cols-4 gap-4">
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          placeholder="Password"
                          value={basicData.password}
                          onChange={(e) => setBasicData({ ...basicData, password: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
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
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                    
                    <div className="grid grid-cols-4 gap-4">
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
                          <option value="Salary">Salary</option>
                          <option value="Commission">Commission</option>
                        </select>
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
                    </div>

                    <div className="grid grid-cols-4 gap-4">
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
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                              personalData.jobTime === 'FULL-TIME'
                                ? 'bg-gray-700 !text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            FULL-TIME
                          </button>
                          <button
                            type="button"
                            onClick={() => setPersonalData({ ...personalData, jobTime: 'PART-TIME' })}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                              personalData.jobTime === 'PART-TIME'
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">us +1</span>
                          <input
                            type="tel"
                            value={personalData.phone}
                            onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Address</label>
                        <input
                          type="text"
                          placeholder="Search For An Address..."
                          value={personalData.searchAddress}
                          onChange={(e) => setPersonalData({ ...personalData, searchAddress: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-2">
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

                    <div className="grid grid-cols-4 gap-4">
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
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Documents</h3>
                    
                    {/* Document Input Row */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">EXPIRY DATE</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">DESCRIPTION</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">SELECT FILE</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">IGNORE EXPIRATION</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Input Row */}
                          <tr className="bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="relative">
                                <input
                                  type="date"
                                  value={newDocument.expiryDate}
                                  onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                placeholder="Description"
                                value={newDocument.description}
                                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
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
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                              >
                                <Upload className="w-4 h-4" />
                                Select File
                              </button>
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
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                      <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                        No Data
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
                  <div className="space-y-6">
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
