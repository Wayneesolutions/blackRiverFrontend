import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, X, Save, RefreshCw, AlertCircle, User, Phone, Upload, Search, Briefcase, MapPin, FileText, Heart, CreditCard, Globe, Building2 } from 'lucide-react';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import * as driverApi from '../../../../axios/api/driver';

// Type definitions
interface Driver {
  _id: string;
  internalId: string;
  name: string;
  email: string;
  phone: string;
  mobile?: string;
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
}

interface DriverFormData {
  name: string;
  email: string;
  gender: string;
  company: string;
  employmentDetails: string;
  internalId: string;
  joinDate: string;
  phone: string;
  mobile: string;
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
}


const DriverManagement = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; driverId: string | null }>({ show: false, driverId: null });
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    email: '',
    gender: '',
    company: '', // Keep in interface but not used in form
    employmentDetails: '',
    internalId: '',
    joinDate: '',
    phone: '',
    mobile: '',
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
    status: 'active'
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverApi.getAllDrivers(1, 100, searchTerm);
      if (response.success && Array.isArray(response.data)) {
        // Transform backend response to match frontend Driver interface
        const transformedDrivers = response.data.map((driver: any) => {
          // Ensure profileImageUrl is properly preserved and decoded if needed
          const profileImageUrl = driver.profileImageUrl 
            ? (typeof driver.profileImageUrl === 'string' ? driver.profileImageUrl.trim() : null)
            : null;
          
          return {
            ...driver,
            profileImageUrl: profileImageUrl || null,
            lastModified: driver.updatedAt ? new Date(driver.updatedAt).toLocaleDateString() : undefined
          };
        });
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
      policies: ''
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields (Name, Email, Phone)');
      return;
    }

    if (!formData.password) {
      alert('Password is required for new drivers');
      return;
    }

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
      if (formData.gender) formDataToSend.append('gender', formData.gender);
      if (formData.employmentDetails) formDataToSend.append('employmentDetails', formData.employmentDetails);
      if (formData.mobile) formDataToSend.append('mobile', formData.mobile);
      if (formData.citizenship) formDataToSend.append('citizenship', formData.citizenship);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.wsib) formDataToSend.append('wsib', formData.wsib);
      if (formData.fastCard) formDataToSend.append('fastCard', formData.fastCard);
      if (formData.medicalTracking) formDataToSend.append('medicalTracking', formData.medicalTracking);
      if (formData.csa) formDataToSend.append('csa', formData.csa);
      
      // Append file if exists
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      const response = await driverApi.createDriver(formDataToSend);
      if (response.success) {
        await fetchDrivers();
        resetForm();
        setShowSidebar(false);
        alert('Driver created successfully!');
      } else {
        alert(response.message || 'Failed to create driver');
      }
    } catch (error: any) {
      console.error('Error creating driver:', error);
      alert(error.response?.data?.message || error.message || 'Failed to create driver');
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
        setFormData({
          name: driverData.name || '',
          email: driverData.email || '',
          gender: driverData.gender || '',
          company: '', // Not used in form, auto-assigned by backend
          employmentDetails: driverData.employmentDetails || '',
          internalId: driverData.internalId || '',
          joinDate: driverData.joinDate ? new Date(driverData.joinDate).toISOString().split('T')[0] : '',
          phone: driverData.phone || '',
          mobile: driverData.mobile || '',
          citizenship: driverData.citizenship || '',
          country: driverData.country || '',
          address: driverData.address || '',
          wsib: driverData.wsib || '',
          fastCard: driverData.fastCard || '',
          medicalTracking: driverData.medicalTracking || '',
          csa: driverData.csa || '',
          file: null,
          password: '', // Don't pre-fill password
          role: driverData.role || 'driver',
          status: driverData.status || 'active',
          policies: driverData.policies || ''
        });
        setShowSidebar(true);
      } else {
        // Fallback to using driver object directly if API fails
        setEditingId(driver._id);
        setFormData({
          name: driver.name || '',
          email: driver.email || '',
          gender: driver.gender || '',
          company: '', // Not used in form, auto-assigned by backend
          employmentDetails: driver.employmentDetails || '',
          internalId: driver.internalId || '',
          joinDate: driver.joinDate ? new Date(driver.joinDate).toISOString().split('T')[0] : '',
          phone: driver.phone || '',
          mobile: driver.mobile || '',
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
        company: '', // Not used in form, auto-assigned by backend
        employmentDetails: driver.employmentDetails || '',
        internalId: driver.internalId || '',
        joinDate: driver.joinDate ? new Date(driver.joinDate).toISOString().split('T')[0] : '',
        phone: driver.phone || '',
        mobile: driver.mobile || '',
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
      setShowSidebar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;

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
      if (formData.gender) formDataToSend.append('gender', formData.gender);
      if (formData.employmentDetails) formDataToSend.append('employmentDetails', formData.employmentDetails);
      if (formData.mobile) formDataToSend.append('mobile', formData.mobile);
      if (formData.citizenship) formDataToSend.append('citizenship', formData.citizenship);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.wsib) formDataToSend.append('wsib', formData.wsib);
      if (formData.fastCard) formDataToSend.append('fastCard', formData.fastCard);
      if (formData.medicalTracking) formDataToSend.append('medicalTracking', formData.medicalTracking);
      if (formData.csa) formDataToSend.append('csa', formData.csa);
      
      // Append file if exists
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      const response = await driverApi.updateDriver(editingId, formDataToSend);
      if (response.success) {
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  // Filter drivers locally (backend also does server-side filtering)
  const filteredDrivers = drivers.filter(driver =>
    driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.internalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'mr-96' : ''} overflow-hidden`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
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

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
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
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto overflow-y-visible">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile/Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
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
                      <tr key={driver._id} className="hover:bg-gray-50 transition-colors">
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            driver.csa === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {driver.csa || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleStatus(driver._id, driver.status)}
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                              driver.status === 'active'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {driver.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{driver.address || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{driver.mobile || '-'}</div>
                          <div className="text-xs text-gray-500">{driver.phone || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.lastModified || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEdit(driver)}
                              style={{ color: FLEET_COLORS.primary }}
                              onMouseEnter={(e) => e.currentTarget.style.color = FLEET_COLORS.dark}
                              onMouseLeave={(e) => e.currentTarget.style.color = FLEET_COLORS.primary}
                              className="transition-colors"
                              title="Edit Driver"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(driver._id)}
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
        <div className="fixed right-0 top-0 h-full w-126 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
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

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
                  value={formData.policies}
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
                <input
                  type="text"
                  name="citizenship"
                  value={formData.citizenship}
                  onChange={handleInputChange}
                  placeholder="e.g., Canadian"
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
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex gap-3">
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
              <button
                onClick={editingId ? handleUpdate : handleCreate}
                style={{ backgroundColor: FLEET_COLORS.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = FLEET_COLORS.dark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = FLEET_COLORS.primary}
                className="flex-1 !text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm"
              >
                <Save size={18} />
                {editingId ? 'Update Driver' : 'Create Driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;