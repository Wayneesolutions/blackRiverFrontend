import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Package, DollarSign, FileText, Truck, UserCheck, ShieldCheck, Wrench, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionOption {
    id: string;
    type: 'command' | 'navigation' | 'create' | 'search';
    title: string;
    description: string;
    path?: string;
    icon: React.ReactNode;
    keywords: string[];
}

interface QuickActionProps {
    onActionSelect?: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ onActionSelect }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Define all available actions
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

    // Filter actions based on query
    const filteredActions = availableActions.filter(action => {
        const searchQuery = query.toLowerCase();
        return action.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery)) ||
            action.title.toLowerCase().includes(searchQuery) ||
            action.description.toLowerCase().includes(searchQuery);
    });

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setIsOpen(e.target.value.trim().length > 0);
        setSelectedIndex(0);
    };

    // Handle action selection
    const handleActionSelect = (action: QuickActionOption) => {
        if (action.path) {
            navigate(action.path);
            setQuery('');
            setIsOpen(false);
            if (onActionSelect) {
                onActionSelect();
            }
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || filteredActions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredActions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredActions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                handleActionSelect(filteredActions[selectedIndex]);
                break;
            case 'Escape':
                setIsOpen(false);
                setQuery('');
                inputRef.current?.blur();
                break;
        }
    };

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative flex-1 max-w-xl">
            <div className="bg-[#F4FAFF] rounded-md border border-white/30">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Search size={16} />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Quick Action - Type to search..."
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (query.trim().length > 0) {
                                setIsOpen(true);
                            }
                        }}
                        className="w-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-md"
                    />
                </div>
            </div>

            {/* Dropdown Results */}
            {isOpen && filteredActions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full mt-1.5 w-full bg-white border border-gray-200 rounded-lg shadow-2xl z-50 max-h-[400px] overflow-y-auto"
                >
                    <div className="py-2">
                        {filteredActions.map((action, index) => (
                            <button
                                key={action.id}
                                onClick={() => handleActionSelect(action)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-all duration-150 border-l-2 ${index === selectedIndex
                                        ? 'bg-blue-50 border-blue-500'
                                        : 'border-transparent hover:border-blue-300'
                                    }`}
                            >
                                <div className={`flex-shrink-0 ${index === selectedIndex ? 'scale-110' : ''} transition-transform`}>
                                    <div className={`p-2 rounded-lg ${action.type === 'create' ? 'bg-green-100 text-green-700' :
                                            action.type === 'navigation' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {action.icon}
                                    </div>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900 truncate">{action.title}</span>
                                        {action.type === 'create' && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                                New
                                            </span>
                                        )}
                                        {action.type === 'navigation' && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                                Navigate
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                                        {action.description}
                                    </p>
                                </div>
                                <ArrowRight
                                    className={`flex-shrink-0 transition-all ${index === selectedIndex
                                            ? 'text-blue-600 opacity-100 translate-x-0'
                                            : 'text-gray-400 opacity-0 -translate-x-1'
                                        }`}
                                    size={18}
                                />
                            </button>
                        ))}
                    </div>
                    {filteredActions.length > 0 && (
                        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
                            <p className="text-xs text-gray-500 text-center">
                                {filteredActions.length} result{filteredActions.length !== 1 ? 's' : ''} • Use ↑↓ to navigate, Enter to select
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuickAction;

