import { useState, useEffect } from "react";
import { 
  FaTruck, FaUser, FaFilter, FaEye, FaCheck, FaTimes
} from 'react-icons/fa';
import AssignDriverTruckModal from "../../../../../components/dispatch/AssignDriverTruckModal";
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
  route?: {
    selectPickup?: { place?: string };
    selectDropOff?: { place?: string };
  };
  shipperCity?: string;
  shipperState?: string;
  receiverCity?: string;
  receiverState?: string;
}

const AllDispatch = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = () => {
    setLoading(true);
    // Static mock data - loads that need assignment
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
        route: { selectPickup: { place: 'Toronto, ON' }, selectDropOff: { place: 'Montreal, QC' } },
        shipperCity: 'Toronto',
        shipperState: 'ON',
        receiverCity: 'Montreal',
        receiverState: 'QC'
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
        route: { selectPickup: { place: 'Vancouver, BC' }, selectDropOff: { place: 'Calgary, AB' } },
        shipperCity: 'Vancouver',
        shipperState: 'BC',
        receiverCity: 'Calgary',
        receiverState: 'AB'
      },
      {
        _id: '3',
        loadNumber: 'L-003',
        orderNumber: 'ORD-003',
        customer: 'Tech Freight',
        customerName: 'Tech Freight',
        amount: 1800,
        rate: 1800,
        status: 'assigned',
        assignedDriver: 'John Doe',
        assignedTruck: 'TRK-001',
        assignedTrailer: 'TRL-001',
        plannedDate: '2024-01-20',
        route: { selectPickup: { place: 'Chicago, IL' }, selectDropOff: { place: 'Detroit, MI' } },
        shipperCity: 'Chicago',
        shipperState: 'IL',
        receiverCity: 'Detroit',
        receiverState: 'MI'
      },
      {
        _id: '4',
        loadNumber: 'L-004',
        orderNumber: 'ORD-004',
        customer: 'Global Transport',
        customerName: 'Global Transport',
        amount: 4500,
        rate: 4500,
        status: 'assigned',
        assignedDriver: 'Jane Smith',
        assignedTruck: 'TRK-002',
        plannedDate: '2024-01-21',
        route: { selectPickup: { place: 'New York, NY' }, selectDropOff: { place: 'Boston, MA' } },
        shipperCity: 'New York',
        shipperState: 'NY',
        receiverCity: 'Boston',
        receiverState: 'MA'
      }
    ];
    setLoads(mockLoads);
    setLoading(false);
  };

  const handleAssign = (loadId: string, driverId: string, truckId: string, trailerId?: string, planDate?: string) => {
    const drivers = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
      { id: '3', name: 'Mike Johnson' },
      { id: '4', name: 'Sarah Williams' }
    ];

    const trucks = [
      { id: '1', name: 'TRK-001' },
      { id: '2', name: 'TRK-002' },
      { id: '3', name: 'TRK-003' },
      { id: '4', name: 'TRK-004' }
    ];

    const trailers = [
      { id: '1', name: 'TRL-001' },
      { id: '2', name: 'TRL-002' },
      { id: '3', name: 'TRL-003' }
    ];

    const updatedLoads: Load[] = loads.map(l => 
      l._id === loadId 
        ? { 
            ...l, 
            status: 'assigned' as Load['status'],
            assignedDriver: drivers.find(d => d.id === driverId)?.name || '',
            assignedTruck: trucks.find(t => t.id === truckId)?.name || '',
            assignedTrailer: trailerId ? trailers.find(tr => tr.id === trailerId)?.name : undefined,
            plannedDate: planDate
          } 
        : l
    );
    setLoads(updatedLoads);
    setShowAssignModal(false);
    setSelectedLoad(null);
  };

  const handleLoadClick = (load: Load) => {
    setSelectedLoad(load);
    setShowAssignModal(true);
  };

  const getStatusBadge = (status: Load['status']) => {
    const statusConfig = {
      planned: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Planned' },
      assigned: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Assigned' },
      'in-delivery': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Delivery' },
    };

    const config = statusConfig[status] || statusConfig.planned;
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

  const filteredLoads = statusFilter === 'all' 
    ? loads 
    : loads.filter(load => load.status === statusFilter);

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
          <h1 className="text-3xl font-bold text-gray-800">All Dispatch</h1>
          <p className="text-gray-600 mt-1">Assign drivers and trucks to loads</p>
        </div>
        <div className="flex items-center gap-3">
          <FaFilter className="text-gray-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="planned">Planned</option>
            <option value="assigned">Assigned</option>
          </select>
        </div>
      </div>

      {/* Step Tracker */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dispatch Workflow</h3>
        <StepTracker currentStep="assigned" />
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
                  Workflow Progress
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Driver / Truck / Trailer
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
              {filteredLoads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <FaTruck className="mx-auto mb-3 text-gray-300" size={48} />
                    <p className="text-lg font-medium">No loads available</p>
                  </td>
                </tr>
              ) : (
                filteredLoads.map((load) => (
                  <tr
                    key={load._id}
                    className="hover:bg-blue-50 transition-colors"
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
                    <td className="px-6 py-4">
                      <StepTracker 
                        currentStep={load.status === 'planned' ? 'planned' : 'assigned'} 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {load.assignedDriver ? (
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1 text-gray-700">
                            <FaUser size={12} />
                            <span>{load.assignedDriver}</span>
                          </div>
                          {load.assignedTruck && (
                            <div className="flex items-center gap-1 text-gray-700">
                              <FaTruck size={12} />
                              <span>{load.assignedTruck}</span>
                              {load.assignedTrailer && <span className="text-gray-500">/ {load.assignedTrailer}</span>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {load.route?.selectPickup?.place || 'N/A'} → {load.route?.selectDropOff?.place || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleLoadClick(load)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                      >
                        {load.status === 'planned' ? (
                          <>
                            <FaCheck size={12} /> Assign Driver & Truck
                          </>
                        ) : (
                          <>
                            <FaEye size={12} /> View / Edit
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedLoad && (
        <AssignDriverTruckModal
          load={selectedLoad}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedLoad(null);
          }}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
};

export default AllDispatch;

