import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const SchedulerPage = () => {
    const [activeSection, setActiveSection] = useState<"scheduled" | "unscheduled">("scheduled");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Example data
    const orders = [
        { id: 1, title: "Order #1234", date: new Date(2025, 7, 19) }, // Aug 19 2025
        { id: 2, title: "Order #5678", date: null }, // unscheduled
    ];

    const scheduledOrders = orders.filter((o) => o.date);
    const unscheduledOrders = orders.filter((o) => !o.date);

    return (
        <div className="min-h-screen flex bg-gray-100">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-gray-200 bg-white p-4">
                <h2 className="text-lg font-semibold mb-4">Scheduler</h2>

                {/* Unscheduled Orders */}
                <div className="mb-4">
                    <button
                        onClick={() =>
                            setActiveSection(activeSection === "unscheduled" ? "" : "unscheduled" as any)
                        }
                        className="w-full text-left font-medium bg-gray-50 px-3 py-2 rounded-md shadow-sm"
                    >
                        Unscheduled Orders
                    </button>
                    {activeSection === "unscheduled" && (
                        <ul className="mt-2 space-y-2 pl-3">
                            {unscheduledOrders.length ? (
                                unscheduledOrders.map((order) => (
                                    <li key={order.id} className="text-sm text-gray-700 bg-gray-100 p-2 rounded">
                                        {order.title}
                                    </li>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic mt-2">No unscheduled orders</p>
                            )}
                        </ul>
                    )}
                </div>

                {/* Scheduled Orders */}
                <div>
                    <button
                        onClick={() =>
                            setActiveSection(activeSection === "scheduled" ? "" : "scheduled" as any)
                        }
                        className="w-full text-left font-medium bg-gray-50 px-3 py-2 rounded-md shadow-sm"
                    >
                        Scheduled Orders
                    </button>
                    {activeSection === "scheduled" && (
                        <ul className="mt-2 space-y-2 pl-3">
                            {scheduledOrders.length ? (
                                scheduledOrders.map((order) => (
                                    <li
                                        key={order.id}
                                        className="text-sm text-gray-700 bg-green-50 p-2 rounded flex justify-between"
                                    >
                                        {order.title}
                                        <span className="text-xs text-gray-500">
                                            {order.date?.toLocaleDateString("en-GB")}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic mt-2">No scheduled orders</p>
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {/* Calendar */}
            <div className="flex-1 bg-white p-6">
                <div className="flex justify-between items-center mb-4">
                    <button className="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 text-sm">
                        &lt;
                    </button>
                    <h3 className="font-semibold text-gray-700">
                        {selectedDate
                            ? selectedDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
                            : "August 2025"}
                    </h3>
                    <button className="px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 text-sm">
                        &gt;
                    </button>
                </div>

                <div className="w-[600px] mx-auto">
                    <Calendar
                        // onChange={setSelectedDate}
                        value={selectedDate}
                        tileClassName={({ date }) => {
                            if (scheduledOrders.find((o) => o.date?.toDateString() === date.toDateString())) {
                                return "bg-green-200 rounded-lg";
                            }
                            return "";
                        }}
                        className="w-full border border-gray-200 rounded-lg shadow-sm p-6 text-lg"
                    />
                </div>

            </div>
        </div>
    );
};

export default SchedulerPage;
