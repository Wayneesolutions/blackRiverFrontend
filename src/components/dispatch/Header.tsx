// components/Header.jsx
import { useState, useRef, useEffect } from "react";
import { FaUser, FaSignOutAlt, FaCog, FaBars } from "react-icons/fa";
import { Search, Clock, X } from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import QuickAction from "../common/QuickAction";
import { FLEET_COLORS } from "../../pages/admin/fleetMaintenance/colorUtils";

const Header = ({ onToggleSidebar, isSidebarCollapsed }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [recentSearches, setRecentSearches] = useState([
        "Fleet Dispatch",
        "Driver Assign",
        "Load Management",
        "Report Logs"
    ]);

    const searchRef = useRef(null);
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
        };
        if (isSearchOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isSearchOpen]);

    // escape key closes search
    useEffect(() => {
        const keyHandler = (e) => {
            if (e.key === "Escape") {
                setIsSearchOpen(false);
                setSearchQuery("");
            }
        };
        document.addEventListener("keydown", keyHandler);
        return () => document.removeEventListener("keydown", keyHandler);
    }, []);

    const handleLogout = () => logout();

    const handleProfileClick = () => navigate("/admin/profile");
    const handleSettingsClick = () => navigate("/admin/company");

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

                {/* RIGHT: Search + Profile + Settings + Logout */}
                <div className="flex items-center gap-4">
                    {/* Search Button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                    >
                        <Search size={20} />
                    </button>

                    {/* Profile */}
                    <button
                        onClick={handleProfileClick}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                    >
                        <FaUser size={16} />
                        <span className="hidden sm:block text-sm">
                            {userInfo?.userData?.name?.split(" ")[0] || "Profile"}
                        </span>
                    </button>

                    {/* Settings */}
                    <button
                        onClick={handleSettingsClick}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                    >
                        <FaCog size={18} />
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                    >
                        <FaSignOutAlt size={18} />
                    </button>
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
        </>
    );
};

export default Header;
