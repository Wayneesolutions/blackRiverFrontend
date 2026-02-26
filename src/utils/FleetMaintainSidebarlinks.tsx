import { MdDashboard, MdErrorOutline} from "react-icons/md"; // Dashboard, Invoices
import { FaTruck,  FaTrailer, FaGraduationCap } from "react-icons/fa"; // Work Orders, Fleet
import { GiGearHammer } from "react-icons/gi"; // Spare Parts Inventory
import { FaWrench, FaTools, FaFileInvoiceDollar } from "react-icons/fa"; // New icons
import { RiOilLine } from "react-icons/ri";
import { FaWarehouse } from "react-icons/fa"; // Yards

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
        key: "/admin/fleetmaintenance/maintenance-orders-log",
        icon: <FaTools />,
        label: "Maintenance Orders Log",
    },
    // {
    //     key: "/admin/fleetmaintenance/regulatory-safety",
    //     icon: <FaFileAlt />,
    //     label: "Regulatory & Safety",
    // },

    {
        key: "/admin/fleetmaintenance/parts",
        icon: <GiGearHammer />,
        label: "Parts",
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
        key: "/admin/fleetmaintenance/yards",
        icon: <FaWarehouse />,
        label: "Yards",
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
    {
        key: "/admin/fleetmaintenance/training",
        icon: <FaGraduationCap />,
        label: "Training Content",
      },
];
