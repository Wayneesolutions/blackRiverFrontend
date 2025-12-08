import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, Users, Calendar, TrendingUp, X, AlertCircle, CheckCircle, Edit2, Trash2, Eye, MapPin, Package, Clock, Truck } from 'lucide-react';

// Mock API functions - replace with your actual API
const mockAPI = {
  getDrivers: async () => ({
    success: true,
    data: [
      { _id: '1', name: 'John Smith', role: 'driver', details: { mileRate: 0.65 } },
      { _id: '2', name: 'Mike Johnson', role: 'driver', details: { mileRate: 0.60 } },
      { _id: '3', name: 'David Wilson', role: 'driver', details: { mileRate: 0.70 } }
    ]
  }),
  
  getDriverTrips: async (driverId, startDate, endDate) => ({
    success: true,
    data: [
      {
        _id: 't1',
        tripNumber: 'TRP-001',
        startLocation: { place: 'Los Angeles, CA' },
        endLocation: { place: 'Phoenix, AZ' },
        actualEndDate: '2024-01-15',
        distance: 603,
        distanceInMiles: 375,
        mileRate: 0.65,
        earnings: '243.75',
        truck: { plateNumber: 'CAL-123' },
        status: 'completed'
      },
      {
        _id: 't2',
        tripNumber: 'TRP-002',
        startLocation: { place: 'Phoenix, AZ' },
        endLocation: { place: 'Dallas, TX' },
        actualEndDate: '2024-01-18',
        distance: 1691,
        distanceInMiles: 1050,
        mileRate: 0.65,
        earnings: '682.50',
        truck: { plateNumber: 'CAL-123' },
        status: 'completed'
      }
    ],
    summary: {
      totalTrips: 2,
      totalDistanceKm: 2294,
      totalDistanceMiles: 1425,
      totalEarnings: 926.25,
      ratePerMile: 0.65
    }
  }),
  
  listDriverPayrolls: async () => ({
    success: true,
    data: [
      {
        _id: 'p1',
        userId: { _id: '1', name: 'John Smith', role: 'driver' },
        baseSalary: 926.25,
        bonus: 100,
        deductions: 50,
        totalSalary: 976.25,
        payDate: '2024-01-31',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        totalMiles: 1425,
        ratePerMile: 0.65,
        trips: [
          { _id: 't1', tripNumber: 'TRP-001', distanceInMiles: 375, earnings: '243.75' },
          { _id: 't2', tripNumber: 'TRP-002', distanceInMiles: 1050, earnings: '682.50' }
        ]
      }
    ]
  }),
  
  createPayroll: async (data) => ({
    success: true,
    message: 'Driver payroll created successfully!'
  }),
  
  updatePayroll: async (id, data) => ({
    success: true,
    message: 'Driver payroll updated successfully!'
  }),
  
  deletePayroll: async (id) => ({
    success: true,
    message: 'Driver payroll deleted successfully!'
  })
};

const DriverPayrollManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [driverTrips, setDriverTrips] = useState([]);
  const [driverPayrollSummary, setDriverPayrollSummary] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    userId: '',
    bonus: '0',
    deductions: '0',
    payDate: '',
    startDate: '',
    endDate: ''
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchDrivers = async () => {
    try {
      const response = await mockAPI.getDrivers();
      if (response?.success) {
        setDrivers(response.data);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const response = await mockAPI.listDriverPayrolls();
      if (response?.success) {
        setPayrollData(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverTrips = async (driverId, startDate, endDate) => {
    setLoadingTrips(true);
    try {
      const response = await mockAPI.getDriverTrips(driverId, startDate, endDate);
      
      if (response?.success) {
        const trips = (response.data || []).map((trip) => ({
          ...trip,
          selected: true // Auto-select all trips
        }));
        
        setDriverTrips(trips);

        if (response.summary) {
          setDriverPayrollSummary(response.summary);
          setFormData(prev => ({
            ...prev,
            baseSalary: response.summary.totalEarnings.toString()
          }));
        }
      } else {
        showNotification('error', 'Failed to fetch driver trips');
        setDriverTrips([]);
        setDriverPayrollSummary(null);
      }
    } catch (error) {
      console.error('Error fetching driver trips:', error);
      showNotification('error', 'Error fetching driver trips');
    } finally {
      setLoadingTrips(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchPayrolls();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'userId') {
      const selectedDrv = drivers.find(drv => drv._id === value);
      setSelectedDriver(selectedDrv || null);
      
      // Auto-fetch trips for current month
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
      
      fetchDriverTrips(value, startDate, endDate);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDateRangeChange = (startDate, endDate) => {
    setFormData(prev => ({
      ...prev,
      startDate,
      endDate
    }));

    if (selectedDriver && startDate && endDate) {
      fetchDriverTrips(selectedDriver._id, startDate, endDate);
    }
  };

  const toggleTripSelection = (tripId) => {
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

  const getSelectedTripsTotals = () => {
    const selectedTrips = driverTrips.filter(trip => trip.selected);
    const totalMiles = selectedTrips.reduce((sum, trip) => sum + (trip.distanceInMiles || 0), 0);
    const totalEarnings = selectedTrips.reduce((sum, trip) => sum + parseFloat(trip.earnings || '0'), 0);
    
    return {
      count: selectedTrips.length,
      totalMiles,
      totalEarnings
    };
  };

  const handleCreate = async () => {
    if (!formData.userId || !formData.payDate || !formData.startDate || !formData.endDate) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    if (driverTrips.filter(t => t.selected).length === 0) {
      showNotification('error', 'Please select at least one trip');
      return;
    }

    setLoading(true);
    
    try {
      const selectedTotals = getSelectedTripsTotals();
      const payload = {
        userId: formData.userId,
        baseSalary: selectedTotals.totalEarnings,
        bonus: parseFloat(formData.bonus) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        payDate: formData.payDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
        tripIds: driverTrips.filter(t => t.selected).map(trip => trip._id),
        totalMiles: selectedTotals.totalMiles,
        ratePerMile: driverPayrollSummary?.ratePerMile || 0
      };

      const response = await mockAPI.createPayroll(payload);
      
      if (response?.success) {
        showNotification('success', response.message);
        setShowCreateModal(false);
        resetForm();
        fetchPayrolls();
      } else {
        showNotification('error', 'Failed to create driver payroll');
      }
    } catch (error) {
      showNotification('error', 'Error creating driver payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPayroll) return;

    setLoading(true);
    
    try {
      const payload = {
        bonus: parseFloat(formData.bonus) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        payDate: formData.payDate
      };

      const response = await mockAPI.updatePayroll(selectedPayroll._id, payload);
      
      if (response?.success) {
        showNotification('success', response.message);
        setShowEditModal(false);
        resetForm();
        setSelectedPayroll(null);
        fetchPayrolls();
      } else {
        showNotification('error', 'Failed to update driver payroll');
      }
    } catch (error) {
      showNotification('error', 'Error updating driver payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPayroll) return;
    
    setLoading(true);
    
    try {
      const response = await mockAPI.deletePayroll(selectedPayroll._id);
      
      if (response?.success) {
        showNotification('success', response.message);
        setShowDeleteModal(false);
        setSelectedPayroll(null);
        fetchPayrolls();
      } else {
        showNotification('error', 'Failed to delete driver payroll');
      }
    } catch (error) {
      showNotification('error', 'Error deleting driver payroll');
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (payroll) => {
    setSelectedPayroll(payroll);
    setShowViewModal(true);
  };

  const openEditModal = (payroll) => {
    setSelectedPayroll(payroll);
    const payDateFormatted = payroll.payDate ? payroll.payDate.split('T')[0] : '';
    
    setFormData({
      userId: payroll.userId._id,
      bonus: payroll.bonus.toString(),
      deductions: payroll.deductions.toString(),
      payDate: payDateFormatted,
      startDate: payroll.startDate.split('T')[0],
      endDate: payroll.endDate.split('T')[0]
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (payroll) => {
    setSelectedPayroll(payroll);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      bonus: '0',
      deductions: '0',
      payDate: '',
      startDate: '',
      endDate: ''
    });
    setSelectedDriver(null);
    setDriverTrips([]);
    setDriverPayrollSummary(null);
  };

  const filteredPayrolls = payrollData.filter(payroll => {
    const searchLower = searchTerm.toLowerCase();
    return searchTerm === '' || 
      payroll.userId.name?.toLowerCase().includes(searchLower);
  });

  const totalPayroll = payrollData.reduce((sum, payroll) => sum + payroll.totalSalary, 0);
  const totalMiles = payrollData.reduce((sum, payroll) => sum + (payroll.totalMiles || 0), 0);
  const avgPerMile = totalMiles > 0 ? totalPayroll / totalMiles : 0;

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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Truck className="text-green-600" size={36} />
              Driver Payroll
            </h1>
            <p className="text-gray-600 mt-2">Manage driver earnings based on trips and miles</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            Create Driver Payroll
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${totalPayroll.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{payrollData.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Miles</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalMiles.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border-gray-200 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg per Mile</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">${avgPerMile.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Package className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-gray-200 shadow-sm border mb-6">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border-gray-200 rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Driver Payroll Records</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No driver payroll records found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trips</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Miles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate/Mile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip Earnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayrolls.map((payroll) => (
                    <tr key={payroll._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-green-500">
                            {payroll.userId.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{payroll.userId.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payroll.trips?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payroll.totalMiles?.toLocaleString() || 0} mi
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${payroll.ratePerMile || 0}/mi
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
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
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openViewModal(payroll)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => openEditModal(payroll)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(payroll)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} />
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

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center overflow-auto p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                    <Truck className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {showCreateModal ? 'Create Driver Payroll' : 'Edit Driver Payroll'}
                    </h4>
                    <p className="text-sm text-gray-500">Based on completed trips and mileage</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {showCreateModal && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Driver <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Choose a driver...</option>
                        {drivers.map((driver) => (
                          <option key={driver._id} value={driver._id}>
                            {driver.name} - Rate: ${driver.details?.mileRate || 0}/mile
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar size={16} />
                        Trip Period
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={(e) => handleDateRangeChange(e.target.value, formData.endDate)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trip Summary */}
                    {driverPayrollSummary && (
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                        <h5 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <TrendingUp size={20} />
                          Trip Summary for {selectedDriver?.name}
                        </h5>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold">{driverPayrollSummary.totalTrips}</div>
                            <div className="text-sm text-green-100">Total Trips</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold">{driverPayrollSummary.totalDistanceMiles.toLocaleString()}</div>
                            <div className="text-sm text-green-100">Total Miles</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold">${driverPayrollSummary.ratePerMile}</div>
                            <div className="text-sm text-green-100">Rate per Mile</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold">${driverPayrollSummary.totalEarnings.toFixed(2)}</div>
                            <div className="text-sm text-green-100">Total Earnings</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Trip List */}
                    {driverTrips.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                          <h5 className="text-sm font-medium text-gray-700">Completed Trips ({driverTrips.length})</h5>
                          <div className="flex gap-2">
                            <button
                              onClick={selectAllTrips}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Select All
                            </button>
                            <button
                              onClick={deselectAllTrips}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                          <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trip #</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Truck</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Miles</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {driverTrips.map((trip) => (
                                <tr key={trip._id} className={`hover:bg-gray-50 ${trip.selected ? 'bg-green-50' : ''}`}>
                                  <td className="px-3 py-2">
                                    <input
                                      type="checkbox"
                                      checked={trip.selected || false}
                                      onChange={() => toggleTripSelection(trip._id)}
                                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                    {trip.tripNumber || trip._id?.slice(-6).toUpperCase()}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <MapPin size={14} className="text-gray-400" />
                                      <span>{trip.startLocation?.place || 'Unknown'}</span>
                                      <span className="text-gray-400">→</span>
                                      <span>{trip.endLocation?.place || 'Unknown'}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    {trip.actualEndDate ? new Date(trip.actualEndDate).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    {trip.truck?.plateNumber || 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                    {trip.distanceInMiles || 0}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    ${trip.mileRate || 0}/mi
                                  </td>
                                  <td className="px-3 py-2 text-sm font-bold text-green-600">
                                    ${parseFloat(trip.earnings || '0').toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-green-50 sticky bottom-0">
                              <tr>
                                <td colSpan={5} className="px-3 py-3 text-sm font-medium text-gray-900 text-right">
                                  Selected Totals:
                                </td>
                                <td className="px-3 py-3 text-sm font-bold text-gray-900">
                                  {getSelectedTripsTotals().totalMiles.toLocaleString()} mi
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-600">-</td>
                                <td className="px-3 py-3 text-sm font-bold text-green-600">
                                  ${getSelectedTripsTotals().totalEarnings.toFixed(2)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {loadingTrips && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-sm text-green-600 font-medium mt-2">Loading trips...</p>
                      </div>
                    )}

                    {!loadingTrips && driverTrips.length === 0 && selectedDriver && formData.startDate && formData.endDate && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="text-yellow-600" size={18} />
                          <div className="text-sm font-medium text-yellow-800">No completed trips found</div>
                        </div>
                        <p className="text-xs text-yellow-700">
                          No trips found for {selectedDriver.name} between {formData.startDate} and {formData.endDate}.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {getSelectedTripsTotals().count > 0 && (
                  <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-green-100">Total Driver Pay</p>
                        <p className="text-4xl font-bold mt-1">
                          ${(
                            getSelectedTripsTotals().totalEarnings + 
                            parseFloat(formData.bonus || '0') - 
                            parseFloat(formData.deductions || '0')
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-100">Based on</p>
                        <p className="text-lg font-bold">{getSelectedTripsTotals().count} trips</p>
                        <p className="text-sm text-green-100">{getSelectedTripsTotals().totalMiles.toLocaleString()} miles</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center gap-2"
                    disabled={loading}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={showCreateModal ? handleCreate : handleUpdate}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
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

        {/* View Modal */}
        {showViewModal && selectedPayroll && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center overflow-auto p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Driver Payroll Details</h4>
                    <p className="text-sm text-gray-500">{selectedPayroll.userId.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Driver Info */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
                  <h5 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Truck size={20} />
                    Driver Information
                  </h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-green-100">Driver Name</label>
                      <div className="text-xl font-bold mt-1">{selectedPayroll.userId.name}</div>
                    </div>
                    <div>
                      <label className="text-sm text-green-100">Total Trips</label>
                      <div className="text-xl font-bold mt-1">{selectedPayroll.trips?.length || 0}</div>
                    </div>
                    <div>
                      <label className="text-sm text-green-100">Pay Period</label>
                      <div className="text-sm font-medium mt-1">
                        {new Date(selectedPayroll.startDate).toLocaleDateString()} - {new Date(selectedPayroll.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                {selectedPayroll.trips && selectedPayroll.trips.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700">Trip Details ({selectedPayroll.trips.length})</h5>
                    </div>
                    <div className="overflow-x-auto max-h-80">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trip #</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Miles</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedPayroll.trips.map((trip) => (
                            <tr key={trip._id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                {trip.tripNumber || trip._id?.slice(-6).toUpperCase()}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <MapPin size={14} className="text-gray-400" />
                                  <span>{trip.startLocation?.place || 'Unknown'}</span>
                                  <span className="text-gray-400">→</span>
                                  <span>{trip.endLocation?.place || 'Unknown'}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                {trip.actualEndDate ? new Date(trip.actualEndDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                {trip.distanceInMiles || 0} mi
                              </td>
                              <td className="px-3 py-2 text-sm font-bold text-green-600">
                                ${parseFloat(trip.earnings || '0').toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Earnings Breakdown */}
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-green-600" />
                    Earnings Breakdown
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Trip Earnings ({selectedPayroll.totalMiles?.toLocaleString()} miles @ ${selectedPayroll.ratePerMile}/mi)</span>
                      <span className="text-lg font-bold text-gray-900">${selectedPayroll.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Bonus</span>
                      <span className="text-lg font-bold text-green-600">+${selectedPayroll.bonus.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Deductions</span>
                      <span className="text-lg font-bold text-red-600">-${selectedPayroll.deductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">
                      <span className="text-sm font-medium text-white">Total Pay</span>
                      <span className="text-2xl font-bold text-white">${selectedPayroll.totalSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-orange-600" />
                    Payment Information
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Payment Date</label>
                      <div className="mt-1 px-4 py-3 bg-white rounded-lg text-gray-900 font-medium">
                        {new Date(selectedPayroll.payDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Pay Period</label>
                      <div className="mt-1 px-4 py-3 bg-white rounded-lg text-gray-900 font-medium">
                        {new Date(selectedPayroll.startDate).toLocaleDateString()} - {new Date(selectedPayroll.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedPayroll && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Driver Payroll</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the payroll record for driver <strong>{selectedPayroll.userId.name}</strong>?
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPayroll(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
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

export default DriverPayrollManagement;