import {
    MdDashboard, // Home
} from "react-icons/md";
import { FaCar } from "react-icons/fa"; // Drivers
import { RiCalendarScheduleFill } from "react-icons/ri"; // Scheduling

type DriverSidebarLink = {
    key: string;
    icon: React.ReactNode;
    label: string;
    children?: DriverSidebarLink[];
};

export const DriverSidebarLinks: DriverSidebarLink[] = [
    {
        key: "/admin/driverManagement",
        icon: <MdDashboard />,
        label: "Home",
    },
    {
        key: "/admin/driverManagement/drivers",
        icon: <FaCar />,
        label: "Drivers",
    },
    {
        key: "/admin/driverManagement/scheduling",
        icon: <RiCalendarScheduleFill />,
        label: "Scheduling",
    },
];
