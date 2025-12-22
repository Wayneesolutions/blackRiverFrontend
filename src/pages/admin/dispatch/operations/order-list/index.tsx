import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { MoreVertical, Edit, Trash2, Plus, ChevronDown, ChevronUp, X, Package, DollarSign, Route, Truck } from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import NewOrderSidebar from "./NewOrderSidebar";
import { listOrder, deleteOrder, getOrderById } from "../../../../../axios/api/distapcher";
import { listPlace } from "../../../../../axios/api/dispatcher.places";
import ConfirmationModal from "../../../../../components/common/ConfirmationModal";
import { createPortal } from "react-dom";

// Color constants
const PRIMARY_GRADIENT = 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)';
const PRIMARY_COLOR = '#016ab2';
const PRIMARY_LIGHT_BG = 'rgba(66, 174, 236, 0.1)';
const FOCUS_RING = 'rgba(1, 106, 178, 0.2)';

interface Place {
  _id: string;
  name?: string;
  city?: string;
  state?: string;
  currentLocation?: {
    address?: string;
    latitude?: string | number;
    longitude?: string | number;
  };
}

type NotificationType = 'success' | 'error' | 'warning';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
}

const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in min-w-[300px] max-w-[500px]`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

interface Order {
  id: string;
  orderNo: string;
  custOrderNo: string;
  tripNo: string;
  orderDate: string;
  orderType: string;
  totalItems: number;
  companyName: string;
  customerName: string;
  pickupDate: string;
  pickupLocation: string;
  pickupRefNo: string;
  deliveryDate: string;
  deliveryLocation: string;
  deliveryRefNo: string;
  totalAmount: string;
  currency: string;
  status: "QUOTED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED";
  driver: string;
  truckNo: string;
  trailerNo: string;
}

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; orderId: string | null }>({ show: false, orderId: null });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Order details sidebar state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Refs for scrollbar synchronization
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  // Places state for search dropdowns
  const [places, setPlaces] = useState<Place[]>([]);
  const [pickupLocationSearch, setPickupLocationSearch] = useState("");
  const [pickupLocationDropdownOpen, setPickupLocationDropdownOpen] = useState(false);
  const [deliveryLocationSearch, setDeliveryLocationSearch] = useState("");
  const [deliveryLocationDropdownOpen, setDeliveryLocationDropdownOpen] = useState(false);
  const pickupLocationDropdownRef = useRef<HTMLDivElement>(null);
  const deliveryLocationDropdownRef = useRef<HTMLDivElement>(null);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        setUserInfo(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
    }
    fetchOrders();
    fetchPlaces();
  }, []);

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
  }, [orders, loading]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (pickupLocationDropdownRef.current && target && !pickupLocationDropdownRef.current.contains(target)) {
        setPickupLocationDropdownOpen(false);
      }
      if (deliveryLocationDropdownRef.current && target && !deliveryLocationDropdownRef.current.contains(target)) {
        setDeliveryLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPlaces = async () => {
    try {
      const response = await listPlace();
      if (response?.success && response?.data) {
        setPlaces(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching places:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userInfo?.company]);

  // Helper function to safely extract location string
  const extractLocationString = (location: any): string => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    if (typeof location !== 'object') return '';

    try {
      // Try different paths to get the location string
      // First check if place field exists
      if (location.place && typeof location.place === 'string') {
        return location.place;
      }

      // Check if placeId is populated (object) with currentLocation
      if (location.placeId) {
        if (typeof location.placeId === 'object' && location.placeId !== null) {
          // Check for populated Place object
          if (location.placeId.currentLocation?.address && typeof location.placeId.currentLocation.address === 'string') {
            return location.placeId.currentLocation.address;
          }
          if (location.placeId.name && typeof location.placeId.name === 'string') {
            return location.placeId.name;
          }
        }
      }

      // Fallback to other fields
      if (location.address && typeof location.address === 'string') {
        return location.address;
      }
      if (location.name && typeof location.name === 'string') {
        return location.name;
      }
    } catch (error) {
      console.error('Error extracting location string:', error);
    }

    return '';
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await listOrder({
        page: currentPage,
        limit: itemsPerPage,
        status: orderStatus || undefined,
        orderType: orderType || undefined
      });

      if (response?.success && response?.data) {
        const formattedOrders = response.data.map((order: any) => ({
          id: order._id,
          orderNo: order.orderNumber || order._id,
          custOrderNo: order.customerOrderNo || '',
          tripNo: order.tripNo || '',
          orderDate: order.orderDate ? new Date(order.orderDate).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : '',
          orderType: order.orderType || 'Regular',
          totalItems: order.noOfPackages || 0,
          companyName: "Black River Logistics Ltd", // You might want to fetch this from company settings
          customerName: order.customer?.name || 'N/A',
          pickupDate: order.pickupDate ? new Date(order.pickupDate).toLocaleDateString('en-US') : '',
          pickupLocation: extractLocationString(order.pickupLocation) || '',
          pickupRefNo: order.pickupRefNo || '',
          deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-US') : '',
          deliveryLocation: extractLocationString(order.deliveryLocation) || '',
          deliveryRefNo: order.deliveryRefNo || '',
          totalAmount: order.totalAmount?.toFixed(2) || '0.00',
          currency: order.currency || 'CAD',
          status: order.status || 'QUOTED',
          driver: order.driver?.name || '',
          truckNo: order.truck?.licensePlate || order.truck?.unitNo || order.truck?.internalId || '',
          trailerNo: order.trailer?.licensePlate || order.trailer?.unitNo || ''
        }));
        setOrders(formattedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter states
  const [orderType, setOrderType] = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [byDays, setByDays] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [accounting, setAccounting] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Search states
  const [orderNo, setOrderNo] = useState("");
  const [custOrderNo, setCustOrderNo] = useState("");
  const [tripNo, setTripNo] = useState("");
  const [pickupDeliveryRef, setPickupDeliveryRef] = useState("");
  const [custName, setCustName] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesOrderNo = !orderNo || order.orderNo.toLowerCase().includes(orderNo.toLowerCase());
      const matchesCustOrderNo = !custOrderNo || order.custOrderNo.toLowerCase().includes(custOrderNo.toLowerCase());
      const matchesTripNo = !tripNo || order.tripNo.toLowerCase().includes(tripNo.toLowerCase());
      const matchesPickupDeliveryRef = !pickupDeliveryRef ||
        (order.pickupRefNo && order.pickupRefNo.toLowerCase().includes(pickupDeliveryRef.toLowerCase())) ||
        (order.deliveryRefNo && order.deliveryRefNo.toLowerCase().includes(pickupDeliveryRef.toLowerCase()));
      const matchesCustName = !custName || (order.customerName && order.customerName.toLowerCase().includes(custName.toLowerCase()));
      // Extract location strings - orders should already have strings, but handle both cases
      const pickupLocStr = typeof order.pickupLocation === 'string' ? order.pickupLocation : extractLocationString(order.pickupLocation);
      const deliveryLocStr = typeof order.deliveryLocation === 'string' ? order.deliveryLocation : extractLocationString(order.deliveryLocation);
      const matchesPickupLocation = !pickupLocation || (pickupLocStr && pickupLocStr.toLowerCase().includes(pickupLocation.toLowerCase()));
      const matchesDeliveryLocation = !deliveryLocation || (deliveryLocStr && deliveryLocStr.toLowerCase().includes(deliveryLocation.toLowerCase()));
      const matchesOrderType = !orderType || order.orderType === orderType;
      const matchesStatus = !orderStatus || order.status === orderStatus;

      return matchesOrderNo && matchesCustOrderNo && matchesTripNo && matchesPickupDeliveryRef &&
        matchesCustName && matchesPickupLocation && matchesDeliveryLocation && matchesOrderType && matchesStatus;
    });
  }, [orders, orderNo, custOrderNo, tripNo, pickupDeliveryRef, custName, pickupLocation, deliveryLocation, orderType, orderStatus]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filtered places for search dropdowns
  const filteredPickupPlaces = useMemo(() => {
    return places.filter(place =>
      !pickupLocationSearch ||
      (place.name || '').toLowerCase().includes(pickupLocationSearch.toLowerCase()) ||
      (place.currentLocation?.address || '').toLowerCase().includes(pickupLocationSearch.toLowerCase()) ||
      (place.city || '').toLowerCase().includes(pickupLocationSearch.toLowerCase()) ||
      (place.state || '').toLowerCase().includes(pickupLocationSearch.toLowerCase())
    );
  }, [places, pickupLocationSearch]);

  const filteredDeliveryPlaces = useMemo(() => {
    return places.filter(place =>
      !deliveryLocationSearch ||
      (place.name || '').toLowerCase().includes(deliveryLocationSearch.toLowerCase()) ||
      (place.currentLocation?.address || '').toLowerCase().includes(deliveryLocationSearch.toLowerCase()) ||
      (place.city || '').toLowerCase().includes(deliveryLocationSearch.toLowerCase()) ||
      (place.state || '').toLowerCase().includes(deliveryLocationSearch.toLowerCase())
    );
  }, [places, deliveryLocationSearch]);

  const handlePickupLocationSelect = (place: Place) => {
    const locationString = place.currentLocation?.address || place.name || '';
    setPickupLocation(locationString);
    setPickupLocationSearch(locationString);
    setPickupLocationDropdownOpen(false);
  };

  const handleDeliveryLocationSelect = (place: Place) => {
    const locationString = place.currentLocation?.address || place.name || '';
    setDeliveryLocation(locationString);
    setDeliveryLocationSearch(locationString);
    setDeliveryLocationDropdownOpen(false);
  };

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setSidebarOpen(true);
  };

  const handleEditOrder = async (order: Order) => {
    try {
      // Fetch full order details with populated fields
      const response = await getOrderById(order.id);
      if (response?.success && response?.data) {
        setEditingOrder(response.data);
        setSidebarOpen(true);
        setActionMenuOpen(null);
      } else {
        addNotification('error', response?.message || "Failed to load order details");
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      addNotification('error', "Failed to load order details. Please try again.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setDeleteConfirm({ show: true, orderId });
  };

  const confirmDeleteOrder = async () => {
    if (!deleteConfirm.orderId) return;

    try {
      const response = await deleteOrder(deleteConfirm.orderId);
      if (response?.success) {
        setOrders(orders.filter((o) => o.id !== deleteConfirm.orderId));
        addNotification('success', "Order deleted successfully");
      } else {
        addNotification('error', response?.message || "Failed to delete order");
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      addNotification('error', "Failed to delete order. Please try again.");
    } finally {
      setDeleteConfirm({ show: false, orderId: null });
      setActionMenuOpen(null);
    }
  };

  const handleSaveOrder = async () => {
    // Order is already saved by the sidebar component
    // Close sidebar first, then refresh the list to get properly formatted data
    setSidebarOpen(false);
    setEditingOrder(null);
    // Wait a moment for the order to be saved in the database
    setTimeout(() => {
      fetchOrders();
    }, 500);
  };

  const handleReset = () => {
    setOrderNo("");
    setCustOrderNo("");
    setTripNo("");
    setPickupDeliveryRef("");
    setCustName("");
    setPickupLocation("");
    setPickupLocationSearch("");
    setDeliveryLocation("");
    setDeliveryLocationSearch("");
    setOrderType("");
    setCreatedDate("");
    setByDays("");
    setOrderStatus("");
    setAccounting("");
    setSortBy("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "QUOTED":
        return "bg-orange-100 text-orange-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "text-white";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "IN_PROGRESS") {
      return { background: PRIMARY_GRADIENT };
    }
    return {};
  };

  return (
    <div className="p-6 bg-[#EDF8FF] min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Order List</h1>
        <button
          onClick={handleCreateOrder}
          style={{ background: PRIMARY_GRADIENT }}
          className="flex items-center gap-2 px-4 py-2 !text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
        >
          <Plus className="w-5 h-5" />
          Create Order
        </button>
      </div>

      {/* Top Filter Bar */}
      <div style={{ backgroundColor: PRIMARY_LIGHT_BG }} className="p-3 rounded-lg mb-4 flex flex-wrap gap-3">
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">Order Type</option>
          <option value="Regular">Regular</option>
          <option value="Express">Express</option>
        </select>
        <select
          value={createdDate}
          onChange={(e) => setCreatedDate(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">Created Date</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select
          value={byDays}
          onChange={(e) => setByDays(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">By Days</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
        <select
          value={orderStatus}
          onChange={(e) => setOrderStatus(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">By Order Status</option>
          <option value="QUOTED">Quoted</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={accounting}
          onChange={(e) => setAccounting(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">By Accounting</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">By Sort</option>
          <option value="date-asc">Date (Ascending)</option>
          <option value="date-desc">Date (Descending)</option>
          <option value="amount-asc">Amount (Ascending)</option>
          <option value="amount-desc">Amount (Descending)</option>
        </select>
      </div>

      {/* Search Panel */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Order#</label>
            <input
              type="text"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="Order No"
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cust. Order#</label>
            <input
              type="text"
              value={custOrderNo}
              onChange={(e) => setCustOrderNo(e.target.value)}
              placeholder="Customer Order No"
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Trip#</label>
            <input
              type="text"
              value={tripNo}
              onChange={(e) => setTripNo(e.target.value)}
              placeholder="Trip No"
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pickup/Delivery Ref#</label>
            <input
              type="text"
              value={pickupDeliveryRef}
              onChange={(e) => setPickupDeliveryRef(e.target.value)}
              placeholder="Pickup/Delivery Ref No"
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cust Name</label>
            <select
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
            >
              <option value="">Select</option>
              <option value="3 Rivers Logistics Inc">3 Rivers Logistics Inc</option>
              <option value="3909973 MANITOBA INC D">3909973 MANITOBA INC D</option>
            </select>
          </div>
          <div className="relative" ref={pickupLocationDropdownRef}>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pickup Location</label>
            <div className="relative">
              <input
                type="text"
                value={pickupLocationSearch || pickupLocation}
                onChange={(e) => {
                  setPickupLocationSearch(e.target.value);
                  setPickupLocation(e.target.value);
                  setPickupLocationDropdownOpen(true);
                }}
                onFocus={(e) => {
                  setPickupLocationDropdownOpen(true);
                  e.target.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`;
                  e.target.style.borderColor = PRIMARY_COLOR;
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = '';
                  e.target.style.borderColor = '';
                }}
                placeholder="Search pickup location..."
                className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPickupLocationDropdownOpen(!pickupLocationDropdownOpen)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {pickupLocationDropdownOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
            {pickupLocationDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredPickupPlaces.length > 0 ? (
                  filteredPickupPlaces.map((place) => {
                    const locationString = place.currentLocation?.address || place.name || '';
                    return (
                      <div
                        key={place._id}
                        onClick={() => handlePickupLocationSelect(place)}
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{place.name || 'Unnamed Place'}</div>
                        {locationString && (
                          <div className="text-xs text-gray-500">{locationString}</div>
                        )}
                        {(place.city || place.state) && (
                          <div className="text-xs text-gray-400">
                            {[place.city, place.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">No places found</div>
                )}
              </div>
            )}
          </div>
          <div className="relative" ref={deliveryLocationDropdownRef}>
            <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Location</label>
            <div className="relative">
              <input
                type="text"
                value={deliveryLocationSearch || deliveryLocation}
                onChange={(e) => {
                  setDeliveryLocationSearch(e.target.value);
                  setDeliveryLocation(e.target.value);
                  setDeliveryLocationDropdownOpen(true);
                }}
                onFocus={(e) => {
                  setDeliveryLocationDropdownOpen(true);
                  e.target.style.boxShadow = `0 0 0 2px ${FOCUS_RING}`;
                  e.target.style.borderColor = PRIMARY_COLOR;
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = '';
                  e.target.style.borderColor = '';
                }}
                placeholder="Search delivery location..."
                className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setDeliveryLocationDropdownOpen(!deliveryLocationDropdownOpen)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {deliveryLocationDropdownOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
            {deliveryLocationDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredDeliveryPlaces.length > 0 ? (
                  filteredDeliveryPlaces.map((place) => {
                    const locationString = place.currentLocation?.address || place.name || '';
                    return (
                      <div
                        key={place._id}
                        onClick={() => handleDeliveryLocationSelect(place)}
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{place.name || 'Unnamed Place'}</div>
                        {locationString && (
                          <div className="text-xs text-gray-500">{locationString}</div>
                        )}
                        {(place.city || place.state) && (
                          <div className="text-xs text-gray-400">
                            {[place.city, place.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">No places found</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => fetchOrders()}
            style={{ background: PRIMARY_GRADIENT }}
            className="px-4 py-2 !text-white rounded hover:opacity-90 transition-opacity shadow-md"
          >
            Search
          </button>
        </div>
      </div>

      {/* Orders Table */}
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
          className="overflow-x-auto table-container-hidden-scrollbar"
        >
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order#/Cust. Order#
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Trip#
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Pickup Date/Location/Ref No
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Delivery Date/Location/Ref No
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Truck#/Trailer#
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: PRIMARY_COLOR }}></div>
                    <p className="mt-2">Loading orders...</p>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm">Create a new order to get started</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderDetails(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuOpen(actionMenuOpen === order.id ? null : order.id);
                          }}
                          className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-green-700" />
                        </button>
                        {actionMenuOpen === order.id && (
                          <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditOrder(order);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOrder(order.id);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNo}</div>
                      <div className="text-xs text-gray-500">{order.orderType}</div>
                      {order.custOrderNo && (
                        <div className="text-xs text-gray-500">{order.custOrderNo}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.tripNo || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.orderDate}</div>
                      <div className="text-xs text-gray-500">Total Item: {order.totalItems}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.companyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const pickupLoc = extractLocationString(order.pickupLocation);
                        return pickupLoc ? (
                          <div className="text-sm">
                            <div className="text-gray-900">{pickupLoc}</div>
                            {order.pickupRefNo && <div className="text-gray-600">Ref: {order.pickupRefNo}</div>}
                            {order.pickupDate && <div className="text-red-600">{order.pickupDate}</div>}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const deliveryLoc = extractLocationString(order.deliveryLocation);
                        return deliveryLoc ? (
                          <div className="text-sm">
                            <div className="text-gray-900">{deliveryLoc}</div>
                            {order.deliveryRefNo && <div className="text-gray-600">Ref: {order.deliveryRefNo}</div>}
                            {order.deliveryDate && <div className="text-red-600">{order.deliveryDate}</div>}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.currency} {order.totalAmount}
                      </div>

                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.driver || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.truckNo || order.trailerNo ? (
                        <div>
                          {order.truckNo && <div>Truck: {order.truckNo}</div>}
                          {order.trailerNo && <div>Trailer: {order.trailerNo}</div>}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className={`inline-flex font-semibold rounded-full px-2 py-1 text-xs ${getStatusColor(order.status)}`} style={getStatusStyle(order.status)}>
                        {order.status}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 !text-white rounded text-sm shadow-md" style={{ background: PRIMARY_GRADIENT }}>{currentPage}</span>
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
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[10003] flex flex-col gap-2">
        {notifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, orderId: null })}
        onConfirm={confirmDeleteOrder}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
      {/* Order Details Sidebar */}
      {showOrderDetails && selectedOrder && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => {
              setShowOrderDetails(false);
              setTimeout(() => setSelectedOrder(null), 300);
            }}
          ></div>

          {/* Sidebar Panel */}
          <div
            className={`fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 translate-x-0`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => {
                    setShowOrderDetails(false);
                    setTimeout(() => setSelectedOrder(null), 300);
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] text-white p-6 rounded-lg">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">
                        Order #{selectedOrder.orderNo}
                      </h3>
                      {selectedOrder.custOrderNo && (
                        <p className="text-blue-100 text-sm">
                          Customer Order: <span className="font-semibold">{selectedOrder.custOrderNo}</span>
                        </p>
                      )}
                      {selectedOrder.tripNo && (
                        <p className="text-blue-100 text-sm mt-1">
                          Trip: <span className="font-semibold">{selectedOrder.tripNo}</span>
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}
                      style={getStatusStyle(selectedOrder.status)}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                {/* Order Information */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                    <Package size={20} className="text-blue-600" />
                    Order Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Order Number</p>
                      <p className="font-medium text-gray-900">{selectedOrder.orderNo}</p>
                    </div>
                    {selectedOrder.custOrderNo && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Customer Order Number</p>
                        <p className="font-medium text-gray-900">{selectedOrder.custOrderNo}</p>
                      </div>
                    )}
                    {selectedOrder.orderDate && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Order Date</p>
                        <p className="font-medium text-gray-900">{selectedOrder.orderDate}</p>
                      </div>
                    )}
                    {selectedOrder.orderType && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Order Type</p>
                        <p className="font-medium text-gray-900">{selectedOrder.orderType}</p>
                      </div>
                    )}
                    {selectedOrder.totalItems !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total Items</p>
                        <p className="font-medium text-gray-900">{selectedOrder.totalItems}</p>
                      </div>
                    )}
                    {selectedOrder.companyName && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Company Name</p>
                        <p className="font-medium text-gray-900">{selectedOrder.companyName}</p>
                      </div>
                    )}
                    {selectedOrder.customerName && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Customer Name</p>
                        <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Details */}
                {selectedOrder.totalAmount && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                      <DollarSign size={20} className="text-blue-600" />
                      Financial Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                        <p className="font-bold text-2xl text-blue-700">
                          {selectedOrder.currency || 'CAD'} {selectedOrder.totalAmount}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pickup Information */}
                {(selectedOrder.pickupDate || selectedOrder.pickupLocation || selectedOrder.pickupRefNo) && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                      <Route size={20} className="text-blue-600" />
                      Pickup Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOrder.pickupDate && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Pickup Date</p>
                          <p className="font-medium text-gray-900">{selectedOrder.pickupDate}</p>
                        </div>
                      )}
                      {selectedOrder.pickupLocation && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                            <Route size={14} className="text-blue-600" />
                            Pickup Location
                          </p>
                          <p className="font-medium text-gray-900">{selectedOrder.pickupLocation}</p>
                        </div>
                      )}
                      {selectedOrder.pickupRefNo && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Reference Number</p>
                          <p className="font-medium text-gray-900">{selectedOrder.pickupRefNo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Information */}
                {(selectedOrder.deliveryDate || selectedOrder.deliveryLocation || selectedOrder.deliveryRefNo) && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                      <Route size={20} className="text-green-600" />
                      Delivery Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOrder.deliveryDate && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Delivery Date</p>
                          <p className="font-medium text-gray-900">{selectedOrder.deliveryDate}</p>
                        </div>
                      )}
                      {selectedOrder.deliveryLocation && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                            <Route size={14} className="text-green-600" />
                            Delivery Location
                          </p>
                          <p className="font-medium text-gray-900">{selectedOrder.deliveryLocation}</p>
                        </div>
                      )}
                      {selectedOrder.deliveryRefNo && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Reference Number</p>
                          <p className="font-medium text-gray-900">{selectedOrder.deliveryRefNo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Driver & Vehicle Information */}
                {(selectedOrder.driver || selectedOrder.truckNo || selectedOrder.trailerNo) && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                      <Truck size={20} className="text-blue-600" />
                      Driver & Vehicle Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOrder.driver && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Driver</p>
                          <p className="font-medium text-gray-900">{selectedOrder.driver}</p>
                        </div>
                      )}
                      {selectedOrder.truckNo && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Truck Number</p>
                          <p className="font-medium text-gray-900">{selectedOrder.truckNo}</p>
                        </div>
                      )}
                      {selectedOrder.trailerNo && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Trailer Number</p>
                          <p className="font-medium text-gray-900">{selectedOrder.trailerNo}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                  <button
                    onClick={() => {
                      setShowOrderDetails(false);
                      setTimeout(() => setSelectedOrder(null), 300);
                    }}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditOrder(selectedOrder);
                      setShowOrderDetails(false);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#4A90E2] to-[#357ABD] !text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <Edit size={18} />
                    Edit Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {sidebarOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/50"
              style={{ zIndex: 99999 }}
              onClick={() => setSidebarOpen(false)}
            />
            <div
              className="fixed top-0 right-0 h-screen w-full max-w-5xl bg-white"
              style={{ zIndex: 100000 }}
            >
              <NewOrderSidebar
                order={editingOrder}
                onClose={() => {
                  setSidebarOpen(false);
                  setEditingOrder(null);
                }}
                onSave={handleSaveOrder}
              />
            </div>
          </>,
          document.body
        )
      }


    </div>
  );
};

export default OrderList;
