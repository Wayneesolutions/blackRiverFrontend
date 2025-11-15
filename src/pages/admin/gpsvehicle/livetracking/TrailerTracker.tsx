import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Package, Search, ChevronLeft, ChevronRight, MapPin, Truck, Gauge, X } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import { getSocket } from "../../../../socket/socketClient";
import { listTrailers } from '../../../../axios/api/trailerTracking';

// Type definitions
interface Trailer {
    _id: string;
    trailer: string;
    plateNumber: string;
    type: 'dry_van' | 'refrigerated' | 'flatbed' | 'tanker' | 'container';
    capacity: string;
    status: 'moving' | 'idle' | 'stopped' | 'maintenance';
    speed: number;
    isAttached: boolean;
    attachedVehicle?: {
        _id: string;
        plateNumber: string;
        make: string;
        model: string;
        driver?: {
            _id: string;
            name: string;
        };
    };
    currentLocation: {
        address: string;
        longitude: string | number;
        latitude: string | number;
        updatedAt: string | Date;
    };
    internalId?: string; // For Geotab integration
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

const ProfessionalTrailerTracker: React.FC = () => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-maps-api',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const [trailers, setTrailers] = useState<Trailer[]>([]);
    const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [advancedMarkersEnabled, setAdvancedMarkersEnabled] = useState<boolean>(false);

    const socket = useMemo(() => getSocket(), []);

    // Handle trailer selection
    const handleTrailerClick = useCallback((trailer: Trailer) => {
        console.log('🚛 Trailer selected:', trailer.plateNumber);
        setSelectedTrailer(trailer);
        
        // Center map on selected trailer
        const lat = Number(trailer.currentLocation?.latitude);
        const lng = Number(trailer.currentLocation?.longitude);
        if (!isNaN(lat) && !isNaN(lng) && map) {
            map.setCenter({ lat, lng });
            map.setZoom(15);
            console.log('🗺️ Map centered on selected trailer');
        }
        
        // Leave previous trailer updates
        socket.emit("leaveTrailer");
        
        // Join new trailer updates (use internalId if available, otherwise _id)
        const trailerId = trailer.internalId || trailer._id;
        if (trailerId) {
            socket.emit("joinTrailer", trailerId);
        }
        
        // Listen for trailer updates
        socket.off("trailerLocation");
        socket.on("trailerLocation", (data) => {
            console.log('📍 Trailer location update:', data.plateNumber);
            setTrailers((prev) =>
                prev.map((t) => (t._id === data._id ? { ...t, ...data } : t))
            );
            
            if (trailer._id === data._id) {
                setSelectedTrailer((prev) => prev ? { ...prev, ...data } : data);
                
                // Update map center for real-time tracking
                const newLat = Number(data.currentLocation?.latitude);
                const newLng = Number(data.currentLocation?.longitude);
                if (!isNaN(newLat) && !isNaN(newLng) && map) {
                    map.setCenter({ lat: newLat, lng: newLng });
                }
            }
        });
    }, [socket, map]);

    // Fetch trailers from backend
    const fetchTrailersData = useCallback(async () => {
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

            if (userInfo && userInfo.role !== 'superadmin' && !userInfo.company) {
                setTrailers([]);
                return;
            }

            const res = await listTrailers();
            if (res?.success) {
                const data = res.data || [];
                const formatted = data.map((t: any) => ({
                    ...t,
                    currentLocation: {
                        ...t.currentLocation,
                        latitude: Number(t.currentLocation?.latitude ?? 0),
                        longitude: Number(t.currentLocation?.longitude ?? 0),
                        updatedAt: t.currentLocation?.updatedAt || new Date().toISOString()
                    }
                }));
                setTrailers(formatted);
                if (formatted.length > 0 && !selectedTrailer) {
                    handleTrailerClick(formatted[0]);
                }
            } else {
                setTrailers([]);
            }
        } catch (err) {
            console.error('Error fetching trailers:', err);
            setTrailers([]);
        } finally {
            setLoading(false);
        }
    }, [selectedTrailer, handleTrailerClick]);

    useEffect(() => {
        fetchTrailersData();
    }, [fetchTrailersData]);

    // Initialize map
    useEffect(() => {
        if (isLoaded && window.google && window.google.maps) {
            const mapElement = document.getElementById('trailer-google-map');
            if (mapElement && !map) {
                console.log('🗺️ Initializing Google Map...');
                
                // Use first trailer location as center if available, otherwise use default
                let center = { lat: 20.5937, lng: 78.9629 }; // Default to India
                let zoom = 5;
                
                if (trailers.length > 0 && trailers[0].currentLocation) {
                    const firstTrailer = trailers[0];
                    const lat = Number(firstTrailer.currentLocation.latitude);
                    const lng = Number(firstTrailer.currentLocation.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        center = { lat, lng };
                        zoom = 12;
                        console.log('📍 Centering map on first trailer:', firstTrailer.plateNumber, center);
                    }
                }
                
                const mapOptions: google.maps.MapOptions = {
                    center,
                    zoom,
                    mapTypeId: window.google.maps.MapTypeId.ROADMAP,
                    clickableIcons: true,
                    gestureHandling: 'greedy',
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
                    
                    if (rect.width === 0 || rect.height === 0) {
                        setTimeout(() => {
                            const newMap = new window.google.maps.Map(mapElement, mapOptions);
                            console.log('✅ Google Map initialized successfully (delayed)');
                            setMap(newMap);
                            setAdvancedMarkersEnabled(Boolean(GOOGLE_MAPS_MAP_ID && window.google?.maps?.marker?.AdvancedMarkerElement));
                            setTimeout(() => {
                                window.google.maps.event.trigger(newMap, 'resize');
                            }, 200);
                        }, 200);
                    } else {
                        const newMap = new window.google.maps.Map(mapElement, mapOptions);
                        console.log('✅ Google Map initialized successfully');
                        setMap(newMap);
                        setAdvancedMarkersEnabled(Boolean(GOOGLE_MAPS_MAP_ID && window.google?.maps?.marker?.AdvancedMarkerElement));
                        setTimeout(() => {
                            window.google.maps.event.trigger(newMap, 'resize');
                        }, 200);
                    }
                } catch (error) {
                    console.error('❌ Error initializing map:', error);
                }
            } else if (map && trailers.length > 0 && trailers[0].currentLocation) {
                // Re-center map when trailers are loaded
                const firstTrailer = trailers[0];
                const lat = Number(firstTrailer.currentLocation.latitude);
                const lng = Number(firstTrailer.currentLocation.longitude);
                if (!isNaN(lat) && !isNaN(lng)) {
                    map.setCenter({ lat, lng });
                    map.setZoom(12);
                    console.log('📍 Map re-centered on first trailer:', firstTrailer.plateNumber);
                }
            }
        }
    }, [isLoaded, map, trailers]);

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

        trailers.forEach((trailer) => {
            const lat = Number(trailer.currentLocation?.latitude);
            const lng = Number(trailer.currentLocation?.longitude);
            
            if (isNaN(lat) || isNaN(lng)) {
                console.error('❌ Invalid coordinates for trailer:', trailer.plateNumber);
                return;
            }

            const markerColor = statusColors[trailer.status] || '#6b7280';

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
                        title: `${trailer.plateNumber} - ${trailer.status}`,
                        content: markerElement
                    });
                } else {
                    marker = new window.google.maps.Marker({
                        position: { lat, lng },
                        map,
                        title: `${trailer.plateNumber} - ${trailer.status}`,
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
                    handleTrailerClick(trailer);
                });

                newMarkers.push(marker);
            } catch (error) {
                console.error('❌ Error creating marker:', error);
            }
        });

        setMarkers(newMarkers);
        console.log('✅ Markers updated:', newMarkers.length);
    }, [map, trailers, advancedMarkersEnabled, handleTrailerClick]);

    // Update markers when trailers or map changes
    useEffect(() => {
        if (map && trailers.length > 0) {
            updateMarkers();
        }
    }, [map, trailers, updateMarkers]);

    // Filter trailers by search
    const filteredTrailers = trailers.filter(trailer => {
        const searchLower = searchTerm.toLowerCase();
        return (
            trailer.plateNumber.toLowerCase().includes(searchLower) ||
            trailer.trailer.toLowerCase().includes(searchLower) ||
            trailer.type.toLowerCase().includes(searchLower) ||
            (trailer.attachedVehicle?.plateNumber && trailer.attachedVehicle.plateNumber.toLowerCase().includes(searchLower))
        );
    });

    if (loading && trailers.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading trailer tracking data...</p>
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
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Package className="w-6 h-6" />
                                Trailer Tracker
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

                    {/* Trailer List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filteredTrailers.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No trailers found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTrailers.map((t) => (
                                    <div
                                        key={t._id}
                                        onClick={() => handleTrailerClick(t)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                                            selectedTrailer?._id === t._id
                                                ? "bg-purple-50 border-purple-400 shadow-md"
                                                : "bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm"
                                        }`}
                                    >
                                        {/* Plate Number & Status */}
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-lg text-gray-800">
                                                {t.plateNumber}
                                            </h3>
                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-semibold"
                                                style={{
                                                    backgroundColor: statusBgColors[t.status],
                                                    color: statusColors[t.status],
                                                }}
                                            >
                                                {t.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Trailer Details */}
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Package className="w-4 h-4" />
                                                <span>{t.trailer} - {t.type}</span>
                                            </div>
                                            {t.attachedVehicle && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Truck className="w-4 h-4" />
                                                    <span>
                                                        Attached to: {t.attachedVehicle.plateNumber}
                                                        {t.attachedVehicle.driver && ` (${t.attachedVehicle.driver.name})`}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="w-4 h-4" />
                                                <span className="truncate">{t.currentLocation?.address || 'Location unavailable'}</span>
                                            </div>
                                            {t.speed !== undefined && (
                                                <div className="flex items-center gap-1 text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                                    <Gauge className="w-4 h-4" />
                                                    <span>{t.speed} km/h</span>
                                                </div>
                                            )}
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
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white p-3 rounded-r-lg shadow-lg hover:bg-purple-700 transition-colors z-10"
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
                {isLoaded && (
                    <div 
                        id="trailer-google-map" 
                        className="absolute inset-0 w-full h-full"
                        style={{ 
                            width: '100%', 
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0
                        }}
                    ></div>
                )}

                {/* Selected Trailer Info Panel */}
                {selectedTrailer && (
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-gray-800">{selectedTrailer.plateNumber}</h3>
                            <button
                                onClick={() => setSelectedTrailer(null)}
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
                                        backgroundColor: statusBgColors[selectedTrailer.status],
                                        color: statusColors[selectedTrailer.status],
                                    }}
                                >
                                    {selectedTrailer.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Type</span>
                                <span className="font-medium">{selectedTrailer.type}</span>
                            </div>
                            {selectedTrailer.speed !== undefined && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Speed</span>
                                    <span className="font-medium">{selectedTrailer.speed} km/h</span>
                                </div>
                            )}
                            {selectedTrailer.attachedVehicle && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Attached Vehicle</span>
                                    <span className="font-medium">{selectedTrailer.attachedVehicle.plateNumber}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500 truncate">
                                    {selectedTrailer.currentLocation?.address || 'Location unavailable'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Legend */}
                <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg text-xs z-10">
                    <div className="font-semibold mb-2">Trailer Status:</div>
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

export default ProfessionalTrailerTracker;
