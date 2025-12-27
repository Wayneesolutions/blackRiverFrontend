import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Search, User, X, CheckCircle, AlertCircle, MapPin, Briefcase } from 'lucide-react';
import { listDriver, listOrder } from '../../../../../axios/api/distapcher';


interface Driver {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    internalId?: string;
    vendor?: string;
    vehicle?: string;
    licenceNumber?: string;
    createdAt?: string;
    joinDate?: string;
    status?: string;
    role?: string;
    country?: string;
    // Handle company as string or object to avoid render errors
    company?: string | { companyName?: string; _id?: string };
    activeTrip?: {
        _id: string;
        tripNumber: string;
        status: string;
        route: string;
        ordersCount: number;
        plannedStartDate: string;
        truck?: string;
        trailer?: string;
    } | null;
}

interface DriverMilesInsight {
    totalMiles: number;
    openMiles: number;
    totalOrders: number;
    openOrders: number;
}

const DriversTable = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    // Filter state: 'total' | 'assigned' | 'unassigned'
    // Initialize from URL parameter if present (using location.search to avoid initialization order issue)
    const getInitialFilterType = (): 'total' | 'assigned' | 'unassigned' => {
        const params = new URLSearchParams(window.location.search);
        const filterParam = params.get('filter');
        if (filterParam === 'unassigned' || filterParam === 'assigned') {
            return filterParam;
        }
        return 'total';
    };
    const [filterType, setFilterType] = useState<'total' | 'assigned' | 'unassigned'>(getInitialFilterType());
    // Counts from backend
    const [counts, setCounts] = useState({ total: 0, assigned: 0, unassigned: 0 });

    const [driverMiles, setDriverMiles] = useState<Record<string, DriverMilesInsight>>({});
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [previewDriverId, setPreviewDriverId] = useState<string | null>(null);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [showDriverDetails, setShowDriverDetails] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(() => {
        try {
            const stored = localStorage.getItem('userInfo');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error parsing userInfo from localStorage:', error);
            return null;
        }
    });
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Refs for scrollbar synchronization
    const topScrollRef = useRef<HTMLDivElement>(null);
    const bottomScrollRef = useRef<HTMLDivElement>(null);

    const sanitizeMessage = useCallback((message?: string | null) => {
        if (!message) return null;
        return message.toLowerCase().includes('no company assigned') ? null : message;
    }, []);

    const fetchDrivers = useCallback(async () => {
        setLoading(true);
        try {
            if (!userInfo) {
                setDrivers([]);
                setEmptyStateMessage(null);
                return;
            }

            // Handle different userInfo structures (userData.company or direct company)
            const userRole = userInfo?.role || userInfo?.userData?.role;
            const userCompany = userInfo?.company || userInfo?.userData?.company;
            const isSuperadmin = userRole === 'superadmin';
            const isDispatcher = userRole === 'dispatcher';
            const hasCompany = Boolean(userCompany);

            if (!isSuperadmin && !isDispatcher && !hasCompany) {
                setDrivers([]);
                setEmptyStateMessage('No company assigned. Please complete company settings to view drivers.');
                return;
            }

            // Pass assignment filter to backend. 'total' implies no 'assignment' param (fetching all).
            // Increase limit to ensure we get a reasonable list, handling pagination later if needed.
            const res = await listDriver({
                limit: 100,
                assignment: filterType === 'total' ? undefined : filterType
            });

            const message = sanitizeMessage(res?.message || null);

            if (res?.success) {
                const data = Array.isArray(res?.data)
                    ? res.data
                    : Array.isArray(res?.data?.data)
                        ? res.data.data
                        : [];

                setDrivers(data);

                // Update counts from backend response if available, otherwise fallback
                if (res.count !== undefined) {
                    setCounts({
                        total: res.count,
                        assigned: res.assignedDrivers || 0,
                        unassigned: res.unassignedDrivers || 0
                    });
                }

                if (data.length === 0) {
                    setEmptyStateMessage(message || 'No drivers found.');
                } else {
                    setEmptyStateMessage(null);
                }
            } else {
                setDrivers([]);
                setEmptyStateMessage(message || 'Failed to load drivers.');
            }
        } catch (error: any) {
            console.error('Error fetching drivers:', error);
            setDrivers([]);
            setEmptyStateMessage(sanitizeMessage(error?.message) || 'Failed to load drivers.');
        } finally {
            setLoading(false);
        }
    }, [userInfo, sanitizeMessage, filterType]);

    const fetchMilesInsights = useCallback(async () => {
        // Only fetch order miles, active trip info is now in driver object
        setInsightsLoading(true);
        try {
            const orderRes = await listOrder({ page: 1, limit: 500 });

            const orderPayload = Array.isArray(orderRes?.data)
                ? orderRes?.data
                : Array.isArray(orderRes?.data?.data)
                    ? orderRes?.data?.data
                    : [];
            if (orderRes?.success && Array.isArray(orderPayload)) {
                setDriverMiles(summarizeDriverMiles(orderPayload));
            } else {
                setDriverMiles({});
            }
        } catch (error) {
            console.error('Error fetching miles insights:', error);
            setDriverMiles({});
        } finally {
            setInsightsLoading(false);
        }
    }, []);

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === 'userInfo' && event.newValue) {
                try {
                    setUserInfo(JSON.parse(event.newValue));
                } catch (error) {
                    console.error('Error parsing userInfo from storage event:', error);
                }
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Update filter type when URL parameter changes
    useEffect(() => {
        const filterParam = searchParams.get('filter');
        if (filterParam === 'unassigned' || filterParam === 'assigned') {
            setFilterType(filterParam);
        } else if (filterParam === null || filterParam === 'total') {
            setFilterType('total');
        }
    }, [searchParams]);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers, location.pathname]);

    useEffect(() => {
        fetchMilesInsights();
    }, [fetchMilesInsights]);

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
    }, [drivers, searchQuery]);

    const filteredDrivers = useMemo(() => {
        if (!searchQuery.trim()) {
            return drivers;
        }

        const query = searchQuery.toLowerCase();
        return drivers.filter((driver) => {
            const name = driver.name || '';
            const email = driver.email || '';
            const internalId = driver.internalId || '';
            const phone = driver.phone || '';
            const country = driver.country || '';
            return (
                name.toLowerCase().includes(query) ||
                email.toLowerCase().includes(query) ||
                internalId.toLowerCase().includes(query) ||
                phone.toLowerCase().includes(query) ||
                country.toLowerCase().includes(query)
            );
        });
    }, [drivers, searchQuery]);



    const getStatusBadge = (status?: string) => {
        if (!status) return null;

        const statusConfig: Record<string, { bg: string; text: string }> = {
            active: { bg: 'bg-green-100', text: 'text-green-800' },
            inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
            suspended: { bg: 'bg-red-100', text: 'text-red-800' },
        };

        const config = statusConfig[status.toLowerCase()] || statusConfig.active;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };


    if (loading && drivers.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
        );
    }
    const StatRow = ({ label, value, color }) => (
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-sm text-gray-600">{label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{value}</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#EDF8FF]">
            <div className="flex-1">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left side: Title */}
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Drivers
                        </h1>

                        {/* Right side: Search */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search drivers..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>


                <section className="px-4 pt-4 grid grid-cols-1 md:grid-cols-5 gap-4">


                    <div
                        onClick={() => {
                            setFilterType('total');
                            setSearchParams({});
                        }}
                        className={`md:col-span-3 rounded-xl bg-white p-4 cursor-pointer
    transition shadow-sm hover:shadow-md border
    ${filterType === 'total' ? 'border-orange-400' : 'border-gray-200'}
  `}
                    >
                        <div className="md:col-span-2 flex flex-col gap-3">

                            <div>
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                    Total Drivers
                                </p>
                                <p className="text-3xl font-bold text-gray-900 mt-0.5">
                                    {counts.total}
                                </p>
                            </div>

                            <div className="p-1.5 rounded-md bg-orange-50 text-orange-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M17 20h5v-1a4 4 0 00-5-4m-4 5H2v-1a4 4 0 015-4m6-6a4 4 0 11-8 0 4 4 0 018 0" />
                                </svg>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <StatRow label="Assigned" value={counts.assigned} color="bg-green-500" />
                            <StatRow label="Unassigned" value={counts.unassigned} color="bg-purple-500" />
                            <StatRow label="Active" value={counts.active || 0} color="bg-blue-500" />
                        </div>

                        <div className="mt-3 pt-2 border-t text-[11px] text-gray-500">
                            Across dispatch & maintenance
                        </div>
                    </div>



                    <div className="md:col-span-2 flex flex-col gap-4">
                        <div
                            onClick={() => {
                                setFilterType('assigned');
                                setSearchParams({ filter: 'assigned' });
                            }}
                            className={`rounded-xl bg-white p-3 cursor-pointer transition
    shadow-sm hover:shadow-md border-l-4
    ${filterType === 'assigned' ? 'border-green-500' : 'border-transparent'}
  `}
                        >
                            <p className="text-[11px] font-semibold text-gray-500 uppercase">
                                Assigned
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-0.5">
                                {counts.assigned}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                Tied to active loads
                            </p>
                        </div>


                        <div
                            onClick={() => {
                                setFilterType('unassigned');
                                setSearchParams({ filter: 'unassigned' });
                            }}
                            className={`rounded-xl bg-white p-3 cursor-pointer transition
    shadow-sm hover:shadow-md border-l-4
    ${filterType === 'unassigned' ? 'border-purple-500' : 'border-transparent'}
  `}
                        >
                            <p className="text-[11px] font-semibold text-gray-500 uppercase">
                                Unassigned
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-0.5">
                                {counts.unassigned}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                Available for dispatch
                            </p>
                        </div>


                    </div>

                </section>


                {insightsLoading && (
                    <p className="px-6 text-xs text-gray-500">Refreshing insights…</p>
                )}

                {emptyStateMessage && filteredDrivers.length === 0 && (
                    <div className="mx-6 mt-4 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3">
                        <User />
                        <span className="text-sm">{emptyStateMessage}</span>
                    </div>
                )}

                <div className="p-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* Top Scrollbar - Only visible horizontal scrollbar */}
                        <style>{`
                            .top-scrollbar-container::-webkit-scrollbar {
                                height: 8px;
                            }
                            .top-scrollbar-container::-webkit-scrollbar-track {
                                background: #f7fafc;
                            }
                            .top-scrollbar-container::-webkit-scrollbar-thumb {
                                background: #cbd5e0;
                                border-radius: 4px;
                            }
                            .top-scrollbar-container::-webkit-scrollbar-thumb:hover {
                                background: #a0aec0;
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
                            <table className="w-full" style={{ minWidth: '1000px' }}>
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Internal ID
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Country
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Current Assignment
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Route
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Miles / Loads
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Join Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredDrivers.length > 0 ? (
                                        filteredDrivers.map((driver) => (
                                            <tr
                                                key={driver._id}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setSelectedDriver(driver);
                                                    setShowDriverDetails(true);
                                                }}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {driver.name || 'N/A'}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {driver.role ? driver.role.charAt(0).toUpperCase() + driver.role.slice(1) : 'Driver'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {driver.email || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                        {driver.internalId || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {driver.phone || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {driver.country || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    {(() => {
                                                        // Use driver.activeTrip from backend
                                                        const activeTrip = driver.activeTrip;
                                                        return (
                                                            <div
                                                                className="relative flex items-start gap-2"
                                                                onMouseLeave={() => setPreviewDriverId((prev) => (prev === driver._id ? null : prev))}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className={`mt-1 rounded-full border p-2 text-xs font-semibold uppercase ${activeTrip ? 'text-blue-600 border-blue-200' : 'text-gray-400 border-gray-200'
                                                                        }`}
                                                                    title={activeTrip ? 'View assignment details' : 'No active assignment'}
                                                                    onMouseEnter={() => setPreviewDriverId(driver._id)}
                                                                    // onFocus handled by button focus
                                                                    onClick={() =>
                                                                        setPreviewDriverId((prev) => (prev === driver._id ? null : driver._id))
                                                                    }
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={1.5}
                                                                        stroke="currentColor"
                                                                        className="w-4 h-4"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M2.25 12s3-6.75 9.75-6.75S21.75 12 21.75 12s-3 6.75-9.75 6.75S2.25 12 2.25 12z"
                                                                        />
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                                <div className="space-y-1">
                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                        {activeTrip?.route ? truncateText(activeTrip.route, 32) : 'No active load'}
                                                                    </div>
                                                                    {activeTrip ? (
                                                                        <div className="text-xs text-gray-500">
                                                                            {activeTrip.ordersCount} load{activeTrip.ordersCount === 1 ? '' : 's'} · #{activeTrip.tripNumber || 'Trip'} <br />
                                                                            {activeTrip.plannedStartDate ? new Date(activeTrip.plannedStartDate).toLocaleDateString() : 'Date TBC'}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-xs text-gray-400">
                                                                            Ready for assignment · {formatMiles(driverMiles[driver._id]?.openMiles)}
                                                                        </div>
                                                                    )}
                                                                    {(activeTrip?.truck || activeTrip?.trailer) && (
                                                                        <div className="flex flex-wrap gap-1 pt-1">
                                                                            {activeTrip?.truck && (
                                                                                <span
                                                                                    className="text-[11px] px-2 py-0.5 rounded-full border border-blue-100 text-blue-700 font-semibold uppercase"
                                                                                >
                                                                                    {activeTrip.truck}
                                                                                </span>
                                                                            )}
                                                                            {activeTrip?.trailer && (
                                                                                <span
                                                                                    className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-100 text-emerald-700 font-semibold uppercase"
                                                                                >
                                                                                    {activeTrip.trailer}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {previewDriverId === driver._id && (
                                                                    <div className="absolute left-12 top-0 z-20 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                                                                        <p className="text-xs font-semibold text-gray-500">Assignment preview</p>
                                                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                                                            {activeTrip?.route || 'No active assignment'}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            Trip #{activeTrip?.tripNumber || '—'}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {activeTrip?.plannedStartDate
                                                                                ? new Date(activeTrip.plannedStartDate).toLocaleDateString()
                                                                                : 'TBC'}
                                                                        </p>
                                                                        {activeTrip && (
                                                                            <div className="mt-2 space-y-1">
                                                                                {activeTrip.truck && (
                                                                                    <p className="text-xs text-gray-600">
                                                                                        Truck: {activeTrip.truck}
                                                                                    </p>
                                                                                )}
                                                                                {activeTrip.trailer && (
                                                                                    <p className="text-xs text-gray-600">
                                                                                        Trailer: {activeTrip.trailer}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {(() => {
                                                        const activeTrip = driver.activeTrip;
                                                        if (!activeTrip || !activeTrip.route) {
                                                            return <span className="text-xs text-gray-400">No route</span>;
                                                        }
                                                        return (
                                                            <div className="max-w-xs">
                                                                <div className="text-sm font-medium text-gray-900 truncate" title={activeTrip.route}>
                                                                    {activeTrip.route}
                                                                </div>
                                                                {activeTrip.tripNumber && (
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        Trip #{activeTrip.tripNumber}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(() => {
                                                        const milesInsight = driverMiles[driver._id];
                                                        if (!milesInsight) {
                                                            return <span className="text-xs text-gray-400">No mileage captured</span>;
                                                        }
                                                        return (
                                                            <div className="space-y-1">
                                                                <div className="text-sm font-semibold text-gray-900">
                                                                    {formatMiles(milesInsight.totalMiles)}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {milesInsight.openOrders} open load{milesInsight.openOrders === 1 ? '' : 's'} · {formatMiles(milesInsight.openMiles)} pending
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(driver.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {driver.joinDate
                                                        ? new Date(driver.joinDate).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })
                                                        : driver.createdAt
                                                            ? new Date(driver.createdAt).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })
                                                            : 'N/A'
                                                    }
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center space-y-3">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <User className="w-8 h-8 text-gray-300" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-medium text-gray-700">No filtered drivers found</p>
                                                        {emptyStateMessage && (
                                                            <p className="text-sm text-gray-400 mt-1">{emptyStateMessage}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Driver Details Sidebar */}
                {showDriverDetails && selectedDriver && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity"
                            onClick={() => {
                                setShowDriverDetails(false);
                                setTimeout(() => setSelectedDriver(null), 300);
                            }}
                        ></div>

                        {/* Sidebar Panel */}
                        <div
                            className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 translate-x-0"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-900">Driver Details</h2>
                                    <button
                                        onClick={() => {
                                            setShowDriverDetails(false);
                                            setTimeout(() => setSelectedDriver(null), 300);
                                        }}
                                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Driver Header */}
                                    <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] text-white p-6 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="h-20 w-20 flex-shrink-0">
                                                <div className="h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600">
                                                    {selectedDriver.name?.charAt(0) || '?'}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold mb-1">{selectedDriver.name || 'N/A'}</h3>
                                                <p className="text-blue-100 text-sm flex items-center gap-2">
                                                    <User size={16} />
                                                    Driver ID: <span className="font-semibold">{selectedDriver.internalId || 'N/A'}</span>
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
                                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                        <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                                            <User size={20} className="text-blue-600" />
                                            Personal Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                                                <p className="font-medium text-gray-900">{selectedDriver.name || "—"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Email</p>
                                                <p className="font-medium text-gray-900">{selectedDriver.email || "—"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Phone</p>
                                                <p className="font-medium text-gray-900">{selectedDriver.phone || "—"}</p>
                                            </div>
                                            {selectedDriver.country && (
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Country</p>
                                                    <p className="font-medium text-gray-900">{selectedDriver.country}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Professional Information */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                                            <Briefcase size={20} className="text-blue-600" />
                                            Professional Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedDriver.internalId && (
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-1">Internal ID</p>
                                                    <p className="font-medium text-gray-900">{selectedDriver.internalId}</p>
                                                </div>
                                            )}
                                            {selectedDriver.licenceNumber && (
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-1">License Number</p>
                                                    <p className="font-medium text-gray-900">{selectedDriver.licenceNumber}</p>
                                                </div>
                                            )}
                                            {selectedDriver.role && (
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-1">Role</p>
                                                    <p className="font-medium text-gray-900">{selectedDriver.role.charAt(0).toUpperCase() + selectedDriver.role.slice(1)}</p>
                                                </div>
                                            )}
                                            {selectedDriver.joinDate && (
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-1">Join Date</p>
                                                    <p className="font-medium text-gray-900">
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

                                    {/* Current Assignment */}
                                    {selectedDriver.activeTrip && (
                                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
                                                <MapPin size={20} className="text-blue-600" />
                                                Current Assignment
                                            </h4>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Route</p>
                                                    <p className="font-medium text-gray-900">{selectedDriver.activeTrip.route || "—"}</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Trip Number</p>
                                                        <p className="font-medium text-gray-900">#{selectedDriver.activeTrip.tripNumber || "—"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Status</p>
                                                        <p className="font-medium text-gray-900">{selectedDriver.activeTrip.status || "—"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Orders Count</p>
                                                        <p className="font-medium text-gray-900">{selectedDriver.activeTrip.ordersCount || 0}</p>
                                                    </div>
                                                    {selectedDriver.activeTrip.plannedStartDate && (
                                                        <div>
                                                            <p className="text-sm text-gray-500 mb-1">Planned Start Date</p>
                                                            <p className="font-medium text-gray-900">
                                                                {new Date(selectedDriver.activeTrip.plannedStartDate).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                {(selectedDriver.activeTrip.truck || selectedDriver.activeTrip.trailer) && (
                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        {selectedDriver.activeTrip.truck && (
                                                            <span className="text-xs px-3 py-1 rounded-full border border-blue-200 text-blue-700 font-semibold uppercase bg-blue-50">
                                                                Truck: {selectedDriver.activeTrip.truck}
                                                            </span>
                                                        )}
                                                        {selectedDriver.activeTrip.trailer && (
                                                            <span className="text-xs px-3 py-1 rounded-full border border-emerald-200 text-emerald-700 font-semibold uppercase bg-emerald-50">
                                                                Trailer: {selectedDriver.activeTrip.trailer}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Miles / Loads Information */}
                                    {driverMiles[selectedDriver._id] && (
                                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-4 text-lg">Miles & Loads</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Total Miles</p>
                                                    <p className="font-medium text-gray-900">{formatMiles(driverMiles[selectedDriver._id].totalMiles)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Open Miles</p>
                                                    <p className="font-medium text-gray-900">{formatMiles(driverMiles[selectedDriver._id].openMiles)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                                                    <p className="font-medium text-gray-900">{driverMiles[selectedDriver._id].totalOrders}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Open Orders</p>
                                                    <p className="font-medium text-gray-900">{driverMiles[selectedDriver._id].openOrders}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                                        <button
                                            onClick={() => {
                                                setShowDriverDetails(false);
                                                setTimeout(() => setSelectedDriver(null), 300);
                                            }}
                                            className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
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


const truncateText = (value: string, max: number = 40) => {
    if (!value) return "";
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};


const summarizeDriverMiles = (orders: any[]): Record<string, DriverMilesInsight> => {
    const map: Record<string, DriverMilesInsight> = {};
    orders.forEach((order: any) => {
        const driverId = order?.driver?._id || order?.driver;
        if (!driverId) return;
        const distanceValue = order?.distance ?? order?.totalDistance ?? order?.miles;
        const miles = typeof distanceValue === 'number' ? distanceValue : parseFloat(distanceValue) || 0;
        if (!map[driverId]) {
            map[driverId] = {
                totalMiles: 0,
                openMiles: 0,
                totalOrders: 0,
                openOrders: 0
            };
        }
        map[driverId].totalMiles += miles;
        map[driverId].totalOrders += 1;
        if (!order?.status || order.status.toLowerCase() !== 'completed') {
            map[driverId].openMiles += miles;
            map[driverId].openOrders += 1;
        }
    });
    return map;
};

const formatMiles = (value?: number) => {
    if (!value) return '0 mi';
    return `${Math.round(value).toLocaleString()} mi`;
};

export default DriversTable;
