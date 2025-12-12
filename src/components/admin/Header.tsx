// components/Header.tsx
import { useState, useRef, useEffect } from "react";
import { FaSignOutAlt, FaUser, FaCog, FaBars } from "react-icons/fa";
import { Search, Clock, X, LogOut, AlertCircle } from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";

interface HeaderProps {
    isSidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarCollapsed = false, onToggleSidebar }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [recentSearches, setRecentSearches] = useState<string[]>([
        "Nowa Admin Dashboard - Themeforest",
        "Bootstrap 5 Latest - Bootstrap",
        "Sash - Bootstrap Responsive Flat Admin Dashboard HTML5 Template",
        "Sparci Admin Template - Themeforest"
    ]);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { logout } = useLogout();
    const { userInfo } = useSelector((state: RootState) => state.userAuth);
    const navigate = useNavigate();

    // Close search overlay when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        };

        if (isSearchOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus input when search opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSearchOpen]);

    // Handle escape key to close search
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
                setSearchQuery("");
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isSearchOpen]);

    const handleLogout = () => {
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
        navigate('/admin/profile');
    };

    const handleSettingsClick = () => {
        navigate('/admin/company');
    };

    const handleSearchClick = () => {
        setIsSearchOpen(true);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Add to recent searches if not already present
            if (!recentSearches.includes(searchQuery)) {
                setRecentSearches([searchQuery, ...recentSearches.slice(0, 3)]);
            }
            // Handle search logic here
            console.log('Searching for:', searchQuery);
        }
    };

    return (
        <>
            <header
                className="flex items-center justify-between px-6 py-4 shadow-sm relative z-20"
                style={{
                    background: 'linear-gradient(135deg, #42aeec 0%, #31a2d4 100%)'
                }}
            >
                {/* Left side - Collapse button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <FaBars size={20} />
                    </button>
                </div>

                {/* Right side - Search icon and user actions */}
                <div className="flex items-center gap-4">
                    {/* Search Icon */}
                    <button
                        onClick={handleSearchClick}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                        title="Search"
                    >
                        <Search size={20} />
                    </button>

                    {/* Profile Button */}
                    <button
                        onClick={handleProfileClick}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                        title="Profile"
                    >
                        <FaUser size={16} />
                        <span className="text-sm font-medium hidden sm:inline">
                            {userInfo?.userData?.name?.split(' ')[0] || 'Profile'}
                        </span>
                    </button>

                    {/* Settings Button */}
                    <button
                        onClick={handleSettingsClick}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                        title="Settings"
                    >
                        <FaCog size={18} />
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                        title="Logout"
                    >
                        <FaSignOutAlt size={18} />
                    </button>
                </div>
            </header>

            {/* Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/30 backdrop-blur-sm">
                    <div
                        ref={searchRef}
                        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4"
                    >
                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="p-4 border-b border-gray-200">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                    <Search className="text-gray-400" size={20} />
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search anything..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="text-gray-400" size={20} />
                                </button>
                            </div>
                        </form>

                        {/* Recent Searches */}
                        {searchQuery.trim() === "" && recentSearches.length > 0 && (
                            <div className="p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Searches</h3>
                                <div className="space-y-2">
                                    {recentSearches.map((search, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setSearchQuery(search);
                                                inputRef.current?.focus();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                                        >
                                            <Clock className="text-gray-400 group-hover:text-[#42aeec]" size={16} />
                                            <span className="text-sm text-gray-700 group-hover:text-[#42aeec]">
                                                {search}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Search Results (when query exists) */}
                        {searchQuery.trim() !== "" && (
                            <div className="p-4">
                                <p className="text-sm text-gray-500 text-center py-8">
                                    Search results for "{searchQuery}" will appear here
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
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
    );
};

export default Header;