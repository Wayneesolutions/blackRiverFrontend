import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, Users, Calendar, TrendingUp, X, AlertCircle, CheckCircle, Edit2, Trash2, Eye, Clock, Briefcase, UserCheck, UserX } from 'lucide-react';

// Mock API functions - replace with your actual API
const mockAPI = {
  getEmployees: async () => ({
    success: true,
    data: [
      { _id: '1', name: 'Sarah Johnson', role: 'HR', details: { hourlyRate: 25, baseSalary: 4000 } },
      { _id: '2', name: 'Tom Martinez', role: 'Dispatcher', details: { hourlyRate: 22, baseSalary: 3500 } },
      { _id: '3', name: 'Lisa Chen', role: 'Employee', details: { hourlyRate: 20, baseSalary: 3200 } }
    ]
  }),
  
  getEmployeeAttendance: async (employeeId, startDate, endDate) => ({
    success: true,
    data: [
      {
        _id: 'a1',
        date: '2024-01-02',
        checkIn: '09:00:00',
        checkOut: '17:30:00',
        hoursWorked: 8.5,
        status: 'present',
        overtimeHours: 0.5
      },
      {
        _id: 'a2',
        date: '2024-01-03',
        checkIn: '09:15:00',
        checkOut: '18:00:00',
        hoursWorked: 8.75,
        status: 'present',
        overtimeHours: 0.75
      },
      {
        _id: 'a3',
        date: '2024-01-04',
        checkIn: '09:00:00',
        checkOut: '17:00:00',
        hoursWorked: 8,
        status: 'present',
        overtimeHours: 0
      },
      {
        _id: 'a4',
        date: '2024-01-05',
        status: 'absent'
      },
      {
        _id: 'a5',
        date: '2024-01-08',
        checkIn: '09:00:00',
        checkOut: '17:00:00',
        hoursWorked: 8,
        status: 'present',
        overtimeHours: 0
      }
    ],
    summary: {
      totalDays: 20,
      presentDays: 18,
      absentDays: 2,
      totalHours: 144,
      regularHours: 142,
      overtimeHours: 2,
      hourlyRate: 22,
      regularEarnings: 3124,
      overtimeEarnings: 66,
      totalEarnings: 3190
    }
  }),
  
  listEmployeePayrolls: async () => ({
    success: true,
    data: [
      {
        _id: 'p1',
        userId: { _id: '1', name: 'Sarah Johnson', role: 'HR' },
        baseSalary: 3190,
        bonus: 200,
        deductions: 150,
        totalSalary: 3240,
        payDate: '2024-01-31',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalHours: 144,
        regularHours: 142,
        overtimeHours: 2,
        hourlyRate: 22,
        presentDays: 18,
        absentDays: 2
      }
    ]
  }),
  
  createPayroll: async (data) => ({
    success: true,
    message: 'Employee payroll created successfully!'
  }),
  
  updatePayroll: async (id, data) => ({
    success: true,
    message: 'Employee payroll updated successfully!'
  }),
  
  deletePayroll: async (id) => ({
    success: true,
    message: 'Employee payroll deleted successfully!'
  })
};

const EmployeePayrollManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    userId: '',
    bonus: '0',
    deductions: '0',
    payDate: '',
    startDate: '',
    endDate: ''
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchEmployees = async () => {
    try {
      const response = await mockAPI.getEmployees();
      if (response?.success) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const response = await mockAPI.listEmployeePayrolls();
      if (response?.success) {
        setPayrollData(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeAttendance = async (employeeId, startDate, endDate) => {
    setLoadingAttendance(true);
    try {
      const response = await mockAPI.getEmployeeAttendance(employeeId, startDate, endDate);
      
      if (response?.success) {
        setAttendanceRecords(response.data || []);

        if (response.summary) {
          setAttendanceSummary(response.summary);
          setFormData(prev => ({
            ...prev,
            baseSalary: response.summary.totalEarnings.toString()
          }));
        }
      } else {
        showNotification('error', 'Failed to fetch attendance records');
        setAttendanceRecords([]);
        setAttendanceSummary(null);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      showNotification('error', 'Error fetching attendance records');
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'userId') {
      const selectedEmp = employees.find(emp => emp._id === value);
      setSelectedEmployee(selectedEmp || null);
      
      // Auto-fetch attendance for current month
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        startDate,
        endDate
      }));
      
      fetchEmployeeAttendance(value, startDate, endDate);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDateRangeChange = (startDate, endDate) => {
    setFormData(prev => ({
      ...prev,
      startDate,
      endDate
    }));

    if (selectedEmployee && startDate && endDate) {
      fetchEmployeeAttendance(selectedEmployee._id, startDate, endDate);
    }
  };

  const handleCreate = async () => {
    if (!formData.userId || !formData.payDate || !formData.startDate || !formData.endDate) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    if (!attendanceSummary || attendanceSummary.totalHours === 0) {
      showNotification('error', 'No attendance records found for selected period');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        userId: formData.userId,
        baseSalary: attendanceSummary.totalEarnings,
        bonus: parseFloat(formData.bonus) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        payDate: formData.payDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalHours: attendanceSummary.totalHours,
        regularHours: attendanceSummary.regularHours,
        overtimeHours: attendanceSummary.overtimeHours,
        hourlyRate: attendanceSummary.hourlyRate,
        presentDays: attendanceSummary.presentDays,
        absentDays: attendanceSummary.absentDays
      };

      const response = await mockAPI.createPayroll(payload);
      
      if (response?.success) {
        showNotification('success', response.message);
        setShowCreateModal(false);
        resetForm();
        fetchPayrolls();
      } else {
        showNotification('error', 'Failed to create employee payroll');
      }
    } catch (error) {
      showNotification('error', 'Error creating employee payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPayroll) return;

    setLoading(true);
    
    try {
      const payload = {
        bonus: parseFloat(formData.bonus) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        payDate: formData.payDate
      };

      const response = await mockAPI.updatePayroll(selectedPayroll._id, payload);
      
      if (response?.success) {
        showNotification('success', response.message);
        setShowEditModal(false);
        resetForm();
        setSelectedPayroll(null);
        fetchPayrolls();
      } else {
        showNotification('error', 'Failed to update employee payroll');
      }
    } catch (error) {
      showNotification('error', 'Error updating employee payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPayroll) return;
    
    setLoading(true);
    
    try {
      const response = await mockAPI.deletePayroll(selectedPayroll._id);
      
      if (response?.success) {
        showNotification('success', response.message);
        setShowDeleteModal(false);
        setSelectedPayroll(null);
        fetchPayrolls();
      } else {
        showNotification('error', 'Failed to delete employee payroll');
      }
    } catch (error) {
      showNotification('error', 'Error deleting employee payroll');
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (payroll) => {
    setSelectedPayroll(payroll);
    setShowViewModal(true);
  };

  const openEditModal = (payroll) => {
    setSelectedPayroll(payroll);
    const payDateFormatted = payroll.payDate ? payroll.payDate.split('T')[0] : '';
    
    setFormData({
      userId: payroll.userId._id,
      bonus: payroll.bonus.toString(),
      deductions: payroll.deductions.toString(),
      payDate: payDateFormatted,
      startDate: payroll.startDate.split('T')[0],
      endDate: payroll.endDate.split('T')[0]
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (payroll) => {
    setSelectedPayroll(payroll);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      bonus: '0',
      deductions: '0',
      payDate: '',
      startDate: '',
      endDate: ''
    });
    setSelectedEmployee(null);
    setAttendanceRecords([]);
    setAttendanceSummary(null);
  };

  const filteredPayrolls = payrollData.filter(payroll => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      payroll.userId.name?.toLowerCase().includes(searchLower);
    
    const matchesRole = filterRole === 'all' || 
      payroll.userId.role.toLowerCase() === filterRole.toLowerCase();
    
    return matchesSearch && matchesRole;
  });

  const totalPayroll = payrollData.reduce((sum, payroll) => sum + payroll.totalSalary, 0);
  const totalHours = payrollData.reduce((sum, payroll) => sum + (payroll.totalHours || 0), 0);
  const avgSalary = payrollData.length > 0 ? totalPayroll / payrollData.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 px-6">
      <div className="py-8 max-w-7xl mx-auto">
        {notification && (
          <div className={`fixed top-4 right-4 z-[10000] flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {notification.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}>
              <X size={20} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Briefcase className="text-blue-600" size={36} />
              Employee Payroll
            </h1>
            <p className="text-gray-600 mt-2">Manage employee salaries based on attendance and hours</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            Create Employee Payroll
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${totalPayroll.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Employees</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{payrollData.length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalHours.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Clock className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Salary</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${Math.round(avgSalary).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-gray-200 shadow-sm border mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="hr">HR</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border-gray-200 rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Employee Payroll Records</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No employee payroll records found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Earnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayrolls.map((payroll) => (
                    <tr key={payroll._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-blue-500">
                            {payroll.userId.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{payroll.userId.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {payroll.userId.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <UserCheck className="text-green-600" size={16} />
                          <span className="font-medium text-green-600">{payroll.presentDays}</span>
                          <span className="text-gray-400">/</span>
                          <UserX className="text-red-600" size={16} />
                          <span className="font-medium text-red-600">{payroll.absentDays}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span>{payroll.totalHours}h</span>
                          {payroll.overtimeHours > 0 && (
                            <span className="text-xs text-orange-600">+{payroll.overtimeHours}h OT</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${payroll.hourlyRate}/hr
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        ${payroll.baseSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        +${payroll.bonus.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -${payroll.deductions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${payroll.totalSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payroll.payDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openViewModal(payroll)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => openEditModal(payroll)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(payroll)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center overflow-auto p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                    <Briefcase className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {showCreateModal ? 'Create Employee Payroll' : 'Edit Employee Payroll'}
                    </h4>
                    <p className="text-sm text-gray-500">Based on attendance and working hours</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {showCreateModal && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Employee <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Choose an employee...</option>
                        {employees.map((employee) => (
                          <option key={employee._id} value={employee._id}>
                            {employee.name} - {employee.role} (${employee.details?.hourlyRate || 0}/hr)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar size={16} />
                        Pay Period
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={(e) => handleDateRangeChange(e.target.value, formData.endDate)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Attendance Summary */}
                    {attendanceSummary && (
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                        <h5 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Clock size={20} />
                          Attendance Summary for {selectedEmployee?.name}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold">{attendanceSummary.presentDays}</div>
                            <div className="text-sm text-blue-100">Present Days</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold">{attendanceSummary.absentDays}</div>
                            <div className="text-sm text-blue-100">Absent Days</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold">{attendanceSummary.totalHours}h</div>
                            <div className="text-sm text-blue-100">Total Hours</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold">${attendanceSummary.totalEarnings.toFixed(2)}</div>
                            <div className="text-sm text-blue-100">Total Earnings</div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-blue-400 grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-blue-100">Regular Hours</div>
                            <div className="font-bold">{attendanceSummary.regularHours}h @ ${attendanceSummary.hourlyRate}/hr</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-100">Overtime Hours</div>
                            <div className="font-bold">{attendanceSummary.overtimeHours}h @ ${(attendanceSummary.hourlyRate * 1.5).toFixed(2)}/hr</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-100">Total Earnings</div>
                            <div className="font-bold">${(attendanceSummary.regularEarnings + attendanceSummary.overtimeEarnings).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Attendance Records Table */}
                    {attendanceRecords.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700">Attendance Records ({attendanceRecords.length} days)</h5>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                          <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hours Worked</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Overtime</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {attendanceRecords.map((record) => (
                                <tr key={record._id} className={`hover:bg-gray-50 ${record.status === 'absent' ? 'bg-red-50' : ''}`}>
                                  <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                    {new Date(record.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    {record.status === 'present' ? (
                                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                        <UserCheck size={12} />
                                        Present
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                                        <UserX size={12} />
                                        Absent
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    {record.checkIn || '-'}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    {record.checkOut || '-'}
                                  </td>
                                  <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                    {record.hoursWorked ? `${record.hoursWorked}h` : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-orange-600 font-medium">
                                    {record.overtimeHours ? `+${record.overtimeHours}h` : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-sm font-bold text-blue-600">
                                    {record.hoursWorked 
                                      ? `${((record.hoursWorked - (record.overtimeHours || 0)) * (attendanceSummary?.hourlyRate || 0) + 
                                          (record.overtimeHours || 0) * (attendanceSummary?.hourlyRate || 0) * 1.5).toFixed(2)}`
                                      : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-blue-50 sticky bottom-0">
                              <tr>
                                <td colSpan={4} className="px-3 py-3 text-sm font-medium text-gray-900 text-right">
                                  Totals:
                                </td>
                                <td className="px-3 py-3 text-sm font-bold text-gray-900">
                                  {attendanceSummary?.totalHours || 0}h
                                </td>
                                <td className="px-3 py-3 text-sm font-bold text-orange-600">
                                  {attendanceSummary?.overtimeHours ? `+${attendanceSummary.overtimeHours}h` : '-'}
                                </td>
                                <td className="px-3 py-3 text-sm font-bold text-blue-600">
                                  ${attendanceSummary?.totalEarnings.toFixed(2) || '0.00'}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {loadingAttendance && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-blue-600 font-medium mt-2">Loading attendance records...</p>
                      </div>
                    )}

                    {!loadingAttendance && attendanceRecords.length === 0 && selectedEmployee && formData.startDate && formData.endDate && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="text-yellow-600" size={18} />
                          <div className="text-sm font-medium text-yellow-800">No attendance records found</div>
                        </div>
                        <p className="text-xs text-yellow-700">
                          No attendance records found for {selectedEmployee.name} between {formData.startDate} and {formData.endDate}.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bonus ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="number"
                        name="bonus"
                        value={formData.bonus}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deductions ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="number"
                        name="deductions"
                        value={formData.deductions}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="payDate"
                    value={formData.payDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {attendanceSummary && attendanceSummary.totalHours > 0 && (
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-blue-100">Total Employee Pay</p>
                        <p className="text-4xl font-bold mt-1">
                          ${(
                            attendanceSummary.totalEarnings + 
                            parseFloat(formData.bonus || '0') - 
                            parseFloat(formData.deductions || '0')
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-100">Based on</p>
                        <p className="text-lg font-bold">{attendanceSummary.totalHours} hours</p>
                        <p className="text-sm text-blue-100">{attendanceSummary.presentDays} days present</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center gap-2"
                    disabled={loading}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={showCreateModal ? handleCreate : handleUpdate}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        {showCreateModal ? <Plus size={16} /> : <CheckCircle size={16} />}
                        {showCreateModal ? 'Create Payroll' : 'Update Payroll'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedPayroll && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center overflow-auto p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Employee Payroll Details</h4>
                    <p className="text-sm text-gray-500">{selectedPayroll.userId.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Employee Info */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                  <h5 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Briefcase size={20} />
                    Employee Information
                  </h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-blue-100">Employee Name</label>
                      <div className="text-xl font-bold mt-1">{selectedPayroll.userId.name}</div>
                    </div>
                    <div>
                      <label className="text-sm text-blue-100">Role</label>
                      <div className="text-xl font-bold mt-1">{selectedPayroll.userId.role}</div>
                    </div>
                    <div>
                      <label className="text-sm text-blue-100">Pay Period</label>
                      <div className="text-sm font-medium mt-1">
                        {new Date(selectedPayroll.startDate).toLocaleDateString()} - {new Date(selectedPayroll.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-blue-600" />
                    Attendance Summary
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <UserCheck className="text-green-600 mx-auto mb-2" size={24} />
                      <div className="text-2xl font-bold text-gray-900">{selectedPayroll.presentDays}</div>
                      <div className="text-xs text-gray-600">Present Days</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <UserX className="text-red-600 mx-auto mb-2" size={24} />
                      <div className="text-2xl font-bold text-gray-900">{selectedPayroll.absentDays}</div>
                      <div className="text-xs text-gray-600">Absent Days</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Clock className="text-blue-600 mx-auto mb-2" size={24} />
                      <div className="text-2xl font-bold text-gray-900">{selectedPayroll.regularHours}h</div>
                      <div className="text-xs text-gray-600">Regular Hours</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <Clock className="text-orange-600 mx-auto mb-2" size={24} />
                      <div className="text-2xl font-bold text-gray-900">{selectedPayroll.overtimeHours}h</div>
                      <div className="text-xs text-gray-600">Overtime Hours</div>
                    </div>
                  </div>
                </div>

                {/* Earnings Breakdown */}
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-blue-600" />
                    Earnings Breakdown
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Regular Hours</span>
                        <span className="text-xs text-gray-500 ml-2">({selectedPayroll.regularHours}h @ ${selectedPayroll.hourlyRate}/hr)</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        ${(selectedPayroll.regularHours * selectedPayroll.hourlyRate).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Overtime Hours</span>
                        <span className="text-xs text-gray-500 ml-2">({selectedPayroll.overtimeHours}h @ ${(selectedPayroll.hourlyRate * 1.5).toFixed(2)}/hr)</span>
                      </div>
                      <span className="text-lg font-bold text-orange-600">
                        ${(selectedPayroll.overtimeHours * selectedPayroll.hourlyRate * 1.5).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Base Earnings</span>
                      <span className="text-lg font-bold text-blue-600">${selectedPayroll.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Bonus</span>
                      <span className="text-lg font-bold text-green-600">+${selectedPayroll.bonus.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Deductions</span>
                      <span className="text-lg font-bold text-red-600">-${selectedPayroll.deductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
                      <span className="text-sm font-medium text-white">Total Pay</span>
                      <span className="text-2xl font-bold text-white">${selectedPayroll.totalSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-orange-600" />
                    Payment Information
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Payment Date</label>
                      <div className="mt-1 px-4 py-3 bg-white rounded-lg text-gray-900 font-medium">
                        {new Date(selectedPayroll.payDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Pay Period</label>
                      <div className="mt-1 px-4 py-3 bg-white rounded-lg text-gray-900 font-medium">
                        {new Date(selectedPayroll.startDate).toLocaleDateString()} - {new Date(selectedPayroll.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedPayroll && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Employee Payroll</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the payroll record for <strong>{selectedPayroll.userId.name}</strong>?
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPayroll(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePayrollManagement;