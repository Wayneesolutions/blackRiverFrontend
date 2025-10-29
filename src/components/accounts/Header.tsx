import { useState, useRef, useEffect } from 'react'
import { FaBell, FaCommentDots, FaUserCircle, FaExpand, FaSignOutAlt, FaUser, FaCog } from "react-icons/fa";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";

function Header() {
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
      {/* Left section: Search + Button */}
      <div className="flex items-center flex-1 gap-14 max-w-3xl">
        {/* Quick Action Search */}
        <div className="flex-1 bg-white shadow-[0px_4px_4px_0px_#00000040] rounded-md">
          <input
            type="text"
            placeholder="Quick Action"
            className="w-full rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>

        {/* Dispatch & Load Management Button */}
        <button className="px-4 py-2 rounded-md text-sm bg-gradient-to-r from-gray-200 to-blue-200 shadow-md hover:opacity-90 transition">
          Accounts
        </button>
      </div>

      {/* Right section: Icons */}
      <div className="flex items-center gap-4 ml-4">
        <FaExpand className="cursor-pointer" />
        <FaBell className="cursor-pointer" />
        <FaCommentDots className="cursor-pointer" />
        
        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <FaUserCircle 
            className="cursor-pointer hover:text-blue-600 transition-colors" 
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          />
          
          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                {/* User Info */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userInfo?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{userInfo?.email || ''}</p>
                </div>
<<<<<<< HEAD
                
                {/* Profile Option */}
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  <FaUser className="mr-3 text-gray-400" />
                  Profile
                </button>
                
                {/* Settings Option */}
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  <FaCog className="mr-3 text-gray-400" />
                  Settings
                </button>
                
                {/* Logout Option */}
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FaSignOutAlt className="mr-3 text-red-500" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
=======
    
                {/* Right section: Icons */}
                <div className="flex items-center gap-4 ml-4">
                    <FaBell className="cursor-pointer" />
                    <FaUserCircle className="cursor-pointer" />
                </div>
            </header>
>>>>>>> 74ad69ddfa5b8eb40cd68694e4229f1c25017ff5
  )
}

export default Header