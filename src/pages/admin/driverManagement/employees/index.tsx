import React, { useState } from 'react';
import { Plus, Search, Info, ChevronUp, ChevronDown, X, User, FileText, Calendar, Upload } from 'lucide-react';

interface Employee {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// Static employee data
const staticEmployees: Employee[] = [
  { firstName: 'Gary', lastName: 'Singh', email: 'garym@blackriverlogistics.com', role: 'Admin_hr', status: 'ACTIVE' },
  { firstName: 'Admin', lastName: 'K', email: 'engineering@kordovatek.com', role: 'Admin_hr', status: 'ACTIVE' },
  { firstName: 'Sahil', lastName: 'Dhiman', email: 'sahil_d@blackriverlogistics.com', role: 'Admin_hr', status: 'ACTIVE' },
  { firstName: 'Ramandeep', lastName: 'Kaur', email: 'ramandeep@blackriverlogistics.com', role: 'Custom', status: 'ACTIVE' },
  { firstName: 'Amandeep', lastName: 'Singh', email: 'a_singh@blackriverlogistics.com', role: 'Custom', status: 'ACTIVE' },
  { firstName: 'Chanpreet', lastName: 'Vidia', email: 'chanpreet_vidia@blackriverlogistics.com', role: 'Admin', status: 'ACTIVE' },
  { firstName: 'Sanjana', lastName: 'Bansal', email: 'sb@blackriverlogistics.com', role: 'Admin', status: 'ACTIVE' },
  { firstName: 'Simrandeep', lastName: 'Singh', email: 'singhsimrandeep143@gmail.com', role: 'Custom', status: 'ACTIVE' },
  { firstName: 'Kiranjit', lastName: 'Kaur', email: 'kiranjitkaur7478@gmail.com', role: 'Custom', status: 'ACTIVE' },
  { firstName: 'Khushdeep', lastName: 'Singh', email: 'khushdeepb3@gmail.com', role: 'Custom', status: 'ACTIVE' },
  { firstName: 'John', lastName: 'Doe', email: 'john.doe@blackriverlogistics.com', role: 'Dispatcher', status: 'ACTIVE' },
  { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@blackriverlogistics.com', role: 'HR', status: 'ACTIVE' },
  { firstName: 'Bob', lastName: 'Johnson', email: 'bob.johnson@blackriverlogistics.com', role: 'Fleet Maintenance Manager', status: 'ACTIVE' },
  { firstName: 'Alice', lastName: 'Williams', email: 'alice.williams@blackriverlogistics.com', role: 'Compliance Manager', status: 'ACTIVE' },
  { firstName: 'Charlie', lastName: 'Brown', email: 'charlie.brown@blackriverlogistics.com', role: 'Safety Officer', status: 'ACTIVE' }
];

// Current roles from the system
const roleBadges = [
  'DISPATCH',
  'HR',
  'FLEET MAINTENANCE MANAGER',
  'COMPLIANCE MANAGER',
  'SAFETY OFFICER',
  'REPORTER',
  'MAINTENANCE CREW (MECHANICS)'
];

const EmployeesPage = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'nonSignin' | 'advanced'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('Active');
  const [sortBy, setSortBy] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Employee | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });

  // Modal state
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'personal' | 'documents' | 'notes'>('basic');
  const [profileImage, setProfileImage] = useState<File | null>(null);

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
    expiryDate: string;
    description: string;
    file: File | null;
    ignoreExpiration: boolean;
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

  ];

  // Filter employees based on search and filter
  const getFilteredEmployees = () => {
    let filtered = [...staticEmployees];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterBy === 'Active') {
      filtered = filtered.filter(emp => emp.status === 'ACTIVE');
    } else if (filterBy === 'Inactive') {
      filtered = filtered.filter(emp => emp.status === 'INACTIVE');
    }

    // Sort
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

  const filteredEmployees = getFilteredEmployees();

  const handleSort = (key: keyof Employee) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof Employee) => {
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

  const getRoleDisplayName = (role: string) => {
    // Map current roles to display names
    const roleMap: { [key: string]: string } = {
      'Dispatcher': 'Dispatch',
      'HR': 'HR',
      'Fleet Maintenance Manager': 'Fleet Maintenance Manager',
      'Compliance Manager': 'Compliance Manager',
      'Safety Officer': 'Safety Officer',
      'Reporter': 'Reporter',
      'Maintenance Crew (Mechanics)': 'Maintenance Crew (Mechanics)'
    };
    return roleMap[role] || role;
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900">{employee.firstName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{employee.lastName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{employee.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{getRoleDisplayName(employee.role)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                          employee.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Non Signin Employees Tab Content */}
        {activeTab === 'nonSignin' && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600">Non Signin Employees content coming soon...</p>
          </div>
        )}

        {/* Advanced Permissions Tab Content */}
        {activeTab === 'advanced' && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600">Advanced Permissions content coming soon...</p>
          </div>
        )}
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
                  className="border-2 border-dashed border-gray-300 p-8 text-center mb-3 cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) setProfileImage(file);
                    };
                    input.click();
                  }}
                >
                  {profileImage ? (
                    <img src={URL.createObjectURL(profileImage)} alt="Profile" className="w-full h-full object-cover rounded" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Select Image</p>
                    </>
                  )}
                </div>
                <button className="w-full bg-black !text-white py-2 font-medium hover:bg-gray-800 transition-colors">
                  UPLOAD
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
                <h2 className="text-2xl font-bold text-gray-900">New Employee</h2>
                <div className="flex items-center gap-3">
                  <button className="px-6 py-2 bg-gray-600 !text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">
                    SAVE
                  </button>
                  <button
                    onClick={() => setShowNewEmployeeModal(false)}
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
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
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
                        <select
                          value={personalData.hireDate}
                          onChange={(e) => setPersonalData({ ...personalData, hireDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employment Termination Date</label>
                        <select
                          value={personalData.terminationDate}
                          onChange={(e) => setPersonalData({ ...personalData, terminationDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">Select</option>
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
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">IGNORE EXPIRATION</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {documents.map((doc) => (
                              <tr key={doc.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{doc.expiryDate || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{doc.description || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {doc.ignoreExpiration ? 'Yes' : 'No'}
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
