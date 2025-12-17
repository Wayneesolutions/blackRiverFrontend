import React, { useState } from 'react';
import {
    Truck,
    MapPin,
    Activity,
    Clock,
    Wifi,
    WifiOff,
    AlertTriangle,
    Wrench,
    Navigation,
    Search,
    Filter,
    RefreshCw,
    Zap,
    Thermometer
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// --- Mock Data ---

const VEHICLES = [
    { id: 'TRK-101', driver: 'John Doe', status: 'active', engineHours: 12450, idleTime: '2h 15m', lastPing: '2 mins ago', location: 'Detroit, MI', coordinates: { x: 30, y: 40 }, signal: 'strong' },
    { id: 'TRK-102', driver: 'Sarah Smith', status: 'idle', engineHours: 8500, idleTime: '4h 30m', lastPing: '5 mins ago', location: 'Toledo, OH', coordinates: { x: 60, y: 20 }, signal: 'strong' },
    { id: 'TRK-103', driver: 'Mike Johnson', status: 'moving', engineHours: 15200, idleTime: '0h 45m', lastPing: '1 min ago', location: 'Columbus, OH', coordinates: { x: 80, y: 70 }, signal: 'weak' },
    { id: 'TRK-104', driver: 'Unassigned', status: 'offline', engineHours: 11000, idleTime: '-', lastPing: '2 days ago', location: 'Yard A', coordinates: { x: 10, y: 10 }, signal: 'none' },
    { id: 'TRK-105', driver: 'James Wilson', status: 'active', engineHours: 9800, idleTime: '1h 20m', lastPing: '3 mins ago', location: 'Cleveland, OH', coordinates: { x: 50, y: 50 }, signal: 'strong' },
];

const MAINTENANCE_ALERTS = [
    { id: 1, vehicle: 'TRK-103', type: 'High Idle', description: 'Idling > 4 hours detected', severity: 'medium', time: '10:30 AM' },
    { id: 2, vehicle: 'TRK-101', type: 'Engine Check', description: 'Oil pressure irregular', severity: 'high', time: '09:15 AM' },
    { id: 3, vehicle: 'TRK-105', type: 'Service Due', description: 'Preventive maintenance in 500 miles', severity: 'low', time: 'Yesterday' },
];

const ENGINE_HOURS_DATA = [
    { name: 'TRK-101', hours: 12450 },
    { name: 'TRK-102', hours: 8500 },
    { name: 'TRK-103', hours: 15200 },
    { name: 'TRK-104', hours: 11000 },
    { name: 'TRK-105', hours: 9800 },
];

const STATUS_DATA = [
    { name: 'Moving', value: 2, color: '#10b981' }, // green
    { name: 'Idle', value: 2, color: '#f59e0b' }, // amber
    { name: 'Offline', value: 1, color: '#6b7280' }, // gray
];

const VehicleEldMonitor = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'gps' | 'maintenance'>('overview');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredVehicles = VEHICLES.filter(v =>
        v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driver.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#EDF8FF] font-sans pb-12">
            {/* Header */}
            <div className="top-0 z-30">
                <div className="px-8 py-5 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Truck size={28} className="text-blue-500" />
                            Vehicle ELD Monitor
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 ml-10">Real-time operational truck data and status monitoring.</p>
                    </div>

                </div>

                {/* Navigation Tabs */}
                <div className="px-8 flex gap-6">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Operational Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('gps')}
                        className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'gps' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Live GPS Map
                    </button>
                    <button
                        onClick={() => setActiveTab('maintenance')}
                        className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'maintenance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Engine & Maintenance
                        {MAINTENANCE_ALERTS.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                                {MAINTENANCE_ALERTS.length}
                            </span>
                        )}
                    </button>
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
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{VEHICLES.length}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Truck size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">3 Active</span>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">1 Offline</span>
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
                                            <td className="px-6 py-4 text-gray-600 group-hover:text-blue-600 transition-colors">
                                                {v.driver === 'Unassigned' ? <span className="text-gray-400 italic">Unassigned</span> : v.driver}
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
                                                <span className={`${v.idleTime !== '-' && parseInt(v.idleTime) > 3 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                                    {v.idleTime}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-600">{v.engineHours.toLocaleString()} h</td>
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] relative overflow-hidden flex flex-col items-center justify-center bg-slate-100">
                            {/* Mock Map View */}
                            <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center" />

                            <div className="z-10 text-center">
                                <div className="bg-white/80 p-4 rounded-xl backdrop-blur-sm shadow-sm mb-4">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center justify-center gap-2">
                                        <Wifi size={20} className="text-green-500 animate-pulse" />
                                        Live ELD Location Feed
                                    </h3>
                                    <p className="text-sm text-gray-500">Updating vehicle positions in real-time...</p>
                                </div>
                            </div>

                            {/* Mock Data Points */}
                            {VEHICLES.filter(v => v.status !== 'offline').map((v, i) => (
                                <div
                                    key={v.id}
                                    className="absolute group cursor-pointer transition-all duration-1000 ease-in-out"
                                    style={{ left: `${v.coordinates.x}%`, top: `${v.coordinates.y}%` }}
                                >
                                    <div className="relative">
                                        <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping opacity-75"></div>
                                        <div className="w-8 h-8 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center text-blue-600 shadow-md z-20 hover:scale-110 transition-transform">
                                            <Truck size={14} />
                                        </div>

                                        {/* Tooltip */}
                                        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-xl border border-gray-100 w-48 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                                            <h4 className="font-bold text-gray-900 text-xs flex justify-between">
                                                {v.id}
                                                <span className="text-green-500">{v.status}</span>
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">{v.driver}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{v.location}</p>
                                            <p className="text-[10px] text-gray-300 mt-1 text-right">Updated: {v.lastPing}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                    {MAINTENANCE_ALERTS.map(alert => (
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
                                        <BarChart data={ENGINE_HOURS_DATA} layout="vertical">
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
                                                {STATUS_DATA.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-4">
                                    {STATUS_DATA.map((item) => (
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

export default VehicleEldMonitor;
