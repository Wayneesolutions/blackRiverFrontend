import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Truck, 
  User, 
  Filter, 
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  MapPin,
  Phone
} from 'lucide-react';

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
  driverPhone?: string;
  driverEmail?: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  department: string;
  status: 'active' | 'inactive';
}

interface Vehicle {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in-use' | 'maintenance';
}

const DriverScheduleCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [driverFilter, setDriverFilter] = useState('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sample drivers data
  const [drivers] = useState<Driver[]>([
    { id: 'D001', name: 'John Smith', phone: '+1-555-0101', email: 'john@company.com', licenseNumber: 'CDL123456', department: 'Long Haul', status: 'active' },
    { id: 'D002', name: 'Mike Johnson', phone: '+1-555-0102', email: 'mike@company.com', licenseNumber: 'CDL123457', department: 'Local Delivery', status: 'active' },
    { id: 'D003', name: 'Sarah Williams', phone: '+1-555-0103', email: 'sarah@company.com', licenseNumber: 'CDL123458', department: 'Long Haul', status: 'active' },
    { id: 'D004', name: 'David Brown', phone: '+1-555-0104', email: 'david@company.com', licenseNumber: 'CDL123459', department: 'Local Delivery', status: 'active' }
  ]);

  // Sample vehicles data
  const [vehicles] = useState<Vehicle[]>([
    { id: 'TRK-001', name: 'Freightliner Cascadia', type: 'Semi Truck', status: 'available' },
    { id: 'TRK-002', name: 'Volvo VNL', type: 'Semi Truck', status: 'available' },
    { id: 'TRK-003', name: 'Peterbilt 579', type: 'Semi Truck', status: 'in-use' },
    { id: 'VAN-001', name: 'Ford Transit', type: 'Delivery Van', status: 'available' }
  ]);

  // Shifts data with state management
  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: '1',
      driverId: 'D001',
      driverName: 'John Smith',
      vehicleId: 'TRK-001',
      startTime: '2024-01-20T06:00:00',
      endTime: '2024-01-20T14:00:00',
      shiftType: 'morning',
      status: 'completed',
      route: 'Route A - City Center',
      hoursLogged: 8,
      breakTime: 1,
      notes: 'Regular delivery route',
      driverPhone: '+1-555-0101',
      driverEmail: 'john@company.com'
    },
    {
      id: '2',
      driverId: 'D002',
      driverName: 'Mike Johnson',
      vehicleId: 'TRK-002',
      startTime: '2024-01-20T14:00:00',
      endTime: '2024-01-20T22:00:00',
      shiftType: 'afternoon',
      status: 'in-progress',
      route: 'Route B - Industrial Area',
      hoursLogged: 6,
      breakTime: 0.5,
      driverPhone: '+1-555-0102',
      driverEmail: 'mike@company.com'
    },
    {
      id: '3',
      driverId: 'D001',
      driverName: 'John Smith',
      vehicleId: 'TRK-001',
      startTime: '2024-01-21T08:00:00',
      endTime: '2024-01-21T16:00:00',
      shiftType: 'morning',
      status: 'scheduled',
      route: 'Route C - Suburban',
      hoursLogged: 0,
      breakTime: 0,
      driverPhone: '+1-555-0101',
      driverEmail: 'john@company.com'
    },
    {
      id: '4',
      driverId: 'D003',
      driverName: 'Sarah Williams',
      vehicleId: 'TRK-003',
      startTime: '2024-01-21T22:00:00',
      endTime: '2024-01-22T06:00:00',
      shiftType: 'night',
      status: 'scheduled',
      route: 'Route D - Highway',
      hoursLogged: 0,
      breakTime: 0,
      driverPhone: '+1-555-0103',
      driverEmail: 'sarah@company.com'
    }
  ]);

  const [shiftForm, setShiftForm] = useState({
    driverId: '',
    vehicleId: '',
    startTime: '',
    endTime: '',
    shiftType: 'morning' as 'morning' | 'afternoon' | 'night' | 'overtime',
    status: 'scheduled' as 'scheduled' | 'in-progress' | 'completed' | 'missed',
    route: '',
    hoursLogged: 0,
    breakTime: 0,
    notes: ''
  });

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

  const handleAddShift = () => {
    if (!shiftForm.driverId || !shiftForm.vehicleId || !shiftForm.startTime || !shiftForm.endTime) {
      alert('Please fill all required fields');
      return;
    }

    const selectedDriver = drivers.find(d => d.id === shiftForm.driverId);
    const newShift: Shift = {
      id: Date.now().toString(),
      driverName: selectedDriver?.name || '',
      driverPhone: selectedDriver?.phone || '',
      driverEmail: selectedDriver?.email || '',
      ...shiftForm
    };

    setShifts([...shifts, newShift]);
    setShowAddModal(false);
    resetForm();
  };

  const handleEditShift = () => {
    if (!editingShift || !shiftForm.driverId || !shiftForm.vehicleId || !shiftForm.startTime || !shiftForm.endTime) {
      alert('Please fill all required fields');
      return;
    }

    const selectedDriver = drivers.find(d => d.id === shiftForm.driverId);
    const updatedShift: Shift = {
      ...editingShift,
      driverName: selectedDriver?.name || '',
      driverPhone: selectedDriver?.phone || '',
      driverEmail: selectedDriver?.email || '',
      ...shiftForm
    };

    setShifts(shifts.map(s => s.id === editingShift.id ? updatedShift : s));
    setShowEditModal(false);
    setEditingShift(null);
    resetForm();
  };

  const handleDeleteShift = (shiftId: string) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      setShifts(shifts.filter(s => s.id !== shiftId));
    }
  };

  const resetForm = () => {
    setShiftForm({
      driverId: '',
      vehicleId: '',
      startTime: '',
      endTime: '',
      shiftType: 'morning',
      status: 'scheduled',
      route: '',
      hoursLogged: 0,
      breakTime: 0,
      notes: ''
    });
  };

  const openEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setShiftForm({
      driverId: shift.driverId,
      vehicleId: shift.vehicleId,
      startTime: shift.startTime.split('T')[0] + 'T' + shift.startTime.split('T')[1].substring(0, 5),
      endTime: shift.endTime.split('T')[0] + 'T' + shift.endTime.split('T')[1].substring(0, 5),
      shiftType: shift.shiftType,
      status: shift.status,
      route: shift.route || '',
      hoursLogged: shift.hoursLogged,
      breakTime: shift.breakTime,
      notes: shift.notes || ''
    });
    setShowEditModal(true);
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
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 !mr-4 !text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Shift
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
                              <div className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(shift);
                                  }}
                                  className="text-gray-600 hover:text-blue-600"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteShift(shift.id);
                                  }}
                                  className="text-gray-600 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
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
                            className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-all ${getShiftTypeColor(shift.shiftType)}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm truncate">{shift.driverName}</span>
                              <div className="flex items-center gap-1">
                                <Truck className="w-4 h-4" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(shift);
                                  }}
                                  className="text-gray-600 hover:text-blue-600"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteShift(shift.id);
                                  }}
                                  className="text-gray-600 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shift.status)}`}>
                            {shift.status}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(shift);
                            }}
                            className="text-gray-600 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShift(shift.id);
                            }}
                            className="text-gray-600 hover:text-red-600 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
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
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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

        {/* Add Shift Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Shift</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Driver *</label>
                    <select
                      value={shiftForm.driverId}
                      onChange={(e) => setShiftForm({ ...shiftForm, driverId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Driver</option>
                      {drivers.filter(d => d.status === 'active').map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle *</label>
                    <select
                      value={shiftForm.vehicleId}
                      onChange={(e) => setShiftForm({ ...shiftForm, vehicleId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.filter(v => v.status === 'available').map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
                    <input
                      type="datetime-local"
                      value={shiftForm.startTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                    <input
                      type="datetime-local"
                      value={shiftForm.endTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Shift Type</label>
                    <select
                      value={shiftForm.shiftType}
                      onChange={(e) => setShiftForm({ ...shiftForm, shiftType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="night">Night</option>
                      <option value="overtime">Overtime</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={shiftForm.status}
                      onChange={(e) => setShiftForm({ ...shiftForm, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="missed">Missed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Route</label>
                  <input
                    type="text"
                    value={shiftForm.route}
                    onChange={(e) => setShiftForm({ ...shiftForm, route: e.target.value })}
                    placeholder="Enter route details"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hours Logged</label>
                    <input
                      type="number"
                      step="0.5"
                      value={shiftForm.hoursLogged}
                      onChange={(e) => setShiftForm({ ...shiftForm, hoursLogged: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Break Time</label>
                    <input
                      type="number"
                      step="0.5"
                      value={shiftForm.breakTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, breakTime: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={shiftForm.notes}
                    onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                    placeholder="Enter any additional notes"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddShift}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Add Shift
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Shift Modal */}
        {showEditModal && editingShift && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Shift</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingShift(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Driver *</label>
                    <select
                      value={shiftForm.driverId}
                      onChange={(e) => setShiftForm({ ...shiftForm, driverId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Driver</option>
                      {drivers.filter(d => d.status === 'active').map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle *</label>
                    <select
                      value={shiftForm.vehicleId}
                      onChange={(e) => setShiftForm({ ...shiftForm, vehicleId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
                    <input
                      type="datetime-local"
                      value={shiftForm.startTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                    <input
                      type="datetime-local"
                      value={shiftForm.endTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Shift Type</label>
                    <select
                      value={shiftForm.shiftType}
                      onChange={(e) => setShiftForm({ ...shiftForm, shiftType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="night">Night</option>
                      <option value="overtime">Overtime</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={shiftForm.status}
                      onChange={(e) => setShiftForm({ ...shiftForm, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="missed">Missed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Route</label>
                  <input
                    type="text"
                    value={shiftForm.route}
                    onChange={(e) => setShiftForm({ ...shiftForm, route: e.target.value })}
                    placeholder="Enter route details"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hours Logged</label>
                    <input
                      type="number"
                      step="0.5"
                      value={shiftForm.hoursLogged}
                      onChange={(e) => setShiftForm({ ...shiftForm, hoursLogged: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Break Time</label>
                    <input
                      type="number"
                      step="0.5"
                      value={shiftForm.breakTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, breakTime: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={shiftForm.notes}
                    onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                    placeholder="Enter any additional notes"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingShift(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditShift}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Update Shift
                  </button>
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