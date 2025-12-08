import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  AlertCircle,
  Calendar,
  FileText,
  DollarSign,
  Calculator,
  Receipt,
  ChartLine,
  Handshake,
  CreditCard,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { listInvoices } from '../../../axios/api/account.invoices';
import { listExpenses } from '../../../axios/api/account.expense';
import { listPayrolls } from '../../../axios/api/account.payroll';
import { FLEET_COLORS } from '../fleetMaintenance/colorUtils';

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
}

interface TrendInfo {
  value: string;
  positive: boolean;
}

interface RecentExpense {
  type: string;
  amount: number;
  employee: string;
  date: string;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: TrendInfo | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, expensesRes, payrollsRes] = await Promise.all([
        listInvoices(),
        listExpenses(),
        listPayrolls()
      ]);

      const invoicesData = invoicesRes?.success ? invoicesRes.data || [] : [];
      const expensesData = expensesRes?.success ? expensesRes.data || [] : [];
      const payrollsData = payrollsRes?.success ? payrollsRes.data || [] : [];

      setInvoices(invoicesData);
      setExpenses(expensesData);
      setPayrolls(payrollsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeAmount = (value?: number | string) => {
    const numeric = typeof value === 'string' ? parseFloat(value) : value;
    return Number.isFinite(numeric) ? Number(numeric) : 0;
  };

  const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : 'N/A');


  const sectionCardStyle = {
    borderColor: FLEET_COLORS.focusRing,
    boxShadow: `0 18px 35px ${FLEET_COLORS.focusRing}`,
  };


  const primaryButtonStyle: React.CSSProperties = {
    background: FLEET_COLORS.gradient,
    color: '#fff',
    border: 'none',
    boxShadow: `0 12px 25px ${FLEET_COLORS.focusRing}`,
  };

  // Calculate stats from real data
  const totalRevenue = invoices.reduce((sum, inv) => sum + normalizeAmount(inv.amount), 0);
  const pendingRevenue = invoices
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + normalizeAmount(inv.amount), 0);
  
  // Calculate pending/unpaid invoices
  const pendingInvoices = invoices.filter((inv) => inv.status === 'pending' || inv.status === 'unpaid');
  const totalPendingUnpaidInvoices = pendingInvoices.reduce((sum, inv) => sum + normalizeAmount(inv.amount), 0);
  const pendingInvoicesCount = pendingInvoices.length;
  
  // Calculate overdue invoices
  const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');
  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + normalizeAmount(inv.amount), 0);
  
  const totalExpenses = expenses.reduce((sum, exp) => sum + normalizeAmount(exp.amount), 0);
  
  // Calculate expense categories for top 5
  const expenseCategories = expenses.reduce((acc: Record<string, number>, exp) => {
    const category = exp.type || 'Uncategorized';
    acc[category] = (acc[category] || 0) + normalizeAmount(exp.amount);
    return acc;
  }, {});
  const topExpenseCategories = Object.entries(expenseCategories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  const totalPayroll = payrolls.reduce((sum, payroll) => sum + normalizeAmount(payroll.totalSalary), 0);
  const totalEmployees = payrolls.length;
  
  // Placeholder for settlements - to be implemented when settlement API is available
  const totalPendingSettlements = 0; // TODO: Fetch from settlement API
  const pendingSettlementsCount = 0; // TODO: Fetch from settlement API

  const recentExpenses: RecentExpense[] = expenses.slice(0, 4).map((exp) => ({
    type: exp.type || 'Unknown',
    amount: normalizeAmount(exp.amount),
    employee: exp.userId?.name || 'Unknown',
    date: formatDate(exp.date),
  }));

const StatCard = ({
  title,
  value,
  subtitle = '',
  trend = null,
  onClick,
}: StatCardProps & { onClick?: () => void }) => {

    return (
      <div 
        onClick={onClick}
        className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${
          onClick ? 'cursor-pointer hover:scale-105' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            {trend ? (
              <div
                className={`flex items-center mt-2 text-sm ${
                  trend.positive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <TrendingUp size={14} className="mr-1" />
                <span>{trend.value}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading accounts data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your trucking operations and financial metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="space-y-6 mb-8">
          {/* First Row - Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Revenue" 
              value={`$${totalRevenue.toLocaleString()}`} 
              subtitle={`${invoices.length} invoices`}
              onClick={() => navigate('/admin/accounts/invoice')}
            />
            <StatCard 
              title="Total Expenses" 
              value={`$${totalExpenses.toLocaleString()}`} 
              subtitle={`${expenses.length} transactions`}
              onClick={() => navigate('/admin/accounts/expenses')}
            />
            <StatCard 
              title="Total Payroll" 
              value={`$${totalPayroll.toLocaleString()}`} 
              subtitle={`${totalEmployees} employees`}
              onClick={() => navigate('/admin/accounts/payroll')}
            />
            <StatCard 
              title="Net Profit" 
              value={`$${(totalRevenue - totalExpenses - totalPayroll).toLocaleString()}`} 
              subtitle="Revenue - Expenses - Payroll"
              onClick={() => navigate('/admin/accounts/invoice')}
            />
          </div>
          {/* Second Row - Enhanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <StatCard 
              title="Pending/Unpaid Invoices" 
              value={`$${totalPendingUnpaidInvoices.toLocaleString()}`} 
              subtitle={`${pendingInvoicesCount} invoices`}
              onClick={() => navigate('/admin/accounts/invoice')}
            />
            <StatCard 
              title="Open/Pending Settlements" 
              value={`$${totalPendingSettlements.toLocaleString()}`} 
              subtitle={`${pendingSettlementsCount} settlements`}
              onClick={() => navigate('/admin/accounts/settlement')}
            />
          </div>
        </div>

        {/* Module Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Accounts Management Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={sectionCardStyle}>
            <div 
              className="p-6 border-b border-gray-100"
              style={{ background: FLEET_COLORS.gradient }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <ChartLine className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Accounts Management</h3>
                    <p className="text-sm text-white text-opacity-90">Chart of Accounts & Financial Categories</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin/accounts/accounts-management/chart-of-accounts')}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg text-sm font-medium transition-all"
                >
                  View →
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => navigate('/admin/accounts/invoice')}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="text-blue-600" size={18} />
                      <span className="text-sm font-semibold text-gray-700">Revenue</span>
                    </div>
                    <p className="text-xs text-gray-600">Trip settlements, load payments</p>
                  </div>
                  <div 
                    onClick={() => navigate('/admin/accounts/expenses')}
                    className="p-4 bg-red-50 rounded-lg border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="text-red-600" size={18} />
                      <span className="text-sm font-semibold text-gray-700">Expenses</span>
                    </div>
                    <p className="text-xs text-gray-600">Fuel, repairs, maintenance</p>
                  </div>
                  <div 
                    onClick={() => navigate('/admin/accounts/settlement')}
                    className="p-4 bg-green-50 rounded-lg border border-green-100 cursor-pointer hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Handshake className="text-green-600" size={18} />
                      <span className="text-sm font-semibold text-gray-700">Settlements</span>
                    </div>
                    <p className="text-xs text-gray-600">Driver & owner-operator pay</p>
                  </div>
                  <div 
                    onClick={() => navigate('/admin/accounts/settlement')}
                    className="p-4 bg-purple-50 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="text-purple-600" size={18} />
                      <span className="text-sm font-semibold text-gray-700">Deductions</span>
                    </div>
                    <p className="text-xs text-gray-600">Advances, repairs, insurance</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong className="text-gray-900">Auto-Posting:</strong> Every financial entry automatically posts to the correct account
                  </p>
                  <button
                    onClick={() => navigate('/admin/accounts/accounts-management/chart-of-accounts')}
                    className="w-full px-4 py-3 rounded-lg text-base font-semibold transition-colors text-white shadow-lg"
                    style={{ background: FLEET_COLORS.gradient }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    📊 Manage Chart of Accounts
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Settlement Module Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={sectionCardStyle}>
            <div 
              className="p-6 border-b border-gray-100"
              style={{ background: FLEET_COLORS.gradient }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <Calculator className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Settlement Module</h3>
                    <p className="text-sm text-white text-opacity-90">Driver & Owner-Operator Settlements</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin/accounts/settlement')}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg text-sm font-medium transition-all"
                >
                  View →
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div 
                    onClick={() => navigate('/admin/accounts/settlement?section=trip-calculations')}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <CheckCircle2 className="text-green-600 mt-0.5" size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Trip-wise Calculations</p>
                      <p className="text-xs text-gray-600">Miles, Rate, FSC, Accessorials</p>
                    </div>
                    <ArrowRight className="text-gray-400" size={16} />
                  </div>
                  <div 
                    onClick={() => navigate('/admin/accounts/settlement?section=pay-methods')}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <CheckCircle2 className="text-green-600 mt-0.5" size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Pay Methods</p>
                      <p className="text-xs text-gray-600">Per mile / Per load basis</p>
                    </div>
                    <ArrowRight className="text-gray-400" size={16} />
                  </div>
                  <div 
                    onClick={() => navigate('/admin/accounts/settlement?section=deductions-addons')}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <CheckCircle2 className="text-green-600 mt-0.5" size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Deductions & Additions</p>
                      <p className="text-xs text-gray-600">Fuel, advances, bonuses, reimbursements</p>
                    </div>
                    <ArrowRight className="text-gray-400" size={16} />
                  </div>
                  <div 
                    onClick={() => navigate('/admin/accounts/settlement?section=unpaid')}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <Clock className="text-yellow-600 mt-0.5" size={18} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Unpaid/Addons</p>
                      <p className="text-xs text-gray-600">View pending settlements and additions</p>
                    </div>
                    <ArrowRight className="text-gray-400" size={16} />
                  </div>
                </div>
                <div 
                  onClick={() => navigate('/admin/accounts/settlement?section=auto-consolidated')}
                  className="pt-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg cursor-pointer hover:from-blue-100 hover:to-green-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Auto-Consolidated Settlement</span>
                    <ArrowRight className="text-gray-400" size={16} />
                  </div>
                  <p className="text-xs text-gray-600">
                    When a trip is completed, Logistiq automatically calculates and generates a ready-to-approve settlement sheet
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/accounts/settlement')}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                  style={{ background: FLEET_COLORS.gradient }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  View Settlements
                </button>
              </div>
            </div>
          </div>

          {/* Expense Management Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={sectionCardStyle}>
            <div 
              className="p-6 border-b border-gray-100"
              style={{ background: FLEET_COLORS.gradient }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <Receipt className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Expense Management</h3>
                    <p className="text-sm text-white text-opacity-90">Track & Record All Company Expenses</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin/accounts/expenses')}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg text-sm font-medium transition-all"
                >
                  View →
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Top 5 Expense Categories */}
                {topExpenseCategories.length > 0 && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingDown className="text-orange-600" size={16} />
                      Top 5 Expense Categories
                    </h4>
                    <div className="space-y-2">
                      {topExpenseCategories.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">{item.category}</span>
                          <span className="text-xs font-semibold text-gray-900">${item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <CreditCard className="text-orange-600 mb-2" size={20} />
                    <p className="text-xs font-semibold text-gray-700">Fuel Receipts</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <FileText className="text-blue-600 mb-2" size={20} />
                    <p className="text-xs font-semibold text-gray-700">Repairs & Shop</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle2 className="text-green-600 mb-2" size={20} />
                    <p className="text-xs font-semibold text-gray-700">Compliance Fees</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <DollarSign className="text-purple-600 mb-2" size={20} />
                    <p className="text-xs font-semibold text-gray-700">Insurance & Tolls</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="text-green-600" size={16} />
                    <span>Upload receipts with images</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="text-green-600" size={16} />
                    <span>Map to truck/driver & accounts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="text-green-600" size={16} />
                    <span>Auto-reflect in P&L & settlements</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/admin/accounts/expenses')}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                    style={{ background: FLEET_COLORS.gradient }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    Manage Expenses
                  </button>
                  <button
                    onClick={() => navigate('/admin/accounts/expenses')}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Receipts Archive
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Invoicing Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={sectionCardStyle}>
            <div 
              className="p-6 border-b border-gray-100"
              style={{ background: FLEET_COLORS.gradient }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <FileText className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Invoicing</h3>
                    <p className="text-sm text-white text-opacity-90">Billing & Payment Management</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin/accounts/invoice')}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg text-sm font-medium transition-all"
                >
                  View →
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Total Overdue Amount - Key Financial Metric */}
                {totalOverdueAmount > 0 && (
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Overdue Amount</p>
                        <p className="text-xl font-bold text-red-700">${totalOverdueAmount.toLocaleString()}</p>
                      </div>
                      <AlertCircle className="text-red-600" size={24} />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{overdueInvoices.length} overdue invoice(s)</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg text-center">
                    <p className="text-lg font-bold text-green-800">
                      {invoices.filter(inv => inv.status === 'paid').length}
                    </p>
                    <p className="text-xs text-green-700">Paid</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg text-center">
                    <p className="text-lg font-bold text-yellow-800">
                      {invoices.filter(inv => inv.status === 'pending').length}
                    </p>
                    <p className="text-xs text-yellow-700">Pending</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg text-center">
                    <p className="text-lg font-bold text-red-800">
                      {invoices.filter(inv => inv.status === 'overdue').length}
                    </p>
                    <p className="text-xs text-red-700">Overdue</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="text-green-600" size={16} />
                    <span>Auto-generate from completed loads</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="text-green-600" size={16} />
                    <span>View paid / unpaid / overdue status</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="text-green-600" size={16} />
                    <span>Apply payments & export PDF</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-3">
                    Invoices use load details, rate confirmations, and accessorial charges automatically
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/admin/accounts/invoice')}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                      style={{ background: FLEET_COLORS.gradient }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                    >
                      Manage Invoices
                    </button>
                    <button
                      onClick={() => navigate('/admin/accounts/invoice?action=create')}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                    >
                      New Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Overview & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Invoices */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                <button
                  onClick={() => navigate('/admin/accounts/invoice')}
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  style={primaryButtonStyle}
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading invoices...</div>
              ) : invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.slice(0, 4).map((invoice) => (
                    <div key={invoice._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{invoice.clientName}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{invoice.clientCompany || 'No company'}</p>
                      <p className="text-sm text-gray-600 mb-1">Amount: ${normalizeAmount(invoice.amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Due: {formatDate(invoice.dueDate)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No invoices found</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100" style={sectionCardStyle}>
            <div 
              onClick={() => navigate('/admin/accounts/expenses')}
              className="p-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
                <span className="text-sm text-gray-500">View All →</span>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-4 text-gray-500">Loading expenses...</div>
              ) : recentExpenses.length > 0 ? (
                <div className="space-y-4">
                  {recentExpenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{expense.type}</p>
                        <p className="text-xs text-gray-500">{expense.employee} • {expense.date}</p>
                      </div>
                      <span className="text-sm font-semibold text-red-600">-${expense.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No expenses found</div>
              )}
                <button 
                onClick={() => navigate('/admin/accounts/expenses')}
                className="w-full mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={primaryButtonStyle}
              >
                View All Expenses
              </button>
            </div>
          </div>
        </div>


        {/* Alerts & Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notifications</h3>
          <div className="space-y-3">
            {pendingRevenue > 0 && (
              <div 
                onClick={() => navigate('/admin/accounts/invoice')}
                className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
              >
                <AlertCircle className="text-yellow-600 mr-3" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Pending Invoices</p>
                  <p className="text-xs text-yellow-600">${pendingRevenue.toLocaleString()} in pending payments</p>
                </div>
              </div>
            )}
            {totalPayroll > 0 && (
              <div 
                onClick={() => navigate('/admin/accounts/payroll')}
                className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              >
                <Calendar className="text-blue-600 mr-3" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Payroll Summary</p>
                  <p className="text-xs text-blue-600">${totalPayroll.toLocaleString()} total payroll for {totalEmployees} employees</p>
                </div>
              </div>
            )}
            {totalExpenses > 0 && (
              <div 
                onClick={() => navigate('/admin/accounts/expenses')}
                className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
              >
                <FileText className="text-red-600 mr-3" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Total Expenses</p>
                  <p className="text-xs text-red-600">${totalExpenses.toLocaleString()} in {expenses.length} transactions</p>
                </div>
              </div>
            )}
            {invoices.length === 0 && expenses.length === 0 && payrolls.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No financial data available yet. Start by creating invoices, expenses, or payroll records.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;