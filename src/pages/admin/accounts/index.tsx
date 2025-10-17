import React from 'react';
import { 
  Truck,  DollarSign, Users, Gauge, 
  TrendingUp, AlertCircle, Calendar, FileText
} from 'lucide-react';

const Dashboard = () => {
  // Sample Data
  const truckData = [
    { id: 'TRK001', model: 'Volvo VNL', miles: 125450, lastService: '2024-09-15', status: 'Active', driver: 'John Smith' },
    { id: 'TRK002', model: 'Peterbilt 579', miles: 98750, lastService: '2024-09-10', status: 'Active', driver: 'Mike Wilson' },
    { id: 'TRK003', model: 'Kenworth T680', miles: 156890, lastService: '2024-09-12', status: 'Maintenance', driver: 'Unassigned' },
    { id: 'TRK004', model: 'Freightliner Cascadia', miles: 87650, lastService: '2024-09-18', status: 'Active', driver: 'Sarah Johnson' }
  ];

  const recentExpenses = [
    { type: 'Fuel', amount: 456.80, truck: 'TRK001', date: '2024-09-18' },
    { type: 'Maintenance', amount: 850.00, truck: 'TRK003', date: '2024-09-17' },
    { type: 'Fuel', amount: 513.45, truck: 'TRK002', date: '2024-09-17' },
    { type: 'Parts', amount: 245.90, truck: 'TRK001', date: '2024-09-16' }
  ];

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle = '', trend = null }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} className="mr-1" />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 flex-shrink-0`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fleet Management Dashboard</h1>
          <p className="text-gray-600">Overview of your trucking operations and financial metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Fleet Revenue" 
            value="$125,430" 
            icon={DollarSign} 
            color="green"
            trend={{ positive: true, value: "+12.5% vs last month" }}
          />
          <StatCard 
            title="Fuel Expenses" 
            value="$24,850" 
            icon={Gauge} 
            color="orange"
            subtitle="This month"
          />
          <StatCard 
            title="Active Trucks" 
            value="18/20" 
            icon={Truck} 
            color="blue"
            subtitle="2 in maintenance"
          />
          <StatCard 
            title="Total Employees" 
            value="32" 
            icon={Users} 
            color="purple"
            subtitle="24 active, 8 on leave"
          />
        </div>

        {/* Fleet Overview & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Fleet Status */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Fleet Overview</h3>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {truckData.slice(0, 4).map((truck) => (
                  <div key={truck.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{truck.id}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        truck.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {truck.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{truck.model}</p>
                    <p className="text-sm text-gray-600 mb-1">Driver: {truck.driver}</p>
                    <p className="text-xs text-gray-500">{truck.miles.toLocaleString()} miles</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentExpenses.map((expense, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{expense.type}</p>
                      <p className="text-xs text-gray-500">{expense.truck} • {expense.date}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600">-${expense.amount}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                View All Expenses
              </button>
            </div>
          </div>
        </div>


        {/* Alerts & Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="text-yellow-600 mr-3" size={20} />
              <div>
                <p className="text-sm font-medium text-yellow-800">TRK003 - Maintenance Required</p>
                <p className="text-xs text-yellow-600">Next service due in 2 days</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Calendar className="text-blue-600 mr-3" size={20} />
              <div>
                <p className="text-sm font-medium text-blue-800">Payroll Processing Due</p>
                <p className="text-xs text-blue-600">Process monthly payroll by Sept 25th</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <FileText className="text-red-600 mr-3" size={20} />
              <div>
                <p className="text-sm font-medium text-red-800">3 Overdue Invoices</p>
                <p className="text-xs text-red-600">Total amount: $8,950</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;