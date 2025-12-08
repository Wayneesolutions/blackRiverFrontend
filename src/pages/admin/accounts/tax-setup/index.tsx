import React, { useState } from 'react';
import { Settings, RefreshCw, MapPin, Calculator, DollarSign, FileText, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

type TabType = 'ifta' | 'sales' | 'payroll' | 'vendor';

export default function TaxConfigurationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('ifta');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Sample data for IFTA Rate Tables
  const [iftaRates, setIftaRates] = useState([
    { id: 1, jurisdiction: 'California', rate: '0.533', effectiveDate: '2024-07-01' },
    { id: 2, jurisdiction: 'Texas', rate: '0.200', effectiveDate: '2024-01-01' },
    { id: 3, jurisdiction: 'Ontario', rate: '0.143', effectiveDate: '2024-01-01' }
  ]);

  // Sample data for Sales Tax Jurisdictions
  const [salesTaxRules, setSalesTaxRules] = useState([
    { id: 1, name: 'US Interstate', type: 'Destination', qbSync: true },
    { id: 2, name: 'Canada GST/HST', type: 'Origin', qbSync: true },
    { id: 3, name: 'California Local', type: 'Destination', qbSync: false }
  ]);

  // Sample data for Payroll Tax Formulas
  const [payrollFormulas, setPayrollFormulas] = useState([
    { id: 1, bracket: '$0 - $50,000', rate: '15%', classification: 'Employee' },
    { id: 2, bracket: '$50,001 - $100,000', rate: '20.5%', classification: 'Employee' },
    { id: 3, bracket: 'Owner-Operator', rate: '0%', classification: 'Owner-Operator' }
  ]);

  // Sample data for Vendor Tax Categories
  const [vendorTaxes, setVendorTaxes] = useState([
    { id: 1, taxName: 'ON HST 13%', rate: '13%', payableAccount: '2210', expenseAccount: '5100' },
    { id: 2, taxName: 'BC PST 7%', rate: '7%', payableAccount: '2220', expenseAccount: '5110' },
    { id: 3, taxName: 'US Sales Tax', rate: 'Variable', payableAccount: '2230', expenseAccount: '5120' }
  ]);

  const handleAutoUpdate = () => {
    alert('Fetching latest tax rates from external source...');
  };

  const handleAddNew = () => {
    setShowAddModal(true);
    setEditingItem(null);
  };

  const handleEdit = (item:any) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleDelete = (id:any) => {
    if (confirm('Are you sure you want to delete this item?')) {
      if (activeTab === 'ifta') setIftaRates(iftaRates.filter(i => i.id !== id));
      if (activeTab === 'sales') setSalesTaxRules(salesTaxRules.filter(i => i.id !== id));
      if (activeTab === 'payroll') setPayrollFormulas(payrollFormulas.filter(i => i.id !== id));
      if (activeTab === 'vendor') setVendorTaxes(vendorTaxes.filter(i => i.id !== id));
    }
  };

  const renderTable = () => {
    switch (activeTab) {
      case 'ifta':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Jurisdiction (State/Province)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fuel Tax Rate (per gallon/liter)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Effective Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {iftaRates.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">{item.jurisdiction}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">${item.rate}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.effectiveDate}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'sales':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Rule Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tax Type (Origin vs. Destination)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">QuickBooks Sync</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salesTaxRules.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.type}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.qbSync ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.qbSync ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'payroll':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Income Tax Bracket</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tax Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Classification</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollFormulas.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">{item.bracket}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.rate}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${item.classification === 'Employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {item.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'vendor':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b-2 border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tax Rate Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tax Payable Account</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tax Expense Account</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorTaxes.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">{item.taxName}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.rate}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.payableAccount}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.expenseAccount}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  const getTabInfo = () => {
    const info: Record<TabType, { title: string; description: string; icon: React.ReactElement }> = {
      ifta: {
        title: 'IFTA Rate Tables',
        description: 'Manages state/province-specific fuel tax rates',
        icon: <FileText className="w-5 h-5" />
      },
      sales: {
        title: 'Sales Tax Jurisdiction Setup',
        description: 'Defines interprovincial/interstate tax handling',
        icon: <MapPin className="w-5 h-5" />
      },
      payroll: {
        title: 'Payroll Tax Formulas',
        description: 'Manages formulas for employee tax deductions',
        icon: <Calculator className="w-5 h-5" />
      },
      vendor: {
        title: 'Vendor Tax Categories',
        description: 'Maps vendor taxes to expense accounts',
        icon: <DollarSign className="w-5 h-5" />
      }
    };
    return info[activeTab];
  };

  const tabInfo = getTabInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Tax Configuration Management</h1>
                <p className="text-slate-600 text-sm mt-1">Add, edit, and manage tax settings across all components</p>
              </div>
            </div>
            {activeTab === 'ifta' && (
              <button onClick={handleAutoUpdate} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                <RefreshCw className="w-4 h-4" />
                Auto-Update from Source
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button onClick={() => setActiveTab('ifta')} className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors flex-1 ${activeTab === 'ifta' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}>
              <FileText className="w-5 h-5" />
              <span className="hidden sm:inline">IFTA Rates</span>
            </button>
            <button onClick={() => setActiveTab('sales')} className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors flex-1 ${activeTab === 'sales' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}>
              <MapPin className="w-5 h-5" />
              <span className="hidden sm:inline">Sales Tax</span>
            </button>
            <button onClick={() => setActiveTab('payroll')} className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors flex-1 ${activeTab === 'payroll' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Calculator className="w-5 h-5" />
              <span className="hidden sm:inline">Payroll</span>
            </button>
            <button onClick={() => setActiveTab('vendor')} className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors flex-1 ${activeTab === 'vendor' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}>
              <DollarSign className="w-5 h-5" />
              <span className="hidden sm:inline">Vendor Tax</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {tabInfo.icon}
              <div>
                <h2 className="text-xl font-bold text-slate-800">{tabInfo.title}</h2>
                <p className="text-slate-600 text-sm">{tabInfo.description}</p>
              </div>
            </div>
            <button onClick={handleAddNew} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>

          {renderTable()}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  {editingItem ? 'Edit Entry' : 'Add New Entry'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form className="space-y-4">
                {activeTab === 'ifta' && (
                  <>
                    <input type="text" placeholder="Jurisdiction" className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                    <input type="text" placeholder="Tax Rate" className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                    <input type="date" className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                  </>
                )}
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Save className="w-4 h-4 inline mr-2" />
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}