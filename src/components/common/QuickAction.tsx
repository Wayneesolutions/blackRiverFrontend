
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
}

export const useQuickActions = () => {
    const availableActions: QuickActionOption[] = [
        // Navigation commands
        {
            id: 'goto-dispatch',
            type: 'navigation',
            title: 'Go to Dispatch',
            description: 'Open dispatch operations',
            path: '/admin/dispatch/operations',
            icon: <Package size={16} />,
            keywords: ['dispatch', 'operations', 'loads', 'delivery']
        },
        {
            id: 'goto-drivers',
            type: 'navigation',
            title: 'Go to Drivers',
            description: 'Manage drivers and documents',
            path: '/admin/Management/drivers',
            icon: <User size={16} />,
            keywords: ['drivers', 'driver management', 'employees']
        },
        {
            id: 'goto-payroll',
            type: 'navigation',
            title: 'Go to Payroll',
            description: 'View and manage payroll',
            path: '/admin/accounts/payroll',
            icon: <DollarSign size={16} />,
            keywords: ['payroll', 'payment', 'salary', 'wages']
        },
        {
            id: 'goto-invoices',
            type: 'navigation',
            title: 'Go to Invoices',
            description: 'Manage invoices',
            path: '/admin/accounts/invoice',
            icon: <FileText size={16} />,
            keywords: ['invoices', 'billing', 'invoicing', 'invoice']
        },
        {
            id: 'goto-expenses',
            type: 'navigation',
            title: 'Go to Expenses',
            description: 'Track expenses',
            path: '/admin/accounts/expenses',
            icon: <DollarSign size={16} />,
            keywords: ['expenses', 'spending', 'costs']
        },
        {
            id: 'goto-gps',
            type: 'navigation',
            title: 'Go to GPS Tracking',
            description: 'Track vehicles in real-time',
            path: '/admin/gpsvehicle/tracking',
            icon: <Truck size={16} />,
            keywords: ['gps', 'tracking', 'vehicles', 'location']
        },
        {
            id: 'goto-compliance',
            type: 'navigation',
            title: 'Go to Compliance',
            description: 'Compliance management',
            path: '/admin/compliance/documents',
            icon: <ShieldCheck size={16} />,
            keywords: ['compliance', 'regulations', 'safety']
        },
        {
            id: 'goto-fleet',
            type: 'navigation',
            title: 'Go to Fleet Maintenance',
            description: 'Manage vehicle maintenance',
            path: '/admin/fleetmaintenance/schedule',
            icon: <Wrench size={16} />,
            keywords: ['fleet', 'maintenance', 'vehicles', 'service']
        },
        {
            id: 'goto-profile',
            type: 'navigation',
            title: 'Go to My Profile',
            description: 'View your profile',
            path: '/admin/profile',
            icon: <UserCheck size={16} />,
            keywords: ['profile', 'account', 'settings', 'user']
        },

        // Create commands
        {
            id: 'create-load',
            type: 'create',
            title: 'Create New Load',
            description: 'Add a new delivery load',
            path: '/admin/dispatch/NewLoad',
            icon: <Plus size={16} />,
            keywords: ['create load', 'new load', 'add load']
        },
        {
            id: 'create-driver',
            type: 'create',
            title: 'Create New Driver',
            description: 'Add a new driver',
            path: '/admin/Management/drivers',
            icon: <Plus size={16} />,
            keywords: ['create driver', 'new driver', 'add driver']
        },
        {
            id: 'create-payroll',
            type: 'create',
            title: 'Create New Payroll',
            description: 'Generate payroll record',
            path: '/admin/accounts/payroll',
            icon: <Plus size={16} />,
            keywords: ['create payroll', 'new payroll', 'generate payroll']
        },
        {
            id: 'create-invoice',
            type: 'create',
            title: 'Create New Invoice',
            description: 'Create invoice',
            path: '/admin/accounts/invoice',
            icon: <Plus size={16} />,
            keywords: ['create invoice', 'new invoice']
        },
        {
            id: 'create-expense',
            type: 'create',
            title: 'Create New Expense',
            description: 'Record expense',
            path: '/admin/accounts/expenses',
            icon: <Plus size={16} />,
            keywords: ['create expense', 'new expense']
        },
    ];

    const filterActions = (query: string): QuickActionOption[] => {
        const searchQuery = query.toLowerCase();
        return availableActions.filter(action => {
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