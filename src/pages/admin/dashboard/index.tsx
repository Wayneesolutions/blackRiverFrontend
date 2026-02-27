import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package,
    MapPin,
    Users,
    Navigation,
    Truck as TruckIcon,
    Wrench,
    ShieldCheck,
    DollarSign,
    Heart,
    Settings
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAdminDashboard, type Trip, type Truck, type DashboardStats } from '../../../axios/api/main.dashboard';
import { getActiveOrdersWithTracking } from '../../../axios/api/distapcher';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map center updates
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom);
    }, [map, center, zoom]);

    return null;
};

// Create custom truck icon for Leaflet
const createTruckIcon = (color: string = '#ef4444') => {
    const svg = `
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="white" stroke="${color}" stroke-width="2"/>
            <g transform="translate(6, 8)">
                <rect x="2" y="5" width="12" height="6" fill="${color}" rx="1"/>
                <rect x="2" y="3" width="6" height="5" fill="${color}" rx="1"/>
                <rect x="3" y="4" width="4" height="2" fill="white" opacity="0.8"/>
                <circle cx="5" cy="13" r="2" fill="#333"/>
                <circle cx="11" cy="13" r="2" fill="#333"/>
            </g>
        </svg>
    `;

    return L.divIcon({
        html: svg,
        className: 'custom-truck-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

interface ActiveOrderGroup {
    _id: string;
    driverId: string;
    driver: {
        _id: string;
        name: string;
        email: string;
        phone: string;
    };
    truck?: {
        _id: string;
        plateNumber: string;
        make: string;
        model: string;
        unitNumber: string;
        internalId: string;
        trackingKey?: string;
    };
    orders: Array<{
        _id: string;
        orderNumber: string;
        customerOrderNo?: string;
        tripNo?: string;
        status: string;
    }>;
    currentLocation?: {
        lat: number;
        lng: number;
        address: string;
    };
    speed: number;
    engineOn: boolean;
    orderCount: number;
}

interface FeatureCard {
    id: string;
    title: string;
    value: string;
    change: string;
    trend: string;
    subtitle: string;
    icon: React.ComponentType<any>;
    bgColor: string;
    iconColor: string;
    accentColor: string;
    percentage: number;
    route: string;
}

const Index = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<{
        stats: DashboardStats;
        trips: Trip[];
        trucks: Truck[];
    } | null>(null);
    const [activeOrders, setActiveOrders] = useState<ActiveOrderGroup[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
        fetchActiveOrders();

        // Refresh active orders every 30 seconds to update tracking locations
        const interval = setInterval(() => {
            fetchActiveOrders();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAdminDashboard();
            if (response.success && response.data) {
                // Ensure stats are properly formatted with default values
                const stats = response.data.stats || {};
                const filteredData = {
                    ...response.data,
                    stats: {
                        activeLoads: Number(stats.activeLoads) || 0,
                        vehiclesOnline: Number(stats.vehiclesOnline) || 0,
                        activeDrivers: Number(stats.activeDrivers) || 0,
                        pendingTasks: Number(stats.pendingTasks) || 0,
                        complianceRate: Number(stats.complianceRate) || 0,
                        monthlyRevenue: Number(stats.monthlyRevenue) || 0,
                        openIncidents: Number(stats.openIncidents) || 0,
                        maintenanceOrdersCount: Number(stats.maintenanceOrdersCount) || 0
                    },
                    trips: response.data.trips || [],
                    trucks: response.data.trucks || []
                };
                console.log('📊 Dashboard data received:', {
                    stats: filteredData.stats,
                    tripsCount: filteredData.trips.length,
                    trucksCount: filteredData.trucks.length,
                    trips: filteredData.trips.map(t => ({ id: t.id, tripNumber: t.tripNumber, status: t.status }))
                });
                setDashboardData(filteredData);
            } else {
                setError(response.message || 'Failed to fetch dashboard data');
            }
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveOrders = async () => {
        try {
            const response = await getActiveOrdersWithTracking();
            if (response?.success && response?.data) {
                const ordersData = Array.isArray(response.data) ? response.data : [];
                // Filter orders that have trucks with tracking keys and current locations
                const ordersWithTracking = ordersData.filter((order: ActiveOrderGroup) =>
                    order.truck?.trackingKey &&
                    order.currentLocation &&
                    order.currentLocation.lat &&
                    order.currentLocation.lng &&
                    order.currentLocation.lat !== 0 &&
                    order.currentLocation.lng !== 0
                );
                setActiveOrders(ordersWithTracking);
                console.log('📍 Active orders with tracking:', ordersWithTracking.length);
            }
        } catch (err: any) {
            console.error('Error fetching active orders with tracking:', err);
        }
    };

    // Calculate map center based on active orders with tracking and trips with trucks
    const mapCenter = useMemo((): [number, number] => {
        const coordinates: { lat: number; lng: number }[] = [];

        // Add active orders with tracking
        activeOrders.forEach(order => {
            if (order.currentLocation && order.currentLocation.lat && order.currentLocation.lng &&
                order.currentLocation.lat !== 0 && order.currentLocation.lng !== 0) {
                coordinates.push({ lat: order.currentLocation.lat, lng: order.currentLocation.lng });
            }
        });

        // Add trips with trucks that have current locations or yard locations
        if (dashboardData) {
            dashboardData.trips.forEach(trip => {
                if (!trip.truckInfo) return;

                // Don't add if already in activeOrders
                const alreadyAdded = activeOrders.some(order =>
                    order.truck?.plateNumber === trip.truckInfo?.licensePlate ||
                    order.truck?.unitNumber === trip.truckInfo?.unitNo
                );
                if (alreadyAdded) return;

                // Prefer current location, fallback to yard location
                if (trip.currentLat && trip.currentLng &&
                    trip.currentLat !== 0 && trip.currentLng !== 0) {
                    coordinates.push({ lat: trip.currentLat, lng: trip.currentLng });
                } else if (trip.truckInfo.yard?.coordinates?.latitude &&
                    trip.truckInfo.yard?.coordinates?.longitude) {
                    coordinates.push({
                        lat: trip.truckInfo.yard.coordinates.latitude,
                        lng: trip.truckInfo.yard.coordinates.longitude
                    });
                } else if (trip.originLat && trip.originLng) {
                    // Fallback to origin if no current location or yard
                    coordinates.push({ lat: trip.originLat, lng: trip.originLng });
                }
            });

            // Add standalone trucks (both with current location and yard location)
            dashboardData.trucks.forEach(truck => {
                if (truck.latitude && truck.longitude) {
                    coordinates.push({ lat: truck.latitude, lng: truck.longitude });
                }
            });
        }

        if (coordinates.length > 0) {
            const avgLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
            const avgLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0) / coordinates.length;
            return [avgLat, avgLng];
        }

        return [39.8283, -98.5795]; // Center of USA
    }, [activeOrders, dashboardData]);

    const mapZoom = useMemo(() => {
        if (activeOrders.length > 0) return 6;
        if (dashboardData && (dashboardData.trips.length > 0 || dashboardData.trucks.length > 0)) return 6;
        return 5;
    }, [activeOrders, dashboardData]);

    // Build features cards with real data
    const features: FeatureCard[] = useMemo(() => {
        if (!dashboardData) {
            return [];
        }

        const stats = dashboardData.stats;
        return [
            {
                id: "dispatch",
                title: "Dispatch & Load",
                value: stats.activeLoads.toString(),
                change: "+0%",
                trend: "up",
                subtitle: "Active Trips",
                icon: TruckIcon,
                bgColor: "bg-blue-50",
                iconColor: "text-[#42aeec]",
                accentColor: "bg-[#42aeec]",
                percentage: Math.min(100, (stats.activeLoads / 50) * 100), // Assuming 50 is max for 100%
                route: "/admin/dispatch",
            },
            {
                id: "gps",
                title: "GPS Tracking",
                value: stats.vehiclesOnline.toString(),
                change: "+0%",
                trend: "up",
                subtitle: "Vehicles Online",
                icon: MapPin,
                bgColor: "bg-cyan-50",
                iconColor: "text-cyan-500",
                accentColor: "bg-cyan-500",
                percentage: stats.vehiclesOnline > 0 ? Math.min(100, (stats.vehiclesOnline / 20) * 100) : 0,
                route: "/admin/gpsvehicle",
            },
            {
                id: "driver",
                title: "Human Resources",
                value: stats.activeDrivers.toString(),
                change: "+0%",
                trend: "up",
                subtitle: "Active Drivers",
                icon: Users,
                bgColor: "bg-purple-50",
                iconColor: "text-purple-500",
                accentColor: "bg-purple-500",
                percentage: stats.activeDrivers > 0 ? Math.min(100, (stats.activeDrivers / 30) * 100) : 0,
                route: "/admin/Management",
            },
            {
                id: "maintenance",
                title: "Fleet Maintenance",
                value: stats.pendingTasks.toString(),
                change: "-0%",
                trend: "down",
                subtitle: "Pending Tasks",
                icon: Wrench,
                bgColor: "bg-orange-50",
                iconColor: "text-orange-500",
                accentColor: "bg-orange-500",
                percentage: stats.pendingTasks > 0 ? Math.min(100, (stats.pendingTasks / 30) * 100) : 0,
                route: "/admin/fleetmaintenance",
            },
            {
                id: "mechanics",
                title: "Mechanics",
                value: (stats.maintenanceOrdersCount ?? 0).toString(),
                change: "+0%",
                trend: "up",
                subtitle: "Maintenance Orders",
                icon: Settings,
                bgColor: "bg-slate-50",
                iconColor: "text-slate-600",
                accentColor: "bg-slate-600",
                percentage: (stats.maintenanceOrdersCount ?? 0) > 0 ? Math.min(100, ((stats.maintenanceOrdersCount ?? 0) / 50) * 100) : 0,
                route: "/admin/mechanics/dashboard",
            },
            {
                id: "compliance",
                title: "Compliance",
                value: `${stats.complianceRate}%`,
                change: "+0%",
                trend: "up",
                subtitle: "Compliance Rate",
                icon: ShieldCheck,
                bgColor: "bg-green-50",
                iconColor: "text-green-500",
                accentColor: "bg-green-500",
                percentage: stats.complianceRate,
                route: "/admin/compliance",
            },
            {
                id: "billing",
                title: "Accounts",
                value: `$${stats.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                change: "+0%",
                trend: "up",
                subtitle: "This Month",
                icon: DollarSign,
                bgColor: "bg-yellow-50",
                iconColor: "text-yellow-600",
                accentColor: "bg-yellow-500",
                percentage: stats.monthlyRevenue > 0 ? Math.min(100, (stats.monthlyRevenue / 100000) * 100) : 0,
                route: "/admin/accounts",
            },
            {
                id: "health",
                title: "Health & Safety",
                value: stats.openIncidents.toString(),
                change: "-0%",
                trend: "down",
                subtitle: "Open Incidents",
                icon: Heart,
                bgColor: "bg-red-50",
                iconColor: "text-red-500",
                accentColor: "bg-red-500",
                percentage: stats.openIncidents > 0 ? Math.min(100, (stats.openIncidents / 20) * 100) : 0,
                route: "/admin/healthandsafety",
            }
        ];
    }, [dashboardData]);

    const handleCardClick = (route: string) => {
        navigate(route);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EDF8FF' }}>
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#42aeec] mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EDF8FF' }}>
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error: {error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="px-4 py-2 bg-[#42aeec] text-white rounded-lg hover:bg-[#1db5f5]"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>
                <div className="relative w-full mx-auto">
                    {/* Gradient band */}
                    <div
                        className="absolute inset-x-0 top-0"
                        style={{
                            background: `linear-gradient(
                          90deg,
                          #42aeec 0%,
                          #1db5f5 40%,
                          #0ea3d8 100%
                        )`,
                            height: '101px'
                        }}
                        aria-hidden="true"
                    />

                    {/* Main content */}
                    <div className="relative z-10 px-4.5 pt-3.5 pb-1">
                        {/* Header Section */}
                        <div className="mb-4.5 relative z-10">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-bold text-white" style={{ fontSize: '1.25rem' }}>Overview</h1>
                                <div className="flex items-center gap-2 text-white/90">
                                    <span className="text-xs" style={{ fontSize: '0.75rem' }}>Home</span>
                                </div>
                            </div>
                        </div>

                        {/* Features Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 -mt-2 mb-4.5">
                            {features.map((feature) => {
                                const Icon = feature.icon;

                                return (
                                    <div
                                        key={feature.id}
                                        onClick={() => handleCardClick(feature.route)}
                                        className="bg-white rounded-lg p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="flex items-start justify-between mb-2.5">
                                            {/* Left side content */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#42aeec]/10 text-[#42aeec] uppercase tracking-wide">
                                                        Portal
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-900 mb-1.5" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                                                    {feature.title}
                                                </h3>

                                                <div className="flex items-baseline gap-2 mb-0.5">
                                                    <span className="text-xl font-bold text-gray-900" style={{ fontSize: '1.25rem' }}>{feature.value}</span>
                                                </div>

                                                <p className="text-[10px] text-gray-400" style={{ fontSize: '0.625rem' }}>{feature.subtitle}</p>
                                            </div>

                                            {/* Right side icon */}
                                            <div className={`${feature.bgColor} rounded-lg p-2.5 shadow-sm`}>
                                                <Icon className={feature.iconColor} size={21} strokeWidth={2} />
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="flex items-center gap-2 mt-2.5">
                                            <div className="flex-1 bg-gray-100 rounded-full h-0.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${feature.accentColor} transition-all`}
                                                    style={{ width: `${feature.percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-semibold text-gray-500 min-w-[28px] text-right" style={{ fontSize: '0.625rem' }}>
                                                {Math.round(feature.percentage)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Active Trips Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-4.5">
                            {/* Section Header */}
                            <div className="px-4.5 py-3 border-b border-gray-100 bg-gradient-to-r from-[#42aeec]/5 to-transparent">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-[#42aeec]/10 rounded-md p-2">
                                            <Navigation className="text-[#42aeec]" size={17} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-gray-900" style={{ fontSize: '0.875rem' }}>Active Trips</h2>
                                            <p className="text-xs text-gray-500" style={{ fontSize: '0.75rem' }}>Real-time tracking of ongoing deliveries</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/admin/dispatch')}
                                        className="px-3.5 py-1.5 text-xs font-medium text-[#42aeec] hover:bg-[#42aeec]/10 rounded-md transition-colors"
                                        style={{ fontSize: '0.75rem' }}
                                    >
                                        View All
                                    </button>
                                </div>
                            </div>

                            {/* OpenStreetMap */}
                            <div className="relative h-52">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={false}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapController center={mapCenter} zoom={mapZoom} />

                                    {/* Markers for active orders with tracking keys */}
                                    {activeOrders.map((orderGroup) => {
                                        if (!orderGroup.currentLocation) {
                                            return null;
                                        }

                                        const lat = orderGroup.currentLocation.lat;
                                        const lng = orderGroup.currentLocation.lng;

                                        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                                            return null;
                                        }

                                        return (
                                            <Marker
                                                key={`order-${orderGroup._id}`}
                                                position={[lat, lng]}
                                                icon={createTruckIcon('#ef4444')}
                                            >
                                                <Popup>
                                                    <div className="p-2 min-w-[200px]">
                                                        <h3 className="font-bold text-sm mb-2">
                                                            {orderGroup.truck?.plateNumber || orderGroup.truck?.unitNumber || 'Truck'}
                                                        </h3>
                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-600">Driver:</span>
                                                                <span className="font-medium">{orderGroup.driver.name}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-600">Orders:</span>
                                                                <span className="font-medium">{orderGroup.orderCount}</span>
                                                            </div>
                                                            {orderGroup.currentLocation.address && (
                                                                <div className="mt-2 pt-2 border-t">
                                                                    <p className="text-gray-600 text-xs">
                                                                        {orderGroup.currentLocation.address}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {orderGroup.speed > 0 && (
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <span className="text-gray-600">Speed:</span>
                                                                    <span className="font-medium">{Math.round(orderGroup.speed)} mph</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-gray-600">Engine:</span>
                                                                <span className={`font-medium ${orderGroup.engineOn ? 'text-green-600' : 'text-gray-400'}`}>
                                                                    {orderGroup.engineOn ? 'On' : 'Off'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        );
                                    })}

                                    {/* Markers for trips/orders with trucks that have current locations or yard locations (from dashboard data) */}
                                    {dashboardData?.trips
                                        .filter(trip => {
                                            if (!trip.truckInfo) return false;

                                            // Check if already shown in activeOrders
                                            const alreadyShown = activeOrders.some(order =>
                                                order.truck?.plateNumber === trip.truckInfo?.licensePlate ||
                                                order.truck?.unitNumber === trip.truckInfo?.unitNo
                                            );
                                            if (alreadyShown) return false;

                                            // Check if has current location
                                            const hasCurrentLocation = trip.currentLat &&
                                                trip.currentLng &&
                                                trip.currentLat !== 0 &&
                                                trip.currentLng !== 0;

                                            // Check if has yard location as fallback
                                            const hasYardLocation = trip.truckInfo.yard?.coordinates?.latitude &&
                                                trip.truckInfo.yard?.coordinates?.longitude &&
                                                trip.truckInfo.yard.coordinates.latitude !== 0 &&
                                                trip.truckInfo.yard.coordinates.longitude !== 0;

                                            return hasCurrentLocation || hasYardLocation;
                                        })
                                        .map((trip) => {
                                            // Prefer current location, fallback to yard location
                                            const hasCurrentLocation = trip.currentLat &&
                                                trip.currentLng &&
                                                trip.currentLat !== 0 &&
                                                trip.currentLng !== 0;

                                            const useYardLocation = !hasCurrentLocation &&
                                                trip.truckInfo?.yard?.coordinates?.latitude &&
                                                trip.truckInfo?.yard?.coordinates?.longitude;

                                            const lat = hasCurrentLocation ? trip.currentLat! :
                                                (useYardLocation ? trip.truckInfo!.yard!.coordinates!.latitude! : 0);
                                            const lng = hasCurrentLocation ? trip.currentLng! :
                                                (useYardLocation ? trip.truckInfo!.yard!.coordinates!.longitude! : 0);

                                            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                                                return null;
                                            }

                                            const truckDisplay = trip.truckInfo?.licensePlate || trip.truckInfo?.unitNo || 'Truck';
                                            const driverDisplay = typeof trip.driver === 'string' 
                                                ? trip.driver 
                                                : (typeof trip.driver === 'object' ? trip.driver?.name : trip.driverInfo?.name) || 'Unassigned';
                                            const locationAddress = hasCurrentLocation
                                                ? (trip.truckInfo?.currentLocation?.address || '')
                                                : (useYardLocation
                                                    ? `${trip.truckInfo?.yard?.yardName || 'Yard'} - ${trip.truckInfo?.yard?.address || ''}, ${trip.truckInfo?.yard?.city || ''}, ${trip.truckInfo?.yard?.stateProvince || ''}`
                                                    : ''
                                                );

                                            return (
                                                <Marker
                                                    key={`trip-${trip.id}`}
                                                    position={[lat, lng]}
                                                    icon={createTruckIcon(useYardLocation ? '#f59e0b' : '#6366f1')}
                                                >
                                                    <Popup>
                                                        <div className="p-2 min-w-[200px]">
                                                            <h3 className="font-bold text-sm mb-2">{truckDisplay}</h3>
                                                            {useYardLocation && (
                                                                <div className="mb-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                                                    📍 Yard Location
                                                                </div>
                                                            )}
                                                            <div className="space-y-1 text-xs">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-600">Driver:</span>
                                                                    <span className="font-medium">{driverDisplay}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-gray-600">Trip:</span>
                                                                    <span className="font-medium">{trip.tripNumber}</span>
                                                                </div>
                                                                {locationAddress && (
                                                                    <div className="mt-2 pt-2 border-t">
                                                                        <p className="text-gray-600 text-xs">
                                                                            {locationAddress}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <span className="text-gray-600">Status:</span>
                                                                    <span className="font-medium capitalize">{trip.status}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            );
                                        })}

                                    {/* Markers for standalone trucks with yard locations */}
                                    {dashboardData?.trucks
                                        .filter(truck =>
                                            truck.isYardLocation &&
                                            truck.latitude &&
                                            truck.longitude &&
                                            truck.latitude !== 0 &&
                                            truck.longitude !== 0
                                        )
                                        .map((truck) => {
                                            return (
                                                <Marker
                                                    key={`truck-yard-${truck.id}`}
                                                    position={[truck.latitude, truck.longitude]}
                                                    icon={createTruckIcon('#f59e0b')}
                                                >
                                                    <Popup>
                                                        <div className="p-2 min-w-[200px]">
                                                            <h3 className="font-bold text-sm mb-2">
                                                                {truck.licensePlate || truck.unitNo || 'Truck'}
                                                            </h3>
                                                            <div className="mb-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                                                📍 Yard Location
                                                            </div>
                                                            <div className="space-y-1 text-xs">
                                                                {truck.yard && (
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-gray-600">Yard:</span>
                                                                        <span className="font-medium">{truck.yard.yardName}</span>
                                                                    </div>
                                                                )}
                                                                {truck.address && (
                                                                    <div className="mt-2 pt-2 border-t">
                                                                        <p className="text-gray-600 text-xs">
                                                                            {truck.address}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <span className="text-gray-600">Status:</span>
                                                                    <span className="font-medium capitalize">{truck.operationStatus}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            );
                                        })}
                                </MapContainer>
                            </div>

                            {/* Trips List */}
                            <div className="divide-y divide-gray-100">
                                {dashboardData && dashboardData.trips.length > 0 ? (
                                    dashboardData.trips.slice(0, 10).map((trip) => (
                                        <div key={trip.id} className="px-4.5 py-3 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3.5 flex-1">
                                                    {/* Trip Icon */}
                                                    <div className={`rounded-md p-2 ${trip.status === "completed" ? "bg-green-100" :
                                                        trip.status === "in-progress" || trip.status === "started" ? "bg-blue-100" :
                                                            "bg-yellow-100"
                                                        }`}>
                                                        <Package className={
                                                            trip.status === "completed" ? "text-green-600" :
                                                                trip.status === "in-progress" || trip.status === "started" ? "text-[#42aeec]" :
                                                                    "text-yellow-600"
                                                        } size={17} />
                                                    </div>

                                                    {/* Trip Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                            {trip.route?.summary ? (
                                                                // Show route summary if available (new format)
                                                                <span className="font-semibold text-gray-900 text-xs" style={{ fontSize: '0.75rem' }}>
                                                                    {trip.route.summary}
                                                                </span>
                                                            ) : (
                                                                // Fallback to origin → destination (old format)
                                                                <>
                                                                    <span className="font-semibold text-gray-900 text-xs" style={{ fontSize: '0.75rem' }}>
                                                                        {trip.origin}
                                                                    </span>
                                                                    <span className="text-gray-400 text-xs" style={{ fontSize: '0.75rem' }}>→</span>
                                                                    <span className="font-semibold text-gray-900 text-xs" style={{ fontSize: '0.75rem' }}>
                                                                        {trip.destination}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {trip.route?.waypoints && trip.route.waypoints.length > 2 && (
                                                            <div className="text-[10px] text-gray-400 mb-0.5" style={{ fontSize: '0.625rem' }}>
                                                                {trip.route.waypoints.length} stops
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2.5 text-[10px] text-gray-500" style={{ fontSize: '0.625rem' }}>
                                                            <span className="flex items-center gap-1">
                                                                <Users size={11} />
                                                                {typeof trip.driver === 'string' 
                                                                    ? trip.driver 
                                                                    : (typeof trip.driver === 'object' ? trip.driver?.name : trip.driverInfo?.name) || 'Unassigned'}
                                                            </span>
                                                            {(trip.truck && typeof trip.truck === 'object') || trip.truckInfo ? (
                                                                <span className="flex items-center gap-1">
                                                                    <TruckIcon size={11} />
                                                                    {trip.truck && typeof trip.truck === 'object'
                                                                        ? (trip.truck.plateNumber || trip.truck.licensePlate || trip.truck.unitNumber || trip.truck.internalId || 'Truck')
                                                                        : trip.truckInfo?.licensePlate || trip.truckInfo?.unitNo || 'Truck Assigned'}
                                                                </span>
                                                            ) : null}
                                                            {trip.route?.totalDistance && trip.route.totalDistance > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <Navigation size={11} />
                                                                    {Math.round(trip.route.totalDistance)} mi
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <MapPin size={11} />
                                                                ETA: {trip.eta}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${trip.status === "completed" ? "bg-green-100 text-green-700" :
                                                        trip.status === "in-progress" || trip.status === "started" ? "bg-blue-100 text-[#42aeec]" :
                                                            "bg-yellow-100 text-yellow-700"
                                                        }`} style={{ fontSize: '0.625rem' }}>
                                                        {trip.status === 'in-progress' || trip.status === 'started' ? 'In Transit' :
                                                            trip.status === 'completed' ? 'Completed' : trip.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4.5 py-8 text-center text-gray-500">
                                        <Package className="mx-auto mb-2 text-gray-400" size={24} />
                                        <p className="text-xs">No active trips found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Index;
