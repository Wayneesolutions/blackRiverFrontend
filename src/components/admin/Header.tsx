// components/Header.jsx
import { useState, useRef, useEffect } from "react";
import { FaBell, FaCommentDots, FaUserCircle, FaExpand, FaSignOutAlt, FaUser, FaCog } from "react-icons/fa";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";

const Header = () => {
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { logout } = useLogout();
    const { userInfo } = useSelector((state: RootState) => state.userAuth);

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

    return (
        <header className="flex items-center justify-between px-4 py-4">
            {/* Quick Action Search */}
            <div className="flex-1 max-w-xl bg-white shadow-[0px_4px_4px_0px_#00000040] shadow-sm">
                <input
                    type="text"
                    placeholder="Quick Action"
                    className="w-full  rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4 ml-4">
                <FaBell className="cursor-pointer" />
                <FaUserCircle className="cursor-pointer" />
            </div>
        </header>
    );
};

export default Header;
