import {
  MdDashboard, // Home
  MdDocumentScanner, // Documents
  MdAccessTime, // Attendance Tracking
  MdErrorOutline, // Issues
  MdPersonPin, // User Profiles
} from "react-icons/md";
import { FaUsers, FaCar } from "react-icons/fa"; // Employee List, Vehicle Documents
import { RiCalendarScheduleFill } from "react-icons/ri"; // Scheduling
import { FaFolderOpen } from "react-icons/fa"; // Company Documents

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
    key: "/admin/Management/company-documents",
    icon: <FaFolderOpen />,
    label: "Company Documents",
  },
  {
    key: "/admin/Management/vehicle-documents",
    icon: <FaCar />,
    label: "Vehicle Documents",
  },
  {
    key: "/admin/Management/attendence",
    icon: <MdAccessTime />,
    label: "Attendance Tracking",
  },
  {
    key: "/admin/Management/user-profiles",
    icon: <MdPersonPin />,
    label: "User Portfolio",
  },
  {
    key: "/admin/Management/issues",
    icon: <MdErrorOutline />,
    label: "Issues",
  },
];
