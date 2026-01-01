import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Truck, Search, ChevronLeft, ChevronRight, MapPin, User, Gauge, Fuel, X } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import { getSocket } from "../../../../socket/socketClient";
import { getVehiclesWithTracking } from '../../../../axios/api/distapcher';

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

    // Fetch vehicles from backend with Samsara tracking data
    const fetchVehiclesData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch vehicles with tracking data from Vehicle model
            // Note: search is handled client-side by filtering
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
    }, [selectedVehicle]); // Only re-fetch when selectedVehicle changes

    // Initial fetch on mount
    useEffect(() => {
        fetchVehiclesData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Refresh vehicles periodically to get latest tracking data from Samsara
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            fetchVehiclesData();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(refreshInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only set up interval once

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
        if (!map || !isLoaded || !window.google || !window.google.maps) {
            console.warn('⚠️ Cannot update markers: Google Maps API not ready');
            return;
        }

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
                
                // Create truck icon SVG
                const createTruckIcon = (color: string) => {
                    // Create SVG for truck icon with status color
                    const svg = `
                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="18" fill="white" stroke="${color}" stroke-width="2"/>
                            <g transform="translate(8, 10)">
                                <!-- Truck body -->
                                <rect x="2" y="6" width="16" height="8" fill="${color}" rx="1"/>
                                <!-- Truck cabin -->
                                <rect x="2" y="4" width="8" height="6" fill="${color}" rx="1"/>
                                <!-- Truck window -->
                                <rect x="3" y="5" width="6" height="3" fill="white" opacity="0.8"/>
                                <!-- Wheels -->
                                <circle cx="6" cy="16" r="2.5" fill="#333"/>
                                <circle cx="14" cy="16" r="2.5" fill="#333"/>
                            </g>
                        </svg>
                    `;
                    return {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
                        scaledSize: new window.google.maps.Size(40, 40),
                        anchor: new window.google.maps.Point(20, 20)
                    };
                };

                const googleMaps = window.google.maps;
                const AdvancedMarkerElement = googleMaps?.marker?.AdvancedMarkerElement;
                
                if (advancedMarkersEnabled && AdvancedMarkerElement) {
                    // Create custom truck icon element for AdvancedMarkerElement
                    const markerElement = document.createElement('div');
                    markerElement.style.width = '40px';
                    markerElement.style.height = '40px';
                    markerElement.style.position = 'relative';
                    markerElement.style.cursor = 'pointer';
                    
                    // Create SVG truck icon
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('width', '40');
                    svg.setAttribute('height', '40');
                    svg.setAttribute('viewBox', '0 0 40 40');
                    
                    // White circle background
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', '20');
                    circle.setAttribute('cy', '20');
                    circle.setAttribute('r', '18');
                    circle.setAttribute('fill', 'white');
                    circle.setAttribute('stroke', markerColor);
                    circle.setAttribute('stroke-width', '2');
                    svg.appendChild(circle);
                    
                    // Truck body group
                    const truckGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    truckGroup.setAttribute('transform', 'translate(8, 10)');
                    
                    // Truck body
                    const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    body.setAttribute('x', '2');
                    body.setAttribute('y', '6');
                    body.setAttribute('width', '16');
                    body.setAttribute('height', '8');
                    body.setAttribute('fill', markerColor);
                    body.setAttribute('rx', '1');
                    truckGroup.appendChild(body);
                    
                    // Truck cabin
                    const cabin = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    cabin.setAttribute('x', '2');
                    cabin.setAttribute('y', '4');
                    cabin.setAttribute('width', '8');
                    cabin.setAttribute('height', '6');
                    cabin.setAttribute('fill', markerColor);
                    cabin.setAttribute('rx', '1');
                    truckGroup.appendChild(cabin);
                    
                    // Truck window
                    const windowRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    windowRect.setAttribute('x', '3');
                    windowRect.setAttribute('y', '5');
                    windowRect.setAttribute('width', '6');
                    windowRect.setAttribute('height', '3');
                    windowRect.setAttribute('fill', 'white');
                    windowRect.setAttribute('opacity', '0.8');
                    truckGroup.appendChild(windowRect);
                    
                    // Wheels
                    const wheel1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    wheel1.setAttribute('cx', '6');
                    wheel1.setAttribute('cy', '16');
                    wheel1.setAttribute('r', '2.5');
                    wheel1.setAttribute('fill', '#333');
                    truckGroup.appendChild(wheel1);
                    
                    const wheel2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    wheel2.setAttribute('cx', '14');
                    wheel2.setAttribute('cy', '16');
                    wheel2.setAttribute('r', '2.5');
                    wheel2.setAttribute('fill', '#333');
                    truckGroup.appendChild(wheel2);
                    
                    svg.appendChild(truckGroup);
                    markerElement.appendChild(svg);

                    marker = new AdvancedMarkerElement({
                        position: { lat, lng },
                        map,
                        title: `${vehicle.plateNumber} - ${vehicle.status}`,
                        content: markerElement
                    });
                } else {
                    // Use custom truck icon for standard markers
                    marker = new googleMaps.Marker({
                        position: { lat, lng },
                        map,
                        title: `${vehicle.plateNumber} - ${vehicle.status}`,
                        icon: createTruckIcon(markerColor)
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
    }, [map, vehicles, advancedMarkersEnabled, handleVehicleClick, isLoaded]);

    // Update markers when vehicles or map changes
    useEffect(() => {
        if (map && vehicles.length > 0 && isLoaded && window.google && window.google.maps) {
            updateMarkers();
        }
    }, [map, vehicles, updateMarkers, isLoaded]);

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
                {!isLoaded && !loadError && (
                    <div className="absolute inset-0 bg-[#EDF8FF] flex items-center justify-center z-10">
                        <div className="text-center text-gray-600 space-y-2">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-sm">Loading Google Maps...</p>
                        </div>
                    </div>
                )}
                {loadError && (
                    <div className="absolute inset-0 bg-[#EDF8FF] flex items-center justify-center z-10">
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
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-10">
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
                <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-lg text-xs z-10">
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
