// components/admin/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { AdminSidebarLinks } from "../../utils/AdminSidebarLinks";
import { FaChevronDown } from "react-icons/fa";

const Sidebar: React.FC = () => {
    return (
        <aside className="w-58  p-3 flex flex-col">
            {/* Logo & status */}
            <div className="flex justify-between items-center bg-white shadow-lg rounded-lg px-4 py-3 mb-4">
                {/* Left side: avatar + name */}
                <div className="flex items-center">
                    {/* <img
          src="/logo.png"
          alt="Company Logo"
          className="w-10 h-10 rounded-full mr-3"
        /> */}
                    <div>
                        <div className="font-semibold">Logistics</div>
                        <div className="text-green-500 text-xs font-medium">Active</div>
                    </div>
                </div>

                {/* Right side: dropdown icon */}
                <FaChevronDown className="text-gray-500 cursor-pointer" />
            </div>

            {/* Menu */}
            <nav className="flex-1">
                <ul className="bg-white shadow-lg rounded-lg space-y-2 p-2 ">
                    {AdminSidebarLinks.map((link) => (
                        <li key={link.key}>
                            <NavLink
                                to={link.key}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
             transition-all duration-200 ease-in-out
             ${isActive
                                        ? "bg-purple-50 text-purple-700"
                                        : "text-black hover:bg-[#F2F1FF]"}`
                                }
                            >
                                <span className="text-xl">{link.icon}</span>
                                <span>{link.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>


        </aside>
    );
};

export default Sidebar;
