import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Truck, Users, Package, Wrench, FileText, AlertTriangle, Calendar, Clock, RefreshCw } from "lucide-react";
import { quickStats, loadsPerMonth, revenueTrend, fuelEfficiency, recentAlerts } from "../../../../axios/api/main.dashboard";
import ExpiringDocumentsPopup from "../../../../components/common/ExpiringDocumentsPopup";

interface Stats {
  totalVehicles: number;
  driversOnDuty: number;
  activeTrips: number;
  activeLoads?: number;
  pendingWorkOrders: number;
  pendingInvoices: number;
}

interface LoadData {
  name: string;
  value: number;
}

interface RevenueData {
  name: string;
  value: number;
}

interface MaintenanceDue {
  plateNumber: string;
  nextServiceDate: string;
}

interface ExpiringDoc {
  name: string;
  license?: {
    expiryDate: string;
  };
}

interface DelayedLoad {
  _id: string;
  loadId?: string;
  deliveryDate: string;
  status: string;
}

interface Alerts {
  maintenanceDue: MaintenanceDue[];
  expiringDocs: ExpiringDoc[];
  delayedLoads: DelayedLoad[];
}

export default function QuickStatsUI() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    driversOnDuty: 0,
    activeTrips: 0,
    activeLoads: 0,
    pendingWorkOrders: 0,
    pendingInvoices: 0,
  });
  const [loadsData, setLoadsData] = useState<LoadData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [alerts, setAlerts] = useState<Alerts>({
    maintenanceDue: [],
    expiringDocs: [],
    delayedLoads: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExpiringPopup, setShowExpiringPopup] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (alerts.expiringDocs && alerts.expiringDocs.length > 0) {
      const timer = setTimeout(() => {
        setShowExpiringPopup(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alerts.expiringDocs]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      setAlertError(null);
      
      // Fetch all data in parallel
      const results = await Promise.allSettled([
        quickStats(),
        loadsPerMonth(),
        revenueTrend(),
        fuelEfficiency(),
        recentAlerts(),
      ]);

      // Process Quick Stats
      if (results[0].status === 'fulfilled' && results[0].value?.success) {
        const statsData = results[0].value.data;
        setStats({
          totalVehicles: statsData.totalVehicles || 0,
          driversOnDuty: statsData.driversOnDuty || 0,
          activeTrips: statsData.activeTrips || statsData.activeLoads || 0,
          activeLoads: statsData.activeTrips || statsData.activeLoads || 0,
          pendingWorkOrders: statsData.pendingWorkOrders || 0,
          pendingInvoices: statsData.pendingInvoices || 0,
        });
        
        if (results[0].value.requiresCompanySetup && results[0].value.message) {
          setError(results[0].value.message);
        }
      } else {
        console.error("Failed to fetch quick stats:", results[0]);
        const errorMsg = results[0].status === 'rejected' 
          ? 'Failed to fetch statistics' 
          : (results[0].value?.message || 'Failed to fetch statistics');
        setError(errorMsg);
      }

      // Process Loads Per Month
      if (results[1].status === 'fulfilled' && results[1].value?.success) {
        const loadsArray = results[1].value.data;
        if (loadsArray && loadsArray.length > 0) {
          const formattedLoads = loadsArray.map((item: { month: string; total: number }) => ({
            name: item.month ? item.month.substring(0, 3) : 'N/A',
            value: item.total || 0,
          }));
          setLoadsData(formattedLoads);
        } else {
          setLoadsData([]);
        }
      } else {
        console.error("Failed to fetch loads per month:", results[1]);
        setLoadsData([]);
      }

      // Process Revenue Trend
      if (results[2].status === 'fulfilled' && results[2].value?.success) {
        const revenueArray = results[2].value.data;
        if (revenueArray && revenueArray.length > 0) {
          const formattedRevenue = revenueArray.map((item: { month: string; totalRevenue: number }) => ({
            name: item.month ? item.month.substring(0, 3) : 'N/A',
            value: item.totalRevenue || 0,
          }));
          setRevenueData(formattedRevenue);
        } else {
          setRevenueData([]);
        }
      } else {
        console.error("Failed to fetch revenue trend:", results[2]);
        setRevenueData([]);
      }

      // Process Fuel Efficiency
      if (results[3].status === 'fulfilled' && results[3].value?.success) {
        // Fuel efficiency data is fetched but not currently displayed
      } else {
        console.error("Failed to fetch fuel efficiency:", results[3]);
      }

      // Process Alerts
      if (results[4].status === 'fulfilled') {
        if (results[4].value?.success && results[4].value.alerts) {
          setAlerts(results[4].value.alerts);
          setAlertError(null);
        } else if (results[4].value?.error) {
          setAlertError(results[4].value.error);
          setAlerts({
            maintenanceDue: [],
            expiringDocs: [],
            delayedLoads: [],
          });
        }
      } else if (results[4].status === 'rejected') {
        console.error("Failed to fetch alerts:", results[4]);
        setAlertError("Unable to load alerts");
        setAlerts({
          maintenanceDue: [],
          expiringDocs: [],
          delayedLoads: [],
        });
      }

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    } catch {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-[#EDF8FF]">
        <div className="text-center">
          <RefreshCw className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-[#EDF8FF]">
        <div className="text-center bg-white p-6 rounded-lg shadow-lg">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <div className="text-red-600 text-lg font-semibold mb-2">{error}</div>
          <button
            onClick={fetchDashboardData}
            className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 bg-[#EDF8FF] min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Top Cards - Smaller & More Elegant */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative z-10">
        <StatCard 
          title="Total Vehicles" 
          value={stats.totalVehicles} 
          icon={<Truck className="h-5 w-5 text-blue-600" />}
          color="blue"
          onClick={() => navigate("/admin/fleetmaintenance/fleet-units")}
        />
        <StatCard 
          title="Drivers on Duty" 
          value={stats.driversOnDuty} 
          icon={<Users className="h-5 w-5 text-emerald-600" />}
          color="green"
          onClick={() => navigate("/admin/dispatch/drivers")}
        />
        <StatCard 
          title="Active Trips" 
          value={stats.activeTrips || stats.activeLoads || 0} 
          icon={<Package className="h-5 w-5 text-violet-600" />}
          color="purple"
          onClick={() => navigate("/admin/dispatch/trips")}
        />
        <StatCard 
          title="Pending Work Orders" 
          value={stats.pendingWorkOrders} 
          icon={<Wrench className="h-5 w-5 text-amber-600" />}
          color="orange"
          onClick={() => navigate("/admin/fleetmaintenance/maintenance-orders-log")}
        />
        <StatCard 
          title="Pending Invoices" 
          value={stats.pendingInvoices} 
          icon={<FileText className="h-5 w-5 text-rose-600" />}
          color="red"
          onClick={() => navigate("/admin/accounts/invoice")}
        />
      </div>

      {/* Charts - Compact & Elegant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
        <Card className="lg:col-span-2 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" onClick={() => navigate("/admin/dispatch/trips")}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              Trips per Month
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Live
            </div>
          </div>
          {loadsData.length > 0 ? (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={loadsData} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    style={{ fontSize: '11px', fontWeight: 500 }} 
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    style={{ fontSize: '11px' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px'
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#blueGradient)" 
                    name="Trips" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  />
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-gray-400">
              <Package className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">No trip data available</p>
            </div>
          )}
        </Card>

        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" onClick={() => navigate("/admin/accounts/invoice")}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <FileText className="h-4 w-4 text-emerald-600" />
              </div>
              Revenue Trend
            </h3>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <span>↗</span>
              +12%
            </div>
          </div>
          {revenueData.length > 0 ? (
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px'
                    }}
                    formatter={(value) => `$${(value as number).toLocaleString()}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="url(#emeraldGradient)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2 }}
                  />
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center text-gray-400">
              <FileText className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">No revenue data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Alerts - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
        <Card className="lg:col-span-2 relative overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-rose-300/20 to-amber-300/20 rounded-full blur-2xl"></div>
          
          <h3 className="text-base font-semibold mb-3 text-gray-800 flex items-center gap-2 relative z-10">
            <div className="p-1.5 bg-rose-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            Recent Alerts
          </h3>

          {alertError ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-yellow-800">Alert System Unavailable</p>
                <p className="text-xs text-yellow-700 mt-0.5">{alertError}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <AlertSection 
                title="Maintenance Due" 
                count={alerts.maintenanceDue?.length || 0}
                icon={<Wrench className="h-3.5 w-3.5" />}
                onClick={() => navigate("/admin/fleetmaintenance/scheduled-services-log")}
              >
                {alerts.maintenanceDue && alerts.maintenanceDue.length > 0 ? (
                  alerts.maintenanceDue.map((vehicle, idx) => (
                    <div 
                      key={idx} 
                      className="flex justify-between items-center p-2.5 bg-gradient-to-r from-rose-50 to-red-50 rounded-lg border border-rose-200 hover:border-rose-300 transition-all cursor-pointer"
                      onClick={() => navigate("/admin/fleetmaintenance/scheduled-services-log")}
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-rose-600" />
                        <div>
                          <div className="font-medium text-sm text-gray-800">{vehicle.plateNumber}</div>
                          <div className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(vehicle.nextServiceDate)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-rose-600 text-white rounded-full font-medium">Overdue</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-600 p-2.5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                    No maintenance overdue
                  </div>
                )}
              </AlertSection>

              <AlertSection 
                title="Document Expiry" 
                count={alerts.expiringDocs?.length || 0}
                icon={<FileText className="h-3.5 w-3.5" />}
                onClick={() => navigate("/admin/Management/documents")}
              >
                {alerts.expiringDocs && alerts.expiringDocs.length > 0 ? (
                  alerts.expiringDocs.map((doc, idx) => (
                    <div 
                      key={idx} 
                      className="flex justify-between items-center p-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200 hover:border-amber-300 transition-all cursor-pointer"
                      onClick={() => navigate("/admin/Management/documents")}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-amber-600" />
                        <div>
                          <div className="font-medium text-sm text-gray-800">Driver License - {doc.name}</div>
                          <div className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(doc.license?.expiryDate || '')}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-amber-600 text-white rounded-full font-medium">Soon</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-600 p-2.5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                    All documents valid
                  </div>
                )}
              </AlertSection>

              <AlertSection 
                title="Delayed Trips" 
                count={alerts.delayedLoads?.length || 0}
                icon={<Clock className="h-3.5 w-3.5" />}
                onClick={() => navigate("/admin/dispatch/trips")}
              >
                {alerts.delayedLoads && alerts.delayedLoads.length > 0 ? (
                  alerts.delayedLoads.map((trip, idx) => (
                    <div 
                      key={idx} 
                      className="flex justify-between items-center p-2.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 hover:border-orange-300 transition-all cursor-pointer"
                      onClick={() => navigate("/admin/dispatch/trips")}
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="font-medium text-sm text-gray-800">Trip #{trip.loadId || trip._id}</div>
                          <div className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(trip.deliveryDate)} • {trip.status}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-orange-600 text-white rounded-full font-medium">Delayed</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-600 p-2.5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                    All trips on track
                  </div>
                )}
              </AlertSection>
            </div>
          )}
        </Card>

        {/* Summary Card - Compact */}
        <Card className="relative overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-gradient-to-tr from-blue-300/20 to-violet-300/20 rounded-full blur-2xl"></div>
          
          <h3 className="text-base font-semibold mb-3 text-gray-800 relative z-10">Summary</h3>
          <div className="space-y-2 relative z-10">
            <SummaryItem label="Total Vehicles" value={stats.totalVehicles} icon={<Truck className="h-3.5 w-3.5 text-blue-600" />} />
            <SummaryItem label="Active Trips" value={stats.activeTrips || stats.activeLoads || 0} icon={<Package className="h-3.5 w-3.5 text-violet-600" />} />
            <SummaryItem label="Drivers on Duty" value={stats.driversOnDuty} icon={<Users className="h-3.5 w-3.5 text-emerald-600" />} />
            <SummaryItem label="Pending Work Orders" value={stats.pendingWorkOrders} icon={<Wrench className="h-3.5 w-3.5 text-amber-600" />} />
            <SummaryItem label="Pending Invoices" value={stats.pendingInvoices} icon={<FileText className="h-3.5 w-3.5 text-rose-600" />} />
          </div>
          
          <button
            onClick={fetchDashboardData}
            className="mt-4 w-full px-3 py-2 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 !text-white rounded-lg hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 transition-all text-sm font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg relative z-10 group overflow-hidden"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <RefreshCw className="h-3.5 w-3.5 relative z-10" />
            <span className="relative z-10">Refresh Data</span>
          </button>
        </Card>
      </div>

      {/* Expiring Documents Popup */}
      <ExpiringDocumentsPopup
        isOpen={showExpiringPopup}
        onClose={() => setShowExpiringPopup(false)}
        onViewDocuments={() => {
          window.location.href = '/admin/employee/documents';
        }}
        daysThreshold={30}
        showOnlyOnce={true}
      />
    </div>
  );
}

function StatCard({ title, value, icon, color, onClick }: { title: string; value: number; icon: React.ReactNode; color: string; onClick?: () => void }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-gradient-to-br from-blue-400/20 via-blue-300/10 to-blue-100/30 border-blue-300/40 hover:border-blue-400/60 hover:shadow-blue-200/50',
    green: 'bg-gradient-to-br from-emerald-400/20 via-emerald-300/10 to-emerald-100/30 border-emerald-300/40 hover:border-emerald-400/60 hover:shadow-emerald-200/50',
    purple: 'bg-gradient-to-br from-violet-400/20 via-violet-300/10 to-violet-100/30 border-violet-300/40 hover:border-violet-400/60 hover:shadow-violet-200/50',
    orange: 'bg-gradient-to-br from-amber-400/20 via-amber-300/10 to-amber-100/30 border-amber-300/40 hover:border-amber-400/60 hover:shadow-amber-200/50',
    red: 'bg-gradient-to-br from-rose-400/20 via-rose-300/10 to-rose-100/30 border-rose-300/40 hover:border-rose-400/60 hover:shadow-rose-200/50',
  };

  const iconBgClasses: Record<string, string> = {
    blue: 'bg-blue-100/80 group-hover:bg-blue-200/80',
    green: 'bg-emerald-100/80 group-hover:bg-emerald-200/80',
    purple: 'bg-violet-100/80 group-hover:bg-violet-200/80',
    orange: 'bg-amber-100/80 group-hover:bg-amber-200/80',
    red: 'bg-rose-100/80 group-hover:bg-rose-200/80',
  };

  return (
    <div 
      className={`group ${colorClasses[color]} rounded-xl p-4 shadow-md border hover:shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer transform hover:-translate-y-1' : ''} backdrop-blur-sm relative overflow-hidden`}
      onClick={onClick}
    >
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="text-xs font-semibold text-gray-700">{title}</div>
        <div className={`p-2 rounded-lg ${iconBgClasses[color]} transition-all duration-300`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 relative z-10">{value}</div>
    </div>
  );
}

function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div 
      className={`bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-md border border-gray-200/50 hover:border-gray-300/50 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function AlertSection({ title, children, count, icon, onClick }: { title: string; children: React.ReactNode; count: number; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <div>
      <div 
        className={`flex items-center justify-between mb-2 ${onClick ? 'cursor-pointer hover:text-gray-900 transition-colors' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          {icon}
          {title}
        </div>
        {count > 0 && (
          <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-medium">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function SummaryItem({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-gray-700">{label}</span>
      </div>
      <span className="text-base font-semibold text-gray-900">{value}</span>
    </div>
  );
}