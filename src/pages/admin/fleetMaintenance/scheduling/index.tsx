import { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, Truck, Wrench, CheckCircle, Search, Bell, Plus, X, FileText, Edit, Trash2 } from 'lucide-react';
import { getMaintenanceSchedule, getMaintenanceCostReport } from "../../../../axios/api/fleet.maintenance"
import { 
    createVehicleService, 
    updateVehicleService, 
    updateServiceStatus, 
    deleteVehicleService, 
    listVehicleServices,
    type VehicleServiceData,
    type UpdateServiceData,
    type ServiceFilters,
    type VehicleServiceResponse 
} from "../../../../axios/api/vehicleService"

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
    
    // Vehicle Service State
    const [vehicleServices, setVehicleServices] = useState<VehicleServiceResponse[]>([]);
    const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
    const [editingService, setEditingService] = useState<VehicleServiceResponse | null>(null);
    const [serviceFilters, setServiceFilters] = useState<ServiceFilters>({});
    const [servicesLoading, setServicesLoading] = useState<boolean>(false);

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
        fetchVehicleServices();
    }, []);

    // Fetch vehicle services when filters change
    useEffect(() => {
        fetchVehicleServices();
    }, [serviceFilters]);

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

    // ✅ VEHICLE SERVICE API FUNCTIONS
    const fetchVehicleServices = async () => {
        setServicesLoading(true);
        try {
            console.log('🔄 Fetching vehicle services with filters:', serviceFilters);
            const response = await listVehicleServices(serviceFilters);
            if (response?.success) {
                console.log('✅ Vehicle services fetched successfully:', response.data?.length || 0, 'services');
                setVehicleServices(response.data || []);
            } else {
                console.error('❌ Failed to fetch vehicle services:', response?.message);
            }
        } catch (error) {
            console.error('❌ Error fetching vehicle services:', error);
        } finally {
            setServicesLoading(false);
        }
    };

    const createService = async (serviceData: VehicleServiceData) => {
        try {
            const response = await createVehicleService(serviceData);
            if (response?.success) {
                console.log('Service created successfully:', response);
                fetchVehicleServices(); // Refresh the list
                return response;
            } else {
                console.error('Failed to create service:', response?.message);
                return response;
            }
        } catch (error) {
            console.error('Error creating service:', error);
            return null;
        }
    };

    const updateService = async (serviceId: string, updateData: UpdateServiceData) => {
        try {
            const response = await updateVehicleService(serviceId, updateData);
            if (response?.success) {
                console.log('Service updated successfully:', response);
                fetchVehicleServices(); // Refresh the list
                return response;
            } else {
                console.error('Failed to update service:', response?.message);
                return response;
            }
        } catch (error) {
            console.error('Error updating service:', error);
            return null;
        }
    };

    const updateServiceStatusAPI = async (serviceId: string, status: 'pending' | 'in-progress' | 'completed') => {
        try {
            const response = await updateServiceStatus(serviceId, status);
            if (response?.success) {
                console.log('Service status updated successfully:', response);
                fetchVehicleServices(); // Refresh the list
                return response;
            } else {
                console.error('Failed to update service status:', response?.message);
                return response;
            }
        } catch (error) {
            console.error('Error updating service status:', error);
            return null;
        }
    };

    const deleteService = async (serviceId: string) => {
        try {
            const response = await deleteVehicleService(serviceId);
            if (response?.success) {
                console.log('Service deleted successfully:', response);
                fetchVehicleServices(); // Refresh the list
                return response;
            } else {
                console.error('Failed to delete service:', response?.message);
                return response;
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            return null;
        }
    };

    // ✅ SERVICE FORM HANDLERS
    const handleCreateService = async () => {
        if (!scheduleForm.vehicle || !scheduleForm.serviceType || !scheduleForm.dueDate || !scheduleForm.assignedMechanic) {
            console.error('Please fill in all required fields');
            alert('Please fill in all required fields: Vehicle, Service Type, Due Date, and Assigned Mechanic');
            return;
        }

        // Convert service type to correct format (with hyphens)
        const serviceTypeMap: { [key: string]: string } = {
            'oil_change': 'oil-change',
            'tire_rotation': 'tire-rotation', 
            'bike_inspection': 'bike-inspection',
            'general_maintenance': 'general-maintenance',
            'other': 'other'
        };

        const validServiceType = serviceTypeMap[scheduleForm.serviceType] || scheduleForm.serviceType;

        const serviceData: VehicleServiceData = {
            vehicleId: scheduleForm.vehicle,
            serviceType: validServiceType as any,
            priority: scheduleForm.priority as any,
            dueDate: scheduleForm.dueDate,
            dueMileage: parseInt(scheduleForm.dueMileage) || 0,
            assignedMechanic: scheduleForm.assignedMechanic, // This should be an ObjectId string
            description: scheduleForm.description
        };

        console.log('Creating service with data:', serviceData);

        const result = await createService(serviceData);
        if (result?.success) {
            setShowScheduleForm(false);
            // Reset form
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
        } else {
            console.error('Failed to create service:', result?.message);
            alert(`Failed to create service: ${result?.message || 'Unknown error'}`);
        }
    };

    const handleUpdateService = async (serviceId: string) => {
        const updateData: UpdateServiceData = {
            vehicleId: scheduleForm.vehicle,
            serviceType: scheduleForm.serviceType as any,
            priority: scheduleForm.priority as any,
            dueDate: scheduleForm.dueDate,
            dueMileage: parseInt(scheduleForm.dueMileage) || 0,
            assignedMechanic: scheduleForm.assignedMechanic,
            description: scheduleForm.description
        };

        const result = await updateService(serviceId, updateData);
        if (result?.success) {
            setShowScheduleForm(false);
            setEditingService(null);
        }
    };

    const handleEditService = (service: VehicleServiceResponse) => {
        setEditingService(service);
        setScheduleForm({
            vehicle: service.vehicleId?._id || '',
            serviceType: service.serviceType,
            priority: service.priority,
            dueDate: service.dueDate.split('T')[0],
            dueMileage: service.dueMileage.toString(),
            assignedMechanic: service.assignedMechanic?._id || '',
            estimatedCost: '',
            estimatedTime: '',
            description: service.description,
            recurringService: false,
            recurringInterval: ''
        });
        setShowScheduleForm(true);
    };

    const handleStatusChange = async (serviceId: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
        await updateServiceStatusAPI(serviceId, newStatus);
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

    // Calculate stats from actual vehicle services data
    const stats = useMemo(() => {
        console.log('📊 Calculating stats for', vehicleServices.length, 'services');
        
        const overdue = vehicleServices.filter((service: VehicleServiceResponse) => {
            if (!service.dueDate) return false;
            const dueDate = new Date(service.dueDate);
            const today = new Date();
            return dueDate < today && service.status !== 'completed';
        }).length;

        const dueThisWeek = vehicleServices.filter((service: VehicleServiceResponse) => {
            if (!service.dueDate) return false;
            const dueDate = new Date(service.dueDate);
            const today = new Date();
            const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 7 && service.status !== 'completed';
        }).length;

        const inProgress = vehicleServices.filter((service: VehicleServiceResponse) => service.status === 'in-progress').length;
        const scheduled = vehicleServices.filter((service: VehicleServiceResponse) => service.status === 'pending').length;

        console.log('📊 Stats calculated:', { overdue, dueThisWeek, inProgress, scheduled });
        
        return { overdue, dueThisWeek, inProgress, scheduled };
    }, [vehicleServices]);

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        console.log('New service scheduled:', scheduleForm);
        
        if (editingService) {
            // Update existing service
            await handleUpdateService(editingService._id);
        } else {
            // Create new service
            await handleCreateService();
        }
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
                                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className={`font-medium ${alert.type === 'critical' ? 'text-red-800' :
                                                    alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'}`}>
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
                                        required />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Mileage (km)</label>
                                    <input
                                        type="number"
                                        value={scheduleForm.dueMileage}
                                        onChange={(e) => handleFormChange('dueMileage', e.target.value)}
                                        placeholder="e.g., 50000"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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

            {/* ✅ VEHICLE SERVICES SECTION WITH FILTERS */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wrench className="text-blue-500" size={20} />
                            <h2 className="text-xl font-semibold text-gray-900">Vehicle Services</h2>
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {vehicleServices.length} services
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={fetchVehicleServices}
                                disabled={servicesLoading}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <Search size={16} />
                                Refresh
                            </button>
                            <button
                                onClick={() => setShowScheduleForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Plus size={16} />
                                Add Service
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-6 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                            <select
                                value={serviceFilters.status || ''}
                                onChange={(e) => setServiceFilters({ ...serviceFilters, status: e.target.value as any || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority Filter</label>
                            <select
                                value={serviceFilters.priority || ''}
                                onChange={(e) => setServiceFilters({ ...serviceFilters, priority: e.target.value as any || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                            <select
                                value={serviceFilters.serviceType || ''}
                                onChange={(e) => setServiceFilters({ ...serviceFilters, serviceType: e.target.value as any || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Types</option>
                                <option value="oil-change">Oil Change</option>
                                <option value="tire-rotation">Tire Rotation</option>
                                <option value="bike-inspection">Bike Inspection</option>
                                <option value="general-maintenance">General Maintenance</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Filter</label>
                            <select
                                value={serviceFilters.vehicleId || ''}
                                onChange={(e) => setServiceFilters({ ...serviceFilters, vehicleId: e.target.value || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Vehicles</option>
                                {vehicles.map((vehicle: Vehicle) => (
                                    <option key={vehicle._id} value={vehicle._id}>
                                        {vehicle.plateNumber}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mechanic Filter</label>
                            <select
                                value={serviceFilters.mechanic || ''}
                                onChange={(e) => setServiceFilters({ ...serviceFilters, mechanic: e.target.value || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Mechanics</option>
                                {mechanics.map((mechanic: any) => (
                                    <option key={mechanic.id} value={mechanic.name}>
                                        {mechanic.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => setServiceFilters({})}
                                className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Vehicle Services Table */}
                <div className="overflow-x-auto">
                    {servicesLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Loading vehicle services...</span>
                        </div>
                    ) : vehicleServices.length === 0 ? (
                        <div className="text-center py-8">
                            <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicle services found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {Object.keys(serviceFilters).length > 0
                                    ? "Try adjusting your filters or create a new service."
                                    : "Get started by creating a new vehicle service."}
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowScheduleForm(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Create Service
                                </button>
                            </div>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Mechanic</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vehicleServices.map((service: VehicleServiceResponse) => (
                                    <tr key={service._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Truck className="text-gray-400 mr-3" size={20} />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {service.vehicleId?.vehicleNumber || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{service.vehicleId?.model || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {service.serviceType.replace('-', ' ').toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${service.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                    service.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        service.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'}`}>
                                                {service.priority.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${service.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        service.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                    {service.status.replace('-', ' ').toUpperCase()}
                                                </span>
                                                {service.status !== 'completed' && (
                                                    <select
                                                        value={service.status}
                                                        onChange={(e) => handleStatusChange(service._id, e.target.value as any)}
                                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="in-progress">In Progress</option>
                                                        <option value="completed">Completed</option>
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(service.dueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {typeof service.assignedMechanic === 'string' 
                                                ? service.assignedMechanic 
                                                : service.assignedMechanic 
                                                    ? `${service.assignedMechanic.first_name} ${service.assignedMechanic.last_name}`
                                                    : 'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditService(service)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit Service"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteService(service._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete Service"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <AlertDetailsModal
                alert={showAlertDetails}
                onClose={() => setShowAlertDetails(null)}
            />
        </div>
    );
};

export default MaintenanceSchedule;