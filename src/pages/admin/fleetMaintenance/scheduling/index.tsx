import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, Truck, Wrench, CheckCircle, Search, Bell, Plus, X, FileText } from 'lucide-react';
import { getMaintenanceSchedule, getMaintenanceCostReport } from "../../../../axios/api/fleet.maintenance"

// Type Definitions
interface UpcomingService {
    serviceType: string;
    serviceOdometer: number;
    scheduledDate?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface Vehicle {
    _id: string;
    plateNumber: string;
    make?: string;
    model?: string;
    year?: number;
    vinNumber?: string;
    odometer: number;
    currentOdometer?: number;
    status?: string;
    upcomingServices?: UpcomingService[];
}

interface CostReportItem {
    vehicleId: string;
    plateNumber: string;
    make?: string;
    model?: string;
    year: number;
    month: number;
    totalCost: number;
    avgCost?: number;
    workOrders: number;
}

interface Alert {
    id: string;
    message: string;
    type: 'critical' | 'warning' | 'info';
    vehicle: string;
    details: {
        vehicleInfo: {
            id: string;
            type: string;
            year?: number;
            make?: string;
            model?: string;
            vin?: string;
            currentMileage?: number;
        };
        issue: {
            serviceType: string;
            originalDueDate?: string;
            dueMileage?: number;
            remainingKm?: number;
            complianceRisk: string;
        };
        estimatedCost: string;
        estimatedTime: string;
        priority?: string;
        location: string;
    };
}

interface Service {
    id: string;
    vehicle: string;
    vehicleId: string;
    vehicleType: string;
    service: string;
    dueDate: string;
    dueKm: string;
    currentKm: string;
    priority: string;
    status: string;
    estimatedTime: string;
    estimatedCost: string;
    mechanic: string;
    description: string;
}

const MaintenanceSchedule = () => {
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showScheduleForm, setShowScheduleForm] = useState<boolean>(false);
    const [showAlertDetails, setShowAlertDetails] = useState<Alert | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [costReport, setCostReport] = useState<CostReportItem[]>([]);
    const [selectedYear] = useState<number>(new Date().getFullYear());

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

    // Fetch data on component mount
    useEffect(() => {
        fetchMaintenanceData();
    }, []);

    useEffect(() => {
        if (selectedYear) {
            fetchCostReport();
        }
    }, [selectedYear]);

    const fetchMaintenanceData = async () => {
        setLoading(true);
        try {
            const response = await getMaintenanceSchedule();
            if (response.success) {
                setVehicles(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching maintenance schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCostReport = async () => {
        try {
            const response = await getMaintenanceCostReport({ year: selectedYear });
            if (response.success) {
                setCostReport(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching cost report:', error);
        }
    };

    const mechanics = [
        { id: 1, name: 'John Smith', specialty: 'Engine & Transmission' },
        { id: 2, name: 'Mike Johnson', specialty: 'Safety & Inspection' },
        { id: 3, name: 'Sarah Wilson', specialty: 'Tires & Wheels' },
        { id: 4, name: 'Tom Brown', specialty: 'Refrigeration Systems' }
    ];

    const serviceTypes = [
        'oil_change', 'tire_rotation', 'brake_inspection', 'general_maintenance', 'other'
    ];

    // Generate alerts from vehicle data
    const generateAlerts = (): Alert[] => {
        const alerts: Alert[] = [];
        vehicles.forEach((vehicle: Vehicle) => {
            if (vehicle.upcomingServices && vehicle.upcomingServices.length > 0) {
                vehicle.upcomingServices.forEach((service: UpcomingService) => {
                    const daysUntilService = service.scheduledDate
                        ? Math.ceil((new Date(service.scheduledDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : null;

                    const currentOdo = vehicle.currentOdometer || vehicle.odometer || 0;
                    const kmUntilService = service.serviceOdometer - currentOdo;

                    let alertType: 'critical' | 'warning' | 'info' = 'info';
                    let message = '';

                    if (kmUntilService <= 0) {
                        alertType = 'critical';
                        message = `${vehicle.plateNumber} ${service.serviceType} is overdue`;
                    } else if (kmUntilService < 1000) {
                        alertType = 'warning';
                        message = `${vehicle.plateNumber} ${service.serviceType} due in ${kmUntilService}km`;
                    } else if (daysUntilService && daysUntilService < 15) {
                        alertType = 'warning';
                        message = `${vehicle.plateNumber} ${service.serviceType} due in ${daysUntilService} days`;
                    } else {
                        alertType = 'info';
                        message = `${vehicle.plateNumber} ${service.serviceType} scheduled`;
                    }

                    alerts.push({
                        id: `${vehicle._id}-${service.serviceType}`,
                        message,
                        type: alertType,
                        vehicle: vehicle.plateNumber,
                        details: {
                            vehicleInfo: {
                                id: vehicle.plateNumber,
                                type: vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : 'Unknown',
                                year: vehicle.year,
                                make: vehicle.make,
                                model: vehicle.model,
                                vin: vehicle.vinNumber,
                                currentMileage: currentOdo
                            },
                            issue: {
                                serviceType: service.serviceType,
                                originalDueDate: service.scheduledDate,
                                dueMileage: service.serviceOdometer,
                                remainingKm: kmUntilService,
                                complianceRisk: service.priority === 'urgent' ? 'High' : 'Medium'
                            },
                            estimatedCost: '$150',
                            estimatedTime: '2 hours',
                            priority: service.priority,
                            location: 'Main Service Bay'
                        }
                    });
                });
            }
        });
        return alerts;
    };

    const alerts: Alert[] = generateAlerts();

    // Transform vehicle data to service format
    const upcomingServices: Service[] = vehicles.flatMap((vehicle: Vehicle) => {
        if (!vehicle.upcomingServices || vehicle.upcomingServices.length === 0) return [];

        return vehicle.upcomingServices.map((service: UpcomingService) => {
            const currentOdo = vehicle.currentOdometer || vehicle.odometer || 0;
            const kmUntilService = service.serviceOdometer - currentOdo;
            let status = 'upcoming';

            if (kmUntilService <= 0) {
                status = 'overdue';
            } else if (kmUntilService < 500) {
                status = 'in-progress';
            } else if (service.scheduledDate) {
                status = 'scheduled';
            }

            return {
                id: `${vehicle._id}-${service.serviceType}`,
                vehicle: vehicle.plateNumber,
                vehicleId: vehicle._id,
                vehicleType: vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : 'Unknown',
                service: service.serviceType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                dueDate: service.scheduledDate ? new Date(service.scheduledDate).toISOString().split('T')[0] : 'Not set',
                dueKm: service.serviceOdometer?.toString() || '0',
                currentKm: currentOdo.toString(),
                priority: service.priority || 'medium',
                status,
                estimatedTime: '2 hours',
                estimatedCost: '$150',
                mechanic: 'Auto-assign',
                description: service.description || ''
            };
        });
    });

    // Calculate stats
    const stats = {
        overdue: upcomingServices.filter((s: Service) => s.status === 'overdue').length,
        dueThisWeek: upcomingServices.filter((s: Service) => {
            if (!s.dueDate || s.dueDate === 'Not set') return false;
            const daysUntil = Math.ceil((new Date(s.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 7;
        }).length,
        inProgress: upcomingServices.filter((s: Service) => s.status === 'in-progress').length,
        scheduled: upcomingServices.filter((s: Service) => s.status === 'scheduled').length
    };

    const getPriorityColor = (priority: string): string => {
        switch (priority) {
            case 'high':
            case 'urgent': return 'text-red-600 bg-red-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'overdue': return 'text-red-600 bg-red-100';
            case 'in-progress': return 'text-blue-600 bg-blue-100';
            case 'scheduled': return 'text-purple-600 bg-purple-100';
            case 'upcoming': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const handleFormChange = (field: string, value: string | boolean): void => {
        setScheduleForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        console.log('New service scheduled:', scheduleForm);
        // TODO: Add API call to create new service
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

    const filteredServices = upcomingServices.filter((service: Service) => {
        const matchesFilter = selectedFilter === 'all' || service.status === selectedFilter;
        const matchesSearch = service.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.service.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const AlertDetailsModal = ({ alert, onClose }: { alert: Alert | null; onClose: () => void }) => {
        if (!alert) return null;

        return (
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className={`p-4 rounded-lg border-l-4 ${alert.type === 'critical' ? 'bg-red-50 border-red-500' :
                            alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'
                            }`}>
                            <p className={`font-medium ${alert.type === 'critical' ? 'text-red-800' :
                                alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                                }`}>
                                {alert.message}
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Truck size={18} />
                                Vehicle Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Vehicle ID</p>
                                    <p className="font-medium">{alert.details.vehicleInfo.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Type</p>
                                    <p className="font-medium">{alert.details.vehicleInfo.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Current Mileage</p>
                                    <p className="font-medium">{alert.details.vehicleInfo.currentMileage} km</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                        <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                            Close
                        </button>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            Schedule Service
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Wrench className="animate-spin mx-auto mb-4" size={48} />
                    <p className="text-gray-600">Loading maintenance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Fleet Maintenance Schedule</h1>
                        <button
                            onClick={() => setShowScheduleForm(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={20} />
                            Schedule Service
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 p-2 rounded-lg">
                                    <AlertTriangle className="text-red-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Overdue</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
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
                                    <p className="text-2xl font-bold text-yellow-600">{stats.dueThisWeek}</p>
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
                                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
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
                                    <p className="text-2xl font-bold text-green-600">{stats.scheduled}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {alerts.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <Bell className="text-red-500" size={20} />
                                <h2 className="text-xl font-semibold text-gray-900">Maintenance Alerts</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {alerts.slice(0, 3).map((alert: Alert) => (
                                    <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${alert.type === 'critical' ? 'bg-red-50 border-red-500' :
                                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'
                                        }`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className={`font-medium ${alert.type === 'critical' ? 'text-red-800' :
                                                    alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
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
                )}

                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="flex gap-2 flex-wrap">
                                {['all', 'overdue', 'in-progress', 'scheduled', 'upcoming'].map((filter: string) => (
                                    <button
                                        key={filter}
                                        onClick={() => setSelectedFilter(filter)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${selectedFilter === filter
                                            ? 'bg-blue-600 text-white'
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

                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Upcoming Services ({filteredServices.length})</h2>
                    </div>

                    {filteredServices.length === 0 ? (
                        <div className="p-12 text-center">
                            <Wrench className="mx-auto mb-4 text-gray-400" size={48} />
                            <p className="text-gray-600">No maintenance services scheduled</p>
                            <p className="text-sm text-gray-500 mt-2">Add upcoming services to your vehicles to see them here</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredServices.map((service: Service) => (
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
                                                        style={{ width: `${Math.min((parseInt(service.currentKm) / parseInt(service.dueKm)) * 100, 100)}%` }}
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Cost Report Summary */}
                {costReport.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Maintenance Cost Report - {selectedYear}</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {costReport.map((item: CostReportItem) => (
                                    <div key={`${item.vehicleId}-${item.month}`} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.plateNumber}</p>
                                                <p className="text-sm text-gray-600">Month: {item.month}/{item.year}</p>
                                            </div>
                                            <span className="text-lg font-bold text-blue-600">${item.totalCost.toFixed(2)}</span>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <p>Work Orders: {item.workOrders}</p>
                                            {item.avgCost && <p>Avg Cost: ${item.avgCost.toFixed(2)}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Schedule Service Form Sidebar */}
            {showScheduleForm && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex justify-end">
                    <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Schedule New Service</h2>
                                <button onClick={() => setShowScheduleForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle *</label>
                                    <select
                                        value={scheduleForm.vehicle}
                                        onChange={(e) => handleFormChange('vehicle', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select a vehicle</option>
                                        {vehicles.map((vehicle: Vehicle) => (
                                            <option key={vehicle._id} value={vehicle._id}>
                                                {vehicle.plateNumber} {vehicle.make && vehicle.model ? `- ${vehicle.make} ${vehicle.model}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type *</label>
                                    <select
                                        value={scheduleForm.serviceType}
                                        onChange={(e) => handleFormChange('serviceType', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select service type</option>
                                        {serviceTypes.map((service: string) => (
                                            <option key={service} value={service}>
                                                {service.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                    <select
                                        value={scheduleForm.priority}
                                        onChange={(e) => handleFormChange('priority', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                        <option value="urgent">Urgent Priority</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                                    <input
                                        type="date"
                                        value={scheduleForm.dueDate}
                                        onChange={(e) => handleFormChange('dueDate', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Mileage (km)</label>
                                    <input
                                        type="number"
                                        value={scheduleForm.dueMileage}
                                        onChange={(e) => handleFormChange('dueMileage', e.target.value)}
                                        placeholder="e.g., 50000"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Mechanic</label>
                                    <select
                                        value={scheduleForm.assignedMechanic}
                                        onChange={(e) => handleFormChange('assignedMechanic', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Auto-assign based on specialty</option>
                                        {mechanics.map((mechanic) => (
                                            <option key={mechanic.id} value={mechanic.name}>
                                                {mechanic.name} - {mechanic.specialty}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={scheduleForm.description}
                                        onChange={(e) => handleFormChange('description', e.target.value)}
                                        rows={3}
                                        placeholder="Describe any specific requirements or issues..."
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowScheduleForm(false)}
                                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                                    >
                                        Schedule Service
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <AlertDetailsModal
                alert={showAlertDetails}
                onClose={() => setShowAlertDetails(null)}
            />
        </div>
    );
};

export default MaintenanceSchedule;