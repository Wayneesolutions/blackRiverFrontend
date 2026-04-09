import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Edit, Trash2, Eye, Search, X, File, Download, MessageCircle } from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaTruck, FaUser, FaTrailer } from "react-icons/fa";
import NewTripSidebar from "./NewTripSidebar";
import { listTrip, deleteTrip, getTripById, startTrip as startTripAPI, completeTrip as completeTripAPI, approveTripCompletion, approveTripDocuments, listDriver, listVehicle, getTripDocumentSignedUrl, updateTrip } from "../../../../../axios/api/distapcher";
import ConfirmationModal from "../../../../../components/common/ConfirmationModal";
import { FLEET_COLORS, getFocusStyles } from "../../../fleetMaintenance/colorUtils";
import { getUnreadMessageCount } from "../../../../../axios/api/chat";
import { useLocation, useNavigate } from "react-router-dom";
import { socketService } from "../../../../../services/socketService";

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
  status: 'planned' | 'in-progress' | 'pending_completion' | 'completed' | 'cancelled';
  driverAcceptanceStatus?: 'pending' | 'accepted' | 'rejected';
  driverRejectionReason?: string;
  driverRespondedAt?: string;
  completionStatus?: 'pending' | 'approved' | 'rejected';
  completionApprovedBy?: {
    _id: string;
    name: string;
    email?: string;
  };
  completionApprovedAt?: string;
  completionRejectionReason?: string;
  documentsApproved?: boolean;
  documentsApprovedBy?: {
    _id: string;
    name: string;
    email?: string;
  };
  documentsApprovedAt?: string;
  approvedWithoutDocuments?: boolean;
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
    type?: string;
    uploadedBy?: any;
    uploadedAt?: string;
    description?: string;
  }>;
}

type NotificationType = 'success' | 'error' | 'warning' | 'chat' | 'document_upload';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
  tripId?: string;
  tripNumber?: string;
  driverName?: string;
  orderId?: string;
  orderNumber?: string;
}

const ToastNotification = ({ notification, onClose, onChatClick }: {
  notification: ToastNotification;
  onClose: (id: number) => void;
  onChatClick?: (tripId: string, tripNumber: string) => void;
}) => {
  const [progress, setProgress] = useState(100);
  const navigate = useNavigate();
  const duration = notification.type === 'chat' ? 8000 : notification.type === 'document_upload' ? 8000 : 5000;

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
    } else if (notification.type === 'document_upload' && notification.orderId) {
      // Navigate to the order in trips page (only when clicked, not automatically)
      // Check current path to determine if admin or dispatcher
      const currentPath = location.pathname;
      const isAdmin = currentPath.includes('/admin/');
      const basePath = isAdmin ? '/admin/dispatch/trips' : '/dispatch/trips';
      navigate(`${basePath}?orderId=${notification.orderId}`);
      onClose(notification.id);
    }
  };

  // Chat notification (Advanced UI)
  if (notification.type === 'chat') {
    return (
      <div
        onClick={handleClick}
        className="fixed top-4 right-4 w-[400px] bg-card rounded-2xl shadow-2xl z-[10000] animate-slide-in cursor-pointer hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] border border-theme overflow-hidden"
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
                <h4 className="font-bold text-primary text-base">
                  {notification.driverName || 'Driver'}
                </h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  <FaTruck className="w-3 h-3" />
                  {notification.tripNumber}
                </span>
              </div>

              {/* Message */}
              <p className="text-primary text-sm leading-relaxed line-clamp-2 mb-3">
                {notification.message}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[#00D1FF] text-xs font-semibold">
                  <MessageCircle className="w-4 h-4" />
                  <span>Click to reply</span>
                </div>
                <div className="flex-1"></div>
                <span className="text-secondary text-xs">Just now</span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(notification.id);
              }}
              className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-secondary hover:text-secondary transition-all"
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

  // Document Upload notification (Advanced UI)
  if (notification.type === 'document_upload') {
    return (
      <div
        onClick={handleClick}
        className="fixed top-4 right-4 w-[400px] bg-card rounded-2xl shadow-2xl z-[10000] animate-slide-in cursor-pointer hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] border border-theme overflow-hidden"
      >
        <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-100" style={{ width: `${progress}%` }}></div>
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                <File className="w-6 h-6" />
              </div>
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white absolute ml-8 -mt-3 animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-primary text-base">
                  📄 Documents Uploaded
                </h4>
              </div>
              <p className="text-primary text-sm leading-relaxed mb-2">
                <strong>{notification.driverName || 'Driver'}</strong> has uploaded POD and Manifest documents
              </p>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  <FaTruck className="w-3 h-3" />
                  Order #{notification.orderNumber}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                  <File className="w-4 h-4" />
                  <span>Click to view documents</span>
                </div>
                <div className="flex-1"></div>
                <span className="text-secondary text-xs">Just now</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(notification.id);
              }}
              className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-secondary hover:text-secondary transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard notifications (Success, Error, Warning)
  // Note: document_upload is handled above with early return, but included here for TypeScript
  const icons: Record<NotificationType, React.ReactNode> = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    warning: <FaExclamationCircle className="text-yellow-500" size={24} />,
    document_upload: <File className="text-green-500" size={24} />, // Not used, but needed for type safety
    chat: <MessageCircle className="text-blue-500" size={24} />, // Not used, but needed for type safety
  };

  const bgColors: Record<NotificationType, string> = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-card border-red-200',
    warning: 'bg-card border-yellow-200',
    document_upload: 'bg-green-50 border-green-200', // Not used, but needed for type safety
    chat: 'bg-card border-blue-200', // Not used, but needed for type safety
  };

  const progressColors: Record<NotificationType, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    document_upload: 'bg-green-500', // Not used, but needed for type safety
    chat: 'bg-blue-500', // Not used, but needed for type safety
  };

  // Type guard: at this point, notification.type can only be 'success' | 'error' | 'warning'
  const standardType = notification.type as 'success' | 'error' | 'warning';

  return (
    <div className={`fixed top-4 right-4 w-[350px] rounded-xl border-2 shadow-xl z-[10000] ${bgColors[standardType]} animate-slide-in overflow-hidden`}>
      {/* Progress bar */}
      <div className={`h-1 ${progressColors[standardType]} transition-all duration-100`} style={{ width: `${progress}%` }}></div>

      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">
          {icons[standardType]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary">{notification.message}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(notification.id);
          }}
          className="flex-shrink-0 text-secondary hover:text-secondary transition-colors"
        >
          <FaTimes size={16} />
        </button>
      </div>
    </div>
  );
};

const Trips = () => {
  // Log component render
  useEffect(() => {
    console.log('🚀 Trips component mounted/rendered');
  }, []);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [, setIsOrderChat] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; trip: Trip | null }>({ show: false, trip: null });
  const [startConfirm, setStartConfirm] = useState<{ show: boolean; trip: Trip | null }>({ show: false, trip: null });
  const [completeConfirm, setCompleteConfirm] = useState<{ show: boolean; trip: Trip | null }>({ show: false, trip: null });
  const [, setUnreadCounts] = useState<Record<string, number>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const pendingOpenChatTripIdRef = useRef<string | null>(null);
  const handleChatNotificationClickRef = useRef<((tripId: string) => Promise<void>) | null>(null);

  // Initialize global store immediately (runs on every render before handler is defined)
  if (!(window as any).__tripsChatHandlers) {
    (window as any).__tripsChatHandlers = {};
    console.log('🌐 Global chat handler store initialized');
  }

  // Set up global function IMMEDIATELY (before event listeners)
  useEffect(() => {
    console.log('🌐 Setting up global openTripChat function');

    // Expose global function for opening chat from external navigation
    (window as any).openTripChat = async (tripId: string) => {
      console.log('🌐 Global openTripChat called with:', tripId);

      // Try to get handler from ref first
      let handler = handleChatNotificationClickRef.current;

      // If not available, try to get from global store
      if (!handler && (window as any).__tripsChatHandlers) {
        handler = (window as any).__tripsChatHandlers.openChat;
      }

      if (handler) {
        try {
          console.log('✅ Handler available, calling it directly');
          await handler(tripId);
          console.log('✅ Chat opened successfully via global function');
        } catch (error) {
          console.error('❌ Error calling handler:', error);
        }
      } else {
        console.warn('⚠️ Handler not available, will retry...');
        // Wait and retry
        setTimeout(async () => {
          let retryHandler = handleChatNotificationClickRef.current;
          if (!retryHandler && (window as any).__tripsChatHandlers) {
            retryHandler = (window as any).__tripsChatHandlers.openChat;
          }
          if (retryHandler) {
            console.log('🔄 Retry: Handler now available');
            try {
              await retryHandler(tripId);
              console.log('✅ Chat opened via retry');
            } catch (error) {
              console.error('❌ Error in retry:', error);
            }
          } else {
            console.error('❌ Handler still not available after retry');
          }
        }, 300);
      }
    };

    console.log('🌐 Global function registered:', typeof (window as any).openTripChat);
  }, []); // Empty deps - function uses ref which is always current

  // This is now handled above - removed duplicate

  // Real-time unread count updates from global socket notifications
  useEffect(() => {
    console.log('🔧 Setting up event listeners...');

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

    // Listen for direct chat opening from notifications (when already on trips page)
    const onOpenChatFromNotification = async (event: Event) => {
      console.log('🎯 openChatFromNotification event received!');
      const detail = (event as CustomEvent<{ tripId?: string; orderId?: string }>).detail;
      console.log('🎯 Event detail:', detail);

      const chatId = detail?.orderId || detail?.tripId;
      if (!chatId) {
        console.warn('⚠️ No chatId in event detail');
        return;
      }

      console.log('🔔 Opening chat for:', chatId);

      // Get handler from ref (always current)
      let handler = handleChatNotificationClickRef.current;
      console.log('🔔 Handler from ref:', !!handler);

      // If handler not ready, wait and retry
      if (!handler) {
        console.log('⏳ Handler not ready, waiting 300ms...');
        await new Promise(resolve => setTimeout(resolve, 300));
        handler = handleChatNotificationClickRef.current;
        console.log('🔔 Handler after wait:', !!handler);
      }

      // Also try global store as fallback
      if (!handler && (window as any).__tripsChatHandlers?.openChat) {
        handler = (window as any).__tripsChatHandlers.openChat;
        console.log('🔔 Using handler from global store');
      }

      if (handler) {
        try {
          console.log('✅ Calling handler to set state directly (no navigation)');
          await handler(chatId);
          console.log('✅ Handler called - viewingTrip and showChat set, chatbox should be visible');
        } catch (error) {
          console.error('❌ Error opening chat:', error);
        }
      } else {
        console.error('❌ Handler not available after all attempts');
        console.error('❌ Ref:', !!handleChatNotificationClickRef.current);
        console.error('❌ Global store:', !!(window as any).__tripsChatHandlers?.openChat);
      }
    };

    // Use capture phase to ensure we catch the event
    // Listen on both window and document
    window.addEventListener('chat:newMessage', onChatNewMessage as EventListener, true);
    window.addEventListener('openChatFromNotification', onOpenChatFromNotification as EventListener, true);
    document.addEventListener('openChatFromNotification', onOpenChatFromNotification as EventListener, true);

    // Also listen without capture phase (bubbling)
    window.addEventListener('openChatFromNotification', onOpenChatFromNotification as EventListener, false);
    document.addEventListener('openChatFromNotification', onOpenChatFromNotification as EventListener, false);

    console.log('👂 Event listeners set up for chat notifications');
    console.log('👂 Listening for: chat:newMessage, openChatFromNotification');
    console.log('👂 Listening on both window and document, with and without capture');

    return () => {
      console.log('🧹 Cleaning up event listeners');
      window.removeEventListener('chat:newMessage', onChatNewMessage as EventListener, true);
      window.removeEventListener('openChatFromNotification', onOpenChatFromNotification as EventListener, true);
      document.removeEventListener('openChatFromNotification', onOpenChatFromNotification as EventListener, true);
      window.removeEventListener('openChatFromNotification', onOpenChatFromNotification as EventListener, false);
      document.removeEventListener('openChatFromNotification', onOpenChatFromNotification as EventListener, false);
      // Don't delete global function - keep it available
    };
  }, []); // Empty deps - we use ref for handler

  const addNotification = useCallback((
    type: NotificationType,
    message: string,
    extra?: { tripId?: string; tripNumber?: string; driverName?: string; orderId?: string; orderNumber?: string }
  ) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message, ...extra }]);
  }, []);

  // Real-time driver acceptance updates via socket
  useEffect(() => {
    const handleTripAcceptanceUpdated = (data: {
      tripId: string;
      tripNumber?: string;
      driverAcceptanceStatus: 'accepted' | 'rejected';
      driverRejectionReason?: string;
      driverRespondedAt?: string;
    }) => {
      if (!data?.tripId) return;

      // Update the trip row in state
      setTrips(prev => prev.map(t =>
        t._id === data.tripId
          ? {
            ...t,
            driverAcceptanceStatus: data.driverAcceptanceStatus,
            driverRejectionReason: data.driverRejectionReason,
            driverRespondedAt: data.driverRespondedAt
          }
          : t
      ));

      // Show a notification banner to the dispatcher
      const tripLabel = data.tripNumber ? `Trip ${data.tripNumber}` : 'A trip';
      if (data.driverAcceptanceStatus === 'accepted') {
        addNotification('success', `${tripLabel}: Driver accepted the assignment.`);
      } else if (data.driverAcceptanceStatus === 'rejected') {
        const reasonPart = data.driverRejectionReason ? ` Reason: "${data.driverRejectionReason}".` : '';
        addNotification('warning', `${tripLabel}: Driver rejected the assignment.${reasonPart} Please assign another driver.`);
      }
    };

    socketService.onTripAcceptanceUpdated(handleTripAcceptanceUpdated);
    return () => socketService.offTripAcceptanceUpdated();
  }, [addNotification]);

  // Refs for scrollbar synchronization
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  const focusHandlers = getFocusStyles();
  const primaryButtonStyle: React.CSSProperties = {
    background: `linear-gradient(
      90deg,
      var(--accent-blue) 0%,
      var(--accent-blue) 40%,
      rgba(0,209,255,0.15) 100%
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

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleChatNotificationClick = useCallback(async (tripId: string) => {
    console.log('🔍 handleChatNotificationClick called with tripId:', tripId);
    console.log('🔍 Current trips count:', trips.length);

    // First, try to find in trips
    let trip = trips.find(t => t._id === tripId);
    let isOrder = false;

    console.log('🔍 Found in trips?', !!trip);

    // If not found, it might be an order - try to fetch it
    if (!trip) {
      console.log('🔍 Trip not found, checking orders...');
      try {
        const { listOrder } = await import("../../../../../axios/api/distapcher");
        const orderResponse = await listOrder({ page: 1, limit: 1000 });
        console.log('🔍 Order response:', orderResponse?.success, orderResponse?.data?.length);

        if (orderResponse?.success && orderResponse?.data) {
          const order = orderResponse.data.find((o: any) => o._id === tripId);
          console.log('🔍 Found order?', !!order, order?._id);

          if (order) {
            isOrder = true;
            // Convert order to trip format for compatibility
            trip = {
              _id: order._id,
              tripNumber: order.orderNumber || order._id,
              orderNumber: order.orderNumber, // Add orderNumber for OrderChat
              driver: order.driver,
              coDriver: order.coDriver,
              truck: order.truck,
              trailer: order.trailer,
              status: order.status === 'ACTIVE' ? 'in-progress' :
                order.status === 'COMPLETED' ? 'completed' :
                  order.status === 'CANCELLED' ? 'cancelled' : 'planned',
              orders: [order],
            } as Trip & { orderNumber?: string };
            console.log('✅ Converted order to trip format:', trip._id, trip.tripNumber);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching order for chat:', error);
      }
    } else {
      // Check if it's an order by looking for orderNumber property
      isOrder = !!(trip as any).orderNumber;
    }

    if (trip) {
      console.log('✅ Setting viewingTrip and opening chat');
      console.log('✅ Trip data:', { _id: trip._id, tripNumber: trip.tripNumber, isOrder });

      // Set all states together - React will batch them
      setViewingTrip(trip);
      setIsOrderChat(isOrder);
      setShowChat(true);

      console.log('✅ All states set - viewingTrip:', trip._id, 'showChat: true', 'isOrderChat:', isOrder);

      // Clear unread count for this trip/order when opening chat
      setUnreadCounts(prev => ({
        ...prev,
        [tripId]: 0
      }));
    } else {
      console.warn('❌ Trip/Order not found for chat:', tripId);
    }
  }, [trips]);

  // Store handler in ref IMMEDIATELY (not in useEffect) so it's always current
  // This runs on every render, ensuring the ref is always up-to-date
  handleChatNotificationClickRef.current = handleChatNotificationClick;

  // Also update global store whenever handler changes
  useEffect(() => {
    if ((window as any).__tripsChatHandlers) {
      (window as any).__tripsChatHandlers.openChat = handleChatNotificationClick;
      console.log('📝 Global store updated with handler');
    }
  }, [handleChatNotificationClick]);

  // When navigated here with state { openTripChat: tripId } or query param, open the chat automatically
  useEffect(() => {
    const state = location.state as any;
    const searchParams = new URLSearchParams(location.search);
    const chatIdFromQuery = searchParams.get('openChat');
    const orderIdFromQuery = searchParams.get('orderId'); // Check for orderId query parameter

    console.log('📍 Location changed - state:', state, 'query:', location.search);

    // Check orderId query parameter first (for chat notifications)
    if (orderIdFromQuery) {
      console.log('📍 Found orderId in query param:', orderIdFromQuery);
      // Open chat immediately
      const handler = handleChatNotificationClickRef.current;
      if (handler) {
        console.log('📍 Handler available, opening chat directly from orderId query param');
        handler(orderIdFromQuery).then(() => {
          // Clear query param after opening
          navigate(location.pathname, { replace: true, state: {} });
        }).catch(err => {
          console.error('❌ Error opening chat from orderId query:', err);
        });
      } else {
        // Store for later
        pendingOpenChatTripIdRef.current = orderIdFromQuery;
        // Clear query param
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
    // Check query parameter (openChat for backward compatibility)
    else if (chatIdFromQuery) {
      console.log('📍 Found openChat in query param:', chatIdFromQuery);
      // Open chat immediately
      const handler = handleChatNotificationClickRef.current;
      if (handler) {
        console.log('📍 Handler available, opening chat directly from query param');
        handler(chatIdFromQuery).then(() => {
          // Clear query param after opening
          navigate(location.pathname, { replace: true, state: {} });
        }).catch(err => {
          console.error('❌ Error opening chat from query:', err);
        });
      } else {
        // Store for later
        pendingOpenChatTripIdRef.current = chatIdFromQuery;
        // Clear query param
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
    // Then check state
    else if (state?.openTripChat) {
      console.log('📍 Found openTripChat in state:', state.openTripChat);
      pendingOpenChatTripIdRef.current = state.openTripChat as string;
      console.log('📍 Set pendingOpenChatTripIdRef from state to:', pendingOpenChatTripIdRef.current);
    }
  }, [location.state, location.search, navigate, location.pathname]);

  useEffect(() => {
    const tripId = pendingOpenChatTripIdRef.current;
    if (!tripId) return;

    console.log('🔔 Opening chat from navigation state for:', tripId);
    console.log('🔔 Current trips count:', trips.length);
    console.log('🔔 Handler available:', !!handleChatNotificationClick);

    // Try to open chat - handleChatNotificationClick will check both trips and orders
    handleChatNotificationClick(tripId).then(() => {
      console.log('✅ Chat opened from navigation state');
      pendingOpenChatTripIdRef.current = null;
      // Clear state so it doesn't re-trigger
      navigate(location.pathname, { replace: true, state: {} });
    }).catch((error) => {
      console.error('❌ Error opening chat from navigation state:', error);
      // If it fails, it might be because trips/orders haven't loaded yet
      // Keep the pending ref so it can retry
    });
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

  // This page manages unread counts locally and opens chat via orderId query parameter

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
        // Check if error is about pending review orders
        const errorMessage = response?.message || 'Failed to start trip';
        if (errorMessage.includes('pending review')) {
          addNotification('warning', 'Cannot start trip without completing verification of other trips. Please complete or resolve all pending review orders before starting a new trip.');
        } else {
          addNotification('error', errorMessage);
        }
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred while starting trip';
      // Check if error is about pending review orders
      if (errorMessage.includes('pending review')) {
        addNotification('warning', 'Cannot start trip without completing verification of other trips. Please complete or resolve all pending review orders before starting a new trip.');
      } else {
        addNotification('error', errorMessage);
      }
    } finally {
      setStartConfirm({ show: false, trip: null });
    }
  };

  const handleApproveTripCompletion = async (trip: Trip, action: 'approve' | 'reject', rejectionReason?: string) => {
    try {
      const response = await approveTripCompletion(trip._id, action, rejectionReason);
      if (response?.success) {
        addNotification('success', action === 'approve'
          ? `Trip ${trip.tripNumber} completion approved successfully.`
          : `Trip ${trip.tripNumber} completion rejected.`);
        fetchTrips();
        if (viewingTrip?._id === trip._id) {
          // Refresh the viewing trip
          const updatedTrip = await getTripById(trip._id);
          if (updatedTrip?.success) {
            setViewingTrip(updatedTrip.data);
          }
        }
      } else {
        addNotification('error', response?.message || `Failed to ${action} trip completion.`);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing trip completion:`, error);
      addNotification('error', error?.message || `An error occurred while ${action}ing trip completion.`);
    }
  };

  const handleCompleteTrip = async (trip: Trip) => {
    // Backend will handle document approval validation
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
      addNotification('error', error?.response?.data?.message || error?.message || 'An error occurred while completing trip');
    } finally {
      setCompleteConfirm({ show: false, trip: null });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'planned': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'pending_completion': 'bg-amber-100 text-amber-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-card text-primary';
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

  // Helper function to check if trip is going to Canada
  const isCanadaTrip = (trip: Trip): boolean => {
    if (!trip.orders || trip.orders.length === 0) return false;
    for (const order of trip.orders) {
      const deliveryLocation = order.deliveryLocation;
      if (deliveryLocation?.placeId?.country) {
        const country = deliveryLocation.placeId.country.toLowerCase();
        if (country === 'canada' || country === 'ca') return true;
      } else if (deliveryLocation?.place) {
        const placeStr = deliveryLocation.place.toLowerCase();
        if (placeStr.includes('canada') || placeStr.includes('ca ')) return true;
      }
    }
    return false;
  };

  // Helper function to get document status for a trip
  const getDocumentStatus = (trip: Trip) => {
    // Check both trip documents and order attachments
    const tripDocuments = trip.documents || [];

    // Get documents from orders (attachments)
    const orderDocuments: any[] = [];
    if (trip.orders && Array.isArray(trip.orders)) {
      trip.orders.forEach((order: any) => {
        if (order.attachments && Array.isArray(order.attachments)) {
          order.attachments.forEach((att: any) => {
            orderDocuments.push({
              type: att.type,
              fileName: att.name,
              fileUrl: att.url,
              uploadedAt: att.uploadedAt,
              uploadedBy: att.uploadedBy
            });
          });
        }
      });
    }

    // Combine trip documents and order documents
    const allDocuments = [...tripDocuments, ...orderDocuments];

    const hasPOD = allDocuments.some((doc: any) =>
      doc.type === 'pod' || doc.type === 'proof_of_delivery'
    );
    const isCanada = isCanadaTrip(trip);
    const hasBorderManifest = allDocuments.some((doc: any) =>
      doc.type === 'stamped_manifest' || doc.type === 'manifest' || doc.type === 'border_manifest'
    );

    return {
      hasPOD,
      hasBorderManifest,
      isCanada,
      isComplete: hasPOD && (!isCanada || hasBorderManifest),
      allDocuments // Return all documents for display
    };
  };

  // Helper function to get DEMO document status (for static display)
  const getDemoDocumentStatus = (_trip: Trip, index: number) => {
    // Demo logic: alternate between different states for visual variety
    const demoPattern = index % 4;

    // Pattern 0: Both documents uploaded (complete - Canada trip)
    if (demoPattern === 0) {
      return {
        hasPOD: true,
        hasBorderManifest: true,
        isCanada: true,
        isComplete: true,
        documentCount: 2
      };
    }
    // Pattern 1: Only POD uploaded (US trip - complete)
    if (demoPattern === 1) {
      return {
        hasPOD: true,
        hasBorderManifest: false,
        isCanada: false,
        isComplete: true,
        documentCount: 1
      };
    }
    // Pattern 2: POD missing (incomplete)
    if (demoPattern === 2) {
      return {
        hasPOD: false,
        hasBorderManifest: false,
        isCanada: false,
        isComplete: false,
        documentCount: 0
      };
    }
    // Pattern 3: POD uploaded, Manifest missing (Canada trip incomplete)
    return {
      hasPOD: true,
      hasBorderManifest: false,
      isCanada: true,
      isComplete: false,
      documentCount: 1
    };
  };

  return (
    <div className="p-4 bg-main min-h-screen">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Trip Management</h1>
          <p className="text-secondary mt-1">Plan trips by assigning truck, driver, and trailer with orders/loads</p>
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
      <div className="bg-card rounded-lg shadow-md p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by trip number..."
              className="w-full pl-10 pr-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-opacity-50 text-sm"
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
            className="px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-opacity-50 text-sm"
            onFocus={focusHandlers.onFocus}
            onBlur={focusHandlers.onBlur}
          >
            <option value="">All Status</option>
            <option value="planned">Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="pending_completion">Pending Completion</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={driverFilter}
            onChange={(e) => {
              setDriverFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-opacity-50 text-sm"
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
            className="px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-opacity-50 text-sm"
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
              className="flex items-center justify-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-[rgba(255,255,255,0.03)] text-sm"
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
        <div className="bg-card rounded-lg shadow-md p-8 text-center">
          <FaTruck className="mx-auto text-secondary mb-4" size={48} />
          <p className="text-secondary">No trips found. Click "New Trip" to create your first trip.</p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-lg shadow-md overflow-hidden">
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
                <thead className="bg-card border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase">Trip #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase">Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase">Co-Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase">Truck</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase">Trailer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase">Orders</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase">Documents</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase">Start Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase">Driver Response</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase">Actions</th>

                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-theme">
                  {trips.map((trip) => (
                    <tr key={trip._id} className="hover:bg-[rgba(255,255,255,0.03)]">
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
                        <div className="flex items-center gap-2">
                          <FaUser className="text-secondary" size={14} />
                          <div>{trip.driver?.name || '-'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-secondary" size={14} />
                          <div>{trip.coDriver?.name || '-'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FaTruck className="text-secondary" size={14} />
                          <span>{trip.truck?.licensePlate || trip.truck?.unitNo || trip.truck?.internalId || trip.truck?.makeModel || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {trip.trailer ? (
                          <div className="flex items-center gap-2">
                            <FaTrailer className="text-secondary" size={14} />
                            <span>{trip.trailer?.licensePlate || trip.trailer?.unitNo || trip.trailer?.makeModel || '-'}</span>
                          </div>
                        ) : (
                          <span className="text-secondary">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: `${FLEET_COLORS.primary}15`, color: FLEET_COLORS.dark }}>
                          {trip.orders?.length || 0} Order(s)
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(() => {
                          // Use demo status for static display - always shows something
                          const tripIndex = trips.findIndex(t => t._id === trip._id);
                          const demoStatus = getDemoDocumentStatus(trip, tripIndex);

                          function setShowDocumentsModal(_arg0: boolean) {
                            throw new Error("Function not implemented.");
                          }

                          function setSelectedTripForDocuments(_tripData: any) {
                            throw new Error("Function not implemented.");
                          }

                          return (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const response = await getTripById(trip._id);
                                  if (response?.success) {
                                    const tripData = response.data;
                                    if (!tripData.documents) {
                                      tripData.documents = [];
                                    }
                                    setSelectedTripForDocuments(tripData);
                                    setShowDocumentsModal(true);
                                  } else {
                                    addNotification('error', 'Failed to load trip documents');
                                  }
                                } catch (error: any) {
                                  addNotification('error', 'Error loading documents');
                                }
                              }}
                              className="flex items-center gap-2 px-2 py-1.5 bg-card hover:bg-blue-50 border border-theme rounded transition-colors w-full min-w-[140px] cursor-pointer"
                              title="Click to view documents"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                {/* POD Status - Always visible */}
                                <div className="flex items-center gap-1" title={demoStatus.hasPOD ? "POD Uploaded ✓" : "POD Missing ✗"}>
                                  {demoStatus.hasPOD ? (
                                    <>
                                      <FaCheckCircle className="text-green-600" size={14} />
                                      <span className="text-xs font-semibold text-green-700">POD</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaTimes className="text-[#A855F7]" size={14} />
                                      <span className="text-xs font-semibold text-red-700">POD</span>
                                    </>
                                  )}
                                </div>

                                {/* Border Manifest Status (for Canada trips) */}
                                {demoStatus.isCanada && (
                                  <div className="flex items-center gap-1" title={demoStatus.hasBorderManifest ? "Manifest Uploaded ✓" : "Manifest Missing ✗"}>
                                    {demoStatus.hasBorderManifest ? (
                                      <>
                                        <FaCheckCircle className="text-green-600" size={14} />
                                        <span className="text-xs font-semibold text-green-700">M</span>
                                      </>
                                    ) : (
                                      <>
                                        <FaTimes className="text-[#A855F7]" size={14} />
                                        <span className="text-xs font-semibold text-red-700">M</span>
                                      </>
                                    )}
                                  </div>
                                )}

                                {/* Document count badge */}
                                {demoStatus.documentCount > 0 && (
                                  <div className="flex items-center gap-1 ml-auto">
                                    <File className="text-[#00D1FF]" size={12} />
                                    <span className="text-xs font-semibold text-blue-800">{demoStatus.documentCount}</span>
                                  </div>
                                )}

                                {/* Show dash if no documents */}
                                {demoStatus.documentCount === 0 && (
                                  <span className="text-xs text-secondary ml-auto">-</span>
                                )}
                              </div>
                            </button>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-secondary">
                        {formatDate(trip.plannedStartDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {trip.driverAcceptanceStatus === 'accepted' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700" title="Driver accepted this trip">
                            <FaCheckCircle size={11} /> Accepted
                          </span>
                        ) : trip.driverAcceptanceStatus === 'rejected' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 cursor-help"
                            title={trip.driverRejectionReason ? `Reason: ${trip.driverRejectionReason}` : 'Driver rejected this trip'}
                          >
                            <FaTimes size={11} /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700" title="Awaiting driver response">
                            <FaExclamationCircle size={11} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <select
                            value={trip.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              const previousStatus = trip.status;
                              e.stopPropagation(); // Stop row click

                              try {
                                if (newStatus === 'in-progress') {
                                  await handleStartTrip(trip);
                                } else if (newStatus === 'completed') {
                                  // Backend will handle document approval validation
                                  const isPaid = trip.orders?.every((o: any) => o.accountingStatus === 'paid');
                                  if (!isPaid) {
                                    addNotification('error', 'Cannot complete trip: Payment Pending');
                                    // Revert dropdown to previous status
                                    e.target.value = previousStatus;
                                    return;
                                  }
                                  await handleCompleteTrip(trip);
                                } else {
                                  // For other statuses (e.g., reverting to planned), use generic update
                                  const res = await updateTrip(trip._id, { status: newStatus });
                                  if (res?.success) {
                                    addNotification('success', 'Trip status updated');
                                    fetchTrips();
                                  } else {
                                    addNotification('error', res?.message || 'Failed to update trip status');
                                    // Revert dropdown to previous status if update failed
                                    e.target.value = previousStatus;
                                  }
                                }
                              } catch (err: any) {
                                console.error('Error updating trip status:', err);
                                addNotification('error', err?.response?.data?.message || err?.message || 'Error updating trip status');
                                // Revert dropdown to previous status on error
                                e.target.value = previousStatus;
                              }
                            }}
                            className="text-xs border rounded px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="planned">Planned</option>
                            <option value="quoted">Quoted</option>
                            <option value="in-delivery">In Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="pending_completion">Pending Completion</option>
                            <option value="completed">Completed</option>
                            <option value="canceled">Canceled</option>
                          </select>
                          {trip.status === 'pending_completion' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTrip(trip);
                              }}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Review and approve/reject completion"
                            >
                              <FaExclamationCircle size={12} />
                              Review
                            </button>
                          )}
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
                              onClick={() => {
                                handleCompleteTrip(trip);
                              }}
                              className="px-3 py-1.5 text-xs font-medium rounded transition-all !text-white hover:opacity-90 hover:shadow-md"
                              style={primaryButtonStyle}
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
                                className="p-1.5 text-[#A855F7] hover:bg-red-50 rounded transition-colors"
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
            <div className="mt-4 px-6 py-4 border-t border-theme flex items-center justify-between">
              <div className="text-sm text-primary">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} trips
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-theme rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.03)]"
                >
                  Previous
                </button>
                <span className="px-3 py-1 !text-white rounded text-sm" style={primaryButtonStyle}>{currentPage}</span>
                <span className="text-sm text-secondary">of</span>
                <span className="px-3 py-1 bg-card rounded text-sm text-primary">{totalPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-theme rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[rgba(255,255,255,0.03)]"
                >
                  Next
                </button>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-theme rounded text-sm ml-2"
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
        className={`fixed top-0 right-0 h-full max-w-4xl w-full bg-card shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-theme ${sidebarOpen ? "translate-x-0" : "translate-x-full"
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
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-shrink-0 bg-card border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold text-primary">Trip Details: {viewingTrip.tripNumber}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setViewingTrip(null);
                    setShowChat(false);
                  }}
                  className="p-2 hover:bg-[rgba(255,255,255,0.03)] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-secondary" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Trip Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-secondary">Driver</label>
                    <p className="text-lg font-semibold">{viewingTrip.driver?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary">Co-driver</label>
                    <p className="text-lg font-semibold">{viewingTrip.coDriver?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary">Truck</label>
                    <p className="text-lg font-semibold">{viewingTrip.truck?.licensePlate || viewingTrip.truck?.unitNo || viewingTrip.truck?.internalId || viewingTrip.truck?.makeModel || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary">Trailer</label>
                    <p className="text-lg font-semibold">{viewingTrip.trailer?.licensePlate || viewingTrip.trailer?.unitNo || viewingTrip.trailer?.makeModel || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary">Status</label>
                    <p className={`text-lg font-semibold inline-block px-3 py-1 rounded-full ${getStatusBadge(viewingTrip.status)}`}>
                      {viewingTrip.status.charAt(0).toUpperCase() + viewingTrip.status.slice(1).replace('-', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary">Planned Start</label>
                    <p className="text-lg font-semibold">{formatDate(viewingTrip.plannedStartDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary">Planned End</label>
                    <p className="text-lg font-semibold">{formatDate(viewingTrip.plannedEndDate)}</p>
                  </div>
                </div>

                {/* Orders */}
                {viewingTrip.orders && viewingTrip.orders.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-primary mb-3">Orders ({viewingTrip.orders.length})</h4>
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
                          <div key={order._id} className="p-4 bg-card rounded-lg border border-theme">
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
                            <div className="text-sm text-primary space-y-1 mt-2">
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
                    <h4 className="font-semibold text-primary mb-2">Notes</h4>
                    <p className="text-primary">{viewingTrip.notes}</p>
                  </div>
                )}

                {/* Completion Approval Section */}
                {viewingTrip.status === 'pending_completion' && (
                  <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl mb-6 shadow-lg">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                          <FaExclamationCircle className="text-white" size={24} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-amber-900 text-lg mb-2">Trip Completion Pending Approval</h4>
                        <p className="text-sm text-amber-800 mb-3">
                          The driver has submitted this trip for completion. Please review all required documents below before approving or rejecting.
                        </p>
                        {(() => {
                          const docStatus = getDocumentStatus(viewingTrip);
                          return (
                            <div className="mt-3 p-3 bg-card rounded-lg border border-amber-200">
                              <div className="text-xs font-semibold text-amber-900 mb-2">Document Requirements Status:</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className={`flex items-center gap-2 p-2 rounded ${docStatus.hasPOD ? 'bg-green-50' : 'bg-card'}`}>
                                  {docStatus.hasPOD ? (
                                    <FaCheckCircle className="text-green-600" size={16} />
                                  ) : (
                                    <FaTimes className="text-[#A855F7]" size={16} />
                                  )}
                                  <span className={`text-sm font-medium ${docStatus.hasPOD ? 'text-green-800' : 'text-red-800'}`}>
                                    POD (Proof of Delivery) {docStatus.hasPOD ? '✓ Uploaded' : '✗ Missing'}
                                  </span>
                                </div>
                                {docStatus.isCanada && (
                                  <div className={`flex items-center gap-2 p-2 rounded ${docStatus.hasBorderManifest ? 'bg-green-50' : 'bg-card'}`}>
                                    {docStatus.hasBorderManifest ? (
                                      <FaCheckCircle className="text-green-600" size={16} />
                                    ) : (
                                      <FaTimes className="text-[#A855F7]" size={16} />
                                    )}
                                    <span className={`text-sm font-medium ${docStatus.hasBorderManifest ? 'text-green-800' : 'text-red-800'}`}>
                                      Border Manifest {docStatus.hasBorderManifest ? '✓ Uploaded' : '✗ Missing'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {!docStatus.isComplete && (
                                <div className="mt-2 p-2 bg-card border border-yellow-200 rounded text-xs text-yellow-800">
                                  <strong>⚠️ Warning:</strong> Required documents are missing. Please ensure all documents are uploaded before approving.
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        {viewingTrip.completionRejectionReason && (
                          <div className="mt-3 p-3 bg-card border border-red-200 rounded-lg">
                            <div className="text-xs font-semibold text-red-900 mb-1">Previous Rejection Reason:</div>
                            <div className="text-sm text-red-800">{viewingTrip.completionRejectionReason}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-3 border-t border-amber-300">
                      <button
                        onClick={() => {
                          const docStatus = getDocumentStatus(viewingTrip);
                          if (!docStatus.isComplete) {
                            if (!window.confirm('Required documents are missing. Are you sure you want to approve this trip completion?')) {
                              return;
                            }
                          }
                          handleApproveTripCompletion(viewingTrip, 'approve');
                        }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <FaCheckCircle size={18} /> Approve Completion
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt('Please provide a reason for rejection:');
                          if (reason !== null && reason.trim() !== '') {
                            handleApproveTripCompletion(viewingTrip, 'reject', reason.trim());
                          } else if (reason !== null) {
                            addNotification('warning', 'Please provide a reason for rejection');
                          }
                        }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <FaTimes size={18} /> Reject Completion
                      </button>
                    </div>
                  </div>
                )}

                {/* Documents Section - Static Display */}
                <div className="mb-4 border-t border-theme pt-4">
                  <h4 className="font-semibold text-primary text-lg mb-4 flex items-center gap-2">
                    <File className="text-secondary" size={20} />
                    Trip Documents
                    {viewingTrip.documents && viewingTrip.documents.length > 0 && (
                      <span className="text-sm font-normal text-secondary">
                        ({viewingTrip.documents.length})
                      </span>
                    )}
                  </h4>

                  {/* Document Requirements Status - Static */}
                  <div className="mb-4 p-3 bg-card rounded-lg border border-theme">
                    <div className="text-xs font-semibold text-primary mb-2">Required Documents:</div>
                    {(() => {
                      const docStatus = getDocumentStatus(viewingTrip);
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            {docStatus.hasPOD ? (
                              <FaCheckCircle className="text-green-600" size={14} />
                            ) : (
                              <FaTimes className="text-[#A855F7]" size={14} />
                            )}
                            <span className={docStatus.hasPOD ? 'text-green-800' : 'text-red-800'}>
                              POD (Proof of Delivery) - {docStatus.hasPOD ? 'Uploaded' : 'Missing'}
                            </span>
                          </div>
                          {docStatus.isCanada && (
                            <div className="flex items-center gap-2 text-sm">
                              {docStatus.hasBorderManifest ? (
                                <FaCheckCircle className="text-green-600" size={14} />
                              ) : (
                                <FaTimes className="text-[#A855F7]" size={14} />
                              )}
                              <span className={docStatus.hasBorderManifest ? 'text-green-800' : 'text-red-800'}>
                                Border Manifest - {docStatus.hasBorderManifest ? 'Uploaded' : 'Missing'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Documents List - Static */}
                  <div>
                    <div className="text-xs font-semibold text-primary mb-2">Uploaded Documents:</div>
                    {viewingTrip.documents && viewingTrip.documents.length > 0 ? (
                      <div className="space-y-2">
                        {viewingTrip.documents.map((doc: any, index: number) => {
                          const formatFileSize = (bytes?: number) => {
                            if (!bytes) return 'N/A';
                            if (bytes < 1024) return bytes + ' B';
                            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
                          };

                          const getDocumentTypeLabel = (type?: string) => {
                            if (!type) return 'Document';
                            if (type === 'pod' || type === 'proof_of_delivery') return 'POD';
                            if (type === 'stamped_manifest' || type === 'manifest') return 'Manifest';
                            return type;
                          };

                          return (
                            <div
                              key={doc._id || doc.fileUrl || `doc-${index}`}
                              className="p-3 bg-card border border-theme rounded-lg"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <File className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm text-primary truncate">
                                        {doc.fileName || 'Untitled Document'}
                                      </span>
                                      {doc.type && (
                                        <span className="px-2 py-0.5 bg-card text-primary rounded text-xs font-medium flex-shrink-0">
                                          {getDocumentTypeLabel(doc.type)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-secondary mt-1">
                                      <span>{formatFileSize(doc.fileSize)}</span>
                                      {doc.uploadedAt && (
                                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                      )}
                                      {doc.uploadedBy?.name && (
                                        <span>by {doc.uploadedBy.name}</span>
                                      )}
                                    </div>
                                    {doc.description && (
                                      <div className="text-xs text-secondary mt-1">{doc.description}</div>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (!viewingTrip?._id || !doc._id) {
                                      if (doc.fileUrl) {
                                        window.open(doc.fileUrl, '_blank');
                                      }
                                      return;
                                    }
                                    try {
                                      const response = await getTripDocumentSignedUrl(viewingTrip._id, doc._id, 'inline');
                                      if (response?.success && response?.url) {
                                        window.open(response.url, '_blank');
                                      } else if (doc.fileUrl) {
                                        window.open(doc.fileUrl, '_blank');
                                      }
                                    } catch (error) {
                                      console.error('Error getting signed URL:', error);
                                      if (doc.fileUrl) {
                                        window.open(doc.fileUrl, '_blank');
                                      }
                                    }
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-[#00D1FF] hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors flex items-center gap-1 flex-shrink-0"
                                  title="View Document"
                                >
                                  <Download className="w-3 h-3" />
                                  View
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-card border border-theme rounded-lg text-center text-secondary">
                        <File className="w-6 h-6 mx-auto mb-2 text-secondary" />
                        <p className="text-sm">No documents uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Document Approval Section - Only show if documents are not approved */}
                  {(() => {
                    // Show approval section if trip is not completed and documents are not approved
                    const isNotCompleted = viewingTrip.status !== 'completed';
                    const isNotApproved = !viewingTrip.documentsApproved; // true if false, undefined, or null

                    // Debug logging
                    console.log('🔍 Approval Section Check:', {
                      tripId: viewingTrip._id,
                      tripNumber: viewingTrip.tripNumber,
                      status: viewingTrip.status,
                      isNotCompleted,
                      documentsApproved: viewingTrip.documentsApproved,
                      isNotApproved,
                      hasTripDocuments: !!(viewingTrip.documents && viewingTrip.documents.length > 0),
                      hasOrderAttachments: !!(viewingTrip.orders && viewingTrip.orders.some((order: any) => order.attachments && order.attachments.length > 0)),
                      ordersCount: viewingTrip.orders?.length || 0
                    });

                    // Don't show if trip is completed or already approved
                    if (!isNotCompleted || !isNotApproved) {
                      console.log('❌ Not showing approval section:', { isNotCompleted, isNotApproved });
                      return null;
                    }

                    const docStatus = getDocumentStatus(viewingTrip);
                    // Check if there are any documents (from trip or orders)
                    const hasDocuments = (viewingTrip.documents && viewingTrip.documents.length > 0) ||
                      (viewingTrip.orders && viewingTrip.orders.some((order: any) => order.attachments && order.attachments.length > 0));

                    console.log('✅ Showing approval section:', { hasDocuments, docStatus });

                    return (
                      <div className="mt-4 p-4 bg-card border border-yellow-200 rounded-lg">
                        <div className="text-sm font-semibold text-primary mb-3">Document Approval</div>
                        <div className="flex flex-col gap-2">
                          {hasDocuments && (
                            <button
                              onClick={async () => {
                                if (!viewingTrip?._id) return;
                                try {
                                  const response = await approveTripDocuments(viewingTrip._id, false);
                                  if (response?.success) {
                                    addNotification('success', 'Documents approved successfully. Trip can now be completed.');
                                    // Refresh trip data
                                    const updatedTrip = await getTripById(viewingTrip._id);
                                    if (updatedTrip?.success && updatedTrip?.data) {
                                      setViewingTrip(updatedTrip.data);
                                    }
                                    fetchTrips();
                                  } else {
                                    addNotification('error', response?.message || 'Failed to approve documents');
                                  }
                                } catch (error: any) {
                                  addNotification('error', error?.message || 'An error occurred while approving documents');
                                }
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium transition-all hover:bg-green-700 hover:shadow-md text-sm"
                            >
                              Approve Documents
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!viewingTrip?._id) return;
                              if (!window.confirm('Are you sure you want to approve this trip without documents? This will allow the trip to be completed even without required documents.')) {
                                return;
                              }
                              try {
                                const response = await approveTripDocuments(viewingTrip._id, true);
                                if (response?.success) {
                                  addNotification('success', 'Trip approved without documents. Trip can now be completed.');
                                  // Refresh trip data
                                  const updatedTrip = await getTripById(viewingTrip._id);
                                  if (updatedTrip?.success && updatedTrip?.data) {
                                    setViewingTrip(updatedTrip.data);
                                  }
                                  fetchTrips();
                                } else {
                                  addNotification('error', response?.message || 'Failed to approve trip');
                                }
                              } catch (error: any) {
                                addNotification('error', error?.message || 'An error occurred while approving trip');
                              }
                            }}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium transition-all hover:bg-orange-700 hover:shadow-md text-sm"
                          >
                            Approve Trip Without Documents
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Show approval status if approved */}
                  {viewingTrip.documentsApproved && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-green-800">
                        <FaCheckCircle className="text-green-600" size={16} />
                        <span className="font-semibold">
                          Documents {viewingTrip.approvedWithoutDocuments ? 'Approved (Without Documents)' : 'Approved'}
                        </span>
                      </div>
                      {viewingTrip.documentsApprovedBy && (
                        <div className="text-xs text-green-700 mt-1">
                          Approved by {viewingTrip.documentsApprovedBy.name || 'Dispatcher'}
                          {viewingTrip.documentsApprovedAt && (
                            <span> on {new Date(viewingTrip.documentsApprovedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {!showChat && (
                <div className="sticky bottom-0 bg-card px-6 py-4 flex justify-between items-center border-t rounded-b-xl">
                  <div>
                    {viewingTrip.status !== 'completed' && (
                      <button
                        onClick={() => {
                          handleCompleteTrip(viewingTrip);
                        }}
                        className="px-6 py-2 rounded-lg font-medium transition-all bg-green-600 text-white hover:bg-green-700 hover:shadow-md"
                        title="Complete Trip"
                      >
                        Complete Trip
                      </button>
                    )}
                  </div>
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
