import React, { useState } from 'react';
import { Plus, Receipt, DollarSign, Calendar, User, FileText, Filter, Download, Edit, Trash2, Eye } from 'lucide-react';

const ExpensesPage = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [filterType, setFilterType] = useState('all');
  const [expenses, setExpenses] = useState([
    {
      _id: '1',
      userId: { _id: 'user1', name: 'John Doe', role: 'Driver' },
      type: 'fuel',
      amount: 2500,
      description: 'Fuel for route Mumbai-Delhi',
      receiptUrl: '/receipts/fuel-receipt-1.jpg',
      date: new Date('2024-09-15'),
      createdAt: new Date('2024-09-15'),
      updatedAt: new Date('2024-09-15')
    },
    {
      _id: '2',
      userId: { _id: 'user2', name: 'Mike Wilson', role: 'Driver' },
      type: 'toll',
      amount: 800,
      description: 'Highway toll charges',
      receiptUrl: '/receipts/toll-receipt-1.jpg',
      date: new Date('2024-09-14'),
      createdAt: new Date('2024-09-14'),
      updatedAt: new Date('2024-09-14')
    },
    {
      _id: '3',
      userId: { _id: 'user3', name: 'Sarah Johnson', role: 'Manager' },
      type: 'reimbursement',
      amount: 1200,
      description: 'Travel accommodation',
      receiptUrl: null,
      date: new Date('2024-09-13'),
      createdAt: new Date('2024-09-13'),
      updatedAt: new Date('2024-09-13')
    },
    {
      _id: '4',
      userId: { _id: 'user1', name: 'John Doe', role: 'Driver' },
      type: 'fuel',
      amount: 3200,
      description: 'Fuel for route Delhi-Bangalore',
      receiptUrl: '/receipts/fuel-receipt-2.jpg',
      date: new Date('2024-09-12'),
      createdAt: new Date('2024-09-12'),
      updatedAt: new Date('2024-09-12')
    },
    {
      _id: '5',
      userId: { _id: 'user4', name: 'David Brown', role: 'Driver' },
      type: 'toll',
      amount: 650,
      description: 'Express highway toll',
      receiptUrl: '/receipts/toll-receipt-2.jpg',
      date: new Date('2024-09-11'),
      createdAt: new Date('2024-09-11'),
      updatedAt: new Date('2024-09-11')
    }
  ]);

  const [formData, setFormData] = useState({
    type: 'fuel',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receiptFile: null
  });

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'receiptFile') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newExpense = {
      _id: Date.now().toString(),
      userId: { _id: 'current-user', name: 'Current User', role: 'Driver' },
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      receiptUrl: formData.receiptFile ? `/receipts/${formData.receiptFile.name}` : null,
      date: new Date(formData.date),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setExpenses(prev => [newExpense, ...prev]);
    setFormData({
      type: 'fuel',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      receiptFile: null
    });
    setActiveTab('list');
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'fuel': return 'bg-blue-100 text-blue-800';
      case 'toll': return 'bg-green-100 text-green-800';
      case 'reimbursement': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'fuel': return '⛽';
      case 'toll': return '🛣️';
      case 'reimbursement': return '💰';
      default: return '📄';
    }
  };

  const filteredExpenses = expenses.filter(expense => 
    filterType === 'all' || expense.type === filterType
  );

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
              <p className="text-gray-600 mt-2">Track and manage all expenses</p>
            </div>
            <button
              onClick={() => setActiveTab('create')}
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
                  ₹{expenses.filter(e => e.type === 'fuel').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
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
                <p className="text-gray-600 text-sm">Toll Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{expenses.filter(e => e.type === 'toll').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">🛣️</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Reimbursements</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{expenses.filter(e => e.type === 'reimbursement').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
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
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'list'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Expense List
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'create'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Add Expense
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
                        <option value="fuel">Fuel</option>
                        <option value="toll">Toll</option>
                        <option value="reimbursement">Reimbursement</option>
                      </select>
                    </div>
                  </div>

                  <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download size={16} />
                    Export
                  </button>
                </div>

                {/* Expense List */}
                <div className="space-y-4">
                  {filteredExpenses.map((expense) => (
                    <div key={expense._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{getTypeIcon(expense.type)}</div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(expense.type)}`}>
                                {expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}
                              </span>
                              <span className="text-lg font-semibold text-gray-900">
                                ₹{expense.amount.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-1">{expense.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <User size={12} />
                                {expense.userId.name} ({expense.userId.role})
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {expense.date.toLocaleDateString()}
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
                            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye size={16} />
                            </button>
                          )}
                          <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                          <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
              </div>
            )}

            {activeTab === 'create' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Expense</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <option value="fuel">Fuel</option>
                        <option value="toll">Toll</option>
                        <option value="reimbursement">Reimbursement</option>
                      </select>
                    </div>

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
                      className="bg-blue-600 !text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                      <Plus size={16} />
                      Add Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('list')}
                      className="text-gray-600 hover:text-gray-900 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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