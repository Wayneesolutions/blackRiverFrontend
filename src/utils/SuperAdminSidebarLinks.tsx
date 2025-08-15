import {
    MdDashboard,
    MdSettings
} from "react-icons/md";
import { FaUserCheck } from "react-icons/fa";
import { BsPersonVcard } from "react-icons/bs";
import { RiBillLine, RiBarChart2Fill } from "react-icons/ri";
import { HiOutlineUsers } from "react-icons/hi2";

type SidebarLink = {
    key: string;
    icon: React.ReactNode;
    label: string;
    children?: SidebarLink[];
};

export const sidebarLinks: SidebarLink[] = [
    {
        key: "/superadmin/dashboard",
        icon: <MdDashboard />,
        label: "Overview",
    },
    {
        key: "adminaccounts",
        icon: <HiOutlineUsers />,
        label: "Admin Accounts",
        children: [
            {
                key: "/superadmin/viewalladmins",
                icon: <BsPersonVcard />,
                label: "View All Admins",
            },
            {
                key: "/superadmin/activateadmin",
                icon: <FaUserCheck />,
                label: "Active/Suspend Admin",
            },
        ],
    },
    {
        key: "/superadmin/billing",
        icon: <RiBillLine />,
        label: "Billing",
    },
    {
        key: "/superadmin/revenue",
        icon: <RiBarChart2Fill />,
        label: "Revenue Generated",
    },
    {
        key: "/superadmin/systemsetting",
        icon: <MdSettings />,
        label: "System Settings",
    },
];
