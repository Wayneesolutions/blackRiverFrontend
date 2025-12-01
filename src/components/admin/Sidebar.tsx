import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AdminSidebarLinks } from "../../utils/AdminSidebarLinks";
import { FaChevronDown, FaChevronRight, FaBars, FaTimes } from "react-icons/fa";
import NewLoad from "../../pages/admin/dispatch/NewLoad";
import Logo from "../../assets/FleetGo.png"
import { FLEET_COLORS } from "../../pages/admin/fleetMaintenance/colorUtils";
import { getDashboardRoute } from "../../utils/auth";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [, setHoveredMenu] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Toggle expand/collapse for parent menus
  const toggleMenu = (key: string) => {
    setOpenMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Helper function to check if route is active
  const isActiveLink = (linkKey: string, isActive: boolean, pathname: string) => {
    // Handle dashboard route (can be index or /admin/dashboard)
    if (linkKey === "dashboard" || linkKey === "/admin/dashboard") {
      return (
        pathname === "/admin/" ||
        pathname === "/admin/dashboard"
      );
    }
    return isActive;
  };

  // Handle link click: either navigate or open drawer
  const handleClick = (link: any) => {
    if (link.action === "open-new-load") {
      setSidebarOpen(true); // 👈 open drawer
    }
  };

  const activeLinkStyle: React.CSSProperties = {
    background: FLEET_COLORS.gradient,
    color: "#fff",
    boxShadow: `0 10px 25px ${FLEET_COLORS.focusRing}`,
    borderLeft: `4px solid ${FLEET_COLORS.primary}`,
  };

  const collapsedIconColor = { color: FLEET_COLORS.light };

  return (
    <>
      <aside
        className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen flex flex-col transition-all duration-300 ease-in-out relative z-10`}
     
      >
        {/* Logo & status - fixed at top */}
        <div
          className="flex-shrink-0 flex justify-between items-center bg-white shadow-lg rounded-xl px-4 py-3 m-3 mb-4 z-10 relative border"
          style={{ borderColor: FLEET_COLORS.focusRing }}
        >
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => navigate(getDashboardRoute())}
          >
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <img src={Logo} alt="FleetGo Logo" className="w-20 h-auto" />
               
              </div>
            )}
            {isCollapsed && (
              <div
                className="text-lg font-bold"
                style={{ color: FLEET_COLORS.light }}
              >
                L
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="cursor-pointer transition-colors p-1 rounded-md"
            style={{ color: FLEET_COLORS.dark }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = FLEET_COLORS.focusRing;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {isCollapsed ? <FaBars size={16} style={collapsedIconColor} /> : <FaTimes size={16} style={collapsedIconColor} />}
          </button>
        </div>

        {/* Menu with independent scroll */}
        <div
          className="flex-1 mx-3 mb-3 bg-white shadow-lg rounded-xl flex flex-col relative overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent border"
          style={{ borderColor: FLEET_COLORS.focusRing }}
        >
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <ul className="space-y-1 p-3 relative">
              {AdminSidebarLinks.map((link) => (
                <li key={link.key || link.label} className="relative">
                  {link.children ? (
                    // --- PARENT MENU (same as before) ---
                    <>
                      {/* Parent Menu Item */}
                      <button
                        onClick={() => !isCollapsed && toggleMenu(link.key)}
                        onMouseEnter={() => isCollapsed && setHoveredMenu(link.key)}
                        onMouseLeave={() => isCollapsed && setHoveredMenu(null)}
                        data-menu-key={link.key}
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group`}
                        style={{
                          color: FLEET_COLORS.dark,
                        }}
                        title={isCollapsed ? link.label : ''}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                          <span className={`${isCollapsed ? 'text-2xl' : 'text-xl'} transition-all duration-200 group-hover:scale-110`}>
                            {link.icon}
                          </span>
                          {!isCollapsed && <span className="font-medium">{link.label}</span>}
                        </div>
                        {!isCollapsed && (
                          <span className="transition-transform duration-200">
                            {openMenus.includes(link.key) ? (
                              <FaChevronDown className="text-gray-400 text-xs" />
                            ) : (
                              <FaChevronRight className="text-gray-400 text-xs" />
                            )}
                          </span>
                        )}
                      </button>

                      {/* Expanded children (unchanged) */}
                      {!isCollapsed && openMenus.includes(link.key) && (
                        <ul
                          className="ml-6 mt-2 space-y-1 border-l-2 pl-4"
                          style={{ borderColor: FLEET_COLORS.focusRing }}
                        >
                          {link.children.map((child) => (
                            <li key={child.key}>
                              <NavLink
                                to={`/admin/${child.key}`}
                                onClick={() => {
                                  console.log('🔗 Sidebar navigation to:', `/admin/${child.key}`);
                                }}
                                className={({ isActive }) => {
                                  const pathname = window.location.pathname;
                                  const activeState = isActiveLink(
                                    child.key,
                                    isActive,
                                    pathname
                                  );
                                  return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out group ${
                                    activeState ? "text-white" : "text-gray-600"
                                  }`;
                                }}
                                style={({ isActive }) => (isActive ? activeLinkStyle : { color: FLEET_COLORS.dark })}
                              >
                                <span className="text-base group-hover:scale-110 transition-transform duration-200">
                                  {child.icon}
                                </span>
                                <span>{child.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : link.action ? (
                    // --- SPECIAL ACTION (open drawer) ---
                    <button
                      onClick={() => handleClick(link)}
                      className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out group`}
                      style={{ color: FLEET_COLORS.dark }}
                      title={isCollapsed ? link.label : ''}
                    >
                      <span className={`${isCollapsed ? 'text-2xl' : 'text-xl'} transition-all duration-200 group-hover:scale-110`}>
                        {link.icon}
                      </span>
                      {!isCollapsed && <span className="font-medium">{link.label}</span>}
                    </button>
                  ) : (
                    // --- NORMAL LINK (same as before) ---
                    <NavLink
                      to={link.key === "dashboard" ? "/admin/" : `/admin/${link.key}`}
                      onClick={() => {
                        const targetPath = link.key === "dashboard" ? "/admin/" : `/admin/${link.key}`;
                        console.log('🔗 Sidebar navigation to:', targetPath);
                      }}
                      className={({ isActive }) => {
                        const pathname = window.location.pathname;
                        const activeState = isActiveLink(
                          link.key,
                          isActive,
                          pathname
                        );
                        return `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out group ${
                          activeState ? "text-white" : "text-gray-700"
                        }`;
                      }}
                      style={({ isActive }) => (isActive ? activeLinkStyle : { color: FLEET_COLORS.dark })}
                      title={isCollapsed ? link.label : ''}
                    >
                      <span className={`${isCollapsed ? 'text-2xl' : 'text-xl'} transition-all duration-200 group-hover:scale-110`} style={collapsedIconColor}>
                        {link.icon}
                      </span>
                      {!isCollapsed && <span className="font-medium">{link.label}</span>}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
            <div className="h-4"></div>
          </div>
        </div>
      </aside>

      {/* --- Drawer for New Load --- */}
      <div
        className={`fixed top-0 right-0 h-full max-w-5xl w-full bg-white bg-opacity-95 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 border-opacity-50 ${sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <NewLoad onClose={() => setSidebarOpen(false)} />
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-gray-900/50 backdrop-blur-sm transition-all duration-500"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
