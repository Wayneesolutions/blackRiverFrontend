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
      <div className="min-h-screen p-4 bg-[#EDF8FF] px-6 flex items-center justify-center">
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
    <div className="min-h-screen p-4 bg-[#EDF8FF] px-6">
      <div className="max-w-7xl mx-auto">
        {emptyStateMessage && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl shadow-sm">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">{emptyStateMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Fleet Maintenance Overview</h1>
              <p className="text-slate-600">Monitor maintenance performance and upcoming services</p>
            </div>
            <div className="mt-4 sm:mt-0 text-sm text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
              Last updated: <span className="font-medium text-slate-700">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-700">Total Vehicles</h3>
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-800">{dashboardStats.totalVehicles}</div>
            <p className="text-xs text-blue-600 mt-1 font-medium">Active fleet vehicles</p>
          </div>

          <div className="rounded-xl p-4 bg-purple-50 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-700">Total Trailers</h3>
              <Truck className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-800">{dashboardStats.totalTrailers}</div>
            <p className="text-xs text-purple-600 mt-1 font-medium">Fleet trailers</p>
          </div>

          <div className="rounded-xl p-4 bg-orange-50 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-orange-700">Active Work Orders</h3>
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-800">{dashboardStats.activeWorkOrders}</div>
            <p className="text-xs text-orange-600 mt-1 font-medium">Currently in progress</p>
          </div>

          <div className="rounded-xl p-4 bg-red-50 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-red-700">Maintenance</h3>
              <Wrench className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-800">{dashboardStats.trailersMaintenance}</div>
            <p className="text-xs text-red-600 mt-1 font-medium">Under repair</p>
          </div>
        </div>

        {/* Trailer Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl p-4 bg-green-50 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-700">Available Trailers</h3>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-800">{dashboardStats.trailersAvailable}</div>
            <p className="text-xs text-green-600 mt-1 font-medium">Ready for assignment</p>
          </div>

          <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-700">In Transit</h3>
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-800">{dashboardStats.trailersInTransit}</div>
            <p className="text-xs text-blue-600 mt-1 font-medium">Currently moving</p>
          </div>
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl p-4 bg-red-50 border border-red-200">
            <div className="flex items-center mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-sm font-bold text-red-800">Overdue Maintenance</h3>
            </div>
            <div className="text-2xl font-bold text-red-700">{dashboardStats.overdueMaintenance}</div>
            <p className="text-xs text-red-600 mt-1 font-medium">Vehicles require immediate attention</p>
          </div>

          <div className="rounded-xl p-4 bg-green-50 border border-green-200">
            <div className="flex items-center mb-3">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-sm font-bold text-green-800">Completed This Month</h3>
            </div>
            <div className="text-2xl font-bold text-green-700">{dashboardStats.completedThisMonth}</div>
            <p className="text-xs text-green-600 mt-1 font-medium">Work orders completed</p>
          </div>

          <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
            <div className="flex items-center mb-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-bold text-blue-800">Efficiency Rate</h3>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {dashboardStats.completedThisMonth > 0
                ? Math.round((dashboardStats.completedThisMonth / (dashboardStats.completedThisMonth + dashboardStats.activeWorkOrders)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-blue-600 mt-1 font-medium">On-time completion rate</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Work Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-slate-500" />
                Recent Work Orders
              </h3>
            </div>
            <div className="p-6">
              {recentWorkOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentWorkOrders.map((order) => (
                    <div key={order.id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-800 text-sm truncate">{order.vehicle}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {getStatusDisplay(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{order.issue}</p>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>{order.date}</span>
                        {order.estimatedCost && (
                          <span className="font-medium text-slate-700">${order.estimatedCost.toLocaleString()}</span>
                        )}
                      </div>
                      {order.assignedMechanic && (
                        <p className="text-xs text-slate-500 mt-1">Mechanic: {order.assignedMechanic}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Wrench className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p>No recent work orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Maintenance */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-slate-500" />
                Upcoming Maintenance
              </h3>
            </div>
            <div className="p-6">
              {upcomingMaintenance.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMaintenance.map((maintenance, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-slate-800">{maintenance.model}</span>
                          <span className="text-xs text-slate-500 ml-2">({maintenance.plateNumber})</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(maintenance.daysLeft)}`}>
                          {maintenance.daysLeft !== undefined && maintenance.daysLeft >= 0
                            ? `${maintenance.daysLeft} days`
                            : maintenance.daysLeft !== undefined
                              ? `${Math.abs(maintenance.daysLeft)} days overdue`
                              : 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{formatServiceType(maintenance.serviceType)}</p>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Due: {new Date(maintenance.dueDate).toLocaleDateString()}</span>
                        {maintenance.dueMileage && (
                          <span>{maintenance.dueMileage.toLocaleString()} miles</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p>No upcoming maintenance scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;