import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Truck, Search, ChevronLeft, ChevronRight, MapPin, User, Gauge, Fuel, X } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import { getSocket } from "../../../../socket/socketClient";
import { listFleetUnits, type FleetUnitDto } from '../../../../axios/api/fleet.units';

// Type definitions
interface Driver {
    _id: string;
    name: string;
    email: string;
    phone: string;
}

// Use FleetUnit for trucks (unitType === "Truck")
type Vehicle = Omit<FleetUnitDto, 'status' | 'currentLocation'> & {
    plateNumber: string; // Mapped from licensePlate
    status: 'moving' | 'idle' | 'stopped' | 'maintenance'; // Mapped from operationStatus
    make: string;
    model: string;
    year: number;
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
};

declare global {
    interface Window {
        google: any;
    }
}

const GOOGLE_MAPS_API_KEY = "AIzaSyBE6Ii-ZxHsICvzD2Fp3m3iMPYX-Vie1N4";
const GOOGLE_MAPS_LIBRARIES: Libraries = ["marker", "places"];
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID?.trim() || "AIzaSyBE6Ii-ZxHsICvzD2Fp3m3iMPYX-Vie1N4";

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

const ProfessionalTruckTracker: React.FC = () => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-maps-api',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [advancedMarkersEnabled, setAdvancedMarkersEnabled] = useState<boolean>(false);

    const socket = useMemo(() => getSocket(), []);

    // Fetch vehicles from backend
    const fetchVehiclesData = useCallback(async () => {
        setLoading(true);
        try {
            const userInfoString = localStorage.getItem('userInfo');
            let userInfo: any = null;
            if (userInfoString) {
                try {
                    userInfo = JSON.parse(userInfoString);
                } catch (err) {
                    console.error('Error parsing userInfo from localStorage:', err);
                }
            }

            // Handle different userInfo structures (userData.company or direct company)
            const userRole = userInfo?.role || userInfo?.userData?.role;
            const userCompany = userInfo?.company || userInfo?.userData?.company;
            const isSuperadmin = userRole === 'superadmin';
            const isDispatcher = userRole === 'dispatcher';
            const hasCompany = Boolean(userCompany);

            // Allow dispatchers to call API even if company is not visible in localStorage
            // The backend will handle company filtering based on the authenticated user
            if (userInfo && !isSuperadmin && !isDispatcher && !hasCompany) {
                setVehicles([]);
                return;
            }

            // Fetch trucks from FleetUnit (unitType === "Truck")
            const res = await listFleetUnits({ category: "trucks" });
            if (res?.success && res.data) {
                const data = Array.isArray(res.data) ? res.data : [];
                // Map FleetUnit to Vehicle format for compatibility
                const formatted = data.map((v: FleetUnitDto): Vehicle => ({
                    ...v,
                    plateNumber: v.licensePlate || v.unitNo,
                    status: (v.operationStatus === "in-transit" ? "moving" : 
                            v.operationStatus === "maintenance" ? "maintenance" :
                            v.operationStatus === "idle" ? "idle" : "stopped") as 'moving' | 'idle' | 'stopped' | 'maintenance',
                    make: v.make || "",
                    model: v.model || "",
                    year: v.year || 0,
                    speed: (v as any).speed || 0,
                    fuelLevel: (v as any).fuelLevel || 0,
                    odometer: v.currentOdometer || 0,
                    engineOn: (v as any).engineOn || false,
                    currentLocation: {
                        address: v.currentLocation?.address || "",
                        latitude: Number(v.currentLocation?.latitude ?? 0),
                        longitude: Number(v.currentLocation?.longitude ?? 0),
                        updatedAt: v.currentLocation?.updatedAt || new Date().toISOString()
                    }
                }));
                setVehicles(formatted);
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

    useEffect(() => {
        fetchVehiclesData();
    }, [fetchVehiclesData]);

    // Handle vehicle selection
    const handleVehicleClick = useCallback((vehicle: Vehicle) => {
        console.log('🚛 Vehicle selected:', vehicle.plateNumber);
        setSelectedVehicle(vehicle);
        
        // Center map on selected vehicle
        const lat = Number(vehicle.currentLocation?.latitude);
        const lng = Number(vehicle.currentLocation?.longitude);
        if (!isNaN(lat) && !isNaN(lng) && map) {
            map.setCenter({ lat, lng });
            map.setZoom(15);
            console.log('🗺️ Map centered on selected vehicle');
        }
        
        // Leave previous vehicle updates
        socket.emit("leaveVehicle");
        
        // Join new vehicle updates (use internalId if available, otherwise _id)
        const vehicleId = vehicle.internalId || vehicle._id;
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
                if (!isNaN(newLat) && !isNaN(newLng) && map) {
                    map.setCenter({ lat: newLat, lng: newLng });
                }
                
                // Update marker position
                updateMarkers();
            }
        });
    }, [socket, map]);

    // Separate function to initialize the map
    const initializeMap = useCallback((mapElement: HTMLElement) => {
        if (map) {
            console.log('⚠️ Map already initialized, skipping...');
            return; // Prevent double initialization
        }
        
        console.log('🗺️ Initializing Google Map...');
        
        // Use first vehicle location as center if available, otherwise use default
        let center = { lat: 20.5937, lng: 78.9629 }; // Default to India
        let zoom = 5;
        
        if (vehicles.length > 0 && vehicles[0].currentLocation) {
            const firstVehicle = vehicles[0];
            const lat = Number(firstVehicle.currentLocation.latitude);
            const lng = Number(firstVehicle.currentLocation.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                center = { lat, lng };
                zoom = 12;
                console.log('📍 Centering map on first vehicle:', firstVehicle.plateNumber, center);
            }
        }
        
        const mapOptions: google.maps.MapOptions = {
            center,
            zoom,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            clickableIcons: true,
            gestureHandling: 'greedy',
            fullscreenControl: false,
            streetViewControl: false,
        };

        if (GOOGLE_MAPS_MAP_ID) {
            mapOptions.mapId = GOOGLE_MAPS_MAP_ID;
            console.log('✅ Using Google Maps Map ID:', GOOGLE_MAPS_MAP_ID);
        } else {
            mapOptions.styles = [{
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }];
            console.warn('⚠️ VITE_GOOGLE_MAP_ID not set, using standard map');
        }

        try {
            const rect = mapElement.getBoundingClientRect();
            console.log('📐 Map element dimensions:', { width: rect.width, height: rect.height });
            
            // Wait for element to have dimensions
            if (rect.width === 0 || rect.height === 0) {
                console.log('⏳ Waiting for map element dimensions...');
                const checkDimensions = setInterval(() => {
                    const newRect = mapElement.getBoundingClientRect();
                    if (newRect.width > 0 && newRect.height > 0) {
                        clearInterval(checkDimensions);
                        const newMap = new window.google.maps.Map(mapElement, mapOptions);
                        console.log('✅ Google Map initialized successfully (after dimension check)');
                        setMap(newMap);
                        setAdvancedMarkersEnabled(Boolean(GOOGLE_MAPS_MAP_ID && window.google?.maps?.marker?.AdvancedMarkerElement));
                        
                        // Trigger resize after a short delay to ensure map renders properly
                        setTimeout(() => {
                            if (newMap) {
                                window.google.maps.event.trigger(newMap, 'resize');
                                console.log('✅ Map resize triggered');
                            }
                        }, 300);
                    }
                }, 50);
                
                // Cleanup interval after 5 seconds
                setTimeout(() => clearInterval(checkDimensions), 5000);
                return;
            }

            const newMap = new window.google.maps.Map(mapElement, mapOptions);
            console.log('✅ Google Map initialized successfully');
            setMap(newMap);
            setAdvancedMarkersEnabled(Boolean(GOOGLE_MAPS_MAP_ID && window.google?.maps?.marker?.AdvancedMarkerElement));
            
            // Trigger resize after initialization to ensure proper rendering
            setTimeout(() => {
                if (newMap) {
                    window.google.maps.event.trigger(newMap, 'resize');
                    console.log('✅ Map resize triggered');
                }
            }, 300);
        } catch (error) {
            console.error('❌ Error initializing map:', error);
        }
    }, [map, vehicles]);

    // Initialize map - only run once when Google Maps API is loaded
    useEffect(() => {
        if (!isLoaded || !window.google || !window.google.maps || map) {
            return;
        }

        const mapElement = document.getElementById('truck-google-map');
        if (!mapElement) {
            console.warn('⚠️ Map element not found, retrying...');
            // Retry after a short delay
            const timeoutId = setTimeout(() => {
                const retryElement = document.getElementById('truck-google-map');
                if (retryElement && !map) {
                    initializeMap(retryElement);
                }
            }, 100);
            return () => clearTimeout(timeoutId);
        }

        initializeMap(mapElement);
    }, [isLoaded, map, initializeMap]); // Include initializeMap in dependencies

    // Re-center map when vehicles are loaded (only if map already exists)
    useEffect(() => {
        if (map && vehicles.length > 0 && vehicles[0].currentLocation && !selectedVehicle) {
            const firstVehicle = vehicles[0];
            const lat = Number(firstVehicle.currentLocation.latitude);
            const lng = Number(firstVehicle.currentLocation.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                map.setCenter({ lat, lng });
                map.setZoom(12);
                console.log('📍 Map re-centered on first vehicle:', firstVehicle.plateNumber);
            }
        }
    }, [map, vehicles, selectedVehicle]);

    // Update markers on map
    const updateMarkers = useCallback(() => {
        if (!map || !window.google || !window.google.maps) return;

        // Clear existing markers
        markers.forEach(marker => {
            if (marker && typeof marker.setMap === 'function') {
                marker.setMap(null);
            }
        });

        const newMarkers: any[] = [];

        vehicles.forEach((vehicle) => {
            const lat = Number(vehicle.currentLocation?.latitude);
            const lng = Number(vehicle.currentLocation?.longitude);
            
            if (isNaN(lat) || isNaN(lng)) {
                console.error('❌ Invalid coordinates for vehicle:', vehicle.plateNumber);
                return;
            }

            const markerColor = statusColors[vehicle.status] || '#6b7280';

            try {
                let marker;
                if (advancedMarkersEnabled && window.google?.maps?.marker?.AdvancedMarkerElement) {
                    const markerElement = document.createElement('div');
                    markerElement.style.width = '24px';
                    markerElement.style.height = '24px';
                    markerElement.style.borderRadius = '50%';
                    markerElement.style.background = markerColor;
                    markerElement.style.border = '3px solid white';
                    markerElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                    markerElement.style.cursor = 'pointer';

                    marker = new window.google.maps.marker.AdvancedMarkerElement({
                        position: { lat, lng },
                        map,
                        title: `${vehicle.plateNumber} - ${vehicle.status}`,
                        content: markerElement
                    });
                } else {
                    marker = new window.google.maps.Marker({
                        position: { lat, lng },
                        map,
                        title: `${vehicle.plateNumber} - ${vehicle.status}`,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: markerColor,
                            fillOpacity: 0.8,
                            strokeColor: '#ffffff',
                            strokeWeight: 2
                        }
                    });
                }

                // Add click listener
                marker.addListener('click', () => {
                    handleVehicleClick(vehicle);
                });

                newMarkers.push(marker);
            } catch (error) {
                console.error('❌ Error creating marker:', error);
            }
        });

        setMarkers(newMarkers);
        console.log('✅ Markers updated:', newMarkers.length);
    }, [map, vehicles, advancedMarkersEnabled, handleVehicleClick]);

    // Update markers when vehicles or map changes
    useEffect(() => {
        if (map && vehicles.length > 0) {
            updateMarkers();
        }
    }, [map, vehicles, updateMarkers]);

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
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Left Sidebar */}
            <div
                className={`bg-white shadow-xl transition-all duration-300 ease-in-out ${
                    sidebarCollapsed ? "w-0" : "w-96"
                } overflow-hidden`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Truck className="w-6 h-6" />
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
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by plate number..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Vehicle List */}
                    <div className="flex-1 overflow-y-auto p-4">
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
                                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                                            selectedVehicle?._id === v._id
                                                ? "bg-blue-50 border-blue-400 shadow-md"
                                                : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                                        }`}
                                    >
                                        {/* Plate Number & Status */}
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-lg text-gray-800">
                                                {v.plateNumber}
                                            </h3>
                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-semibold"
                                                style={{
                                                    backgroundColor: statusBgColors[v.status],
                                                    color: statusColors[v.status],
                                                }}
                                            >
                                                {v.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Vehicle Details */}
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <User className="w-4 h-4" />
                                                <span>
                                                    {v.driver ? v.driver.name : "No driver assigned"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="w-4 h-4" />
                                                <span className="truncate">{v.currentLocation?.address || 'Location unavailable'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                                <span className="flex items-center gap-1">
                                                    <Gauge className="w-4 h-4" />
                                                    {v.speed} km/h
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Fuel className="w-4 h-4" />
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
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-3 rounded-r-lg shadow-lg hover:bg-blue-700 transition-colors z-10"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}

            {/* Right Map */}
            <div className="flex-1 relative" style={{ height: '100vh', minHeight: '100vh' }}>
                {!isLoaded && !loadError && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                        <div className="text-center text-gray-600 space-y-2">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-sm">Loading Google Maps...</p>
                        </div>
                    </div>
                )}
                {loadError && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                        <div className="text-center text-gray-600 space-y-2">
                            <div className="font-semibold text-red-500">Failed to load Google Maps</div>
                            <p className="text-sm">Please check your network connection and try again.</p>
                            <p className="text-xs text-gray-500 mt-2">Error: {loadError.message || 'Unknown error'}</p>
                        </div>
                    </div>
                )}
                {/* Always render map container to prevent it from being destroyed */}
                <div 
                    id="truck-google-map" 
                    className="absolute inset-0 w-full h-full"
                    style={{ 
                        width: '100%', 
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: isLoaded ? 'transparent' : '#e5e7eb'
                    }}
                ></div>

                {/* Selected Vehicle Info Panel */}
                {selectedVehicle && (
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-gray-800">{selectedVehicle.plateNumber}</h3>
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
                <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg text-xs z-10">
                    <div className="font-semibold mb-2">Vehicle Status:</div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#10b981'}}></div>
                            <span>Moving</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#f59e0b'}}></div>
                            <span>Idle</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#ef4444'}}></div>
                            <span>Stopped</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#6b7280'}}></div>
                            <span>Maintenance</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalTruckTracker;
