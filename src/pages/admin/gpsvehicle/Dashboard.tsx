import { useState, useEffect } from "react";
import { Loader2, Calendar, TrendingUp, MapPin, Truck, User, Package } from "lucide-react";
import { getGpsVehicleDashboardStats, getDispatcherDashboard } from "../../../axios/api/distapcher";
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

// Static data for deliveries today
const staticDeliveriesToday = [
  {
    id: "DEL001",
    orderNumber: "ORD-001",
    customerName: "ABC Logistics",
    deliveryLocation: "Winnipeg, MB",
    deliveryTime: "10:00 AM",
    status: "scheduled",
    driverName: "John Doe",
    truckPlate: "ABC-123",
    items: 12,
  },
  {
    id: "DEL002",
    orderNumber: "ORD-002",
    customerName: "XYZ Transport",
    deliveryLocation: "Calgary, AB",
    deliveryTime: "2:00 PM",
    status: "in transit",
    driverName: "Jane Smith",
    truckPlate: "DEF-456",
    items: 8,
  },
  {
    id: "DEL003",
    orderNumber: "ORD-003",
    customerName: "Global Shipping",
    deliveryLocation: "Toronto, ON",
    deliveryTime: "9:00 AM",
    status: "scheduled",
    driverName: "Bob Johnson",
    truckPlate: "GHI-789",
    items: 15,
  },
  {
    id: "DEL004",
    orderNumber: "ORD-004",
    customerName: "Fast Delivery Co",
    deliveryLocation: "Edmonton, AB",
    deliveryTime: "1:30 PM",
    status: "scheduled",
    driverName: "Alice Williams",
    truckPlate: "JKL-012",
    items: 6,
  },
];

// Static data for pickups tomorrow
const staticPickupsTomorrow = [
  {
    id: "PICK001",
    orderNumber: "ORD-101",
    customerName: "Premium Logistics",
    pickupLocation: "Vancouver, BC",
    pickupTime: "9:00 AM",
    status: "scheduled",
    driverName: "Mike Brown",
    truckPlate: "MNO-345",
    items: 20,
  },
  {
    id: "PICK002",
    orderNumber: "ORD-102",
    customerName: "Express Transport",
    pickupLocation: "Montreal, QC",
    pickupTime: "1:00 PM",
    status: "scheduled",
    driverName: "Sarah Davis",
    truckPlate: "PQR-678",
    items: 10,
  },
  {
    id: "PICK003",
    orderNumber: "ORD-103",
    customerName: "Swift Shipping",
    pickupLocation: "Ottawa, ON",
    pickupTime: "11:00 AM",
    status: "scheduled",
    driverName: "Tom Wilson",
    truckPlate: "STU-901",
    items: 14,
  },
  {
    id: "PICK004",
    orderNumber: "ORD-104",
    customerName: "Reliable Freight",
    pickupLocation: "Halifax, NS",
    pickupTime: "3:00 PM",
    status: "scheduled",
    driverName: "Emma Taylor",
    truckPlate: "VWX-234",
    items: 7,
  },
];

const Dashboard = () => {
  const userRole = getUserRole();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setFleetUnits] = useState<FleetUnit[]>([]);
  const [, setFleetLoading] = useState(false);
  const [, setFleetError] = useState<string | null>(null);
  const [deliveriesToday, setDeliveriesToday] = useState(0);
  const [pickupsToday, setPickupsToday] = useState(0);

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
        const [gpsRes, dispatcherRes] = await Promise.all([
          getGpsVehicleDashboardStats(),
          getDispatcherDashboard()
        ]);
        
        if (gpsRes.success) {
          setDashboardData(gpsRes.data);
        }
        
        if (dispatcherRes.success && dispatcherRes.data) {
          setDeliveriesToday(dispatcherRes.data.todayTrips ?? 0);
          setPickupsToday(dispatcherRes.data.todayTrips ?? 0);
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
              onClick={scrollToPickups}
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
                  {staticDeliveriesToday.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No deliveries scheduled for today
                      </td>
                    </tr>
                  ) : (
                    staticDeliveriesToday.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{delivery.orderNumber}</div>
                          <div className="text-xs text-gray-500">ID: {delivery.id}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{delivery.customerName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            {delivery.deliveryLocation}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{delivery.deliveryTime}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-1 text-gray-400" />
                            {delivery.driverName}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Truck className="w-4 h-4 mr-1 text-gray-400" />
                            {delivery.truckPlate}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{delivery.items}</div>
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
                  {staticPickupsTomorrow.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No pickups scheduled for tomorrow
                      </td>
                    </tr>
                  ) : (
                    staticPickupsTomorrow.map((pickup) => (
                      <tr key={pickup.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{pickup.orderNumber}</div>
                          <div className="text-xs text-gray-500">ID: {pickup.id}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pickup.customerName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            {pickup.pickupLocation}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pickup.pickupTime}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-1 text-gray-400" />
                            {pickup.driverName}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Truck className="w-4 h-4 mr-1 text-gray-400" />
                            {pickup.truckPlate}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pickup.items}</div>
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