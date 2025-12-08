import {
  MdDashboard,            // Home
  MdDocumentScanner,      // Scanning / Document Review
  MdAccessTime,           // Attendance
  MdErrorOutline,         // Issues
  MdPerson,               // Profile / Portfolio
} from "react-icons/md";

import { FaUserTie } from "react-icons/fa";      // Employees
import { FaTruck } from "react-icons/fa";        // Drivers
import { FaIdCard } from "react-icons/fa";       // Driver Portfolio
import { FaFolderOpen } from "react-icons/fa";   // Company Documents
import { FaClipboardList } from "react-icons/fa"; // Employee Documents


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
    icon: <FaTruck />,
    label: "Drivers",
  },
  {
    key: "/admin/Management/employeelist",
    icon: <FaUserTie />,
    label: "Employees",
  },
  {
    key: "/admin/Management/driverdocuments",
    icon: <MdDocumentScanner />,
    label: "Driver Documents",
  },
  {
    key: "/admin/Management/documents",
    icon: <FaClipboardList />,
    label: "Employee Documents",
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
    icon: <MdPerson />,
    label: "Employee Portfolio",
  },
  {
    key: "/admin/Management/driver-profiles",
    icon: <FaIdCard />,
    label: "Driver Portfolio",
  },
  {
    key: "/admin/Management/issues",
    icon: <MdErrorOutline />,
    label: "Issues",
  },
];

