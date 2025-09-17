// components/admin/Sidebar.tsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { AdminSidebarLinks } from "../../utils/AdminSidebarLinks";
import { FaChevronDown } from "react-icons/fa";
import Logo from "../../assets/FleetGo.png";

const Sidebar: React.FC = () => {
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    const toggleMenu = (key: string) => {
        setOpenKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    return (
        <aside className="w-58 p-3 flex flex-col">
            {/* Logo & status */}
            <div className="flex justify-between items-center bg-white shadow-lg rounded-lg px-4 py-3 mb-4">
                <div className="flex items-center space-x-2">
                    <img src={Logo} alt="FleetGo Logo" className="w-20 h-auto" />
                    <div className="text-green-500 text-xs font-medium">Active</div>
                </div>
                <FaChevronDown className="text-gray-500 cursor-pointer" />
            </div>

            {/* Menu */}
            <nav className="flex-1">
                <ul className="bg-white shadow-lg rounded-lg space-y-2 p-2">
                    {AdminSidebarLinks.map((link) => (
                        <li key={link.key}>
                            {/* Parent Link */}
                            <div
                                className="flex items-center justify-between cursor-pointer px-3 py-2 rounded-md hover:bg-[#F2F1FF]"
                                onClick={() => link.children && toggleMenu(link.key)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{link.icon}</span>
                                    <span>{link.label}</span>
                                </div>
                                {link.children && (
                                    <FaChevronDown
                                        className={`transition-transform duration-200 ${openKeys.includes(link.key) ? "rotate-180" : ""
                                            }`}
                                    />
                                )}
                            </div>

                            {/* Submenu */}
                            {link.children && openKeys.includes(link.key) && (
                                <ul className="ml-8 mt-1 space-y-1">
                                    {link.children.map((child) => (
                                        <li key={child.key}>
                                            <NavLink
                                                to={child.key}
                                                className={({ isActive }) =>
                                                    `block px-3 py-2 text-sm rounded-md transition-all duration-200 ${isActive
                                                        ? "bg-purple-50 text-purple-700"
                                                        : "text-gray-700 hover:bg-[#F2F1FF]"
                                                    }`
                                                }
                                            >
                                                {child.label}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;
