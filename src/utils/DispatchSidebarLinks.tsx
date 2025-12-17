import {
  MdDashboard,
  MdEventNote,
  MdContacts,
  MdOutlineMap,
} from "react-icons/md";
import {
  FaTruck,
  FaUserTie,
  FaList,
  FaLayerGroup,
  FaRoute,
} from "react-icons/fa";

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
  }, {
    key: "/admin/dispatch/trips",
    icon: <FaRoute />,
    label: "Trips",
  },
  {
    key: "/admin/dispatch/bulk-order",
    icon: <FaLayerGroup />,
    label: "Bulk Order",
  },

  {
    key: "/admin/dispatch/scheduling",
    icon: <MdEventNote />,
    label: "Trip Scheduling",
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
    label: "Customer",
  },

];
