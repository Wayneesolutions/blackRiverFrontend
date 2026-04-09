import React, { useState, useMemo, useCallback, memo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { GpsSidebarLinks } from "../../utils/GpsSidebarlinks";
import { FaChevronDown, FaChevronRight, FaUser } from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";
import Logo from "../../assets/images/LI.png";
import FullLogo from "../../assets/FleetGo.png";
import { getUserRole, getDashboardRoute } from "../../utils/auth";
import { useSelector, shallowEqual } from "react-redux";
import type { RootState } from "../../redux/store";

interface SidebarProps {
  isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false }) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const navigate = useNavigate();
  const { userInfo } = useSelector((state: RootState) => state.userAuth, shallowEqual);

  const userRole = getUserRole();
  const isDispatcher = userRole === "dispatcher";

  const transformPath = (path: string): string =>
    isDispatcher ? path.replace(/^\/admin\//, "/") : path;

  const sidebarLinks = useMemo(() => {
    const mapLink = (link: any): any => {
      const updated = {
        ...link,
        key: link.action ? link.key : transformPath(link.key),
      };
      if (link.children) updated.children = link.children.map(mapLink);
      return updated;
    };

    const links = GpsSidebarLinks.map(mapLink);

    if (isDispatcher) {
      links.unshift({
        key: "/dispatch",
        icon: <MdLocalShipping />,
        label: "Dispatch",
      });
    }

    return links;
  }, [isDispatcher]);

  const toggleMenu = useCallback((key: string) => {
    setOpenMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const isActiveLink = (linkKey: string, isActive: boolean, pathname: string) => {
    const base = isDispatcher ? "/gpsvehicle" : "/admin/gpsvehicle";
    if (linkKey === base) {
      return pathname === base || pathname === `${base}/dashboard`;
    }
    return isActive;
  };

  return (
    <>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .sidebar-item-active {
          background: linear-gradient(to right, #06377a 0%, #06377a 55%, #121A2B 100%);
          border-radius: 8px;
        }
        .sidebar-item-hover:hover:not(.sidebar-item-active) {
          background: rgba(13, 71, 200, 0.15);
          border-radius: 8px;
        }
        .sidebar-icon-active {
          filter: drop-shadow(0 0 5px rgba(255,255,255,0.7)) brightness(1.3);
        }
      `}</style>

      <aside className={`h-screen flex flex-col bg-[var(--bg-card)] text-[var(--text-primary)] relative z-10 shadow-sm transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-56'}`}>

        {/* Logo */}
        <div className="flex-shrink-0 flex justify-center items-center py-4 border-b border-theme">
          <div
            className="cursor-pointer flex items-center justify-center"
            onClick={() => navigate(getDashboardRoute())}
          >
            {isCollapsed ? (
              <img src={Logo} alt="Logo" className="w-6 h-auto transition-all duration-300" />
            ) : (
              <img src={FullLogo} alt="Logo" className="max-h-10 h-auto transition-all duration-300" />
            )}
          </div>
        </div>

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
          <ul className="py-2">
            {sidebarLinks.map((link) => (
              <li key={link.key || link.label}>
                {link.children ? (
                  <>
                    {/* Parent Item */}
                    <button
                      onClick={() => toggleMenu(link.key)}
                      className={`w-full transition flex items-center justify-start px-4 py-2 gap-3 ${openMenus.includes(link.key) ? "bg-[var(--accent-blue)]/10" : "hover:bg-[rgba(255,255,255,0.03)]"
                        }`}
                    >
                      <span
                        className={`text-xl ${openMenus.includes(link.key)
                            ? "text-[var(--accent-blue)]"
                            : "text-secondary group-hover:text-[var(--accent-blue)]"
                          }`}
                      >
                        <span className={`transition-all duration-200 flex-shrink-0 ${isCollapsed ? 'text-2xl mb-1' : 'text-xl'} ${
                          openMenus.includes(link.key) ? 'text-white sidebar-icon-active' : 'text-secondary group-hover:text-white'
                        }`}>
                          {link.icon}
                        </span>
                        {!isCollapsed && (
                          <>
                            <span className={`flex-1 text-sm font-medium text-left transition-colors ${
                              openMenus.includes(link.key) ? 'text-white' : 'text-primary group-hover:text-white'
                            }`}>
                              {link.label}
                            </span>
                            <span className={`flex-shrink-0 text-xs ${openMenus.includes(link.key) ? 'text-white/70' : 'text-secondary'}`}>
                              {openMenus.includes(link.key) ? <FaChevronDown /> : <FaChevronRight />}
                            </span>
                          </>
                        )}
                      </button>

                    {/* Child Links */}
                    {!isCollapsed && openMenus.includes(link.key) && (
                      <ul className="bg-card ml-6 mt-1 space-y-1">
                        {link.children.map((child: any) => {
                          const pathname = window.location.pathname;
                          const activeState = isActiveLink(
                            child.key,
                            pathname.includes(child.key),
                            pathname
                          );

                          return (
                            <li key={child.key}>
                              <NavLink
                                to={child.key}
                                className={`flex items-center px-4 py-1 pl-4 text-sm transition ${activeState
                                    ? "text-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                                    : "text-secondary hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--accent-blue)]"
                                  }`}
                              >
                                {/* Bullet for sub-menu */}
                                <span className="w-2 h-2 rounded-full bg-gray-400 mr-2 mt-1"></span>
                                {child.label}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  // Normal Link
                  <NavLink
                    to={link.key}
                    className={({ isActive }) => {
                      const pathname = window.location.pathname;
                      const activeState = isActiveLink(link.key, isActive, pathname);
                      return `flex items-center justify-start px-4 py-2 gap-3 text-sm transition ${activeState
                          ? "text-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                          : "text-secondary hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--accent-blue)]"
                        }`;
                    }}
                  >
                    <span className="text-xl">{link.icon}</span>
                    {!isCollapsed && <span className="font-medium text-left">{link.label}</span>}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default memo(Sidebar);
