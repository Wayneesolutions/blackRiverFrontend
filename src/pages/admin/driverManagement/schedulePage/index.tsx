import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  MapPin,
} from 'lucide-react';
import { listTrip, updateTrip } from '../../../../axios/api/distapcher';

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
    plateNumber?: string;
    unitNo?: string;
    make?: string;
    model?: string;
    makeModel?: string;
    internalId?: string;
  };
  trailer?: {
    _id: string;
    licensePlate?: string;
    trailerNumber?: string;
    plateNumber?: string;
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
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled' | string;
  notes?: string;
  driverPhone?: string;
  driverEmail?: string;
  route?: {
    totalDistance?: number;
    estimatedDuration?: number;
    waypoints?: any[];
  };
  orders?: Array<{
    _id: string;
    orderNumber?: string;
    customer?: {
      name?: string;
    };
  }>;
  scheduledDate?: Date | null;
}

const DEFAULT_SCHEDULE_TIME = "09:00";

const UnifiedSchedulingPage = () => {
  // View mode: 'scheduling' (for scheduling trips) or 'calendar' (for viewing calendar)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [driverFilter, setDriverFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState(DEFAULT_SCHEDULE_TIME);
  const [draggedTrip, setDraggedTrip] = useState<Trip | null>(null);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const userInfoRef = useRef<any>(null);

  // Fetch trips from backend
  const fetchTrips = useCallback(
    async (options?: { suppressLoading?: boolean }) => {
      if (!options?.suppressLoading) {
        setLoading(true);
      }

      try {
        let currentUser = userInfoRef.current;
        if (!currentUser) {
          const stored = localStorage.getItem("userInfo");
          if (stored) {
            try {
              currentUser = JSON.parse(stored);
              userInfoRef.current = currentUser;
            } catch (error) {
              console.error("Error parsing userInfo during fetch:", error);
            }
          }
        }

        const userRole = currentUser?.role || currentUser?.userData?.role;
        const userCompany = currentUser?.company || currentUser?.userData?.company;
        const isSuperadmin = userRole === "superadmin";
        const isDispatcher = userRole === "dispatcher";
        const hasCompany = Boolean(userCompany);

        if (!isSuperadmin && !isDispatcher && !hasCompany) {
          setTrips([]);
          setEmptyStateMessage("No company assigned. Please complete company settings to view trips.");
          return;
        }

        const params: any = { limit: 500 };

        if (driverFilter !== 'all') {
          params.driver = driverFilter;
        }

        const response = await listTrip(params);
        const message = response?.message || null;
        const data = response?.data;

        if (response?.success && Array.isArray(data)) {
          if (data.length === 0) {
            setTrips([]);
            setEmptyStateMessage(message || "No trips available.");
            return;
          }

          const mappedTrips: Trip[] = data.map((trip: any) => ({
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
            route: trip.route || {},
            orders: trip.orders || [],
            scheduledDate: trip.plannedStartDate ? new Date(trip.plannedStartDate) : null
          }));

          setTrips(mappedTrips);
          setEmptyStateMessage(null);
        } else {
          setTrips([]);
          setEmptyStateMessage(message || "Failed to fetch trips.");
        }
      } catch (error: any) {
        console.error("Error fetching trips:", error);
        const fallbackMessage = error?.message || error?.data?.message || "Error fetching trips.";
        setTrips([]);
        setEmptyStateMessage(fallbackMessage);
      } finally {
        if (!options?.suppressLoading) {
          setLoading(false);
        }
      }
    },
    [driverFilter]
  );

  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = localStorage.getItem("userInfo");
        if (stored) {
          userInfoRef.current = JSON.parse(stored);
        }
      } catch (error) {
        console.error("Error parsing userInfo from localStorage:", error);
      }
    };

    syncUser();
    fetchTrips();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "userInfo") {
        syncUser();
        fetchTrips();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [fetchTrips]);

  const scheduledTrips = trips.filter((trip) => trip.scheduledDate || trip.plannedStartDate);

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

  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Calendar navigation
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

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };



  const combineDateAndTime = (date: Date, time: string) => {
    const [hours = "09", minutes = "00"] = time?.split(":") ?? [];
    const combined = new Date(date);
    combined.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
    return combined;
  };

  const scheduleTrip = async (trip: Trip, date: Date, time: string = DEFAULT_SCHEDULE_TIME) => {
    if (!date || !trip._id) return;

    try {
      const scheduledDate = combineDateAndTime(date, time);
      await updateTrip(trip._id, { plannedStartDate: scheduledDate.toISOString() });
      await fetchTrips({ suppressLoading: true });
    } catch (error) {
      console.error("Error scheduling trip:", error);
    }
  };

 

  const handleDrop = (date: Date) => {
    if (draggedTrip) {
      scheduleTrip(draggedTrip, date, DEFAULT_SCHEDULE_TIME);
      setDraggedTrip(null);
    }
  };

  // Calendar utility functions
  const getTripsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredTrips.filter(trip => {
      const tripDate = trip.plannedStartDate
        ? new Date(trip.plannedStartDate).toISOString().split('T')[0]
        : trip.actualStartDate
          ? new Date(trip.actualStartDate).toISOString().split('T')[0]
          : null;
      return tripDate === dateStr;
    });
  };

  const hasTripOnDate = (date: Date) => getTripsForDate(date).length > 0;

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

  const getTripIdentifier = (trip: Trip) => trip.tripNumber || `Trip ${trip._id?.slice(-6) || ''}`;
  const getCustomerName = (trip: Trip) => trip.orders?.[0]?.customer?.name || "No customer";

  const monthName = getMonthName(currentDate);
  const calendarDays = generateCalendarDays();
  const weekDays = generateWeekDays();

  if (loading && trips.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDF8FF]">
      {/* Header */}
      <div className=" p-5">
        <div className="w-full mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trip Scheduling</h1>
              <p className="text-gray-600 mt-0.5 text-sm">Schedule trips, view calendar, and manage driver assignments</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span><strong>{scheduledTrips.length}</strong> Scheduled</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Truck className="w-3.5 h-3.5" />
                  <span><strong>{trips.length}</strong> Total</span>
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3.5 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                Filters
              </button>
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-md p-3 border border-blue-200">
              <div className="text-xl font-bold text-blue-700">{scheduledTrips.length}</div>
              <div className="text-xs text-blue-600">Scheduled Trips</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-md p-3 border border-green-200">
              <div className="text-xl font-bold text-green-700">{trips.filter(t => t.status === 'completed').length}</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-md p-3 border border-purple-200">
              <div className="text-xl font-bold text-purple-700">{trips.filter(t => t.status === 'in-progress').length}</div>
              <div className="text-xs text-purple-600">In Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className=" p-5">
          <div className="w-full mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Driver</label>
                <select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="planned">Planned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDriverFilter('all');
                    setStatusFilter('all');
                  }}
                  className="w-[50%] px-2 py-1.5 text-sm text-gray-700 bg-white hover:bg-gray-200 rounded-md transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {emptyStateMessage && trips.length === 0 && (
        <div className="w-full mx-auto p-5">
          <div className="bg-blue-50 border border-blue-100 text-blue-700 px-3.5 py-2.5 rounded-md flex items-center gap-2.5">
            <Calendar className="text-lg" />
            <span className="text-sm">{emptyStateMessage}</span>
          </div>
        </div>
      )}

      <div className="w-full mx-auto p-5">
        <div className="flex flex-col gap-5">
          {/* Scheduled Trips List - Collapsible Sidebar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3.5 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Scheduled Trips ({scheduledTrips.length})</h3>
            </div>

            <div className="p-3.5 max-h-[200px] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {scheduledTrips.length > 0 ? (
                  scheduledTrips.map((trip) => (
                    <div
                      key={trip._id || trip.id}
                      className="p-2.5 rounded-md border bg-green-50 border-green-200 cursor-pointer transition-all hover:shadow-md"
                      onClick={() => {
                        setSelectedTrip(trip);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {getTripIdentifier(trip)}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center mt-1">
                          <User className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{trip.driverName || trip.driver?.name || 'No driver'}</span>
                        </div>
                        {getCustomerName(trip) !== "No customer" && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {getCustomerName(trip)}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2 flex items-center">
                          <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="capitalize">{trip.status}</span>
                        </div>
                        {trip.scheduledDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {typeof trip.scheduledDate === 'string'
                              ? new Date(trip.scheduledDate).toLocaleDateString("en-GB")
                              : trip.scheduledDate.toLocaleDateString("en-GB")
                            }
                          </div>
                        )}
                        {trip.plannedStartDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTime(trip.plannedStartDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-7">
                    <Truck className="mx-auto mb-2.5 text-gray-300" size={30} />
                    <p className="text-gray-500 text-sm">No scheduled trips found</p>
                    {emptyStateMessage && (
                      <p className="text-xs text-gray-400 mt-1">{emptyStateMessage}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3.5">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => viewMode === 'month' ? navigateMonth(-1) : viewMode === 'week' ? navigateWeek(-1) : navigateDay(-1)}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
                    {viewMode === 'month' && monthName}
                    {viewMode === 'week' && `Week of ${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h2>
                  <button
                    onClick={() => viewMode === 'month' ? navigateMonth(1) : viewMode === 'week' ? navigateWeek(1) : navigateDay(1)}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={goToToday}
                  className="px-2.5 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center space-x-1.5 bg-gray-100 rounded-md p-0.5">
                {['month', 'week', 'day'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as 'month' | 'week' | 'day')}
                    className={`px-2.5 py-0.5 rounded-md text-sm font-medium transition-colors ${viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar View */}
            {viewMode === 'month' && (
              <>
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 rounded-t-md">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2.5 text-center text-sm font-medium text-gray-500 border-r last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 border border-gray-200 border-t-0 rounded-b-md overflow-hidden">
                  {calendarDays.map((day, index) => {
                    const dayTrips = getTripsForDate(day.date);
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    const hasTrip = hasTripOnDate(day.date);

                    return (
                      <div
                        key={index}
                        onClick={() => setCurrentDate(day.date)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(day.date)}
                        className={`min-h-[115px] p-1.5 border-r border-b last:border-r-0 cursor-pointer transition-colors
                          ${!day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                          ${isToday ? 'bg-blue-50' : ''}
                          ${hasTrip && !isToday ? 'bg-green-50' : ''}
                          ${draggedTrip ? 'bg-blue-100 border-2 border-dashed border-blue-300' : ''}
                          hover:bg-gray-50
                        `}
                      >
                        <div className={`text-sm font-medium mb-1.5 ${!day.isCurrentMonth ? 'text-gray-400' : isToday ? 'text-blue-600 font-bold' : 'text-gray-900'
                          }`}>
                          {day.date.getDate()}
                        </div>

                        <div className="space-y-1">
                          {dayTrips.slice(0, 3).map((trip) => (
                            <div
                              key={trip.id || trip._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrip(trip);
                              }}
                              className={`p-1 rounded text-xs cursor-pointer hover:shadow-sm transition-all ${getStatusColor(trip.status)}`}
                            >
                              <div className="font-medium truncate">{trip.driverName || trip.driver?.name || 'Unknown Driver'}</div>
                              {trip.tripNumber && (
                                <div className="text-xs opacity-75 truncate">{trip.tripNumber}</div>
                              )}
                              {trip.plannedStartDate && (
                                <div className="text-xs opacity-75">{formatTime(trip.plannedStartDate)}</div>
                              )}
                            </div>
                          ))}
                          {dayTrips.length > 3 && (
                            <div className="text-xs text-gray-500 text-center py-0.5">
                              +{dayTrips.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-3 bg-gray-50 rounded-md p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2.5">Calendar Legend</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                    <div className="flex items-center">
                      <div className="w-3.5 h-3.5 bg-blue-50 border-2 border-blue-300 rounded mr-1.5"></div>
                      <span>Today</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3.5 h-3.5 bg-green-50 rounded mr-1.5"></div>
                      <span>Has Trips</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3.5 h-3.5 bg-blue-100 border-2 border-dashed border-blue-300 rounded mr-1.5"></div>
                      <span>Drop Zone</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3.5 h-3.5 bg-gray-400 rounded mr-1.5"></div>
                      <span>Other Month</span>
                    </div>
                  </div>
                  <div className="mt-1.5 text-xs text-gray-500">
                    💡 Click on calendar dates to view scheduled trips
                  </div>
                </div>
              </>
            )}

            {viewMode === 'week' && (
              <>
                <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200 rounded-t-md">
                  <div className="p-2.5 border-r"></div>
                  {weekDays.map((day) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    const dayTrips = getTripsForDate(day);

                    return (
                      <div key={day.toISOString()} className={`p-2.5 text-center border-r last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                        <div className="text-sm font-medium text-gray-500">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-base font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
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

                <div className="p-3 border border-gray-200 border-t-0 rounded-b-md">
                  <div className="grid grid-cols-7 gap-3">
                    {weekDays.map((day) => {
                      const dayTrips = getTripsForDate(day);

                      return (
                        <div key={day.toISOString()} className="space-y-1.5">
                          {dayTrips.map((trip) => (
                            <div
                              key={trip.id || trip._id}
                              onClick={() => setSelectedTrip(trip)}
                              className={`p-2.5 rounded-md cursor-pointer hover:shadow-md transition-all ${getStatusColor(trip.status)}`}
                            >
                              <div className="font-medium text-sm truncate">{trip.driverName || trip.driver?.name || 'Unknown Driver'}</div>
                              {trip.tripNumber && (
                                <div className="text-xs text-gray-600 mt-1 truncate">{trip.tripNumber}</div>
                              )}
                              {trip.plannedStartDate && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {formatTime(trip.plannedStartDate)}
                                  {trip.plannedEndDate && ` - ${formatTime(trip.plannedEndDate)}`}
                                </div>
                              )}
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
              <div className="border border-gray-200 rounded-md p-5">
                <div className="space-y-3">
                  {getTripsForDate(currentDate).length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      <Calendar className="w-11 h-11 mx-auto mb-3 opacity-50" />
                      <p>No trips scheduled for this day</p>
                    </div>
                  ) : (
                    getTripsForDate(currentDate).map((trip) => (
                      <div
                        key={trip.id || trip._id}
                        onClick={() => setSelectedTrip(trip)}
                        className={`p-5 rounded-md cursor-pointer hover:shadow-md transition-all ${getStatusColor(trip.status)}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2.5">
                            <User className="w-7 h-7 text-gray-600" />
                            <div>
                              <span className="font-medium text-base">{trip.driverName || trip.driver?.name || 'Unknown Driver'}</span>
                              {trip.tripNumber && (
                                <p className="text-sm text-gray-600">Trip: {trip.tripNumber}</p>
                              )}
                              {trip.truck && (
                                <p className="text-sm text-gray-600">
                                  Truck: {trip.truck.licensePlate || trip.truck.plateNumber || trip.truck.unitNo || trip.truck.internalId || 'N/A'}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
                            {trip.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
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
                              <strong>Truck:</strong> {trip.truck.licensePlate || trip.truck.plateNumber || trip.truck.unitNo || trip.truck.internalId || 'N/A'}
                            </div>
                          )}
                        </div>

                        {trip.startLocation?.place && (
                          <div className="text-sm text-gray-600 mb-1.5">
                            <strong>From:</strong> {trip.startLocation.place}
                          </div>
                        )}
                        {trip.endLocation?.place && (
                          <div className="text-sm text-gray-600 mb-1.5">
                            <strong>To:</strong> {trip.endLocation.place}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedTrip && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Schedule Trip
            </h3>

            <div className="mb-4">
              <div className="font-medium text-gray-900">
                {getTripIdentifier(selectedTrip)}
              </div>
              <div className="text-sm text-gray-600">
                Customer: {getCustomerName(selectedTrip)}
              </div>
              {selectedTrip.driver?.name && (
                <div className="text-sm text-gray-600">
                  Driver: {selectedTrip.driver.name}
                </div>
              )}
              {selectedTrip.truck?.internalId && (
                <div className="text-sm text-gray-600">
                  Truck: {selectedTrip.truck.internalId}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={currentDate.toISOString().split("T")[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    setCurrentDate(new Date(e.target.value));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value || DEFAULT_SCHEDULE_TIME)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedTrip(null);
                  setSelectedTime(DEFAULT_SCHEDULE_TIME);
                }}
                className="px-4 py-2 text-sm !mr-3 font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  scheduleTrip(selectedTrip, currentDate, selectedTime);
                  setShowScheduleModal(false);
                  setSelectedTrip(null);
                  setSelectedTime(DEFAULT_SCHEDULE_TIME);
                }}
                className="px-4 py-2 text-sm font-medium !text-white bg-blue-600 rounded-md hover:bg-blue-700"
                style={{
                  background: "linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)",
                }}
              >
                Schedule Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trip Details Modal */}
      {selectedTrip && !showScheduleModal && (
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
                        Truck: {selectedTrip.truck.licensePlate || selectedTrip.truck.plateNumber || selectedTrip.truck.unitNo || selectedTrip.truck.internalId || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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
                        <div><strong>Truck:</strong> {selectedTrip.truck.licensePlate || selectedTrip.truck.plateNumber || selectedTrip.truck.unitNo || selectedTrip.truck.internalId || 'N/A'}</div>
                      )}
                      {selectedTrip.trailer && (
                        <div><strong>Trailer:</strong> {selectedTrip.trailer.licensePlate || selectedTrip.trailer.plateNumber || selectedTrip.trailer.trailerNumber || selectedTrip.trailer.unitNo || selectedTrip.trailer.internalId || 'N/A'}</div>
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

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedTrip(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedSchedulingPage;
