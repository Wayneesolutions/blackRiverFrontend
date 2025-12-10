import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Download, Filter, X, Save } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import {
  getChartOfAccounts,
  createChartOfAccount,
  updateChartOfAccount,
  deleteChartOfAccount,
  getTaxCodes,
  createTaxCode,
  updateTaxCode,
  deleteTaxCode,
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getSmsBilling,
  getSmsBillingStats,
  type ChartOfAccount,
  type AccountTaxCode,
  type PaymentMethod,
  type SmsBilling
} from '../../../../axios/api/account.config';

interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const ToastNotificationComponent = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    info: <FaInfoCircle className="text-blue-500" size={24} />,
    warning: <FaExclamationCircle className="text-yellow-500" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`fixed top-4 right-4 flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg z-[10000] ${bgColors[notification.type]} min-w-[300px] max-w-[500px]`}>
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

type TabType = 'chart-of-accounts' | 'tax-codes' | 'payment-methods' | 'sms-billing';

type DataItem = ChartOfAccount | AccountTaxCode | PaymentMethod | SmsBilling;

type FormData = Partial<ChartOfAccount & AccountTaxCode & PaymentMethod>;

export default function AccountsSetup() {
  const [activeTab, setActiveTab] = useState<TabType>('chart-of-accounts');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [modalType, setModalType] = useState<TabType>('chart-of-accounts');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Data states
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [taxCodes, setTaxCodes] = useState<AccountTaxCode[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [smsBilling, setSmsBilling] = useState<SmsBilling[]>([]);
  const [smsStats, setSmsStats] = useState({
    totalCost: 0,
    totalMessages: 0,
    avgCostPerSms: 0
  });

  const [formData, setFormData] = useState<FormData>({});

  const tabs: { id: TabType; label: string }[] = [
    { id: 'chart-of-accounts', label: 'Chart of Accounts' },
    { id: 'tax-codes', label: 'Tax Code Setup' },
    { id: 'payment-methods', label: 'Payment Methods' },
    { id: 'sms-billing', label: 'SMS Billing Tracking' }
  ];

  // Toast notification helpers
  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now();
    setNotifications((prev: ToastNotification[]) => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev: ToastNotification[]) => prev.filter((n: ToastNotification) => n.id !== id));
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    if (window.confirm(message)) {
      onConfirm();
    }
  };

  // Fetch data functions
  const fetchChartOfAccounts = async () => {
    setLoading(true);
    try {
      const response = await getChartOfAccounts({ search: searchTerm || undefined });
      if (response?.success && Array.isArray(response.data)) {
        setAccounts(response.data);
      } else {
        showNotification('error', response?.message || 'Failed to fetch chart of accounts');
      }
    } catch (error: any) {
      console.error('Error fetching chart of accounts:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while fetching chart of accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxCodes = async () => {
    setLoading(true);
    try {
      const response = await getTaxCodes({ search: searchTerm || undefined });
      if (response?.success && Array.isArray(response.data)) {
        setTaxCodes(response.data);
      } else {
        showNotification('error', response?.message || 'Failed to fetch tax codes');
      }
    } catch (error: any) {
      console.error('Error fetching tax codes:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while fetching tax codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await getPaymentMethods({ search: searchTerm || undefined });
      if (response?.success && Array.isArray(response.data)) {
        setPaymentMethods(response.data);
      } else {
        showNotification('error', response?.message || 'Failed to fetch payment methods');
      }
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while fetching payment methods');
    } finally {
      setLoading(false);
    }
  };

  const fetchSmsBilling = async () => {
    setLoading(true);
    try {
      const response = await getSmsBilling({ search: searchTerm || undefined });
      if (response?.success && Array.isArray(response.data)) {
        const formatted = response.data.map((item: any) => ({
          ...item,
          timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(',', '') : ''
        }));
        setSmsBilling(formatted);
      } else {
        showNotification('error', response?.message || 'Failed to fetch SMS billing');
      }
    } catch (error: any) {
      console.error('Error fetching SMS billing:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while fetching SMS billing');
    } finally {
      setLoading(false);
    }
  };

  const fetchSmsStats = async () => {
    try {
      const response = await getSmsBillingStats();
      if (response?.success && response.data) {
        setSmsStats({
          totalCost: response.data.totalCost || 0,
          totalMessages: response.data.totalMessages || 0,
          avgCostPerSms: response.data.avgCostPerSms || 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching SMS stats:', error);
    }
  };

  // Load data on mount and tab/search change
  useEffect(() => {
    if (activeTab === 'chart-of-accounts') {
      fetchChartOfAccounts();
    } else if (activeTab === 'tax-codes') {
      fetchTaxCodes();
    } else if (activeTab === 'payment-methods') {
      fetchPaymentMethods();
    } else if (activeTab === 'sms-billing') {
      fetchSmsBilling();
      fetchSmsStats();
    }
  }, [activeTab, searchTerm]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({});
    setModalType(activeTab);
    setShowModal(true);
  };

  const handleEdit = (item: DataItem) => {
    setEditingItem(item);
    setFormData(item as FormData);
    setModalType(activeTab);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    confirmAction('Are you sure you want to delete this item?', async () => {
      try {
        let response;
        if (activeTab === 'chart-of-accounts') {
          response = await deleteChartOfAccount(id);
          if (response?.success) {
            await fetchChartOfAccounts();
            showNotification('success', 'Chart of account deleted successfully');
          }
        } else if (activeTab === 'tax-codes') {
          response = await deleteTaxCode(id);
          if (response?.success) {
            await fetchTaxCodes();
            showNotification('success', 'Tax code deleted successfully');
          }
        } else if (activeTab === 'payment-methods') {
          response = await deletePaymentMethod(id);
          if (response?.success) {
            await fetchPaymentMethods();
            showNotification('success', 'Payment method deleted successfully');
          }
        }

        if (!response?.success) {
          showNotification('error', response?.message || 'Failed to delete item');
        }
      } catch (error: any) {
        console.error('Error deleting item:', error);
        showNotification('error', error?.response?.data?.message || 'An error occurred while deleting item');
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (activeTab === 'chart-of-accounts') {
        const data = {
          number: formData.number || '',
          name: formData.name || '',
          type: formData.type as 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense',
          balance: formData.balance || 0
        };
        
        response = editingItem?._id
          ? await updateChartOfAccount(editingItem._id, data)
          : await createChartOfAccount(data);
        
        if (response?.success) {
          setShowModal(false);
          await fetchChartOfAccounts();
          showNotification('success', editingItem?._id ? 'Chart of account updated successfully' : 'Chart of account created successfully');
        } else {
          showNotification('error', response?.message || 'Failed to save chart of account');
        }
      } else if (activeTab === 'tax-codes') {
        const data = {
          code: formData.code || '',
          description: formData.description || '',
          rate: formData.rate || 0,
          category: formData.category as 'Sales Tax' | 'IFTA' | 'Payroll'
        };
        
        response = editingItem?._id
          ? await updateTaxCode(editingItem._id, data)
          : await createTaxCode(data);
        
        if (response?.success) {
          setShowModal(false);
          await fetchTaxCodes();
          showNotification('success', editingItem?._id ? 'Tax code updated successfully' : 'Tax code created successfully');
        } else {
          showNotification('error', response?.message || 'Failed to save tax code');
        }
      } else if (activeTab === 'payment-methods') {
        const data = {
          method: formData.method || '',
          description: formData.description || '',
          preferred: formData.preferred as 'Driver' | 'Vendor' | 'Carrier'
        };
        
        response = editingItem?._id
          ? await updatePaymentMethod(editingItem._id, data)
          : await createPaymentMethod(data);
        
        if (response?.success) {
          setShowModal(false);
          await fetchPaymentMethods();
          showNotification('success', editingItem?._id ? 'Payment method updated successfully' : 'Payment method created successfully');
        } else {
          showNotification('error', response?.message || 'Failed to save payment method');
        }
      }
    } catch (error: any) {
      console.error('Error saving item:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while saving item');
    }
  };

  const handleExport = () => {
    let data: DataItem[];
    switch (activeTab) {
      case 'chart-of-accounts': data = accounts; break;
      case 'tax-codes': data = taxCodes; break;
      case 'payment-methods': data = paymentMethods; break;
      case 'sms-billing': data = smsBilling; break;
      default: data = [];
    }
    
    if (data.length === 0) {
      showNotification('error', 'No data to export');
      return;
    }
    
    const csv = [
      Object.keys(data[0]).filter(key => key !== '_id' && key !== '__v').join(','),
      ...data.map(row => {
        const obj = row as any;
        return Object.keys(obj)
          .filter(key => key !== '_id' && key !== '__v')
          .map(key => {
            const value = obj[key];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          })
          .join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showNotification('success', 'Data exported successfully');
  };

  const filteredData = (): DataItem[] => {
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
          s.content.toLowerCase().includes(term) ||
          s.account.toLowerCase().includes(term)
        );
      default:
        return [];
    }
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
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
                      rows={3}
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
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[10000] space-y-2">
        {notifications.map(notification => (
          <ToastNotificationComponent
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>

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
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : filteredData().length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No accounts found</td>
                    </tr>
                  ) : (
                    (filteredData() as ChartOfAccount[]).map(account => (
                      <tr key={account._id || account.id} className="hover:bg-gray-50">
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
                            <button onClick={() => handleDelete(account._id || account.id?.toString() || '')} className="p-1 text-red-600 hover:bg-red-50 rounded">
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
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : filteredData().length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No tax codes found</td>
                    </tr>
                  ) : (
                    (filteredData() as AccountTaxCode[]).map(tax => (
                      <tr key={tax._id || tax.id} className="hover:bg-gray-50">
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
                            <button onClick={() => handleDelete(tax._id || tax.id?.toString() || '')} className="p-1 text-red-600 hover:bg-red-50 rounded">
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
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : filteredData().length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No payment methods found</td>
                    </tr>
                  ) : (
                    (filteredData() as PaymentMethod[]).map(method => (
                      <tr key={method._id || method.id} className="hover:bg-gray-50">
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
                            <button onClick={() => handleDelete(method._id || method.id?.toString() || '')} className="p-1 text-red-600 hover:bg-red-50 rounded">
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
          )}

          {/* SMS Billing Tracking */}
          {activeTab === 'sms-billing' && (
            <div>
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Total SMS Cost (Last 30 Days)</p>
                    <p className="text-2xl font-bold text-blue-600">${smsStats.totalCost.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Total Messages: {smsStats.totalMessages}</p>
                    <p className="text-xs text-blue-600">Avg Cost per SMS: ${smsStats.avgCostPerSms.toFixed(2)}</p>
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
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                      </tr>
                    ) : filteredData().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No SMS billing records found</td>
                      </tr>
                    ) : (
                      (filteredData() as SmsBilling[]).map(sms => (
                        <tr key={sms._id || sms.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sms.timestamp}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sms.recipient}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{sms.content}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${sms.cost.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sms.account}</td>
                        </tr>
                      ))
                    )}
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
