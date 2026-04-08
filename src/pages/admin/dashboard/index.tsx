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
    Settings,
    FileText
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
    percentage: number;
    route: string;

    color: "blue" | "green" | "purple" | "orange";
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
        if (!dashboardData) return [];

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
                percentage: Math.min(100, (stats.activeLoads / 50) * 100),
                route: "/admin/dispatch",
                color: "blue" // ✅
            },
            {
                id: "gps",
                title: "GPS Tracking",
                value: stats.vehiclesOnline.toString(),
                change: "+0%",
                trend: "up",
                subtitle: "Vehicles Online",
                icon: MapPin,
                percentage: stats.vehiclesOnline > 0 ? Math.min(100, (stats.vehiclesOnline / 20) * 100) : 0,
                route: "/admin/gpsvehicle",
                color: "green" // ✅
            },
            {
                id: "driver",
                title: "Human Resources",
                value: stats.activeDrivers.toString(),
                change: "+0%",
                trend: "up",
                subtitle: "Active Drivers",
                icon: Users,
                percentage: stats.activeDrivers > 0 ? Math.min(100, (stats.activeDrivers / 30) * 100) : 0,
                route: "/admin/Management",
                color: "purple" // ✅
            },
            {
                id: "maintenance",
                title: "Fleet Maintenance",
                value: stats.pendingTasks.toString(),
                change: "-0%",
                trend: "down",
                subtitle: "Pending Tasks",
                icon: Wrench,
                percentage: stats.pendingTasks > 0 ? Math.min(100, (stats.pendingTasks / 30) * 100) : 0,
                route: "/admin/fleetmaintenance",
                color: "orange" // ✅
            },
            {
                id: "mechanics",
                title: "Mechanics",
                value: (stats.maintenanceOrdersCount ?? 0).toString(),
                change: "+0%",
                trend: "up",
                subtitle: "Maintenance Orders",
                icon: Settings,
                percentage: (stats.maintenanceOrdersCount ?? 0) > 0 ? Math.min(100, ((stats.maintenanceOrdersCount ?? 0) / 50) * 100) : 0,
                route: "/admin/mechanics/dashboard",
                color: "blue" // 🔁 reuse
            },
            {
                id: "compliance",
                title: "Compliance",
                value: `${stats.complianceRate}%`,
                change: "+0%",
                trend: "up",
                subtitle: "Compliance Rate",
                icon: ShieldCheck,
                percentage: stats.complianceRate,
                route: "/admin/compliance",
                color: "green" // 🔁 reuse
            },
            {
                id: "billing",
                title: "Accounts",
                value: `$${stats.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                change: "+0%",
                trend: "up",
                subtitle: "This Month",
                icon: DollarSign,
                percentage: stats.monthlyRevenue > 0 ? Math.min(100, (stats.monthlyRevenue / 100000) * 100) : 0,
                route: "/admin/accounts",
                color: "orange" // 🔁
            },
            {
                id: "health",
                title: "Health & Safety",
                value: stats.openIncidents.toString(),
                change: "-0%",
                trend: "down",
                subtitle: "Open Incidents",
                icon: Heart,
                percentage: stats.openIncidents > 0 ? Math.min(100, (stats.openIncidents / 20) * 100) : 0,
                route: "/admin/healthandsafety",
                color: "purple" // 🔁
            },
            {
                id: "manifest",
                title: "Manifest",
                value: stats.activeLoads.toString(),
                change: "+0%",
                trend: "up",
                subtitle: "Active Trips",
                icon: FileText,
                percentage: stats.activeLoads > 0 ? Math.min(100, (stats.activeLoads / 50) * 100) : 0,
                route: "/admin/manifest",
                color: "blue" // 🔁
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

    // ✅ OUTSIDE JSX (top of component)
    const colorStyles = {
        blue: {
            bg: "bg-gradient-to-br from-[#0B3B5C] to-[#0F6EA8]",
            text: "text-[var(--accent-blue)]",
            glow: "shadow-[0_0_25px_rgba(0,209,255,0.2)]"
        },
        green: {
            bg: "bg-gradient-to-br from-[#0B3B2A] to-[#0FA86E]",
            text: "text-[var(--accent-green)]",
            glow: "shadow-[0_0_25px_rgba(0,255,163,0.2)]"
        },
        purple: {
            bg: "bg-gradient-to-br from-[#2A0B3B] to-[#7C3AED]",
            text: "text-[var(--accent-purple)]",
            glow: "shadow-[0_0_25px_rgba(168,85,247,0.2)]"
        },
        orange: {
            bg: "bg-gradient-to-br from-[#3B2A0B] to-[#F59E0B]",
            text: "text-[var(--accent-orange)]",
            glow: "shadow-[0_0_25px_rgba(245,158,11,0.2)]"
        }
    };

    return (
        <>
            <div className="min-h-screen border-2 border-green-700 bg-[var(--bg-main)]">
                <div className="relative w-full mx-auto">
                    {/* Gradient band */}
                    <div
                        className="absolute inset-x-0 top-0 border-2 border-green-700"
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
                    <div className="relative z-10 px-4.5 pt-3.5 pb-1 border-2 border-red-700">
                        {/* Header Section */}
                        <div className="mb-4.5 relative z-10 border-2 border-red-700">
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-bold text-white" style={{ fontSize: '1.25rem' }}>Overview</h1>
                                <div className="flex items-center gap-2 text-white/90">
                                    <span className="text-xs" style={{ fontSize: '0.75rem' }}>Home</span>
                                </div>
                            </div>
                        </div>

                        {/* Features Cards */}
                        <div className="grid grid-cols-4 gap-4 -mt-2 mb-4.5">

                            {features.map((feature) => {
                                const styles = colorStyles[feature.color] || colorStyles.blue;
                                const Icon = feature.icon;

                                return (
                                    <div
                                        key={feature.id}
                                        onClick={() => handleCardClick(feature.route)}
                                        className="card-premium cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <div className="flex items-start gap-4">

                                            {/* ICON */}
                                            <div className={`flex-shrink-0 rounded-xl p-3 ${styles.bg} ${styles.glow}`}>
                                                <Icon className={styles.text} size={20} strokeWidth={2} />
                                            </div>

                                            {/* CONTENT */}
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold text-primary">
                                                    {feature.title}
                                                </h3>

                                                <div className="text-2xl font-bold text-primary mt-1">
                                                    {feature.value}
                                                </div>

                                                <p className="text-xs text-secondary mt-1">
                                                    {feature.subtitle}
                                                </p>
                                            </div>

                                            {/* % */}
                                            <div className="text-xs font-semibold text-secondary flex items-center gap-1 mt-1">
                                                <span className="text-[var(--accent-green)]">↗</span>
                                                {Math.round(feature.percentage)}%
                                            </div>

                                        </div>

                                        {/* PROGRESS */}
                                        <div className="mt-4 h-[3px] bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full progress-glow ${styles.text}`}
                                                style={{ width: `${feature.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                        </div>

                        {/* Active Trips Section */}
                        {/* Active Trips Section */}
                        <div className="grid grid-cols-12 gap-6">

                            {/* ================= LEFT: MAP ================= */}
                            <div className="col-span-7 bg-card border border-theme rounded-2xl shadow-[0_0_40px_rgba(0,209,255,0.08)] overflow-hidden">

                                {/* HEADER */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-theme
    bg-gradient-to-r from-[rgba(0,209,255,0.1)] to-transparent">

                                    <h2 className="text-sm font-semibold text-primary">Live Fleet Map</h2>

                                    <button className="px-3 py-1 text-xs rounded-md 
      bg-[rgba(0,209,255,0.1)] text-[var(--accent-blue)] hover:bg-[rgba(0,209,255,0.2)]">
                                        View Full Map
                                    </button>
                                </div>

                                {/* MAP */}
                                <div className="relative h-[300px] m-4 rounded-xl overflow-hidden border border-theme">

                                    <MapContainer
                                        center={[54.5, -110]}
                                        zoom={4}
                                        style={{ height: "100%", width: "100%" }}
                                    >
                                        <TileLayer
                                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        />

                                        {/* MARKERS */}
                                        {[
                                            { lat: 49.2, lng: -123.1, color: "#00D1FF" },
                                            { lat: 53.5, lng: -113.5, color: "#00FFA3" },
                                            { lat: 45.5, lng: -73.5, color: "#00FFA3" },
                                            { lat: 43.6, lng: -79.3, color: "#F59E0B" },
                                            { lat: 29.7, lng: -95.3, color: "#FF4D4F" }
                                        ].map((m, i) => (
                                            <Marker
                                                key={i}
                                                position={[m.lat, m.lng]}
                                                icon={L.divIcon({
                                                    html: `<div class="pulse-marker" style="background:${m.color}"></div>`
                                                })}
                                            />
                                        ))}
                                    </MapContainer>

                                    {/* OVERLAY */}
                                    <div className="absolute inset-0 bg-[rgba(0,0,0,0.3)] pointer-events-none" />

                                    {/* LEGEND */}
                                    <div className="absolute bottom-3 left-4 flex gap-4 text-xs 
      bg-[rgba(10,20,40,0.8)] px-4 py-2 rounded-lg border border-theme backdrop-blur-md">

                                        <span className="flex items-center gap-2 text-secondary">
                                            <span className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_6px_#00FFA3]" />
                                            Active (2)
                                        </span>

                                        <span className="flex items-center gap-2 text-secondary">
                                            <span className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_6px_#F59E0B]" />
                                            Idle (0)
                                        </span>

                                        <span className="flex items-center gap-2 text-secondary">
                                            <span className="w-2 h-2 bg-red-400 rounded-full shadow-[0_0_6px_red]" />
                                            Maintenance (0)
                                        </span>

                                        <span className="flex items-center gap-2 text-secondary">
                                            <span className="w-2 h-2 bg-gray-500 rounded-full" />
                                            Offline (3)
                                        </span>
                                    </div>

                                </div>
                            </div>

                            {/* ================= MIDDLE: DISPATCH ================= */}
                            <div className="col-span-3 bg-card border border-theme rounded-2xl p-4 shadow-[0_0_30px_rgba(0,209,255,0.05)]">

                                <div className="flex justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-primary">Dispatch Center</h2>
                                    <button className="text-xs text-accent">View All</button>
                                </div>

                                {[{
                                    id: "TRIP-001",
                                    route: "Calgary, AB → Winnipeg, MB",
                                    name: "John D.",
                                    status: "In Progress",
                                    color: "blue"
                                },
                                {
                                    id: "TRIP-002",
                                    route: "Edmonton → Regina",
                                    name: "Sarah M.",
                                    status: "Scheduled",
                                    color: "green"
                                },
                                {
                                    id: "TRIP-003",
                                    route: "Vancouver → Seattle",
                                    name: "Mike T.",
                                    status: "Pending",
                                    color: "orange"
                                }].map((trip, i) => (

                                    <div key={i} className="mb-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-theme">

                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-[var(--accent-blue)] font-semibold">{trip.id}</span>
                                            <span className={`
  px-2 py-0.5 rounded-full text-xs
  ${trip.color === "blue" && "bg-[rgba(0,209,255,0.1)] text-[var(--accent-blue)]"}
  ${trip.color === "green" && "bg-[rgba(0,255,163,0.1)] text-[var(--accent-green)]"}
  ${trip.color === "orange" && "bg-[rgba(245,158,11,0.1)] text-[var(--accent-orange)]"}
`}>
                                                {trip.status}
                                            </span>
                                        </div>

                                        <div className="text-sm text-primary">{trip.route}</div>
                                        <div className="text-xs text-secondary mt-1">{trip.name}</div>

                                    </div>
                                ))}
                            </div>

                            {/* ================= RIGHT: ALERTS ================= */}
                            <div className="col-span-2 bg-card border border-theme rounded-2xl p-4 shadow-[0_0_30px_rgba(0,209,255,0.05)]">

                                <div className="flex justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-primary">Alerts</h2>
                                    <button className="text-xs text-accent">View All</button>
                                </div>

                                {[
                                    {
                                        title: "Vehicle Maintenance",
                                        desc: "2 vehicles need attention",
                                        color: "orange"
                                    },
                                    {
                                        title: "Compliance",
                                        desc: "3 documents expiring soon",
                                        color: "red"
                                    },
                                    {
                                        title: "Driver Hours",
                                        desc: "1 driver near HOS limit",
                                        color: "blue"
                                    },
                                    {
                                        title: "Safety",
                                        desc: "All systems operational",
                                        color: "green"
                                    }
                                ].map((alert, i) => (

                                    <div key={i} className="flex gap-3 mb-4 items-start">

                                        <div className={`
          p-2 rounded-lg
          ${alert.color === "orange" && "bg-yellow-500/20 text-yellow-400"}
          ${alert.color === "red" && "bg-red-500/20 text-red-400"}
          ${alert.color === "blue" && "bg-blue-500/20 text-blue-400"}
          ${alert.color === "green" && "bg-green-500/20 text-green-400"}
        `}>
                                            ⚠
                                        </div>

                                        <div>
                                            <p className="text-sm text-primary">{alert.title}</p>
                                            <p className="text-xs text-secondary">{alert.desc}</p>
                                        </div>

                                    </div>
                                ))}
                            </div>

                        </div>

                        {/* ================= RECENT TRIPS + DRIVER STATUS ================= */}
                        <div className="grid grid-cols-12 gap-6 mt-6">

                            {/* ================= LEFT: RECENT TRIPS ================= */}
                            <div className="col-span-8 bg-card border border-theme rounded-2xl shadow-[0_0_40px_rgba(0,209,255,0.08)] overflow-hidden">

                                <div className="flex items-center justify-between px-5 py-4 border-b border-theme
    bg-gradient-to-r from-[rgba(0,209,255,0.08)] to-transparent">
                                    <h2 className="text-sm font-semibold text-primary">Recent Trips</h2>
                                    <button className="text-xs text-[var(--accent-blue)]">View All</button>
                                </div>

                                <table className="w-full text-sm">
                                    <thead className="text-xs text-secondary uppercase border-b border-theme">
                                        <tr>
                                            <th className="px-5 py-3 text-left">Trip ID</th>
                                            <th className="px-5 py-3 text-left">Route</th>
                                            <th className="px-5 py-3 text-left">Driver</th>
                                            <th className="px-5 py-3 text-left">Status</th>
                                            <th className="px-5 py-3 text-left">Departed</th>
                                            <th className="px-5 py-3 text-left">ETA</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {[
                                            {
                                                id: "TRIP-001",
                                                route: "Calgary → Winnipeg",
                                                driver: "John D.",
                                                status: "In Progress",
                                                time: "2h ago",
                                                eta: "4h"
                                            },
                                            {
                                                id: "TRIP-002",
                                                route: "Edmonton → Regina",
                                                driver: "Sarah M.",
                                                status: "Scheduled",
                                                time: "5h ago",
                                                eta: "8h"
                                            },
                                            {
                                                id: "TRIP-003",
                                                route: "Vancouver → Seattle",
                                                driver: "Mike T.",
                                                status: "Pending",
                                                time: "1d ago",
                                                eta: "12h"
                                            },
                                            {
                                                id: "TRIP-004",
                                                route: "Dallas → Houston",
                                                driver: "Alex R.",
                                                status: "Completed",
                                                time: "2d ago",
                                                eta: "6h"
                                            }
                                        ].map((trip, i) => {

                                            const statusStyles: Record<string, string> = {
                                                "In Progress": "bg-blue-500/20 text-blue-400",
                                                "Scheduled": "bg-green-500/20 text-green-400",
                                                "Pending": "bg-yellow-500/20 text-yellow-400",
                                                "Completed": "bg-gray-500/20 text-gray-300"
                                            };

                                            return (
                                                <tr key={i} className="border-b border-theme hover:bg-[rgba(0,209,255,0.04)]">
                                                    <td className="px-5 py-4 text-primary">{trip.id}</td>
                                                    <td className="px-5 py-4 text-secondary">{trip.route}</td>
                                                    <td className="px-5 py-4 text-primary">{trip.driver}</td>

                                                    <td className="px-5 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[trip.status]}`}>
                                                            {trip.status}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4 text-secondary">{trip.time}</td>
                                                    <td className="px-5 py-4 text-secondary">{trip.eta}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* ================= RIGHT: DRIVER STATUS ================= */}
                            <div className="col-span-4 bg-card border border-theme rounded-2xl p-4 shadow-[0_0_40px_rgba(0,209,255,0.08)]">

                                <div className="flex justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-primary">Driver Status</h2>
                                    <button className="text-xs text-[var(--accent-blue)]">View All</button>
                                </div>

                                {[
                                    { name: "John D.", status: "Driving", time: "4h 30m left", color: "green" },
                                    { name: "Sarah M.", status: "On Break", time: "1h 15m left", color: "yellow" },
                                    { name: "Mike T.", status: "Off Duty", time: "10h 00m", color: "gray" },
                                    { name: "Alex R.", status: "Driving", time: "3h 45m left", color: "green" },
                                    { name: "David L.", status: "Violation", time: "HOS Alert", color: "red" }
                                ].map((driver, i) => (

                                    <div key={i} className="flex items-center justify-between mb-4">

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-xs text-primary">
                                                {driver.name[0]}
                                            </div>

                                            <div>
                                                <p className="text-sm text-primary">{driver.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-secondary">
                                                    <span className={`w-2 h-2 rounded-full
                ${driver.color === "green" && "bg-green-400"}
                ${driver.color === "yellow" && "bg-yellow-400"}
                ${driver.color === "gray" && "bg-gray-500"}
                ${driver.color === "red" && "bg-red-500"}
              `} />
                                                    {driver.status}
                                                </div>
                                            </div>
                                        </div>

                                        <span className="text-xs text-secondary">{driver.time}</span>

                                    </div>
                                ))}

                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Index;
