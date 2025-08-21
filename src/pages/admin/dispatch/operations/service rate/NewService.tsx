import React, { useState } from "react";

interface NewServiceProps {
    onClose: () => void;
}

const NewService: React.FC<NewServiceProps> = ({ onClose }) => {
    const [cashOnDelivery, setCashOnDelivery] = useState(false);
    const [peakHours, setPeakHours] = useState(false);

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50">
                <h2 className="text-2xl font-semibold text-gray-900">Add New Service</h2>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-all duration-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Service Name + Order Type */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter service name"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Order Type <span className="text-red-500">*</span>
                            </label>
                            <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white">
                                <option value="">Select order type</option>
                                <option value="transport">Transport</option>
                                <option value="storefront">Storefront</option>

                            </select>
                        </div>
                    </div>
                </div>

                {/* Pricing Configuration */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
                        Pricing Configuration
                    </h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Base Fee <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">S$</span>
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rate Calculation Method <span className="text-red-500">*</span>
                                </label>
                                <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white">
                                    <option value="">Select calculation method</option>
                                    <option value="fixed-meter">Fixed Meter</option>
                                    <option value="per-meter">Per Meter</option>
                                    <option value="per-dropoff">Per DropOff</option>
                                    <option value="algorithm">Algorithm</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duration Terms
                            </label>
                            <input
                                type="text"
                                placeholder="Enter duration terms if applicable"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                            />
                            <p className="text-xs text-gray-500 mt-1">Optional: Specify any time-based terms for this service</p>
                        </div>
                    </div>
                </div>

                {/* Cash on Delivery */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Cash on Delivery</h3>
                            <p className="text-sm text-gray-500 mt-1">Allow customers to pay upon delivery</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={cashOnDelivery}
                                onChange={() => setCashOnDelivery(!cashOnDelivery)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {cashOnDelivery && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                COD Fee Calculation Method <span className="text-red-500">*</span>
                            </label>
                            <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white">
                                <option value="">Select COD calculation method</option>
                                <option value="flat">Flat Fee</option>
                                <option value="percentage">Percentage of Order Value</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Peak Hours */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Peak Hours Pricing</h3>
                            <p className="text-sm text-gray-500 mt-1">Apply additional charges during peak hours</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={peakHours}
                                onChange={() => setPeakHours(!peakHours)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {peakHours && (
                        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Peak Hours Start <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Peak Hours End <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Peak Hours Fee Calculation Method <span className="text-red-500">*</span>
                                </label>
                                <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white">
                                    <option value="">Select peak hours method</option>
                                    <option value="flat">Flat Additional Fee</option>
                                    <option value="multiplier">Rate Multiplier</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Service Restrictions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
                        Service Restrictions
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Restrict Service
                        </label>
                        <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white">
                            <option value="service-area">Restrict to service area</option>
                            <option value="city">City Level</option>
                            <option value="region">Regional Level</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Define geographical limitations for this service</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 font-medium"
                >
                    Cancel
                </button>
                <button className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 !text-white font-medium rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                    Save Service
                </button>
            </div>
        </div>
    );
};

export default NewService;