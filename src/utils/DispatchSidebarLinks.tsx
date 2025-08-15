import {
    MdDashboard,
    MdLocalShipping,
    MdLocationOn,
    MdAssignment
} from "react-icons/md";
import { BsBoxSeam } from "react-icons/bs";
import { RiBillLine } from "react-icons/ri";
import { FaTruckMoving, FaUsers } from "react-icons/fa";
import { GiCargoShip } from "react-icons/gi";

type DispatchSidebarLinks = {
    key: string;
    icon: React.ReactNode;
    label: string;
    children?: DispatchSidebarLinks[];
};

export const DispatchSidebarLinks: DispatchSidebarLinks[] = [
    {
        key: "/admin/dispatch",
        icon: <MdDashboard />,
        label: "Home",
    },
    {
        key: "/admin/dispatch/goods",
        icon: <BsBoxSeam />,
        label: "Goods",
    },
    {
        key: "/admin/dispatch/cargo",
        icon: <GiCargoShip />,
        label: "Cargo",
    },
    {
        key: "/admin/dispatch/team",
        icon: <FaUsers />,
        label: "Team",
    },
    {
        key: "/admin/dispatch/locate",
        icon: <MdLocationOn />,
        label: "Locate",
    },
    {
        key: "/admin/dispatch/drivers",
        icon: <FaTruckMoving />,
        label: "Drivers",
    },
    {
        key: "/admin/dispatch/totaldispatch",
        icon: <MdLocalShipping />,
        label: "Total Dispatch",
    },
    {
        key: "/admin/dispatch/invoice",
        icon: <RiBillLine />,
        label: "Invoices",
    },
    {
        key: "/admin/dispatch/doc",
        icon: <MdAssignment />,
        label: "Dispatch Docs",
    },
];
