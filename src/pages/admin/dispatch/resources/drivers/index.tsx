import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, User } from 'lucide-react';
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
    const [filterType, setFilterType] = useState<'total' | 'assigned' | 'unassigned'>('total');
    // Counts from backend
    const [counts, setCounts] = useState({ total: 0, assigned: 0, unassigned: 0 });

    const [driverMiles, setDriverMiles] = useState<Record<string, DriverMilesInsight>>({});
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [previewDriverId, setPreviewDriverId] = useState<string | null>(null);
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

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers, location.pathname]);

    useEffect(() => {
        fetchMilesInsights();
    }, [fetchMilesInsights]);

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

    // Calculate open miles total
    const totalOpenMiles = useMemo(() => {
        return Object.values(driverMiles).reduce((acc, curr) => acc + (curr.openMiles || 0), 0);
    }, [driverMiles]);


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

    const getCompanyDisplay = (company?: string | { companyName?: string; _id?: string }) => {
        if (!company) return '-';
        if (typeof company === 'string') return company; // likely an ID if backend sends ID
        // If backend sends object, try to use name, or fallback to ID, or '-'
        return company.companyName || company._id || '-';
    };

    if (loading && drivers.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
        );
    }

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


                <section className="px-4 pt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                    {/* Total Drivers – Pastel Orange */}
                    <div
                        onClick={() => setFilterType('total')}
                        className={`rounded-lg p-3 shadow-sm cursor-pointer transition-all ${filterType === 'total'
                                ? 'bg-orange-100 ring-2 ring-orange-400'
                                : 'bg-orange-50 hover:bg-orange-100'
                            }`}
                    >
                        <p className="text-[10px] uppercase tracking-wide text-orange-600">
                            Total Drivers
                        </p>
                        <p className="text-xl font-semibold mt-0.5 text-orange-700">
                            {counts.total}
                        </p>
                        <p className="text-[11px] mt-0.5 text-orange-500">
                            Across dispatch + maintenance
                        </p>
                    </div>

                    {/* Assigned – Pastel Green */}
                    <div
                        onClick={() => setFilterType('assigned')}
                        className={`rounded-lg p-3 shadow-sm cursor-pointer transition-all ${filterType === 'assigned'
                                ? 'bg-green-100 ring-2 ring-green-400'
                                : 'bg-green-50 hover:bg-green-100'
                            }`}
                    >
                        <p className="text-[10px] uppercase tracking-wide text-green-600">
                            Assigned
                        </p>
                        <p className="text-xl font-semibold mt-0.5 text-green-700">
                            {counts.assigned}
                        </p>
                        <p className="text-[11px] mt-0.5 text-green-500">
                            Currently tied to an active load
                        </p>
                    </div>

                    {/* Unassigned – Pastel Purple */}
                    <div
                        onClick={() => setFilterType('unassigned')}
                        className={`rounded-lg p-3 shadow-sm cursor-pointer transition-all ${filterType === 'unassigned'
                                ? 'bg-purple-100 ring-2 ring-purple-400'
                                : 'bg-purple-50 hover:bg-purple-100'
                            }`}
                    >
                        <p className="text-[10px] uppercase tracking-wide text-purple-600">
                            Unassigned
                        </p>
                        <p className="text-xl font-semibold mt-0.5 text-purple-700">
                            {counts.unassigned}
                        </p>
                        <p className="text-[11px] mt-0.5 text-purple-500">
                            Drivers available for dispatch
                        </p>
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
                        <div className="overflow-x-auto">
                            <table className="w-full">
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
                                            <tr key={driver._id} className="hover:bg-gray-50 transition-colors">
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
            </div>
        </div>
    );
};

const normalizeAddress = (value: string) => value?.replace(/\s+/g, ' ').trim() || '';

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
