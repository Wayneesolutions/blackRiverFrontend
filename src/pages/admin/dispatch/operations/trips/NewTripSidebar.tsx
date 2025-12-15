import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ChevronDown, Search, Download, Check, Upload } from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import { listDriver, createTrip, updateTrip, uploadTripDocument, deleteTripDocument, getTripDocumentSignedUrl } from "../../../../../axios/api/distapcher";
import { listOrder } from "../../../../../axios/api/distapcher";
import { File, Trash2 } from "lucide-react";
import { listFleetUnits } from "../../../../../axios/api/fleet.units";
import { FLEET_COLORS, getFocusStyles } from "../../../fleetMaintenance/colorUtils";

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
  plannedStartDate?: string | null | undefined;
  plannedEndDate?: string | null | undefined;
  notes?: string;
  documents?: Array<{
    _id?: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    uploadedBy?: any;
    uploadedAt?: string;
    description?: string;
  }>;
}

const NewTripSidebar = ({ trip, onClose, onSave }: { trip?: Trip | null; onClose: () => void; onSave: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const focusHandlers = getFocusStyles();
  const primaryButtonStyle: React.CSSProperties = {
    background: `linear-gradient(
      90deg,
      #42aeec 0%,
      #1db5f5 40%,
      #0ea3d8 100%
    )`,
    color: "#fff",
    boxShadow: `0 12px 24px ${FLEET_COLORS.focusRing}`,
  };

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
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any[]>([]); // Store full order details for selected orders
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);

  // Form fields
  const [plannedStartDate, setPlannedStartDate] = useState(trip?.plannedStartDate ? new Date(trip.plannedStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [plannedEndDate, setPlannedEndDate] = useState(trip?.plannedEndDate ? new Date(trip.plannedEndDate).toISOString().split('T')[0] : "");
  const [status, setStatus] = useState(trip?.status || 'planned');
  const [notes, setNotes] = useState(trip?.notes || "");

  // Documents
  const [documents, setDocuments] = useState<Array<{
    _id?: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    uploadedBy?: any;
    uploadedAt?: string;
    description?: string;
  }>>(trip?.documents || []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // Files selected before trip creation
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trailerKeywords = useMemo(
    () => ['trailer', 'dry van', 'reefer', 'flatbed', 'step deck', 'lowboy', 'tank', 'dump'],
    []
  );

  const isTrailerUnit = useCallback(
    (unit: any) => {
      const type = (unit?.unitType || '').toLowerCase();
      if (unit?.source === 'trailer') return true;
      if (unit?.trailerType) return true;
      if (!type) return false;
      if (type === 'truck' || type.includes('truck') || type === 'bus/van') return false;
      return trailerKeywords.some((keyword) => type.includes(keyword));
    },
    [trailerKeywords]
  );

  const normalizeFleetUnit = useCallback(
    (unit: any) => ({
      _id: unit._id,
      unitNo: unit.unitNo,
      unitType: unit.unitType,
      make: unit.make || '',
      model: unit.model || '',
      makeModel: unit.makeModel || '',
      licensePlate: unit.licensePlate || unit.vinNo || '',
      vinNo: unit.vinNo,
      trailerType: unit.trailerType,
      capacity: unit.capacity,
      source: unit.source,
      status: unit.status
    }),
    []
  );

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
      setDocuments(trip.documents || []);
      setPendingFiles([]); // Clear pending files when editing existing trip
      if (trip.driver) {
        if (typeof trip.driver === 'object') {
          setSelectedDriver(trip.driver);
        } else {
          // Driver is just an ID, will be set when drivers load
        }
      }
      if (trip.truck) {
        if (typeof trip.truck === 'object') {
          const truckId = trip.truck._id || trip.truck.id;
          const matchedTruck =
            trucks.find(
              (truck) =>
                truck._id === truckId ||
                (truck.unitNo && truck.unitNo === trip.truck.unitNo) ||
                (truck.licensePlate && truck.licensePlate === trip.truck.licensePlate)
            ) || null;
          setSelectedTruck(matchedTruck || trip.truck);
        } else {
          const matchedTruck = trucks.find((truck) => truck._id === trip.truck);
          if (matchedTruck) {
            setSelectedTruck(matchedTruck);
          }
        }
      } else {
        setSelectedTruck(null);
      }
      if (trip.trailer) {
        if (typeof trip.trailer === 'object') {
          const trailerId = trip.trailer._id || trip.trailer.id;
          const matchedTrailer =
            trailers.find(
              (trailer) =>
                trailer._id === trailerId ||
                (trailer.unitNo && trailer.unitNo === trip.trailer.unitNo) ||
                (trailer.licensePlate && trailer.licensePlate === trip.trailer.licensePlate)
            ) || null;
          setSelectedTrailer(matchedTrailer || trip.trailer);
        } else {
          const matchedTrailer = trailers.find((trailer) => trailer._id === trip.trailer);
          setSelectedTrailer(matchedTrailer || null);
        }
      } else {
        setSelectedTrailer(null);
      }
      if (trip.orders && Array.isArray(trip.orders)) {
        const orderIds = trip.orders.map((o: any) => o._id || o);
        setSelectedOrders(orderIds);
        // Store full order details for display even if they're not in assignable orders list
        setSelectedOrderDetails(trip.orders.filter((o: any) => o && (o._id || typeof o === 'string')));
      }
    } else {
      // Reset when creating new trip
      setSelectedOrders([]);
      setSelectedOrderDetails([]);
    }
  }, [trip, drivers, trucks, trailers]);

  // Sync selectedOrderDetails with selectedOrders whenever selectedOrders changes
  useEffect(() => {
    if (selectedOrders.length === 0) {
      // Clear selectedOrderDetails if no orders are selected
      setSelectedOrderDetails([]);
      return;
    }

    if (orders.length > 0) {
      // Build a complete selectedOrderDetails array from current selectedOrders
      setSelectedOrderDetails((prev: any[]) => {
        // Create a map of existing order details for quick lookup
        const existingMap = new Map();
        prev.forEach((o: any) => {
          const oId = String(o._id || o);
          existingMap.set(oId, o);
        });

        // Build new array with all selected orders
        const newDetails = selectedOrders.map((orderId: string) => {
          const orderIdStr = String(orderId);
          // First check if we already have it in prev details
          if (existingMap.has(orderIdStr)) {
            return existingMap.get(orderIdStr);
          }
          // Otherwise try to find in orders list
          const order = orders.find((o: any) => {
            const oId = String(o._id || o);
            return oId === orderIdStr;
          });
          return order || null;
        }).filter(Boolean);

        return newDetails;
      });
    }
  }, [selectedOrders, orders]);

  // Clear search when dropdown opens to show all orders
  useEffect(() => {
    if (orderDropdownOpen) {
      setOrderSearch("");
    }
  }, [orderDropdownOpen]);

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
      const [driversRes, fleetUnitsRes, ordersRes] = await Promise.all([
        listDriver(),
        listFleetUnits({ category: 'all' }),
        listOrder({ page: 1, limit: 500 }) // Fetch all orders (increased limit)
      ]);

      if (driversRes?.success && driversRes?.data) {
        const driverData = Array.isArray(driversRes.data) ? driversRes.data : [];
        setDrivers(driverData);
      }

      if (fleetUnitsRes?.success && Array.isArray(fleetUnitsRes.data)) {
        const normalizedUnits = fleetUnitsRes.data.map(normalizeFleetUnit);
        const truckUnits = normalizedUnits.filter((unit) => !isTrailerUnit(unit));
        const trailerUnits = normalizedUnits.filter((unit) => isTrailerUnit(unit));
        setTrucks(truckUnits);
        setTrailers(trailerUnits);
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
        // Exclude orders that are already assigned to a trip (have tripNo)
        const assignableOrders = orderData.filter((order: any) => {
          // Don't show orders that are already assigned to a trip
          if (order.tripNo && order.tripNo.trim() !== '') {
            return false;
          }
          const status = order.status?.toLowerCase()?.trim() || '';
          // Show orders that are not dispatched, in-delivery, or completed
          return !status ||
            status === '' ||
            status === 'planned' ||
            status === 'quoted' ||
            status === 'confirmed' ||
            status === 'in_progress';
        });

        setOrders(assignableOrders);

        // If editing and have selected orders, sync selectedOrderDetails with fetched orders
        if (trip && selectedOrders.length > 0) {
          const updatedSelectedDetails = selectedOrders.map((orderId: string) => {
            // First check if already in selectedOrderDetails (from trip.orders)
            const existing = selectedOrderDetails.find((o: any) => (o._id || o) === orderId);
            if (existing && existing.customer) return existing; // Already have full details
            // Otherwise, try to find in fetched orders
            return assignableOrders.find((o: any) => o._id === orderId) || existing;
          }).filter(Boolean);
          if (updatedSelectedDetails.length > 0) {
            setSelectedOrderDetails(updatedSelectedDetails);
          }
        }
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

  const filteredTrucks = trucks.filter((truck) => {
    if (!truckSearch) return true;
    const search = truckSearch.toLowerCase();
    return (
      (truck.unitNo || '').toLowerCase().includes(search) ||
      (truck.licensePlate || truck.plateNumber || '').toLowerCase().includes(search) ||
      (truck.makeModel || `${truck.make || ''} ${truck.model || ''}` || '').toLowerCase().includes(search)
    );
  });

  const filteredTrailers = trailers.filter((trailer) => {
    if (!trailerSearch) return true;
    const search = trailerSearch.toLowerCase();
    return (
      (trailer.unitNo || '').toLowerCase().includes(search) ||
      (trailer.licensePlate || trailer.plateNumber || trailer.trailerNumber || '').toLowerCase().includes(search) ||
      (trailer.makeModel || trailer.trailerType || '').toLowerCase().includes(search)
    );
  });

  const filteredOrders = useMemo(() => {
    if (!orderSearch || orderSearch.trim() === '') {
      // If no search term, return all orders
      return orders;
    }

    const searchLower = orderSearch.toLowerCase().trim();
    return orders.filter((order: any) => {
      const orderNumber = (order.orderNumber || '').toLowerCase();
      const customerOrderNo = (order.customerOrderNo || '').toLowerCase();
      const customerName = (order.customer?.name || order.customer?.firstName || '').toLowerCase();
      const pickupPlace = typeof order.pickupLocation === 'string'
        ? order.pickupLocation.toLowerCase()
        : (order.pickupLocation?.place || order.pickupLocation?.placeId?.name || order.pickupLocation?.placeId?.currentLocation?.address || '').toLowerCase();
      const deliveryPlace = typeof order.deliveryLocation === 'string'
        ? order.deliveryLocation.toLowerCase()
        : (order.deliveryLocation?.place || order.deliveryLocation?.placeId?.name || order.deliveryLocation?.placeId?.currentLocation?.address || '').toLowerCase();

      return orderNumber.includes(searchLower) ||
        customerOrderNo.includes(searchLower) ||
        customerName.includes(searchLower) ||
        pickupPlace.includes(searchLower) ||
        deliveryPlace.includes(searchLower);
    });
  }, [orders, orderSearch]);

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
        status: trip?._id ? status : 'planned', // Always create new trips with 'planned' status
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

        // If trip was just created and we have pending files, upload them
        if (!trip?._id && response?.data?._id && pendingFiles.length > 0) {
          const newTripId = response.data._id;
          // Small delay to ensure trip is fully saved
          setTimeout(async () => {
            if (newTripId) {
              await uploadPendingFiles(newTripId);
            }
          }, 300);
        }

        // If trip was updated, refresh documents from response
        if (trip?._id && response?.data?.documents) {
          setDocuments(response.data.documents || []);
        }

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
    // Get current state first
    setSelectedOrders(prevOrders => {
      const isSelected = prevOrders.includes(orderId);

      if (isSelected) {
        // Remove order
        const newOrders = prevOrders.filter(id => id !== orderId);
        setSelectedOrderDetails((prevDetails: any[]) => {
          return prevDetails.filter((o: any) => {
            const oId = o._id || o;
            return String(oId) !== String(orderId);
          });
        });
        return newOrders;
      } else {
        // Add order - find full order details from orders list
        const order = orders.find((o: any) => o._id === orderId);
        if (order) {
          setSelectedOrderDetails((prevDetails: any[]) => {
            // Check if order already exists to avoid duplicates
            const exists = prevDetails.some((o: any) => {
              const oId = o._id || o;
              return String(oId) === String(orderId);
            });
            if (exists) {
              return prevDetails;
            }
            // Add the order with all its details
            return [...prevDetails, { ...order }];
          });
        }
        return [...prevOrders, orderId];
      }
    });
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to Array
    const filesArray = Array.from(files);

    // If trip exists, upload immediately
    if (trip?._id) {
      const tripId = trip._id;
      setUploadingDocument(true);
      try {
        // Upload all files
        const uploadPromises = filesArray.map(file => uploadTripDocument(tripId, file));
        const results = await Promise.allSettled(uploadPromises);

        let successCount = 0;
        let failCount = 0;

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value?.success && result.value?.data) {
            setDocuments(prev => [...prev, result.value.data]);
            successCount++;
          } else {
            failCount++;
          }
        });

        if (successCount > 0) {
          addNotification('success', `${successCount} document(s) uploaded successfully`);
        }
        if (failCount > 0) {
          addNotification('error', `${failCount} document(s) failed to upload`);
        }
      } catch (error: any) {
        console.error("Error uploading documents:", error);
        addNotification('error', error?.response?.data?.message || 'An error occurred while uploading documents');
      } finally {
        setUploadingDocument(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } else {
      // Trip doesn't exist yet - add to pending files
      setPendingFiles(prev => [...prev, ...filesArray]);
      addNotification('success', `${filesArray.length} file(s) selected. They will be uploaded after trip creation.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Upload pending files after trip creation
  const uploadPendingFiles = async (tripId: string) => {
    if (pendingFiles.length === 0) return;

    setUploadingDocument(true);
    try {
      const uploadPromises = pendingFiles.map(file => uploadTripDocument(tripId, file));
      const results = await Promise.allSettled(uploadPromises);

      let successCount = 0;
      let failCount = 0;

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value?.success && result.value?.data) {
          setDocuments(prev => [...prev, result.value.data]);
          successCount++;
        } else {
          failCount++;
        }
      });

      if (successCount > 0) {
        addNotification('success', `${successCount} document(s) uploaded successfully`);
      }
      if (failCount > 0) {
        addNotification('error', `${failCount} document(s) failed to upload`);
      }

      // Clear pending files after upload
      setPendingFiles([]);
    } catch (error: any) {
      console.error("Error uploading pending documents:", error);
      addNotification('error', 'Some documents failed to upload. You can upload them manually.');
    } finally {
      setUploadingDocument(false);
    }
  };

  // Remove pending file
  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!trip?._id) {
      addNotification('error', 'Cannot delete document');
      return;
    }

    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await deleteTripDocument(trip._id, documentId);
      if (response?.success) {
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        addNotification('success', 'Document deleted successfully');
      } else {
        addNotification('error', response?.message || 'Failed to delete document');
      }
    } catch (error: any) {
      console.error("Error deleting document:", error);
      addNotification('error', error?.response?.data?.message || 'An error occurred while deleting the document');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6 min-w-0">
          {/* Driver Selection */}
          <div className="relative" ref={driverDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Driver <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div
                onClick={() => setDriverDropdownOpen(!driverDropdownOpen)}
                className="flex items-center gap-1 p-2 border border-gray-300 rounded-lg bg-white cursor-pointer transition-colors"
                style={{
                  borderColor: driverDropdownOpen ? FLEET_COLORS.primary : undefined,
                  boxShadow: driverDropdownOpen ? `0 0 0 2px ${FLEET_COLORS.focusRing}` : undefined
                }}
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
                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none"

                        onFocus={focusHandlers.onFocus}
                        onBlur={focusHandlers.onBlur}
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
                          className={`px-3 py-2 cursor-pointer text-sm transition-colors ${selectedDriver?._id === driver._id ? '' : ''
                            }`}
                          style={{
                            backgroundColor: selectedDriver?._id === driver._id ? `${FLEET_COLORS.primary}15` : undefined
                          }}
                          onMouseEnter={(e) => {
                            if (selectedDriver?._id !== driver._id) {
                              e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}15`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedDriver?._id !== driver._id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div className="font-medium" style={{ color: FLEET_COLORS.primary }}>
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
                className="flex items-center gap-1 p-2 border border-gray-300 rounded-lg bg-white cursor-pointer transition-colors"
                style={{
                  borderColor: truckDropdownOpen ? FLEET_COLORS.primary : undefined,
                  boxShadow: truckDropdownOpen ? `0 0 0 2px ${FLEET_COLORS.focusRing}` : undefined
                }}
              >
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${truckDropdownOpen ? 'rotate-180' : ''}`} />
                <input
                  type="text"
                  value={
                    selectedTruck
                      ? `${selectedTruck.unitNo || selectedTruck.licensePlate || selectedTruck.plateNumber || selectedTruck.internalId || ''} - ${(selectedTruck.makeModel || `${selectedTruck.make || ''} ${selectedTruck.model || ''}`).trim()}`
                      : truckSearch
                  }
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
                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none"

                        onFocus={focusHandlers.onFocus}
                        onBlur={focusHandlers.onBlur}
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
                          className={`px-3 py-2 cursor-pointer text-sm transition-colors ${selectedTruck?._id === truck._id ? '' : ''
                            }`}
                          style={{
                            backgroundColor: selectedTruck?._id === truck._id ? `${FLEET_COLORS.primary}15` : undefined
                          }}
                          onMouseEnter={(e) => {
                            if (selectedTruck?._id !== truck._id) {
                              e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}15`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTruck?._id !== truck._id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div className="font-medium" style={{ color: FLEET_COLORS.primary }}>
                            {truck.unitNo || truck.licensePlate || truck.plateNumber || truck.internalId || 'Unknown'}
                          </div>
                          {(truck.makeModel || truck.make || truck.model) && (
                            <div className="text-xs text-gray-600">
                              {truck.makeModel || `${truck.make || ''} ${truck.model || ''}`}
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
                className="flex items-center gap-1 p-2 border border-gray-300 rounded-lg bg-white cursor-pointer transition-colors"
                style={{
                  borderColor: driverDropdownOpen ? FLEET_COLORS.primary : undefined,
                  boxShadow: driverDropdownOpen ? `0 0 0 2px ${FLEET_COLORS.focusRing}` : undefined
                }}
              >
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${trailerDropdownOpen ? 'rotate-180' : ''}`} />
                <input
                  type="text"
                  value={
                    selectedTrailer
                      ? selectedTrailer.unitNo ||
                      selectedTrailer.licensePlate ||
                      selectedTrailer.plateNumber ||
                      selectedTrailer.trailerNumber ||
                      ''
                      : trailerSearch
                  }
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
                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none"

                        onFocus={focusHandlers.onFocus}
                        onBlur={focusHandlers.onBlur}
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
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm text-gray-600 ${selectedTrailer === null ? 'bg-gray-50' : ''
                        }`}
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
                          className={`px-3 py-2 cursor-pointer text-sm transition-colors ${selectedTrailer?._id === trailer._id ? '' : ''
                            }`}
                          style={{
                            backgroundColor: selectedTrailer?._id === trailer._id ? `${FLEET_COLORS.primary}15` : undefined
                          }}
                          onMouseEnter={(e) => {
                            if (selectedTrailer?._id !== trailer._id) {
                              e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}15`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTrailer?._id !== trailer._id) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div className="font-medium" style={{ color: FLEET_COLORS.primary }}>
                            {trailer.unitNo || trailer.licensePlate || trailer.plateNumber || trailer.trailerNumber || 'Unknown'}
                          </div>
                          {(trailer.makeModel || trailer.trailerType) && (
                            <div className="text-xs text-gray-600">
                              {trailer.makeModel || trailer.trailerType}
                            </div>
                          )}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"

                onFocus={focusHandlers.onFocus}
                onBlur={focusHandlers.onBlur}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"

                onFocus={focusHandlers.onFocus}
                onBlur={focusHandlers.onBlur}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"

              onFocus={focusHandlers.onFocus}
              onBlur={focusHandlers.onBlur}
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
                onClick={() => {
                  const willOpen = !orderDropdownOpen;
                  setOrderDropdownOpen(willOpen);
                  if (willOpen) {
                    // Always clear search when opening dropdown to show all orders
                    setOrderSearch("");
                  }
                }}
                className="flex items-center gap-1 p-2 border border-gray-300 rounded-lg bg-white cursor-pointer transition-colors"
                style={{
                  borderColor: orderDropdownOpen ? FLEET_COLORS.primary : undefined,
                  boxShadow: orderDropdownOpen ? `0 0 0 2px ${FLEET_COLORS.focusRing}` : undefined
                }}
              >
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${orderDropdownOpen ? 'rotate-180' : ''}`} />
                <input
                  type="text"
                  value={selectedOrders.length > 0 && !orderDropdownOpen ? `${selectedOrders.length} order(s) selected` : orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    setOrderDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setOrderDropdownOpen(true);
                    // Clear search when focusing to show all orders
                    if (selectedOrders.length > 0 && !orderSearch) {
                      setOrderSearch("");
                    }
                  }}
                  placeholder={selectedOrders.length > 0 ? `${selectedOrders.length} order(s) selected - click to add more` : "Select orders to assign"}
                  className="flex-1 outline-none text-sm min-w-0"
                  readOnly={selectedOrders.length > 0 && !orderDropdownOpen}
                />
                {selectedOrders.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrders([]);
                      setSelectedOrderDetails([]);
                      setOrderSearch("");
                    }}
                    className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {orderDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg" style={{ maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                  <div className="p-2 border-b border-gray-200 flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search orders..."
                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none"

                        onFocus={focusHandlers.onFocus}
                        onBlur={focusHandlers.onBlur}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1" style={{ maxHeight: '500px', minHeight: '200px' }}>
                    {orders.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No orders available. Please create orders first.</div>
                    ) : filteredOrders.length > 0 ? (
                      <>
                        <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b sticky top-0 z-10 bg-gray-50">
                          Showing {filteredOrders.length} of {orders.length} available orders
                          {orderSearch && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderSearch("");
                              }}
                              className="ml-2 underline transition-colors"
                              style={{ color: FLEET_COLORS.primary }}
                              onMouseEnter={(e) => e.currentTarget.style.color = FLEET_COLORS.dark}
                              onMouseLeave={(e) => e.currentTarget.style.color = FLEET_COLORS.primary}
                            >
                              Clear search
                            </button>
                          )}
                        </div>
                        {filteredOrders.map((order: any, index: number) => {
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
                              key={`order-${order._id}-${index}`}
                              onClick={() => {
                                if (isAssignable) {
                                  toggleOrderSelection(order._id);
                                }
                              }}
                              className={`px-3 py-3 cursor-pointer text-sm border-b border-gray-100 transition-colors ${isSelected ? '' : ''
                                } ${!isAssignable ? 'opacity-50 cursor-not-allowed' : ''}`}
                              style={{
                                backgroundColor: isSelected ? `${FLEET_COLORS.primary}15` : undefined,
                                display: 'block'
                              }}
                              onMouseEnter={(e) => {
                                if (isAssignable && !isSelected) {
                                  e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}15`;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className="w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                                  style={isSelected ? { backgroundColor: FLEET_COLORS.primary, borderColor: FLEET_COLORS.primary } : { borderColor: '#d1d5db' }}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold mb-1" style={{ color: FLEET_COLORS.primary }}>{order.orderNumber || order._id}</div>
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
                                      <div><span className="font-medium">Status:</span> <span
                                        className="px-1.5 py-0.5 rounded text-xs"
                                        style={
                                          order.status?.toLowerCase() === 'planned' ? { backgroundColor: '#fef3c7', color: '#92400e' } :
                                            order.status?.toLowerCase() === 'dispatched' ? { backgroundColor: `${FLEET_COLORS.light}20`, color: FLEET_COLORS.dark } :
                                              order.status?.toLowerCase() === 'in-delivery' ? { backgroundColor: '#fed7aa', color: '#9a3412' } :
                                                order.status?.toLowerCase() === 'completed' ? { backgroundColor: '#d1fae5', color: '#065f46' } :
                                                  order.status?.toLowerCase() === 'quoted' ? { backgroundColor: '#e9d5ff', color: '#6b21a8' } :
                                                    order.status?.toLowerCase() === 'confirmed' ? { backgroundColor: '#ddd6fe', color: '#4c1d95' } :
                                                      { backgroundColor: '#f3f4f6', color: '#1f2937' }
                                        }
                                      >{order.status}</span></div>
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
                        })}
                      </>
                    ) : orders.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No orders available. Please create orders first.</div>
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No orders match your search. Try clearing the search field or check if orders are already assigned to trips.
                      </div>
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
                  {selectedOrders.map((orderId: string) => {
                    // First try to find from selectedOrderDetails (for trip orders), then from orders list
                    let order = selectedOrderDetails.find((o: any) => {
                      const oId = o._id || o;
                      return oId === orderId || String(oId) === String(orderId);
                    });
                    if (!order) {
                      order = orders.find((o: any) => {
                        const oId = o._id || o;
                        return oId === orderId || String(oId) === String(orderId);
                      });
                    }
                    // If still not found, it might be just an ID from the trip
                    if (!order) {
                      return (
                        <div key={orderId} className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold mb-1" style={{ color: FLEET_COLORS.dark }}>Order ID: {orderId}</div>
                              <div className="text-gray-500 text-xs">Loading order details...</div>
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
                    }
                    const customerName = order.customer?.name || order.customer?.firstName || 'N/A';
                    const pickupLocation = extractLocationString(order.pickupLocation);
                    const deliveryLocation = extractLocationString(order.deliveryLocation);
                    return (
                      <div
                        key={orderId}
                        className="p-2 border rounded text-xs"
                        style={{ backgroundColor: `${FLEET_COLORS.primary}15`, borderColor: FLEET_COLORS.light }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold mb-1" style={{ color: FLEET_COLORS.dark }}>{order.orderNumber || order._id}</div>
                            <div className="text-gray-700 space-y-0.5">
                              {order.customerOrderNo && <div>Customer Order: {order.customerOrderNo}</div>}
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
                                <div><span className="font-medium">Status:</span> <span
                                  className="px-1.5 py-0.5 rounded text-xs"
                                  style={
                                    order.status?.toLowerCase() === 'planned' ? { backgroundColor: '#fef3c7', color: '#92400e' } :
                                      order.status?.toLowerCase() === 'dispatched' ? { backgroundColor: `${FLEET_COLORS.light}20`, color: FLEET_COLORS.dark } :
                                        order.status?.toLowerCase() === 'in-delivery' ? { backgroundColor: '#fed7aa', color: '#9a3412' } :
                                          order.status?.toLowerCase() === 'completed' ? { backgroundColor: '#d1fae5', color: '#065f46' } :
                                            { backgroundColor: '#f3f4f6', color: '#1f2937' }
                                  }
                                >{order.status}</span></div>
                              )}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"

              onFocus={focusHandlers.onFocus}
              onBlur={focusHandlers.onBlur}
            />
          </div>

          {/* Documents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Documents               {pendingFiles.length > 0 && !trip?._id && (
                <span style={{ color: FLEET_COLORS.primary }}>({pendingFiles.length} pending)</span>
              )}
            </label>
            <div className="space-y-3">
              {/* Upload Button */}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleDocumentUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,image/*"
                  multiple
                  className="hidden"
                  disabled={uploadingDocument}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDocument || loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: FLEET_COLORS.primary,
                    backgroundColor: `${FLEET_COLORS.primary}15`,
                    border: `1px solid ${FLEET_COLORS.light}`
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadingDocument && !loading) {
                      e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}25`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadingDocument && !loading) {
                      e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}15`;
                    }
                  }}
                >
                  <Upload className="w-4 h-4" />
                  {uploadingDocument ? 'Uploading...' : 'Upload Document(s)'}
                </button>
                <span className="text-xs text-gray-500">
                  PDF, DOC, XLS, TXT, ZIP, Images (Max 20MB each)
                </span>
              </div>

              {/* Pending Files (before trip creation) */}
              {pendingFiles.length > 0 && !trip?._id && (
                <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50 max-h-48 overflow-y-auto">
                  <div className="text-xs font-medium mb-2" style={{ color: FLEET_COLORS.dark }}>
                    Files will be uploaded after trip creation:
                  </div>
                  {pendingFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-3 p-3 bg-white border border-blue-200 rounded-lg"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <File className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: FLEET_COLORS.primary }} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removePendingFile(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Remove File"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Document List */}
              {documents.length > 0 && (
                <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
                  {documents.map((doc) => (
                    <div
                      key={doc._id || doc.fileUrl}
                      className="flex items-start justify-between gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <File className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: FLEET_COLORS.primary }} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {doc.fileName}
                          </div>
                          {doc.description && (
                            <div className="text-xs text-gray-600 mt-1">{doc.description}</div>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>{formatFileSize(doc.fileSize)}</span>
                            {doc.uploadedAt && (
                              <span>
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            )}
                            {doc.uploadedBy?.name && (
                              <span>Uploaded by {doc.uploadedBy.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={async () => {
                            if (!trip?._id || !doc._id) return;
                            try {
                              const response = await getTripDocumentSignedUrl(trip._id, doc._id, 'inline');
                              if (response?.success && response?.url) {
                                window.open(response.url, '_blank');
                              } else {
                                // Fallback to original URL
                                window.open(doc.fileUrl, '_blank');
                              }
                            } catch (error) {
                              console.error('Error getting signed URL:', error);
                              // Fallback to original URL
                              window.open(doc.fileUrl, '_blank');
                            }
                          }}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: FLEET_COLORS.primary }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}15`}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title="View Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc._id || '')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {documents.length === 0 && trip?._id && pendingFiles.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4 border border-gray-200 rounded-lg bg-gray-50">
                  No documents uploaded yet. Click "Upload Document(s)" to add files.
                </div>
              )}

              {!trip?._id && pendingFiles.length === 0 && documents.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4 border border-gray-200 rounded-lg bg-gray-50">
                  You can select files now. They will be uploaded automatically after trip creation.
                </div>
              )}
            </div>
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
          style={primaryButtonStyle}
          className="px-6 py-2 text-sm font-medium !text-white rounded-lg transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

