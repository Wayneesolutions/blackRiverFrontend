import { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Truck, 
  User, 
  Filter,
  X,
  Phone,
  MapPin
} from 'lucide-react';
import { getShifts } from '../../../../axios/api/admin';

// Type definitions
interface Shift {
  _id?: string;
  id?: string;
  driver?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  driverId?: string;
  driverName?: string;
  vehicle?: {
    _id: string;
    plateNumber?: string;
    make?: string;
    model?: string;
  };
  vehicleId?: string;
  load?: {
    _id: string;
    details?: {
      internalId?: string;
    };
    status?: string;
    route?: any;
  };
  shiftDate: string | Date;
  startTime: string | Date;
  endTime: string | Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'missed' | 'pending' | 'active';
  notes?: string;
  driverPhone?: string;
  driverEmail?: string;
  route?: string;
}

const DriverScheduleCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [driverFilter, setDriverFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch shifts from backend
  const fetchShifts = async () => {
    setLoading(true);
    try {
      // Calculate date range for current view
      const startDate = new Date(currentDate);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(currentDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);

      const response = await getShifts({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(driverFilter !== 'all' && { driverId: driverFilter })
      });

      if (response.success && response.data) {
        // Map backend data to frontend format
        const mappedShifts: Shift[] = response.data.map((shift: any) => ({
          _id: shift._id,
          id: shift._id,
          driverId: shift.driver?._id || shift.driver,
          driverName: shift.driver?.name || 'Unknown Driver',
          driverPhone: shift.driver?.phone,
          driverEmail: shift.driver?.email,
          vehicleId: shift.vehicle?._id || shift.vehicle,
          vehicle: shift.vehicle,
          load: shift.load,
          shiftDate: shift.shiftDate,
          startTime: shift.startTime,
          endTime: shift.endTime,
          status: shift.status === 'pending' ? 'scheduled' : shift.status === 'active' ? 'in-progress' : shift.status,
          notes: shift.notes || '',
          route: shift.load?.route ? 'Load: ' + (shift.load.details?.internalId || shift.load._id) : ''
        }));
        setShifts(mappedShifts);
      } else {
        setShifts([]);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [currentDate, driverFilter]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter shifts based on selected filters
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const driverMatch = driverFilter === 'all' || shift.driverId === driverFilter || shift.driver?._id === driverFilter;
      const statusMatch = statusFilter === 'all' || shift.status === statusFilter;
      return driverMatch && statusMatch;
    });
  }, [shifts, driverFilter, statusFilter]);

  // Get unique drivers from shifts
  const uniqueDrivers = useMemo(() => {
    const driverMap = new Map();
    shifts.forEach(shift => {
      if (shift.driver) {
        driverMap.set(shift.driver._id, {
          id: shift.driver._id,
          name: shift.driver.name
        });
      }
    });
    return Array.from(driverMap.values());
  }, [shifts]);

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
      const shiftDate = new Date(shift.shiftDate || shift.startTime).toISOString().split('T')[0];
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

  const getShiftTypeColor = () => {
    // Shifts from backend don't have shiftType, use default color
    return 'bg-blue-100 text-blue-800 border-blue-200';
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

  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const monthName = getMonthName(currentDate);
  const calendarDays = generateCalendarDays();
  const weekDays = generateWeekDays();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shifts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Schedule Calendar</h1>
              <p className="text-gray-600 mt-1">Manage driver shifts and schedules</p>
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
                            className={`p-2 rounded text-xs cursor-pointer hover:shadow-sm transition-all ${getShiftTypeColor()}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium truncate">{shift.driverName || shift.driver?.name || 'Unknown Driver'}</span>
                              <div className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                              </div>
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
                            className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-all ${getShiftTypeColor()}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm truncate">{shift.driverName || shift.driver?.name || 'Unknown Driver'}</span>
                              <div className="flex items-center gap-1">
                                <Truck className="w-4 h-4" />
                              </div>
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
                      className={`p-6 rounded-lg cursor-pointer hover:shadow-md transition-all ${getShiftTypeColor()}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <User className="w-8 h-8 text-gray-600" />
                          <div>
                            <span className="font-medium text-lg">{shift.driverName || shift.driver?.name || 'Unknown Driver'}</span>
                            {shift.vehicle && (
                              <p className="text-sm text-gray-600">{shift.vehicle.plateNumber || `${shift.vehicle.make} ${shift.vehicle.model}`}</p>
                            )}
                            {shift.load && (
                              <p className="text-sm text-gray-600">Load: {shift.load.details?.internalId || shift.load._id}</p>
                            )}
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
                        {shift.load && (
                          <div className="text-sm text-gray-600">
                            <strong>Load:</strong> {shift.load.details?.internalId || shift.load._id}
                          </div>
                        )}
                        {shift.vehicle && (
                          <div className="text-sm text-gray-600">
                            <strong>Vehicle:</strong> {shift.vehicle.plateNumber || shift.vehicle.make} {shift.vehicle.model}
                          </div>
                        )}
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
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-8 h-8 text-gray-600" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedShift.driverName || selectedShift.driver?.name || 'Unknown Driver'}</h2>
                      {selectedShift.vehicle && (
                        <p className="text-gray-600">{selectedShift.vehicle.plateNumber || `${selectedShift.vehicle.make} ${selectedShift.vehicle.model}`}</p>
                      )}
                      {selectedShift.load && (
                        <p className="text-gray-600">Load: {selectedShift.load.details?.internalId || selectedShift.load._id}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedShift(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Shift Details</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>Start Time:</strong> {new Date(selectedShift.startTime).toLocaleString()}</div>
                        <div><strong>End Time:</strong> {new Date(selectedShift.endTime).toLocaleString()}</div>
                        {selectedShift.load && (
                          <div><strong>Load:</strong> {selectedShift.load.details?.internalId || selectedShift.load._id}</div>
                        )}
                        {selectedShift.vehicle && (
                          <div><strong>Vehicle:</strong> {selectedShift.vehicle.plateNumber || `${selectedShift.vehicle.make} ${selectedShift.vehicle.model}`}</div>
                        )}
                        <div><strong>Route:</strong> {selectedShift.route || selectedShift.notes || 'Not assigned'}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Hours & Status</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        {selectedShift.startTime && selectedShift.endTime && (
                          <div><strong>Duration:</strong> {Math.round((new Date(selectedShift.endTime).getTime() - new Date(selectedShift.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10} hours</div>
                        )}
                        <div><strong>Status:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedShift.status)}`}>
                            {selectedShift.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Driver Contact</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{selectedShift.driverPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedShift.driverEmail}</span>
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
      </div>
    </div>
  );
};

export default DriverScheduleCalendar;