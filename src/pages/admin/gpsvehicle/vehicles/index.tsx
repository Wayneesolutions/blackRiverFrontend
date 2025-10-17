import React, { useState } from 'react';
import {
    Car,
    Fuel,
    Gauge,
    MapPin,
    Search,
    Filter,
    Eye,
    Navigation,
    Clock,
    Circle,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    X,
    User,
    Wrench,
    Activity,
    TrendingUp,
    FileText,
    Image as ImageIcon,
    Truck,
    Route,
} from 'lucide-react';

import type { ReactNode } from "react";

interface SortHeaderProps {
    field: string;
    children: ReactNode;
    className?: string;
}

interface Vehicle {
    _id: string;
    internalId: string;
    plateNumber: string;
    vinNumber: string;
    make: string;
    model: string;
    year: number;
    driver: {
        _id: string;
        name: string;
        phone: string;
    } | null;
    status: string;
    vehicleImage: { imageUrl: string }[];
    documents: { documentUrl: string }[];
    avatar: string;
    hasTrailer: boolean;
    trailerDetails: {
        serialNumber: string;
        capacity: string;
        status: string;
    } | null;
    currentLocation: {
        address: string;
        longitude: string;
        latitude: string;
        updatedAt: Date;
    };
    speed: number;
    fuelLevel: number;
    odometer: number;
    engineOn: boolean;
    driverBehaviour: {
        harshBraking: number;
        speedingEvents: number;
        idlingDuration: number;
    };
    engineHealth: {
        faultCodes: { code: string; description: string }[];
        batteryVoltage: number;
        engineHours: number;
    };
    trips: {
        startTime: Date;
        endTime: Date;
        route: { latitude: string; longitude: string; timestamp: Date }[];
    }[];
}

const VehicleList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [vehiclesPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('plateNumber');
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const mockVehicles: Vehicle[] = [
        {
            _id: "1",
            internalId: "VH001",
            plateNumber: "DL-01-AB-1234",
            vinNumber: "WVWZZZ1JZ3W386752",
            make: "Tata",
            model: "Ace Gold",
            year: 2022,
            driver: {
                _id: "driver1",
                name: "Rajesh Kumar",
                phone: "+91-9876543210",
            },
            status: "moving",
            vehicleImage: [
                {
                    imageUrl:
                        "https://via.placeholder.com/300x200/3b82f6/ffffff?text=Vehicle+Image",
                },
            ],
            documents: [
                {
                    documentUrl:
                        "https://via.placeholder.com/300x200/10b981/ffffff?text=RC+Document",
                },
                {
                    documentUrl:
                        "https://via.placeholder.com/300x200/f59e0b/ffffff?text=Insurance",
                },
            ],
            avatar:
                "https://via.placeholder.com/100x100/6366f1/ffffff?text=VH001",
            hasTrailer: true,
            trailerDetails: {
                serialNumber: "TR001234",
                capacity: "5000 kg",
                status: "attached",
            },
            currentLocation: {
                address: "Sector 18, Noida, UP",
                longitude: "77.3273",
                latitude: "28.5706",
                updatedAt: new Date(),
            },
            speed: 45,
            fuelLevel: 78,
            odometer: 45230,
            engineOn: true,
            driverBehaviour: {
                harshBraking: 3,
                speedingEvents: 1,
                idlingDuration: 25,
            },
            engineHealth: {
                faultCodes: [],
                batteryVoltage: 12.4,
                engineHours: 1250,
            },
            trips: [
                {
                    startTime: new Date("2024-01-20T08:00:00"),
                    endTime: new Date("2024-01-20T14:30:00"),
                    route: [
                        {
                            latitude: "28.5706",
                            longitude: "77.3273",
                            timestamp: new Date("2024-01-20T08:00:00"),
                        },
                        {
                            latitude: "28.6315",
                            longitude: "77.2167",
                            timestamp: new Date("2024-01-20T14:30:00"),
                        },
                    ],
                },
            ],
        },
        {
            _id: '2',
            internalId: 'VH002',
            plateNumber: 'DL-02-CD-5678',
            vinNumber: 'WVWZZZ1JZ3W386753',
            make: 'Mahindra',
            model: 'Bolero Pickup',
            year: 2021,
            driver: {
                _id: 'driver2',
                name: 'Amit Singh',
                phone: '+91-9876543211'
            },
            status: 'idle',
            vehicleImage: [
                { imageUrl: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Vehicle+Image' }
            ],
            documents: [
                { documentUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=RC+Document' }
            ],
            avatar: 'https://via.placeholder.com/100x100/6366f1/ffffff?text=VH002',
            hasTrailer: false,
            trailerDetails: null,
            currentLocation: {
                address: 'Connaught Place, New Delhi',
                longitude: '77.2167',
                latitude: '28.6315',
                updatedAt: new Date()
            },
            speed: 0,
            fuelLevel: 45,
            odometer: 38450,
            engineOn: false,
            driverBehaviour: {
                harshBraking: 1,
                speedingEvents: 0,
                idlingDuration: 45
            },
            engineHealth: {
                faultCodes: [
                    { code: 'P0171', description: 'System Too Lean (Bank 1)' }
                ],
                batteryVoltage: 11.8,
                engineHours: 980
            },
            trips: []
        },
        {
            _id: '3',
            internalId: 'VH003',
            plateNumber: 'UP-16-EF-9012',
            vinNumber: 'WVWZZZ1JZ3W386754',
            make: 'Ashok Leyland',
            model: 'Dost',
            year: 2023,
            driver: null,
            status: 'stopped',
            vehicleImage: [
                { imageUrl: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=Vehicle+Image' }
            ],
            documents: [
                { documentUrl: 'https://via.placeholder.com/300x200/10b981/ffffff?text=RC+Document' },
                { documentUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Insurance' },
                { documentUrl: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=PUC+Certificate' }
            ],
            avatar: 'https://via.placeholder.com/100x100/6366f1/ffffff?text=VH003',
            hasTrailer: false,
            trailerDetails: null,
            currentLocation: {
                address: 'Industrial Area, Ghaziabad, UP',
                longitude: '77.4126',
                latitude: '28.6692',
                updatedAt: new Date()
            },
            speed: 0,
            fuelLevel: 92,
            odometer: 12890,
            engineOn: false,
            driverBehaviour: {
                harshBraking: 0,
                speedingEvents: 0,
                idlingDuration: 0
            },
            engineHealth: {
                faultCodes: [],
                batteryVoltage: 12.6,
                engineHours: 340
            },
            trips: []
        }
    ];
    const [vehicles] = useState<Vehicle[]>(mockVehicles);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'moving': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'idle': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'stopped': return 'text-slate-700 bg-slate-50 border-slate-200';
            case 'maintenance': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'moving': return <Navigation className="w-3 h-3" />;
            case 'idle': return <Clock className="w-3 h-3" />;
            case 'stopped': return <Circle className="w-3 h-3" />;
            case 'maintenance': return <AlertTriangle className="w-3 h-3" />;
            default: return <Circle className="w-3 h-3" />;
        }
    };

    const getFuelColor = (level: number) => {
        if (level > 50) return 'text-emerald-600';
        if (level > 20) return 'text-amber-600';
        return 'text-red-600';
    };

    const getSpeedColor = (speed: number, status: string) => {
        if (status === 'moving' && speed > 0) return 'text-blue-600';
        return 'text-slate-600';
    };

    // Filter and search logic
    const filteredVehicles = vehicles.filter(vehicle => {
        const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
        const matchesSearch =
            vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.currentLocation.address.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const sortedVehicles = [...filteredVehicles].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortBy) {
            case "plateNumber":
                aValue = a.plateNumber;
                bValue = b.plateNumber;
                break;
            case "internalId":
                aValue = a.internalId;
                bValue = b.internalId;
                break;
            case "speed":
                aValue = a.speed;
                bValue = b.speed;
                break;
            case "fuelLevel":
                aValue = a.fuelLevel;
                bValue = b.fuelLevel;
                break;
            case "status":
                aValue = a.status;
                bValue = b.status;
                break;
            case "location":
                aValue = a.currentLocation.address;
                bValue = b.currentLocation.address;
                break;
            default:
                aValue = a.plateNumber;
                bValue = b.plateNumber;
        }

        return compareValues(aValue, bValue, sortOrder);
    });

    function compareValues<T extends string | number>(
        a: T,
        b: T,
        order: "asc" | "desc"
    ): number {
        if (typeof a === "string" && typeof b === "string") {
            return order === "asc" ? a.localeCompare(b) : b.localeCompare(a);
        }
        if (typeof a === "number" && typeof b === "number") {
            return order === "asc" ? a - b : b - a;
        }
        return 0;
    }

    // Pagination
    const indexOfLastVehicle = currentPage * vehiclesPerPage;
    const indexOfFirstVehicle = indexOfLastVehicle - vehiclesPerPage;
    const currentVehicles = sortedVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);
    const totalPages = Math.ceil(sortedVehicles.length / vehiclesPerPage);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handleViewDetails = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setShowDetails(true);
    };

    const SortHeader: React.FC<SortHeaderProps> = ({
        field,
        children,
        className = "",
    }) => (
        <th
            className={`px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors duration-150 ${className}`}
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center space-x-1">
                <span>{children}</span>
                {sortBy === field && (
                    <span className="text-blue-500 text-sm font-bold">
                        {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                )}
            </div>
        </th>
    );

    // Stats calculation
    const stats = {
        total: vehicles.length,
        moving: vehicles.filter(v => v.status === 'moving').length,
        idle: vehicles.filter(v => v.status === 'idle').length,
        stopped: vehicles.filter(v => v.status === 'stopped').length,
        maintenance: vehicles.filter(v => v.status === 'maintenance').length,
        lowFuel: vehicles.filter(v => v.fuelLevel < 20).length
    };

    return (
        <div className="min-h-screen p-4 bg-gray-50 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Vehicle Fleet</h1>
                            <p className="text-slate-600">Manage and monitor your vehicle fleet</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="text-2xl font-bold text-slate-900 mb-1">{stats.total}</div>
                        <div className="text-sm font-medium text-slate-600">Total Vehicles</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="text-2xl font-bold text-emerald-600 mb-1">{stats.moving}</div>
                        <div className="text-sm font-medium text-slate-600">Moving</div>
                        <div className="w-full bg-emerald-100 rounded-full h-1 mt-2">
                            <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${(stats.moving / stats.total) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="text-2xl font-bold text-amber-600 mb-1">{stats.idle}</div>
                        <div className="text-sm font-medium text-slate-600">Idle</div>
                        <div className="w-full bg-amber-100 rounded-full h-1 mt-2">
                            <div className="bg-amber-500 h-1 rounded-full" style={{ width: `${(stats.idle / stats.total) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="text-2xl font-bold text-slate-600 mb-1">{stats.stopped}</div>
                        <div className="text-sm font-medium text-slate-600">Stopped</div>
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                            <div className="bg-slate-500 h-1 rounded-full" style={{ width: `${(stats.stopped / stats.total) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="text-2xl font-bold text-red-600 mb-1">{stats.maintenance}</div>
                        <div className="text-sm font-medium text-slate-600">Maintenance</div>
                        <div className="w-full bg-red-100 rounded-full h-1 mt-2">
                            <div className="bg-red-500 h-1 rounded-full" style={{ width: `${(stats.maintenance / stats.total) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="text-2xl font-bold text-orange-600 mb-1">{stats.lowFuel}</div>
                        <div className="text-sm font-medium text-slate-600">Low Fuel</div>
                        <div className="w-full bg-orange-100 rounded-full h-1 mt-2">
                            <div className="bg-orange-500 h-1 rounded-full" style={{ width: `${(stats.lowFuel / stats.total) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search by plate number, internal ID, or location..."
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <select
                                        className="pl-10 pr-8 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white min-w-40 transition-colors duration-150"
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
                            </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center text-sm text-slate-600">
                            <span>Showing {indexOfFirstVehicle + 1}-{Math.min(indexOfLastVehicle, sortedVehicles.length)} of {sortedVehicles.length} vehicles</span>
                            <div className="flex items-center space-x-2">
                                <span>Show:</span>
                                <select className="border border-slate-200 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                                <span>per page</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <SortHeader field="internalId">Vehicle ID</SortHeader>
                                    <SortHeader field="plateNumber">Plate Number</SortHeader>
                                    <SortHeader field="location">Current Location</SortHeader>
                                    <SortHeader field="speed">Speed</SortHeader>
                                    <SortHeader field="fuelLevel">Fuel Level</SortHeader>
                                    <SortHeader field="status">Status</SortHeader>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {currentVehicles.map((vehicle) => (
                                    <tr key={vehicle._id} className="hover:bg-slate-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-blue-50 rounded-lg mr-3 border border-blue-100">
                                                    <Car className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="text-sm font-semibold text-slate-900">
                                                    {vehicle.internalId}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">
                                                {vehicle.plateNumber}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-start space-x-2">
                                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <div className="text-sm text-slate-900 max-w-xs">
                                                    {vehicle.currentLocation.address}
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 ml-6">
                                                {vehicle.currentLocation.latitude}, {vehicle.currentLocation.longitude}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <Gauge className={`w-4 h-4 ${getSpeedColor(vehicle.speed, vehicle.status)}`} />
                                                <span className={`text-sm font-medium ${getSpeedColor(vehicle.speed, vehicle.status)}`}>
                                                    {vehicle.speed} km/h
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-3">
                                                <Fuel className={`w-4 h-4 ${getFuelColor(vehicle.fuelLevel)}`} />
                                                <span className={`text-sm font-medium ${getFuelColor(vehicle.fuelLevel)} min-w-12`}>
                                                    {vehicle.fuelLevel}%
                                                </span>
                                                <div className="w-20 bg-slate-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-300 ${vehicle.fuelLevel > 50 ? 'bg-emerald-500' :
                                                            vehicle.fuelLevel > 20 ? 'bg-amber-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${Math.min(vehicle.fuelLevel, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(vehicle.status)}`}>
                                                {getStatusIcon(vehicle.status)}
                                                <span className="capitalize">{vehicle.status}</span>
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleViewDetails(vehicle)}
                                                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-150 text-sm font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span>Details</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-700 font-medium">
                                        Showing <span className="font-semibold">{indexOfFirstVehicle + 1}</span> to{' '}
                                        <span className="font-semibold">{Math.min(indexOfLastVehicle, sortedVehicles.length)}</span> of{' '}
                                        <span className="font-semibold">{sortedVehicles.length}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>

                                        {[...Array(totalPages)].map((_, index) => {
                                            const page = index + 1;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-150 ${currentPage === page
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Vehicle Details Modal */}
                {showDetails && selectedVehicle && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] overflow-hidden">
                        <div className="absolute transition-opacity" onClick={() => setShowDetails(false)} />
                        <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl">
                            <div className="flex h-full flex-col">
                                {/* Header */}
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={selectedVehicle.avatar}
                                                alt={selectedVehicle.internalId}
                                                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                                            />
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-900">
                                                    {selectedVehicle.internalId}
                                                </h2>
                                                <p className="text-sm text-slate-600">{selectedVehicle.plateNumber}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowDetails(false)}
                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors duration-150"
                                        >
                                            <X className="w-5 h-5 text-slate-600" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-6 space-y-6">

                                        {/* Basic Information */}
                                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                <Car className="w-5 h-5 mr-2 text-blue-600" />
                                                Vehicle Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Internal ID</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedVehicle.internalId}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Plate Number</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedVehicle.plateNumber}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">VIN Number</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedVehicle.vinNumber}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Make & Model</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedVehicle.make} {selectedVehicle.model}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Year</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedVehicle.year}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Odometer</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedVehicle.odometer.toLocaleString()} km</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Driver Information */}
                                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                <User className="w-5 h-5 mr-2 text-green-600" />
                                                Driver Information
                                            </h3>
                                            {selectedVehicle.driver ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Driver Name</label>
                                                        <p className="text-sm text-slate-900 font-medium">{selectedVehicle.driver.name}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Phone Number</label>
                                                        <p className="text-sm text-slate-900 font-medium">{selectedVehicle.driver.phone}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-500 italic">No driver assigned</div>
                                            )}
                                        </div>

                                        {/* Current Status */}
                                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                                                Current Status
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Status</label>
                                                    <div className="mt-1">
                                                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(selectedVehicle.status)}`}>
                                                            {getStatusIcon(selectedVehicle.status)}
                                                            <span className="capitalize">{selectedVehicle.status}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Speed</label>
                                                    <p className={`text-sm font-medium ${getSpeedColor(selectedVehicle.speed, selectedVehicle.status)}`}>
                                                        {selectedVehicle.speed} km/h
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Fuel Level</label>
                                                    <div className="mt-1">
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`text-sm font-medium ${getFuelColor(selectedVehicle.fuelLevel)}`}>
                                                                {selectedVehicle.fuelLevel}%
                                                            </span>
                                                            <div className="w-20 bg-slate-200 rounded-full h-2">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all duration-300 ${selectedVehicle.fuelLevel > 50 ? 'bg-emerald-500' :
                                                                        selectedVehicle.fuelLevel > 20 ? 'bg-amber-500' : 'bg-red-500'
                                                                        }`}
                                                                    style={{ width: `${Math.min(selectedVehicle.fuelLevel, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Engine</label>
                                                    <p className="text-sm text-slate-900 font-medium">
                                                        {selectedVehicle.engineOn ? (
                                                            <span className="text-green-600">ON</span>
                                                        ) : (
                                                            <span className="text-red-600">OFF</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Location Information */}
                                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                <MapPin className="w-5 h-5 mr-2 text-red-600" />
                                                Current Location
                                            </h3>
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Address</label>
                                                    <p className="text-sm text-slate-900">{selectedVehicle.currentLocation.address}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Latitude</label>
                                                        <p className="text-sm text-slate-900 font-mono">{selectedVehicle.currentLocation.latitude}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Longitude</label>
                                                        <p className="text-sm text-slate-900 font-mono">{selectedVehicle.currentLocation.longitude}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Last Updated</label>
                                                    <p className="text-sm text-slate-900">{new Date(selectedVehicle.currentLocation.updatedAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Trailer Information */}
                                        {selectedVehicle.hasTrailer && selectedVehicle.trailerDetails && (
                                            <div className="bg-white border border-slate-200 rounded-lg p-6">
                                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                    <Truck className="w-5 h-5 mr-2 text-orange-600" />
                                                    Trailer Information
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Serial Number</label>
                                                        <p className="text-sm text-slate-900 font-medium">{selectedVehicle.trailerDetails.serialNumber}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Capacity</label>
                                                        <p className="text-sm text-slate-900 font-medium">{selectedVehicle.trailerDetails.capacity}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Status</label>
                                                        <p className="text-sm text-slate-900 font-medium capitalize">{selectedVehicle.trailerDetails.status}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Driver Behaviour */}
                                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                                                Driver Behaviour Metrics
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-red-600">{selectedVehicle.driverBehaviour.harshBraking}</div>
                                                    <div className="text-sm text-slate-600">Harsh Braking Events</div>
                                                </div>
                                                <div className="text-center p-4 bg-amber-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-amber-600">{selectedVehicle.driverBehaviour.speedingEvents}</div>
                                                    <div className="text-sm text-slate-600">Speeding Events</div>
                                                </div>
                                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                                    <div className="text-2xl font-bold text-blue-600">{selectedVehicle.driverBehaviour.idlingDuration}</div>
                                                    <div className="text-sm text-slate-600">Idling Duration (min)</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Engine Health */}
                                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                <Wrench className="w-5 h-5 mr-2 text-emerald-600" />
                                                Engine Health
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Battery Voltage</label>
                                                        <p className="text-sm text-slate-900 font-medium">{selectedVehicle.engineHealth.batteryVoltage}V</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Engine Hours</label>
                                                        <p className="text-sm text-slate-900 font-medium">{selectedVehicle.engineHealth.engineHours} hours</p>
                                                    </div>
                                                </div>

                                                {/* Fault Codes */}
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600 mb-2 block">Fault Codes</label>
                                                    {selectedVehicle.engineHealth.faultCodes.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {selectedVehicle.engineHealth.faultCodes.map((fault, index) => (
                                                                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                                    <div className="flex items-start space-x-2">
                                                                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                                                                        <div>
                                                                            <div className="text-sm font-medium text-red-900">{fault.code}</div>
                                                                            <div className="text-sm text-red-700">{fault.description}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                                            No fault codes detected
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recent Trips */}
                                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                <Route className="w-5 h-5 mr-2 text-cyan-600" />
                                                Recent Trips
                                            </h3>
                                            {selectedVehicle.trips.length > 0 ? (
                                                <div className="space-y-3">
                                                    {selectedVehicle.trips.map((trip, index) => (
                                                        <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-xs font-medium text-slate-600">Start Time</label>
                                                                    <p className="text-sm text-slate-900">{new Date(trip.startTime).toLocaleString()}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-medium text-slate-600">End Time</label>
                                                                    <p className="text-sm text-slate-900">{new Date(trip.endTime).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2">
                                                                <label className="text-xs font-medium text-slate-600">Route Points</label>
                                                                <p className="text-sm text-slate-900">{trip.route.length} GPS coordinates recorded</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-500 italic">No recent trips recorded</div>
                                            )}
                                        </div>

                                        {/* Vehicle Images */}
                                        {selectedVehicle.vehicleImage.length > 0 && (
                                            <div className="bg-white border border-slate-200 rounded-lg p-6">
                                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                    <ImageIcon className="w-5 h-5 mr-2 text-pink-600" />
                                                    Vehicle Images
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {selectedVehicle.vehicleImage.map((image, index) => (
                                                        <img
                                                            key={index}
                                                            src={image.imageUrl}
                                                            alt={`Vehicle ${index + 1}`}
                                                            className="w-full h-48 object-cover rounded-lg border border-slate-200"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Documents */}
                                        {selectedVehicle.documents.length > 0 && (
                                            <div className="bg-white border border-slate-200 rounded-lg p-6">
                                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                    <FileText className="w-5 h-5 mr-2 text-violet-600" />
                                                    Documents
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {selectedVehicle.documents.map((doc, index) => (
                                                        <div key={index} className="relative">
                                                            <img
                                                                src={doc.documentUrl}
                                                                alt={`Document ${index + 1}`}
                                                                className="w-full h-32 object-cover rounded-lg border border-slate-200"
                                                            />
                                                            <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded">
                                                                Document {index + 1}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

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

export default VehicleList;