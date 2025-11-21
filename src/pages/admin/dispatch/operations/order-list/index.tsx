import React, { useState, useMemo } from "react";
import { Search, Filter, ChevronDown, ChevronUp, MoreVertical, Edit, Trash2, Plus, X } from "lucide-react";
import NewOrderSidebar from "./NewOrderSidebar";

interface Order {
  id: string;
  orderNo: string;
  custOrderNo: string;
  tripNo: string;
  orderDate: string;
  orderType: string;
  totalItems: number;
  companyName: string;
  customerName: string;
  pickupDate: string;
  pickupLocation: string;
  pickupRefNo: string;
  deliveryDate: string;
  deliveryLocation: string;
  deliveryRefNo: string;
  totalAmount: string;
  currency: string;
  status: "QUOTED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED";
  driver: string;
  truckNo: string;
  trailerNo: string;
}

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "1",
      orderNo: "TORD005555",
      custOrderNo: "",
      tripNo: "",
      orderDate: "11/21/2025 05:41 AM",
      orderType: "Regular",
      totalItems: 0,
      companyName: "Black River Logistics Ltd",
      customerName: "3 Rivers Logistics Inc",
      pickupDate: "",
      pickupLocation: "",
      pickupRefNo: "",
      deliveryDate: "",
      deliveryLocation: "",
      deliveryRefNo: "",
      totalAmount: "0.00",
      currency: "CAD",
      status: "QUOTED",
      driver: "",
      truckNo: "",
      trailerNo: "",
    },
    {
      id: "2",
      orderNo: "TORD005554",
      custOrderNo: "44322",
      tripNo: "",
      orderDate: "11/21/2025 12:11 AM",
      orderType: "Regular",
      totalItems: 0,
      companyName: "Black River Logistics Ltd",
      customerName: "3909973 MANITOBA INC D...",
      pickupDate: "",
      pickupLocation: "",
      pickupRefNo: "",
      deliveryDate: "",
      deliveryLocation: "",
      deliveryRefNo: "",
      totalAmount: "0.00",
      currency: "CAD",
      status: "QUOTED",
      driver: "",
      truckNo: "",
      trailerNo: "",
    },
    {
      id: "3",
      orderNo: "5531",
      custOrderNo: "1234",
      tripNo: "8761",
      orderDate: "11/14/2025 02:11 AM",
      orderType: "Regular",
      totalItems: 1,
      companyName: "Black River Logistics Ltd",
      customerName: "3 Rivers Logistics Inc",
      pickupDate: "11/14/2025 12:00 AM",
      pickupLocation: "ADM MATSUTANI AMERICA - CAMANCHE",
      pickupRefNo: "308 21st Street, Camanche, IA",
      deliveryDate: "11/17/2025 02:00 PM",
      deliveryLocation: "VERSA COLD - CLIVEDEN",
      deliveryRefNo: "836 Cliveden Avenue, Delta, BC",
      totalAmount: "0.00",
      currency: "USD",
      status: "CONFIRMED",
      driver: "John Doe",
      truckNo: "TRK-001",
      trailerNo: "TRL-001",
    },
    {
      id: "4",
      orderNo: "TORD005552",
      custOrderNo: "",
      tripNo: "",
      orderDate: "10/27/2025 06:23 AM",
      orderType: "Regular",
      totalItems: 0,
      companyName: "Black River Logistics Ltd",
      customerName: "3 Rivers Logistics Inc",
      pickupDate: "",
      pickupLocation: "",
      pickupRefNo: "",
      deliveryDate: "",
      deliveryLocation: "",
      deliveryRefNo: "",
      totalAmount: "0.00",
      currency: "CAD",
      status: "QUOTED",
      driver: "",
      truckNo: "",
      trailerNo: "",
    },
  ]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  
  // Filter states
  const [orderType, setOrderType] = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [byDays, setByDays] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [accounting, setAccounting] = useState("");
  const [sortBy, setSortBy] = useState("");
  
  // Search states
  const [orderNo, setOrderNo] = useState("");
  const [custOrderNo, setCustOrderNo] = useState("");
  const [tripNo, setTripNo] = useState("");
  const [pickupDeliveryRef, setPickupDeliveryRef] = useState("");
  const [custName, setCustName] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesOrderNo = !orderNo || order.orderNo.toLowerCase().includes(orderNo.toLowerCase());
      const matchesCustOrderNo = !custOrderNo || order.custOrderNo.toLowerCase().includes(custOrderNo.toLowerCase());
      const matchesTripNo = !tripNo || order.tripNo.toLowerCase().includes(tripNo.toLowerCase());
      const matchesPickupDeliveryRef = !pickupDeliveryRef || 
        order.pickupRefNo.toLowerCase().includes(pickupDeliveryRef.toLowerCase()) ||
        order.deliveryRefNo.toLowerCase().includes(pickupDeliveryRef.toLowerCase());
      const matchesCustName = !custName || order.customerName.toLowerCase().includes(custName.toLowerCase());
      const matchesPickupLocation = !pickupLocation || order.pickupLocation.toLowerCase().includes(pickupLocation.toLowerCase());
      const matchesDeliveryLocation = !deliveryLocation || order.deliveryLocation.toLowerCase().includes(deliveryLocation.toLowerCase());
      const matchesOrderType = !orderType || order.orderType === orderType;
      const matchesStatus = !orderStatus || order.status === orderStatus;

      return matchesOrderNo && matchesCustOrderNo && matchesTripNo && matchesPickupDeliveryRef &&
        matchesCustName && matchesPickupLocation && matchesDeliveryLocation && matchesOrderType && matchesStatus;
    });
  }, [orders, orderNo, custOrderNo, tripNo, pickupDeliveryRef, custName, pickupLocation, deliveryLocation, orderType, orderStatus]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setSidebarOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setSidebarOpen(true);
    setActionMenuOpen(null);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      setOrders(orders.filter((o) => o.id !== orderId));
      setActionMenuOpen(null);
    }
  };

  const handleSaveOrder = (orderData: Order) => {
    if (editingOrder) {
      setOrders(orders.map((o) => (o.id === editingOrder.id ? orderData : o)));
    } else {
      const newOrder = { ...orderData, id: Date.now().toString() };
      setOrders([...orders, newOrder]);
    }
    setSidebarOpen(false);
    setEditingOrder(null);
  };

  const handleReset = () => {
    setOrderNo("");
    setCustOrderNo("");
    setTripNo("");
    setPickupDeliveryRef("");
    setCustName("");
    setPickupLocation("");
    setDeliveryLocation("");
    setOrderType("");
    setCreatedDate("");
    setByDays("");
    setOrderStatus("");
    setAccounting("");
    setSortBy("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "QUOTED":
        return "bg-orange-100 text-orange-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Order List</h1>
        <button
          onClick={handleCreateOrder}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Order
        </button>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-blue-50 p-3 rounded-lg mb-4 flex flex-wrap gap-3">
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">Order Type</option>
          <option value="Regular">Regular</option>
          <option value="Express">Express</option>
        </select>
        <select
          value={createdDate}
          onChange={(e) => setCreatedDate(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">Created Date</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select
          value={byDays}
          onChange={(e) => setByDays(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">By Days</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
        <select
          value={orderStatus}
          onChange={(e) => setOrderStatus(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">By Order Status</option>
          <option value="QUOTED">Quoted</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={accounting}
          onChange={(e) => setAccounting(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">By Accounting</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="">By Sort</option>
          <option value="date-asc">Date (Ascending)</option>
          <option value="date-desc">Date (Descending)</option>
          <option value="amount-asc">Amount (Ascending)</option>
          <option value="amount-desc">Amount (Descending)</option>
        </select>
      </div>

      {/* Search Panel */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Order#</label>
            <input
              type="text"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="Order No"
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cust. Order#</label>
            <input
              type="text"
              value={custOrderNo}
              onChange={(e) => setCustOrderNo(e.target.value)}
              placeholder="Customer Order No"
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Trip#</label>
            <input
              type="text"
              value={tripNo}
              onChange={(e) => setTripNo(e.target.value)}
              placeholder="Trip No"
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pickup/Delivery Ref#</label>
            <input
              type="text"
              value={pickupDeliveryRef}
              onChange={(e) => setPickupDeliveryRef(e.target.value)}
              placeholder="Pickup/Delivery Ref No"
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cust Name</label>
            <select
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
            >
              <option value="">Select</option>
              <option value="3 Rivers Logistics Inc">3 Rivers Logistics Inc</option>
              <option value="3909973 MANITOBA INC D">3909973 MANITOBA INC D</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pickup Location</label>
            <select
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
            >
              <option value="">Select</option>
              <option value="ADM MATSUTANI AMERICA - CAMANCHE">ADM MATSUTANI AMERICA - CAMANCHE</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Location</label>
            <select
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
            >
              <option value="">Select</option>
              <option value="VERSA COLD - CLIVEDEN">VERSA COLD - CLIVEDEN</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => {}}
            className="px-4 py-2 bg-blue-600 !text-white rounded hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order#/Cust. Order#
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Trip#
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Pickup Date/Location/Ref No
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Delivery Date/Location/Ref No
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Truck#/Trailer#
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === order.id ? null : order.id)}
                        className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-green-700" />
                      </button>
                      {actionMenuOpen === order.id && (
                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.orderNo}</div>
                    <div className="text-xs text-gray-500">{order.orderType}</div>
                    {order.custOrderNo && (
                      <div className="text-xs text-gray-500">{order.custOrderNo}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.tripNo || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.orderDate}</div>
                    <div className="text-xs text-gray-500">Total Item: {order.totalItems}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.companyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4">
                    {order.pickupLocation ? (
                      <div className="text-sm">
                        <div className="text-gray-900">: {order.pickupLocation}</div>
                        <div className="text-gray-600">{order.pickupRefNo}</div>
                        <div className="text-red-600">{order.pickupDate}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {order.deliveryLocation ? (
                      <div className="text-sm">
                        <div className="text-gray-900">: {order.deliveryLocation}</div>
                        <div className="text-gray-600">{order.deliveryRefNo}</div>
                        <div className="text-red-600">{order.deliveryDate}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.currency} {order.totalAmount}
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.driver || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.truckNo && order.trailerNo ? (
                      <div>
                        <div>{order.truckNo}</div>
                        <div>{order.trailerNo}</div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 bg-blue-600 !text-white rounded text-sm">{currentPage}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Order Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[9998] bg-gray-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
      <div
        className={`fixed top-0 right-0 h-full max-w-5xl w-full bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <NewOrderSidebar
          order={editingOrder}
          onClose={() => {
            setSidebarOpen(false);
            setEditingOrder(null);
          }}
          onSave={handleSaveOrder}
        />
      </div>
    </div>
  );
};

export default OrderList;
