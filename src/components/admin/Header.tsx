
import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { FaSignOutAlt, FaUser, FaCog, FaBars  } from "react-icons/fa";
import { Search, X, LogOut, AlertCircle, ArrowRight ,ArrowLeft } from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import { useSelector, shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import { useQuickActions } from "../common/QuickAction";
import { usePageTitle } from "../../hooks/usePageTitle";

interface HeaderProps {
    isSidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarCollapsed = false, onToggleSidebar }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { logout } = useLogout();
    const { userInfo } = useSelector((state: RootState) => state.userAuth, shallowEqual);
    const navigate = useNavigate();
    const { filterActions } = useQuickActions();
    const pageTitle = usePageTitle();

    // Only recompute when searchQuery changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const filteredActions = useMemo(() => filterActions(searchQuery, 'admin'), [searchQuery]);

    // Close search overlay when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        };

        if (isSearchOpen) {
            document.addEventListener('mousedown', handleClickOutside);
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
                setSelectedIndex(0);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isSearchOpen]);

    // Reset selected index when search query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    const handleLogout = useCallback(() => {
        setShowLogoutModal(true);
    }, []);

    const confirmLogout = useCallback(() => {
        setShowLogoutModal(false);
        logout();
    }, [logout]);

    const cancelLogout = useCallback(() => {
        setShowLogoutModal(false);
    }, []);

    const handleProfileClick = useCallback(() => {
        navigate('/admin/profile');
    }, [navigate]);

    const handleSettingsClick = useCallback(() => {
        navigate('/admin/company');
    }, [navigate]);

    const handleSearchClick = useCallback(() => {
        setIsSearchOpen(true);
    }, []);

    const handleActionSelect = useCallback((action: typeof filteredActions[0]) => {
        if (action.path) {
            navigate(action.path);
            setSearchQuery('');
            setIsSearchOpen(false);
            setSelectedIndex(0);
        }
    }, [navigate]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
    }, [filteredActions, selectedIndex, handleActionSelect]);

    const handleSearchSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (filteredActions.length > 0) {
            handleActionSelect(filteredActions[selectedIndex]);
        }
    }, [filteredActions, selectedIndex, handleActionSelect]);

    return (
        <>
            <header
                className="flex items-center justify-between px-6 py-4 shadow-sm relative z-20"
                style={{
                    background: 'linear-gradient(135deg, #42aeec 0%, #31a2d4 100%)'
                }}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <FaBars size={20} />
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                        title="Previous"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <button
                        onClick={() => navigate(1)}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                        title="Next"
                    >
                        <ArrowRight size={22} />
                    </button>
                </div>

                {pageTitle && (
                    <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
                        <span className="text-white font-semibold text-lg tracking-wide">{pageTitle}</span>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSearchClick}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                        title="Search"
                    >
                        <Search size={20} />
                    </button>

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

                    <button
                        onClick={handleSettingsClick}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                        title="Settings"
                    >
                        <FaCog size={18} />
                    </button>

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

                        <div className="p-6">
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-amber-800">
                                    You'll need to sign in again to access your account after logging out.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={cancelLogout}
                                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="px-6 py-2.5 !text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-red-500/30"
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

export default memo(Header);