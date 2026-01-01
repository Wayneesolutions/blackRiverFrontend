import { useState, useEffect, useRef } from 'react';
import {
    Truck, MapPin, Activity, Clock, Wifi, AlertTriangle, 
    Wrench, Navigation, Search, RefreshCw, Zap
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import { getHOSEldData } from '../../../../axios/api/compliance.hosEld';
import { getSocket } from '../../../../socket/socketClient';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBE6Ii-ZxHsICvzD2Fp3m3iMPYX-Vie1N4";
const GOOGLE_MAPS_LIBRARIES: Libraries = ["marker", "places"];

declare global {
  interface Window {
    google: any;
  }
}

interface VehicleLocation {
  _id: string;
  unitNo: string;
  internalId: string;
  licensePlate: string;
  makeModel: string;
  status: string;
  operationStatus: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    updatedAt: Date;
  };
  speed: number;
  engineOn: boolean;
  engineHours: number;
}

const GpsSection = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'gps' | 'maintenance'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    totalDrivers: 0,
    compliantDrivers: 0,
    activeViolations: 0,
    uncertifiedLogs: 0
  });
  
  // GPS Tab State
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-api',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLocation[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 43.6532, lng: -79.3832 }); // Default to Toronto
  const [mapZoom, setMapZoom] = useState<number>(6);
  const socketRef = useRef<any>(null);

  // Fetch HOS/ELD data
  const fetchHOSData = async () => {
    setLoading(true);
    try {
      const response = await getHOSEldData();
      if (response?.success && response?.data) {
        setVehicles(response.data.vehicleStatusList || []);
        setSummary(response.data.summary || {
          totalVehicles: 0,
          activeVehicles: 0,
          totalDrivers: 0,
          compliantDrivers: 0,
          activeViolations: 0,
          uncertifiedLogs: 0
        });
      }
    } catch (error) {
      console.error('Error fetching HOS/ELD data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Socket.IO for GPS tracking
  useEffect(() => {
    if (activeTab === 'gps') {
      const socket = getSocket();
      socketRef.current = socket;

      // Join compliance GPS room
      socket.emit('joinComplianceGPS');

      // Listen for vehicle location updates
      socket.on('vehicleLocationsUpdate', (locations: VehicleLocation[]) => {
        setVehicleLocations(locations);
        
        // Update map center to first vehicle if available
        if (locations.length > 0 && locations[0].location) {
          const firstVehicle = locations[0];
          const lat = firstVehicle.location.latitude;
          const lng = firstVehicle.location.longitude;
          
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            setMapCenter({ lat, lng });
            setMapZoom(10);
            
            // Update map center if map is loaded
            if (map) {
              map.setCenter({ lat, lng });
            }
          }
        }
      });

      return () => {
        socket.emit('leaveComplianceGPS');
        socket.off('vehicleLocationsUpdate');
      };
    }
  }, [activeTab, map]);

  useEffect(() => {
    fetchHOSData();
  }, []);

  const filteredVehicles = vehicles.filter((vehicle: any) =>
      vehicle.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.driver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate engine hours data for chart
  const engineHoursData = vehicles.map((v: any) => ({
    name: v.id,
    hours: v.engineHours || 0
  }));

  // Calculate status distribution for pie chart
  const statusDistribution = {
    moving: vehicles.filter((v: any) => v.status === 'moving').length,
    idle: vehicles.filter((v: any) => v.status === 'idle').length,
    offline: vehicles.filter((v: any) => v.status === 'offline').length
  };

  const STATUS_DATA = [
    { name: 'Moving', value: statusDistribution.moving, color: '#10b981' },
    { name: 'Idle', value: statusDistribution.idle, color: '#f59e0b' },
    { name: 'Offline', value: statusDistribution.offline, color: '#6b7280' },
  ];

  // Mock maintenance alerts (can be replaced with real data later)
  const MAINTENANCE_ALERTS: any[] = [];

  return (
      <div className="min-h-screen bg-[#EDF8FF] font-sans pb-12">
          {/* Header */}
          <div className="top-0 z-30 bg-white shadow-sm">
              <div className="px-8 py-5 flex justify-between items-center">
                  <div>
                      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                          <Navigation size={28} className="text-blue-600" />
                          GPS Tracking & Monitoring
                      </h1>
                      <p className="text-sm text-gray-500 mt-1 ml-10">Real-time vehicle location and operational data</p>
                  </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-8 flex gap-6">
                  {['overview', 'gps', 'maintenance'].map((tab) => (
                      <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`pb-3 px-2 text-sm font-bold capitalize transition-colors border-b-2 ${
                              activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400'
                          }`}
                      >
                          {tab === 'overview' ? 'Overview' : tab === 'gps' ? 'GPS Map' : 'Maintenance'}
                      </button>
                  ))}
              </div>
          </div>

            <div className="w-full mx-auto px-4 mt-8">
                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Vehicles</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary.totalVehicles || vehicles.length}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Truck size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">{summary.activeVehicles || 0} Active</span>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{statusDistribution.offline || 0} Offline</span>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Avg Idle Time</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">1h 42m</h3>
                                    </div>
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                        <Clock size={20} />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className="text-xs text-red-500 font-medium">+12% vs last week</span>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Distance</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">24,500 mi</h3>
                                    </div>
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <Navigation size={20} />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className="text-xs text-gray-500">This week (Fleet)</span>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Fuel Efficiency</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">6.8 MPG</h3>
                                    </div>
                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                        <Zap size={20} />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className="text-xs text-green-600 font-medium">Optimal Range</span>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center gap-4">
                                <h3 className="font-bold text-gray-800">Vehicle Status List</h3>

                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search vehicle..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            </div>

                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Vehicle ID</th>
                                        <th className="px-6 py-3">Assigned Driver</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Last Ping</th>
                                        <th className="px-6 py-3">Location</th>
                                        <th className="px-6 py-3">Idle Time</th>
                                        <th className="px-6 py-3">Engine Hours</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredVehicles.map((v) => (
                                        <tr key={v.id} className="hover:bg-blue-50/20 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                                                <Truck size={16} className="text-gray-400 group-hover:text-blue-500" />
                                                {v.id}
                                            </td>
                                            <td className="px-6 py-4">
                                                {v.driver === 'Unassigned' ? (
                                                    <span className="text-gray-400 italic">Unassigned</span>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors">
                                                            {v.driver}
                                                            {v.isCoDriver && (
                                                                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Co-Driver</span>
                                                            )}
                                                        </span>
                                                        {v.driverEmail && (
                                                            <span className="text-xs text-gray-500 mt-0.5">{v.driverEmail}</span>
                                                        )}
                                                        {v.driverPhone && (
                                                            <span className="text-xs text-gray-500">{v.driverPhone}</span>
                                                        )}
                                                        {v.tripNumber && (
                                                            <span className="text-xs text-gray-400 mt-1">Trip: {v.tripNumber}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide
                             ${v.status === 'active' || v.status === 'moving' ? 'bg-green-100 text-green-700' :
                                                        v.status === 'idle' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {v.status === 'moving' && <Activity size={12} className="animate-pulse" />}
                                                    {v.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{v.lastPing}</td>
                                            <td className="px-6 py-4 flex items-center gap-1.5 text-gray-700">
                                                <MapPin size={14} className="text-gray-400" />
                                                {v.location}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`${v.idleTime && v.idleTime !== '-' && parseInt(v.idleTime) > 3 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                                    {v.idleTime || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-600">
                                                {v.engineHours ? v.engineHours.toLocaleString() : '0'} h
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- LIVE GPS TAB --- */}
                {activeTab === 'gps' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] relative overflow-hidden">
                            {loadError ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                                        <p className="text-red-600 font-semibold">Failed to load Google Maps</p>
                                        <p className="text-gray-500 text-sm mt-1">Please check your API key</p>
                                    </div>
                                </div>
                            ) : !isLoaded ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                                        <p className="text-gray-600">Loading Google Maps...</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={mapCenter}
                                        zoom={mapZoom}
                                        onLoad={(mapInstance) => {
                                            setMap(mapInstance);
                                            // Center on first vehicle if available
                                            if (vehicleLocations.length > 0 && vehicleLocations[0].location) {
                                                const firstVehicle = vehicleLocations[0];
                                                const lat = firstVehicle.location.latitude;
                                                const lng = firstVehicle.location.longitude;
                                                if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                                                    mapInstance.setCenter({ lat, lng });
                                                    mapInstance.setZoom(10);
                                                }
                                            }
                                        }}
                                        options={{
                                            zoomControl: true,
                                            streetViewControl: false,
                                            mapTypeControl: false,
                                            fullscreenControl: true,
                                        }}
                                    >
                                        {vehicleLocations.map((vehicle) => {
                                            if (!vehicle.location || !vehicle.location.latitude || !vehicle.location.longitude) {
                                                return null;
                                            }
                                            
                                            const lat = vehicle.location.latitude;
                                            const lng = vehicle.location.longitude;
                                            
                                            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                                                return null;
                                            }

                                            const statusColor = vehicle.status === 'moving' ? '#10b981' :
                                                               vehicle.status === 'idle' ? '#f59e0b' :
                                                               vehicle.status === 'active' ? '#3b82f6' : '#6b7280';

                                            return (
                                                <Marker
                                                    key={vehicle._id}
                                                    position={{ lat, lng }}
                                                    icon={{
                                                        path: window.google.maps.SymbolPath.CIRCLE,
                                                        scale: 8,
                                                        fillColor: statusColor,
                                                        fillOpacity: 1,
                                                        strokeColor: '#ffffff',
                                                        strokeWeight: 2,
                                                    }}
                                                    title={`${vehicle.unitNo} - ${vehicle.licensePlate || vehicle.makeModel || 'Vehicle'}`}
                                                />
                                            );
                                        })}
                                    </GoogleMap>
                                    
                                    {/* Info Card */}
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wifi size={18} className="text-green-500 animate-pulse" />
                                            <h3 className="text-sm font-bold text-gray-800">Live ELD Location Feed</h3>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-2">
                                            {vehicleLocations.length} vehicle{vehicleLocations.length !== 1 ? 's' : ''} tracked
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Updating every 5 seconds from Geotab
                                        </p>
                                    </div>

                                    {/* Vehicle List Sidebar */}
                                    {vehicleLocations.length > 0 && (
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 z-10 max-w-xs max-h-[400px] overflow-y-auto">
                                            <h4 className="text-sm font-bold text-gray-800 mb-3">Active Vehicles</h4>
                                            <div className="space-y-2">
                                                {vehicleLocations.map((vehicle) => (
                                                    <div key={vehicle._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                        <div 
                                                            className="w-3 h-3 rounded-full"
                                                            style={{
                                                                backgroundColor: vehicle.status === 'moving' ? '#10b981' :
                                                                               vehicle.status === 'idle' ? '#f59e0b' :
                                                                               vehicle.status === 'active' ? '#3b82f6' : '#6b7280'
                                                            }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-gray-900 truncate">{vehicle.unitNo}</p>
                                                            <p className="text-xs text-gray-500 truncate">{vehicle.location.address || 'Location unknown'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* --- MAINTENANCE TAB --- */}
                {activeTab === 'maintenance' && (
                    <div className="space-y-6">
                        {/* Alerts */}
                        {MAINTENANCE_ALERTS.length > 0 && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-amber-500" />
                                    Active Maintenance Indicators
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {MAINTENANCE_ALERTS.map((alert: any) => (
                                        <div key={alert.id} className={`p-4 rounded-lg border-l-4 shadow-sm
                     ${alert.severity === 'high' ? 'bg-red-50 border-red-500' :
                                                alert.severity === 'medium' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'}`}>
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-bold text-sm ${alert.severity === 'high' ? 'text-red-700' :
                                                    alert.severity === 'medium' ? 'text-amber-700' : 'text-blue-700'
                                                    }`}>{alert.type}</h4>
                                                <span className="text-xs text-gray-400">{alert.time}</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 mt-1">{alert.vehicle}</p>
                                            <p className="text-xs text-gray-600 mt-1">{alert.description}</p>

                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Engine Hours Chart */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Wrench size={18} className="text-gray-400" />
                                    Engine Hours vs Thresholds
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={engineHoursData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                                            <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} width={60} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                            <Bar dataKey="hours" fill="#42aeec" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 text-xs text-center text-gray-500">
                                    Vehicles approaching 15,000 engine hours require major service.
                                </div>
                            </div>

                            {/* Vehicle Status Distribution */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Activity size={18} className="text-gray-400" />
                                    Real-time Vehicle Status
                                </h3>
                                <div className="h-64 flex justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={STATUS_DATA}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {STATUS_DATA.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-4">
                                    {STATUS_DATA.map((item: any) => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-sm text-gray-600">{item.name}</span>
                                            <span className="text-sm font-bold text-gray-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default GpsSection;

