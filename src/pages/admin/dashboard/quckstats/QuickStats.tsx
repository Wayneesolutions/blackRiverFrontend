import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { Truck, Users, Package, Wrench, FileText, AlertTriangle, Calendar, Clock, RefreshCw } from "lucide-react";
import { quickStats, loadsPerMonth, revenueTrend, fuelEfficiency, recentAlerts } from "../../../../axios/api/main.dashboard";
import ExpiringDocumentsPopup from "../../../../components/common/ExpiringDocumentsPopup";

const COLORS = ["#3b82f6", "#10b981"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Stats {
  totalVehicles: number;
  driversOnDuty: number;
  activeLoads: number;
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

interface FuelData {
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
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    driversOnDuty: 0,
    activeLoads: 0,
    pendingWorkOrders: 0,
    pendingInvoices: 0,
  });
  const [loadsData, setLoadsData] = useState<LoadData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [fuelData, setFuelData] = useState<FuelData[]>([]);
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

  // Check for expiring documents and show popup
  useEffect(() => {
    if (alerts.expiringDocs && alerts.expiringDocs.length > 0) {
      // Show popup after a short delay to let the page load
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
          activeLoads: statsData.activeLoads || 0,
          pendingWorkOrders: statsData.pendingWorkOrders || 0,
          pendingInvoices: statsData.pendingInvoices || 0,
        });
      } else {
        console.error("Failed to fetch quick stats:", results[0]);
      }

      // Process Loads Per Month
      if (results[1].status === 'fulfilled' && results[1].value?.success) {
        const loadsArray = results[1].value.data;
        if (loadsArray && loadsArray.length > 0) {
          const formattedLoads = loadsArray.map((item: { _id: number; total: number }) => ({
            name: MONTH_NAMES[item._id - 1] || `Month ${item._id}`,
            value: item.total,
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
          const formattedRevenue = revenueArray.map((item: { _id: number; totalRevenue: number }) => ({
            name: MONTH_NAMES[item._id - 1] || `Month ${item._id}`,
            value: item.totalRevenue,
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
        const fuelInfo = results[3].value.data;
        if (fuelInfo) {
          const avgMileage = fuelInfo.avgMileage || 0;
          const totalFuel = fuelInfo.totalFuel || 0;
          
          setFuelData([
            { name: "Avg Odometer (km)", value: Math.round(avgMileage) },
            { name: "Total Fuel (%)", value: Math.round(totalFuel) },
          ]);
        } else {
          setFuelData([]);
        }
      } else {
        console.error("Failed to fetch fuel efficiency:", results[3]);
        setFuelData([]);
      }

      // Process Alerts - handle separately as it might fail
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
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 text-xl font-semibold mb-2">{error}</div>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Vehicles" 
          value={stats.totalVehicles} 
          icon={<Truck className="h-6 w-6 text-blue-600" />}
          color="blue"
        />
        <StatCard 
          title="Drivers on Duty" 
          value={stats.driversOnDuty} 
          icon={<Users className="h-6 w-6 text-green-600" />}
          color="green"
        />
        <StatCard 
          title="Active Loads" 
          value={stats.activeLoads} 
          icon={<Package className="h-6 w-6 text-purple-600" />}
          color="purple"
        />
        <StatCard 
          title="Pending Work Orders" 
          value={stats.pendingWorkOrders} 
          icon={<Wrench className="h-6 w-6 text-orange-600" />}
          color="orange"
        />
        <StatCard 
          title="Pending Invoices" 
          value={stats.pendingInvoices} 
          icon={<FileText className="h-6 w-6 text-red-600" />}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Loads per Month
          </h3>
          {loadsData.length > 0 ? (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={loadsData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280" 
                    style={{ fontSize: '13px', fontWeight: 500 }} 
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    style={{ fontSize: '12px' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6" 
                    name="Loads" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={80}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <Package className="h-16 w-16 mb-3 opacity-30" />
              <p>No load data available</p>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Revenue Trend
          </h3>
          {revenueData.length > 0 ? (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-gray-400">
              <FileText className="h-16 w-16 mb-3 opacity-30" />
              <p>No revenue data available</p>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Truck className="h-5 w-5 text-purple-600" />
            Fuel & Odometer
          </h3>
          {fuelData.length > 0 && (fuelData[0].value > 0 || fuelData[1].value > 0) ? (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={fuelData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={5}
                    label={({ value }) => `${value}`}
                  >
                    {fuelData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-gray-400">
              <Truck className="h-16 w-16 mb-3 opacity-30" />
              <p>No fuel data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Recent Alerts
          </h3>

          {alertError ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Alert System Unavailable</p>
                <p className="text-xs text-yellow-700 mt-1">{alertError}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Maintenance Due */}
              <AlertSection 
                title="Maintenance Due" 
                count={alerts.maintenanceDue?.length || 0}
                icon={<Wrench className="h-4 w-4" />}
              >
                {alerts.maintenanceDue && alerts.maintenanceDue.length > 0 ? (
                  alerts.maintenanceDue.map((vehicle, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-red-600" />
                        <div>
                          <div className="font-medium text-gray-800">{vehicle.plateNumber}</div>
                          <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            Next service: {formatDate(vehicle.nextServiceDate)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-600 text-white rounded-full font-medium">Overdue</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    No maintenance overdue
                  </div>
                )}
              </AlertSection>

              {/* Document Expiry */}
              <AlertSection 
                title="Document Expiry" 
                count={alerts.expiringDocs?.length || 0}
                icon={<FileText className="h-4 w-4" />}
              >
                {alerts.expiringDocs && alerts.expiringDocs.length > 0 ? (
                  alerts.expiringDocs.map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-yellow-600" />
                        <div>
                          <div className="font-medium text-gray-800">Driver License - {doc.name}</div>
                          <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            Expiry: {formatDate(doc.license?.expiryDate || '')}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-yellow-600 text-white rounded-full font-medium">Soon</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    All documents valid
                  </div>
                )}
              </AlertSection>

              {/* Delayed Loads */}
              <AlertSection 
                title="Delayed Loads" 
                count={alerts.delayedLoads?.length || 0}
                icon={<Clock className="h-4 w-4" />}
              >
                {alerts.delayedLoads && alerts.delayedLoads.length > 0 ? (
                  alerts.delayedLoads.map((load, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-orange-600" />
                        <div>
                          <div className="font-medium text-gray-800">Load #{load.loadId || load._id}</div>
                          <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            Delivery: {formatDate(load.deliveryDate)} • Status: {load.status}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-orange-600 text-white rounded-full font-medium">Delayed</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    All loads on track
                  </div>
                )}
              </AlertSection>
            </div>
          )}
        </Card>

        {/* Summary Card */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Summary</h3>
          <div className="space-y-3">
            <SummaryItem label="Total Vehicles" value={stats.totalVehicles} icon={<Truck className="h-4 w-4 text-blue-600" />} />
            <SummaryItem label="Active Loads" value={stats.activeLoads} icon={<Package className="h-4 w-4 text-purple-600" />} />
            <SummaryItem label="Drivers on Duty" value={stats.driversOnDuty} icon={<Users className="h-4 w-4 text-green-600" />} />
            <SummaryItem label="Pending Work Orders" value={stats.pendingWorkOrders} icon={<Wrench className="h-4 w-4 text-orange-600" />} />
            <SummaryItem label="Pending Invoices" value={stats.pendingInvoices} icon={<FileText className="h-4 w-4 text-red-600" />} />
          </div>
          
          <button
            onClick={fetchDashboardData}
            className="mt-6 w-full px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
        </Card>
      </div>

      {/* Expiring Documents Popup */}
      <ExpiringDocumentsPopup
        isOpen={showExpiringPopup}
        onClose={() => setShowExpiringPopup(false)}
        onViewDocuments={() => {
          // Navigate to employee documents page
          window.location.href = '/admin/employee/documents';
        }}
        daysThreshold={30}
        showOnlyOnce={true}
      />
    </div>
  );
}

/* ----------------- Helper Components ----------------- */

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100',
    orange: 'bg-orange-50 border-orange-100',
    red: 'bg-red-50 border-red-100',
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-700">{title}</div>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

function AlertSection({ title, children, count, icon }: { title: string; children: React.ReactNode; count: number; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {icon}
          {title}
        </div>
        {count > 0 && (
          <span className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-medium">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SummaryItem({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className="text-lg font-semibold text-gray-900">{value}</span>
    </div>
  );
}