import { useState } from "react";
import { Package, Calendar, MapPin, Search, ArrowLeft, Truck, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../../../../../utils/auth";

// Static data for deliveries
const staticDeliveries = [
  {
    id: "DEL001",
    orderNumber: "ORD-001",
    customerName: "ABC Logistics",
    deliveryLocation: "Winnipeg, MB",
    deliveryDate: "2024-01-15",
    deliveryTime: "10:00 AM",
    status: "completed",
    driverName: "John Doe",
    truckPlate: "ABC-123",
    items: 12,
  },
  {
    id: "DEL002",
    orderNumber: "ORD-002",
    customerName: "XYZ Transport",
    deliveryLocation: "Calgary, AB",
    deliveryDate: "2024-01-15",
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
    deliveryDate: "2024-01-16",
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
    deliveryDate: "2024-01-16",
    deliveryTime: "1:30 PM",
    status: "scheduled",
    driverName: "Alice Williams",
    truckPlate: "JKL-012",
    items: 6,
  },
  {
    id: "DEL005",
    orderNumber: "ORD-005",
    customerName: "Premium Logistics",
    deliveryLocation: "Vancouver, BC",
    deliveryDate: "2024-01-17",
    deliveryTime: "11:00 AM",
    status: "scheduled",
    driverName: "Mike Brown",
    truckPlate: "MNO-345",
    items: 20,
  },
  {
    id: "DEL006",
    orderNumber: "ORD-006",
    customerName: "Express Transport",
    deliveryLocation: "Montreal, QC",
    deliveryDate: "2024-01-17",
    deliveryTime: "3:00 PM",
    status: "scheduled",
    driverName: "Sarah Davis",
    truckPlate: "PQR-678",
    items: 10,
  },
];

const DeliveriesPage = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const isDispatcher = userRole === 'dispatcher';
  const basePath = isDispatcher ? '/dispatch' : '/admin/dispatch';

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredDeliveries = staticDeliveries.filter((delivery) => {
    const matchesSearch =
      delivery.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.deliveryLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.driverName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "completed") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      );
    }
    if (statusLower === "in transit") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          In Transit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Scheduled
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="relative w-full mx-auto">
     

        {/* Main content */}
        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header Section */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                
                <h1 className="text-xl font-bold text-black">Deliveries</h1>
              </div>
              <div className="text-black/90 text-sm">
                Total: {staticDeliveries.length} deliveries
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search deliveries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                />
              </div>
              <div className="md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in transit">In Transit</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Deliveries Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Delivery Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Delivery Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Truck
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No deliveries found
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{delivery.orderNumber}</div>
                          <div className="text-xs text-gray-500">ID: {delivery.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{delivery.customerName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            {delivery.deliveryLocation}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            <div>
                              <div>{formatDate(delivery.deliveryDate)}</div>
                              <div className="text-xs text-gray-500">{delivery.deliveryTime}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-1 text-gray-400" />
                            {delivery.driverName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Truck className="w-4 h-4 mr-1 text-gray-400" />
                            {delivery.truckPlate}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{delivery.items}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(delivery.status)}
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
  );
};

export default DeliveriesPage;

