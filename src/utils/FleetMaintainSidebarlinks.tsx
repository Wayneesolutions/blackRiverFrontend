import { MdDashboard, MdReceipt } from "react-icons/md"; // Dashboard, Invoices
import { FaClipboardList, FaTruck,FaCar, FaTrailer } from "react-icons/fa"; // Work Orders, Fleet
import { RiCalendarScheduleFill } from "react-icons/ri"; // Maintenance Schedule
import { GiGearHammer } from "react-icons/gi"; // Spare Parts Inventory
import { FaShieldAlt, FaListAlt, FaWrench, FaTools, FaFileAlt } from "react-icons/fa"; // New icons
import { RiOilLine } from "react-icons/ri";

type FleetMaintainSidebarlinks = {
    key: string;
    icon: React.ReactNode;
    label: string;
    children?: FleetMaintainSidebarlinks[];
};

export const FleetMaintainSidebarlinks: FleetMaintainSidebarlinks[] = [

    {
        key: "/admin/fleetmaintenance/compliance-dashboard",
        icon: <MdDashboard />,
        label: "Dashboard",
    },
    {
        key: "/admin/fleetmaintenance/fleet-units",
        icon: <FaTruck />,
        label: "Fleets",
    },
    {
        key: "/admin/fleetmaintenance/vehicle-documents",
        icon: <FaCar />,
        label: "Fleet Documents",
      },
    {
        key: "/admin/fleetmaintenance/scheduled-services-log",
        icon: <FaWrench />,
        label: "Scheduled Services Log",
    },
    {
        key: "/admin/fleetmaintenance/general-repairs-log",
        icon: <FaTools />,
        label: "General Repairs Log",
    },
    {
        key: "/admin/fleetmaintenance/regulatory-safety",
        icon: <FaFileAlt />,
        label: "Regulatory & Safety",
    },

    {
        key: "/admin/fleetmaintenance/spare-parts",
        icon: <GiGearHammer />,
        label: "Spare Parts Inventory",
    },
    {
        key: "/admin/fleetmaintenance/fuel-reports",
        icon: <RiOilLine />,
        label: "Fuel Reports",
    },
];
