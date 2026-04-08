import React, { useState, useCallback, memo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AdminSidebarLinks } from "../../utils/AdminSidebarLinks";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import NewLoad from "../../pages/admin/dispatch/NewLoad";
import Logo from "../../assets/images/LI.png";
import FullLogo from "../../assets/FleetGo.png";
import { getDashboardRoute } from "../../utils/auth";

interface SidebarProps {
  isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false }) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Toggle expand/collapse for parent menus
  const toggleMenu = useCallback((key: string) => {
    setOpenMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  // Helper function to check if route is active
  const isActiveLink = (linkKey: string, isActive: boolean, pathname: string) => {
    // Handle dashboard route (can be index or /admin/dashboard)
    if (linkKey === "dashboard" || linkKey === "/admin/dashboard") {
      return pathname === "/admin/" || pathname === "/admin/dashboard";
    }
    return isActive;
  };

  // Handle link click: either navigate or open drawer
  const handleClick = useCallback((link: any) => {
    if (link.action === "open-new-load") {
      setSidebarOpen(true);
    }
  }, []);

  return (
    <>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: #F3F4F6;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #9CA3AF;
          border-radius: 2px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>

      <aside className={`h-screen flex flex-col bg-[var(--bg-card)] text-[var(--text-primary)] relative z-10 shadow-sm transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-56'
        }`}>
        {/* Logo - fixed at top */}
        <div className="flex-shrink-0 flex justify-center items-center py-4 border-b border-theme">
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

        {/* Menu with scroll */}
        <div
          className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden sidebar-scroll"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#9CA3AF #F3F4F6'
          }}
        >
          <div className="flex-1">
            <ul className="space-y-0 py-2 relative">
              {AdminSidebarLinks.map((link) => (
                <li
                  key={link.key || link.label}
                  className="relative"
                >
                  {link.children ? (
                    // --- PARENT MENU ---
                    <>
                      {/* Parent Menu Item */}
                      <button
                        onClick={() => toggleMenu(link.key)}
                        data-menu-key={link.key}
                        className={`w-full transition-all duration-200 group ${isCollapsed
                          ? 'flex flex-col items-center justify-center px-2 py-2'
                          : 'flex items-center px-4 py-2 gap-3'
                          } ${openMenus.includes(link.key)
                            ? 'bg-[var(--accent-blue)]/10'
                            : 'hover:bg-[rgba(255,255,255,0.03)]'
                          }`}
                        title={link.label}
                      >
                        <span
                          className={`transition-all duration-200 ${isCollapsed ? 'text-2xl mb-1' : 'text-xl flex-shrink-0'
                            } ${openMenus.includes(link.key)
                              ? 'text-[var(--accent-blue)]'
                              : 'text-secondary group-hover:text-[var(--accent-blue)]'
                            }`}
                        >
                          {link.icon}
                        </span>
                        {!isCollapsed && (
                          <>
                            <span className={`flex-1 text-sm font-medium transition-colors text-left ${openMenus.includes(link.key)
                              ? 'text-[var(--accent-blue)]'
                              : 'text-primary group-hover:text-[var(--accent-blue)]'
                              }`}>
                              {link.label}
                            </span>
                            <span className="text-secondary flex-shrink-0">
                              {openMenus.includes(link.key) ? (
                                <FaChevronDown className="text-xs" />
                              ) : (
                                <FaChevronRight className="text-xs" />
                              )}
                            </span>
                          </>
                        )}
                      </button>

                      {/* Expanded children */}
                      {!isCollapsed && openMenus.includes(link.key) && (
                        <ul className="bg-card">
                          {link.children.map((child) => {
                            const pathname = window.location.pathname;
                            const activeState = isActiveLink(
                              child.key,
                              pathname.includes(`/admin/${child.key}`),
                              pathname
                            );
                            return (
                              <li
                                key={child.key}
                                className="border-b border-theme last:border-b-0"
                              >
                                <NavLink
                                  to={`/admin/${child.key}`}
                                  className={`flex items-center px-4 py-2 pl-12 gap-3 text-sm font-medium transition-all duration-200 ease-in-out group ${activeState
                                    ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                                    : "text-secondary hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--accent-blue)]"
                                    }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0"></span>
                                  <span className="flex-1 text-left">{child.label}</span>
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : link.action ? (
                    // --- SPECIAL ACTION (open drawer) ---
                    <button
                      onClick={() => handleClick(link)}
                      className={`w-full transition-all duration-200 group ${isCollapsed
                        ? 'flex flex-col items-center justify-center px-2 py-2'
                        : 'flex items-center px-4 py-2 gap-3'
                        } hover:bg-[rgba(255,255,255,0.03)]`}
                      title={link.label}
                    >
                      <span
                        className={`transition-all duration-200 ${isCollapsed ? 'text-2xl mb-1' : 'text-xl flex-shrink-0'
                          } text-secondary group-hover:text-[var(--accent-blue)]`}
                      >
                        {link.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="flex-1 text-sm font-medium text-primary group-hover:text-[var(--accent-blue)] text-left">
                          {link.label}
                        </span>
                      )}
                    </button>
                  ) : (
                    // --- NORMAL LINK ---
                    <NavLink
                      to={
                        link.key === "dashboard" ? "/admin/" : `/admin/${link.key}`
                      }
                      className={({ isActive }) => {
                        const pathname = window.location.pathname;
                        const activeState = isActiveLink(
                          link.key,
                          isActive,
                          pathname
                        );
                        return `w-full transition-all duration-200 group ${isCollapsed
                          ? 'flex flex-col items-center justify-center px-2 py-2'
                          : 'flex items-center px-4 py-2 gap-3'
                          } ${activeState
                            ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                            : "text-secondary hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--accent-blue)]"
                          }`;
                      }}
                      title={link.label}
                    >
                      {({ isActive }) => {
                        const pathname = window.location.pathname;
                        const activeState = isActiveLink(
                          link.key,
                          isActive,
                          pathname
                        );
                        return (
                          <>
                            <span
                              className={`transition-all duration-200 ${isCollapsed ? 'text-2xl mb-1' : 'text-xl flex-shrink-0'
                                } ${activeState ? 'text-[var(--accent-blue)]' : 'text-secondary group-hover:text-[var(--accent-blue)]'
                                }`}
                            >
                              {link.icon}
                            </span>
                            {!isCollapsed && (
                              <span className={`flex-1 text-sm font-medium text-left ${activeState ? 'text-[var(--accent-blue)]' : 'text-primary group-hover:text-[var(--accent-blue)]'
                                }`}>
                                {link.label}
                              </span>
                            )}
                          </>
                        );
                      }}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
            <div className="h-2"></div>
          </div>
        </div>
      </aside>

      {/* --- Drawer for New Load --- */}
      <div
        className={`fixed top-0 right-0 h-full max-w-5xl w-full bg-[var(--bg-card)] text-[var(--text-primary)] bg-opacity-95 backdrop-blur-xl shadow-2xl transform transition-transform duration-500 ease-out z-[9999] border-l border-theme border-opacity-50 ${sidebarOpen ? "translate-x-0" : "translate-x-full"
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

export default memo(Sidebar);