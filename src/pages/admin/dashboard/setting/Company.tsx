import React, { useState, useEffect, useCallback } from 'react';
import { Building, Mail, Phone, MapPin, Upload, Save, Edit, X, AlertCircle, Settings, Key, Check } from 'lucide-react';
import { getCompany, updateCompany, updateApiCredentials } from '../../../../axios/api/admin';
import { useDispatch } from 'react-redux';
import { setUserCredentials } from '../../../../redux/slices/userSlice';

interface CompanyInfo {
  companyName: string;
  companyCode: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl?: string;
}

interface SamsaraConfig {
  apiBaseUrl: string;
  apiToken: string;
}

interface ThermoKingConfig {
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
  apiVersion: string;
}

const Company = () => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    companyCode: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    logoUrl: ''
  });

  const [samsaraConfig, setSamsaraConfig] = useState<SamsaraConfig>({
    apiBaseUrl: '',
    apiToken: ''
  });

  const [thermokingConfig, setThermokingConfig] = useState<ThermoKingConfig>({
    apiBaseUrl: '',
    apiKey: '',
    apiSecret: '',
    apiVersion: 'v1'
  });

  const [editForm, setEditForm] = useState<CompanyInfo>(companyInfo);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const updateStoredUserCompany = useCallback(
    (company: { _id: string; companyName?: string } | null) => {
    try {
      const stored = localStorage.getItem('userInfo');
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (!parsed?.userData) {
        return;
      }

      const updated = {
        ...parsed,
        userData: {
          ...parsed.userData,
          company: company || undefined
        },
        role: parsed.userData?.role || parsed.role,
        company: company || undefined,
      };

      localStorage.setItem('userInfo', JSON.stringify(updated));
      dispatch(setUserCredentials(updated));
    } catch (err) {
      console.error('Error updating stored userInfo with company details:', err);
    }
  },
  [dispatch]);

  // Fetch company data on component mount
  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    setFetchLoading(true);
    setError('');
    
    try {
      const response = await getCompany();
      
      if (response?.success && response?.data) {
        const data = response.data;
        
        const companyData: CompanyInfo = {
          companyName: data.companyName || '',
          companyCode: data.companyCode || '',
          address: data.address || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          logoUrl: data.logoUrl || ''
        };
        
        setCompanyInfo(companyData);
        setEditForm(companyData);
        if (data._id) {
          updateStoredUserCompany({ _id: data._id, companyName: data.companyName || '' });
        }
        
        // Handle API configurations
        if (data.samsaraConfig) {
          setSamsaraConfig({
            apiBaseUrl: data.samsaraConfig.apiBaseUrl || '',
            apiToken: data.samsaraConfig.apiToken || ''
          });
        }
        
        if (data.thermokingConfig) {
          setThermokingConfig({
            apiBaseUrl: data.thermokingConfig.apiBaseUrl || '',
            apiKey: data.thermokingConfig.apiKey || '',
            apiSecret: data.thermokingConfig.apiSecret || '',
            apiVersion: data.thermokingConfig.apiVersion || 'v1'
          });
        }
        
        // Set preview URL for logo
        if (data.logoUrl) {
          setPreviewUrl(data.logoUrl);
        }
      } else {
        updateStoredUserCompany(null);
        console.log('No company data found or response failed');
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      setError('Failed to load company data. Please try again.');
      updateStoredUserCompany(null);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSamsaraChange = (field: keyof SamsaraConfig, value: string) => {
    setSamsaraConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThermokingChange = (field: keyof ThermoKingConfig, value: string) => {
    setThermokingConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add company info fields only (no API configs)
      (Object.keys(editForm) as Array<keyof CompanyInfo>).forEach((key) => {
        const value = editForm[key];
        if (value && key !== 'logoUrl') {
          formData.append(key, value);
        }
      });
      
      // Add logo file if selected
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      const response = await updateCompany(formData);
      
      if (response?.success) {
        setSuccess('Company settings updated successfully!');
        setCompanyInfo(editForm);
        setIsEditing(false);
        setSelectedFile(null);
        if (response.data?._id) {
          updateStoredUserCompany({ _id: response.data._id, companyName: response.data.companyName || '' });
        } else {
          updateStoredUserCompany(null);
        }
        
        // Update logo URL if returned in response
        if (response.data?.logoUrl) {
          setCompanyInfo(prev => ({
            ...prev,
            logoUrl: response.data.logoUrl
          }));
          setPreviewUrl(response.data.logoUrl);
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response?.message || 'Failed to update company settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving company info:', error);
      setError('Failed to update company settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm(companyInfo);
    setSelectedFile(null);
    setPreviewUrl(companyInfo.logoUrl || '');
    setIsEditing(false);
    setError('');
  };

  const handleSaveApiCredentials = async () => {
    setApiLoading(true);
    setApiError('');
    setApiSuccess('');
    
    try {
      const response = await updateApiCredentials({
        samsaraConfig,
        thermokingConfig
      });
      
      if (response?.success) {
        setApiSuccess('API credentials updated successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setApiSuccess(''), 3000);
      } else {
        setApiError(response?.message || 'Failed to update API credentials. Please try again.');
      }
    } catch (error) {
      console.error('Error saving API credentials:', error);
      setApiError('Failed to update API credentials. Please try again.');
    } finally {
      setApiLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB.');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDF8FF] px-6">
      <div className="py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50 max-w-md">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}
        
        {error && (
          <div className="fixed top-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50 max-w-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        
        {apiSuccess && (
          <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50 max-w-md">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{apiSuccess}</span>
          </div>
        )}
        
        {apiError && (
          <div className="fixed top-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50 max-w-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{apiError}</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Settings</h1>
              <p className="text-gray-600">Manage your company information and preferences</p>
            </div>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 !text-white rounded-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: "linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)",
                  }}
                  className="px-4 py-2   !text-white rounded-lg transition-all font-medium flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Settings
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Company Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Building className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Company Logo */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
                    <img
                      src={previewUrl || companyInfo.logoUrl || 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=LOGO'}
                      alt="Company Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=LOGO';
                      }}
                    />
                  </div>
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload size={20} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">Company Logo</p>
                {selectedFile && (
                  <p className="text-xs text-green-600 mt-1">New logo selected: {selectedFile.name}</p>
                )}
              </div>

              {/* Company Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="companyName"
                      value={editForm.companyName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter company name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-medium">{companyInfo.companyName || 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Code</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="companyCode"
                      value={editForm.companyCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter company code"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-medium">{companyInfo.companyCode || 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    Address
                  </label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={editForm.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Enter company address"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{companyInfo.address || 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail size={16} className="inline mr-1" />
                    Contact Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="contactEmail"
                      value={editForm.contactEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter contact email"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{companyInfo.contactEmail || 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-1" />
                    Contact Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="contactPhone"
                      value={editForm.contactPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter contact phone"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{companyInfo.contactPhone || 'Not set'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* API Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="text-blue-600" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">API Configuration</h2>
                </div>
                <button
                  onClick={handleSaveApiCredentials}
                  disabled={apiLoading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 !text-white rounded-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {apiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save API Credentials
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Samsara Configuration */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Key className="text-blue-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Samsara API</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Base URL</label>
                    <input
                      type="text"
                      value={samsaraConfig.apiBaseUrl}
                      onChange={(e) => handleSamsaraChange('apiBaseUrl', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="https://api.samsara.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Token</label>
                    <input
                      type="password"
                      value={samsaraConfig.apiToken}
                      onChange={(e) => handleSamsaraChange('apiToken', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter Samsara API token"
                    />
                  </div>
                </div>
              </div>

              {/* ThermoKing Configuration */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="text-orange-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">ThermoKing API</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Base URL</label>
                    <input
                      type="text"
                      value={thermokingConfig.apiBaseUrl}
                      onChange={(e) => handleThermokingChange('apiBaseUrl', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="https://api.thermoking.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                    <input
                      type="password"
                      value={thermokingConfig.apiKey}
                      onChange={(e) => handleThermokingChange('apiKey', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Enter ThermoKing API key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Secret</label>
                    <input
                      type="password"
                      value={thermokingConfig.apiSecret}
                      onChange={(e) => handleThermokingChange('apiSecret', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Enter ThermoKing API secret"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Version</label>
                    <input
                      type="text"
                      value={thermokingConfig.apiVersion}
                      onChange={(e) => handleThermokingChange('apiVersion', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="v1"
                    />
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> API configurations are stored securely and linked to your company. 
                  These settings are required for integrating with Samsara and ThermoKing services.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
      
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

export default Company;