import {
  MdDashboard,
  MdMiscellaneousServices,
  MdEventNote,
  MdContacts,
  MdLocalShipping,
  MdOutlineMap,
} from "react-icons/md";
import {
  FaTruckMoving,
  FaUsers,
  FaTrailer,
  FaUserTie,
  FaTruck,
  FaClipboardCheck,
} from "react-icons/fa";
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
        label: "Available Dispatch",
      },
      {
        key: "/admin/dispatch/operations/all-dispatch",
        icon: <FaTruck />,
        label: "All Dispatch",
      },
      {
        key: "/admin/dispatch/operations/delivery",
        icon: <FaClipboardCheck />,
        label: "Delivery",
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
    ],
  },
];
