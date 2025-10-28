import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, Users, Calendar, TrendingUp, X, AlertCircle, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { getEmployees, createPayroll, listPayrolls, updatePayroll, deletePayroll } from "../../../../axios/api/account.payroll";

interface Employee {
    _id: string;
    name: string;
    role: string;
}

interface Trip {
    _id: string;
    tripId: string;
    driverId: string;
    driverName: string;
    startLocation: string;
    endLocation: string;
    startAddress: string;
    endAddress: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    totalMiles: number;
    ratePerMile: number;
    calculatedPrice: number;
    status: 'completed' | 'in-progress' | 'cancelled';
    vehicleId: string;
    vehicleInfo: string;
    cargoType: string;
    cargoWeight: number;
    fuelCost: number;
    tolls: number;
    selected?: boolean;
}

interface DriverPayrollData {
    totalTrips: number;
    totalMiles: number;
    totalEarnings: number;
    trips: Trip[];
}

interface Payroll {
    _id: string;
    userId: {
        _id: string;
        name: string;
        role: string;
    };
    baseSalary: number;
    bonus: number;
    deductions: number;
    totalSalary: number;
    payDate: string;
    startDate: string;
    endDate: string;
    createdAt: string;
}

interface PayrollFormData {
    userId: string;
    baseSalary: string;
    bonus: string;
    deductions: string;
    payDate: string;
    startDate: string;
    endDate: string;
    // Driver-specific fields
    ratePerMile?: string;
    totalMiles?: string;
    tripEarnings?: string;
}

interface Notification {
    type: 'success' | 'error';
    message: string;
}

const PayrollManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payrollData, setPayrollData] = useState<Payroll[]>([]);
    const [driverTrips, setDriverTrips] = useState<Trip[]>([]);
    const [driverPayrollData, setDriverPayrollData] = useState<DriverPayrollData | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingTrips, setLoadingTrips] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);

    const [formData, setFormData] = useState<PayrollFormData>({
        userId: '',
        baseSalary: '',
        bonus: '0',
        deductions: '0',
        payDate: '',
        startDate: '',
        endDate: '',
        ratePerMile: '0.50',
        totalMiles: '0',
        tripEarnings: '0'
    });

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const fetchEmployees = async () => {
        try {
            const response = await getEmployees();
            if (response?.success) {
                setEmployees(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const response = await listPayrolls();
            if (response?.success) {
                setPayrollData(response.data || []);
            } else {
                showNotification('error', response?.message || 'Failed to fetch payrolls');
            }
        } catch (error) {
            showNotification('error', 'Error fetching payrolls');
        } finally {
            setLoading(false);
        }
    };

    // Mock function to fetch driver trips - replace with actual API call
    const fetchDriverTrips = async (driverId: string) => {
        setLoadingTrips(true);
        try {
            // Mock data - replace with actual API call
            const mockTrips: Trip[] = [
                {
                    _id: '1',
                    tripId: 'TRP-001',
                    driverId: driverId,
                    driverName: selectedEmployee?.name || 'Driver',
                    startLocation: 'Toronto, ON',
                    endLocation: 'Montreal, QC',
                    startAddress: '1234 Bay Street, Toronto, ON M5G 1M5',
                    endAddress: '5678 Saint-Catherine Street, Montreal, QC H3B 1A1',
                    startDate: '2024-01-15',
                    endDate: '2024-01-16',
                    startTime: '08:00',
                    endTime: '14:30',
                    totalMiles: 350,
                    ratePerMile: 0.50,
                    calculatedPrice: 175.00,
                    status: 'completed',
                    vehicleId: 'V001',
                    vehicleInfo: 'Freightliner Cascadia - ABC123',
                    cargoType: 'General Freight',
                    cargoWeight: 25000,
                    fuelCost: 45.50,
                    tolls: 12.75,
                    selected: false
                },
                {
                    _id: '2',
                    tripId: 'TRP-002',
                    driverId: driverId,
                    driverName: selectedEmployee?.name || 'Driver',
                    startLocation: 'Montreal, QC',
                    endLocation: 'Ottawa, ON',
                    startAddress: '5678 Saint-Catherine Street, Montreal, QC H3B 1A1',
                    endAddress: '9012 Bank Street, Ottawa, ON K1A 0A6',
                    startDate: '2024-01-18',
                    endDate: '2024-01-19',
                    startTime: '06:30',
                    endTime: '11:45',
                    totalMiles: 120,
                    ratePerMile: 0.50,
                    calculatedPrice: 60.00,
                    status: 'completed',
                    vehicleId: 'V001',
                    vehicleInfo: 'Freightliner Cascadia - ABC123',
                    cargoType: 'Electronics',
                    cargoWeight: 15000,
                    fuelCost: 18.20,
                    tolls: 8.50,
                    selected: false
                },
                {
                    _id: '3',
                    tripId: 'TRP-003',
                    driverId: driverId,
                    driverName: selectedEmployee?.name || 'Driver',
                    startLocation: 'Ottawa, ON',
                    endLocation: 'Toronto, ON',
                    startAddress: '9012 Bank Street, Ottawa, ON K1A 0A6',
                    endAddress: '1234 Bay Street, Toronto, ON M5G 1M5',
                    startDate: '2024-01-22',
                    endDate: '2024-01-23',
                    startTime: '09:15',
                    endTime: '16:20',
                    totalMiles: 280,
                    ratePerMile: 0.50,
                    calculatedPrice: 140.00,
                    status: 'completed',
                    vehicleId: 'V001',
                    vehicleInfo: 'Freightliner Cascadia - ABC123',
                    cargoType: 'Automotive Parts',
                    cargoWeight: 18000,
                    fuelCost: 36.40,
                    tolls: 15.25,
                    selected: false
                },
                {
                    _id: '4',
                    tripId: 'TRP-004',
                    driverId: driverId,
                    driverName: selectedEmployee?.name || 'Driver',
                    startLocation: 'Toronto, ON',
                    endLocation: 'Windsor, ON',
                    startAddress: '1234 Bay Street, Toronto, ON M5G 1M5',
                    endAddress: '3456 Ouellette Avenue, Windsor, ON N9A 1A1',
                    startDate: '2024-01-25',
                    endDate: '2024-01-26',
                    startTime: '07:45',
                    endTime: '13:15',
                    totalMiles: 230,
                    ratePerMile: 0.50,
                    calculatedPrice: 115.00,
                    status: 'completed',
                    vehicleId: 'V001',
                    vehicleInfo: 'Freightliner Cascadia - ABC123',
                    cargoType: 'Food Products',
                    cargoWeight: 12000,
                    fuelCost: 29.90,
                    tolls: 6.75,
                    selected: false
                },
                {
                    _id: '5',
                    tripId: 'TRP-005',
                    driverId: driverId,
                    driverName: selectedEmployee?.name || 'Driver',
                    startLocation: 'Windsor, ON',
                    endLocation: 'Hamilton, ON',
                    startAddress: '3456 Ouellette Avenue, Windsor, ON N9A 1A1',
                    endAddress: '7890 Main Street East, Hamilton, ON L8H 1A1',
                    startDate: '2024-01-28',
                    endDate: '2024-01-29',
                    startTime: '10:30',
                    endTime: '15:45',
                    totalMiles: 180,
                    ratePerMile: 0.50,
                    calculatedPrice: 90.00,
                    status: 'completed',
                    vehicleId: 'V001',
                    vehicleInfo: 'Freightliner Cascadia - ABC123',
                    cargoType: 'Construction Materials',
                    cargoWeight: 22000,
                    fuelCost: 23.40,
                    tolls: 4.50,
                    selected: false
                }
            ];

            // Filter trips by date range - for demo purposes, show all trips regardless of date
            const filteredTrips = mockTrips; // Remove date filtering for now to ensure trips show

            setDriverTrips(filteredTrips);

            // Calculate payroll data
            const totalTrips = filteredTrips.length;
            const totalMiles = filteredTrips.reduce((sum, trip) => sum + trip.totalMiles, 0);
            const totalEarnings = filteredTrips.reduce((sum, trip) => sum + trip.calculatedPrice, 0);

            setDriverPayrollData({
                totalTrips,
                totalMiles,
                totalEarnings,
                trips: filteredTrips
            });

            // Update form data with calculated values
            setFormData(prev => ({
                ...prev,
                totalMiles: totalMiles.toString(),
                tripEarnings: totalEarnings.toString(),
                baseSalary: totalEarnings.toString() // For drivers, base salary = trip earnings
            }));

        } catch (error) {
            showNotification('error', 'Error fetching driver trips');
        } finally {
            setLoadingTrips(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchPayrolls();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'userId') {
            // Check if it's a static driver option
            const isDriver = value.startsWith('driver-');
            const driverName = isDriver ? value.split('-')[1] : null;
            
            if (isDriver) {
                // Create a mock employee object for static drivers
                const mockDriver: Employee = {
                    _id: value,
                    name: driverName === '1' ? 'John Smith' : 
                          driverName === '2' ? 'Sarah Johnson' :
                          driverName === '3' ? 'Michael Brown' :
                          driverName === '4' ? 'Emily Davis' :
                          driverName === '5' ? 'David Wilson' : 'Driver',
                    role: 'Driver'
                };
                setSelectedEmployee(mockDriver);
                setFormData(prev => ({
                    ...prev,
                    [name]: value
                }));
                
                // Auto-fetch trips for driver with default date range (current month)
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                
                const startDate = firstDay.toISOString().split('T')[0];
                const endDate = lastDay.toISOString().split('T')[0];
                
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    startDate,
                    endDate
                }));
                
                // Fetch trips immediately
                fetchDriverTrips(value);
                
                // Also set some initial trip data for immediate display
                const initialTrips: Trip[] = [
                    {
                        _id: '1',
                        tripId: 'TRP-001',
                        driverId: value,
                        driverName: mockDriver.name,
                        startLocation: 'Toronto, ON',
                        endLocation: 'Montreal, QC',
                        startAddress: '1234 Bay Street, Toronto, ON M5G 1M5',
                        endAddress: '5678 Saint-Catherine Street, Montreal, QC H3B 1A1',
                        startDate: '2024-01-15',
                        endDate: '2024-01-16',
                        startTime: '08:00',
                        endTime: '14:30',
                        totalMiles: 350,
                        ratePerMile: 0.50,
                        calculatedPrice: 175.00,
                        status: 'completed',
                        vehicleId: 'V001',
                        vehicleInfo: 'Freightliner Cascadia - ABC123',
                        cargoType: 'General Freight',
                        cargoWeight: 25000,
                        fuelCost: 45.50,
                        tolls: 12.75,
                        selected: false
                    }
                ];
                setDriverTrips(initialTrips);
            } else {
                // Handle regular employees
                const selectedEmp = employees.find(emp => emp._id === value);
                setSelectedEmployee(selectedEmp || null);
                
                // Reset driver-specific data when changing to non-driver employee
                if (selectedEmp?.role.toLowerCase() !== 'driver') {
                    setDriverTrips([]);
                    setDriverPayrollData(null);
                    setFormData(prev => ({
                        ...prev,
                        [name]: value,
                        baseSalary: '',
                        totalMiles: '0',
                        tripEarnings: '0'
                    }));
                } else {
                    setFormData(prev => ({
                        ...prev,
                        [name]: value
                    }));
                }
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle date range changes for driver trip fetching
    const handleDateRangeChange = (startDate: string, endDate: string) => {
        setFormData(prev => ({
            ...prev,
            startDate,
            endDate
        }));

        // If selected employee is a driver and we have both dates, fetch trips
        if (selectedEmployee?.role.toLowerCase() === 'driver' && startDate && endDate) {
            fetchDriverTrips(selectedEmployee._id);
        }
    };

    // Handle trip selection
    const toggleTripSelection = (tripId: string) => {
        setDriverTrips(prev => prev.map(trip => 
            trip._id === tripId ? { ...trip, selected: !trip.selected } : trip
        ));
    };

    const selectAllTrips = () => {
        setDriverTrips(prev => prev.map(trip => ({ ...trip, selected: true })));
    };

    const deselectAllTrips = () => {
        setDriverTrips(prev => prev.map(trip => ({ ...trip, selected: false })));
    };

    // Calculate selected trips totals
    const getSelectedTripsTotals = () => {
        const selectedTrips = driverTrips.filter(trip => trip.selected);
        return {
            count: selectedTrips.length,
            totalMiles: selectedTrips.reduce((sum, trip) => sum + trip.totalMiles, 0),
            totalEarnings: selectedTrips.reduce((sum, trip) => sum + trip.calculatedPrice, 0),
            totalFuelCost: selectedTrips.reduce((sum, trip) => sum + trip.fuelCost, 0),
            totalTolls: selectedTrips.reduce((sum, trip) => sum + trip.tolls, 0)
        };
    };

    const handleCreate = async () => {
        if (!formData.userId || !formData.baseSalary || !formData.payDate || !formData.startDate || !formData.endDate) {
            showNotification('error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        
        try {
            const payload = {
                userId: formData.userId,
                baseSalary: parseFloat(formData.baseSalary),
                bonus: parseFloat(formData.bonus) || 0,
                deductions: parseFloat(formData.deductions) || 0,
                payDate: formData.payDate,
                startDate: formData.startDate,
                endDate: formData.endDate
            };

            const response = await createPayroll(payload);
            
            if (response?.success) {
                showNotification('success', response.message || 'Payroll created successfully!');
                setShowCreateModal(false);
                resetForm();
                fetchPayrolls();
            } else {
                showNotification('error', response?.message || 'Failed to create payroll');
            }
        } catch (error) {
            showNotification('error', 'Error creating payroll');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedPayroll) return;

        if (!formData.userId || !formData.baseSalary || !formData.payDate || !formData.startDate || !formData.endDate) {
            showNotification('error', 'Please fill in all required fields');
            return;
        }
        
        setLoading(true);
        
        try {
            const payload = {
                userId: formData.userId,
                baseSalary: parseFloat(formData.baseSalary),
                bonus: parseFloat(formData.bonus) || 0,
                deductions: parseFloat(formData.deductions) || 0,
                payDate: formData.payDate,
                startDate: formData.startDate,
                endDate: formData.endDate
            };

            const response = await updatePayroll(selectedPayroll._id, payload);
            
            if (response?.success) {
                showNotification('success', response.message || 'Payroll updated successfully!');
                setShowEditModal(false);
                resetForm();
                setSelectedPayroll(null);
                fetchPayrolls();
            } else {
                showNotification('error', response?.message || 'Failed to update payroll');
            }
        } catch (error) {
            showNotification('error', 'Error updating payroll');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPayroll) return;
        
        setLoading(true);
        
        try {
            const response = await deletePayroll(selectedPayroll._id);
            
            if (response?.success) {
                showNotification('success', response.message || 'Payroll deleted successfully!');
                setShowDeleteModal(false);
                setSelectedPayroll(null);
                fetchPayrolls();
            } else {
                showNotification('error', response?.message || 'Failed to delete payroll');
            }
        } catch (error) {
            showNotification('error', 'Error deleting payroll');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (payroll: Payroll) => {
        setSelectedPayroll(payroll);
        const payDateFormatted = payroll.payDate ? payroll.payDate.split('T')[0] : '';
        const startDateFormatted = payroll.startDate ? payroll.startDate.split('T')[0] : '';
        const endDateFormatted = payroll.endDate ? payroll.endDate.split('T')[0] : '';
        
        setFormData({
            userId: payroll.userId._id,
            baseSalary: payroll.baseSalary.toString(),
            bonus: payroll.bonus.toString(),
            deductions: payroll.deductions.toString(),
            payDate: payDateFormatted,
            startDate: startDateFormatted,
            endDate: endDateFormatted
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (payroll: Payroll) => {
        setSelectedPayroll(payroll);
        setShowDeleteModal(true);
    };

    const resetForm = () => {
        setFormData({
            userId: '',
            baseSalary: '',
            bonus: '0',
            deductions: '0',
            payDate: '',
            startDate: '',
            endDate: '',
            ratePerMile: '0.50',
            totalMiles: '0',
            tripEarnings: '0'
        });
        setSelectedEmployee(null);
        setDriverTrips([]);
        setDriverPayrollData(null);
    };

    const filteredPayrolls = payrollData.filter(payroll => {
        const matchesSearch = payroll.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payroll.userId.role.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterStatus === 'all' || 
            payroll.userId.role.toLowerCase() === filterStatus.toLowerCase();
        
        return matchesSearch && matchesFilter;
    });

    const totalPayroll = payrollData.reduce((sum, payroll) => sum + payroll.totalSalary, 0);
    const avgSalary = payrollData.length > 0 ? totalPayroll / payrollData.length : 0;

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
                        notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    } text-white`}>
                        {notification.type === 'success' ? (
                            <CheckCircle size={20} />
                        ) : (
                            <AlertCircle size={20} />
                        )}
                        <span>{notification.message}</span>
                        <button onClick={() => setNotification(null)}>
                            <X size={20} />
                        </button>
                    </div>
                )}

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
                        <p className="text-gray-600 mt-2">Manage employee salaries and payroll records</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 !text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Create Payroll
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg border-gray-200 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Payroll</p>
                                <p className="text-2xl font-bold text-gray-900">${totalPayroll.toLocaleString()}</p>
                            </div>
                            <DollarSign className="text-blue-500" size={24} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg border-gray-200 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Employees</p>
                                <p className="text-2xl font-bold text-gray-900">{payrollData.length}</p>
                            </div>
                            <Users className="text-green-500" size={24} />
                        </div>
                    </div>
                    <div className="bg-white p-6 border-gray-200 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Average Salary</p>
                                <p className="text-2xl font-bold text-gray-900">${Math.round(avgSalary).toLocaleString()}</p>
                            </div>
                            <TrendingUp className="text-purple-500" size={24} />
                        </div>
                    </div>
                    <div className="bg-white p-6 border-gray-200 rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pay Period</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <Calendar className="text-orange-500" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border-gray-200 shadow-sm border mb-6">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by employee name or role..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="driver">Driver</option>
                                    <option value="dispatcher">Dispatcher</option>
                                    <option value="hr">HR</option>
                                    <option value="contact">Contact</option>
                                    <option value="customer">Customer</option>
                                    <option value="reporter">Reporter</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-gray-200 rounded-lg shadow-sm border">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Payroll Records</h2>
                    </div>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredPayrolls.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                No payroll records found
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Base Salary
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bonus
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Deductions
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Salary
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Pay Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPayrolls.map((payroll) => (
                                        <tr key={payroll._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                                        {payroll.userId.name.charAt(0)}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {payroll.userId.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                    {payroll.userId.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${payroll.baseSalary.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                                +${payroll.bonus.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                -${payroll.deductions.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                ${payroll.totalSalary.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(payroll.payDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => openEditModal(payroll)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Payroll"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal(payroll)}
                                                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Payroll"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {(showCreateModal || showEditModal) && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-auto p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${showCreateModal ? 'bg-blue-100' : 'bg-green-100'}`}>
                                        {showCreateModal ? <Plus className="text-blue-600" size={20} /> : <Edit2 className="text-green-600" size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-semibold text-gray-900">
                                            {showCreateModal ? 'Create New Payroll' : 'Edit Payroll'}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {showCreateModal ? 'Add a new payroll record' : 'Update payroll information'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setShowEditModal(false);
                                        resetForm();
                                        setSelectedPayroll(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Employee <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="userId"
                                        value={formData.userId}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    >
                                        <option value="">Select Employee</option>
                                        
                                        {/* Static Driver Options */}
                                        <optgroup label="Drivers">
                                            <option value="driver-1">John Smith - Driver</option>
                                            <option value="driver-2">Sarah Johnson - Driver</option>
                                            <option value="driver-3">Michael Brown - Driver</option>
                                            <option value="driver-4">Emily Davis - Driver</option>
                                            <option value="driver-5">David Wilson - Driver</option>
                                        </optgroup>
                                        
                                        {/* Other Employees */}
                                        <optgroup label="Other Employees">
                                            {employees.filter(emp => emp.role.toLowerCase() !== 'driver').map((emp) => (
                                                <option key={emp._id} value={emp._id}>
                                                    {emp.name} - {emp.role}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Base Salary ($) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="number"
                                                name="baseSalary"
                                                value={formData.baseSalary}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                placeholder="5000.00"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bonus ($)
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="number"
                                                name="bonus"
                                                value={formData.bonus}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Deductions ($)
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="number"
                                                name="deductions"
                                                value={formData.deductions}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        <Calendar size={16} />
                                        Pay Period
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Start Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={(e) => handleDateRangeChange(e.target.value, formData.endDate)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                End Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={(e) => handleDateRangeChange(formData.startDate, e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="payDate"
                                        value={formData.payDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    />
                                </div>

                                {/* Driver-specific Trip Information */}
                                {selectedEmployee?.role.toLowerCase() === 'driver' && (
                                    <div className="space-y-4">
                                        {/* Driver Info Header */}
                                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                                            <h4 className="text-lg font-bold flex items-center gap-2">
                                                <Users size={20} />
                                                Driver: {selectedEmployee.name}
                                            </h4>
                                            <p className="text-green-100 text-sm mt-1">
                                                Trip data automatically loaded for current month. Adjust dates below to see different periods.
                                            </p>
                                        </div>

                                        {/* Debug Info - Remove this in production */}
                                        <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800">
                                            Debug: Driver selected: {selectedEmployee?.name} | Trips loaded: {driverTrips.length} | Loading: {loadingTrips ? 'Yes' : 'No'}
                                        </div>

                                        {/* Driver Trip Summary */}
                                        {driverPayrollData && (
                                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                                    <TrendingUp size={16} />
                                                    Trip Summary
                                                </h5>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-green-600">{driverPayrollData.totalTrips}</div>
                                                        <div className="text-xs text-gray-600">Total Trips</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-green-600">{driverPayrollData.totalMiles.toLocaleString()}</div>
                                                        <div className="text-xs text-gray-600">Total Miles</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-green-600">${driverPayrollData.totalEarnings.toFixed(2)}</div>
                                                        <div className="text-xs text-gray-600">Trip Earnings</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Simple Route Display - Fallback */}
                                        {driverTrips.length > 0 && (
                                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                                <h6 className="text-sm font-medium text-gray-700 mb-3">Quick Route Overview</h6>
                                                <div className="space-y-2">
                                                    {driverTrips.slice(0, 3).map((trip) => (
                                                        <div key={trip._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                            <div>
                                                                <span className="font-medium">{trip.tripId}: </span>
                                                                <span className="text-gray-600">{trip.startLocation} → {trip.endLocation}</span>
                                                            </div>
                                                            <div className="text-sm text-green-600 font-medium">
                                                                {trip.totalMiles} miles - ${trip.calculatedPrice.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Trip Details Table */}
                                        {driverTrips.length > 0 && (
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                                    <h5 className="text-sm font-medium text-gray-700">Trip Details</h5>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={selectAllTrips}
                                                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                        >
                                                            Select All
                                                        </button>
                                                        <button
                                                            onClick={deselectAllTrips}
                                                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                                        >
                                                            Deselect All
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trip ID</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route Details</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cargo Info</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Miles</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Costs</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {driverTrips.map((trip) => (
                                                                <tr key={trip._id} className={`hover:bg-gray-50 ${trip.selected ? 'bg-blue-50' : ''}`}>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={trip.selected || false}
                                                                            onChange={() => toggleTripSelection(trip._id)}
                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{trip.tripId}</td>
                                                                    <td className="px-3 py-2 text-sm text-gray-600">
                                                                        <div className="space-y-1">
                                                                            <div className="font-medium text-gray-900">
                                                                                {trip.startLocation} → {trip.endLocation}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                <div>From: {trip.startAddress}</div>
                                                                                <div>To: {trip.endAddress}</div>
                                                                            </div>
                                                                            <div className="text-xs text-blue-600">
                                                                                Vehicle: {trip.vehicleInfo}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-sm text-gray-600">
                                                                        <div className="space-y-1">
                                                                            <div className="font-medium">
                                                                                {new Date(trip.startDate).toLocaleDateString()}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                Start: {trip.startTime}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                End: {trip.endTime}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-sm text-gray-600">
                                                                        <div className="space-y-1">
                                                                            <div className="font-medium">{trip.cargoType}</div>
                                                                            <div className="text-xs text-gray-500">
                                                                                Weight: {trip.cargoWeight.toLocaleString()} lbs
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-sm text-gray-900 font-medium">{trip.totalMiles}</td>
                                                                    <td className="px-3 py-2 text-sm text-gray-600">${trip.ratePerMile}/mile</td>
                                                                    <td className="px-3 py-2 text-sm font-bold text-green-600">${trip.calculatedPrice.toFixed(2)}</td>
                                                                    <td className="px-3 py-2 text-sm text-gray-600">
                                                                        <div className="space-y-1">
                                                                            <div className="text-xs">Fuel: ${trip.fuelCost.toFixed(2)}</div>
                                                                            <div className="text-xs">Tolls: ${trip.tolls.toFixed(2)}</div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot className="bg-gray-50">
                                                            <tr>
                                                                <td colSpan={5} className="px-3 py-2 text-sm font-medium text-gray-900 text-right">Selected Total:</td>
                                                                <td className="px-3 py-2 text-sm font-bold text-gray-900">
                                                                    {getSelectedTripsTotals().totalMiles}
                                                                </td>
                                                                <td className="px-3 py-2 text-sm text-gray-600">-</td>
                                                                <td className="px-3 py-2 text-sm font-bold text-green-600">
                                                                    ${getSelectedTripsTotals().totalEarnings.toFixed(2)}
                                                                </td>
                                                                <td className="px-3 py-2 text-sm text-gray-600">
                                                                    <div className="space-y-1">
                                                                        <div className="text-xs">Fuel: ${getSelectedTripsTotals().totalFuelCost.toFixed(2)}</div>
                                                                        <div className="text-xs">Tolls: ${getSelectedTripsTotals().totalTolls.toFixed(2)}</div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                                
                                                {/* Selected Trips Summary */}
                                                {getSelectedTripsTotals().count > 0 && (
                                                    <div className="bg-blue-50 p-4 border-t border-blue-200">
                                                        <h6 className="text-sm font-medium text-blue-800 mb-2">Selected Trips Summary</h6>
                                                        <div className="grid grid-cols-4 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-blue-600 font-medium">Selected Trips:</span>
                                                                <span className="ml-1 text-blue-800 font-bold">{getSelectedTripsTotals().count}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-blue-600 font-medium">Total Miles:</span>
                                                                <span className="ml-1 text-blue-800 font-bold">{getSelectedTripsTotals().totalMiles.toLocaleString()}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-blue-600 font-medium">Total Earnings:</span>
                                                                <span className="ml-1 text-blue-800 font-bold">${getSelectedTripsTotals().totalEarnings.toFixed(2)}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-blue-600 font-medium">Total Costs:</span>
                                                                <span className="ml-1 text-blue-800 font-bold">${(getSelectedTripsTotals().totalFuelCost + getSelectedTripsTotals().totalTolls).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Loading State */}
                                        {loadingTrips && (
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                                                <div className="text-sm text-blue-600">Loading trip data...</div>
                                            </div>
                                        )}

                                        {/* No Trips Message */}
                                        {!loadingTrips && driverTrips.length === 0 && formData.startDate && formData.endDate && (
                                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                                                <div className="text-sm text-yellow-600">No trips found for the selected date range.</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {formData.baseSalary && (
                                    <div className={`p-4 rounded-lg border ${
                                        selectedEmployee?.role.toLowerCase() === 'driver' 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-blue-50 border-blue-200'
                                    }`}>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">
                                                {selectedEmployee?.role.toLowerCase() === 'driver' ? 'Total Driver Pay:' : 'Total Salary:'}
                                            </span>
                                            <span className={`text-xl font-bold ${
                                                selectedEmployee?.role.toLowerCase() === 'driver' 
                                                    ? 'text-green-600' 
                                                    : 'text-blue-600'
                                            }`}>
                                                ${(
                                                    parseFloat(formData.baseSalary || '0') + 
                                                    parseFloat(formData.bonus || '0') - 
                                                    parseFloat(formData.deductions || '0')
                                                ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {selectedEmployee?.role.toLowerCase() === 'driver' && driverPayrollData && (
                                            <div className="mt-2 text-xs text-gray-600">
                                                Based on {driverPayrollData.totalTrips} trips • {driverPayrollData.totalMiles.toLocaleString()} miles
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setShowEditModal(false);
                                            resetForm();
                                            setSelectedPayroll(null);
                                        }}
                                        className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={showCreateModal ? handleCreate : handleUpdate}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg transition-colors disabled:bg-blue-400 font-medium flex items-center gap-2"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {showCreateModal ? <Plus size={18} /> : <CheckCircle size={18} />}
                                                {showCreateModal ? 'Create Payroll' : 'Update Payroll'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteModal && selectedPayroll && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Payroll</h3>
                                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                                </div>
                            </div>
                            
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete the payroll record for <strong>{selectedPayroll.userId.name}</strong>?
                            </p>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedPayroll(null);
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 !ml-3 !text-white rounded-lg transition-colors disabled:bg-red-400"
                                    disabled={loading}
                                >
                                    {loading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayrollManagement;