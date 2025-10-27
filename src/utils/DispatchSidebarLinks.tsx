import {
  MdDashboard,
  MdMiscellaneousServices,
  MdEventNote,
  MdSettings,
  MdContacts,
  MdErrorOutline,
  MdPayment,
  MdNotificationsActive,
  MdLocalShipping,
  MdOutlineMap,
} from "react-icons/md";
import {
  FaTruckMoving,
  FaUsers,
  FaMapMarkerAlt,
  FaTrailer,
  FaUserTie,
} from "react-icons/fa";
import { RiOilLine } from "react-icons/ri";
import { GiPathDistance } from "react-icons/gi";
import { TbTruckDelivery, TbReportAnalytics } from "react-icons/tb";
import { IoIosSend } from "react-icons/io";

type DispatchSidebarLinks = {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: DispatchSidebarLinks[];
  action?: "open-new-load";
};

export const DispatchSidebarLinks: DispatchSidebarLinks[] = [
  {
    key: "open-new-load",
    action: "open-new-load",
    icon: <IoIosSend />,
    label: "New Load",
  },
  {
    key: "/admin/dispatch/operations",
    icon: <MdMiscellaneousServices />,
    label: "Operations",
    children: [
      {
        key: "/admin/dispatch/operations/dashboard",
        icon: <MdDashboard />,
        label: "Dashboard",
      },
      {
        key: "/admin/dispatch/operations/service-rates",
        icon: <TbReportAnalytics />,
        label: "Service Rates",
      },
      {
        key: "/admin/dispatch/operations/dispatch",
        icon: <MdLocalShipping />,
        label: "Dispatch",
      },
      {
        key: "/admin/dispatch/operations/scheduler",
        icon: <MdEventNote />,
        label: "Scheduler",
      },
    ],
  },
  {
    key: "/admin/dispatch/resources",
    icon: <FaUsers />,
    label: "Resources",
    children: [
      {
        key: "/admin/dispatch/resources/drivers",
        icon: <FaTruckMoving />,
        label: "Drivers",
      },
      {
        key: "/admin/dispatch/resources/vehicles",
        icon: <TbTruckDelivery />,
        label: "Vehicles",
      },
      {
        key: "/admin/dispatch/resources/trailers",
        icon: <FaTrailer />,
        label: "Trailers",
      },
      {
        key: "/admin/dispatch/resources/fleets",
        icon: <FaUserTie />,
        label: "Fleets",
      },
      {
        key: "/admin/dispatch/resources/vendors",
        icon: <FaUserTie />,
        label: "Vendors",
      },
      {
        key: "/admin/dispatch/resources/contacts",
        icon: <MdContacts />,
        label: "Contacts",
      },
      {
        key: "/admin/dispatch/resources/places",
        icon: <MdOutlineMap />,
        label: "Places",
      },
      {
        key: "/admin/dispatch/resources/fuel-reports",
        icon: <RiOilLine />,
        label: "Fuel Reports",
      },
      {
        key: "/admin/dispatch/resources/issues",
        icon: <MdErrorOutline />,
        label: "Issues",
      },
    ],
  },
  {
    key: "/admin/dispatch/settings",
    icon: <MdSettings />,
    label: "Settings",
    children: [
      {
        key: "/admin/dispatch/settings/navigator-app",
        icon: <IoIosSend />,
        label: "FleetGo Navigator",
      },
      {
        key: "/admin/dispatch/settings/payments",
        icon: <MdPayment />,
        label: "Payments",
      },
      {
        key: "/admin/dispatch/settings/notifications",
        icon: <MdNotificationsActive />,
        label: "Notifications",
      },
      {
        key: "/admin/dispatch/settings/routing",
        icon: <GiPathDistance />,
        label: "Routing",
      },
    ],
  },
];
