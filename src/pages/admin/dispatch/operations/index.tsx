import { useState, useEffect, useCallback } from "react";
import { Truck, Users, Package, Loader2, Search, ChevronLeft, ChevronRight, Filter, X, Route, TrendingUp, Calendar, UserCheck, UserX, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getDispatcherDashboard,
  listDriver,
  listTrip,
  listOrder
} from "../../../../axios/api/distapcher";
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
  truckNo?: string;
  trailerNo?: string;
  // Keep original fields if needed for broader compatibility, or just use the mapped ones. 
  // For this component, we only use the mapped ones.
}

const getStatusColor = (status: string) => {
  const s = status?.toUpperCase() || '';
  if (['COMPLETED', 'DELIVERED'].includes(s)) return 'bg-green-100 text-green-800';
  if (['PLANNED', 'DISPATCHED'].includes(s)) return 'bg-blue-100 text-blue-800';
  if (['CANCELLED'].includes(s)) return 'bg-red-100 text-red-800';
  if (['QUOTED', 'CONFIRMED'].includes(s)) return 'bg-yellow-100 text-yellow-800';
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
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<FleetUnit[]>([]);
  const [trailers, setTrailers] = useState<FleetUnit[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"drivers" | "vehicles" | "trailers" | "trips">("drivers");
  
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

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [operationStatusFilter, setOperationStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
          totalAmount: order.totalAmount?.toFixed(2) || '0.00',
          currency: order.currency || 'CAD',
          status: order.status || 'QUOTED',
          driver: order.driver?.name || '',
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


  const handleTabChange = (tab: "drivers" | "vehicles" | "trailers" | "trips") => {
    setActiveTab(tab);
    setSearchTerm("");
    setCurrentPage(1);
    setStatusFilter("");
    setOperationStatusFilter("");
    setTypeFilter("");
    setShowFilters(false);
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

  const filteredDrivers = drivers;
  const filteredVehicles = vehicles;
  const filteredTrailers = trailers;
  const filteredTrips = trips;
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
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
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
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
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
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
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
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
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
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
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
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
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
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
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

          {/* Tables Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => handleTabChange("drivers")}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === "drivers"
                    ? "text-[#42aeec] border-b-2 border-[#42aeec]"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  Drivers
                </button>
                <button
                  onClick={() => handleTabChange("vehicles")}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === "vehicles"
                    ? "text-[#42aeec] border-b-2 border-[#42aeec]"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  Vehicles
                </button>
                <button
                  onClick={() => handleTabChange("trailers")}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === "trailers"
                    ? "text-[#42aeec] border-b-2 border-[#42aeec]"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  Trailers
                </button>
                <button
                  onClick={() => handleTabChange("trips")}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === "trips"
                    ? "text-[#42aeec] border-b-2 border-[#42aeec]"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  Trips
                </button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${showFilters || statusFilter || operationStatusFilter || typeFilter
                    ? "bg-blue-50 border-[#42aeec] text-[#42aeec]"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {(statusFilter || operationStatusFilter || typeFilter) && (
                    <span className="bg-[#42aeec] text-white text-xs px-2 py-0.5 rounded-full">
                      {[statusFilter, operationStatusFilter, typeFilter].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-700">Filters</h4>
                    <button
                      onClick={() => {
                        setStatusFilter("");
                        setOperationStatusFilter("");
                        setTypeFilter("");
                      }}
                      className="text-sm text-[#42aeec] hover:text-[#1db5f5] flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {activeTab === "drivers" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    )}

                    {activeTab === "vehicles" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    )}

                    {activeTab === "trips" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="planned">Planned</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    )}

                    {activeTab === "trailers" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          >
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Operation Status</label>
                          <select
                            value={operationStatusFilter}
                            onChange={(e) => setOperationStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          >
                            <option value="">All Operation Status</option>
                            <option value="in-transit">In Transit</option>
                            <option value="available">Available</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="idle">Idle</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                          >
                            <option value="">All Types</option>
                            <option value="Dry Van">Dry Van</option>
                            <option value="Reefer Trailer">Reefer Trailer</option>
                            <option value="Flatbed">Flatbed</option>
                            <option value="Tri-Axle Trailer">Tri-Axle Trailer</option>
                            <option value="Tank Trailer">Tank Trailer</option>
                            <option value="Dump Trailer">Dump Trailer</option>
                          </select>
                        </div>
                      </>
                    )}

                    {activeTab === "orders" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="planned">Planned</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="in-delivery">In Delivery</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="quoted">Quoted</option>
                          <option value="confirmed">Confirmed</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {activeTab === "drivers" && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDrivers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No drivers found
                        </td>
                      </tr>
                    ) : (
                      filteredDrivers.map((driver) => (
                        <tr key={driver._id} className="hover:bg-blue-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{driver.name || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{driver.email || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{driver.phone || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{driver.internalId || driver._id.slice(-8)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${driver.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {driver.status || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "vehicles" && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        License Plate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Internal ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Make & Model
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVehicles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No vehicles found
                        </td>
                      </tr>
                    ) : (
                      filteredVehicles.map((vehicle) => (
                        <tr key={vehicle._id} className="hover:bg-blue-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.unitNo || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.licensePlate || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{vehicle.internalId || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {vehicle.makeModel ||
                                (vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : vehicle.make || vehicle.model) ||
                                "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{vehicle.year || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicle.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {vehicle.status || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "trips" && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trip Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Truck
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trailer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Planned Start
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTrips.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No trips found
                        </td>
                      </tr>
                    ) : (
                      filteredTrips.map((trip) => (
                        <tr key={trip._id} className="hover:bg-blue-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {trip.tripNumber || trip._id.slice(-8).toUpperCase()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {trip.driver?.name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {(trip.driver as any)?.internalId || (trip.driver as any)?.empId || trip.driver?._id.slice(-8) || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {trip.driver?.phone || ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {(trip.truck as any)?.unitNo || trip.truck?.plateNumber || trip.truck?.internalId || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(trip.truck as any)?.makeModel || `${trip.truck?.make || ''} ${trip.truck?.model || ''}`.trim() || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {trip.truck?.internalId || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {(trip.trailer as any)?.unitNo || trip.trailer?.plateNumber || trip.trailer?.trailerNumber || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(trip.trailer as any)?.unitType || (trip.trailer as any)?.trailerType || ""}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {(trip.trailer as any)?.internalId || trip.trailer?._id.slice(-8) || "N/A"} {(trip.trailer as any)?.capacity ? `• ${(trip.trailer as any).capacity}` : ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {trip.orders?.length || 0} order(s)
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trip.status === "planned"
                                ? "bg-yellow-100 text-yellow-800"
                                : trip.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : trip.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : trip.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {trip.status || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {trip.plannedStartDate
                                ? new Date(trip.plannedStartDate).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "trailers" && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        License Plate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Internal ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Operation Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTrailers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No trailers found
                        </td>
                      </tr>
                    ) : (
                      filteredTrailers.map((trailer) => (
                        <tr key={trailer._id} className="hover:bg-blue-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {trailer.unitNo || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {trailer.licensePlate || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{trailer.internalId || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{trailer.unitType || trailer.trailerType || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trailer.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {trailer.status || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trailer.operationStatus === "in-transit" || trailer.operationStatus === "loading"
                                ? "bg-blue-100 text-blue-800"
                                : trailer.operationStatus === "available"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {trailer.operationStatus || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{trailer.capacity || "N/A"}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

            </div>


            {/* Pagination */}
            {(totalPages > 1 || totalItems > 0) && activeTab !== "orders" && (
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

          {/* Orders Table Section - Below Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
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
                      <tr key={order.id} className="hover:bg-gray-50">
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
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
        </div>
      </div>
    </div>
  );
};

export default Index;
