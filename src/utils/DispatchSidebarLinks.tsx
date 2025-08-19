import {
  MdDashboard,
  MdMiscellaneousServices,
  MdEventNote,
  MdBuild,
  MdContacts,
  MdErrorOutline,
  MdPayment,
  MdNotificationsActive,
} from "react-icons/md";
import { FaTruckMoving, FaUsers, FaMapMarkerAlt } from "react-icons/fa";
import { RiOilLine } from "react-icons/ri";
import { GiPathDistance } from "react-icons/gi";
import { AiOutlineUserSwitch } from "react-icons/ai";
import { TbTruckDelivery } from "react-icons/tb";
import { IoIosSend } from "react-icons/io";

type DispatchSidebarLinks = {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: DispatchSidebarLinks[];
};

export const DispatchSidebarLinks: DispatchSidebarLinks[] = [
  {
    key: "/admin/new-load",
    icon: <IoIosSend />,
    label: "New Load",
  },
  {
    key: "/admin/operations",
    icon: <MdMiscellaneousServices />,
    label: "Operations",
    children: [
      {
        key: "/admin/operations/dashboard",
        icon: <MdDashboard />,
        label: "Dashboard",
      },
      {
        key: "/admin/operations/service-rates",
        icon: <MdBuild />,
        label: "Service Rates",
      },
      {
        key: "/admin/operations/scheduler",
        icon: <MdEventNote />,
        label: "Scheduler",
      },
      {
        key: "/admin/operations/order-config",
        icon: <AiOutlineUserSwitch />,
        label: "Order Config",
      },
    ],
  },
  {
    key: "/admin/resources",
    icon: <FaUsers />,
    label: "Resources",
    children: [
      {
        key: "/admin/resources/drivers",
        icon: <FaTruckMoving />,
        label: "Drivers",
      },
      {
        key: "/admin/resources/vehicles",
        icon: <TbTruckDelivery />,
        label: "Vehicles",
      },
      {
        key: "/admin/resources/fleets",
        icon: <FaUsers />,
        label: "Fleets",
      },
      {
        key: "/admin/resources/vendors",
        icon: <MdContacts />,
        label: "Vendors",
      },
      {
        key: "/admin/resources/contacts",
        icon: <MdContacts />,
        label: "Contacts",
      },
      {
        key: "/admin/resources/places",
        icon: <FaMapMarkerAlt />,
        label: "Places",
      },
      {
        key: "/admin/resources/fuel-reports",
        icon: <RiOilLine />,
        label: "Fuel Reports",
      },
      {
        key: "/admin/resources/issues",
        icon: <MdErrorOutline />,
        label: "Issues",
      },
    ],
  },
  {
    key: "/admin/settings",
    icon: <MdBuild />,
    label: "Settings",
    children: [
      {
        key: "/admin/settings/navigator-app",
        icon: <IoIosSend />,
        label: "Navigator App",
      },
      {
        key: "/admin/settings/payments",
        icon: <MdPayment />,
        label: "Payments",
      },
      {
        key: "/admin/settings/notifications",
        icon: <MdNotificationsActive />,
        label: "Notifications",
      },
      {
        key: "/admin/settings/routing",
        icon: <GiPathDistance />,
        label: "Routing",
      },
    ],
  },
];
