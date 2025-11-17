import React, { useState, useEffect } from 'react';
import { 
  FaChartBar, 
  FaChartPie, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle, 
  FaBan,
  FaDownload,
  FaFlag,
  FaFlagUsa,
  FaTruck,
  FaUser
} from 'react-icons/fa';
import { getCvsaMonthlyReport } from '../../../../axios/api/admin';

// Types
interface MonthlyStats {
  month: string;
  year: number;
  totalInspections: number;
  passCount: number;
  failCount: number;
  warningCount: number;
  outOfServiceCount: number;
  canadaInspections: number;
  usaInspections: number;
  vehiclesInspected: number;
  driversInspected: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}


const sanitizeNumber = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeMonthlyStat = (stat: Partial<MonthlyStats>): MonthlyStats => ({
  month: stat.month || '',
  year: sanitizeNumber(stat.year) || new Date().getFullYear(),
  totalInspections: sanitizeNumber(stat.totalInspections),
  passCount: sanitizeNumber(stat.passCount),
  failCount: sanitizeNumber(stat.failCount),
  warningCount: sanitizeNumber(stat.warningCount),
  outOfServiceCount: sanitizeNumber(stat.outOfServiceCount),
  canadaInspections: sanitizeNumber(stat.canadaInspections),
  usaInspections: sanitizeNumber(stat.usaInspections),
  vehiclesInspected: sanitizeNumber(stat.vehiclesInspected),
  driversInspected: sanitizeNumber(stat.driversInspected),
});

const MonthlyReport: React.FC = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<'all' | 'canada' | 'usa'>('all');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [currentMonthData, setCurrentMonthData] = useState<MonthlyStats | null>(null);

  // Fetch monthly report data
  useEffect(() => {
    const fetchMonthlyReport = async () => {
      setLoading(true);
      try {
        const countryFilter = selectedCountry === 'all' ? undefined : selectedCountry;
        const res = await getCvsaMonthlyReport(selectedYear, countryFilter);
        
        if (res?.success && Array.isArray(res?.data?.monthlyData)) {
          const sanitized = res.data.monthlyData.map(normalizeMonthlyStat);
          setMonthlyData(sanitized);
          // Set selected month to current month if not set or if selected month doesn't exist in new data
          const currentSelectedMonth = selectedMonth;
          if (!currentSelectedMonth || !sanitized.find(d => d.month === currentSelectedMonth)) {
            const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
            const monthExists = sanitized.find(d => d.month === currentMonthName);
            setSelectedMonth(monthExists ? currentMonthName : (sanitized[sanitized.length - 1]?.month || ''));
          }
        } else {
          setMonthlyData([]);
          setSelectedMonth('');
          setCurrentMonthData(null);
        }
      } catch (error) {
        console.error('Error fetching monthly report:', error);
        setMonthlyData([]);
        setSelectedMonth('');
        setCurrentMonthData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyReport();
  }, [selectedYear, selectedCountry]);

  // Update current month data when selection changes
  useEffect(() => {
    const data = monthlyData.find(d => d.month === selectedMonth);
    setCurrentMonthData(data || null);
  }, [selectedMonth, monthlyData]);

  const getStatusChartData = (): ChartData => {
    if (!currentMonthData) return { labels: [], datasets: [] };

    return {
      labels: ['Pass', 'Fail', 'Warning', 'Out of Service'],
      datasets: [{
        label: 'Inspections by Status',
        data: [
          currentMonthData.passCount,
          currentMonthData.failCount,
          currentMonthData.warningCount,
          currentMonthData.outOfServiceCount
        ],
        backgroundColor: [
          '#10B981', // Green for pass
          '#EF4444', // Red for fail
          '#F59E0B', // Yellow for warning
          '#DC2626'  // Dark red for out of service
        ],
        borderColor: [
          '#059669',
          '#DC2626',
          '#D97706',
          '#991B1B'
        ],
        borderWidth: 2
      }]
    };
  };

  const getCountryChartData = (): ChartData => {
    if (!currentMonthData) return { labels: [], datasets: [] };

    return {
      labels: ['Canada', 'USA'],
      datasets: [{
        label: 'Inspections by Country',
        data: [
          currentMonthData.canadaInspections,
          currentMonthData.usaInspections
        ],
        backgroundColor: [
          '#3B82F6', // Blue for Canada
          '#EF4444'  // Red for USA
        ],
        borderColor: [
          '#2563EB',
          '#DC2626'
        ],
        borderWidth: 2
      }]
    };
  };

  const getMonthlyTrendData = (): ChartData => {
    const filteredData = selectedCountry === 'all' 
      ? monthlyData 
      : monthlyData.map(d => ({
          ...d,
          totalInspections: selectedCountry === 'canada' ? d.canadaInspections : d.usaInspections
        }));

    return {
      labels: filteredData.map(d => d.month),
      datasets: [{
        label: `Total Inspections (${selectedCountry.toUpperCase()})`,
        data: filteredData.map(d => d.totalInspections),
        backgroundColor: ['#9793E4'],
        borderColor: ['#8783D4'],
        borderWidth: 2
      }]
    };
  };

  // Simple chart rendering (in a real app, you'd use Chart.js or similar)
  const renderPieChart = (data: ChartData, title: string) => {
    const total = data.datasets[0]?.data.reduce((sum, value) => sum + value, 0) || 0;
    
    if (total === 0) {
      return (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No data available</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Simple pie chart representation */}
            <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
            {data.datasets[0]?.data.map((value, index) => {
              const percentage = (value / total) * 100;
              const rotation = data.datasets[0]?.data.slice(0, index).reduce((sum, v) => sum + (v / total) * 360, 0) || 0;
              
              return (
                <div
                  key={index}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from ${rotation}deg, ${data.datasets[0].backgroundColor[index]} ${percentage * 3.6}deg, transparent ${percentage * 3.6}deg)`
                  }}
                ></div>
              );
            })}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {data.labels.map((label, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: data.datasets[0].backgroundColor[index] }}
                ></div>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {data.datasets[0].data[index]} ({((data.datasets[0].data[index] / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = (data: ChartData, title: string) => {
    const maxValue = Math.max(...data.datasets[0]?.data || [0]);
    const total = data.datasets[0]?.data.reduce((sum, value) => sum + value, 0) || 0;
    
    if (total === 0) {
      return (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No data available</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        <div className="space-y-4">
          {data.labels.map((label, index) => {
            const value = data.datasets[0]?.data[index] || 0;
            const percentage = (value / maxValue) * 100;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: data.datasets[0].backgroundColor[index]
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLineChart = (data: ChartData, title: string) => {
    const values = data.datasets[0]?.data || [];
    const labels = data.labels || [];
    const maxValue = Math.max(...values, 10);
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xStep = chartWidth / Math.max(labels.length - 1, 1);
    const yScale = (v: number) => chartHeight - (v / maxValue) * chartHeight;

    const points = values.map((v, i) => ({ x: padding.left + i * xStep, y: padding.top + yScale(v) }));
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

    const gridLines = Array.from({ length: 5 }).map((_, i) => {
      const y = padding.top + (i * chartHeight) / 4;
      const value = Math.round(maxValue - (i * maxValue) / 4);
      return { y, value };
    });

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.datasets[0]?.backgroundColor[0] }}></span>
              <span className="text-gray-600">{data.datasets[0]?.label}</span>
            </div>
          </div>
        </div>
        <svg width="100%" viewBox={`0 0 ${width} ${height}`}> 
          {/* Axes */}
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#E5E7EB" />
          <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#E5E7EB" />

          {/* Gridlines and Y labels */}
          {gridLines.map((g, idx) => (
            <g key={idx}>
              <line x1={padding.left} y1={g.y} x2={width - padding.right} y2={g.y} stroke="#F3F4F6" />
              <text x={padding.left - 10} y={g.y + 4} fontSize="10" fill="#6B7280" textAnchor="end">{g.value}</text>
            </g>
          ))}

          {/* Line path */}
          <path d={pathD} fill="none" stroke={data.datasets[0]?.borderColor[0] || '#6366F1'} strokeWidth={2} />

          {/* Area under curve */}
          {points.length > 1 && (
            <path d={`${pathD} L ${points[points.length - 1].x},${height - padding.bottom} L ${points[0].x},${height - padding.bottom} Z`} fill={(data.datasets[0]?.backgroundColor[0] as string) || '#A5B4FC'} opacity={0.15} />
          )}

          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={3} fill={data.datasets[0]?.borderColor[0] || '#6366F1'} />
              {/* X labels */}
              <text x={p.x} y={height - padding.bottom + 15} fontSize="10" fill="#6B7280" textAnchor="middle">{labels[i]}</text>
              {/* Value labels */}
              <text x={p.x} y={p.y - 8} fontSize="10" fill="#111827" textAnchor="middle">{values[i]}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const StatCard = ({ title, value, icon, color, subtitle }: { 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    color: string; 
    subtitle?: string;
  }) => (
    <div className={`${color} p-6 rounded-xl border-2`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Monthly Compliance Report</h1>
          <p className="text-gray-600 mt-1">Analytics and insights for CVSA inspections</p>
        </div>
      
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
              disabled={loading || monthlyData.length === 0}
            >
              <option value="">Select a month</option>
              {monthlyData.map((month) => (
                <option key={month.month} value={month.month}>
                  {month.month} {month.year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country Filter</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedCountry('all')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md font-medium transition-all ${
                  selectedCountry === 'all'
                    ? 'bg-white text-[#9793E4] shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCountry('canada')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md font-medium transition-all ${
                  selectedCountry === 'canada'
                    ? 'bg-white text-[#9793E4] shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FaFlag className="text-red-600" size={14} />
                Canada
              </button>
              <button
                onClick={() => setSelectedCountry('usa')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md font-medium transition-all ${
                  selectedCountry === 'usa'
                    ? 'bg-white text-[#9793E4] shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FaFlagUsa className="text-blue-600" size={14} />
                USA
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartType('pie')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md font-medium transition-all ${
                  chartType === 'pie'
                    ? 'bg-white text-[#9793E4] shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FaChartPie size={14} />
                Pie
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`flex items-center gap-2 px-3 py-1 rounded-md font-medium transition-all ${
                  chartType === 'bar'
                    ? 'bg-white text-[#9793E4] shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FaChartBar size={14} />
                Bar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9793E4] mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-500">Loading monthly report...</p>
        </div>
      )}

      {!loading && monthlyData.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center text-gray-500 border border-dashed border-gray-200">
          <p className="text-xl font-semibold">No inspection data available for the selected filters.</p>
          <p className="text-sm mt-2">Try choosing a different year or expanding the country filter.</p>
        </div>
      )}

      {/* Monthly Stats Cards */}
      {!loading && currentMonthData && monthlyData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Inspections"
            value={currentMonthData.totalInspections}
            icon={<FaChartBar className="text-blue-600" size={24} />}
            color="bg-blue-50 border-blue-200"
            subtitle={`${selectedMonth} ${currentMonthData.year}`}
          />
          <StatCard
            title="Pass Rate"
            value={currentMonthData.totalInspections > 0
              ? Math.round((currentMonthData.passCount / currentMonthData.totalInspections) * 100)
              : 0}
            icon={<FaCheckCircle className="text-green-600" size={24} />}
            color="bg-green-50 border-green-200"
            subtitle={`${currentMonthData.passCount} passed`}
          />
          <StatCard
            title="Vehicles Inspected"
            value={currentMonthData.vehiclesInspected}
            icon={<FaTruck className="text-purple-600" size={24} />}
            color="bg-purple-50 border-purple-200"
            subtitle="Unique vehicles"
          />
          <StatCard
            title="Drivers Inspected"
            value={currentMonthData.driversInspected}
            icon={<FaUser className="text-orange-600" size={24} />}
            color="bg-orange-50 border-orange-200"
            subtitle="Unique drivers"
          />
        </div>
      )}

      {/* Charts Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status Chart */}
            {currentMonthData && (chartType === 'pie' 
              ? renderPieChart(getStatusChartData(), 'Inspection Status Distribution')
              : renderBarChart(getStatusChartData(), 'Inspection Status Distribution')
            )}

            {/* Country Chart */}
            {currentMonthData && (chartType === 'pie'
              ? renderPieChart(getCountryChartData(), 'Inspections by Country')
              : renderBarChart(getCountryChartData(), 'Inspections by Country')
            )}
          </div>

          {/* Monthly Trend Chart */}
          {monthlyData.length > 0 && (
            <div className="mb-6">
              {renderLineChart(getMonthlyTrendData(), 'Monthly Inspection Trends')}
            </div>
          )}
        </>
      )}

      {/* Detailed Breakdown */}
      {!loading && currentMonthData && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Detailed Breakdown - {selectedMonth} {currentMonthData.year}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-4">Status Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-600" size={20} />
                    <span className="font-medium text-gray-800">Passed</span>
                  </div>
                  <span className="font-bold text-green-800">{currentMonthData.passCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaTimesCircle className="text-red-600" size={20} />
                    <span className="font-medium text-gray-800">Failed</span>
                  </div>
                  <span className="font-bold text-red-800">{currentMonthData.failCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaExclamationTriangle className="text-yellow-600" size={20} />
                    <span className="font-medium text-gray-800">Warning</span>
                  </div>
                  <span className="font-bold text-yellow-800">{currentMonthData.warningCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaBan className="text-red-800" size={20} />
                    <span className="font-medium text-gray-800">Out of Service</span>
                  </div>
                  <span className="font-bold text-red-900">{currentMonthData.outOfServiceCount}</span>
                </div>
              </div>
            </div>

            {/* Country Breakdown */}
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-4">Country Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaFlag className="text-red-600" size={20} />
                    <span className="font-medium text-gray-800">Canada</span>
                  </div>
                  <span className="font-bold text-blue-800">{currentMonthData.canadaInspections}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaFlagUsa className="text-blue-600" size={20} />
                    <span className="font-medium text-gray-800">USA</span>
                  </div>
                  <span className="font-bold text-red-800">{currentMonthData.usaInspections}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyReport;
