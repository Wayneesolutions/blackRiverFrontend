import React, { useState } from 'react';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle, Plus, Users, TrendingUp, Download } from 'lucide-react';

const AttendanceTracking = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequestEmployee, setSelectedRequestEmployee] = useState('');

  // Mock employee data
  const employees = [
    { id: 1, name: 'John Smith', department: 'Engineering', position: 'Senior Developer' },
    { id: 2, name: 'Sarah Johnson', department: 'Marketing', position: 'Marketing Manager' },
    { id: 3, name: 'Michael Brown', department: 'Sales', position: 'Sales Executive' },
    { id: 4, name: 'Emily Davis', department: 'HR', position: 'HR Specialist' },
    { id: 5, name: 'David Wilson', department: 'Engineering', position: 'Junior Developer' }
  ];

  // Leave balances per employee
  const employeeLeaveBalances = {
    1: { sick: { total: 12, used: 3, remaining: 9 }, vacation: { total: 20, used: 8, remaining: 12 }, personal: { total: 5, used: 2, remaining: 3 } },
    2: { sick: { total: 12, used: 5, remaining: 7 }, vacation: { total: 20, used: 12, remaining: 8 }, personal: { total: 5, used: 1, remaining: 4 } },
    3: { sick: { total: 12, used: 2, remaining: 10 }, vacation: { total: 20, used: 5, remaining: 15 }, personal: { total: 5, used: 0, remaining: 5 } },
    4: { sick: { total: 12, used: 4, remaining: 8 }, vacation: { total: 20, used: 10, remaining: 10 }, personal: { total: 5, used: 3, remaining: 2 } },
    5: { sick: { total: 12, used: 1, remaining: 11 }, vacation: { total: 20, used: 3, remaining: 17 }, personal: { total: 5, used: 1, remaining: 4 } }
  };

  // Leave requests from all employees
  const allLeaveRequests = [
    { id: 1, employeeId: 1, employeeName: 'John Smith', type: 'Sick Leave', startDate: '2025-10-15', endDate: '2025-10-17', days: 3, status: 'approved', reason: 'Medical appointment', submittedDate: '2025-10-10' },
    { id: 2, employeeId: 2, employeeName: 'Sarah Johnson', type: 'Vacation', startDate: '2025-11-10', endDate: '2025-11-15', days: 5, status: 'pending', reason: 'Family vacation', submittedDate: '2025-10-20' },
    { id: 3, employeeId: 1, employeeName: 'John Smith', type: 'Personal', startDate: '2025-09-20', endDate: '2025-09-20', days: 1, status: 'approved', reason: 'Personal matters', submittedDate: '2025-09-15' },
    { id: 4, employeeId: 3, employeeName: 'Michael Brown', type: 'Sick Leave', startDate: '2025-10-25', endDate: '2025-10-25', days: 1, status: 'rejected', reason: 'Flu symptoms', submittedDate: '2025-10-24' },
    { id: 5, employeeId: 4, employeeName: 'Emily Davis', type: 'Vacation', startDate: '2025-11-01', endDate: '2025-11-05', days: 5, status: 'pending', reason: 'Wedding ceremony', submittedDate: '2025-10-22' },
    { id: 6, employeeId: 5, employeeName: 'David Wilson', type: 'Sick Leave', startDate: '2025-10-28', endDate: '2025-10-28', days: 1, status: 'pending', reason: 'Doctor appointment', submittedDate: '2025-10-27' }
  ];

  // Attendance history for all employees
  const employeeAttendanceHistory = {
    1: [
      { date: '2025-10-27', checkIn: '09:00 AM', checkOut: '05:30 PM', status: 'present', hours: '8.5' },
      { date: '2025-10-26', checkIn: '09:15 AM', checkOut: '05:45 PM', status: 'present', hours: '8.5' },
      { date: '2025-10-25', checkIn: '08:50 AM', checkOut: '05:20 PM', status: 'present', hours: '8.5' }
    ],
    2: [
      { date: '2025-10-27', checkIn: '08:45 AM', checkOut: '05:15 PM', status: 'present', hours: '8.5' },
      { date: '2025-10-26', checkIn: '09:00 AM', checkOut: '05:30 PM', status: 'present', hours: '8.5' },
      { date: '2025-10-25', checkIn: '-', checkOut: '-', status: 'sick', hours: '0' }
    ],
    3: [
      { date: '2025-10-27', checkIn: '09:10 AM', checkOut: '05:40 PM', status: 'present', hours: '8.5' },
      { date: '2025-10-26', checkIn: '08:55 AM', checkOut: '05:25 PM', status: 'present', hours: '8.5' },
      { date: '2025-10-25', checkIn: '09:05 AM', checkOut: '05:35 PM', status: 'present', hours: '8.5' }
    ],
    4: [
      { date: '2025-10-27', checkIn: '09:00 AM', checkOut: '05:00 PM', status: 'present', hours: '8.0' },
      { date: '2025-10-26', checkIn: '09:00 AM', checkOut: '05:00 PM', status: 'present', hours: '8.0' },
      { date: '2025-10-25', checkIn: '09:00 AM', checkOut: '05:00 PM', status: 'present', hours: '8.0' }
    ],
    5: [
      { date: '2025-10-27', checkIn: '09:20 AM', checkOut: '05:50 PM', status: 'present', hours: '8.5' },
      { date: '2025-10-26', checkIn: '09:30 AM', checkOut: '06:00 PM', status: 'present', hours: '8.5' },
      { date: '2025-10-25', checkIn: '09:15 AM', checkOut: '05:45 PM', status: 'present', hours: '8.5' }
    ]
  };

  // Overall stats
  const totalEmployees = employees.length;
  const pendingRequests = allLeaveRequests.filter(req => req.status === 'pending').length;
  const presentToday = 4;
  const avgAttendanceRate = 92;

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      present: 'bg-blue-100 text-blue-800',
      sick: 'bg-orange-100 text-orange-800',
      absent: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || styles.present;
  };

  const filteredRequests = allLeaveRequests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesEmployee = selectedEmployee === 'all' || req.employeeId === parseInt(selectedEmployee);
    return matchesStatus && matchesEmployee;
  });

  const getEmployeeById = (id) => employees.find(emp => emp.id === id);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Attendance Management</h1>
            <p className="text-gray-600">Track attendance, manage leave requests, and monitor employee time off</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Leave Requests
                {pendingRequests > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'employees'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Employee Details
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Attendance History
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Employees</h3>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{totalEmployees}</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Present Today</h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{presentToday}</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Pending Requests</h3>
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{pendingRequests}</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Avg Attendance</h3>
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{avgAttendanceRate}%</div>
              </div>
            </div>

            {/* Recent Leave Requests */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leave Requests</h3>
              <div className="space-y-3">
                {allLeaveRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {request.employeeName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{request.employeeName}</div>
                        <div className="text-sm text-gray-600">{request.type} - {request.days} day(s)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{request.startDate} to {request.endDate}</div>
                      </div>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Engineering</div>
                  <div className="text-2xl font-bold text-blue-600">2</div>
                  <div className="text-xs text-gray-500 mt-1">Employees</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Marketing</div>
                  <div className="text-2xl font-bold text-green-600">1</div>
                  <div className="text-xs text-gray-500 mt-1">Employees</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Sales</div>
                  <div className="text-2xl font-bold text-purple-600">1</div>
                  <div className="text-xs text-gray-500 mt-1">Employees</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">HR</div>
                  <div className="text-2xl font-bold text-orange-600">1</div>
                  <div className="text-xs text-gray-500 mt-1">Employees</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leave Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Pending ({allLeaveRequests.filter(r => r.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'approved' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Rejected
                </button>
              </div>
              <div className="flex gap-2">
                <select 
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {request.employeeName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{request.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{request.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.startDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.endDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{request.days}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{request.reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <button className="text-green-600 hover:text-green-800 font-medium">Approve</button>
                              <button className="text-red-600 hover:text-red-800 font-medium">Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Employee Details Tab */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {employees.map((employee) => {
                const balance = employeeLeaveBalances[employee.id];
                return (
                  <div key={employee.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{employee.name}</h3>
                          <p className="text-gray-600">{employee.position}</p>
                          <p className="text-sm text-gray-500">{employee.department}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Sick Leave</h4>
                          <Calendar className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Remaining</span>
                            <span className="font-semibold text-blue-600">{balance.sick.remaining}/{balance.sick.total}</span>
                          </div>
                          <div className="bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(balance.sick.remaining / balance.sick.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Vacation Leave</h4>
                          <Calendar className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Remaining</span>
                            <span className="font-semibold text-green-600">{balance.vacation.remaining}/{balance.vacation.total}</span>
                          </div>
                          <div className="bg-green-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${(balance.vacation.remaining / balance.vacation.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Personal Leave</h4>
                          <Calendar className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Remaining</span>
                            <span className="font-semibold text-purple-600">{balance.personal.remaining}/{balance.personal.total}</span>
                          </div>
                          <div className="bg-purple-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ width: `${(balance.personal.remaining / balance.personal.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Attendance History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <select 
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            {selectedEmployee !== 'all' && employeeAttendanceHistory[selectedEmployee] && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {getEmployeeById(parseInt(selectedEmployee)).name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{getEmployeeById(parseInt(selectedEmployee)).name}</h3>
                      <p className="text-sm text-gray-600">{getEmployeeById(parseInt(selectedEmployee)).position}</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employeeAttendanceHistory[selectedEmployee].map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{record.date}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-gray-600">{record.checkIn}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-red-500" />
                              <span className="text-sm text-gray-600">{record.checkOut}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.hours}h</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(record.status)}`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracking;