import { useState } from 'react';
import { Plus, Download, Trash2, ChevronUp, ChevronDown, X, HelpCircle } from 'lucide-react';

interface Customer {
  name: string;
  type: 'Customer' | 'Shipper-Receiver';
  address: string;
  city: string;
  lastLoadDate?: string;
}

// Static customer data
const staticCustomers: Customer[] = [
  { name: 'Sunrise Produce', type: 'Shipper-Receiver', address: '5125 HONDURAS AVE', city: 'LLEN', lastLoadDate: '12/17/2025' },
  { name: 'Sun Processing Ltd.', type: 'Shipper-Receiver', address: '19068 36 AVENUE', city: 'REY', lastLoadDate: '12/18/2025' },
  { name: 'Fresh Ver S.A.P.I. De C.V.', type: 'Shipper-Receiver', address: '901 E. PRODUCE RD.', city: 'HIDALGO', lastLoadDate: '12/23/2025' },
  { name: 'Star Produce Ltd.', type: 'Customer', address: '2941 PORTAGE AVE', city: 'SASKATOON' },
  { name: 'EV PRODUCE INTERNATIONAL INC', type: 'Shipper-Receiver', address: '4409 WANDA AVENUE SUITE K', city: 'MCALLEN', lastLoadDate: '12/11/2025' },
  { name: 'Star Produce Ltd.', type: 'Customer', address: '2941 PORTAGE AVE.', city: 'SASKATOON' },
  { name: 'Galaxy Processing Ltd.', type: 'Shipper-Receiver', address: '123 MAIN ST', city: 'TORONTO', lastLoadDate: '12/20/2025' },
  { name: 'RIO BRAVO', type: 'Shipper-Receiver', address: '456 OAK AVE', city: 'MONTREAL', lastLoadDate: '12/15/2025' },
  { name: 'SOBEYS CAMPBELL 52', type: 'Customer', address: '789 ELM ST', city: 'VANCOUVER' },
  { name: 'TMG Logistics Inc.', type: 'Shipper-Receiver', address: '321 PINE RD', city: 'CALGARY', lastLoadDate: '12/22/2025' },
  { name: 'Winnipeg Crossdock & Logistics', type: 'Shipper-Receiver', address: '654 MAPLE DR', city: 'WINNIPEG', lastLoadDate: '12/19/2025' },
  { name: 'Sandhu Farms', type: 'Customer', address: '987 CEDAR LN', city: 'EDMONTON' },
  { name: 'KEYSTONE COLD STORAGE', type: 'Shipper-Receiver', address: '147 BIRCH WAY', city: 'OTTAWA', lastLoadDate: '12/21/2025' },
  { name: 'BES COGRAIN', type: 'Shipper-Receiver', address: '258 SPRUCE ST', city: 'QUEBEC', lastLoadDate: '12/16/2025' },
  { name: 'PRIMAK INTL C/O', type: 'Shipper-Receiver', address: '369 FIR AVE', city: 'HALIFAX', lastLoadDate: '12/14/2025' },
  { name: 'Shoreline Transfer', type: 'Customer', address: '741 WILLOW BLVD', city: 'VICTORIA' }
];

const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerIdSearch, setCustomerIdSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });
  const [deletedCustomers, setDeletedCustomers] = useState<Set<string>>(new Set());

  // Modal state
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [customerType, setCustomerType] = useState<'CUSTOMER' | 'SHIPPER AND RECEIVER'>('CUSTOMER');
  const [showBatchBilling, setShowBatchBilling] = useState(false);
  const [billingType, setBillingType] = useState<'DEFAULT / LOAD' | 'BATCH WEEKLY' | 'BATCH MONTHLY'>('DEFAULT / LOAD');

  // Form state
  const [formData, setFormData] = useState({
    customer: '',
    customerId: '',
    emailAddress: '',
    secondaryEmail: '',
    trackingEmail: '',
    taxId: '',
    assignedSalesperson: '',
    primaryPhone: '+1',
    secondaryPhone: '+1',
    contact: '',
    searchAddress: '',
    address: '',
    city: '',
    unit: '',
    stateProvince: '',
    country: '',
    zipCode: '',
    creditLimit: '',
    invoiceNet: '30',
    defaultQuickPayDiscount: '',
    useFactoringCompany: false,
    csaFastApproved: false,
    softBlock: false,
    hardBlock: false,
    presetNotes: '',
    defaultDropType: ''
  });

  // Filter customers based on search and filters
  const getFilteredCustomers = () => {
    let filtered = [...staticCustomers].filter(customer => !deletedCustomers.has(customer.name));

    // Filter by general search (Customer, Phone #, Email, Address)
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by customer ID search
    if (customerIdSearch) {
      // For now, just filter by name as we don't have customer IDs
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(customerIdSearch.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== 'All') {
      filtered = filtered.filter(customer => customer.type === typeFilter);
    }

    // Sort
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key!] ?? '';
        const bValue = b[sortConfig.key!] ?? '';
        
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

  const filteredCustomers = getFilteredCustomers();

  const handleSort = (key: keyof Customer) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof Customer) => {
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

  const handleDelete = (customerName: string) => {
    setDeletedCustomers(prev => new Set(prev).add(customerName));
  };

  return (
    <div className="min-h-screen bg-[#EDF8FF] p-6">
      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-700">({filteredCustomers.length})</span>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <Download className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setShowNewCustomerModal(true)}
                className="w-10 h-10 bg-[#42aeec] !text-white rounded-lg flex items-center justify-center hover:bg-[#1db5f5] transition-colors shadow-md"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          {/* First Row - General Search and Customer ID Search */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Search:</label>
              <input
                type="text"
                placeholder="Customer, Phone #, Email, Address"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
              />
             
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-[250px]">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Search:</label>
              <input
                type="text"
                placeholder="Customer ID"
                value={customerIdSearch}
                onChange={(e) => setCustomerIdSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
              />
            
            </div>
          </div>

          {/* Second Row - Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="All">All</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
              >
                <option value="All">All</option>
                <option value="Customer">Customer</option>
                <option value="Shipper-Receiver">Shipper-Receiver</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  if (e.target.value) {
                    handleSort(e.target.value as keyof Customer);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="name">Customer</option>
                <option value="type">Type</option>
                <option value="address">Address</option>
                <option value="city">City</option>
                <option value="lastLoadDate">Last Load Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Customer
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-2">
                      Type
                      {getSortIcon('type')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('address')}
                  >
                    <div className="flex items-center gap-2">
                      Address
                      {getSortIcon('address')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('city')}
                  >
                    <div className="flex items-center gap-2">
                      City
                      {getSortIcon('city')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastLoadDate')}
                  >
                    <div className="flex items-center gap-2">
                      Last Load Date
                      {getSortIcon('lastLoadDate')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => {
                    const isDeleted = deletedCustomers.has(customer.name);
                    return (
                    <tr 
                      key={index} 
                      className={`hover:bg-gray-50 transition-colors ${
                        isDeleted ? 'bg-red-100' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">{customer.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{customer.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{customer.address}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{customer.city}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{customer.lastLoadDate || '-'}</td>
                      <td className="px-4 py-3">
                        {isDeleted ? (
                          <button
                            onClick={() => handleDelete(customer.name)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(customer.name)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewCustomerModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {customerType === 'CUSTOMER' ? 'New Customer' : 'New Shipper Receiver'}
              </h2>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Basic Tab Bar */}
            <div className="bg-[#0ea3d8] px-6 py-3">
              <span className="text-white font-medium">Basic</span>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Basic Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
                    
                    {/* Customer Type Toggle */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomerType('CUSTOMER')}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                            customerType === 'CUSTOMER'
                              ? 'bg-gray-200 text-gray-700'
                              : 'bg-[#0ea3d8] !text-white hover:bg-[#1db5f5]'
                          }`}
                        >
                          CUSTOMER
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerType('SHIPPER AND RECEIVER')}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                            customerType === 'SHIPPER AND RECEIVER'
                              ? 'bg-gray-200 text-gray-700'
                              : 'bg-[#0ea3d8] !text-white hover:bg-[#1db5f5]'
                          }`}
                        >
                          SHIPPER AND RECEIVER
                        </button>
                      </div>
                      <button 
                        onClick={() => setShowBatchBilling(!showBatchBilling)}
                        className="mt-2 text-sm text-[#42aeec] hover:underline"
                      >
                        {showBatchBilling ? 'Hide Batch Billing' : 'Show Batch Billing'}
                      </button>
                    </div>

                    {/* Billing Configuration - Shown when Show Batch Billing is clicked */}
                    {showBatchBilling && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Billing Configuration</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setBillingType('DEFAULT / LOAD')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                              billingType === 'DEFAULT / LOAD'
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-[#0ea3d8] !text-white hover:bg-[#1db5f5]'
                            }`}
                          >
                            DEFAULT / LOAD
                          </button>
                          <button
                            type="button"
                            onClick={() => setBillingType('BATCH WEEKLY')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                              billingType === 'BATCH WEEKLY'
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-[#0ea3d8] !text-white hover:bg-[#1db5f5]'
                            }`}
                          >
                            BATCH WEEKLY
                          </button>
                          <button
                            type="button"
                            onClick={() => setBillingType('BATCH MONTHLY')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                              billingType === 'BATCH MONTHLY'
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-[#0ea3d8] !text-white hover:bg-[#1db5f5]'
                            }`}
                          >
                            BATCH MONTHLY
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Customer */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Customer"
                        value={formData.customer}
                        onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder=""
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>

                    {/* Customer ID */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
                      <input
                        type="text"
                        placeholder="E.G., CUST001, ABC123"
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>

                    {/* Email Address */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={formData.emailAddress}
                        onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>

                    {/* Secondary Email */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Email</label>
                      <input
                        type="email"
                        placeholder="Secondary Email"
                        value={formData.secondaryEmail}
                        onChange={(e) => setFormData({ ...formData, secondaryEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>

                    {/* Tracking Email */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Email</label>
                      <input
                        type="email"
                        placeholder="Email For Tracking Up"
                        value={formData.trackingEmail}
                        onChange={(e) => setFormData({ ...formData, trackingEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>

                    {/* Tax ID */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                      <input
                        type="text"
                        placeholder="Tax ID Or Business Nu"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>

                    {/* Assigned Salesperson */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Salesperson</label>
                      <select
                        value={formData.assignedSalesperson}
                        onChange={(e) => setFormData({ ...formData, assignedSalesperson: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      >
                        <option value="">Select Salesperson</option>
                        <option value="salesperson1">Salesperson 1</option>
                        <option value="salesperson2">Salesperson 2</option>
                      </select>
                    </div>

                    {/* Primary Phone # */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Phone #<span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">us +1</span>
                        <input
                          type="tel"
                          value={formData.primaryPhone}
                          onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Secondary Phone # */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Phone #</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">us +1</span>
                        <input
                          type="tel"
                          value={formData.secondaryPhone}
                          onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                      <input
                        type="text"
                        placeholder="Contact"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Address and Additional Sections */}
                <div className="space-y-6">
                  {/* Address Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Address</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search Address</label>
                      <input
                        type="text"
                        placeholder="Search For An Address..."
                        value={formData.searchAddress}
                        onChange={(e) => setFormData({ ...formData, searchAddress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <input
                        type="text"
                        placeholder="Unit"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.stateProvince}
                        onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      >
                        <option value="">Select</option>
                        <option value="ON">Ontario</option>
                        <option value="BC">British Columbia</option>
                        <option value="AB">Alberta</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country<span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      >
                        <option value="">Country</option>
                        <option value="CA">Canada</option>
                        <option value="US">United States</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        placeholder="ZIP Code"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Finance Section - Only for CUSTOMER type */}
                  {customerType === 'CUSTOMER' && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Finance</h3>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                        <input
                          type="text"
                          placeholder="Credit Limit"
                          value={formData.creditLimit}
                          onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Net</label>
                        <input
                          type="text"
                          value={formData.invoiceNet}
                          onChange={(e) => setFormData({ ...formData, invoiceNet: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Default Quick Pay Discount (%)</label>
                        <input
                          type="text"
                          placeholder="Default Quick Pay Discount (%)"
                          value={formData.defaultQuickPayDiscount}
                          onChange={(e) => setFormData({ ...formData, defaultQuickPayDiscount: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Settings Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      {customerType === 'CUSTOMER' ? 'Additional Settings' : 'Additional Settings'}
                    </h3>
                    
                    {customerType === 'CUSTOMER' && (
                      <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.useFactoringCompany}
                            onChange={(e) => setFormData({ ...formData, useFactoringCompany: e.target.checked })}
                            className="w-4 h-4 text-[#42aeec] border-gray-300 rounded focus:ring-[#42aeec]"
                          />
                          <span className="text-sm text-gray-700">Use Factoring Company</span>
                        </label>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.csaFastApproved}
                          onChange={(e) => setFormData({ ...formData, csaFastApproved: e.target.checked })}
                          className="w-4 h-4 text-[#42aeec] border-gray-300 rounded focus:ring-[#42aeec]"
                        />
                        <span className="text-sm text-gray-700">CSA/FAST Approved</span>
                      </label>
                    </div>

                    {customerType === 'SHIPPER AND RECEIVER' && (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preset Notes
                            <HelpCircle className="w-4 h-4 inline-block ml-1 text-gray-400" />
                          </label>
                          <textarea
                            value={formData.presetNotes}
                            onChange={(e) => setFormData({ ...formData, presetNotes: e.target.value })}
                            placeholder="Enter preset notes..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent resize-none"
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Default Drop Type
                            <HelpCircle className="w-4 h-4 inline-block ml-1 text-gray-400" />
                          </label>
                          <select
                            value={formData.defaultDropType}
                            onChange={(e) => setFormData({ ...formData, defaultDropType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="live">Live</option>
                            <option value="drop">Drop</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.softBlock}
                          onChange={(e) => setFormData({ ...formData, softBlock: e.target.checked })}
                          className="w-4 h-4 text-[#42aeec] border-gray-300 rounded focus:ring-[#42aeec]"
                        />
                        <span className="text-sm text-gray-700">
                          Soft Block
                          <HelpCircle className="w-4 h-4 inline-block ml-1 text-gray-400" />
                        </span>
                      </label>
                    </div>

                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hardBlock}
                          onChange={(e) => setFormData({ ...formData, hardBlock: e.target.checked })}
                          className="w-4 h-4 text-[#42aeec] border-gray-300 rounded focus:ring-[#42aeec]"
                        />
                        <span className="text-sm text-gray-700">
                          Hard Block
                          <HelpCircle className="w-4 h-4 inline-block ml-1 text-gray-400" />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Save Button */}
            <div className="bg-[#0ea3d8] px-6 py-4 flex justify-center">
              <button className="px-8 py-2 bg-[#42aeec] !text-white rounded-lg hover:bg-[#1db5f5] transition-colors font-medium">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;

