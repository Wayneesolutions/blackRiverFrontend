import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package,
    MapPin,
    Users,
    Navigation,
    Truck,
    Wrench,
    ShieldCheck,
    DollarSign,
    Heart
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

declare global {
    interface Window {
        google: any;
    }
}

// Features Cards Data
const features = [
    {
        id: "dispatch",
        title: "Dispatch & Load",
        value: "145",
        change: "+12%",
        trend: "up",
        subtitle: "Active Loads",
        icon: Truck,
        bgColor: "bg-blue-50",
        iconColor: "text-[#42aeec]",
        accentColor: "bg-[#42aeec]",
        percentage: 75,
        route: "/admin/dispatch",
    },
    {
        id: "gps",
        title: "GPS Tracking",
        value: "89",
        change: "+8%",
        trend: "up",
        subtitle: "Vehicles Online",
        icon: MapPin,
        bgColor: "bg-cyan-50",
        iconColor: "text-cyan-500",
        accentColor: "bg-cyan-500",
        percentage: 60,
        route: "/admin/gpsvehicle",
    },
    {
        id: "driver",
        title: "Human Resources",
        value: "234",
        change: "+5%",
        trend: "up",
        subtitle: "Active Drivers",
        icon: Users,
        bgColor: "bg-purple-50",
        iconColor: "text-purple-500",
        accentColor: "bg-purple-500",
        percentage: 85,
        route: "/admin/Management",
    },
    {
        id: "maintenance",
        title: "Fleet Maintenance",
        value: "23",
        change: "-3%",
        trend: "down",
        subtitle: "Pending Tasks",
        icon: Wrench,
        bgColor: "bg-orange-50",
        iconColor: "text-orange-500",
        accentColor: "bg-orange-500",
        percentage: 45,
        route: "/admin/fleetmaintenance",
    },
    {
        id: "compliance",
        title: "Compliance",
        value: "98%",
        change: "+2%",
        trend: "up",
        subtitle: "Compliance Rate",
        icon: ShieldCheck,
        bgColor: "bg-green-50",
        iconColor: "text-green-500",
        accentColor: "bg-green-500",
        percentage: 98,
        route: "/admin/compliance",
    },
    {
        id: "billing",
        title: "Accounts",
        value: "$45.2K",
        change: "+18%",
        trend: "up",
        subtitle: "This Month",
        icon: DollarSign,
        bgColor: "bg-yellow-50",
        iconColor: "text-yellow-600",
        accentColor: "bg-yellow-500",
        percentage: 72,
        route: "/admin/accounts",
    },
    {
        id: "health",
        title: "Health & Safety",
        value: "12",
        change: "-8%",
        trend: "down",
        subtitle: "Open Incidents",
        icon: Heart,
        bgColor: "bg-red-50",
        iconColor: "text-red-500",
        accentColor: "bg-red-500",
        percentage: 35,
        route: "/admin/healthandsafety",
    }
];

// Active Trips Data with coordinates
const trips = [
    { id: 1, origin: "Los Angeles, CA", destination: "Phoenix, AZ", driver: "John Smith", status: "In Transit", eta: "2h 30m", originLat: 34.0522, originLng: -118.2437, destLat: 33.4484, destLng: -112.0740 },
    { id: 2, origin: "Dallas, TX", destination: "Houston, TX", driver: "Mike Johnson", status: "Loading", eta: "4h 15m", originLat: 32.7767, originLng: -96.7970, destLat: 29.7604, destLng: -95.3698 },
    { id: 3, origin: "Chicago, IL", destination: "Detroit, MI", driver: "Sarah Williams", status: "In Transit", eta: "1h 45m", originLat: 41.8781, originLng: -87.6298, destLat: 42.3314, destLng: -83.0458 },
    { id: 4, origin: "Seattle, WA", destination: "Portland, OR", driver: "David Brown", status: "Completed", eta: "Arrived", originLat: 47.6062, originLng: -122.3321, destLat: 45.5152, destLng: -122.6784 },
    { id: 5, origin: "Miami, FL", destination: "Orlando, FL", driver: "Emily Davis", status: "In Transit", eta: "3h 20m", originLat: 25.7617, originLng: -80.1918, destLat: 28.5383, destLng: -81.3792 },
];

const GOOGLE_MAPS_API_KEY = "AIzaSyBE6Ii-ZxHsICvzD2Fp3m3iMPYX-Vie1N4";

const Index = () => {
    const navigate = useNavigate();
    const { isLoaded } = useJsApiLoader({
        id: 'google-maps-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    });

    // Calculate map center based on active trips
    const mapCenter = useMemo(() => {
        const activeTrips = trips.filter(t => t.status === "In Transit");
        if (activeTrips.length === 0) {
            return { lat: 39.8283, lng: -98.5795 }; // Center of USA
        }
        
        const avgLat = activeTrips.reduce((sum, trip) => sum + trip.originLat, 0) / activeTrips.length;
        const avgLng = activeTrips.reduce((sum, trip) => sum + trip.originLng, 0) / activeTrips.length;
        return { lat: avgLat, lng: avgLng };
    }, []);

    const handleCardClick = (route: string) => {
        navigate(route);
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>

            <div className="relative max-w-7xl mx-auto">
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
                                            {feature.percentage}%
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
                                <button className="px-3.5 py-1.5 text-xs font-medium text-[#42aeec] hover:bg-[#42aeec]/10 rounded-md transition-colors" style={{ fontSize: '0.75rem' }}>
                                    View All
                                </button>
                            </div>
                        </div>

                        {/* Real Google Map */}
                        <div className="relative h-52">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={mapCenter}
                                    zoom={5}
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
                                    {isLoaded && window.google && trips.filter(t => t.status === "In Transit").map((trip) => (
                                        <React.Fragment key={trip.id}>
                                            <Marker
                                                position={{ lat: trip.originLat, lng: trip.originLng }}
                                                icon={{
                                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                            <circle cx="10" cy="10" r="8" fill="#42aeec" stroke="#ffffff" stroke-width="2"/>
                                                        </svg>
                                                    `),
                                                    scaledSize: new window.google.maps.Size(20, 20),
                                                    anchor: new window.google.maps.Point(10, 10),
                                                }}
                                                title={`${trip.origin} - ${trip.driver}`}
                                            />
                                            <Marker
                                                position={{ lat: trip.destLat, lng: trip.destLng }}
                                                icon={{
                                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                            <circle cx="10" cy="10" r="8" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
                                                        </svg>
                                                    `),
                                                    scaledSize: new window.google.maps.Size(20, 20),
                                                    anchor: new window.google.maps.Point(10, 10),
                                                }}
                                                title={`${trip.destination} - ${trip.driver}`}
                                            />
                                        </React.Fragment>
                                    ))}
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
                            {trips.map((trip) => (
                                <div key={trip.id} className="px-4.5 py-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3.5 flex-1">
                                            {/* Trip Icon */}
                                            <div className={`rounded-md p-2 ${trip.status === "Completed" ? "bg-green-100" :
                                                trip.status === "In Transit" ? "bg-blue-100" :
                                                    "bg-yellow-100"
                                                }`}>
                                                <Package className={
                                                    trip.status === "Completed" ? "text-green-600" :
                                                        trip.status === "In Transit" ? "text-[#42aeec]" :
                                                            "text-yellow-600"
                                                } size={17} />
                                            </div>

                                            {/* Trip Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-semibold text-gray-900 text-xs" style={{ fontSize: '0.75rem' }}>{trip.origin}</span>
                                                    <span className="text-gray-400 text-xs" style={{ fontSize: '0.75rem' }}>→</span>
                                                    <span className="font-semibold text-gray-900 text-xs" style={{ fontSize: '0.75rem' }}>{trip.destination}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 text-[10px] text-gray-500" style={{ fontSize: '0.625rem' }}>
                                                    <span className="flex items-center gap-1">
                                                        <Users size={11} />
                                                        {trip.driver}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={11} />
                                                        ETA: {trip.eta}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${trip.status === "Completed" ? "bg-green-100 text-green-700" :
                                                trip.status === "In Transit" ? "bg-blue-100 text-[#42aeec]" :
                                                    "bg-yellow-100 text-yellow-700"
                                            }`} style={{ fontSize: '0.625rem' }}>
                                                {trip.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Index;