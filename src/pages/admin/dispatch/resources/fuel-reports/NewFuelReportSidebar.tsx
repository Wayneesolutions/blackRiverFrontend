import  { useState } from 'react';
import { X } from 'lucide-react';
import type { FC } from "react";
import { useDrivers } from '../../../../../customHooks/useDrivers';
import { useVehicles } from '../../../../../customHooks/useVehicles';
import { createFuelReport } from '../../../../../axios/api/dispatcher.places';

interface NewFuelReportSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewFuelReportSidebar: FC<NewFuelReportSidebarProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        reporter: '',
        driver: '',
        vehicle: '',
        odometer: '',
        cost: '',
        volume: '',
        volumeUnit: '',
        status: 'pending',
        address: '',
    });

    const [openDetails, setOpenDetails] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    // Fetch drivers and vehicles
    const { drivers, loading: loadingDrivers } = useDrivers();
    const { vehicles, loading: loadingVehicles } = useVehicles();

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            setLoadingSubmit(true);
            const response = await createFuelReport(formData);
            console.log('Fuel report created:', response);
            setLoadingSubmit(false);
            onClose();
        } catch (error) {
            console.error('Error creating fuel report:', error);
            setLoadingSubmit(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={onClose}></div>

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-126 bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">New Fuel Report</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                    {/* Details Panel */}
                    <div className="bg-gray-50 p-4 rounded-md">
                        <div
                            className="flex items-center justify-between cursor-pointer mb-4"
                            onClick={() => setOpenDetails(!openDetails)}
                        >
                            <h3 className="text-lg font-medium text-gray-900">New Fuel report</h3>
                            <svg
                                className={`w-5 h-5 text-gray-500 transform transition-transform ${openDetails ? "rotate-180" : ""}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>

                        {openDetails && (
                            <div className="space-y-4">
                                {/* Reporter & Driver */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reporter</label>
                                        <select
                                            name="reporter"
                                            value={formData.reporter}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Reporter</option>
                                            <option value="raman">Raman's Beauty Lounge</option>
                                            <option value="alice">Alice Johnson</option>
                                            <option value="bob">Bob Smith</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                                        <select
                                            name="driver"
                                            value={formData.driver}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Driver</option>
                                            {loadingDrivers ? (
                                                <option>Loading drivers...</option>
                                            ) : (
                                                drivers?.map(driver => (
                                                    <option key={driver._id} value={driver._id}>
                                                        {driver.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* Vehicle & Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                                        <select
                                            name="vehicle"
                                            value={formData.vehicle}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Vehicle</option>
                                            {loadingVehicles ? (
                                                <option>Loading vehicles...</option>
                                            ) : (
                                                vehicles?.map(vehicle => (
                                                    <option key={vehicle._id} value={vehicle._id}>
                                                        {vehicle.plateNumber} - {vehicle.internalId} - {vehicle.vinNumber}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Odometer & Cost */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Odometer</label>
                                        <input
                                            type="number"
                                            name="odometer"
                                            value={formData.odometer}
                                            onChange={handleInputChange}
                                            placeholder="Odometer"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">SG$</span>
                                            <input
                                                type="number"
                                                name="cost"
                                                value={formData.cost}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Volume */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            name="volume"
                                            value={formData.volume}
                                            onChange={handleInputChange}
                                            placeholder="Enter volume"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <select
                                            name="volumeUnit"
                                            value={formData.volumeUnit}
                                            onChange={handleInputChange}
                                            className="px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="ml">ml</option>
                                            <option value="cl">cl</option>
                                            <option value="dl">dl</option>
                                            <option value="dm">dm³</option>
                                            <option value="l">L</option>
                                            <option value="gal">gal</option>
                                            <option value="pt">pt</option>
                                            <option value="qt">qt</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Enter address"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white sticky bottom-0 z-[102] shadow-lg">
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 !mr-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loadingSubmit}
                            className="px-4 py-2 bg-blue-600 !text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loadingSubmit ? 'Creating...' : 'Create Fuel Report'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NewFuelReportSidebar;
