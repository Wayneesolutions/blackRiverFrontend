import { useState } from "react";
import { DollarSign, Truck, TrendingUp, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../../../../../utils/auth";
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
  Legend,
} from "recharts";

// Static data for revenue per mile
const staticRevenueData = [
  { truck: "TRK001", truckPlate: "ABC-123", revenuePerMile: 2.45, totalMiles: 1250, totalRevenue: 3062.5 },
  { truck: "TRK002", truckPlate: "DEF-456", revenuePerMile: 2.78, totalMiles: 980, totalRevenue: 2724.4 },
  { truck: "TRK003", truckPlate: "GHI-789", revenuePerMile: 2.12, totalMiles: 1560, totalRevenue: 3307.2 },
  { truck: "TRK004", truckPlate: "JKL-012", revenuePerMile: 3.15, totalMiles: 890, totalRevenue: 2803.5 },
  { truck: "TRK005", truckPlate: "MNO-345", revenuePerMile: 2.89, totalMiles: 1120, totalRevenue: 3236.8 },
  { truck: "TRK006", truckPlate: "PQR-678", revenuePerMile: 2.56, totalMiles: 1340, totalRevenue: 3430.4 },
  { truck: "TRK007", truckPlate: "STU-901", revenuePerMile: 2.34, totalMiles: 1090, totalRevenue: 2550.6 },
];

const monthlyTrendData = [
  { month: "Jan", revenuePerMile: 2.45, totalRevenue: 45000 },
  { month: "Feb", revenuePerMile: 2.52, totalRevenue: 46200 },
  { month: "Mar", revenuePerMile: 2.48, totalRevenue: 47800 },
  { month: "Apr", revenuePerMile: 2.61, totalRevenue: 49500 },
  { month: "May", revenuePerMile: 2.67, totalRevenue: 51200 },
  { month: "Jun", revenuePerMile: 2.73, totalRevenue: 52800 },
];

const RevenuePerMilePage = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const isDispatcher = userRole === 'dispatcher';
  const basePath = isDispatcher ? '/dispatch' : '/admin/dispatch';

  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = staticRevenueData.filter(
    (item) =>
      item.truck.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.truckPlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const averageRevenuePerMile =
    staticRevenueData.reduce((sum, item) => sum + item.revenuePerMile, 0) / staticRevenueData.length;

  const totalRevenue = staticRevenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalMiles = staticRevenueData.reduce((sum, item) => sum + item.totalMiles, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="relative w-full mx-auto">
  

        {/* Main content */}
        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header Section */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
           
                <h1 className="text-xl font-bold text-black">Revenue Per Mile</h1>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Revenue/Mile</p>
                  <p className="text-2xl font-bold text-gray-900">${averageRevenuePerMile.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Miles</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMiles.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Revenue Per Mile by Truck - Bar Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Per Mile by Truck</h2>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={staticRevenueData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="truckPlate"
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                    <Bar
                      dataKey="revenuePerMile"
                      fill="url(#revenueGradient)"
                      name="Revenue/Mile"
                      radius={[8, 8, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#42aeec" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1db5f5" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend - Line Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h2>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                      yAxisId="left"
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'revenuePerMile') return `$${value.toFixed(2)}`;
                        return `$${value.toLocaleString()}`;
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenuePerMile"
                      stroke="#42aeec"
                      strokeWidth={2}
                      name="Revenue/Mile"
                      dot={{ fill: '#42aeec', r: 4 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalRevenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Total Revenue"
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Truck-wise Details Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Truck-wise Details</h2>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by truck ID or plate number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                />
                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Truck ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Plate Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Revenue Per Mile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total Miles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No trucks found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.truck} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.truck}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.truckPlate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            ${item.revenuePerMile.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.totalMiles.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${item.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuePerMilePage;

