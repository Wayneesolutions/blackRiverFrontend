import React, { useState, useEffect } from 'react';
import {
    User,
    MapPin,
    Search,
    Filter,
    Eye,
    Circle,
    ChevronLeft,
    ChevronRight,
    X,
    Phone,
    Mail,
    Calendar,
    UserCheck,
    UserX,
    Activity,
    Truck,
} from 'lucide-react';
import { listDriver } from '../../../../axios/api/distapcher';

import type { ReactNode } from "react";

interface SortHeaderProps {
    field: string;
    children: ReactNode;
    className?: string;
}

interface Driver {
    _id: string;
    name: string;
    email: string;
    phone: string;
    internalId: string;
    status: 'active' | 'inactive';
    location?: {
        address?: string;
        longitude?: string;
        latitude?: string;
    };
    details?: {
        vehicle?: {
            _id: string;
            plateNumber: string;
            make: string;
            model: string;
            internalId: string;
            status: string;
            currentLocation?: {
                address?: string;
                longitude?: string;
                latitude?: string;
            };
            speed?: number;
            fuelLevel?: number;
        };
        licenceNumber?: string;
        employeeCode?: string;
    };
    joinDate: Date;
    profileImageUrl?: string;
    avatar?: string;
    country?: string;
    milesToday?: number;
    avgSpeed?: number;
}



const DriverList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [driversPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch drivers from API
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                setLoading(true);
                const res = await listDriver();
                if (res.success && res.data?.length) {
                    // Map API response to Driver interface
                    const formattedDrivers: Driver[] = res.data.map((d: any) => ({
                        _id: d._id,
                        name: d.name || 'Unknown',
                        email: d.email || 'N/A',
                        phone: d.phone || 'N/A',
                        internalId: d.internalId || d._id,
                        status: d.status || 'inactive',
                        location: d.location || {},
                        details: {
                            vehicle: d.details?.vehicle || null,
                            licenceNumber: d.details?.licenceNumber || 'N/A',
                            employeeCode: d.details?.employeeCode || 'N/A'
                        },
                        joinDate: d.joinDate ? new Date(d.joinDate) : new Date(),
                        profileImageUrl: d.profileImageUrl || d.avatar,
                        avatar: d.avatar || d.profileImageUrl,
                        country: d.country || 'N/A',
                        milesToday: Number(d.milesToday ?? d.stats?.milesToday ?? 0),
                        avgSpeed: Number(d.avgSpeed ?? d.stats?.avgSpeed ?? 0),
                    }));
                    setDrivers(formattedDrivers);
                } else {
                    setDrivers([]);
                }
            } catch (error) {
                console.error('Error fetching drivers:', error);
                setDrivers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDrivers();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'inactive': return 'text-slate-700 bg-slate-50 border-slate-200';
            default: return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <UserCheck className="w-3 h-3" />;
            case 'inactive': return <UserX className="w-3 h-3" />;
            default: return <Circle className="w-3 h-3" />;
        }
    };

    // Filter and search logic
    const filteredDrivers = drivers.filter(driver => {
        const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;
        const matchesSearch =
            driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (driver.location?.address || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const sortedDrivers = [...filteredDrivers].sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (sortBy) {
            case "name":
                aValue = a.name;
                bValue = b.name;
                break;
            case "email":
                aValue = a.email;
                bValue = b.email;
                break;
            case "phone":
                aValue = a.phone;
                bValue = b.phone;
                break;
            case "status":
                aValue = a.status;
                bValue = b.status;
                break;
            case "internalId":
                aValue = a.internalId;
                bValue = b.internalId;
                break;
            case "milesToday":
                aValue = a.milesToday || 0;
                bValue = b.milesToday || 0;
                break;
            case "avgSpeed":
                aValue = a.avgSpeed || 0;
                bValue = b.avgSpeed || 0;
                break;
            case "joinDate":
                aValue = a.joinDate;
                bValue = b.joinDate;
                break;
            default:
                aValue = a.name;
                bValue = b.name;
        }

        return compareValues(aValue, bValue, sortOrder);
    });

    function compareValues<T extends string | number | Date>(
        a: T,
        b: T,
        order: "asc" | "desc"
    ): number {
        if (a instanceof Date && b instanceof Date) {
            return order === "asc" ? a.getTime() - b.getTime() : b.getTime() - a.getTime();
        }
        if (typeof a === "string" && typeof b === "string") {
            return order === "asc" ? a.localeCompare(b) : b.localeCompare(a);
        }
        if (typeof a === "number" && typeof b === "number") {
            return order === "asc" ? a - b : b - a;
        }
        return 0;
    }

    // Pagination
    const indexOfLastDriver = currentPage * driversPerPage;
    const indexOfFirstDriver = indexOfLastDriver - driversPerPage;
    const currentDrivers = sortedDrivers.slice(indexOfFirstDriver, indexOfLastDriver);
    const totalPages = Math.ceil(sortedDrivers.length / driversPerPage);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handleViewDetails = (driver: Driver) => {
        setSelectedDriver(driver);
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
        total: drivers.length,
        active: drivers.filter(d => d.status === 'active').length,
        inactive: drivers.filter(d => d.status === 'inactive').length,
        withVehicle: drivers.filter(d => d.details?.vehicle).length,
        withoutVehicle: drivers.filter(d => !d.details?.vehicle).length,
    };

    if (loading) {
        return (
            <div className="min-h-screen p-4 bg-gray-50 px-6 flex items-center justify-center">
                <div className="text-gray-500">Loading drivers...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 bg-[#EDF8FF] px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Driver Fleet</h1>
                            <p className="text-slate-600">Manage and monitor your driver fleet</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {/* Total Drivers */}
                    <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
                        <div className="text-2xl font-bold text-slate-700 mb-1">
                            {stats.total}
                        </div>
                        <div className="text-sm font-medium text-slate-600">
                            Total Drivers
                        </div>
                    </div>

                    {/* Active */}
                    <div className="rounded-xl p-4 bg-green-50 border border-green-200">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                            {stats.active}
                        </div>
                        <div className="text-sm font-medium text-green-600">
                            Active
                        </div>
                        <div className="w-full bg-green-100 rounded-full h-1 mt-2">
                            <div
                                className="bg-green-500 h-1 rounded-full"
                                style={{
                                    width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Inactive */}
                    <div className="rounded-xl p-4 bg-slate-100 border border-slate-200">
                        <div className="text-2xl font-bold text-slate-600 mb-1">
                            {stats.inactive}
                        </div>
                        <div className="text-sm font-medium text-slate-600">
                            Inactive
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
                            <div
                                className="bg-slate-500 h-1 rounded-full"
                                style={{
                                    width: `${stats.total > 0 ? (stats.inactive / stats.total) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* With Vehicle */}
                    <div className="rounded-xl p-4 bg-purple-50 border border-purple-200">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                            {stats.withVehicle}
                        </div>
                        <div className="text-sm font-medium text-purple-600">
                            With Vehicle
                        </div>
                        <div className="w-full bg-purple-100 rounded-full h-1 mt-2">
                            <div
                                className="bg-purple-500 h-1 rounded-full"
                                style={{
                                    width: `${stats.total > 0 ? (stats.withVehicle / stats.total) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Unassigned */}
                    <div className="rounded-xl p-4 bg-orange-50 border border-orange-200">
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                            {stats.withoutVehicle}
                        </div>
                        <div className="text-sm font-medium text-orange-600">
                            Unassigned
                        </div>
                        <div className="w-full bg-orange-100 rounded-full h-1 mt-2">
                            <div
                                className="bg-orange-500 h-1 rounded-full"
                                style={{
                                    width: `${stats.total > 0 ? (stats.withoutVehicle / stats.total) * 100 : 0}%`,
                                }}
                            />
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
                                        placeholder="Search by name, email, phone, ID, or location..."
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
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center text-sm text-slate-600">
                            <span>Showing {indexOfFirstDriver + 1}-{Math.min(indexOfLastDriver, sortedDrivers.length)} of {sortedDrivers.length} drivers</span>
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
                                    <SortHeader field="internalId">Driver ID</SortHeader>
                                    <SortHeader field="name">Name</SortHeader>
                                    <SortHeader field="email">Contact</SortHeader>
                                    <SortHeader field="location">Location</SortHeader>
                                    <SortHeader field="milesToday">Miles Today</SortHeader>
                                    <SortHeader field="avgSpeed">Avg Speed</SortHeader>
                                    <SortHeader field="status">Status</SortHeader>
                                    <SortHeader field="joinDate">Join Date</SortHeader>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {currentDrivers.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <User className="w-12 h-12 text-slate-400 mb-4" />
                                                <p className="text-slate-600 font-medium">No drivers found</p>
                                                <p className="text-slate-500 text-sm mt-1">
                                                    {searchTerm || filterStatus !== 'all'
                                                        ? 'Try adjusting your search or filter criteria'
                                                        : 'No drivers are available for your company'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentDrivers.map((driver) => (
                                        <tr key={driver._id} className="hover:bg-slate-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-blue-50 rounded-lg mr-3 border border-blue-100">
                                                        <User className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {driver.internalId}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {driver.avatar || driver.profileImageUrl ? (
                                                        <img
                                                            src={driver.avatar || driver.profileImageUrl}
                                                            alt={driver.name}
                                                            className="w-10 h-10 rounded-full mr-3 object-cover border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full mr-3 bg-blue-100 flex items-center justify-center border border-blue-200">
                                                            <User className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900">
                                                            {driver.name}
                                                        </div>
                                                        {driver.details?.employeeCode && (
                                                            <div className="text-xs text-slate-500">
                                                                Code: {driver.details.employeeCode}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-900">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Mail className="w-4 h-4 text-slate-400" />
                                                        <span>{driver.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Phone className="w-4 h-4 text-slate-400" />
                                                        <span>{driver.phone}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-start space-x-2">
                                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                    <div className="text-sm text-slate-900 max-w-xs">
                                                        {driver.location?.address || 'Location not available'}
                                                    </div>
                                                </div>
                                                {driver.details?.vehicle && (
                                                    <div className="flex items-center space-x-1 mt-2 ml-6">
                                                        <Truck className="w-3 h-3 text-blue-500" />
                                                        <span className="text-xs text-blue-600 font-medium">
                                                            {driver.details.vehicle.plateNumber}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {driver.milesToday !== undefined
                                                        ? `${driver.milesToday.toLocaleString()} mi`
                                                        : '—'}
                                                </p>
                                                <p className="text-xs text-slate-500">Today</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {driver.avgSpeed !== undefined ? `${driver.avgSpeed} mph` : '—'}
                                                </p>
                                                <p className="text-xs text-slate-500">Avg speed</p>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(driver.status)}`}>
                                                    {getStatusIcon(driver.status)}
                                                    <span className="capitalize">{driver.status}</span>
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm text-slate-900">
                                                        {new Date(driver.joinDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleViewDetails(driver)}
                                                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-150 text-sm font-medium"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>Details</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
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
                                        Showing <span className="font-semibold">{indexOfFirstDriver + 1}</span> to{' '}
                                        <span className="font-semibold">{Math.min(indexOfLastDriver, sortedDrivers.length)}</span> of{' '}
                                        <span className="font-semibold">{sortedDrivers.length}</span> results
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

                {/* Driver Details Modal */}
                {showDetails && selectedDriver && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] overflow-hidden">
                        <div className="absolute inset-0" onClick={() => setShowDetails(false)} />
                        <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl">
                            <div className="flex h-full flex-col">
                                {/* Header */}
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {selectedDriver.avatar || selectedDriver.profileImageUrl ? (
                                                <img
                                                    src={selectedDriver.avatar || selectedDriver.profileImageUrl}
                                                    alt={selectedDriver.name}
                                                    className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200">
                                                    <User className="w-6 h-6 text-blue-600" />
                                                </div>
                                            )}
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-900">
                                                    {selectedDriver.name}
                                                </h2>
                                                <p className="text-sm text-slate-600">{selectedDriver.internalId}</p>
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
                                                <User className="w-5 h-5 mr-2 text-blue-600" />
                                                Driver Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Name</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedDriver.name}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Internal ID</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedDriver.internalId}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Email</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedDriver.email}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Phone</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedDriver.phone}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Employee Code</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedDriver.details?.employeeCode || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">License Number</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedDriver.details?.licenceNumber || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Country</label>
                                                    <p className="text-sm text-slate-900 font-medium">{selectedDriver.country || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Join Date</label>
                                                    <p className="text-sm text-slate-900 font-medium">{new Date(selectedDriver.joinDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                                                Status
                                            </h3>
                                            <div>
                                                <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(selectedDriver.status)}`}>
                                                    {getStatusIcon(selectedDriver.status)}
                                                    <span className="capitalize">{selectedDriver.status}</span>
                                                </span>
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
                                                    <p className="text-sm text-slate-900">{selectedDriver.location?.address || 'Location not available'}</p>
                                                </div>
                                                {selectedDriver.location?.latitude && selectedDriver.location?.longitude && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-sm font-medium text-slate-600">Latitude</label>
                                                            <p className="text-sm text-slate-900 font-mono">{selectedDriver.location.latitude}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-slate-600">Longitude</label>
                                                            <p className="text-sm text-slate-900 font-mono">{selectedDriver.location.longitude}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Vehicle Information */}
                                        {selectedDriver.details?.vehicle ? (
                                            <div className="bg-white border border-slate-200 rounded-lg p-6">
                                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                    <Truck className="w-5 h-5 mr-2 text-orange-600" />
                                                    Assigned Vehicle
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Plate Number</label>
                                                        <p className="text-sm text-slate-900 font-medium">{selectedDriver.details.vehicle.plateNumber}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Vehicle ID</label>
                                                        <p className="text-sm text-slate-900 font-medium">{selectedDriver.details.vehicle.internalId}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Make & Model</label>
                                                        <p className="text-sm text-slate-900 font-medium">{selectedDriver.details.vehicle.make} {selectedDriver.details.vehicle.model}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-slate-600">Vehicle Status</label>
                                                        <p className="text-sm text-slate-900 font-medium capitalize">{selectedDriver.details.vehicle.status || 'N/A'}</p>
                                                    </div>
                                                    {selectedDriver.details.vehicle.currentLocation?.address && (
                                                        <div className="md:col-span-2">
                                                            <label className="text-sm font-medium text-slate-600">Vehicle Location</label>
                                                            <p className="text-sm text-slate-900">{selectedDriver.details.vehicle.currentLocation.address}</p>
                                                        </div>
                                                    )}
                                                    {selectedDriver.details.vehicle.speed !== undefined && (
                                                        <div>
                                                            <label className="text-sm font-medium text-slate-600">Speed</label>
                                                            <p className="text-sm text-slate-900 font-medium">{selectedDriver.details.vehicle.speed} km/h</p>
                                                        </div>
                                                    )}
                                                    {selectedDriver.details.vehicle.fuelLevel !== undefined && (
                                                        <div>
                                                            <label className="text-sm font-medium text-slate-600">Fuel Level</label>
                                                            <p className="text-sm text-slate-900 font-medium">{selectedDriver.details.vehicle.fuelLevel}%</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white border border-slate-200 rounded-lg p-6">
                                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                                    <Truck className="w-5 h-5 mr-2 text-orange-600" />
                                                    Assigned Vehicle
                                                </h3>
                                                <div className="text-sm text-slate-500 italic">No vehicle assigned</div>
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

export default DriverList;
