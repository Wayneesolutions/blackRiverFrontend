import React, { useState } from "react";
import { Plus, X, Trash2, Edit, Clock, MapPin, Calendar } from "lucide-react";

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

const NewBulkOrderSidebar = ({ order, onClose, onSave }: any) => {
    const [formData, setFormData] = useState({
        selectedCustomer: order?.customerName || "",
        commodity: order?.commodity || "",
        loadType: order?.loadType || "FTL",
        isMulti: false,
        pickupLocation: order?.pickupLocation || "",
        pickupDate: order?.pickupDate?.split(" ")[0] || "2025-11-21",
        pickupTime: order?.pickupDate?.split(" ")[1] || "12:00",
        deliveryLocation: order?.deliveryLocation || "",
        deliveryDate: order?.deliveryDate?.split(" ")[0] || "2025-11-21",
        deliveryTime: order?.deliveryDate?.split(" ")[1] || "12:00",
        pickupRefNo: order?.pickupRefNo || "",
        deliveryRefNo: order?.deliveryRefNo || "",
        valueOfGoods: order?.amount || "0.00",
        valueOfGoodsCurrency: order?.currency || "CAD",
        customerOrderNo: order?.customerOrderNo || "",
        taxBasedOn: order?.taxBasedOn || "Delivery",
        tax1: order?.tax1 || false,
        tax1Percent: order?.tax1Percent || "0.00",
        tax1Amount: order?.tax1Amount || "0.00",
        totalTax: order?.totalTax || "0.00",
        grossTotalFreight: order?.grossTotalFreight || "0.00"
    });

    const handleSubmit = () => {
        onSave(formData);
    };

    const handleReset = () => {
        setFormData({
            selectedCustomer: "",
            commodity: "",
            loadType: "FTL",
            isMulti: false,
            pickupLocation: "",
            pickupDate: "2025-11-21",
            pickupTime: "12:00",
            deliveryLocation: "",
            deliveryDate: "2025-11-21",
            deliveryTime: "12:00",
            pickupRefNo: "",
            deliveryRefNo: "",
            valueOfGoods: "0.00",
            valueOfGoodsCurrency: "CAD",
            customerOrderNo: "",
            taxBasedOn: "Delivery",
            tax1: false,
            tax1Percent: "0.00",
            tax1Amount: "0.00",
            totalTax: "0.00",
            grossTotalFreight: "0.00"
        });
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                    {order ? "Edit Order" : "New Order"}
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Row 1: Customer, Commodity, Load Type */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.selectedCustomer}
                                onChange={(e) => setFormData({ ...formData, selectedCustomer: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                <option value="">Select customer</option>
                                <option value="Customer A">Customer A</option>
                                <option value="Customer B">Customer B</option>
                            </select>
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Commodity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.commodity}
                                onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                                placeholder="Enter commodity"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Load Type
                            </label>
                            <div className="flex gap-2">
                                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={formData.isMulti}
                                        onChange={(e) => setFormData({ ...formData, isMulti: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Multi</span>
                                </label>
                                <button
                                    onClick={() => setFormData({ ...formData, loadType: "FTL" })}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        formData.loadType === "FTL"
                                            ? "bg-blue-600 !text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    FTL
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, loadType: "LTL" })}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        formData.loadType === "LTL"
                                            ? "bg-blue-600 !text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    LTL
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Pickup Location & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Pickup Location <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.pickupLocation}
                                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                                    placeholder="ADM MATSUTANI..."
                                    className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Pickup Date <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="date"
                                        value={formData.pickupDate}
                                        onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <input
                                        type="time"
                                        value={formData.pickupTime}
                                        onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Delivery Location & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Delivery Location <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.deliveryLocation}
                                    onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                                    placeholder="1003 - brokendown ln..."
                                    className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button className="p-1 hover:bg-gray-100 rounded">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Delivery Date <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="date"
                                        value={formData.deliveryDate}
                                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <input
                                        type="time"
                                        value={formData.deliveryTime}
                                        onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Reference Numbers & Amount */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Pickup Ref#
                            </label>
                            <input
                                type="text"
                                value={formData.pickupRefNo}
                                onChange={(e) => setFormData({ ...formData, pickupRefNo: e.target.value })}
                                placeholder="Enter reference"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Delivery Ref#
                            </label>
                            <input
                                type="text"
                                value={formData.deliveryRefNo}
                                onChange={(e) => setFormData({ ...formData, deliveryRefNo: e.target.value })}
                                placeholder="Enter reference"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Amount
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.valueOfGoodsCurrency}
                                    onChange={(e) => setFormData({ ...formData, valueOfGoodsCurrency: e.target.value })}
                                    className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                    <option>CAD</option>
                                    <option>USD</option>
                                </select>
                                <input
                                    type="number"
                                    value={formData.valueOfGoods}
                                    onChange={(e) => setFormData({ ...formData, valueOfGoods: e.target.value })}
                                    placeholder="0.00"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Customer Order # <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.customerOrderNo}
                                onChange={(e) => setFormData({ ...formData, customerOrderNo: e.target.value })}
                                placeholder="Order number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Row 5: Tax Information */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Tax Based On
                            </label>
                            <select
                                value={formData.taxBasedOn}
                                onChange={(e) => setFormData({ ...formData, taxBasedOn: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                <option>Delivery</option>
                                <option>Pickup</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Tax 1
                            </label>
                            <div className="flex gap-2">
                                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={formData.tax1}
                                        onChange={(e) => setFormData({ ...formData, tax1: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Tax 1</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.tax1Percent}
                                    onChange={(e) => setFormData({ ...formData, tax1Percent: e.target.value })}
                                    placeholder="0.00"
                                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                                />
                                <span className="flex items-center text-sm text-gray-500">%</span>
                                <input
                                    type="number"
                                    value={formData.tax1Amount}
                                    onChange={(e) => setFormData({ ...formData, tax1Amount: e.target.value })}
                                    placeholder="0.00"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Total Tax
                            </label>
                            <input
                                type="number"
                                value={formData.totalTax}
                                onChange={(e) => setFormData({ ...formData, totalTax: e.target.value })}
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
                                readOnly
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Gross Total Freight
                            </label>
                            <input
                                type="number"
                                value={formData.grossTotalFreight}
                                onChange={(e) => setFormData({ ...formData, grossTotalFreight: e.target.value })}
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
                                readOnly
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                    onClick={handleReset}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Reset
                </button>
                <button
                    onClick={handleSubmit}
                    className="px-6 py-2 text-sm font-medium !text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {order ? "Update" : "Add"}
                </button>
            </div>
        </div>
    );
};

export default NewBulkOrderSidebar;