import { useState, useEffect, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import type { CSSProperties, FC } from "react";
import { useDrivers } from '../../../../../customHooks/useDrivers';
import { createFuelReport } from '../../../../../axios/api/dispatcher.places';
import { listTrip } from '../../../../../axios/api/distapcher';
import { FLEET_COLORS } from '../../../fleetMaintenance/colorUtils';

interface FleetUnitOption {
    id: string;
    unitNo: string;
    unitType?: string;
    makeModel?: string;
    licensePlate?: string;
}

interface NewFuelReportSidebarProps {
    isOpen: boolean;
    onClose: (shouldRefresh?: boolean) => void;
    units: FleetUnitOption[];
    unitsLoading: boolean;
    currentUser: any;
}

interface Trip {
    _id: string;
    tripNumber: string;
    driver?: { _id: string; name: string };
    truck?: { _id: string; unitNo?: string; licensePlate?: string; makeModel?: string; plateNumber?: string };
    trailer?: { _id: string; plateNumber?: string; licensePlate?: string; trailerNumber?: string; unitNo?: string; makeModel?: string; type?: string; capacity?: string };
    status?: string;
    plannedStartDate?: string;
    route?: {
        totalDistance?: number; // in km
    };
    orders?: Array<{
        pickupLocation?: {
            place?: string;
            placeId?: string | {
                name?: string;
                currentLocation?: {
                    address?: string;
                };
            };
        };
        deliveryLocation?: {
            place?: string;
            placeId?: string | {
                name?: string;
                currentLocation?: {
                    address?: string;
                };
            };
        };
    }>;
}

const NewFuelReportSidebar: FC<NewFuelReportSidebarProps> = ({ isOpen, onClose, units, unitsLoading, currentUser }) => {
    const [formData, setFormData] = useState({
        reporter: '',
        driver: '',
        vehicle: '',
        trip: '',
        odometer: '',
        cost: '',
        volume: '',
        volumeUnit: 'l',
        status: 'pending',
        address: '',
    });

    const [openDetails, setOpenDetails] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [tripsLoading, setTripsLoading] = useState(false);

    const { drivers, loading: loadingDrivers } = useDrivers();
    const focusRingStyle = useMemo(
        () =>
            ({
                '--tw-ring-color': FLEET_COLORS.primary
            }) as CSSProperties & { '--tw-ring-color': string },
        []
    );

    const reporterId = currentUser?._id || currentUser?.userData?._id || '';
    const reporterName =
        currentUser?.name ||
        currentUser?.userData?.name ||
        [currentUser?.userData?.firstName, currentUser?.userData?.lastName].filter(Boolean).join(' ').trim() ||
        'N/A';
    const reporterEmail = currentUser?.email || currentUser?.userData?.email || '—';

    const formatUnitLabel = (unit: FleetUnitOption) => {
        const base = [unit.unitNo, unit.makeModel].filter(Boolean).join(' - ');
        return unit.unitType ? `${base} (${unit.unitType})` : base || 'Unit';
    };

    const selectedUnit = useMemo(
        () => units.find((unit) => unit.id === formData.vehicle),
        [units, formData.vehicle]
    );

    const fetchTrips = useCallback(async () => {
        console.log('🔄 fetchTrips function called');
        setTripsLoading(true);
        try {
            console.log('📡 Calling listTrip API with params: { page: 1, limit: 100 }');
            const response = await listTrip({ page: 1, limit: 100 });
            console.log('✅ listTrip API response:', response);
            if (response?.success && response?.data) {
                const tripsData = Array.isArray(response.data) ? response.data : [];
                console.log(`✅ Trips data received: ${tripsData.length} trips`);
                setTrips(tripsData);
            } else {
                console.warn('⚠️ No trips in response or response not successful:', response);
                setTrips([]);
            }
        } catch (error) {
            console.error('❌ Error fetching trips:', error);
            setTrips([]);
        } finally {
            setTripsLoading(false);
        }
    }, []);

    // Fetch trips when sidebar opens
    useEffect(() => {
        console.log('🔍 useEffect triggered, isOpen:', isOpen);
        if (isOpen) {
            console.log('✅ Sidebar is open, calling fetchTrips...');
            // Call fetchTrips immediately
            fetchTrips().catch(err => {
                console.error('Failed to fetch trips in useEffect:', err);
            });
        } else {
            // Reset trips when sidebar closes
            console.log('🚪 Sidebar closed, resetting trips');
            setTrips([]);
        }
    }, [isOpen, fetchTrips]);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                reporter: reporterId,
                driver: '',
                vehicle: '',
                trip: '',
                odometer: '',
                cost: '',
                volume: '',
                volumeUnit: 'l',
                status: 'pending',
                address: '',
            });
        }
    }, [isOpen, reporterId]);

    const selectedTrip = useMemo(
        () => trips.find((trip) => trip._id === formData.trip),
        [trips, formData.trip]
    );

    const formatTripOption = (trip: Trip): string => {
        const tripNumber = trip.tripNumber || 'N/A';
        
        // Get pickup and dropoff locations
        let pickup = 'N/A';
        let dropoff = 'N/A';
        
        if (trip.orders && trip.orders.length > 0) {
            const firstOrder = trip.orders[0];
            // Handle pickup location - check place field or placeId object
            if (firstOrder.pickupLocation) {
                if (firstOrder.pickupLocation.place) {
                    pickup = firstOrder.pickupLocation.place;
                } else if (firstOrder.pickupLocation.placeId && typeof firstOrder.pickupLocation.placeId === 'object') {
                    const place = firstOrder.pickupLocation.placeId as any;
                    pickup = place.name || place.currentLocation?.address || 'N/A';
                }
            }
            
            // Get last delivery location
            const lastOrder = trip.orders[trip.orders.length - 1];
            if (lastOrder.deliveryLocation) {
                if (lastOrder.deliveryLocation.place) {
                    dropoff = lastOrder.deliveryLocation.place;
                } else if (lastOrder.deliveryLocation.placeId && typeof lastOrder.deliveryLocation.placeId === 'object') {
                    const place = lastOrder.deliveryLocation.placeId as any;
                    dropoff = place.name || place.currentLocation?.address || 'N/A';
                }
            }
        }
        
        return `${tripNumber} (${pickup} → ${dropoff})`;
    };

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.vehicle) {
            alert('Please select a vehicle/unit');
            return;
        }

        if (!formData.driver) {
            alert('Please select a driver');
            return;
        }

        try {
            setLoadingSubmit(true);
            const payload = {
                reporter: reporterId || formData.reporter,
                driver: formData.driver,
                vehicle: formData.vehicle, // This should be the FleetUnit _id or prefixed ID
                trip: formData.trip || null,
                odometer: formData.odometer || null,
                cost: formData.cost || null,
                volume: formData.volume || null,
                volumeUnit: formData.volumeUnit || 'l',
                status: formData.status || 'pending',
                address: formData.address || null,
            };
            const response = await createFuelReport(payload);
            if (!response?.success) {
                throw new Error(response?.message || 'Failed to create fuel report');
            }
            setLoadingSubmit(false);
            // Pass true to refresh the list after closing
            onClose(true);
        } catch (error: any) {
            console.error('Error creating fuel report:', error);
            alert(error?.message || 'Failed to create fuel report. Please try again.');
            setLoadingSubmit(false);
        }
    };

    if (!isOpen) return null;

    const handleClose = () => {
        onClose(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={handleClose}></div>

            <div className="fixed right-0 top-0 h-full w-126 bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
                <div className="p-4 border-b border-gray-200 flex-shrink-0" style={{ background: FLEET_COLORS.gradient }}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">New Fuel Report</h2>
                        <button onClick={handleClose} className="text-white/80 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                    <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                        <div
                            className="flex items-center justify-between cursor-pointer mb-4"
                            onClick={() => setOpenDetails(!openDetails)}
                        >
                            <h3 className="text-lg font-medium text-gray-900">Fuel Report Details</h3>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                                        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Reporter</p>
                                        <p className="text-gray-900 font-semibold">{reporterName}</p>
                                        <p className="text-xs text-gray-500">{reporterEmail}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Trip</label>
                                        <select
                                            name="trip"
                                            value={formData.trip}
                                            onChange={(e) => {
                                                const tripId = e.target.value;
                                                const selectedTrip = trips.find(t => t._id === tripId);
                                                
                                                // Auto-populate driver from trip
                                                let driverId = '';
                                                if (selectedTrip?.driver?._id) {
                                                    driverId = selectedTrip.driver._id;
                                                }
                                                
                                                // Auto-populate vehicle from trip
                                                // Try to find matching unit by truck ID, plate number, or unitNo
                                                let vehicleId = '';
                                                if (selectedTrip?.truck) {
                                                    const truck = selectedTrip.truck;
                                                    // Try to find unit by truck _id first
                                                    const unitById = units.find(u => u.id === truck._id);
                                                    if (unitById) {
                                                        vehicleId = unitById.id;
                                                    } else {
                                                        // Try to find by plate number or unitNo
                                                        const unitByPlate = units.find(u => 
                                                            u.licensePlate === truck.plateNumber || 
                                                            u.licensePlate === truck.licensePlate ||
                                                            u.unitNo === truck.unitNo ||
                                                            u.unitNo === truck.plateNumber
                                                        );
                                                        if (unitByPlate) {
                                                            vehicleId = unitByPlate.id;
                                                        }
                                                    }
                                                }
                                                
                                                setFormData(prev => ({
                                                    ...prev,
                                                    trip: tripId,
                                                    driver: driverId || prev.driver,
                                                    vehicle: vehicleId || prev.vehicle
                                                }));
                                                
                                                console.log('🚗 Trip selected:', {
                                                    tripId,
                                                    tripDriver: selectedTrip?.driver,
                                                    tripTruck: selectedTrip?.truck,
                                                    autoFilledDriver: driverId,
                                                    autoFilledVehicle: vehicleId,
                                                    availableUnits: units.length
                                                });
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                            style={focusRingStyle}
                                        >
                                            <option value="">Select Trip</option>
                                            {tripsLoading ? (
                                                <option disabled>Loading trips...</option>
                                            ) : trips && trips.length > 0 ? (
                                                trips.map(trip => (
                                                    <option key={trip._id} value={trip._id}>
                                                        {formatTripOption(trip)}
                                                    </option>
                                                ))
                                            ) : (
                                                <option disabled>No trips available</option>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                                        {formData.trip && selectedTrip?.driver && formData.driver ? (
                                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-gray-700 border-blue-200">
                                                <div className="font-semibold text-blue-900">{selectedTrip.driver.name}</div>
                                                <div className="text-xs text-blue-600 mt-1">Auto-filled from trip</div>
                                            </div>
                                        ) : (
                                            <select
                                                name="driver"
                                                value={formData.driver}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                                style={focusRingStyle}
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
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                                        {formData.trip && selectedTrip?.truck && formData.vehicle ? (
                                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-gray-700 border-blue-200">
                                                <div className="font-semibold text-blue-900">
                                                    {selectedTrip.truck.unitNo || selectedTrip.truck.plateNumber || selectedTrip.truck.licensePlate || 'N/A'}
                                                </div>
                                                {selectedTrip.truck.makeModel && (
                                                    <div className="text-xs text-gray-600 mt-1">{selectedTrip.truck.makeModel}</div>
                                                )}
                                                <div className="text-xs text-blue-600 mt-1">Auto-filled from trip</div>
                                            </div>
                                        ) : (
                                            <select
                                                name="vehicle"
                                                value={formData.vehicle}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                                style={focusRingStyle}
                                            >
                                                <option value="">Select Unit</option>
                                                {unitsLoading ? (
                                                    <option>Loading units...</option>
                                                ) : (
                                                    units?.map(unit => (
                                                        <option key={unit.id} value={unit.id}>
                                                            {formatUnitLabel(unit)}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        )}
                                        {selectedUnit && !formData.trip && (
                                            <div className="mt-2 text-xs text-gray-600 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2 space-y-1">
                                                <div className="font-semibold text-gray-800">{selectedUnit.unitNo}</div>
                                                {selectedUnit.makeModel && (
                                                    <div>{selectedUnit.makeModel}</div>
                                                )}
                                                {(selectedUnit.unitType || selectedUnit.licensePlate) && (
                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                                                        {selectedUnit.unitType && (
                                                            <span className="px-2 py-0.5 rounded-full bg-white text-blue-700 border border-blue-200">
                                                                {selectedUnit.unitType}
                                                            </span>
                                                        )}
                                                        {selectedUnit.licensePlate && (
                                                            <span className="px-2 py-0.5 rounded-full bg-white text-gray-600 border border-gray-200">
                                                                {selectedUnit.licensePlate}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Trip Details Section - Show when trip is selected */}
                                {formData.trip && selectedTrip && (
                                    <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Trip Details</h4>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Driver Details */}
                                            {selectedTrip.driver && (
                                                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">Driver</p>
                                                    <p className="text-gray-900 font-semibold">{selectedTrip.driver.name}</p>
                                                </div>
                                            )}

                                            {/* Truck Details */}
                                            {selectedTrip.truck && (
                                                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">Truck</p>
                                                    <p className="text-gray-900 font-semibold">
                                                        {selectedTrip.truck.unitNo || selectedTrip.truck.plateNumber || selectedTrip.truck.licensePlate || 'N/A'}
                                                    </p>
                                                    {selectedTrip.truck.makeModel && (
                                                        <p className="text-xs text-gray-600 mt-1">{selectedTrip.truck.makeModel}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Trailer Details */}
                                            {selectedTrip.trailer && (
                                                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">Trailer</p>
                                                    <p className="text-gray-900 font-semibold">
                                                        {selectedTrip.trailer.trailerNumber || selectedTrip.trailer.unitNo || selectedTrip.trailer.plateNumber || selectedTrip.trailer.licensePlate || 'N/A'}
                                                    </p>
                                                    {selectedTrip.trailer.type && (
                                                        <p className="text-xs text-gray-600 mt-1">Type: {selectedTrip.trailer.type}</p>
                                                    )}
                                                    {selectedTrip.trailer.capacity && (
                                                        <p className="text-xs text-gray-600">Capacity: {selectedTrip.trailer.capacity}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Miles Covered */}
                                            {selectedTrip.route?.totalDistance !== undefined && (
                                                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">Distance</p>
                                                    <p className="text-gray-900 font-semibold">
                                                        {Math.round(selectedTrip.route.totalDistance * 0.621371).toLocaleString()} miles
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        ({selectedTrip.route.totalDistance.toLocaleString()} km)
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                            style={focusRingStyle}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Odometer</label>
                                        <input
                                            type="number"
                                            name="odometer"
                                            value={formData.odometer}
                                            onChange={handleInputChange}
                                            placeholder="Odometer"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                            style={focusRingStyle}
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
                                                className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:border-transparent"
                                                style={focusRingStyle}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            name="volume"
                                            value={formData.volume}
                                            onChange={handleInputChange}
                                            placeholder="Enter volume"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:border-transparent"
                                            style={focusRingStyle}
                                        />
                                        <select
                                            name="volumeUnit"
                                            value={formData.volumeUnit}
                                            onChange={handleInputChange}
                                            className="px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:border-transparent"
                                            style={focusRingStyle}
                                        >
                                            <option value="ml">ml</option>
                                            <option value="cl">cl</option>
                                            <option value="dl">dl</option>
                                            <option value="dm³">dm³</option>
                                            <option value="l">L</option>
                                            <option value="gal">gal</option>
                                            <option value="pt">pt</option>
                                            <option value="qt">qt</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address / Notes</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows={3}
                                        placeholder="Where was the fuel purchased? Any extra details?"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                        style={focusRingStyle}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer - Fixed to bottom */}
                <div className="flex-shrink-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                    <button
                        onClick={handleClose}
                        disabled={loadingSubmit}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loadingSubmit}
                        className="px-6 py-2 rounded-lg !text-white font-semibold transition-colors disabled:opacity-60"
                        style={{ background: FLEET_COLORS.gradient }}
                    >
                        {loadingSubmit ? 'Saving...' : 'Submit Fuel Report'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default NewFuelReportSidebar;
