import { useState, useEffect } from 'react';
import { Plus, Receipt, DollarSign, Calendar, User, FileText, Filter, Edit, Trash2, Eye, Building2 } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { createExpense, listExpenses, updateExpense, deleteExpense } from "../../../../axios/api/account.expense";
import { getEmployees } from "../../../../axios/api/account.payroll";
import ConfirmationModal from "../../../../components/common/ConfirmationModal";

interface Employee {
  _id: string;
  name: string;
  role?: string;
  position?: string;
}

interface Expense {
  _id: string;
  userId?: Employee | string;
  type: string;
  amount: number;
  description?: string;
  date?: string | Date;
  receiptUrl?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

// Notification Component
const Notification = ({ notification, onClose }: { notification: Notification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    info: <FaInfoCircle className="text-[#9793E4]" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-[#9793E4]/10 border-[#9793E4]/30'
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

const ExpensesPage = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [filterType, setFilterType] = useState('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    userId: string;
    type: string;
    amount: string;
    description: string;
    date: string;
    receiptFile: File | null;
  }>({
    userId: '',
    type: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receiptFile: null
  });

  // Fetch expenses on component mount
  useEffect(() => {
    fetchExpenses();
    fetchEmployees();
  }, []);

  const getLocalUserInfo = () => {
    const userInfoString = localStorage.getItem('userInfo');
    if (!userInfoString) return null;
    try {
      return JSON.parse(userInfoString);
    } catch (err) {
      console.error('Error parsing userInfo from localStorage:', err);
      return null;
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const userInfo: any = getLocalUserInfo();
      
      // Handle different userInfo structures (userData.company or direct company)
      const userRole = userInfo?.role || userInfo?.userData?.role;
      const userCompany = userInfo?.company || userInfo?.userData?.company;
      const isSuperadmin = userRole === 'superadmin';
      const isHR = userRole === 'hr';
      const hasCompany = Boolean(userCompany);

      // Allow HR and dispatchers to call API even if company is not visible in localStorage
      // The backend will handle company filtering based on the authenticated user
      if (!isSuperadmin && !isHR && !hasCompany) {
        setEmptyStateMessage(null);
        setExpenses([]);
        return;
      }

      const response = await listExpenses();
      if (response?.success && Array.isArray(response.data)) {
        setExpenses(response.data);
        if (response.message && response.data.length === 0) {
          setEmptyStateMessage(response.message);
        } else {
          setEmptyStateMessage(null);
        }
      } else {
        setExpenses([]);
        const message = response?.message || 'Failed to fetch expenses';
        setEmptyStateMessage(message);
        addNotification('error', message);
      }
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
      const message = error?.message || 'Failed to fetch expenses';
      setEmptyStateMessage(message);
      addNotification('error', message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const userInfo: any = getLocalUserInfo();
      
      // Handle different userInfo structures (userData.company or direct company)
      const userRole = userInfo?.role || userInfo?.userData?.role;
      const userCompany = userInfo?.company || userInfo?.userData?.company;
      const isSuperadmin = userRole === 'superadmin';
      const isHR = userRole === 'hr';
      const hasCompany = Boolean(userCompany);

      // Allow HR and dispatchers to call API even if company is not visible in localStorage
      // The backend will handle company filtering based on the authenticated user
      if (!isSuperadmin && !isHR && !hasCompany) {
        setEmployees([]);
        return;
      }

      const response = await getEmployees();
      if (response && response.data) {
        setEmployees(response.data);
      } else if (response?.message) {
        addNotification('error', response.message);
      }
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      addNotification('error', error?.message || 'Failed to fetch employees');
    }
  };

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const files = (e.target as HTMLInputElement).files;
    if (name === 'receiptFile' && files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('userId', formData.userId);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('date', formData.date);
      
      if (formData.receiptFile) {
        formDataToSend.append('file', formData.receiptFile);
      }

      if (editingExpense) {
        const response = await updateExpense(editingExpense._id, formDataToSend);
        if (response && response.success) {
          addNotification('success', response.message || 'Expense updated successfully!');
          setEditingExpense(null);
          // Reset form and refresh list
          setFormData({
            userId: '',
            type: '',
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            receiptFile: null
          });
          setActiveTab('list');
          fetchExpenses();
        } else {
          addNotification('error', response?.message || 'Failed to update expense. Please try again.');
        }
      } else {
        const response = await createExpense(formDataToSend);
        if (response && response.success) {
          addNotification('success', response.message || 'Expense created successfully!');
          // Reset form and refresh list
          setFormData({
            userId: '',
            type: '',
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            receiptFile: null
          });
          setActiveTab('list');
          fetchExpenses();
        } else {
          addNotification('error', response?.message || 'Failed to create expense. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Error submitting expense:', error);
      addNotification('error', error?.message || 'Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    const userIdValue = typeof expense.userId === 'object' && expense.userId !== null 
      ? expense.userId._id 
      : expense.userId || '';
    setFormData({
      userId: userIdValue,
      type: expense.type,
      amount: expense.amount.toString(),
      description: expense.description || '',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      receiptFile: null
    });
    setActiveTab('create');
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; expenseId: string | null }>({ show: false, expenseId: null });

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ show: true, expenseId: id });
  };

  const confirmDeleteExpense = async () => {
    if (!deleteConfirm.expenseId) return;

    setLoading(true);
    try {
      const response = await deleteExpense(deleteConfirm.expenseId);
      if (response && response.success) {
        addNotification('success', response.message || 'Expense deleted successfully!');
        fetchExpenses();
      } else {
        addNotification('error', response?.message || 'Failed to delete expense. Please try again.');
      }
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      addNotification('error', error?.message || 'Failed to delete expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (expense: Expense) => {
    setViewingExpense(expense);
    setShowViewModal(true);
  };

  const handleCancel = () => {
    setEditingExpense(null);
    setFormData({
      userId: '',
      type: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      receiptFile: null
    });
    setActiveTab('list');
  };

  const getTypeColor = (type: string) => {
    const typeMap: Record<string, string> = {
      'Fuel Expense (Fuel)': 'bg-blue-100 text-blue-800',
      'Tractor Fuel (Fuel)': 'bg-blue-100 text-blue-800',
      'Trailer Fuel (Fuel)': 'bg-blue-100 text-blue-800',
      'Reefer Fuel (Fuel)': 'bg-blue-100 text-blue-800',
      'DEF Pump (Fuel)': 'bg-blue-100 text-blue-800',
      'Maintenance': 'bg-green-100 text-green-800',
      'Truck Repair': 'bg-green-100 text-green-800',
      'Trailer Repair': 'bg-green-100 text-green-800',
      'Cash': 'bg-purple-100 text-purple-800',
      'Cash Advance': 'bg-purple-100 text-purple-800',
    };
    return typeMap[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    if (type && type.includes('Fuel')) return '⛽';
    if (type && type.includes('Repair')) return '🔧';
    if (type && type.includes('Cash')) return '💰';
    return '📄';
  };

  const getEmployeeName = (userId: Expense['userId']): string => {
    if (typeof userId === 'object' && userId !== null) {
      return userId.name || 'Unknown User';
    }
    const employee = employees.find(emp => emp._id === userId);
    return employee?.name || 'Unknown User';
  };

  const getEmployeeRole = (userId: Expense['userId']): string | undefined => {
    if (typeof userId === 'object' && userId !== null) {
      return userId.role;
    }
    const employee = employees.find(emp => emp._id === userId);
    return employee?.role || employee?.position;
  };

  const filteredExpenses = expenses.filter(expense =>
    filterType === 'all' || expense.type === filterType
  );

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const expenseTypes = [
    'Additives',
    'Cash',
    'Cash Advance',
    'DEF Pump (Fuel)',
    'DEF',
    'Fuel Expense (Fuel)',
    'Maintenance',
    'Misc',
    'Reefer Fuel (Fuel)',
    'Scales',
    'Tire Change & Rotation',
    'Tractor Fuel (Fuel)',
    'Trailer Fuel (Fuel)',
    'Trailer Repair',
    'Trailer Service',
    'Truck and Trailer Parts',
    'Truck Repair',
    'Truck Service'
  ];

  if (loading && !emptyStateMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {emptyStateMessage && (
          <div className="mb-6">
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 shadow-sm">
              <Building2 className="h-5 w-5 mt-0.5 text-blue-500" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900">No expense data available</p>
                <p className="mt-1">{emptyStateMessage}</p>
                <button
                  onClick={fetchExpenses}
                  className="mt-3 inline-flex items-center rounded-lg border border-blue-400 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
              <p className="text-gray-600 mt-2">Track and manage all expenses</p>
            </div>
            <button
              onClick={() => {
                setEditingExpense(null);
                setFormData({
                  userId: '',
                  type: '',
                  amount: '',
                  description: '',
                  date: new Date().toISOString().split('T')[0],
                  receiptFile: null
                });
                setActiveTab('create');
              }}
              className="bg-blue-600 !text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Fuel Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${expenses.filter(e => e.type && e.type.includes('Fuel')).reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">⛽</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${expenses.filter(e => e.type && (e.type.includes('Repair') || e.type.includes('Maintenance'))).reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">🔧</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Cash Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${expenses.filter(e => e.type && e.type.includes('Cash')).reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border-gray-200 shadow-sm border">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-6 py-4 text-sm font-medium ${activeTab === 'list'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Expense List
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-4 text-sm font-medium ${activeTab === 'create'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : '!text-gray-500 hover:text-gray-700'
                  }`}
              >
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'list' && (
              <div>
                {/* Filters */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter size={20} className="text-gray-500" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Types</option>
                        {expenseTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Expense List */}
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading expenses...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredExpenses.map((expense) => (
                      <div key={expense._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl">{getTypeIcon(expense.type)}</div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(expense.type)}`}>
                                  {expense.type}
                                </span>
                                <span className="text-lg font-semibold text-gray-900">
                                  ${(expense.amount || 0).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-1">{expense.description || 'No description'}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User size={12} />
                                  {getEmployeeName(expense.userId)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {expense.date ? new Date(expense.date).toLocaleDateString() : 'No date'}
                                </span>
                                {expense.receiptUrl && (
                                  <span className="flex items-center gap-1">
                                    <Receipt size={12} />
                                    Receipt Available
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleView(expense)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => handleEdit(expense)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit Expense"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(expense._id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredExpenses.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No expenses found for the selected filter.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Employee *
                      </label>
                      <select
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} - {emp.role || emp.position || 'Employee'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expense Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Type</option>
                        {expenseTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount ($) *
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter amount"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter expense description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Receipt Upload
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      <Receipt className="mx-auto mb-2 text-gray-400" size={32} />
                      <input
                        type="file"
                        name="receiptFile"
                        onChange={handleInputChange}
                        accept="image/*,.pdf"
                        className="hidden"
                        id="receipt-upload"
                      />
                      <label htmlFor="receipt-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-700">Click to upload</span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                      {formData.receiptFile && (
                        <p className="text-sm text-green-600 mt-2">
                          Selected: {formData.receiptFile.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 !text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                      {loading ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={loading}
                      className="text-gray-600 hover:text-gray-900 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Expense Modal */}
      {showViewModal && viewingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Expense Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingExpense(null);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Expense Type and Amount */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{getTypeIcon(viewingExpense.type)}</div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(viewingExpense.type)}`}>
                      {viewingExpense.type || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${(viewingExpense.amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Employee Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={18} className="text-gray-500" />
                    <p className="text-sm font-medium text-gray-600">Employee</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {getEmployeeName(viewingExpense.userId)}
                  </p>
                  {getEmployeeRole(viewingExpense.userId) && (
                    <p className="text-sm text-gray-500 mt-1">{getEmployeeRole(viewingExpense.userId)}</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-gray-500" />
                    <p className="text-sm font-medium text-gray-600">Date</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {viewingExpense.date 
                      ? new Date(viewingExpense.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'No date'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {viewingExpense.description && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={18} className="text-gray-500" />
                    <p className="text-sm font-medium text-gray-600">Description</p>
                  </div>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {viewingExpense.description}
                  </p>
                </div>
              )}

              {/* Receipt */}
              {viewingExpense.receiptUrl && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt size={18} className="text-gray-500" />
                    <p className="text-sm font-medium text-gray-600">Receipt</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">Receipt Available</p>
                        <a
                          href={viewingExpense.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                          View Receipt
                        </a>
                      </div>
                      <button
                        onClick={() => window.open(viewingExpense.receiptUrl, '_blank')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                      >
                        <Eye size={16} />
                        Open Receipt
                      </button>
                    </div>
                    {viewingExpense.receiptUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                      <div className="mt-4">
                        <img
                          src={viewingExpense.receiptUrl}
                          alt="Receipt"
                          className="max-w-full h-auto rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {viewingExpense.createdAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Created At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(viewingExpense.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {viewingExpense.updatedAt && viewingExpense.updatedAt !== viewingExpense.createdAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                    <p className="text-sm text-gray-900">
                      {new Date(viewingExpense.updatedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  handleEdit(viewingExpense);
                  setShowViewModal(false);
                  setViewingExpense(null);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <Edit size={16} />
                Edit Expense
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingExpense(null);
                }}
                className="text-gray-600 hover:text-gray-900 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-[200] space-y-3 max-w-md">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, expenseId: null })}
        onConfirm={confirmDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default ExpensesPage;