import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Download, Filter, Wrench, DollarSign, Package, TrendingUp, Calendar, FileText, AlertCircle } from 'lucide-react';

export default function FleetMaintenanceFinance() {
  const [activeTab, setActiveTab] = useState('expense-summary');
  const [searchTerm, setSearchTerm] = useState('');

  // Maintenance Expense Summary Data
  const [expenseSummary, ] = useState([
    { id: 1, vehicle: 'TRK-101', totalExpense: 12500, costPerMile: 0.45, breakdown: 'Tires: $3500, Engine: $6000, PM: $3000', topExpenses: ['Tires', 'Engine', 'PM'] },
    { id: 2, vehicle: 'TRK-102', totalExpense: 8900, costPerMile: 0.38, breakdown: 'Brakes: $2400, PM: $2500, Oil: $4000', topExpenses: ['Oil', 'Brakes', 'PM'] },
    { id: 3, vehicle: 'TRK-103', totalExpense: 15200, costPerMile: 0.52, breakdown: 'Engine: $8000, Tires: $4200, PM: $3000', topExpenses: ['Engine', 'Tires', 'PM'] },
    { id: 4, vehicle: 'TRK-104', totalExpense: 6800, costPerMile: 0.31, breakdown: 'PM: $2800, Brakes: $2000, Tires: $2000', topExpenses: ['PM', 'Brakes', 'Tires'] }
  ]);

  // Parts Cost Log Data
  const [partsCostLog, ] = useState([
    { id: 1, partNumber: 'BRK-2024-001', description: 'Brake Pads - Front', unitCost: 245.00, dateOfUse: '2024-12-01', vehicle: 'TRK-101', quantity: 2 },
    { id: 2, partNumber: 'TIR-2024-045', description: 'Michelin Tire 11R22.5', unitCost: 450.00, dateOfUse: '2024-12-03', vehicle: 'TRK-103', quantity: 4 },
    { id: 3, partNumber: 'OIL-2024-128', description: 'Engine Oil Filter', unitCost: 28.50, dateOfUse: '2024-12-04', vehicle: 'TRK-102', quantity: 1 },
    { id: 4, partNumber: 'ENG-2024-012', description: 'Alternator Assembly', unitCost: 385.00, dateOfUse: '2024-12-05', vehicle: 'TRK-101', quantity: 1 }
  ]);

  // Shop Labor Rate Setup Data
  const [laborRates, ] = useState([
    { id: 1, rateType: 'Internal Labor', rate: 85.00, description: 'In-house mechanic hourly rate', isActive: true },
    { id: 2, rateType: 'External Shop - Premium', rate: 125.00, description: 'Authorized dealer service rate', isActive: true },
    { id: 3, rateType: 'External Shop - Standard', rate: 95.00, description: 'Independent shop rate', isActive: true },
    { id: 4, rateType: 'Emergency Service', rate: 150.00, description: 'After-hours/emergency rate', isActive: true }
  ]);

  // Maintenance Plan Financials Data
  const [maintenancePlans, ] = useState([
    { id: 1, planName: 'Quarterly PM', vehicle: 'TRK-101', plannedCost: 3000, actualCost: 3200, variance: 200, status: 'Completed' },
    { id: 2, planName: 'Annual DOT Inspection', vehicle: 'TRK-102', plannedCost: 850, actualCost: 820, variance: -30, status: 'Completed' },
    { id: 3, planName: 'Quarterly PM', vehicle: 'TRK-103', plannedCost: 3000, actualCost: 0, variance: 0, status: 'Scheduled' },
    { id: 4, planName: '6-Month Service', vehicle: 'TRK-104', plannedCost: 1500, actualCost: 1650, variance: 150, status: 'In Progress' }
  ]);

  const tabs = [
    { id: 'expense-summary', label: 'Maintenance Expense Summary', icon: TrendingUp },
    { id: 'parts-cost-log', label: 'Parts Cost Log', icon: Package },
    { id: 'labor-rates', label: 'Shop Labor Rate Setup', icon: Wrench },
    { id: 'plan-financials', label: 'Maintenance Plan Financials', icon: Calendar }
  ];

  // Summary Cards Data
  const summaryCards = [
    { title: 'Total Maintenance Cost', value: '$43,400', change: '+5.2% vs last month', icon: DollarSign, color: 'blue' },
    { title: 'Avg Cost Per Mile', value: '$0.42', change: 'Fleet Average', icon: TrendingUp, color: 'green' },
    { title: 'Parts Inventory Value', value: '$18,235', change: '42 items in stock', icon: Package, color: 'purple' },
    { title: 'Pending PM Plans', value: '3', change: 'Due this month', icon: AlertCircle, color: 'orange' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fleet & Maintenance Finance</h1>
              <p className="text-sm text-gray-600 mt-1">
                Financial reporting and tracking for maintenance operations, parts costs, and service expenses
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Maintenance Entry
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                    <Icon className={`w-6 h-6 text-${card.color}-600`} />
                  </div>
                  <span className="text-sm text-gray-600 font-medium">{card.change}</span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Maintenance Expense Summary */}
          {activeTab === 'expense-summary' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Maintenance Expense</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost per Mile/KM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakdown by Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top 5 Expense Types</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenseSummary.map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{expense.vehicle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${expense.totalExpense.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${expense.costPerMile}/mi</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">{expense.breakdown}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {expense.topExpenses.map((type, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Download Report">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Parts Cost Log */}
          {activeTab === 'parts-cost-log' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Use</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {partsCostLog.map(part => (
                    <tr key={part.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{part.partNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{part.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${part.unitCost.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${(part.unitCost * part.quantity).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.dateOfUse}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {part.vehicle}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded">
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

          {/* Shop Labor Rate Setup */}
          {activeTab === 'labor-rates' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (per hour)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {laborRates.map(rate => (
                    <tr key={rate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rate.rateType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rate.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${rate.rate.toFixed(2)}/hr</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rate.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded">
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

          {/* Maintenance Plan Financials */}
          {activeTab === 'plan-financials' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {maintenancePlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{plan.planName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{plan.vehicle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${plan.plannedCost.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {plan.actualCost > 0 ? `$${plan.actualCost.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {plan.variance !== 0 ? (
                          <span className={`font-semibold ${plan.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {plan.variance > 0 ? '+' : ''}${plan.variance.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          plan.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          plan.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Report">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}