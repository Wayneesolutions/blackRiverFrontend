import React, { useState } from 'react';
import { 
  DollarSign, 
  Building2, 
  UserCheck,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Package
} from 'lucide-react';

const SuperAdminOverview = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  const stats = [
    {
      title: 'Total Customers',
      value: '2,847',
      change: '+15.2%',
      trend: 'up',
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Subscriptions',
      value: '2,104',
      change: '+8.7%',
      trend: 'up',
      icon: UserCheck,
      color: 'bg-green-500'
    },
    {
      title: 'Monthly Revenue',
      value: '$847,230',
      change: '+22.1%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-purple-500'
    },
    {
      title: 'Dashboard Instances',
      value: '3,156',
      change: '+12.8%',
      trend: 'up',
      icon: Package,
      color: 'bg-orange-500'
    }
  ];

  const recentCustomers = [
    { 
      id: 'CUST-001', 
      company: 'Global Logistics Corp', 
      plan: 'Enterprise', 
      status: 'Active', 
      joined: '2024-08-10',
      revenue: '$2,500/mo',
      instances: 12
    },
    { 
      id: 'CUST-002', 
      company: 'Urban Delivery Services', 
      plan: 'Professional', 
      status: 'Active', 
      joined: '2024-08-12',
      revenue: '$899/mo',
      instances: 3
    },
    { 
      id: 'CUST-003', 
      company: 'FastTrack Shipping', 
      plan: 'Starter', 
      status: 'Trial', 
      joined: '2024-08-14',
      revenue: '$199/mo',
      instances: 1
    },
    { 
      id: 'CUST-004', 
      company: 'Metro Transport Ltd', 
      plan: 'Professional', 
      status: 'Suspended', 
      joined: '2024-07-28',
      revenue: '$899/mo',
      instances: 2
    },
    { 
      id: 'CUST-005', 
      company: 'QuickMove Solutions', 
      plan: 'Enterprise', 
      status: 'Active', 
      joined: '2024-08-13',
      revenue: '$2,500/mo',
      instances: 8
    }
  ];

  const getStatusColor = (status:any) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Trial': return 'bg-blue-100 text-blue-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan:any) => {
    switch(plan) {
      case 'Enterprise': return 'bg-purple-100 text-purple-800';
      case 'Professional': return 'bg-blue-100 text-blue-800';
      case 'Starter': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  return (
    <div className="min-h-screen">
   

      <div className="p-6">
        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowDown className="w-4 h-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  <p className="text-gray-600 text-sm mt-1">{stat.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Customers */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Customers</h2>
                <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                  View All Customers
                </button>
              </div>
            </div>
            <div className="overflow-hidden">
              {recentCustomers.map((customer) => (
                <div key={customer.id} className="px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Building2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{customer.company}</h3>
                        <p className="text-gray-600 text-sm">{customer.id} • Joined {customer.joined}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{customer.revenue}</p>
                        <p className="text-xs text-gray-500">{customer.instances} instances</p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanColor(customer.plan)}`}>
                          {customer.plan}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {customer.status}
                        </span>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Actions</h2>
              <div className="space-y-3">
                <button className="w-full !mb-3 bg-purple-600 hover:bg-purple-700 !text-white py-3 px-4 rounded-lg font-medium transition-colors">
                  Add New Customer
                </button>
                <button className="w-full !mb-3 bg-gray-100 hover:bg-gray-200 !text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors">
                  System Maintenance
                </button>
                <button className="w-full !mb-3 bg-gray-100 hover:bg-gray-200 !text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors">
                  Generate Reports
                </button>
              </div>
            </div>

       
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOverview;