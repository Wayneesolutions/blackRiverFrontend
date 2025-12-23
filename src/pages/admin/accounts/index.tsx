import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../../../utils/auth';
import {
  DollarSign,
  TrendingUp,
  Users,
  Receipt,
  FileText,
  Calculator,
  BarChart3,
  Handshake,
  TrendingDown,
  CheckCircle2,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Truck
} from 'lucide-react';

interface Invoice {
  _id: string;
  clientName?: string;
  clientCompany?: string;
  amount?: number | string;
  status?: string;
  dueDate?: string;
}

interface Expense {
  _id: string;
  type?: string;
  amount?: number | string;
  userId?: { name?: string };
  date?: string;
}

interface Payroll {
  _id: string;
  totalSalary?: number | string;
  userId?: {
    name?: string;
    role?: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  // Determine route prefix based on user role
  // HR users access via /accounts/*, admin users via /admin/accounts/*
  const routePrefix = userRole === 'hr' ? '/accounts' : '/admin/accounts';
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalPayroll: 0,
    netProfit: 0,
    paidInvoices: 0,
    unpaidOverdue: 0,
    employeePaid: 0,
    employeeUnpaid: 0,
    driverPaid: 0,
    driverUnpaid: 0,
    vendorPayment: 0,
    invoiceCount: 0,
    expenseCount: 0,
    payrollCount: 0,
    employeePaidCount: 0,
    employeeUnpaidCount: 0,
    driverPaidCount: 0,
    driverUnpaidCount: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Import your API functions
      const { listInvoices } = await import('../../../axios/api/account.invoices');
      const { listExpenses } = await import('../../../axios/api/account.expense');
      const { listPayrolls } = await import('../../../axios/api/account.payroll');
      const { getAccountsDashboard } = await import('../../../axios/api/account.dashboard');

      const [invoicesRes, expensesRes, payrollsRes, dashboardRes] = await Promise.all([
        listInvoices(),
        listExpenses(),
        listPayrolls(),
        getAccountsDashboard()
      ]);

      const invoicesData = invoicesRes?.success ? invoicesRes.data || [] : [];
      const expensesData = expensesRes?.success ? expensesRes.data || [] : [];
      const payrollsData = payrollsRes?.success ? payrollsRes.data || [] : [];

      setInvoices(invoicesData);
      setExpenses(expensesData);
      setPayrolls(payrollsData);

      // Set dashboard statistics from API
      if (dashboardRes?.success && dashboardRes.data) {
        const apiData = dashboardRes.data;
        setDashboardStats({
          totalRevenue: apiData.totalRevenue ?? 0,
          totalExpenses: apiData.totalExpenses ?? 0,
          totalPayroll: apiData.totalPayroll ?? 0,
          netProfit: apiData.netProfit ?? 0,
          paidInvoices: apiData.paidInvoices ?? 0,
          unpaidOverdue: apiData.unpaidOverdue ?? 0,
          employeePaid: apiData.employeePaid ?? 0,
          employeeUnpaid: apiData.employeeUnpaid ?? 0,
          driverPaid: apiData.driverPaid ?? 0,
          driverUnpaid: apiData.driverUnpaid ?? 0,
          vendorPayment: apiData.vendorPayment ?? 0,
          invoiceCount: apiData.invoiceCount ?? invoicesData.length,
          expenseCount: apiData.expenseCount ?? expensesData.length,
          payrollCount: apiData.payrollCount ?? apiData.employeePayrollCount ?? 0,
          employeePaidCount: apiData.employeePaidCount ?? 0,
          employeeUnpaidCount: apiData.employeeUnpaidCount ?? 0,
          driverPaidCount: apiData.driverPaidCount ?? 0,
          driverUnpaidCount: apiData.driverUnpaidCount ?? 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setInvoices([]);
      setExpenses([]);
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeAmount = (value?: number | string) => {
    const numeric = typeof value === 'string' ? parseFloat(value) : value;
    return Number.isFinite(numeric) ? Number(numeric) : 0;
  };

  // Use API data if available, otherwise calculate from local data
  const totalRevenue = dashboardStats.totalRevenue || invoices.reduce((sum, inv) => sum + normalizeAmount(inv.amount), 0);
  const pendingRevenue = invoices
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + normalizeAmount(inv.amount), 0);
  const totalExpenses = dashboardStats.totalExpenses || expenses.reduce((sum, exp) => sum + normalizeAmount(exp.amount), 0);
  const totalPayroll = dashboardStats.totalPayroll || payrolls.reduce((sum, payroll) => sum + normalizeAmount(payroll.totalSalary), 0);
  const netProfit = dashboardStats.netProfit || (totalRevenue - totalExpenses - totalPayroll);

  // Row 1: Total Revenue, Total Expenses, Net Profit
  const row1Cards = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      subtitle: `${dashboardStats.invoiceCount} invoices`,
      icon: DollarSign,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-700',
      cardBg: 'bg-gradient-to-br from-green-50 to-green-100'
    },
    {
      id: 'expenses',
      title: 'Total Expenses',
      value: `$${totalExpenses.toLocaleString()}`,
      subtitle: `${dashboardStats.expenseCount} transactions`,
      icon: TrendingDown,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-700',
      cardBg: 'bg-gradient-to-br from-red-50 to-red-100'
    },
    {
      id: 'profit',
      title: 'Net Profit',
      value: `$${netProfit.toLocaleString()}`,
      subtitle: 'Revenue - Expenses - Payroll',
      icon: TrendingUp,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-700',
      cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100'
    }
  ];

  // Row 2: Total Payroll, Paid Invoices, Unpaid Invoices
  const row2Cards = [
    {
      id: 'payroll',
      title: 'Total Payroll',
      value: `$${totalPayroll.toLocaleString()}`,
      subtitle: `${dashboardStats.payrollCount} employees`,
      icon: Users,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-700',
      cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100'
    },
    {
      id: 'paid-invoices',
      title: 'Paid Invoices',
      value: `$${dashboardStats.paidInvoices.toLocaleString()}`,
      subtitle: 'Total paid amount',
      icon: CheckCircle,
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      cardBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100'
    },
    {
      id: 'unpaid-overdue',
      title: 'Unpaid Invoices',
      value: `$${dashboardStats.unpaidOverdue.toLocaleString()}`,
      subtitle: 'Overdue payments',
      icon: XCircle,
      bgColor: 'bg-rose-100',
      iconColor: 'text-rose-700',
      cardBg: 'bg-gradient-to-br from-rose-50 to-rose-100'
    }
  ];

  // Row 3: Employee Paid & Unpaid (Combined)
  const row3Cards = [
    {
      id: 'employees',
      title: 'Employees',
      paidCount: dashboardStats.employeePaidCount,
      unpaidCount: dashboardStats.employeeUnpaidCount,
      totalCount: dashboardStats.employeePaidCount + dashboardStats.employeeUnpaidCount,
      icon: Users,
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-700',
      cardBg: 'bg-gradient-to-br from-indigo-50 to-indigo-100'
    }
  ];

  // Row 4: Driver Paid & Unpaid (Combined)
  const row4Cards = [
    {
      id: 'drivers',
      title: 'Drivers',
      paidCount: dashboardStats.driverPaidCount,
      unpaidCount: dashboardStats.driverUnpaidCount,
      totalCount: dashboardStats.driverPaidCount + dashboardStats.driverUnpaidCount,
      icon: Truck,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-700',
      cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100'
    }
  ];

  const quickActions = [
    {
      id: 'settlements',
      title: 'Settlements',
      subtitle: 'Driver & operator pay',
      value: payrolls.filter(p => p.userId?.role === 'driver').length,
      icon: Handshake,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-700',
      path: `${routePrefix}/settlements`
    },
    {
      id: 'expenses',
      title: 'Expenses',
      subtitle: `${expenses.length} transactions`,
      value: `$${totalExpenses.toLocaleString()}`,
      icon: Receipt,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-700',
      path: `${routePrefix}/expenses`
    },
    {
      id: 'invoices',
      title: 'Invoices',
      subtitle: `${invoices.filter(inv => inv.status === 'pending').length} pending`,
      value: invoices.length,
      icon: FileText,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-700',
      path: `${routePrefix}/invoice`
    },
    {
      id: 'payroll',
      title: 'Payroll',
      subtitle: 'Employees',
      value: payrolls.length,
      icon: Users,
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-700',
      path: `${routePrefix}/payroll`
    },
    {
      id: 'driver-payroll',
      title: 'Driver Payroll',
      subtitle: 'Active drivers',
      value: payrolls.filter(p => p.userId?.role === 'driver').length,
      icon: Users,
      bgColor: 'bg-sky-100',
      iconColor: 'text-sky-700',
      path: `${routePrefix}/driverpayroll`
    },
    {
      id: 'config',
      title: 'Accounting Config',
      subtitle: 'Chart of accounts',
      value: '—',
      icon: BarChart3,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-700',
      path: `${routePrefix}/config`
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen p-4 bg-[#EDF8FF] px-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="relative w-full mx-auto p-2">
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
              <h1 className="text-xl font-bold text-white">Accounts Management</h1>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-xs">Financial Overview</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="space-y-3 -mt-2 mb-4">
            {/* Row 1: Total Revenue, Total Expenses, Net Profit */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {row1Cards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    onClick={() => {
                      if (feature.id === 'revenue' || feature.id === 'profit') {
                        navigate(`${routePrefix}/invoice`);
                      } else if (feature.id === 'expenses') {
                        navigate(`${routePrefix}/expenses`);
                      }
                    }}
                    className={`${feature.cardBg} rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      {/* Left side content */}
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">
                          {feature.title}
                        </h3>

                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-xl font-bold text-gray-900">{feature.value}</span>
                        </div>

                        <p className="text-xs text-gray-400">{feature.subtitle}</p>
                      </div>

                      {/* Right side icon */}
                      <div className={`${feature.bgColor} rounded-lg p-2 shadow-sm`}>
                        <Icon className={feature.iconColor} size={21} strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Row 2: Total Payroll, Paid Invoices, Unpaid Invoices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {row2Cards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    onClick={() => {
                      if (feature.id === 'paid-invoices' || feature.id === 'unpaid-overdue') {
                        navigate(`${routePrefix}/invoice`);
                      } else if (feature.id === 'payroll') {
                        navigate(`${routePrefix}/payroll`);
                      }
                    }}
                    className={`${feature.cardBg} rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      {/* Left side content */}
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">
                          {feature.title}
                        </h3>

                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-xl font-bold text-gray-900">{feature.value}</span>
                        </div>

                        <p className="text-xs text-gray-400">{feature.subtitle}</p>
                      </div>

                      {/* Right side icon */}
                      <div className={`${feature.bgColor} rounded-lg p-2 shadow-sm`}>
                        <Icon className={feature.iconColor} size={21} strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Row 3: Employees & Drivers (Paid & Unpaid Combined) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Employees Card */}
              {row3Cards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    onClick={() => {
                      navigate(`${routePrefix}/payroll`);
                    }}
                    className={`${feature.cardBg} rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      {/* Left side content */}
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">
                          {feature.title}
                        </h3>

                        <div className="flex items-center gap-4 mb-1">
                          <div className="flex items-center gap-2">
                            <UserCheck className="text-emerald-600" size={18} />
                            <div>
                              <span className="text-lg font-bold text-gray-900">{feature.paidCount}</span>
                              <p className="text-xs text-gray-500">Paid</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserX className="text-amber-600" size={18} />
                            <div>
                              <span className="text-lg font-bold text-gray-900">{feature.unpaidCount}</span>
                              <p className="text-xs text-gray-500">Unpaid</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400">Total: {feature.totalCount} employees</p>
                      </div>

                      {/* Right side icon */}
                      <div className={`${feature.bgColor} rounded-lg p-2 shadow-sm`}>
                        <Icon className={feature.iconColor} size={21} strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Drivers Card */}
              {row4Cards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    onClick={() => {
                      navigate(`${routePrefix}/driverpayroll`);
                    }}
                    className={`${feature.cardBg} rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      {/* Left side content */}
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">
                          {feature.title}
                        </h3>

                        <div className="flex items-center gap-4 mb-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-emerald-600" size={18} />
                            <div>
                              <span className="text-lg font-bold text-gray-900">{feature.paidCount}</span>
                              <p className="text-xs text-gray-500">Paid</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="text-amber-600" size={18} />
                            <div>
                              <span className="text-lg font-bold text-gray-900">{feature.unpaidCount}</span>
                              <p className="text-xs text-gray-500">Unpaid</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400">Total: {feature.totalCount} drivers</p>
                      </div>

                      {/* Right side icon */}
                      <div className={`${feature.bgColor} rounded-lg p-2 shadow-sm`}>
                        <Icon className={feature.iconColor} size={21} strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden p-6 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions & Modules</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    onClick={() => navigate(action.path)}
                    className="group p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`${action.bgColor} group-hover:bg-white p-2 rounded-lg transition-colors`}>
                        <Icon className={`h-5 w-5 ${action.iconColor}`} />
                      </div>
                      <span className="text-lg font-bold text-gray-900 group-hover:text-blue-700">
                        {action.value}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-blue-800">{action.title}</p>
                    <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-600">{action.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Settlement Module */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100" style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <Calculator className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Settlement Module</h3>
                      <p className="text-xs text-white text-opacity-90">Driver & Owner-Operator Pay</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`${routePrefix}/settlements`)}
                    className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg text-xs font-medium transition-all"
                  >
                    View →
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="text-green-600 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Trip-wise Calculations</p>
                      <p className="text-xs text-gray-600">Miles, Rate, FSC, Accessorials</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="text-green-600 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Auto-Generated</p>
                      <p className="text-xs text-gray-600">Ready-to-approve settlement sheets</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100" style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <Receipt className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Expense Management</h3>
                      <p className="text-xs text-white text-opacity-90">Track All Company Expenses</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`${routePrefix}/expenses`)}
                    className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg text-xs font-medium transition-all"
                  >
                    View →
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                    <CreditCard className="text-orange-600 mb-1" size={16} />
                    <p className="text-xs font-semibold text-gray-700">Fuel Receipts</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <FileText className="text-blue-600 mb-1" size={16} />
                    <p className="text-xs font-semibold text-gray-700">Repairs</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <CheckCircle2 className="text-green-600" size={14} />
                    <span>Upload receipts with images</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <CheckCircle2 className="text-green-600" size={14} />
                    <span>Auto-reflect in P&L & settlements</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {pendingRevenue > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Alerts & Notifications</h3>
              <div
                onClick={() => navigate(`${routePrefix}/invoice`)}
                className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
              >
                <AlertCircle className="text-yellow-600 mr-3" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Pending Invoices</p>
                  <p className="text-xs text-yellow-600">${pendingRevenue.toLocaleString()} in pending payments</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;