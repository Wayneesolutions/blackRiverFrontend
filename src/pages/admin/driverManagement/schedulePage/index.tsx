import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Truck, User, Filter, Eye, AlertTriangle } from 'lucide-react';

// Type definitions
interface Shift {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  shiftType: 'morning' | 'afternoon' | 'night' | 'overtime';
  status: 'scheduled' | 'in-progress' | 'completed' | 'missed';
  route?: string;
  hoursLogged: number;
  breakTime: number;
  notes?: string;
}

interface HoursOfServiceLog {
  id: string;
  driverId: string;
  driverName: string;
  date: string;
  onDutyTime: number;
  drivingTime: number;
  sleepTime: number;
  offDutyTime: number;
  violationFlag: boolean;
  violationType?: string;
}

const DriverScheduleCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [driverFilter, setDriverFilter] = useState('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showHOSLogs, setShowHOSLogs] = useState(false);

  // Sample data - replace with actual API data
  const [shifts] = useState<Shift[]>([
    {
      id: '1',
      driverId: 'D001',
      driverName: 'John Smith',
      vehicleId: 'TRK-001',
      startTime: '2024-09-20T06:00:00',
      endTime: '2024-09-20T14:00:00',
      shiftType: 'morning',
      status: 'completed',
      route: 'Route A - City Center',
      hoursLogged: 8,
      breakTime: 1,
      notes: 'Regular delivery route'
    },
    {
      id: '2',
      driverId: 'D002',
      driverName: 'Mike Johnson',
      vehicleId: 'TRK-002',
      startTime: '2024-09-20T14:00:00',
      endTime: '2024-09-20T22:00:00',
      shiftType: 'afternoon',
      status: 'in-progress',
      route: 'Route B - Industrial Area',
      hoursLogged: 6,
      breakTime: 0.5
    },
    {
      id: '3',
      driverId: 'D001',
      driverName: 'John Smith',
      vehicleId: 'TRK-001',
      startTime: '2024-09-21T08:00:00',
      endTime: '2024-09-21T16:00:00',
      shiftType: 'morning',
      status: 'scheduled',
      route: 'Route C - Suburban',
      hoursLogged: 0,
      breakTime: 0
    },
    {
      id: '4',
      driverId: 'D003',
      driverName: 'Sarah Williams',
      vehicleId: 'TRK-003',
      startTime: '2024-09-21T22:00:00',
      endTime: '2024-09-22T06:00:00',
      shiftType: 'night',
      status: 'scheduled',
      route: 'Route D - Highway',
      hoursLogged: 0,
      breakTime: 0
    }
  ]);

  const [hosLogs] = useState<HoursOfServiceLog[]>([
    {
      id: '1',
      driverId: 'D001',
      driverName: 'John Smith',
      date: '2024-09-20',
      onDutyTime: 10,
      drivingTime: 8,
      sleepTime: 10,
      offDutyTime: 14,
      violationFlag: false
    },
    {
      id: '2',
      driverId: 'D002',
      driverName: 'Mike Johnson',
      date: '2024-09-20',
      onDutyTime: 12,
      drivingTime: 9,
      sleepTime: 8,
      offDutyTime: 12,
      violationFlag: true,
      violationType: 'Daily driving limit exceeded'
    },
    {
      id: '3',
      driverId: 'D003',
      driverName: 'Sarah Williams',
      date: '2024-09-19',
      onDutyTime: 9,
      drivingTime: 7,
      sleepTime: 10,
      offDutyTime: 15,
      violationFlag: false
    }
  ]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter shifts based on selected filters
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const driverMatch = driverFilter === 'all' || shift.driverId === driverFilter;
      const shiftTypeMatch = shiftTypeFilter === 'all' || shift.shiftType === shiftTypeFilter;
      const statusMatch = statusFilter === 'all' || shift.status === statusFilter;
      return driverMatch && shiftTypeMatch && statusMatch;
    });
  }, [shifts, driverFilter, shiftTypeFilter, statusFilter]);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentMonth + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredShifts.filter(shift => {
      const shiftDate = new Date(shift.startTime).toISOString().split('T')[0];
      return shiftDate === dateStr;
    });
  };

  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Previous month days
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(currentYear, currentMonth, -firstDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({ date, isCurrentMonth: true });
    }

    // Next month days
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(currentYear, currentMonth + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getShiftTypeColor = (shiftType: string) => {
    switch (shiftType) {
      case 'morning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'afternoon':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'night':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'overtime':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const uniqueDrivers = [...new Set(shifts.map(shift => ({ id: shift.driverId, name: shift.driverName })))];

  const monthName = getMonthName(currentDate);
  const calendarDays = generateCalendarDays();
  const weekDays = generateWeekDays();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Schedule Calendar</h1>
              <p className="text-gray-600 mt-1">Manage driver shifts and Hours of Service logs</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Truck className="w-4 h-4" />
                  <span>{shifts.length} Total Shifts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{shifts.filter(s => s.status === 'scheduled').length} Scheduled</span>
                </div>
              </div>
              <button
                onClick={() => setShowHOSLogs(true)}
                className="flex items-center px-4 py-2 !mr-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Clock className="w-4 h-4 mr-2" />
                HOS Logs
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
                <select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Drivers</option>
                  {uniqueDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift Type</label>
                <select
                  value={shiftTypeFilter}
                  onChange={(e) => setShiftTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Shifts</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="night">Night</option>
                  <option value="overtime">Overtime</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Navigation */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => viewMode === 'month' ? navigateMonth(-1) : viewMode === 'week' ? navigateWeek(-1) : navigateDay(-1)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                  {viewMode === 'month' && monthName}
                  {viewMode === 'week' && `Week of ${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => viewMode === 'month' ? navigateMonth(1) : viewMode === 'week' ? navigateWeek(1) : navigateDay(1)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              {['month', 'week', 'day'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {viewMode === 'month' && (
            <>
              <div className="grid grid-cols-7 bg-gray-50 border-b">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <div key={day} className="p-4 text-center text-sm font-medium text-gray-500 border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayShifts = getShiftsForDate(day.date);
                  const isToday = day.date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={index}
                      className={`min-h-[140px] p-2 border-r border-b last:border-r-0 ${
                        !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                      } ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        !day.isCurrentMonth ? 'text-gray-400' : isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {day.date.getDate()}
                      </div>

                      <div className="space-y-1">
                        {dayShifts.slice(0, 3).map((shift) => (
                          <div
                            key={shift.id}
                            onClick={() => setSelectedShift(shift)}
                            className={`p-2 rounded text-xs cursor-pointer hover:shadow-sm transition-all ${getShiftTypeColor(shift.shiftType)}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium truncate">{shift.driverName}</span>
                              <Truck className="w-3 h-3" />
                            </div>
                            <div className="text-xs opacity-75">
                              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                            </div>
                            <div className={`text-xs px-1 py-0.5 rounded mt-1 ${getStatusColor(shift.status)}`}>
                              {shift.status}
                            </div>
                          </div>
                        ))}
                        {dayShifts.length > 3 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{dayShifts.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === 'week' && (
            <>
              <div className="grid grid-cols-8 bg-gray-50 border-b">
                <div className="p-4 border-r"></div>
                {weekDays.map((day) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  const dayShifts = getShiftsForDate(day);

                  return (
                    <div key={day.toISOString()} className={`p-4 text-center border-r last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                      <div className="text-sm font-medium text-gray-500">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </div>
                      {dayShifts.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {dayShifts.length} shifts
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-7 gap-4">
                  {weekDays.map((day) => {
                    const dayShifts = getShiftsForDate(day);

                    return (
                      <div key={day.toISOString()} className="space-y-2">
                        {dayShifts.map((shift) => (
                          <div
                            key={shift.id}
                            onClick={() => setSelectedShift(shift)}
                            className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-all ${getShiftTypeColor(shift.shiftType)}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm truncate">{shift.driverName}</span>
                              <Truck className="w-4 h-4" />
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                            </div>
                            <div className="text-xs text-gray-600 mb-2 truncate">
                              {shift.route}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${getStatusColor(shift.status)}`}>
                              {shift.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {viewMode === 'day' && (
            <div className="p-6">
              <div className="space-y-4">
                {getShiftsForDate(currentDate).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No shifts scheduled for this day</p>
                  </div>
                ) : (
                  getShiftsForDate(currentDate).map((shift) => (
                    <div
                      key={shift.id}
                      onClick={() => setSelectedShift(shift)}
                      className={`p-6 rounded-lg cursor-pointer hover:shadow-md transition-all ${getShiftTypeColor(shift.shiftType)}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <User className="w-8 h-8 text-gray-600" />
                          <div>
                            <span className="font-medium text-lg">{shift.driverName}</span>
                            <p className="text-sm text-gray-600">{shift.vehicleId}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shift.status)}`}>
                          {shift.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-sm text-gray-600">
                          <strong>Time:</strong> {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Shift Type:</strong> {shift.shiftType}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Hours Logged:</strong> {shift.hoursLogged}h
                        </div>
                      </div>

                      {shift.route && (
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Route:</strong> {shift.route}
                        </div>
                      )}

                      {shift.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          <strong>Notes:</strong> {shift.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Shift Details Modal */}
        {selectedShift && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-8 h-8 text-gray-600" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedShift.driverName}</h2>
                      <p className="text-gray-600">{selectedShift.vehicleId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedShift(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Shift Details</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>Start Time:</strong> {new Date(selectedShift.startTime).toLocaleString()}</div>
                        <div><strong>End Time:</strong> {new Date(selectedShift.endTime).toLocaleString()}</div>
                        <div><strong>Shift Type:</strong> {selectedShift.shiftType}</div>
                        <div><strong>Route:</strong> {selectedShift.route || 'Not assigned'}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Hours & Status</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>Hours Logged:</strong> {selectedShift.hoursLogged} hours</div>
                        <div><strong>Break Time:</strong> {selectedShift.breakTime} hours</div>
                        <div><strong>Status:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedShift.status)}`}>
                            {selectedShift.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedShift.notes && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Notes</h3>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                        {selectedShift.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hours of Service Logs Modal */}
        {showHOSLogs && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Hours of Service Logs</h2>
                  <button
                    onClick={() => setShowHOSLogs(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          On Duty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Driving
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sleep
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Off Duty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {hosLogs.map((log) => (
                        <tr key={log.id} className={log.violationFlag ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-5 h-5 text-gray-400 mr-2" />
                              <div className="text-sm font-medium text-gray-900">
                                {log.driverName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.onDutyTime}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.drivingTime}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.sleepTime}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.offDutyTime}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.violationFlag ? (
                              <div className="flex items-center">
                                <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Violation
                                </span>
                                {log.violationType && (
                                  <span className="ml-2 text-xs text-red-600">
                                    {log.violationType}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Compliant
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">
                        Hours of Service Regulations
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Maximum 11 hours of driving time within a 14-hour window</li>
                          <li>Minimum 10 consecutive hours off duty before driving</li>
                          <li>Maximum 60 hours on duty in 7 consecutive days</li>
                          <li>Maximum 70 hours on duty in 8 consecutive days</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverScheduleCalendar;