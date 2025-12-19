import { useState } from "react";
import OrderList from "./order-list";
import TripsComponent from "./trips";

const TripsOrder = () => {
    const [activeTab, setActiveTab] = useState<"orders" | "trips">("orders");

    return (
        <div className="min-h-screen bg-[#EDF8FF]">
            {/* Tab Navigation */}
            <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-200">
                <div className="px-6 flex gap-8">
                    <button
                        onClick={() => setActiveTab("orders")}
                        className={`py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === "orders"
                            ? "border-[#42aeec] text-[#42aeec]"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Orders
                    </button>
                    <button
                        onClick={() => setActiveTab("trips")}
                        className={`py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === "trips"
                            ? "border-[#42aeec] text-[#42aeec]"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Trips
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative">
                {activeTab === "orders" ? (
                    <OrderList />
                ) : (
                    <TripsComponent />
                )}
            </div>
        </div>
    );
};

export default TripsOrder;