import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ChevronDown, Search, Download, Check } from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaFileAlt, FaUpload as FaUploadIcon, FaCheck as FaCheckIcon } from "react-icons/fa";
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
  coDriver?: any;
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
    type?: string;
  }>;
  borderCompliance?: {
    required: boolean;
    type?: 'ACE' | 'ACI';
    provider?: 'Descartes' | 'BorderConnect';
    status: 'Not Filed' | 'Pending' | 'Accepted' | 'Rejected';
    lastUpdated?: string;
    papsNumber?: string;
    parsNumber?: string;
    acceptanceTime?: string;
    rejectionReason?: string;
    brokerConfirmation?: boolean;
  };
}

const NewTripSidebar = ({ trip, onClose, onSave }: { trip?: Trip | null; onClose: () => void; onSave: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [validationResults, setValidationResults] = useState<any>(null);

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

  const [selectedCoDriver, setSelectedCoDriver] = useState<any | null>(null);
  const [coDriverSearch, setCoDriverSearch] = useState("");
  const [coDriverDropdownOpen, setCoDriverDropdownOpen] = useState(false);

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
    type?: string;
  }>>(trip?.documents || []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // Files selected before trip creation
  const [_uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null); // Track which document type is uploading
  
  // Individual document file states (for UI display before upload)
  const [bolFile, setBolFile] = useState<File | null>(null);
  const [podFile, setPodFile] = useState<File | null>(null);
  const [stampedManifestFile, setStampedManifestFile] = useState<File | null>(null);

  // Border Compliance State
  const [borderRequired, setBorderRequired] = useState(false);
  const [borderType, setBorderType] = useState<'ACE' | 'ACI' | ''>('');
  const [borderProvider, setBorderProvider] = useState<'Descartes' | 'BorderConnect'>('Descartes');
  const [manifestStatus, setManifestStatus] = useState<'Not Filed' | 'Pending' | 'Accepted' | 'Rejected'>('Not Filed');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [papsNumber, setPapsNumber] = useState('');
  const [parsNumber, setParsNumber] = useState('');
  const [acceptanceTime, setAcceptanceTime] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [brokerConfirmation, setBrokerConfirmation] = useState(false);
  const [isFiling, setIsFiling] = useState(false);

  const normalizeFleetUnit = useCallback(
    (unit: any) => ({
      _id: unit._id,
      unitNo: unit.unitNo,
      internalId: unit.internalId,
      unitType: unit.unitType,
      make: unit.make || '',
      model: unit.model || '',
      makeModel: unit.makeModel || '',
      licensePlate: unit.licensePlate || unit.vinNo || '',
      vinNo: unit.vinNo,
      trailerType: unit.trailerType,
      capacity: unit.capacity,
      source: unit.source,
      status: unit.status,
      operationStatus: unit.operationStatus
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
  const coDriverDropdownRef = useRef<HTMLDivElement>(null);
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
      setValidationResults(null); // Clear old validation results when editing

      // Populate Border Compliance
      if (trip.borderCompliance) {
        setBorderRequired(trip.borderCompliance.required || false);
        setBorderType(trip.borderCompliance.type || '');
        setManifestStatus(trip.borderCompliance.status || 'Not Filed');
        setBorderProvider(trip.borderCompliance.provider || 'Descartes');
        setLastUpdated(trip.borderCompliance.lastUpdated || '');
        setPapsNumber(trip.borderCompliance.papsNumber || '');
        setParsNumber(trip.borderCompliance.parsNumber || '');
        setAcceptanceTime(trip.borderCompliance.acceptanceTime || '');
        setRejectionReason(trip.borderCompliance.rejectionReason || '');
        setBrokerConfirmation(trip.borderCompliance.brokerConfirmation || false);
      } else {
        setBorderRequired(false);
        setBorderType('');
        setManifestStatus('Not Filed');
        setBorderProvider('Descartes');
        setLastUpdated('');
        setPapsNumber('');
        setParsNumber('');
        setAcceptanceTime('');
        setRejectionReason('');
        setBrokerConfirmation(false);
      }

      if (trip.driver) {
        if (typeof trip.driver === 'object') {
          setSelectedDriver(trip.driver);
        } else {
          // Driver is just an ID, will be set when drivers load
        }
      }
      if (trip.coDriver) {
        if (typeof trip.coDriver === 'object') {
          setSelectedCoDriver(trip.coDriver);
        } else {
          // CoDriver is just an ID logic if needed
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
                trailer._id?.toString() === trailerId?.toString() ||
                (trailer.unitNo && trailer.unitNo === trip.trailer.unitNo) ||
                (trailer.licensePlate && trailer.licensePlate === trip.trailer.licensePlate) ||
                (trailer.plateNumber && trailer.plateNumber === trip.trailer.plateNumber) ||
                (trailer.internalId && trailer.internalId === trip.trailer.internalId)
            ) || null;
          // If we found a match, use it; otherwise use the trip.trailer object directly
          if (matchedTrailer) {
            setSelectedTrailer(matchedTrailer);
            setTrailerSearch(matchedTrailer.unitNo || matchedTrailer.licensePlate || matchedTrailer.plateNumber || matchedTrailer.trailerNumber || matchedTrailer.internalId || '');
          } else {
            // Use the trailer object from trip if it's not in the trailers list
            setSelectedTrailer(trip.trailer);
            setTrailerSearch(trip.trailer.unitNo || trip.trailer.licensePlate || trip.trailer.plateNumber || trip.trailer.trailerNumber || trip.trailer.internalId || '');
          }
        } else {
          // trip.trailer is just an ID string
          const matchedTrailer = trailers.find((trailer) => 
            trailer._id === trip.trailer || 
            trailer._id?.toString() === trip.trailer?.toString()
          );
          if (matchedTrailer) {
            setSelectedTrailer(matchedTrailer);
            setTrailerSearch(matchedTrailer.unitNo || matchedTrailer.licensePlate || matchedTrailer.plateNumber || matchedTrailer.trailerNumber || matchedTrailer.internalId || '');
          } else if (trailers.length > 0) {
            // Trailers are loaded but no match found - trailer might have been deleted
            setSelectedTrailer(null);
            setTrailerSearch('');
          }
          // If trailers.length === 0, trailers haven't loaded yet, so don't clear the selection
        }
      } else {
        setSelectedTrailer(null);
        setTrailerSearch('');
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
      if (coDriverDropdownRef.current && target && !coDriverDropdownRef.current.contains(target)) {
        setCoDriverDropdownOpen(false);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate Border Requirements based on selected orders
  useEffect(() => {
    let required = false;
    let type: 'ACE' | 'ACI' | '' = '';

    // Check all selected orders for border requirements
    // We prioritize the first requirement found, or if mixed, we might need a more complex logic.
    // For now, if ANY order needs border, the trip needs border. 
    // If we have CA->US, it's ACE. If US->CA, it's ACI.

    for (const order of selectedOrderDetails) {
      if (order.borderInfo?.detailsRequired) {
        required = true;
        const dir = order.borderInfo.direction;
        if (dir === 'CA_TO_US') type = 'ACE';
        else if (dir === 'US_TO_CA') type = 'ACI';
        break; // Assuming one border crossing type per trip for simplicity
      }
    }

    setBorderRequired(required);
    setBorderType(type);
  }, [selectedOrderDetails]);

  const handleFileManifest = () => {
    setIsFiling(true);
    setManifestStatus('Pending');
    setLastUpdated(new Date().toISOString());

    // Mock API call simulation
    setTimeout(() => {
      setIsFiling(false);
      const success = Math.random() > 0.3; // 70% success rate

      if (success) {
        setManifestStatus('Accepted');
        setAcceptanceTime(new Date().toISOString());
        setBrokerConfirmation(true);
        setRejectionReason('');
        if (borderType === 'ACE') {
          setPapsNumber(`PAPS-${Math.floor(Math.random() * 1000000)}`);
        } else {
          setParsNumber(`PARS-${Math.floor(Math.random() * 1000000)}`);
        }
        addNotification('success', 'Manifest accepted by CBP/CBSA');
      } else {
        setManifestStatus('Rejected');
        setRejectionReason('Invalid Cargo Description: Code mismatch');
        setBrokerConfirmation(false);
        addNotification('error', 'Manifest rejected: Invalid Cargo Description');
      }
      setLastUpdated(new Date().toISOString());
    }, 2000);
  };


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

        // Trucks: strictly where unitType is 'Truck'
        const truckUnits = normalizedUnits.filter((unit) => {
          return (unit.unitType || '').toLowerCase() === 'truck';
        });

        // Trailers: everything else (Trailer, Dry Van, Reefer Trailer, etc.)
        const trailerUnits = normalizedUnits.filter((unit) => {
          return (unit.unitType || '').toLowerCase() !== 'truck';
        });

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

  const filteredDrivers = drivers.filter(driver => {
    // Status filter: Only Active drivers
    if (driver.status && driver.status.toLowerCase() !== 'active') return false;

    return !driverSearch ||
      (driver.name || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
      ((driver.firstName || '') + ' ' + (driver.lastName || '')).toLowerCase().includes(driverSearch.toLowerCase()) ||
      (driver.internalId || '').toLowerCase().includes(driverSearch.toLowerCase());
  });

  // Filter out drivers already selected as main driver from co-driver list
  const filteredCoDrivers = drivers.filter(driver => {
    // Status filter: Only Active drivers
    if (driver.status && driver.status.toLowerCase() !== 'active') return false;

    // Exclude selected main driver
    if (selectedDriver && driver._id === selectedDriver._id) return false;

    return !coDriverSearch ||
      (driver.name || '').toLowerCase().includes(coDriverSearch.toLowerCase()) ||
      ((driver.firstName || '') + ' ' + (driver.lastName || '')).toLowerCase().includes(coDriverSearch.toLowerCase()) ||
      (driver.internalId || '').toLowerCase().includes(coDriverSearch.toLowerCase());
  });

  const filteredTrucks = trucks.filter((truck) => {
    // Status filter: Must be Active AND Available
    if (truck.status && truck.status.toLowerCase() !== 'active') return false;
    if (truck.operationStatus && truck.operationStatus.toLowerCase() !== 'available') return false;

    if (!truckSearch) return true;
    const search = truckSearch.toLowerCase();
    return (
      (truck.unitNo || '').toLowerCase().includes(search) ||
      (truck.licensePlate || truck.plateNumber || '').toLowerCase().includes(search) ||
      (truck.makeModel || `${truck.make || ''} ${truck.model || ''}` || '').toLowerCase().includes(search) ||
      (truck.internalId || '').toLowerCase().includes(search)
    );
  });

  const filteredTrailers = trailers.filter((trailer) => {
    // Status filter: Must be Active AND Available
    if (trailer.status && trailer.status.toLowerCase() !== 'active') return false;
    if (trailer.operationStatus && trailer.operationStatus.toLowerCase() !== 'available') return false;

    if (!trailerSearch) return true;
    const search = trailerSearch.toLowerCase();
    return (
      (trailer.unitNo || '').toLowerCase().includes(search) ||
      (trailer.licensePlate || trailer.plateNumber || trailer.trailerNumber || '').toLowerCase().includes(search) ||
      (trailer.makeModel || trailer.trailerType || '').toLowerCase().includes(search) ||
      (trailer.internalId || '').toLowerCase().includes(search)
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

  const getManifestStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'text-green-600 bg-green-50 border-green-200';
      case 'Rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'Pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };


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

    // Border Compliance Validation
    if (borderRequired && manifestStatus !== 'Accepted') {
      addNotification('error', 'ACI / ACE not accepted. Cannot dispatch this trip.');
      return;
    }

    setLoading(true);
    try {
      const tripData = {
        driver: selectedDriver._id || selectedDriver,
        coDriver: selectedCoDriver ? (selectedCoDriver._id || selectedCoDriver) : null,
        truck: selectedTruck._id || selectedTruck,
        trailer: selectedTrailer ? (selectedTrailer._id || selectedTrailer.id || selectedTrailer) : null,
        orders: selectedOrders,
        plannedStartDate,
        plannedEndDate: plannedEndDate || null,
        status: trip?._id ? status : 'planned', // Always create new trips with 'planned' status
        notes,
        // Add Border Compliance Data - only send if borderRequired is true and borderType is set
        ...(borderRequired && borderType ? {
          borderCompliance: {
            required: true,
            type: borderType,
            provider: borderProvider,
            status: manifestStatus,
            lastUpdated: lastUpdated || undefined,
            papsNumber: papsNumber || undefined,
            parsNumber: parsNumber || undefined,
            acceptanceTime: acceptanceTime || undefined,
            rejectionReason: rejectionReason || undefined,
            brokerConfirmation: brokerConfirmation
          }
        } : {})
      };


      // Collect files to send during trip creation
      const filesToSend: { documents?: File[], loadSecurementPictures?: File[] } = {};
      const documentTypes: string[] = [];
      
      // Add pending files
      if (pendingFiles.length > 0) {
        filesToSend.documents = [...pendingFiles];
        // Default document type for pending files
        pendingFiles.forEach(() => documentTypes.push('other'));
      }
      
      // Add typed document files
      if (bolFile) {
        if (!filesToSend.documents) filesToSend.documents = [];
        filesToSend.documents.push(bolFile);
        documentTypes.push('bol');
      }
      if (podFile) {
        if (!filesToSend.documents) filesToSend.documents = [];
        filesToSend.documents.push(podFile);
        documentTypes.push('pod');
      }
      if (stampedManifestFile) {
        if (!filesToSend.documents) filesToSend.documents = [];
        filesToSend.documents.push(stampedManifestFile);
        documentTypes.push('stamped_manifest');
      }
      
      // Add documentTypes to tripData if we have files (using type assertion since it's only for FormData)
      if (filesToSend.documents && filesToSend.documents.length > 0) {
        (tripData as any).documentTypes = documentTypes;
      }

      let response;
      if (trip?._id) {
        response = await updateTrip(trip._id, tripData);
      } else {
        // Send files during creation if available
        response = await createTrip(tripData, filesToSend.documents || filesToSend.loadSecurementPictures ? filesToSend : undefined);
      }

      console.log('📥 Trip save response:', {
        success: response?.success,
        hasValidation: !!response?.validation,
        validationValid: response?.validation?.valid,
        errorsCount: response?.validation?.errors?.length || 0,
        message: response?.message
      });

      if (response?.success) {
        let message = trip?._id ? 'Trip updated successfully' : 'Trip created successfully';
        
        // Check for validation results
        if (response?.validation) {
          const validation = response.validation;
          setValidationResults(validation); // Store validation results for display
          
          if (validation.errors && validation.errors.length > 0) {
            const errorMessages = validation.errors.map((e: any) => 
              `${e.document || 'Document'}: ${e.message}`
            ).join('; ');
            addNotification('error', `Trip ${trip?._id ? 'updated' : 'created'} but document validation failed: ${errorMessages}`);
            message += ` (${validation.errors.length} document error(s))`;
          } else if (validation.warnings && validation.warnings.length > 0) {
            // Show warnings in toast - show summary
            const warningCount = validation.warnings.length;
            const uniqueDocs = [...new Set(validation.warnings.map((w: any) => w.document || 'Document'))];
            const warningSummary = uniqueDocs.length > 2 
              ? `${uniqueDocs.slice(0, 2).join(', ')} and ${uniqueDocs.length - 2} more document(s)`
              : uniqueDocs.join(', ');
            
            // Show warning notification BEFORE success
            addNotification('warning', `⚠️ ${warningCount} document warning(s): ${warningSummary}. See sidebar for details.`);
            message += ` (${warningCount} warning(s))`;
          }
          if (validation.missing && validation.missing.length > 0) {
            const missingDocs = validation.missing.map((m: any) => m.type).join(', ');
            addNotification('warning', `Missing required documents: ${missingDocs}`);
          }
        } else {
          setValidationResults(null); // Clear validation results if none
        }
        
        // Show success notification (warnings/errors are shown separately above)
        addNotification('success', message);

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

        // If trip was updated, refresh data from response including trailer
        if (trip?._id && response?.data) {
          if (response.data.documents) {
            setDocuments(response.data.documents || []);
          }
          // Update trailer if it's in the response
          if (response.data.trailer) {
            if (typeof response.data.trailer === 'object') {
              const trailerId = response.data.trailer._id || response.data.trailer.id;
              const matchedTrailer = trailers.find(
                (trailer) =>
                  trailer._id === trailerId ||
                  trailer._id?.toString() === trailerId?.toString() ||
                  (trailer.unitNo && trailer.unitNo === response.data.trailer.unitNo) ||
                  (trailer.licensePlate && trailer.licensePlate === response.data.trailer.licensePlate)
              );
              if (matchedTrailer) {
                setSelectedTrailer(matchedTrailer);
                setTrailerSearch(matchedTrailer.unitNo || matchedTrailer.licensePlate || matchedTrailer.plateNumber || matchedTrailer.trailerNumber || matchedTrailer.internalId || '');
              } else {
                // Use the trailer from response if not in trailers list
                setSelectedTrailer(response.data.trailer);
                setTrailerSearch(response.data.trailer.unitNo || response.data.trailer.licensePlate || response.data.trailer.plateNumber || response.data.trailer.trailerNumber || response.data.trailer.internalId || '');
              }
            }
          } else if (response.data.trailer === null) {
            // Trailer was removed
            setSelectedTrailer(null);
            setTrailerSearch('');
          }
        }

        setTimeout(() => {
          onSave();
        }, 500);
      } else {
        console.log('❌ Trip save failed - response:', response);
        console.log('❌ Validation data:', response?.validation);
        
        // Check if it's a validation error
        if (response?.validation && !response.validation.valid) {
          setValidationResults(response.validation);
          
          // Show detailed validation errors in toast
          if (response.validation.errors && response.validation.errors.length > 0) {
            const errorCount = response.validation.errors.length;
            
            // Show each error clearly - show immediately for first error
            response.validation.errors.forEach((err: any, index: number) => {
              const docName = err.document || 'Document';
              const docType = err.type || 'document';
              const mainIssue = err.issues && err.issues.length > 0 
                ? err.issues[0] 
                : err.message;
              
              // Show each error in a separate notification for clarity
              if (index === 0) {
                // First error shows immediately
                addNotification('error', `❌ ${docName} (${docType}): ${mainIssue}`);
              } else {
                // Subsequent errors show with delay
                setTimeout(() => {
                  addNotification('error', `❌ ${docName} (${docType}): ${mainIssue}`);
                }, index * 400);
              }
            });
            
            // Show summary notification after all individual errors
            setTimeout(() => {
              addNotification('error', `⚠️ Trip creation blocked: ${errorCount} document validation error(s). Please upload correct documents and try again.`);
            }, response.validation.errors.length * 400 + 300);
          } else {
            // Fallback if no specific errors
            addNotification('error', response?.message || response?.details || "Document validation failed");
          }
        } else {
          // Non-validation error - show message or details
          const errorMsg = response?.message || response?.details || 'Failed to save trip';
          console.log('❌ Non-validation error:', errorMsg);
          addNotification('error', errorMsg);
        }
      }
    } catch (error: any) {
      console.error("Error saving trip:", error);
      console.log('❌ Error object:', {
        hasResponse: !!error?.response,
        hasData: !!error?.response?.data,
        hasValidation: !!error?.response?.data?.validation,
        message: error?.response?.data?.message,
        details: error?.response?.data?.details
      });
      
      // Check if error response contains validation data
      if (error?.response?.data?.validation && !error.response.data.validation.valid) {
        const validation = error.response.data.validation;
        setValidationResults(validation);
        
        if (validation.errors && validation.errors.length > 0) {
          const errorCount = validation.errors.length;
          
          // Show each error clearly
          validation.errors.forEach((err: any, index: number) => {
            const docName = err.document || 'Document';
            const docType = err.type || 'document';
            const mainIssue = err.issues && err.issues.length > 0 
              ? err.issues[0] 
              : err.message;
            
            // Show each error in a separate notification for clarity
            if (index === 0) {
              // First error shows immediately
              addNotification('error', `❌ ${docName} (${docType}): ${mainIssue}`);
            } else {
              // Subsequent errors show with delay
              setTimeout(() => {
                addNotification('error', `❌ ${docName} (${docType}): ${mainIssue}`);
              }, index * 400);
            }
          });
          
          // Show summary notification after all individual errors
          setTimeout(() => {
            addNotification('error', `⚠️ Trip creation blocked: ${errorCount} document validation error(s). Please upload correct documents and try again.`);
          }, validation.errors.length * 400 + 300);
        } else {
          addNotification('error', error?.response?.data?.message || error?.response?.data?.details || 'An error occurred while saving the trip');
        }
      } else {
        // Non-validation error
        const errorMsg = error?.response?.data?.message || error?.response?.data?.details || error?.message || 'An error occurred while saving the trip';
        addNotification('error', errorMsg);
      }
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

  // Handler for specific document type uploads
  const handleDocumentTypeUpload = async (file: File, documentType: 'bol' | 'pod' | 'stamped_manifest') => {
    if (!trip?._id) {
      // Trip doesn't exist yet - store file for later upload
      if (documentType === 'bol') setBolFile(file);
      else if (documentType === 'pod') setPodFile(file);
      else if (documentType === 'stamped_manifest') setStampedManifestFile(file);
      addNotification('success', 'File selected. It will be uploaded after trip creation.');
      return;
    }

    const tripId = trip._id;
    setUploadingDocType(documentType);
    try {
      const response = await uploadTripDocument(tripId, file, '', documentType);
      if (response?.success && response?.data) {
        setDocuments(prev => [...prev, response.data]);
        
        // Check for validation results
        if (response?.validation) {
          const validation = response.validation;
          setValidationResults(validation); // Store validation results for display
          
          if (validation.errors && validation.errors.length > 0) {
            const errorMessages = validation.errors.map((e: any) => 
              `${e.document || 'Document'}: ${e.message}`
            ).join('; ');
            addNotification('error', `Document uploaded but validation failed: ${errorMessages}`);
          } else if (validation.warnings && validation.warnings.length > 0) {
            const warningMessages = validation.warnings.map((w: any) => 
              `${w.document || 'Document'}: ${w.message}`
            ).join('; ');
            addNotification('warning', `Document uploaded with warnings: ${warningMessages}`);
          } else {
            addNotification('success', 'Document uploaded and validated successfully');
          }
        } else {
          addNotification('success', 'Document uploaded successfully');
        }
        
        // Clear file state
        if (documentType === 'bol') setBolFile(null);
        else if (documentType === 'pod') setPodFile(null);
        else if (documentType === 'stamped_manifest') setStampedManifestFile(null);
      } else {
        // Check if it's a validation error
        if (response?.validation && !response.validation.valid) {
          const errorMessages = response.validation.errors?.map((e: any) => 
            `${e.document || 'Document'}: ${e.message}`
          ).join('; ') || response?.message || "Document validation failed";
          addNotification('error', errorMessages);
          setValidationResults(response.validation);
        } else {
          addNotification('error', response?.message || 'Failed to upload document');
        }
      }
    } catch (error: any) {
      console.error("Error uploading document:", error);
      addNotification('error', error?.response?.data?.message || 'An error occurred while uploading the document');
    } finally {
      setUploadingDocType(null);
    }
  };



  // Upload pending files after trip creation
  const uploadPendingFiles = async (tripId: string) => {
    const filesToUpload: Array<{ file: File; type?: string }> = [];
    
    // Add generic pending files
    pendingFiles.forEach(file => filesToUpload.push({ file }));
    
    // Add document type files
    if (bolFile) filesToUpload.push({ file: bolFile, type: 'bol' });
    if (podFile) filesToUpload.push({ file: podFile, type: 'pod' });
    if (stampedManifestFile) filesToUpload.push({ file: stampedManifestFile, type: 'stamped_manifest' });
    
    if (filesToUpload.length === 0) return;

    setUploadingDocument(true);
    try {
      const uploadPromises = filesToUpload.map(({ file, type }) => 
        uploadTripDocument(tripId, file, '', type)
      );
      const results = await Promise.allSettled(uploadPromises);

      let successCount = 0;
      let failCount = 0;

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const response = result.value;
          if (response?.success && response?.data) {
            setDocuments(prev => [...prev, response.data]);
            
            // Check for validation results
            if (response?.validation) {
              const validation = response.validation;
              setValidationResults(validation); // Store latest validation results
              
              if (validation.errors && validation.errors.length > 0) {
                const errorMessages = validation.errors.map((e: any) => 
                  `${e.document || 'Document'}: ${e.message}`
                ).join('; ');
                addNotification('error', `Document validation failed: ${errorMessages}`);
              } else if (validation.warnings && validation.warnings.length > 0) {
                const warningMessages = validation.warnings.map((w: any) => 
                  `${w.document || 'Document'}: ${w.message}`
                ).join('; ');
                addNotification('warning', `Document validation warnings: ${warningMessages}`);
              }
            }
            
            successCount++;
          } else {
            failCount++;
            // Check if it's a validation error
            if (response?.validation && !response.validation.valid) {
              setValidationResults(response.validation);
            }
          }
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
      setBolFile(null);
      setPodFile(null);
      setStampedManifestFile(null);
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

  // Helper to check if a document type exists
  const hasDocumentType = (type: string) => {
    return documents.some(doc => doc.type === type);
  };


  // Helper to remove document file
  const removeDocumentFile = (type: 'bol' | 'pod' | 'stamped_manifest') => {
    if (type === 'bol') setBolFile(null);
    else if (type === 'pod') setPodFile(null);
    else if (type === 'stamped_manifest') setStampedManifestFile(null);
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

          {/* Driver Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className={`px-3 py-2 cursor-pointer text-sm transition-colors border-b border-gray-50 last:border-0 ${selectedDriver?._id === driver._id ? '' : ''
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
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="font-medium" style={{ color: FLEET_COLORS.dark }}>
                                  {driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Unnamed Driver'}
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  ID: {driver.internalId || driver.empId || 'N/A'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">
                                  {driver.phone || 'No Phone'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">No active drivers found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative" ref={coDriverDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Co-Driver (Optional)
              </label>
              <div className="relative">
                <div
                  onClick={() => setCoDriverDropdownOpen(!coDriverDropdownOpen)}
                  className="flex items-center gap-1 p-2 border border-gray-300 rounded-lg bg-white cursor-pointer transition-colors"
                  style={{
                    borderColor: coDriverDropdownOpen ? FLEET_COLORS.primary : undefined,
                    boxShadow: coDriverDropdownOpen ? `0 0 0 2px ${FLEET_COLORS.focusRing}` : undefined
                  }}
                >
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${coDriverDropdownOpen ? 'rotate-180' : ''}`} />
                  <input
                    type="text"
                    value={selectedCoDriver ? (selectedCoDriver.name || `${selectedCoDriver.firstName || ''} ${selectedCoDriver.lastName || ''}`.trim()) : coDriverSearch}
                    onChange={(e) => {
                      setCoDriverSearch(e.target.value);
                      setCoDriverDropdownOpen(true);
                    }}
                    onFocus={() => setCoDriverDropdownOpen(true)}
                    placeholder="Select co-driver"
                    className="flex-1 outline-none text-sm min-w-0"
                    readOnly={!!selectedCoDriver}
                  />
                  {selectedCoDriver && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCoDriver(null);
                        setCoDriverSearch("");
                      }}
                      className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                {coDriverDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={coDriverSearch}
                          onChange={(e) => setCoDriverSearch(e.target.value)}
                          placeholder="Search drivers..."
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
                          setSelectedCoDriver(null);
                          setCoDriverSearch("");
                          setCoDriverDropdownOpen(false);
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm text-gray-600 ${selectedCoDriver === null ? 'bg-gray-50' : ''
                          }`}
                      >
                        No Co-Driver
                      </div>
                      {filteredCoDrivers.length > 0 ? (
                        filteredCoDrivers.map((driver) => (
                          <div
                            key={driver._id}
                            onClick={() => {
                              setSelectedCoDriver(driver);
                              setCoDriverSearch("");
                              setCoDriverDropdownOpen(false);
                            }}
                            className={`px-3 py-2 cursor-pointer text-sm transition-colors border-b border-gray-50 last:border-0 ${selectedCoDriver?._id === driver._id ? '' : ''
                              }`}
                            style={{
                              backgroundColor: selectedCoDriver?._id === driver._id ? `${FLEET_COLORS.primary}15` : undefined
                            }}
                            onMouseEnter={(e) => {
                              if (selectedCoDriver?._id !== driver._id) {
                                e.currentTarget.style.backgroundColor = `${FLEET_COLORS.primary}15`;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedCoDriver?._id !== driver._id) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="font-medium" style={{ color: FLEET_COLORS.dark }}>
                                  {driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Unnamed Driver'}
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  ID: {driver.internalId || driver.empId || 'N/A'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">
                                  {driver.phone || 'No Phone'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">No available drivers found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
                          className={`px-3 py-2 cursor-pointer text-sm transition-colors border-b border-gray-50 last:border-0 ${selectedTruck?._id === truck._id ? '' : ''
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
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="font-medium" style={{ color: FLEET_COLORS.dark }}>
                                {truck.unitNo || truck.licensePlate || 'Unknown Unit'}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                ID: {truck.internalId || 'N/A'} • {truck.licensePlate || 'No Plate'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-medium text-gray-700">
                                {truck.makeModel || `${truck.make || ''} ${truck.model || ''}`.trim() || 'No Model'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No available trucks found</div>
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
                  borderColor: trailerDropdownOpen ? FLEET_COLORS.primary : undefined,
                  boxShadow: trailerDropdownOpen ? `0 0 0 2px ${FLEET_COLORS.focusRing}` : undefined
                }}
              >
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${trailerDropdownOpen ? 'rotate-180' : ''}`} />
                <input
                  type="text"
                  value={
                    selectedTrailer
                      ? `${selectedTrailer.unitNo || selectedTrailer.licensePlate || selectedTrailer.plateNumber || selectedTrailer.trailerNumber || selectedTrailer.internalId || ''}${selectedTrailer.trailerType ? ` - ${selectedTrailer.trailerType}` : ''}`
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
                          className={`px-3 py-2 cursor-pointer text-sm transition-colors border-b border-gray-50 last:border-0 ${selectedTrailer?._id === trailer._id ? '' : ''
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
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="font-medium" style={{ color: FLEET_COLORS.dark }}>
                                {trailer.unitNo || trailer.licensePlate || 'Unknown Trailer'}
                              </div>
                              <div className="text-xs text-gray-600 mt-0.5">
                                ID: {trailer.internalId || 'N/A'} • {trailer.trailerType || 'Unknown Type'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-medium text-gray-700">
                                {trailer.capacity ? `${trailer.capacity}` : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No available trailers found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Border Compliance (CORE SECTION) */}
          {borderRequired && (
            <div className="border-2 border-orange-200 rounded-lg overflow-hidden mt-6 mb-6">
              <div className="bg-orange-50 px-4 py-3 border-b border-orange-200 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  Border Compliance
                  <span className="bg-orange-200 text-orange-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Required: {borderType}
                  </span>
                </h3>
                <div className={`px-2 py-1 rounded text-xs font-bold border ${getManifestStatusColor(manifestStatus)}`}>
                  {manifestStatus.toUpperCase()}
                </div>
              </div>

              <div className="p-4 space-y-6 bg-white">
                {/* A. Filing Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Provider</label>
                    <div className="text-sm font-medium text-gray-800">{borderProvider}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Last Updated</label>
                    <div className="text-sm text-gray-600">{lastUpdated ? new Date(lastUpdated).toLocaleString() : '-'}</div>
                  </div>
                  <div className="col-span-2">
                    {/* B. Filing Action */}
                    {manifestStatus === 'Not Filed' && (
                      <button
                        onClick={handleFileManifest}
                        disabled={isFiling}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isFiling ? 'Filing...' : `File ${borderType} Manifest`}
                      </button>
                    )}
                    {manifestStatus === 'Rejected' && (
                      <button
                        onClick={handleFileManifest}
                        disabled={isFiling}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isFiling ? 'Re-Submitting...' : 'Re-Submit Manifest'}
                      </button>
                    )}
                    {manifestStatus === 'Pending' && (
                      <div className="w-full py-2 bg-yellow-100 text-yellow-800 rounded text-sm font-medium text-center border border-yellow-200">
                        Transmitting to CBP/CBSA...
                      </div>
                    )}
                    {manifestStatus === 'Accepted' && (
                      <div className="w-full py-2 bg-green-100 text-green-800 rounded text-sm font-medium text-center border border-green-200 flex items-center justify-center gap-2">
                        <FaCheckCircle className="w-4 h-4" /> Manifest Active
                      </div>
                    )}
                  </div>
                </div>

                {/* C. Returned From Provider */}
                <div className="bg-gray-50 rounded p-3 border border-gray-200">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Bureau Response</label>

                  {manifestStatus === 'Accepted' && (
                    <div className="grid grid-cols-2 gap-4">
                      {borderType === 'ACE' && (
                        <div>
                          <label className="block text-[10px] font-medium text-gray-500 uppercase">PAPS Number</label>
                          <div className="text-sm font-mono font-bold text-gray-800">{papsNumber}</div>
                        </div>
                      )}
                      {borderType === 'ACI' && (
                        <div>
                          <label className="block text-[10px] font-medium text-gray-500 uppercase">PARS / CCN</label>
                          <div className="text-sm font-mono font-bold text-gray-800">{parsNumber}</div>
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 uppercase">Acceptance Time</label>
                        <div className="text-sm text-gray-800">{new Date(acceptanceTime).toLocaleString()}</div>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-green-700 text-sm">
                        <FaCheckCircle className="w-4 h-4" /> Broker Confirmed Entry
                      </div>
                    </div>
                  )}

                  {manifestStatus === 'Rejected' && (
                    <div className="bg-red-50 p-2 rounded border border-red-100">
                      <label className="block text-[10px] font-medium text-red-500 uppercase">Rejection Reason</label>
                      <div className="text-sm text-red-700 font-medium mt-1">{rejectionReason}</div>
                    </div>
                  )}

                  {(manifestStatus === 'Not Filed' || manifestStatus === 'Pending') && (
                    <div className="text-xs text-gray-400 italic">
                      Waiting for filing submission...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Documents
            </label>
            <div className="space-y-4">
              {/* Upload BOL */}
              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${hasDocumentType('bol') || bolFile ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <FaFileAlt className={`${hasDocumentType('bol') || bolFile ? 'text-green-600' : 'text-blue-600'}`} size={24} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Bill of Lading (BOL)</h5>
                      <p className="text-sm text-gray-500">Required document for shipment</p>
                    </div>
                  </div>
                  {hasDocumentType('bol') || bolFile ? (
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <FaCheckIcon /> Uploaded
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm font-medium">Optional</span>
                  )}
                </div>
                <label className="block">
                  <div className={`flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors ${(uploadingDocType === 'bol' || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <FaUploadIcon className="text-blue-600" />
                    <span className="text-blue-600 font-medium">{uploadingDocType === 'bol' ? 'Uploading...' : 'Choose File'}</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentTypeUpload(e.target.files[0], 'bol');
                      }
                    }}
                    disabled={uploadingDocType === 'bol' || loading}
                  />
                </label>
                {bolFile && !hasDocumentType('bol') && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaFileAlt className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">{bolFile.name}</span>
                    </div>
                    <button
                      onClick={() => removeDocumentFile('bol')}
                      className="text-gray-800 hover:text-gray-900 transition-colors"
                      disabled={uploadingDocType === 'bol'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {hasDocumentType('bol') && !bolFile && trip?._id && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaFileAlt className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">
                        {documents.find(d => d.type === 'bol')?.fileName || 'Document'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const bolDoc = documents.find(d => d.type === 'bol');
                        if (bolDoc?._id) handleDeleteDocument(bolDoc._id);
                      }}
                      className="text-gray-800 hover:text-gray-900 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload POD */}
              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${hasDocumentType('pod') || podFile ? 'bg-green-100' : 'bg-purple-100'}`}>
                      <FaFileAlt className={`${hasDocumentType('pod') || podFile ? 'text-green-600' : 'text-purple-600'}`} size={24} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Proof of Delivery (POD)</h5>
                      <p className="text-sm text-gray-500">Delivery confirmation document</p>
                    </div>
                  </div>
                  {hasDocumentType('pod') || podFile ? (
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <FaCheckIcon /> Uploaded
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm font-medium">Optional</span>
                  )}
                </div>
                <label className="block">
                  <div className={`flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg cursor-pointer transition-colors ${(uploadingDocType === 'pod' || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <FaUploadIcon className="text-purple-600" />
                    <span className="text-purple-600 font-medium">{uploadingDocType === 'pod' ? 'Uploading...' : 'Choose File'}</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentTypeUpload(e.target.files[0], 'pod');
                      }
                    }}
                    disabled={uploadingDocType === 'pod' || loading}
                  />
                </label>
                {podFile && !hasDocumentType('pod') && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaFileAlt className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">{podFile.name}</span>
                    </div>
                    <button
                      onClick={() => removeDocumentFile('pod')}
                      className="text-gray-800 hover:text-gray-900 transition-colors"
                      disabled={uploadingDocType === 'pod'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {hasDocumentType('pod') && !podFile && trip?._id && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaFileAlt className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">
                        {documents.find(d => d.type === 'pod')?.fileName || 'Document'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const podDoc = documents.find(d => d.type === 'pod');
                        if (podDoc?._id) handleDeleteDocument(podDoc._id);
                      }}
                      className="text-gray-800 hover:text-gray-900 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Stamped Manifest */}
              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${hasDocumentType('stamped_manifest') || stampedManifestFile ? 'bg-green-100' : 'bg-green-100'}`}>
                      <FaFileAlt className={`${hasDocumentType('stamped_manifest') || stampedManifestFile ? 'text-green-600' : 'text-green-600'}`} size={24} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-800">Stamped Manifest</h5>
                      <p className="text-sm text-gray-500">Stamped manifest document</p>
                    </div>
                  </div>
                  {hasDocumentType('stamped_manifest') || stampedManifestFile ? (
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <FaCheckIcon /> Uploaded
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm font-medium">Optional</span>
                  )}
                </div>
                <label className="block">
                  <div className={`flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg cursor-pointer transition-colors ${(uploadingDocType === 'stamped_manifest' || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <FaUploadIcon className="text-green-600" />
                    <span className="text-green-600 font-medium">{uploadingDocType === 'stamped_manifest' ? 'Uploading...' : 'Choose File'}</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocumentTypeUpload(e.target.files[0], 'stamped_manifest');
                      }
                    }}
                    disabled={uploadingDocType === 'stamped_manifest' || loading}
                  />
                </label>
                {stampedManifestFile && !hasDocumentType('stamped_manifest') && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaFileAlt className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">{stampedManifestFile.name}</span>
                    </div>
                    <button
                      onClick={() => removeDocumentFile('stamped_manifest')}
                      className="text-gray-800 hover:text-gray-900 transition-colors"
                      disabled={uploadingDocType === 'stamped_manifest'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {hasDocumentType('stamped_manifest') && !stampedManifestFile && trip?._id && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaFileAlt className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">
                        {documents.find(d => d.type === 'stamped_manifest')?.fileName || 'Document'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const manifestDoc = documents.find(d => d.type === 'stamped_manifest');
                        if (manifestDoc?._id) handleDeleteDocument(manifestDoc._id);
                      }}
                      className="text-gray-800 hover:text-gray-900 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
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

      {/* Validation Results Display */}
      {validationResults && (
        <div className="px-6 pb-4">
          <ValidationDisplay validationResults={validationResults} />
          {/* Clear validation results button */}
          <button
            onClick={() => setValidationResults(null)}
            className="mt-3 text-sm text-gray-600 hover:text-gray-800 underline flex items-center gap-1"
          >
            <span>Dismiss validation results</span>
          </button>
        </div>
      )}

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

// Validation Display Component
const ValidationDisplay = ({ validationResults }: { validationResults: any }) => {
  if (!validationResults) return null;

  const { valid, errors, warnings, missing, documentDetails } = validationResults;

  const hasIssues = errors?.length > 0 || warnings?.length > 0 || missing?.length > 0;

  if (!hasIssues) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-3">
        <FaCheckCircle size={20} />
        <p className="font-medium">All documents validated successfully!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <FaExclamationCircle className={valid ? "text-yellow-500" : "text-red-500"} />
        Document Validation Summary
      </h3>

      {!valid && errors?.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
          <p className="font-medium mb-2">Critical Errors Found:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((err: any, i: number) => (
              <li key={`err-${i}`}>
                <strong>{err.document || err.type || 'Document'}:</strong> {err.message}
                {err.issues && err.issues.length > 0 && (
                  <ul className="list-disc list-inside ml-4 text-sm text-red-700">
                    {err.issues.map((issue: string, j: number) => (
                      <li key={`err-issue-${i}-${j}`}>{issue}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg">
          <p className="font-medium mb-2">Warnings:</p>
          <ul className="list-disc list-inside space-y-1">
            {warnings.map((warn: any, i: number) => (
              <li key={`warn-${i}`}>
                <strong>{warn.document || warn.type || 'Document'}:</strong> {warn.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {missing?.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
          <p className="font-medium mb-2">Missing Required Documents:</p>
          <ul className="list-disc list-inside space-y-1">
            {missing.map((m: any, i: number) => (
              <li key={`missing-${i}`}>
                <strong>{m.type}:</strong> {m.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {documentDetails?.length > 0 && (
        <div className="space-y-3">
          <p className="font-medium text-gray-700">Document Details:</p>
          {documentDetails.map((doc: any, i: number) => (
            <div key={`doc-detail-${i}`} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center gap-2 mb-1">
                {doc.status === 'valid' && <FaCheckCircle className="text-green-500" size={16} />}
                {doc.status === 'error' && <FaExclamationCircle className="text-red-500" size={16} />}
                {doc.status === 'warning' && <FaExclamationCircle className="text-yellow-500" size={16} />}
                <p className="font-semibold text-gray-800">{doc.document} ({doc.type})</p>
                {doc.actualType && doc.actualType !== doc.type && (
                  <span className="text-xs text-red-600 font-medium">(Detected as: {doc.actualType})</span>
                )}
              </div>
              {doc.status !== 'valid' && doc.issues && doc.issues.length > 0 && (
                <ul className="list-disc list-inside ml-4 text-sm text-gray-600">
                  {doc.issues.map((issue: string, j: number) => (
                    <li key={`doc-issue-${i}-${j}`}>{issue}</li>
                  ))}
                </ul>
              )}
              {doc.expirationDate && (
                <p className="text-sm text-gray-600 mt-1">Expires: {new Date(doc.expirationDate).toLocaleDateString()}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewTripSidebar;

