import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, Users, Calendar, TrendingUp, X, AlertCircle, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { getEmployees, createPayroll, listPayrolls, updatePayroll, deletePayroll } from "../../../../axios/api/account.payroll";

interface Employee {
    _id: string;
    name: string;
    role: string;
}

interface Payroll {
    _id: string;
    userId: {
        _id: string;
        name: string;
        role: string;
    };
    baseSalary: number;
    bonus: number;
    deductions: number;
    totalSalary: number;
    payDate: string;
    startDate: string;
    endDate: string;
    createdAt: string;
}

interface PayrollFormData {
    userId: string;
    baseSalary: string;
    bonus: string;
    deductions: string;
    payDate: string;
    startDate: string;
    endDate: string;
}

interface Notification {
    type: 'success' | 'error';
    message: string;
}

const PayrollManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payrollData, setPayrollData] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);

    const [formData, setFormData] = useState<PayrollFormData>({
        userId: '',
        baseSalary: '',
        bonus: '0',
        deductions: '0',
        payDate: '',
        startDate: '',
        endDate: ''
    });

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const fetchEmployees = async () => {
        try {
            const response = await getEmployees();
            if (response?.success) {
                setEmployees(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const response = await listPayrolls();
            if (response?.success) {
                setPayrollData(response.data || []);
            } else {
                showNotification('error', response?.message || 'Failed to fetch payrolls');
            }
        } catch (error) {
            showNotification('error', 'Error fetching payrolls');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchPayrolls();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreate = async () => {
        if (!formData.userId || !formData.baseSalary || !formData.payDate || !formData.startDate || !formData.endDate) {
            showNotification('error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        
        try {
            const payload = {
                userId: formData.userId,
                baseSalary: parseFloat(formData.baseSalary),
                bonus: parseFloat(formData.bonus) || 0,
                deductions: parseFloat(formData.deductions) || 0,
                payDate: formData.payDate,
                startDate: formData.startDate,
                endDate: formData.endDate
            };

            const response = await createPayroll(payload);
            
            if (response?.success) {
                showNotification('success', response.message || 'Payroll created successfully!');
                setShowCreateModal(false);
                resetForm();
                fetchPayrolls();
            } else {
                showNotification('error', response?.message || 'Failed to create payroll');
            }
        } catch (error) {
            showNotification('error', 'Error creating payroll');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedPayroll) return;

        if (!formData.userId || !formData.baseSalary || !formData.payDate || !formData.startDate || !formData.endDate) {
            showNotification('error', 'Please fill in all required fields');
            return;
        }
        
        setLoading(true);
        
        try {
            const payload = {
                userId: formData.userId,
                baseSalary: parseFloat(formData.baseSalary),
                bonus: parseFloat(formData.bonus) || 0,
                deductions: parseFloat(formData.deductions) || 0,
                payDate: formData.payDate,
                startDate: formData.startDate,
                endDate: formData.endDate
            };

            const response = await updatePayroll(selectedPayroll._id, payload);
            
            if (response?.success) {
                showNotification('success', response.message || 'Payroll updated successfully!');
                setShowEditModal(false);
                resetForm();
                setSelectedPayroll(null);
                fetchPayrolls();
            } else {
                showNotification('error', response?.message || 'Failed to update payroll');
            }
        } catch (error) {
            showNotification('error', 'Error updating payroll');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPayroll) return;
        
        setLoading(true);
        
        try {
            const response = await deletePayroll(selectedPayroll._id);
            
            if (response?.success) {
                showNotification('success', response.message || 'Payroll deleted successfully!');
                setShowDeleteModal(false);
                setSelectedPayroll(null);
                fetchPayrolls();
            } else {
                showNotification('error', response?.message || 'Failed to delete payroll');
            }
        } catch (error) {
            showNotification('error', 'Error deleting payroll');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (payroll: Payroll) => {
        setSelectedPayroll(payroll);
        const payDateFormatted = payroll.payDate ? payroll.payDate.split('T')[0] : '';
        const startDateFormatted = payroll.startDate ? payroll.startDate.split('T')[0] : '';
        const endDateFormatted = payroll.endDate ? payroll.endDate.split('T')[0] : '';
        
        setFormData({
            userId: payroll.userId._id,
            baseSalary: payroll.baseSalary.toString(),
            bonus: payroll.bonus.toString(),
            deductions: payroll.deductions.toString(),
            payDate: payDateFormatted,
            startDate: startDateFormatted,
            endDate: endDateFormatted
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (payroll: Payroll) => {
        setSelectedPayroll(payroll);
        setShowDeleteModal(true);
    };

    const resetForm = () => {
        setFormData({
            userId: '',
            baseSalary: '',
            bonus: '0',
            deductions: '0',
            payDate: '',
            startDate: '',
            endDate: ''
        });
    };

    const filteredPayrolls = payrollData.filter(payroll => {
        const matchesSearch = payroll.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payroll.userId.role.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterStatus === 'all' || 
            payroll.userId.role.toLowerCase() === filterStatus.toLowerCase();
        
        return matchesSearch && matchesFilter;
    });

    const totalPayroll = payrollData.reduce((sum, payroll) => sum + payroll.totalSalary, 0);
    const avgSalary = payrollData.length > 0 ? totalPayroll / payrollData.length : 0;

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
                        notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    } text-white`}>
                        {notification.type === 'success' ? (
                            <CheckCircle size={20} />
                        ) : (
                            <AlertCircle size={20} />
                        )}
                        <span>{notification.message}</span>
                        <button onClick={() => setNotification(null)}>
                            <X size={20} />
                        </button>
                    </div>
                )}

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
                        <p className="text-gray-600 mt-2">Manage employee salaries and payroll records</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 !text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Create Payroll
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg border-gray-200 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Payroll</p>
                                <p className="text-2xl font-bold text-gray-900">${totalPayroll.toLocaleString()}</p>
                            </div>
                            <DollarSign className="text-blue-500" size={24} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border-gray-200 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Employees</p>
                                <p className="text-2xl font-bold text-gray-900">{payrollData.length}</p>
                            </div>
                            <Users className="text-green-500" size={24} />
                        </div>
                    </div>
                    <div className="bg-white p-6 border-gray-200 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Average Salary</p>
                                <p className="text-2xl font-bold text-gray-900">${Math.round(avgSalary).toLocaleString()}</p>
                            </div>
                            <TrendingUp className="text-purple-500" size={24} />
                        </div>
                    </div>
                    <div className="bg-white p-6 border-gray-200 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pay Period</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <Calendar className="text-orange-500" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border-gray-200 shadow-sm border mb-6">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by employee name or role..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="driver">Driver</option>
                                    <option value="dispatcher">Dispatcher</option>
                                    <option value="hr">HR</option>
                                    <option value="contact">Contact</option>
                                    <option value="customer">Customer</option>
                                    <option value="reporter">Reporter</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-gray-200 rounded-lg shadow-sm border">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Payroll Records</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredPayrolls.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                No payroll records found
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Base Salary
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bonus
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Deductions
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Salary
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Pay Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPayrolls.map((payroll) => (
                                        <tr key={payroll._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                                        {payroll.userId.name.charAt(0)}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {payroll.userId.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                    {payroll.userId.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${payroll.baseSalary.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                                +${payroll.bonus.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                -${payroll.deductions.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                ${payroll.totalSalary.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(payroll.payDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => openEditModal(payroll)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Payroll"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(payroll)}
                                                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Payroll"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {(showCreateModal || showEditModal) && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-auto p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${showCreateModal ? 'bg-blue-100' : 'bg-green-100'}`}>
                                        {showCreateModal ? <Plus className="text-blue-600" size={20} /> : <Edit2 className="text-green-600" size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-semibold text-gray-900">
                                            {showCreateModal ? 'Create New Payroll' : 'Edit Payroll'}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {showCreateModal ? 'Add a new payroll record' : 'Update payroll information'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setShowEditModal(false);
                                        resetForm();
                                        setSelectedPayroll(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Employee <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="userId"
                                        value={formData.userId}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map((emp) => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} - {emp.role}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Base Salary ($) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="number"
                                                name="baseSalary"
                                                value={formData.baseSalary}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                placeholder="5000.00"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bonus ($)
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="number"
                                                name="bonus"
                                                value={formData.bonus}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Deductions ($)
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="number"
                                                name="deductions"
                                                value={formData.deductions}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        <Calendar size={16} />
                                        Pay Period
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Start Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                End Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="payDate"
                                        value={formData.payDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    />
                                </div>

                                {formData.baseSalary && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">Total Salary:</span>
                                            <span className="text-xl font-bold text-blue-600">
                                                ${(
                                                    parseFloat(formData.baseSalary || '0') + 
                                                    parseFloat(formData.bonus || '0') - 
                                                    parseFloat(formData.deductions || '0')
                                                ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setShowEditModal(false);
                                            resetForm();
                                            setSelectedPayroll(null);
                                        }}
                                        className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={showCreateModal ? handleCreate : handleUpdate}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg transition-colors disabled:bg-blue-400 font-medium flex items-center gap-2"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {showCreateModal ? <Plus size={18} /> : <CheckCircle size={18} />}
                                                {showCreateModal ? 'Create Payroll' : 'Update Payroll'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteModal && selectedPayroll && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Payroll</h3>
                                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                                </div>
                            </div>
                            
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete the payroll record for <strong>{selectedPayroll.userId.name}</strong>?
                            </p>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedPayroll(null);
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 !ml-3 !text-white rounded-lg transition-colors disabled:bg-red-400"
                                    disabled={loading}
                                >
                                    {loading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayrollManagement;