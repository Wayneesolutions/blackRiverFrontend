// components/Header.jsx
import { useState } from "react";
import { FaBars, FaUser, FaSignOutAlt, FaCog } from "react-icons/fa";
import { Search } from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import QuickAction from "../common/QuickAction";
import { FLEET_COLORS } from "../../pages/admin/fleetMaintenance/colorUtils";

function Header({ onToggleSidebar, isSidebarCollapsed }) {
    const { logout } = useLogout();
    const { userInfo } = useSelector((state: RootState) => state.userAuth);
    const navigate = useNavigate();

    const handleLogout = () => logout();
    const handleProfileClick = () => navigate("/admin/profile");
    const handleSettingsClick = () => navigate("/admin/company");

    return (
        <header
            className="flex items-center justify-between px-6 py-4 shadow-sm relative z-20"
            style={{
                background: "linear-gradient(135deg, #42aeec 0%, #31a2d4 100%)"
            }}
        >
            {/* LEFT: Sidebar collapse + Quick action */}
            <div className="flex items-center gap-4 flex-1 max-w-3xl">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                    aria-label="Toggle sidebar"
                >
                    <FaBars size={20} />
                </button>

              

                <button
                    className="px-4 py-2 text-sm !text-white hover:opacity-90 transition"
                
                >
                    GPS Tracking & Vehicle Telematics
                </button>
            </div>

            {/* RIGHT: Search + Profile + Settings + Logout */}
            <div className="flex items-center gap-4">
                <button className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white">
                    <Search size={20} />
                </button>

                <button
                    onClick={handleProfileClick}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                >
                    <FaUser size={16} />
                    <span className="hidden sm:block text-sm">
                        {userInfo?.userData?.name?.split(" ")[0] || "Profile"}
                    </span>
                </button>

                <button
                    onClick={handleSettingsClick}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                >
                    <FaCog size={18} />
                </button>

                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
                >
                    <FaSignOutAlt size={18} />
                </button>
            </div>
        </header>
    );
}

export default Header;
