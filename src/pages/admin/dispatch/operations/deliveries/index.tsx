import { useState, useEffect } from "react";
import { Calendar, MapPin, Search, Truck, User, Loader2 } from "lucide-react";
import { getTodayDeliveries } from "../../../../../axios/api/distapcher";

interface Delivery {
  id: string;
  _id?: string;
  orderNumber: string;
  customerOrderNo?: string;
  tripNo?: string;
  customerName: string;
  customer?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  deliveryLocation: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryDateFull?: string | Date;
  status: string;
  orderStatus?: string;
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
  pickupLocation?: string;
  pickupDate?: string | Date;
  pickupTime?: string;
  receiver?: {
    name?: string;
    address?: string;
    phone?: string;
    contact?: string;
  } | null;
  distance?: number;
  rate?: number;
  currency?: string;
}

const DeliveriesPage = () => {

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await getTodayDeliveries();
      if (response.success && response.data) {
        setDeliveries(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (delivery.orderNumber || '').toLowerCase().includes(searchLower) ||
      (delivery.customerOrderNo || '').toLowerCase().includes(searchLower) ||
      (delivery.customerName || '').toLowerCase().includes(searchLower) ||
      (delivery.deliveryLocation || '').toLowerCase().includes(searchLower) ||
      (delivery.driverName || '').toLowerCase().includes(searchLower) ||
      (delivery.truckPlate || '').toLowerCase().includes(searchLower) ||
      (delivery.receiver?.name || '').toLowerCase().includes(searchLower);

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
                Total: {deliveries.length} deliveries
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
                <div className="text-xs text-gray-500 mt-1">
                  Showing deliveries for today
                </div>
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
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                          <span className="ml-2 text-gray-500">Loading deliveries...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No deliveries found for today
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{delivery.orderNumber || 'N/A'}</div>
                          {delivery.customerOrderNo && (
                            <div className="text-xs text-gray-500">Cust: {delivery.customerOrderNo}</div>
                          )}
                          {delivery.tripNo && (
                            <div className="text-xs text-blue-600">Trip: {delivery.tripNo}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{delivery.customerName || 'N/A'}</div>
                          {delivery.receiver?.name && delivery.receiver.name !== delivery.customerName && (
                            <div className="text-xs text-gray-500">Receiver: {delivery.receiver.name}</div>
                          )}
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
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4">
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

