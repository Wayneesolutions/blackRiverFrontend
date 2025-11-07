import { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Truck, Filter, Trash2 } from 'lucide-react';
import NewTrailerSidebar from './NewTrailerSidebar';
import { 
    listTrailers, 
    deleteTrailer, 
    searchTrailers, 
    getTrailerStats
} from '../../../../../axios/api/distapcher';

interface Trailer {
    _id: string;
    trailer: string;
    internalId: string;
    plateNumber: string;
    type: string;
    operationStatus: string;
    status: string;
    capacity: string;
    isAttached: boolean;
    currentLocation?: {
        address: string;
        latitude: string;
        longitude: string;
        updatedAt: string;
    };
    cargoDetails?: {
        weight: number;
        isRefrigerated: boolean;
    };
    sensors?: {
        doorStatus: string;
        shockDetection: boolean;
        tilting: boolean;
    };
    maintenance?: {
        tyreCondition: string;
        brakeCondition: string;
        issues: string[];
    };
    company: string;
    route: any[];
    createdAt: string;
    updatedAt: string;
}

const TrailersTable = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [trailers, setTrailers] = useState<Trailer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<any>(null);

    // Fetch trailers data
    const fetchTrailers = async () => {
        try {
            setLoading(true);
            const response = await listTrailers();
            if (response.success) {
                // API returns data as array directly, not nested under trailers
                const trailersData = response.data || [];
                setTrailers(trailersData);
                
                // Calculate stats from trailers data as fallback
                const calculatedStats = {
                    total: trailersData.length,
                    available: trailersData.filter((t: Trailer) => t.operationStatus === 'available').length,
                    inTransit: trailersData.filter((t: Trailer) => t.operationStatus === 'in_transit').length,
                    maintenance: trailersData.filter((t: Trailer) => t.operationStatus === 'maintenance').length,
                    loading: trailersData.filter((t: Trailer) => t.operationStatus === 'loading').length,
                    idle: trailersData.filter((t: Trailer) => t.operationStatus === 'idle').length
                };
                
                // If stats API failed, use calculated stats
                if (!stats) {
                    setStats(calculatedStats);
                }
            }
        } catch (error) {
            console.error('Error fetching trailers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch trailer stats
    const fetchStats = async () => {
        try {
            const response = await getTrailerStats();
            if (response.success) {
                setStats(response.data);
            } else {
                // Fallback: calculate stats from trailers data
                const calculatedStats = {
                    total: trailers.length,
                    available: trailers.filter((t: Trailer) => t.operationStatus === 'available').length,
                    inTransit: trailers.filter((t: Trailer) => t.operationStatus === 'in_transit').length,
                    maintenance: trailers.filter((t: Trailer) => t.operationStatus === 'maintenance').length,
                    loading: trailers.filter((t: Trailer) => t.operationStatus === 'loading').length,
                    idle: trailers.filter((t: Trailer) => t.operationStatus === 'idle').length
                };
                setStats(calculatedStats);
            }
        } catch (error) {
            console.error('Error fetching trailer stats:', error);
            // Fallback: calculate stats from trailers data
            const calculatedStats = {
                total: trailers.length,
                available: trailers.filter((t: Trailer) => t.operationStatus === 'available').length,
                inTransit: trailers.filter((t: Trailer) => t.operationStatus === 'in_transit').length,
                maintenance: trailers.filter((t: Trailer) => t.operationStatus === 'maintenance').length,
                loading: trailers.filter((t: Trailer) => t.operationStatus === 'loading').length,
                idle: trailers.filter((t: Trailer) => t.operationStatus === 'idle').length
            };
            setStats(calculatedStats);
        }
    };

    // Search trailers
    const handleSearch = async (query: string) => {
        if (query.trim()) {
            try {
                const response = await searchTrailers(query);
                if (response.success) {
                    // API returns data as array directly, not nested under trailers
                    setTrailers(response.data || []);
                }
            } catch (error) {
                console.error('Error searching trailers:', error);
            }
        } else {
            fetchTrailers();
        }
    };

    // Delete trailer
    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this trailer?')) {
            try {
                const response = await deleteTrailer(id);
                if (response.success) {
                    setTrailers(trailers.filter(trailer => trailer._id !== id));
                    fetchStats(); // Refresh stats
                } else {
                    alert('Failed to delete trailer');
                }
            } catch (error) {
                console.error('Error deleting trailer:', error);
                alert('Error deleting trailer');
            }
        }
    };


    // Handle sidebar close
    const handleSidebarClose = () => {
        setIsSidebarOpen(false);
        fetchTrailers();
        fetchStats();
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchTrailers();
            await fetchStats();
        };
        loadData();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Recalculate stats when trailers data changes
    useEffect(() => {
        if (trailers.length > 0) {
            const calculatedStats = {
                total: trailers.length,
                available: trailers.filter((t: Trailer) => t.operationStatus === 'available').length,
                inTransit: trailers.filter((t: Trailer) => t.operationStatus === 'in_transit').length,
                maintenance: trailers.filter((t: Trailer) => t.operationStatus === 'maintenance').length,
                loading: trailers.filter((t: Trailer) => t.operationStatus === 'loading').length,
                idle: trailers.filter((t: Trailer) => t.operationStatus === 'idle').length
            };
            setStats(calculatedStats);
        }
    }, [trailers]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'moving':
                return 'bg-green-100 text-green-800';
            case 'idle':
                return 'bg-yellow-100 text-yellow-800';
            case 'stopped':
                return 'bg-gray-100 text-gray-800';
            case 'maintenance':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getOperationStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'available':
                return 'bg-green-100 text-green-800';
            case 'in_transit':
                return 'bg-blue-100 text-blue-800';
            case 'loading':
                return 'bg-yellow-100 text-yellow-800';
            case 'idle':
                return 'bg-gray-100 text-gray-800';
            case 'maintenance':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <div className="flex-1">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-semibold text-gray-900">Trailers</h1>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search trailers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                                <Filter className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="bg-blue-600 !text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Trailer</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <Truck className="w-8 h-8 text-blue-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Total Trailers</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Available</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.available || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">In Use</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.inTransit || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Maintenance</p>
                                        <p className="text-2xl font-semibold text-gray-900">{stats.maintenance || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="px-6">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trailer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Details
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Operation
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {trailers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center space-y-2">
                                                        <div className="text-5xl text-gray-300">🚛</div>
                                                        <p>No trailers found.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            trailers.map((trailer) => (
                                                <tr key={trailer._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                    <Truck className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {trailer.trailer}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {trailer.internalId}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {trailer.type} • {trailer.plateNumber}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {trailer.capacity}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(trailer.status)}`}>
                                                            {trailer.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOperationStatusColor(trailer.operationStatus)}`}>
                                                            {trailer.operationStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {trailer.currentLocation?.address || 'No location'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => handleDelete(trailer._id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <div className="relative">
                                                                <button className="text-gray-600 hover:text-gray-900">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            {isSidebarOpen && (
                <NewTrailerSidebar
                    isOpen={isSidebarOpen}
                    onClose={handleSidebarClose}
                />
            )}
        </div>
    );
};

export default TrailersTable;
