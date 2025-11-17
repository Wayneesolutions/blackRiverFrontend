import { useEffect, useState, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  Plus,
  Users,
  Edit,
  Trash2,
  Search,
  Clock as ClockIcon
} from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

import { listAttendance as apiListAttendance, upsertAttendance as apiUpsertAttendance, deleteAttendance as apiDeleteAttendance } from '../../../../axios/api/attendance';
import { getAllEmployees as apiGetEmployees } from '../../../../axios/api/employee';

interface AttendanceRecord {
  _id?: string;
  employee: { _id: string; name: string } | string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  status: 'present' | 'absent' | 'late' | 'leave';
}

type NotificationType = 'success' | 'error' | 'info';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
}

const AttendanceTracking = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [employees, setEmployees] = useState<{_id: string; name: string}[]>([]);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const notificationIdRef = useRef<number>(0);

  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'present' as 'present' | 'absent' | 'late' | 'leave'
  });

  const fetchEmployees = async () => {
    try {
      const res = await apiGetEmployees(1, 100);
      if (res?.success) {
        const list = Array.isArray(res.data) ? res.data : (res.data?.employees || []);
        setEmployees((list || []).map((u:any)=>({_id:u._id,name:u.name})));
      }
    } catch {}
  };

  const fetchAttendance = async () => {
    const now = new Date();
    try {
      const res = await apiListAttendance({ month: now.getMonth()+1, year: now.getFullYear() });
      if (res?.success) setAttendanceRecords(res.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  // Calculate stats
  const today = new Date().toDateString();
  const todayRecords = attendanceRecords.filter(r => {
    const d = r.date ? new Date(r.date).toDateString() : '';
    return d === today;
  });
  const presentToday = todayRecords.filter(r => r.status === 'present').length;
  const absentToday = todayRecords.filter(r => r.status === 'absent').length;
  const lateToday = todayRecords.filter(r => r.status === 'late').length;
  const totalEmployees = employees.length;

  const calculateHours = (checkIn: string, checkOut: string): string => {
    if (!checkIn || !checkOut || checkIn === '--' || checkOut === '--') return '0';
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);
    const totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
    return (totalMinutes / 60).toFixed(1);
  };

  const addNotification = (type: NotificationType, message: string) => {
    const id = ++notificationIdRef.current;
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAddAttendance = async () => {
    if (!attendanceForm.employeeId || !attendanceForm.date) {
      addNotification('error', 'Please fill employee name and date');
      return;
    }

    // Calculate hours
    try {
      const payload = {
        employee: attendanceForm.employeeId,
        date: attendanceForm.date,
        checkIn: attendanceForm.status === 'absent' || attendanceForm.status === 'leave' ? undefined : attendanceForm.checkIn,
        checkOut: attendanceForm.status === 'absent' || attendanceForm.status === 'leave' ? undefined : attendanceForm.checkOut,
        status: attendanceForm.status,
      } as any;
      const res = await apiUpsertAttendance(payload);
      if (res?.success) {
        addNotification('success', editingRecord ? 'Attendance record updated successfully' : 'Attendance record added successfully');
        await fetchAttendance();
        setEditingRecord(null);
        // Reset form
        setAttendanceForm({
          employeeId: '',
          date: new Date().toISOString().split('T')[0],
          checkIn: '',
          checkOut: '',
          status: 'present'
        });
        setShowAddModal(false);
      } else {
        addNotification('error', res?.message || 'Failed to save attendance record');
      }
    } catch (e: any) {
      addNotification('error', e?.response?.data?.message || e?.message || 'Error saving attendance record');
    }
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setAttendanceForm({
      employeeId: typeof record.employee === 'string' ? record.employee : (record.employee?._id || ''),
      date: (record.date || '').slice(0,10),
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || '',
      status: record.status
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      const res = await apiDeleteAttendance(id);
      if (res?.success) {
        addNotification('success', 'Attendance record deleted successfully');
        await fetchAttendance();
      } else {
        addNotification('error', res?.message || 'Failed to delete attendance record');
      }
    } catch (e: any) {
      addNotification('error', e?.response?.data?.message || e?.message || 'Error deleting attendance record');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-green-100 text-green-800 border-green-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      leave: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return styles[status] || styles.present;
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const name = (typeof record.employee === 'string' ? (employees.find(e=>e._id===record.employee)?.name || '') : (record.employee as any)?.name || '');
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast Notifications Container */}
      <div className="fixed top-4 right-4 z-[10002] space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg min-w-[300px] max-w-md animate-slide-in ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200'
                : notification.type === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {notification.type === 'success' ? (
                <FaCheckCircle className="text-green-500" size={24} />
              ) : notification.type === 'error' ? (
                <FaExclamationCircle className="text-red-500" size={24} />
              ) : (
                <FaExclamationCircle className="text-blue-500" size={24} />
              )}
            </div>
            <p className="flex-1 text-sm font-medium text-gray-900">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Management</h1>
              <p className="text-gray-600">Track and manage employee attendance records</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg transition-all font-medium flex items-center gap-2"
            >
              <Plus size={20} />
              Add Attendance
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">{totalEmployees}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Present Today</p>
                <p className="text-3xl font-bold text-green-600">{presentToday}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Late Today</p>
                <p className="text-3xl font-bold text-yellow-600">{lateToday}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <ClockIcon className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Absent Today</p>
                <p className="text-3xl font-bold text-red-600">{absentToday}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Attendance Records</h2>

              <div className="flex gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, idx) => (
                    <tr key={record._id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {((typeof record.employee === 'string' ? employees.find(e=>e._id===record.employee)?.name : (record.employee as any)?.name) || '').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </div>
                          <span className="font-medium text-gray-900">{typeof record.employee === 'string' ? (employees.find(e=>e._id===record.employee)?.name || '') : (record.employee as any)?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkIn || '--'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkOut || '--'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{(record.totalHours || 0).toFixed(1)}h</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(record._id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredRecords.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Showing {filteredRecords.length} records</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Attendance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRecord ? 'Edit Attendance' : 'Add Attendance Record'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRecord(null);
                    setAttendanceForm({
                      employeeId: '',
                      date: new Date().toISOString().split('T')[0],
                      checkIn: '',
                      checkOut: '',
                      status: 'present'
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Name</label>
                <select
                  value={attendanceForm.employeeId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </select>
              </div>

              {attendanceForm.status === 'present' || attendanceForm.status === 'late' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Check In Time</label>
                      <input
                        type="time"
                        value={attendanceForm.checkIn}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Check Out Time</label>
                      <input
                        type="time"
                        value={attendanceForm.checkOut}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {attendanceForm.checkIn && attendanceForm.checkOut && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Total hours: <span className="font-bold">{calculateHours(attendanceForm.checkIn, attendanceForm.checkOut)}h</span>
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Check in/out times are not required for absent or leave status.</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRecord(null);
                    setAttendanceForm({
                      employeeId: '',
                      date: new Date().toISOString().split('T')[0],
                      checkIn: '',
                      checkOut: '',
                      status: 'present'
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAttendance}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg transition-colors font-medium"
                >
                  {editingRecord ? 'Update Record' : 'Add Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking;