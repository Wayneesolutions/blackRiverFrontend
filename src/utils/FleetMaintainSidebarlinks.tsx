import { MdDashboard, MdErrorOutline} from "react-icons/md"; // Dashboard, Invoices
import { FaTruck,  FaTrailer } from "react-icons/fa"; // Work Orders, Fleet
import { GiGearHammer } from "react-icons/gi"; // Spare Parts Inventory
import { FaWrench, FaTools, FaFileAlt, FaFileInvoiceDollar } from "react-icons/fa"; // New icons
import { RiOilLine } from "react-icons/ri";

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
        key: "/admin/fleetmaintenance/fleet-units",
        icon: <FaTruck />,
        label: "Fleets",
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
    {
        key: "/admin/fleetmaintenance/invoices",
        icon: <FaFileInvoiceDollar />,
        label: "Fleet Invoices",
    },
    {
        key: "/admin/fleetmaintenance/truck-profile",
        icon: <FaTrailer />,
        label: "Truck & Trailer Profile",
    },
    {
        key: "/admin/fleetmaintenance/issues",
        icon: <MdErrorOutline />,
        label: "Issues",
      },
];
