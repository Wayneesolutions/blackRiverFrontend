import React, { useState } from "react";
import NewLoad from "../../NewLoad";

const Index = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Dummy data
    const loads = [
        {
            load: "L001",
            order: "ORD123",
            rate: "$1500",
            status: "In Transit",
            customer: "Tech Logistics",
            shipperCity: "Toronto",
            shipperState: "ON",
            shipDate: "12 Aug 2025",
            shipTime: "10:00 AM",
            receiverDate: "14 Aug 2025",
            receiverCity: "New York",
            receiverState: "NY",
            receiverTime: "6:00 PM",
            truck: "TRK-204",
            trailer: "TRL-87",
            carrier: "ABC Carriers",
            booked: "Yes",
        },
        {
            load: "L002",
            order: "ORD456",
            rate: "$1800",
            status: "Delivered",
            customer: "Global Freight",
            shipperCity: "Chicago",
            shipperState: "IL",
            shipDate: "10 Aug 2025",
            shipTime: "09:00 AM",
            receiverDate: "11 Aug 2025",
            receiverCity: "Detroit",
            receiverState: "MI",
            receiverTime: "5:00 PM",
            truck: "TRK-305",
            trailer: "TRL-45",
            carrier: "XYZ Transport",
            booked: "Yes",
        },
    ];

    return (
        <div className="min-h-screen flex flex-col relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-opacity-40 backdrop-blur-sm pointer-events-none"></div>
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            {/* Main Content */}
            <div className="relative z-10 flex-1 p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    {/* Left side heading */}
                    <h2 className="text-xl font-bold text-gray-800 bg-white bg-opacity-70 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
                        Dispatch
                    </h2>

                    {/* Right side actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setFiltersOpen(true)}
                            className="bg-white hover:bg-gray-100 text-gray-700 font-medium px-5 py-2 rounded-lg shadow border border-gray-300 transition-all duration-200 backdrop-blur-sm"
                        >
                            Filters
                        </button>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="bg-blue-500 hover:bg-blue-600 !text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm border border-blue-400"
                        >
                            + New Load
                        </button>
                    </div>
                </div>


                {/* Scrollable Table */}
                <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-xl border border-white border-opacity-50 shadow-xl overflow-x-auto">
                    <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-xl border border-white border-opacity-50 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-[1400px] w-full border-collapse text-sm">
                                <thead className="sticky top-0 z-20 bg-gray-50 bg-opacity-80 backdrop-blur-sm">
                                    <tr className="text-left font-semibold text-gray-700">
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Load</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Order</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Rate</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Status</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Customer</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Shipper City</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Shipper State</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Ship Date</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Time</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Receiver Date</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Receiver City</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Receiver State</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Time</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Truck</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Trailer</th>
                                        <th className="px-6 py-4 border-r border-gray-200 border-opacity-50">Carrier</th>
                                        <th className="px-6 py-4">Booked</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loads.map((row, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-blue-50 hover:bg-opacity-50 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 text-gray-800 font-medium">{row.load}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.order}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50 font-mono text-green-600 font-semibold">{row.rate}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${row.status === "In Transit"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-green-100 text-green-700"
                                                        }`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.customer}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.shipperCity}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.shipperState}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.shipDate}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.shipTime}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.receiverDate}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.receiverCity}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.receiverState}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.receiverTime}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.truck}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.trailer}</td>
                                            <td className="px-6 py-4 border-r border-gray-100 border-opacity-50">{row.carrier}</td>
                                            <td className="px-6 py-4 text-gray-500 italic">{row.booked}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full max-w-lg w-full sm:w-[42rem] bg-white bg-opacity-95 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 border-opacity-50 ${sidebarOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <NewLoad onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-[9998] bg-gray-900/50 backdrop-blur-sm transition-all duration-500"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <div
                className={`fixed top-0 right-0 h-full max-w-md w-full bg-white bg-opacity-95 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 ${filtersOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">Filters</h3>
                    {/* Example filters */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select className="w-full mt-1 border rounded-lg p-2">
                            <option>All</option>
                            <option>In Transit</option>
                            <option>Delivered</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Customer</label>
                        <input
                            type="text"
                            className="w-full mt-1 border rounded-lg p-2"
                            placeholder="Enter customer"
                        />
                    </div>
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600"
                        onClick={() => setFiltersOpen(false)}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Index;
