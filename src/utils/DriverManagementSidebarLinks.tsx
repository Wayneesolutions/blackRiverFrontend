import {
  MdDashboard, // Home
  MdDocumentScanner, // Documents
  MdAccessTime, // Attendance Tracking
  MdErrorOutline, // Issues
  MdPersonPin, // User Profiles
} from "react-icons/md";
import { FaUsers } from "react-icons/fa"; // Employee List, Vehicle Documents
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
    key: "/admin/Management/drivers",
    icon: <FaUsers />,
    label: "Drivers",
  },
  {
    key: "/admin/Management/employeelist",
    icon: <FaUsers />,
    label: "Employees",
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
    key: "/admin/Management/attendence",
    icon: <MdAccessTime />,
    label: "Attendance Tracking",
  },
  {
    key: "/admin/Management/employee-profiles",
    icon: <MdPersonPin />,
    label: "Employee Portfolio",
  },
  {
    key: "/admin/Management/issues",
    icon: <MdErrorOutline />,
    label: "Issues",
  },
];
