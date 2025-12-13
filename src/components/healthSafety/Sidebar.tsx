import React, { useState, useMemo } from 'react'
import { HealthSafetySidebarLinks } from '../../utils/HealthSafetySidebarLinks';
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import Logo from "../../assets/images/LI.png";
import FullLogo from "../../assets/FleetGo.png";
import { getUserRole, getDashboardRoute } from "../../utils/auth";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = getUserRole();

  const transformedLinks = useMemo(() => {
    return HealthSafetySidebarLinks;
  }, []);

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const getBasePath = () => {
    return userRole === 'safety officer' ? '/healthandsafety' : '/admin/healthandsafety';
  };

  const isActiveLink = (linkKey: string, isActive: boolean, pathname: string) => {
    const basePath = getBasePath();
    if (linkKey === 'health-safety-summary') {
      return (
        pathname === basePath ||
        pathname === `${basePath}/` ||
        pathname === `${basePath}/dashboard` ||
        pathname === `${basePath}/health-safety-summary`
      );
    }
    return isActive;
  };

  const handleClick = (link: any) => {
    if (link.action === "open-new-load") {
      setSidebarOpen(true);
    }
  };

  return (
    <>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: #F3F4F6; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #9CA3AF; border-radius: 2px; }
      `}</style>

      <aside
        className={`h-screen flex flex-col bg-white shadow-sm transition-all duration-300 ${isCollapsed ? "w-20" : "w-56"
          }`}
      >
        {/* --- LOGO SECTION --- */}
        <div className="flex-shrink-0 flex justify-center items-center py-4 border-b border-gray-200">
          <div
            className="cursor-pointer flex items-center justify-center"
            onClick={() => navigate(getDashboardRoute())}
          >
            {isCollapsed ? (
              <img
                src={Logo}
                alt="FleetGo Logo"
                className="h-auto w-6 transition-all duration-300"
              />
            ) : (
              <img
                src={FullLogo}
                alt="FleetGo Logo"
                className="h-auto max-h-10 transition-all duration-300"
              />
            )}
          </div>
        </div>

        {/* --- SIDEBAR MENU --- */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#9CA3AF #F3F4F6" }}
        >
          <ul className="space-y-0 py-2">
            {transformedLinks.map((link) => (
              <li key={link.key || link.label}>
                {link.children ? (
                  <>
                    {/* PARENT ITEM */}
                    <button
                      onClick={() => toggleMenu(link.key)}
                      className={`w-full transition group ${isCollapsed
                          ? "flex flex-col items-center justify-center px-2 py-2"
                          : "flex items-center px-4 py-2 gap-3"
                        } ${openMenus.includes(link.key)
                          ? "bg-[#42aeec]/10"
                          : "hover:bg-gray-50"
                        }`}
                      title={link.label}
                    >
                      <span
                        className={`${isCollapsed ? "text-2xl" : "text-xl"} ${openMenus.includes(link.key)
                            ? "text-[#42aeec]"
                            : "text-gray-600 group-hover:text-[#42aeec]"
                          }`}
                      >
                        {link.icon}
                      </span>

                      {!isCollapsed && (
                        <>
                          <span
                            className={`flex-1 text-sm ${openMenus.includes(link.key)
                                ? "text-[#42aeec]"
                                : "text-gray-700 group-hover:text-[#42aeec]"
                              }`}
                          >
                            {link.label}
                          </span>

                          {openMenus.includes(link.key) ? (
                            <FaChevronDown className="text-xs text-gray-400" />
                          ) : (
                            <FaChevronRight className="text-xs text-gray-400" />
                          )}
                        </>
                      )}
                    </button>

                    {/* CHILD LINKS */}
                    {!isCollapsed && openMenus.includes(link.key) && (
                      <ul className="bg-gray-50">
                        {link.children.map((child: any) => {
                          const pathname = location.pathname;
                          const activeState = isActiveLink(
                            child.key,
                            pathname.includes(child.key),
                            pathname
                          );

                          return (
                            <li key={child.key}>
                              <NavLink
                                to={`${getBasePath()}/${child.key}`}
                                className={`flex items-center px-4 py-2 pl-12 text-sm transition ${activeState
                                    ? "text-[#42aeec] bg-[#42aeec]/10"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-[#42aeec]"
                                  }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 mr-2"></span>
                                {child.label}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (link as any).action ? (
                  // --- SPECIAL ACTION (open drawer) ---
                  <button
                    onClick={() => handleClick(link)}
                    className={`w-full transition group ${isCollapsed
                        ? "flex flex-col items-center justify-center px-2 py-2"
                        : "flex items-center px-4 py-2 gap-3"
                      } hover:bg-gray-50`}
                    title={link.label}
                  >
                    <span
                      className={`${isCollapsed ? "text-2xl" : "text-xl"} text-gray-600 group-hover:text-[#42aeec]`}
                    >
                      {link.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="text-sm font-medium text-gray-700 group-hover:text-[#42aeec]">{link.label}</span>
                    )}
                  </button>
                ) : (
                  /* NORMAL LINK */
                  <NavLink
                    to={
                      link.key === 'health-safety-summary'
                        ? getBasePath()
                        : `${getBasePath()}/${link.key}`
                    }
                    title={link.label}
                    className={({ isActive }) => {
                      const pathname = location.pathname;
                      const basePath = getBasePath();
                      const isDashboardActive = link.key === 'health-safety-summary' && (pathname === basePath || pathname === `${basePath}/`);
                      const activeState = isDashboardActive || isActiveLink(
                        link.key,
                        isActive,
                        pathname
                      );

                      return `transition group ${isCollapsed
                          ? "flex flex-col items-center justify-center px-2 py-2"
                          : "flex items-center px-4 py-2 gap-3"
                        } ${activeState
                          ? "text-[#42aeec] bg-[#42aeec]/10"
                          : "text-gray-600 hover:bg-gray-50 hover:text-[#42aeec]"
                        }`;
                    }}
                  >
                    <span className={`${isCollapsed ? "text-2xl" : "text-xl"}`}>
                      {link.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{link.label}</span>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* --- Drawer for New Load --- */}
      <div
        className={`fixed top-0 right-0 h-full max-w-lg w-full sm:w-[42rem] bg-white bg-opacity-95 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-gray-200 border-opacity-50 ${sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Future drawer content */}
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

