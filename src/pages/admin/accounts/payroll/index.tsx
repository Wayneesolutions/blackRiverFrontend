import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, Users, Calendar, TrendingUp, X, AlertCircle, CheckCircle, Edit2, Trash2, Eye, MapPin, Package, Clock, Building2 } from 'lucide-react';
import { getEmployees, createPayroll, listPayrolls, updatePayroll, deletePayroll, getDriverCompletedTrips } from "../../../../axios/api/account.payroll";

interface Employee {
    _id: string;
    name: string;
    role: string;
    details?: {
        mileRate?: number;
        [key: string]: any;
    };
}

interface Trip {
    _id: string;
    tripNumber: string;
    startLocation?: {
        place: string;
        latitude: string;
        longitude: string;
    };
    endLocation?: {
        place: string;
        latitude: string;
        longitude: string;
    };
    route?: {
        totalDistance?: number;
        waypoints?: Array<{
            place: string;
            latitude: string;
            longitude: string;
        }>;
    };
    plannedStartDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
    status: string;
    distance: number; // km from backend
    distanceInMiles: number; // miles from backend
    mileRate: number; // from backend
    earnings: string; // calculated earnings from backend
    driverDetails?: {
        _id: string;
        name: string;
        phone: string;
    } | null;
    driver?: {
        _id: string;
        name: string;
        phone?: string;
    };
    truck?: {
        _id: string;
        plateNumber?: string;
        internalId?: string;
    };
    trailer?: {
        _id: string;
        plateNumber?: string;
        trailerNumber?: string;
    };
    selected?: boolean;
}

interface DriverPayrollSummary {
    totalTrips: number;
    totalDistanceKm: number;
    totalDistanceMiles: number;
    totalEarnings: number;
    ratePerMile: number;
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
    // Driver-specific fields
    trips?: Array<{
        _id: string;
        tripNumber?: string;
        startLocation?: {
            place?: string;
            latitude?: string;
            longitude?: string;
        };
        endLocation?: {
            place?: string;
            latitude?: string;
            longitude?: string;
        };
        actualEndDate?: string;
        distance?: number;
        distanceInMiles?: number;
        earnings?: string;
    }>;
    loads?: Array<{
        _id: string;
        details?: {
            internalId?: string;
        };
        route?: {
            multipleDropOffs?: boolean;
            selectPickup?: { 
                place?: string;
                latitude?: string;
                longitude?: string;
            };
            selectDropOff?: { 
                place?: string;
                latitude?: string;
                longitude?: string;
            };
            wayPoints?: Array<{
                address: {
                    place: string;
                    latitude: string;
                    longitude: string;
                };
            }>;
        };
        assignedAt?: string;
        startedAt?: string;
        completedAt?: string;
    }>;
    totalMiles?: number;
    ratePerMile?: number;
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
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payrollData, setPayrollData] = useState<Payroll[]>([]);
    const [driverTrips, setDriverTrips] = useState<Trip[]>([]);
    const [driverPayrollSummary, setDriverPayrollSummary] = useState<DriverPayrollSummary | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingTrips, setLoadingTrips] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);
    const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);

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

    const getLocalUserInfo = () => {
        const userInfoString = localStorage.getItem('userInfo');
        if (!userInfoString) return null;
        try {
            return JSON.parse(userInfoString);
        } catch (error) {
            console.error('Error parsing userInfo from localStorage:', error);
            return null;
        }
    };

    const fetchEmployees = async () => {
        try {
            const userInfo: any = getLocalUserInfo();
            
            // Handle different userInfo structures (userData.company or direct company)
            const userRole = userInfo?.role || userInfo?.userData?.role;
            const userCompany = userInfo?.company || userInfo?.userData?.company;
            const isSuperadmin = userRole === 'superadmin';
            const isHR = userRole === 'hr';
            const hasCompany = Boolean(userCompany);

            // Allow HR and dispatchers to call API even if company is not visible in localStorage
            // The backend will handle company filtering based on the authenticated user
            if (!isSuperadmin && !isHR && !hasCompany) {
                setEmployees([]);
                return;
            }

            const response = await getEmployees();
            if (response?.success) {
                setEmployees(response.data || []);
            } else if (response?.message) {
                showNotification('error', response.message);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchPayrolls = async () => {
        setLoading(true);
        try {
            const userInfo: any = getLocalUserInfo();
            
            // Handle different userInfo structures (userData.company or direct company)
            const userRole = userInfo?.role || userInfo?.userData?.role;
            const userCompany = userInfo?.company || userInfo?.userData?.company;
            const isSuperadmin = userRole === 'superadmin';
            const isHR = userRole === 'hr';
            const hasCompany = Boolean(userCompany);

            // Allow HR and dispatchers to call API even if company is not visible in localStorage
            // The backend will handle company filtering based on the authenticated user
            if (!isSuperadmin && !isHR && !hasCompany) {
                setPayrollData([]);
                setEmptyStateMessage(null);
                return;
            }

            const response = await listPayrolls();
            if (response?.success) {
                const data = response.data || [];
                setPayrollData(data);
                if (response.message && data.length === 0) {
                    setEmptyStateMessage(response.message);
                } else {
                    setEmptyStateMessage(null);
                }
            } else {
                const message = response?.message || 'Failed to fetch payrolls';
                setPayrollData([]);
                setEmptyStateMessage(message);
                showNotification('error', message);
            }
        } catch (error) {
            console.error('Error fetching payrolls:', error);
            setPayrollData([]);
            const message = 'Error fetching payrolls';
            setEmptyStateMessage(message);
            showNotification('error', message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch driver completed trips from API
    const fetchDriverTrips = async (driverId: string, startDate?: string, endDate?: string) => {
        setLoadingTrips(true);
        try {
            const userInfo: any = getLocalUserInfo();
            
            // Handle different userInfo structures (userData.company or direct company)
            const userRole = userInfo?.role || userInfo?.userData?.role;
            const userCompany = userInfo?.company || userInfo?.userData?.company;
            const isSuperadmin = userRole === 'superadmin';
            const isHR = userRole === 'hr';
            const isDispatcher = userRole === 'dispatcher';
            const hasCompany = Boolean(userCompany);

            console.log('🔍 Fetching driver trips:', { driverId, startDate, endDate, userRole, hasCompany });

            // Allow HR, dispatchers, and users with company to call API
            // The backend will handle company filtering based on the authenticated user
            if (!isSuperadmin && !isHR && !isDispatcher && !hasCompany) {
                console.warn('⚠️ User does not have permission or company to fetch trips');
                setDriverTrips([]);
                setDriverPayrollSummary(null);
                setLoadingTrips(false);
                return;
            }

            console.log('📡 Calling API: getDriverCompletedTrips');
            const response = await getDriverCompletedTrips(driverId, startDate, endDate);
            console.log('📥 API Response:', response);
            
            if (response?.success) {
                const trips: Trip[] = (response.data || []).map((trip: any) => ({
                    ...trip,
                    selected: false
                }));
                
                console.log(`✅ Loaded ${trips.length} trips for driver`);
                setDriverTrips(trips);

                // Set summary data if available from backend
                if (response.summary) {
                    console.log('📊 Summary from backend:', response.summary);
                    setDriverPayrollSummary(response.summary);
                    
                    // Update form data with calculated values (use 0 if no earnings)
                    const earnings = response.summary.totalEarnings || 0;
                    setFormData(prev => ({
                        ...prev,
                        totalMiles: (response.summary.totalDistanceMiles || 0).toString(),
                        tripEarnings: earnings.toString(),
                        ratePerMile: (response.summary.ratePerMile || 0).toString(),
                        baseSalary: earnings.toString() // For drivers, base salary = trip earnings
                    }));
                } else {
                    // Fallback calculation if no summary provided
                    const totalMiles = trips.reduce((sum, trip) => sum + (trip.distanceInMiles || 0), 0);
                    const totalEarnings = trips.reduce((sum, trip) => sum + parseFloat(trip.earnings || '0'), 0);
                    
                    const fallbackSummary = {
                        totalTrips: trips.length,
                        totalDistanceKm: trips.reduce((sum, trip) => sum + (trip.distance || 0), 0),
                        totalDistanceMiles: totalMiles,
                        totalEarnings: totalEarnings,
                        ratePerMile: trips[0]?.mileRate || 0
                    };
                    
                    console.log('📊 Fallback summary:', fallbackSummary);
                    setDriverPayrollSummary(fallbackSummary);
                    
                    setFormData(prev => ({
                        ...prev,
                        totalMiles: totalMiles.toString(),
                        tripEarnings: totalEarnings.toString(),
                        baseSalary: totalEarnings.toString()
                    }));
                }
                
                // Show info message if no trips found
                if (trips.length === 0) {
                    console.log('ℹ️ No trips found for the selected date range');
                }
            } else {
                const errorMsg = response?.message || 'Failed to fetch driver trips';
                console.error('❌ API Error:', errorMsg, response);
                showNotification('error', errorMsg);
                setDriverTrips([]);
                setDriverPayrollSummary(null);
                // Reset baseSalary to 0 if no trips
                setFormData(prev => ({
                    ...prev,
                    baseSalary: '0'
                }));
            }
        } catch (error: any) {
            console.error('❌ Exception fetching driver trips:', error);
            const errorMsg = error?.response?.data?.message || error?.message || 'Error fetching driver trips';
            showNotification('error', errorMsg);
            setDriverTrips([]);
            setDriverPayrollSummary(null);
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
            // Find the selected employee
            const selectedEmp = employees.find(emp => emp._id === value);
            setSelectedEmployee(selectedEmp || null);
            
            // Check if it's a driver
            if (selectedEmp?.role?.toLowerCase() === 'driver') {
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
                fetchDriverTrips(value, startDate, endDate);
            } else {
                // Reset driver-specific data when changing to non-driver employee
                setDriverTrips([]);
                setDriverPayrollSummary(null);
                    setFormData(prev => ({
                        ...prev,
                        [name]: value,
                        baseSalary: '',
                        totalMiles: '0',
                        tripEarnings: '0'
                    }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle date range changes for driver load fetching
    const handleDateRangeChange = (startDate: string, endDate: string) => {
        setFormData(prev => ({
            ...prev,
            startDate,
            endDate
        }));

        // If selected employee is a driver and we have both dates, fetch trips
        if (selectedEmployee?.role?.toLowerCase() === 'driver' && startDate && endDate) {
            fetchDriverTrips(selectedEmployee._id, startDate, endDate);
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
            totalMiles: selectedTrips.reduce((sum, trip) => sum + (trip.distanceInMiles || 0), 0),
            totalEarnings: selectedTrips.reduce((sum, trip) => sum + parseFloat(trip.earnings || '0'), 0)
        };
    };

    const handleCreate = async () => {
        if (emptyStateMessage) {
            showNotification('error', emptyStateMessage);
            return;
        }

        if (!formData.userId || formData.baseSalary === '' || formData.baseSalary === null || !formData.payDate || !formData.startDate || !formData.endDate) {
            showNotification('error', 'Please fill in all required fields');
            return;
        }

        // Validate baseSalary is a valid number
        const baseSalaryNum = parseFloat(formData.baseSalary);
        if (isNaN(baseSalaryNum) || baseSalaryNum < 0) {
            showNotification('error', 'Base salary must be a valid positive number');
            return;
        }

        setLoading(true);
        
        try {
            const payload: any = {
                userId: formData.userId,
                baseSalary: parseFloat(formData.baseSalary),
                bonus: parseFloat(formData.bonus) || 0,
                deductions: parseFloat(formData.deductions) || 0,
                payDate: formData.payDate,
                startDate: formData.startDate,
                endDate: formData.endDate
            };

            // Add driver-specific data if this is for a driver
            if (selectedEmployee?.role?.toLowerCase() === 'driver' && driverPayrollSummary) {
                payload.tripIds = driverTrips.map(trip => trip._id).filter(id => id); // Filter out any null/undefined IDs
                payload.totalMiles = driverPayrollSummary.totalDistanceMiles;
                payload.ratePerMile = driverPayrollSummary.ratePerMile;
                console.log('🚚 Driver payroll payload:', {
                    tripIds: payload.tripIds.length,
                    totalMiles: payload.totalMiles,
                    ratePerMile: payload.ratePerMile
                });
            }

            console.log('📤 Sending payroll payload:', payload);

            const response = await createPayroll(payload);
            
            console.log('📥 Payroll response:', response);
            
            if (response?.success) {
                showNotification('success', response.message || 'Payroll created successfully!');
                setShowCreateModal(false);
                resetForm();
                fetchPayrolls();
            } else {
                const errorMsg = response?.message || response?.error || 'Failed to create payroll';
                console.error('❌ Payroll creation error:', response);
                showNotification('error', errorMsg);
            }
        } catch (error: any) {
            console.error('❌ Payroll creation exception:', error);
            const errorMsg = error?.response?.data?.message || error?.message || 'Error creating payroll';
            showNotification('error', errorMsg);
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

    const openViewModal = (payroll: Payroll) => {
        setSelectedPayroll(payroll);
        setShowViewModal(true);
    };

    const openEditModal = (payroll: Payroll) => {
        // Add null check for userId
        if (!payroll.userId || !payroll.userId._id) {
            showNotification('error', 'Invalid payroll record: missing user information');
            return;
        }
        
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
        setDriverPayrollSummary(null);
    };

    const filteredPayrolls = payrollData.filter(payroll => {
        // Add null checks for userId
        if (!payroll.userId || !payroll.userId.name || !payroll.userId.role) {
            return false; // Skip payrolls with null userId
        }
        
        const matchesSearch = payroll.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payroll.userId.role.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterStatus === 'all' || 
            payroll.userId.role.toLowerCase() === filterStatus.toLowerCase();
        
        return matchesSearch && matchesFilter;
    });

    const totalPayroll = payrollData.reduce((sum, payroll) => sum + payroll.totalSalary, 0);
    const avgSalary = payrollData.length > 0 ? totalPayroll / payrollData.length : 0;

    if (loading && !emptyStateMessage) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">Loading payroll data...</p>
            </div>
        );
    }

    if (emptyStateMessage) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center text-center space-y-5">
                {notification && (
                    <div className={`fixed top-4 right-4 z-[10000] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        {notification.type === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {notification.message}
                        </span>
                        <button onClick={() => setNotification(null)}>
                            <X className={`h-4 w-4 ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                        </button>
                    </div>
                )}
                <Building2 className="h-16 w-16 text-gray-400" />
                <div className="space-y-3 max-w-md">
                    <h2 className="text-2xl font-semibold text-gray-800">No payroll data available</h2>
                    <p className="text-gray-500">{emptyStateMessage}</p>
                </div>
                <button
                    onClick={fetchPayrolls}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
                >
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-6">
            <div className="py-8 max-w-7xl mx-auto">
                {notification && (
                    <div className={`fixed top-4 right-4 z-[10000] flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
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
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 !text-white rounded-lg transition-all font-medium flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Create Payroll
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">${totalPayroll.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100 flex-shrink-0">
                                <DollarSign className="text-blue-600" size={24} />
                        </div>
                    </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Employees</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{payrollData.length}</p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100 flex-shrink-0">
                                <Users className="text-green-600" size={24} />
                        </div>
                    </div>
                    </div>
                    <div className="bg-white p-6 border-gray-200 rounded-xl shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Average Salary</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">${Math.round(avgSalary).toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100 flex-shrink-0">
                                <TrendingUp className="text-purple-600" size={24} />
                        </div>
                    </div>
                    </div>
                    <div className="bg-white p-6 border-gray-200 rounded-xl shadow-sm border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pay Period</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-orange-100 flex-shrink-0">
                                <Calendar className="text-orange-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border-gray-200 shadow-sm border mb-6">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by employee name or role..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

                <div className="bg-white border-gray-200 rounded-xl shadow-sm border">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Payroll Records</h2>
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
                                        {/* Dynamic columns - show different data for drivers vs employees */}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <span className="block">Loads/Base Salary</span>
                                            <span className="text-xs normal-case font-normal text-gray-400">(Drivers/Employees)</span>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <span className="block">Miles/Bonus</span>
                                            <span className="text-xs normal-case font-normal text-gray-400">(Drivers/Employees)</span>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <span className="block">Rate/Deductions</span>
                                            <span className="text-xs normal-case font-normal text-gray-400">(Drivers/Employees)</span>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Earnings
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Pay
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
                                    {filteredPayrolls.map((payroll) => {
                                        const isDriver = payroll.userId?.role?.toLowerCase() === 'driver';
                                        return (
                                            <tr key={payroll._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                                                            isDriver ? 'bg-green-500' : 'bg-blue-500'
                                                        }`}>
                                                            {payroll.userId?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {payroll.userId?.name || 'Unknown'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                        isDriver 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {payroll.userId?.role || 'Unknown'}
                                                    </span>
                                                </td>
                                                {/* Column 1: Trips (Driver) or Base Salary (Other) */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {isDriver ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{(payroll.trips?.length || payroll.loads?.length || 0)} trips</span>
                                                            {(payroll.trips || payroll.loads) && (payroll.trips?.length || payroll.loads?.length || 0) > 0 && (
                                                                <span className="text-xs text-gray-500 mt-1">
                                                                    {(payroll.trips || payroll.loads || []).slice(0, 2).map((item: any) => 
                                                                        item.tripNumber || item.details?.internalId || item._id?.slice(-6)
                                                                    ).join(', ')}
                                                                    {(payroll.trips?.length || payroll.loads?.length || 0) > 2 && ` +${(payroll.trips?.length || payroll.loads?.length || 0) - 2} more`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span>${payroll.baseSalary.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                
                                                {/* Column 2: Miles (Driver) or Bonus (Other) */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {isDriver ? (
                                                        payroll.totalMiles ? (
                                                            <span className="font-medium">{payroll.totalMiles.toLocaleString()} mi</span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )
                                                    ) : (
                                                        <span className="text-green-600">+${payroll.bonus.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                
                                                {/* Column 3: Rate/Mile (Driver) or Deductions (Other) */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {isDriver ? (
                                                        payroll.ratePerMile ? (
                                                            <span>${payroll.ratePerMile}/mi</span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )
                                                    ) : (
                                                        <span className="text-red-600">-${payroll.deductions.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                
                                                {/* Column 4: Earnings (Driver) or blank (Other) */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {isDriver ? (
                                                        <span className="text-green-600">${payroll.baseSalary.toLocaleString()}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    ${payroll.totalSalary.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(payroll.payDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button 
                                                            onClick={() => openViewModal(payroll)}
                                                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => openEditModal(payroll)}
                                                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
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
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {(showCreateModal || showEditModal) && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center overflow-auto p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${showCreateModal ? 'bg-blue-100' : 'bg-green-100'}`}>
                                        {showCreateModal ? <Plus className="text-blue-600" size={20} /> : <Edit2 className="text-green-600" size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900">
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Select Employee</option>
                                        
                                        {/* Drivers */}
                                        {employees.filter(emp => emp.role.toLowerCase() === 'driver').map((emp) => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} - Driver
                                            </option>
                                        ))}
                                        
                                        {/* Other Employees */}
                                        {employees.filter(emp => emp.role.toLowerCase() !== 'driver').length > 0 && (
                                        <optgroup label="Other Employees">
                                            {employees.filter(emp => emp.role.toLowerCase() !== 'driver').map((emp) => (
                                                <option key={emp._id} value={emp._id}>
                                                    {emp.name} - {emp.role}
                                                </option>
                                            ))}
                                        </optgroup>
                                        )}
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
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                                Load data automatically loaded for current month. Adjust dates below to see different periods.
                                            </p>
                                        </div>

                                        {/* Driver Load Summary */}
                                        {driverPayrollSummary && (
                                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                                    <TrendingUp size={16} />
                                                    Trip Summary
                                                </h5>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-green-600">{driverPayrollSummary.totalTrips}</div>
                                                        <div className="text-xs text-gray-600">Total Trips</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-green-600">{driverPayrollSummary.totalDistanceMiles.toLocaleString()}</div>
                                                        <div className="text-xs text-gray-600">Total Miles</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-green-600">${driverPayrollSummary.totalEarnings.toFixed(2)}</div>
                                                        <div className="text-xs text-gray-600">Trip Earnings</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-gray-500 text-center">
                                                    Rate: ${driverPayrollSummary.ratePerMile}/mile
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
                                                                <span className="font-medium">Trip: </span>
                                                                <span className="text-gray-600">
                                                                    {(trip.startLocation?.place || 'Unknown') + ' → ' + (trip.endLocation?.place || 'Unknown')}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-green-600 font-medium">
                                                                {trip.distanceInMiles || 0} miles - ${parseFloat(trip.earnings || '0').toFixed(2)}
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
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trip Number</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route Details</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed Date</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Truck</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Miles</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
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
                                                                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{trip.tripNumber || trip._id?.slice(-6).toUpperCase()}</td>
                                                                    <td className="px-3 py-2 text-sm text-gray-600">
                                                                        <div className="space-y-1">
                                                                            <div className="font-medium text-gray-900">
                                                                                {(trip.startLocation?.place || 'Unknown') + ' → ' + (trip.endLocation?.place || 'Unknown')}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-sm text-gray-600">
                                                                        <div className="space-y-1">
                                                                            {trip.actualEndDate && (
                                                                            <div className="font-medium">
                                                                                    {new Date(trip.actualEndDate).toLocaleDateString()}
                                                                            </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-sm text-gray-600">
                                                                        {trip.truck?.plateNumber || trip.truck?.internalId || 'N/A'}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-sm text-gray-900 font-medium">{trip.distanceInMiles || 0}</td>
                                                                    <td className="px-3 py-2 text-sm text-gray-600">${trip.mileRate || 0}/mile</td>
                                                                    <td className="px-3 py-2 text-sm font-bold text-green-600">${parseFloat(trip.earnings || '0').toFixed(2)}</td>
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
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                                
                                                {/* Selected Trips Summary */}
                                                {getSelectedTripsTotals().count > 0 && (
                                                    <div className="bg-blue-50 p-4 border-t border-blue-200">
                                                        <h6 className="text-sm font-medium text-blue-800 mb-2">Selected Trips Summary</h6>
                                                        <div className="grid grid-cols-3 gap-4 text-sm">
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
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Loading State */}
                                        {loadingTrips && (
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                                                <div className="text-sm text-blue-600 font-medium">Loading trip data...</div>
                                                <div className="text-xs text-blue-500 mt-1">Please wait while we fetch driver trips...</div>
                                            </div>
                                        )}

                                        {/* No Trips Message */}
                                        {!loadingTrips && driverTrips.length === 0 && formData.startDate && formData.endDate && selectedEmployee && (
                                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertCircle className="text-yellow-600" size={18} />
                                                    <div className="text-sm font-medium text-yellow-800">No trips found</div>
                                                </div>
                                                <div className="text-xs text-yellow-700">
                                                    No trips found for <strong>{selectedEmployee?.name || 'driver'}</strong> between <strong>{formData.startDate}</strong> and <strong>{formData.endDate}</strong>.
                                                </div>
                                                <div className="text-xs text-yellow-600 mt-1">
                                                    Try adjusting the date range or check if the driver has completed any trips.
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* No Date Range Selected */}
                                        {!loadingTrips && driverTrips.length === 0 && (!formData.startDate || !formData.endDate) && selectedEmployee && (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <div className="text-sm text-gray-600">
                                                    Please select a date range to view driver trips.
                                                </div>
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
                                        {selectedEmployee?.role?.toLowerCase() === 'driver' && driverPayrollSummary && (
                                            <div className="mt-2 text-xs text-gray-600">
                                                Based on {driverPayrollSummary.totalTrips} trips • {driverPayrollSummary.totalDistanceMiles.toLocaleString()} miles
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
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        <X size={16} />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={showCreateModal ? handleCreate : handleUpdate}
                                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 !text-white rounded-lg transition-all font-medium flex items-center gap-2 disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {showCreateModal ? <Plus size={16} /> : <CheckCircle size={16} />}
                                                {showCreateModal ? 'Create Payroll' : 'Update Payroll'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showViewModal && selectedPayroll && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center overflow-auto p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Eye className="text-green-600" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900">Payroll Details</h4>
                                        <p className="text-sm text-gray-500">{selectedPayroll.userId?.name || 'Unknown'}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowViewModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Employee Info */}
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Users size={20} className="text-blue-600" />
                                        Employee Information
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Name</label>
                                            <div className="mt-1 px-4 py-3 bg-white rounded-lg text-gray-900">
                                                {selectedPayroll.userId?.name || 'Unknown'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Role</label>
                                            <div className="mt-1 px-4 py-3 bg-white rounded-lg">
                                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                                    selectedPayroll.userId.role.toLowerCase() === 'driver'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {selectedPayroll.userId.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Driver-specific load details */}
                                {selectedPayroll.userId.role.toLowerCase() === 'driver' && selectedPayroll.loads && (
                                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                                        <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Package size={20} className="text-green-600" />
                                            Load Details ({selectedPayroll.loads.length} loads)
                                        </h5>
                                        
                                        {selectedPayroll.loads.length > 0 ? (
                                            <div className="space-y-4">
                                                {selectedPayroll.loads.map((load, index) => (
                                                    <div key={load._id} className="bg-white p-5 rounded-lg border border-green-200 shadow-sm">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                                    <Package className="text-green-600" size={20} />
                                                                </div>
                                                                <div>
                                                                    <h6 className="font-bold text-gray-900">
                                                                        Load #{index + 1}
                                                                    </h6>
                                                                    <p className="text-sm text-gray-500">
                                                                        {load.details?.internalId || load._id?.slice(-6).toUpperCase()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="space-y-3">
                                                            {load.route && (
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-600 mb-2 block flex items-center gap-1">
                                                                        <MapPin size={14} />
                                                                        Route
                                                                    </label>
                                                                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                                                                        {load.route.multipleDropOffs ? (
                                                                            <span>Multiple Waypoints</span>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium">{load.route.selectPickup?.place || 'Unknown'}</span>
                                                                                <span className="text-gray-400">→</span>
                                                                                <span className="font-medium">{load.route.selectDropOff?.place || 'Unknown'}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {load.assignedAt && (
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-600 mb-2 block flex items-center gap-1">
                                                                        <Clock size={14} />
                                                                        Assigned
                                                                    </label>
                                                                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                                                                        {new Date(load.assignedAt).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {load.startedAt && (
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-600 mb-2 block flex items-center gap-1">
                                                                        <Clock size={14} />
                                                                        Started
                                                                    </label>
                                                                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                                                                        {new Date(load.startedAt).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {load.completedAt && (
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-600 mb-2 block flex items-center gap-1">
                                                                        <CheckCircle size={14} />
                                                                        Completed
                                                                    </label>
                                                                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                                                                        {new Date(load.completedAt).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-gray-500">
                                                No loads found for this payroll
                                            </div>
                                        )}

                                        {/* Summary Card */}
                                        {(selectedPayroll.totalMiles || selectedPayroll.ratePerMile) && (
                                            <div className="mt-6 bg-white p-5 rounded-lg border-2 border-green-300 shadow-sm">
                                                <h6 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <TrendingUp className="text-green-600" size={18} />
                                                    Summary
                                                </h6>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-600 uppercase">Total Miles</label>
                                                        <div className="mt-1 text-2xl font-bold text-gray-900">
                                                            {selectedPayroll.totalMiles?.toLocaleString() || 0}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-600 uppercase">Rate per Mile</label>
                                                        <div className="mt-1 text-2xl font-bold text-gray-900">
                                                            ${selectedPayroll.ratePerMile || 0}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-600 uppercase">Total Earnings</label>
                                                        <div className="mt-1 text-2xl font-bold text-green-600">
                                                            ${selectedPayroll.baseSalary.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Payroll Summary */}
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                    <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <DollarSign size={20} className="text-blue-600" />
                                        Payroll Summary
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Base Salary / Earnings</label>
                                            <div className="mt-1 px-4 py-3 bg-white rounded-lg text-gray-900 font-bold">
                                                ${selectedPayroll.baseSalary.toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Bonus</label>
                                            <div className="mt-1 px-4 py-3 bg-white rounded-lg text-green-600 font-bold">
                                                +${selectedPayroll.bonus.toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Deductions</label>
                                            <div className="mt-1 px-4 py-3 bg-white rounded-lg text-red-600 font-bold">
                                                -${selectedPayroll.deductions.toLocaleString()}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Total Pay</label>
                                            <div className="mt-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white font-bold text-xl">
                                                ${selectedPayroll.totalSalary.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pay Period */}
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Calendar size={20} className="text-orange-600" />
                                        Pay Period
                                    </h5>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Start Date</label>
                                            <div className="mt-1 px-4 py-3 bg-white rounded-lg text-gray-900">
                                                {new Date(selectedPayroll.startDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">End Date</label>
                                            <div className="mt-1 px-4 py-3 bg-white rounded-lg text-gray-900">
                                                {new Date(selectedPayroll.endDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Pay Date</label>
                                            <div className="mt-1 px-4 py-3 bg-white rounded-lg text-gray-900">
                                                {new Date(selectedPayroll.payDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200">
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        <X size={18} />
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteModal && selectedPayroll && (
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Payroll</h3>
                                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                                </div>
                            </div>
                            
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete the payroll record for <strong>{selectedPayroll.userId?.name || 'Unknown'}</strong>?
                            </p>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedPayroll(null);
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium flex items-center gap-2"
                                    disabled={loading}
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 !text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
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