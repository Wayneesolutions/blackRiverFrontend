import { useState, useEffect } from "react";
import { 
  FaTruck, FaFilter, FaDollarSign, FaFileAlt, FaUpload, FaCheck, FaTimes
} from 'react-icons/fa';
import PaymentStatusBadge from "../../../../../components/dispatch/PaymentStatusBadge";

interface Load {
  _id: string;
  loadNumber?: string;
  orderNumber?: string;
  customer?: string;
  customerName?: string;
  amount?: number;
  rate?: number;
  status: 'delivered' | 'paid';
  paymentStatus?: 'pending' | 'due' | 'paid';
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
}

const Delivery = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = () => {
    setLoading(true);
    // Static mock data - only delivered/paid loads
    const mockLoads: Load[] = [
      {
        _id: '4',
        loadNumber: 'L-004',
        orderNumber: 'ORD-004',
        customer: 'Global Transport',
        customerName: 'Global Transport',
        amount: 4500,
        rate: 4500,
        status: 'delivered',
        paymentStatus: 'due',
        deliveryDate: '2024-01-18',
        documents: { bol: true, billOfSale: true, pod: true },
        route: { selectPickup: { place: 'New York, NY' }, selectDropOff: { place: 'Boston, MA' } }
      },
      {
        _id: '5',
        loadNumber: 'L-005',
        orderNumber: 'ORD-005',
        customer: 'Express Logistics',
        customerName: 'Express Logistics',
        amount: 2900,
        rate: 2900,
        status: 'paid',
        paymentStatus: 'paid',
        deliveryDate: '2024-01-15',
        documents: { bol: true, billOfSale: true, pod: true },
        route: { selectPickup: { place: 'Los Angeles, CA' }, selectDropOff: { place: 'San Francisco, CA' } }
      },
      {
        _id: '6',
        loadNumber: 'L-006',
        orderNumber: 'ORD-006',
        customer: 'Speed Freight',
        customerName: 'Speed Freight',
        amount: 3500,
        rate: 3500,
        status: 'delivered',
        paymentStatus: 'due',
        deliveryDate: '2024-01-19',
        documents: { bol: true, billOfSale: false, pod: true },
        route: { selectPickup: { place: 'Chicago, IL' }, selectDropOff: { place: 'Detroit, MI' } }
      },
      {
        _id: '7',
        loadNumber: 'L-007',
        orderNumber: 'ORD-007',
        customer: 'Pacific Logistics',
        customerName: 'Pacific Logistics',
        amount: 2200,
        rate: 2200,
        status: 'paid',
        paymentStatus: 'paid',
        deliveryDate: '2024-01-12',
        documents: { bol: true, billOfSale: true, pod: true },
        route: { selectPickup: { place: 'Seattle, WA' }, selectDropOff: { place: 'Portland, OR' } }
      },
      {
        _id: '8',
        loadNumber: 'L-008',
        orderNumber: 'ORD-008',
        customer: 'Northern Freight',
        customerName: 'Northern Freight',
        amount: 3100,
        rate: 3100,
        status: 'delivered',
        paymentStatus: 'due',
        deliveryDate: '2024-01-20',
        documents: { bol: false, billOfSale: false, pod: false },
        route: { selectPickup: { place: 'Toronto, ON' }, selectDropOff: { place: 'Ottawa, ON' } }
      }
    ];
    setLoads(mockLoads);
    setLoading(false);
  };

  const handleDocumentUpload = (loadId: string, docType: 'bol' | 'billOfSale' | 'pod') => {
    const updatedLoads = loads.map(l => 
      l._id === loadId 
        ? { 
            ...l, 
            documents: {
              ...l.documents,
              [docType]: true
            }
          } 
        : l
    );
    setLoads(updatedLoads);
  };

  const handleMarkPaid = (loadId: string) => {
    const updatedLoads = loads.map(l => 
      l._id === loadId 
        ? { 
            ...l, 
            status: 'paid' as Load['status'],
            paymentStatus: 'paid'
          } 
        : l
    );
    setLoads(updatedLoads);
    setShowPaymentModal(false);
    setSelectedLoad(null);
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

  const filteredLoads = paymentFilter === 'all' 
    ? loads 
    : loads.filter(load => load.paymentStatus === paymentFilter);

  const totalAmount = filteredLoads.reduce((sum, load) => sum + (load.amount || load.rate || 0), 0);
  const dueAmount = filteredLoads
    .filter(load => load.paymentStatus === 'due')
    .reduce((sum, load) => sum + (load.amount || load.rate || 0), 0);
  const paidAmount = filteredLoads
    .filter(load => load.paymentStatus === 'paid')
    .reduce((sum, load) => sum + (load.amount || load.rate || 0), 0);

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Delivery</h1>
        <p className="text-gray-600 mt-1">Completed loads with document uploads and payment tracking</p>
      </div>

      {/* Total Load Amount Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Load Amount</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">{filteredLoads.length} loads</p>
            </div>
            <FaDollarSign className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-lg p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Due Amount</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(dueAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredLoads.filter(l => l.paymentStatus === 'due').length} loads
              </p>
            </div>
            <PaymentStatusBadge status="due" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Paid Amount</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredLoads.filter(l => l.paymentStatus === 'paid').length} loads
              </p>
            </div>
            <PaymentStatusBadge status="paid" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Delivered Loads</h3>
          <div className="flex items-center gap-3">
            <FaFilter className="text-gray-600" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="due">Due</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
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
                  Delivery Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <FaTruck className="mx-auto mb-3 text-gray-300" size={48} />
                    <p>No delivered loads found</p>
                  </td>
                </tr>
              ) : (
                filteredLoads.map((load) => (
                  <tr key={load._id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600">
                      {load.loadNumber || load._id}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(load.deliveryDate || '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentStatusBadge status={load.paymentStatus || 'due'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          load.documents?.bol ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>BOL</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          load.documents?.billOfSale ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>B/S</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          load.documents?.pod ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>POD</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedLoad(load);
                            setShowDocumentModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                        >
                          <FaUpload size={12} /> Documents
                        </button>
                        {load.paymentStatus === 'due' && (
                          <button
                            onClick={() => {
                              setSelectedLoad(load);
                              setShowPaymentModal(true);
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1"
                          >
                            <FaCheck size={12} /> Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Upload Modal */}
      {showDocumentModal && selectedLoad && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Delivery Documents</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Load: {selectedLoad.loadNumber || selectedLoad._id} | Customer: {selectedLoad.customer || selectedLoad.customerName || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedLoad(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaTimes className="text-gray-500" size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Load Amount */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaDollarSign className="text-green-600" size={24} />
                    <div>
                      <p className="text-sm text-gray-600">Total Load Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedLoad.amount || selectedLoad.rate || 0)}
                      </p>
                    </div>
                  </div>
                  <PaymentStatusBadge status={selectedLoad.paymentStatus || 'due'} />
                </div>
              </div>

              {/* Document Upload Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Upload Required Documents</h4>
                
                {/* BOL */}
                <div className="border-2 border-gray-200 rounded-lg p-4 mb-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedLoad.documents?.bol ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <FaFileAlt className={`${selectedLoad.documents?.bol ? 'text-green-600' : 'text-blue-600'}`} size={24} />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800">Bill of Lading (BOL) *</h5>
                        <p className="text-sm text-gray-500">Required document for shipment</p>
                      </div>
                    </div>
                    {selectedLoad.documents?.bol ? (
                      <span className="flex items-center gap-2 text-green-600 font-medium">
                        <FaCheck /> Uploaded
                      </span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium">Required</span>
                    )}
                  </div>
                  <label className="block">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">
                      <FaUpload className="text-blue-600" />
                      <span className="text-blue-600 font-medium">Choose File</span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleDocumentUpload(selectedLoad._id, 'bol');
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Bill of Sale */}
                <div className="border-2 border-gray-200 rounded-lg p-4 mb-4 hover:border-green-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedLoad.documents?.billOfSale ? 'bg-green-100' : 'bg-green-100'
                      }`}>
                        <FaFileAlt className={`${selectedLoad.documents?.billOfSale ? 'text-green-600' : 'text-green-600'}`} size={24} />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800">Bill of Sale *</h5>
                        <p className="text-sm text-gray-500">Sale documentation</p>
                      </div>
                    </div>
                    {selectedLoad.documents?.billOfSale ? (
                      <span className="flex items-center gap-2 text-green-600 font-medium">
                        <FaCheck /> Uploaded
                      </span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium">Required</span>
                    )}
                  </div>
                  <label className="block">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg cursor-pointer transition-colors">
                      <FaUpload className="text-green-600" />
                      <span className="text-green-600 font-medium">Choose File</span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleDocumentUpload(selectedLoad._id, 'billOfSale');
                        }
                      }}
                    />
                  </label>
                </div>

                {/* POD */}
                <div className="border-2 border-gray-200 rounded-lg p-4 mb-4 hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedLoad.documents?.pod ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        <FaFileAlt className={`${selectedLoad.documents?.pod ? 'text-green-600' : 'text-purple-600'}`} size={24} />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800">Proof of Delivery (POD) *</h5>
                        <p className="text-sm text-gray-500">Delivery confirmation document</p>
                      </div>
                    </div>
                    {selectedLoad.documents?.pod ? (
                      <span className="flex items-center gap-2 text-green-600 font-medium">
                        <FaCheck /> Uploaded
                      </span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium">Required</span>
                    )}
                  </div>
                  <label className="block">
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg cursor-pointer transition-colors">
                      <FaUpload className="text-purple-600" />
                      <span className="text-purple-600 font-medium">Choose File</span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleDocumentUpload(selectedLoad._id, 'pod');
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Document Status Summary */}
                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <h5 className="font-semibold text-blue-900 mb-2">Document Status:</h5>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className={`p-2 rounded ${selectedLoad.documents?.bol ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      BOL: {selectedLoad.documents?.bol ? '✓ Uploaded' : '✗ Required'}
                    </div>
                    <div className={`p-2 rounded ${selectedLoad.documents?.billOfSale ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      Bill of Sale: {selectedLoad.documents?.billOfSale ? '✓ Uploaded' : '✗ Required'}
                    </div>
                    <div className={`p-2 rounded ${selectedLoad.documents?.pod ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      POD: {selectedLoad.documents?.pod ? '✓ Uploaded' : '✗ Required'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end border-t rounded-b-xl">
              <button
                onClick={() => {
                  setShowDocumentModal(false);
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

      {/* Payment Modal */}
      {showPaymentModal && selectedLoad && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Mark as Paid</h3>
              <p className="text-sm text-gray-600 mt-1">Load: {selectedLoad.loadNumber || selectedLoad._id}</p>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Load Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedLoad.amount || selectedLoad.rate || 0)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg">
                    <option>Select Payment Method</option>
                    <option>Bank Transfer</option>
                    <option>Check</option>
                    <option>Cash</option>
                    <option>Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Reference
                  </label>
                  <input
                    type="text"
                    placeholder="Transaction ID or reference number"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedLoad(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkPaid(selectedLoad._id)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Delivery;

