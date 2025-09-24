import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, X, Users as UsersIcon, Filter, Search } from 'lucide-react';
import { Select, Tag, message } from "antd";
import { listUsers, createUser, deleteUser, updateUserStatus } from '../../../../axios/api/admin';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: Role;
  country: string;
  state: string;
  city: string;
  address: string;
  policies: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

type Role = "admin" | "superadmin" | "driver" | "dispatcher" | "hr";

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

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
    policies: '',
    status: 'active' as 'active' | 'inactive'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await listUsers();
      if (response && response.success) {
        setUsers(response.data);
      } else {
        console.error(response?.message || 'Error fetching users');
        message.error(response?.message || 'Error fetching users');
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on role, status, and search query
  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
      );
    }

    setFilteredUsers(filtered);
  }, [users, selectedRole, selectedStatus, searchQuery]);

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
      if (isEditing && selectedUser) {
        // Mock edit - replace with actual update API if available
        setUsers(prev => prev.map(user =>
          user._id === selectedUser._id
            ? { ...user, ...formData, _id: selectedUser._id }
            : user
        ));
        message.success('User updated successfully');
      } else {
        const response = await createUser(formData);
        if (response && response.success) {
          message.success(response.message || 'User created successfully');
          await fetchUsers(); // Refresh list after creation
        } else {
          console.error(response?.message || 'Error creating user');
          message.error(response?.message || 'Error creating user');
        }
      }

      resetForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error saving user:', error);
      message.error('Failed to save user');
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
      policies: '',
      status: 'active'
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
      setLoading(true);
      try {
        const response = await deleteUser(userId);
        if (response && response.success) {
          message.success(response.message || 'User deleted successfully');
          await fetchUsers(); // Refresh list after deletion
        } else {
          console.error(response?.message || 'Error deleting user');
          message.error(response?.message || 'Error deleting user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        message.error('Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setLoading(true);
    try {
      const response = await updateUserStatus(userId, newStatus);
      if (response && response.success) {
        setUsers(prev => prev.map(user =>
          user._id === userId
            ? { ...user, status: newStatus }
            : user
        ));
        message.success(response.message || `User status updated to ${newStatus}`);
      } else {
        console.error(response?.message || 'Error updating user status');
        message.error(response?.message || 'Error updating user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      message.error('Failed to update user status');
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: 'active' | 'inactive') => {
    return status === 'active'
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-red-50 text-red-700 border-red-200";
  };

  const getUserCountByRole = (role: Role) => {
    return users.filter(user => user.role === role).length;
  };

  return (
    <div className="min-h-screen">
      <div className="px-2 py-8">
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

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Select
                  value={selectedRole}
                  onChange={(value) => setSelectedRole(value as Role | "all")}
                  className="w-full"
                >
                  <Select.Option value="all">All Roles</Select.Option>
                  {roleOptions.map((role) => (
                    <Select.Option key={role} value={role}>
                      <span className="capitalize">{role}</span> ({getUserCountByRole(role)})
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <div className="relative">
                <Select
                  value={selectedStatus}
                  onChange={(value) =>
                    setSelectedStatus(value as "all" | "active" | "inactive")
                  }
                  className="w-full"
                >
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="active">
                    <Tag color="green" className="mr-1">
                      Active
                    </Tag>
                    ({users.filter((u) => u.status === "active").length})
                  </Select.Option>
                  <Select.Option value="inactive">
                    <Tag color="red" className="mr-1">
                      Inactive
                    </Tag>
                    ({users.filter((u) => u.status === "inactive").length})
                  </Select.Option>
                </Select>
              </div>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <div className="font-medium">Total Users: {users.length}</div>
                <div className="text-gray-500">Showing: {filteredUsers.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="min-w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-60 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="w-36 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="w-44 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="w-32 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-500">Loading users...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <UsersIcon size={48} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                      <p className="text-gray-500">
                        {searchQuery || selectedRole !== 'all' || selectedStatus !== 'all'
                          ? "No users match your current filters."
                          : "No users have been created yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="w-full overflow-hidden">
                          <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                          <div className="text-sm text-gray-500 truncate">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border capitalize ${getRoleColor(user.role)}`}>
                          {user.role === 'superadmin' ? 'super' : user.role}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="truncate">{user.phone}</div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="truncate">{user.city}, {user.state}</div>
                      </td>
                      <td className="px-3 py-4">
                        <button
                          onClick={() => handleStatusToggle(user._id, user.status)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border capitalize cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(user.status)}`}
                        >
                          {user.status}
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <div className="truncate">
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="flex justify-center space-x-1">
                          <button
                            onClick={() => handleView(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Edit User"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
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

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
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

              <form onSubmit={handleSubmit}>
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
                        placeholder="Enter phone number"
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

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
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
                    className="px-6 py-3 text-gray-700 bg-gray-100 !mr-4 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 !text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 z-50">
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
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border capitalize ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border capitalize ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
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
                  <div>
                    <span className="font-semibold text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
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