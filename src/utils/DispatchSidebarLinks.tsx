import {
  MdDashboard,
  MdMiscellaneousServices,
  MdEventNote,
  MdContacts,
  MdOutlineMap,
} from "react-icons/md";
import {
  FaTruckMoving,
  FaUsers,
  FaTrailer,
  FaUserTie,
  FaList,
  FaLayerGroup,
  FaRoute,
} from "react-icons/fa";
import { TbTruckDelivery, TbReportAnalytics } from "react-icons/tb";

type DispatchSidebarLinks = {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: DispatchSidebarLinks[];
  action?: "open-new-order";
};

export const DispatchSidebarLinks: DispatchSidebarLinks[] = [
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
        key: "/admin/dispatch/operations/order-list",
        icon: <FaList />,
        label: "Order List",
      },
      {
        key: "/admin/dispatch/operations/bulk-order",
        icon: <FaLayerGroup />,
        label: "Bulk Order",
      },
      {
        key: "/admin/dispatch/operations/trips",
        icon: <FaRoute />,
        label: "Trips",
      },
      {
        key: "/admin/dispatch/operations/service-rates",
        icon: <TbReportAnalytics />,
        label: "Service Rates",
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
