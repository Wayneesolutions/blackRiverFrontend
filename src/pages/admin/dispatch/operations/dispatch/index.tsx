import { useState, useEffect } from "react";
import { 
  FaTruck, FaUpload, FaCalendarAlt, FaMapMarkerAlt, FaEye
} from 'react-icons/fa';
import NewLoad from "../../NewLoad";
import StepTracker from "../../../../../components/dispatch/StepTracker";

interface Load {
  _id: string;
  loadNumber?: string;
  orderNumber?: string;
  customer?: string;
  customerName?: string;
  rate?: number;
  amount?: number;
  status: 'available' | 'planned' | 'assigned' | 'in-delivery' | 'delivered' | 'paid';
  assignedDriver?: string;
  assignedTruck?: string;
  assignedTrailer?: string;
  plannedDate?: string;
  deliveryDate?: string;
  documents?: {
    bol?: boolean;
    billOfSale?: boolean;
    pod?: boolean;
  };
  route?: {
    selectPickup?: { place?: string };
    selectDropOff?: { place?: string };
  };
  shipDate?: string;
  shipTime?: string;
  receiveDate?: string;
  receiveTime?: string;
  shipperCity?: string;
  shipperState?: string;
  receiverCity?: string;
  receiverState?: string;
}

const Index = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = () => {
    setLoading(true);
    // Static mock data - focusing on planned loads
    const mockLoads: Load[] = [
      {
        _id: '1',
        loadNumber: 'L-001',
        orderNumber: 'ORD-001',
        customer: 'Black River Logistics',
        customerName: 'Black River Logistics',
        amount: 2500,
        rate: 2500,
        status: 'planned',
        documents: { bol: false, billOfSale: false, pod: false },
        route: { selectPickup: { place: 'Toronto, ON' }, selectDropOff: { place: 'Montreal, QC' } },
        shipperCity: 'Toronto',
        shipperState: 'ON',
        receiverCity: 'Montreal',
        receiverState: 'QC',
        shipDate: '2024-01-25',
        shipTime: '08:00',
        receiveDate: '2024-01-26',
        receiveTime: '14:00'
      },
      {
        _id: '2',
        loadNumber: 'L-002',
        orderNumber: 'ORD-002',
        customer: '3 Rivers Logistics',
        customerName: '3 Rivers Logistics',
        amount: 3200,
        rate: 3200,
        status: 'planned',
        documents: { bol: false, billOfSale: false, pod: false },
        route: { selectPickup: { place: 'Vancouver, BC' }, selectDropOff: { place: 'Calgary, AB' } },
        shipperCity: 'Vancouver',
        shipperState: 'BC',
        receiverCity: 'Calgary',
        receiverState: 'AB',
        shipDate: '2024-01-27',
        shipTime: '09:00',
        receiveDate: '2024-01-28',
        receiveTime: '16:00'
      },
      {
        _id: '3',
        loadNumber: 'L-003',
        orderNumber: 'ORD-003',
        customer: 'Tech Freight',
        customerName: 'Tech Freight',
        amount: 1800,
        rate: 1800,
        status: 'planned',
        documents: { bol: false, billOfSale: false, pod: false },
        route: { selectPickup: { place: 'Chicago, IL' }, selectDropOff: { place: 'Detroit, MI' } },
        shipperCity: 'Chicago',
        shipperState: 'IL',
        receiverCity: 'Detroit',
        receiverState: 'MI',
        shipDate: '2024-01-26',
        shipTime: '10:00',
        receiveDate: '2024-01-27',
        receiveTime: '15:00'
      },
      {
        _id: '4',
        loadNumber: 'L-004',
        orderNumber: 'ORD-004',
        customer: 'Global Transport',
        customerName: 'Global Transport',
        amount: 4500,
        rate: 4500,
        status: 'planned',
        documents: { bol: false, billOfSale: false, pod: false },
        route: { selectPickup: { place: 'New York, NY' }, selectDropOff: { place: 'Boston, MA' } },
        shipperCity: 'New York',
        shipperState: 'NY',
        receiverCity: 'Boston',
        receiverState: 'MA',
        shipDate: '2024-01-28',
        shipTime: '07:00',
        receiveDate: '2024-01-29',
        receiveTime: '13:00'
      },
      {
        _id: '5',
        loadNumber: 'L-005',
        orderNumber: 'ORD-005',
        customer: 'Express Logistics',
        customerName: 'Express Logistics',
        amount: 2900,
        rate: 2900,
        status: 'planned',
        documents: { bol: false, billOfSale: false, pod: false },
        route: { selectPickup: { place: 'Los Angeles, CA' }, selectDropOff: { place: 'San Francisco, CA' } },
        shipperCity: 'Los Angeles',
        shipperState: 'CA',
        receiverCity: 'San Francisco',
        receiverState: 'CA',
        shipDate: '2024-01-29',
        shipTime: '06:00',
        receiveDate: '2024-01-30',
        receiveTime: '12:00'
      }
    ];
    setLoads(mockLoads);
    setLoading(false);
  };

  const handleLoadAdded = () => {
    setSidebarOpen(false);
    // Add new load with status "planned"
    const newLoad: Load = {
      _id: `load-${Date.now()}`,
      loadNumber: `L-${String(loads.length + 1).padStart(3, '0')}`,
      orderNumber: `ORD-${String(loads.length + 1).padStart(3, '0')}`,
      customer: 'New Customer',
      customerName: 'New Customer',
      amount: 0,
      rate: 0,
      status: 'planned', // Always set to planned when new load is added
      documents: { bol: false, billOfSale: false, pod: false }
    };
    setLoads([...loads, newLoad]);
  };

  const handleLoadClick = (load: Load) => {
    setSelectedLoad(load);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: Load['status']) => {
    const statusConfig = {
      available: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Available' },
      planned: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Planned' },
      assigned: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Assigned' },
      'in-delivery': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Delivery' },
      delivered: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Delivered' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' }
    };

    const config = statusConfig[status] || statusConfig.available;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gray-50 p-6">
                {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Available Dispatch</h1>
          <p className="text-gray-600 mt-1">Manage planned loads - All new loads appear here with status "Planned"</p>
        </div>
                        <button
                            onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg font-medium"
                        >
          <FaUpload /> + New Load
                        </button>
                    </div>

      {/* Step Tracker */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dispatch Workflow</h3>
        <StepTracker currentStep="planned" />
                </div>

      {/* Loads Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Load #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Shipper City / State
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Ship Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Receiver City / State
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Receive Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
                                    </tr>
                                </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    <FaTruck className="mx-auto mb-3 text-gray-300" size={48} />
                    <p className="text-lg font-medium">No loads available</p>
                    <p className="text-sm">Create a new load to get started</p>
                  </td>
                </tr>
              ) : (
                loads.map((load) => (
                  <tr
                    key={load._id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => handleLoadClick(load)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FaTruck className="text-blue-600" size={16} />
                        <span className="font-semibold text-blue-600">{load.loadNumber || load._id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {load.orderNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {load.customer || load.customerName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-600 font-bold">
                        {formatCurrency(load.amount || load.rate || 0)}
                                                </span>
                                            </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(load.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <FaMapMarkerAlt className="text-red-500" size={12} />
                        <span>{load.shipperCity || load.route?.selectPickup?.place || 'N/A'}, {load.shipperState || ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FaCalendarAlt className="text-blue-500" size={12} />
                        <div>
                          <div>{formatDate(load.shipDate || '')}</div>
                          <div className="text-xs text-gray-500">{load.shipTime || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <FaMapMarkerAlt className="text-green-500" size={12} />
                        <span>{load.receiverCity || load.route?.selectDropOff?.place || 'N/A'}, {load.receiverState || ''}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FaCalendarAlt className="text-purple-500" size={12} />
                        <div>
                          <div>{formatDate(load.receiveDate || '')}</div>
                          <div className="text-xs text-gray-500">{load.receiveTime || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {load.route?.selectPickup?.place || 'N/A'} → {load.route?.selectDropOff?.place || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadClick(load);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                      >
                        <FaEye size={12} /> View Details
                      </button>
                    </td>
                                        </tr>
                ))
              )}
                                </tbody>
                            </table>
                        </div>
                    </div>

      {/* Load Details Modal */}
      {showDetailsModal && selectedLoad && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Load Details</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedLoad.loadNumber || selectedLoad._id}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLoad(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <span className="text-gray-500">✕</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Load Number</p>
                  <p className="font-semibold text-gray-800">{selectedLoad.loadNumber || selectedLoad._id}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-semibold text-gray-800">{selectedLoad.orderNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold text-gray-800">{selectedLoad.customer || selectedLoad.customerName || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-semibold text-green-600 text-lg">{formatCurrency(selectedLoad.amount || selectedLoad.rate || 0)}</p>
                </div>
              </div>

              {/* Shipping Details */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Shipping Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Shipper Location</p>
                    <p className="font-medium text-gray-800">
                      {selectedLoad.shipperCity || selectedLoad.route?.selectPickup?.place || 'N/A'}, {selectedLoad.shipperState || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ship Date</p>
                    <p className="font-medium text-gray-800">{formatDate(selectedLoad.shipDate || '')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ship Time</p>
                    <p className="font-medium text-gray-800">{selectedLoad.shipTime || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Receive Details */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Receive Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Receiver Location</p>
                    <p className="font-medium text-gray-800">
                      {selectedLoad.receiverCity || selectedLoad.route?.selectDropOff?.place || 'N/A'}, {selectedLoad.receiverState || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Receive Date</p>
                    <p className="font-medium text-gray-800">{formatDate(selectedLoad.receiveDate || '')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Receive Time</p>
                    <p className="font-medium text-gray-800">{selectedLoad.receiveTime || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Route */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Route</h4>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaMapMarkerAlt className="text-red-500" />
                  <span>{selectedLoad.route?.selectPickup?.place || 'N/A'}</span>
                  <span className="mx-2">→</span>
                  <FaMapMarkerAlt className="text-green-500" />
                  <span>{selectedLoad.route?.selectDropOff?.place || 'N/A'}</span>
                </div>
                </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-xl">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLoad(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Load Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full max-w-lg w-full sm:w-[42rem] bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <NewLoad onClose={handleLoadAdded} />
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-[9998] bg-gray-900/50 backdrop-blur-sm transition-all duration-500"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default Index;
