import  { useState, useEffect, useMemo } from "react";
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

const formatNumber = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric.toLocaleString();
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fleetUnits, setFleetUnits] = useState<FleetUnit[]>([]);
  const [fleetLoading, setFleetLoading] = useState(false);
  const [fleetError, setFleetError] = useState<string | null>(null);

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
        if (res?.success) {
          const payload = Array.isArray(res.data)
            ? res.data
            : res.data?.data || res.data?.units || [];
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

  // Use real data if available, otherwise use empty/default data
  const watchingReportData = dashboardData?.watchingReport || Array.from({ length: 24 }, (_, i) => ({
    name: String(i).padStart(2, '0'),
    value: 0
  }));

  const driverUtilizationData = dashboardData?.driverUtilizationData || [
    { day: "Sat", value: 0 },
    { day: "Sun", value: 0 },
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
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
  const currentTrips: any[] = Array.isArray(dashboardData?.currentTrips)
    ? dashboardData.currentTrips
    : [];

  const vehiclesInTransit = currentTrips.length;
  const milesToday = currentTrips.reduce(
    (total, trip) => total + Number(trip?.milesToday ?? trip?.distanceToday ?? 0),
    0
  );
  const monitoredFleet = fleetUnits.length;

  const fleetRows = useMemo(() => {
    if (!fleetUnits.length) return [];
    return fleetUnits.slice(0, 8).map((unit) => {
      const trip =
        currentTrips.find(
          (current) =>
            current?.vehicleId === unit._id ||
            current?.unitNo === unit.unitNo ||
            current?.vin === unit.vinNo
        ) || null;

      const miles = trip?.milesToday ?? trip?.distanceToday ?? trip?.distance ?? 0;
      const lastPing = trip?.lastPing || trip?.lastUpdate;
      const formattedPing = lastPing
        ? new Date(lastPing).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "—";

      return {
        unitNo: unit.unitNo || "—",
        makeModel: unit.makeModel || [unit.make, unit.model].filter(Boolean).join(" ").trim(),
        licensePlate: unit.licensePlate || "—",
        status: unit.status || "Inactive",
        driver: trip?.driverName || trip?.driver?.name || "Unassigned",
        tripNumber: trip?.tripNumber || trip?._id || "—",
        milesToday: miles,
        odometer: unit.currentOdometer || "—",
        location: trip?.lastKnownLocation || trip?.location || "No ping",
        lastPing: formattedPing,
      };
    });
  }, [fleetUnits, currentTrips]);

  // Custom Circular Progress Component
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 85;
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center ">
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
            stroke="url(#gradient)"
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
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base text-gray-500 mb-2">Conversion</span>
          <span className="text-2xl font-bold text-gray-800">{percentage}%</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 px-6 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Watching Report */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Watching Report</h3>
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
                    fill="url(#barGradient)"
                    radius={[4, 4, 4, 4]}
                  />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Driver Utilization */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Utilization</h3>
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
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#8B5CF6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Driver Safety Scorecard */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Safety Scorecard</h3>
            <div className="flex justify-center items-center h-48">
              {loading ? (
                <div className="text-gray-500">Loading...</div>
              ) : (
                <CircularProgress percentage={safetyScore} />
              )}
            </div>
          </div>
        </div>

        {/* Speeding Violations - Full Width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Speeding Violations</h3>
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
                    stroke="#8B5CF6"
                    fill="url(#speedingGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stackId="2"
                    stroke="#60A5FA"
                    fill="url(#eventsGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="speedingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-600">Speeding %</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span className="text-sm text-gray-600">Speeding Events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle fleet snapshot */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-gray-500">Monitored Fleet</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatNumber(monitoredFleet)}</p>
              <p className="text-xs text-gray-500">Units synced from Fleet Maintenance</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-gray-500">In Transit Now</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{formatNumber(vehiclesInTransit)}</p>
              <p className="text-xs text-gray-500">Vehicles broadcasting GPS trips</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-gray-500">Miles Logged Today</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {formatNumber(Number(milesToday.toFixed(0)))}
              </p>
              <p className="text-xs text-gray-500">Across active GPS trips</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Vehicle assignments</h3>
                <p className="text-sm text-gray-500">
                  Pulls unit metadata from Fleet Units with current trip location + miles.
                </p>
              </div>
              {fleetError && (
                <span className="text-sm text-red-500">{fleetError}</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Unit</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Driver / Trip</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Miles Today</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Odometer</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Last Ping</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {fleetLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                        Loading fleet vehicles…
                      </td>
                    </tr>
                  ) : !fleetRows.length ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                        No fleet units available. Ensure Fleet Maintenance has truck data synced.
                      </td>
                    </tr>
                  ) : (
                    fleetRows.map((row) => (
                      <tr key={row.unitNo + row.tripNumber}>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{row.unitNo}</p>
                          <p className="text-xs text-gray-500">{row.makeModel || "—"}</p>
                          <p className="text-xs text-gray-400">{row.licensePlate}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{row.driver}</p>
                          <p className="text-xs text-gray-500">Trip {row.tripNumber}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-semibold">
                          {formatNumber(Number(row.milesToday || 0))}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{formatNumber(row.odometer)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              (row.status || "").toLowerCase() === "active"
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{row.lastPing}</td>
                        <td className="px-6 py-4 text-gray-600">{row.location}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;