import { useState, useEffect } from 'react';
import {
  Truck,
  Wrench,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { DashboardStats, UpcomingOverdue, RecentWorkOrder, MonthlyCost } from "../../../axios/api/fleet.dashboard";

interface WorkOrder {
  id: string;
  vehicle: string;
  issue: string;
  status: string;
  date: string;
  estimatedCost?: number;
  assignedMechanic?: string;
}

interface MaintenanceItem {
  plateNumber: string;
  model: string;
  serviceType: string;
  status: string;
  dueDate: string;
  dueMileage: number | null;
  daysLeft?: number;
}

const Dashboard = () => {
  const sanitizeMessage = (message?: string | null) => {
    if (!message) return null;
    return message.toLowerCase().includes('no company assigned') ? null : message;
  };

  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalVehicles: 0,
    activeWorkOrders: 0,
    pendingMaintenance: 0,
    completedThisMonth: 0,
    totalCosts: 0,
    overdueMaintenance: 0,
    totalTrailers: 0,
    trailersInTransit: 0,
    trailersAvailable: 0,
    trailersMaintenance: 0,
    trailersAttached: 0,
    trailersUnattached: 0
  });
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrder[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<MaintenanceItem[]>([]);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userInfoReady, setUserInfoReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        setUserInfo(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
    } finally {
      setUserInfoReady(true);
    }
  }, []);

  useEffect(() => {
    if (!userInfoReady) {
      return;
    }

    const userRole = userInfo?.role || userInfo?.userData?.role;
    const userCompany = userInfo?.company || userInfo?.userData?.company;
    const isSuperadmin = userRole === 'superadmin';
    const isFleetManager = userRole === 'Fleet Maintenance Manager';
    const hasCompany = Boolean(userCompany);

    if (!isSuperadmin && !hasCompany && !isFleetManager) {
      setDashboardStats({
        totalVehicles: 0,
        activeWorkOrders: 0,
        pendingMaintenance: 0,
        completedThisMonth: 0,
        totalCosts: 0,
        overdueMaintenance: 0,
        totalTrailers: 0,
        trailersInTransit: 0,
        trailersAvailable: 0,
        trailersMaintenance: 0,
        trailersAttached: 0,
        trailersUnattached: 0
      });
      setRecentWorkOrders([]);
      setUpcomingMaintenance([]);
      setEmptyStateMessage(null);
      setLoading(false);
      return;
    }

    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfoReady, userInfo]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let aggregatedMessage: string | null = null;
      const [statsRes, upcomingRes, workOrderRes, costRes] = await Promise.all([
        DashboardStats(),
        UpcomingOverdue(),
        RecentWorkOrder(),
        MonthlyCost()
      ]);

      // Process Dashboard Stats
      if (statsRes?.success && statsRes?.data) {
        setDashboardStats(prev => ({
          ...prev,
          totalVehicles: statsRes.data.totalVehicles || 0,
          activeWorkOrders: statsRes.data.activeWorkOrders || 0,
          totalTrailers: statsRes.data.totalTrailers || 0,
          trailersInTransit: statsRes.data.trailersInTransit || 0,
          trailersAvailable: statsRes.data.trailersAvailable || 0,
          trailersMaintenance: statsRes.data.trailersMaintenance || 0,
          trailersAttached: statsRes.data.trailersAttached || 0,
          trailersUnattached: statsRes.data.trailersUnattached || 0
        }));
        if (statsRes?.message && statsRes?.requiresCompanySetup) {
          aggregatedMessage = sanitizeMessage(statsRes.message) ?? aggregatedMessage;
        }
      }

      if (statsRes?.success === false && statsRes?.message) {
        aggregatedMessage = sanitizeMessage(statsRes.message) ?? aggregatedMessage;
      }

      // Process Monthly Cost
      if (costRes?.success && costRes?.data) {
        setDashboardStats(prev => ({
          ...prev,
          totalCosts: costRes.data.totalMonthlyCost || 0
        }));
      }

      if (costRes?.success === false && costRes?.message) {
        aggregatedMessage = sanitizeMessage(costRes.message) ?? aggregatedMessage;
      }

      // Process Upcoming/Overdue Maintenance
      if (upcomingRes?.success && upcomingRes?.data) {
        const maintenanceData = upcomingRes.data || [];
        
        // Separate overdue and upcoming
        const overdue = maintenanceData.filter((item: any) => 
          item.daysLeft !== undefined && item.daysLeft < 0
        );
        const upcoming = maintenanceData.filter((item: any) => 
          item.daysLeft === undefined || item.daysLeft >= 0
        );

        setDashboardStats(prev => ({
          ...prev,
          overdueMaintenance: overdue.length,
          pendingMaintenance: upcoming.length
        }));
        
        setUpcomingMaintenance(upcoming);
      } else if (upcomingRes?.success === false && upcomingRes?.message) {
        setUpcomingMaintenance([]);
        aggregatedMessage = sanitizeMessage(upcomingRes.message) ?? aggregatedMessage;
      }

      // Process Recent Work Orders
      if (workOrderRes?.success && workOrderRes?.data) {
        const orders: WorkOrder[] = workOrderRes.data.map((order: any) => ({
          id: order._id,
          vehicle: `${order.vehicleId?.make || 'N/A'} ${order.vehicleId?.model || ''} (${order.vehicleId?.plateNumber || 'N/A'})`,
          issue: order.issue || 'No issue specified',
          status: order.status || 'unknown',
          date: new Date(order.createdAt).toLocaleDateString(),
          estimatedCost: order.estimatedCost,
          assignedMechanic: order.assignedMechanic
        }));
        setRecentWorkOrders(orders);

        // Calculate completed work orders
        const completed = orders.filter((o: WorkOrder) => o.status.toLowerCase() === 'completed');
        setDashboardStats(prev => ({
          ...prev,
          completedThisMonth: completed.length
        }));
      } else if (workOrderRes?.success === false && workOrderRes?.message) {
        setRecentWorkOrders([]);
        aggregatedMessage = sanitizeMessage(workOrderRes.message) ?? aggregatedMessage;
      }

      setEmptyStateMessage(aggregatedMessage);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setEmptyStateMessage('Failed to load fleet maintenance data.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'open': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'in progress': 
      case 'in-progress': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'completed': return 'text-green-700 bg-green-100 border-green-200';
      case 'closed': return 'text-gray-700 bg-gray-100 border-gray-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusLower = status.toLowerCase();
    return statusLower.split('-').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatServiceType = (serviceType: string) => {
    return serviceType.split('-').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPriorityColor = (days: number | undefined) => {
    if (!days) return 'text-gray-700 bg-gray-100 border-gray-200';
    if (days <= 7) return 'text-red-700 bg-red-100 border-red-200';
    if (days <= 14) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    return 'text-green-700 bg-green-100 border-green-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      {emptyStateMessage && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">{emptyStateMessage}</span>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fleet Maintenance Overview</h1>
          <p className="text-gray-500">Monitor maintenance performance and upcoming services</p>
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
            <h3 className="text-sm font-medium text-gray-600">Total Trailers</h3>
            <Truck className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboardStats.totalTrailers}</div>
          <p className="text-sm text-gray-500 mt-1">Fleet trailers</p>
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
            <h3 className="text-sm font-medium text-gray-600">Maintenance</h3>
            <Wrench className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboardStats.trailersMaintenance}</div>
          <p className="text-sm text-gray-500 mt-1">Under repair</p>
        </div>
        {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Monthly Costs</h3>
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">${dashboardStats.totalCosts.toLocaleString()}</div>
          <p className="text-sm text-gray-500 mt-1">This month's expenses</p>
        </div> */}
      </div>

      {/* Trailer Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Available Trailers</h3>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboardStats.trailersAvailable}</div>
          <p className="text-sm text-gray-500 mt-1">Ready for assignment</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">In Transit</h3>
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboardStats.trailersInTransit}</div>
          <p className="text-sm text-gray-500 mt-1">Currently moving</p>
        </div>

        {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Attached Trailers</h3>
            <Truck className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboardStats.trailersAttached}</div>
          <p className="text-sm text-gray-500 mt-1">Connected to vehicles</p>
        </div> */}

       
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
          <div className="text-3xl font-bold text-blue-600">
            {dashboardStats.completedThisMonth > 0 
              ? Math.round((dashboardStats.completedThisMonth / (dashboardStats.completedThisMonth + dashboardStats.activeWorkOrders)) * 100)
              : 0}%
          </div>
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
            {recentWorkOrders.length > 0 ? (
              <div className="space-y-4">
                {recentWorkOrders.map((order) => (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm truncate">{order.vehicle}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusDisplay(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{order.issue}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">{order.date}</p>
                      {order.estimatedCost && (
                        <p className="text-xs font-medium text-gray-700">${order.estimatedCost.toLocaleString()}</p>
                      )}
                    </div>
                    {order.assignedMechanic && (
                      <p className="text-xs text-gray-500 mt-1">Mechanic: {order.assignedMechanic}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No recent work orders</p>
              </div>
            )}
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
            {upcomingMaintenance.length > 0 ? (
              <div className="space-y-4">
                {upcomingMaintenance.map((maintenance, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-900">{maintenance.model}</span>
                        <span className="text-xs text-gray-500 ml-2">({maintenance.plateNumber})</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(maintenance.daysLeft)}`}>
                        {maintenance.daysLeft !== undefined && maintenance.daysLeft >= 0 
                          ? `${maintenance.daysLeft} days` 
                          : maintenance.daysLeft !== undefined 
                            ? `${Math.abs(maintenance.daysLeft)} days overdue`
                            : 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{formatServiceType(maintenance.serviceType)}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">Due: {new Date(maintenance.dueDate).toLocaleDateString()}</p>
                      {maintenance.dueMileage && (
                        <p className="text-xs text-gray-500">{maintenance.dueMileage.toLocaleString()} miles</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No upcoming maintenance scheduled</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;