import React, { useState, useEffect, useRef } from 'react';
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
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { listDriver } from '../../../../axios/api/distapcher';

import type { ReactNode } from "react";

interface SortHeaderProps {
    field: string;
    children: ReactNode;
    className?: string;
}

interface Vehicle {
    _id?: string;
    internalId?: string;
    plateNumber?: string;
    make?: string;
    model?: string;
    year?: string | number;
    status?: string;
    currentLocation?: {
        address?: string;
        longitude?: string;
        latitude?: string;
    };
    speed?: number;
    fuelLevel?: number;
    odometer?: number;
    engineOn?: boolean;
    trackingKey?: string;
    type?: string;
    ownership?: string;
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
        vehicle?: Vehicle;
        licenceNumber?: string;
        employeeCode?: string;
    };
    vehicle?: Vehicle | null;
    joinDate: Date;
    profileImageUrl?: string;
    avatar?: string;
    country?: string;
    milesToday?: number;
    avgSpeed?: number;
    // Additional Driver fields
    mobile?: string;
    gender?: string;
    citizenship?: string;
    wsib?: string;
    wsibAccountNo?: string;
    fastCard?: string;
    fastCardExpiry?: string | Date;
    medicalTracking?: string;
    csa?: string;
    employmentDetails?: string;
    notes?: string;
    driversLicence?: string;
    passport?: string;
    passportCountry?: string;
    passportExpiry?: string | Date;
    dateOfBirth?: string | Date;
    ticketYTD?: number;
    employeeCode?: string;
    incorporation?: string;
    postalCode?: string;
    fleet?: string;
    cell2?: string;
    extension?: string;
    fax?: string;
    expiryDate?: string | Date;
    gstNo?: string;
    companyFlag?: boolean;
    hireDate?: string | Date;
    termDate?: string | Date;
    // Payment and rate fields
    defaultChargeName?: string;
    defaultCurrency?: string;
    chargesAppliedOn?: string;
    defaultMode?: string;
    defaultAmount?: number;
    defaultRemarks?: string;
    defaultPayrollType?: string;
    paymentCurrency?: string;
    paymentMethod?: string;
    account?: string;
    mileRate?: number;
    mileRateTeam?: number;
    emptyMileRate?: number;
    emptyMileRateTeam?: number;
    hourlyRate?: number;
    weightRate?: number;
    percentageRate?: number;
    salaryPerMile?: number;
    salaryPerMileSnow?: number;
    salaryPerMileHighTemp?: number;
    highTempThreshold?: number;
    // Tax information
    localTaxNo?: string;
    federalTaxNo?: string;
    sinNo?: string;
    craAccountNo?: string;
    fedTaxExempt?: boolean;
    provTaxExempt?: boolean;
    cppQppExempt?: boolean;
    eiExempt?: boolean;
    qpipExempt?: boolean;
    // Payroll settings
    payPeriod?: string;
    vacationPay?: string;
    ltl?: boolean;
    onSettlements?: boolean;
    settlementCurrencyByOrder?: boolean;
    isDefault?: boolean;
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
    const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);

    // Refs for scrollbar synchronization
    const topScrollRef = useRef<HTMLDivElement>(null);
    const bottomScrollRef = useRef<HTMLDivElement>(null);

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
                            vehicle: d.details?.vehicle || d.vehicle || null,
                            licenceNumber: d.details?.licenceNumber || d.driversLicence || 'N/A',
                            employeeCode: d.details?.employeeCode || d.employeeCode || 'N/A'
                        },
                        vehicle: d.vehicle || d.details?.vehicle || null,
                        joinDate: d.joinDate ? new Date(d.joinDate) : new Date(),
                        profileImageUrl: d.profileImageUrl || d.avatar,
                        avatar: d.avatar || d.profileImageUrl,
                        country: d.country || 'N/A',
                        milesToday: Number(d.milesToday ?? d.stats?.milesToday ?? 0),
                        avgSpeed: Number(d.avgSpeed ?? d.stats?.avgSpeed ?? 0),
                        // Additional fields
                        mobile: d.mobile,
                        gender: d.gender,
                        citizenship: d.citizenship,
                        wsib: d.wsib,
                        wsibAccountNo: d.wsibAccountNo,
                        fastCard: d.fastCard,
                        fastCardExpiry: d.fastCardExpiry,
                        medicalTracking: d.medicalTracking,
                        csa: d.csa,
                        employmentDetails: d.employmentDetails,
                        notes: d.notes,
                        driversLicence: d.driversLicence,
                        passport: d.passport,
                        passportCountry: d.passportCountry,
                        passportExpiry: d.passportExpiry,
                        dateOfBirth: d.dateOfBirth,
                        ticketYTD: d.ticketYTD || 0,
                        employeeCode: d.employeeCode,
                        incorporation: d.incorporation,
                        postalCode: d.postalCode,
                        fleet: d.fleet,
                        cell2: d.cell2,
                        extension: d.extension,
                        fax: d.fax,
                        expiryDate: d.expiryDate,
                        gstNo: d.gstNo,
                        companyFlag: d.companyFlag,
                        hireDate: d.hireDate,
                        termDate: d.termDate,
                        // Payment fields
                        defaultChargeName: d.defaultChargeName,
                        defaultCurrency: d.defaultCurrency,
                        chargesAppliedOn: d.chargesAppliedOn,
                        defaultMode: d.defaultMode,
                        defaultAmount: d.defaultAmount,
                        defaultRemarks: d.defaultRemarks,
                        defaultPayrollType: d.defaultPayrollType,
                        paymentCurrency: d.paymentCurrency,
                        paymentMethod: d.paymentMethod,
                        account: d.account,
                        mileRate: d.mileRate,
                        mileRateTeam: d.mileRateTeam,
                        emptyMileRate: d.emptyMileRate,
                        emptyMileRateTeam: d.emptyMileRateTeam,
                        hourlyRate: d.hourlyRate,
                        weightRate: d.weightRate,
                        percentageRate: d.percentageRate,
                        salaryPerMile: d.salaryPerMile,
                        salaryPerMileSnow: d.salaryPerMileSnow,
                        salaryPerMileHighTemp: d.salaryPerMileHighTemp,
                        highTempThreshold: d.highTempThreshold,
                        // Tax fields
                        localTaxNo: d.localTaxNo,
                        federalTaxNo: d.federalTaxNo,
                        sinNo: d.sinNo,
                        craAccountNo: d.craAccountNo,
                        fedTaxExempt: d.fedTaxExempt,
                        provTaxExempt: d.provTaxExempt,
                        cppQppExempt: d.cppQppExempt,
                        eiExempt: d.eiExempt,
                        qpipExempt: d.qpipExempt,
                        // Payroll fields
                        payPeriod: d.payPeriod,
                        vacationPay: d.vacationPay,
                        ltl: d.ltl,
                        onSettlements: d.onSettlements,
                        settlementCurrencyByOrder: d.settlementCurrencyByOrder,
                        isDefault: d.isDefault,
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
            case 'active': return 'text-[var(--accent-green)] bg-[var(--accent-green)]/10 border-theme';
            case 'inactive': return 'text-primary text-accent divide-theme';
            default: return 'text-primary text-accent divide-theme';
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
            className={`px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-accent transition-colors duration-150 ${className}`}
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center space-x-1">
                <span>{children}</span>
                {sortBy === field && (
                    <span className="text-accent text-sm font-bold">
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

    // Sync scroll between top and bottom scrollbars
    useEffect(() => {
        const topScroll = topScrollRef.current;
        const bottomScroll = bottomScrollRef.current;

        if (!topScroll || !bottomScroll) return;

        let isScrolling = false;

        const handleTopScroll = () => {
            if (isScrolling) return;
            isScrolling = true;
            bottomScroll.scrollLeft = topScroll.scrollLeft;
            requestAnimationFrame(() => {
                isScrolling = false;
            });
        };

        const handleBottomScroll = () => {
            if (isScrolling) return;
            isScrolling = true;
            topScroll.scrollLeft = bottomScroll.scrollLeft;
            requestAnimationFrame(() => {
                isScrolling = false;
            });
        };

        // Sync scroll widths
        const syncScrollWidths = () => {
            const bottomScrollWidth = bottomScroll.scrollWidth;
            const topInner = topScroll.querySelector('.top-scroll-content') as HTMLElement;
            if (topInner && bottomScrollWidth > 0) {
                topInner.style.width = `${bottomScrollWidth}px`;
                topScroll.scrollLeft = bottomScroll.scrollLeft;
            }
        };

        // Initial sync - wait for table to render
        const timeoutId = setTimeout(syncScrollWidths, 100);
        const timeoutId2 = setTimeout(syncScrollWidths, 300);
        const timeoutId3 = setTimeout(syncScrollWidths, 500);

        // Observe table changes
        const tableObserver = new MutationObserver(() => {
            syncScrollWidths();
        });

        const bottomTable = bottomScroll.querySelector('table');
        if (bottomTable) {
            tableObserver.observe(bottomTable, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }

        topScroll.addEventListener('scroll', handleTopScroll, { passive: true });
        bottomScroll.addEventListener('scroll', handleBottomScroll, { passive: true });
        window.addEventListener('resize', syncScrollWidths);

        return () => {
            clearTimeout(timeoutId);
            clearTimeout(timeoutId2);
            clearTimeout(timeoutId3);
            tableObserver.disconnect();
            topScroll.removeEventListener('scroll', handleTopScroll);
            bottomScroll.removeEventListener('scroll', handleBottomScroll);
            window.removeEventListener('resize', syncScrollWidths);
        };
    }, [currentDrivers, drivers, searchTerm, filterStatus]);

    if (loading) {
        return (
            <div className="min-h-screen p-4 text-accent px-6 flex items-center justify-center">
                <div className="text-secondary">Loading drivers...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 bg-main px-6">
            <div className="w-full mx-auto p-2">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-primary mb-2">Driver Fleet</h1>
                            <p className="text-secondary">Manage and monitor your driver fleet</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">

                    {/* Total Drivers */}
                    <div className="rounded-xl p-4 bg-card border border-theme">
                        <div className="text-2xl font-bold text-primary mb-1">
                            {stats.total}
                        </div>
                        <div className="text-sm font-medium text-secondary">
                            Total Drivers
                        </div>
                    </div>

                    {/* Active */}
                    <div className="rounded-xl p-4 bg-[var(--accent-green)]/10 border border-theme">
                        <div className="text-2xl font-bold text-[var(--accent-green)] mb-1">
                            {stats.active}
                        </div>
                        <div className="text-sm font-medium text-[var(--accent-green)]">
                            Active
                        </div>
                        <div className="w-full bg-[var(--accent-green)]/10 rounded-full h-1 mt-2">
                            <div
                                className="bg-[var(--accent-green)] h-1 rounded-full"
                                style={{
                                    width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Inactive */}
                    <div className="rounded-xl p-4 bg-card border border-theme">
                        <div className="text-2xl font-bold text-secondary mb-1">
                            {stats.inactive}
                        </div>
                        <div className="text-sm font-medium text-secondary">
                            Inactive
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                            <div
                                className="bg-secondary h-1 rounded-full"
                                style={{
                                    width: `${stats.total > 0 ? (stats.inactive / stats.total) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* With Vehicle */}
                    <div className="rounded-xl p-4 bg-[var(--accent-purple)]/10 border border-theme">
                        <div className="text-2xl font-bold text-[var(--accent-purple)] mb-1">
                            {stats.withVehicle}
                        </div>
                        <div className="text-sm font-medium text-[var(--accent-purple)]">
                            With Vehicle
                        </div>
                        <div className="w-full bg-[var(--accent-purple)]/10 rounded-full h-1 mt-2">
                            <div
                                className="bg-[var(--accent-purple)] h-1 rounded-full"
                                style={{
                                    width: `${stats.total > 0 ? (stats.withVehicle / stats.total) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Unassigned */}
                    <div className="rounded-xl p-4 bg-[var(--accent-orange)]/10 border border-theme">
                        <div className="text-2xl font-bold text-[var(--accent-orange)] mb-1">
                            {stats.withoutVehicle}
                        </div>
                        <div className="text-sm font-medium text-[var(--accent-orange)]">
                            Unassigned
                        </div>
                        <div className="w-full bg-[var(--accent-orange)]/10 rounded-full h-1 mt-2">
                            <div
                                className="bg-[var(--accent-orange)] h-1 rounded-full"
                                style={{
                                    width: `${stats.total > 0 ? (stats.withoutVehicle / stats.total) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                </div>


                {/* Filters and Search */}
                <div className="text-accent rounded-xl shadow-sm border divide-theme mb-6 overflow-hidden">
                    <div className="p-6 border-b divide-theme">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, phone, ID, or location..."
                                        className="w-full pl-10 pr-4 py-3 border divide-theme rounded-lg focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-[var(--accent-blue)] transition-colors duration-150"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
                                    <select
                                        className="pl-10 pr-8 py-3 border divide-theme rounded-lg focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-[var(--accent-blue)] appearance-none text-accent min-w-40 transition-colors duration-150"
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

                        <div className="mt-4 flex justify-between items-center text-sm text-secondary">
                            <span>Showing {indexOfFirstDriver + 1}-{Math.min(indexOfLastDriver, sortedDrivers.length)} of {sortedDrivers.length} drivers</span>
                            <div className="flex items-center space-x-2">
                                <span>Show:</span>
                                <select className="border divide-theme rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-[var(--accent-blue)]">
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                                <span>per page</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {/* Top Scrollbar - Only visible horizontal scrollbar */}
                    <style>{`
                        .top-scrollbar-container::-webkit-scrollbar {
                            height: 8px;
                        }
                        .top-scrollbar-container::-webkit-scrollbar-track {
                            background: rgba(255,255,255,0.05);
                        }
                        .top-scrollbar-container::-webkit-scrollbar-thumb {
                            background: rgba(255,255,255,0.2);
                            border-radius: 4px;
                        }
                        .top-scrollbar-container::-webkit-scrollbar-thumb:hover {
                            background: rgba(255,255,255,0.3);
                        }
                        .table-container-hidden-scrollbar {
                            scrollbar-width: none; /* Firefox */
                            -ms-overflow-style: none; /* IE and Edge */
                        }
                        .table-container-hidden-scrollbar::-webkit-scrollbar {
                            display: none; /* Chrome, Safari, Opera */
                        }
                    `}</style>
                    <div
                        ref={topScrollRef}
                        className="overflow-x-auto overflow-y-hidden top-scrollbar-container"
                        style={{
                            maxHeight: '20px',
                            marginBottom: '2px',
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#cbd5e0 #f7fafc' /* Firefox */
                        }}
                    >
                        <div className="top-scroll-content" style={{ height: '1px' }}></div>
                    </div>
                    {/* Main Table - Scrollbar hidden, controlled by top scrollbar */}
                    <div
                        ref={bottomScrollRef}
                        className="overflow-x-auto overflow-y-visible table-container-hidden-scrollbar"
                    >
                        <table className="min-w-full divide-y divide-slate-200" style={{ minWidth: '1200px' }}>
                            <thead className="text-accent">
                                <tr>
                                    <SortHeader field="internalId">Driver ID</SortHeader>
                                    <SortHeader field="name">Name</SortHeader>
                                    <SortHeader field="email">Contact</SortHeader>
                                    <SortHeader field="location">Location</SortHeader>
                                    <SortHeader field="milesToday">Miles Today</SortHeader>
                                    <SortHeader field="avgSpeed">Avg Speed</SortHeader>
                                    <SortHeader field="status">Status</SortHeader>
                                    <SortHeader field="joinDate">Join Date</SortHeader>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-accent divide-y divide-slate-100">
                                {currentDrivers.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <User className="w-12 h-12 text-secondary mb-4" />
                                                <p className="text-secondary font-medium">No drivers found</p>
                                                <p className="text-secondary text-sm mt-1">
                                                    {searchTerm || filterStatus !== 'all'
                                                        ? 'Try adjusting your search or filter criteria'
                                                        : 'No drivers are available for your company'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentDrivers.map((driver) => (
                                        <tr
                                            key={driver._id}
                                            className="hover:text-accent transition-colors duration-150 cursor-pointer"
                                            onClick={() => {
                                                setSelectedDriver(driver);
                                                setShowDetailsSidebar(true);
                                            }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="p-2 text-accent rounded-lg mr-3 border border-blue-100">
                                                        <User className="w-5 h-5 text-accent" />
                                                    </div>
                                                    <div className="text-sm font-semibold text-primary">
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
                                                            className="w-10 h-10 rounded-full mr-3 object-cover border divide-theme"
                                                            onError={(e) => {
                                                                // Handle broken image URLs
                                                                e.currentTarget.style.display = 'none';
                                                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className={`w-10 h-10 rounded-full mr-3 bg-[var(--accent-blue)]/10 flex items-center justify-center border border-theme ${driver.avatar || driver.profileImageUrl ? 'hidden' : ''}`}
                                                    >
                                                        <User className="w-5 h-5 text-accent" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-primary">
                                                            {driver.name}
                                                        </div>
                                                        {driver.details?.employeeCode && (
                                                            <div className="text-xs text-secondary">
                                                                Code: {driver.details.employeeCode}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="text-sm text-primary">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Mail className="w-4 h-4 text-secondary" />
                                                        <span>{driver.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Phone className="w-4 h-4 text-secondary" />
                                                        <span>{driver.phone}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-start space-x-2">
                                                    <MapPin className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                                                    <div className="text-sm text-primary max-w-xs">
                                                        {driver.location?.address || 'Location not available'}
                                                    </div>
                                                </div>
                                                {(driver.details?.vehicle || driver.vehicle) && (
                                                    <div className="flex items-center space-x-1 mt-2 ml-6">
                                                        <Truck className="w-3 h-3 text-accent" />
                                                        <span className="text-xs text-accent font-medium">
                                                            {(driver.vehicle || driver.details?.vehicle)?.plateNumber || 'N/A'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-semibold text-primary">
                                                    {driver.milesToday !== undefined
                                                        ? `${driver.milesToday.toLocaleString()} mi`
                                                        : '—'}
                                                </p>
                                                <p className="text-xs text-secondary">Today</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-semibold text-primary">
                                                    {driver.avgSpeed !== undefined ? `${driver.avgSpeed} mph` : '—'}
                                                </p>
                                                <p className="text-xs text-secondary">Avg speed</p>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(driver.status)}`}>
                                                    {getStatusIcon(driver.status)}
                                                    <span className="capitalize">{driver.status}</span>
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4 text-secondary" />
                                                    <span className="text-sm text-primary">
                                                        {new Date(driver.joinDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleViewDetails(driver)}
                                                    className="inline-flex items-center space-x-1 text-accent hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-150 text-sm font-medium"
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
                        <div className="text-accent px-6 py-4 border-t divide-theme flex items-center justify-between">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-primary text-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-primary text-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-primary font-medium">
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
                                            className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-slate-300 text-accent text-sm font-medium text-secondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
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
                                                        ? 'z-10 text-accent border-blue-500 text-accent'
                                                        : 'text-accent border-slate-300 text-secondary hover:text-accent'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}

                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-slate-300 text-accent text-sm font-medium text-secondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] overflow-hidden">
                        <div className="absolute inset-0" onClick={() => setShowDetails(false)} />
                        <div className="absolute inset-y-0 right-0 max-w-2xl w-full text-accent shadow-xl">
                            <div className="flex h-full flex-col">
                                {/* Header */}
                                <div className="text-accent px-6 py-4 border-b divide-theme">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {selectedDriver.avatar || selectedDriver.profileImageUrl ? (
                                                <img
                                                    src={selectedDriver.avatar || selectedDriver.profileImageUrl}
                                                    alt={selectedDriver.name}
                                                    className="w-12 h-12 rounded-lg object-cover border divide-theme"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className={`w-12 h-12 rounded-lg bg-[var(--accent-blue)]/10 flex items-center justify-center border border-theme ${selectedDriver.avatar || selectedDriver.profileImageUrl ? 'hidden' : ''}`}
                                            >
                                                <User className="w-6 h-6 text-accent" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-primary">
                                                    {selectedDriver.name}
                                                </h2>
                                                <p className="text-sm text-secondary">{selectedDriver.internalId}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowDetails(false)}
                                            className="p-2 hover:border-theme rounded-lg transition-colors duration-150"
                                        >
                                            <X className="w-5 h-5 text-secondary" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-6 space-y-6">
                                        {/* Basic Information */}
                                        <div className="text-accent border divide-theme rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                                                <User className="w-5 h-5 mr-2 text-accent" />
                                                Driver Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-secondary">Name</label>
                                                    <p className="text-sm text-primary font-medium">{selectedDriver.name}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-secondary">Internal ID</label>
                                                    <p className="text-sm text-primary font-medium">{selectedDriver.internalId}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-secondary">Email</label>
                                                    <p className="text-sm text-primary font-medium">{selectedDriver.email}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-secondary">Phone</label>
                                                    <p className="text-sm text-primary font-medium">{selectedDriver.phone}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-secondary">Employee Code</label>
                                                    <p className="text-sm text-primary font-medium">{selectedDriver.details?.employeeCode || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-secondary">License Number</label>
                                                    <p className="text-sm text-primary font-medium">{selectedDriver.details?.licenceNumber || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-secondary">Country</label>
                                                    <p className="text-sm text-primary font-medium">{selectedDriver.country || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-secondary">Join Date</label>
                                                    <p className="text-sm text-primary font-medium">{new Date(selectedDriver.joinDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="text-accent border divide-theme rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
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
                                        <div className="text-accent border divide-theme rounded-lg p-6">
                                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                                                <MapPin className="w-5 h-5 mr-2 text-[#A855F7]" />
                                                Current Location
                                            </h3>
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="text-sm font-medium text-secondary">Address</label>
                                                    <p className="text-sm text-primary">{selectedDriver.location?.address || 'Location not available'}</p>
                                                </div>
                                                {selectedDriver.location?.latitude && selectedDriver.location?.longitude && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-sm font-medium text-secondary">Latitude</label>
                                                            <p className="text-sm text-primary font-mono">{selectedDriver.location.latitude}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-secondary">Longitude</label>
                                                            <p className="text-sm text-primary font-mono">{selectedDriver.location.longitude}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Vehicle Information */}
                                        {(selectedDriver.details?.vehicle || selectedDriver.vehicle) ? (
                                            <div className="text-accent border divide-theme rounded-lg p-6">
                                                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                                                    <Truck className="w-5 h-5 mr-2 text-[#F59E0B]" />
                                                    Assigned Vehicle
                                                </h3>
                                                {(() => {
                                                    const vehicle = selectedDriver.vehicle || selectedDriver.details?.vehicle;
                                                    return (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-sm font-medium text-secondary">Plate Number</label>
                                                                <p className="text-sm text-primary font-medium">{vehicle?.plateNumber || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium text-secondary">Vehicle ID</label>
                                                                <p className="text-sm text-primary font-medium">{vehicle?.internalId || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium text-secondary">Make & Model</label>
                                                                <p className="text-sm text-primary font-medium">{vehicle?.make || ''} {vehicle?.model || ''}</p>
                                                            </div>
                                                            {vehicle?.year && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-secondary">Year</label>
                                                                    <p className="text-sm text-primary font-medium">{vehicle.year}</p>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <label className="text-sm font-medium text-secondary">Vehicle Status</label>
                                                                <p className="text-sm text-primary font-medium capitalize">{vehicle?.status || 'N/A'}</p>
                                                            </div>
                                                            {vehicle?.type && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-secondary">Type</label>
                                                                    <p className="text-sm text-primary font-medium">{vehicle.type}</p>
                                                                </div>
                                                            )}
                                                            {vehicle?.ownership && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-secondary">Ownership</label>
                                                                    <p className="text-sm text-primary font-medium">{vehicle.ownership}</p>
                                                                </div>
                                                            )}
                                                            {vehicle?.currentLocation?.address && (
                                                                <div className="md:col-span-2">
                                                                    <label className="text-sm font-medium text-secondary">Vehicle Location</label>
                                                                    <p className="text-sm text-primary">{vehicle.currentLocation.address}</p>
                                                                </div>
                                                            )}
                                                            {vehicle?.speed !== undefined && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-secondary">Speed</label>
                                                                    <p className="text-sm text-primary font-medium">{vehicle.speed} km/h</p>
                                                                </div>
                                                            )}
                                                            {vehicle?.fuelLevel !== undefined && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-secondary">Fuel Level</label>
                                                                    <p className="text-sm text-primary font-medium">{vehicle.fuelLevel}%</p>
                                                                </div>
                                                            )}
                                                            {vehicle?.odometer !== undefined && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-secondary">Odometer</label>
                                                                    <p className="text-sm text-primary font-medium">{vehicle.odometer.toLocaleString()} km</p>
                                                                </div>
                                                            )}
                                                            {vehicle?.engineOn !== undefined && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-secondary">Engine Status</label>
                                                                    <p className="text-sm text-primary font-medium">{vehicle.engineOn ? 'On' : 'Off'}</p>
                                                                </div>
                                                            )}
                                                            {vehicle?.trackingKey && (
                                                                <div className="md:col-span-2">
                                                                    <label className="text-sm font-medium text-secondary">Tracking Key</label>
                                                                    <p className="text-sm text-primary font-mono">{vehicle.trackingKey}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="text-accent border divide-theme rounded-lg p-6">
                                                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                                                    <Truck className="w-5 h-5 mr-2 text-[#F59E0B]" />
                                                    Assigned Vehicle
                                                </h3>
                                                <div className="text-sm text-secondary italic">No vehicle assigned</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Driver Details Sidebar */}
                {showDetailsSidebar && selectedDriver && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                            onClick={() => {
                                setShowDetailsSidebar(false);
                                setTimeout(() => setSelectedDriver(null), 300);
                            }}
                        ></div>

                        {/* Sidebar Panel */}
                        <div
                            className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 text-accent shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 translate-x-0"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-theme">
                                    <h2 className="text-2xl font-bold text-primary">Driver Details</h2>
                                    <button
                                        onClick={() => {
                                            setShowDetailsSidebar(false);
                                            setTimeout(() => setSelectedDriver(null), 300);
                                        }}
                                        className="p-2 rounded-lg text-secondary hover:text-secondary hover:bg-[rgba(255,255,255,0.03)] transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Driver Header */}
                                    <div className="bg-gradient-to-r from-[rgba(0,209,255,0.3)] to-[rgba(168,85,247,0.3)] text-white p-6 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="h-20 w-20 flex-shrink-0">
                                                {selectedDriver.avatar || selectedDriver.profileImageUrl ? (
                                                    <img
                                                        className="h-20 w-20 rounded-full object-cover border-4 border-white"
                                                        src={selectedDriver.avatar || selectedDriver.profileImageUrl}
                                                        alt={selectedDriver.name}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                            if (fallback) fallback.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className={`h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 ${selectedDriver.avatar || selectedDriver.profileImageUrl ? 'hidden' : ''}`}
                                                >
                                                    {selectedDriver.name?.charAt(0) || '?'}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold mb-1">{selectedDriver.name}</h3>
                                                <p className="text-blue-100 text-sm flex items-center gap-2">
                                                    <User size={16} />
                                                    Driver ID: <span className="font-semibold">{selectedDriver.internalId}</span>
                                                </p>
                                                <span
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mt-2 ${selectedDriver.status === "active"
                                                        ? "bg-emerald-500 text-white"
                                                        : "bg-red-500 text-white"
                                                        }`}
                                                >
                                                    {selectedDriver.status === "active" ? (
                                                        <>
                                                            <CheckCircle size={16} />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle size={16} />
                                                            Inactive
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal Information */}
                                    <div className="text-accent p-6 rounded-lg border border-theme">
                                        <h4 className="font-semibold text-primary mb-4 text-lg flex items-center gap-2">
                                            <User size={20} className="text-accent" />
                                            Personal Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-secondary mb-1">Full Name</p>
                                                <p className="font-medium text-primary">{selectedDriver.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-secondary mb-1">Email</p>
                                                <p className="font-medium text-primary">{selectedDriver.email || "—"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-secondary mb-1">Phone</p>
                                                <p className="font-medium text-primary">{selectedDriver.phone || "—"}</p>
                                            </div>
                                            {selectedDriver.country && (
                                                <div>
                                                    <p className="text-sm text-secondary mb-1">Country</p>
                                                    <p className="font-medium text-primary">{selectedDriver.country}</p>
                                                </div>
                                            )}
                                            {selectedDriver.details?.employeeCode && (
                                                <div>
                                                    <p className="text-sm text-secondary mb-1">Employee Code</p>
                                                    <p className="font-medium text-primary">{selectedDriver.details.employeeCode}</p>
                                                </div>
                                            )}
                                            {selectedDriver.details?.licenceNumber && (
                                                <div>
                                                    <p className="text-sm text-secondary mb-1">License Number</p>
                                                    <p className="font-medium text-primary">{selectedDriver.details.licenceNumber}</p>
                                                </div>
                                            )}
                                            {selectedDriver.joinDate && (
                                                <div>
                                                    <p className="text-sm text-secondary mb-1">Join Date</p>
                                                    <p className="font-medium text-primary">
                                                        {new Date(selectedDriver.joinDate).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Location Information */}
                                    {selectedDriver.location?.address && (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-theme">
                                            <h4 className="font-semibold text-primary mb-4 text-lg flex items-center gap-2">
                                                <MapPin size={20} className="text-accent" />
                                                Location
                                            </h4>
                                            <div>
                                                <p className="text-sm text-secondary mb-1">Current Address</p>
                                                <p className="font-medium text-primary">{selectedDriver.location.address}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Vehicle Information */}
                                    {(selectedDriver.details?.vehicle || selectedDriver.vehicle) && (
                                        <div className="text-accent p-6 rounded-lg border border-theme">
                                            <h4 className="font-semibold text-primary mb-4 text-lg flex items-center gap-2">
                                                <Truck size={20} className="text-accent" />
                                                Assigned Vehicle
                                            </h4>
                                            {(() => {
                                                const vehicle = selectedDriver.vehicle || selectedDriver.details?.vehicle;
                                                return (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-secondary mb-1">Plate Number</p>
                                                            <p className="font-medium text-primary">{vehicle?.plateNumber || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-secondary mb-1">Vehicle ID</p>
                                                            <p className="font-medium text-primary">{vehicle?.internalId || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-secondary mb-1">Make / Model</p>
                                                            <p className="font-medium text-primary">{vehicle?.make || ''} {vehicle?.model || ''}</p>
                                                        </div>
                                                        {vehicle?.year && (
                                                            <div>
                                                                <p className="text-sm text-secondary mb-1">Year</p>
                                                                <p className="font-medium text-primary">{vehicle.year}</p>
                                                            </div>
                                                        )}
                                                        {vehicle?.type && (
                                                            <div>
                                                                <p className="text-sm text-secondary mb-1">Type</p>
                                                                <p className="font-medium text-primary">{vehicle.type}</p>
                                                            </div>
                                                        )}
                                                        {vehicle?.ownership && (
                                                            <div>
                                                                <p className="text-sm text-secondary mb-1">Ownership</p>
                                                                <p className="font-medium text-primary">{vehicle.ownership}</p>
                                                            </div>
                                                        )}
                                                        {vehicle?.currentLocation?.address && (
                                                            <div className="md:col-span-2">
                                                                <p className="text-sm text-secondary mb-1">Vehicle Location</p>
                                                                <p className="font-medium text-primary">{vehicle.currentLocation.address}</p>
                                                            </div>
                                                        )}
                                                        {vehicle?.speed !== undefined && (
                                                            <div>
                                                                <p className="text-sm text-secondary mb-1">Speed</p>
                                                                <p className="font-medium text-primary">{vehicle.speed} km/h</p>
                                                            </div>
                                                        )}
                                                        {vehicle?.fuelLevel !== undefined && (
                                                            <div>
                                                                <p className="text-sm text-secondary mb-1">Fuel Level</p>
                                                                <p className="font-medium text-primary">{vehicle.fuelLevel}%</p>
                                                            </div>
                                                        )}
                                                        {vehicle?.odometer !== undefined && (
                                                            <div>
                                                                <p className="text-sm text-secondary mb-1">Odometer</p>
                                                                <p className="font-medium text-primary">{vehicle.odometer.toLocaleString()} km</p>
                                                            </div>
                                                        )}
                                                        {vehicle?.engineOn !== undefined && (
                                                            <div>
                                                                <p className="text-sm text-secondary mb-1">Engine Status</p>
                                                                <p className="font-medium text-primary">{vehicle.engineOn ? 'On' : 'Off'}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {/* Performance Metrics */}
                                    {(selectedDriver.milesToday !== undefined || selectedDriver.avgSpeed !== undefined) && (
                                        <div className="text-accent p-6 rounded-lg border border-theme">
                                            <h4 className="font-semibold text-primary mb-4 text-lg flex items-center gap-2">
                                                <Activity size={20} className="text-accent" />
                                                Performance Metrics
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedDriver.milesToday !== undefined && (
                                                    <div>
                                                        <p className="text-sm text-secondary mb-1">Miles Today</p>
                                                        <p className="font-medium text-primary">{selectedDriver.milesToday.toLocaleString()} mi</p>
                                                    </div>
                                                )}
                                                {selectedDriver.avgSpeed !== undefined && (
                                                    <div>
                                                        <p className="text-sm text-secondary mb-1">Average Speed</p>
                                                        <p className="font-medium text-primary">{selectedDriver.avgSpeed} mph</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-4 border-t-2 border-theme">
                                        <button
                                            onClick={() => {
                                                setShowDetailsSidebar(false);
                                                setTimeout(() => setSelectedDriver(null), 300);
                                            }}
                                            className="px-6 py-2.5 bg-card border border-theme hover:bg-[rgba(255,255,255,0.05)] text-primary font-medium rounded-lg transition-all"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DriverList;
