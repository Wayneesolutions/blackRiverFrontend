import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    Building2,
    Mail,
    Phone,
} from 'lucide-react';
import { message, Modal, Input, Select, Button } from 'antd';
import { getAllAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../../axios/api/superadmin';

interface Admin {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    internalId: string;
    status: 'active' | 'inactive';
    joinDate: string;
    createdAt: string;
    company?: {
        _id: string;
        companyName: string;
        companyCode: string;
        address?: string;
        contactEmail?: string;
        contactPhone?: string;
        logoUrl?: string;
    };
    location?: {
        address?: string;
    };
    country?: string;
    state?: string;
    city?: string;
}

const ViewAllAccounts = () => {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalAdmins, setTotalAdmins] = useState(0);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        country: '',
        state: '',
        city: '',
        address: '',
        internalId: '',
        status: 'active' as 'active' | 'inactive',
        policies: '',
        company: ''
    });

    // Fetch admins
    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const response = await getAllAdmins(
                searchTerm || undefined,
                selectedFilter !== 'all' ? selectedFilter : undefined,
                currentPage,
                100
            );
            
            if (response?.success) {
                setAdmins(response.data || []);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages || 1);
                    setTotalAdmins(response.pagination.totalAdmins || 0);
                }
            } else {
                message.error(response?.message || 'Failed to fetch admins');
            }
        } catch (error: any) {
            console.error('Error fetching admins:', error);
            message.error(error?.message || 'Failed to fetch admins');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, [currentPage]);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (currentPage === 1) {
                fetchAdmins();
            } else {
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedFilter]);

    // Filter admins based on search and filters (client-side for instant feedback)
    const filteredAdmins = admins.filter(admin => {
        const matchesSearch = !searchTerm || 
            admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.internalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.company?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = selectedFilter === 'all' || admin.status === selectedFilter;
        
        return matchesSearch && matchesStatus;
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            country: '',
            state: '',
            city: '',
            address: '',
            internalId: '',
            status: 'active',
            policies: '',
            company: ''
        });
        setSelectedAdmin(null);
    };

    const handleCreate = async () => {
        try {
            if (!formData.name || !formData.email || !formData.password) {
                message.error('Name, email, and password are required');
                return;
            }

            const response = await createAdmin(formData);
            if (response?.success) {
                message.success(response.message || 'Admin created successfully');
                setShowCreateModal(false);
                resetForm();
                fetchAdmins();
            } else {
                message.error(response?.message || 'Failed to create admin');
            }
        } catch (error: any) {
            console.error('Error creating admin:', error);
            message.error(error?.message || 'Failed to create admin');
        }
    };

    const handleEdit = (admin: Admin) => {
        setSelectedAdmin(admin);
        setFormData({
            name: admin.name || '',
            email: admin.email || '',
            password: '', // Don't pre-fill password
            phone: admin.phone || '',
            country: admin.country || '',
            state: admin.state || '',
            city: admin.city || '',
            address: admin.location?.address || '',
            internalId: admin.internalId || '',
            status: admin.status || 'active',
            policies: '',
            company: admin.company?._id || ''
        });
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        if (!selectedAdmin) return;
        
        try {
            if (!formData.name || !formData.email) {
                message.error('Name and email are required');
                return;
            }

            const updatePayload: any = { ...formData };
            // Remove password if not provided
            if (!updatePayload.password) {
                delete updatePayload.password;
            }

            const response = await updateAdmin(selectedAdmin._id, updatePayload);
            if (response?.success) {
                message.success(response.message || 'Admin updated successfully');
                setShowEditModal(false);
                resetForm();
                fetchAdmins();
            } else {
                message.error(response?.message || 'Failed to update admin');
            }
        } catch (error: any) {
            console.error('Error updating admin:', error);
            message.error(error?.message || 'Failed to update admin');
        }
    };

    const handleDelete = (admin: Admin) => {
        Modal.confirm({
            title: 'Delete Admin',
            content: `Are you sure you want to delete ${admin.name}? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await deleteAdmin(admin._id);
                    if (response?.success) {
                        message.success(response.message || 'Admin deleted successfully');
                        fetchAdmins();
                    } else {
                        message.error(response?.message || 'Failed to delete admin');
                    }
                } catch (error: any) {
                    console.error('Error deleting admin:', error);
                    message.error(error?.message || 'Failed to delete admin');
                }
            }
        });
    };

    const handleView = (admin: Admin) => {
        setSelectedAdmin(admin);
        setShowViewModal(true);
    };

    const handleSort = (field: string) => {
        // Client-side sorting for now
        const sorted = [...admins].sort((a: any, b: any) => {
            if (field === 'company') {
                const aCompany = a.company?.companyName || '';
                const bCompany = b.company?.companyName || '';
                return aCompany.localeCompare(bCompany);
            } else if (field === 'joinDate') {
                return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
            }
            return 0;
        });
        setAdmins(sorted);
    };




    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                            <Users className="w-8 h-8 text-purple-600 mr-3" />
                            Admin Accounts
                        </h1>
                        <p className="text-gray-600 mt-1">Manage all customer accounts and subscriptions</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => {
                                resetForm();
                                setShowCreateModal(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 !text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Admin
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search admins by name, email, ID, or company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">Status:</label>
                            <Select
                                value={selectedFilter}
                                onChange={(value) => setSelectedFilter(value)}
                                className="w-32"
                            >
                                <Select.Option value="all">All</Select.Option>
                                <Select.Option value="active">Active</Select.Option>
                                <Select.Option value="inactive">Inactive</Select.Option>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="mb-6">
                    <p className="text-gray-600">
                        Showing <span className="font-medium">{filteredAdmins.length}</span> of <span className="font-medium">{totalAdmins}</span> admins
                    </p>
                </div>

                {/* Accounts Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[200px]"
                                        onClick={() => handleSort('company')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Company</span>
                                            <Filter className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                                        Contact Info
                                    </th>

                                    <th
                                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[120px]"
                                        onClick={() => handleSort('revenue')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Revenue</span>
                                            <Filter className="w-3 h-3" />
                                        </div>
                                    </th>
                                  
                                    <th
                                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[150px]"
                                        onClick={() => handleSort('joinDate')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Join Date</span>
                                            <Filter className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                            <p className="mt-2 text-gray-500">Loading admins...</p>
                                        </td>
                                    </tr>
                                ) : filteredAdmins.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No admins found</h3>
                                            <p className="text-gray-500">
                                                {searchTerm || selectedFilter !== 'all'
                                                    ? "No admins match your current filters."
                                                    : "No admins have been created yet."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAdmins.map((admin) => (
                                        <tr key={admin._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                                                <div className="flex items-center">
                                                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                                                        <Building2 className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {admin.company?.companyName || admin.name || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{admin.internalId || admin._id.slice(-6)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap min-w-[250px]">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                        {admin.email || 'N/A'}
                                                    </div>
                                                    {admin.phone && (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                            {admin.phone}
                                                        </div>
                                                    )}
                                                    {admin.company?.companyCode && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Code: {admin.company.companyCode}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap min-w-[120px]">
                                                <div className="text-sm text-gray-900">
                                                    {admin.location?.address ? (
                                                        <div className="truncate max-w-[150px]" title={admin.location.address}>
                                                            {admin.location.address}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-400">No address</div>
                                                    )}
                                                </div>
                                                <div className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
                                                    admin.status === 'active' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {admin.status}
                                                </div>
                                            </td>
                                         
                                            <td className="px-6 py-4 whitespace-nowrap min-w-[150px]">
                                                <div className="space-y-1">
                                                    <div className="text-sm text-gray-900">
                                                        {admin.joinDate ? new Date(admin.joinDate).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Created: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap min-w-[120px]">
                                                <div className="flex items-center space-x-2">
                                                    <button 
                                                        onClick={() => handleView(admin)}
                                                        className="text-gray-400 hover:text-purple-600 p-1 rounded transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEdit(admin)}
                                                        className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors"
                                                        title="Edit Admin"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(admin)}
                                                        className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                                                        title="Delete Admin"
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing page {currentPage} of {totalPages} ({totalAdmins} total admins)
                        </div>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                                if (pageNum > totalPages) return null;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-2 rounded-lg text-sm ${
                                            currentPage === pageNum
                                                ? 'bg-purple-600 text-white'
                                                : 'border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Admin Modal */}
            {showCreateModal && (
                <Modal
                    title="Create New Admin"
                    open={showCreateModal}
                    onCancel={() => {
                        setShowCreateModal(false);
                        resetForm();
                    }}
                    footer={null}
                    width={600}
                >
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter admin name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter email address"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                            <Input.Password
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter password"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <Input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Internal ID</label>
                                <Input
                                    name="internalId"
                                    value={formData.internalId}
                                    onChange={handleInputChange}
                                    placeholder="ADMIN-001"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                <Input
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    placeholder="Country"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                <Input
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    placeholder="State"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                <Input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    placeholder="City"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <Input.TextArea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Enter full address"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <Select
                                value={formData.status}
                                onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                                className="w-full"
                            >
                                <Select.Option value="active">Active</Select.Option>
                                <Select.Option value="inactive">Inactive</Select.Option>
                            </Select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button onClick={() => {
                                setShowCreateModal(false);
                                resetForm();
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
                                Create Admin
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Edit Admin Modal */}
            {showEditModal && selectedAdmin && (
                <Modal
                    title="Edit Admin"
                    open={showEditModal}
                    onCancel={() => {
                        setShowEditModal(false);
                        resetForm();
                    }}
                    footer={null}
                    width={600}
                >
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter admin name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter email address"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password (leave empty to keep current)</label>
                            <Input.Password
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter new password"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <Input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Internal ID</label>
                                <Input
                                    name="internalId"
                                    value={formData.internalId}
                                    onChange={handleInputChange}
                                    placeholder="ADMIN-001"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                <Input
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    placeholder="Country"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                <Input
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    placeholder="State"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                <Input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    placeholder="City"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <Input.TextArea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Enter full address"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <Select
                                value={formData.status}
                                onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                                className="w-full"
                            >
                                <Select.Option value="active">Active</Select.Option>
                                <Select.Option value="inactive">Inactive</Select.Option>
                            </Select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button onClick={() => {
                                setShowEditModal(false);
                                resetForm();
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" onClick={handleUpdate} className="bg-purple-600 hover:bg-purple-700">
                                Update Admin
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* View Admin Modal */}
            {showViewModal && selectedAdmin && (
                <Modal
                    title="Admin Details"
                    open={showViewModal}
                    onCancel={() => setShowViewModal(false)}
                    footer={[
                        <Button key="close" onClick={() => setShowViewModal(false)}>Close</Button>,
                        <Button key="edit" type="primary" onClick={() => {
                            setShowViewModal(false);
                            handleEdit(selectedAdmin);
                        }} className="bg-purple-600 hover:bg-purple-700">
                            Edit
                        </Button>
                    ]}
                    width={600}
                >
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <p className="text-gray-900">{selectedAdmin.name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <p className="text-gray-900">{selectedAdmin.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <p className="text-gray-900">{selectedAdmin.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Internal ID</label>
                                <p className="text-gray-900">{selectedAdmin.internalId || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                    selectedAdmin.status === 'active' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {selectedAdmin.status}
                                </span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                                <p className="text-gray-900">
                                    {selectedAdmin.joinDate ? new Date(selectedAdmin.joinDate).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                        {selectedAdmin.company && (
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium text-gray-900 mb-3">Company Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                        <p className="text-gray-900">{selectedAdmin.company.companyName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Code</label>
                                        <p className="text-gray-900">{selectedAdmin.company.companyCode || 'N/A'}</p>
                                    </div>
                                    {selectedAdmin.company.address && (
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                            <p className="text-gray-900">{selectedAdmin.company.address}</p>
                                        </div>
                                    )}
                                    {selectedAdmin.company.contactEmail && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                            <p className="text-gray-900">{selectedAdmin.company.contactEmail}</p>
                                        </div>
                                    )}
                                    {selectedAdmin.company.contactPhone && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                            <p className="text-gray-900">{selectedAdmin.company.contactPhone}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {selectedAdmin.location?.address && (
                            <div className="border-t pt-4 mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <p className="text-gray-900">{selectedAdmin.location.address}</p>
                            </div>
                        )}
                        {(selectedAdmin.country || selectedAdmin.state || selectedAdmin.city) && (
                            <div className="border-t pt-4 mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <p className="text-gray-900">
                                    {[selectedAdmin.city, selectedAdmin.state, selectedAdmin.country].filter(Boolean).join(', ') || 'N/A'}
                                </p>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ViewAllAccounts;