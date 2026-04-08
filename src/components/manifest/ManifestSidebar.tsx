import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaTruck, FaCaravan, FaIdCard } from "react-icons/fa";
import Logo from "../../assets/images/LI.png";
import FullLogo from "../../assets/FleetGo.png";
import { getDashboardRoute } from "../../utils/auth";

interface ManifestSidebarProps {
  isCollapsed?: boolean;
  basePath?: string;
}

const getSidebarLinks = (basePath: string) => [
  {
    key: `${basePath}/dashboard`,
    label: "Dashboard",
    icon: <FaTachometerAlt className="text-lg" />,
  },
  {
    key: `${basePath}/trucks`,
    label: "Trucks",
    icon: <FaTruck className="text-lg" />,
  },
  {
    key: `${basePath}/trailers`,
    label: "Trailers",
    icon: <FaCaravan className="text-lg" />,
  },
  {
    key: `${basePath}/drivers`,
    label: "Drivers",
    icon: <FaIdCard className="text-lg" />,
  },
];

const ManifestSidebar: React.FC<ManifestSidebarProps> = ({
  isCollapsed = false,
  basePath = "/admin/manifest",
}) => {
  const navigate = useNavigate();
  const sidebarLinks = getSidebarLinks(basePath);

  return (
    <>
      <style>{`
        .manifest-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .manifest-sidebar-scroll::-webkit-scrollbar-track { background: #F3F4F6; }
        .manifest-sidebar-scroll::-webkit-scrollbar-thumb { background: #9CA3AF; border-radius: 2px; }
      `}</style>

      <aside
        className={`h-screen flex flex-col bg-card shadow-sm transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-56"
        }`}
      >
        {/* Logo */}
        <div className="flex-shrink-0 flex justify-center items-center py-4 border-b border-theme">
          <div
            className="cursor-pointer flex items-center justify-center"
            onClick={() => navigate(getDashboardRoute())}
          >
            {isCollapsed ? (
              <img src={Logo} alt="Logo" className="h-auto w-6 transition-all duration-300" />
            ) : (
              <img src={FullLogo} alt="Logo" className="h-auto max-h-10 transition-all duration-300" />
            )}
          </div>
        </div>

        {/* Portal label */}
        {!isCollapsed && (
          <div className="px-4 pt-4 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#42aeec]">
              Manifest Portal
            </span>
          </div>
        )}

        {/* Nav links */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden manifest-sidebar-scroll"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#9CA3AF #F3F4F6" }}
        >
          <ul className="space-y-0 py-2">
            {sidebarLinks.map((link) => (
              <li key={link.key}>
                <NavLink
                  to={link.key}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer select-none ${
                      isActive
                        ? "bg-[#42aeec]/10 text-[#42aeec] border-r-2 border-[#42aeec]"
                        : "text-secondary hover:bg-[rgba(255,255,255,0.03)] hover:text-[#42aeec]"
                    }`
                  }
                >
                  <span className="flex-shrink-0 text-xl">{link.icon}</span>
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{link.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default ManifestSidebar;
