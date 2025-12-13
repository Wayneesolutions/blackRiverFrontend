import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Loader2 } from "lucide-react";
import { getGpsVehicleDashboardStats } from "../../../axios/api/distapcher";
import { listFleetUnits } from "../../../axios/api/fleet.units";

interface FleetUnit {
  _id?: string;
  unitNo?: string;
  unitType?: string;
  makeModel?: string;
  make?: string;
  model?: string;
  vinNo?: string;
  licensePlate?: string;
  year?: string | number;
  currentOdometer?: string | number;
  status?: string;
}

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setFleetUnits] = useState<FleetUnit[]>([]);
  const [, setFleetLoading] = useState(false);
  const [, setFleetError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await getGpsVehicleDashboardStats();
        if (res.success) {
          setDashboardData(res.data);
        }
      } catch (error) {
        console.error("Error fetching GPS vehicle dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchFleetUnits = async () => {
      try {
        setFleetLoading(true);
        setFleetError(null);
        const res = await listFleetUnits({ category: "all" });
        if (res?.success && res.data) {
          const data = res.data;
          const payload = Array.isArray(data)
            ? data
            : (typeof data === 'object' && data !== null && ('data' in data || 'units' in data))
              ? (data as any).data || (data as any).units || []
              : [];
          setFleetUnits(Array.isArray(payload) ? payload : []);
        } else {
          setFleetUnits([]);
        }
      } catch (error: any) {
        console.error("Error loading fleet units:", error);
        setFleetUnits([]);
        setFleetError(error?.response?.data?.message || "Unable to load fleet units");
      } finally {
        setFleetLoading(false);
      }
    };

    fetchFleetUnits();
  }, []);

  // Check if data has values
  const hasWatchingData = dashboardData?.watchingReport && 
    Array.isArray(dashboardData.watchingReport) && 
    dashboardData.watchingReport.some((item: any) => item.value > 0);

  const hasUtilizationData = dashboardData?.driverUtilizationData && 
    Array.isArray(dashboardData.driverUtilizationData) && 
    dashboardData.driverUtilizationData.some((item: any) => item.value > 0);

  const hasSpeedingData = dashboardData?.speedingData && 
    Array.isArray(dashboardData.speedingData) && 
    dashboardData.speedingData.some((item: any) => item.speeding > 0 || item.events > 0);

  // Use real data if available, otherwise use placeholder data
  const watchingReportData = dashboardData?.watchingReport || Array.from({ length: 24 }, (_, i) => ({
    name: String(i).padStart(2, '0'),
    value: 0
  }));

  const driverUtilizationData = dashboardData?.driverUtilizationData || [
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
    { day: "Sat", value: 0 },
    { day: "Sun", value: 0 },
  ];

  const speedingData = dashboardData?.speedingData || [
    { month: "SEP", speeding: 0, events: 0 },
    { month: "OCT", speeding: 0, events: 0 },
    { month: "NOV", speeding: 0, events: 0 },
    { month: "DEC", speeding: 0, events: 0 },
    { month: "JAN", speeding: 0, events: 0 },
    { month: "FEB", speeding: 0, events: 0 },
  ];

  const safetyScore = dashboardData?.safetyScore || 0;

  // Custom Circular Progress Component
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 85;
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Use lighter colors if no data
    const hasData = percentage > 0;

    return (
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="#E5E7EB"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={hasData ? "url(#gradient)" : "#E0F2FE"}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#42aeec" />
              <stop offset="100%" stopColor="#1db5f5" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-base mb-2 ${hasData ? 'text-gray-500' : 'text-gray-400'}`}>
            Safety Score
          </span>
          <span className={`text-2xl font-bold ${hasData ? 'text-gray-800' : 'text-gray-400'}`}>
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EDF8FF' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#42aeec] mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>
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

        {/* Main content */}
        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header Section */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">GPS Vehicle Tracking</h1>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-xs">Dashboard</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 -mt-2 mb-3">
            {/* Watching Report */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Watching Report</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={watchingReportData} barCategoryGap="20%">
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill={hasWatchingData ? "url(#barGradient)" : "#E0F2FE"}
                      radius={[4, 4, 4, 4]}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#42aeec" />
                        <stop offset="100%" stopColor="#1db5f5" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Driver Utilization */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Driver Utilization</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={driverUtilizationData}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={hasUtilizationData ? "#42aeec" : "#BAE6FD"}
                      strokeWidth={3}
                      dot={{ fill: hasUtilizationData ? '#42aeec' : '#BAE6FD', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, fill: hasUtilizationData ? '#42aeec' : '#BAE6FD' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Driver Safety Scorecard */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Driver Safety Scorecard</h3>
              <div className="flex justify-center items-center h-48">
                <CircularProgress percentage={safetyScore} />
              </div>
            </div>
          </div>

          {/* Speeding Violations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Speeding Violations</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={speedingData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="speeding"
                      stackId="1"
                      stroke={hasSpeedingData ? "#42aeec" : "#E0F2FE"}
                      fill={hasSpeedingData ? "url(#speedingGradient)" : "#F0F9FF"}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="events"
                      stackId="2"
                      stroke={hasSpeedingData ? "#1db5f5" : "#BAE6FD"}
                      fill={hasSpeedingData ? "url(#eventsGradient)" : "#E0F2FE"}
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="speedingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#42aeec" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#42aeec" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1db5f5" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#1db5f5" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: hasSpeedingData ? '#42aeec' : '#E0F2FE' }}
                  ></div>
                  <span className={`text-sm ${hasSpeedingData ? 'text-gray-600' : 'text-gray-400'}`}>
                    Speeding %
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: hasSpeedingData ? '#1db5f5' : '#BAE6FD' }}
                  ></div>
                  <span className={`text-sm ${hasSpeedingData ? 'text-gray-600' : 'text-gray-400'}`}>
                    Speeding Events
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;