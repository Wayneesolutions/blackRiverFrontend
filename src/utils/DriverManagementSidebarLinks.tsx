import {
  MdDashboard, // Home
  MdDocumentScanner, // Documents
  MdAccessTime, // Attendance Tracking
  MdErrorOutline, // Issues
} from "react-icons/md";
import { FaUsers } from "react-icons/fa"; // Employee List
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
    key: "/admin/Management/employeelist",
    icon: <FaUsers />,
    label: "Employees",
  },
  {
    key: "/admin/Management/scheduling",
    icon: <RiCalendarScheduleFill />,
    label: "Scheduling",
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
  {
    key: "/admin/Management/issues",
    icon: <MdErrorOutline />,
    label: "Issues",
  },
];
