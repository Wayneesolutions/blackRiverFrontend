import { useState, useEffect,useRef } from 'react';
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
import { getFinanceReport } from '../../../../axios/api/account.financeReport';
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

type TimePeriod = '2weeks' | '1month' | 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
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
  totalMiles?: number;
  startDate?: string;
  endDate?: string;
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
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if we've loaded data from backend
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalPayroll: 0,
    netProfit: 0,
    totalTrips: 0,
    activeTrucks: 0
  });
  const [invoiceSummary, setInvoiceSummary] = useState({
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0
  });
  const [expenseBreakdown, setExpenseBreakdown] = useState({
    fuelCosts: 0,
    maintenance: 0,
    otherExpenses: 0
  });
  const [truckFinancialData, setTruckFinancialData] = useState<TruckFinancialData[]>([]);
  const [tripFinancialData, setTripFinancialData] = useState<TripFinancialData[]>([]);
  const [timeBasedData, setTimeBasedData] = useState<TimeBasedReport[]>([]);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  
  // Synchronize scrollbars for trip-wise table
  useEffect(() => {
    const topScroll = topScrollRef.current;
    const bottomScroll = bottomScrollRef.current;

    if (!topScroll || !bottomScroll) return;

    const handleTopScroll = () => {
      if (bottomScroll) {
        bottomScroll.scrollLeft = topScroll.scrollLeft;
      }
    };

    const handleBottomScroll = () => {
      if (topScroll) {
        topScroll.scrollLeft = bottomScroll.scrollLeft;
      }
    };

    topScroll.addEventListener('scroll', handleTopScroll);
    bottomScroll.addEventListener('scroll', handleBottomScroll);

    // Set the width of top scrollbar content to match table width
    const updateScrollWidth = () => {
      const table = bottomScroll.querySelector('table');
      const scrollContent = topScroll.querySelector('.top-scroll-content');
      if (table && scrollContent) {
        (scrollContent as HTMLElement).style.width = `${table.scrollWidth}px`;
      }
    };

    updateScrollWidth();
    
    // Update scroll width when window resizes or data changes
    const resizeObserver = new ResizeObserver(updateScrollWidth);
    if (bottomScroll) resizeObserver.observe(bottomScroll);

    return () => {
      topScroll.removeEventListener('scroll', handleTopScroll);
      bottomScroll.removeEventListener('scroll', handleBottomScroll);
      resizeObserver.disconnect();
    };
  }, [activeView, tripFinancialData]);
  
  // Fetch finance report data on initial mount
  useEffect(() => {
    console.log('📊 [useEffect] Initial mount - fetching finance report data');
    fetchFinanceReport();
  }, []); // Empty dependency array - only run on mount

  // Fetch finance report data when timePeriod changes
  useEffect(() => {
    if (dataLoaded) { // Only refetch if we've already loaded data once
      console.log('📊 [useEffect] Period changed - fetching data for period:', timePeriod);
      fetchFinanceReport();
    }
  }, [timePeriod]);

  // Also fetch when switching to time-based view
  useEffect(() => {
    if (activeView === 'time-based' && dataLoaded) {
      console.log('📊 [useEffect] Switched to time-based view, fetching data');
      fetchFinanceReport();
    }
  }, [activeView]);

  const fetchFinanceReport = async () => {
    setLoading(true);
    try {
      console.log('📊 [Finance Report Frontend] Calling API with period:', timePeriod);
      const response = await getFinanceReport({ period: timePeriod });

      console.log('📊 [Finance Report Frontend] API Response:', {
        success: response?.success,
        hasData: !!response?.data,
        hasOverview: !!response?.data?.overview,
        overview: response?.data?.overview,
        truckWiseCount: response?.data?.truckWise?.length || 0,
        tripWiseCount: response?.data?.tripWise?.length || 0,
        timeBasedCount: response?.data?.timeBased?.length || 0,
        fullResponse: response
      });

      if (response?.success && response?.data) {
        console.log('📊 [Finance Report Frontend] Full response data:', {
          overview: response.data.overview,
          truckWiseCount: response.data.truckWise?.length || 0,
          tripWiseCount: response.data.tripWise?.length || 0,
          timeBasedCount: response.data.timeBased?.length || 0
        });

        // Set overview data - ensure we use the backend data even if it's 0
        if (response.data.overview) {
          const overviewData = {
            totalRevenue: Number(response.data.overview.totalRevenue) || 0,
            totalExpenses: Number(response.data.overview.totalExpenses) || 0,
            totalPayroll: Number(response.data.overview.totalPayroll) || 0,
            netProfit: Number(response.data.overview.netProfit) || 0,
            totalTrips: Number(response.data.overview.totalTrips) || 0,
            activeTrucks: Number(response.data.overview.activeTrucks) || 0
          };
          console.log('📊 [Finance Report Frontend] Setting overview:', overviewData);
          setOverview(overviewData);
        } else {
          console.warn('📊 [Finance Report Frontend] No overview data in response');
        }

        // Set invoice summary data
        if (response.data.invoiceSummary) {
          const invoiceSummaryData = {
            paidInvoices: Number(response.data.invoiceSummary.paidInvoices) || 0,
            pendingInvoices: Number(response.data.invoiceSummary.pendingInvoices) || 0,
            overdueInvoices: Number(response.data.invoiceSummary.overdueInvoices) || 0
          };
          console.log('📊 [Finance Report Frontend] Setting invoice summary:', invoiceSummaryData);
          setInvoiceSummary(invoiceSummaryData);
        } else {
          console.warn('📊 [Finance Report Frontend] No invoice summary data in response');
          setInvoiceSummary({ paidInvoices: 0, pendingInvoices: 0, overdueInvoices: 0 });
        }

        // Set expense breakdown data
        if (response.data.expenseBreakdown) {
          const expenseBreakdownData = {
            fuelCosts: Number(response.data.expenseBreakdown.fuelCosts) || 0,
            maintenance: Number(response.data.expenseBreakdown.maintenance) || 0,
            otherExpenses: Number(response.data.expenseBreakdown.otherExpenses) || 0
          };
          console.log('📊 [Finance Report Frontend] Setting expense breakdown:', expenseBreakdownData);
          setExpenseBreakdown(expenseBreakdownData);
        } else {
          console.warn('📊 [Finance Report Frontend] No expense breakdown data in response');
          setExpenseBreakdown({ fuelCosts: 0, maintenance: 0, otherExpenses: 0 });
        }

        setTruckFinancialData(response.data.truckWise || []);
        setTripFinancialData(response.data.tripWise || []);
        // Always set timeBasedData, even if empty array, to avoid using static fallback
        setTimeBasedData(response.data.timeBased || []);
        setDataLoaded(true); // Mark that we've loaded data from backend
      } else {
        console.error('📊 [Finance Report Frontend] API response not successful:', {
          success: response?.success,
          message: response?.message,
          data: response?.data
        });
        setDataLoaded(true); // Mark as loaded even on error to avoid static fallback
      }
    } catch (error: any) {
      console.error('📊 [Finance Report Frontend] Error fetching finance report:', {
        error,
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });
      setDataLoaded(true); // Mark as loaded even on error to avoid static fallback
    } finally {
      setLoading(false);
    }
  };



  // Static Trip-wise Financial Data (fallback)


  // Static Monthly Reports (fallback)
  const staticMonthlyReports: TimeBasedReport[] = [
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

  // Static Quarterly Reports (fallback)
  const staticQuarterlyReports: TimeBasedReport[] = [
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

  // Static Half-Yearly Reports (fallback)
  const staticHalfYearlyReports: TimeBasedReport[] = [
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

  // Static Yearly Reports (fallback)
  const staticYearlyReports: TimeBasedReport[] = [
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

  const formatCurrency = (amount: number | undefined | null) => {
    // Handle undefined, null, NaN, or invalid numbers
    if (amount === undefined || amount === null || isNaN(amount) || typeof amount !== 'number') {
      return '$0.00';
    }
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

  // Calculate totals from actual data
  // Prioritize overview data from backend, but fallback to truck-wise calculation if overview is 0
  const totalRevenue = overview.totalRevenue > 0
    ? overview.totalRevenue
    : truckFinancialData.reduce((sum, truck) => sum + (Number(truck.revenue) || 0), 0);
  const totalExpenses = overview.totalExpenses > 0
    ? overview.totalExpenses
    : truckFinancialData.reduce((sum, truck) => sum + (Number(truck.expenses) || 0), 0);
  const totalPayroll = overview.totalPayroll > 0
    ? overview.totalPayroll
    : truckFinancialData.reduce((sum, truck) => sum + (Number(truck.payroll) || 0), 0);
  const totalNetProfit = overview.netProfit !== 0
    ? overview.netProfit
    : truckFinancialData.reduce((sum, truck) => sum + (Number(truck.netProfit) || 0), 0);
  const totalTrips = overview.totalTrips > 0
    ? overview.totalTrips
    : truckFinancialData.reduce((sum, truck) => sum + (Number(truck.trips) || 0), 0);

  console.log('📊 [Finance Report Frontend] Calculated totals:', {
    totalRevenue,
    totalExpenses,
    totalPayroll,
    totalNetProfit,
    totalTrips,
    overview,
    truckDataCount: truckFinancialData.length
  });

  const getCurrentReports = () => {
    // Always use backend data if we've loaded it (even if empty array)
    // Only use static data during initial load before backend data is fetched
    if (dataLoaded) {
      return timeBasedData; // Use backend data (even if empty)
    }
    // Only use static fallback during initial load before data is fetched
    switch (timePeriod) {
      case 'monthly':
        return staticMonthlyReports;
      case 'quarterly':
        return staticQuarterlyReports;
      case 'half-yearly':
        return staticHalfYearlyReports;
      case 'yearly':
        return staticYearlyReports;
      default:
        return staticMonthlyReports;
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
      trend: '—' // No trend data available from backend
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      subtitle: 'Operating costs',
      icon: TrendingDown,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-700',
      cardBg: 'bg-gradient-to-br from-red-50 to-red-100',
      trend: '—' // No trend data available from backend
    },
    {
      title: 'Total Payroll',
      value: formatCurrency(totalPayroll),
      subtitle: 'Driver & employee costs',
      icon: Users,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-700',
      cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      trend: '—' // No trend data available from backend
    },
    {
      title: 'Net Profit',
      value: formatCurrency(totalNetProfit),
      subtitle: 'Revenue - Expenses - Payroll',
      icon: TrendingUp,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-700',
      cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      trend: '—' // No trend data available from backend
    },
    {
      title: 'Total Trips',
      value: totalTrips.toString(),
      subtitle: 'Completed trips',
      icon: MapPin,
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-700',
      cardBg: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
      trend: '—' // No trend data available from backend
    },
    {
      title: 'Active Trucks',
      value: (overview.activeTrucks || truckFinancialData.length).toString(),
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
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeView === tab.id
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

          {/* Loading State */}
          {loading && (
            <div className="p-8 text-center text-gray-500">Loading finance report data...</div>
          )}

          {/* Overview View */}
          {!loading && activeView === 'overview' && (
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
                              <span className={`text-xs font-medium flex items-center gap-1 ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
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
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
                    <div className="text-xs text-gray-500 mt-1">From invoices</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                    <div className="text-xs text-gray-500 mt-1">Operating costs</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-sm text-gray-600 mb-1">Payroll Costs</div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPayroll)}</div>
                    <div className="text-xs text-gray-500 mt-1">Employee & driver</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="text-sm text-gray-600 mb-1">Net Profit</div>
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalNetProfit)}</div>
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
                        <span className="text-sm font-bold text-green-600">
                          {totalRevenue > 0 ? '100.0' : '0.0'}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: totalRevenue > 0 ? '100%' : '0%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Expenses + Payroll</span>
                        <span className="text-sm font-bold text-red-600">
                          {totalRevenue > 0 ? (((totalExpenses + totalPayroll) / totalRevenue) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${totalRevenue > 0 ? ((totalExpenses + totalPayroll) / totalRevenue) * 100 : 0}%` }}
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
                          {totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0}%` }}
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
                      <span className="text-lg font-bold text-green-600">{formatCurrency(invoiceSummary.paidInvoices)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Pending Invoices</span>
                      <span className="text-lg font-bold text-yellow-600">{formatCurrency(invoiceSummary.pendingInvoices)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Overdue Invoices</span>
                      <span className="text-lg font-bold text-red-600">{formatCurrency(invoiceSummary.overdueInvoices)}</span>
                    </div>
                  </div>
                  {dataLoaded && invoiceSummary.paidInvoices === 0 && invoiceSummary.pendingInvoices === 0 && invoiceSummary.overdueInvoices === 0 && (
                    <p className="text-xs text-gray-400 mt-2 text-center">No invoice data available</p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Receipt size={18} className="text-[#42aeec]" />
                    Expense Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Fuel Costs</span>
                      <span className="text-lg font-bold text-blue-600">{formatCurrency(expenseBreakdown.fuelCosts)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Maintenance</span>
                      <span className="text-lg font-bold text-orange-600">{formatCurrency(expenseBreakdown.maintenance)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Other Expenses</span>
                      <span className="text-lg font-bold text-purple-600">{formatCurrency(expenseBreakdown.otherExpenses)}</span>
                    </div>
                  </div>
                  {dataLoaded && expenseBreakdown.fuelCosts === 0 && expenseBreakdown.maintenance === 0 && expenseBreakdown.otherExpenses === 0 && (
                    <p className="text-xs text-gray-400 mt-2 text-center">No expense data available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Truck-wise View */}
          {!loading && activeView === 'trucks' && (
            <div className="space-y-4">
              {/* Period Selector for Truck-wise */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Group by Period:</label>
                  <div className="flex gap-2 flex-wrap">
                    {(['2weeks', '1month', 'monthly'] as TimePeriod[]).map((period) => {
                      const getPeriodLabel = (p: TimePeriod) => {
                        switch (p) {
                          case '2weeks': return '2 Weeks';
                          case '1month': return '1 Month';
                          default: return p.charAt(0).toUpperCase() + p.slice(1);
                        }
                      };
                      return (
                        <button
                          key={period}
                          onClick={() => {
                            console.log('📊 [Truck Period] Changing period to:', period);
                            setTimePeriod(period);
                          }}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${timePeriod === period
                              ? 'bg-gradient-to-r from-[#42aeec] to-[#0ea3d8] !text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {getPeriodLabel(period)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Truck-wise Comparison Chart - Grouped by Time Period */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#42aeec]" />
                  Truck-wise Revenue vs Expenses vs Net Profit (Grouped by {(() => {
                    switch (timePeriod) {
                      case '2weeks': return '2 Weeks';
                      case '1month': return '1 Month';
                      default: return 'Month';
                    }
                  })()})
                </h2>
                <div className="h-96 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        // Group truck trips by time period using trip data
                        const periodMap = new Map<string, {
                          period: string;
                          Revenue: number;
                          Expenses: number;
                          'Net Profit': number;
                          truckCount: number;
                        }>();

                        // Use trip data to group by time period (trips are linked to trucks)
                        // First pass: collect all trips and group by period
                        const periodTruckMap = new Map<string, Set<string>>();

                        tripFinancialData.forEach(trip => {
                          let periodKey = '';
                          let periodLabel = '';

                          try {
                            if (trip.date) {
                              const date = new Date(trip.date);

                              if (timePeriod === '2weeks') {
                                // Group by 2-week periods
                                const year = date.getFullYear();
                                const weekNumber = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
                                const twoWeekPeriod = Math.floor(weekNumber / 2) + 1;
                                periodKey = `${year}-W${twoWeekPeriod}`;
                                periodLabel = `Week ${(twoWeekPeriod - 1) * 2 + 1}-${twoWeekPeriod * 2}, ${year}`;
                              } else if (timePeriod === '1month') {
                                // Group by month
                                const year = date.getFullYear();
                                const month = date.getMonth() + 1;
                                periodKey = `${year}-${month.toString().padStart(2, '0')}`;
                                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                periodLabel = `${monthNames[month - 1]} ${year}`;
                              } else {
                                // Monthly (same as 1month for now)
                                const year = date.getFullYear();
                                const month = date.getMonth() + 1;
                                periodKey = `${year}-${month.toString().padStart(2, '0')}`;
                                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                periodLabel = `${monthNames[month - 1]} ${year}`;
                              }
                            } else {
                              periodKey = 'Unknown';
                              periodLabel = 'Unknown';
                            }
                          } catch (e) {
                            periodKey = 'Unknown';
                            periodLabel = 'Unknown';
                          }

                          if (!periodMap.has(periodKey)) {
                            periodMap.set(periodKey, {
                              period: periodLabel,
                              Revenue: 0,
                              Expenses: 0,
                              'Net Profit': 0,
                              truckCount: 0
                            });
                            periodTruckMap.set(periodKey, new Set());
                          }

                          const periodData = periodMap.get(periodKey)!;
                          periodData.Revenue += Number(trip.revenue) || 0;
                          periodData.Expenses += (Number(trip.expenses) || 0) + (Number(trip.driverPay) || 0);
                          periodData['Net Profit'] += Number(trip.netProfit) || 0;

                          // Track unique trucks per period
                          if (trip.truckNumber) {
                            const truckSet = periodTruckMap.get(periodKey)!;
                            truckSet.add(trip.truckNumber);
                          }
                        });

                        // Update truck counts
                        periodTruckMap.forEach((truckSet, periodKey) => {
                          const periodData = periodMap.get(periodKey);
                          if (periodData) {
                            periodData.truckCount = truckSet.size;
                          }
                        });

                        // Convert to array and sort by period
                        return Array.from(periodMap.values()).sort((a, b) => {
                          return a.period.localeCompare(b.period);
                        });
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="period"
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        height={60}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `${data.period}${data.truckCount ? ` (${data.truckCount} trucks)` : ''}`;
                          }
                          return label;
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                        iconType="square"
                      />
                      <Bar dataKey="Revenue" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Expenses" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Net Profit" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
                          {totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%
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
          {!loading && activeView === 'trips' && (
            <div className="space-y-4">
              {/* Period Selector for Trip-wise */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Group by Period:</label>
                  <div className="flex gap-2 flex-wrap">
                    {(['2weeks', '1month', 'monthly'] as TimePeriod[]).map((period) => {
                      const getPeriodLabel = (p: TimePeriod) => {
                        switch (p) {
                          case '2weeks': return '2 Weeks';
                          case '1month': return '1 Month';
                          default: return p.charAt(0).toUpperCase() + p.slice(1);
                        }
                      };
                      return (
                        <button
                          key={period}
                          onClick={() => {
                            console.log('📊 [Trip Period] Changing period to:', period);
                            setTimePeriod(period);
                          }}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${timePeriod === period
                              ? 'bg-gradient-to-r from-[#42aeec] to-[#0ea3d8] !text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {getPeriodLabel(period)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Trip-wise Comparison Chart - Grouped by Time Period */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#42aeec]" />
                  Trip-wise Revenue vs Expenses vs Net Profit (Grouped by {(() => {
                    switch (timePeriod) {
                      case '2weeks': return '2 Weeks';
                      case '1month': return '1 Month';
                      default: return 'Month';
                    }
                  })()})
                </h2>
                <div className="h-96 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        // Group trips by time period
                        const periodMap = new Map<string, {
                          period: string;
                          Revenue: number;
                          Expenses: number;
                          'Net Profit': number;
                          tripCount: number;
                        }>();

                        tripFinancialData.forEach(trip => {
                          let periodKey = '';
                          let periodLabel = '';

                          try {
                            // Use startDate for grouping, fallback to date if startDate is not available
                            const dateToUse = trip.startDate || trip.date;
                            if (dateToUse) {
                              const date = new Date(dateToUse);

                              if (timePeriod === '2weeks') {
                                // Group by 2-week periods
                                const year = date.getFullYear();
                                const weekNumber = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
                                const twoWeekPeriod = Math.floor(weekNumber / 2) + 1;
                                periodKey = `${year}-W${twoWeekPeriod}`;
                                periodLabel = `Week ${(twoWeekPeriod - 1) * 2 + 1}-${twoWeekPeriod * 2}, ${year}`;
                              } else if (timePeriod === '1month') {
                                // Group by month
                                const year = date.getFullYear();
                                const month = date.getMonth() + 1;
                                periodKey = `${year}-${month.toString().padStart(2, '0')}`;
                                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                periodLabel = `${monthNames[month - 1]} ${year}`;
                              } else {
                                // Monthly (same as 1month for now)
                                const year = date.getFullYear();
                                const month = date.getMonth() + 1;
                                periodKey = `${year}-${month.toString().padStart(2, '0')}`;
                                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                periodLabel = `${monthNames[month - 1]} ${year}`;
                              }
                            } else {
                              periodKey = 'Unknown';
                              periodLabel = 'Unknown';
                            }
                          } catch (e) {
                            periodKey = 'Unknown';
                            periodLabel = 'Unknown';
                          }

                          if (!periodMap.has(periodKey)) {
                            periodMap.set(periodKey, {
                              period: periodLabel,
                              Revenue: 0,
                              Expenses: 0,
                              'Net Profit': 0,
                              tripCount: 0
                            });
                          }

                          const periodData = periodMap.get(periodKey)!;
                          periodData.Revenue += Number(trip.revenue) || 0;
                          periodData.Expenses += (Number(trip.expenses) || 0) + (Number(trip.driverPay) || 0);
                          periodData['Net Profit'] += Number(trip.netProfit) || 0;
                          periodData.tripCount += 1;
                        });

                        // Convert to array and sort by period
                        return Array.from(periodMap.values()).sort((a, b) => {
                          // Simple string comparison should work for date-based periods
                          return a.period.localeCompare(b.period);
                        });
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="period"
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        height={60}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '11px' }}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `${data.period} (${data.tripCount} trips)`;
                          }
                          return label;
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                        iconType="square"
                      />
                      <Bar dataKey="Revenue" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Expenses" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Net Profit" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                  {/* Top Scrollbar - Only visible horizontal scrollbar */}
                  <style>{`
              .top-scrollbar-container {
                overflow-x: auto;
                overflow-y: hidden;
              }
              .top-scrollbar-container::-webkit-scrollbar {
                height: 10px;
              }
              .top-scrollbar-container::-webkit-scrollbar-track {
                background: #f7fafc;
                border-radius: 5px;
              }
              .top-scrollbar-container::-webkit-scrollbar-thumb {
                background: #42aeec;
                border-radius: 5px;
              }
              .top-scrollbar-container::-webkit-scrollbar-thumb:hover {
                background: #0ea3d8;
              }
              .table-container-with-scrollbar {
                overflow-x: auto;
                overflow-y: visible;
              }
              .table-container-with-scrollbar::-webkit-scrollbar {
                height: 10px;
              }
              .table-container-with-scrollbar::-webkit-scrollbar-track {
                background: #f7fafc;
                border-radius: 5px;
              }
              .table-container-with-scrollbar::-webkit-scrollbar-thumb {
                background: #42aeec;
                border-radius: 5px;
              }
              .table-container-with-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #0ea3d8;
              }
            `}</style>
                  <div
                    ref={topScrollRef}
                    className="top-scrollbar-container"
                    style={{
                      height: '20px',
                      marginBottom: '8px',
                      paddingTop: '8px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#42aeec #f7fafc' /* Firefox */
                    }}
                  >
                    <div className="top-scroll-content" style={{ height: '1px', minWidth: '100%' }}></div>
                  </div>
                  {/* Main Table with visible scrollbar */}
                  <div
                    ref={bottomScrollRef}
                    className="table-container-with-scrollbar"
                  >
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Truck</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Miles</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
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
                          // Ensure all values are numbers, defaulting to 0 if undefined/null
                          const revenue = Number(trip.revenue) || 0;
                          const expenses = Number(trip.expenses) || 0;
                          const driverPay = Number(trip.driverPay) || 0;
                          const netProfit = Number(trip.netProfit) || 0;

                          // Calculate profit margin safely
                          const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

                          // Format dates safely
                          let formattedStartDate = 'N/A';
                          let formattedEndDate = 'N/A';
                          try {
                            if (trip.startDate) {
                              formattedStartDate = new Date(trip.startDate).toLocaleDateString();
                            }
                          } catch (e) {
                            formattedStartDate = 'N/A';
                          }
                          try {
                            if (trip.endDate) {
                              formattedEndDate = new Date(trip.endDate).toLocaleDateString();
                            }
                          } catch (e) {
                            formattedEndDate = 'N/A';
                          }

                          return (
                            <tr key={trip.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{trip.tripNumber || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{trip.truckNumber || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                <div className="flex items-center gap-1">
                                  <span>{trip.origin || 'N/A'}</span>
                                  <ArrowUpRight size={12} className="text-gray-400" />
                                  <span>{trip.destination || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-700">{(trip.totalMiles || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{formattedStartDate}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{formattedEndDate}</td>
                              <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatCurrency(revenue)}</td>
                              <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(expenses)}</td>
                              <td className="px-4 py-3 text-sm text-right text-blue-600">{formatCurrency(driverPay)}</td>
                              <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{formatCurrency(netProfit)}</td>
                              <td className="px-4 py-3 text-sm text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs font-medium text-gray-700">{isNaN(profitMargin) ? '0.0' : profitMargin.toFixed(1)}%</span>
                                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${profitMargin > 40 ? 'bg-green-500' : profitMargin > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                      style={{ width: `${Math.min(Math.max(profitMargin, 0), 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(trip.status || 'planned')}`}>
                                  {(trip.status || 'planned').replace('-', ' ')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gray-50 font-bold">
                          <td colSpan={3} className="px-4 py-3 text-sm text-gray-900">Total</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            {tripFinancialData.reduce((sum, t) => sum + (Number(t.totalMiles) || 0), 0).toLocaleString()}
                          </td>
                          <td colSpan={2} className="px-4 py-3"></td>
                          <td className="px-4 py-3 text-sm text-right text-green-600">
                            {formatCurrency(tripFinancialData.reduce((sum, t) => sum + (Number(t.revenue) || 0), 0))}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">
                            {formatCurrency(tripFinancialData.reduce((sum, t) => sum + (Number(t.expenses) || 0), 0))}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-blue-600">
                            {formatCurrency(tripFinancialData.reduce((sum, t) => sum + (Number(t.driverPay) || 0), 0))}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {formatCurrency(tripFinancialData.reduce((sum, t) => sum + (Number(t.netProfit) || 0), 0))}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {(() => {
                              const totalRevenue = tripFinancialData.reduce((sum, t) => sum + (Number(t.revenue) || 0), 0);
                              const totalProfit = tripFinancialData.reduce((sum, t) => sum + (Number(t.netProfit) || 0), 0);
                              return totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';
                            })()}
                            %
                          </td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
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
                  <div className="flex gap-2 flex-wrap">
                    {(['2weeks', '1month', 'monthly', 'quarterly', 'half-yearly', 'yearly'] as TimePeriod[]).map((period) => {
                      const getPeriodLabel = (p: TimePeriod) => {
                        switch (p) {
                          case '2weeks': return '2 Weeks';
                          case '1month': return '1 Month';
                          case 'half-yearly': return 'Half Yearly';
                          default: return p.charAt(0).toUpperCase() + p.slice(1);
                        }
                      };
                      return (
                        <button
                          key={period}
                          onClick={() => {
                            console.log('📊 [Time Period] Changing period to:', period);
                            setTimePeriod(period);
                          }}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${timePeriod === period
                              ? 'bg-gradient-to-r from-[#42aeec] to-[#0ea3d8] !text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {getPeriodLabel(period)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                  Loading time-based reports for {timePeriod}...
                </div>
              )}

              {/* Empty State */}
              {!loading && getCurrentReports().length === 0 && dataLoaded && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                  <p className="text-gray-600 mb-4">No financial data found for the selected period ({timePeriod}).</p>
                  <p className="text-sm text-gray-500">Try selecting a different period or check if you have invoices, expenses, or payroll records.</p>
                </div>
              )}

              {/* Charts and Summary - Only show when not loading and have data */}
              {!loading && getCurrentReports().length > 0 && (
                <>

                  {/* Time-based Comparison Chart */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 size={20} className="text-[#42aeec]" />
                      {(() => {
                        switch (timePeriod) {
                          case '2weeks': return '2 Weeks';
                          case '1month': return '1 Month';
                          case 'half-yearly': return 'Half Yearly';
                          default: return timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1);
                        }
                      })()} Revenue vs Expenses vs Net Profit Trend
                    </h2>
                    <div className="h-96 mb-6">
                      {getCurrentReports().length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={getCurrentReports().map(report => ({
                              period: report.period,
                              Revenue: Number(report.revenue) || 0,
                              Expenses: (Number(report.expenses) || 0) + (Number(report.payroll) || 0),
                              'Net Profit': Number(report.netProfit) || 0
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="period"
                              stroke="#6b7280"
                              style={{ fontSize: '11px' }}
                              height={60}
                            />
                            <YAxis
                              stroke="#6b7280"
                              style={{ fontSize: '11px' }}
                              tickFormatter={(value) => `$${value.toLocaleString()}`}
                            />
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
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          No data available for chart
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time-based Comparison Bar Chart */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 size={20} className="text-[#42aeec]" />
                      {(() => {
                        switch (timePeriod) {
                          case '2weeks': return '2 Weeks';
                          case '1month': return '1 Month';
                          case 'half-yearly': return 'Half Yearly';
                          default: return timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1);
                        }
                      })()} Comparison
                    </h2>
                    <div className="h-96 mb-6">
                      {getCurrentReports().length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getCurrentReports().map(report => ({
                              period: report.period,
                              Revenue: Number(report.revenue) || 0,
                              Expenses: (Number(report.expenses) || 0) + (Number(report.payroll) || 0),
                              'Net Profit': Number(report.netProfit) || 0
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="period"
                              stroke="#6b7280"
                              style={{ fontSize: '11px' }}
                              height={60}
                            />
                            <YAxis
                              stroke="#6b7280"
                              style={{ fontSize: '11px' }}
                              tickFormatter={(value) => `$${value.toLocaleString()}`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                fontSize: '12px'
                              }}
                              formatter={(value: number) => formatCurrency(value)}
                              labelFormatter={(label) => `Period: ${label}`}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                              iconType="square"
                            />
                            <Bar dataKey="Revenue" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Expenses" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Net Profit" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          No data available for chart
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Cards for Time-based Reports */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                      <div className="text-sm text-gray-600 mb-1">Average Revenue</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          getCurrentReports().length > 0
                            ? getCurrentReports().reduce((sum, r) => sum + (Number(r.revenue) || 0), 0) / getCurrentReports().length
                            : 0
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
                          getCurrentReports().length > 0
                            ? getCurrentReports().reduce((sum, r) => sum + (Number(r.expenses) || 0), 0) / getCurrentReports().length
                            : 0
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
                          getCurrentReports().length > 0
                            ? getCurrentReports().reduce((sum, r) => sum + (Number(r.netProfit) || 0), 0) / getCurrentReports().length
                            : 0
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Per {timePeriod === 'half-yearly' ? 'half year' : timePeriod === 'yearly' ? 'year' : timePeriod.slice(0, -2)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                      <div className="text-sm text-gray-600 mb-1">Profit Margin</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(() => {
                          const totalRevenue = getCurrentReports().reduce((sum, r) => sum + (Number(r.revenue) || 0), 0);
                          const totalProfit = getCurrentReports().reduce((sum, r) => sum + (Number(r.netProfit) || 0), 0);
                          return totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';
                        })()}
                        %
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Overall margin</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceReport;
