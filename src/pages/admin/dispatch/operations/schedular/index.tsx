import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Truck, Trash2 } from "lucide-react";
import { listLoad, updateLoad } from "../../../../../axios/api/distapcher";

interface Load {
    _id: string;
    orderId: string;
    driverName: string | null;
    customerName: string | null;
    route: any[];
    status: string;
    notes: string | null;
    assignedAt: string | null;
    scheduledDate?: Date;
    internalId?: string;
    payloads?: any[];
}

const SchedulerPage = () => {
    const [activeTab, setActiveTab] = useState<"unscheduled" | "scheduled">("unscheduled");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [loads, setLoads] = useState<Load[]>([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
    const [draggedLoad, setDraggedLoad] = useState<Load | null>(null);
    const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);

    // Fetch loads data
    const fetchLoads = useCallback(async () => {
        try {
            setLoading(true);

            let currentUser = userInfo;
            if (!currentUser) {
                const stored = localStorage.getItem('userInfo');
                if (stored) {
                    try {
                        currentUser = JSON.parse(stored);
                        setUserInfo(currentUser);
                    } catch (error) {
                        console.error('Error parsing userInfo during fetch:', error);
                    }
                }
            }

            const isSuperadmin = currentUser?.role === 'superadmin';
            const hasCompany = Boolean(currentUser?.company);

            if (!isSuperadmin && !hasCompany) {
                setLoads([]);
                setEmptyStateMessage(null);
                return;
            }

            const response = await listLoad();
            const message = response?.message || null;
            const data = response?.data;

            if (response.success && Array.isArray(data)) {
                if (data.length === 0) {
                    setLoads([]);
                    setEmptyStateMessage(message || 'No loads available.');
                    return;
                }

                const loadsWithDates = data.map((load: any) => ({
                    ...load,
                    scheduledDate: load.assignedAt ? new Date(load.assignedAt) : null
                }));
                setLoads(loadsWithDates);
                setEmptyStateMessage(null);
            } else {
                setLoads([]);
                setEmptyStateMessage(message || 'Failed to fetch loads.');
            }
        } catch (error) {
            console.error('Error fetching loads:', error);
            setLoads([]);
            setEmptyStateMessage('Error fetching loads.');
        } finally {
            setLoading(false);
        }
    }, [userInfo]);

    useEffect(() => {
        const syncUser = () => {
            try {
                const stored = localStorage.getItem('userInfo');
                if (stored) {
                    setUserInfo(JSON.parse(stored));
                }
            } catch (error) {
                console.error('Error parsing userInfo from localStorage:', error);
            }
        };

        syncUser();
        fetchLoads();

        const handleStorage = (event: StorageEvent) => {
            if (event.key === 'userInfo') {
                syncUser();
                fetchLoads();
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [fetchLoads]);

    // Filter loads based on scheduling status
    const scheduledLoads = loads.filter((load) => load.scheduledDate);
    const unscheduledLoads = loads.filter((load) => !load.scheduledDate);

    // Calendar functions
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const getPreviousMonthDays = (date: Date) => {
        const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 0);
        return prevMonth.getDate();
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev);
            if (direction === 'prev') {
                newMonth.setMonth(prev.getMonth() - 1);
            } else {
                newMonth.setMonth(prev.getMonth() + 1);
            }
            return newMonth;
        });
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(today);
    };

    const hasLoadOnDate = (date: Date) => {
        return scheduledLoads.some(load => 
            load.scheduledDate?.toDateString() === date.toDateString()
        );
    };

    const getLoadsForDate = (date: Date) => {
        return scheduledLoads.filter(load => 
            load.scheduledDate?.toDateString() === date.toDateString()
        );
    };

    // Schedule a load for a specific date
    const scheduleLoad = async (load: Load, date: Date) => {
        try {
            const updateData = {
                assignedAt: date.toISOString()
            };
            const response = await updateLoad(load._id, updateData);
            if (response.success) {
                fetchLoads(); // Refresh the loads
            }
        } catch (error) {
            console.error('Error scheduling load:', error);
        }
    };

    // Unschedule a load
    const unscheduleLoad = async (load: Load) => {
        try {
            const updateData = {
                assignedAt: null
            };
            const response = await updateLoad(load._id, updateData);
            if (response.success) {
                fetchLoads(); // Refresh the loads
            }
        } catch (error) {
            console.error('Error unscheduling load:', error);
        }
    };

    // Handle drag start
    const handleDragStart = (load: Load) => {
        setDraggedLoad(load);
    };

    // Handle drag end
    const handleDragEnd = () => {
        setDraggedLoad(null);
    };

    // Handle drop on calendar date
    const handleDrop = (date: Date) => {
        if (draggedLoad) {
            scheduleLoad(draggedLoad, date);
            setDraggedLoad(null);
        }
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const prevMonthDays = getPreviousMonthDays(currentMonth);
        
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Add day headers
        dayNames.forEach(day => {
            days.push(
                <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                    {day}
                </div>
            );
        });

        // Add previous month's trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            days.push(
                <div key={`prev-${day}`} className="text-center p-2 text-gray-400 text-sm">
                    {day}
                </div>
            );
        }

        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const hasLoad = hasLoadOnDate(date);
            const loadsForDate = getLoadsForDate(date);

            days.push(
                <div
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(date)}
                    className={`text-center p-2 text-sm cursor-pointer rounded-lg transition-colors relative
                        ${isSelected ? 'bg-blue-200 text-blue-800' : ''}
                        ${hasLoad && !isSelected ? 'bg-green-100' : ''}
                        ${isToday && !isSelected ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${draggedLoad ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''}
                        hover:bg-gray-100
                    `}
                >
                    <div className="flex flex-col items-center">
                        <span>{day}</span>
                        {hasLoad && (
                            <div className="flex space-x-1 mt-1">
                                {loadsForDate.slice(0, 3).map((_, index) => (
                                    <div key={index} className="w-1 h-1 bg-green-600 rounded-full"></div>
                                ))}
                                {loadsForDate.length > 3 && (
                                    <span className="text-xs text-green-600">+{loadsForDate.length - 3}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Add next month's leading days to fill the grid
        const totalCells = days.length - 7; // Subtract header row
        const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42
        for (let day = 1; day <= remainingCells; day++) {
            days.push(
                <div key={`next-${day}`} className="text-center p-2 text-gray-400 text-sm">
                    {day}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-7 gap-1">
                {days}
            </div>
        );
    };

    const currentLoads = activeTab === "scheduled" ? scheduledLoads : unscheduledLoads;
    const selectedDateLoads = getLoadsForDate(selectedDate);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-800">Scheduler</h1>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{scheduledLoads.length}</span> scheduled
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{unscheduledLoads.length}</span> unscheduled
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{loads.length}</span> total loads
                        </div>
                    </div>
                </div>
            </div>

            {emptyStateMessage && currentLoads.length === 0 && (
                <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3">
                    <Calendar className="text-xl" />
                    <span className="text-sm">{emptyStateMessage}</span>
                </div>
            )}

            <div className="flex">
                {/* Left Sidebar */}
                <div className="w-80 border-r border-gray-200 bg-white">
                    {/* Quick Stats */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg border">
                                <div className="text-lg font-semibold text-green-600">{scheduledLoads.length}</div>
                                <div className="text-xs text-gray-500">Scheduled</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border">
                                <div className="text-lg font-semibold text-orange-600">{unscheduledLoads.length}</div>
                                <div className="text-xs text-gray-500">Pending</div>
                            </div>
                        </div>
                        <div className="mt-3 bg-white p-3 rounded-lg border">
                            <div className="text-lg font-semibold text-blue-600">{loads.length}</div>
                            <div className="text-xs text-gray-500">Total Loads</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab("unscheduled")}
                                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                                    ${activeTab === "unscheduled" 
                                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Unscheduled Orders
                            </button>
                            <button
                                onClick={() => setActiveTab("scheduled")}
                                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                                    ${activeTab === "scheduled" 
                                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Scheduled Orders
                            </button>
                        </div>
                    </div>

                    {/* Loads List */}
                    <div className="p-4">
                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-500 mt-2">Loading loads...</p>
                                </div>
                            ) : currentLoads.length > 0 ? (
                                currentLoads.map((load) => (
                                    <div
                                        key={load._id}
                                        draggable={activeTab === "unscheduled"}
                                        onDragStart={() => handleDragStart(load)}
                                        onDragEnd={handleDragEnd}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md
                                            ${activeTab === "scheduled" 
                                                ? 'bg-green-50 border-green-200' 
                                                : 'bg-gray-50 border-gray-200'
                                            }
                                            ${draggedLoad?._id === load._id ? 'opacity-50' : ''}
                                        `}
                                        onClick={() => {
                                            setSelectedLoad(load);
                                            if (activeTab === "unscheduled") {
                                                setShowScheduleModal(true);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    {load.internalId || load.orderId}
                                                </div>
                                                <div className="text-sm text-gray-600 flex items-center mt-1">
                                                    <User className="w-3 h-3 mr-1" />
                                                    {load.customerName || 'No customer'}
                                                </div>
                                                {load.driverName && (
                                                    <div className="text-sm text-gray-600 flex items-center mt-1">
                                                        <Truck className="w-3 h-3 mr-1" />
                                                        {load.driverName}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500 mt-2 flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Status: {load.status}
                                                </div>
                                                {load.scheduledDate && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {load.scheduledDate.toLocaleDateString("en-GB")}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col space-y-1">
                                                {activeTab === "scheduled" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            unscheduleLoad(load);
                                                        }}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                        title="Unschedule"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                                {activeTab === "unscheduled" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedLoad(load);
                                                            setShowScheduleModal(true);
                                                        }}
                                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                        title="Schedule"
                                                    >
                                                        <Calendar className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Truck className="mx-auto mb-3 text-gray-300" size={32} />
                                    <p className="text-gray-500">No loads found</p>
                                    {emptyStateMessage && (
                                        <p className="text-xs text-gray-400 mt-1">{emptyStateMessage}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Calendar Area */}
                <div className="flex-1 p-6">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => navigateMonth('prev')}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={goToToday}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                            >
                                Today
                            </button>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {currentMonth.toLocaleDateString("en-US", { 
                                    month: "long", 
                                    year: "numeric" 
                                })}
                            </h2>
                        </div>

                        <button
                            onClick={() => navigateMonth('next')}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        {renderCalendar()}
                    </div>

                    {/* Calendar Legend */}
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Calendar Legend</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
                                <span>Today</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-200 rounded mr-2"></div>
                                <span>Selected</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                                <span>Has Loads</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded mr-2"></div>
                                <span>Drop Zone</span>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            💡 Drag unscheduled loads to calendar dates to schedule them
                        </div>
                    </div>

                    {/* Selected Date Loads */}
                    {activeTab === "scheduled" && selectedDateLoads.length > 0 && (
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Loads for {selectedDate.toLocaleDateString("en-GB")}
                            </h3>
                            <div className="space-y-3">
                                {selectedDateLoads.map((load) => (
                                    <div key={load._id} className="bg-white p-3 rounded border">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    {load.internalId || load.orderId}
                                                </div>
                                                <div className="text-sm text-gray-600 flex items-center mt-1">
                                                    <User className="w-3 h-3 mr-1" />
                                                    {load.customerName || 'No customer'}
                                                </div>
                                                {load.driverName && (
                                                    <div className="text-sm text-gray-600 flex items-center mt-1">
                                                        <Truck className="w-3 h-3 mr-1" />
                                                        {load.driverName}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500 mt-2 flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Status: {load.status}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => unscheduleLoad(load)}
                                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                title="Unschedule"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Schedule Modal */}
            {showScheduleModal && selectedLoad && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Schedule Load
                        </h3>
                        
                        <div className="mb-4">
                            <div className="font-medium text-gray-900">
                                {selectedLoad.internalId || selectedLoad.orderId}
                            </div>
                            <div className="text-sm text-gray-600">
                                Customer: {selectedLoad.customerName || 'No customer'}
                            </div>
                            {selectedLoad.driverName && (
                                <div className="text-sm text-gray-600">
                                    Driver: {selectedLoad.driverName}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate.toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Time
                            </label>
                            <input
                                type="time"
                                defaultValue="09:00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowScheduleModal(false);
                                    setSelectedLoad(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    scheduleLoad(selectedLoad, selectedDate);
                                    setShowScheduleModal(false);
                                    setSelectedLoad(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Schedule Load
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchedulerPage;