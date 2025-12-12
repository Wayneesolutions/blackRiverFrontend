import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Save, 
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Building,
  X
} from 'lucide-react';
import { message } from 'antd';
import { 
  getCurrentUserProfile, 
  updateCurrentUserProfile, 
  changePassword 
} from '../../../../axios/api/auth';
import { FLEET_COLORS, getFocusStyles } from '../../fleetMaintenance/colorUtils';
interface UserProfile {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  role?: string;
  company?: any;
  profileImageUrl?: string;
  avatar?: string;
  location?: {
    address?: string;
    longitude?: string;
    latitude?: string;
  };
  details?: any;
}

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const ToastNotificationComponent = ({ notifications, removeNotification }: { notifications: ToastNotification[]; removeNotification: (id: string) => void }) => {
  const icons = {
    success: <CheckCircle className="text-green-500" size={24} />,
    error: <XCircle className="text-red-500" size={24} />,
    info: <User className="text-blue-500" size={24} />,
    warning: <XCircle className="text-yellow-500" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  return (
    <div className="fixed top-4 right-4 z-[10000] space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} min-w-[300px] max-w-[500px]`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {icons[notification.type]}
          </div>
          <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

const ProfilePage = () => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({});
  const [editForm, setEditForm] = useState<UserProfile>({});

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, type, message }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };
  const focusHandlers = getFocusStyles();
  const sharedInputProps = {
    ...focusHandlers,
    style: { border: `1px solid ${FLEET_COLORS.focusRing}` }
  };
  const cardStyle: React.CSSProperties = {
    borderColor: FLEET_COLORS.focusRing,
    boxShadow: `0 25px 45px ${FLEET_COLORS.focusRing}`,
    borderRadius: "20px",
  };
  const primaryButtonStyle: React.CSSProperties = {
    background: FLEET_COLORS.gradient,
    color: "#fff",
    boxShadow: `0 15px 30px ${FLEET_COLORS.focusRing}`,
  };

  // Fetch user profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setFetchLoading(true);
    try {
      const response = await getCurrentUserProfile();
      if (response && response.success) {
        setProfile(response.data);
        setEditForm(response.data);
      } else {
        console.error('Failed to fetch profile:', response);
        addNotification('error', response?.message || 'Failed to fetch profile');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      addNotification('error', error?.response?.data?.message || 'Error fetching profile');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));
  };

  const handleSaveProfile = async () => {
    // Validation
    if (!editForm.name || !editForm.name.trim()) {
      addNotification('error', 'Name is required');
      return;
    }

    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      addNotification('error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await updateCurrentUserProfile(editForm);
      if (response && response.success) {
        setProfile(response.data);
        setIsEditing(false);
        addNotification('success', 'Profile updated successfully!');
      } else {
        addNotification('error', response?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      addNotification('error', error?.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      addNotification('error', 'All password fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addNotification('error', 'New password and confirm password do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      addNotification('error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await changePassword({
        newPassword: passwordForm.newPassword
      });

      if (response && response.success) {
        addNotification('success', 'Password changed successfully!');
        setShowPasswordSection(false);
        setPasswordForm({
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        addNotification('error', response?.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      addNotification('error', error?.response?.data?.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const handleCancelPassword = () => {
    setPasswordForm({
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordSection(false);
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: FLEET_COLORS.gradientVertical }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: FLEET_COLORS.primary }}></div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6" style={{ background: FLEET_COLORS.gradientVertical }}>
      <div className="py-8">
        {/* Header */}
        <div className="bg-white p-6 mb-8" style={cardStyle}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: FLEET_COLORS.dark }}>My Profile</h1>
              <p style={{ color: FLEET_COLORS.light }}>Manage your account information and preferences</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2"
                style={primaryButtonStyle}
              >
                <User size={16} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

      {/* Profile Information */}
      <div className="bg-white" style={cardStyle}>
        <div className="p-6 border-b" style={{ borderColor: FLEET_COLORS.focusRing }}>
          <div className="flex items-center gap-3">
            <User style={{ color: FLEET_COLORS.primary }} size={24} />
            <h2 className="text-xl font-bold" style={{ color: FLEET_COLORS.dark }}>Personal Information</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={editForm.name || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
                placeholder="Enter your full name"
                {...sharedInputProps}
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-medium">{profile.name || 'Not set'}</p>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={editForm.email || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
                placeholder="Enter your email address"
                {...sharedInputProps}
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-medium">{profile.email || 'Not set'}</p>
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            {isEditing ? (
              <input
                type="text"
                name="phone"
                value={editForm.phone || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
                placeholder="Enter your phone number"
                {...sharedInputProps}
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-medium">{profile.phone || 'Not set'}</p>
              </div>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                {profile.role || 'Not set'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white mt-8" style={cardStyle}>
        <div className="p-6 border-b" style={{ borderColor: FLEET_COLORS.focusRing }}>
          <div className="flex items-center gap-3">
            <MapPin style={{ color: FLEET_COLORS.primary }} size={24} />
            <h2 className="text-xl font-bold" style={{ color: FLEET_COLORS.dark }}>Location Information</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Country */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
            {isEditing ? (
              <input
                type="text"
                name="country"
                value={editForm.country || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
                placeholder="Enter country"
                {...sharedInputProps}
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-medium">{profile.country || 'Not set'}</p>
              </div>
            )}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
            {isEditing ? (
              <input
                type="text"
                name="state"
                value={editForm.state || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
                placeholder="Enter state"
                {...sharedInputProps}
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-medium">{profile.state || 'Not set'}</p>
              </div>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
            {isEditing ? (
              <input
                type="text"
                name="city"
                value={editForm.city || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
                placeholder="Enter city"
                {...sharedInputProps}
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-medium">{profile.city || 'Not set'}</p>
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
            {isEditing ? (
              <input
                type="text"
                name="address"
                value={editForm.location?.address || ''}
                onChange={handleLocationChange}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
                placeholder="Enter full address"
                {...sharedInputProps}
              />
            ) : (
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-medium">{profile.location?.address || 'Not set'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Information */}
      {profile.company && (
        <div className="bg-white mt-8" style={cardStyle}>
          <div className="p-6 border-b" style={{ borderColor: FLEET_COLORS.focusRing }}>
            <div className="flex items-center gap-3">
              <Building style={{ color: FLEET_COLORS.primary }} size={24} />
              <h2 className="text-xl font-bold" style={{ color: FLEET_COLORS.dark }}>Company Information</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="px-4 py-3 bg-gray-50 rounded-lg">
              <p className="text-gray-900 font-medium">
                {typeof profile.company === 'object' ? profile.company.companyName : profile.company}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Actions */}
      {isEditing && (
        <div className="bg-white p-6 mt-8" style={cardStyle}>
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancelEdit}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50"
              style={primaryButtonStyle}
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
          </div>
        </div>
      )}

      {/* Password Section */}
      <div className="bg-white mt-8" style={cardStyle}>
        <div className="p-6 border-b" style={{ borderColor: FLEET_COLORS.focusRing }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key style={{ color: FLEET_COLORS.primary }} size={24} />
              <h2 className="text-xl font-bold" style={{ color: FLEET_COLORS.dark }}>Password</h2>
            </div>
            {!showPasswordSection && (
              <button
                onClick={() => setShowPasswordSection(true)}
                className="px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
                style={{ border: `1px solid ${FLEET_COLORS.primary}`, color: FLEET_COLORS.primary }}
              >
                <Key size={16} />
                Change Password
              </button>
            )}
          </div>
        </div>

        {showPasswordSection && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all pr-10"
                  placeholder="Enter new password"
                  {...sharedInputProps}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all pr-10"
                  placeholder="Confirm new password"
                  {...sharedInputProps}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordForm.newPassword && passwordForm.confirmPassword && (
                <div className="mt-2 flex items-center gap-2">
                  {passwordForm.newPassword === passwordForm.confirmPassword ? (
                    <>
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-xs text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-red-500" />
                      <span className="text-xs text-red-600">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancelPassword}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50"
                style={primaryButtonStyle}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Toast Notifications */}
      <ToastNotificationComponent
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </div>
  );
};

export default ProfilePage;
