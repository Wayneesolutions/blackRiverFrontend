import { MdDashboard } from "react-icons/md"; 
import { 
    FaFileInvoiceDollar, 
    FaMoneyBillWave, 
    FaUserTie, 
    FaChartLine, 
    FaHandshake, 
    FaTools, 
    FaReceipt 
} from "react-icons/fa"; 
import { TbChartArcs } from "react-icons/tb";

type AccountSidebarlinks = {
    key: string;
    icon: React.ReactNode;
    label: string;
    children?: AccountSidebarlinks[];
};

export const AccountSidebarlinks: AccountSidebarlinks[] = [
    {
        key: "/admin/accounts",
        icon: <MdDashboard />,
        label: "Dashboard",
    },

    // NEW — Accounting Config / Accounts Setup
 

    // NEW — Settlements
    {
        key: "/admin/accounts/settlements",
        icon: <FaHandshake />,
        label: "Settlements",
    },

    {
        key: "/admin/accounts/expenses",
        icon: <FaMoneyBillWave />,
        label: "Expense Management",
    },

    {
        key: "/admin/accounts/invoice",
        icon: <FaFileInvoiceDollar />,
        label: "Invoicing",
    },

    {
        key: "/admin/accounts/payroll",
        icon: <FaUserTie />,
        label: "Employees Payroll",
    },

    {
        key: "/admin/accounts/driverpayroll",
        icon: <FaUserTie />,
        label: "Driver Payroll",
    },

    // NEW — Fleet & Maintenance Finance
    {
        key: "/admin/accounts/fleet-maintenance",
        icon: <FaTools />,
        label: "Fleet & Maint. Finance",
    },

    // NEW — Receipts & Financial Notes
    {
        key: "/admin/accounts/receipts-notes",
        icon: <FaReceipt />,
        label: "Receipts & Notes",
    },
   
    {
        key: "/admin/accounts/tax-setup",
        icon: <FaReceipt />,
        label: " Tax Setup & Rate Management",
    },
    {
        key: "/admin/accounts/config",
        icon: <FaChartLine />,
        label: "Accounting Config",
    },
    
];

