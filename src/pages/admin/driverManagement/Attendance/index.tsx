import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Plus,
  Users,
  Edit,
  Trash2,
  Search,
  Clock,
  X,
  User,
  Briefcase
} from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { getUserRole } from '../../../../utils/auth';

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
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const getBasePath = () => {
    const role = getUserRole();
    return role === 'hr' ? '/Management' : '/admin/Management';
  };

  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>([]);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const notificationIdRef = useRef<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  
  // Refs for scrollbar synchronization
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

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
        setEmployees((list || []).map((u: any) => ({ _id: u._id, name: u.name })));
      }
    } catch { }
  };
  useEffect(() => {
    if (showAddModal || deleteConfirm.show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddModal]);

  const fetchAttendance = async () => {
    const now = new Date();
    try {
      const res = await apiListAttendance({ month: now.getMonth() + 1, year: now.getFullYear() });
      if (res?.success) setAttendanceRecords(res.data || []);
    } catch { }
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
      date: (record.date || '').slice(0, 10),
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || '',
      status: record.status
    });
    setShowAddModal(true);
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; recordId: string | null }>({ show: false, recordId: null });

  const handleDelete = async (id?: string) => {
    if (!id) return;
    setDeleteConfirm({ show: true, recordId: id });
  };

  const confirmDeleteAttendance = async () => {
    if (!deleteConfirm.recordId) return;
    try {
      const res = await apiDeleteAttendance(deleteConfirm.recordId);
      if (res?.success) {
        addNotification('success', 'Attendance record deleted successfully');
        await fetchAttendance();
      } else {
        addNotification('error', res?.message || 'Failed to delete attendance record');
      }
    } catch (e: any) {
      addNotification('error', e?.response?.data?.message || e?.message || 'Error deleting attendance record');
    } finally {
      setDeleteConfirm({ show: false, recordId: null });
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
    const name = (typeof record.employee === 'string' ? (employees.find(e => e._id === record.employee)?.name || '') : (record.employee as any)?.name || '');
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sync scroll between top and bottom scrollbars
  useEffect(() => {
    const topScroll = topScrollRef.current;
    const bottomScroll = bottomScrollRef.current;

    if (!topScroll || !bottomScroll) return;

    let isScrolling = false;

    const handleTopScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      bottomScroll.scrollLeft = topScroll.scrollLeft;
      requestAnimationFrame(() => {
        isScrolling = false;
      });
    };

    const handleBottomScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      topScroll.scrollLeft = bottomScroll.scrollLeft;
      requestAnimationFrame(() => {
        isScrolling = false;
      });
    };

    // Sync scroll widths
    const syncScrollWidths = () => {
      const bottomScrollWidth = bottomScroll.scrollWidth;
      const topInner = topScroll.querySelector('.top-scroll-content') as HTMLElement;
      if (topInner && bottomScrollWidth > 0) {
        topInner.style.width = `${bottomScrollWidth}px`;
        topScroll.scrollLeft = bottomScroll.scrollLeft;
      }
    };

    // Initial sync - wait for table to render
    const timeoutId = setTimeout(syncScrollWidths, 100);
    const timeoutId2 = setTimeout(syncScrollWidths, 300);
    const timeoutId3 = setTimeout(syncScrollWidths, 500);

    // Observe table changes
    const tableObserver = new MutationObserver(() => {
      syncScrollWidths();
    });

    const bottomTable = bottomScroll.querySelector('table');
    if (bottomTable) {
      tableObserver.observe(bottomTable, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    topScroll.addEventListener('scroll', handleTopScroll, { passive: true });
    bottomScroll.addEventListener('scroll', handleBottomScroll, { passive: true });
    window.addEventListener('resize', syncScrollWidths);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      tableObserver.disconnect();
      topScroll.removeEventListener('scroll', handleTopScroll);
      bottomScroll.removeEventListener('scroll', handleBottomScroll);
      window.removeEventListener('resize', syncScrollWidths);
    };
  }, [filteredRecords, attendanceRecords, searchQuery, filterStatus]);

  return (
    <div
      className="min-h-screen bg-[#EDF8FF] p-6 overflow-x-hidden">

      {/* Toast Notifications Container */}
      <div className="fixed top-4 right-4 z-[10002] space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg min-w-[300px] max-w-md animate-slide-in ${notification.type === 'success'
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

      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Management</h1>
              <p className="text-gray-600">Track and manage employee attendance records</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)' }}
              className="px-4 py-2 !text-white rounded-lg transition-all font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Plus size={20} />
              Add Attendance
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Employees */}
          <div
            onClick={() => navigate(`${getBasePath()}/employee-profiles`)}
            className="rounded-lg p-4 bg-purple-50 border border-purple-200 cursor-pointer hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 mb-0.5">Total Employees</p>
                <p className="text-2xl font-semibold text-purple-700">
                  {totalEmployees}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Users className="text-purple-600" size={18} />
              </div>
            </div>
          </div>

          {/* Present Today */}
          <div className="rounded-lg p-4 bg-green-50 border border-green-200 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 mb-0.5">Present Today</p>
                <p className="text-2xl font-semibold text-green-700">
                  {presentToday}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="text-green-600" size={18} />
              </div>
            </div>
          </div>

          {/* Late Today */}
          <div className="rounded-lg p-4 bg-amber-50 border border-amber-200 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 mb-0.5">Late Today</p>
                <p className="text-2xl font-semibold text-amber-700">
                  {lateToday}
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <Clock className="text-amber-600" size={18} />
              </div>
            </div>
          </div>

          {/* Absent Today */}
          <div className="rounded-lg p-4 bg-red-50 border border-red-200 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 mb-0.5">Absent Today</p>
                <p className="text-2xl font-semibold text-red-700">
                  {absentToday}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="text-red-600" size={18} />
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

          {/* Top Scrollbar - Only visible horizontal scrollbar */}
          <style>{`
            .top-scrollbar-container::-webkit-scrollbar {
              height: 8px;
            }
            .top-scrollbar-container::-webkit-scrollbar-track {
              background: #f7fafc;
            }
            .top-scrollbar-container::-webkit-scrollbar-thumb {
              background: #cbd5e0;
              border-radius: 4px;
            }
            .top-scrollbar-container::-webkit-scrollbar-thumb:hover {
              background: #a0aec0;
            }
            .table-container-hidden-scrollbar {
              scrollbar-width: none; /* Firefox */
              -ms-overflow-style: none; /* IE and Edge */
            }
            .table-container-hidden-scrollbar::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }
          `}</style>
          <div 
            ref={topScrollRef}
            className="overflow-x-auto overflow-y-hidden top-scrollbar-container"
            style={{ 
              maxHeight: '20px',
              marginBottom: '2px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e0 #f7fafc' /* Firefox */
            }}
          >
            <div className="top-scroll-content" style={{ height: '1px' }}></div>
          </div>
          {/* Main Table - Scrollbar hidden, controlled by top scrollbar */}
          <div 
            ref={bottomScrollRef}
            className="overflow-x-auto overflow-y-visible table-container-hidden-scrollbar"
          >
            <table className="w-full" style={{ minWidth: '1000px' }}>
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
                    <tr 
                      key={record._id || idx} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowDetailsSidebar(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {((typeof record.employee === 'string' ? employees.find(e => e._id === record.employee)?.name : (record.employee as any)?.name) || '').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </div>
                          <span className="font-medium text-gray-900">{typeof record.employee === 'string' ? (employees.find(e => e._id === record.employee)?.name || '') : (record.employee as any)?.name}</span>
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
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">

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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, recordId: null })}
        onConfirm={confirmDeleteAttendance}
        title="Delete Attendance Record"
        message="Are you sure you want to delete this attendance record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Attendance Details Sidebar */}
      {showDetailsSidebar && selectedRecord && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => {
              setShowDetailsSidebar(false);
              setTimeout(() => setSelectedRecord(null), 300);
            }}
          ></div>

          {/* Sidebar Panel */}
          <div
            className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 translate-x-0"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Attendance Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsSidebar(false);
                    setTimeout(() => setSelectedRecord(null), 300);
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Employee Header */}
                <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] text-white p-6 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 flex-shrink-0">
                      <div className="h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600">
                        {selectedRecord ? ((typeof selectedRecord.employee === 'string' ? employees.find((e: { _id: string; name: string }) => e._id === selectedRecord.employee)?.name : (selectedRecord.employee as any)?.name) || '').split(' ').map((n: string) => n[0]).join('').substring(0, 2) : ''}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">
                        {selectedRecord ? (typeof selectedRecord.employee === 'string' ? (employees.find((e: { _id: string; name: string }) => e._id === selectedRecord.employee)?.name || 'N/A') : (selectedRecord.employee as any)?.name || 'N/A') : 'N/A'}
                      </h3>
                      <p className="text-blue-100 text-sm flex items-center gap-2">
                        <User size={16} />
                        Employee Attendance Record
                      </p>
                      {selectedRecord && (
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mt-2 ${getStatusBadge(selectedRecord.status)} text-black`}>
                          {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendance Information */}
                {selectedRecord && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                      <Briefcase size={20} className="text-blue-600" />
                      Attendance Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Employee Name</p>
                        <p className="font-medium text-gray-900">
                          {typeof selectedRecord.employee === 'string' ? (employees.find((e: { _id: string; name: string }) => e._id === selectedRecord.employee)?.name || 'N/A') : (selectedRecord.employee as any)?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Date</p>
                        <p className="font-medium text-gray-900">
                          {new Date(selectedRecord.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Check In</p>
                        <p className="font-medium text-gray-900">{selectedRecord.checkIn || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Check Out</p>
                        <p className="font-medium text-gray-900">{selectedRecord.checkOut || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total Hours</p>
                        <p className="font-medium text-gray-900">{(selectedRecord.totalHours || 0).toFixed(1)} hours</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadge(selectedRecord.status)}`}>
                          {selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedRecord && (
                  <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                    <button
                      onClick={() => {
                        setShowDetailsSidebar(false);
                        setTimeout(() => setSelectedRecord(null), 300);
                      }}
                      className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        if (selectedRecord) {
                          handleEdit(selectedRecord);
                          setShowDetailsSidebar(false);
                        }
                      }}
                      className="px-6 py-2.5 bg-blue-600 !text-white font-medium rounded-lg hover:bg-blue-700 transition-all"
                    >
                      Edit Record
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'default';
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default',
  onConfirm,
  onClose
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  const confirmStyles =
    type === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${confirmStyles}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracking;