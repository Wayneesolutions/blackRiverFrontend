import React, { useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { GpsSidebarLinks } from "../../utils/GpsSidebarlinks";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";
import Logo from "../../assets/images/LI.png";
import FullLogo from "../../assets/FleetGo.png";
import { getUserRole, getDashboardRoute } from "../../utils/auth";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false }) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const navigate = useNavigate();

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

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

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
        .sidebar-scroll::-webkit-scrollbar-track { background: #F3F4F6; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #9CA3AF; border-radius: 2px; }
      `}</style>

      <aside
        className={`h-screen flex flex-col bg-white shadow-sm transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-56"
        }`}
      >
        {/* Logo */}
        <div className="flex-shrink-0 flex justify-center items-center py-4 border-b border-gray-200">
          <div
            className="cursor-pointer flex items-center justify-center"
            onClick={() => navigate(getDashboardRoute())}
          >
            {isCollapsed ? (
              <img src={Logo} alt="Logo" className="w-6 h-auto" />
            ) : (
              <img src={FullLogo} alt="Logo" className="max-h-10 h-auto" />
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
                      className={`w-full transition flex items-center justify-start px-4 py-2 gap-3 ${
                        openMenus.includes(link.key) ? "bg-[#42aeec]/10" : "hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`text-xl ${
                          openMenus.includes(link.key)
                            ? "text-[#42aeec]"
                            : "text-gray-600 group-hover:text-[#42aeec]"
                        }`}
                      >
                        {link.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="flex-1 text-sm text-gray-700 text-left">
                          {link.label}
                        </span>
                      )}
                      {!isCollapsed && (
                        <>
                          {openMenus.includes(link.key) ? (
                            <FaChevronDown className="text-xs text-gray-400" />
                          ) : (
                            <FaChevronRight className="text-xs text-gray-400" />
                          )}
                        </>
                      )}
                    </button>

                    {/* Child Links */}
                    {!isCollapsed && openMenus.includes(link.key) && (
                      <ul className="bg-gray-50 ml-6 mt-1 space-y-1">
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
                                className={`flex items-center px-4 py-1 pl-4 text-sm transition ${
                                  activeState
                                    ? "text-[#42aeec] bg-[#42aeec]/10"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-[#42aeec]"
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
                      return `flex items-center justify-start px-4 py-2 gap-3 text-sm transition ${
                        activeState
                          ? "text-[#42aeec] bg-[#42aeec]/10"
                          : "text-gray-600 hover:bg-gray-50 hover:text-[#42aeec]"
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

export default Sidebar;
