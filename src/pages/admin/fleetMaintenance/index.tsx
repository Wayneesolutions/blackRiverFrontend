import React, { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import {
  Truck,
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { DashboardStats, UpcomingOverdue, RecentWorkOrder, MonthlyCost } from "../../../axios/api/fleet.dashboard";
import { FLEET_COLORS } from './colorUtils';

const ACCENT_PRIMARY = FLEET_COLORS.primary;
const ACCENT_DARK = FLEET_COLORS.dark;
const hexToRgba = (hex: string, alpha = 1) => {
  const parsed = hex.replace('#', '');
  const bigint = parseInt(parsed, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const ACCENT_SOFT = hexToRgba(ACCENT_PRIMARY, 0.1);
const ACCENT_SOFT_BORDER = hexToRgba(ACCENT_PRIMARY, 0.25);
const ACCENT_VARS = {
  '--accent-color': ACCENT_PRIMARY,
  '--accent-dark': ACCENT_DARK,
  '--accent-soft': ACCENT_SOFT,
  '--accent-soft-border': ACCENT_SOFT_BORDER
} as CSSProperties;

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

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    onClick,
    bgColor,
    iconColor
  }: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    onClick?: () => void;
    bgColor: string;
    iconColor: string;
  }) => {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xl font-bold text-gray-900">{value}</span>
            </div>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
          <div className={`${bgColor} rounded-lg p-2 shadow-sm`}>
            {React.isValidElement(Icon) ? React.cloneElement(Icon as React.ReactElement<any>, { className: iconColor, size: 21 }) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#EDF8FF', ...ACCENT_VARS }}>
      <div className="relative max-w-7xl mx-auto">
        {/* Gradient band */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            background: `linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)`,
            height: '101px'
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 px-4 pt-3 pb-6">
          {emptyStateMessage && (
            <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">{emptyStateMessage}</span>
            </div>
          )}

          {/* Header */}
          <div className="mb-4 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-white">Fleet Maintenance Overview</h1>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-xs">Monitor maintenance performance and upcoming services</span>
                </div>
              </div>
              <div className="text-xs text-white/80">
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 -mt-2 mb-4">
            <StatCard
              title="Total Vehicles"
              value={dashboardStats.totalVehicles}
              subtitle="Active fleet vehicles"
              icon={<Truck />}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Total Trailers"
              value={dashboardStats.totalTrailers}
              subtitle="Fleet trailers"
              icon={<Truck />}
              bgColor="bg-purple-50"
              iconColor="text-purple-600"
            />
            <StatCard
              title="Active Work Orders"
              value={dashboardStats.activeWorkOrders}
              subtitle="Currently in progress"
              icon={<Wrench />}
              bgColor="bg-orange-50"
              iconColor="text-orange-600"
            />
            <StatCard
              title="Maintenance"
              value={dashboardStats.trailersMaintenance}
              subtitle="Under repair"
              icon={<Wrench />}
              bgColor="bg-red-50"
              iconColor="text-red-900"
            />
          </div>

          {/* Trailer Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <StatCard
              title="Available Trailers"
              value={dashboardStats.trailersAvailable}
              subtitle="Ready for assignment"
              icon={<CheckCircle />}
              bgColor="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              title="In Transit"
              value={dashboardStats.trailersInTransit}
              subtitle="Currently moving"
              icon={<Truck />}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Overdue Maintenance"
              value={dashboardStats.overdueMaintenance}
              subtitle="Immediate attention"
              icon={<AlertTriangle />}
              bgColor="bg-red-50"
              iconColor="text-red-600"
            />
            <StatCard
              title="Efficiency Rate"
              value={`${dashboardStats.completedThisMonth > 0
                ? Math.round((dashboardStats.completedThisMonth / (dashboardStats.completedThisMonth + dashboardStats.activeWorkOrders)) * 100)
                : 0}%`}
              subtitle="On-time completion"
              icon={<TrendingUp />}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto px-4 -mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Work Orders */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Wrench className="h-5 w-5 mr-2 text-gray-500" />
                  Recent Work Orders
                </h3>
              </div>
              <div className="p-6">
                {recentWorkOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentWorkOrders.map((order) => (
                      <div key={order.id} className="p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow bg-gray-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-gray-900 text-sm truncate">{order.vehicle}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                            {getStatusDisplay(order.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{order.issue}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">{order.date}</p>
                          {order.estimatedCost && (
                            <p className="text-xs font-bold text-gray-700">${order.estimatedCost.toLocaleString()}</p>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  Upcoming Maintenance
                </h3>
              </div>
              <div className="p-6">
                {upcomingMaintenance.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMaintenance.map((maintenance, index) => (
                      <div key={index} className="p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow bg-gray-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-bold text-gray-900">{maintenance.model}</span>
                            <span className="text-xs text-gray-500 ml-2">({maintenance.plateNumber})</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(maintenance.daysLeft)}`}>
                            {maintenance.daysLeft !== undefined && maintenance.daysLeft >= 0
                              ? `${maintenance.daysLeft} days`
                              : maintenance.daysLeft !== undefined
                                ? `${Math.abs(maintenance.daysLeft)} days overdue`
                                : 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{formatServiceType(maintenance.serviceType)}</p>
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
      </div>
    </div>
  );
};

export default Dashboard;