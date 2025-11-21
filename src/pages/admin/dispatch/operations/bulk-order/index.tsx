import React, { useState } from "react";
import { Plus, X, Trash2, Edit } from "lucide-react";
import NewBulkOrderSidebar from "./NewBulkOrderSidebar";

interface BulkOrderItem {
    id: string;
    company: string;
    customerName: string;
    commodity: string;
    loadType: string;
    pickupLocation: string;
    pickupDate: string;
    deliveryLocation: string;
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
                commodity: orderData.commodity || "",
                loadType: orderData.loadType || "FTL",
                pickupLocation: orderData.pickupLocation || "",
                pickupDate: `${orderData.pickupDate} ${orderData.pickupTime}`,
                deliveryLocation: orderData.deliveryLocation || "",
                deliveryDate: `${orderData.deliveryDate} ${orderData.deliveryTime}`,
                pickupRefNo: orderData.pickupRefNo || "",
                deliveryRefNo: orderData.deliveryRefNo || "",
                amount: orderData.valueOfGoods || "",
                currency: orderData.valueOfGoodsCurrency || "CAD",
                customerOrderNo: orderData.customerOrderNo || "",
                taxBasedOn: orderData.taxBasedOn || "Delivery",
                tax1: orderData.tax1 || false,
                tax1Percent: orderData.tax1Percent || "",
                tax1Amount: orderData.tax1Amount || "",
                totalTax: orderData.totalTax || "",
                grossTotalFreight: orderData.grossTotalFreight || "",
            };
            setOrders(orders.map((o) => (o.id === editingOrder.id ? updatedOrder : o)));
        } else {
            const newOrder: BulkOrderItem = {
                id: Date.now().toString(),
                company: "Black River Logistics Ltd",
                customerName: orderData.selectedCustomer?.name || "",
                commodity: orderData.commodity || "",
                loadType: orderData.loadType || "FTL",
                pickupLocation: orderData.pickupLocation || "",
                pickupDate: `${orderData.pickupDate} ${orderData.pickupTime}`,
                deliveryLocation: orderData.deliveryLocation || "",
                deliveryDate: `${orderData.deliveryDate} ${orderData.deliveryTime}`,
                pickupRefNo: orderData.pickupRefNo || "",
                deliveryRefNo: orderData.deliveryRefNo || "",
                amount: orderData.valueOfGoods || "",
                currency: orderData.valueOfGoodsCurrency || "CAD",
                customerOrderNo: orderData.customerOrderNo || "",
                taxBasedOn: orderData.taxBasedOn || "Delivery",
                tax1: orderData.tax1 || false,
                tax1Percent: orderData.tax1Percent || "",
                tax1Amount: orderData.tax1Amount || "",
                totalTax: orderData.totalTax || "",
                grossTotalFreight: orderData.grossTotalFreight || "",
            };
            setOrders([...orders, newOrder]);
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
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-800">Bulk Order</h1>
                <button
                    onClick={handleAddOrder}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 !text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Order
                </button>
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
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{order.customerName}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{order.commodity}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{order.loadType}</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate">{order.pickupLocation || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{order.pickupDate || "-"}</td>
                                        <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate">{order.deliveryLocation || "-"}</td>
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
        </div>
    );
};

export default BulkOrder;