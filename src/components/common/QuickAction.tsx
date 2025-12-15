
// hooks/useQuickActions.ts
import { Package, DollarSign, FileText, Truck, UserCheck, ShieldCheck, Wrench, Plus, User } from "lucide-react";

export interface QuickActionOption {
    id: string;
    type: 'command' | 'navigation' | 'create' | 'search';
    title: string;
    description: string;
    path?: string;
    icon: React.ReactNode;
    keywords: string[];
    roles?: ('admin' | 'hr' | 'compliance')[];
}


export interface QuickActionOption {
    id: string;
    type: 'command' | 'navigation' | 'create' | 'search';
    title: string;
    description: string;
    path?: string;
    icon: React.ReactNode;
    keywords: string[];
    roles?: ('admin' | 'hr' | 'compliance')[];
}

export const useQuickActions = () => {
    const availableActions: QuickActionOption[] = [
        // Navigation commands - Admin
        {
            id: 'goto-dispatch',
            type: 'navigation',
            title: 'Go to Dispatch',
            description: 'Open dispatch operations',
            path: '/admin/dispatch/operations',
            icon: <Package size={16} />,
            keywords: ['dispatch', 'operations', 'loads', 'delivery'],
            roles: ['admin']
        },
        {
            id: 'goto-drivers',
            type: 'navigation',
            title: 'Go to Drivers',
            description: 'Manage drivers and documents',
            path: '/admin/Management/drivers',
            icon: <User size={16} />,
            keywords: ['drivers', 'driver management', 'employees'],
            roles: ['admin']
        },
        {
            id: 'goto-payroll',
            type: 'navigation',
            title: 'Go to Payroll',
            description: 'View and manage payroll',
            path: '/admin/accounts/payroll',
            icon: <DollarSign size={16} />,
            keywords: ['payroll', 'payment', 'salary', 'wages'],
            roles: ['admin']
        },
        {
            id: 'goto-invoices',
            type: 'navigation',
            title: 'Go to Invoices',
            description: 'Manage invoices',
            path: '/admin/accounts/invoice',
            icon: <FileText size={16} />,
            keywords: ['invoices', 'billing', 'invoicing', 'invoice'],
            roles: ['admin']
        },
        {
            id: 'goto-expenses',
            type: 'navigation',
            title: 'Go to Expenses',
            description: 'Track expenses',
            path: '/admin/accounts/expenses',
            icon: <DollarSign size={16} />,
            keywords: ['expenses', 'spending', 'costs'],
            roles: ['admin']
        },
        {
            id: 'goto-gps',
            type: 'navigation',
            title: 'Go to GPS Tracking',
            description: 'Track vehicles in real-time',
            path: '/admin/gpsvehicle/tracking',
            icon: <Truck size={16} />,
            keywords: ['gps', 'tracking', 'vehicles', 'location'],
            roles: ['admin']
        },
        {
            id: 'goto-compliance',
            type: 'navigation',
            title: 'Go to Compliance',
            description: 'Compliance management',
            path: '/admin/compliance/documents',
            icon: <ShieldCheck size={16} />,
            keywords: ['compliance', 'regulations', 'safety'],
            roles: ['admin']
        },
        {
            id: 'goto-fleet',
            type: 'navigation',
            title: 'Go to Fleet Maintenance',
            description: 'Manage vehicle maintenance',
            path: '/admin/fleetmaintenance/schedule',
            icon: <Wrench size={16} />,
            keywords: ['fleet', 'maintenance', 'vehicles', 'service'],
            roles: ['admin']
        },

        // HR Specific Routes
        {
            id: 'hr-dashboard',
            type: 'navigation',
            title: 'HR Dashboard',
            description: 'Go to HR Dashboard',
            path: '/Management',
            icon: <UserCheck size={16} />,
            keywords: ['dashboard', 'home', 'main'],
            roles: ['hr']
        },
        {
            id: 'hr-drivers',
            type: 'navigation',
            title: 'Drivers',
            description: 'Manage drivers',
            path: '/Management/drivers',
            icon: <Truck size={16} />,
            keywords: ['drivers', 'trucks', 'staff'],
            roles: ['hr']
        },
        {
            id: 'hr-employees',
            type: 'navigation',
            title: 'Employee Directory',
            description: 'View all employees',
            path: '/Management/employeelist',
            icon: <User size={16} />,
            keywords: ['employees', 'staff', 'directory', 'people'],
            roles: ['hr']
        },
        {
            id: 'hr-documents',
            type: 'navigation',
            title: 'Employee Documents',
            description: 'View employee documents',
            path: '/Management/documents',
            icon: <FileText size={16} />,
            keywords: ['documents', 'files', 'paperwork'],
            roles: ['hr']
        },
        {
            id: 'hr-company-documents',
            type: 'navigation',
            title: 'Company Documents',
            description: 'View company documents',
            path: '/Management/company-documents',
            icon: <FileText size={16} />,
            keywords: ['company', 'documents', 'files'],
            roles: ['hr']
        },
        {
            id: 'hr-attendance',
            type: 'navigation',
            title: 'Attendance',
            description: 'View attendance records',
            path: '/Management/attendence',
            icon: <FileText size={16} />,
            keywords: ['attendance', 'time', 'clock'],
            roles: ['hr']
        },
        {
            id: 'hr-employee-profiles',
            type: 'navigation',
            title: 'Employee Portfolio',
            description: 'View employee profiles',
            path: '/Management/employee-profiles',
            icon: <User size={16} />,
            keywords: ['portfolio', 'profiles', 'employee'],
            roles: ['hr']
        },
        {
            id: 'hr-driver-profiles',
            type: 'navigation',
            title: 'Driver Portfolio',
            description: 'View driver profiles',
            path: '/Management/driver-profiles',
            icon: <User size={16} />,
            keywords: ['portfolio', 'profiles', 'driver'],
            roles: ['hr']
        },
        {
            id: 'hr-issues',
            type: 'navigation',
            title: 'Issues',
            description: 'View reported issues',
            path: '/Management/issues',
            icon: <ShieldCheck size={16} />,
            keywords: ['issues', 'problems', 'reports'],
            roles: ['hr']
        },
        {
            id: 'hr-accounts',
            type: 'navigation',
            title: 'Accounts',
            description: 'Go to Accounts',
            path: '/accounts',
            icon: <DollarSign size={16} />,
            keywords: ['accounts', 'finance', 'money'],
            roles: ['hr']
        },

        // Compliance Specific Routes
        {
            id: 'comp-summary',
            type: 'navigation',
            title: 'Compliance Summary',
            description: 'Compliance Dashboard',
            path: '/compliance',
            icon: <ShieldCheck size={16} />,
            keywords: ['compliance', 'summary', 'dashboard'],
            roles: ['compliance']
        },
        {
            id: 'comp-hos',
            type: 'navigation',
            title: 'HOS & ELD',
            description: 'Hours of Service & ELD',
            path: '/compliance/hos-eld',
            icon: <FileText size={16} />,
            keywords: ['hos', 'eld', 'hours', 'service'],
            roles: ['compliance']
        },
        {
            id: 'comp-cvsa',
            type: 'navigation',
            title: 'CVSA Inspection',
            description: 'CVSA Inspection Reports',
            path: '/compliance/cvsa-inspection',
            icon: <ShieldCheck size={16} />,
            keywords: ['cvsa', 'inspection', 'report'],
            roles: ['compliance']
        },
        {
            id: 'comp-monthly',
            type: 'navigation',
            title: 'Monthly Report',
            description: 'View monthly compliance reports',
            path: '/compliance/monthly-report',
            icon: <FileText size={16} />,
            keywords: ['monthly', 'report', 'compliance'],
            roles: ['compliance']
        },
        {
            id: 'comp-tickets',
            type: 'navigation',
            title: 'Tickets',
            description: 'Fines & Penalties',
            path: '/compliance/tickets',
            icon: <FileText size={16} />,
            keywords: ['tickets', 'fines', 'penalties'],
            roles: ['compliance']
        },
        {
            id: 'comp-incidents',
            type: 'navigation',
            title: 'Incidents & Accidents',
            description: 'Reported incidents and accidents',
            path: '/compliance/incidents',
            icon: <ShieldCheck size={16} />,
            keywords: ['incidents', 'accidents', 'crash'],
            roles: ['compliance']
        },
        {
            id: 'comp-profile',
            type: 'navigation',
            title: 'Profile',
            description: 'View Profile',
            path: '/compliance/profile',
            icon: <UserCheck size={16} />,
            keywords: ['profile', 'user'],
            roles: ['compliance']
        },

        // Shared or Profile
        {
            id: 'goto-profile',
            type: 'navigation',
            title: 'Go to My Profile',
            description: 'View your profile',
            path: '/admin/profile', /* Note: Adjust path if HR has different profile path - handled in Profile click but good to have here if searchable */
            icon: <UserCheck size={16} />,
            keywords: ['profile', 'account', 'settings', 'user'],
            roles: ['admin', 'hr']
        },

        // Create commands - Admin Only
        {
            id: 'create-load',
            type: 'create',
            title: 'Create New Load',
            description: 'Add a new delivery load',
            path: '/admin/dispatch/NewLoad',
            icon: <Plus size={16} />,
            keywords: ['create load', 'new load', 'add load'],
            roles: ['admin']
        },
        {
            id: 'create-driver',
            type: 'create',
            title: 'Create New Driver',
            description: 'Add a new driver',
            path: '/admin/Management/drivers',
            icon: <Plus size={16} />,
            keywords: ['create driver', 'new driver', 'add driver'],
            roles: ['admin']
        },
        {
            id: 'create-payroll',
            type: 'create',
            title: 'Create New Payroll',
            description: 'Generate payroll record',
            path: '/admin/accounts/payroll',
            icon: <Plus size={16} />,
            keywords: ['create payroll', 'new payroll', 'generate payroll'],
            roles: ['admin']
        },
        {
            id: 'create-invoice',
            type: 'create',
            title: 'Create New Invoice',
            description: 'Create invoice',
            path: '/admin/accounts/invoice',
            icon: <Plus size={16} />,
            keywords: ['create invoice', 'new invoice'],
            roles: ['admin']
        },
        {
            id: 'create-expense',
            type: 'create',
            title: 'Create New Expense',
            description: 'Record expense',
            path: '/admin/accounts/expenses',
            icon: <Plus size={16} />,
            keywords: ['create expense', 'new expense'],
            roles: ['admin']
        },
    ];

    const filterActions = (query: string, role: 'admin' | 'hr' = 'admin'): QuickActionOption[] => {
        const searchQuery = query.toLowerCase();
        return availableActions.filter(action => {
            // Filter by role
            if (action.roles && !action.roles.includes(role)) {
                return false;
            }

            return action.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery)) ||
                action.title.toLowerCase().includes(searchQuery) ||
                action.description.toLowerCase().includes(searchQuery);
        });
    };

    return {
        availableActions,
        filterActions
    };
};