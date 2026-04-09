import React, { useState, useMemo, useCallback, memo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { DispatchSidebarLinks } from "../../utils/DispatchSidebarLinks";
import { FaChevronDown, FaChevronRight, FaUser } from "react-icons/fa";
import Logo from "../../assets/images/LI.png";
import FullLogo from "../../assets/FleetGo.png";
import { MdOutlineMap } from "react-icons/md";
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

  /** Role-based path transformer */
  const transformPath = (path: string): string =>
    isDispatcher ? path.replace(/^\/admin\//, "/") : path;

  /** Build transformed sidebar links */
  const sidebarLinks = useMemo(() => {
    const mapLink = (link: any): any => {
      const updated = {
        ...link,
        key: link.action ? link.key : transformPath(link.key),
      };
      if (link.children) updated.children = link.children.map(mapLink);
      return updated;
    };

    const links = DispatchSidebarLinks.map(mapLink);

    if (isDispatcher) {
      links.push({
        key: "/gpsvehicle",
        icon: <MdOutlineMap />,
        label: "GPS Vehicle",
      });
    }

    return links;
  }, [isDispatcher]);

  /** Parent menu toggle */
  const toggleMenu = useCallback((key: string) => {
    setOpenMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  /** Active route logic */
  const isActiveLink = (linkKey: string, isActive: boolean, pathname: string) => {
    const base = isDispatcher ? "/dispatch" : "/admin/dispatch";
    if (linkKey === base || linkKey === `${base}/operations`) {
      return pathname === base || pathname === `${base}/operations/dashboard`;
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
              <img src={Logo} alt="FleetGo Logo" className="h-auto w-6 transition-all duration-300" />
            ) : (
              <img src={FullLogo} alt="FleetGo Logo" className="h-auto max-h-10 transition-all duration-300" />
            )}
          </div>
        </div>

        {/* Menu with scroll */}
        <div
          className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden sidebar-scroll min-h-0"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
        >
          <ul className="space-y-0 py-2">
            {sidebarLinks.map((link) => (
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
                          ? "bg-[var(--accent-blue)]/10"
                          : "hover:bg-[rgba(255,255,255,0.03)]"
                        }`}
                      title={link.label}
                    >
                      <span
                        className={`${isCollapsed ? "text-2xl" : "text-xl"} ${openMenus.includes(link.key)
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

                      {!isCollapsed && (
                        <>
                          <span
                            className={`flex-1 text-sm ${openMenus.includes(link.key)
                                ? "text-[var(--accent-blue)]"
                                : "text-primary group-hover:text-[var(--accent-blue)]"
                              }`}
                          >
                            {link.label}
                          </span>

                          {openMenus.includes(link.key) ? (
                            <FaChevronDown className="text-xs text-secondary" />
                          ) : (
                            <FaChevronRight className="text-xs text-secondary" />
                          )}
                        </>
                      )}
                    </button>

                    {/* CHILD LINKS */}
                    {!isCollapsed && openMenus.includes(link.key) && (
                      <ul className="bg-card">
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
                                className={`flex items-center px-4 py-2 pl-12 text-sm transition ${activeState
                                    ? "text-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                                    : "text-secondary hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--accent-blue)]"
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
                                  <span className="flex-1 text-left">{child.label}</span>
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  ) : (
                    /* NORMAL LINK */
                    <NavLink
                      to={link.key}
                      title={link.label}
                      className={({ isActive }) => {
                        const pathname = window.location.pathname;
                        const activeState = isActiveLink(link.key, isActive, pathname);
                        return `w-full transition-all duration-200 group rounded-lg sidebar-item-hover ${
                          isCollapsed
                            ? 'flex flex-col items-center justify-center px-2 py-2'
                            : 'flex items-center px-3 py-2 gap-3'
                        } ${activeState ? 'sidebar-item-active' : ''}`;
                      }}
                    >
                      {({ isActive }) => {
                        const pathname = window.location.pathname;
                        const activeState = isActiveLink(link.key, isActive, pathname);
                        return (
                          <>
                            <span className={`transition-all duration-200 flex-shrink-0 ${isCollapsed ? 'text-2xl mb-1' : 'text-xl'} ${
                              activeState ? 'text-white sidebar-icon-active' : 'text-secondary group-hover:text-white'
                            }`}>
                              {link.icon}
                            </span>
                            {!isCollapsed && (
                              <span className={`flex-1 text-sm font-medium text-left ${
                                activeState ? 'text-white' : 'text-primary group-hover:text-white'
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
          </div>
        </div>

                      return `transition group ${isCollapsed
                          ? "flex flex-col items-center justify-center px-2 py-2"
                          : "flex items-center px-4 py-2 gap-3"
                        } ${activeState
                          ? "text-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                          : "text-secondary hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--accent-blue)]"
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
    </>
  );
};

export default memo(Sidebar);
