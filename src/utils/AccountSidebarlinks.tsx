import { MdDashboard } from "react-icons/md"; // Dashboard
import { FaFileInvoiceDollar, FaMoneyBillWave, FaUserTie } from "react-icons/fa"; 
// Invoice, Expenses, Payroll

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
    {
        key: "/admin/accounts/invoice",
        icon: <FaFileInvoiceDollar />,
        label: "Invoice",
    },
    {
        key: "/admin/accounts/expenses",
        icon: <FaMoneyBillWave />,
        label: "Expenses",
    },
    {
        key: "/admin/accounts/payroll",
        icon: <FaUserTie />,
        label: "Payroll",
    },
];
