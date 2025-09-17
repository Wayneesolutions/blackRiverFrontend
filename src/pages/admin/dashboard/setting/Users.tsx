import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, X, Users as UsersIcon } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  country: string;
  state: string;
  city: string;
  address: string;
  policies: string;
}

type Role = "admin" | "superadmin" | "driver" | "dispatcher" | "hr";

// Static data
const staticUsers: User[] = [
  {
    id: '1',
    name: 'John Admin',
    email: 'admin@company.com',
    phone: '+91-9876543210',
    password: '********',
    role: 'admin',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    address: '123 Business District, Mumbai, Maharashtra',
    policies: 'Full system access with administrative privileges'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.hr@company.com',
    phone: '+91-9876543211',
    password: '********',
    role: 'hr',
    country: 'India',
    state: 'Karnataka',
    city: 'Bangalore',
    address: '456 Tech Park, Bangalore, Karnataka',
    policies: 'HR management and employee relations'
  },
  {
    id: '3',
    name: 'Mike Driver',
    email: 'mike.d@company.com',
    phone: '+91-9876543212',
    password: '********',
    role: 'driver',
    country: 'India',
    state: 'Tamil Nadu',
    city: 'Chennai',
    address: '789 Transport Hub, Chennai, Tamil Nadu',
    policies: 'Vehicle operation and safety compliance'
  },
  {
    id: '4',
    name: 'Lisa Dispatcher',
    email: 'lisa.dispatch@company.com',
    phone: '+91-9876543213',
    password: '********',
    role: 'dispatcher',
    country: 'India',
    state: 'West Bengal',
    city: 'Kolkata',
    address: '321 Logistics Center, Kolkata, West Bengal',
    policies: 'Route planning and fleet coordination'
  },
  {
    id: '5',
    name: 'David Super',
    email: 'super.admin@company.com',
    phone: '+91-9876543214',
    password: '********',
    role: 'superadmin',
    country: 'India',
    state: 'Delhi',
    city: 'New Delhi',
    address: '555 Corporate Tower, New Delhi, Delhi',
    policies: 'Ultimate system control and configuration'
  },
  {
    id: '6',
    name: 'Emma Wilson',
    email: 'emma.hr@company.com',
    phone: '+91-9876543215',
    password: '********',
    role: 'hr',
    country: 'India',
    state: 'Gujarat',
    city: 'Ahmedabad',
    address: '777 Business Plaza, Ahmedabad, Gujarat',
    policies: 'Recruitment and employee development'
  }
];

const Users = () => {
  const [users, setUsers] = useState<User[]>(staticUsers);
  const [activeTab, setActiveTab] = useState<Role>('admin');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const roleOptions: Role[] = ['admin', 'superadmin', 'driver', 'dispatcher', 'hr'];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'hr' as Role,
    country: '',
    state: '',
    city: '',
    address: '',
    policies: ''
  });

  // Filter users based on active tab
  const filteredUsers = users.filter(user => user.role === activeTab);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isEditing && selectedUser) {
        // Update user
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id 
            ? { ...user, ...formData, id: selectedUser.id }
            : user
        ));
      } else {
        // Create new user
        const newUser: User = {
          ...formData,
          id: Date.now().toString()
        };
        setUsers(prev => [...prev, newUser]);
      }
      
      resetForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'hr',
      country: '',
      state: '',
      city: '',
      address: '',
      policies: ''
    });
    setIsEditing(false);
    setSelectedUser(null);
  };

  const handleEdit = (user: User) => {
    setFormData(user);
    setSelectedUser(user);
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  const getRoleColor = (role: Role) => {
    const colors: Record<Role, string> = {
      admin: "bg-blue-50 text-blue-700 border-blue-200",
      superadmin: "bg-purple-50 text-purple-700 border-purple-200",
      driver: "bg-green-50 text-green-700 border-green-200",
      dispatcher: "bg-orange-50 text-orange-700 border-orange-200",
      hr: "bg-pink-50 text-pink-700 border-pink-200",
    };
    return colors[role] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getRoleIcon = (role: Role) => {
    return <UsersIcon size={16} className="mr-1" />;
  };

  const getUserCountByRole = (role: Role) => {
    return users.filter(user => user.role === role).length;
  };

  return (
    <div className="min-h-screen">
      <div className="px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Manage your team members and their roles</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 !text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Add New User
            </button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {roleOptions.map((role) => {
                const userCount = getUserCountByRole(role);
                return (
                  <button
                    key={role}
                    onClick={() => setActiveTab(role)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-all duration-200 flex items-center gap-2 ${
                      activeTab === role
                        ? 'border-blue-500 text-blue-600 bg-blue-50 rounded-t-lg px-4 -mb-px'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                  
                    <span className="font-semibold">{role}</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      activeTab === role 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {userCount}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Users Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">No users with the role "{activeTab}" have been created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{user.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{user.email}</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border capitalize ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">Phone:</span>
                        <span className="ml-2">{user.phone}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium">Location:</span>
                        <span className="ml-2">{user.city}, {user.country}</span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleView(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className=" flex items-center justify-center p-4
        fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit User' : 'Create New User'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      
                    />
                  </div>

                  {!isEditing && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter password"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role} className="capitalize">
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Policies</label>
                    <textarea
                      name="policies"
                      value={formData.policies}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Enter user policies"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 !ml-4 !text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{selectedUser.name}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border capitalize ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <span className="font-semibold text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-900">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Phone:</span>
                    <span className="ml-2 text-gray-900">{selectedUser.phone}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-900">{selectedUser.city}, {selectedUser.state}, {selectedUser.country}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Address:</span>
                    <p className="mt-1 text-gray-900">{selectedUser.address}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Policies:</span>
                    <p className="mt-1 text-gray-900">{selectedUser.policies}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;