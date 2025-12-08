import  { useState } from 'react';
import { Search, Plus, Edit, Trash2, Download, Filter, DollarSign, TrendingDown, TrendingUp, MapPin, FileText, Users } from 'lucide-react';

export default function SettlementSystem() {
  const [activeTab, setActiveTab] = useState('driver-settlements');
  const [searchTerm, setSearchTerm] = useState('');

  // Driver/O-O Settlements Data
  const [settlements, ] = useState([
    { id: 1, settlementId: 'STL-2024-001', payPeriod: 'Dec 1-15, 2024', payee: 'John Smith', status: 'Paid', grossPay: 4500, deductions: 450, netPay: 4050 },
    { id: 2, settlementId: 'STL-2024-002', payPeriod: 'Dec 1-15, 2024', payee: 'Mike Johnson', status: 'Pending', grossPay: 5200, deductions: 520, netPay: 4680 },
    { id: 3, settlementId: 'STL-2024-003', payPeriod: 'Dec 1-15, 2024', payee: 'Sarah Williams', status: 'Processing', grossPay: 3800, deductions: 380, netPay: 3420 },
    { id: 4, settlementId: 'STL-2024-004', payPeriod: 'Dec 1-15, 2024', payee: 'David Brown', status: 'Paid', grossPay: 4900, deductions: 490, netPay: 4410 }
  ]);

  // Deductions & Additions Data
  const [deductions,] = useState([
    { id: 1, name: 'Escrow Contribution', type: 'Deduction', recurrence: 'Weekly', amount: 150, assignedTo: 'John Smith' },
    { id: 2, name: 'Safety Bonus', type: 'Addition', recurrence: 'Monthly', amount: 200, assignedTo: 'Mike Johnson' },
    { id: 3, name: 'Fuel Advance', type: 'Deduction', recurrence: 'One-time', amount: 500, assignedTo: 'Sarah Williams' },
    { id: 4, name: 'Performance Bonus', type: 'Addition', recurrence: 'Bi-weekly', amount: 300, assignedTo: 'David Brown' }
  ]);

  // Miles Tracking Data
  const [milesTracking, ] = useState([
    { id: 1, date: '2024-12-05', vehicle: 'TRK-101', driver: 'John Smith', state: 'CA', totalMiles: 450, loadedMiles: 420, emptyMiles: 30, iftaMiles: 450 },
    { id: 2, date: '2024-12-05', vehicle: 'TRK-102', driver: 'Mike Johnson', state: 'TX', totalMiles: 520, loadedMiles: 500, emptyMiles: 20, iftaMiles: 520 },
    { id: 3, date: '2024-12-04', vehicle: 'TRK-103', driver: 'Sarah Williams', state: 'NV', totalMiles: 380, loadedMiles: 350, emptyMiles: 30, iftaMiles: 380 },
    { id: 4, date: '2024-12-04', vehicle: 'TRK-101', driver: 'John Smith', state: 'AZ', totalMiles: 290, loadedMiles: 280, emptyMiles: 10, iftaMiles: 290 }
  ]);

  const tabs = [
    { id: 'driver-settlements', label: 'Driver/O-O Settlements', icon: Users },
    { id: 'deductions-additions', label: 'Deductions & Additions', icon: TrendingDown },
    { id: 'miles-tracking', label: 'Miles Tracking & Reporting', icon: MapPin }
  ];

  // Summary Cards Data
  const summaryCards = [
    { title: 'Total Settlements', value: '$16,560', change: '+12.5%', icon: DollarSign, color: 'blue' },
    { title: 'Pending Payments', value: '$4,680', change: '3 pending', icon: FileText, color: 'orange' },
    { title: 'Total Miles (Week)', value: '1,640', change: '+8.3%', icon: MapPin, color: 'green' },
    { title: 'Active Drivers', value: '4', change: '100% active', icon: Users, color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settlement Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage driver settlements, deductions/additions, and miles tracking for IFTA reporting
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Settlement Generation
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-1 border-b border-gray-200">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
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
                  <span className="text-sm text-green-600 font-medium">{card.change}</span>
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
                Export
              </button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>
          </div>

          {/* Driver/O-O Settlements List */}
          {activeTab === 'driver-settlements' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Settlement ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settlements.map(settlement => (
                    <tr key={settlement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{settlement.settlementId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.payPeriod}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{settlement.payee}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          settlement.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          settlement.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {settlement.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${settlement.grossPay.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-${settlement.deductions.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${settlement.netPay.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Download">
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

          {/* Deductions & Additions Manager */}
          {activeTab === 'deductions-additions' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recurrence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deductions.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                          item.type === 'Addition' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.type === 'Addition' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.recurrence}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${item.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.assignedTo}</td>
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

          {/* Miles Tracking & Reporting */}
          {activeTab === 'miles-tracking' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State/Province</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Miles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loaded Miles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empty Miles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IFTA Miles</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {milesTracking.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{record.vehicle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.driver}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {record.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{record.totalMiles}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{record.loadedMiles}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{record.emptyMiles}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{record.iftaMiles}</td>
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