import { useState, useRef, useEffect } from 'react'
import { FaUser, FaSignOutAlt, FaBars, FaChevronDown } from "react-icons/fa";
import { Search, X, LogOut, AlertCircle, ArrowRight, Bell } from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import { getUserRole } from "../../utils/auth";
import { useQuickActions } from "../common/QuickAction";
import { getIncomingMaintenanceCount, getSamsaraUpcomingServices, listVehicleServices, type VehicleServiceResponse } from "../../axios/api/vehicleService";

function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [incomingMaintenanceCount, setIncomingMaintenanceCount] = useState(0);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [upcomingServices, setUpcomingServices] = useState<VehicleServiceResponse[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { logout } = useLogout();
    const { userInfo } = useSelector((state: RootState) => state.userAuth);
    const navigate = useNavigate();
    const { filterActions } = useQuickActions();
    const userRole = getUserRole();
    const isFleetMaintenanceManager = userRole === "Fleet Maintenance Manager";

    const filteredActions = filterActions(searchQuery, isFleetMaintenanceManager ? 'fleet' : 'admin');

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSearchOpen, isDropdownOpen, isNotificationOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (isSearchOpen) {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                    setSelectedIndex(0);
                }
                if (isDropdownOpen) {
                    setIsDropdownOpen(false);
                }
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isSearchOpen, isDropdownOpen]);

    // Focus input when search opens
    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isSearchOpen]);

    // Reset index on query change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    // Fetch upcoming services when notification panel opens
    const fetchUpcomingServices = async () => {
        if (loadingNotifications) return;
        setLoadingNotifications(true);
        try {
            const [maintenanceResponse, samsaraResponse, maintenanceServicesResponse] = await Promise.all([
                getIncomingMaintenanceCount(),
                getSamsaraUpcomingServices(),
                listVehicleServices({ status: 'pending' }) // Fetch pending services
            ]);
            
            const services: VehicleServiceResponse[] = [];
            
            // Add maintenance services (pending and in-progress)
            if (maintenanceServicesResponse?.success && maintenanceServicesResponse.data) {
                const allServices = Array.isArray(maintenanceServicesResponse.data) 
                    ? maintenanceServicesResponse.data 
                    : [];
                
                // Filter for incoming services (due within 30 days or 7500 km)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                thirtyDaysFromNow.setHours(23, 59, 59, 999);
                
                const incomingServices = allServices.filter((service) => {
                    // Check if service is due within 30 days
                    if (service.dueDate) {
                        const dueDate = new Date(service.dueDate);
                        if (dueDate >= today && dueDate <= thirtyDaysFromNow) {
                            return true;
                        }
                    }
                    
                    // Check if service is due within 7500 km
                    if (service.dueMileage && service.odometer !== undefined) {
                        const remainingKm = service.dueMileage - service.odometer;
                        if (remainingKm >= 0 && remainingKm <= 7500) {
                            return true;
                        }
                    }
                    
                    // Check vehicle odometer if service odometer is not available
                    if (service.dueMileage && service.vehicleId && (service.vehicleId as any).odometer !== undefined) {
                        const vehicleOdometer = (service.vehicleId as any).odometer;
                        const remainingKm = service.dueMileage - vehicleOdometer;
                        if (remainingKm >= 0 && remainingKm <= 7500) {
                            return true;
                        }
                    }
                    
                    return false;
                });
                
                services.push(...incomingServices);
            }
            
            // Add Samsara services
            if (samsaraResponse?.success && samsaraResponse.data) {
                services.push(...samsaraResponse.data);
            }
            
            setUpcomingServices(services);
            
            // Update count including Samsara services
            const maintenanceCount = maintenanceResponse?.incomingMaintenance ?? maintenanceResponse?.count ?? 0;
            const samsaraCount = samsaraResponse?.count ?? 0;
            setIncomingMaintenanceCount(Number(maintenanceCount) + Number(samsaraCount));
        } catch (error: any) {
            console.error('🔔 [Header] Error fetching upcoming services:', error);
            setUpcomingServices([]);
        } finally {
            setLoadingNotifications(false);
        }
    };

    // Fetch incoming maintenance count on mount and every 5 minutes
    useEffect(() => {
        const fetchIncomingMaintenance = async () => {
            try {
                console.log('🔔 [Header] Fetching incoming maintenance count...');
                const [maintenanceResponse, samsaraResponse] = await Promise.all([
                    getIncomingMaintenanceCount(),
                    getSamsaraUpcomingServices()
                ]);
                
                const maintenanceCount = maintenanceResponse?.incomingMaintenance ?? maintenanceResponse?.count ?? 0;
                const samsaraCount = samsaraResponse?.count ?? 0;
                const totalCount = Number(maintenanceCount) + Number(samsaraCount);
                setIncomingMaintenanceCount(totalCount);
                
                console.log('🔔 [Header] Total count:', totalCount, '(Maintenance:', maintenanceCount, '+ Samsara:', samsaraCount, ')');
            } catch (error: any) {
                console.error('🔔 [Header] Error fetching incoming maintenance count:', error);
                setIncomingMaintenanceCount(0);
            }
        };

        // Fetch immediately
        fetchIncomingMaintenance();

        // Set up interval to fetch every 5 minutes
        const interval = setInterval(fetchIncomingMaintenance, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const handleLogoutClick = () => {
        setIsDropdownOpen(false);
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        setShowLogoutModal(false);
        logout();
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    const handleProfileClick = () => {
        setIsDropdownOpen(false);
        navigate('/fleetmaintenance/profile');
    };

    const handleActionSelect = (action: any) => {
        if (action.path) {
            navigate(action.path);
            setSearchQuery('');
            setIsSearchOpen(false);
            setSelectedIndex(0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (filteredActions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredActions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredActions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredActions.length > 0) {
                    handleActionSelect(filteredActions[selectedIndex]);
                }
                break;
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (filteredActions.length > 0) {
            handleActionSelect(filteredActions[selectedIndex]);
        }
    };

    return (
        <>
            <header
                className="flex items-center justify-between px-6 py-3 shadow-sm relative z-20 fleet-header"
                style={{
                    background: "linear-gradient(135deg, #42aeec 0%, #31a2d4 100%)"
                }}
            >
                {/* LEFT: Sidebar toggle */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                    >
                        <FaBars size={20} />
                    </button>
                </div>

                {/* MIDDLE: Module Title */}
                <div className="flex items-center flex-1 justify-center gap-10 max-w-3xl">
                    <button
                        className="px-4 py-2 text-sm !text-white hover:opacity-90 transition"
                    >
                        Fleet Maintenance
                    </button>
                </div>


                {/* RIGHT: Search + Notification + Profile Dropdown */}
                <div className="flex items-center gap-4">
                    {/* Incoming Maintenance Notification - Always show, even if 0 */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => {
                                if (!isNotificationOpen) {
                                    fetchUpcomingServices();
                                }
                                setIsNotificationOpen(!isNotificationOpen);
                            }}
                            className="relative p-2 rounded-lg hover:bg-white/20 transition-colors !text-white z-10"
                            title={incomingMaintenanceCount > 0 
                                ? `${incomingMaintenanceCount} incoming maintenance service(s) due within 30 days`
                                : 'No incoming maintenance services'
                            }
                        >
                            <Bell size={20} className="relative z-0" />
                            <span className={`absolute -top-0.5 -right-0.5 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center border-2 border-white shadow-lg z-10 ${incomingMaintenanceCount > 0 ? 'bg-red-500' : 'bg-gray-500'}`}>
                                {incomingMaintenanceCount > 99 ? '99+' : incomingMaintenanceCount}
                            </span>
                        </button>

                        {/* Notification Panel */}
                        {isNotificationOpen && (
                            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[600px] flex flex-col">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bell size={18} />
                                        <h3 className="font-semibold text-sm">Upcoming Services</h3>
                                        {incomingMaintenanceCount > 0 && (
                                            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                                                {incomingMaintenanceCount}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsNotificationOpen(false)}
                                        className="p-1 hover:bg-white/20 rounded transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="overflow-y-auto flex-1">
                                    {loadingNotifications ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                                            <p className="text-sm">Loading services...</p>
                                        </div>
                                    ) : upcomingServices.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">No upcoming services</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {upcomingServices.map((service) => {
                                                const isSamsara = service._id?.startsWith('samsara-');
                                                const remainingKm = service.dueMileage && service.odometer 
                                                    ? service.dueMileage - service.odometer 
                                                    : null;
                                                const isOverdue = remainingKm !== null && remainingKm < 0;
                                                const isDueSoon = remainingKm !== null && remainingKm >= 0 && remainingKm <= 7500;
                                                
                                                return (
                                                    <div
                                                        key={service._id}
                                                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                                        onClick={() => {
                                                            const basePath = isFleetMaintenanceManager ? '/fleetmaintenance' : '/admin/fleetmaintenance';
                                                            navigate(`${basePath}/scheduled-services-log?filter=incoming`);
                                                            setIsNotificationOpen(false);
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-semibold text-sm text-gray-900">
                                                                        {service.unitNumber || service.vehicleId?.internalId || 'N/A'}
                                                                    </span>
                                                                    {isSamsara && (
                                                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                                            Samsara
                                                                        </span>
                                                                    )}
                                                                    {isOverdue && (
                                                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                                            Overdue
                                                                        </span>
                                                                    )}
                                                                    {isDueSoon && !isOverdue && (
                                                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                                                            Due Soon
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-600 mb-1">
                                                                    {service.makeModel || service.vehicleId?.make + ' ' + service.vehicleId?.model || 'N/A'}
                                                                </p>
                                                                <p className="text-xs font-medium text-gray-900">
                                                                    {service.serviceType?.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) || 'Service'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                                            {service.dueDate && (
                                                                <span>Due: {new Date(service.dueDate).toLocaleDateString()}</span>
                                                            )}
                                                            {remainingKm !== null && (
                                                                <span className={isOverdue ? 'text-red-600 font-semibold' : isDueSoon ? 'text-orange-600 font-semibold' : ''}>
                                                                    {isOverdue ? `${Math.abs(remainingKm).toLocaleString()} km overdue` : `${remainingKm.toLocaleString()} km remaining`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                {upcomingServices.length > 0 && (
                                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                                        <button
                                            onClick={() => {
                                                const basePath = isFleetMaintenanceManager ? '/fleetmaintenance' : '/admin/fleetmaintenance';
                                                navigate(`${basePath}/scheduled-services-log?filter=incoming`);
                                                setIsNotificationOpen(false);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            View All Services
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Search Button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                    >
                        <Search size={20} />
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <FaUser size={14} />
                            </div>
                            <span className="hidden sm:block text-sm font-medium">
                                {userInfo?.userData?.name?.split(" ")[0] || "User"}
                            </span>
                            <FaChevronDown size={12} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                    <p className="text-sm font-medium text-gray-900 truncate">{userInfo?.userData?.name || "User"}</p>
                                    <p className="text-xs text-gray-500 truncate">{userInfo?.userData?.email || "user@example.com"}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={handleProfileClick}
                                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <FaUser size={14} className="text-gray-400" />
                                        Profile
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button
                                        onClick={handleLogoutClick}
                                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <FaSignOutAlt size={14} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* SEARCH OVERLAY */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/30 backdrop-blur-sm">
                    <div
                        ref={searchRef}
                        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4"
                    >
                        <form onSubmit={handleSearchSubmit} className="p-4 border-b border-gray-200">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                    <Search className="text-gray-400" size={20} />
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Quick Action - Type to search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full pl-12 pr-12 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery("");
                                        setSelectedIndex(0);
                                    }}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="text-gray-400" size={20} />
                                </button>
                            </div>
                        </form>

                        {searchQuery.trim() !== "" && filteredActions.length > 0 && (
                            <div className="max-h-[400px] overflow-y-auto">
                                <div className="py-2">
                                    {filteredActions.map((action, index) => (
                                        <button
                                            key={action.id}
                                            onClick={() => handleActionSelect(action)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-all duration-150 border-l-2 ${index === selectedIndex
                                                ? 'bg-blue-50 border-blue-500'
                                                : 'border-transparent hover:border-blue-300'
                                                }`}
                                        >
                                            <div className={`flex-shrink-0 ${index === selectedIndex ? 'scale-110' : ''} transition-transform`}>
                                                <div className={`p-2 rounded-lg ${action.type === 'create' ? 'bg-green-100 text-green-700' :
                                                    action.type === 'navigation' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {action.icon}
                                                </div>
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 truncate">{action.title}</span>
                                                    {action.type === 'create' && (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                                            New
                                                        </span>
                                                    )}
                                                    {action.type === 'navigation' && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                                            Navigate
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5 truncate">
                                                    {action.description}
                                                </p>
                                            </div>
                                            <ArrowRight
                                                className={`flex-shrink-0 transition-all ${index === selectedIndex
                                                    ? 'text-blue-600 opacity-100 translate-x-0'
                                                    : 'text-gray-400 opacity-0 -translate-x-1'
                                                    }`}
                                                size={18}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
                                    <p className="text-xs text-gray-500 text-center">
                                        {filteredActions.length} result{filteredActions.length !== 1 ? 's' : ''} • Use ↑↓ to navigate, Enter to select
                                    </p>
                                </div>
                            </div>
                        )}

                        {searchQuery.trim() !== "" && filteredActions.length === 0 && (
                            <div className="p-8">
                                <p className="text-sm text-gray-500 text-center">
                                    No actions found for "{searchQuery}"
                                </p>
                            </div>
                        )}

                        {searchQuery.trim() === "" && (
                            <div className="p-8">
                                <p className="text-sm text-gray-500 text-center">
                                    Type to search for actions, pages, or create new items
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* LOGOUT CONFIRMATION MODAL */}
            {showLogoutModal && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={cancelLogout}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <LogOut className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
                                    <p className="text-sm text-gray-500 mt-1">Are you sure you want to logout?</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-amber-800">
                                    You'll need to sign in again to access your account after logging out.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={cancelLogout}
                                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="px-6 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-red-500/30"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Header