import {
  MdDashboard,
  MdMiscellaneousServices,
  MdEventNote,
  MdContacts,
  MdOutlineMap,
} from "react-icons/md";
import {
  FaTruck,
  FaUsers,
  FaUserTie,
  FaList,
  FaLayerGroup,
  FaRoute,
} from "react-icons/fa";
import { TbTruckDelivery } from "react-icons/tb";

type DispatchSidebarLinks = {
  key: string;
  icon: React.ReactNode;
  label: string;
  action?: "open-new-order";
};

// Flattened list – removed dropdowns
export const DispatchSidebarLinks: DispatchSidebarLinks[] = [
  {
    key: "/admin/dispatch/dashboard",
    icon: <MdDashboard />,
    label: "Dashboard",
  },
  {
    key: "/admin/dispatch/order-list",
    icon: <FaList />,
    label: "Order List",
  },
  {
    key: "/admin/dispatch/bulk-order",
    icon: <FaLayerGroup />,
    label: "Bulk Order",
  },
  {
    key: "/admin/dispatch/trips",
    icon: <FaRoute />,
    label: "Trips",
  },
  {
    key: "/admin/dispatch/scheduler",
    icon: <MdEventNote />,
    label: "Scheduler",
  },

  // Resources - now flat
  {
    key: "/admin/dispatch/drivers",
    icon: <FaUserTie />,
    label: "Drivers",
  },
  {
    key: "/admin/dispatch/fleets",
    icon: <FaTruck />,
    label: "Fleets",
  },
  {
    key: "/admin/dispatch/contacts",
    icon: <MdContacts />,
    label: "Contacts",
  },
  {
    key: "/admin/dispatch/places",
    icon: <MdOutlineMap />,
    label: "Places",
  },
];
