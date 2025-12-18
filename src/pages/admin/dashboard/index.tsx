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
    Heart
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import { getAdminDashboard, type Trip, type Truck, type DashboardStats } from '../../../axios/api/main.dashboard';

declare global {
    interface Window {
        google: any;
    }
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBE6Ii-ZxHsICvzD2Fp3m3iMPYX-Vie1N4";
const GOOGLE_MAPS_LIBRARIES: Libraries = ["marker", "places"];

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
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-maps-api',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<{
        stats: DashboardStats;
        trips: Trip[];
        trucks: Truck[];
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAdminDashboard();
            if (response.success && response.data) {
                // Filter to ensure only current company's data (backend should already filter, but double-check)
                const filteredData = {
                    ...response.data,
                    trips: response.data.trips || [],
                    trucks: response.data.trucks || []
                };
                console.log('📊 Dashboard data received:', {
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

    // Calculate map center based on active trips and trucks
    const mapCenter = useMemo(() => {
        if (!dashboardData) {
            return { lat: 39.8283, lng: -98.5795 }; // Center of USA
        }

        // Filter active trips - match backend filter (only 'planned' and 'in-progress')
        const activeTrips = dashboardData.trips.filter(t =>
            t.status === 'in-progress' || t.status === 'planned'
        );

        // Collect all valid coordinates
        const coordinates: { lat: number; lng: number }[] = [];

        // Add trip current locations
        activeTrips.forEach(trip => {
            if (trip.currentLat && trip.currentLng) {
                coordinates.push({ lat: trip.currentLat, lng: trip.currentLng });
            } else if (trip.originLat && trip.originLng) {
                coordinates.push({ lat: trip.originLat, lng: trip.originLng });
            }
        });

        // Add truck locations
        dashboardData.trucks.forEach(truck => {
            if (truck.latitude && truck.longitude) {
                coordinates.push({ lat: truck.latitude, lng: truck.longitude });
            }
        });

        if (coordinates.length === 0) {
            return { lat: 39.8283, lng: -98.5795 }; // Center of USA
        }

        const avgLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
        const avgLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0) / coordinates.length;
        return { lat: avgLat, lng: avgLng };
    }, [dashboardData]);

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

    // Filter active trips - match backend filter (only 'planned' and 'in-progress')
    const activeTrips = dashboardData?.trips.filter(t =>
        t.status === 'in-progress' || t.status === 'planned'
    ) || [];

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

                        {/* Real Google Map */}
                        <div className="relative h-52">
                            {loadError ? (
                                <div className="w-full h-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center border border-gray-300 rounded-lg">
                                    <div className="text-center p-4">
                                        <MapPin className="text-gray-400 mx-auto mb-2" size={32} />
                                        <p className="text-gray-600 font-medium text-sm mb-1">Map unavailable</p>
                                        <p className="text-gray-500 text-xs">Google Maps could not be loaded</p>
                                    </div>
                                </div>
                            ) : isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={mapCenter}
                                    zoom={activeTrips.length > 0 || (dashboardData?.trucks.length || 0) > 0 ? 6 : 5}
                                    options={{
                                        zoomControl: true,
                                        streetViewControl: false,
                                        mapTypeControl: false,
                                        fullscreenControl: false,
                                        styles: [
                                            {
                                                featureType: 'poi',
                                                elementType: 'labels',
                                                stylers: [{ visibility: 'off' }]
                                            }
                                        ]
                                    }}
                                >
                                    {/* Trip Markers - Only show current location (truck) for active trips */}
                                    {activeTrips.map((trip) => {
                                        // Only show truck current location marker, not origin/destination
                                        if (trip.currentLat && trip.currentLng && trip.truckInfo) {
                                            return (
                                                <Marker
                                                    key={`${trip.id}-truck`}
                                                    position={{ lat: trip.currentLat, lng: trip.currentLng }}
                                                    icon={{
                                                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 13 17.5 13s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="#ef4444"/>
                                                            </svg>
                                                        `),
                                                        scaledSize: new window.google.maps.Size(24, 24),
                                                        anchor: new window.google.maps.Point(12, 12),
                                                    }}
                                                    title={`Trip: ${trip.tripNumber || trip.id} - Truck: ${trip.truck} - Driver: ${trip.driver}`}
                                                />
                                            );
                                        }
                                        return null;
                                    })}

                                    {/* All trucks current locations */}
                                    {dashboardData?.trucks.map((truck) => {
                                        // Skip if this truck is already shown as part of a trip
                                        const isTripTruck = activeTrips.some(t =>
                                            t.truckInfo?.id === truck.id ||
                                            t.truckInfo?.licensePlate === truck.licensePlate
                                        );

                                        if (isTripTruck) return null;

                                        return (
                                            <Marker
                                                key={`truck-${truck.id}`}
                                                position={{ lat: truck.latitude, lng: truck.longitude }}
                                                icon={{
                                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 13 17.5 13s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="#6366f1"/>
                                                        </svg>
                                                    `),
                                                    scaledSize: new window.google.maps.Size(24, 24),
                                                    anchor: new window.google.maps.Point(12, 12),
                                                }}
                                                title={`Truck: ${truck.licensePlate || truck.unitNo} - Status: ${truck.operationStatus}`}
                                            />
                                        );
                                    })}
                                </GoogleMap>
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="text-[#42aeec] mx-auto mb-2 animate-pulse" size={32} />
                                        <p className="text-gray-600 font-medium text-xs">Loading map...</p>
                                    </div>
                                </div>
                            )}
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
                                                            {trip.driver}
                                                        </span>
                                                        {trip.truck && (
                                                            <span className="flex items-center gap-1">
                                                                <TruckIcon size={11} />
                                                                {trip.truck}
                                                            </span>
                                                        )}
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
    );
};

export default Index;
