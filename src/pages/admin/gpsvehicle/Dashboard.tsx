import { useState, useEffect } from "react";
import { Loader2, Calendar, TrendingUp, MapPin, Truck, User, Package } from "lucide-react";
import { getGpsVehicleDashboardStats, getDispatcherDashboard, getTodayDeliveries, getTomorrowPickups } from "../../../axios/api/distapcher";
import { listFleetUnits } from "../../../axios/api/fleet.units";
import { getUserRole } from "../../../utils/auth";

interface FleetUnit {
  _id?: string;
  unitNo?: string;
  unitType?: string;
  makeModel?: string;
  make?: string;
  model?: string;
  vinNo?: string;
  licensePlate?: string;
  year?: string | number;
  currentOdometer?: string | number;
  status?: string;
}

interface Delivery {
  id: string;
  _id?: string;
  orderNumber: string;
  customerOrderNo?: string;
  tripNo?: string;
  customerName: string;
  deliveryLocation: string;
  deliveryDate?: string;
  deliveryTime: string;
  status: string;
  driverName: string;
  driver?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  coDriver?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  truckPlate: string;
  truck?: {
    _id: string;
    licensePlate?: string;
    internalId?: string;
    unitNumber?: string;
    make?: string;
    model?: string;
  } | null;
  trailer?: {
    _id: string;
    licensePlate?: string;
    trailerNumber?: string;
    unitNumber?: string;
  } | null;
  items: number;
}

interface Pickup {
  id: string;
  _id?: string;
  orderNumber: string;
  customerOrderNo?: string;
  tripNo?: string;
  customerName: string;
  pickupLocation: string;
  pickupDate?: string;
  pickupTime: string;
  status: string;
  driverName: string;
  driver?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  coDriver?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  truckPlate: string;
  truck?: {
    _id: string;
    licensePlate?: string;
    internalId?: string;
    unitNumber?: string;
    make?: string;
    model?: string;
  } | null;
  trailer?: {
    _id: string;
    licensePlate?: string;
    trailerNumber?: string;
    unitNumber?: string;
  } | null;
  items: number;
}

const Dashboard = () => {
  const userRole = getUserRole();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setFleetUnits] = useState<FleetUnit[]>([]);
  const [, setFleetLoading] = useState(false);
  const [, setFleetError] = useState<string | null>(null);
  const [deliveriesToday, setDeliveriesToday] = useState<Delivery[]>([]);
  const [pickupsTomorrow, setPickupsTomorrow] = useState<Pickup[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [pickupsLoading, setPickupsLoading] = useState(false);

  const scrollToDeliveries = () => {
    const element = document.getElementById('deliveries-today-table');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToPickups = () => {
    const element = document.getElementById('pickups-tomorrow-table');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [gpsRes] = await Promise.all([
          getGpsVehicleDashboardStats()
        ]);
        
        if (gpsRes.success) {
          setDashboardData(gpsRes.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchDeliveriesAndPickups = async () => {
      try {
        setDeliveriesLoading(true);
        setPickupsLoading(true);

        const [deliveriesRes, pickupsRes] = await Promise.all([
          getTodayDeliveries(),
          getTomorrowPickups()
        ]);

        if (deliveriesRes.success && deliveriesRes.data) {
          setDeliveriesToday(deliveriesRes.data || []);
        }

        if (pickupsRes.success && pickupsRes.data) {
          setPickupsTomorrow(pickupsRes.data || []);
        }
      } catch (error) {
        console.error("Error fetching deliveries and pickups:", error);
      } finally {
        setDeliveriesLoading(false);
        setPickupsLoading(false);
      }
    };

    fetchDeliveriesAndPickups();
  }, []);

  useEffect(() => {
    const fetchFleetUnits = async () => {
      try {
        setFleetLoading(true);
        setFleetError(null);
        const res = await listFleetUnits({ category: "all" });
        if (res?.success && res.data) {
          const data = res.data;
          const payload = Array.isArray(data)
            ? data
            : (typeof data === 'object' && data !== null && ('data' in data || 'units' in data))
              ? (data as any).data || (data as any).units || []
              : [];
          setFleetUnits(Array.isArray(payload) ? payload : []);
        } else {
          setFleetUnits([]);
        }
      } catch (error: any) {
        console.error("Error loading fleet units:", error);
        setFleetUnits([]);
        setFleetError(error?.response?.data?.message || "Unable to load fleet units");
      } finally {
        setFleetLoading(false);
      }
    };

    fetchFleetUnits();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "completed") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      );
    }
    if (statusLower === "in transit" || statusLower === "in progress") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {statusLower === "in transit" ? "In Transit" : "In Progress"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Scheduled
      </span>
    );
  };

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
      <div className="relative w-full mx-auto p-2">
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
              <h1 className="text-xl font-bold text-white">GPS Vehicle Tracking</h1>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-xs">Dashboard</span>
              </div>
            </div>
          </div>

          {/* Pickups Today and Deliveries Today Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 -mt-2 mb-3">
            {/* Deliveries Today */}
            <div
              onClick={scrollToDeliveries}
              className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Deliveries Today</h3>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xl font-bold text-gray-900">{deliveriesToday.length}</span>
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
              onClick={scrollToPickups}
              className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Pickups Today</h3>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xl font-bold text-gray-900">{pickupsTomorrow.length}</span>
                  </div>
                  <p className="text-xs text-gray-400">Scheduled for tomorrow</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2 shadow-sm">
                  <TrendingUp className="text-yellow-600" size={21} strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>

          {/* Deliveries Today Listing */}
          <div id="deliveries-today-table" className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Deliveries Today</h2>
              <p className="text-sm text-gray-500 mt-1">Scheduled deliveries for today</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Delivery Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Truck
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveriesLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                      </td>
                    </tr>
                  ) : deliveriesToday.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No deliveries scheduled for today
                      </td>
                    </tr>
                  ) : (
                    deliveriesToday.map((delivery) => (
                      <tr key={delivery.id || delivery._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{delivery.orderNumber || 'N/A'}</div>
                          {delivery.customerOrderNo && (
                            <div className="text-xs text-gray-500">Cust: {delivery.customerOrderNo}</div>
                          )}
                          {delivery.tripNo && (
                            <div className="text-xs text-blue-600">Trip: {delivery.tripNo}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{delivery.customerName || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-xs">{delivery.deliveryLocation || 'Location not specified'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{delivery.deliveryTime || 'Not specified'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                            <div>
                              <div>{delivery.driverName || 'Not assigned'}</div>
                              {delivery.coDriver?.name && (
                                <div className="text-xs text-gray-500">Co: {delivery.coDriver.name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center text-sm text-gray-900">
                            <Truck className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                            <div>
                              <div>{delivery.truckPlate || 'Not assigned'}</div>
                              {delivery.trailer?.licensePlate && (
                                <div className="text-xs text-gray-500">Trailer: {delivery.trailer.licensePlate}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{delivery.items || 0}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(delivery.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pickups Tomorrow Listing */}
          <div id="pickups-tomorrow-table" className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Pickups Tomorrow</h2>
              <p className="text-sm text-gray-500 mt-1">Scheduled pickups for tomorrow</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Pickup Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Truck
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pickupsLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                      </td>
                    </tr>
                  ) : pickupsTomorrow.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No pickups scheduled for tomorrow
                      </td>
                    </tr>
                  ) : (
                    pickupsTomorrow.map((pickup) => (
                      <tr key={pickup.id || pickup._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{pickup.orderNumber || 'N/A'}</div>
                          {pickup.customerOrderNo && (
                            <div className="text-xs text-gray-500">Cust: {pickup.customerOrderNo}</div>
                          )}
                          {pickup.tripNo && (
                            <div className="text-xs text-blue-600">Trip: {pickup.tripNo}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pickup.customerName || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-xs">{pickup.pickupLocation || 'Location not specified'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pickup.pickupTime || 'Not specified'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                            <div>
                              <div>{pickup.driverName || 'Not assigned'}</div>
                              {pickup.coDriver?.name && (
                                <div className="text-xs text-gray-500">Co: {pickup.coDriver.name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center text-sm text-gray-900">
                            <Truck className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                            <div>
                              <div>{pickup.truckPlate || 'Not assigned'}</div>
                              {pickup.trailer?.licensePlate && (
                                <div className="text-xs text-gray-500">Trailer: {pickup.trailer.licensePlate}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pickup.items || 0}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(pickup.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;