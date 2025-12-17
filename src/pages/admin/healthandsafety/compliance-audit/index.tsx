import React, { useState, useEffect } from 'react';
import {
    Shield,
    FileText,
    AlertTriangle,
    BarChart,
    Search,
    Download,
    History,
    Filter,
    CheckCircle,
    XCircle,
    Truck,
    Clock,
    Calendar,
    ChevronDown,
    ChevronRight,
    User,
    AlertCircle
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    AreaChart,
    Area
} from 'recharts';
import { jsPDF } from 'jspdf';

// --- Mock Data ---

const DRIVERS = [
    { id: '1', name: 'John Doe', status: 'active' },
    { id: '2', name: 'Sarah Smith', status: 'active' },
    { id: '3', name: 'Mike Johnson', status: 'warning' },
    { id: '4', name: 'James Wilson', status: 'inactive' },
];

const ELD_LOGS_DATA = [
    { time: '00:00', status: 3 }, // Off Duty
    { time: '02:00', status: 3 },
    { time: '04:00', status: 3 },
    { time: '06:00', status: 2 }, // Sleeper
    { time: '08:00', status: 4 }, // On Duty
    { time: '09:00', status: 1 }, // Driving
    { time: '11:00', status: 1 },
    { time: '13:00', status: 4 }, // On Duty (Break)
    { time: '13:30', status: 1 }, // Driving
    { time: '16:00', status: 1 },
    { time: '18:00', status: 4 }, // On Duty
    { time: '19:00', status: 3 }, // Off Duty
    { time: '23:59', status: 3 },
];

const EVENTS_DATA = [
    { id: 1, time: '06:00 AM', status: 'Sleeper Berth', location: 'Detroit, MI', vehicle: 'TRK-101', certified: true },
    { id: 2, time: '08:00 AM', status: 'On Duty', location: 'Detroit, MI', vehicle: 'TRK-101', certified: true },
    { id: 3, time: '09:00 AM', status: 'Driving', location: 'Detroit, MI', vehicle: 'TRK-101', certified: true },
    { id: 4, time: '01:00 PM', status: 'On Duty', location: 'Toledo, OH', vehicle: 'TRK-101', certified: true },
    { id: 5, time: '01:30 PM', status: 'Driving', location: 'Toledo, OH', vehicle: 'TRK-101', certified: false },
    { id: 6, time: '07:00 PM', status: 'Off Duty', location: 'Columbus, OH', vehicle: 'TRK-101', certified: false },
];

const VIOLATIONS_DATA = [
    { id: 1, driver: 'Mike Johnson', type: 'HOS Violation', description: 'Exceeded 11 hours driving', severity: 'high', date: '2025-05-12' },
    { id: 2, driver: 'John Doe', type: 'Form & Manner', description: 'Missing shipping document number', severity: 'low', date: '2025-05-14' },
    { id: 3, driver: 'Mike Johnson', type: 'Missed Break', description: 'Did not take 30 min break', severity: 'medium', date: '2025-05-13' },
];

const AUDIT_REPORTS_DATA = [
    { id: 101, title: 'DOT Inspection Report - Q1', date: '2025-04-01', type: 'Quarterly', status: 'Generated' },
    { id: 102, title: 'Driver Log Summary - April', date: '2025-05-01', type: 'Monthly', status: 'Generated' },
    { id: 103, title: 'Compliance Audits 2024', date: '2025-01-15', type: 'Annual', status: 'Archived' },
];

const STATUS_MAP: Record<number, string> = {
    1: 'Driving',
    2: 'Sleeper',
    3: 'Off Duty',
    4: 'On Duty'
};

const STATUS_COLORS: Record<number, string> = {
    1: '#10b981', // green
    2: '#6366f1', // indigo
    3: '#9ca3af', // gray
    4: '#f59e0b', // amber
};

const ComplianceAuditPage = () => {
    const [activeTab, setActiveTab] = useState<'logs' | 'violations' | 'summaries' | 'reports' | 'alerts'>('logs');
    const [selectedDriver, setSelectedDriver] = useState<string>('1');
    const [dateRange, setDateRange] = useState('today');

    // Handlers
    const handleGenerateReport = (report: any) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(report.title, 20, 20);
        doc.setFontSize(12);
        doc.text(`Date: ${report.date}`, 20, 30);
        doc.text(`Type: ${report.type}`, 20, 40);
        doc.text('This is a certified compliance document generated from the ELD system.', 20, 60);

        // Simulating audit trail
        doc.setFontSize(10);
        doc.text(`Audit Trail ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 20, 280);

        doc.save(`${report.title.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="min-h-screen bg-[#EDF8FF] font-sans">
            {/* Header */}

            <div className="relative py-6 w-full mx-auto">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Shield size={24} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-bold">Compliance & Audit</h1>
                        </div>
                        <p className="text-blue-50 opacity-90 max-w-2xl">
                            Monitor ELD logs, track violations, and manage DOT compliance.
                            <span className="font-semibold text-white ml-2 bg-white/10 px-2 py-0.5 rounded text-xs uppercase tracking-wider">
                                Safety Officer View
                            </span>
                        </p>
                    </div>


                </div>
            </div>


            {/* Main Content */}
            <div className="w-full mx-auto px-4 -mt-12 relative z-20 pb-12">
                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-1 mb-6 flex overflow-x-auto no-scrollbar">
                    {[
                        { id: 'logs', label: 'OS Logs (ELD)', icon: Truck },
                        { id: 'violations', label: 'Violations', icon: AlertTriangle },
                        { id: 'summaries', label: 'Summaries', icon: BarChart },
                        { id: 'reports', label: 'Audit Reports', icon: FileText },
                        { id: 'alerts', label: 'Alerts', icon: AlertCircle },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                ${activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-200'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* --- OS LOGS (ELD) TAB --- */}
                {activeTab === 'logs' && (
                    <div className="space-y-6">
                        {/* Controls */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={selectedDriver}
                                        onChange={(e) => setSelectedDriver(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 text-sm"
                                    >
                                        {DRIVERS.map(d => (
                                            <option key={d.id} value={d.id}>{d.name} {d.status === 'inactive' ? '(Inactive)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="date"
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        defaultValue="2025-05-15"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
                                    <CheckCircle size={14} />
                                    Logs Certified
                                </span>
                                <button className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                                    <History size={14} /> View Edit History
                                </button>
                            </div>
                        </div>

                        {/* Graph */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Clock size={18} className="text-blue-500" />
                                    Driver Daily Log
                                </h3>
                                <div className="flex gap-4 text-xs font-medium">
                                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-400"></span> Off Duty</div>
                                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-500"></span> Sleeper</div>
                                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500"></span> Driving</div>
                                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500"></span> On Duty</div>
                                </div>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={ELD_LOGS_DATA}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} tickLine={false} />
                                        <YAxis
                                            domain={[1, 4]}
                                            ticks={[1, 2, 3, 4]}
                                            tickFormatter={(val) => STATUS_MAP[val]}
                                            stroke="#9ca3af"
                                            fontSize={12}
                                            tickLine={false}
                                            width={80}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(value: any) => [STATUS_MAP[value], 'Status']}
                                        />
                                        <Line
                                            type="stepAfter"
                                            dataKey="status"
                                            stroke="#42aeec"
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 0, fill: '#42aeec' }}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea3d8' }}
                                        />
                                        <ReferenceLine y={1} stroke="#e5e7eb" />
                                        <ReferenceLine y={2} stroke="#e5e7eb" />
                                        <ReferenceLine y={3} stroke="#e5e7eb" />
                                        <ReferenceLine y={4} stroke="#e5e7eb" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-6 grid grid-cols-4 gap-4 border-t border-gray-100 pt-6">
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Driving</p>
                                    <p className="text-lg font-bold text-gray-800">5h 30m</p>
                                    <p className="text-xs text-green-600">Within limits</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">On Duty</p>
                                    <p className="text-lg font-bold text-gray-800">8h 15m</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Break</p>
                                    <p className="text-lg font-bold text-gray-800">30m</p>
                                    <p className="text-xs text-green-600">Taken</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Cycle Left</p>
                                    <p className="text-lg font-bold text-gray-800">32h 45m</p>
                                </div>
                            </div>
                        </div>

                        {/* Event Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-800">Duty Status Timeline</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Time</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Duration</th>
                                        <th className="px-6 py-3">Location</th>
                                        <th className="px-6 py-3">Vehicle</th>
                                        <th className="px-6 py-3">Certified</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {EVENTS_DATA.map((event) => (
                                        <tr key={event.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-900">{event.time}</td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${event.status === 'Driving' ? 'bg-green-100 text-green-700' :
                                                        event.status === 'On Duty' ? 'bg-amber-100 text-amber-700' :
                                                            event.status === 'Sleeper Berth' ? 'bg-indigo-100 text-indigo-700' :
                                                                'bg-gray-100 text-gray-700'}`}>
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-gray-500 text-xs">2h 00m</td>
                                            <td className="px-6 py-3 text-gray-500">{event.location}</td>
                                            <td className="px-6 py-3 text-gray-500 font-mono">{event.vehicle}</td>
                                            <td className="px-6 py-3">
                                                {event.certified ? (
                                                    <CheckCircle size={16} className="text-green-500" />
                                                ) : (
                                                    <div className="flex items-center gap-1 text-amber-600 text-xs">
                                                        <AlertCircle size={14} />
                                                        <span>Pending</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- VIOLATIONS TAB --- */}
                {activeTab === 'violations' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Risk Distribution Card */}
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 col-span-1">
                                <h3 className="font-bold text-gray-800 mb-4">Risk Distribution</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> High Severity</span>
                                        <span className="font-bold">12%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Medium Severity</span>
                                        <span className="font-bold">34%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '34%' }}></div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Low Severity</span>
                                        <span className="font-bold">54%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '54%' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters & List */}
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 col-span-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-800">Compliance Violations</h3>
                                    <button className="text-gray-500 hover:text-blue-600 transition-colors">
                                        <Filter size={18} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {VIOLATIONS_DATA.map((v) => (
                                        <div key={v.id} className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all">
                                            <div className={`mt-1 p-2 rounded-lg 
                             ${v.severity === 'high' ? 'bg-red-100 text-red-600' :
                                                    v.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                <AlertTriangle size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-semibold text-gray-900">{v.type}</h4>
                                                    <span className="text-xs text-gray-500">{v.date}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{v.description}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <User size={10} /> {v.driver}
                                                    </span>
                                                    <span className={`text-xs font-medium uppercase px-2 py-0.5 rounded
                                   ${v.severity === 'high' ? 'text-red-700 bg-red-50' :
                                                            v.severity === 'medium' ? 'text-amber-700 bg-amber-50' : 'text-blue-700 bg-blue-50'}`}>
                                                        {v.severity}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SUMMARIES TAB --- */}
                {activeTab === 'summaries' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <p className="text-sm text-gray-500 mb-1">Total Fleet Drive Hours</p>
                                <h3 className="text-2xl font-bold text-gray-900">12,450 h</h3>
                                <span className="text-xs text-green-600 flex items-center mt-1">
                                    <ChevronDown size={14} className="rotate-180" /> +4.5% vs last week
                                </span>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <p className="text-sm text-gray-500 mb-1">Total On-Duty Hours</p>
                                <h3 className="text-2xl font-bold text-gray-900">18,200 h</h3>
                                <span className="text-xs text-green-600 flex items-center mt-1">
                                    <ChevronDown size={14} className="rotate-180" /> +2.1% vs last week
                                </span>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <p className="text-sm text-gray-500 mb-1">Remaining Cycle</p>
                                <h3 className="text-2xl font-bold text-gray-900">45%</h3>
                                <span className="text-xs text-gray-500 mt-1">Fleet average availability</span>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <p className="text-sm text-gray-500 mb-1">Compliance Rate</p>
                                <h3 className="text-2xl font-bold text-gray-900">98.2%</h3>
                                <span className="text-xs text-red-500 flex items-center mt-1">
                                    <ChevronDown size={14} /> -0.3% vs last week
                                </span>
                            </div>
                        </div>

                        {/* Weekly Recap Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">Weekly Driver Recap</h3>
                                <button className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                                    Download CSV <Download size={14} />
                                </button>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Driver</th>
                                        <th className="px-6 py-3">Total Drive</th>
                                        <th className="px-6 py-3">On Duty</th>
                                        <th className="px-6 py-3">Cycle Used</th>
                                        <th className="px-6 py-3">Violations</th>
                                        <th className="px-6 py-3">Risk Level</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {DRIVERS.map((d, i) => (
                                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-900">{d.name}</td>
                                            <td className="px-6 py-3">45h 30m</td>
                                            <td className="px-6 py-3">58h 15m</td>
                                            <td className="px-6 py-3">
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 w-24">
                                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${60 + (i * 10)}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-gray-500">{i === 2 ? 2 : 0}</td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase
                              ${i === 2 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {i === 2 ? 'High' : 'Low'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- AUDIT REPORTS TAB --- */}
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                            <FileText className="text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-blue-900 text-sm">Official DOT/CVSA Reports</h4>
                                <p className="text-sm text-blue-700">
                                    These reports are generated from certified ELD data and are suitable for presentation to DOT inspectors or internal audit reviews.
                                    All reports include a verifiable audit trail.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {AUDIT_REPORTS_DATA.map((report) => (
                                <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                            {report.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">{report.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{report.type} • {report.date}</p>

                                    <button
                                        onClick={() => handleGenerateReport(report)}
                                        className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Download size={16} /> Download PDF
                                    </button>
                                </div>
                            ))}

                            {/* Generate New */}
                            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-5 flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer">
                                <div className="p-3 bg-white rounded-full shadow-sm mb-3 text-blue-500">
                                    <Download size={24} />
                                </div>
                                <h3 className="font-bold text-gray-900">Generate New Report</h3>
                                <p className="text-sm text-gray-500 mt-1">Create custom 7/14 day summary</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ALERTS TAB --- */}
                {activeTab === 'alerts' && (
                    <div className="max-w-3xl mx-auto space-y-4">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                            <div className="p-2 bg-white rounded-full shadow-sm text-red-500">
                                <AlertCircle size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-red-900">Approaching Violation: Mike Johnson</h4>
                                <p className="text-sm text-red-700">Driver has 15 mins remaining in drive time. Currently driving in Detroit, MI.</p>
                            </div>
                            <button className="px-3 py-1 bg-white border border-red-200 text-red-700 text-sm font-medium rounded hover:bg-red-50">View Log</button>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                            <div className="p-2 bg-white rounded-full shadow-sm text-amber-500">
                                <Clock size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-amber-900">Missing Certification: Sarah Smith</h4>
                                <p className="text-sm text-amber-700">Logs for May 14th have not been certified yet.</p>
                            </div>
                            <button className="px-3 py-1 bg-white border border-amber-200 text-amber-700 text-sm font-medium rounded hover:bg-amber-50">Notify</button>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                            <div className="p-2 bg-white rounded-full shadow-sm text-blue-500">
                                <FileText size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-blue-900">Form & Manner Check</h4>
                                <p className="text-sm text-blue-700">3 drivers have incomplete shipping document records this week.</p>
                            </div>
                            <button className="px-3 py-1 bg-white border border-blue-200 text-blue-700 text-sm font-medium rounded hover:bg-blue-50">Review</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplianceAuditPage;
