import { useState, useRef, useEffect } from 'react'
import { FaSignOutAlt, FaUser, FaBars, FaCog } from "react-icons/fa";
import { LogOut, AlertCircle, Search } from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import { getUserRole } from "../../utils/auth";

function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { logout } = useLogout();
  const { userInfo } = useSelector((state: RootState) => state.userAuth);
  const navigate = useNavigate();
  const userRole = getUserRole();
  const isHR = userRole === 'hr';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setIsSettingsDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const getProfilePath = () => {
    // HR route is /Management/* due to index.tsx mapping
    // Logic similar to other modules but strictly for HR/DriverMgmt context
    const basePath = isHR ? '/Management' : '/admin/Management';
    return `${basePath}/profile`;
  };

  const handleProfileClick = () => {
    setIsSettingsDropdownOpen(false);
    navigate(getProfilePath());
  };

  const handleSettingsClick = () => {
    setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
  };

  return (
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

      {/* SPACER */}
      <div className="flex-1"></div>


      {/* RIGHT: Search + Profile + Settings + Logout */}
      <div className="flex items-center gap-6">
        {/* Search Button */}
        <button
          className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
        >
          <Search size={20} />
        </button>

        {/* Profile Button / Display */}
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <FaUser size={14} />
          </div>
          <span className="hidden sm:block text-sm font-medium">
            {userInfo?.userData?.name || "User"}
          </span>
        </button>

        {/* Settings Button with Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={handleSettingsClick}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white flex items-center"
          >
            <FaCog size={20} />
          </button>

          {isSettingsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
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

        {/* Logout Button (Standalone) */}
        <button
          onClick={handleLogoutClick}
          className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
        >
          <LogOut size={20} />
        </button>
      </div>

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
    </header>
  )
}

export default Header