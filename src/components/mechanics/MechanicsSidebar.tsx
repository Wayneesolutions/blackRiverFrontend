import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaClipboardList } from "react-icons/fa";
import Logo from "../../assets/images/LI.png";
import FullLogo from "../../assets/FleetGo.png";
import { getDashboardRoute } from "../../utils/auth";

interface MechanicsSidebarProps {
  isCollapsed?: boolean;
}

const sidebarLinks = [
  {
    key: "/admin/mechanics/orders",
    label: "Orders",
    icon: <FaClipboardList className="text-lg" />,
  },
];

const MechanicsSidebar: React.FC<MechanicsSidebarProps> = ({ isCollapsed = false }) => {
  const navigate = useNavigate();

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
        <div className="flex-shrink-0 flex justify-center items-center py-4 border-b border-gray-200">
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

        <div
          className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#9CA3AF #F3F4F6" }}
        >
          <ul className="space-y-0 py-2">
            {sidebarLinks.map((link) => (
              <li key={link.key}>
                <NavLink
                  to={link.key}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 transition ${
                      isActive ? "bg-[#42aeec]/10 text-[#42aeec]" : "text-gray-600 hover:bg-gray-50 hover:text-[#42aeec]"
                    }`
                  }
                >
                  <span className="text-xl">{link.icon}</span>
                  {!isCollapsed && <span className="text-sm font-medium">{link.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default MechanicsSidebar;

