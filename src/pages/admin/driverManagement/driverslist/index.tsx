import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, X, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { getAllDrivers, createDriver, updateDriver, deleteDriver, updateDriverStatus, generateInternalId, type Driver } from '../../../../axios/api/driver';

const DriverManagement = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        country: '',
        password: '',
        role: 'driver',
        internalId: '',
        policies: '',
        file: null as File | null
    });

    // Fetch drivers on component mount
    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllDrivers();
            console.log('🔍 Driver API response:', response);
            if (response.success) {
                console.log('🔍 Drivers data:', response.data);
                setDrivers(response.data || []);
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
            phone: '',
            country: '',
            password: '',
            role: 'driver',
            internalId: '',
            policies: '',
            file: null
        });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('country', formData.country);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('role', formData.role);
            formDataToSend.append('internalId', formData.internalId || generateInternalId('driver'));
            formDataToSend.append('policies', formData.policies);
            
            if (formData.file) {
                formDataToSend.append('file', formData.file);
            }

            const response = await createDriver(formDataToSend);
            if (response.success) {
                await fetchDrivers(); // Refresh the list
                resetForm();
                setShowCreateForm(false);
                alert('Driver created successfully!');
            } else {
                alert(response.message || 'Failed to create driver');
            }
        } catch (error) {
            console.error('Error creating driver:', error);
            alert('Failed to create driver');
        }
    };

    const handleEdit = (driver: Driver) => {
        setEditingId(driver._id);
        setFormData({
            name: driver.name,
            email: driver.email,
            phone: driver.phone,
            country: driver.country,
            password: '', // Don't pre-fill password for security
            role: driver.role,
            internalId: driver.internalId,
            policies: driver.policies || '',
            file: null
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('country', formData.country);
            formDataToSend.append('role', formData.role);
            formDataToSend.append('internalId', formData.internalId);
            formDataToSend.append('policies', formData.policies);
            
            if (formData.password) {
                formDataToSend.append('password', formData.password);
            }
            
            if (formData.file) {
                formDataToSend.append('file', formData.file);
            }

            const response = await updateDriver(editingId, formDataToSend);
            if (response.success) {
                await fetchDrivers(); // Refresh the list
                setEditingId(null);
                resetForm();
                alert('Driver updated successfully!');
            } else {
                alert(response.message || 'Failed to update driver');
            }
        } catch (error) {
            console.error('Error updating driver:', error);
            alert('Failed to update driver');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this driver?')) {
            try {
                const response = await deleteDriver(id);
                if (response.success) {
                    await fetchDrivers(); // Refresh the list
                    alert('Driver deleted successfully!');
                } else {
                    alert(response.message || 'Failed to delete driver');
                }
            } catch (error) {
                console.error('Error deleting driver:', error);
                alert('Failed to delete driver');
            }
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const response = await updateDriverStatus(id, newStatus);
            if (response.success) {
                await fetchDrivers(); // Refresh the list
                alert(`Driver status updated to ${newStatus}!`);
            } else {
                alert(response.message || 'Failed to update driver status');
            }
        } catch (error) {
            console.error('Error updating driver status:', error);
            alert('Failed to update driver status');
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({
            ...prev,
            file: file
        }));
    };




    const cancelEdit = () => {
        setEditingId(null);
        resetForm();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto bg-gray-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Driver Management</h1>
                    <p className="text-gray-600 mt-1">Manage drivers and their internal IDs</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchDrivers}
                        disabled={loading}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Add New Driver
                    </button>
                </div>
            </div>

            {/* Create/Edit Form Modal */}
            {(showCreateForm || editingId) && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">
                                {editingId ? 'Edit Driver' : 'Create New Driver'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setEditingId(null);
                                    resetForm();
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Internal ID *
                                    </label>
                                    <input
                                        type="text"
                                        name="internalId"
                                        value={formData.internalId}
                                        onChange={handleInputChange}
                                        placeholder="Auto-generated if empty"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role
                                    </label>
                                    <input
                                        type="text"
                                        name="role"
                                        value="driver"
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Driver role is fixed for this form</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Profile Picture
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {formData.file && (
                                        <p className="text-sm text-gray-600 mt-1">Selected: {formData.file.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Policies (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        name="policies"
                                        value={formData.policies}
                                        onChange={handleInputChange}
                                        placeholder="e.g., policy1, policy2, policy3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={editingId ? handleUpdate : handleCreate}
                                    className="bg-green-600 hover:bg-green-700 !text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                                >
                                    <Save size={16} />
                                    {editingId ? 'Update' : 'Create'} Driver
                                </button>
                                <button
                                    type="button"
                                    onClick={editingId ? cancelEdit : () => setShowCreateForm(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Drivers Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Internal ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Country
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    File
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Policies
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center">
                                            <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                                            Loading drivers...
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-red-500">
                                        <div className="flex items-center justify-center">
                                            <AlertCircle className="h-5 w-5 mr-2" />
                                            {error}
                                        </div>
                                    </td>
                                </tr>
                            ) : drivers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                        No drivers found
                                    </td>
                                </tr>
                            ) : (
                                drivers.map((driver) => (
                                    <tr key={driver._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {driver.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                                {driver.internalId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {driver.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {driver.phone}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {driver.country}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {driver.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {driver.profileImageUrl ? (
                                                <div className="flex items-center">
                                                    <img 
                                                        src={driver.profileImageUrl} 
                                                        alt="Profile" 
                                                        className="w-8 h-8 rounded-full object-cover"
                                                        onError={(e) => {
                                                            console.error('Image load error:', driver.profileImageUrl);
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextSibling.style.display = 'block';
                                                        }}
                                                    />
                                                    <span className="text-gray-400 text-xs hidden">Failed to load</span>
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <span className="text-gray-400 text-xs">No image</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {driver.policies || 'No policies'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleStatus(driver._id, driver.status)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${driver.status === 'active'
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                    }`}
                                            >
                                                {driver.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(driver)}
                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                                    title="Edit Driver"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(driver._id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                    title="Delete Driver"
                                                >
                                                    <Trash2 size={16} />
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

            {drivers.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500 text-lg">No drivers found. Create your first driver!</p>
                </div>
            )}
        </div>
    );
};

export default DriverManagement;