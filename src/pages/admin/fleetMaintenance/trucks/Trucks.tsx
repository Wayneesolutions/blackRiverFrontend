import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Upload, FileText, Filter, Settings, Users, ChevronUp, ChevronDown, Clock } from 'lucide-react';

interface Truck {
    id: string;
    unitNumber: string;
    plateNumber: string;
    ownership: string;
    notes: string;
    operatingStatus: 'IN SERVICE' | 'OUT OF SERVICE' | 'MAINTENANCE';
    dispatchStatus: 'LOADED' | 'DELIVERED' | 'UNASSIGNED' | 'IN TRANSIT' | 'ASSIGNED';
    dispatchInfo: string;
    compliance: 'COMPLIANT' | 'NON-COMPLIANT' | 'EXPIRING SOON';
    category?: 'MB' | 'AB' | 'TX' | 'External' | 'Unassigned';
}

// Static truck data based on the image
const staticTrucks: Truck[] = [
    {
        id: '1',
        unitNumber: '1304',
        plateNumber: 'CRS410',
        ownership: 'OWNER OPERATOR',
        notes: 'Has notes',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'LOADED',
        dispatchInfo: '12/31 TACOMA, WA',
        compliance: 'EXPIRING SOON',
        category: 'MB'
    },
    {
        id: '2',
        unitNumber: '1315',
        plateNumber: 'CRZ813',
        ownership: 'COMPANY ASSET',
        notes: '',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'DELIVERED',
        dispatchInfo: '12/28 TORONTO, ON',
        compliance: 'COMPLIANT',
        category: 'MB'
    },
    {
        id: '3',
        unitNumber: '1319',
        plateNumber: 'CRZ782',
        ownership: 'COMPANY ASSET',
        notes: '',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'UNASSIGNED',
        dispatchInfo: '12/31 N/A',
        compliance: 'COMPLIANT',
        category: 'AB'
    },
    {
        id: '4',
        unitNumber: '1320',
        plateNumber: 'CRZ783',
        ownership: 'OWNER OPERATOR',
        notes: '',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'IN TRANSIT',
        dispatchInfo: '12/30 CHICAGO, IL',
        compliance: 'COMPLIANT',
        category: 'TX'
    },
    {
        id: '5',
        unitNumber: '1321',
        plateNumber: 'CRZ784',
        ownership: 'COMPANY ASSET',
        notes: 'Has notes',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'ASSIGNED',
        dispatchInfo: '12/31 DALLAS, TX',
        compliance: 'EXPIRING SOON',
        category: 'External'
    },
    {
        id: '6',
        unitNumber: '1322',
        plateNumber: 'CRZ785',
        ownership: 'COMPANY ASSET',
        notes: '',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'LOADED',
        dispatchInfo: '12/31 WINNIPEG, MB',
        compliance: 'COMPLIANT',
        category: 'Unassigned'
    }
];

const Trucks: React.FC = () => {
    const { category: routeCategory } = useParams<{ category?: string }>();
    const navigate = useNavigate();
    
    // Initialize activeTab from route params, default to 'All'
    const getInitialTab = (cat?: string): 'All' | 'MB' | 'AB' | 'TX' | 'External' | 'Unassigned' => {
        if (cat && ['MB', 'AB', 'TX', 'External', 'Unassigned'].includes(cat)) {
            return cat as 'All' | 'MB' | 'AB' | 'TX' | 'External' | 'Unassigned';
        }
        return 'All';
    };
    
    const [activeTab, setActiveTab] = useState<'All' | 'MB' | 'AB' | 'TX' | 'External' | 'Unassigned'>(getInitialTab(routeCategory));
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [complianceStatus, setComplianceStatus] = useState('All');
    const [category, setCategory] = useState('In Service Only');

    // Update activeTab when route changes
    useEffect(() => {
        const newTab = getInitialTab(routeCategory);
        setActiveTab(newTab);
    }, [routeCategory]);

    // Column filters
    const [filters, setFilters] = useState({
        unitNumber: '',
        plateNumber: '',
        ownership: 'All',
        notes: '',
        operatingStatus: 'All',
        dispatchStatus: 'All',
        dispatchInfo: '',
        compliance: 'All'
    });

    // Sort configuration
    const [sortConfig, setSortConfig] = useState<{ key: keyof Truck | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc'
    });

    // Get filtered trucks
    const getFilteredTrucks = () => {
        let filtered = [...staticTrucks];

        // Filter by active tab
        if (activeTab !== 'All') {
            filtered = filtered.filter(truck => truck.category === activeTab);
        }

        // Filter by search term (Unit #, Plate #, Make, VIN)
        if (searchTerm) {
            filtered = filtered.filter(truck =>
                truck.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                truck.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by compliance status
        if (complianceStatus !== 'All') {
            filtered = filtered.filter(truck => {
                if (complianceStatus === 'Compliant') return truck.compliance === 'COMPLIANT';
                if (complianceStatus === 'Non-Compliant') return truck.compliance === 'NON-COMPLIANT';
                if (complianceStatus === 'Expiring Soon') return truck.compliance === 'EXPIRING SOON';
                return true;
            });
        }

        // Filter by category
        if (category === 'In Service Only') {
            filtered = filtered.filter(truck => truck.operatingStatus === 'IN SERVICE');
        }

        // Apply column filters
        if (filters.unitNumber) {
            filtered = filtered.filter(t => t.unitNumber.toLowerCase().includes(filters.unitNumber.toLowerCase()));
        }
        if (filters.plateNumber) {
            filtered = filtered.filter(t => t.plateNumber.toLowerCase().includes(filters.plateNumber.toLowerCase()));
        }
        if (filters.ownership !== 'All') {
            filtered = filtered.filter(t => t.ownership === filters.ownership);
        }
        if (filters.notes) {
            filtered = filtered.filter(t => t.notes.toLowerCase().includes(filters.notes.toLowerCase()));
        }
        if (filters.operatingStatus !== 'All') {
            filtered = filtered.filter(t => t.operatingStatus === filters.operatingStatus);
        }
        if (filters.dispatchStatus !== 'All') {
            filtered = filtered.filter(t => t.dispatchStatus === filters.dispatchStatus);
        }
        if (filters.dispatchInfo) {
            filtered = filtered.filter(t => t.dispatchInfo.toLowerCase().includes(filters.dispatchInfo.toLowerCase()));
        }
        if (filters.compliance !== 'All') {
            filtered = filtered.filter(t => t.compliance === filters.compliance);
        }

        // Sort
        if (sortConfig.key) {
            filtered = [...filtered].sort((a, b) => {
                const aValue = a[sortConfig.key!] ?? '';
                const bValue = b[sortConfig.key!] ?? '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    };

    const filteredTrucks = getFilteredTrucks();

    // Count trucks by category
    const getCountByCategory = (category: string) => {
        if (category === 'All') return staticTrucks.length;
        return staticTrucks.filter(t => t.category === category).length;
    };

    const handleSort = (key: keyof Truck) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key: keyof Truck) => {
        if (sortConfig.key !== key) {
            return (
                <div className="flex flex-col">
                    <ChevronUp className="w-3 h-3 text-gray-400" />
                    <ChevronDown className="w-3 h-3 text-gray-400 -mt-1" />
                </div>
            );
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-gray-700" />
        ) : (
            <ChevronDown className="w-3 h-3 text-gray-700" />
        );
    };

    const getStatusBadgeColor = (status: string, type: 'operating' | 'dispatch' | 'compliance') => {
        if (type === 'operating') {
            if (status === 'IN SERVICE') return 'bg-green-500 text-white';
            if (status === 'OUT OF SERVICE') return 'bg-red-500 text-white';
            if (status === 'MAINTENANCE') return 'bg-yellow-500 text-white';
        }
        if (type === 'dispatch') {
            if (status === 'LOADED') return 'bg-green-500 text-white';
            if (status === 'DELIVERED') return 'bg-green-500 text-white';
            if (status === 'UNASSIGNED') return 'bg-gray-500 text-white';
            if (status === 'IN TRANSIT') return 'bg-gray-500 text-white';
            if (status === 'ASSIGNED') return 'bg-orange-500 text-white';
        }
        if (type === 'compliance') {
            if (status === 'COMPLIANT') return 'bg-green-500 text-white';
            if (status === 'NON-COMPLIANT') return 'bg-red-500 text-white';
            if (status === 'EXPIRING SOON') return 'bg-orange-500 text-white';
        }
        return 'bg-gray-500 text-white';
    };

    const formatStatusText = (status: string, type: 'operating' | 'compliance') => {
        if (type === 'operating' && status === 'IN SERVICE') {
            return (
                <span className="block leading-tight">
                    <span className="block">IN</span>
                    <span className="block">SERVICE</span>
                </span>
            );
        }
        if (type === 'compliance' && status === 'EXPIRING SOON') {
            return (
                <span className="block leading-tight">
                    <span className="block">EXPIRING</span>
                    <span className="block">SOON</span>
                </span>
            );
        }
        return status;
    };

    return (
        <div className="min-h-screen bg-[#EDF8FF] p-6">
            <div className="max-w-full mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Trucks</h1>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-700">({filteredTrucks.length})</span>
                            <button className="text-gray-600 hover:text-gray-900 transition-colors">
                                <Upload className="w-6 h-6" />
                            </button>
                            <button
                                className="w-10 h-10 bg-[#42aeec] !text-white rounded-lg flex items-center justify-center hover:bg-[#1db5f5] transition-colors shadow-md"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {(['All', 'MB', 'AB', 'TX', 'External', 'Unassigned'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    const basePath = '/admin/fleetmaintenance/trucks';
                                    if (tab === 'All') {
                                        navigate(basePath);
                                    } else {
                                        navigate(`${basePath}/${tab}`);
                                    }
                                }}
                                className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${activeTab === tab
                                        ? 'text-[#42aeec] border-b-2 border-[#42aeec]'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <div>
                                    <div className="font-semibold">
                                        {tab} ({getCountByCategory(tab)})
                                    </div>
                                    {tab === 'MB' && <div className="text-xs text-gray-500 mt-1">Home to Winnipeg Yard</div>}
                                    {tab === 'AB' && <div className="text-xs text-gray-500 mt-1">Home to Calgary Yard / Ocean, Impact freight services - Acheson</div>}
                                    {tab === 'TX' && <div className="text-xs text-gray-500 mt-1">Home to Laredo Yard - Santos</div>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search Input */}
                        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Unit #, Plate #, Make, VIN:</label>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent bg-white"
                            />
                           
                        </div>

                        {/* Global Filters */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Category:</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent bg-white"
                            >
                                <option value="In Service Only">In Service Only</option>
                                <option value="All">All</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Compliance Status:</label>
                            <select
                                value={complianceStatus}
                                onChange={(e) => setComplianceStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent bg-white"
                            >
                                <option value="All">All</option>
                                <option value="Compliant">Compliant</option>
                                <option value="Non-Compliant">Non-Compliant</option>
                                <option value="Expiring Soon">Expiring Soon</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Sort By:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent bg-white"
                            >
                                <option value="">Select</option>
                                <option value="unitNumber">Unit #</option>
                                <option value="plateNumber">Plate #</option>
                                <option value="dispatchInfo">Dispatch Info</option>
                            </select>
                        </div>

                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {/* Unit # */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Unit #</span>
                                            <button onClick={() => handleSort('unitNumber')} className="flex flex-col">
                                                {getSortIcon('unitNumber')}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.unitNumber}
                                            onChange={(e) => setFilters({ ...filters, unitNumber: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        />
                                    </th>

                                    {/* Plate # */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Plate #</span>
                                            <button onClick={() => handleSort('plateNumber')} className="flex flex-col">
                                                {getSortIcon('plateNumber')}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.plateNumber}
                                            onChange={(e) => setFilters({ ...filters, plateNumber: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        />
                                    </th>

                                    {/* Ownership */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Ownership</span>
                                            <button onClick={() => handleSort('ownership')} className="flex flex-col">
                                                {getSortIcon('ownership')}
                                            </button>
                                        </div>
                                        <select
                                            value={filters.ownership}
                                            onChange={(e) => setFilters({ ...filters, ownership: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="COMPANY ASSET">Company Asset</option>
                                            <option value="OWNER OPERATOR">Owner Operator</option>
                                        </select>
                                    </th>

                                    {/* Notes */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Notes</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.notes}
                                            onChange={(e) => setFilters({ ...filters, notes: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        />
                                    </th>

                                    {/* Operating Status */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Operating Status</span>
                                        </div>
                                        <select
                                            value={filters.operatingStatus}
                                            onChange={(e) => setFilters({ ...filters, operatingStatus: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="IN SERVICE">In Service</option>
                                            <option value="OUT OF SERVICE">Out of Service</option>
                                            <option value="MAINTENANCE">Maintenance</option>
                                        </select>
                                    </th>

                                    {/* Dispatch Status */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Dispatch Status</span>
                                        </div>
                                        <select
                                            value={filters.dispatchStatus}
                                            onChange={(e) => setFilters({ ...filters, dispatchStatus: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="LOADED">Loaded</option>
                                            <option value="DELIVERED">Delivered</option>
                                            <option value="UNASSIGNED">Unassigned</option>
                                            <option value="IN TRANSIT">In Transit</option>
                                            <option value="ASSIGNED">Assigned</option>
                                        </select>
                                    </th>

                                    {/* Dispatch Info */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Dispatch Info</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.dispatchInfo}
                                            onChange={(e) => setFilters({ ...filters, dispatchInfo: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        />
                                    </th>

                                    {/* Compliance */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Compliance</span>
                                        </div>
                                        <select
                                            value={filters.compliance}
                                            onChange={(e) => setFilters({ ...filters, compliance: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="COMPLIANT">Compliant</option>
                                            <option value="NON-COMPLIANT">Non-Compliant</option>
                                            <option value="EXPIRING SOON">Expiring Soon</option>
                                        </select>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTrucks.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                            No trucks found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTrucks.map((truck) => (
                                        <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-900">{truck.unitNumber}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{truck.plateNumber}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{truck.ownership}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {truck.notes ? (
                                                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <span className="text-xs">!</span>
                                                    </div>
                                                ) : (
                                                    ''
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2.5 py-1.5 text-xs font-semibold rounded text-center min-w-[60px] ${getStatusBadgeColor(truck.operatingStatus, 'operating')}`}>
                                                    {formatStatusText(truck.operatingStatus, 'operating')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getStatusBadgeColor(truck.dispatchStatus, 'dispatch')}`}>
                                                    {truck.dispatchStatus === 'LOADED' && <Clock className="w-3 h-3" />}
                                                    {truck.dispatchStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{truck.dispatchInfo}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2.5 py-1.5 text-xs font-semibold rounded text-center min-w-[70px] ${getStatusBadgeColor(truck.compliance, 'compliance')}`}>
                                                    {formatStatusText(truck.compliance, 'compliance')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Trucks;
