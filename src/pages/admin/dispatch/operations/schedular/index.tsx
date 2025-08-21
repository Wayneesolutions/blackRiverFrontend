import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const SchedulerPage = () => {
    const [activeTab, setActiveTab] = useState<"unscheduled" | "scheduled">("unscheduled");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date(2025, 7, 21)); // Aug 21, 2025
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2025, 7, 1)); // August 2025

    // Example data
    const orders = [
        { id: 1, title: "Order #1234", date: new Date(2025, 7, 19), customer: "John Doe", amount: "$250.00" },
        { id: 2, title: "Order #5678", date: null, customer: "Jane Smith", amount: "$180.50" },
        { id: 3, title: "Order #9101", date: new Date(2025, 7, 21), customer: "Bob Johnson", amount: "$320.75" },
        { id: 4, title: "Order #1121", date: null, customer: "Alice Brown", amount: "$95.25" },
        { id: 5, title: "Order #3141", date: new Date(2025, 7, 23), customer: "Charlie Wilson", amount: "$450.00" },
    ];

    const scheduledOrders = orders.filter((o) => o.date);
    const unscheduledOrders = orders.filter((o) => !o.date);

    // Calendar functions
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const getPreviousMonthDays = (date: Date) => {
        const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 0);
        return prevMonth.getDate();
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev);
            if (direction === 'prev') {
                newMonth.setMonth(prev.getMonth() - 1);
            } else {
                newMonth.setMonth(prev.getMonth() + 1);
            }
            return newMonth;
        });
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(today);
    };

    const hasOrderOnDate = (date: Date) => {
        return scheduledOrders.some(order => 
            order.date?.toDateString() === date.toDateString()
        );
    };

    const getOrdersForDate = (date: Date) => {
        return scheduledOrders.filter(order => 
            order.date?.toDateString() === date.toDateString()
        );
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const prevMonthDays = getPreviousMonthDays(currentMonth);
        
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Add day headers
        dayNames.forEach(day => {
            days.push(
                <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                    {day}
                </div>
            );
        });

        // Add previous month's trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            days.push(
                <div key={`prev-${day}`} className="text-center p-2 text-gray-400 text-sm">
                    {day}
                </div>
            );
        }

        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const hasOrder = hasOrderOnDate(date);

            days.push(
                <div
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`text-center p-2 text-sm cursor-pointer rounded-lg transition-colors
                        ${isSelected ? 'bg-green-200 text-green-800' : ''}
                        ${hasOrder && !isSelected ? 'bg-green-100' : ''}
                        ${isToday && !isSelected ? 'bg-blue-100 text-blue-800' : ''}
                        hover:bg-gray-100
                    `}
                >
                    {day}
                </div>
            );
        }

        // Add next month's leading days to fill the grid
        const totalCells = days.length - 7; // Subtract header row
        const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42
        for (let day = 1; day <= remainingCells; day++) {
            days.push(
                <div key={`next-${day}`} className="text-center p-2 text-gray-400 text-sm">
                    {day}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-7 gap-1">
                {days}
            </div>
        );
    };

    const currentOrders = activeTab === "scheduled" ? scheduledOrders : unscheduledOrders;
    const selectedDateOrders = getOrdersForDate(selectedDate);

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 p-4">
                <h1 className="text-2xl font-semibold text-gray-800">Scheduler</h1>
            </div>

            <div className="flex">
                {/* Left Sidebar */}
                <div className="w-80 border-r border-gray-200 bg-white">
                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab("unscheduled")}
                                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                                    ${activeTab === "unscheduled" 
                                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Unscheduled Orders
                            </button>
                            <button
                                onClick={() => setActiveTab("scheduled")}
                                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                                    ${activeTab === "scheduled" 
                                        ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Scheduled Orders
                            </button>
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="p-4">
                        <div className="space-y-3">
                            {currentOrders.length > 0 ? (
                                currentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md
                                            ${activeTab === "scheduled" 
                                                ? 'bg-green-50 border-green-200' 
                                                : 'bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <div className="font-medium text-gray-900">{order.title}</div>
                                        <div className="text-sm text-gray-600">{order.customer}</div>
                                        <div className="text-sm font-medium text-gray-900">{order.amount}</div>
                                        {order.date && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {order.date.toLocaleDateString("en-GB")}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">
                                        No {activeTab} orders
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Calendar Area */}
                <div className="flex-1 p-6">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => navigateMonth('prev')}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={goToToday}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                            >
                                Today
                            </button>
                            <h2 className="text-xl font-semibold text-gray-800">
                                {currentMonth.toLocaleDateString("en-US", { 
                                    month: "long", 
                                    year: "numeric" 
                                })}
                            </h2>
                        </div>

                        <button
                            onClick={() => navigateMonth('next')}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        {renderCalendar()}
                    </div>

                    {/* Selected Date Orders */}
                    {activeTab === "scheduled" && selectedDateOrders.length > 0 && (
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-medium text-green-800 mb-3">
                                Orders for {selectedDate.toLocaleDateString("en-GB")}
                            </h3>
                            <div className="space-y-2">
                                {selectedDateOrders.map((order) => (
                                    <div key={order.id} className="bg-white p-3 rounded border">
                                        <div className="font-medium text-gray-900">{order.title}</div>
                                        <div className="text-sm text-gray-600">{order.customer}</div>
                                        <div className="text-sm font-medium text-gray-900">{order.amount}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchedulerPage;