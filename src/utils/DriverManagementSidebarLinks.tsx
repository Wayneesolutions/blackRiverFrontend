import {
  MdDashboard, // Home
  MdDocumentScanner, // Documents
  MdAccessTime, // Attendance Tracking
} from "react-icons/md";
import { FaCar, FaUsers } from "react-icons/fa"; // Drivers, Employee List
import { RiCalendarScheduleFill } from "react-icons/ri"; // Scheduling

type DriverSidebarLink = {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: DriverSidebarLink[];
};

export const DriverSidebarLinks: DriverSidebarLink[] = [
  {
    key: "/admin/Management",
    icon: <MdDashboard />,
    label: "Home",
  },
  {
    key: "/admin/Management/drivers",
    icon: <FaCar />,
    label: "Drivers",
  },
  {
    key: "/admin/Management/scheduling",
    icon: <RiCalendarScheduleFill />,
    label: "Scheduling",
  },
  {
    key: "/admin/Management/employeelist",
    icon: <FaUsers />,
    label: "Employee List",
  },
  {
    key: "/admin/Management/documents",
    icon: <MdDocumentScanner />,
    label: "Documents",
  },
  {
    key: "/admin/Management/attendence",
    icon: <MdAccessTime />,
    label: "Attendance Tracking",
  },
];
