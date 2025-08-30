import {
  MdDashboard,
  MdMiscellaneousServices
//   MdEventNote,
//   MdBuild,
//   MdContacts,
//   MdErrorOutline,
//   MdPayment,
//   MdNotificationsActive,
//   MdLocalShipping
} from "react-icons/md";
// import { FaTruckMoving, FaUsers, FaMapMarkerAlt } from "react-icons/fa";
// import { RiOilLine } from "react-icons/ri";
// import { GiPathDistance } from "react-icons/gi";
// import { AiOutlineUserSwitch } from "react-icons/ai";
// import { TbTruckDelivery } from "react-icons/tb";
// import { IoIosSend } from "react-icons/io";

type DispatchSidebarLinks = {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: DispatchSidebarLinks[];
  action?: "open-new-load";
};

export const GpsSidebarLinks: DispatchSidebarLinks[] = [

//   {
//     key: "open-new-load",
//     action: "open-new-load",
//     icon: <IoIosSend />,
//     label: "New Load"
//   },
  {
    key: "/admin/gpsvehicle",
    icon: <MdMiscellaneousServices />,
    label: "Dashboard",
  },
  {
    key: "/admin/gpsvehicle/assets",
    icon: <MdMiscellaneousServices />,
    label: "Assets",
  },
  {
    key: "/admin/gpsvehicle/loadmap",
    icon: <MdMiscellaneousServices />,
    label: "Loadmap",
  },
  {
    key: "/admin/gpsvehicle/productivity",
    icon: <MdMiscellaneousServices />,
    label: "Productivity",
    children: [
      {
        key: "/admin/gpsvehicle/productivity/sample",
        icon: <MdDashboard />,
        label: "Dashboard",
      },
      
    ],
  },
  {
    key: "/admin/gpsvehicle/compilance",
    icon: <MdMiscellaneousServices />,
    label: "Compilance",
    children: [
      {
        key: "/admin/gpsvehicle/productivity/compilance",
        icon: <MdDashboard />,
        label: "Compilence",
      },
      
    ],
  },
  {
    key: "/admin/gpsvehicle/safety",
    icon: <MdMiscellaneousServices />,
    label: "Safety",
    children: [
      {
        key: "/admin/gpsvehicle/safety/safety",
        icon: <MdDashboard />,
        label: "safety",
      },
      
    ],
  },
  
  {
    key: "/admin/gpsvehicle/safety",
    icon: <MdMiscellaneousServices />,
    label: "Maintanance",
    children: [
      {
        key: "/admin/gpsvehicle/safety/safety",
        icon: <MdDashboard />,
        label: "safety",
      },
      
    ],
  },
  
  {
    key: "/admin/gpsvehicle/safety",
    icon: <MdMiscellaneousServices />,
    label: "Sustainability",
    children: [
      {
        key: "/admin/gpsvehicle/safety/safety",
        icon: <MdDashboard />,
        label: "safety",
      },
      
    ],
  },
  {
    key: "/admin/gpsvehicle/safety",
    icon: <MdMiscellaneousServices />,
    label: "People",
    children: [
      {
        key: "/admin/gpsvehicle/safety/safety",
        icon: <MdDashboard />,
        label: "safety",
      },
      
    ],
  },
  {
    key: "/admin/gpsvehicle/messages",
    icon: <MdMiscellaneousServices />,
    label: "Messages",
  },
  {
    key: "/admin/gpsvehicle/notifications",
    icon: <MdMiscellaneousServices />,
    label: "Notifications",
  },
  {
    key: "/admin/gpsvehicle/videorecordings",
    icon: <MdMiscellaneousServices />,
    label: "Video Recordings",
  },

  {
    key: "/admin/gpsvehicle/reports",
    icon: <MdMiscellaneousServices />,
    label: "Reports",
    children: [
      {
        key: "/admin/gpsvehicle/safety/safety",
        icon: <MdDashboard />,
        label: "safety",
      },
      
    ],
  },
  {
    key: "/admin/gpsvehicle/groups&rules",
    icon: <MdMiscellaneousServices />,
    label: "Groups & Rules",
    children: [
      {
        key: "/admin/gpsvehicle/safety/safety",
        icon: <MdDashboard />,
        label: "safety",
      },
      
    ],
    
  },
  {
    key: "/admin/gpsvehicle/add-in-management",
    icon: <MdMiscellaneousServices />,
    label: "Add in Management",
    children: [
      {
        key: "/admin/gpsvehicle/safety/safety",
        icon: <MdDashboard />,
        label: "safety",
      },
      
    ],
  },

  {
    key: "/admin/gpsvehicle/support",
    icon: <MdMiscellaneousServices />,
    label: "Support",
    children: [
      {
        key: "/admin/gpsvehicle/safety/safety",
        icon: <MdDashboard />,
        label: "safety",
      },
      
    ],
  },

  {
    key: "/admin/gpsvehicle/system",
    icon: <MdMiscellaneousServices />,
    label: "System",
    children: [
      {
        key: "/admin/gpsvehicle/safety/safety",
        icon: <MdDashboard />,
        label: "safety",
      },
      
    ],
  },
  
  
];
