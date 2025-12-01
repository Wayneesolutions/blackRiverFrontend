import {
    MdDashboard,
} from "react-icons/md";
import { RiBillLine } from "react-icons/ri";
import { FaClipboardCheck, FaChartBar, FaTicketAlt, FaExclamationTriangle, FaFileInvoiceDollar } from "react-icons/fa";

type CompilanceSidebarLink = {
    key: string;
    icon: React.ReactNode;
    label: string;
    children?: CompilanceSidebarLink[];
    action?: string;
};

export const CompilanceSidebarLinks: CompilanceSidebarLink[] = [
    {
        key: "compilance-summary",
        icon: <MdDashboard />,
        label: "Compilance Summary",
    },
    {
        key: "hos-eld",
        icon: <RiBillLine />,
        label: "HOST & ELD",
    },
    {
        key: "cvsa-inspection",
        icon: <FaClipboardCheck />,
        label: "CVSA Inspection",
    },
    {
        key: "monthly-report",
        icon: <FaChartBar />,
        label: "Monthly Report",
    },
    {
        key: "tickets",
        icon: <FaTicketAlt />,
        label: "Tickets (Fines & Penalties)",
    },
    {
        key: "incidents",
        icon: <FaExclamationTriangle />,
        label: "Incidents & Accidents",
    }
];
