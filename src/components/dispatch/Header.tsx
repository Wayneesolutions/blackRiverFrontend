// components/Header.jsx
import { useState, useRef, useEffect } from "react";
import { FaUser, FaSignOutAlt, FaBars, FaChevronDown } from "react-icons/fa";
import { Search, Clock, X, LogOut, AlertCircle } from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import QuickAction from "../common/QuickAction";
import { FLEET_COLORS } from "../../pages/admin/fleetMaintenance/colorUtils";

const Header = ({ onToggleSidebar, isSidebarCollapsed }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [recentSearches, setRecentSearches] = useState([
        "Fleet Dispatch",
        "Driver Assign",
        "Load Management",
        "Report Logs"
    ]);

    const searchRef = useRef(null);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const { logout } = useLogout();
    const { userInfo } = useSelector((state: RootState) => state.userAuth);
    const navigate = useNavigate();

    // close search overlay on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsSearchOpen(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isSearchOpen, isDropdownOpen]);

    // escape key closes search
    useEffect(() => {
        const keyHandler = (e) => {
            if (e.key === "Escape") {
                setIsSearchOpen(false);
                setIsDropdownOpen(false);
                setSearchQuery("");
            }
        };
        document.addEventListener("keydown", keyHandler);
        return () => document.removeEventListener("keydown", keyHandler);
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
        navigate("/dispatch/profile");
    };


    return (
        <>
            <header
                className="flex items-center justify-between px-6 py-4 shadow-sm relative z-20"
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

                {/* MIDDLE: Quick Search + Dispatch button */}
                <div className="flex items-center flex-1 justify-center gap-10 max-w-3xl">


                    <button
                        className="px-4 py-2 text-sm !text-white hover:opacity-90 transition"
                        style={{

                        }}
                    >
                        Dispatch & Load Management
                    </button>
                </div>

                {/* RIGHT: Search + Profile Dropdown */}
                <div className="flex items-center gap-4">
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

                        {/* Dropdown Menu */}
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
                        {/* Input */}
                        <form className="p-4 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />

                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="w-full pl-12 pr-12 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec]"
                                    placeholder="Search anything…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                                >
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>
                        </form>

                        {/* Recent Searches */}
                        {searchQuery === "" && (
                            <div className="p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Searches</h3>
                                <div className="space-y-2">
                                    {recentSearches.map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSearchQuery(item)}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                                        >
                                            <Clock size={16} className="text-gray-400" />
                                            <span className="text-sm text-gray-700">{item}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {searchQuery !== "" && (
                            <p className="text-center py-8 text-gray-500">Search results for "{searchQuery}"</p>
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
    );
};

export default Header;
