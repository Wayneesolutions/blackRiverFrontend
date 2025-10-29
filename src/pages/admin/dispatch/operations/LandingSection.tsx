import { useState, useEffect } from 'react';
import { FaDollarSign, FaFilter, FaTruck } from 'react-icons/fa';
import PaymentStatusBadge from '../../../../../components/dispatch/PaymentStatusBadge';

interface Load {
  _id: string;
  loadNumber?: string;
  orderNumber?: string;
  customer?: string;
  customerName?: string;
  amount?: number;
  rate?: number;
  status: 'available' | 'planned' | 'assigned' | 'in-delivery' | 'delivered' | 'paid';
  paymentStatus?: 'pending' | 'due' | 'paid';
  deliveryDate?: string;
}

const LandingSection = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('delivered');

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
        deliveryDate: '2024-01-18'
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
        deliveryDate: '2024-01-15'
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
        deliveryDate: '2024-01-19'
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
        deliveryDate: '2024-01-12'
      }
    ];
    setLoads(mockLoads);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredLoads = loads.filter(load => 
    statusFilter === 'all' ? (load.status === 'delivered' || load.status === 'paid') : load.status === statusFilter
  );

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
        <h1 className="text-3xl font-bold text-gray-800">Landing Section</h1>
        <p className="text-gray-600 mt-1">Rate Summary & Delivered Loads</p>
      </div>

      {/* Rate Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Load Amount</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
            </div>
            <FaDollarSign className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Due Amount</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(dueAmount)}</p>
            </div>
            <PaymentStatusBadge status="due" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Paid Amount</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
            </div>
            <PaymentStatusBadge status="paid" />
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Delivered Loads</h3>
          <div className="flex items-center gap-3">
            <FaFilter className="text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Delivered</option>
              <option value="delivered">Delivered (Due)</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Load #</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Order #</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Delivery Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLoads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
                      {load.deliveryDate ? new Date(load.deliveryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentStatusBadge status={load.paymentStatus || 'due'} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LandingSection;

