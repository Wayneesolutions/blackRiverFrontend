import React, { useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { HealthSafetySidebarLinks } from "../../utils/HealthSafetySidebarLinks";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import Logo from "../../assets/images/LI.png";
import FullLogo from "../../assets/FleetGo.png";
import { getUserRole, getDashboardRoute } from "../../utils/auth";

interface SidebarProps {
  isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false }) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const navigate = useNavigate();

  const userRole = getUserRole();
  const isSafetyOfficer = userRole === "safety officer";

  /** Active route logic helpers */
  const getBasePath = () => {
    return isSafetyOfficer ? "/healthandsafety" : "/admin/healthandsafety";
  };

  /** Build transformed sidebar links with full paths */
  const sidebarLinks = useMemo(() => {
    const basePath = getBasePath();

    const mapLink = (link: any): any => {
      // Construct full path if key is not absolute
      const fullPath = link.key.startsWith('/')
        ? link.key
        : `${basePath}/${link.key}`;

      const updated = {
        ...link,
        key: fullPath,
      };
      if (link.children) updated.children = link.children.map(mapLink);
      return updated;
    };

    return HealthSafetySidebarLinks.map(mapLink);
  }, [isSafetyOfficer]);

  /** Parent menu toggle */
  const toggleMenu = (key: string) => {
    setOpenMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  /** Active route logic */
  const isActiveLink = (linkKey: string, isActive: boolean, pathname: string) => {
    // Exact match for the base path dashboard/summary
    if (linkKey === getBasePath() + "/health-safety-summary") {
      // Also match root specific routes if needed, or exact logic
      return pathname === getBasePath() || pathname === linkKey;
    }
    return isActive;
  };

  return (
    <>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: #F3F4F6; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #9CA3AF; border-radius: 2px; }
      `}</style>

      <aside
        className={`h-screen flex flex-col bg-card shadow-sm transition-all duration-300 ${isCollapsed ? "w-20" : "w-56"
          }`}
      >
        {/* --- LOGO SECTION --- */}

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

        {/* --- SIDEBAR MENU --- */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#9CA3AF #F3F4F6" }}
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
                          ? "bg-[#42aeec]/10"
                          : "hover:bg-[rgba(255,255,255,0.03)]"
                        }`}
                      title={link.label}
                    >
                      <span
                        className={`${isCollapsed ? "text-2xl" : "text-xl"} ${openMenus.includes(link.key)
                          ? "text-[#42aeec]"
                          : "text-secondary group-hover:text-[#42aeec]"
                          }`}
                      >
                        {link.icon}
                      </span>

                      {!isCollapsed && (
                        <>
                          <span
                            className={`flex-1 text-sm ${openMenus.includes(link.key)
                              ? "text-[#42aeec]"
                              : "text-primary group-hover:text-[#42aeec]"
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
                                  ? "text-[#42aeec] bg-[#42aeec]/10"
                                  : "text-secondary hover:bg-gray-100 hover:text-[#42aeec]"
                                  }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                                {child.label}
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
                      const activeState = isActiveLink(
                        link.key,
                        isActive,
                        pathname
                      );

                      return `transition group ${isCollapsed
                        ? "flex flex-col items-center justify-center px-2 py-2"
                        : "flex items-center px-4 py-2 gap-3"
                        } ${activeState
                          ? "text-[#42aeec] bg-[#42aeec]/10"
                          : "text-secondary hover:bg-[rgba(255,255,255,0.03)] hover:text-[#42aeec]"
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

export default Sidebar;
