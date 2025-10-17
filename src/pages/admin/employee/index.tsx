import { Users, UserCheck, TrendingUp, Briefcase } from 'lucide-react';

const EmployeeDashboard = () => {


  const stats = [
    {
      title: 'Total Employees',
      value: '156',
      change: '+8%',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Employees',
      value: '142',
      change: '+3%',
      icon: UserCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Avg Performance',
      value: '87.5',
      change: '+4.2',
      icon: TrendingUp,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Open Positions',
      value: '12',
      change: '+2',
      icon: Briefcase,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    }
  ];

  const recentActivity = [
    {
      name: 'Alex Martinez',
      action: 'Completed onboarding',
      time: '1 hour ago',
      status: 'success'
    },
    {
      name: 'Emma Wilson',
      action: 'Document submission pending',
      time: '2 hours ago',
      status: 'warning'
    },
    {
      name: 'James Brown',
      action: 'Performance review completed',
      time: '4 hours ago',
      status: 'success'
    },
    {
      name: 'Sophia Davis',
      action: 'Leave request approved',
      time: '5 hours ago',
      status: 'info'
    }
  ];

  const roleDistribution = [
    { role: 'Dispatchers', count: 24, percentage: 15 },
    { role: 'Fleet Managers', count: 18, percentage: 12 },
    { role: 'Operations Staff', count: 45, percentage: 29 },
    { role: 'Administrative', count: 32, percentage: 21 },
    { role: 'Maintenance Crew', count: 28, percentage: 18 },
    { role: 'Safety Officers', count: 9, percentage: 5 }
  ];



  return (
    <div className="flex bg-gray-50">
    

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
      

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-green-600 text-sm font-medium">
                  {stat.change} vs last month
                </p>
              </div>
            ))}
          </div>

          {/* Role Distribution */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Role Distribution</h3>
              <div className="space-y-4">
                {roleDistribution.map((role, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">{role.role}</span>
                      <span className="text-sm text-gray-500">{role.count} employees ({role.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${role.percentage * 3}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

       
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Employee Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-800">{activity.name}</p>
                      <p className="text-sm text-gray-500">{activity.action}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;