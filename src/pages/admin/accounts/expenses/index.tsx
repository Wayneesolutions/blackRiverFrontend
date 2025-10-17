import React, { useState, useEffect } from 'react';
import { Plus, Receipt, DollarSign, Calendar, User, FileText, Filter, Download, Edit, Trash2, Eye } from 'lucide-react';
import { createExpense, listExpenses, updateExpense, deleteExpense } from "../../../../axios/api/account.expense";
import { getEmployees } from "../../../../axios/api/account.payroll";

const ExpensesPage = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [filterType, setFilterType] = useState('all');
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [formData, setFormData] = useState({
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

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await listExpenses();
      if (response && response.data) {
        setExpenses(response.data);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      if (response && response.data) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'receiptFile') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
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
          alert('Expense updated successfully!');
          setEditingExpense(null);
        }
      } else {
        const response = await createExpense(formDataToSend);
        if (response && response.success) {
          alert('Expense created successfully!');
        }
      }

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
    } catch (error) {
      console.error('Error submitting expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      userId: expense.userId?._id || expense.userId,
      type: expense.type,
      amount: expense.amount,
      description: expense.description || '',
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      receiptFile: null
    });
    setActiveTab('create');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await deleteExpense(id);
      if (response && response.success) {
        alert('Expense deleted successfully!');
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const getTypeColor = (type) => {
    const typeMap = {
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

  const getTypeIcon = (type) => {
    if (type && type.includes('Fuel')) return '⛽';
    if (type && type.includes('Repair')) return '🔧';
    if (type && type.includes('Cash')) return '💰';
    return '📄';
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

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
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
                <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
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
                  ₹{expenses.filter(e => e.type && e.type.includes('Fuel')).reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
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
                  ₹{expenses.filter(e => e.type && (e.type.includes('Repair') || e.type.includes('Maintenance'))).reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
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
                  ₹{expenses.filter(e => e.type && e.type.includes('Cash')).reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
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

                  <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download size={16} />
                    Export
                  </button>
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
                                  ₹{(expense.amount || 0).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-1">{expense.description || 'No description'}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User size={12} />
                                  {expense.userId?.name || 'Unknown User'}
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
                            {expense.receiptUrl && (
                              <button 
                                onClick={() => window.open(expense.receiptUrl, '_blank')}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleEdit(expense)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(expense._id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                        Amount (₹) *
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
    </div>
  );
};

export default ExpensesPage;