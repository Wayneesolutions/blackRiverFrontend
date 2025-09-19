import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, Truck, Wrench, CheckCircle, Filter, Search, Bell, Plus, X, MapPin, User, DollarSign, Settings, FileText, Phone, Mail } from 'lucide-react';

const MaintenanceSchedule = () => {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [showAlertDetails, setShowAlertDetails] = useState(null);

    const [scheduleForm, setScheduleForm] = useState({
        vehicle: '',
        serviceType: '',
        priority: 'medium',
        dueDate: '',
        dueMileage: '',
        assignedMechanic: '',
        estimatedCost: '',
        estimatedTime: '',
        description: '',
        recurringService: false,
        recurringInterval: ''
    });

    // Sample data - simulating backend Vehicle model structure
    const vehicles = [
        {
            id: 'TRUCK-001',
            internalId: 'TRUCK-001',
            plateNumber: 'ABC-1234',
            name: 'ABC-1234',
            type: 'Reefer Truck',
            make: 'Kenworth',
            model: 'T680',
            year: 2021,
            vinNumber: '1XKYDP9X5MJ123456',
            odometer: 44200,
            status: 'moving',
            upcomingServices: [
                {
                    serviceType: 'Oil Change',
                    dueDate: '2025-09-25',
                    dueMileage: 45000,
                    priority: 'medium',
                    status: 'scheduled'
                }
            ]
        },
        {
            id: 'TRUCK-002',
            internalId: 'TRUCK-002',
            plateNumber: 'XYZ-5678',
            name: 'XYZ-5678',
            type: 'Dry Van',
            make: 'Freightliner',
            model: 'Cascadia',
            year: 2020,
            vinNumber: '3AKJHHDR5LSJK1234',
            odometer: 49800,
            status: 'maintenance',
            upcomingServices: [
                {
                    serviceType: 'Safety Inspection',
                    dueDate: '2025-09-20',
                    dueMileage: 50000,
                    priority: 'high',
                    status: 'overdue'
                }
            ]
        },
        {
            id: 'TRUCK-003',
            internalId: 'TRUCK-003',
            plateNumber: 'DEF-9012',
            name: 'DEF-9012',
            type: 'Dry Van',
            make: 'Peterbilt',
            model: '579',
            year: 2019,
            vinNumber: '1XP5DB9X9PD123456',
            odometer: 34900,
            status: 'idle',
            upcomingServices: [
                {
                    serviceType: 'Thermoking Service',
                    dueDate: '2025-09-22',
                    dueMileage: 35000,
                    priority: 'high',
                    status: 'in-progress'
                }
            ]
        },
        {
            id: 'TRAILER-001',
            internalId: 'TRAILER-001',
            plateNumber: 'TRL-0001',
            name: 'TRL-0001',
            type: 'Reefer Trailer',
            make: 'Great Dane',
            model: 'Everest',
            year: 2022,
            vinNumber: '1GRAA9626PE123456',
            odometer: 58500,
            status: 'stopped',
            upcomingServices: [
                {
                    serviceType: 'Tire Rotation',
                    dueDate: '2025-09-28',
                    dueMileage: 60000,
                    priority: 'low',
                    status: 'upcoming'
                }
            ]
        }
    ];

    

    const mechanics = [
        { id: 1, name: 'John Smith', specialty: 'Engine & Transmission' },
        { id: 2, name: 'Mike Johnson', specialty: 'Safety & Inspection' },
        { id: 3, name: 'Sarah Wilson', specialty: 'Tires & Wheels' },
        { id: 4, name: 'Tom Brown', specialty: 'Refrigeration Systems' }
    ];

    const serviceTypes = [
        'Oil Change', 'Safety Inspection', 'Tire Rotation', 'Brake Service',
        'Thermoking Service', 'DOT Inspection', 'Engine Service', 'Transmission Service',
        'General Maintenance', 'Emergency Repair'
    ];

    const upcomingServices = [
        {
            id: 'WO001',
            vehicle: 'TRUCK-001',
            vehicleType: 'Reefer Truck',
            service: 'Oil Change',
            dueDate: '2025-09-25',
            dueKm: '45000',
            currentKm: '44200',
            priority: 'medium',
            status: 'scheduled',
            estimatedTime: '2 hours',
            estimatedCost: '$150',
            mechanic: 'John Smith'
        },
        {
            id: 'WO002',
            vehicle: 'TRUCK-002',
            vehicleType: 'Dry Van',
            service: 'Safety Inspection',
            dueDate: '2025-09-20',
            dueKm: '50000',
            currentKm: '49800',
            priority: 'high',
            status: 'overdue',
            estimatedTime: '4 hours',
            estimatedCost: '$300',
            mechanic: 'Mike Johnson'
        },
        {
            id: 'WO003',
            vehicle: 'TRAILER-001',
            vehicleType: 'Reefer Trailer',
            service: 'Tire Rotation',
            dueDate: '2025-09-28',
            dueKm: '60000',
            currentKm: '58500',
            priority: 'low',
            status: 'upcoming',
            estimatedTime: '1.5 hours',
            estimatedCost: '$100',
            mechanic: 'Sarah Wilson'
        },
        {
            id: 'WO004',
            vehicle: 'TRUCK-003',
            vehicleType: 'Dry Van',
            service: 'Thermoking Service',
            dueDate: '2025-09-22',
            dueKm: '35000',
            currentKm: '34900',
            priority: 'high',
            status: 'in-progress',
            estimatedTime: '3 hours',
            estimatedCost: '$450',
            mechanic: 'Tom Brown'
        }
    ];

    const alerts = [
        {
            id: 1,
            message: 'TRUCK-002 safety inspection overdue by 5 days',
            type: 'critical',
            vehicle: 'TRUCK-002',
            details: {
                vehicleInfo: {
                    id: 'TRUCK-002',
                    type: 'Dry Van',
                    year: '2020',
                    make: 'Freightliner',
                    model: 'Cascadia',
                    vin: '3AKJHHDR5LSJK1234',
                    currentMileage: '49800'
                },
                issue: {
                    serviceType: 'DOT Safety Inspection',
                    originalDueDate: '2025-09-15',
                    daysOverdue: 5,
                    lastInspection: '2024-09-15',
                    nextInspectionDue: '2025-09-15',
                    complianceRisk: 'High - Vehicle not road legal'
                },
                assignedMechanic: {
                    name: 'Mike Johnson',
                    phone: '+1 (555) 123-4567',
                    email: 'mike.johnson@fleetmaint.com',
                    specialty: 'Safety & Inspection'
                },
                estimatedCost: '$300',
                estimatedTime: '4 hours',
                priority: 'Critical',
                location: 'Main Service Bay 2'
            }
        },
        {
            id: 2,
            message: 'Commercial vehicle safety renewal due in 15 days',
            type: 'warning',
            vehicle: 'Multiple Vehicles',
            details: {
                vehicleInfo: {
                    affectedVehicles: ['TRUCK-001', 'TRUCK-003', 'TRAILER-001'],
                    renewalType: 'Annual Commercial Vehicle Safety Certificate'
                },
                issue: {
                    serviceType: 'Safety Certificate Renewal',
                    originalDueDate: '2025-10-04',
                    daysRemaining: 15,
                    lastRenewal: '2024-10-04',
                    complianceRisk: 'Medium - Plan renewal soon'
                },
                estimatedCost: '$450 (3 vehicles)',
                estimatedTime: '6 hours total',
                priority: 'High',
                location: 'External Inspection Station'
            }
        },
        {
            id: 3,
            message: 'Oil change due in 800km for TRUCK-001',
            type: 'info',
            vehicle: 'TRUCK-001',
            details: {
                vehicleInfo: {
                    id: 'TRUCK-001',
                    type: 'Reefer Truck',
                    year: '2021',
                    make: 'Kenworth',
                    model: 'T680',
                    vin: '1XKYDP9X5MJ123456',
                    currentMileage: '44200'
                },
                issue: {
                    serviceType: 'Oil Change Service',
                    originalDueDate: '2025-09-25',
                    dueMileage: '45000',
                    remainingKm: 800,
                    lastService: '2025-07-25',
                    complianceRisk: 'Low - Routine maintenance'
                },
                assignedMechanic: {
                    name: 'John Smith',
                    phone: '+1 (555) 123-4568',
                    email: 'john.smith@fleetmaint.com',
                    specialty: 'Engine & Transmission'
                },
                estimatedCost: '$150',
                estimatedTime: '2 hours',
                priority: 'Medium',
                location: 'Service Bay 1'
            }
        }
    ];

    const getPriorityColor = (priority: any) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusColor = (status: any) => {
        switch (status) {
            case 'overdue': return 'text-red-600 bg-red-100';
            case 'in-progress': return 'text-blue-600 bg-blue-100';
            case 'scheduled': return 'text-purple-600 bg-purple-100';
            case 'upcoming': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const handleFormChange = (field: any, value: any) => {
        setScheduleForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        console.log('New service scheduled:', scheduleForm);
        setShowScheduleForm(false);
        setScheduleForm({
            vehicle: '',
            serviceType: '',
            priority: 'medium',
            dueDate: '',
            dueMileage: '',
            assignedMechanic: '',
            estimatedCost: '',
            estimatedTime: '',
            description: '',
            recurringService: false,
            recurringInterval: ''
        });
    };

    const filteredServices = upcomingServices.filter(service => {
        const matchesFilter = selectedFilter === 'all' || service.status === selectedFilter;
        const matchesSearch = service.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.service.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const AlertDetailsModal = ({ alert, onClose }) => {
        if (!alert) return null;

        return (
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${alert.type === 'critical' ? 'bg-red-100' :
                                alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                                }`}>
                                <AlertTriangle className={`${alert.type === 'critical' ? 'text-red-600' :
                                    alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                                    }`} size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Alert Details</h2>
                                <p className="text-sm text-gray-600 capitalize">{alert.type} Priority</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Alert Message */}
                        <div className={`p-4 rounded-lg border-l-4 ${alert.type === 'critical' ? 'bg-red-50 border-red-500' :
                            alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                                'bg-blue-50 border-blue-500'
                            }`}>
                            <p className={`font-medium ${alert.type === 'critical' ? 'text-red-800' :
                                alert.type === 'warning' ? 'text-yellow-800' :
                                    'text-blue-800'
                                }`}>
                                {alert.message}
                            </p>
                        </div>

                        {/* Vehicle Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Truck size={18} />
                                Vehicle Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {alert.details.vehicleInfo.id && (
                                    <>
                                        <div>
                                            <p className="text-sm text-gray-600">Vehicle ID</p>
                                            <p className="font-medium">{alert.details.vehicleInfo.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Type</p>
                                            <p className="font-medium">{alert.details.vehicleInfo.type}</p>
                                        </div>
                                        {alert.details.vehicleInfo.make && (
                                            <>
                                                <div>
                                                    <p className="text-sm text-gray-600">Make/Model</p>
                                                    <p className="font-medium">{alert.details.vehicleInfo.make} {alert.details.vehicleInfo.model}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Year</p>
                                                    <p className="font-medium">{alert.details.vehicleInfo.year}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Current Mileage</p>
                                                    <p className="font-medium">{alert.details.vehicleInfo.currentMileage} km</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">VIN</p>
                                                    <p className="font-medium font-mono text-xs">{alert.details.vehicleInfo.vin}</p>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                                {alert.details.vehicleInfo.affectedVehicles && (
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-gray-600">Affected Vehicles</p>
                                        <p className="font-medium">{alert.details.vehicleInfo.affectedVehicles.join(', ')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Issue Details */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Settings size={18} />
                                Service Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Service Type</p>
                                    <p className="font-medium">{alert.details.issue.serviceType}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Priority</p>
                                    <p className="font-medium">{alert.details.priority}</p>
                                </div>
                                {alert.details.issue.daysOverdue && (
                                    <div>
                                        <p className="text-sm text-gray-600">Days Overdue</p>
                                        <p className="font-medium text-red-600">{alert.details.issue.daysOverdue} days</p>
                                    </div>
                                )}
                                {alert.details.issue.daysRemaining && (
                                    <div>
                                        <p className="text-sm text-gray-600">Days Remaining</p>
                                        <p className="font-medium text-yellow-600">{alert.details.issue.daysRemaining} days</p>
                                    </div>
                                )}
                                {alert.details.issue.remainingKm && (
                                    <div>
                                        <p className="text-sm text-gray-600">Remaining Distance</p>
                                        <p className="font-medium text-blue-600">{alert.details.issue.remainingKm} km</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-600">Compliance Risk</p>
                                    <p className={`font-medium ${alert.details.issue.complianceRisk.includes('High') ? 'text-red-600' :
                                        alert.details.issue.complianceRisk.includes('Medium') ? 'text-yellow-600' :
                                            'text-green-600'
                                        }`}>
                                        {alert.details.issue.complianceRisk}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Cost & Time */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <DollarSign size={18} />
                                Cost & Time Estimates
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Estimated Cost</p>
                                    <p className="font-medium text-lg">{alert.details.estimatedCost}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Estimated Time</p>
                                    <p className="font-medium">{alert.details.estimatedTime}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Service Location</p>
                                    <p className="font-medium">{alert.details.location}</p>
                                </div>
                            </div>
                        </div>

                        {/* Assigned Mechanic */}
                        {alert.details.assignedMechanic && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <User size={18} />
                                    Assigned Mechanic
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="font-medium">{alert.details.assignedMechanic.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Specialty</p>
                                        <p className="font-medium">{alert.details.assignedMechanic.specialty}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-gray-400" />
                                        <p className="font-medium">{alert.details.assignedMechanic.phone}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-gray-400" />
                                        <p className="font-medium">{alert.details.assignedMechanic.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg transition-colors">
                            Schedule Service
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen  p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Fleet Maintenance Schedule</h1>
                        <button
                            onClick={() => setShowScheduleForm(true)}
                            className="bg-blue-600 hover:bg-blue-700 !text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={20} />
                            Schedule Service
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 p-2 rounded-lg">
                                    <AlertTriangle className="text-red-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Overdue</p>
                                    <p className="text-2xl font-bold text-red-600">1</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-100 p-2 rounded-lg">
                                    <Clock className="text-yellow-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Due This Week</p>
                                    <p className="text-2xl font-bold text-yellow-600">2</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <Wrench className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">In Progress</p>
                                    <p className="text-2xl font-bold text-blue-600">1</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <CheckCircle className="text-green-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Scheduled</p>
                                    <p className="text-2xl font-bold text-green-600">1</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts Section */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <Bell className="text-red-500" size={20} />
                            <h2 className="text-xl font-semibold text-gray-900">Maintenance Alerts</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {alerts.map(alert => (
                                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${alert.type === 'critical' ? 'bg-red-50 border-red-500' :
                                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                                        'bg-blue-50 border-blue-500'
                                    }`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className={`font-medium ${alert.type === 'critical' ? 'text-red-800' :
                                                alert.type === 'warning' ? 'text-yellow-800' :
                                                    'text-blue-800'
                                                }`}>
                                                {alert.message}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">Vehicle: {alert.vehicle}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowAlertDetails(alert)}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <FileText size={14} />
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="flex gap-2">
                                {['all', 'overdue', 'in-progress', 'scheduled', 'upcoming'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setSelectedFilter(filter)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${selectedFilter === filter
                                            ? 'bg-blue-600 !text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {filter === 'all' ? 'All Services' : filter.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search vehicles or services..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Services Table */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Upcoming Services</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vehicle
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Service Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Due Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mileage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Priority
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assigned To
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Est. Cost/Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredServices.map(service => (
                                    <tr key={service.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Truck className="text-gray-400 mr-3" size={20} />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{service.vehicle}</div>
                                                    <div className="text-sm text-gray-500">{service.vehicleType}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{service.service}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Calendar className="text-gray-400 mr-2" size={16} />
                                                <span className="text-sm text-gray-900">{service.dueDate}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {service.currentKm}km / {service.dueKm}km
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${(parseInt(service.currentKm) / parseInt(service.dueKm)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getPriorityColor(service.priority)}`}>
                                                {service.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(service.status)}`}>
                                                {service.status.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {service.mechanic}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{service.estimatedCost}</div>
                                            <div className="text-sm text-gray-500">{service.estimatedTime}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                                            <button className="text-green-600 hover:text-green-900">Complete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Service Tracking Summary */}
                <div className="mt-6 bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Service Tracking Rules</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Automated Reminders</h3>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>• Service reminders every 15,000 km</li>
                                    <li>• Early alerts 5,000 km before due</li>
                                    <li>• Safety expiry notifications (115 days notice)</li>
                                    <li>• Annual commercial vehicle renewals</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Integration Features</h3>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>• Thermoking integration for trailer service</li>
                                    <li>• Invoice upload after service completion</li>
                                    <li>• Owner-operator data synchronization</li>
                                    <li>• Real-time service status updates</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Service Sidebar */}
            {showScheduleForm && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Schedule New Service</h2>
                                <button
                                    onClick={() => setShowScheduleForm(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Vehicle Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Vehicle *
                                    </label>
                                    <select
                                        value={scheduleForm.vehicle}
                                        onChange={(e) => handleFormChange('vehicle', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select a vehicle</option>
                                        {vehicles.map(vehicle => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.name} - {vehicle.type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Service Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Service Type *
                                    </label>
                                    <select
                                        value={scheduleForm.serviceType}
                                        onChange={(e) => handleFormChange('serviceType', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select service type</option>
                                        {serviceTypes.map(service => (
                                            <option key={service} value={service}>
                                                {service}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={scheduleForm.priority}
                                        onChange={(e) => handleFormChange('priority', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Due Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={scheduleForm.dueDate}
                                        onChange={(e) => handleFormChange('dueDate', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Due Mileage */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Due Mileage (km)
                                    </label>
                                    <input
                                        type="number"
                                        value={scheduleForm.dueMileage}
                                        onChange={(e) => handleFormChange('dueMileage', e.target.value)}
                                        placeholder="e.g., 50000"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Assigned Mechanic */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assigned Mechanic
                                    </label>
                                    <select
                                        value={scheduleForm.assignedMechanic}
                                        onChange={(e) => handleFormChange('assignedMechanic', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Auto-assign based on specialty</option>
                                        {mechanics.map(mechanic => (
                                            <option key={mechanic.id} value={mechanic.name}>
                                                {mechanic.name} - {mechanic.specialty}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Estimated Cost */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estimated Cost
                                    </label>
                                    <input
                                        type="text"
                                        value={scheduleForm.estimatedCost}
                                        onChange={(e) => handleFormChange('estimatedCost', e.target.value)}
                                        placeholder="e.g., $150"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Estimated Time */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estimated Time
                                    </label>
                                    <input
                                        type="text"
                                        value={scheduleForm.estimatedTime}
                                        onChange={(e) => handleFormChange('estimatedTime', e.target.value)}
                                        placeholder="e.g., 2 hours"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Service Description
                                    </label>
                                    <textarea
                                        value={scheduleForm.description}
                                        onChange={(e) => handleFormChange('description', e.target.value)}
                                        rows={3}
                                        placeholder="Describe any specific requirements or issues..."
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Recurring Service */}
                                <div>
                                    <div className="flex items-center mb-3">
                                        <input
                                            type="checkbox"
                                            checked={scheduleForm.recurringService}
                                            onChange={(e) => handleFormChange('recurringService', e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label className="ml-2 text-sm font-medium text-gray-700">
                                            Recurring Service
                                        </label>
                                    </div>

                                    {scheduleForm.recurringService && (
                                        <select
                                            value={scheduleForm.recurringInterval}
                                            onChange={(e) => handleFormChange('recurringInterval', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Select interval</option>
                                            <option value="5000km">Every 5,000 km</option>
                                            <option value="10000km">Every 10,000 km</option>
                                            <option value="15000km">Every 15,000 km</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                            <option value="biannual">Every 6 months</option>
                                            <option value="annual">Annually</option>
                                        </select>
                                    )}
                                </div>

                                {/* Form Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowScheduleForm(false)}
                                        className="flex-1 px-4 py-3 !mr-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg transition-colors font-medium"
                                    >
                                        Schedule Service
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Details Modal */}
            <AlertDetailsModal
                alert={showAlertDetails}
                onClose={() => setShowAlertDetails(null)}
            />
        </div>
    );
};

export default MaintenanceSchedule;