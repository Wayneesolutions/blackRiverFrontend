import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Edit, Trash2, Eye, Search, X, File, Download ,MessageCircle} from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaTruck, FaUser, FaTrailer } from "react-icons/fa";
import NewTripSidebar from "./NewTripSidebar";
import { listTrip, deleteTrip, getTripById, startTrip as startTripAPI, completeTrip as completeTripAPI, listDriver, listVehicle, getTripDocumentSignedUrl } from "../../../../../axios/api/distapcher";
import ConfirmationModal from "../../../../../components/common/ConfirmationModal";
import { FLEET_COLORS, getFocusStyles } from "../../../fleetMaintenance/colorUtils";
import TripChat from "../../../../../components/chat/TripChat";
import { getUnreadMessageCount } from "../../../../../axios/api/chat";
import { useLocation, useNavigate } from "react-router-dom";

interface Trip {
  _id: string;
  tripNumber: string;
  driver?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  coDriver?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  truck?: {
    _id: string;
    licensePlate?: string;
    unitNo?: string;
    makeModel?: string;
    make?: string;
    model?: string;
    internalId?: string;
    unitType?: string;
    // Legacy fields for backward compatibility
    plateNumber?: string;
  };
  trailer?: {
    _id: string;
    licensePlate?: string;
    unitNo?: string;
    makeModel?: string;
    unitType?: string;
    // Legacy fields for backward compatibility
    plateNumber?: string;
    trailerNumber?: string;
  };
  orders?: Array<{
    _id: string;
    orderNumber: string;
    customerOrderNo?: string;
    status?: string;
    customer?: any;
    pickupLocation?: any;
    deliveryLocation?: any;
  }>;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  plannedStartDate?: string | null | undefined;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
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
  notes?: string;
  documents?: Array<{
    _id?: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    uploadedBy?: any;
    uploadedAt?: string;
    description?: string;
  }>;
}

type NotificationType = 'success' | 'error' | 'warning' | 'chat';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
  tripId?: string;
  tripNumber?: string;
  driverName?: string;
}

const ToastNotification = ({ notification, onClose, onChatClick }: { 
  notification: ToastNotification; 
  onClose: (id: number) => void;
  onChatClick?: (tripId: string, tripNumber: string) => void;
}) => {
  const [progress, setProgress] = useState(100);
  const duration = notification.type === 'chat' ? 8000 : 5000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, duration);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const decrement = (100 / duration) * 50; // Update every 50ms
        return Math.max(0, prev - decrement);
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [notification.id, onClose, duration]);

  const handleClick = () => {
    if (notification.type === 'chat' && notification.tripId && notification.tripNumber && onChatClick) {
      onChatClick(notification.tripId, notification.tripNumber);
      onClose(notification.id);
    }
  };

  // Chat notification (Advanced UI)
  if (notification.type === 'chat') {
    return (
      <div 
        onClick={handleClick}
        className="fixed top-4 right-4 w-[400px] bg-white rounded-2xl shadow-2xl z-[10000] animate-slide-in cursor-pointer hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] border border-gray-100 overflow-hidden"
        style={{
          animation: 'slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100" style={{ width: `${progress}%` }}></div>
        
        <div className="p-5">
          {/* Header with avatar */}
          <div className="flex items-start gap-4">
            {/* Driver Avatar */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {notification.driverName?.charAt(0) || 'D'}
              </div>
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white absolute ml-8 -mt-3"></div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Driver Name & Trip */}
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-gray-900 text-base">
                  {notification.driverName || 'Driver'}
                </h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  <FaTruck className="w-3 h-3" />
                  {notification.tripNumber}
                </span>
              </div>

              {/* Message */}
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-2 mb-3">
                {notification.message}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold">
                  <MessageCircle className="w-4 h-4" />
                  <span>Click to reply</span>
                </div>
                <div className="flex-1"></div>
                <span className="text-gray-400 text-xs">Just now</span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(notification.id);
              }}
              className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Hover effect gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
      </div>
    );
  }

  // Standard notifications (Success, Error, Warning)
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    warning: <FaExclamationCircle className="text-yellow-500" size={24} />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  const progressColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div className={`fixed top-4 right-4 w-[350px] rounded-xl border-2 shadow-xl z-[10000] ${bgColors[notification.type]} animate-slide-in overflow-hidden`}>
      {/* Progress bar */}
      <div className={`h-1 ${progressColors[notification.type]} transition-all duration-100`} style={{ width: `${progress}%` }}></div>
      
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">
          {icons[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{notification.message}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(notification.id);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
};

const Trips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; trip: Trip | null }>({ show: false, trip: null });
  const [startConfirm, setStartConfirm] = useState<{ show: boolean; trip: Trip | null }>({ show: false, trip: null });
  const [completeConfirm, setCompleteConfirm] = useState<{ show: boolean; trip: Trip | null }>({ show: false, trip: null });
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const pendingOpenChatTripIdRef = useRef<string | null>(null);

  // Real-time unread count updates from global socket notifications
  useEffect(() => {
    const onChatNewMessage = async (event: Event) => {
      const detail = (event as CustomEvent<{ tripId?: string }>).detail;
      const tripId = detail?.tripId;
      if (!tripId) return;

      try {
        const response = await getUnreadMessageCount(tripId);
        if (response?.success && response?.data) {
          setUnreadCounts(prev => ({ ...prev, [tripId]: response.data.unreadCount }));
        }
      } catch (error) {
        // keep quiet to avoid noisy console; the next fetchTrips will resync
      }
    };

    window.addEventListener('chat:newMessage', onChatNewMessage as EventListener);
    return () => {
      window.removeEventListener('chat:newMessage', onChatNewMessage as EventListener);
    };
  }, []);

  // Refs for scrollbar synchronization
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  const focusHandlers = getFocusStyles();
  const primaryButtonStyle: React.CSSProperties = {
    background: `linear-gradient(
      90deg,
      #42aeec 0%,
      #1db5f5 40%,
      #0ea3d8 100%
    )`,
    color: "#fff",
    boxShadow: `0 12px 24px ${FLEET_COLORS.focusRing}`,
  };

  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [driverFilter, setDriverFilter] = useState<string>("");
  const [truckFilter, setTruckFilter] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters data
  const [drivers, setDrivers] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);

  const addNotification = useCallback((
    type: NotificationType, 
    message: string, 
    extra?: { tripId?: string; tripNumber?: string; driverName?: string }
  ) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message, ...extra }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleChatNotificationClick = useCallback((tripId: string) => {
    // Find the trip
    const trip = trips.find(t => t._id === tripId);
    if (trip) {
      setViewingTrip(trip);
      setShowChat(true);
      // Clear unread count for this trip when opening chat
      setUnreadCounts(prev => ({
        ...prev,
        [tripId]: 0
      }));
    }
  }, [trips]);

  // When navigated here with state { openTripChat: tripId }, open the chat automatically
  useEffect(() => {
    const state = location.state as any;
    if (state?.openTripChat) {
      pendingOpenChatTripIdRef.current = state.openTripChat as string;
    }
  }, [location.state]);

  useEffect(() => {
    const tripId = pendingOpenChatTripIdRef.current;
    if (!tripId) return;

    const tripExists = trips.some(t => t._id === tripId);
    if (!tripExists) return; // wait until trips load

    handleChatNotificationClick(tripId);
    pendingOpenChatTripIdRef.current = null;

    // Clear state so it doesn't re-trigger
    navigate(location.pathname, { replace: true, state: {} });
  }, [trips, handleChatNotificationClick, navigate, location.pathname]);

  // Clear unread count when chat is opened
  useEffect(() => {
    if (showChat && viewingTrip) {
      setUnreadCounts(prev => ({
        ...prev,
        [viewingTrip._id]: 0
      }));
    }
  }, [showChat, viewingTrip]);

  // Reset to page 1 when filters or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, driverFilter, truckFilter, searchTerm, itemsPerPage]);

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, statusFilter, driverFilter, truckFilter, searchTerm]);

  useEffect(() => {
    fetchFiltersData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Note: Socket notifications are now handled globally by GlobalChatNotifications component
  // This page only manages unread counts locally

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
  }, [trips, loading]);

  const fetchFiltersData = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        listDriver(),
        listVehicle()
      ]);

      if (driversRes?.success && driversRes?.data) {
        setDrivers(Array.isArray(driversRes.data) ? driversRes.data : []);
      }

      if (vehiclesRes?.success && vehiclesRes?.data) {
        const vehicleData = vehiclesRes.data?.vehicles || vehiclesRes.data || [];
        setTrucks(Array.isArray(vehicleData) ? vehicleData : []);
      }
    } catch (error) {
      console.error("Error fetching filters data:", error);
    }
  };

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (statusFilter) params.status = statusFilter;
      if (driverFilter) params.driver = driverFilter;
      if (truckFilter) params.truck = truckFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await listTrip(params);

      if (response?.success) {
        setTrips(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.totalItems || 0);
        
        // Fetch unread message counts for all trips
        fetchUnreadCounts(response.data || []);
      } else {
        addNotification('error', response?.message || 'Failed to fetch trips');
      }
    } catch (error: any) {
      console.error("Error fetching trips:", error);
      addNotification('error', error?.message || 'An error occurred while fetching trips');
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread message counts for all trips
  const fetchUnreadCounts = async (tripsList: Trip[]) => {
    try {
      const counts: Record<string, number> = {};
      
      // Fetch unread counts for each trip in parallel
      await Promise.all(
        tripsList.map(async (trip) => {
          try {
            const response = await getUnreadMessageCount(trip._id);
            if (response.success && response.data) {
              counts[trip._id] = response.data.unreadCount;
            }
          } catch (error) {
            console.error(`Error fetching unread count for trip ${trip._id}:`, error);
            counts[trip._id] = 0;
          }
        })
      );
      
      setUnreadCounts(counts);
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  const handleAddTrip = () => {
    setEditingTrip(null);
    setSidebarOpen(true);
  };

  const handleEditTrip = async (trip: Trip) => {
    try {
      const response = await getTripById(trip._id);
      if (response?.success) {
        setEditingTrip(response.data);
        setSidebarOpen(true);
      } else {
        addNotification('error', response?.message || 'Failed to fetch trip details');
      }
    } catch (error: any) {
      addNotification('error', error?.message || 'An error occurred while fetching trip details');
    }
  };

  const handleDeleteTrip = async (trip: Trip) => {
    setDeleteConfirm({ show: true, trip });
  };

  const confirmDeleteTrip = async () => {
    if (!deleteConfirm.trip) return;

    try {
      const response = await deleteTrip(deleteConfirm.trip._id);
      if (response?.success) {
        addNotification('success', 'Trip deleted successfully');
        fetchTrips();
      } else {
        addNotification('error', response?.message || 'Failed to delete trip');
      }
    } catch (error: any) {
      addNotification('error', error?.message || 'An error occurred while deleting trip');
    } finally {
      setDeleteConfirm({ show: false, trip: null });
    }
  };

  const handleViewTrip = async (trip: Trip) => {
    try {
      const response = await getTripById(trip._id);
      if (response?.success) {
        setViewingTrip(response.data);
      } else {
        addNotification('error', response?.message || 'Failed to fetch trip details');
      }
    } catch (error: any) {
      addNotification('error', error?.message || 'An error occurred while fetching trip details');
    }
  };

  const handleSaveTrip = () => {
    setSidebarOpen(false);
    setEditingTrip(null);
    fetchTrips();
  };

  const handleStartTrip = async (trip: Trip) => {
    setStartConfirm({ show: true, trip });
  };

  const confirmStartTrip = async () => {
    if (!startConfirm.trip) return;

    try {
      const response = await startTripAPI(startConfirm.trip._id);
      if (response?.success) {
        addNotification('success', 'Trip started successfully. Order statuses updated to in-delivery.');
        fetchTrips();
      } else {
        addNotification('error', response?.message || 'Failed to start trip');
      }
    } catch (error: any) {
      addNotification('error', error?.message || 'An error occurred while starting trip');
    } finally {
      setStartConfirm({ show: false, trip: null });
    }
  };

  const handleCompleteTrip = async (trip: Trip) => {
    setCompleteConfirm({ show: true, trip });
  };

  const confirmCompleteTrip = async () => {
    if (!completeConfirm.trip) return;

    try {
      const response = await completeTripAPI(completeConfirm.trip._id);
      if (response?.success) {
        addNotification('success', 'Trip completed successfully. Order statuses updated to completed.');
        fetchTrips();
      } else {
        addNotification('error', response?.message || 'Failed to complete trip');
      }
    } catch (error: any) {
      addNotification('error', error?.message || 'An error occurred while completing trip');
    } finally {
      setCompleteConfirm({ show: false, trip: null });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'planned': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-4 bg-[#EDF8FF] min-h-screen">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trip Management</h1>
          <p className="text-gray-600 mt-1">Plan trips by assigning truck, driver, and trailer with orders/loads</p>
        </div>
        <button
          onClick={handleAddTrip}
          style={primaryButtonStyle}
          className="flex items-center gap-2 px-4 py-2 !text-white rounded-lg transition-all hover:opacity-90 hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          New Trip
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by trip number..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-sm"
              onFocus={focusHandlers.onFocus}
              onBlur={focusHandlers.onBlur}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-sm"
            onFocus={focusHandlers.onFocus}
            onBlur={focusHandlers.onBlur}
          >
            <option value="">All Status</option>
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={driverFilter}
            onChange={(e) => {
              setDriverFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-sm"
            onFocus={focusHandlers.onFocus}
            onBlur={focusHandlers.onBlur}
          >
            <option value="">All Drivers</option>
            {drivers.map((driver) => (
              <option key={driver._id} value={driver._id}>
                {driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver._id}
              </option>
            ))}
          </select>

          <select
            value={truckFilter}
            onChange={(e) => {
              setTruckFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 text-sm"
            onFocus={focusHandlers.onFocus}
            onBlur={focusHandlers.onBlur}
          >
            <option value="">All Trucks</option>
            {trucks.map((truck) => (
              <option key={truck._id} value={truck._id}>
                {truck.plateNumber || truck.internalId || truck._id}
              </option>
            ))}
          </select>

          {(statusFilter || driverFilter || truckFilter || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setDriverFilter("");
                setTruckFilter("");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Trips Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: FLEET_COLORS.primary }}></div>
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaTruck className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No trips found. Click "New Trip" to create your first trip.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                height: '20px',
                marginBottom: '2px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e0 #f7fafc', /* Firefox */
                width: '100%',
                display: 'block'
              }}
            >
              <div className="top-scroll-content" style={{ height: '1px', minWidth: '100%' }}></div>
            </div>
            {/* Main Table - Scrollbar hidden, controlled by top scrollbar */}
            <div 
              ref={bottomScrollRef}
              className="overflow-x-auto table-container-hidden-scrollbar"
            >
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trip #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Truck</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trailer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Orders</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Start Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Chat</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trips.map((trip) => (
                    <tr key={trip._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleViewTrip(trip)}
                          className="font-medium hover:underline"
                          style={{ color: FLEET_COLORS.primary }}
                          title="View Trip Details"
                        >
                          {trip.tripNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-start gap-2">
                          <FaUser className="text-gray-400 mt-0.5" size={14} />
                          <div className="leading-tight">
                            <div>{trip.driver?.name || '-'}</div>
                            {trip.coDriver?.name && (
                              <div className="text-xs text-gray-500">Co-driver: {trip.coDriver.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FaTruck className="text-gray-400" size={14} />
                          <span>{trip.truck?.licensePlate || trip.truck?.unitNo || trip.truck?.internalId || trip.truck?.makeModel || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {trip.trailer ? (
                          <div className="flex items-center gap-2">
                            <FaTrailer className="text-gray-400" size={14} />
                            <span>{trip.trailer?.licensePlate || trip.trailer?.unitNo || trip.trailer?.makeModel || '-'}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: `${FLEET_COLORS.primary}15`, color: FLEET_COLORS.dark }}>
                          {trip.orders?.length || 0} Order(s)
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {formatDate(trip.plannedStartDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(trip.status)}`}>
                          {trip.status.charAt(0).toUpperCase() + trip.status.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => {
                              setViewingTrip(trip);
                              setShowChat(true);
                            }}
                            className="relative p-2 rounded-lg transition-colors hover:bg-blue-50"
                            title="Open Chat"
                          >
                            <MessageCircle 
                              className="w-5 h-5" 
                              style={{ color: unreadCounts[trip._id] > 0 ? FLEET_COLORS.primary : '#9CA3AF' }}
                            />
                            {unreadCounts[trip._id] > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                {unreadCounts[trip._id] > 99 ? '99+' : unreadCounts[trip._id]}
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {trip.status === 'planned' && (
                            <button
                              onClick={() => handleStartTrip(trip)}
                              className="px-3 py-1.5 text-xs font-medium !text-white rounded transition-all hover:opacity-90 hover:shadow-md"
                              style={{ background: FLEET_COLORS.gradient }}
                              title="Start Trip"
                            >
                              Start
                            </button>
                          )}
                          {trip.status === 'in-progress' && (
                            <button
                              onClick={() => handleCompleteTrip(trip)}
                              style={primaryButtonStyle}
                              className="px-3 py-1.5 text-xs font-medium !text-white rounded transition-all hover:opacity-90 hover:shadow-md"
                              title="Complete Trip"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleViewTrip(trip)}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: FLEET_COLORS.primary }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}15`}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {trip.status !== 'completed' && (
                            <>
                              <button
                                onClick={() => handleEditTrip(trip)}
                                className="p-1.5 rounded transition-colors"
                                style={{ color: FLEET_COLORS.primary }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}15`}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTrip(trip)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <div className="mt-4 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} trips
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 !text-white rounded text-sm" style={primaryButtonStyle}>{currentPage}</span>
                <span className="text-sm text-gray-600">of</span>
                <span className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700">{totalPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm ml-2"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Trip Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[9998] bg-gray-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
      <div
        className={`fixed top-0 right-0 h-full max-w-4xl w-full bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 ${sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <NewTripSidebar
          trip={editingTrip}
          onClose={() => {
            setSidebarOpen(false);
            setEditingTrip(null);
          }}
          onSave={handleSaveTrip}
        />
      </div>

      {/* View Trip Modal */}
      {viewingTrip && (
        <div className="fixed inset-0 z-[10001] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-white rounded-xl shadow-2xl ${showChat ? 'w-full max-w-5xl' : 'w-full max-w-3xl'} max-h-[90vh] h-[90vh] overflow-hidden flex flex-col`}>
            <div className="flex-shrink-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-800">Trip Details: {viewingTrip.tripNumber}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  title="Open Chat"
                >
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">Chat</span>
                </button>
                <button
                  onClick={() => {
                    setViewingTrip(null);
                    setShowChat(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            {showChat ? (
              <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                <TripChat
                  tripId={viewingTrip._id}
                  tripNumber={viewingTrip.tripNumber}
                  onClose={() => setShowChat(false)}
                />
              </div>
            ) : (
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Trip Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Driver</label>
                  <p className="text-lg font-semibold">{viewingTrip.driver?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Co-driver</label>
                  <p className="text-lg font-semibold">{viewingTrip.coDriver?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Truck</label>
                  <p className="text-lg font-semibold">{viewingTrip.truck?.licensePlate || viewingTrip.truck?.unitNo || viewingTrip.truck?.internalId || viewingTrip.truck?.makeModel || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Trailer</label>
                  <p className="text-lg font-semibold">{viewingTrip.trailer?.licensePlate || viewingTrip.trailer?.unitNo || viewingTrip.trailer?.makeModel || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className={`text-lg font-semibold inline-block px-3 py-1 rounded-full ${getStatusBadge(viewingTrip.status)}`}>
                    {viewingTrip.status.charAt(0).toUpperCase() + viewingTrip.status.slice(1).replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Planned Start</label>
                  <p className="text-lg font-semibold">{formatDate(viewingTrip.plannedStartDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Planned End</label>
                  <p className="text-lg font-semibold">{formatDate(viewingTrip.plannedEndDate)}</p>
                </div>
              </div>

              {/* Orders */}
              {viewingTrip.orders && viewingTrip.orders.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Orders ({viewingTrip.orders.length})</h4>
                  <div className="space-y-3">
                    {viewingTrip.orders.map((order) => {
                      const extractLocationString = (location: any): string => {
                        if (!location) return 'N/A';
                        if (typeof location === 'string') return location;
                        if (location.place) return location.place;
                        if (location.placeId?.name) return location.placeId.name;
                        if (location.placeId?.currentLocation?.address) return location.placeId.currentLocation.address;
                        return 'N/A';
                      };
                      const customerName = order.customer?.name || order.customer?.firstName || 'N/A';
                      const pickupLocation = extractLocationString(order.pickupLocation);
                      const deliveryLocation = extractLocationString(order.deliveryLocation);
                      return (
                        <div key={order._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-semibold" style={{ color: FLEET_COLORS.primary }}>{order.orderNumber}</div>
                            {order.status && (
                              <span
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={
                                  order.status === 'planned' ? { backgroundColor: '#fef3c7', color: '#92400e' } :
                                    order.status === 'dispatched' ? { backgroundColor: `${FLEET_COLORS.light}20`, color: FLEET_COLORS.dark } :
                                      order.status === 'in-delivery' ? { backgroundColor: '#fed7aa', color: '#9a3412' } :
                                        order.status === 'completed' ? { backgroundColor: '#d1fae5', color: '#065f46' } :
                                          { backgroundColor: '#f3f4f6', color: '#1f2937' }
                                }
                              >
                                {order.status}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 space-y-1 mt-2">
                            {order.customerOrderNo && (
                              <div><span className="font-medium">Customer Order:</span> {order.customerOrderNo}</div>
                            )}
                            <div><span className="font-medium">Customer:</span> {customerName}</div>
                            <div><span className="font-medium">Pickup:</span> {pickupLocation}</div>
                            <div><span className="font-medium">Delivery:</span> {deliveryLocation}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* Notes */}
              {viewingTrip.notes && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Notes</h4>
                  <p className="text-gray-700">{viewingTrip.notes}</p>
                </div>
              )}

              {/* Documents */}
              {viewingTrip.documents && viewingTrip.documents.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Documents ({viewingTrip.documents.length})</h4>
                  <div className="space-y-3">
                    {viewingTrip.documents.map((doc) => {
                      const formatFileSize = (bytes?: number) => {
                        if (!bytes) return 'Unknown size';
                        if (bytes < 1024) return bytes + ' B';
                        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
                        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
                      };
                      return (
                        <div
                          key={doc._id || doc.fileUrl}
                          className="flex items-start justify-between gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <File className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: FLEET_COLORS.primary }} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {doc.fileName}
                              </div>
                              {doc.description && (
                                <div className="text-xs text-gray-600 mt-1">{doc.description}</div>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>{formatFileSize(doc.fileSize)}</span>
                                {doc.uploadedAt && (
                                  <span>
                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </span>
                                )}
                                {doc.uploadedBy?.name && (
                                  <span>Uploaded by {doc.uploadedBy.name}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={async () => {
                                if (!viewingTrip?._id || !doc._id) return;
                                try {
                                  const response = await getTripDocumentSignedUrl(viewingTrip._id, doc._id, 'inline');
                                  if (response?.success && response?.url) {
                                    window.open(response.url, '_blank');
                                  } else {
                                    // Fallback to original URL
                                    window.open(doc.fileUrl, '_blank');
                                  }
                                } catch (error) {
                                  console.error('Error getting signed URL:', error);
                                  // Fallback to original URL
                                  window.open(doc.fileUrl, '_blank');
                                }
                              }}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: FLEET_COLORS.primary }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}15`}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              title="View/Download Document"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>
            )}
            {!showChat && (
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end border-t rounded-b-xl">
                <button
                  onClick={() => {
                    setViewingTrip(null);
                    setShowChat(false);
                  }}
                  className="px-6 py-2 !text-white rounded-lg font-medium transition-all hover:opacity-90 hover:shadow-md"
                  style={{ background: FLEET_COLORS.gradient }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
        {notifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
            onChatClick={handleChatNotificationClick}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, trip: null })}
        onConfirm={confirmDeleteTrip}
        title="Delete Trip"
        message={deleteConfirm.trip ? `Are you sure you want to delete trip ${deleteConfirm.trip.tripNumber}? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Start Trip Confirmation Modal */}
      <ConfirmationModal
        isOpen={startConfirm.show}
        onClose={() => setStartConfirm({ show: false, trip: null })}
        onConfirm={confirmStartTrip}
        title="Start Trip"
        message={startConfirm.trip ? `Are you sure you want to start trip ${startConfirm.trip.tripNumber}? This will change all order statuses to 'in-delivery'.` : ''}
        confirmText="Start Trip"
        cancelText="Cancel"
        type="warning"
      />

      {/* Complete Trip Confirmation Modal */}
      <ConfirmationModal
        isOpen={completeConfirm.show}
        onClose={() => setCompleteConfirm({ show: false, trip: null })}
        onConfirm={confirmCompleteTrip}
        title="Complete Trip"
        message={completeConfirm.trip ? `Are you sure you want to complete trip ${completeConfirm.trip.tripNumber}? This will change all order statuses to 'completed'.` : ''}
        confirmText="Complete Trip"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
};

export default Trips;
