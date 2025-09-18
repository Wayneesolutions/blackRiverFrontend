import { 
  Users, 
  Truck, 
  Shield, 
  Star
} from 'lucide-react';

const index = () => {

  return (
     <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">248</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Drivers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">186</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+5%</span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Avg Safety Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">91.2</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+2.1</span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Loads</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">1,247</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+18%</span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Driver Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { driver: 'John Smith', action: 'Completed Load #1247', time: '2 hours ago', status: 'success' },
              { driver: 'Sarah Johnson', action: 'Started new shift', time: '3 hours ago', status: 'info' },
              { driver: 'Mike Davis', action: 'Vehicle inspection completed', time: '5 hours ago', status: 'success' },
              { driver: 'Lisa Chen', action: 'Hours of service updated', time: '6 hours ago', status: 'info' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.driver}</p>
                    <p className="text-sm text-gray-500">{activity.action}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default index