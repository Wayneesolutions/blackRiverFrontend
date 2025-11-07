import React, { useState, useEffect } from 'react';
import { 
  Truck,  DollarSign, Users, Gauge, 
  TrendingUp, AlertCircle, Calendar, FileText, Building2
} from 'lucide-react';
import { listInvoices } from '../../../axios/api/account.invoices';
import { listExpenses } from '../../../axios/api/account.expense';
import { listPayrolls } from '../../../axios/api/account.payroll';

const Dashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userInfoString = localStorage.getItem('userInfo');
      let userInfo: any = null;
      if (userInfoString) {
        try {
          userInfo = JSON.parse(userInfoString);
        } catch (err) {
          console.error('Error parsing userInfo from localStorage:', err);
        }
      }

      if (userInfo && userInfo.role !== 'superadmin' && !userInfo.company) {
        setInvoices([]);
        setExpenses([]);
        setPayrolls([]);
        setEmptyStateMessage(null);
        return;
      }

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

      const responseMessage = invoicesRes?.message || expensesRes?.message || payrollsRes?.message;
      const hasData = invoicesData.length > 0 || expensesData.length > 0 || payrollsData.length > 0;

      if (responseMessage && !hasData) {
        setEmptyStateMessage(responseMessage);
      } else {
        setEmptyStateMessage(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setEmptyStateMessage('Failed to load accounts data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real data
  const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const paidRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const pendingRevenue = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  
  const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const fuelExpenses = expenses.filter(exp => exp.type && exp.type.includes('Fuel')).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  
  const totalPayroll = payrolls.reduce((sum, payroll) => sum + (Number(payroll.totalSalary) || 0), 0);
  const totalEmployees = payrolls.length;

  const recentExpenses = expenses.slice(0, 4).map(exp => ({
    type: exp.type || 'Unknown',
    amount: Number(exp.amount) || 0,
    employee: exp.userId?.name || 'Unknown',
    date: exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'
  }));

  const StatCard = ({ title, value, icon: Icon, color = 'blue', subtitle = '', trend = null }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} className="mr-1" />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 flex-shrink-0`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading accounts data...</p>
      </div>
    );
  }

  if (emptyStateMessage) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 flex flex-col items-center justify-center text-center space-y-4">
        <Building2 className="h-16 w-16 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-800">No accounts data available</h2>
        <p className="text-gray-500 max-w-md">{emptyStateMessage}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fleet Management Dashboard</h1>
          <p className="text-gray-600">Overview of your trucking operations and financial metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Revenue" 
            value={`$${totalRevenue.toLocaleString()}`} 
            icon={DollarSign} 
            color="green"
            subtitle={`${invoices.length} invoices`}
          />
          <StatCard 
            title="Total Expenses" 
            value={`$${totalExpenses.toLocaleString()}`} 
            icon={Gauge} 
            color="orange"
            subtitle={`${expenses.length} transactions`}
          />
          <StatCard 
            title="Total Payroll" 
            value={`$${totalPayroll.toLocaleString()}`} 
            icon={Users} 
            color="blue"
            subtitle={`${totalEmployees} employees`}
          />
          <StatCard 
            title="Net Profit" 
            value={`$${(totalRevenue - totalExpenses - totalPayroll).toLocaleString()}`} 
            icon={TrendingUp} 
            color="purple"
            subtitle="Revenue - Expenses - Payroll"
          />
        </div>

        {/* Financial Overview & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Invoices */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</button>
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
                      <p className="text-sm text-gray-600 mb-1">Amount: ${Number(invoice.amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
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
              <button className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
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
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="text-yellow-600 mr-3" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Pending Invoices</p>
                  <p className="text-xs text-yellow-600">${pendingRevenue.toLocaleString()} in pending payments</p>
                </div>
              </div>
            )}
            {totalPayroll > 0 && (
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Calendar className="text-blue-600 mr-3" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-800">Payroll Summary</p>
                  <p className="text-xs text-blue-600">${totalPayroll.toLocaleString()} total payroll for {totalEmployees} employees</p>
                </div>
              </div>
            )}
            {totalExpenses > 0 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <FileText className="text-red-600 mr-3" size={20} />
                <div>
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