
import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { FaSignOutAlt, FaUser, FaCog, FaBars } from "react-icons/fa";
import { Search, X, LogOut, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
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
                className="flex items-center justify-between px-6 py-4 shadow-sm relative z-20 bg-main "

            >
                <div className="flex items-center gap-4">

                    <button
                        onClick={onToggleSidebar}
                        className="header-btn"
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <FaBars size={20} />
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="header-btn"
                        title="Previous"
                    >
                        <ArrowLeft size={22} />
                    </button>

                    <button
                        onClick={() => navigate(1)}
                        className="header-btn"
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
                        className="p-2 rounded-lg hover-accent text-primary transition"
                        title="Search"
                    >
                        <Search size={20} />
                    </button>

                    <button
                        onClick={handleProfileClick}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover-accent text-primary transition"
                        title="Profile"
                    >
                        <FaUser size={16} />
                        <span className="text-sm font-medium hidden sm:inline">
                            {userInfo?.userData?.name?.split(' ')[0] || 'Profile'}
                        </span>
                    </button>

                    <button
                        onClick={handleSettingsClick}
                        className="p-2 rounded-lg hover-accent text-primary transition"
                        title="Settings"
                    >
                        <FaCog size={18} />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg hover-accent text-primary transition"
                        title="Logout"
                    >
                        <FaSignOutAlt size={18} />
                    </button>

                </div>
            </header>

            {/* Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/50 backdrop-blur-md">

                    <div
                        ref={searchRef}
                        className="bg-card text-primary border border-theme rounded-xl shadow-2xl w-full max-w-2xl mx-4"
                    >

                        <form onSubmit={handleSearchSubmit} className="p-4 border-b border-theme">

                            <div className="relative">

                                {/* Search Icon */}
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Search className="text-secondary" size={20} />
                                </div>

                                {/* Input */}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Quick Action - Type to search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full pl-12 pr-12 py-3 text-lg bg-main text-primary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                                />

                                {/* Close */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery("");
                                        setSelectedIndex(0);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-secondary hover-accent hover:text-accent transition"
                                >
                                    <X size={20} />
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
                                            className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-2 ${index === selectedIndex
                                                    ? "active-accent border-[var(--accent-blue)]"
                                                    : "border-transparent hover-accent"
                                                }`}
                                        >

                                            {/* Icon */}
                                            <div className={`flex-shrink-0 ${index === selectedIndex ? 'scale-110' : ''}`}>
                                                <div
                                                    className={`p-2 rounded-lg ${action.type === "create"
                                                            ? "bg-[rgba(0,255,163,0.1)] text-[var(--accent-green)]"
                                                            : action.type === "navigation"
                                                                ? "bg-[rgba(0,209,255,0.1)] text-[var(--accent-blue)]"
                                                                : "bg-[rgba(255,255,255,0.05)] text-secondary"
                                                        }`}
                                                >
                                                    {action.icon}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="flex items-center gap-2">

                                                    <span className="font-semibold text-primary truncate">
                                                        {action.title}
                                                    </span>

                                                    {action.type === "create" && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[rgba(0,255,163,0.1)] text-[var(--accent-green)]">
                                                            New
                                                        </span>
                                                    )}

                                                    {action.type === "navigation" && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[rgba(0,209,255,0.1)] text-[var(--accent-blue)]">
                                                            Navigate
                                                        </span>
                                                    )}

                                                </div>

                                                <p className="text-sm text-secondary mt-0.5 truncate">
                                                    {action.description}
                                                </p>
                                            </div>

                                            {/* Arrow */}
                                            <ArrowRight
                                                className={`flex-shrink-0 transition-all ${index === selectedIndex
                                                        ? "text-[var(--accent-blue)] opacity-100"
                                                        : "text-secondary opacity-0"
                                                    }`}
                                                size={18}
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-theme px-4 py-2 bg-card">
                                    <p className="text-xs text-secondary text-center">
                                        {filteredActions.length} result{filteredActions.length !== 1 ? "s" : ""} • Use ↑↓ to navigate
                                    </p>
                                </div>

                            </div>
                        )}

                        {searchQuery.trim() !== "" && filteredActions.length === 0 && (
                            <div className="p-8">
                                <p className="text-sm text-secondary text-center">
                                    No actions found for "{searchQuery}"
                                </p>
                            </div>
                        )}

                        {searchQuery.trim() === "" && (
                            <div className="p-8">
                                <p className="text-sm text-secondary text-center">
                                    Type to search for actions, pages, or create new items
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </>
    );
};

export default memo(Header);