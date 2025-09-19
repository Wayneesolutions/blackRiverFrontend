import { MdDashboard } from "react-icons/md"; // Dashboard
import { FaClipboardList, FaTools, FaTruck } from "react-icons/fa"; // Work Orders, Fleet
import { RiCalendarScheduleFill } from "react-icons/ri"; // Maintenance Schedule
import { GiGearHammer } from "react-icons/gi"; // Spare Parts Inventory
import { HiDocumentReport } from "react-icons/hi"; // Cost Reports

type FleetMaintainSidebarlinks = {
    key: string;
    icon: React.ReactNode;
    label: string;
    children?: FleetMaintainSidebarlinks[];
};

export const FleetMaintainSidebarlinks: FleetMaintainSidebarlinks[] = [
    {
        key: "/admin/fleetmaintenance",
        icon: <MdDashboard />,
        label: "Dashboard",
    },
    {
        key: "/admin/fleetmaintenance/work-orders",
        icon: <FaClipboardList />,
        label: "Work Orders",
    },
    {
        key: "/admin/fleetmaintenance/schedule",
        icon: <RiCalendarScheduleFill />,
        label: "Maintenance Schedule",
    },
    {
        key: "/admin/fleetmaintenance/spare-parts",
        icon: <GiGearHammer />,
        label: "Spare Parts Inventory",
    },
    {
        key: "/admin/fleetmaintenance/cost-reports",
        icon: <HiDocumentReport />,
        label: "Cost Reports",
    },
 
];
