import { useState, useRef, useEffect } from 'react'
import { FaUserCircle, FaSignOutAlt, FaUser, FaCog } from "react-icons/fa";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import QuickAction from "../common/QuickAction";

function Header() {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useLogout();
  const { userInfo } = useSelector((state: RootState) => state.userAuth);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <header className="flex items-center justify-between px-4 py-4">
      <div className="flex items-center flex-1 gap-14 max-w-3xl">
        <QuickAction />
        <button className="px-4 py-2 rounded-md text-sm bg-gradient-to-r from-gray-200 to-blue-200 shadow-md hover:opacity-90 transition">
          Driver Management
        </button>
      </div>

      <div className="flex items-center gap-4 ml-4 relative">
        <div className="relative" ref={dropdownRef}>
          <FaUserCircle 
            className="cursor-pointer" 
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} 
          />
          
          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {userInfo?.userData?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userInfo?.userData?.email || 'admin@test.com'}
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FaUser size={14} />
                  Profile
                </button>
                <button
                  onClick={handleSettingsClick}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FaCog size={14} />
                  Settings
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
  )
}

export default Header