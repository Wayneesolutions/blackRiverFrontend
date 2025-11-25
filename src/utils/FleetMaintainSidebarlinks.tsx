import { MdDashboard, MdReceipt } from "react-icons/md"; // Dashboard, Invoices
import { FaClipboardList, FaTruck, FaTrailer } from "react-icons/fa"; // Work Orders, Fleet
import { RiCalendarScheduleFill } from "react-icons/ri"; // Maintenance Schedule
import { GiGearHammer } from "react-icons/gi"; // Spare Parts Inventory
import { FaShieldAlt, FaListAlt, FaWrench, FaTools, FaFileAlt } from "react-icons/fa"; // New icons

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
        key: "/admin/fleetmaintenance/compliance-dashboard",
        icon: <FaShieldAlt />,
        label: "Fleet Maintenance Dashboard",
    },
    {
        key: "/admin/fleetmaintenance/fleet-units",
        icon: <FaTruck />,
        label: "Fleets",
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
        key: "/admin/fleetmaintenance/invoices",
        icon: <MdReceipt />,
        label: "Invoices",
    },
];
