import {
    MdDashboard, // Dashboard icon for Home
} from "react-icons/md";
import { FaUserTie } from "react-icons/fa"; // Employees
import { HiDocumentText } from "react-icons/hi2"; // Documents

type DriverSidebarLink = {
    key: string;
    icon: React.ReactNode;
    label: string;
    children?: DriverSidebarLink[];
};

export const DriverSidebarLinks: DriverSidebarLink[] = [
    {
        key: "/admin/employeeManagement",
        icon: <MdDashboard />,
        label: "Home",
    },
    {
        key: "/admin/employeeManagement/employeelist",
        icon: <FaUserTie />,
        label: "Employees",
    },
    {
        key: "/admin/employeeManagement/documents",
        icon: <HiDocumentText />,
        label: "Documents",
    },
];
