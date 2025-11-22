import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronDown, Search, Check } from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import { listDriver, listVehicle, listTrailers, createTrip, updateTrip } from "../../../../../axios/api/distapcher";
import { listOrder } from "../../../../../axios/api/distapcher";

type NotificationType = 'success' | 'error' | 'warning';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
}

const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    warning: <FaExclamationCircle className="text-yellow-500" size={24} />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`fixed top-4 right-4 flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg z-[10001] ${bgColors[notification.type]} animate-slide-in min-w-[300px] max-w-[500px]`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

interface Trip {
  _id?: string;
  tripNumber?: string;
  driver?: any;
  truck?: any;
  trailer?: any;
  orders?: any[];
  loads?: any[];
  status?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  notes?: string;
}

const NewTripSidebar = ({ trip, onClose, onSave }: { trip?: Trip | null; onClose: () => void; onSave: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  
  // Dropdown states
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [driverSearch, setDriverSearch] = useState("");
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);
  
  const [trucks, setTrucks] = useState<any[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<any | null>(null);
  const [truckSearch, setTruckSearch] = useState("");
  const [truckDropdownOpen, setTruckDropdownOpen] = useState(false);
  
  const [trailers, setTrailers] = useState<any[]>([]);
  const [selectedTrailer, setSelectedTrailer] = useState<any | null>(null);
  const [trailerSearch, setTrailerSearch] = useState("");
  const [trailerDropdownOpen, setTrailerDropdownOpen] = useState(false);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  
  // Form fields
  const [plannedStartDate, setPlannedStartDate] = useState(trip?.plannedStartDate ? new Date(trip.plannedStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [plannedEndDate, setPlannedEndDate] = useState(trip?.plannedEndDate ? new Date(trip.plannedEndDate).toISOString().split('T')[0] : "");
  const [status, setStatus] = useState(trip?.status || 'planned');
  const [notes, setNotes] = useState(trip?.notes || "");

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const driverDropdownRef = useRef<HTMLDivElement>(null);
  const truckDropdownRef = useRef<HTMLDivElement>(null);
  const trailerDropdownRef = useRef<HTMLDivElement>(null);
  const orderDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (trip) {
      if (trip.driver) {
        if (typeof trip.driver === 'object') {
          setSelectedDriver(trip.driver);
        } else {
          // Driver is just an ID, will be set when drivers load
        }
      }
      if (trip.truck) {
        if (typeof trip.truck === 'object') {
          setSelectedTruck(trip.truck);
        }
      }
      if (trip.trailer) {
        if (typeof trip.trailer === 'object') {
          setSelectedTrailer(trip.trailer);
        } else {
          setSelectedTrailer(null);
        }
      }
      if (trip.orders && Array.isArray(trip.orders)) {
        setSelectedOrders(trip.orders.map((o: any) => o._id || o));
      }
    }
  }, [trip, drivers, trucks, trailers]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (driverDropdownRef.current && target && !driverDropdownRef.current.contains(target)) {
        setDriverDropdownOpen(false);
      }
      if (truckDropdownRef.current && target && !truckDropdownRef.current.contains(target)) {
        setTruckDropdownOpen(false);
      }
      if (trailerDropdownRef.current && target && !trailerDropdownRef.current.contains(target)) {
        setTrailerDropdownOpen(false);
      }
      if (orderDropdownRef.current && target && !orderDropdownRef.current.contains(target)) {
        setOrderDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [driversRes, vehiclesRes, trailersRes, ordersRes] = await Promise.all([
        listDriver(),
        listVehicle(),
        listTrailers(),
        listOrder({ page: 1, limit: 500 }) // Fetch all orders (increased limit)
      ]);

      if (driversRes?.success && driversRes?.data) {
        const driverData = Array.isArray(driversRes.data) ? driversRes.data : [];
        setDrivers(driverData);
      }

      if (vehiclesRes?.success && vehiclesRes?.data) {
        const vehicleData = vehiclesRes.data?.vehicles || (Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
        setTrucks(vehicleData);
      }

      if (trailersRes?.success && trailersRes?.data) {
        const trailerData = Array.isArray(trailersRes.data) ? trailersRes.data : [];
        setTrailers(trailerData);
      }

      if (ordersRes?.success) {
        // Handle different response structures
        let orderData = [];
        if (Array.isArray(ordersRes.data)) {
          orderData = ordersRes.data;
        } else if (ordersRes.data?.orders && Array.isArray(ordersRes.data.orders)) {
          orderData = ordersRes.data.orders;
        } else if (ordersRes.data?.data && Array.isArray(ordersRes.data.data)) {
          orderData = ordersRes.data.data;
        }
        
        // Filter to show only orders that can be assigned (planned, QUOTED, CONFIRMED status)
        // Also show orders without status or with empty status
        const assignableOrders = orderData.filter((order: any) => {
          const status = order.status?.toLowerCase()?.trim();
          // Show orders that are not dispatched, in-delivery, or completed
          return !status || 
                 status === '' ||
                 status === 'planned' || 
                 status === 'quoted' || 
                 status === 'confirmed' ||
                 status === 'in_progress';
        });
        
        console.log('Fetched orders:', orderData.length, 'Assignable orders:', assignableOrders.length);
        console.log('Order data sample:', orderData.slice(0, 2));
        setOrders(assignableOrders);
      } else {
        console.error('Orders response error:', ordersRes);
        addNotification('error', ordersRes?.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      addNotification('error', 'Failed to fetch data');
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    !driverSearch ||
    (driver.name || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
    ((driver.firstName || '') + ' ' + (driver.lastName || '')).toLowerCase().includes(driverSearch.toLowerCase())
  );

  const filteredTrucks = trucks.filter(truck =>
    !truckSearch ||
    (truck.plateNumber || '').toLowerCase().includes(truckSearch.toLowerCase()) ||
    (truck.internalId || '').toLowerCase().includes(truckSearch.toLowerCase()) ||
    ((truck.make || '') + ' ' + (truck.model || '')).toLowerCase().includes(truckSearch.toLowerCase())
  );

  const filteredTrailers = trailers.filter(trailer =>
    !trailerSearch ||
    (trailer.plateNumber || '').toLowerCase().includes(trailerSearch.toLowerCase()) ||
    (trailer.trailerNumber || '').toLowerCase().includes(trailerSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(order => {
    const searchLower = orderSearch.toLowerCase();
    const orderNumber = (order.orderNumber || '').toLowerCase();
    const customerOrderNo = (order.customerOrderNo || '').toLowerCase();
    const customerName = (order.customer?.name || '').toLowerCase();
    const pickupPlace = typeof order.pickupLocation === 'string' 
      ? order.pickupLocation.toLowerCase()
      : (order.pickupLocation?.place || order.pickupLocation?.placeId?.name || '').toLowerCase();
    const deliveryPlace = typeof order.deliveryLocation === 'string'
      ? order.deliveryLocation.toLowerCase()
      : (order.deliveryLocation?.place || order.deliveryLocation?.placeId?.name || '').toLowerCase();
    
    return !orderSearch ||
      orderNumber.includes(searchLower) ||
      customerOrderNo.includes(searchLower) ||
      customerName.includes(searchLower) ||
      pickupPlace.includes(searchLower) ||
      deliveryPlace.includes(searchLower);
  });

  const handleSave = async () => {
    if (!selectedDriver) {
      addNotification('error', 'Please select a driver');
      return;
    }

    if (!selectedTruck) {
      addNotification('error', 'Please select a truck');
      return;
    }

    if (!plannedStartDate) {
      addNotification('error', 'Please select a planned start date');
      return;
    }

    if (selectedOrders.length === 0) {
      addNotification('error', 'Please select at least one order');
      return;
    }

    setLoading(true);
    try {
      const tripData = {
        driver: selectedDriver._id || selectedDriver,
        truck: selectedTruck._id || selectedTruck,
        trailer: selectedTrailer?._id || selectedTrailer || null,
        orders: selectedOrders,
        plannedStartDate,
        plannedEndDate: plannedEndDate || null,
        status,
        notes
      };

      let response;
      if (trip?._id) {
        response = await updateTrip(trip._id, tripData);
      } else {
        response = await createTrip(tripData);
      }

      if (response?.success) {
        addNotification('success', trip?._id ? 'Trip updated successfully' : 'Trip created successfully');
        setTimeout(() => {
          onSave();
        }, 500);
      } else {
        addNotification('error', response?.message || 'Failed to save trip');
      }
    } catch (error: any) {
      console.error("Error saving trip:", error);
      addNotification('error', error?.response?.data?.message || 'An error occurred while saving the trip');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Helper function to extract location string
  const extractLocationString = (location: any): string => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (location.place) return location.place;
    if (location.placeId?.name) return location.placeId.name;
    if (location.placeId?.currentLocation?.address) return location.placeId.currentLocation.address;
    return 'N/A';
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {trip ? "Edit Trip" : "New Trip"}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Driver Selection */}
          <div className="relative" ref={driverDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Driver <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div
                onClick={() => setDriverDropdownOpen(!driverDropdownOpen)}
                className="flex items-center gap-1 p-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
              >
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${driverDropdownOpen ? 'rotate-180' : ''}`} />
                <input
                  type="text"
                  value={selectedDriver ? (selectedDriver.name || `${selectedDriver.firstName || ''} ${selectedDriver.lastName || ''}`.trim()) : driverSearch}
                  onChange={(e) => {
                    setDriverSearch(e.target.value);
                    setDriverDropdownOpen(true);
                  }}
                  onFocus={() => setDriverDropdownOpen(true)}
                  placeholder="Select driver"
                  className="flex-1 outline-none text-sm min-w-0"
                  readOnly={!!selectedDriver}
                />
                {selectedDriver && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDriver(null);
                      setDriverSearch("");
                    }}
                    className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {driverDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={driverSearch}
                        onChange={(e) => setDriverSearch(e.target.value)}
                        placeholder="Search drivers..."
                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    {filteredDrivers.length > 0 ? (
                      filteredDrivers.map((driver) => (
                        <div
                          key={driver._id}
                          onClick={() => {
                            setSelectedDriver(driver);
                            setDriverSearch("");
                            setDriverDropdownOpen(false);
                          }}
                          className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${
                            selectedDriver?._id === driver._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="font-medium text-blue-600">
                            {driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Unnamed Driver'}
                          </div>
                          {(driver.email || driver.phone) && (
                            <div className="text-xs text-gray-600">
                              {driver.email || driver.phone}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No drivers found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Truck Selection */}
          <div className="relative" ref={truckDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Truck <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div
                onClick={() => setTruckDropdownOpen(!truckDropdownOpen)}
                className="flex items-center gap-1 p-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
              >
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${truckDropdownOpen ? 'rotate-180' : ''}`} />
                <input
                  type="text"
                  value={selectedTruck ? `${selectedTruck.plateNumber || selectedTruck.internalId || ''} - ${selectedTruck.make || ''} ${selectedTruck.model || ''}`.trim() : truckSearch}
                  onChange={(e) => {
                    setTruckSearch(e.target.value);
                    setTruckDropdownOpen(true);
                  }}
                  onFocus={() => setTruckDropdownOpen(true)}
                  placeholder="Select truck"
                  className="flex-1 outline-none text-sm min-w-0"
                  readOnly={!!selectedTruck}
                />
                {selectedTruck && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTruck(null);
                      setTruckSearch("");
                    }}
                    className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {truckDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={truckSearch}
                        onChange={(e) => setTruckSearch(e.target.value)}
                        placeholder="Search trucks..."
                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    {filteredTrucks.length > 0 ? (
                      filteredTrucks.map((truck) => (
                        <div
                          key={truck._id}
                          onClick={() => {
                            setSelectedTruck(truck);
                            setTruckSearch("");
                            setTruckDropdownOpen(false);
                          }}
                          className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${
                            selectedTruck?._id === truck._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="font-medium text-blue-600">
                            {truck.plateNumber || truck.internalId || 'Unknown'}
                          </div>
                          {(truck.make || truck.model) && (
                            <div className="text-xs text-gray-600">
                              {truck.make} {truck.model}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No trucks found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trailer Selection (Optional) */}
          <div className="relative" ref={trailerDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Trailer (Optional)
            </label>
            <div className="relative">
              <div
                onClick={() => setTrailerDropdownOpen(!trailerDropdownOpen)}
                className="flex items-center gap-1 p-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
              >
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${trailerDropdownOpen ? 'rotate-180' : ''}`} />
                <input
                  type="text"
                  value={selectedTrailer ? (selectedTrailer.plateNumber || selectedTrailer.trailerNumber || '') : trailerSearch}
                  onChange={(e) => {
                    setTrailerSearch(e.target.value);
                    setTrailerDropdownOpen(true);
                  }}
                  onFocus={() => setTrailerDropdownOpen(true)}
                  placeholder="Select trailer (optional)"
                  className="flex-1 outline-none text-sm min-w-0"
                  readOnly={!!selectedTrailer}
                />
                {selectedTrailer && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrailer(null);
                      setTrailerSearch("");
                    }}
                    className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {trailerDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={trailerSearch}
                        onChange={(e) => setTrailerSearch(e.target.value)}
                        placeholder="Search trailers..."
                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    <div
                      onClick={() => {
                        setSelectedTrailer(null);
                        setTrailerSearch("");
                        setTrailerDropdownOpen(false);
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm text-gray-600"
                    >
                      No Trailer
                    </div>
                    {filteredTrailers.length > 0 ? (
                      filteredTrailers.map((trailer) => (
                        <div
                          key={trailer._id}
                          onClick={() => {
                            setSelectedTrailer(trailer);
                            setTrailerSearch("");
                            setTrailerDropdownOpen(false);
                          }}
                          className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${
                            selectedTrailer?._id === trailer._id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="font-medium text-blue-600">
                            {trailer.plateNumber || trailer.trailerNumber || 'Unknown'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No trailers found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Planned Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Planned End Date
              </label>
              <input
                type="date"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                min={plannedStartDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Orders Selection */}
          <div className="relative" ref={orderDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Assign Orders
            </label>
            <div className="relative">
              <div
                onClick={() => setOrderDropdownOpen(!orderDropdownOpen)}
                className="flex items-center gap-1 p-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
              >
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${orderDropdownOpen ? 'rotate-180' : ''}`} />
                <input
                  type="text"
                  value={selectedOrders.length > 0 ? `${selectedOrders.length} order(s) selected` : orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    setOrderDropdownOpen(true);
                  }}
                  onFocus={() => setOrderDropdownOpen(true)}
                  placeholder="Select orders to assign"
                  className="flex-1 outline-none text-sm min-w-0"
                  readOnly={selectedOrders.length > 0}
                />
                {selectedOrders.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrders([]);
                      setOrderSearch("");
                    }}
                    className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {orderDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search orders..."
                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-96">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => {
                        const isSelected = selectedOrders.includes(order._id);
                        const customerName = order.customer?.name || order.customer?.firstName || 'N/A';
                        const pickupLocation = extractLocationString(order.pickupLocation);
                        const deliveryLocation = extractLocationString(order.deliveryLocation);
                        const orderStatus = order.status?.toLowerCase()?.trim() || '';
                        const isAssignable = !orderStatus || 
                                           orderStatus === '' ||
                                           orderStatus === 'planned' || 
                                           orderStatus === 'quoted' || 
                                           orderStatus === 'confirmed' ||
                                           orderStatus === 'in_progress';
                        return (
                          <div
                            key={order._id}
                            onClick={() => {
                              if (isAssignable) {
                                toggleOrderSelection(order._id);
                              }
                            }}
                            className={`px-3 py-3 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 ${
                              isSelected ? 'bg-blue-50' : ''
                            } ${!isAssignable ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-blue-600 mb-1">{order.orderNumber || order._id}</div>
                                {order.customerOrderNo && (
                                  <div className="text-xs text-gray-600 mb-1">Customer Order: {order.customerOrderNo}</div>
                                )}
                                <div className="text-xs text-gray-700 space-y-0.5">
                                  <div><span className="font-medium">Customer:</span> {customerName}</div>
                                  <div><span className="font-medium">Pickup:</span> {pickupLocation}</div>
                                  <div><span className="font-medium">Delivery:</span> {deliveryLocation}</div>
                                  {order.pickupDate && (
                                    <div><span className="font-medium">Pickup Date:</span> {new Date(order.pickupDate).toLocaleDateString()}</div>
                                  )}
                                  {order.deliveryDate && (
                                    <div><span className="font-medium">Delivery Date:</span> {new Date(order.deliveryDate).toLocaleDateString()}</div>
                                  )}
                                  {order.orderType && (
                                    <div><span className="font-medium">Type:</span> {order.orderType}</div>
                                  )}
                                  {order.status && (
                                    <div><span className="font-medium">Status:</span> <span className={`px-1.5 py-0.5 rounded text-xs ${
                                      order.status?.toLowerCase() === 'planned' ? 'bg-yellow-100 text-yellow-800' :
                                      order.status?.toLowerCase() === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                                      order.status?.toLowerCase() === 'in-delivery' ? 'bg-orange-100 text-orange-800' :
                                      order.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                                      order.status?.toLowerCase() === 'quoted' ? 'bg-purple-100 text-purple-800' :
                                      order.status?.toLowerCase() === 'confirmed' ? 'bg-indigo-100 text-indigo-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>{order.status}</span></div>
                                  )}
                                  {!isAssignable && order.status && (
                                    <div className="text-xs text-red-600 font-medium mt-1">
                                      Cannot assign - Order is {order.status}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : orders.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No orders available. Please create orders first.</div>
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No orders match your search.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedOrders.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Selected Orders ({selectedOrders.length}):
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrders.map(orderId => {
                    const order = orders.find(o => o._id === orderId);
                    if (!order) return null;
                    const customerName = order.customer?.name || order.customer?.firstName || 'N/A';
                    const pickupLocation = extractLocationString(order.pickupLocation);
                    const deliveryLocation = extractLocationString(order.deliveryLocation);
                    return (
                      <div key={orderId} className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-blue-700 mb-1">{order.orderNumber || order._id}</div>
                            <div className="text-gray-700 space-y-0.5">
                              {order.customerOrderNo && <div>Customer Order: {order.customerOrderNo}</div>}
                              <div><span className="font-medium">Customer:</span> {customerName}</div>
                              <div><span className="font-medium">Pickup:</span> {pickupLocation}</div>
                              <div><span className="font-medium">Delivery:</span> {deliveryLocation}</div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOrderSelection(orderId);
                            }}
                            className="p-1 hover:bg-red-100 rounded flex-shrink-0 text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add any notes about this trip..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onClose}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 text-sm font-medium !text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : trip ? "Update Trip" : "Create Trip"}
        </button>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[10001] flex flex-col gap-2">
        {notifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </div>
  );
};

export default NewTripSidebar;

