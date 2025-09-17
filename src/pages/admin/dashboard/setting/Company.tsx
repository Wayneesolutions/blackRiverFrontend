import React, { useState } from 'react';
import { Building, Mail, Phone, MapPin, Bell, Upload, Save, Edit, Check, X } from 'lucide-react';

interface CompanyInfo {
  companyName: string;
  companyCode: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  logo: string;
}

interface NotificationPreferences {
  sms: boolean;
  email: boolean;
  appAlerts: boolean;
}

const Company = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Static company data
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: 'TechCorp Solutions',
    companyCode: 'TECH001',
    address: '123 Business Park, Electronic City, Bangalore, Karnataka 560100, India',
    contactEmail: 'contact@techcorp.com',
    contactPhone: '+91-9876543210',
    logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center'
  });

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    sms: true,
    email: true,
    appAlerts: false
  });

  const [editForm, setEditForm] = useState<CompanyInfo>(companyInfo);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (type: keyof NotificationPreferences) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCompanyInfo(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving company info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm(companyInfo);
    setIsEditing(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setEditForm(prev => ({
          ...prev,
          logo: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="px-2 py-8">
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
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium flex items-center gap-2"
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
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 !text-white rounded-lg transition-all font-medium flex items-center gap-2"
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
                      src={isEditing ? editForm.logo : companyInfo.logo}
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
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-medium">{companyInfo.companyName}</p>
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
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-medium">{companyInfo.companyCode}</p>
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
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{companyInfo.address}</p>
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
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{companyInfo.contactEmail}</p>
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
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{companyInfo.contactPhone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Bell className="text-green-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-6">Choose how you want to receive notifications about your company activities.</p>
              
              <div className="space-y-6">
                {/* SMS Notifications */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Phone size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
                      <p className="text-sm text-gray-600">Receive important updates via SMS</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.sms}
                      onChange={() => handleNotificationChange('sms')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Mail size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive detailed reports via email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={() => handleNotificationChange('email')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* App Alerts */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Bell size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">App Alerts</h3>
                      <p className="text-sm text-gray-600">Push notifications in the app</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.appAlerts}
                      onChange={() => handleNotificationChange('appAlerts')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              {/* Notification Summary */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Current Notification Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {notifications.sms ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <X size={16} className="text-red-600" />
                    )}
                    <span className="text-sm text-gray-700">SMS notifications are {notifications.sms ? 'enabled' : 'disabled'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {notifications.email ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <X size={16} className="text-red-600" />
                    )}
                    <span className="text-sm text-gray-700">Email notifications are {notifications.email ? 'enabled' : 'disabled'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {notifications.appAlerts ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <X size={16} className="text-red-600" />
                    )}
                    <span className="text-sm text-gray-700">App alerts are {notifications.appAlerts ? 'enabled' : 'disabled'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

  
      </div>
    </div>
  );
};

export default Company;