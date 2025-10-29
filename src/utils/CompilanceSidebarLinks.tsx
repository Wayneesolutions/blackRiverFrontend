import {
    MdDashboard,
} from "react-icons/md";
import { BsPersonVcard } from "react-icons/bs";
import { RiBillLine } from "react-icons/ri";
import { FaClipboardCheck, FaChartBar, FaTicketAlt } from "react-icons/fa";
import { RiOilLine } from "react-icons/ri";

type CompilanceSidebarLink = {
    key: string;
    icon: React.ReactNode;
    label: string;
    children?: CompilanceSidebarLink[];
};

export const CompilanceSidebarLinks: CompilanceSidebarLink[] = [
    {
        key: "compilance-summary",
        icon: <MdDashboard />,
        label: "Compilance Summary",
    },
    {
        key: "vehicle-documents",
        icon: <BsPersonVcard />,
        label: "Vehicle Documents",
    },
    // {
    //     key: "member",
    //     icon: <HiOutlineUsers />,
    //     label: "Member",
    // },
    // {
    //     key: "slots",
    //     icon: <RiBarChart2Fill />,
    //     label: "Slots",
    // },
    {
        key: "driver-documents",
        icon: <RiBillLine />,
        label: "Driver Documents",
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
        key: "fuel-reports",
        icon: <RiOilLine />,
        label: "Fuel Reports",
    },
];
