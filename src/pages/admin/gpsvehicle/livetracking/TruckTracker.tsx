import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RefreshCw, Truck, Search, ChevronLeft, ChevronRight, MapPin, User, Gauge, Fuel, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getSocket } from "../../../../socket/socketClient";
import { getVehiclesWithTracking } from '../../../../axios/api/distapcher';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Type definitions
interface Driver {
    _id: string;
    name: string;
    email: string;
    phone: string;
}

interface Vehicle {
    _id: string;
    unitNumber?: string;
    internalId?: string;
    plateNumber: string;
    trackingKey?: string;
    status: 'moving' | 'idle' | 'stopped' | 'maintenance' | 'In Service' | 'Out of Service' | 'Maintenance';
    operationStatus?: string;
    make: string;
    model: string;
    year?: number | string;
    speed: number;
    fuelLevel: number;
    odometer: number;
    engineOn: boolean;
    currentLocation: {
        address: string;
        longitude: string | number;
        latitude: string | number;
        updatedAt: string | Date;
    };
    driver?: Driver;
    vinNumber?: string;
    type?: string;
    ownership?: string;
}

const statusColors: Record<string, string> = {
    moving: "#10b981",
    idle: "#f59e0b",
    stopped: "#ef4444",
    maintenance: "#6b7280",
};

const statusBgColors: Record<string, string> = {
    moving: "#d1fae5",
    idle: "#fef3c7",
    stopped: "#fee2e2",
    maintenance: "#f3f4f6",
};

// Component to handle map center updates
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    
    useEffect(() => {
        map.setView(center, zoom);
    }, [map, center, zoom]);
    
    return null;
};

// Create custom truck icon for Leaflet
const createTruckIcon = (color: string) => {
    const svg = `
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="white" stroke="${color}" stroke-width="2"/>
            <g transform="translate(8, 10)">
                <rect x="2" y="6" width="16" height="8" fill="${color}" rx="1"/>
                <rect x="2" y="4" width="8" height="6" fill="${color}" rx="1"/>
                <rect x="3" y="5" width="6" height="3" fill="white" opacity="0.8"/>
                <circle cx="6" cy="16" r="2.5" fill="#333"/>
                <circle cx="14" cy="16" r="2.5" fill="#333"/>
            </g>
        </svg>
    `;
    
    return L.divIcon({
        html: svg,
        className: 'custom-truck-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
};

const ProfessionalTruckTracker: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Default to India
    const [mapZoom, setMapZoom] = useState<number>(5);
    const mapRef = useRef<L.Map | null>(null);

    const socket = useMemo(() => getSocket(), []);

    // Fetch vehicles from backend with Vehicle model data
    const fetchVehiclesData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch vehicles from Vehicle model (not requiring trackingKey)
            const res = await getVehiclesWithTracking({ 
                limit: 1000
            });
            
            if (res?.success && res.data) {
                const vehiclesData = Array.isArray(res.data) ? res.data : [];
                
                // Map Vehicle model data to Vehicle format for display
                const formatted = vehiclesData.map((v: any): Vehicle => {
                    // Map status from Vehicle model to tracking status
                    let trackingStatus: 'moving' | 'idle' | 'stopped' | 'maintenance' = 'stopped';
                    if (v.status === 'moving' || v.operationStatus === 'in_transit' || v.operationStatus === 'in-transit') {
                        trackingStatus = 'moving';
                    } else if (v.status === 'idle' || v.operationStatus === 'idle') {
                        trackingStatus = 'idle';
                    } else if (v.status === 'maintenance' || v.operationStatus === 'MAINTENANCE' || v.operationStatus === 'maintenance') {
                        trackingStatus = 'maintenance';
                    } else if (v.engineOn && v.speed > 0) {
                        trackingStatus = 'moving';
                    } else if (v.engineOn && v.speed === 0) {
                        trackingStatus = 'idle';
                    }

                    return {
                        _id: v._id,
                        unitNumber: v.unitNumber || v.internalId || '',
                        internalId: v.internalId || v.unitNumber || '',
                        plateNumber: v.plateNumber || '',
                        trackingKey: v.trackingKey || '',
                        status: trackingStatus,
                        operationStatus: v.operationStatus || '',
                        make: v.make || '',
                        model: v.model || '',
                        year: v.year || 0,
                        speed: v.speed || 0,
                        fuelLevel: v.fuelLevel || 0,
                        odometer: v.odometer || 0,
                        engineOn: v.engineOn || false,
                        currentLocation: {
                            address: v.currentLocation?.address || '',
                            latitude: Number(v.currentLocation?.latitude ?? 0),
                            longitude: Number(v.currentLocation?.longitude ?? 0),
                            updatedAt: v.currentLocation?.updatedAt || new Date().toISOString()
                        },
                        driver: v.driver ? {
                            _id: v.driver._id || '',
                            name: v.driver.name || '',
                            email: v.driver.email || '',
                            phone: v.driver.phone || ''
                        } : undefined,
                        vinNumber: v.vinNumber || '',
                        type: v.type || '',
                        ownership: v.ownership || ''
                    };
                });
                
                setVehicles(formatted);
                
                // Set map center to first vehicle if available
                if (formatted.length > 0 && formatted[0].currentLocation) {
                    const firstVehicle = formatted[0];
                    const lat = Number(firstVehicle.currentLocation.latitude);
                    const lng = Number(firstVehicle.currentLocation.longitude);
                    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                        setMapCenter([lat, lng]);
                        setMapZoom(12);
                    }
                }
                
                if (formatted.length > 0 && !selectedVehicle) {
                    handleVehicleClick(formatted[0]);
                }
            } else {
                setVehicles([]);
            }
        } catch (err) {
            console.error('Error fetching vehicles:', err);
            setVehicles([]);
        } finally {
            setLoading(false);
        }
    }, [selectedVehicle]);

    // Initial fetch on mount
    useEffect(() => {
        fetchVehiclesData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Refresh vehicles periodically
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            fetchVehiclesData();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(refreshInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle vehicle selection
    const handleVehicleClick = useCallback((vehicle: Vehicle) => {
        console.log('🚛 Vehicle selected:', vehicle.plateNumber);
        setSelectedVehicle(vehicle);

        // Center map on selected vehicle
        const lat = Number(vehicle.currentLocation?.latitude);
        const lng = Number(vehicle.currentLocation?.longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            setMapCenter([lat, lng]);
            setMapZoom(15);
            console.log('🗺️ Map centered on selected vehicle');
        }

        // Leave previous vehicle updates
        socket.emit("leaveVehicle");

        // Join new vehicle updates (use trackingKey if available, otherwise internalId or _id)
        const vehicleId = vehicle.trackingKey || vehicle.internalId || vehicle._id;
        socket.emit("joinVehicle", vehicleId);

        // Listen for vehicle updates
        socket.off("vehicleLocation");
        socket.on("vehicleLocation", (data) => {
            console.log('📍 Vehicle location update:', data.plateNumber);
            setVehicles((prev) =>
                prev.map((v) => (v._id === data._id ? { ...v, ...data } : v))
            );

            if (vehicle._id === data._id) {
                setSelectedVehicle((prev) => prev ? { ...prev, ...data } : data);

                // Update map center for real-time tracking
                const newLat = Number(data.currentLocation?.latitude);
                const newLng = Number(data.currentLocation?.longitude);
                if (!isNaN(newLat) && !isNaN(newLng) && newLat !== 0 && newLng !== 0) {
                    setMapCenter([newLat, newLng]);
                }
            }
        });
    }, [socket]);

    // Filter vehicles by search
    const filteredVehicles = vehicles.filter(vehicle => {
        const searchLower = searchTerm.toLowerCase();
        return (
            vehicle.plateNumber.toLowerCase().includes(searchLower) ||
            vehicle.make.toLowerCase().includes(searchLower) ||
            vehicle.model.toLowerCase().includes(searchLower) ||
            (vehicle.driver?.name && vehicle.driver.name.toLowerCase().includes(searchLower))
        );
    });

    if (loading && vehicles.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading truck tracking data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#EDF8FF] overflow-hidden">
            {/* Left Sidebar */}
            <div
                className={`bg-white shadow-xl transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-0" : "w-72"
                    } overflow-hidden`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="bg-[linear-gradient(90deg,#42aeec_0%,#1db5f5_40%,#0ea3d8_100%)] p-4 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Truck className="w-5 h-5" />
                                Truck Tracker
                            </h2>
                            <button
                                onClick={() => setSidebarCollapsed(true)}
                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by plate number..."
                                className="w-full pl-10 pr-4 py-1.5 text-sm rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Vehicle List */}
                    <div className="flex-1 overflow-y-auto p-3 bg-[#EDF8FF]">
                        {filteredVehicles.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No vehicles found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredVehicles.map((v) => (
                                    <div
                                        key={v._id}
                                        onClick={() => handleVehicleClick(v)}
                                        className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${selectedVehicle?._id === v._id
                                            ? "bg-[#EDF8FF] border-[#42aeec] shadow-md"
                                            : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                                            }`}
                                    >
                                        {/* Plate Number & Status */}
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-base text-gray-800">
                                                {v.plateNumber}
                                            </h3>
                                            <span
                                                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                                style={{
                                                    backgroundColor: statusBgColors[v.status],
                                                    color: statusColors[v.status],
                                                }}
                                            >
                                                {v.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Vehicle Details */}
                                        <div className="space-y-2 text-xs">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <User className="w-3 h-3" />
                                                <span>
                                                    {v.driver ? v.driver.name : "No driver assigned"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate">{v.currentLocation?.address || 'Location unavailable'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                                <span className="flex items-center gap-1">
                                                    <Gauge className="w-3 h-3" />
                                                    {v.speed} km/h
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Fuel className="w-3 h-3" />
                                                    {v.fuelLevel}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar Toggle Button (when closed) */}
            {sidebarCollapsed && (
                <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-r-lg shadow-lg hover:bg-blue-700 transition-colors z-10"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}

            {/* Right Map */}
            <div className="flex-1 relative" style={{ height: '100vh', minHeight: '100vh' }}>
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                    ref={mapRef}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController center={mapCenter} zoom={mapZoom} />
                    
                    {/* Vehicle Markers */}
                    {filteredVehicles.map((vehicle) => {
                        const lat = Number(vehicle.currentLocation?.latitude);
                        const lng = Number(vehicle.currentLocation?.longitude);
                        
                        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                            return null;
                        }
                        
                        const markerColor = statusColors[vehicle.status] || '#6b7280';
                        
                        return (
                            <Marker
                                key={vehicle._id}
                                position={[lat, lng]}
                                icon={createTruckIcon(markerColor)}
                                eventHandlers={{
                                    click: () => {
                                        handleVehicleClick(vehicle);
                                    },
                                }}
                            >
                                <Popup>
                                    <div className="p-2">
                                        <h3 className="font-bold text-sm mb-2">{vehicle.plateNumber}</h3>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Status:</span>
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                                    style={{
                                                        backgroundColor: statusBgColors[vehicle.status],
                                                        color: statusColors[vehicle.status],
                                                    }}
                                                >
                                                    {vehicle.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Speed:</span>
                                                <span className="font-medium">{vehicle.speed} km/h</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Fuel:</span>
                                                <span className="font-medium">{vehicle.fuelLevel}%</span>
                                            </div>
                                            {vehicle.driver && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Driver:</span>
                                                    <span className="font-medium">{vehicle.driver.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* Selected Vehicle Info Panel */}
                {selectedVehicle && (
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-[1000]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-bold text-gray-800">{selectedVehicle.plateNumber}</h3>
                            <button
                                onClick={() => setSelectedVehicle(null)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Status</span>
                                <span
                                    className="px-2 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                        backgroundColor: statusBgColors[selectedVehicle.status],
                                        color: statusColors[selectedVehicle.status],
                                    }}
                                >
                                    {selectedVehicle.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Speed</span>
                                <span className="font-medium">{selectedVehicle.speed} km/h</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Fuel</span>
                                <span className="font-medium">{selectedVehicle.fuelLevel}%</span>
                            </div>
                            {selectedVehicle.driver && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Driver</span>
                                    <span className="font-medium">{selectedVehicle.driver.name}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500 truncate">
                                    {selectedVehicle.currentLocation?.address || 'Location unavailable'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Legend */}
                <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-lg text-xs z-[1000]">
                    <div className="font-semibold mb-2">Vehicle Status:</div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                            <span>Moving</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
                            <span>Idle</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                            <span>Stopped</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6b7280' }}></div>
                            <span>Maintenance</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalTruckTracker;
