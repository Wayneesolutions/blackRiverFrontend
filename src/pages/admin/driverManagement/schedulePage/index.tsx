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
import { listTrip } from '../../../../axios/api/distapcher';

// Type definitions
interface Trip {
  _id?: string;
  id?: string;
  tripNumber?: string;
  driver?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  driverId?: string;
  driverName?: string;
  truck?: {
    _id: string;
    licensePlate?: string;
    unitNo?: string;
    make?: string;
    model?: string;
    makeModel?: string;
    internalId?: string;
  };
  trailer?: {
    _id: string;
    licensePlate?: string;
    unitNo?: string;
    makeModel?: string;
    internalId?: string;
  };
  plannedStartDate: string | Date | null;
  plannedEndDate: string | Date | null;
  actualStartDate?: string | Date | null;
  actualEndDate?: string | Date | null;
  startLocation?: {
    place?: string;
    latitude?: string;
    longitude?: string;
  };
  endLocation?: {
    place?: string;
    latitude?: string;
    longitude?: string;
  };
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  driverPhone?: string;
  driverEmail?: string;
  route?: {
    totalDistance?: number;
    estimatedDuration?: number;
    waypoints?: any[];
  };
}

const DriverScheduleCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [driverFilter, setDriverFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch trips from backend
  const fetchTrips = async () => {
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

      const params: any = {
        limit: 500,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      if (driverFilter !== 'all') {
        params.driver = driverFilter;
      }

      const response = await listTrip(params);

      if (response?.success && Array.isArray(response.data)) {
        // Map backend data to frontend format
        const mappedTrips: Trip[] = response.data.map((trip: any) => ({
          _id: trip._id,
          id: trip._id,
          tripNumber: trip.tripNumber,
          driverId: trip.driver?._id || trip.driver,
          driverName: trip.driver?.name || 'Unknown Driver',
          driverPhone: trip.driver?.phone,
          driverEmail: trip.driver?.email,
          driver: trip.driver,
          truck: trip.truck,
          trailer: trip.trailer,
          plannedStartDate: trip.plannedStartDate || null,
          plannedEndDate: trip.plannedEndDate || null,
          actualStartDate: trip.actualStartDate || null,
          actualEndDate: trip.actualEndDate || null,
          startLocation: trip.startLocation,
          endLocation: trip.endLocation,
          status: trip.status || 'planned',
          notes: trip.notes || '',
          route: trip.route || {}
        }));
        setTrips(mappedTrips);
      } else {
        setTrips([]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [currentDate, driverFilter]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter trips based on selected filters
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const driverMatch = driverFilter === 'all' || trip.driverId === driverFilter || trip.driver?._id === driverFilter;
      const statusMatch = statusFilter === 'all' || trip.status === statusFilter;
      return driverMatch && statusMatch;
    });
  }, [trips, driverFilter, statusFilter]);

  // Get unique drivers from trips
  const uniqueDrivers = useMemo(() => {
    const driverMap = new Map();
    trips.forEach(trip => {
      if (trip.driver) {
        driverMap.set(trip.driver._id, {
          id: trip.driver._id,
          name: trip.driver.name
        });
      }
    });
    return Array.from(driverMap.values());
  }, [trips]);

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

  const getTripsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredTrips.filter(trip => {
      // Use plannedStartDate if available, otherwise use actualStartDate or createdAt
      const tripDate = trip.plannedStartDate 
        ? new Date(trip.plannedStartDate).toISOString().split('T')[0]
        : trip.actualStartDate
        ? new Date(trip.actualStartDate).toISOString().split('T')[0]
        : null;
      return tripDate === dateStr;
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

  const getTripTypeColor = () => {
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
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
          <p className="text-gray-600">Loading trips...</p>
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
              <p className="text-gray-600 mt-1">Manage driver trips and schedules</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Truck className="w-4 h-4" />
                  <span>{trips.length} Total Trips</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{trips.filter(t => t.status === 'planned').length} Planned</span>
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
                  <option value="planned">Planned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
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
                  const dayTrips = getTripsForDate(day.date);
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
                        {dayTrips.slice(0, 3).map((trip) => (
                          <div
                            key={trip.id || trip._id}
                            onClick={() => setSelectedTrip(trip)}
                            className={`p-2 rounded text-xs cursor-pointer hover:shadow-sm transition-all ${getTripTypeColor()}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium truncate">{trip.driverName || trip.driver?.name || 'Unknown Driver'}</span>
                              <div className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                              </div>
                            </div>
                            {trip.tripNumber && (
                              <div className="text-xs opacity-75 mb-1">
                                {trip.tripNumber}
                              </div>
                            )}
                            {trip.plannedStartDate && (
                              <div className="text-xs opacity-75">
                                {formatTime(trip.plannedStartDate)}
                                {trip.plannedEndDate && ` - ${formatTime(trip.plannedEndDate)}`}
                              </div>
                            )}
                            <div className={`text-xs px-1 py-0.5 rounded mt-1 ${getStatusColor(trip.status)}`}>
                              {trip.status}
                            </div>
                          </div>
                        ))}
                        {dayTrips.length > 3 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{dayTrips.length - 3} more
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
                  const dayTrips = getTripsForDate(day);

                  return (
                    <div key={day.toISOString()} className={`p-4 text-center border-r last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                      <div className="text-sm font-medium text-gray-500">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </div>
                      {dayTrips.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {dayTrips.length} trips
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-7 gap-4">
                  {weekDays.map((day) => {
                    const dayTrips = getTripsForDate(day);

                    return (
                      <div key={day.toISOString()} className="space-y-2">
                        {dayTrips.map((trip) => (
                          <div
                            key={trip.id || trip._id}
                            onClick={() => setSelectedTrip(trip)}
                            className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-all ${getTripTypeColor()}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm truncate">{trip.driverName || trip.driver?.name || 'Unknown Driver'}</span>
                              <div className="flex items-center gap-1">
                                <Truck className="w-4 h-4" />
                              </div>
                            </div>
                            {trip.tripNumber && (
                              <div className="text-xs text-gray-600 mb-2">
                                {trip.tripNumber}
                              </div>
                            )}
                            {trip.plannedStartDate && (
                              <div className="text-xs text-gray-600 mb-2">
                                {formatTime(trip.plannedStartDate)}
                                {trip.plannedEndDate && ` - ${formatTime(trip.plannedEndDate)}`}
                              </div>
                            )}
                            <div className={`text-xs px-2 py-1 rounded ${getStatusColor(trip.status)}`}>
                              {trip.status}
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
                {getTripsForDate(currentDate).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No trips scheduled for this day</p>
                  </div>
                ) : (
                  getTripsForDate(currentDate).map((trip) => (
                    <div
                      key={trip.id || trip._id}
                      onClick={() => setSelectedTrip(trip)}
                      className={`p-6 rounded-lg cursor-pointer hover:shadow-md transition-all ${getTripTypeColor()}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <User className="w-8 h-8 text-gray-600" />
                          <div>
                            <span className="font-medium text-lg">{trip.driverName || trip.driver?.name || 'Unknown Driver'}</span>
                            {trip.tripNumber && (
                              <p className="text-sm text-gray-600">Trip: {trip.tripNumber}</p>
                            )}
                            {trip.truck && (
                              <p className="text-sm text-gray-600">
                                Truck: {trip.truck.licensePlate || trip.truck.unitNo || trip.truck.internalId || 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
                          {trip.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {trip.plannedStartDate && (
                          <div className="text-sm text-gray-600">
                            <strong>Start:</strong> {new Date(trip.plannedStartDate).toLocaleString()}
                          </div>
                        )}
                        {trip.plannedEndDate && (
                          <div className="text-sm text-gray-600">
                            <strong>End:</strong> {new Date(trip.plannedEndDate).toLocaleString()}
                          </div>
                        )}
                        {trip.truck && (
                          <div className="text-sm text-gray-600">
                            <strong>Truck:</strong> {trip.truck.licensePlate || trip.truck.unitNo || trip.truck.internalId || 'N/A'}
                          </div>
                        )}
                      </div>

                      {trip.startLocation?.place && (
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>From:</strong> {trip.startLocation.place}
                        </div>
                      )}
                      {trip.endLocation?.place && (
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>To:</strong> {trip.endLocation.place}
                        </div>
                      )}

                      {trip.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          <strong>Notes:</strong> {trip.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Trip Details Modal */}
        {selectedTrip && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-8 h-8 text-gray-600" />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedTrip.driverName || selectedTrip.driver?.name || 'Unknown Driver'}</h2>
                      {selectedTrip.tripNumber && (
                        <p className="text-gray-600">Trip: {selectedTrip.tripNumber}</p>
                      )}
                      {selectedTrip.truck && (
                        <p className="text-gray-600">
                          Truck: {selectedTrip.truck.licensePlate || selectedTrip.truck.unitNo || selectedTrip.truck.internalId || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTrip(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Trip Details</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        {selectedTrip.plannedStartDate && (
                          <div><strong>Planned Start:</strong> {new Date(selectedTrip.plannedStartDate).toLocaleString()}</div>
                        )}
                        {selectedTrip.plannedEndDate && (
                          <div><strong>Planned End:</strong> {new Date(selectedTrip.plannedEndDate).toLocaleString()}</div>
                        )}
                        {selectedTrip.tripNumber && (
                          <div><strong>Trip Number:</strong> {selectedTrip.tripNumber}</div>
                        )}
                        {selectedTrip.truck && (
                          <div><strong>Truck:</strong> {selectedTrip.truck.licensePlate || selectedTrip.truck.unitNo || selectedTrip.truck.internalId || 'N/A'}</div>
                        )}
                        {selectedTrip.trailer && (
                          <div><strong>Trailer:</strong> {selectedTrip.trailer.licensePlate || selectedTrip.trailer.unitNo || selectedTrip.trailer.internalId || 'N/A'}</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Status & Route</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        {selectedTrip.plannedStartDate && selectedTrip.plannedEndDate && (
                          <div><strong>Duration:</strong> {Math.round((new Date(selectedTrip.plannedEndDate).getTime() - new Date(selectedTrip.plannedStartDate).getTime()) / (1000 * 60 * 60) * 10) / 10} hours</div>
                        )}
                        <div><strong>Status:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedTrip.status)}`}>
                            {selectedTrip.status}
                          </span>
                        </div>
                        {selectedTrip.startLocation?.place && (
                          <div><strong>From:</strong> {selectedTrip.startLocation.place}</div>
                        )}
                        {selectedTrip.endLocation?.place && (
                          <div><strong>To:</strong> {selectedTrip.endLocation.place}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Driver Contact</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{selectedTrip.driverPhone || selectedTrip.driver?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedTrip.driverEmail || selectedTrip.driver?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedTrip.notes && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Notes</h3>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                        {selectedTrip.notes}
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