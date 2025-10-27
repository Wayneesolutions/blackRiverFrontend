import React, { useState } from 'react';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle, Plus, Users, TrendingUp, Edit, Trash2, X } from 'lucide-react';

const AttendanceTracking = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Employee Management
  const [employees, setEmployees] = useState([
    { id: 1, name: 'John Smith', department: 'Engineering', position: 'Senior Developer', email: 'john@company.com' },
    { id: 2, name: 'Sarah Johnson', department: 'Marketing', position: 'Marketing Manager', email: 'sarah@company.com' },
    { id: 3, name: 'Michael Brown', department: 'Sales', position: 'Sales Executive', email: 'michael@company.com' }
  ]);

  const [employeeForm, setEmployeeForm] = useState({
    name: '', department: '', position: '', email: ''
  });

  // Leave Management
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, employeeId: 1, employeeName: 'John Smith', type: 'Sick Leave', startDate: '2025-10-15', endDate: '2025-10-17', days: 3, status: 'approved', reason: 'Medical appointment', submittedDate: '2025-10-10' },
    { id: 2, employeeId: 2, employeeName: 'Sarah Johnson', type: 'Vacation', startDate: '2025-11-10', endDate: '2025-11-15', days: 5, status: 'pending', reason: 'Family vacation', submittedDate: '2025-10-20' }
  ]);

  const [leaveForm, setLeaveForm] = useState({
    employeeId: '', type: 'Sick Leave', startDate: '', endDate: '', reason: ''
  });

  // Attendance Management
  const [attendanceRecords, setAttendanceRecords] = useState({
    1: [
      { date: '2025-10-27', checkIn: '09:00', checkOut: '17:30', status: 'present', hours: '8.5' },
      { date: '2025-10-26', checkIn: '09:15', checkOut: '17:45', status: 'present', hours: '8.5' }
    ],
    2: [
      { date: '2025-10-27', checkIn: '08:45', checkOut: '17:15', status: 'present', hours: '8.5' },
      { date: '2025-10-26', checkIn: '09:00', checkOut: '17:30', status: 'present', hours: '8.5' }
    ],
    3: [
      { date: '2025-10-27', checkIn: '09:10', checkOut: '17:40', status: 'present', hours: '8.5' }
    ]
  });

  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: '', date: '', checkIn: '', checkOut: '', status: 'present'
  });

  // Leave Balances
  const [leaveBalances, setLeaveBalances] = useState({
    1: { sick: { total: 12, used: 3 }, vacation: { total: 20, used: 8 }, personal: { total: 5, used: 2 } },
    2: { sick: { total: 12, used: 5 }, vacation: { total: 20, used: 12 }, personal: { total: 5, used: 1 } },
    3: { sick: { total: 12, used: 2 }, vacation: { total: 20, used: 5 }, personal: { total: 5, used: 0 } }
  });

  // Helper Functions
  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const calculateHours = (checkIn, checkOut) => {
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);
    const totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
    return (totalMinutes / 60).toFixed(1);
  };

  // Employee CRUD
  const handleAddEmployee = () => {
    if (!employeeForm.name || !employeeForm.department || !employeeForm.position || !employeeForm.email) {
      alert('Please fill all fields');
      return;
    }

    const newEmployee = {
      id: employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1,
      ...employeeForm
    };

    setEmployees([...employees, newEmployee]);
    
    // Initialize leave balances for new employee
    setLeaveBalances({
      ...leaveBalances,
      [newEmployee.id]: {
        sick: { total: 12, used: 0 },
        vacation: { total: 20, used: 0 },
        personal: { total: 5, used: 0 }
      }
    });

    // Initialize empty attendance records
    setAttendanceRecords({
      ...attendanceRecords,
      [newEmployee.id]: []
    });

    setEmployeeForm({ name: '', department: '', position: '', email: '' });
    setShowEmployeeModal(false);
  };

  const handleUpdateEmployee = () => {
    setEmployees(employees.map(emp => 
      emp.id === editingEmployee.id ? { ...editingEmployee, ...employeeForm } : emp
    ));
    setEditingEmployee(null);
    setEmployeeForm({ name: '', department: '', position: '', email: '' });
    setShowEmployeeModal(false);
  };

  const handleDeleteEmployee = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
      setLeaveRequests(leaveRequests.filter(req => req.employeeId !== id));
      const newAttendance = { ...attendanceRecords };
      delete newAttendance[id];
      setAttendanceRecords(newAttendance);
      const newBalances = { ...leaveBalances };
      delete newBalances[id];
      setLeaveBalances(newBalances);
    }
  };

  const openEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      department: employee.department,
      position: employee.position,
      email: employee.email
    });
    setShowEmployeeModal(true);
  };

  // Attendance CRUD
  const handleAddAttendance = () => {
    if (!attendanceForm.employeeId || !attendanceForm.date) {
      alert('Please select employee and date');
      return;
    }

    const empId = parseInt(attendanceForm.employeeId);
    let hours = '0';
    
    if (attendanceForm.status === 'present' && attendanceForm.checkIn && attendanceForm.checkOut) {
      hours = calculateHours(attendanceForm.checkIn, attendanceForm.checkOut);
    }

    const newRecord = {
      date: attendanceForm.date,
      checkIn: attendanceForm.status === 'present' ? attendanceForm.checkIn : '-',
      checkOut: attendanceForm.status === 'present' ? attendanceForm.checkOut : '-',
      status: attendanceForm.status,
      hours
    };

    const currentRecords = attendanceRecords[empId] || [];
    const existingIndex = currentRecords.findIndex(r => r.date === attendanceForm.date);
    
    if (existingIndex >= 0) {
      currentRecords[existingIndex] = newRecord;
    } else {
      currentRecords.unshift(newRecord);
    }

    setAttendanceRecords({
      ...attendanceRecords,
      [empId]: currentRecords
    });

    setAttendanceForm({ employeeId: '', date: '', checkIn: '', checkOut: '', status: 'present' });
    setShowAttendanceModal(false);
  };

  // Leave CRUD
  const handleAddLeave = () => {
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      alert('Please fill all fields');
      return;
    }

    const empId = parseInt(leaveForm.employeeId);
    const employee = employees.find(e => e.id === empId);
    const days = calculateDays(leaveForm.startDate, leaveForm.endDate);

    const newLeave = {
      id: leaveRequests.length > 0 ? Math.max(...leaveRequests.map(l => l.id)) + 1 : 1,
      employeeId: empId,
      employeeName: employee.name,
      type: leaveForm.type,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days,
      status: 'pending',
      reason: leaveForm.reason,
      submittedDate: new Date().toISOString().split('T')[0]
    };

    setLeaveRequests([...leaveRequests, newLeave]);
    setLeaveForm({ employeeId: '', type: 'Sick Leave', startDate: '', endDate: '', reason: '' });
    setShowLeaveModal(false);
  };

  const handleUpdateLeaveStatus = (leaveId, newStatus) => {
    const leave = leaveRequests.find(l => l.id === leaveId);
    
    setLeaveRequests(leaveRequests.map(req => 
      req.id === leaveId ? { ...req, status: newStatus } : req
    ));

    // Update leave balance if approved
    if (newStatus === 'approved' && leave) {
      const balances = leaveBalances[leave.employeeId];
      const leaveTypeKey = leave.type.toLowerCase().includes('sick') ? 'sick' : 
                           leave.type.toLowerCase().includes('vacation') ? 'vacation' : 'personal';
      
      setLeaveBalances({
        ...leaveBalances,
        [leave.employeeId]: {
          ...balances,
          [leaveTypeKey]: {
            ...balances[leaveTypeKey],
            used: balances[leaveTypeKey].used + leave.days
          }
        }
      });
    }
  };

  const handleDeleteLeave = (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      setLeaveRequests(leaveRequests.filter(req => req.id !== id));
    }
  };

  // Stats
  const totalEmployees = employees.length;
  const pendingRequests = leaveRequests.filter(req => req.status === 'pending').length;
  const today = new Date().toISOString().split('T')[0];
  const presentToday = Object.values(attendanceRecords).filter(records => 
    records.some(r => r.date === today && r.status === 'present')
  ).length;

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
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

  const filteredRequests = leaveRequests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesEmployee = selectedEmployee === 'all' || req.employeeId === parseInt(selectedEmployee);
    return matchesStatus && matchesEmployee;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HR Attendance Management</h1>
          <p className="text-gray-600">Manage employees, attendance, and leave requests</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button
            onClick={() => {
              setEditingEmployee(null);
              setEmployeeForm({ name: '', department: '', position: '', email: '' });
              setShowEmployeeModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
          <button
            onClick={() => setShowAttendanceModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Clock className="w-4 h-4" />
            Add Attendance
          </button>
          <button
            onClick={() => setShowLeaveModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Add Leave Request
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['overview', 'requests', 'employees', 'history'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'overview' && 'Overview'}
                  {tab === 'requests' && (
                    <>
                      Leave Requests
                      {pendingRequests > 0 && (
                        <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests}</span>
                      )}
                    </>
                  )}
                  {tab === 'employees' && 'Employees'}
                  {tab === 'history' && 'Attendance History'}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
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
                  <h3 className="text-sm font-medium text-gray-600">Total Leave Days</h3>
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {Object.values(leaveBalances).reduce((sum, bal) => 
                    sum + bal.sick.used + bal.vacation.used + bal.personal.used, 0
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Leave Requests</h3>
              <div className="space-y-3">
                {leaveRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {request.employeeName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{request.employeeName}</div>
                        <div className="text-sm text-gray-600">{request.type} - {request.days} day(s)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">{request.startDate}</div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Leave Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'approved', 'rejected'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === status
                        ? status === 'all' ? 'bg-blue-500 text-white' :
                          status === 'pending' ? 'bg-yellow-500 text-white' :
                          status === 'approved' ? 'bg-green-500 text-white' :
                          'bg-red-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status === 'pending' && ` (${leaveRequests.filter(r => r.status === 'pending').length})`}
                  </button>
                ))}
              </div>
              <select 
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {request.employeeName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium">{request.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{request.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{request.startDate} to {request.endDate}</td>
                        <td className="px-6 py-4 text-sm font-medium">{request.days}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{request.reason}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {request.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleUpdateLeaveStatus(request.id, 'approved')}
                                  className="text-green-600 hover:text-green-800 font-medium text-sm"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleUpdateLeaveStatus(request.id, 'rejected')}
                                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleDeleteLeave(request.id)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            {employees.map((employee) => {
              const balance = leaveBalances[employee.id] || { 
                sick: { total: 12, used: 0 }, 
                vacation: { total: 20, used: 0 }, 
                personal: { total: 5, used: 0 } 
              };
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
                        <p className="text-sm text-gray-500">{employee.department} • {employee.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditEmployee(employee)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['sick', 'vacation', 'personal'].map((type, idx) => {
                      const colors = ['blue', 'green', 'purple'];
                      const color = colors[idx];
                      const remaining = balance[type].total - balance[type].used;
                      const percentage = (remaining / balance[type].total) * 100;
                      
                      return (
                        <div key={type} className={`p-4 bg-${color}-50 rounded-lg`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700 capitalize">{type} Leave</h4>
                            <Calendar className={`w-4 h-4 text-${color}-500`} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Remaining</span>
                              <span className={`font-semibold text-${color}-600`}>{remaining}/{balance[type].total}</span>
                            </div>
                            <div className={`bg-${color}-200 rounded-full h-2`}>
                              <div 
                                className={`bg-${color}-500 h-2 rounded-full transition-all`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Attendance History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <select 
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>

            {selectedEmployee && attendanceRecords[selectedEmployee] && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {employees.find(e => e.id === parseInt(selectedEmployee))?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {employees.find(e => e.id === parseInt(selectedEmployee))?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {employees.find(e => e.id === parseInt(selectedEmployee))?.position}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {attendanceRecords[selectedEmployee].map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium">{record.date}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-green-500" />
                              <span className="text-sm">{record.checkIn}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-red-500" />
                              <span className="text-sm">{record.checkOut}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">{record.hours}h</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(record.status)}`}>
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

      {/* Employee Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button 
                onClick={() => {
                  setShowEmployeeModal(false);
                  setEditingEmployee(null);
                  setEmployeeForm({ name: '', department: '', position: '', email: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={employeeForm.department}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  value={employeeForm.position}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Senior Developer"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowEmployeeModal(false);
                  setEditingEmployee(null);
                  setEmployeeForm({ name: '', department: '', position: '', email: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingEmployee ? 'Update' : 'Add'} Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Add Attendance Record</h3>
              <button 
                onClick={() => {
                  setShowAttendanceModal(false);
                  setAttendanceForm({ employeeId: '', date: '', checkIn: '', checkOut: '', status: 'present' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={attendanceForm.employeeId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="present">Present</option>
                  <option value="sick">Sick</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              {attendanceForm.status === 'present' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
                    <input
                      type="time"
                      value={attendanceForm.checkIn}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check Out Time</label>
                    <input
                      type="time"
                      value={attendanceForm.checkOut}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowAttendanceModal(false);
                  setAttendanceForm({ employeeId: '', date: '', checkIn: '', checkOut: '', status: 'present' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAttendance}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Add Leave Request</h3>
              <button 
                onClick={() => {
                  setShowLeaveModal(false);
                  setLeaveForm({ employeeId: '', type: 'Sick Leave', startDate: '', endDate: '', reason: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Reason for leave..."
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setLeaveForm({ employeeId: '', type: 'Sick Leave', startDate: '', endDate: '', reason: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLeave}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Add Leave Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking;