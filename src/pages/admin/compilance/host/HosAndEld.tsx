import { useState } from 'react';
import {
    Truck, MapPin, Activity, Clock, Wifi, AlertTriangle, 
    Wrench, Navigation, Search, RefreshCw, Zap, ShieldCheck, 
    Download
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
// --- Mock Data ---

const VEHICLES = [
    { id: 'TRK-101', driver: 'John Doe', status: 'active', engineHours: 12450, idleTime: '2h 15m', lastPing: '2 mins ago', location: 'Detroit, MI', coordinates: { x: 30, y: 40 }, signal: 'strong' },
    { id: 'TRK-102', driver: 'Sarah Smith', status: 'idle', engineHours: 8500, idleTime: '4h 30m', lastPing: '5 mins ago', location: 'Toledo, OH', coordinates: { x: 60, y: 20 }, signal: 'strong' },
    { id: 'TRK-103', driver: 'Mike Johnson', status: 'moving', engineHours: 15200, idleTime: '0h 45m', lastPing: '1 min ago', location: 'Columbus, OH', coordinates: { x: 80, y: 70 }, signal: 'weak' },
    { id: 'TRK-104', driver: 'Unassigned', status: 'offline', engineHours: 11000, idleTime: '-', lastPing: '2 days ago', location: 'Yard A', coordinates: { x: 10, y: 10 }, signal: 'none' },
    { id: 'TRK-105', driver: 'James Wilson', status: 'active', engineHours: 9800, idleTime: '1h 20m', lastPing: '3 mins ago', location: 'Cleveland, OH', coordinates: { x: 50, y: 50 }, signal: 'strong' },
];
const HOS_AUDIT_LOGS = [
  { id: 1, driver: 'John Doe', date: '2023-10-24', driveUsed: '10h 30m', dutyUsed: '13h 45m', status: 'compliant', violation: 'None' },
  { id: 2, driver: 'Sarah Smith', date: '2023-10-24', driveUsed: '11h 15m', dutyUsed: '14h 20m', status: 'violation', violation: '11-Hour Limit' },
  { id: 3, driver: 'Mike Johnson', date: '2023-10-23', driveUsed: '8h 00m', dutyUsed: '9h 30m', status: 'warning', violation: 'Approaching 70h' },
  { id: 4, driver: 'James Wilson', date: '2023-10-24', driveUsed: '0h 00m', dutyUsed: '4h 00m', status: 'compliant', violation: 'None' },
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
  // UPDATED: Added 'compliance' to tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'gps' | 'maintenance' | 'compliance'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = VEHICLES.filter(vehicle =>
      vehicle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
      <div className="min-h-screen bg-[#EDF8FF] font-sans pb-12">
          {/* Header */}
          <div className="top-0 z-30 bg-white shadow-sm">
              <div className="px-8 py-5 flex justify-between items-center">
                  <div>
                      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                          <ShieldCheck size={28} className="text-blue-600" />
                          Fleet Compliance Portal
                      </h1>
                      <p className="text-sm text-gray-500 mt-1 ml-10">ELD Mandate Monitoring & HOS Audit Tracking</p>
                  </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-8 flex gap-6">
                  {['overview', 'gps', 'maintenance', 'compliance'].map((tab) => (
                      <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`pb-3 px-2 text-sm font-bold capitalize transition-colors border-b-2 ${
                              activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400'
                          }`}
                      >
                          {tab === 'compliance' ? 'HOS Audit Tracker' : tab.replace('_', ' ')}
                      </button>
                  ))}
              </div>
          </div>

            <div className="w-full mx-auto px-4 mt-8">
            {activeTab === 'compliance' && (
                    <div className="space-y-6">
                        {/* HOS Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-xl border-l-4 border-green-500 shadow-sm">
                                <p className="text-xs text-gray-500 font-bold uppercase">Fully Compliant</p>
                                <h3 className="text-2xl font-bold">85%</h3>
                                <p className="text-xs text-gray-400 mt-1">12 Drivers</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border-l-4 border-red-500 shadow-sm">
                                <p className="text-xs text-gray-500 font-bold uppercase">Active Violations</p>
                                <h3 className="text-2xl font-bold text-red-600">2</h3>
                                <p className="text-xs text-gray-400 mt-1">Requires immediate audit</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl border-l-4 border-amber-500 shadow-sm">
                                <p className="text-xs text-gray-500 font-bold uppercase">Uncertified Logs</p>
                                <h3 className="text-2xl font-bold text-amber-600">5</h3>
                                <p className="text-xs text-gray-400 mt-1">Pending driver signature</p>
                            </div>
                        </div>

                        {/* Audit Table (Mirroring Excel Columns) */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-800">Driver Log Audit (Last 24 Hours)</h3>
                                <button 
                                   style={{
                                    background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                                  }}
                                className="flex items-center gap-2 text-sm font-semibold !text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                    <Download size={16} /> Export HOS Report
                                </button>
                            </div>

                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-[11px] font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Driver Name</th>
                                        <th className="px-6 py-4">Log Date</th>
                                        <th className="px-6 py-4">Driving Time</th>
                                        <th className="px-6 py-4">On-Duty Time</th>
                                        <th className="px-6 py-4">Violation Type</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {HOS_AUDIT_LOGS.map((log) => (
                                        <tr key={log.id} className="hover:bg-blue-50/30">
                                            <td className="px-6 py-4 font-bold text-gray-900">{log.driver}</td>
                                            <td className="px-6 py-4 text-gray-600">{log.date}</td>
                                            <td className="px-6 py-4 font-mono text-gray-700">{log.driveUsed}</td>
                                            <td className="px-6 py-4 font-mono text-gray-700">{log.dutyUsed}</td>
                                            <td className="px-6 py-4">
                                                <span className={`font-medium ${log.violation !== 'None' ? 'text-red-600' : 'text-gray-400'}`}>
                                                    {log.violation}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                    log.status === 'compliant' ? 'bg-green-100 text-green-700' :
                                                    log.status === 'violation' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-blue-600 font-bold hover:underline">View Log</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
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
                            {VEHICLES.filter(v => v.status !== 'offline').map((v) => (
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
