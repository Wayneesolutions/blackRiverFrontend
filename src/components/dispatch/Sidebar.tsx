import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { DispatchSidebarLinks } from "../../utils/DispatchSidebarLinks";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

const Sidebar: React.FC = () => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // Toggle expand/collapse for parent menus
  const toggleMenu = (key: string) => {
    setOpenMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Helper function to check if route is active
  const isActiveLink = (linkKey: string, isActive: boolean, pathname: string) => {
    if (linkKey === "/admin/dispatch") {
      return (
        pathname === "/admin/dispatch" ||
        pathname === "/admin/dispatch/dashboard"
      );
    }
    return isActive;
  };

  return (
    <aside className="w-60 h-screen p-3 flex flex-col   overflow-y-auto">
      {/* Logo & status */}
      <div className="flex justify-between items-center bg-white shadow-lg rounded-lg px-4 py-3 mb-4">
        <div className="flex items-center">
          <div>
            <div className="font-semibold">Logistics</div>
            <div className="text-green-500 text-xs font-medium">Active</div>
          </div>
        </div>
        <FaChevronDown className="text-gray-500 cursor-pointer" />
      </div>

      {/* Menu */}
      <nav className="flex-1 bg-white shadow-lg rounded-lg ">
        <ul className="space-y-1 p-2">
          {DispatchSidebarLinks.map((link) => (
            <li key={link.key}>
              {link.children ? (
                <>
                  {/* Parent Menu Item */}
                  <button
                    onClick={() => toggleMenu(link.key)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md text-black hover:bg-[#F2F1FF] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{link.icon}</span>
                      <span>{link.label}</span>
                    </div>
                    {openMenus.includes(link.key) ? (
                      <FaChevronDown className="text-gray-500 text-xs" />
                    ) : (
                      <FaChevronRight className="text-gray-500 text-xs" />
                    )}
                  </button>

                  {/* Child Menu Items */}
                  {openMenus.includes(link.key) && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {link.children.map((child) => (
                        <li key={child.key}>
                          <NavLink
                            to={child.key}
                            className={({ isActive }) => {
                              const pathname = window.location.pathname;
                              const activeState = isActiveLink(
                                child.key,
                                isActive,
                                pathname
                              );
                              return `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                                transition-all duration-200 ease-in-out
                                ${
                                  activeState
                                    ? "bg-purple-50 text-purple-700"
                                    : "text-black hover:bg-[#F2F1FF]"
                                }`;
                            }}
                          >
                            <span className="text-lg">{child.icon}</span>
                            <span>{child.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                // Single Link (no children)
                <NavLink
                  to={link.key}
                  className={({ isActive }) => {
                    const pathname = window.location.pathname;
                    const activeState = isActiveLink(
                      link.key,
                      isActive,
                      pathname
                    );
                    return `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                      transition-all duration-200 ease-in-out
                      ${
                        activeState
                          ? "bg-purple-50 text-purple-700"
                          : "text-black hover:bg-[#F2F1FF]"
                      }`;
                  }}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
