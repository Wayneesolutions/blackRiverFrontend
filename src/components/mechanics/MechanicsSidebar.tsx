import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaClipboardList, FaTachometerAlt, FaUser, FaCheckCircle, FaWrench } from "react-icons/fa";
import Logo from "../../assets/images/LI.png";
import FullLogo from "../../assets/FleetGo.png";
import { getDashboardRoute } from "../../utils/auth";

interface MechanicsSidebarProps {
  isCollapsed?: boolean;
  basePath?: string; // "/mechanics" for mechanics user, "/admin/mechanics" for admin
}

const getSidebarLinks = (basePath: string) => [
  {
    key: `${basePath}/dashboard`,
    label: "Dashboard",
    icon: <FaTachometerAlt className="text-lg" />,
  },
  {
    key: `${basePath}/orders`,
    label: "Orders",
    icon: <FaClipboardList className="text-lg" />,
  },
  {
    key: `${basePath}/completed-orders`,
    label: "Completed Orders",
    icon: <FaCheckCircle className="text-lg" />,
  },
  {
    key: `${basePath}/services`,
    label: "Services",
    icon: <FaWrench className="text-lg" />,
  },
  {
    key: `${basePath}/profile`,
    label: "Profile",
    icon: <FaUser className="text-lg" />,
  },
];

const MechanicsSidebar: React.FC<MechanicsSidebarProps> = ({ isCollapsed = false, basePath = "/admin/mechanics" }) => {
  const navigate = useNavigate();
  const sidebarLinks = getSidebarLinks(basePath);

  return (
    <>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: #F3F4F6; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #9CA3AF; border-radius: 2px; }
      `}</style>

      <aside
        className={`h-screen flex flex-col bg-card shadow-sm transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-56"
        }`}
      >
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
                    `flex items-center gap-3 px-4 py-2.5 transition cursor-pointer select-none ${
                      isActive ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]" : "text-secondary hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--accent-blue)]"
                    }`
                  }
                >
                  <span className="flex-shrink-0 text-xl">{link.icon}</span>
                  {!isCollapsed && <span className="text-sm font-medium truncate">{link.label}</span>}
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

