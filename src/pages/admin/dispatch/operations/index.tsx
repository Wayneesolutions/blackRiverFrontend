import { useState, useEffect } from "react";
import { Truck, Users, Package, Loader2, Search, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { 
  getDispatcherDashboard, 
  listDriver, 
  listVehicle, 
  listTrailers,
  listTrip
} from "../../../../axios/api/distapcher";

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

interface Vehicle {
  _id: string;
  plateNumber?: string;
  internalId?: string;
  make?: string;
  model?: string;
  year?: number;
  status?: string;
  driver?: any;
}

interface Trailer {
  _id: string;
  trailer?: string;
  type?: string;
  status?: string;
  operationStatus?: string;
  isAttached?: boolean;
}

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
  plannedStartDate: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  notes?: string;
}

const Index = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"drivers" | "vehicles" | "trailers" | "trips">("drivers");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [operationStatusFilter, setOperationStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [isAttachedFilter, setIsAttachedFilter] = useState<string>("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Initial fetch when component mounts and tab changes
  useEffect(() => {
    if (!loading) {
      setCurrentPage(1);
      setSearchTerm("");
      setStatusFilter("");
      setOperationStatusFilter("");
      setTypeFilter("");
      setIsAttachedFilter("");
      fetchCurrentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const dashboardRes = await getDispatcherDashboard();
      
      if (dashboardRes.success && dashboardRes.data) {
        const data = dashboardRes.data;
        
        // Support both nested and flat structures
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
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      // Fetch initial data for current tab after stats are loaded
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
          setDrivers(Array.isArray(res.data) ? res.data : []);
          setTotalItems(res.pagination?.total || res.count || res.data.length || 0);
          setTotalPages(res.pagination?.pages || Math.ceil((res.pagination?.total || res.count || res.data.length) / itemsPerPage) || 0);
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

  const fetchVehicles = async (page: number = currentPage, search: string = searchTerm, status: string = statusFilter) => {
    try {
      const res = await listVehicle({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        status: status || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      if (res.success && res.data) {
        const vehicleData = res.data.vehicles || res.data || [];
        setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
        setTotalItems(res.pagination?.total || res.data.count || vehicleData.length || 0);
        setTotalPages(res.pagination?.pages || Math.ceil((res.pagination?.total || vehicleData.length) / itemsPerPage) || 0);
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

  const fetchTrailers = async (page: number = currentPage, search: string = searchTerm, status: string = statusFilter, operationStatus: string = operationStatusFilter, type: string = typeFilter) => {
    try {
      const res = await listTrailers({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        status: status || undefined,
        operationStatus: operationStatus || undefined,
        type: type || undefined,
        isAttached: isAttachedFilter === "true" ? true : isAttachedFilter === "false" ? false : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      if (res.success && res.data) {
        const trailerData = res.data.data || res.data || [];
        setTrailers(Array.isArray(trailerData) ? trailerData : []);
        setTotalItems(res.pagination?.total || res.data.length || trailerData.length || 0);
        setTotalPages(res.pagination?.pages || Math.ceil((res.pagination?.total || trailerData.length) / itemsPerPage) || 0);
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

  // Handle tab change - reset pagination and filters
  const handleTabChange = (tab: "drivers" | "vehicles" | "trailers" | "trips") => {
    setActiveTab(tab);
    setSearchTerm("");
    setCurrentPage(1);
    setStatusFilter("");
    setOperationStatusFilter("");
    setTypeFilter("");
    setIsAttachedFilter("");
    setShowFilters(false);
  };

  // Handle search with debounce
  useEffect(() => {
    if (loading) return; // Don't fetch while initial loading
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
      fetchCurrentData();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, loading]);

  // Handle filter changes
  useEffect(() => {
    if (loading) return; // Don't fetch while initial loading
    setCurrentPage(1); // Reset to first page on filter change
    fetchCurrentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, operationStatusFilter, typeFilter, isAttachedFilter, itemsPerPage, loading]);

  // Handle page change
  useEffect(() => {
    if (loading) return; // Don't fetch while initial loading
    fetchCurrentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, loading]);

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
          setTrips(tripData);
          setTotalItems(res.pagination?.totalItems || res.pagination?.total || res.count || tripData.length || 0);
          setTotalPages(res.pagination?.totalPages || res.pagination?.pages || Math.ceil((res.pagination?.totalItems || res.pagination?.total || res.count || tripData.length) / itemsPerPage) || 0);
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

  const fetchCurrentData = () => {
    if (activeTab === "drivers") {
      fetchDrivers(currentPage, searchTerm, statusFilter);
    } else if (activeTab === "vehicles") {
      fetchVehicles(currentPage, searchTerm, statusFilter);
    } else if (activeTab === "trailers") {
      fetchTrailers(currentPage, searchTerm, statusFilter, operationStatusFilter, typeFilter);
    } else if (activeTab === "trips") {
      fetchTrips(currentPage, searchTerm, statusFilter);
    }
  };

  // Use data directly from API (no client-side filtering needed)
  const filteredDrivers = drivers;
  const filteredVehicles = vehicles;
  const filteredTrailers = trailers;
  const filteredTrips = trips;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of drivers, trailers, vehicles</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Vehicles Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Vehicles</h3>
            <p className="text-3xl font-bold text-gray-800">{stats?.vehicles.total || 0}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">Active:</span>
                <span className="ml-1 font-semibold text-green-600">{stats?.vehicles.active || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">With Driver:</span>
                <span className="ml-1 font-semibold text-blue-600">{stats?.vehicles.withDriver || 0}</span>
              </div>
            </div>
          </div>

          {/* Drivers Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Drivers</h3>
            <p className="text-3xl font-bold text-gray-800">{stats?.drivers.total || 0}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">Active:</span>
                <span className="ml-1 font-semibold text-green-600">{stats?.drivers.active || 0}</span>
                </div>
              <div>
                <span className="text-gray-500">On Shift:</span>
                <span className="ml-1 font-semibold text-blue-600">{stats?.drivers.onShift || 0}</span>
              </div>
            </div>
          </div>

          {/* Trailers Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Trailers</h3>
            <p className="text-3xl font-bold text-gray-800">{stats?.trailers.total || 0}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">Active:</span>
                <span className="ml-1 font-semibold text-green-600">{stats?.trailers.active || 0}</span>
          </div>
              <div>
                <span className="text-gray-500">In Use:</span>
                <span className="ml-1 font-semibold text-blue-600">{stats?.trailers.inUse || 0}</span>
            </div>
          </div>
        </div>

          {/* Trips Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Trips</h3>
            <p className="text-3xl font-bold text-gray-800">{stats?.trips.total || 0}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex gap-4">
                <div>
                  <span className="text-gray-500">Planned:</span>
                  <span className="ml-1 font-semibold text-yellow-600">{stats?.trips.planned || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">In Progress:</span>
                  <span className="ml-1 font-semibold text-blue-600">{stats?.trips.inProgress || 0}</span>
                </div>
              </div>
              <div className="flex gap-4 pt-1 border-t border-gray-200">
                <div>
                  <span className="text-gray-500">Completed:</span>
                  <span className="ml-1 font-semibold text-green-600">{stats?.trips.completed || 0}</span>
                </div>
              </div>
              <div className="flex gap-4 pt-1 border-t border-gray-200">
                <div>
                  <span className="text-gray-500">Today:</span>
                  <span className="ml-1 font-semibold text-orange-600">{stats?.trips.today || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tomorrow:</span>
                  <span className="ml-1 font-semibold text-purple-600">{stats?.trips.tomorrow || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => handleTabChange("drivers")}
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === "drivers"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Drivers ({totalItems})
              </button>
              <button
                onClick={() => handleTabChange("vehicles")}
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === "vehicles"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Vehicles ({totalItems})
              </button>
              <button
                onClick={() => handleTabChange("trailers")}
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === "trailers"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Trailers ({totalItems})
              </button>
              <button
                onClick={() => handleTabChange("trips")}
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === "trips"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Trips ({totalItems})
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
                  showFilters || statusFilter || operationStatusFilter || typeFilter || isAttachedFilter
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {(statusFilter || operationStatusFilter || typeFilter || isAttachedFilter) && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {[statusFilter, operationStatusFilter, typeFilter, isAttachedFilter].filter(Boolean).length}
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
                      setIsAttachedFilter("");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Status</option>
                        <option value="moving">Moving</option>
                        <option value="idle">Idle</option>
                        <option value="stopped">Stopped</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  )}
                  
                  {activeTab === "trips" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Status</option>
                          <option value="moving">Moving</option>
                          <option value="idle">Idle</option>
                          <option value="stopped">Stopped</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Operation Status</label>
                        <select
                          value={operationStatusFilter}
                          onChange={(e) => setOperationStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Operation Status</option>
                          <option value="in_transit">In Transit</option>
                          <option value="loading">Loading</option>
                          <option value="idle">Idle</option>
                          <option value="available">Available</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Types</option>
                          <option value="dry_van">Dry Van</option>
                          <option value="refrigerated">Refrigerated</option>
                          <option value="flatbed">Flatbed</option>
                          <option value="tanker">Tanker</option>
                          <option value="container">Container</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attached</label>
                        <select
                          value={isAttachedFilter}
                          onChange={(e) => setIsAttachedFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All</option>
                          <option value="true">Attached</option>
                          <option value="false">Not Attached</option>
                        </select>
                      </div>
                    </>
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
                      <tr key={driver._id} className="hover:bg-gray-50">
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
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              driver.status === "active"
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
                      Plate Number
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
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No vehicles found
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <tr key={vehicle._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.plateNumber || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{vehicle.internalId || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {vehicle.make && vehicle.model
                              ? `${vehicle.make} ${vehicle.model}`
                              : vehicle.make || vehicle.model || "N/A"}
              </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{vehicle.year || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vehicle.status === "moving" || vehicle.status === "idle"
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
                      <tr key={trip._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {trip.tripNumber || trip._id.slice(-8).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {trip.driver?.name || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {trip.truck?.plateNumber || trip.truck?.internalId || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {trip.trailer?.plateNumber || trip.trailer?.trailerNumber || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {trip.orders?.length || 0} order(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              trip.status === "planned"
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
                      Trailer Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operation Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attached
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTrailers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No trailers found
                      </td>
                    </tr>
                  ) : (
                    filteredTrailers.map((trailer) => (
                      <tr key={trailer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {trailer.trailer || trailer._id.slice(-8)}
            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{trailer.type || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              trailer.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {trailer.status || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              trailer.operationStatus === "in_transit" || trailer.operationStatus === "loading"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {trailer.operationStatus || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              trailer.isAttached
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {trailer.isAttached ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {(totalPages > 1 || totalItems > 0) && (
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
                  className={`p-2 border rounded-lg transition-colors ${
                    currentPage === 1
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
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
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
                  className={`p-2 border rounded-lg transition-colors ${
                    currentPage === totalPages
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
  );
};

export default Index;
