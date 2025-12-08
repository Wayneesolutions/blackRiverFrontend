import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Download, Upload, Filter, X, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function AccountsSetup() {
  const [activeTab, setActiveTab] = useState('chart-of-accounts');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState('');
  const [notification, setNotification] = useState(null);

  // Chart of Accounts Data
  const [accounts, setAccounts] = useState([
    { id: 1, number: '1000', name: 'Cash', type: 'Asset', balance: 50000 },
    { id: 2, number: '1100', name: 'Accounts Receivable', type: 'Asset', balance: 25000 },
    { id: 3, number: '1200', name: 'Inventory', type: 'Asset', balance: 15000 },
    { id: 4, number: '2000', name: 'Accounts Payable', type: 'Liability', balance: 10000 },
    { id: 5, number: '3000', name: 'Owner Equity', type: 'Equity', balance: 30000 },
    { id: 6, number: '4000', name: 'Service Revenue', type: 'Revenue', balance: 45000 },
    { id: 7, number: '5000', name: 'Fuel Expense', type: 'Expense', balance: 12000 },
    { id: 8, number: '5100', name: 'Maintenance Expense', type: 'Expense', balance: 8000 }
  ]);

  // Tax Codes Data
  const [taxCodes, setTaxCodes] = useState([
    { id: 1, code: 'GST', description: 'Goods and Services Tax', rate: 5, category: 'Sales Tax' },
    { id: 2, code: 'PST', description: 'Provincial Sales Tax', rate: 7, category: 'Sales Tax' },
    { id: 3, code: 'HST', description: 'Harmonized Sales Tax', rate: 13, category: 'Sales Tax' },
    { id: 4, code: 'IFTA-CA', description: 'IFTA California Fuel Tax', rate: 0.538, category: 'IFTA' },
    { id: 5, code: 'IFTA-TX', description: 'IFTA Texas Fuel Tax', rate: 0.20, category: 'IFTA' }
  ]);

  // Payment Methods Data
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, method: 'ACH', description: 'Direct Deposit - Bank Account', preferred: 'Driver' },
    { id: 2, method: 'Cheque', description: 'Check Payment - Series: CHK-2024', preferred: 'Vendor' },
    { id: 3, method: 'Wire Transfer', description: 'Wire Transfer', preferred: 'Carrier' },
    { id: 4, method: 'Virtual Card', description: 'Virtual Payment Card', preferred: 'Vendor' }
  ]);

  // SMS Billing Data
  const [smsBilling, setSmsBilling] = useState([
    { id: 1, timestamp: '2024-12-06 10:30', recipient: '+1234567890', content: 'Load pickup reminder...', cost: 0.05, account: 'SMS-001' },
    { id: 2, timestamp: '2024-12-06 09:15', recipient: '+1987654321', content: 'Delivery confirmation...', cost: 0.05, account: 'SMS-001' },
    { id: 3, timestamp: '2024-12-05 16:45', recipient: '+1122334455', content: 'Schedule update...', cost: 0.05, account: 'SMS-001' }
  ]);

  const [formData, setFormData] = useState({});

  const tabs = [
    { id: 'chart-of-accounts', label: 'Chart of Accounts' },
    { id: 'tax-codes', label: 'Tax Code Setup' },
    { id: 'payment-methods', label: 'Payment Methods' },
    { id: 'sms-billing', label: 'SMS Billing Tracking' }
  ];

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({});
    setModalType(activeTab);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setModalType(activeTab);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      switch (activeTab) {
        case 'chart-of-accounts':
          setAccounts(accounts.filter(a => a.id !== id));
          break;
        case 'tax-codes':
          setTaxCodes(taxCodes.filter(t => t.id !== id));
          break;
        case 'payment-methods':
          setPaymentMethods(paymentMethods.filter(p => p.id !== id));
          break;
        case 'sms-billing':
          setSmsBilling(smsBilling.filter(s => s.id !== id));
          break;
      }
      showNotification('Item deleted successfully', 'success');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    const newItem = {
      ...formData,
      id: editingItem ? editingItem.id : Date.now()
    };

    switch (activeTab) {
      case 'chart-of-accounts':
        if (editingItem) {
          setAccounts(accounts.map(a => a.id === editingItem.id ? newItem : a));
        } else {
          setAccounts([...accounts, newItem]);
        }
        break;
      case 'tax-codes':
        if (editingItem) {
          setTaxCodes(taxCodes.map(t => t.id === editingItem.id ? newItem : t));
        } else {
          setTaxCodes([...taxCodes, newItem]);
        }
        break;
      case 'payment-methods':
        if (editingItem) {
          setPaymentMethods(paymentMethods.map(p => p.id === editingItem.id ? newItem : p));
        } else {
          setPaymentMethods([...paymentMethods, newItem]);
        }
        break;
    }

    setShowModal(false);
    showNotification(editingItem ? 'Updated successfully' : 'Added successfully', 'success');
  };

  const handleExport = () => {
    let data;
    switch (activeTab) {
      case 'chart-of-accounts': data = accounts; break;
      case 'tax-codes': data = taxCodes; break;
      case 'payment-methods': data = paymentMethods; break;
      case 'sms-billing': data = smsBilling; break;
    }
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showNotification('Data exported successfully', 'success');
  };

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    switch (activeTab) {
      case 'chart-of-accounts':
        return accounts.filter(a => 
          a.name.toLowerCase().includes(term) || 
          a.number.includes(term) ||
          a.type.toLowerCase().includes(term)
        );
      case 'tax-codes':
        return taxCodes.filter(t => 
          t.code.toLowerCase().includes(term) || 
          t.description.toLowerCase().includes(term)
        );
      case 'payment-methods':
        return paymentMethods.filter(p => 
          p.method.toLowerCase().includes(term) || 
          p.description.toLowerCase().includes(term)
        );
      case 'sms-billing':
        return smsBilling.filter(s => 
          s.recipient.includes(term) || 
          s.content.toLowerCase().includes(term)
        );
      default:
        return [];
    }
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit' : 'Add New'} {activeTab.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {modalType === 'chart-of-accounts' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.number || ''}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                    <select
                      value={formData.type || ''}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Asset">Asset</option>
                      <option value="Liability">Liability</option>
                      <option value="Equity">Equity</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Expense">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
                    <input
                      type="number"
                      value={formData.balance || ''}
                      onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </>
              )}

              {modalType === 'tax-codes' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Code</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.rate || ''}
                      onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Sales Tax">Sales Tax</option>
                      <option value="IFTA">IFTA</option>
                      <option value="Payroll">Payroll</option>
                    </select>
                  </div>
                </>
              )}

              {modalType === 'payment-methods' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <input
                      type="text"
                      value={formData.method || ''}
                      onChange={(e) => setFormData({...formData, method: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred For</label>
                    <select
                      value={formData.preferred || ''}
                      onChange={(e) => setFormData({...formData, preferred: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Driver">Driver</option>
                      <option value="Vendor">Vendor</option>
                      <option value="Carrier">Carrier</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Accounts & Setup</h1>
          <p className="text-sm text-gray-600 mt-1">Backend control panel for the entire accounting system</p>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button onClick={handleExport} className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              {activeTab !== 'sms-billing' && (
                <button onClick={handleAdd} className="flex-1 sm:flex-none px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
              )}
            </div>
          </div>

          {/* Chart of Accounts */}
          {activeTab === 'chart-of-accounts' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData().map(account => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.type === 'Asset' ? 'bg-green-100 text-green-800' :
                          account.type === 'Liability' ? 'bg-red-100 text-red-800' :
                          account.type === 'Equity' ? 'bg-blue-100 text-blue-800' :
                          account.type === 'Revenue' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {account.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${account.balance.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(account)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(account.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tax Code Setup */}
          {activeTab === 'tax-codes' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData().map(tax => (
                    <tr key={tax.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tax.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{tax.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tax.rate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tax.category === 'IFTA' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {tax.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(tax)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(tax.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Methods */}
          {activeTab === 'payment-methods' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred For</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData().map(method => (
                    <tr key={method.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{method.method}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{method.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {method.preferred}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(method)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(method.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SMS Billing Tracking */}
          {activeTab === 'sms-billing' && (
            <div>
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Total SMS Cost (Last 30 Days)</p>
                    <p className="text-2xl font-bold text-blue-600">${(smsBilling.reduce((sum, sms) => sum + sms.cost, 0)).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Total Messages: {smsBilling.length}</p>
                    <p className="text-xs text-blue-600">Avg Cost per SMS: $0.05</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message Content</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Account</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData().map(sms => (
                      <tr key={sms.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sms.timestamp}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sms.recipient}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{sms.content}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${sms.cost.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sms.account}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {renderModal()}
    </div>
  );
}