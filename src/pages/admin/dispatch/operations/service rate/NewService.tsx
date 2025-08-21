import React, { useState } from "react";

interface NewServiceProps {
    onClose: () => void;
}

const NewService: React.FC<NewServiceProps> = ({ onClose }) => {
    const [cashOnDelivery, setCashOnDelivery] = useState(false);
    const [peakHours, setPeakHours] = useState(false);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Add New Service</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition"
                >
                    ✕
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Service Name + Order Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">
                            Service Name *
                        </label>
                        <input
                            type="text"
                            placeholder="Service Name"
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">
                            Service Order Type *
                        </label>
                        <select className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none">
                            <option>Select order type</option>
                            <option>Delivery</option>
                            <option>Pickup</option>
                        </select>
                    </div>
                </div>

                {/* Base Fee + Rate Calculation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">
                            Base Fee *
                        </label>
                        <input
                            type="text"
                            placeholder="S$0.00"
                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">
                            Rate Calculation Method *
                        </label>
                        <select className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none">
                            <option>Select method</option>
                            <option>Flat</option>
                            <option>Per KM</option>
                            <option>Per Hour</option>
                        </select>
                    </div>
                </div>

                {/* Duration Terms */}
                <div>
                    <label className="block text-gray-700 font-medium mb-1">
                        Duration Terms
                    </label>
                    <input
                        type="text"
                        placeholder="Duration terms if applicable"
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                </div>

                {/* Cash on Delivery */}
                <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-800 font-semibold">
                            Cash on Delivery
                        </h3>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={cashOnDelivery}
                                onChange={() => setCashOnDelivery(!cashOnDelivery)}
                                className="w-5 h-5"
                            />
                            <span className="text-gray-700">Enable</span>
                        </label>
                    </div>
                    {cashOnDelivery && (
                        <div className="mt-4">
                            <label className="block text-gray-700 font-medium mb-1">
                                COD Fee Calculation Method *
                            </label>
                            <select className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none">
                                <option>Select COD method</option>
                                <option>Flat Fee</option>
                                <option>Percentage</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Peak Hours */}
                <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-800 font-semibold">Peak Hours</h3>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={peakHours}
                                onChange={() => setPeakHours(!peakHours)}
                                className="w-5 h-5"
                            />
                            <span className="text-gray-700">Enable</span>
                        </label>
                    </div>
                    {peakHours && (
                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">
                                        Peak Hours Start *
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1">
                                        Peak Hours End *
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">
                                    Peak Hours Fee Calculation Method *
                                </label>
                                <select className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none">
                                    <option>Select method</option>
                                    <option>Flat Fee</option>
                                    <option>Multiplier</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Restrict Service */}
                <div className="border rounded-lg p-4">
                    <h3 className="text-gray-800 font-semibold mb-2">
                        Restrict Service
                    </h3>
                    <select className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none">
                        <option>Restrict to service area</option>
                        <option>City</option>
                        <option>Region</option>
                    </select>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                >
                    Cancel
                </button>
                <button className="ml-3 px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow">
                    Save Service
                </button>
            </div>
        </div>
    );
};

export default NewService;
