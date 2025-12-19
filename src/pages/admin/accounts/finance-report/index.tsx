import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Truck,
  MapPin,
  Calendar,
  FileText,
  Receipt,
  Users,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
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
  Legend
} from 'recharts';

type TimePeriod = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
type ViewType = 'overview' | 'trucks' | 'trips' | 'time-based';

interface TruckFinancialData {
  id: string;
  truckNumber: string;
  revenue: number;
  expenses: number;
  payroll: number;
  netProfit: number;
  trips: number;
  miles: number;
  fuelCost: number;
  maintenanceCost: number;
}

interface TripFinancialData {
  id: string;
  tripNumber: string;
  truckNumber: string;
  origin: string;
  destination: string;
  revenue: number;
  expenses: number;
  driverPay: number;
  netProfit: number;
  date: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface TimeBasedReport {
  period: string;
  revenue: number;
  expenses: number;
  payroll: number;
  invoices: number;
  netProfit: number;
  invoiceCount: number;
  expenseCount: number;
  payrollCount: number;
}

const FinanceReport = () => {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');

  // Static Truck-wise Financial Data
  const truckFinancialData: TruckFinancialData[] = [
    {
      id: '1',
      truckNumber: 'TRK-001',
      revenue: 125000,
      expenses: 45000,
      payroll: 18000,
      netProfit: 62000,
      trips: 45,
      miles: 12500,
      fuelCost: 28000,
      maintenanceCost: 12000
    },
    {
      id: '2',
      truckNumber: 'TRK-002',
      revenue: 118000,
      expenses: 42000,
      payroll: 17500,
      netProfit: 58500,
      trips: 42,
      miles: 11800,
      fuelCost: 26500,
      maintenanceCost: 11000
    },
    {
      id: '3',
      truckNumber: 'TRK-003',
      revenue: 132000,
      expenses: 48000,
      payroll: 19000,
      netProfit: 65000,
      trips: 48,
      miles: 13200,
      fuelCost: 30000,
      maintenanceCost: 13500
    },
    {
      id: '4',
      truckNumber: 'TRK-004',
      revenue: 110000,
      expenses: 40000,
      payroll: 17000,
      netProfit: 53000,
      trips: 40,
      miles: 11000,
      fuelCost: 25000,
      maintenanceCost: 10500
    },
    {
      id: '5',
      truckNumber: 'TRK-005',
      revenue: 140000,
      expenses: 50000,
      payroll: 20000,
      netProfit: 70000,
      trips: 50,
      miles: 14000,
      fuelCost: 32000,
      maintenanceCost: 14000
    }
  ];

  // Static Trip-wise Financial Data
  const tripFinancialData: TripFinancialData[] = [
    {
      id: '1',
      tripNumber: 'TRP-2024-001',
      truckNumber: 'TRK-001',
      origin: 'Los Angeles, CA',
      destination: 'New York, NY',
      revenue: 3500,
      expenses: 1200,
      driverPay: 800,
      netProfit: 1500,
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: '2',
      tripNumber: 'TRP-2024-002',
      truckNumber: 'TRK-002',
      origin: 'Chicago, IL',
      destination: 'Miami, FL',
      revenue: 2800,
      expenses: 950,
      driverPay: 650,
      netProfit: 1200,
      date: '2024-01-18',
      status: 'completed'
    },
    {
      id: '3',
      tripNumber: 'TRP-2024-003',
      truckNumber: 'TRK-003',
      origin: 'Seattle, WA',
      destination: 'Dallas, TX',
      revenue: 3200,
      expenses: 1100,
      driverPay: 750,
      netProfit: 1350,
      date: '2024-01-20',
      status: 'in-progress'
    },
    {
      id: '4',
      tripNumber: 'TRP-2024-004',
      truckNumber: 'TRK-001',
      origin: 'Denver, CO',
      destination: 'Phoenix, AZ',
      revenue: 2400,
      expenses: 850,
      driverPay: 600,
      netProfit: 950,
      date: '2024-01-22',
      status: 'completed'
    },
    {
      id: '5',
      tripNumber: 'TRP-2024-005',
      truckNumber: 'TRK-004',
      origin: 'Atlanta, GA',
      destination: 'Boston, MA',
      revenue: 3800,
      expenses: 1300,
      driverPay: 850,
      netProfit: 1650,
      date: '2024-01-25',
      status: 'pending'
    },
    {
      id: '6',
      tripNumber: 'TRP-2024-006',
      truckNumber: 'TRK-005',
      origin: 'Portland, OR',
      destination: 'Houston, TX',
      revenue: 2900,
      expenses: 1000,
      driverPay: 700,
      netProfit: 1200,
      date: '2024-01-28',
      status: 'completed'
    }
  ];

  // Static Monthly Reports
  const monthlyReports: TimeBasedReport[] = [
    {
      period: 'January 2024',
      revenue: 625000,
      expenses: 225000,
      payroll: 91500,
      invoices: 625000,
      netProfit: 308500,
      invoiceCount: 225,
      expenseCount: 180,
      payrollCount: 45
    },
    {
      period: 'February 2024',
      revenue: 580000,
      expenses: 210000,
      payroll: 85000,
      invoices: 580000,
      netProfit: 285000,
      invoiceCount: 210,
      expenseCount: 165,
      payrollCount: 42
    },
    {
      period: 'March 2024',
      revenue: 650000,
      expenses: 235000,
      payroll: 95000,
      invoices: 650000,
      netProfit: 320000,
      invoiceCount: 235,
      expenseCount: 190,
      payrollCount: 48
    },
    {
      period: 'April 2024',
      revenue: 620000,
      expenses: 228000,
      payroll: 92000,
      invoices: 620000,
      netProfit: 300000,
      invoiceCount: 220,
      expenseCount: 175,
      payrollCount: 44
    },
    {
      period: 'May 2024',
      revenue: 680000,
      expenses: 245000,
      payroll: 98000,
      invoices: 680000,
      netProfit: 337000,
      invoiceCount: 245,
      expenseCount: 200,
      payrollCount: 50
    },
    {
      period: 'June 2024',
      revenue: 640000,
      expenses: 232000,
      payroll: 94000,
      invoices: 640000,
      netProfit: 314000,
      invoiceCount: 230,
      expenseCount: 185,
      payrollCount: 46
    }
  ];

  // Static Quarterly Reports
  const quarterlyReports: TimeBasedReport[] = [
    {
      period: 'Q1 2024',
      revenue: 1855000,
      expenses: 670000,
      payroll: 271500,
      invoices: 1855000,
      netProfit: 913500,
      invoiceCount: 670,
      expenseCount: 535,
      payrollCount: 135
    },
    {
      period: 'Q2 2024',
      revenue: 1940000,
      expenses: 705000,
      payroll: 284000,
      invoices: 1940000,
      netProfit: 951000,
      invoiceCount: 695,
      expenseCount: 560,
      payrollCount: 140
    },
    {
      period: 'Q3 2024',
      revenue: 2100000,
      expenses: 760000,
      payroll: 305000,
      invoices: 2100000,
      netProfit: 1035000,
      invoiceCount: 750,
      expenseCount: 600,
      payrollCount: 150
    },
    {
      period: 'Q4 2024',
      revenue: 2050000,
      expenses: 740000,
      payroll: 298000,
      invoices: 2050000,
      netProfit: 1012000,
      invoiceCount: 730,
      expenseCount: 585,
      payrollCount: 146
    }
  ];

  // Static Half-Yearly Reports
  const halfYearlyReports: TimeBasedReport[] = [
    {
      period: 'H1 2024',
      revenue: 3795000,
      expenses: 1375000,
      payroll: 555500,
      invoices: 3795000,
      netProfit: 1864500,
      invoiceCount: 1365,
      expenseCount: 1095,
      payrollCount: 275
    },
    {
      period: 'H2 2024',
      revenue: 4150000,
      expenses: 1500000,
      payroll: 603000,
      invoices: 4150000,
      netProfit: 2047000,
      invoiceCount: 1480,
      expenseCount: 1185,
      payrollCount: 296
    },
    {
      period: 'H1 2023',
      revenue: 3600000,
      expenses: 1300000,
      payroll: 525000,
      invoices: 3600000,
      netProfit: 1775000,
      invoiceCount: 1290,
      expenseCount: 1030,
      payrollCount: 257
    },
    {
      period: 'H2 2023',
      revenue: 3600000,
      expenses: 1300000,
      payroll: 525000,
      invoices: 3600000,
      netProfit: 1775000,
      invoiceCount: 1290,
      expenseCount: 1030,
      payrollCount: 258
    }
  ];

  // Static Yearly Reports
  const yearlyReports: TimeBasedReport[] = [
    {
      period: '2024',
      revenue: 7945000,
      expenses: 2875000,
      payroll: 1158500,
      invoices: 7945000,
      netProfit: 3911500,
      invoiceCount: 2845,
      expenseCount: 2280,
      payrollCount: 571
    },
    {
      period: '2023',
      revenue: 7200000,
      expenses: 2600000,
      payroll: 1050000,
      invoices: 7200000,
      netProfit: 3550000,
      invoiceCount: 2580,
      expenseCount: 2060,
      payrollCount: 515
    },
    {
      period: '2022',
      revenue: 6800000,
      expenses: 2450000,
      payroll: 980000,
      invoices: 6800000,
      netProfit: 3370000,
      invoiceCount: 2430,
      expenseCount: 1940,
      payrollCount: 485
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Calculate totals
  const totalRevenue = truckFinancialData.reduce((sum, truck) => sum + truck.revenue, 0);
  const totalExpenses = truckFinancialData.reduce((sum, truck) => sum + truck.expenses, 0);
  const totalPayroll = truckFinancialData.reduce((sum, truck) => sum + truck.payroll, 0);
  const totalNetProfit = truckFinancialData.reduce((sum, truck) => sum + truck.netProfit, 0);
  const totalTrips = truckFinancialData.reduce((sum, truck) => sum + truck.trips, 0);

  const getCurrentReports = () => {
    switch (timePeriod) {
      case 'monthly':
        return monthlyReports;
      case 'quarterly':
        return quarterlyReports;
      case 'half-yearly':
        return halfYearlyReports;
      case 'yearly':
        return yearlyReports;
      default:
        return monthlyReports;
    }
  };

  const overviewStats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      subtitle: 'From all trucks',
      icon: DollarSign,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-700',
      cardBg: 'bg-gradient-to-br from-green-50 to-green-100',
      trend: '+12.5%'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      subtitle: 'Operating costs',
      icon: TrendingDown,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-700',
      cardBg: 'bg-gradient-to-br from-red-50 to-red-100',
      trend: '-3.2%'
    },
    {
      title: 'Total Payroll',
      value: formatCurrency(totalPayroll),
      subtitle: 'Driver & employee costs',
      icon: Users,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-700',
      cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      trend: '+5.8%'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(totalNetProfit),
      subtitle: 'Revenue - Expenses - Payroll',
      icon: TrendingUp,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-700',
      cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      trend: '+18.3%'
    },
    {
      title: 'Total Trips',
      value: totalTrips.toString(),
      subtitle: 'Completed trips',
      icon: MapPin,
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-700',
      cardBg: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
      trend: '+8.1%'
    },
    {
      title: 'Active Trucks',
      value: truckFinancialData.length.toString(),
      subtitle: 'Fleet size',
      icon: Truck,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-700',
      cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      trend: '—'
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="relative w-full mx-auto p-2">


        {/* Main content */}
        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header Section */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-black">Finance Report</h1>
                <p className="text-xs text-black/90 mt-1">Comprehensive financial insights and analysis</p>
              </div>
             
            </div>
          </div>

          {/* View Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 mb-4">
            <div className="flex gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'trucks', label: 'Truck-wise', icon: Truck },
                { id: 'trips', label: 'Trip-wise', icon: MapPin },
                { id: 'time-based', label: 'Time Reports', icon: Calendar }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id as ViewType)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      activeView === tab.id
                        ? 'bg-gradient-to-r from-[#42aeec] to-[#0ea3d8] !text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overview View */}
          {activeView === 'overview' && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {overviewStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className={`${stat.cardBg} rounded-lg p-3 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-[#42aeec]/20`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-gray-900 mb-1">{stat.title}</h3>
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-xl font-bold text-gray-900">{stat.value}</span>
                            {stat.trend !== '—' && (
                              <span className={`text-xs font-medium flex items-center gap-1 ${
                                stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {stat.trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {stat.trend}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{stat.subtitle}</p>
                        </div>
                        <div className={`${stat.bgColor} rounded-lg p-2 shadow-sm`}>
                          <Icon className={stat.iconColor} size={21} strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Consolidated Financial Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart size={20} className="text-[#42aeec]" />
                  Consolidated Financial Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="text-sm text-gray-600 mb-1">Accounts Revenue</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(625000)}</div>
                    <div className="text-xs text-gray-500 mt-1">From invoices</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(225000)}</div>
                    <div className="text-xs text-gray-500 mt-1">Operating costs</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-sm text-gray-600 mb-1">Payroll Costs</div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(91500)}</div>
                    <div className="text-xs text-gray-500 mt-1">Employee & driver</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="text-sm text-gray-600 mb-1">Net Profit</div>
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(308500)}</div>
                    <div className="text-xs text-gray-500 mt-1">After all costs</div>
                  </div>
                </div>

                {/* Overall Comparison Chart */}
                <div className="mt-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue vs Expenses vs Net Profit Comparison</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: 'Overall',
                            Revenue: totalRevenue,
                            Expenses: totalExpenses + totalPayroll,
                            'Net Profit': totalNetProfit
                          }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            fontSize: '12px'
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar dataKey="Revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Net Profit" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Percentage Breakdown */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Revenue Breakdown</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Revenue</span>
                        <span className="text-sm font-bold text-green-600">100%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Expenses + Payroll</span>
                        <span className="text-sm font-bold text-red-600">
                          {(((totalExpenses + totalPayroll) / totalRevenue) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${((totalExpenses + totalPayroll) / totalRevenue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Profit Margin</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Net Profit</span>
                        <span className="text-sm font-bold text-purple-600">
                          {((totalNetProfit / totalRevenue) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${(totalNetProfit / totalRevenue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-[#42aeec]" />
                    Invoice Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Paid Invoices</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(580000)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Pending Invoices</span>
                      <span className="text-lg font-bold text-yellow-600">{formatCurrency(45000)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Overdue Invoices</span>
                      <span className="text-lg font-bold text-red-600">{formatCurrency(12000)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Receipt size={18} className="text-[#42aeec]" />
                    Expense Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Fuel Costs</span>
                      <span className="text-lg font-bold text-blue-600">{formatCurrency(141500)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Maintenance</span>
                      <span className="text-lg font-bold text-orange-600">{formatCurrency(61000)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Other Expenses</span>
                      <span className="text-lg font-bold text-purple-600">{formatCurrency(22500)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Truck-wise View */}
          {activeView === 'trucks' && (
            <div className="space-y-4">
              {/* Truck-wise Comparison Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#42aeec]" />
                  Truck-wise Revenue vs Expenses vs Net Profit
                </h2>
                <div className="h-96 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={truckFinancialData.map(truck => ({
                        name: truck.truckNumber,
                        Revenue: truck.revenue,
                        Expenses: truck.expenses + truck.payroll,
                        'Net Profit': truck.netProfit
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Net Profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Truck size={20} className="text-[#42aeec]" />
                    Truck-wise Financial Performance
                  </h2>
                  <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-all flex items-center gap-2">
                    <Filter size={14} />
                    Filter
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Truck #</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payroll</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Profit</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Profit Margin</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trips</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Miles</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fuel Cost</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Maintenance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {truckFinancialData.map((truck) => {
                        const profitMargin = (truck.netProfit / truck.revenue) * 100;
                        return (
                          <tr key={truck.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{truck.truckNumber}</td>
                            <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatCurrency(truck.revenue)}</td>
                            <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(truck.expenses)}</td>
                            <td className="px-4 py-3 text-sm text-right text-blue-600">{formatCurrency(truck.payroll)}</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{formatCurrency(truck.netProfit)}</td>
                            <td className="px-4 py-3 text-sm text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-gray-700">{profitMargin.toFixed(1)}%</span>
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${profitMargin > 50 ? 'bg-green-500' : profitMargin > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(profitMargin, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-700">{truck.trips}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{truck.miles.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-right text-orange-600">{formatCurrency(truck.fuelCost)}</td>
                            <td className="px-4 py-3 text-sm text-right text-purple-600">{formatCurrency(truck.maintenanceCost)}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 font-bold">
                        <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(totalRevenue)}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(totalExpenses)}</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600">{formatCurrency(totalPayroll)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(totalNetProfit)}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {((totalNetProfit / totalRevenue) * 100).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">{totalTrips}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                          {truckFinancialData.reduce((sum, t) => sum + t.miles, 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-orange-600">
                          {formatCurrency(truckFinancialData.reduce((sum, t) => sum + t.fuelCost, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-purple-600">
                          {formatCurrency(truckFinancialData.reduce((sum, t) => sum + t.maintenanceCost, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Trip-wise View */}
          {activeView === 'trips' && (
            <div className="space-y-4">
              {/* Trip-wise Comparison Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#42aeec]" />
                  Trip-wise Revenue vs Expenses vs Net Profit
                </h2>
                <div className="h-96 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={tripFinancialData.map(trip => ({
                        name: trip.tripNumber.split('-')[2],
                        Revenue: trip.revenue,
                        Expenses: trip.expenses + trip.driverPay,
                        'Net Profit': trip.netProfit
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Net Profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MapPin size={20} className="text-[#42aeec]" />
                    Trip-wise Financial Details
                  </h2>
                  <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-all flex items-center gap-2">
                    <Filter size={14} />
                    Filter
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Truck</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Driver Pay</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Profit</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Profit Margin</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tripFinancialData.map((trip) => {
                        const profitMargin = (trip.netProfit / trip.revenue) * 100;
                        return (
                          <tr key={trip.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{trip.tripNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{trip.truckNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="flex items-center gap-1">
                                <span>{trip.origin}</span>
                                <ArrowUpRight size={12} className="text-gray-400" />
                                <span>{trip.destination}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{new Date(trip.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatCurrency(trip.revenue)}</td>
                            <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(trip.expenses)}</td>
                            <td className="px-4 py-3 text-sm text-right text-blue-600">{formatCurrency(trip.driverPay)}</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{formatCurrency(trip.netProfit)}</td>
                            <td className="px-4 py-3 text-sm text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-gray-700">{profitMargin.toFixed(1)}%</span>
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${profitMargin > 40 ? 'bg-green-500' : profitMargin > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(profitMargin, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(trip.status)}`}>
                                {trip.status.replace('-', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan={4} className="px-4 py-3 text-sm text-gray-900">Total</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          {formatCurrency(tripFinancialData.reduce((sum, t) => sum + t.revenue, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          {formatCurrency(tripFinancialData.reduce((sum, t) => sum + t.expenses, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600">
                          {formatCurrency(tripFinancialData.reduce((sum, t) => sum + t.driverPay, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatCurrency(tripFinancialData.reduce((sum, t) => sum + t.netProfit, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {(
                            (tripFinancialData.reduce((sum, t) => sum + t.netProfit, 0) /
                              tripFinancialData.reduce((sum, t) => sum + t.revenue, 0)) *
                            100
                          ).toFixed(1)}
                          %
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Time-based Reports View */}
          {activeView === 'time-based' && (
            <div className="space-y-4">
              {/* Period Selector */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Report Period:</label>
                  <div className="flex gap-2">
                    {(['monthly', 'quarterly', 'half-yearly', 'yearly'] as TimePeriod[]).map((period) => (
                      <button
                        key={period}
                        onClick={() => setTimePeriod(period)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          timePeriod === period
                            ? 'bg-gradient-to-r from-[#42aeec] to-[#0ea3d8] text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {period === 'half-yearly' ? 'Half Yearly' : period.charAt(0).toUpperCase() + period.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time-based Comparison Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#42aeec]" />
                  {timePeriod === 'half-yearly' ? 'Half Yearly' : timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Revenue vs Expenses vs Net Profit Trend
                </h2>
                <div className="h-96 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getCurrentReports().map(report => ({
                        period: report.period,
                        Revenue: report.revenue,
                        Expenses: report.expenses + report.payroll,
                        'Net Profit': report.netProfit
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="period"
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Expenses"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Net Profit"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time-based Comparison Bar Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#42aeec]" />
                  {timePeriod === 'half-yearly' ? 'Half Yearly' : timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Comparison
                </h2>
                <div className="h-96 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getCurrentReports().map(report => ({
                        period: report.period,
                        Revenue: report.revenue,
                        Expenses: report.expenses + report.payroll,
                        'Net Profit': report.netProfit
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="period"
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Net Profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time-based Reports Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-[#42aeec]" />
                  {timePeriod === 'half-yearly' ? 'Half Yearly' : timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Financial Reports
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payroll</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Invoices</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Profit</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Profit Margin</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice Count</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Expense Count</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Payroll Count</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getCurrentReports().map((report, index) => {
                        const profitMargin = (report.netProfit / report.revenue) * 100;
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.period}</td>
                            <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatCurrency(report.revenue)}</td>
                            <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(report.expenses)}</td>
                            <td className="px-4 py-3 text-sm text-right text-blue-600">{formatCurrency(report.payroll)}</td>
                            <td className="px-4 py-3 text-sm text-right text-purple-600">{formatCurrency(report.invoices)}</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{formatCurrency(report.netProfit)}</td>
                            <td className="px-4 py-3 text-sm text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-gray-700">{profitMargin.toFixed(1)}%</span>
                                <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${profitMargin > 50 ? 'bg-green-500' : profitMargin > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(profitMargin, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-700">{report.invoiceCount}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-700">{report.expenseCount}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-700">{report.payrollCount}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 font-bold">
                        <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          {formatCurrency(getCurrentReports().reduce((sum, r) => sum + r.revenue, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          {formatCurrency(getCurrentReports().reduce((sum, r) => sum + r.expenses, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600">
                          {formatCurrency(getCurrentReports().reduce((sum, r) => sum + r.payroll, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-purple-600">
                          {formatCurrency(getCurrentReports().reduce((sum, r) => sum + r.invoices, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatCurrency(getCurrentReports().reduce((sum, r) => sum + r.netProfit, 0))}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {(
                            (getCurrentReports().reduce((sum, r) => sum + r.netProfit, 0) /
                              getCurrentReports().reduce((sum, r) => sum + r.revenue, 0)) *
                            100
                          ).toFixed(1)}
                          %
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {getCurrentReports().reduce((sum, r) => sum + r.invoiceCount, 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {getCurrentReports().reduce((sum, r) => sum + r.expenseCount, 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {getCurrentReports().reduce((sum, r) => sum + r.payrollCount, 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Cards for Time-based Reports */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="text-sm text-gray-600 mb-1">Average Revenue</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      getCurrentReports().reduce((sum, r) => sum + r.revenue, 0) / getCurrentReports().length
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Per {timePeriod === 'half-yearly' ? 'half year' : timePeriod === 'yearly' ? 'year' : timePeriod.slice(0, -2)}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="text-sm text-gray-600 mb-1">Average Expenses</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(
                      getCurrentReports().reduce((sum, r) => sum + r.expenses, 0) / getCurrentReports().length
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Per {timePeriod === 'half-yearly' ? 'half year' : timePeriod === 'yearly' ? 'year' : timePeriod.slice(0, -2)}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="text-sm text-gray-600 mb-1">Average Profit</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      getCurrentReports().reduce((sum, r) => sum + r.netProfit, 0) / getCurrentReports().length
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Per {timePeriod === 'half-yearly' ? 'half year' : timePeriod === 'yearly' ? 'year' : timePeriod.slice(0, -2)}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="text-sm text-gray-600 mb-1">Profit Margin</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {(
                      (getCurrentReports().reduce((sum, r) => sum + r.netProfit, 0) /
                        getCurrentReports().reduce((sum, r) => sum + r.revenue, 0)) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Overall margin</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceReport;
