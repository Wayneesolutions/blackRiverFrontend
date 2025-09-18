import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Car,
    Fuel,
    Gauge,
    Circle,
    Filter,
    Search,
    AlertTriangle,
    Truck,
    Navigation,
    Clock,
    Route,
    RefreshCw,
    X,
    ChevronRight,
    ChevronDown,
    Activity,
    Settings
} from 'lucide-react';

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

interface TrailerDetails {
    serialNumber: string;
    capacity: string;
    status: 'attached' | 'detached';
}

interface DriverBehaviour {
    harshBraking: number;
    speedingEvents: number;
    idlingDuration: number;
}

interface FaultCode {
    code: string;
    description: string;
}

interface EngineHealth {
    batteryVoltage: number;
    engineHours: number;
    faultCodes: FaultCode[];
}

interface Vehicle {
    _id: string;
    internalId: string;
    plateNumber: string;
    make: string;
    model: string;
    year: number;
    status: 'moving' | 'idle' | 'stopped' | 'maintenance';
    hasTrailer: boolean;
    trailerDetails?: TrailerDetails;
    currentLocation: Location;
    route: RoutePoint[];
    destination?: Location;
    speed: number;
    fuelLevel: number;
    odometer: number;
    engineOn: boolean;
    driverBehaviour: DriverBehaviour;
    engineHealth: EngineHealth;
}

declare global {
    interface Window {
        google: any;
        initMap: () => void;
    }
}

const ProfessionalFleetTracker: React.FC = () => {
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showRoutes, setShowRoutes] = useState<boolean>(true);
    const [mapLoaded, setMapLoaded] = useState<boolean>(false);
    const [map, setMap] = useState<any>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [directionsRenderers, setDirectionsRenderers] = useState<any[]>([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

    // Updated mock data with better routing coordinates
    const vehicles: Vehicle[] = [
        {
            _id: '1',
            internalId: 'VH001',
            plateNumber: 'DL-01-AB-1234',
            make: 'Tata',
            model: 'Ace Gold',
            year: 2023,
            status: 'moving',
            hasTrailer: true,
            trailerDetails: {
                serialNumber: 'TR001',
                capacity: '1.5 Ton',
                status: 'attached'
            },
            currentLocation: {
                address: 'Sector 18, Noida, Uttar Pradesh',
                longitude: 77.3273,
                latitude: 28.5706,
                updatedAt: new Date('2025-09-18T10:45:00Z')
            },
            route: [
                { latitude: 28.5706, longitude: 77.3273, timestamp: '2025-09-18T09:00:00Z' },
                { latitude: 28.5800, longitude: 77.3200, timestamp: '2025-09-18T09:15:00Z' },
                { latitude: 28.5900, longitude: 77.3100, timestamp: '2025-09-18T09:30:00Z' },
                { latitude: 28.6000, longitude: 77.3000, timestamp: '2025-09-18T09:45:00Z' },
            ],
            destination: {
                address: 'Connaught Place, New Delhi',
                latitude: 28.6315,
                longitude: 77.2167,
                updatedAt: new Date()
            },
            speed: 45,
            fuelLevel: 78,
            odometer: 15420,
            engineOn: true,
            driverBehaviour: {
                harshBraking: 2,
                speedingEvents: 1,
                idlingDuration: 15
            },
            engineHealth: {
                batteryVoltage: 13.2,
                engineHours: 1240,
                faultCodes: []
            }
        },
        {
            _id: '2',
            internalId: 'VH002',
            plateNumber: 'DL-02-CD-5678',
            make: 'Mahindra',
            model: 'Bolero Pickup',
            year: 2022,
            status: 'idle',
            hasTrailer: false,
            currentLocation: {
                address: 'Connaught Place, New Delhi',
                longitude: 77.2167,
                latitude: 28.6315,
                updatedAt: new Date('2025-09-18T10:30:00Z')
            },
            route: [
                { latitude: 28.6315, longitude: 77.2167, timestamp: '2025-09-18T08:00:00Z' },
                { latitude: 28.6300, longitude: 77.2150, timestamp: '2025-09-18T08:30:00Z' },
            ],
            destination: {
                address: 'Gurgaon Cyber City, Haryana',
                latitude: 28.4947,
                longitude: 77.0821,
                updatedAt: new Date()
            },
            speed: 0,
            fuelLevel: 45,
            odometer: 28350,
            engineOn: true,
            driverBehaviour: {
                harshBraking: 0,
                speedingEvents: 0,
                idlingDuration: 25
            },
            engineHealth: {
                batteryVoltage: 12.8,
                engineHours: 2850,
                faultCodes: []
            }
        },
        {
            _id: '3',
            internalId: 'VH003',
            plateNumber: 'UP-16-EF-9012',
            make: 'Ashok Leyland',
            model: 'Partner',
            year: 2024,
            status: 'stopped',
            hasTrailer: false,
            currentLocation: {
                address: 'Industrial Area, Ghaziabad, UP',
                longitude: 77.4126,
                latitude: 28.6692,
                updatedAt: new Date('2025-09-18T09:15:00Z')
            },
            route: [
                { latitude: 28.6692, longitude: 77.4126, timestamp: '2025-09-18T07:00:00Z' },
            ],
            destination: {
                address: 'Sector 62, Noida, UP',
                latitude: 28.6271,
                longitude: 77.3756,
                updatedAt: new Date()
            },
            speed: 0,
            fuelLevel: 92,
            odometer: 8750,
            engineOn: false,
            driverBehaviour: {
                harshBraking: 1,
                speedingEvents: 0,
                idlingDuration: 0
            },
            engineHealth: {
                batteryVoltage: 12.4,
                engineHours: 580,
                faultCodes: [{ code: 'P0128', description: 'Coolant Temperature Below Thermostat' }]
            }
        },
        {
            _id: '4',
            internalId: 'VH004',
            plateNumber: 'HR-26-GH-3456',
            make: 'Isuzu',
            model: 'D-Max',
            year: 2023,
            status: 'maintenance',
            hasTrailer: true,
            trailerDetails: {
                serialNumber: 'TR002',
                capacity: '2 Ton',
                status: 'detached'
            },
            currentLocation: {
                address: 'Service Center, Gurgaon, HR',
                longitude: 77.0266,
                latitude: 28.4595,
                updatedAt: new Date('2025-09-18T08:00:00Z')
            },
            route: [
                { latitude: 28.4595, longitude: 77.0266, timestamp: '2025-09-18T08:00:00Z' },
            ],
            speed: 0,
            fuelLevel: 30,
            odometer: 42100,
            engineOn: false,
            driverBehaviour: {
                harshBraking: 5,
                speedingEvents: 3,
                idlingDuration: 45
            },
            engineHealth: {
                batteryVoltage: 11.8,
                engineHours: 4200,
                faultCodes: [
                    { code: 'P0171', description: 'System Too Lean Bank 1' },
                    { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold' }
                ]
            }
        }
    ];

    // Load Google Maps
    useEffect(() => {
        const loadGoogleMaps = () => {
            if (window.google && window.google.maps) {
                setMapLoaded(true);
                return;
            }

            const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
            if (existingScript) {
                existingScript.remove();
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBxk4rW7mAOs6MhDSOklssvcqbJ6uXzgEQ&libraries=places,geometry&callback=initMap`;
            script.async = true;
            script.defer = true;

            window.initMap = () => {
                setMapLoaded(true);
            };

            script.onerror = (error) => {
                console.error('Error loading Google Maps:', error);
            };

            document.head.appendChild(script);
        };

        loadGoogleMaps();

        return () => {
            if (window.initMap) {
                delete window.initMap;
            }
        };
    }, []);

    // Initialize map
    useEffect(() => {
        if (mapLoaded && !map && window.google && window.google.maps) {
            const mapElement = document.getElementById('google-map');
            if (mapElement) {
                const newMap = new window.google.maps.Map(mapElement, {
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
                });

                setMap(newMap);

                newMap.addListener('click', () => {
                    setSelectedVehicle(null);
                });
            }
        }
    }, [mapLoaded, map]);

    // Update markers and routes
    useEffect(() => {
        if (map && window.google && window.google.maps) {
            // Clear existing markers and routes
            markers.forEach(marker => marker.setMap(null));
            directionsRenderers.forEach(renderer => renderer.setMap(null));

            const newMarkers: any[] = [];
            const newDirectionsRenderers: any[] = [];

            vehicles.forEach((vehicle) => {
                // Create vehicle marker
                const marker = new window.google.maps.Marker({
                    position: {
                        lat: vehicle.currentLocation.latitude,
                        lng: vehicle.currentLocation.longitude
                    },
                    map: map,
                    title: `${vehicle.plateNumber} - ${vehicle.status}`,
                    icon: {
                        path: 'M12 2L13.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L10.91 8.26L12 2Z',
                        scale: 0.8,
                        fillColor: getMarkerColor(vehicle.status),
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                        anchor: new window.google.maps.Point(12, 12)
                    }
                });

                marker.addListener('click', () => {
                    setSelectedVehicle(vehicle);
                    map.setCenter(marker.getPosition());
                    map.setZoom(15);
                });

                newMarkers.push(marker);

                // Add route using Directions API if destination exists
                if (vehicle.destination && showRoutes) {
                    const directionsService = new window.google.maps.DirectionsService();
                    const directionsRenderer = new window.google.maps.DirectionsRenderer({
                        suppressMarkers: true,
                        draggable: false,
                        polylineOptions: {
                            strokeColor: vehicle.status === 'moving' ? '#22c55e' : '#6b7280',
                            strokeOpacity: 0.8,
                            strokeWeight: 4,
                        }
                    });

                    directionsRenderer.setMap(map);

                    directionsService.route({
                        origin: {
                            lat: vehicle.currentLocation.latitude,
                            lng: vehicle.currentLocation.longitude
                        },
                        destination: {
                            lat: vehicle.destination.latitude,
                            lng: vehicle.destination.longitude
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

                    // Add destination marker
                    const destinationMarker = new window.google.maps.Marker({
                        position: {
                            lat: vehicle.destination.latitude,
                            lng: vehicle.destination.longitude
                        },
                        map: map,
                        title: `Destination: ${vehicle.destination.address}`,
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
            });

            setMarkers(newMarkers);
            setDirectionsRenderers(newDirectionsRenderers);
        }
    }, [map, vehicles, showRoutes]);

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'moving': return 'text-green-700 bg-green-100';
            case 'idle': return 'text-yellow-700 bg-yellow-100';
            case 'stopped': return 'text-gray-700 bg-gray-100';
            case 'maintenance': return 'text-red-700 bg-red-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const getMarkerColor = (status: string): string => {
        switch (status) {
            case 'moving': return '#22c55e';
            case 'idle': return '#eab308';
            case 'stopped': return '#6b7280';
            case 'maintenance': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status: string): React.ReactNode => {
        switch (status) {
            case 'moving': return <Navigation className="w-3 h-3" />;
            case 'idle': return <Clock className="w-3 h-3" />;
            case 'stopped': return <Circle className="w-3 h-3" />;
            case 'maintenance': return <AlertTriangle className="w-3 h-3" />;
            default: return <Circle className="w-3 h-3" />;
        }
    };

    const filteredVehicles = vehicles.filter(vehicle => {
        const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
        const matchesSearch = vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
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

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Sidebar */}
            <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-lg`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                    <div className="flex items-center justify-between">
                        {!sidebarCollapsed && (
                            <div className="text-white">
                                <h1 className="text-lg font-bold">Fleet Tracker</h1>
                                <p className="text-blue-100 text-sm">Real-time monitoring</p>
                            </div>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="text-white p-2 hover:bg-blue-500 rounded-lg transition-colors"
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
                                    placeholder="Search vehicles..."
                                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex space-x-2">
                                <div className="relative flex-1">
                                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <select
                                        className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white w-full text-sm"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="moving">Moving</option>
                                        <option value="idle">Idle</option>
                                        <option value="stopped">Stopped</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>

                                <button
                                    onClick={() => setShowRoutes(!showRoutes)}
                                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${showRoutes ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    <Route className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

           
                      

                        {/* Vehicle List */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="divide-y divide-gray-100">
                                {filteredVehicles.map((vehicle) => (
                                    <div
                                        key={vehicle._id}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-all ${selectedVehicle?._id === vehicle._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                        onClick={() => {
                                            setSelectedVehicle(vehicle);
                                            if (map) {
                                                map.setCenter({
                                                    lat: vehicle.currentLocation.latitude,
                                                    lng: vehicle.currentLocation.longitude
                                                });
                                                map.setZoom(15);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className={`p-2 rounded-lg ${vehicle.hasTrailer ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                {vehicle.hasTrailer ?
                                                    <Truck className="w-5 h-5 text-blue-600" /> :
                                                    <Car className="w-5 h-5 text-gray-600" />
                                                }
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-gray-900">
                                                        {vehicle.plateNumber}
                                                    </h3>
                                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                                                        {getStatusIcon(vehicle.status)}
                                                        <span className="capitalize">{vehicle.status}</span>
                                                    </span>
                                                </div>

                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {vehicle.make} {vehicle.model}
                                                </p>

                                                <div className="flex items-center space-x-4 mt-2 text-xs">
                                                    <div className="flex items-center space-x-1">
                                                        <Gauge className="w-3 h-3 text-blue-500" />
                                                        <span>{vehicle.speed} km/h</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Fuel className="w-3 h-3 text-green-500" />
                                                        <span>{vehicle.fuelLevel}%</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="text-xs text-gray-500 truncate flex-1 mr-2">
                                                        <MapPin className="w-3 h-3 inline mr-1" />
                                                        {vehicle.currentLocation.address}
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                        {getTimeDiff(vehicle.currentLocation.updatedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                            {selectedVehicle && (
                                <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-lg">
                                    <div className="p-1 bg-blue-100 rounded">
                                        {selectedVehicle.hasTrailer ?
                                            <Truck className="w-4 h-4 text-blue-600" /> :
                                            <Car className="w-4 h-4 text-blue-600" />
                                        }
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm text-gray-900">{selectedVehicle.plateNumber}</div>
                                        <div className="text-xs text-gray-600">{selectedVehicle.make} {selectedVehicle.model}</div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedVehicle(null)}
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
                    {!mapLoaded ? (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading Google Maps...</p>
                            </div>
                        </div>
                    ) : (
                        <div id="google-map" className="w-full h-full"></div>
                    )}
                </div>

                {/* Vehicle Details Panel */}
                {selectedVehicle && (
                    <div className="absolute bottom-6 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Vehicle Details</h3>
                                <button
                                    onClick={() => setSelectedVehicle(null)}
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
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <Gauge className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-gray-900">{selectedVehicle.speed}</div>
                                        <div className="text-xs text-gray-600">km/h</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <Fuel className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-gray-900">{selectedVehicle.fuelLevel}%</div>
                                        <div className="text-xs text-gray-600">Fuel</div>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                        <Navigation className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                        <div className="text-lg font-bold text-gray-900">{(selectedVehicle.odometer / 1000).toFixed(0)}k</div>
                                        <div className="text-xs text-gray-600">km</div>
                                    </div>
                                </div>

                                {/* Location Info */}
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-start space-x-2">
                                            <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                                            <div>
                                                <div className="text-xs font-medium text-gray-700 mb-1">Current Location</div>
                                                <div className="text-sm text-gray-900">{selectedVehicle.currentLocation.address}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Updated {getTimeDiff(selectedVehicle.currentLocation.updatedAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedVehicle.destination && (
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-start space-x-2">
                                                <Route className="w-4 h-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <div className="text-xs font-medium text-blue-700 mb-1">Destination</div>
                                                    <div className="text-sm text-gray-900">{selectedVehicle.destination.address}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Engine Status */}
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs font-medium text-gray-700 mb-2">Engine Status</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Engine</span>
                                            <span className={`text-sm font-medium px-2 py-1 rounded ${selectedVehicle.engineOn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {selectedVehicle.engineOn ? 'ON' : 'OFF'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Battery</span>
                                            <span className="text-sm font-medium">{selectedVehicle.engineHealth.batteryVoltage}V</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Driver Behavior */}
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs font-medium text-gray-700 mb-2">Driver Behavior</div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <div className="text-sm font-semibold text-orange-600">{selectedVehicle.driverBehaviour.harshBraking}</div>
                                            <div className="text-xs text-gray-600">Harsh Braking</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-red-600">{selectedVehicle.driverBehaviour.speedingEvents}</div>
                                            <div className="text-xs text-gray-600">Speeding</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-yellow-600">{selectedVehicle.driverBehaviour.idlingDuration}m</div>
                                            <div className="text-xs text-gray-600">Idling</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Trailer Info */}
                                {selectedVehicle.hasTrailer && selectedVehicle.trailerDetails && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs font-medium text-gray-700 mb-2">Trailer Information</div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Serial</span>
                                                <span className="text-sm font-medium">{selectedVehicle.trailerDetails.serialNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Capacity</span>
                                                <span className="text-sm font-medium">{selectedVehicle.trailerDetails.capacity}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Status</span>
                                                <span className={`text-sm font-medium px-2 py-1 rounded capitalize ${selectedVehicle.trailerDetails.status === 'attached' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {selectedVehicle.trailerDetails.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Fault Codes */}
                                {selectedVehicle.engineHealth.faultCodes.length > 0 && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-red-600" />
                                            <div className="text-xs font-medium text-red-700">Active Fault Codes</div>
                                        </div>
                                        <div className="space-y-2">
                                            {selectedVehicle.engineHealth.faultCodes.map((fault, index) => (
                                                <div key={index} className="bg-white p-2 rounded border">
                                                    <div className="font-mono text-sm font-semibold text-red-700">{fault.code}</div>
                                                    <div className="text-xs text-red-600">{fault.description}</div>
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
export default ProfessionalFleetTracker
