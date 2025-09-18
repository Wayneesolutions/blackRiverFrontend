import React, { useState } from 'react';
import { Edit, Trash2, Plus, X, Save } from 'lucide-react';

const DriverManagement = () => {
    const [drivers, setDrivers] = useState([
        {
            id: 1,
            name: 'testdriver',
            email: 'testdriver1@gmail.com',
            phone: '+919887809871',
            country: 'India',
            password: '12345678',
            role: 'driver',
            file: '1339004791958346540.jpg',
            policies: ['a', 'b'],
            status: 'active'
        },
        {
            id: 2,
            name: 'John Smith',
            email: 'john.smith@gmail.com',
            phone: '+919876543210',
            country: 'India',
            password: '87654321',
            role: 'driver',
            file: 'driver2.jpg',
            policies: ['c', 'd'],
            status: 'inactive'
        }
    ]);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        country: '',
        password: '',
        role: 'driver',
        file: '',
        policies: []
    });

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            country: '',
            password: '',
            role: 'driver',
            file: '',
            policies: []
        });
    };

    const handleCreate = (e: any) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone) {
            alert('Please fill in all required fields');
            return;
        }

        const newDriver = {
            ...formData,
            id: Date.now(),
            status: 'active'
        };

        setDrivers([...drivers, newDriver]);
        resetForm();
        setShowCreateForm(false);
    };

    const handleEdit = (driver: any) => {
        setEditingId(driver.id);
        setFormData({
            name: driver.name,
            email: driver.email,
            phone: driver.phone,
            country: driver.country,
            password: driver.password,
            role: driver.role,
            file: driver.file,
            policies: driver.policies
        });
    };

    const handleUpdate = (e: any) => {
        e.preventDefault();
        setDrivers(drivers.map(driver =>
            driver.id === editingId
                ? { ...driver, ...formData }
                : driver
        ));
        setEditingId(null);
        resetForm();
    };

    const handleDelete = (id: any) => {
        if (window.confirm('Are you sure you want to delete this driver?')) {
            setDrivers(drivers.filter(driver => driver.id !== id));
        }
    };

    const toggleStatus = (id: any) => {
        setDrivers(drivers.map(driver =>
            driver.id === id
                ? { ...driver, status: driver.status === 'active' ? 'inactive' : 'active' }
                : driver
        ));
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        if (name === "policies") {
            setFormData({
                ...formData,
                [name]: value
                    .split(",")
                    .map((p: string) => p.trim())
                    .filter((p: string) => p),
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };



    const handleFileChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({
                ...formData,
                file: file.name
            });
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        resetForm();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Driver Management</h1>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 !text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Add New Driver
                </button>
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
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="driver">Driver</option>
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                    </select>
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
                                        <p className="text-sm text-gray-600 mt-1">Selected: {formData.file}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Policies (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        name="policies"
                                        value={formData.policies.join(', ')}
                                        onChange={handleInputChange}
                                        placeholder="e.g., a, b, c"
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
                            {drivers.map((driver) => (
                                <tr key={driver.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {driver.name}
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
                                        <span className="truncate max-w-32 inline-block" title={driver.file}>
                                            {driver.file}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {driver.policies.join(', ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => toggleStatus(driver.id)}
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
                                                onClick={() => handleDelete(driver.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                title="Delete Driver"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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