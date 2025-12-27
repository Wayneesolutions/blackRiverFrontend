import { useState } from "react";
import { Package, Calendar, MapPin, Search, ArrowLeft, Truck, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../../../../../utils/auth";

// Static data for pickups
const staticPickups = [
  {
    id: "PICK001",
    orderNumber: "ORD-001",
    customerName: "ABC Logistics",
    pickupLocation: "Winnipeg, MB",
    pickupDate: "2024-01-15",
    pickupTime: "8:00 AM",
    status: "completed",
    driverName: "John Doe",
    truckPlate: "ABC-123",
    items: 12,
  },
  {
    id: "PICK002",
    orderNumber: "ORD-002",
    customerName: "XYZ Transport",
    pickupLocation: "Calgary, AB",
    pickupDate: "2024-01-15",
    pickupTime: "12:00 PM",
    status: "in progress",
    driverName: "Jane Smith",
    truckPlate: "DEF-456",
    items: 8,
  },
  {
    id: "PICK003",
    orderNumber: "ORD-003",
    customerName: "Global Shipping",
    pickupLocation: "Toronto, ON",
    pickupDate: "2024-01-16",
    pickupTime: "7:00 AM",
    status: "scheduled",
    driverName: "Bob Johnson",
    truckPlate: "GHI-789",
    items: 15,
  },
  {
    id: "PICK004",
    orderNumber: "ORD-004",
    customerName: "Fast Delivery Co",
    pickupLocation: "Edmonton, AB",
    pickupDate: "2024-01-16",
    pickupTime: "11:30 AM",
    status: "scheduled",
    driverName: "Alice Williams",
    truckPlate: "JKL-012",
    items: 6,
  },
  {
    id: "PICK005",
    orderNumber: "ORD-005",
    customerName: "Premium Logistics",
    pickupLocation: "Vancouver, BC",
    pickupDate: "2024-01-17",
    pickupTime: "9:00 AM",
    status: "scheduled",
    driverName: "Mike Brown",
    truckPlate: "MNO-345",
    items: 20,
  },
  {
    id: "PICK006",
    orderNumber: "ORD-006",
    customerName: "Express Transport",
    pickupLocation: "Montreal, QC",
    pickupDate: "2024-01-17",
    pickupTime: "1:00 PM",
    status: "scheduled",
    driverName: "Sarah Davis",
    truckPlate: "PQR-678",
    items: 10,
  },
];

const PickupsPage = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const isDispatcher = userRole === 'dispatcher';
  const basePath = isDispatcher ? '/dispatch' : '/admin/dispatch';

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPickups = staticPickups.filter((pickup) => {
    const matchesSearch =
      pickup.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pickup.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pickup.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pickup.driverName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || pickup.status === statusFilter;

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
    if (statusLower === "in progress") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          In Progress
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
             
                <h1 className="text-xl font-bold text-black">Pickups</h1>
              </div>
              <div className="text-black/90 text-sm">
                Total: {staticPickups.length} pickups
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
                  placeholder="Search pickups..."
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
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pickups Table */}
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
                      Pickup Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Pickup Date & Time
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
                  {filteredPickups.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No pickups found
                      </td>
                    </tr>
                  ) : (
                    filteredPickups.map((pickup) => (
                      <tr key={pickup.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{pickup.orderNumber}</div>
                          <div className="text-xs text-gray-500">ID: {pickup.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pickup.customerName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            {pickup.pickupLocation}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            <div>
                              <div>{formatDate(pickup.pickupDate)}</div>
                              <div className="text-xs text-gray-500">{pickup.pickupTime}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-1 text-gray-400" />
                            {pickup.driverName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Truck className="w-4 h-4 mr-1 text-gray-400" />
                            {pickup.truckPlate}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{pickup.items}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
  );
};

export default PickupsPage;

