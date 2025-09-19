import React from 'react';
import { 
  Truck, 
  Wrench, 
  Calendar, 
  Package, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  // Mock data - replace with real data from your API
  const dashboardStats = {
    totalVehicles: 45,
    activeWorkOrders: 12,
    pendingMaintenance: 8,
    completedThisMonth: 23,
    totalCosts: 15420,
    overdueMaintenance: 3
  };

  const recentWorkOrders = [
    { id: 'WO-001', vehicle: 'Truck-A001', issue: 'Oil Change', status: 'In Progress', date: '2024-09-18' },
    { id: 'WO-002', vehicle: 'Trailer-B002', issue: 'Tire Rotation', status: 'Open', date: '2024-09-17' },
    { id: 'WO-003', vehicle: 'Truck-A003', issue: 'Brake Inspection', status: 'Completed', date: '2024-09-16' },
    { id: 'WO-004', vehicle: 'Truck-A004', issue: 'Safety Check', status: 'Open', date: '2024-09-15' }
  ];

  const upcomingMaintenance = [
    { vehicle: 'Truck-A005', service: 'Oil Change', dueDate: '2024-09-25', daysLeft: 6 },
    { vehicle: 'Trailer-B003', service: 'Safety Inspection', dueDate: '2024-09-28', daysLeft: 9 },
    { vehicle: 'Truck-A006', service: 'Tire Rotation', dueDate: '2024-10-02', daysLeft: 13 },
    { vehicle: 'Truck-A007', service: 'General Maintenance', dueDate: '2024-10-05', daysLeft: 16 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'In Progress': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'Completed': return 'text-green-700 bg-green-100 border-green-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getPriorityColor = (days: number) => {
    if (days <= 7) return 'text-red-700 bg-red-100 border-red-200';
    if (days <= 14) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    return 'text-green-700 bg-green-100 border-green-200';
  };

  return (
    <div className="p-6 space-y-6  min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your fleet maintenance operations</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Vehicles</h3>
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboardStats.totalVehicles}</div>
          <p className="text-sm text-gray-500 mt-1">Active fleet vehicles</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Active Work Orders</h3>
            <Wrench className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboardStats.activeWorkOrders}</div>
          <p className="text-sm text-gray-500 mt-1">Currently in progress</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Pending Maintenance</h3>
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboardStats.pendingMaintenance}</div>
          <p className="text-sm text-gray-500 mt-1">Scheduled services</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Monthly Costs</h3>
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">${dashboardStats.totalCosts.toLocaleString()}</div>
          <p className="text-sm text-gray-500 mt-1">This month's expenses</p>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <h3 className="text-sm font-medium text-red-800">Overdue Maintenance</h3>
          </div>
          <div className="text-3xl font-bold text-red-600">{dashboardStats.overdueMaintenance}</div>
          <p className="text-sm text-red-600 mt-1">Vehicles require immediate attention</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-sm font-medium text-green-800">Completed This Month</h3>
          </div>
          <div className="text-3xl font-bold text-green-600">{dashboardStats.completedThisMonth}</div>
          <p className="text-sm text-green-600 mt-1">Work orders completed</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-sm font-medium text-blue-800">Efficiency Rate</h3>
          </div>
          <div className="text-3xl font-bold text-blue-600">92%</div>
          <p className="text-sm text-blue-600 mt-1">On-time completion rate</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Work Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              Recent Work Orders
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentWorkOrders.map((order) => (
                <div key={order.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{order.id}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{order.vehicle} - {order.issue}</p>
                  <p className="text-xs text-gray-500">{order.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Maintenance
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingMaintenance.map((maintenance, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{maintenance.vehicle}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(maintenance.daysLeft)}`}>
                      {maintenance.daysLeft} days
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{maintenance.service}</p>
                  <p className="text-xs text-gray-500">Due: {maintenance.dueDate}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

   
    </div>
  );
};

export default Dashboard;