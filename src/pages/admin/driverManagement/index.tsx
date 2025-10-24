import { 
  Users, 
  Truck, 
  Shield, 
  Star
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  getDriverStats, 
  getLoadStats, 
  getSafetyStats, 
  getDriverActivities 
} from '../../../axios/api/driverDashboard';

interface DriverStats {
  totalDrivers: number;
  activeDrivers: number;
  totalDriversChange: number;
  activeDriversChange: number;
}

interface LoadStats {
  totalLoads: number;
  totalLoadsChange: number;
}

interface SafetyStats {
  avgSafetyScore: number;
  safetyScoreChange: number;
}

interface DriverActivity {
  _id: string;
  driver: {
    name: string;
    email: string;
    internalId: string;
  };
  load?: {
    details: {
      internalId: string;
    };
  };
  activityType: 'load_started' | 'load_completed';
  location: {
    address: string;
    latitude: string;
    longitude: string;
  };
  timestamp: string;
}

const index = () => {
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
  const [loadStats, setLoadStats] = useState<LoadStats | null>(null);
  const [safetyStats, setSafetyStats] = useState<SafetyStats | null>(null);
  const [activities, setActivities] = useState<DriverActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [driverStatsRes, loadStatsRes, safetyStatsRes, activitiesRes] = await Promise.all([
        getDriverStats(),
        getLoadStats(),
        getSafetyStats(),
        getDriverActivities()
      ]);

      if (driverStatsRes.success) {
        setDriverStats(driverStatsRes.data);
      }
      
      if (loadStatsRes.success) {
        setLoadStats(loadStatsRes.data);
      }
      
      if (safetyStatsRes.success) {
        setSafetyStats(safetyStatsRes.data);
      }
      
      if (activitiesRes.success) {
        setActivities(activitiesRes.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const getActivityMessage = (activity: DriverActivity) => {
    const loadId = activity.load?.details?.internalId || 'Unknown Load';
    if (activity.activityType === 'load_started') {
      return `Started Load #${loadId}`;
    } else if (activity.activityType === 'load_completed') {
      return `Completed Load #${loadId}`;
    }
    return 'Driver Activity';
  };

  if (loading) {
    return (
      <div className="space-y-6 bg-gray-50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
          <div className="p-6 border-b border-gray-100">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
     <div className="space-y-6 bg-gray-50 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {driverStats?.totalDrivers || 0}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${(driverStats?.totalDriversChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {driverStats?.totalDriversChange ? (driverStats.totalDriversChange >= 0 ? '+' : '') + driverStats.totalDriversChange + '%' : '0%'}
            </span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Drivers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {driverStats?.activeDrivers || 0}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${(driverStats?.activeDriversChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {driverStats?.activeDriversChange ? (driverStats.activeDriversChange >= 0 ? '+' : '') + driverStats.activeDriversChange + '%' : '0%'}
            </span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Avg Safety Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {safetyStats?.avgSafetyScore || 0}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${(safetyStats?.safetyScoreChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {safetyStats?.safetyScoreChange ? (safetyStats.safetyScoreChange >= 0 ? '+' : '') + safetyStats.safetyScoreChange + '%' : '0%'}
            </span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Loads</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loadStats?.totalLoads || 0}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${(loadStats?.totalLoadsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {loadStats?.totalLoadsChange ? (loadStats.totalLoadsChange >= 0 ? '+' : '') + loadStats.totalLoadsChange + '%' : '0%'}
            </span>
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
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity._id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${activity.activityType === 'load_completed' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.driver.name}</p>
                      <p className="text-sm text-gray-500">{getActivityMessage(activity)}</p>
                      {activity.location?.address && (
                        <p className="text-xs text-gray-400">{activity.location.address}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent driver activities found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default index