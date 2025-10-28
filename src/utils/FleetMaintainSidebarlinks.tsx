import { MdDashboard, MdReceipt } from "react-icons/md"; // Dashboard, Invoices
import { FaClipboardList, FaTruck, FaTrailer } from "react-icons/fa"; // Work Orders, Fleet
import { RiCalendarScheduleFill } from "react-icons/ri"; // Maintenance Schedule
import { GiGearHammer } from "react-icons/gi"; // Spare Parts Inventory

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
        key: "/admin/fleetmaintenance/invoices",
        icon: <MdReceipt />,
        label: "Invoices",
    },
    {
        key: "/admin/fleetmaintenance/trucks",
        icon: <FaTruck />,
        label: "Trucks",
    },
    {
        key: "/admin/fleetmaintenance/trailers",
        icon: <FaTrailer />,
        label: "Trailers",
    },
];
