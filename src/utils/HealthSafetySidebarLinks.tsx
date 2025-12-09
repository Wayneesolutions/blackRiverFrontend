// HealthSafetySidebarLinks.ts (No change needed, it's perfect)
import { MdDashboard } from "react-icons/md";
import { 
    FaExclamationTriangle, 
    FaShieldAlt, 
    FaClipboardList, 
    FaFileAlt, 
    FaUsersCog, 
    FaChartBar,
    FaFileContract // Added for policies to align with dashboard
} from "react-icons/fa";

type HealthSafetySidebarLink = {
    key: string;
    icon: React.ReactNode;
    label: string;
    children?: HealthSafetySidebarLink[];
    action?: string;
};

export const HealthSafetySidebarLinks: HealthSafetySidebarLink[] = [
    {
        key: "health-safety-summary",
        icon: <MdDashboard />,
        label: "Health & Safety Summary",
    },
    {
        key: "incidents-accidents",
        icon: <FaExclamationTriangle />,
        label: "Incidents & Accidents",
    },
    {
        key: "inspections-hazards",
        icon: <FaShieldAlt />,
        label: "Inspections & Hazards",
    },
    {
        key: "training-certificates",
        icon: <FaClipboardList />,
        label: "Training & Certificates",
    },
    {
        // Changed icon to FaFileContract for policy emphasis
        key: "policies-documents",
        icon: <FaFileContract />, 
        label: "Policy & Documents",
    },
    {
        key: "committee-capa",
        icon: <FaUsersCog />,
        label: "H&S Committee & CAPA",
    },
    {
        key: "reports-analytics",
        icon: <FaChartBar />,
        label: "Reports & Analytics",
    }
];