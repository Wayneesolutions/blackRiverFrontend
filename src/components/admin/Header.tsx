// components/Header.jsx
import { useState, useRef, useEffect } from "react";
import { FaUserCircle, FaSignOutAlt, FaUser, FaCog } from "react-icons/fa";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import QuickAction from "../common/QuickAction";
import { FLEET_COLORS } from "../../pages/admin/fleetMaintenance/colorUtils";

const Header = () => {
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { logout } = useLogout();
    const { userInfo } = useSelector((state: RootState) => state.userAuth);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        setIsUserDropdownOpen(false);
    };

    const handleProfileClick = () => {
        navigate('/admin/profile');
        setIsUserDropdownOpen(false);
    };

    const handleSettingsClick = () => {
        navigate('/admin/company');
        setIsUserDropdownOpen(false);
    };

    const dropdownBorderStyle = {
        borderColor: FLEET_COLORS.focusRing,
        boxShadow: `0 10px 30px ${FLEET_COLORS.focusRing}`,
    };

    return (
        <header className="flex items-center justify-between px-4 py-4">
        {/* Quick Action Search */}
            <QuickAction />

            {/* Icons */}
            <div className="flex items-center gap-4 ml-4 relative">
                <div className="relative" ref={dropdownRef}>
                    <FaUserCircle 
                    size={28}
                        className="cursor-pointer" 
                        color={FLEET_COLORS.light}
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} 
                    />
                    
                    {/* User Dropdown */}
                    {isUserDropdownOpen && (
                        <div
                            className="absolute right-0 mt-2 w-56 bg-white rounded-xl z-50 overflow-hidden"
                            style={dropdownBorderStyle}
                        >
                            {/* User Info */}
                            <div
                                className="px-4 py-3 border-b"
                                style={{ borderColor: FLEET_COLORS.focusRing }}
                            >
                                <p className="text-sm font-semibold text-gray-900 capitalize">
                                    {userInfo?.userData?.name || 'Admin'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {userInfo?.userData?.email || 'admin@test.com'}
                                </p>
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                                <button
                                    onClick={handleProfileClick}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors"
                                    style={{ borderLeft: `3px solid transparent` }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = FLEET_COLORS.focusRing;
                                        e.currentTarget.style.borderLeftColor = FLEET_COLORS.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.borderLeftColor = "transparent";
                                    }}
                                >
                                    <FaUser size={14} />
                                    Profile
                                </button>
                                <button
                                    onClick={handleSettingsClick}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors"
                                    style={{ borderLeft: `3px solid transparent` }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = FLEET_COLORS.focusRing;
                                        e.currentTarget.style.borderLeftColor = FLEET_COLORS.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.borderLeftColor = "transparent";
                                    }}
                                >
                                    <FaCog size={14} />
                                    Settings
                                </button>
                                <div
                                    className="border-t my-1"
                                    style={{ borderColor: FLEET_COLORS.focusRing }}
                                ></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors"
                                    style={{ borderLeft: `3px solid transparent` }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                                        e.currentTarget.style.borderLeftColor = "#ef4444";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.borderLeftColor = "transparent";
                                    }}
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
    );
};

export default Header;
