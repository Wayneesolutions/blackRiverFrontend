// components/Header.jsx
import { useState, useRef, useEffect } from "react";
import { FaBell, FaUserCircle, FaSignOutAlt, FaUser, FaCog } from "react-icons/fa";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";

const Header = () => {
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { logout } = useLogout();
    const { superAdminInfo } = useSelector((state: RootState) => state.superAdminAuth);
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
        navigate('/superadmin/systemsetting');
        setIsUserDropdownOpen(false);
    };

    const handleSettingsClick = () => {
        navigate('/superadmin/systemsetting');
        setIsUserDropdownOpen(false);
    };

    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-gray-200">
            {/* Left side - can add breadcrumbs or title here in future */}
            <div className="flex-1"></div>
            
            {/* Right side - Icons */}
            <div className="flex items-center gap-4 relative">
                <button 
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                    aria-label="Notifications"
                >
                    <FaBell className="w-5 h-5 text-gray-600" />
                    {/* Notification badge can be added here */}
                </button>
                
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="User menu"
                    >
                        <FaUserCircle className="w-6 h-6 text-gray-600 cursor-pointer" />
                    </button>
                    
                    {/* User Dropdown */}
                    {isUserDropdownOpen && (
                        <>
                            {/* Backdrop */}
                            <div 
                                className="fixed inset-0 z-[9998]" 
                                onClick={() => setIsUserDropdownOpen(false)}
                            />
                            <div 
                                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                                    <p className="text-sm font-semibold text-gray-900 capitalize">
                                        {superAdminInfo?.userData?.name || 'SuperAdmin'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {superAdminInfo?.userData?.email || 'superadmin@test.com'}
                                    </p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    <button
                                        onClick={handleProfileClick}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <FaUser className="w-4 h-4" />
                                        Profile
                                    </button>
                                    <button
                                        onClick={handleSettingsClick}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <FaCog className="w-4 h-4" />
                                        Settings
                                    </button>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                    >
                                        <FaSignOutAlt className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
