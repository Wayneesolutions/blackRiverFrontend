import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Truck, Users, Package, Loader2, Search, ChevronLeft, ChevronRight, Plus, Route, TrendingUp, Calendar, UserCheck, UserX, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getDispatcherDashboard,
  listDriver,
  listTrip,
  listOrder,
  getOrderById,
  updateOrder
} from "../../../../axios/api/distapcher";
import NewOrderSidebar from "./order-list/NewOrderSidebar";
import { listFleetUnits, type FleetUnitDto } from "../../../../axios/api/fleet.units";
import { getUserRole } from "../../../../utils/auth";


interface DashboardStats {
  vehicles: {
    total: number;
    active: number;
    withDriver: number;
  };
  trailers: {
    total: number;
    active: number;
    inUse: number;
  };
  drivers: {
    total: number;
    active: number;
    onShift: number;
  };
  trips: {
    total: number;
    planned: number;
    inProgress: number;
    completed: number;
    today: number;
    tomorrow: number;
  };
}

interface Driver {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  internalId?: string;
  details?: {
    vehicle?: any;
    licenceNumber?: string;
    employeeCode?: string;
  };
}

type FleetUnit = FleetUnitDto;

interface Trip {
  _id: string;
  tripNumber: string;
  driver?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  truck?: {
    _id: string;
    plateNumber?: string;
    internalId?: string;
    make?: string;
    model?: string;
  };
  trailer?: {
    _id: string;
    plateNumber?: string;
    trailerNumber?: string;
  };
  orders?: Array<{
    _id: string;
    orderNumber: string;
    customerOrderNo?: string;
    status?: string;
    customer?: any;
  }>;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  plannedStartDate?: string | null;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  notes?: string;
}

interface Order {
  id: string;
  orderNo: string;
  custOrderNo?: string;
  tripNo?: string;
  orderDate?: string;
  orderType?: string;
  totalItems?: number;
  companyName?: string;
  customerName?: string;
  pickupDate?: string;
  pickupLocation?: string;
  pickupRefNo?: string;
  deliveryDate?: string;
  deliveryLocation?: string;
  deliveryRefNo?: string;
  totalAmount?: string;
  currency?: string;
  status: string;
  driver?: string;
  coDriver?: string;
  truckNo?: string;
  trailerNo?: string;
  // Keep original fields if needed for broader compatibility, or just use the mapped ones. 
  // For this component, we only use the mapped ones.
}

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (['planned', 'dispatched'].includes(s)) return 'bg-blue-100 text-blue-800';
  if (['in-progress', 'in-delivery', 'quoted', 'confirmed'].includes(s)) return 'bg-yellow-100 text-yellow-800';
  if (['completed', 'delivered'].includes(s)) return 'bg-green-100 text-green-800';
  if (['cancelled'].includes(s)) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};



interface FeatureCard {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  bgColor: string;
  iconColor: string;
  accentColor: string;
  percentage: number;
}

const Index = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const isDispatcher = userRole === 'dispatcher';
  const basePath = isDispatcher ? '/dispatch' : '/admin/dispatch';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [, setDrivers] = useState<Driver[]>([]);
  const [, setVehicles] = useState<FleetUnit[]>([]);
  const [, setTrailers] = useState<FleetUnit[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [activeTab,] = useState<"drivers" | "vehicles" | "trailers" | "trips" | "orders">("drivers");

  // Additional dashboard metrics
  const [unassignedDrivers, setUnassignedDrivers] = useState(0);
  const [driversOnLeave, setDriversOnLeave] = useState(0);
  const [truckUtilization, setTruckUtilization] = useState(0);
  const [trailerUtilization, setTrailerUtilization] = useState(0);
  const [revenuePerMile, setRevenuePerMile] = useState(0);
  const [deliveriesToday, setDeliveriesToday] = useState(0);
  const [pickupsToday, setPickupsToday] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [operationStatusFilter, setOperationStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");


  // Refs for scrollbar synchronization
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  // Refs for trips table scrollbar synchronization
  const tripsTopScrollRef = useRef<HTMLDivElement>(null);
  const tripsBottomScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);
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
  useEffect(() => {
    if (!loading) {
      setCurrentPage(1);
      setSearchTerm("");
      setStatusFilter("");
      setOperationStatusFilter("");
      setTypeFilter("");
      fetchCurrentData();
    }
  }, [activeTab, loading]);

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
  }, [orders, loading, activeTab]);

  // Sync scroll between top and bottom scrollbars for trips table
  useEffect(() => {
    const topScroll = tripsTopScrollRef.current;
    const bottomScroll = tripsBottomScrollRef.current;

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
      const topInner = topScroll.querySelector('.trips-top-scroll-content') as HTMLElement;
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
  }, [trips, loading, activeTab]);

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const dashboardRes = await getDispatcherDashboard();

      if (dashboardRes.success && dashboardRes.data) {
        const data = dashboardRes.data;

        const totalVehicles = data.totalVehicles ?? data.truckUtilization?.total ?? 0;
        const activeVehicles = data.activeVehicles ?? data.truckUtilization?.active ?? 0;
        const totalTrailers = data.totalTrailers ?? data.trailerUtilization?.total ?? 0;
        const activeTrailers = data.activeTrailers ?? data.trailerUtilization?.active ?? 0;

        setStats({
          vehicles: {
            total: totalVehicles,
            active: activeVehicles,
            withDriver: data.vehiclesWithDriver ?? 0,
          },
          trailers: {
            total: totalTrailers,
            active: activeTrailers,
            inUse: data.trailersInUse ?? 0,
          },
          drivers: {
            total: data.totalDrivers ?? 0,
            active: data.activeDrivers ?? 0,
            onShift: data.driversOnShift ?? 0,
          },
          trips: {
            total: data.totalTrips ?? 0,
            planned: data.plannedTrips ?? 0,
            inProgress: data.inProgressTrips ?? 0,
            completed: data.completedTrips ?? 0,
            today: data.todayTrips ?? 0,
            tomorrow: data.tomorrowTrips ?? 0,
          },
        });

        // Set utilization percentages
        setTruckUtilization(data.truckUtilization?.percentage ?? 0);
        setTrailerUtilization(data.trailerUtilization?.percentage ?? 0);

        // Set revenue per mile
        setRevenuePerMile(data.revenuePerMile ?? 0);

        // Set today's trips count (for deliveries/pickups)
        setDeliveriesToday(data.todayTrips ?? 0);
        setPickupsToday(data.todayTrips ?? 0);

        // Set drivers on leave and unassigned drivers from API response
        setDriversOnLeave(data.driversOnLeave ?? 0);
        setUnassignedDrivers(data.unassignedDrivers ?? 0);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setTimeout(() => {
        fetchCurrentData();
      }, 100);
    }
  };


  const fetchDrivers = async (page: number = currentPage, search: string = searchTerm, status: string = statusFilter) => {
    try {
      const res = await listDriver({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        status: status || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      if (res.success) {
        if (res.data) {
          const driversData = Array.isArray(res.data) ? res.data : [];
          const total = res.pagination?.total || res.count || driversData.length || 0;
          setDrivers(driversData);
          setTotalItems(total);
          setTotalPages(res.pagination?.pages || Math.ceil(total / itemsPerPage) || 0);
        } else {
          setDrivers([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } else {
        setDrivers([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setDrivers([]);
      setTotalItems(0);
      setTotalPages(0);
    }
  };

  const fetchVehicles = async (_page: number = currentPage, search: string = searchTerm, status: string = statusFilter) => {
    try {
      const res = await listFleetUnits({
        search: search || undefined,
        status: status === "Active" || status === "Inactive" ? status.toLowerCase() as "active" | "inactive" : undefined,
        category: "trucks"
      });
      if (res.success && res.data) {
        const vehicleData = Array.isArray(res.data) ? res.data : [];
        const total = vehicleData.length || 0;
        setVehicles(vehicleData);
        setTotalItems(total);
        setTotalPages(1);
      } else {
        setVehicles([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setVehicles([]);
      setTotalItems(0);
      setTotalPages(0);
    }
  };

  const fetchTrailers = async (_page: number = currentPage, search: string = searchTerm, status: string = statusFilter, operationStatus: string = operationStatusFilter, type: string = typeFilter) => {
    try {
      const res = await listFleetUnits({
        search: search || undefined,
        status: status === "Active" || status === "Inactive" ? status.toLowerCase() as "active" | "inactive" : undefined,
        category: "trailers"
      });
      if (res.success && res.data) {
        let trailerData = Array.isArray(res.data) ? res.data : [];

        if (operationStatus) {
          trailerData = trailerData.filter((t: FleetUnit) =>
            t.operationStatus?.toLowerCase() === operationStatus.toLowerCase()
          );
        }

        if (type) {
          trailerData = trailerData.filter((t: FleetUnit) =>
            t.trailerType?.toLowerCase() === type.toLowerCase() ||
            t.unitType?.toLowerCase().includes(type.toLowerCase())
          );
        }

        const total = trailerData.length || 0;
        setTrailers(trailerData);
        setTotalItems(total);
        setTotalPages(1);
      } else {
        setTrailers([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching trailers:", error);
      setTrailers([]);
      setTotalItems(0);
      setTotalPages(0);
    }
  };
  const fetchOrders = async () => {
    // Don't set global loading state to avoid infinite loop with useEffects
    try {
      const response = await listOrder({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter || undefined,
      });

      if (response?.success && response?.data) {
        const formattedOrders = response.data.map((order: any) => ({
          id: order._id,
          orderNo: order.orderNumber || order._id,
          custOrderNo: order.customerOrderNo || '',
          tripNo: order.tripNo || '',
          orderDate: order.orderDate
            ? new Date(order.orderDate).toLocaleString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
            : '',
          orderType: order.orderType || 'Regular',
          totalItems: order.noOfPackages || 0,
          companyName: 'Black River Logistics Ltd',
          customerName: order.customer?.name || 'N/A',
          pickupDate: order.pickupDate
            ? new Date(order.pickupDate).toLocaleDateString('en-US')
            : '',
          pickupLocation: order.pickupLocation || '',
          pickupRefNo: order.pickupRefNo || '',
          deliveryDate: order.deliveryDate
            ? new Date(order.deliveryDate).toLocaleDateString('en-US')
            : '',
          deliveryLocation: order.deliveryLocation || '',
          deliveryRefNo: order.deliveryRefNo || '',
          totalAmount: (order.rate || order.totalAmount || 0).toFixed(2),
          currency: order.rateCurrency || order.currency || 'CAD',
          status: order.status || 'QUOTED',
          driver: order.driver?.name || '',
          coDriver: order.coDriver?.name || '',
          truckNo:
            order.truck?.licensePlate ||
            order.truck?.unitNo ||
            order.truck?.internalId ||
            '',
          trailerNo:
            order.trailer?.licensePlate ||
            order.trailer?.unitNo ||
            '',
        }));

        setOrders(formattedOrders);
        // Set pagination info if available
        if (response.pagination) {
          setTotalItems(response.pagination.total || formattedOrders.length);
          setTotalPages(response.pagination.pages || Math.ceil((response.pagination.total || formattedOrders.length) / itemsPerPage));
        } else {
          setTotalItems(formattedOrders.length);
          setTotalPages(Math.ceil(formattedOrders.length / itemsPerPage));
        }
      } else {
        setOrders([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setTotalItems(0);
      setTotalPages(0);
    }
  };




  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchCurrentData();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]); // Removed loading from dependencies to prevent infinite loop

  useEffect(() => {
    if (loading) return;
    setCurrentPage(1);
    fetchCurrentData();
  }, [statusFilter, operationStatusFilter, typeFilter, itemsPerPage]); // Removed loading from dependencies to prevent infinite loop

  useEffect(() => {
    if (loading) return;
    fetchCurrentData();
  }, [currentPage]); // Removed loading from dependencies to prevent infinite loop

  const fetchTrips = async (page: number = currentPage, search: string = searchTerm, status: string = statusFilter) => {
    try {
      const res = await listTrip({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        status: status || undefined,
      });
      if (res.success) {
        if (res.data) {
          const tripData = Array.isArray(res.data) ? res.data : (res.data.data || []);
          const total = res.pagination?.totalItems || res.pagination?.total || res.count || tripData.length || 0;
          setTrips(tripData);
          setTotalItems(total);
          setTotalPages(res.pagination?.totalPages || res.pagination?.pages || Math.ceil(total / itemsPerPage) || 0);
        } else {
          setTrips([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } else {
        setTrips([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      setTrips([]);
      setTotalItems(0);
      setTotalPages(0);
    }
  };

  const fetchCurrentData = useCallback(() => {
    if (activeTab === "drivers") {
      fetchDrivers(currentPage, searchTerm, statusFilter);
    } else if (activeTab === "vehicles") {
      fetchVehicles(currentPage, searchTerm, statusFilter);
    } else if (activeTab === "trailers") {
      fetchTrailers(currentPage, searchTerm, statusFilter, operationStatusFilter, typeFilter);
    } else if (activeTab === "trips") {
      fetchTrips(currentPage, searchTerm, statusFilter);
    }
    // Always fetch orders regardless of active tab
    fetchOrders();
  }, [activeTab, currentPage, searchTerm, statusFilter, operationStatusFilter, typeFilter, itemsPerPage]);



  const filteredOrders = orders.filter(order => {
    if (!orderSearchTerm) return true;
    const search = orderSearchTerm.toLowerCase();
    return (
      order.orderNo?.toLowerCase().includes(search) ||
      order.custOrderNo?.toLowerCase().includes(search) ||
      order.customerName?.toLowerCase().includes(search) ||
      order.companyName?.toLowerCase().includes(search) ||
      order.tripNo?.toLowerCase().includes(search) ||
      order.driver?.toLowerCase().includes(search) ||
      order.truckNo?.toLowerCase().includes(search) ||
      order.trailerNo?.toLowerCase().includes(search)
    );
  });

  // Build feature cards
  const features: FeatureCard[] = [
    {
      id: "vehicles",
      title: "Total Vehicles",
      value: stats?.vehicles.total.toString() || "0",
      subtitle: `Active: ${stats?.vehicles.active || 0} | With Driver: ${stats?.vehicles.withDriver || 0}`,
      icon: Truck,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      accentColor: "bg-blue-600",
      percentage: stats?.vehicles.total ? Math.min(100, (stats.vehicles.active / stats.vehicles.total) * 100) : 0,
    },
    {
      id: "drivers",
      title: "Total Drivers",
      value: stats?.drivers.total.toString() || "0",
      subtitle: `Active: ${stats?.drivers.active || 0} | On Shift: ${stats?.drivers.onShift || 0}`,
      icon: Users,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      accentColor: "bg-green-600",
      percentage: stats?.drivers.total ? Math.min(100, (stats.drivers.active / stats.drivers.total) * 100) : 0,
    },
    {
      id: "trailers",
      title: "Total Trailers",
      value: stats?.trailers.total.toString() || "0",
      subtitle: `Active: ${stats?.trailers.active || 0} | In Use: ${stats?.trailers.inUse || 0}`,
      icon: Package,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      accentColor: "bg-purple-600",
      percentage: stats?.trailers.total ? Math.min(100, (stats.trailers.active / stats.trailers.total) * 100) : 0,
    },
    {
      id: "trips",
      title: "Total Trips",
      value: stats?.trips.total.toString() || "0",
      subtitle: `Planned: ${stats?.trips.planned || 0} | In Progress: ${stats?.trips.inProgress || 0} | Completed: ${stats?.trips.completed || 0}`,
      icon: Route,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      accentColor: "bg-orange-600",
      percentage: stats?.trips.total ? Math.min(100, ((stats.trips.inProgress + stats.trips.completed) / stats.trips.total) * 100) : 0,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EDF8FF' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#42aeec] mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>
        <div className="relative w-full mx-auto">
          {/* Gradient band */}
          <div
            className="absolute inset-x-0 top-0"
            style={{
              background: `linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)`,
              height: '101px'
            }}
            aria-hidden="true"
          />

          {/* Main content */}
          <div className="relative z-10 px-4 pt-3 pb-6">
            {/* Header Section */}
            <div className="mb-4 relative z-10">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">Overview</h1>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-xs">Dispatch Dashboard</span>
                </div>
              </div>
            </div>


            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 -mt-2 mb-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    onClick={() => navigate(`${basePath}/${feature.id === 'vehicles' || feature.id === 'trailers' ? 'fleets' : feature.id}`)}
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      {/* Left side content */}
                      <div className="flex-1">

                        <h3 className="text-sm font-bold text-gray-900 mb-1">
                          {feature.title}
                        </h3>

                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-xl font-bold text-gray-900">{feature.value}</span>
                        </div>

                        <p className="text-xs text-gray-400">{feature.subtitle}</p>
                      </div>

                      {/* Right side icon */}
                      <div className={`${feature.bgColor} rounded-lg p-2 shadow-sm`}>
                        <Icon className={feature.iconColor} size={21} strokeWidth={2} />
                      </div>
                    </div>


                  </div>
                );
              })}
            </div>

            {/* Additional Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* Truck Utilization */}
              <div
                onClick={() => navigate(`${basePath}/utilization`)}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Truck Utilization</h3>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xl font-bold text-gray-900">{truckUtilization}%</span>
                    </div>
                    <p className="text-xs text-gray-400">Active trucks in use</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 shadow-sm">
                    <Truck className="text-blue-600" size={21} strokeWidth={2} />
                  </div>
                </div>
              </div>

              {/* Trailer Utilization */}
              <div
                onClick={() => navigate(`${basePath}/utilization`)}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Trailer Utilization</h3>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xl font-bold text-gray-900">{trailerUtilization}%</span>
                    </div>
                    <p className="text-xs text-gray-400">Active trailers in use</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 shadow-sm">
                    <Package className="text-purple-600" size={21} strokeWidth={2} />
                  </div>
                </div>
              </div>

              {/* Revenue Per Mile */}
              <div
                onClick={() => navigate(`${basePath}/revenue-per-mile`)}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Revenue Per Mile</h3>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xl font-bold text-gray-900">${revenuePerMile.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-400">Average revenue per mile</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 shadow-sm">
                    <DollarSign className="text-green-600" size={21} strokeWidth={2} />
                  </div>
                </div>
              </div>

              {/* Deliveries Today */}
              <div
                onClick={() => navigate(`${basePath}/deliveries`)}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Deliveries Today</h3>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xl font-bold text-gray-900">{deliveriesToday}</span>
                    </div>
                    <p className="text-xs text-gray-400">Scheduled for today</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2 shadow-sm">
                    <Calendar className="text-orange-600" size={21} strokeWidth={2} />
                  </div>
                </div>
              </div>

              {/* Pickups Today */}
              <div
                onClick={() => navigate(`${basePath}/pickups`)}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Pickups Today</h3>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xl font-bold text-gray-900">{pickupsToday}</span>
                    </div>
                    <p className="text-xs text-gray-400">Scheduled for today</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-2 shadow-sm">
                    <TrendingUp className="text-yellow-600" size={21} strokeWidth={2} />
                  </div>
                </div>
              </div>

              {/* Unassigned Drivers */}
              <div
                onClick={() => navigate(`${basePath}/drivers?filter=unassigned`)}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Unassigned Drivers</h3>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xl font-bold text-gray-900">{unassignedDrivers}</span>
                    </div>
                    <p className="text-xs text-gray-400">Available for assignment</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 shadow-sm">
                    <UserX className="text-red-600" size={21} strokeWidth={2} />
                  </div>
                </div>
              </div>

              {/* Drivers on Leave */}
              <div
                onClick={() => navigate(`${basePath}/drivers-on-leave`)}
                className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Drivers on Leave</h3>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xl font-bold text-gray-900">{driversOnLeave}</span>
                    </div>
                    <p className="text-xs text-gray-400">Currently on leave</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-2 shadow-sm">
                    <UserCheck className="text-indigo-600" size={21} strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>


            {/* Orders Table Section - Below Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-4">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
                <button
                  onClick={() => {
                    setEditingOrder(null);
                    setSidebarOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Add Order
                </button>
              </div>

              {/* Search and Filter Bar for Orders */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Orders Table */}
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
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Order Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Payment
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
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Truck#/Trailer#
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                          No Orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={async () => {
                            try {
                              // Fetch full order data
                              const fullOrderResponse = await getOrderById(order.id);
                              if (fullOrderResponse?.success && fullOrderResponse?.data) {
                                setEditingOrder(fullOrderResponse.data);
                                setSidebarOpen(true);
                              } else {
                                console.error('Failed to fetch order details');
                              }
                            } catch (error) {
                              console.error('Error fetching order:', error);
                            }
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order.custOrderNo || order.orderNo}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.orderDate}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={order.paymentStatus || 'PENDING'}
                              onChange={async (e) => {
                                const newPaymentStatus = e.target.value;
                                try {
                                  const res = await updateOrder(order.id, { paymentStatus: newPaymentStatus });
                                  if (res?.success) {
                                    fetchOrders(); // Refresh orders to show updated status
                                  } else {
                                    console.error('Failed to update payment status');
                                  }
                                } catch (err) {
                                  console.error('Error updating payment status:', err);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()} // Prevent row click from opening sidebar
                              className={`text-xs font-medium rounded-full px-2 py-1 border-0 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                order.paymentStatus === 'PENDING' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                  order.paymentStatus === 'OVERDUE' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                    'bg-gray-50 text-gray-600 ring-gray-500/10'
                                }`}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PAID">Paid</option>
                              <option value="OVERDUE">Overdue</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.companyName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customerName}
                          </td>
                          <td className="px-6 py-4" style={{ maxWidth: '300px', minWidth: '200px' }}>
                            {(() => {
                              const pickupLoc = extractLocationString(order.pickupLocation);
                              return pickupLoc ? (
                                <div className="text-sm space-y-1">
                                  <div
                                    className="text-gray-900 break-words"
                                    style={{
                                      maxHeight: '3em',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      wordBreak: 'break-word'
                                    }}
                                    title={pickupLoc}
                                  >
                                    {pickupLoc}
                                  </div>
                                  {order.pickupRefNo && (
                                    <div className="text-gray-600 text-xs truncate" title={order.pickupRefNo}>
                                      Ref: {order.pickupRefNo}
                                    </div>
                                  )}
                                  {order.pickupDate && <div className="text-red-600 text-xs">{order.pickupDate}</div>}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4" style={{ maxWidth: '300px', minWidth: '200px' }}>
                            {(() => {
                              const deliveryLoc = extractLocationString(order.deliveryLocation);
                              return deliveryLoc ? (
                                <div className="text-sm space-y-1">
                                  <div
                                    className="text-gray-900 break-words"
                                    style={{
                                      maxHeight: '3em',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      wordBreak: 'break-word'
                                    }}
                                    title={deliveryLoc}
                                  >
                                    {deliveryLoc}
                                  </div>
                                  {order.deliveryRefNo && (
                                    <div className="text-gray-600 text-xs truncate" title={order.deliveryRefNo}>
                                      Ref: {order.deliveryRefNo}
                                    </div>
                                  )}
                                  {order.deliveryDate && <div className="text-red-600 text-xs">{order.deliveryDate}</div>}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {order.currency || 'CAD'} {order.totalAmount || (order as any).valueOfGoods || '0'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={order.status || 'QUOTED'}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                try {
                                  const res = await updateOrder(order.id, { status: newStatus });
                                  if (res?.success) {
                                    // Refresh orders
                                    fetchOrders();
                                  } else {
                                    console.error('Failed to update status');
                                  }
                                } catch (err) {
                                  console.error('Error updating status:', err);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-xs font-medium rounded-full px-2 py-1 border-0 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${order.status === 'quoted' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' :
                                order.status === 'planned' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                                  order.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                    order.status === 'delivered' ? 'bg-purple-50 text-purple-700 ring-purple-700/10' :
                                      order.status === 'in-delivery' ? 'bg-orange-50 text-orange-700 ring-orange-700/10' :
                                        order.status === 'canceled' ? 'bg-red-50 text-red-700 ring-red-700/10' :
                                          'bg-gray-50 text-gray-600 ring-gray-500/10'
                                }`}
                            >
                              <option value="planned">Planned</option>
                              <option value="quoted">Quoted</option>
                              <option value="in-delivery">In Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="completed">Completed</option>
                              <option value="canceled">Canceled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 line-clamp-1" title={order.driver || ''}>
                                <span className="text-gray-500 font-normal mr-1">Driver:</span>
                                {order.driver || "-"}
                              </span>
                              {order.coDriver && (
                                <span className="text-xs font-medium text-gray-700 mt-1 line-clamp-1" title={order.coDriver}>
                                  <span className="text-gray-500 font-normal mr-1">Co-Driver:</span>
                                  {order.coDriver}
                                </span>
                              )}
                            </div>
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Orders Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`p-2 border rounded-lg transition-colors ${currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                        }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${currentPage === pageNum
                              ? "bg-blue-600 !text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-2 border rounded-lg transition-colors ${currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                        }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
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
        </div>


      </div >
    </>
  );
};

export default Index;
