import { useState } from 'react';
import { FaUser, FaTruck, FaTrailer, FaCalendarAlt, FaTimes, FaCheck } from 'react-icons/fa';
import StepTracker from './StepTracker';

interface Load {
  _id: string;
  loadNumber?: string;
  orderNumber?: string;
  customer?: string;
  customerName?: string;
  amount?: number;
  rate?: number;
  status: 'available' | 'planned' | 'assigned' | 'in-delivery' | 'delivered' | 'paid';
  route?: {
    selectPickup?: { place?: string };
    selectDropOff?: { place?: string };
  };
}

interface AssignDriverTruckModalProps {
  load: Load;
  onClose: () => void;
  onAssign: (loadId: string, driver: string, truck: string, trailer?: string, planDate?: string) => void;
}

const AssignDriverTruckModal: React.FC<AssignDriverTruckModalProps> = ({ load, onClose, onAssign }) => {
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedTruck, setSelectedTruck] = useState("");
  const [selectedTrailer, setSelectedTrailer] = useState("");
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock data - in production, fetch from API
  const drivers = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Mike Johnson' },
    { id: '4', name: 'Sarah Williams' }
  ];

  const trucks = [
    { id: '1', name: 'TRK-001', type: 'Dry Van' },
    { id: '2', name: 'TRK-002', type: 'Reefer' },
    { id: '3', name: 'TRK-003', type: 'Flatbed' },
    { id: '4', name: 'TRK-004', type: 'Dry Van' }
  ];

  const trailers = [
    { id: '1', name: 'TRL-001' },
    { id: '2', name: 'TRL-002' },
    { id: '3', name: 'TRL-003' }
  ];

  const handleAssign = () => {
    if (!selectedDriver || !selectedTruck) {
      alert('Please select both driver and truck');
      return;
    }

    onAssign(load._id, selectedDriver, selectedTruck, selectedTrailer || undefined, planDate);
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Assign Driver & Truck
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Load: {load.loadNumber || load._id} | Order: {load.orderNumber || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-500" size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step Tracker */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Workflow Progress
            </label>
            <StepTracker currentStep={load.status === 'planned' ? 'planned' : 'assigned'} />
          </div>

          {/* Load Details Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Load Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 font-medium">{load.customer || load.customerName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-bold text-green-600">
                  {formatCurrency(load.amount || load.rate || 0)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Route:</span>
                <span className="ml-2">
                  {load.route?.selectPickup?.place || 'N/A'} → {load.route?.selectDropOff?.place || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Assignment Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaUser className="inline mr-2 text-blue-600" />
                Select Driver <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose Driver</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaTruck className="inline mr-2 text-purple-600" />
                Select Truck <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTruck}
                onChange={(e) => setSelectedTruck(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose Truck</option>
                {trucks.map(truck => (
                  <option key={truck.id} value={truck.id}>
                    {truck.name} - {truck.type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaTrailer className="inline mr-2 text-green-600" />
                Select Trailer (Optional)
              </label>
              <select
                value={selectedTrailer}
                onChange={(e) => setSelectedTrailer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No Trailer</option>
                {trailers.map(trailer => (
                  <option key={trailer.id} value={trailer.id}>{trailer.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-2 text-orange-600" />
                Plan Date
              </label>
              <input
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Selected Assignment Preview */}
          {(selectedDriver || selectedTruck) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-semibold text-green-800 mb-2">Assignment Preview:</h5>
              <div className="space-y-2 text-sm">
                {selectedDriver && (
                  <div className="flex items-center gap-2">
                    <FaUser className="text-green-600" />
                    <span>Driver: <strong>{drivers.find(d => d.id === selectedDriver)?.name}</strong></span>
                  </div>
                )}
                {selectedTruck && (
                  <div className="flex items-center gap-2">
                    <FaTruck className="text-green-600" />
                    <span>Truck: <strong>{trucks.find(t => t.id === selectedTruck)?.name}</strong></span>
                  </div>
                )}
                {selectedTrailer && (
                  <div className="flex items-center gap-2">
                    <FaTrailer className="text-green-600" />
                    <span>Trailer: <strong>{trailers.find(tr => tr.id === selectedTrailer)?.name}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedDriver || !selectedTruck}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FaCheck /> Confirm Assignment
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignDriverTruckModal;

