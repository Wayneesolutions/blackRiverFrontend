import React, { useState, useCallback } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import NewBulkOrderSidebar from "./NewBulkOrderSidebar";
import { createBulkOrders } from "../../../../../axios/api/distapcher";

type NotificationType = 'success' | 'error' | 'warning';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
}

const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    warning: <FaExclamationCircle className="text-yellow-500" size={24} />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`fixed top-4 right-4 flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg z-[10000] ${bgColors[notification.type]} animate-slide-in min-w-[300px] max-w-[500px]`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

interface BulkOrderItem {
    id: string;
    company: string;
    customerName: string;
    customerId?: string;
    customerData?: any; // Store full customer object
    commodity: string;
    loadType: string;
    pickupLocation: string;
    pickupLocationData?: any; // Store full location object with placeId
    pickupDate: string;
    deliveryLocation: string;
    deliveryLocationData?: any; // Store full location object with placeId
    deliveryDate: string;
    pickupRefNo: string;
    deliveryRefNo: string;
    amount: string;
    currency: string;
    customerOrderNo: string;
    taxBasedOn: string;
    tax1: boolean;
    tax1Percent: string;
    tax1Amount: string;
    totalTax: string;
    grossTotalFreight: string;
}

const BulkOrder = () => {
    const [orders, setOrders] = useState<BulkOrderItem[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<BulkOrderItem | null>(null);
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);
    const [saving, setSaving] = useState(false);

    const addNotification = useCallback((type: NotificationType, message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const handleAddOrder = () => {
        setEditingOrder(null);
        setSidebarOpen(true);
    };

    const handleSaveOrder = (orderData: any) => {
        if (editingOrder) {
            const updatedOrder: BulkOrderItem = {
                id: editingOrder.id,
                company: "Black River Logistics Ltd",
                customerName: orderData.selectedCustomer?.name || editingOrder.customerName,
                customerId: orderData.customerId || orderData.selectedCustomer?._id || editingOrder.customerId,
                customerData: orderData.selectedCustomer || editingOrder.customerData, // Store full customer object
                commodity: orderData.commodity || "",
                loadType: orderData.loadType || "FTL",
                pickupLocation: typeof orderData.pickupLocation === 'string' ? orderData.pickupLocation : (orderData.pickupLocation?.place || ""),
                pickupLocationData: orderData.pickupLocation || editingOrder.pickupLocationData, // Preserve location data
                pickupDate: `${orderData.pickupDate} ${orderData.pickupTime}`,
                deliveryLocation: typeof orderData.deliveryLocation === 'string' ? orderData.deliveryLocation : (orderData.deliveryLocation?.place || ""),
                deliveryLocationData: orderData.deliveryLocation || editingOrder.deliveryLocationData, // Preserve location data
                deliveryDate: `${orderData.deliveryDate} ${orderData.deliveryTime}`,
                pickupRefNo: orderData.pickupRefNo || "",
                deliveryRefNo: orderData.deliveryRefNo || "",
                amount: orderData.valueOfGoods || orderData.amount || "",
                currency: orderData.valueOfGoodsCurrency || orderData.currency || "CAD",
                customerOrderNo: orderData.customerOrderNo || "",
                taxBasedOn: orderData.taxBasedOn || "Delivery",
                tax1: orderData.tax1 || false,
                tax1Percent: orderData.tax1Percent || "",
                tax1Amount: orderData.tax1Amount || "",
                totalTax: orderData.totalTax || "",
                grossTotalFreight: orderData.grossTotalFreight || "",
            };
            setOrders(orders.map((o) => (o.id === editingOrder.id ? updatedOrder : o)));
            addNotification('success', 'Order updated successfully');
        } else {
            const newOrder: BulkOrderItem = {
                id: Date.now().toString(),
                company: "Black River Logistics Ltd",
                customerName: orderData.selectedCustomer?.name || "",
                customerId: orderData.customerId || orderData.selectedCustomer?._id,
                customerData: orderData.selectedCustomer, // Store full customer object
                commodity: orderData.commodity || "",
                loadType: orderData.loadType || "FTL",
                pickupLocation: typeof orderData.pickupLocation === 'string' ? orderData.pickupLocation : (orderData.pickupLocation?.place || ""),
                pickupLocationData: orderData.pickupLocation,
                pickupDate: `${orderData.pickupDate} ${orderData.pickupTime}`,
                deliveryLocation: typeof orderData.deliveryLocation === 'string' ? orderData.deliveryLocation : (orderData.deliveryLocation?.place || ""),
                deliveryLocationData: orderData.deliveryLocation,
                deliveryDate: `${orderData.deliveryDate} ${orderData.deliveryTime}`,
                pickupRefNo: orderData.pickupRefNo || "",
                deliveryRefNo: orderData.deliveryRefNo || "",
                amount: orderData.valueOfGoods || orderData.amount || "",
                currency: orderData.valueOfGoodsCurrency || orderData.currency || "CAD",
                customerOrderNo: orderData.customerOrderNo || "",
                taxBasedOn: orderData.taxBasedOn || "Delivery",
                tax1: orderData.tax1 || false,
                tax1Percent: orderData.tax1Percent || "",
                tax1Amount: orderData.tax1Amount || "",
                totalTax: orderData.totalTax || "",
                grossTotalFreight: orderData.grossTotalFreight || "",
            };
            setOrders([...orders, newOrder]);
            addNotification('success', 'Order added successfully');
        }
        setSidebarOpen(false);
        setEditingOrder(null);
    };

    const handleEditOrder = (order: BulkOrderItem) => {
        setEditingOrder(order);
        setSidebarOpen(true);
    };

    const handleDeleteOrder = (id: string) => {
        if (window.confirm("Are you sure you want to delete this order?")) {
            setOrders(orders.filter((o) => o.id !== id));
            addNotification('success', 'Order deleted successfully');
        }
    };

    const handleSaveAllOrders = async () => {
        if (orders.length === 0) {
            addNotification('error', 'No orders to save');
            return;
        }

        // Validate all orders have required fields
        const invalidOrders = orders.filter(order => !order.customerId || !order.customerOrderNo || !order.pickupLocation || !order.deliveryLocation);
        if (invalidOrders.length > 0) {
            addNotification('error', `${invalidOrders.length} order(s) are missing required fields (customer, order number, or locations)`);
            return;
        }

        setSaving(true);
        try {
            // Transform orders to API format
            const ordersToSave = orders.map(order => {
                const [pickupDateStr, pickupTimeStr] = (order.pickupDate || "").split(" ");
                const [deliveryDateStr, deliveryTimeStr] = (order.deliveryDate || "").split(" ");

                return {
                    customerOrderNo: order.customerOrderNo || "",
                    orderType: order.loadType === 'LTL' ? 'LTL' : 'FTL',
                    customer: order.customerId || null,
                    pickupLocation: order.pickupLocationData || order.pickupLocation || "",
                    pickupDate: pickupDateStr ? new Date(pickupDateStr).toISOString() : null,
                    pickupTime: pickupTimeStr || "",
                    pickupRefNo: order.pickupRefNo || "",
                    deliveryLocation: order.deliveryLocationData || order.deliveryLocation || "",
                    deliveryDate: deliveryDateStr ? new Date(deliveryDateStr).toISOString() : null,
                    deliveryTime: deliveryTimeStr || "",
                    deliveryRefNo: order.deliveryRefNo || "",
                    commodity: order.commodity || "",
                    valueOfGoods: parseFloat(order.amount || "0"),
                    valueOfGoodsCurrency: order.currency || "CAD",
                    totalAmount: parseFloat(order.grossTotalFreight || order.amount || "0"),
                    currency: order.currency || "CAD",
                    loadType: order.loadType || "FTL",
                    amount: parseFloat(order.amount || "0"),
                    grossTotalFreight: parseFloat(order.grossTotalFreight || order.amount || "0"),
                };
            });

            const response = await createBulkOrders(ordersToSave);
            
            if (response?.success) {
                const successCount = response.counts?.created || 0;
                const failedCount = response.counts?.failed || 0;
                if (failedCount === 0) {
                    addNotification('success', `${successCount} order(s) created successfully!`);
                    setOrders([]);
                } else {
                    addNotification('warning', `${successCount} order(s) created successfully, ${failedCount} failed`);
                    if (response.errors && response.errors.length > 0) {
                        response.errors.forEach((err: any) => {
                            addNotification('error', err.message || `Order ${err.index + 1} failed`);
                        });
                    }
                }
            } else {
                addNotification('error', response?.message || 'Failed to save orders');
            }
        } catch (error: any) {
            console.error('Error saving bulk orders:', error);
            addNotification('error', error?.response?.data?.message || 'An error occurred while saving orders');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-800">Bulk Order</h1>
                <div className="flex items-center gap-2">
                    {orders.length > 0 && (
                        <button
                            onClick={handleSaveAllOrders}
                            disabled={saving}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 !text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? "Saving..." : `Save All Orders (${orders.length})`}
                        </button>
                    )}
                    <button
                        onClick={handleAddOrder}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 !text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Order
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            {orders.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Company</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Customer Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Commodity</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Load Type</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Pickup Location</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Pickup Date</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Delivery Location</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Delivery Date</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Customer Order #</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Gross Total</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{order.company}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{order.customerName || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{order.commodity || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{order.loadType || "-"}</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate" title={order.pickupLocation || ""}>{order.pickupLocation || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{order.pickupDate || "-"}</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate" title={order.deliveryLocation || ""}>{order.deliveryLocation || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{order.deliveryDate || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                            {order.currency} {order.amount || "0.00"}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{order.customerOrderNo || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                            {order.grossTotalFreight || "0.00"}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEditOrder(order)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-sm text-gray-600">No orders added yet. Click "Add Order" to create your first order.</p>
                </div>
            )}

            {/* Order Sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-[9998] bg-gray-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            )}
            <div
                className={`fixed top-0 right-0 h-full max-w-4xl w-full bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 ${
                    sidebarOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <NewBulkOrderSidebar
                    order={editingOrder}
                    onClose={() => {
                        setSidebarOpen(false);
                        setEditingOrder(null);
                    }}
                    onSave={handleSaveOrder}
                />
            </div>

            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
                {notifications.map((notification) => (
                    <ToastNotification
                        key={notification.id}
                        notification={notification}
                        onClose={removeNotification}
                    />
                ))}
            </div>
        </div>
    );
};

export default BulkOrder;