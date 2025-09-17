import {
    MdDashboard,
    MdSettings,
    MdBusiness,
    MdApi,
    MdPeople
} from "react-icons/md";
import { BsPersonVcard } from "react-icons/bs";
import { RiBillLine, RiBarChart2Fill } from "react-icons/ri";
import { HiOutlineUsers } from "react-icons/hi2";

type AdminSidebarLink = {
    key: string;
    icon: React.ReactNode;
    label: string;
    children?: AdminSidebarLink[];
};

export const AdminSidebarLinks: AdminSidebarLink[] = [
    {
        key: "/admin/dashboard",
        icon: <MdDashboard />,
        label: "Home",
    },
    {
        key: "/admin/profile",
        icon: <BsPersonVcard />,
        label: "Profile",
    },
    {
        key: "/admin/member",
        icon: <HiOutlineUsers />,
        label: "Member",
    },
    {
        key: "/admin/slots",
        icon: <RiBarChart2Fill />,
        label: "Slots",
    },
    {
        key: "/admin/invoice",
        icon: <RiBillLine />,
        label: "Invoices",
    },
    {
        key: "/admin/systemsetting",
        icon: <MdSettings />,
        label: "Settings",
        children: [
            {
                key: "/admin/users",
                icon: <MdPeople />,
                label: "User Management",
            },
            {
                key: "/admin/company",
                icon: <MdBusiness />,
                label: "Company Settings",
            },
            {
                key: "/admin/integrations",
                icon: <MdApi />,
                label: "API's",
            }


        ],
    },
];
