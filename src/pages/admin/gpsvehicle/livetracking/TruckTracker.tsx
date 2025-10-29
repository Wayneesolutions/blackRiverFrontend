import React, { useState, useEffect, useMemo } from 'react';
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
    ChevronDown,
    Activity,
    Settings,
    Thermometer,
    Weight,
    Lock,
    Unlock,
    Fuel,
    User,
    ExternalLink,
    ChevronLeft
} from 'lucide-react';
import { getSocket } from "../../../../socket/socketClient";
import { listTrucks } from '../../../../axios/api/truckTracking';

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

interface AttachedTrailer {
    _id: string;
    plateNumber: string;
    type: string;
    capacity: string;
}

interface VehicleSensors {
    doorStatus: 'locked' | 'unlocked' | 'open';
    temperature: number;
    humidity: number;
    shockDetection: boolean;
    tilting: boolean;
    fuelLevel: number;
    engineOn: boolean;
    batteryVoltage: number;
}

interface MaintenanceInfo {
    lastService: Date;
    nextService: Date;
    tyreCondition: 'good' | 'fair' | 'poor';
    brakeCondition: 'good' | 'fair' | 'poor';
    engineHealth: 'good' | 'fair' | 'poor';
    issues: string[];
}

interface Driver {
    _id: string;
    name: string;
    email: string;
    phone: string;
    licenseNumber: string;
    status: 'active' | 'inactive';
}

interface Vehicle {
    _id: string;
    internalId: string;
    plateNumber: string;
    make: string;
    model: string;
    year: number;
    vinNumber: string;
    status: 'moving' | 'idle' | 'stopped' | 'maintenance';
    operationStatus: 'in_transit' | 'loading' | 'idle' | 'maintenance' | 'available';
    isAttached: boolean;
    attachedTrailer?: AttachedTrailer;
    driver?: Driver;
    currentLocation: {
        address: string;
        longitude: string | number;
        latitude: string | number;
        updatedAt: string | Date;
    };
    route: RoutePoint[];
    destination?: Location;
    cargoDetails: CargoDetails;
    sensors: VehicleSensors;
    maintenance: MaintenanceInfo;
    speed: number;
    odometer: number;
    fuelLevel: number;
    engineOn: boolean;
    driverBehaviour: {
        harshBraking: number;
        speedingEvents: number;
        idlingDuration: number;
    };
    engineHealth: {
        faultCodes: Array<{ code: string; description: string }>;
        batteryVoltage: number;
        engineHours: number;
    };
}

declare global {
    interface Window {
        google: any;
        initMap: () => void;
    }
}

const ProfessionalTruckTracker: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showRoutes, setShowRoutes] = useState<boolean>(true);
    const [mapLoaded, setMapLoaded] = useState<boolean>(false);
    const [map, setMap] = useState<any>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [directionsRenderers, setDirectionsRenderers] = useState<any[]>([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
    const [, setLocation] = useState<{ lat: number; lng: number } | null>(null);

    const socket = useMemo(() => getSocket(), []);

    // Fetch vehicles from backend
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                setLoading(true);
                const res = await listTrucks();
                if (res.success) {
                    const data = res.data?.vehicles || [];
                    console.log('🚛 Raw vehicle data from API:', data);
                    
                    const formatted = data.map((v: any) => ({
                        ...v,
                        currentLocation: {
                            ...v.currentLocation,
                            latitude: Number(v.currentLocation.latitude),
                            longitude: Number(v.currentLocation.longitude),
                        },
                        // Add default values for missing fields
                        route: v.route || [],
                        cargoDetails: v.cargoDetails || {
                            type: 'General',
                            weight: 0,
                            capacity: 0,
                            description: 'No cargo',
                            isRefrigerated: false
                        },
                        sensors: v.sensors || {
                            doorStatus: 'locked',
                            temperature: 20,
                            humidity: 50,
                            shockDetection: false,
                            tilting: false,
                            fuelLevel: v.fuelLevel || 0,
                            engineOn: v.engineOn || false,
                            batteryVoltage: 12.5
                        },
                        maintenance: v.maintenance || {
                            lastService: new Date(),
                            nextService: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            tyreCondition: 'good',
                            brakeCondition: 'good',
                            engineHealth: 'good',
                            issues: []
                        },
                        driverBehaviour: v.driverBehaviour || {
                            harshBraking: 0,
                            speedingEvents: 0,
                            idlingDuration: 0
                        },
                        engineHealth: v.engineHealth || {
                            faultCodes: [],
                            batteryVoltage: 12.5,
                            engineHours: 0
                        }
                    }));
                    setVehicles(formatted);
                    if (formatted.length > 0) handleVehicleClick(formatted[0]);
                }
            } catch (err) {
                console.error("Error fetching vehicles:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, []);

    // Handle vehicle selection
    const handleVehicleClick = (vehicle: Vehicle) => {
        console.log('🚛 Vehicle selected:', vehicle.plateNumber);
        setSelectedVehicle(vehicle);
        
        // Set location for map centering
        const lat = Number(vehicle.currentLocation?.latitude);
        const lng = Number(vehicle.currentLocation?.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            setLocation({ lat, lng });
            console.log('📍 Setting location for map centering:', { lat, lng });
            
            // Immediately center map on selected vehicle
            if (map) {
                map.setCenter({ lat, lng });
                map.setZoom(15);
                console.log('🗺️ Map centered on selected vehicle');
            }
        }
        
        // Leave previous vehicle updates
        socket.emit("leaveVehicle");
        
        // Join new vehicle updates
        socket.emit("joinVehicle", vehicle._id);
        
        // Listen for vehicle updates
        socket.off("vehicleLocation");
        socket.on("vehicleLocation", (data) => {
            setVehicles((prev) =>
                prev.map((v) => (v._id === data._id ? { ...v, ...data } : v))
            );
            
            if (vehicle._id === data._id) {
                setSelectedVehicle({ ...vehicle, ...data });
                // Update location if this is the selected vehicle
                const newLat = Number(data.currentLocation?.latitude);
                const newLng = Number(data.currentLocation?.longitude);
                if (!isNaN(newLat) && !isNaN(newLng)) {
                    setLocation({ lat: newLat, lng: newLng });
                    // Update map center for real-time tracking
                    if (map) {
                        map.setCenter({ lat: newLat, lng: newLng });
                    }
                }
            }
        });
    };

    // Toggle section expansion
    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

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
            script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBE6Ii-ZxHsICvzD2Fp3m3iMPYX-Vie1N4&libraries=places,directions`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                setMapLoaded(true);
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
        if (mapLoaded && window.google && window.google.maps) {
            const mapElement = document.getElementById('google-map');
            if (mapElement && !map) {
                console.log('🗺️ Initializing Google Map...');
                
                // Use first vehicle location as center if available
                let center = { lat: 20.5937, lng: 78.9629 }; // Default to India
                let zoom = 5;
                
                if (vehicles.length > 0 && vehicles[0].currentLocation) {
                    const firstVehicle = vehicles[0];
                    center = {
                        lat: Number(firstVehicle.currentLocation.latitude),
                        lng: Number(firstVehicle.currentLocation.longitude)
                    };
                    zoom = 12;
                    console.log('📍 Centering map on first vehicle:', firstVehicle.plateNumber, center);
                }
                
                const newMap = new window.google.maps.Map(mapElement, {
                    center: center,
                    zoom: zoom,
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        }
                    ]
                });
                
                console.log('✅ Google Map initialized successfully');
                setMap(newMap);
            }
        }
    }, [mapLoaded, vehicles, map]);

    // Update markers and routes
    useEffect(() => {
        if (map && window.google && window.google.maps) {
            console.log('🗺️ Updating markers for vehicles:', vehicles.length);
            console.log('🔍 Current filter status:', filterStatus);
            
            // Clear existing markers and directions
            markers.forEach(marker => marker.setMap(null));
            directionsRenderers.forEach(renderer => renderer.setMap(null));

            const newMarkers: any[] = [];
            const newDirectionsRenderers: any[] = [];

            // Filter vehicles based on status
            const vehiclesToShow = vehicles.filter(vehicle => {
                if (filterStatus === 'all') return true;
                return vehicle.status === filterStatus;
            });

            console.log('🚛 Vehicles to show on map:', vehiclesToShow.length);

            vehiclesToShow.forEach((vehicle, index) => {
                console.log(`🚛 Creating marker for vehicle ${index + 1}:`, {
                    plateNumber: vehicle.plateNumber,
                    lat: vehicle.currentLocation.latitude,
                    lng: vehicle.currentLocation.longitude,
                    status: vehicle.status
                });

                // Validate coordinates
                const lat = Number(vehicle.currentLocation.latitude);
                const lng = Number(vehicle.currentLocation.longitude);
                
                if (isNaN(lat) || isNaN(lng)) {
                    console.error('❌ Invalid coordinates for vehicle:', vehicle.plateNumber, lat, lng);
                    return;
                }

                // Create marker with truck icon
                const marker = new window.google.maps.Marker({
                    position: {
                        lat: lat,
                        lng: lng
                    },
                    map: map,
                    title: `${vehicle.plateNumber} - ${vehicle.status}`,
                    // Use truck icon
                    icon: {
                        path: 'M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z',
                        scale: 1.5,
                        fillColor: getMarkerColor(vehicle.status),
                        fillOpacity: 0.9,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                        anchor: new window.google.maps.Point(12, 12)
                    }
                });

                marker.addListener('click', () => {
                    console.log('📍 Marker clicked for vehicle:', vehicle.plateNumber);
                    handleVehicleClick(vehicle);
                    // Center map on clicked vehicle
                    map.setCenter(marker.getPosition()!);
                    map.setZoom(15);
                });

                newMarkers.push(marker);

                // Add route if destination exists
                if (vehicle.destination && showRoutes && vehicle.status === 'moving') {
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
                            lat: Number(vehicle.currentLocation.latitude),
                            lng: Number(vehicle.currentLocation.longitude)
                        },
                        destination: {
                            lat: Number(vehicle.destination.latitude),
                            lng: Number(vehicle.destination.longitude)
                        },
                        travelMode: window.google.maps.TravelMode.DRIVING
                    }, (result: any, status: any) => {
                        if (status === window.google.maps.DirectionsStatus.OK) {
                            directionsRenderer.setDirections(result);
                        }
                    });

                    newDirectionsRenderers.push(directionsRenderer);

                    // Add destination marker
                    const destinationMarker = new window.google.maps.Marker({
                        position: {
                            lat: Number(vehicle.destination.latitude),
                            lng: Number(vehicle.destination.longitude)
                        },
                        map: map,
                        title: `Destination: ${vehicle.destination.address}`,
                        icon: {
                            path: 'M12 2L13.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L10.91 8.26L12 2Z',
                            scale: 0.6,
                            fillColor: '#3b82f6',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 1,
                            anchor: new window.google.maps.Point(12, 12)
                        }
                    });

                    newMarkers.push(destinationMarker);
                }
            });

            // If no vehicles, add a test marker to verify map is working
            if (newMarkers.length === 0) {
                console.log('⚠️ No vehicles found, adding test marker');
                const testMarker = new window.google.maps.Marker({
                    position: { lat: 20.5937, lng: 78.9629 },
                    map: map,
                    title: 'Test Marker - No vehicles found',
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#ff0000',
                        fillOpacity: 0.8,
                        strokeColor: '#ffffff',
                        strokeWeight: 2
                    }
                });
                newMarkers.push(testMarker);
            }

            setMarkers(newMarkers);
            setDirectionsRenderers(newDirectionsRenderers);
            
            console.log('✅ Markers created:', newMarkers.length);
        }
    }, [map, vehicles, showRoutes, filterStatus]);

    // Filter vehicles
    const filteredVehicles = vehicles.filter(vehicle => {
        const matchesSearch = vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (vehicle.driver?.name && vehicle.driver.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    // Status colors
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

    const getMarkerColor = (status: string): string => {
        switch (status) {
            case 'moving': return '#22c55e';
            case 'idle': return '#eab308';
            case 'maintenance': return '#ef4444';
            case 'stopped': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    // Open vehicle in new tab
    const openVehicleInNewTab = (vehicle: Vehicle) => {
        const lat = Number(vehicle.currentLocation?.latitude);
        const lng = Number(vehicle.currentLocation?.longitude);
        
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15`;
        
        const vehicleContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Truck Tracker - ${vehicle.plateNumber}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: system-ui, -apple-system, sans-serif; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 20px;
                        }
                        .container { 
                            max-width: 900px; 
                            width: 100%;
                            background: white; 
                            border-radius: 20px; 
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            overflow: hidden;
                        }
                        .header {
                            background: linear-gradient(135deg, ${statusColors[vehicle.status]}, ${statusColors[vehicle.status]}dd);
                            color: white;
                            padding: 30px;
                            text-align: center;
                        }
                        .header h1 { font-size: 32px; margin-bottom: 10px; }
                        .header p { opacity: 0.9; font-size: 16px; }
                        .content { padding: 40px; }
                        .status-badge {
                            display: inline-block;
                            padding: 8px 20px;
                            border-radius: 25px;
                            font-size: 14px;
                            font-weight: 700;
                            margin: 20px 0;
                            background: ${statusBgColors[vehicle.status]};
                            color: ${statusColors[vehicle.status]};
                        }
                        .metrics {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                            gap: 20px;
                            margin: 30px 0;
                        }
                        .metric-card {
                            background: #f9fafb;
                            padding: 20px;
                            border-radius: 12px;
                            border-left: 4px solid ${statusColors[vehicle.status]};
                        }
                        .metric-label {
                            color: #6b7280;
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 8px;
                        }
                        .metric-value {
                            color: #1f2937;
                            font-size: 24px;
                            font-weight: 700;
                        }
                        .info-section {
                            background: #f9fafb;
                            padding: 25px;
                            border-radius: 12px;
                            margin: 20px 0;
                        }
                        .info-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 15px 0;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .info-row:last-child { border-bottom: none; }
                        .label { color: #6b7280; font-weight: 600; }
                        .value { color: #1f2937; font-weight: 700; text-align: right; }
                        .map-button {
                            display: inline-block;
                            background: ${statusColors[vehicle.status]};
                            color: white;
                            padding: 15px 30px;
                            border-radius: 10px;
                            text-decoration: none;
                            font-weight: 600;
                            margin-top: 20px;
                            transition: transform 0.2s, box-shadow 0.2s;
                        }
                        .map-button:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                        }
                        .timestamp {
                            text-align: center;
                            color: #9ca3af;
                            font-size: 14px;
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #e5e7eb;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚛 ${vehicle.plateNumber}</h1>
                            <p>${vehicle.make} ${vehicle.model} (${vehicle.year})</p>
                            <div class="status-badge">${vehicle.status.toUpperCase()}</div>
                        </div>
                        
                        <div class="content">
                            <div class="metrics">
                                <div class="metric-card">
                                    <div class="metric-label">Speed</div>
                                    <div class="metric-value">${vehicle.speed} <span style="font-size: 16px;">km/h</span></div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-label">Fuel Level</div>
                                    <div class="metric-value">${vehicle.fuelLevel} <span style="font-size: 16px;">%</span></div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-label">Odometer</div>
                                    <div class="metric-value">${(vehicle.odometer / 1000).toFixed(1)} <span style="font-size: 16px;">k km</span></div>
                                </div>
                            </div>

                            <div class="info-section">
                                <div class="info-row">
                                    <span class="label">Engine Status</span>
                                    <span class="value" style="color: ${vehicle.engineOn ? '#10b981' : '#ef4444'}">
                                        ${vehicle.engineOn ? '✓ Running' : '✗ Off'}
                                    </span>
                                </div>
                                ${vehicle.driver ? `
                                <div class="info-row">
                                    <span class="label">Driver</span>
                                    <span class="value">${vehicle.driver.name}</span>
                                </div>
                                ` : ''}
                                <div class="info-row">
                                    <span class="label">Internal ID</span>
                                    <span class="value">${vehicle.internalId}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Current Location</span>
                                    <span class="value" style="max-width: 60%; text-align: right;">${vehicle.currentLocation?.address}</span>
                                </div>
                            </div>

                            <div style="text-align: center;">
                                <a href="${mapUrl}" target="_blank" class="map-button">
                                    📍 View on Google Maps
                                </a>
                            </div>

                            <div class="timestamp">
                                Last updated: ${new Date(vehicle.currentLocation?.updatedAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
        
        const newWindow = window.open('', '_blank', 'width=1000,height=800');
        if (newWindow) {
            newWindow.document.write(vehicleContent);
            newWindow.document.close();
        }
    };

    if (loading) {
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
        <div className="flex h-screen bg-gray-100">
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
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search trucks..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50"
                            >
                                <option value="all">All Status ({vehicles.length})</option>
                                <option value="moving">Moving ({vehicles.filter(v => v.status === 'moving').length})</option>
                                <option value="idle">Idle ({vehicles.filter(v => v.status === 'idle').length})</option>
                                <option value="stopped">Stopped ({vehicles.filter(v => v.status === 'stopped').length})</option>
                                <option value="maintenance">Maintenance ({vehicles.filter(v => v.status === 'maintenance').length})</option>
                            </select>
                        </div>
                    </div>

                    {/* Vehicle List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filteredVehicles.length === 0 ? (
                            <div className="text-center py-8">
                                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No trucks found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredVehicles.map((vehicle) => (
                                    <div
                                        key={vehicle._id}
                                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 relative group ${
                                            selectedVehicle?._id === vehicle._id
                                                ? "bg-blue-50 border-blue-400 shadow-md"
                                                : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                                        }`}
                                    >
                                        {/* Open in New Tab Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openVehicleInNewTab(vehicle);
                                            }}
                                            className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 z-10"
                                            title="Open in new tab"
                                        >
                                            <ExternalLink className="w-4 h-4 text-blue-600" />
                                        </button>

                                        <div onClick={() => handleVehicleClick(vehicle)}>
                                            {/* Plate Number & Status */}
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-bold text-lg text-gray-800">
                                                    {vehicle.plateNumber}
                                                </h3>
                                                <span
                                                    className="px-3 py-1 rounded-full text-xs font-semibold"
                                                    style={{
                                                        backgroundColor: statusBgColors[vehicle.status],
                                                        color: statusColors[vehicle.status],
                                                    }}
                                                >
                                                    {vehicle.status.toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Vehicle Details */}
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <User className="w-4 h-4" />
                                                    <span>
                                                        {vehicle.driver ? vehicle.driver.name : "No driver assigned"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="truncate">{vehicle.currentLocation?.address}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                                    <span className="flex items-center gap-1">
                                                        <Gauge className="w-4 h-4" />
                                                        {vehicle.speed} km/h
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Fuel className="w-4 h-4" />
                                                        {vehicle.fuelLevel}%
                                                    </span>
                                                </div>
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
            <div className="flex-1 relative">
                <div className="w-full h-full relative">
                    {!mapLoaded ? (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading Google Maps...</p>
                            </div>
                        </div>
                    ) : (
                        <div id="google-map" className="w-full h-full"></div>
                    )}
                </div>

                {/* Status Legend */}
                <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg text-xs">
                    <div className="font-semibold mb-2">Vehicle Status Legend:</div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#22c55e'}}></div>
                            <span>Moving ({vehicles.filter(v => v.status === 'moving').length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#f59e0b'}}></div>
                            <span>Idle ({vehicles.filter(v => v.status === 'idle').length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#ef4444'}}></div>
                            <span>Stopped ({vehicles.filter(v => v.status === 'stopped').length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#8b5cf6'}}></div>
                            <span>Maintenance ({vehicles.filter(v => v.status === 'maintenance').length})</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                            Filter: {filterStatus} | Selected: {selectedVehicle ? selectedVehicle.plateNumber : 'None'}
                        </div>
                    </div>
                </div>

                {/* Debug Panel */}
                <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg text-xs">
                    <div className="font-semibold mb-2">Debug Info:</div>
                    <div>Map Loaded: {mapLoaded ? '✅' : '❌'}</div>
                    <div>Map Instance: {map ? '✅' : '❌'}</div>
                    <div>Vehicles: {vehicles.length}</div>
                    <div>Markers: {markers.length}</div>
                    {vehicles.length > 0 && (
                        <div className="mt-2">
                            <div>First Vehicle:</div>
                            <div className="text-xs text-gray-600">
                                {vehicles[0].plateNumber} - {vehicles[0].status}
                            </div>
                            <div className="text-xs text-gray-600">
                                Lat: {vehicles[0].currentLocation?.latitude}
                            </div>
                            <div className="text-xs text-gray-600">
                                Lng: {vehicles[0].currentLocation?.longitude}
                            </div>
                        </div>
                    )}
                </div>

                {/* Map Controls */}
                <div className="absolute top-4 left-80 flex flex-col gap-2">
                    <button
                        onClick={() => setShowRoutes(!showRoutes)}
                        className={`p-3 rounded-lg shadow-lg transition-colors ${
                            showRoutes 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                        title={showRoutes ? 'Hide Routes' : 'Show Routes'}
                    >
                        <Route className="w-5 h-5" />
                    </button>
                    
                    {selectedVehicle && (
                        <button
                            onClick={() => {
                                if (map && selectedVehicle) {
                                    const lat = Number(selectedVehicle.currentLocation.latitude);
                                    const lng = Number(selectedVehicle.currentLocation.longitude);
                                    map.setCenter({ lat, lng });
                                    map.setZoom(15);
                                }
                            }}
                            className="p-3 bg-white text-gray-600 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                            title="Center on Selected Vehicle"
                        >
                            <Navigation className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Advanced Info Panel */}
                {selectedVehicle && (
                    <div className="absolute top-6 right-6 bg-white rounded-2xl shadow-2xl w-96 overflow-hidden border border-gray-200">
                        {/* Header */}
                        <div
                            className="p-4 text-white"
                            style={{
                                background: `linear-gradient(135deg, ${statusColors[selectedVehicle.status]}, ${statusColors[selectedVehicle.status]}dd)`,
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold">{selectedVehicle.plateNumber}</h3>
                                <button
                                    onClick={() => setSelectedVehicle(null)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm opacity-90">
                                {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
                            {/* Status Row */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600 font-medium">Status</span>
                                <span
                                    className="px-3 py-1 rounded-full text-xs font-bold"
                                    style={{
                                        backgroundColor: statusBgColors[selectedVehicle.status],
                                        color: statusColors[selectedVehicle.status],
                                    }}
                                >
                                    {selectedVehicle.status.toUpperCase()}
                                </span>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                                        <Gauge className="w-4 h-4" />
                                        <span className="text-xs font-medium">Speed</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-800">
                                        {selectedVehicle.speed} <span className="text-sm">km/h</span>
                                    </p>
                                </div>

                                <div className="p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-600 mb-1">
                                        <Fuel className="w-4 h-4" />
                                        <span className="text-xs font-medium">Fuel</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-800">
                                        {selectedVehicle.fuelLevel} <span className="text-sm">%</span>
                                    </p>
                                </div>
                            </div>

                            {/* Expandable Sections */}
                            <div className="space-y-2">
                                {/* Driver Information */}
                                {selectedVehicle.driver && (
                                    <div className="border border-gray-200 rounded-lg">
                                        <button
                                            onClick={() => toggleSection('driver')}
                                            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="font-medium text-gray-700">Driver Information</span>
                                            {expandedSections.driver ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                        </button>
                                        {expandedSections.driver && (
                                            <div className="px-3 pb-3 space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Name</span>
                                                    <span className="font-medium">{selectedVehicle.driver.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Phone</span>
                                                    <span className="font-medium">{selectedVehicle.driver.phone}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">License</span>
                                                    <span className="font-medium">{selectedVehicle.driver.licenseNumber}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Vehicle Details */}
                                <div className="border border-gray-200 rounded-lg">
                                    <button
                                        onClick={() => toggleSection('vehicle')}
                                        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-medium text-gray-700">Vehicle Details</span>
                                        {expandedSections.vehicle ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </button>
                                    {expandedSections.vehicle && (
                                        <div className="px-3 pb-3 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">VIN</span>
                                                <span className="font-medium text-xs">{selectedVehicle.vinNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Internal ID</span>
                                                <span className="font-medium">{selectedVehicle.internalId}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Odometer</span>
                                                <span className="font-medium">{selectedVehicle.odometer.toLocaleString()} km</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Engine</span>
                                                <span className={`font-medium ${selectedVehicle.engineOn ? 'text-green-600' : 'text-red-600'}`}>
                                                    {selectedVehicle.engineOn ? 'On' : 'Off'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Maintenance */}
                                <div className="border border-gray-200 rounded-lg">
                                    <button
                                        onClick={() => toggleSection('maintenance')}
                                        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-medium text-gray-700">Maintenance</span>
                                        {expandedSections.maintenance ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </button>
                                    {expandedSections.maintenance && (
                                        <div className="px-3 pb-3 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Tyre Condition</span>
                                                <span className={`font-medium ${
                                                    selectedVehicle.maintenance.tyreCondition === 'good' ? 'text-green-600' :
                                                    selectedVehicle.maintenance.tyreCondition === 'fair' ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                    {selectedVehicle.maintenance.tyreCondition}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Brake Condition</span>
                                                <span className={`font-medium ${
                                                    selectedVehicle.maintenance.brakeCondition === 'good' ? 'text-green-600' :
                                                    selectedVehicle.maintenance.brakeCondition === 'fair' ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                    {selectedVehicle.maintenance.brakeCondition}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Engine Health</span>
                                                <span className={`font-medium ${
                                                    selectedVehicle.maintenance.engineHealth === 'good' ? 'text-green-600' :
                                                    selectedVehicle.maintenance.engineHealth === 'fair' ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                    {selectedVehicle.maintenance.engineHealth}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="py-2">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Current Location</p>
                                        <p className="text-sm text-gray-800">
                                            {selectedVehicle.currentLocation?.address}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessionalTruckTracker;
