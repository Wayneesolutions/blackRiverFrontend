import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    MapPin,
    Truck,
    Package,
    Gauge,
    Circle,
    Filter,
    Search,
    AlertTriangle,
    Navigation,
    Clock,
    Route,
    RefreshCw,
    X,
    ChevronRight,
    Activity,
    Settings,
    Thermometer,
    Weight,
    Lock,
    Unlock
} from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import { getSocket } from "../../../../socket/socketClient";
import { listTrailers } from '../../../../axios/api/trailerTracking';

// Type definitions
interface Location {
    address: string;
    longitude: number;
    latitude: number;
    updatedAt: Date;
}

interface RoutePoint {
    latitude: number;
    longitude: number;
    timestamp: string;
}

interface CargoDetails {
    type: string;
    weight: number;
    capacity: number;
    description: string;
    temperature?: number;
    isRefrigerated: boolean;
}

interface TrailerSensors {
    doorStatus: 'locked' | 'unlocked' | 'open';
    temperature: number;
    humidity: number;
    shockDetection: boolean;
    tilting: boolean;
}

interface MaintenanceInfo {
    lastService: Date;
    nextService: Date;
    tyreCondition: 'good' | 'fair' | 'poor';
    brakeCondition: 'good' | 'fair' | 'poor';
    issues: string[];
}

interface Trailer {
    _id: string;
    trailer: string;
    plateNumber: string;
    type: 'dry_van' | 'refrigerated' | 'flatbed' | 'tanker' | 'container';
    capacity: string;
    status: 'moving' | 'idle' | 'stopped' | 'maintenance';
    operationStatus: 'in_transit' | 'loading' | 'idle' | 'maintenance' | 'available';
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
    route: RoutePoint[];
    destination?: Location;
    cargoDetails: CargoDetails;
    sensors: TrailerSensors;
    maintenance: MaintenanceInfo;
    speed: number;
    internalId?: string; // For Geotab integration
}

declare global {
    interface Window {
        google: any;
        initMap: () => void;
    }
}

const GOOGLE_MAPS_API_KEY = "AIzaSyBE6Ii-ZxHsICvzD2Fp3m3iMPYX-Vie1N4";
const GOOGLE_MAPS_LIBRARIES = ["marker", "places"] as Libraries;
const LEGACY_SCRIPT_IDS = ["truck-tracker-map-script", "trailer-tracker-map-script"];
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID?.trim() || undefined;

if (typeof window !== "undefined") {
    LEGACY_SCRIPT_IDS.forEach((id) => {
        const script = document.getElementById(id);
        if (script && script.parentNode) {
            script.parentNode.removeChild(script);
        }
    });
}

const ProfessionalTrailerTracker: React.FC = () => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-maps-api',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const [trailers, setTrailers] = useState<Trailer[]>([]);
    const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showRoutes, setShowRoutes] = useState<boolean>(true);
    const [mapLoaded, setMapLoaded] = useState<boolean>(false);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [directionsRenderers, setDirectionsRenderers] = useState<any[]>([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
    const [advancedMarkersEnabled, setAdvancedMarkersEnabled] = useState<boolean>(false);

    const socket = useMemo(() => getSocket(), []);

    // Handle trailer selection and socket connection
    const handleTrailerClick = useCallback((trailer: Trailer) => {
        setSelectedTrailer(trailer);

        // Leave previous trailer updates
        socket.emit("leaveTrailer");

        // Join new trailer updates if trailer has internalId for Geotab
        if (trailer.internalId) {
            socket.emit("joinTrailer", trailer.internalId);
        }

        // Listen for trailer updates
        socket.off("trailerLocation");
        socket.on("trailerLocation", (data) => {
            setTrailers((prev) =>
                prev.map((t) => (t._id === data._id ? { ...t, ...data } : t))
            );

            if (trailer._id === data._id) {
                setSelectedTrailer({ ...trailer, ...data });
            }
        });
    }, [socket]);

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
                setSelectedTrailer(null);
                setEmptyStateMessage(null);
                return;
            }

            const res = await listTrailers();
            if (res?.success) {
                const data = res.data || [];
                if (data.length === 0) {
                    setTrailers([]);
                    setSelectedTrailer(null);
                    setEmptyStateMessage(res?.message || 'No trailers found for the current company.');
                    return;
                }

                const formatted = data.map((t: any) => ({
                    ...t,
                    currentLocation: {
                        ...t.currentLocation,
                        latitude: Number(t.currentLocation?.latitude ?? 0),
                        longitude: Number(t.currentLocation?.longitude ?? 0),
                        updatedAt: t.currentLocation?.updatedAt || new Date().toISOString()
                    },
                }));
                setTrailers(formatted);
                setEmptyStateMessage(null);
                handleTrailerClick(formatted[0]);
            } else {
                const message = res?.message || 'Failed to fetch trailers.';
                setTrailers([]);
                setSelectedTrailer(null);
                setEmptyStateMessage(message);
            }
        } catch (err) {
            console.error('Error fetching trailers:', err);
            setTrailers([]);
            setSelectedTrailer(null);
            setEmptyStateMessage((err as any)?.message || 'Failed to fetch trailers.');
        } finally {
            setLoading(false);
        }
    }, [handleTrailerClick]);

    useEffect(() => {
        fetchTrailersData();
    }, [fetchTrailersData]);

    // Cleanup socket connection
    useEffect(() => {
        return () => {
            socket.emit("leaveTrailer");
            socket.off("trailerLocation");
        };
    }, [socket]);

    useEffect(() => {
        if (isLoaded) {
            setMapLoaded(true);
        } else if (loadError) {
            setMapLoaded(false);
        }
    }, [isLoaded, loadError]);

    useEffect(() => {
        if (mapLoaded && !GOOGLE_MAPS_MAP_ID) {
            console.warn(
                'Google Maps mapId is not configured (VITE_GOOGLE_MAP_ID). Falling back to standard markers.'
            );
        }
    }, [mapLoaded]);

    // Initialize map
    useEffect(() => {
        if (mapLoaded && !map && window.google && window.google.maps) {
            const mapElement = document.getElementById('trailer-google-map');
            if (mapElement) {
                const mapOptions: google.maps.MapOptions = {
                    center: { lat: 28.6139, lng: 77.2090 },
                    zoom: 11,
                    mapTypeId: window.google.maps.MapTypeId.ROADMAP,
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        },
                        {
                            featureType: 'transit',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        }
                    ],
                    mapTypeControl: false,
                    fullscreenControl: false,
                    streetViewControl: false
                };

                if (GOOGLE_MAPS_MAP_ID) {
                    mapOptions.mapId = GOOGLE_MAPS_MAP_ID;
                }

                const newMap = new window.google.maps.Map(mapElement, mapOptions);

                setMap(newMap);
                setAdvancedMarkersEnabled(Boolean(GOOGLE_MAPS_MAP_ID && window.google?.maps?.marker?.AdvancedMarkerElement));

                newMap.addListener('click', () => {
                    setSelectedTrailer(null);
                });
            }
        }
    }, [mapLoaded, map]);

    // Update markers and routes
    useEffect(() => {
        if (map && window.google && window.google.maps) {
            // Clear existing markers and routes
            markers.forEach(existingMarker => {
                if (!existingMarker) return;
                if (typeof existingMarker.setMap === 'function') {
                    existingMarker.setMap(null);
                } else if ('map' in existingMarker) {
                    (existingMarker as { map: google.maps.Map | null }).map = null;
                }
            });
            directionsRenderers.forEach(renderer => renderer.setMap(null));

            const newMarkers: any[] = [];
            const newDirectionsRenderers: any[] = [];

            trailers.forEach((trailer) => {
                const lat = Number(trailer.currentLocation.latitude);
                const lng = Number(trailer.currentLocation.longitude);

                if (isNaN(lat) || isNaN(lng)) {
                    console.error('❌ Invalid coordinates for trailer:', trailer.plateNumber, lat, lng);
                    return;
                }

                const marker = advancedMarkersEnabled && window.google?.maps?.marker?.AdvancedMarkerElement
                    ? (() => {
                        const markerElement = document.createElement('div');
                        markerElement.style.width = '22px';
                        markerElement.style.height = '22px';
                        markerElement.style.borderRadius = '50%';
                        markerElement.style.backgroundColor = getMarkerColor(trailer.operationStatus || trailer.status);
                        markerElement.style.border = '2px solid #ffffff';
                        markerElement.style.boxShadow = '0 6px 12px rgba(0,0,0,0.25)';
                        markerElement.style.display = 'flex';
                        markerElement.style.alignItems = 'center';
                        markerElement.style.justifyContent = 'center';

                        const innerDot = document.createElement('div');
                        innerDot.style.width = '6px';
                        innerDot.style.height = '6px';
                        innerDot.style.borderRadius = '50%';
                        innerDot.style.backgroundColor = '#ffffff';
                        markerElement.appendChild(innerDot);

                        return new window.google.maps.marker.AdvancedMarkerElement({
                            position: { lat, lng },
                            map,
                            title: `${trailer.plateNumber} - ${trailer.operationStatus || trailer.status}`,
                            content: markerElement
                        });
                    })()
                    : new window.google.maps.Marker({
                        position: { lat, lng },
                        map,
                        title: `${trailer.plateNumber} - ${trailer.operationStatus || trailer.status}`,
                        icon: {
                            path: 'M2 6h20v12H2z M6 4v2 M18 4v2 M2 10h20 M6 18v2 M18 18v2',
                            scale: 1.2,
                            fillColor: getMarkerColor(trailer.operationStatus || trailer.status),
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            anchor: new window.google.maps.Point(12, 12)
                        }
                    });

                marker.addListener('click', () => {
                    setSelectedTrailer(trailer);
                    const markerPosition = marker.position as google.maps.LatLng | google.maps.LatLngLiteral | null | undefined;
                    if (markerPosition) {
                        map.setCenter(markerPosition as google.maps.LatLng | google.maps.LatLngLiteral);
                    }
                    map.setZoom(15);
                });

                newMarkers.push(marker);

                // Add route using Directions API if destination exists
                if (trailer.destination && showRoutes && (trailer.operationStatus === 'in_transit' || trailer.status === 'moving')) {
                    const destLat = Number(trailer.destination.latitude);
                    const destLng = Number(trailer.destination.longitude);

                    if (isNaN(destLat) || isNaN(destLng)) {
                        console.warn('⚠️ Destination coordinates invalid for trailer:', trailer.plateNumber);
                    } else {
                        const directionsService = new window.google.maps.DirectionsService();
                        const directionsRenderer = new window.google.maps.DirectionsRenderer({
                            suppressMarkers: true,
                            draggable: false,
                            polylineOptions: {
                                strokeColor: '#22c55e',
                                strokeOpacity: 0.8,
                                strokeWeight: 4,
                            }
                        });

                        directionsRenderer.setMap(map);

                        directionsService.route({
                            origin: {
                                lat,
                                lng
                            },
                            destination: {
                                lat: destLat,
                                lng: destLng
                            },
                            travelMode: window.google.maps.TravelMode.DRIVING,
                            optimizeWaypoints: true,
                            avoidHighways: false,
                            avoidTolls: false
                        }, (result: any, status: any) => {
                            if (status === 'OK') {
                                directionsRenderer.setDirections(result);
                            }
                        });

                        newDirectionsRenderers.push(directionsRenderer);

                        const destinationMarker = advancedMarkersEnabled && window.google?.maps?.marker?.AdvancedMarkerElement
                            ? (() => {
                                const destinationMarkerElement = document.createElement('div');
                                destinationMarkerElement.style.padding = '6px 10px';
                                destinationMarkerElement.style.borderRadius = '9999px';
                                destinationMarkerElement.style.backgroundColor = '#3b82f6';
                                destinationMarkerElement.style.color = '#ffffff';
                                destinationMarkerElement.style.fontSize = '10px';
                                destinationMarkerElement.style.fontWeight = '600';
                                destinationMarkerElement.style.boxShadow = '0 6px 12px rgba(59,130,246,0.35)';
                                destinationMarkerElement.textContent = 'DEST';

                                return new window.google.maps.marker.AdvancedMarkerElement({
                                    position: {
                                        lat: destLat,
                                        lng: destLng
                                    },
                                    map,
                                    title: `Destination: ${trailer.destination.address}`,
                                    content: destinationMarkerElement
                                });
                            })()
                            : new window.google.maps.Marker({
                                position: {
                                    lat: destLat,
                                    lng: destLng
                                },
                                map,
                                title: `Destination: ${trailer.destination.address}`,
                                icon: {
                                    path: 'M12 2L13.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L10.91 8.26L12 2Z',
                                    scale: 0.6,
                                    fillColor: '#3b82f6',
                                    fillOpacity: 0.9,
                                    strokeColor: '#ffffff',
                                    strokeWeight: 1,
                                    anchor: new window.google.maps.Point(12, 12)
                                }
                            });

                        newMarkers.push(destinationMarker);
                    }
                }
            });

            if (newMarkers.length === 0) {
                const testMarker = advancedMarkersEnabled && window.google?.maps?.marker?.AdvancedMarkerElement
                    ? (() => {
                        const fallbackElement = document.createElement('div');
                        fallbackElement.style.width = '24px';
                        fallbackElement.style.height = '24px';
                        fallbackElement.style.borderRadius = '50%';
                        fallbackElement.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
                        fallbackElement.style.border = '2px solid #ffffff';
                        fallbackElement.style.boxShadow = '0 8px 16px rgba(99,102,241,0.4)';

                        return new window.google.maps.marker.AdvancedMarkerElement({
                            position: { lat: 28.6139, lng: 77.209 },
                            map,
                            title: 'Test Marker - No trailers found',
                            content: fallbackElement
                        });
                    })()
                    : new window.google.maps.Marker({
                        position: { lat: 28.6139, lng: 77.209 },
                        map,
                        title: 'Test Marker - No trailers found',
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: '#6366f1',
                            fillOpacity: 0.8,
                            strokeColor: '#ffffff',
                            strokeWeight: 2
                        }
                    });

                newMarkers.push(testMarker);
            }

            setMarkers(newMarkers);
            setDirectionsRenderers(newDirectionsRenderers);
        }
    }, [map, trailers, showRoutes]);

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'in_transit':
            case 'moving': return 'text-green-700 bg-green-100';
            case 'loading': return 'text-blue-700 bg-blue-100';
            case 'idle': return 'text-yellow-700 bg-yellow-100';
            case 'maintenance': return 'text-red-700 bg-red-100';
            case 'available':
            case 'stopped': return 'text-purple-700 bg-purple-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const getMarkerColor = (status: string): string => {
        switch (status) {
            case 'in_transit':
            case 'moving': return '#22c55e';
            case 'loading': return '#3b82f6';
            case 'idle': return '#eab308';
            case 'maintenance': return '#ef4444';
            case 'available':
            case 'stopped': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status: string): React.ReactNode => {
        switch (status) {
            case 'in_transit':
            case 'moving': return <Navigation className="w-3 h-3" />;
            case 'loading': return <Package className="w-3 h-3" />;
            case 'idle': return <Clock className="w-3 h-3" />;
            case 'maintenance': return <AlertTriangle className="w-3 h-3" />;
            case 'available':
            case 'stopped': return <Circle className="w-3 h-3" />;
            default: return <Circle className="w-3 h-3" />;
        }
    };

    const getTrailerTypeIcon = (type: string): React.ReactNode => {
        switch (type) {
            case 'refrigerated': return <Thermometer className="w-5 h-5 text-blue-600" />;
            case 'tanker': return <Circle className="w-5 h-5 text-orange-600" />;
            default: return <Truck className="w-5 h-5 text-gray-600" />;
        }
    };

    const filteredTrailers = trailers.filter(trailer => {
        const matchesStatus = filterStatus === 'all' || trailer.operationStatus === filterStatus || trailer.status === filterStatus;
        const matchesSearch = trailer.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trailer.trailer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trailer.type.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getTimeDiff = (date: Date | string): string => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Live';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    if (loading && !emptyStateMessage) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center space-y-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <p className="text-gray-600">Loading trailer tracking data...</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Sidebar */}
            <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-lg`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700">
                    <div className="flex items-center justify-between">
                        {!sidebarCollapsed && (
                            <div className="text-white">
                                <h1 className="text-lg font-bold">Trailer Tracker</h1>
                                <p className="text-orange-100 text-sm">Real-time monitoring</p>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="!text-white p-2 hover:bg-orange-500 rounded-lg transition-colors"
                        >
                            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {!sidebarCollapsed && (
                    <>
                        {/* Search and Controls */}
                        <div className="p-4 space-y-3 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search trailers..."
                                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex space-x-2">
                                <div className="relative flex-1">
                                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <select
                                        className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white w-full text-sm"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="in_transit">In Transit</option>
                                        <option value="loading">Loading</option>
                                        <option value="idle">Idle</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="available">Available</option>
                                    </select>
                                </div>

                                <button
                                    onClick={() => setShowRoutes(!showRoutes)}
                                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${showRoutes ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    <Route className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Trailer List */}
                        <div className="flex-1 overflow-y-auto">
                            {!loading && emptyStateMessage && (
                                <div className="mx-4 my-3 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                                    {emptyStateMessage}
                                </div>
                            )}
                            {loading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredTrailers.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                            <p>No trailers found</p>
                                            {emptyStateMessage && (
                                                <p className="mt-1 text-sm text-gray-400">{emptyStateMessage}</p>
                                            )}
                                        </div>
                                    ) : (
                                        filteredTrailers.map((trailer) => (
                                    <div
                                        key={trailer._id}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${selectedTrailer?._id === trailer._id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}`}
                                        onClick={() => {
                                            setSelectedTrailer(trailer);
                                            if (map) {
                                                map.setCenter({
                                                    lat: Number(trailer.currentLocation.latitude),
                                                    lng: Number(trailer.currentLocation.longitude)
                                                });
                                                map.setZoom(15);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="p-2 rounded-lg bg-orange-100">
                                                {getTrailerTypeIcon(trailer.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-gray-900">
                                                        {trailer.plateNumber}
                                                    </h3>
                                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trailer.operationStatus || trailer.status)}`}>
                                                        {getStatusIcon(trailer.operationStatus || trailer.status)}
                                                        <span className="capitalize">{(trailer.operationStatus || trailer.status).replace('_', ' ')}</span>
                                                    </span>
                                                </div>

                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {trailer.type.replace('_', ' ').toUpperCase()} • {trailer.capacity}
                                                </p>

                                                <div className="flex items-center space-x-4 mt-2 text-xs">
                                                    <div className="flex items-center space-x-1">
                                                        <Weight className="w-3 h-3 text-blue-500" />
                                                        <span>{trailer.cargoDetails.weight}kg</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        {trailer.sensors.doorStatus === 'locked' ? 
                                                            <Lock className="w-3 h-3 text-green-500" /> : 
                                                            <Unlock className="w-3 h-3 text-red-500" />
                                                        }
                                                        <span className="capitalize">{trailer.sensors.doorStatus}</span>
                                                    </div>
                                                    {trailer.cargoDetails.isRefrigerated && (
                                                        <div className="flex items-center space-x-1">
                                                            <Thermometer className="w-3 h-3 text-blue-500" />
                                                            <span>{trailer.sensors.temperature}°C</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="text-xs text-gray-500 truncate flex-1 mr-2">
                                                        <MapPin className="w-3 h-3 inline mr-1" />
                                                        {trailer.currentLocation.address}
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                        {getTimeDiff(trailer.currentLocation.updatedAt)}
                                                    </span>
                                                </div>

                                                {trailer.isAttached && trailer.attachedVehicle && (
                                                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                                        <span className="font-medium text-blue-700">Attached to: </span>
                                                        <span className="text-blue-600">{trailer.attachedVehicle.plateNumber}</span>
                                                        {trailer.attachedVehicle.driver && (
                                                            <span className="text-blue-600 ml-1">• {trailer.attachedVehicle.driver.name}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {selectedTrailer && (
                                <div className="flex items-center space-x-3 bg-orange-50 px-4 py-2 rounded-lg">
                                    <div className="p-1 bg-orange-100 rounded">
                                        {getTrailerTypeIcon(selectedTrailer.type)}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm text-gray-900">{selectedTrailer.plateNumber}</div>
                                        <div className="text-xs text-gray-600">{selectedTrailer.type.replace('_', ' ').toUpperCase()}</div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedTrailer(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1 bg-green-50 px-3 py-1.5 rounded-full">
                                <Activity className="w-3 h-3 text-green-600" />
                                <span className="text-xs font-medium text-green-700">Live Tracking</span>
                            </div>
                            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="absolute inset-0 pt-20">
                    {!isLoaded && !loadError && (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading Google Maps...</p>
                            </div>
                        </div>
                    )}
                    {loadError && (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-center text-gray-600 space-y-2">
                                <div className="font-semibold text-red-500">Failed to load Google Maps</div>
                                <p className="text-sm">Please check your network connection and try again.</p>
                            </div>
                        </div>
                    )}
                    {isLoaded && (
                        <div id="trailer-google-map" className="w-full h-full"></div>
                    )}
                </div>

                {/* Trailer Details Panel */}
                {selectedTrailer && (
                    <div className="absolute bottom-6 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Trailer Details</h3>
                                <button
                                    onClick={() => setSelectedTrailer(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            <div className="p-4 space-y-4">
                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                                        <Weight className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-gray-900">{(selectedTrailer.cargoDetails.weight/1000).toFixed(1)}t</div>
                                        <div className="text-xs text-gray-600">Load</div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <Gauge className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-gray-900">{selectedTrailer.speed}</div>
                                        <div className="text-xs text-gray-600">km/h</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        {selectedTrailer.sensors.doorStatus === 'locked' ? 
                                            <Lock className="w-5 h-5 text-green-600 mx-auto mb-1" /> : 
                                            <Unlock className="w-5 h-5 text-red-600 mx-auto mb-1" />
                                        }
                                        <div className="text-sm font-bold text-gray-900 capitalize">{selectedTrailer.sensors.doorStatus}</div>
                                        <div className="text-xs text-gray-600">Door</div>
                                    </div>
                                </div>

                                {/* Location Info */}
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-start space-x-2">
                                            <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                                            <div>
                                                <div className="text-xs font-medium text-gray-700 mb-1">Current Location</div>
                                                <div className="text-sm text-gray-900">{selectedTrailer.currentLocation.address}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Updated {getTimeDiff(selectedTrailer.currentLocation.updatedAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedTrailer.destination && (
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-start space-x-2">
                                                <Route className="w-4 h-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <div className="text-xs font-medium text-blue-700 mb-1">Destination</div>
                                                    <div className="text-sm text-gray-900">{selectedTrailer.destination.address}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cargo Details */}
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs font-medium text-gray-700 mb-2">Cargo Information</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Type</span>
                                            <span className="text-sm font-medium">{selectedTrailer.cargoDetails.type}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Weight</span>
                                            <span className="text-sm font-medium">{selectedTrailer.cargoDetails.weight} kg</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Capacity</span>
                                            <span className="text-sm font-medium">{selectedTrailer.cargoDetails.capacity || selectedTrailer.capacity}</span>
                                        </div>
                                        {selectedTrailer.cargoDetails.capacity && (
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                <div 
                                                    className="bg-orange-600 h-2 rounded-full" 
                                                    style={{width: `${(selectedTrailer.cargoDetails.weight / selectedTrailer.cargoDetails.capacity) * 100}%`}}
                                                ></div>
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-500">{selectedTrailer.cargoDetails.description}</div>
                                    </div>
                                </div>

                                {/* Sensor Data */}
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs font-medium text-gray-700 mb-2">Sensor Status</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedTrailer.cargoDetails.isRefrigerated && (
                                            <div className="text-center">
                                                <Thermometer className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                                                <div className="text-sm font-semibold text-gray-900">{selectedTrailer.sensors.temperature}°C</div>
                                                <div className="text-xs text-gray-600">Temperature</div>
                                            </div>
                                        )}
                                        <div className="text-center">
                                            <Package className="w-4 h-4 text-green-600 mx-auto mb-1" />
                                            <div className="text-sm font-semibold text-gray-900">{selectedTrailer.sensors.humidity}%</div>
                                            <div className="text-xs text-gray-600">Humidity</div>
                                        </div>
                                        <div className="text-center">
                                            <AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${selectedTrailer.sensors.shockDetection ? 'text-red-600' : 'text-green-600'}`} />
                                            <div className={`text-sm font-semibold ${selectedTrailer.sensors.shockDetection ? 'text-red-900' : 'text-green-900'}`}>
                                                {selectedTrailer.sensors.shockDetection ? 'Alert' : 'Normal'}
                                            </div>
                                            <div className="text-xs text-gray-600">Shock</div>
                                        </div>
                                        <div className="text-center">
                                            <Navigation className={`w-4 h-4 mx-auto mb-1 ${selectedTrailer.sensors.tilting ? 'text-red-600' : 'text-green-600'}`} />
                                            <div className={`text-sm font-semibold ${selectedTrailer.sensors.tilting ? 'text-red-900' : 'text-green-900'}`}>
                                                {selectedTrailer.sensors.tilting ? 'Tilted' : 'Level'}
                                            </div>
                                            <div className="text-xs text-gray-600">Position</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Attached Vehicle Info */}
                                {selectedTrailer.isAttached && selectedTrailer.attachedVehicle && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="text-xs font-medium text-blue-700 mb-2">Attached Vehicle</div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-blue-600">Plate Number</span>
                                                <span className="text-sm font-medium">{selectedTrailer.attachedVehicle.plateNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-blue-600">Vehicle</span>
                                                <span className="text-sm font-medium">{selectedTrailer.attachedVehicle.make} {selectedTrailer.attachedVehicle.model}</span>
                                            </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-blue-600">Driver</span>
                                            <span className="text-sm font-medium">{selectedTrailer.attachedVehicle.driver?.name || 'N/A'}</span>
                                        </div>
                                        </div>
                                    </div>
                                )}

                                {/* Maintenance Status */}
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs font-medium text-gray-700 mb-2">Maintenance Status</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Tires</span>
                                            <span className={`text-sm font-medium px-2 py-1 rounded capitalize ${
                                                selectedTrailer.maintenance.tyreCondition === 'good' ? 'bg-green-100 text-green-700' :
                                                selectedTrailer.maintenance.tyreCondition === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {selectedTrailer.maintenance.tyreCondition}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Brakes</span>
                                            <span className={`text-sm font-medium px-2 py-1 rounded capitalize ${
                                                selectedTrailer.maintenance.brakeCondition === 'good' ? 'bg-green-100 text-green-700' :
                                                selectedTrailer.maintenance.brakeCondition === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {selectedTrailer.maintenance.brakeCondition}
                                            </span>
                                        </div>
                                        {selectedTrailer.maintenance.nextService && (
                                            <div className="text-xs text-gray-500">
                                                Next service: {new Date(selectedTrailer.maintenance.nextService).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Maintenance Issues */}
                                {selectedTrailer.maintenance.issues && selectedTrailer.maintenance.issues.length > 0 && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-red-600" />
                                            <div className="text-xs font-medium text-red-700">Active Issues</div>
                                        </div>
                                        <div className="space-y-2">
                                            {selectedTrailer.maintenance.issues.map((issue, index) => (
                                                <div key={index} className="bg-white p-2 rounded border text-sm text-red-700">
                                                    {issue}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
export default ProfessionalTrailerTracker